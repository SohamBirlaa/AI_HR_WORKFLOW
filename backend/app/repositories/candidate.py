from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.candidate import Candidate

class CandidateRepository:
    """Repository layer for database operations on the Candidate model."""

    def __init__(self, db: AsyncSession):
        """Initialize with active database session."""
        self.db = db

    async def get_by_email(self, email: str) -> Optional[Candidate]:
        """Fetch a candidate by their unique email address."""
        result = await self.db.execute(select(Candidate).where(Candidate.email == email))
        return result.scalars().first()

    async def get_by_id(self, candidate_id: int) -> Optional[Candidate]:
        """Fetch a specific candidate by primary key ID."""
        result = await self.db.execute(select(Candidate).where(Candidate.id == candidate_id))
        return result.scalars().first()

    async def create(self, candidate: Candidate) -> Candidate:
        """Create new Candidate database entry and commit."""
        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)
        return candidate

    async def update(self, candidate: Candidate) -> Candidate:
        """Update properties of an existing candidate and commit."""
        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)
        return candidate
