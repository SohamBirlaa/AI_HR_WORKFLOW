import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import async_session_maker
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

async def seed_user():
    email = settings.INITIAL_ADMIN_EMAIL
    password = settings.INITIAL_ADMIN_PASSWORD

    # Validation check
    if not email or not email.strip():
        raise ValueError("INITIAL_ADMIN_EMAIL must not be empty or whitespace.")
    if not password or not password.strip():
        raise ValueError("INITIAL_ADMIN_PASSWORD must not be empty or whitespace.")

    email = email.strip()

    async with async_session_maker() as session:
        # Check if the user already exists
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if user:
            print(f"HR Admin user '{email}' already exists. Skipping seed.")
            return

        # Create new user
        print(f"Creating initial HR Admin user '{email}'...")
        hashed_pw = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_pw,
            is_active=True
        )
        session.add(new_user)
        await session.commit()
        print(f"HR Admin user '{email}' created successfully!")

if __name__ == "__main__":
    asyncio.run(seed_user())