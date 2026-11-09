# Backend

The API of StudyMind. It handles users, courses and documents, extracts
text from PDFs, creates embeddings, and answers questions using the
uploaded material (RAG).

## Tech stack
- Python 3.12 with FastAPI, managed with uv
- PostgreSQL with pgvector
- Gemini API for embeddings and answers
- pytest and Ruff for tests and linting

## Status
Not set up yet (see SM-3).

## Development

All commands run from the `backend/` folder.

### Install dependencies
```bash
uv sync
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

## Status
Basic app with a health endpoint (see #3).