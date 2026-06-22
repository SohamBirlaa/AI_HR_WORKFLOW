from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.job import Job

class JobRepository:
    """Repository layer for database operations on the Job model."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Job]:
        """Fetch list of all jobs, sorted by creation timestamp ascending."""
        result = await self.db.execute(select(Job).order_by(Job.id.asc()))
        return list(result.scalars().all())

    async def get_by_id(self, job_id: int) -> Optional[Job]:
        """Fetch a specific job by integer primary key ID."""
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalars().first()

    async def create(self, job: Job) -> Job:
        """Add new Job entity and commit transaction."""
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update(self, job: Job) -> Job:
        """Mark existing Job entity as dirty, commit transaction, and refresh state."""
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job
