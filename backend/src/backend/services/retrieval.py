from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Chunk, Document, DocumentStatus
from backend.services.embeddings import embed_texts


@dataclass
class SearchResult:
    content: str
    filename: str
    page_number: int


def search_chunks(
    db: Session, course_id: int, question: str, limit: int = 5
) -> list[SearchResult]:
    """Find the chunks of a course whose meaning is closest to the question."""
    question_embedding = embed_texts([question], task_type="RETRIEVAL_QUERY")[0]

    query = (
        select(Chunk, Document.filename)
        .join(Document, Chunk.document_id == Document.id)
        .where(Document.course_id == course_id)
        .where(Document.status == DocumentStatus.READY)
        .order_by(Chunk.embedding.cosine_distance(question_embedding))
        .limit(limit)
    )

    return [
        SearchResult(
            content=chunk.content,
            filename=filename,
            page_number=chunk.page_number,
        )
        for chunk, filename in db.execute(query).all()
    ]
