import pytest

from backend.models import EMBEDDING_DIMENSIONS, Chunk, Course, Document, DocumentStatus
from backend.services.retrieval import SearchResult, search_chunks


def direction(index: int) -> list[float]:
    """A vector pointing in one direction: 1.0 at `index`, a tiny value elsewhere."""
    vector = [0.001] * EMBEDDING_DIMENSIONS
    vector[index] = 1.0
    return vector


@pytest.fixture
def question_points_to(monkeypatch):
    """Make the question's embedding point in a chosen direction."""

    def set_direction(index: int):
        monkeypatch.setattr(
            "backend.services.retrieval.embed_texts",
            lambda texts, task_type: [direction(index)],
        )

    return set_direction


def add_document(db, course, filename, status=DocumentStatus.READY):
    document = Document(course_id=course.id, filename=filename, path="", status=status)
    db.add(document)
    db.flush()
    return document


def add_chunk(db, document, content, page_number, vector_index):
    db.add(
        Chunk(
            document_id=document.id,
            chunk_index=0,
            page_number=page_number,
            content=content,
            embedding=direction(vector_index),
        )
    )


@pytest.fixture
def course(db):
    course = Course(title="Docker")
    db.add(course)
    db.flush()
    return course


def test_closest_chunk_comes_first(db, course, question_points_to):
    document = add_document(db, course, "lecture1.pdf")
    add_chunk(db, document, "Images are templates.", page_number=1, vector_index=1)
    add_chunk(db, document, "Docker runs containers.", page_number=2, vector_index=0)
    db.commit()
    question_points_to(0)

    results = search_chunks(db, course.id, "What does Docker run?")

    assert results[0] == SearchResult(
        content="Docker runs containers.", filename="lecture1.pdf", page_number=2
    )


def test_only_searches_the_given_course(db, course, question_points_to):
    other_course = Course(title="Databases")
    db.add(other_course)
    db.flush()
    add_chunk(db, add_document(db, course, "docker.pdf"), "Docker", 1, vector_index=1)
    add_chunk(db, add_document(db, other_course, "sql.pdf"), "SQL", 1, vector_index=0)
    db.commit()
    question_points_to(0)  # closest to the OTHER course's chunk

    results = search_chunks(db, course.id, "What is SQL?")

    assert [result.filename for result in results] == ["docker.pdf"]


def test_ignores_documents_that_are_not_ready(db, course, question_points_to):
    ready = add_document(db, course, "ready.pdf")
    processing = add_document(db, course, "processing.pdf", DocumentStatus.PROCESSING)
    failed = add_document(db, course, "failed.pdf", DocumentStatus.FAILED)
    add_chunk(db, ready, "Ready text.", 1, vector_index=1)
    add_chunk(db, processing, "Processing text.", 1, vector_index=0)
    add_chunk(db, failed, "Failed text.", 1, vector_index=0)
    db.commit()
    question_points_to(0)

    results = search_chunks(db, course.id, "Anything?")

    assert [result.filename for result in results] == ["ready.pdf"]


def test_returns_at_most_limit_results(db, course, question_points_to):
    document = add_document(db, course, "lecture.pdf")
    for page in range(1, 8):
        add_chunk(db, document, f"Page {page}.", page, vector_index=page)
    db.commit()
    question_points_to(0)

    assert len(search_chunks(db, course.id, "Anything?")) == 5
    assert len(search_chunks(db, course.id, "Anything?", limit=3)) == 3
