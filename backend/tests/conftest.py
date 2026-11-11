import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from testcontainers.community.postgres import PostgresContainer

from backend.config import settings
from backend.database import get_db
from backend.main import app
from backend.models import Base


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

    with TestClient(app) as test_client:
        yield test_client

    # 5. After each test: undo the override and empty all tables
    app.dependency_overrides.clear()
    with engine.begin() as connection:
        connection.execute(
            text("TRUNCATE courses, documents, chunks RESTART IDENTITY CASCADE")
        )


@pytest.fixture(autouse=True)
def upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    return tmp_path
