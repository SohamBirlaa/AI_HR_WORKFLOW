from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User

class UserRepository:
    """Repository layer for database operations on the User model."""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email address."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by integer primary key ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()
