import pytest
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.job import Job, JobStatus
from app.models.screening import ScreeningResult, ScreeningStatus
from app.models.candidate import Candidate
from app.models.application import Application
from app.llm.base import BaseLLMProvider
from app.llm.gateway import LLMGateway
from app.llm.exceptions import LLMTransientError
from app.services.screening import ScreeningService

@pytest.fixture
async def authenticated_headers(async_client: AsyncClient, db_session) -> dict:
    """Helper fixture to register a default HR user and return JWT bearer headers."""
    from app.core.security import get_password_hash
    from app.models.user import User
    
    user = User(
        email="recruiter@company.com",
        hashed_password=get_password_hash("securepwd"),
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    
    login_payload = {"email": "recruiter@company.com", "password": "securepwd"}
    res = await async_client.post("/api/v1/auth/login", json=login_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

async def test_job_workflow_and_lifecycle(async_client: AsyncClient, authenticated_headers: dict, db_session):
    """Test job lifecycle from draft creation to AI generation, approval, and publishing."""
    
    # 1. Create a draft job posting
    job_payload = {
        "title": "Python Developer",
        "company_name": "Antigravity Inc",
        "company_details": "Building AI coders.",
        "raw_jd": "Looking for a coder who knows Python."
    }
    create_res = await async_client.post("/api/v1/jobs", json=job_payload, headers=authenticated_headers)
    assert create_res.status_code == 201
    job_data = create_res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "draft"
    
    # 2. Trigger JD Rewrite polishing via Mock LLM
    gen_res = await async_client.post(f"/api/v1/jobs/{job_id}/generate-jd", headers=authenticated_headers)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["status"] == "jd_generated"
    assert "Join us as a Developer" in gen_data["polished_jd"]

    # 3. Approve JD
    approve_res = await async_client.post(f"/api/v1/jobs/{job_id}/approve", headers=authenticated_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 4. Publish Job
    publish_res = await async_client.post(f"/api/v1/jobs/{job_id}/publish", headers=authenticated_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "published"

    # Verify state in database
    result = await db_session.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    assert job.status == JobStatus.PUBLISHED


async def test_public_job_filtering(async_client: AsyncClient, authenticated_headers: dict, db_session):
    """Verify that public listings only show published jobs, and details work."""
    
    # Create two jobs: one published and one drafted
    published_job = Job(
        title="Published Position",
        company_name="Antigravity",
        raw_jd="JD content",
        status=JobStatus.PUBLISHED
    )
    draft_job = Job(
        title="Draft Position",
        company_name="Antigravity",
        raw_jd="JD content",
        status=JobStatus.DRAFT
    )
    db_session.add_all([published_job, draft_job])
    await db_session.commit()

    # Query public listings endpoint
    public_res = await async_client.get("/api/v1/public/jobs")
    assert public_res.status_code == 200
    public_jobs = public_res.json()
    
    # Assert only published job is returned
    assert len(public_jobs) == 1
    assert public_jobs[0]["title"] == "Published Position"

    # Get details of published job
    details_res = await async_client.get(f"/api/v1/public/jobs/{published_job.id}")
    assert details_res.status_code == 200
    assert details_res.json()["title"] == "Published Position"

    # Getting details of draft job must fail with 404
    draft_details_res = await async_client.get(f"/api/v1/public/jobs/{draft_job.id}")
    assert draft_details_res.status_code == 404


async def test_candidate_apply_and_consent_logic(async_client: AsyncClient, db_session):
    """Test candidate application success, and verification that consent is strictly required."""
    
    # Seed a published job
    job = Job(
        title="Frontend Architect",
        company_name="Antigravity",
        raw_jd="JD text",
        status=JobStatus.PUBLISHED
    )
    db_session.add(job)
    await db_session.commit()

    # Case A: Apply with consent = False (must fail with 400 Bad Request)
    form_data = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-1234",
        "consent_given": "false"
    }
    file_payload = {"resume": ("resume.pdf", b"%PDF-1.4 header bytes", "application/pdf")}
    
    fail_res = await async_client.post(f"/api/v1/apply/{job.id}", data=form_data, files=file_payload)
    assert fail_res.status_code == 400
    assert "consent is required" in fail_res.json()["detail"]

    # Case B: Apply with consent = True (must succeed and trigger synchronous screening)
    form_data["consent_given"] = "true"
    success_res = await async_client.post(f"/api/v1/apply/{job.id}", data=form_data, files=file_payload)
    assert success_res.status_code == 201
    app_data = success_res.json()
    assert app_data["candidate_id"] is not None
    result = await db_session.execute(select(Candidate).where(Candidate.id == app_data["candidate_id"]))
    candidate = result.scalars().first()
    assert candidate.email == "jane@example.com"
    
    # Check that database records and screening results were created successfully
    result = await db_session.execute(select(ScreeningResult).where(ScreeningResult.application_id == app_data["id"]))
    screening = result.scalars().first()
    assert screening is not None
    assert screening.status == ScreeningStatus.COMPLETED
    assert screening.overall_score == 84


async def test_duplicate_application_rejection(async_client: AsyncClient, db_session):
    """Verify that applying multiple times using the same email for the same vacancy returns HTTP 409."""
    
    # Seed a published job
    job = Job(
        title="AI Engineer",
        company_name="Antigravity",
        raw_jd="Coding JD",
        status=JobStatus.PUBLISHED
    )
    db_session.add(job)
    await db_session.commit()

    form_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-5678",
        "consent_given": "true"
    }
    file_payload = {"resume": ("resume.pdf", b"%PDF-1.4 header bytes", "application/pdf")}

    # First application submission (Success)
    res1 = await async_client.post(f"/api/v1/apply/{job.id}", data=form_data, files=file_payload)
    assert res1.status_code == 201

    # Second application submission with matching email & job_id (Must return 409 Conflict)
    res2 = await async_client.post(f"/api/v1/apply/{job.id}", data=form_data, files=file_payload)
    assert res2.status_code == 409
    assert "already applied" in res2.json()["detail"]


async def test_magic_bytes_validation_rejection(async_client: AsyncClient, db_session):
    """Verify that fake files (e.g. executable/text disguised as pdf) are rejected by S3 validation."""
    
    job = Job(
        title="Full Stack Engineer",
        company_name="Antigravity",
        raw_jd="JD description",
        status=JobStatus.PUBLISHED
    )
    db_session.add(job)
    await db_session.commit()

    form_data = {
        "name": "Hacker Bob",
        "email": "bob@example.com",
        "phone": "555-9000",
        "consent_given": "true"
    }
    # Upload fake pdf file starting with invalid text bytes instead of %PDF
    fake_file_payload = {"resume": ("resume.pdf", b"MZ\x90\x00\x03fake-exe-header", "application/pdf")}

    res = await async_client.post(f"/api/v1/apply/{job.id}", data=form_data, files=fake_file_payload)
    assert res.status_code == 400
    assert "Only authentic PDF or DOCX" in res.json()["detail"]


def test_score_redistribution_math():
    """Verify that weight normalization math correctly adjusts scores when elements are missing."""
    service = ScreeningService(db=None)
    
    # 1. Base case: All components present
    screening_all = ScreeningResult(
        application_id=1,
        overall_score=80,             # CV weight: 70%
        github_consistency_score=90,  # GitHub weight: 15%
        linkedin_manual_score=70      # LinkedIn weight: 15%
    )
    res_all = service.calculate_combined_score(screening_all)
    # Expected: 80*0.70 + 90*0.15 + 70*0.15 = 56.0 + 13.5 + 10.5 = 80.0
    assert res_all["combined_score"] == 80.0
    
    # 2. Redistribution case: GitHub score is missing
    screening_no_github = ScreeningResult(
        application_id=1,
        overall_score=80,
        github_consistency_score=None,
        linkedin_manual_score=70
    )
    res_no_github = service.calculate_combined_score(screening_no_github)
    # Active weights: CV (0.70) and LinkedIn (0.15). Total active = 0.85
    # Normalized weights: CV (0.70 / 0.85 = 0.8235), LinkedIn (0.15 / 0.85 = 0.1765)
    # Contributions: CV = 80 * 0.8235 = 65.88, LinkedIn = 70 * 0.1765 = 12.36
    # Combined score = 65.88 + 12.35 = 78.23
    assert res_no_github["combined_score"] == 78.23
    assert "github" in res_no_github["missing_components"]
    
    # 3. Only CV present
    screening_only_cv = ScreeningResult(
        application_id=1,
        overall_score=80,
        github_consistency_score=None,
        linkedin_manual_score=None
    )
    res_only_cv = service.calculate_combined_score(screening_only_cv)
    # Total active weight = 0.70. Normalized CV weight = 1.0
    # Combined score = 80 * 1.0 = 80.00
    assert res_only_cv["combined_score"] == 80.0


async def test_llm_gateway_fallback_mechanism():
    """Verify that LLM gateway failover successfully catches transient exceptions and routes to fallback."""
    
    class FailedPrimary(BaseLLMProvider):
        async def generate_text(self, prompt: str, system_instruction: str = None) -> str:
            raise LLMTransientError("Mock primary provider temporary connection failure")
            
    class SuccessfulFallback(BaseLLMProvider):
        async def generate_text(self, prompt: str, system_instruction: str = None) -> str:
            return "Fallback dynamic response"
            
    gateway = LLMGateway(
        primary=FailedPrimary(),
        fallback=SuccessfulFallback(),
        enable_fallback=True
    )
    
    res = await gateway.generate_text("Please process this prompt.")
    assert res == "Fallback dynamic response"
