# 006: Authentication with Argon2 password hashes and JWT access tokens

## Status
Accepted

## Context
StudyMind needs accounts before it can go online: each student must only see
their own courses and documents. We could use an external auth service
(Auth0, Clerk, Supabase) or implement login in our FastAPI backend.

## Decision
- **Own implementation** in FastAPI: register, login, and a `CurrentUserDep`
  dependency that protects endpoints.
- **Passwords** are hashed with **Argon2** (`pwdlib`, recommended settings:
  64 MB memory, 3 passes). It is deliberately slow and memory-hard, so a
  stolen database is very expensive to brute-force. Plain passwords are never
  stored, logged or returned.
- **Sessions** use a signed **JWT** (HS256) with the user id (`sub`) and an
  expiry (`exp`, 60 minutes by default). The client sends it as
  `Authorization: Bearer <token>`. The signing secret comes from the
  environment (`JWT_SECRET_KEY`), never from the code.
- **No information leaks:** login answers "Invalid email or password" for
  both an unknown email and a wrong password, and protected endpoints answer
  401 "Not logged in" for every invalid-token case.
- The server accepts only HS256 when reading tokens, so a token cannot choose
  a weaker algorithm.

## Consequences
Positive:
- Full control and no vendor dependency; every step is tested
- JWTs are checked without a database lookup for the session itself
- One dependency (`CurrentUserDep`) protects any endpoint

Negative:
- A JWT cannot be revoked before it expires: a stolen token works for up
  to 60 minutes. Mitigated by the short expiry; refresh tokens or a
  revocation list can come later.
- No email verification or password reset yet (backlog)
- Leaking `JWT_SECRET_KEY` would let anyone sign tokens: it must be rotated
  if exposed