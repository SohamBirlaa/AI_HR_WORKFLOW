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
    """Retrieve list of all job postings. Protected route."""
    repo = JobRepository(db)
    return await JobService.list_jobs(repo)

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    schema: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job posting. Protected route."""
    repo = JobRepository(db)
    return await JobService.create_job(repo, schema)

@router.get("/{id}", response_model=JobResponse)
async def get_job(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a single job posting by ID. Protected route."""
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
    """Update details of a job posting by ID using partial fields. Protected route."""
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
    """Refine a raw job description using configured LLM. Protected route."""
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
            status_code=status.HTTP_502_BAD_GATEWAY,
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
    """Approve a generated job description. Protected route."""
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
    """Reject a generated job description. Protected route."""
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
    """Publish an approved job posting. Protected route."""
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

