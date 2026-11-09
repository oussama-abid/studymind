# 002: Use React with Vite instead of Next.js

## Status
Accepted

## Context
The product spec planned a Next.js frontend. Next.js is a full-stack
framework: it includes its own server, API routes and server-side
rendering. StudyMind already has a separate FastAPI backend that
handles the API, the database and the AI features. With Next.js, we
would run two servers and use only the frontend half of the framework.

The alternative is a plain React app built with Vite: a frontend that
runs in the browser and talks to the FastAPI backend over HTTP.

## Decision
We build the frontend as a React single-page app with Vite and
TypeScript. It calls the FastAPI backend for all data.

## Consequences
Positive:
- Clear separation: React handles the UI, FastAPI handles everything else
- Simpler setup with fewer concepts than Next.js
- The built frontend is just static files, easy to host anywhere

Negative:
- No server-side rendering. This mainly matters for SEO on public
  pages; StudyMind is used behind a login, so we don't need it.
- Frontend and backend run on different origins, so the backend must
  allow the frontend via CORS (configured with `CORS_ORIGINS`).
- Routing between pages is not built in; we will add React Router
  when we need more than one page.