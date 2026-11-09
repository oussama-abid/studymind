# 001: Use a monorepo for frontend and backend

## Status
Accepted

## Context
StudyMind has a Next.js frontend and a FastAPI backend. Most features
change both parts at the same time (for example a new field in the API
and in the UI). We needed to decide whether to keep them in one
repository or in separate ones.

*Note: the frontend was later changed to React with Vite (see ADR 002).
This decision (monorepo) is not affected.*

## Decision
Frontend, backend, documentation and Docker configuration live in one
repository, in the folders frontend/, backend/ and docs/.

## Consequences
Positive:
- A feature that touches frontend and backend is one branch and one PR
- One clone and one `docker compose up` start the whole system
- One place for documentation and CI

Negative:
- CI may run all tests even if only one part changed.
  We will use path filters in GitHub Actions to avoid this.
- If the project grows into several teams, splitting the repository
  may become necessary later.