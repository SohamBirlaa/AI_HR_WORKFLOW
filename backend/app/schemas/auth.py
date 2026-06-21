from pydantic import BaseModel, EmailStr
from datetime import datetime

class LoginRequest(BaseModel):
    """Pydantic schema for login request body validation."""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Pydantic schema for JWT access token response."""
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    """Pydantic schema for returning User details safely."""
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "admin@company.com",
                "is_active": True,
                "created_at": "2026-06-22T04:10:13.123456"
            }
        }
