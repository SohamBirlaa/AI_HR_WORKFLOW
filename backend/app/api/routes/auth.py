from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(
    request_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate internal HR users and return a signed access JWT.
    
    Validates email and password, checks active flag status, and returns
    a signed JWT access token containing the user's ID as the sub claim.
    """
    user_repo = UserRepository(db)
    user = await AuthService.authenticate_user(
        user_repo, request_data.email, request_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is inactive",
        )
    
    # Issue a token using user ID as the subject ('sub') claim
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile data of the currently logged-in HR User.
    
    Protected route. Employs get_current_user dependency injection 
    to validate the bearer token and return user details.
    """
    return current_user
