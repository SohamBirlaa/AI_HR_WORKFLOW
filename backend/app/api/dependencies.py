from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.core.config import settings
from app.repositories.user import UserRepository
from app.models.user import User

# oauth2_scheme points to our login endpoint for token retrieval
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection to yield a database session per request.
    
    This ensures that each HTTP request gets its own isolated database transaction session.
    The 'finally' block guarantees that the session is closed when the request lifecycle ends,
    preventing connection leaks to the database pool.
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency injection to fetch, validate, and retrieve the current authenticated User context.
    
    Workflow:
    1. Check if token is present in Authorization headers (injected via OAuth2 scheme).
    2. Decode the JWT token using the configured secret and algorithm, validating its signature and expiration.
    3. Extract the subject ('sub') claim containing the user ID.
    4. Query the user repository to ensure the user exists in the database.
    5. Ensure the user's account status is currently active.
    6. Raise a 401 Unauthorized exception if any step of validation fails.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        # Decode the access token to check validity and extract claims
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    # Query the user database to check if user exists and is active
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user