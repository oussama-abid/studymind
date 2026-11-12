# 004: Process uploads in the background with FastAPI BackgroundTasks

## Status
Accepted

## Context
After upload, a PDF is split into chunks and every chunk is embedded
with Gemini. The Gemini free tier allows about 100 embedded texts per
minute, so a 240-chunk book takes several minutes. Doing this inside the
upload request would keep the student waiting, and browsers or proxies
often cancel requests after 1-2 minutes.

## Decision
The upload saves the file and responds immediately with status
`processing`. Processing then runs with FastAPI's `BackgroundTasks` in
its own database session. Gemini requests are sent in batches of 100,
and the SDK retries on 429/500/503 with exponential backoff (5 attempts,
30-60 seconds apart). The document ends as `ready` or `failed` with a
clear message; an unexpected error also ends as `failed`, never stuck in
`processing`.

## Consequences
Positive:
- Fast upload response, independent of PDF size and Gemini speed
- No new infrastructure: BackgroundTasks is built into FastAPI
- Rate limits are handled by waiting instead of failing

Negative:
- Jobs run inside the API process. If the server restarts during
  processing, the job is lost and the document stays `processing`.
- No job queue: many uploads at the same time compete for the same
  Gemini quota.
- When this becomes a problem, we will move to a real job queue (for
  example Celery, RQ or arq with Redis), which survives restarts and
  can limit how many jobs run at once.