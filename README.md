# StudyMind

An AI study assistant that answers questions, summarizes and quizzes
students using only their own course material, always with sources.

## Tech stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL with pgvector
- **Infrastructure:** Docker, Docker Compose

## Quick start

Requirements: Docker and Docker Compose.

```bash
git clone git@github.com:oussama-abid/studymind.git
cd studymind
cp .env.example .env   # then set your own password
docker compose up --build
```

Then open:
- App: http://localhost:5173
- API docs: http://localhost:8000/docs

## Project structure
```
frontend/   React app (see frontend/README.md)
backend/    FastAPI app (see backend/README.md)
docs/       Product spec and architecture decisions (ADRs)
```

## Development
To run frontend or backend outside Docker (with hot reload),
see the README in each folder.