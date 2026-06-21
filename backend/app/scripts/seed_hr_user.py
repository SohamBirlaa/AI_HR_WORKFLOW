import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import async_session_maker
from app.models.user import User
from app.core.security import get_password_hash

async def seed_user():
    async with async_session_maker() as session:
        # Check if the user already exists
        result = await session.execute(select(User).where(User.email == "admin@company.com"))
        user = result.scalars().first()

        if user:
            print("HR Admin user already exists. Skipping seed.")
            return

        # Create new user
        print("Creating initial HR Admin user...")
        hashed_pw = get_password_hash("admin123")
        new_user = User(
            email="admin@company.com",
            hashed_password=hashed_pw,
            is_active=True
        )
        session.add(new_user)
        await session.commit()
        print("HR Admin user created successfully! (email: admin@company.com, password: admin123)")

if __name__ == "__main__":
    asyncio.run(seed_user())