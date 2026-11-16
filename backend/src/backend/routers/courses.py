from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import CurrentUserDep
from backend.core.database import SessionDep
from backend.models import Course, User
from backend.schemas.courses import CourseCreate, CourseRead

router = APIRouter(prefix="/courses", tags=["courses"])


def get_course_or_404(db: Session, course_id: int, user: User) -> Course:
    """The user's course, or 404 if it doesn't exist OR belongs to someone else."""
    course = db.scalars(
        select(Course).where(Course.id == course_id, Course.owner_id == user.id)
    ).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", status_code=201, response_model=CourseRead)
def create_course(data: CourseCreate, db: SessionDep, user: CurrentUserDep):
    course = Course(title=data.title, description=data.description, owner_id=user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("", response_model=list[CourseRead])
def list_courses(db: SessionDep, user: CurrentUserDep):
    return db.scalars(
        select(Course)
        .where(Course.owner_id == user.id)
        .order_by(Course.created_at.desc(), Course.id.desc())
    ).all()


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: SessionDep, user: CurrentUserDep):
    return get_course_or_404(db, course_id, user)


@router.put("/{course_id}", response_model=CourseRead)
def update_course(
    course_id: int, data: CourseCreate, db: SessionDep, user: CurrentUserDep
):
    course = get_course_or_404(db, course_id, user)
    course.title = data.title
    course.description = data.description
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: SessionDep, user: CurrentUserDep):
    course = get_course_or_404(db, course_id, user)
    db.delete(course)
    db.commit()
