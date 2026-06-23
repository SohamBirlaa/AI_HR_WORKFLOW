from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db
from app.repositories.job import JobRepository
from app.repositories.candidate import CandidateRepository
from app.repositories.application import ApplicationRepository
from app.services.candidate import CandidateService
from app.services.storage import S3StorageService
from app.schemas.candidate import PublicJobResponse, CandidateCreate, ApplicationResponse
from app.models.job import JobStatus

router = APIRouter(prefix="", tags=["public"])

@router.get("/public/jobs", response_model=List[PublicJobResponse])
async def list_public_jobs(db: AsyncSession = Depends(get_db)):
    """Retrieve only published job openings. Public endpoint."""
    try:
        repo = JobRepository(db)
        all_jobs = await repo.get_all()
        # Filter only jobs that are published
        published_jobs = [job for job in all_jobs if job.status == JobStatus.PUBLISHED]
        return published_jobs
    except Exception as e:
        # Gracefully handle database or connection issues and return clean JSON response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )

@router.get("/public/jobs/{id}", response_model=PublicJobResponse)
async def get_public_job(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve a single published job opening by ID. Public endpoint."""
    try:
        repo = JobRepository(db)
        job = await repo.get_by_id(id)
        if not job or job.status != JobStatus.PUBLISHED:
            # 404 is the expected response when job is not found or not published
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Published job with ID {id} was not found."
            )
        return job
    except HTTPException:
        # Re-raise explicit HTTP exceptions to preserve correct response codes (like 404)
        raise
    except Exception as e:
        # Catch unexpected DB/server errors and return as serializable JSON response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {str(e)}"
        )

@router.post("/apply/{job_id}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    linkedin_url: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    consent_given: bool = Form(...),
    resume: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Submit application form and resume upload to a published job. Public endpoint.
    
    Inputs: Form fields and raw resume UploadFile stream.
    Validates parameter inputs and passes the file stream directly to CandidateService.
    """
    # Create repos
    candidate_repo = CandidateRepository(db)
    application_repo = ApplicationRepository(db)
    job_repo = JobRepository(db)
    
    # Initialize storage and service instance
    storage_service = S3StorageService()
    
    # Construct schema representation for candidate details
    candidate_schema = CandidateCreate(
        name=name,
        email=email,
        phone=phone,
        linkedin_url=linkedin_url,
        github_url=github_url
    )
    
    try:
        # Read file stream bytes
        file_bytes = await resume.read()
        
        application = await CandidateService.apply_to_job(
            candidate_repo=candidate_repo,
            application_repo=application_repo,
            job_repo=job_repo,
            storage_service=storage_service,
            job_id=job_id,
            schema=candidate_schema,
            consent_given=consent_given,
            file_content=file_bytes,
            filename=resume.filename,
            content_type=resume.content_type
        )
        return application
    except ValueError as e:
        # Business logic errors (invalid file structure, consent missing, unpublished job)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # General unhandled exceptions mapping
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )
