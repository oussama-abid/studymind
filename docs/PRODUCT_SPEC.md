# StudyMind – Product Spec

## Vision
An AI study assistant that answers questions, summarizes and quizzes
students using only their own course material, always with sources.

## Target user
University students with lecture slides and scripts as PDFs who are
preparing for exams.

## Problem
Searching long PDFs by hand is slow. General chatbots don't know the
student's material and may invent answers.

## MVP scope (v1.0)
1. Sign up and log in
2. Create courses and upload PDFs to a course
3. Chat with a course: answers based only on the uploaded material,
   with citations (document and page)
4. If the answer is not in the material, the app says so
5. Summary of a single document
6. Quiz generator: multiple-choice questions from a document,
   with explanations and source pages

## Later (v1.1+)
- Flashcards generated from key terms
- Progress tracking per course
- Exam mode (timed quiz across all lectures)
- Ask in German about English material and vice versa

## Out of scope
Sharing courses with other users, mobile app, payments.

## Non-functional requirements
- Runs locally with one command: `docker compose up`
- Every feature has tests; CI must pass before merging
- No secrets or API keys in the repository
- Answers start streaming within 3 seconds

## Success metric
On a fixed test set of 30 questions, at least 80% are answered
correctly with the right source (measured by an evaluation script).

## Architecture
React frontend (Vite, TypeScript) → FastAPI backend → PostgreSQL + pgvector,
with the Gemini API for embeddings and answers.
All services run as Docker containers.

See `docs/adr/` for the reasons behind these choices
(001: monorepo, 002: React with Vite instead of Next.js).