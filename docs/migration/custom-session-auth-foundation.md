# Phase 5C Custom Session Auth Foundation

Date: 2026-05-13.

## Purpose

Phase 5C defines the custom session-auth foundation before runtime implementation. It is planning and contract work only.

This phase does not implement login, logout, session APIs, route guards, AppLayout integration, Supabase removal, local storage, API migration to Drizzle, or workflow behavior changes. The application runtime remains Supabase-backed until a later controlled auth switch.

No database rows are created by this phase. In particular, `auth.sessions` must remain empty unless a later implementation/test phase creates sessions intentionally.

## Current Baseline

The local PostgreSQL foundation already exists with `auth`, `master`, `dokumen`, `arsip`, and `app` schemas. The reviewed initial Drizzle migration has been applied locally, and the controlled development user seed has run.

Current expected local seed state:

- `auth.roles`: 5 canonical roles.
- `auth.users`: 5 local development users.
- `auth.user_roles`: 8 joins.
- `auth.sessions`: 0 rows.
- Workflow and archive transaction tables remain empty.

Runtime baseline:

- `src/routes/login.tsx` still signs in with Supabase browser auth.
- `src/components/layout/AppLayout.tsx` still bootstraps auth with Supabase browser session/user APIs.
- Server/API auth helpers still verify Supabase sessions through `src/lib/auth.ts`.
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, and `/api/auth/role-switch` still use Supabase-backed behavior.
- The active role cookie is still `dms_active_role`.

## Session Cookie Design

Selected future session cookie:

```text
dms_session
```

Existing active role cookie remains:

```text
dms_active_role
```

`dms_session` rules:

- Contains only an opaque raw session token.
- `HttpOnly`.
- `Secure` in production or whenever served over HTTPS.
- `SameSite=Lax` by default.
- `Path=/`.
- No user id, email, role, expiry, or other readable claims.
- Never stored in `localStorage` or `sessionStorage`.
- Never exposed to client JavaScript.

`dms_active_role` rules:

- Remains readable by client code for role-switch UX compatibility.
- Uses `Path=/` and `SameSite=Lax`.
- Keeps the existing 30-day UX persistence unless a later compatibility task changes it.
- Is never authorization proof. Server code must validate it against the authenticated user's assigned roles.

## Session Token Strategy

Future session tokens should be generated using cryptographically secure random bytes.

Recommended generation and storage:

- Generate a high-entropy opaque token with Node `crypto.randomBytes`.
- Encode the raw token as base64url for cookie transport.
- Send the raw token only to the browser as the `dms_session` cookie.
- Store only a hash of the token in `auth.sessions.token_hash`.
- Use SHA-256 over the raw token value, encoded as base64url, for `token_hash`.
- Never store plaintext tokens in PostgreSQL.
- Never log raw tokens or token hashes.

Request validation should hash the cookie token and perform an indexed lookup by `token_hash`. Because lookup uses a deterministic hash, direct raw-token comparison should not be needed for the normal request path. If any future code compares secret values directly, use constant-time comparison patterns and avoid surrounding timing leaks.

SHA-256 is selected only for session token hashing, not password hashing. Passwords remain Argon2id via `src/lib/auth/password.ts`.

## Session Expiry Strategy

Selected future defaults:

- Standard session expiry: 8 hours.
- Remember-me session expiry: 30 days.

Implementation rules:

- `auth.sessions.expires_at` is authoritative.
- Expired sessions are rejected server-side.
- `auth.sessions.revoked_at` rejects explicitly invalidated sessions.
- `auth.sessions.remember_me` records whether the longer duration was selected.
- Later cleanup can delete expired or revoked rows after the rejection behavior is implemented.
- `last_used_at` may be updated by future repository code, but runtime implementation should avoid excessive write amplification if every request touches it.

## Future Helper Contract

These helpers are planned for later phases and are not implemented by Phase 5C.

Recommended helper/repository split:

