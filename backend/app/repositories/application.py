from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.application import Application

class ApplicationRepository:
    """Repository layer for database operations on the Application model."""

    def __init__(self, db: AsyncSession):
        """Initialize with active database session."""
        self.db = db

    async def get_by_candidate_and_job(self, candidate_id: int, job_id: int) -> Optional[Application]:
        """Fetch application corresponding to a unique candidate-job pair."""
        result = await self.db.execute(
            select(Application).where(
                Application.candidate_id == candidate_id,
                Application.job_id == job_id
            )
        )
        return result.scalars().first()

    async def get_by_id(self, application_id: int) -> Optional[Application]:
        """Fetch a specific application by primary key ID."""
        result = await self.db.execute(select(Application).where(Application.id == application_id))
        return result.scalars().first()

    async def create(self, application: Application) -> Application:
        """Create new Application database entry and commit."""
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def update(self, application: Application) -> Application:
        """Update properties of an existing application and commit."""
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application
