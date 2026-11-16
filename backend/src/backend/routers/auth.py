from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import CurrentUserDep
from backend.core.database import SessionDep
from backend.models import User
from backend.schemas.auth import Token, UserCreate, UserRead
from backend.services.security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalars(select(User).where(User.email == email)).first()


@router.post("/register", status_code=201, response_model=UserRead)
def register(data: UserCreate, db: SessionDep):
    if find_user_by_email(db, data.email) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=data.email, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserCreate, db: SessionDep):
    user = find_user_by_email(db, data.email)

    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
def me(user: CurrentUserDep):
    return user
