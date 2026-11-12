import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from testcontainers.community.postgres import PostgresContainer

from backend.core.config import settings
from backend.core.database import get_db, get_session_factory
from backend.main import app
from backend.models import EMBEDDING_DIMENSIONS, Base


@pytest.fixture(scope="session")
def engine():
    # 1. Start a temporary PostgreSQL with pgvector in Docker (once per run)
    with PostgresContainer("pgvector/pgvector:pg17", driver="psycopg") as postgres:
        engine = create_engine(postgres.get_connection_url())

        # 2. Enable pgvector and create all tables from our models
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(engine)

        yield engine

        engine.dispose()
    # 3. Leaving the "with" block deletes the container


@pytest.fixture
def client(engine):
    TestSession = sessionmaker(bind=engine)

    # 4. Make the app use the test database instead of the real one
    def get_test_db():
        with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = get_test_db
    app.dependency_overrides[get_session_factory] = lambda: TestSession

    with TestClient(app) as test_client:
        yield test_client

    # 5. After each test: undo the override and empty all tables
    app.dependency_overrides.clear()
    empty_tables(engine)


@pytest.fixture
def db(engine):
    """A database session for tests that use services directly, without the API."""
    with Session(engine) as session:
        yield session
    empty_tables(engine)


def empty_tables(engine):
    with engine.begin() as connection:
        connection.execute(
            text("TRUNCATE courses, documents, chunks RESTART IDENTITY CASCADE")
        )


@pytest.fixture(autouse=True)
def upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    return tmp_path


def build_pdf(pages: list[str]) -> bytes:
    """Build a small, valid PDF with one line of text per page."""
    count = len(pages)
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids ["
        + b" ".join(f"{4 + 2 * i} 0 R".encode() for i in range(count))
        + f"] /Count {count} >>".encode(),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    for i, page_text in enumerate(pages):
        content_id = 5 + 2 * i
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> "
            f"/Contents {content_id} 0 R >>".encode()
        )
        stream = (
            f"BT /F1 12 Tf 72 720 Td ({page_text}) Tj ET".encode() if page_text else b""
        )
        objects.append(
            f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream"
        )

    pdf = b"%PDF-1.4\n"
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_start = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    pdf += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets)
    pdf += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF\n"
    ).encode()
    return pdf


@pytest.fixture
def make_pdf():
    return build_pdf


def fake_embed_texts(texts: list[str]) -> list[list[float]]:
    """Stand-in for Gemini: one fake vector per text, no network call."""
    return [[0.1] * EMBEDDING_DIMENSIONS for _ in texts]


@pytest.fixture(autouse=True)
def fake_embeddings(monkeypatch):
    monkeypatch.setattr("backend.services.processing.embed_texts", fake_embed_texts)