```ts
type CreateSessionOptions = {
  rememberMe?: boolean
  userAgent?: string | null
  ipAddress?: string | null
}

type CurrentSession = {
  sessionId: string
  user: {
    id: string
    email: string
    displayName?: string | null
    userName?: string | null
    isActive: boolean
  }
  roles: RoleName[]
  activeRole: RoleName
  expiresAt: Date
}

createSession(userId: string, options?: CreateSessionOptions): Promise<{ rawToken: string; expiresAt: Date }>
hashSessionToken(token: string): string
verifySessionToken(rawToken: string): Promise<CurrentSession | null>
getCurrentSession(request: Request): Promise<CurrentSession | null>
requireUser(request: Request): Promise<CurrentSession>
requireRole(request: Request, allowedRoles: RoleName[]): Promise<CurrentSession>
destroySession(rawToken: string): Promise<void>
destroyAllUserSessions(userId: string): Promise<void>
rotateSessionToken(rawToken: string): Promise<{ rawToken: string; expiresAt: Date } | null>
```

Recommended phase ownership:

- Phase 5D: isolated token utility, cookie constants, and session repository foundation.
- Phase 5E: login/logout/session API implementation behind compatibility boundaries.
- Phase 5F: AppLayout/auth-state integration or controlled runtime switch.

`rotateSessionToken` is recommended after sensitive account events, but it can be deferred until the first runtime implementation has stable login/logout/session behavior.

## Login Flow Plan

Future custom login should preserve the existing endpoint path where server login is used:

```text
POST /api/auth/login
```

Future behavior:

- Parse JSON safely.
- Validate email/password with the existing Zod login schema or a compatible schema.
- Normalize email consistently before lookup.
- Find the user in local `auth.users` by email.
- Verify password with `src/lib/auth/password.ts`.
- Reject inactive users based on `auth.users.is_active`.
- Avoid returning overly specific auth failure reasons for credential failures.
- Load roles from `auth.user_roles` joined to `auth.roles`.
- Enforce ADMIN exclusivity in service/admin mutation logic before runtime relies on roles.
- Create an `auth.sessions` row with only `token_hash`.
- Set the `dms_session` `HttpOnly` cookie.
- Initialize `dms_active_role` compatibly to `getPrimaryRole(roles)` unless a valid existing role is intentionally preserved.
- Return the same shape currently expected by the server login route:

```ts
{
  user: {
    id: string
    email: string
    userName?: string
  }
  roles: RoleName[]
  activeRole: RoleName
}
```

The current UI login page still bypasses `/api/auth/login` and uses Supabase browser auth directly. Rewiring it is a later runtime phase.

## Logout Flow Plan

Future custom logout should preserve:

```text
POST /api/auth/logout
```

Future behavior:

- Read `dms_session`.
- Hash token and revoke/delete only the current session.
- Clear `dms_session`.
- Clear `dms_active_role` to preserve current logout cleanup behavior.
- Return the current compatible response shape:

```ts
{ success: true }
```

Logout should not revoke all user sessions unless a later explicit policy change requires it.

## Current-User Flow Plan

Future session bootstrap should preserve:

```text
GET /api/auth/session
```

Future behavior:

- Read `dms_session`.
- Hash the raw token and look up `auth.sessions.token_hash`.
- Reject missing, expired, revoked, or unknown sessions.
- Join `auth.users`, `auth.user_roles`, and `auth.roles`.
- Reject inactive users even if their session row is still present.
- Validate `dms_active_role` against assigned roles.
- Fall back to primary role when the active-role cookie is missing or invalid.
- Return a shape compatible with current `/api/auth/session`:

```ts
{
  session: {
    userId: string
    email: string
    userName?: string
  } | null
  roles: RoleName[]
  activeRole: RoleName | null
}
```

The active role cookie is input to UX state only. It must never authorize a privileged action without role membership verification.

## RBAC And Active Role Rules

Server/API authorization is the source of truth. Client-side route hiding, sidebar menus, and role switcher state are UX only.

Rules:

- Roles remain `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`.
- A user may have multiple non-admin roles.
- `ADMIN` remains dedicated and must not be combined with non-admin roles.
- `dms_active_role` must be one of the authenticated user's assigned roles.
- Invalid or missing active-role cookie falls back to primary role.
- Role switch continues to reject ADMIN switching.
- API routes must use server-side `requireUser` or `requireRole` style helpers after migration.
- Direct API access with no session should return 401.
- Direct API access with the wrong role should return 403.

