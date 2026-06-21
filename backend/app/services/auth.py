from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from app.core.config import settings
from app.core.security import verify_password
from app.models.user import User
from app.repositories.user import UserRepository

class AuthService:
    """Service layer for authentication logic, including hash verification and JWT token generation/validation."""
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Generate a signed JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def authenticate_user(
        user_repo: UserRepository, email: str, password: str
    ) -> Optional[User]:
        """Authenticate user by matching email and verifying hashed password."""
        user = await user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
