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

    async def get_by_job_id(self, job_id: int) -> list[Application]:
        """Fetch all applications for a specific job opening, eager loading related Candidate profiles.
        
        Using joinedload is critical to fetch the related candidate records eagerly in one SQL join query,
        preventing LazyLoadingAttributeError exceptions during asynchronous response serialization.
        """
        from sqlalchemy.orm import joinedload
        result = await self.db.execute(
            select(Application)
            .options(joinedload(Application.candidate))
            .where(Application.job_id == job_id)
            .order_by(Application.applied_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_with_details(self, application_id: int) -> Optional[Application]:
        """Fetch a specific job application by ID, eager loading both Candidate and Job relationships.
        
        Using joinedload ensures all relational details are fully hydrated on return.
        """
        from sqlalchemy.orm import joinedload
        result = await self.db.execute(
            select(Application)
            .options(joinedload(Application.candidate), joinedload(Application.job))
            .where(Application.id == application_id)
        )
        return result.scalars().first()
