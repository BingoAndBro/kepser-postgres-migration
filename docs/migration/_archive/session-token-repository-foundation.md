# Phase 5D Session Token Utility And Repository Foundation

Date: 2026-05-13.

## Purpose

Phase 5D adds isolated server-only building blocks for the future custom session auth runtime. It does not wire those blocks into login, logout, session bootstrap, role switching, route guards, UI, storage, workflow, or API migration.

The application runtime remains Supabase-backed after this phase.

## Files Added

- `src/lib/auth/session-constants.ts`
- `src/lib/auth/session-token.ts`
- `src/lib/auth/session-repository.ts`
- `tests/unit/auth/session-token.test.ts`

## Token Generation Strategy

`generateSessionToken()` uses Node `crypto.randomBytes()` with `SESSION_TOKEN_BYTES = 32`, then encodes the opaque random bytes as base64url.

The raw token:

- contains no user id, email, role, expiry, or claims
- is not a JWT
- is intended to live only in the future `dms_session` cookie and request memory
- is never logged by the utility

## Token Hash Strategy

`hashSessionToken(rawToken)` hashes the raw token string with SHA-256 and encodes the digest as base64url for storage in `auth.sessions.token_hash`.

SHA-256 is used only for high-entropy session tokens. Passwords remain Argon2id through `src/lib/auth/password.ts`; SHA-256 must never be used for password storage.

The token utility rejects empty or whitespace-only token input and never logs the raw token or token hash.

The shape helpers `isLikelySessionToken()` and `isLikelySessionTokenHash()` perform only non-secret format checks. They are not authorization checks.

## Session Constants

The isolated constants module defines:

- `SESSION_COOKIE_NAME = 'dms_session'`
- `ACTIVE_ROLE_COOKIE_NAME = 'dms_active_role'`
- `SESSION_TOKEN_BYTES = 32`
- `SESSION_TOKEN_HASH_ALGORITHM = 'sha256'`
- `SESSION_DURATION_SECONDS = 8 * 60 * 60`
- `REMEMBER_ME_DURATION_SECONDS = 30 * 24 * 60 * 60`

Cookie option helpers were not added in this phase because no runtime cookie writing was implemented.

## Repository Function Summary

`src/lib/auth/session-repository.ts` is server-only and imports the local Drizzle client plus existing `auth` schema tables.

It provides:

- `createSessionRecord(input)`
- `findSessionByTokenHash(tokenHash)`
- `revokeSessionByTokenHash(tokenHash)`
- `revokeAllUserSessions(userId)`
- `touchSessionLastUsedAt(sessionId)`
- `deleteExpiredOrRevokedSessions(now?)`

Repository behavior follows the Phase 5C contract:

- stores only `token_hash`
- returns `null` for missing or malformed token hash lookup input
- rejects expired sessions during lookup
- rejects revoked sessions during lookup
- rejects inactive users during lookup
- returns assigned canonical role names from `auth.user_roles` joined to `auth.roles`
- updates `last_used_at` only when explicitly called

The repository is not called by runtime code in this phase, so `auth.sessions` remains untouched unless a future phase imports and executes these functions.

## Non-Goals

Phase 5D does not implement:

- login API runtime
- logout API runtime
- `/api/auth/session` runtime
- role-switch runtime
- AppLayout/auth-state integration
- Supabase Auth removal
- route guards
- CSRF protection
- rate limiting
- storage replacement
- API migration to Drizzle
- workflow/FSM behavior changes
- seeded sessions

## Mapping To Phase 5C

Phase 5C selected:

- session cookie name: `dms_session`
- active role cookie name: `dms_active_role`
- raw token only in cookie/request memory
- DB stores only SHA-256 base64url token hash
- default expiry: 8 hours
- remember-me expiry: 30 days
- active role cookie is UX state only

Phase 5D implements the reusable constants, token generation/hash helper, token shape checks, and Drizzle repository foundation for that contract. Runtime usage remains future work.

## Risks And Open Items For Phase 5E

- Login/logout/session API migration was implemented in Phase 5E for the existing `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session` endpoint paths.
- Exact CSRF and rate-limiting strategy remains open.
- Active role validation and fallback behavior is implemented for `/api/auth/session`; role-switch and non-auth authorization boundaries remain later work.
- Exact session invalidation policy for password change/deactivation remains open.
- Repository functions need runtime/API tests once they are wired into custom auth.
- `AppLayout` still depends on Supabase browser auth until a controlled runtime switch.

## Phase 5E Usage Note

The repository is now used by the local auth compatibility APIs:

- login creates `auth.sessions` rows through `createSessionRecord`
- logout revokes the current session through `revokeSessionByTokenHash`
- session bootstrap reads through `findSessionByTokenHash`

It is still not used by non-auth APIs, `/api/auth/role-switch`, `AppLayout`, `src/routes/login.tsx`, or `src/lib/auth-state.ts`.

## Validation Run

Phase 5D validation used only narrow non-DB checks:

- `pnpm test tests/unit/auth/session-token.test.ts`
- `git diff --check`

No DB migration, DB generation, seed, password hash helper, build, dev server, full test suite, or full typecheck was run.
