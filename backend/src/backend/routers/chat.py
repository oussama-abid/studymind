import logging

from fastapi import APIRouter, HTTPException
from google.genai.errors import APIError as GeminiError
from groq import APIError as GroqError

from backend.core.auth import CurrentUserDep
from backend.core.config import settings
from backend.core.database import SessionDep
from backend.routers.courses import get_course_or_404
from backend.schemas.chat import ChatRequest, ChatResponse, Source
from backend.services.chat import answer_question, has_ready_documents
from backend.services.limits import minutes_until_next_question, record_question

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses/{course_id}/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def ask_question(
    course_id: int, request: ChatRequest, db: SessionDep, user: CurrentUserDep
):
    # 1. The course must exist
    get_course_or_404(db, course_id, user)

    # 2. Without ready documents there is nothing to search: don't call the AI
    if not has_ready_documents(db, course_id):
        raise HTTPException(
            status_code=409,
            detail="This course has no ready documents yet. "
            "Upload a PDF and wait until it's ready.",
        )
    # 3. Hourly limit: every question that reaches the AI counts, even a failed one
    limit = settings.max_questions_per_hour
    wait = minutes_until_next_question(db, user.id, limit)
    if wait is not None:
        raise HTTPException(
            status_code=429,
            detail=f"You've asked {limit} questions in the last hour. "
            f"Try again in {wait} minutes.",
            headers={"Retry-After": str(wait * 60)},
        )
    record_question(db, user.id)

    # 4. Search (Gemini embeds the question), then let the model answer (Groq).
    #    Either provider can fail: both become a friendly 503.
    try:
        result = answer_question(db, course_id, request.question)
    except (GeminiError, GroqError):
        logger.exception("Chat failed for course %s", course_id)
        raise HTTPException(
            status_code=503,
            detail="The AI is busy right now. Please try again in a minute.",
        ) from None

    return ChatResponse(
        answer=result.answer,
        sources=[Source.model_validate(source) for source in result.sources],
    )
