# ADR 008: Groq for answers, Gemini for embeddings

## Status
Accepted. Changes the answer model from ADR 005; everything else in
ADR 005 stays.

## Context
On 19.11.2026, `gemini-3.5-flash` was so overloaded that answers failed
with `504 DEADLINE_EXCEEDED`: even a "Say hi" request took 43 s (from the
server and from a laptop), so students only saw "The AI is busy right now".
Embeddings were not affected; uploads always became ready.

Measured the same day with "Say hi":

| Model | Time |
|---|---|
| gemini-3.5-flash | failed after 60 s |
| gemini-3.5-flash-lite | 14.3 s |
| gemini-3.1-flash-lite | 17.9 s |
| Groq `openai/gpt-oss-120b` | 0.6 s |

## Decision
- **Answers:** Groq with `openai/gpt-oss-120b`, `reasoning_effort="low"`,
  temperature 0.2, the same system prompt, and the same `{found, answer}`
  shape as a **strict** JSON schema.
- **Embeddings stay on Gemini** (`gemini-embedding-001`). Vectors are only
  comparable within one model, so changing it would mean embedding every
  document again, and embeddings worked reliably.
- The rules go in a `system` message, the excerpts and the question in a
  `user` message, so text inside documents is never treated as instructions.
- Errors from both providers (Gemini when embedding the question, Groq when
  answering) return 503 with the same friendly message.
- One retry and a 30 s timeout, as before: a student is waiting.

## Alternatives considered
- **Gemini Flash Lite:** worked, but took 14–18 s on the same day.
- **Cerebras:** also very fast, but needs a credit card, and the free credit
  expires after 30 days.
- **Mistral:** free requests may be used for training, so students' lecture
  notes would be too.

## Consequences
- Answers in under a second instead of failing.
- Two AI providers, so two API keys and two sets of limits.
- Groq's free tier allows about 8,000 tokens per minute for the whole app,
  and one question uses about 2,000–3,000. Several students asking at the
  same moment can hit `429`, which the app shows as "busy".
- If Groq is down, chat is down; a fallback to Gemini would be a next step.