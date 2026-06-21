from passlib.context import CryptContext

#configration bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash the provided password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that the provided plain password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)