# Backend

The API of StudyMind. It handles users, courses and documents, extracts
text from PDFs, creates embeddings, and answers questions using the
uploaded material (RAG).

## Tech stack
- Python 3.12 with FastAPI, managed with uv
- PostgreSQL with pgvector
- Gemini API for embeddings and answers
- pytest and Ruff for tests and linting


## Development

All commands run from the `backend/` folder.

### Install dependencies
```bash
uv sync
```

### Start the database
From the project root:
```bash
cp .env.example .env   # first time only, then set your own password
docker compose up -d db
```
### Run database migrations
After starting the database, create or update the tables:
```bash
uv run alembic upgrade head
```

After changing a model, create a new migration and **review it before running it**:
```bash
uv run alembic revision --autogenerate -m "short description"
uv run alembic upgrade head
```

### Run the app
```bash
uv run fastapi dev src/backend/main.py
```
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Run tests and checks
```bash
uv run pytest
uv run ruff check
uv run ruff format --check
```

The course tests start a temporary PostgreSQL with Testcontainers,
so Docker must be running.

## Status
Health endpoint with database check (see #3, #4).