## Session Invalidation Policy

Recommended policy:

- Logout revokes the current session only.
- Password change revokes all other sessions, then rotates the current session if supported.
- If rotation is not implemented when password change ships, revoke all sessions and require re-login.
- Admin password reset revokes all sessions for the target user.
- User deactivation causes all future session validation to reject that user immediately.
- A later cleanup job can delete expired/revoked sessions.

Open policy items:

- Whether password change should always revoke all sessions instead of preserving a rotated current session.
- Whether admin deactivation should eagerly revoke rows immediately or rely first on `is_active` rejection plus cleanup.
- Exact session cleanup schedule.

## Security And Logging Rules

Rules for runtime implementation:

- Never log raw session tokens.
- Never log password hashes.
- Never log plaintext passwords.
- Never print full `DATABASE_URL`.
- Never expose `dms_session` to client JavaScript.
- Avoid credential failure messages that reveal whether an email exists.
- Keep password hashing on Argon2id; do not use SHA-256 for passwords.
- Apply Zod validation at auth API boundaries.
- Ensure cookie-auth CSRF risk is addressed before runtime implementation.
- Add rate limiting or brute-force mitigation before production use, even if omitted from the first local runtime slice.

CSRF note:

`SameSite=Lax` reduces common cross-site request risk, but state-changing API routes using cookie auth still need an explicit CSRF decision before production. Candidate approaches include same-origin checks, Origin/Referer validation, and CSRF tokens for sensitive POST routes.

## Migration Phasing

Recommended next auth subphases:

- Phase 5D: Session Token Utility And Repository Foundation.
- Phase 5E: Login/Logout/Session API Compatibility Implementation.
- Phase 5F: AppLayout/Auth-State Integration Or Controlled Runtime Switch.
- Phase 5G: Auth Regression Tests And Supabase Auth Runtime Retirement Plan.

These phases should stay narrow. Do not combine login runtime wiring with broad API migration or storage replacement.

## Phase 5D Implementation Note

Phase 5D added isolated server-only session constants, a pure session token utility, and a Drizzle session repository foundation for `auth.sessions`.

These files are not wired into login, logout, `/api/auth/session`, role switching, `AppLayout`, `auth-state`, or any current runtime API/UI path. Supabase-backed auth remains the active runtime, and login/logout/session implementation remains future Phase 5E work.

## Phase 5E Implementation Note

Phase 5E implemented local custom-auth compatibility behind the existing `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/session` endpoint paths.

The implementation uses local `auth.users`, `auth.roles`, `auth.user_roles`, Argon2id password verification, opaque session-token generation, SHA-256 session-token hashes, and the Phase 5D `auth.sessions` repository. Login creates session rows; logout revokes only the current matching session; session bootstrap validates the `dms_session` cookie and returns the existing `{ session, roles, activeRole }` shape.

`AppLayout`, `src/routes/login.tsx`, and `src/lib/auth-state.ts` were intentionally not modified. The primary browser runtime still uses Supabase-backed auth until Phase 5F performs the controlled client integration/runtime switch.

`/api/auth/role-switch` was intentionally left Supabase-backed. It is a Phase 5E.1 or Phase 5F blocker before fully switching the runtime to local custom sessions.

## Verification Plan

Future implementation checks:

- Token generation produces high-entropy base64url tokens.
- `hashSessionToken` is deterministic and never returns the raw token.
- Session token hashes are unique and indexed.
- Expired sessions are rejected.
- Revoked sessions are rejected.
- Missing, malformed, and unknown cookies return unauthenticated responses.
- Login success returns the compatible user/roles/activeRole shape.
- Login failure avoids over-specific credential messages.
- Inactive users cannot log in.
- Inactive users with existing sessions are rejected.
- Logout revokes only the current session and clears cookies.
- Role loading matches `auth.user_roles` and `auth.roles`.
- `dms_active_role` is accepted only when assigned to the user.
- ADMIN role switching remains rejected.
- No API response shape regression for `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, and `/api/auth/role-switch`.

Phase 5C itself is docs-only. Validation for this phase should be limited to doc diff checks unless an isolated type-only contract is added.
