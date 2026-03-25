from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from ..database import get_db
from ..models.user import User, InviteToken
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token, InviteCreate, InviteResponse
from ..auth.jwt import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/invite", response_model=InviteResponse)
def create_invite(
    invite_data: InviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)

    invite = InviteToken(
        token=token,
        created_by=current_user.id,
        email=invite_data.email,
        expires_at=expires_at
    )
    db.add(invite)
    db.commit()

    return InviteResponse(
        token=token,
        invite_url=f"/auth/accept-invite/{token}",
        expires_at=expires_at
    )

@router.post("/accept-invite/{token}", response_model=UserResponse)
def accept_invite(token: str, user_data: UserCreate, db: Session = Depends(get_db)):
    invite = db.query(InviteToken).filter(
        InviteToken.token == token,
        InviteToken.used == False,
        InviteToken.expires_at > datetime.utcnow()
    ).first()

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password)
    )
    db.add(user)
    invite.used = True
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
