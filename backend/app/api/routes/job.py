from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user
from app.repositories.job import JobRepository
from app.services.job import JobService
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.models.user import User

from app.llm.factory import LLMProviderFactory

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve list of all job postings. Protected route.
    
    Returns all jobs saved in the database, ordered by ID ascending.
    """
    repo = JobRepository(db)
    return await JobService.list_jobs(repo)

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    schema: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job posting. Protected route.
    
    Accepts title, company name, and raw JD text. Defaults status to Draft.
    """
    repo = JobRepository(db)
    return await JobService.create_job(repo, schema)

@router.get("/{id}", response_model=JobResponse)
async def get_job(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a single job posting by ID. Protected route.
    
    Raises 404 error if job ID does not exist.
    """
    repo = JobRepository(db)
    job = await JobService.get_job(repo, id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
    return job

@router.put("/{id}", response_model=JobResponse)
async def update_job(
    id: int,
    schema: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update details of a job posting by ID using partial fields. Protected route.
    
    Allows changing title, company_name, raw_jd, polished_jd, or status directly.
    """
    repo = JobRepository(db)
    job = await JobService.update_job(repo, id, schema)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
    return job

@router.post("/{id}/generate-jd", response_model=JobResponse)
async def generate_jd(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Refine a raw job description using configured LLM. Protected route.
    
    Delegates to the LLM provider to rewrite raw JD into structured format, 
    verifies the 800-word constraint, and transitions status to jd_generated.
    """
    repo = JobRepository(db)
    
    try:
        provider = LLMProviderFactory.get_provider()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
        
    try:
        job = await JobService.generate_jd(repo, id, provider)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_524_A_TIMEOUT if "timeout" in str(e).lower() else status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider failed: {str(e)}"
        )
        
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
        
    return job


@router.post("/{id}/approve", response_model=JobResponse)
async def approve_job(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a generated job description. Protected route.
    
    Transitions status from jd_generated to approved. 
    Only approved JDs can be published or have social assets generated.
    """
    repo = JobRepository(db)
    try:
        job = await JobService.approve_job(repo, id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
    return job


@router.post("/{id}/reject", response_model=JobResponse)
async def reject_job(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a generated job description. Protected route.
    
    Transitions status from jd_generated to rejected. 
    Allows the user to revise the raw text and regenerate it again.
    """
    repo = JobRepository(db)
    try:
        job = await JobService.reject_job(repo, id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
    return job


@router.post("/{id}/publish", response_model=JobResponse)
async def publish_job(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish an approved job posting. Protected route.
    
    Transitions status from approved to published. 
    This exposes the listing to candidate-facing routes.
    """
    repo = JobRepository(db)
    try:
        job = await JobService.publish_job(repo, id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {id} not found"
        )
    return job

