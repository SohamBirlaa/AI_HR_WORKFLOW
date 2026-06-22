from typing import List, Optional
from app.repositories.job import JobRepository
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate

class JobService:
    """Service layer coordinating business logic operations for Job CRUD."""

    @staticmethod
    async def list_jobs(repo: JobRepository) -> List[Job]:
        """List all existing job records."""
        return await repo.get_all()

    @staticmethod
    async def get_job(repo: JobRepository, job_id: int) -> Optional[Job]:
        """Fetch details of a single job opening."""
        return await repo.get_by_id(job_id)

    @staticmethod
    async def create_job(repo: JobRepository, schema: JobCreate) -> Job:
        """Create new job instance and persist in database."""
        job = Job(
            title=schema.title,
            company_name=schema.company_name,
            company_details=schema.company_details,
            raw_jd=schema.raw_jd,
            status=schema.status,
        )
        return await repo.create(job)

    @staticmethod
    async def update_job(
        repo: JobRepository, job_id: int, schema: JobUpdate
    ) -> Optional[Job]:
        """Update properties of an existing job opening using partial values."""
        job = await repo.get_by_id(job_id)
        if not job:
            return None

        # Exclude unset fields to handle partial updates cleanly
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(job, key, value)

        return await repo.update(job)
