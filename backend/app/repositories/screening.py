from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.screening import ScreeningResult

class ScreeningRepository:
    """Repository layer for database operations on the ScreeningResult model."""

    def __init__(self, db: AsyncSession):
        """Initialize with active database session."""
        self.db = db

    async def get_by_application_id(self, application_id: int) -> Optional[ScreeningResult]:
        """Fetch the screening result associated with a specific application."""
        result = await self.db.execute(
            select(ScreeningResult).where(ScreeningResult.application_id == application_id)
        )
        return result.scalars().first()

    async def create(self, screening_result: ScreeningResult) -> ScreeningResult:
        """Create new ScreeningResult database entry and commit."""
        self.db.add(screening_result)
        await self.db.commit()
        await self.db.refresh(screening_result)
        return screening_result

    async def update(self, screening_result: ScreeningResult) -> ScreeningResult:
        """Update properties of an existing screening result and commit."""
        self.db.add(screening_result)
        await self.db.commit()
        await self.db.refresh(screening_result)
        return screening_result
