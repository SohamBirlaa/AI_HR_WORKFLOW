import asyncio
import json
import pytest
from urllib.parse import urlparse
import asyncpg
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import settings
from app.api.dependencies import get_db, get_screening_queue
from app.main import app

# Import all models to ensure they register on Base.metadata
from app.models.base import Base
from app.models.user import User
from app.models.job import Job
from app.models.social_asset import SocialAsset
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.screening import ScreeningResult

from app.services.queue_base import BaseScreeningQueue
from app.services.screening import ScreeningService
from app.services.storage import S3StorageService
from app.services.extractor import DocumentExtractor
from app.llm.base import BaseLLMProvider
from app.llm.factory import LLMProviderFactory

# 1. Setup Isolated Test Database
async def create_test_db_if_not_exists():
    """Helper to connect to default postgres DB and create ai_hr_test if missing."""
    url = urlparse(settings.DATABASE_URL)
    admin_url = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port or 5432}/postgres"
    
    try:
        conn = await asyncpg.connect(admin_url)
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'ai_hr_test'")
        if not exists:
            await conn.execute("CREATE DATABASE ai_hr_test")
            print("Test database 'ai_hr_test' created successfully.")
        await conn.close()
    except Exception as e:
        print(f"Warning: Failed checking or creating test database: {e}")

@pytest.fixture
async def test_engine():
    """Engine that creates and drops test tables per test function for clean isolation."""
    # Ensure test database exists first
    await create_test_db_if_not_exists()
    
    # Establish test engine on the target ai_hr_test URL
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine) -> AsyncSession:
    """Provides an isolated AsyncSession per test."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

# 2. Dependency Overrides
@pytest.fixture(autouse=True)
def override_db_dependency(db_session):
    """Override get_db in FastAPI routes to use the test session."""
    async def _get_db():
        yield db_session
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.pop(get_db, None)

# Synchronous Screening Queue for Testing
class SynchronousScreeningQueue(BaseScreeningQueue):
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        
    async def enqueue_screening(self, application_id: int) -> None:
        """Run candidate screening synchronously inside the test thread."""
        service = ScreeningService(self.db_session)
        await service.screen_candidate(application_id)

@pytest.fixture(autouse=True)
def override_screening_queue(db_session):
    """Override get_screening_queue to run screening synchronously in tests."""
    async def _get_screening_queue():
        return SynchronousScreeningQueue(db_session)
    app.dependency_overrides[get_screening_queue] = _get_screening_queue
    yield
    app.dependency_overrides.pop(get_screening_queue, None)

# 3. HTTP Test Client
@pytest.fixture
async def async_client() -> AsyncClient:
    """Async client fixture for invoking backend endpoints (using ASGI transport)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

# 4. Mock LLM Provider Implementation
class MockLLMProvider(BaseLLMProvider):
    """Provides fake LLM text and structured JSON responses during testing."""
    
    async def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        # Candidate Screening Request
        if "UNTRUSTED CANDIDATE RESUME START" in prompt or "skills_score" in (system_instruction or ""):
            return json.dumps({
                "skills_score": 85,
                "experience_score": 80,
                "education_score": 90,
                "overall_score": 85,
                "strengths": ["Strong Python skills", "Eager learner"],
                "concerns": ["Lacks large-scale production exposure"],
                "reasoning": "Candidate shows great technical aptitude."
            })
            
        # GitHub Consistency Assessment Request
        if "GITHUB" in prompt or "github_consistency_score" in (system_instruction or ""):
            return json.dumps({
                "github_consistency_score": 90,
                "github_reasoning": "Candidate's repositories match claimed skills."
            })
            
        # Social Asset Generation Request
        if "social" in prompt.lower() or "platform" in prompt.lower():
            return json.dumps({
                "linkedin": {
                    "caption": "Exciting role available!",
                    "suggested_communities": ["Python Jobs", "Tech Careers"],
                    "visual_title": "Developer",
                    "visual_company": "Startup",
                    "visual_location": "Remote"
                },
                "twitter": {
                    "caption": "Exciting role available! #tech",
                    "suggested_communities": ["#tech"],
                    "visual_title": "Developer",
                    "visual_company": "Startup",
                    "visual_location": "Remote"
                },
                "facebook": {
                    "caption": "Exciting role available!",
                    "suggested_communities": ["Developer Group"],
                    "visual_title": "Developer",
                    "visual_company": "Startup",
                    "visual_location": "Remote"
                },
                "instagram": {
                    "caption": "Exciting role available!",
                    "suggested_communities": ["Developer Life"],
                    "visual_title": "Developer",
                    "visual_company": "Startup",
                    "visual_location": "Remote"
                },
                "location": "Remote"
            })
            
        # JD Generation Request
        if "job description" in prompt.lower() or "JD" in prompt.lower():
            return (
                "Role Summary: Join us as a Developer.\n"
                "Responsibilities: Write clean python code.\n"
                "Requirements: 2 years experience.\n"
                "About the Company: Modern AI software firm.\n"
                "How to Apply: Apply on the portal."
            )
            
        return "Mocked LLM generic output."

@pytest.fixture(autouse=True)
def mock_llm_factory(monkeypatch):
    """Override LLMProviderFactory to return MockLLMProvider for all tests."""
    mock_provider = MockLLMProvider()
    
    def _mock_get_provider():
        return mock_provider
        
    monkeypatch.setattr(LLMProviderFactory, "get_provider", _mock_get_provider)
    yield

# 5. Stub S3 Storage
@pytest.fixture(autouse=True)
def mock_s3_storage(monkeypatch):
    """Stub out S3 storage service to bypass botocore S3 network calls and mock document extraction."""
    async def mock_upload_resume(self, file_content, filename):
        return f"resumes/mock-uuid.{filename.split('.')[-1]}"
        
    def mock_download_file(self, storage_key):
        return b"%PDF-1.4 mocked pdf content"
        
    def mock_get_resume_download_url(self, storage_key):
        return f"http://mock-s3-endpoint/download/{storage_key}"
        
    async def mock_ensure_bucket_exists(self):
        return None

    def mock_extract_text(self, file_bytes, filename):
        return "Mocked candidate resume text content showing Python expertise."
        
    monkeypatch.setattr(S3StorageService, "upload_resume", mock_upload_resume)
    monkeypatch.setattr(S3StorageService, "download_file", mock_download_file)
    monkeypatch.setattr(S3StorageService, "get_resume_download_url", mock_get_resume_download_url)
    monkeypatch.setattr(S3StorageService, "_ensure_bucket_exists", mock_ensure_bucket_exists)
    monkeypatch.setattr(DocumentExtractor, "extract_text", mock_extract_text)
    yield
