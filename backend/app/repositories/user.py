from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User

class UserRepository:
    """Repository layer for database operations on the User model.
    
    Separates database access concerns from high-level service business rules.
    """
    
    def __init__(self, db: AsyncSession):
        """Initialize the repository with an active asynchronous database session."""
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email address.
        
        Executes a SELECT query filtering by the unique email address.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by integer primary key ID.
        
        Used by the authentication dependency helper to load active user credentials.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()
