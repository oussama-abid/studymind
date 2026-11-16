import logging

from fastapi import APIRouter, HTTPException
from google.genai.errors import APIError

from backend.core.auth import CurrentUserDep
from backend.core.database import SessionDep
from backend.routers.courses import get_course_or_404
from backend.schemas.chat import ChatRequest, ChatResponse, Source
from backend.services.chat import answer_question, has_ready_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses/{course_id}/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def ask_question(
    course_id: int, request: ChatRequest, db: SessionDep, user: CurrentUserDep
):
    # 1. The course must exist
    get_course_or_404(db, course_id, user)

    # 2. Without ready documents there is nothing to search: don't call Gemini
    if not has_ready_documents(db, course_id):
        raise HTTPException(
            status_code=409,
            detail="This course has no ready documents yet. "
            "Upload a PDF and wait until it's ready.",
        )

    # 3. Search, then let Gemini answer
    try:
        result = answer_question(db, course_id, request.question)
    except APIError:
        logger.exception("Chat failed for course %s", course_id)
        raise HTTPException(
            status_code=503,
            detail="The AI is busy right now. Please try again in a minute.",
        ) from None

    return ChatResponse(
        answer=result.answer,
        sources=[Source.model_validate(source) for source in result.sources],
    )
