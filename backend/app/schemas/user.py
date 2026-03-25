from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
from ..models.user import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Passwort muss mindestens 8 Zeichen lang sein")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Passwort darf maximal 72 Zeichen lang sein")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    is_active: bool
    role: UserRole

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class InviteCreate(BaseModel):
    email: Optional[str] = None

class InviteResponse(BaseModel):
    token: str
    invite_url: str
    expires_at: datetime
