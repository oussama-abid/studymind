from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import SessionDep
from backend.models import Course
from backend.schemas.courses import CourseCreate, CourseRead

router = APIRouter(prefix="/courses", tags=["courses"])


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", status_code=201, response_model=CourseRead)
def create_course(data: CourseCreate, db: SessionDep):
    course = Course(title=data.title, description=data.description)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("", response_model=list[CourseRead])
def list_courses(db: SessionDep):
    return db.scalars(select(Course).order_by(Course.created_at.desc(), Course.id.desc())).all()


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: SessionDep):
    return get_course_or_404(db, course_id)


@router.put("/{course_id}", response_model=CourseRead)
def update_course(course_id: int, data: CourseCreate, db: SessionDep):
    course = get_course_or_404(db, course_id)
    course.title = data.title
    course.description = data.description
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: SessionDep):
    course = get_course_or_404(db, course_id)
    db.delete(course)
    db.commit()
