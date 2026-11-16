import math
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models import Course, Document, QuestionLog

WINDOW = timedelta(hours=1)


def count_documents(db: Session, user_id: int) -> int:
    """All documents in all of the user's courses."""
    query = (
        select(func.count())
        .select_from(Document)
        .join(Course, Document.course_id == Course.id)
        .where(Course.owner_id == user_id)
    )
    return db.scalar(query) or 0


def minutes_until_next_question(db: Session, user_id: int, limit: int) -> int | None:
    """None if the user may ask now; otherwise how many minutes they must wait.

    The window is "the last hour": the oldest question in it leaves first, so
    the wait is (oldest question + 1 hour) - now.
    """
    query = select(
        func.count(),
        func.extract("epoch", func.min(QuestionLog.created_at) + WINDOW - func.now()),
    ).where(
        QuestionLog.user_id == user_id,
        QuestionLog.created_at > func.now() - WINDOW,
    )
    count, seconds_left = db.execute(query).one()
    if count < limit:
        return None
    return max(1, math.ceil(float(seconds_left) / 60))


def record_question(db: Session, user_id: int) -> None:
    db.add(QuestionLog(user_id=user_id))
    db.commit()
