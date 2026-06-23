from passlib.context import CryptContext

# Set up Passlib CryptContext to use Bcrypt for secure password hashing.
# We configure this to ensure password hashes cannot be easily reversed, 
# protecting HR user passwords in the database from data breaches.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash the provided password using bcrypt.
    
    Generates a secure, salted hash of the plain-text password to be persisted in the database.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that the provided plain password matches the hashed password.
    
    Uses secure comparison logic to protect against timing attacks.
    """
    return pwd_context.verify(plain_password, hashed_password)