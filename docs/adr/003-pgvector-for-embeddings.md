# 003: Store embeddings in PostgreSQL with pgvector

## Status
Accepted

## Context
StudyMind turns every chunk of a lecture into an embedding (768 numbers)
and later searches for the chunks closest to a student's question. We
needed a place to store and search these vectors. The options were a
dedicated vector database (for example Pinecone, Qdrant or Chroma) or
PostgreSQL, which we already use, with the pgvector extension.

## Decision
We store embeddings in PostgreSQL in a `Vector(768)` column on the
`chunks` table, using pgvector. Embeddings come from Gemini
(`gemini-embedding-001`, reduced to 768 dimensions). The dimension is
defined once in `models.py` (`EMBEDDING_DIMENSIONS`).

## Consequences
Positive:
- One database for everything: a chunk, its page number, its document
  and its vector live in the same row and are deleted together (cascade)
- No extra service to run, pay for or secure; works in Docker Compose,
  CI (Testcontainers) and production the same way
- Search results can be filtered with normal SQL (for example only the
  chunks of one course)

Negative:
- A dedicated vector database scales better for millions of vectors.
  For a study assistant with thousands of chunks per student, PostgreSQL
  is more than enough.
- Changing the dimension later needs a migration and re-embedding all
  existing chunks, because vectors of different sizes cannot be compared.