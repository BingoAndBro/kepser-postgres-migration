# Phase 5H Local Server Auth Helper Compatibility Bridge

Date: 2026-05-14.

## Purpose

Phase 5H adds a narrow server-only helper bridge so future non-auth API migrations can validate the local `dms_session` cookie consistently.

This phase is helper-only. It does not migrate document, master-data, archive, workflow, upload, preview, download, or mutation APIs. Existing endpoint paths, request payloads, response shapes, UI behavior, active-role UX, workflow/FSM behavior, and storage behavior remain unchanged.

## Files Added Or Changed

Added:

- `src/lib/auth/local-server-auth.ts`
- `docs/migration/local-server-auth-helper-bridge.md`

Modified:

- `docs/migration/auth-regression-and-retirement-plan.md`
- `docs/migration/open-decisions.md`

No proof route was migrated.

## Helper API Summary

`src/lib/auth/local-server-auth.ts` is server-only and must not be imported from client components, `AppLayout`, `/login`, or `src/lib/auth-state.ts`.

Exports:

- `getLocalServerSession(request)` returns `LocalServerSession | null`.
- `requireLocalServerSession(request)` returns `LocalServerSession` or throws a 401 `Response`.
- `hasLocalRole(session, role)` checks one assigned role.
- `hasAnyLocalRole(session, roles)` checks any assigned role from a list.
- `requireLocalRole(request, role)` returns a session or throws a 401/403 `Response`.
- `requireAnyLocalRole(request, roles)` returns a session or throws a 401/403 `Response`.
- `getLocalActiveRole(request, session)` resolves the effective active role from the current request cookies and validated session roles.
- `createUnauthorizedResponse(message?)` returns status 401 JSON.
- `createForbiddenResponse(message?)` returns status 403 JSON.

The module uses existing Phase 5D/5E helpers:

- `SESSION_COOKIE_NAME`
- `getCookieValue`
- `getActiveRoleCookieValue`
- `hashSessionToken`
- `findSessionByTokenHash`
- `validateAssignedRoles`
- `resolveActiveRole`

It does not import legacy `#/lib/auth`, does not create a Supabase server client, does not log raw session tokens, and does not expose token hashes.

## LocalServerSession Shape

```ts
type LocalServerSession = {
  user: {
    id: string
    email: string
    userName?: string
  }
  userId: string
  email: string
  roles: RoleName[]
  activeRole: RoleName
  sessionId: string
}
```

The duplicate top-level `userId` and `email` fields are intentional convenience fields for route migrations that currently read `session.user.id` and `session.user.email` from Supabase sessions. Prefer `session.user.id` when preserving legacy route shape closely.

## Error Response Conventions

Default helpers return:

```ts
createUnauthorizedResponse() // 401 { error: 'Not authenticated' }
createForbiddenResponse() // 403 { error: 'Forbidden' }
```

Many legacy non-auth routes currently return `401 { error: 'Unauthorized' }` and custom Indonesian 403 messages such as `Akses ditolak`. When migrating a route, preserve that route's existing response body if the UI or tests depend on it:

```ts
const session = await getLocalServerSession(request)
if (!session) {
  return createUnauthorizedResponse('Unauthorized')
}

if (!hasLocalRole(session, 'PPK')) {
  return createForbiddenResponse('Akses ditolak - bukan PPK')
}
```

Use the `require*` helpers only when the route is written to catch thrown `Response` objects:

```ts
try {
  const session = await requireLocalRole(request, 'ADMIN')
  // existing route work
} catch (error) {
  if (error instanceof Response) return error
  throw error
}
```

For most first-pass migrations, the nullable `getLocalServerSession` pattern is clearer and preserves current route style.

## Active Role Rules

`dms_active_role` remains UX state only.

Server authorization must validate assigned roles from the session record. The helper reads `dms_active_role`, accepts it only when it belongs to `session.roles`, and falls back through `resolveActiveRole` when the cookie is missing or invalid.

Routes that require a specific capability should check `session.roles`, not only `session.activeRole`. A route should check `session.activeRole` only when its existing behavior explicitly depends on current active-role UX state.

## Route Migration Guide

Legacy Supabase pattern:

```ts
const supabase = createClient(request)
const session = await getServerSession(supabase)

if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Local bridge pattern:

```ts
const session = await getLocalServerSession(request)

if (!session) {
  return createUnauthorizedResponse('Unauthorized')
}
```

Legacy role query pattern:

```ts
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('role:roles(nama)')
  .eq('user_id', session.user.id)

const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
if (!roleNames.includes('PPK')) {
  return Response.json({ error: 'Akses ditolak' }, { status: 403 })
}
```

Local bridge role pattern:

```ts
if (!hasLocalRole(session, 'PPK')) {
  return createForbiddenResponse('Akses ditolak')
}
```

Do not migrate Supabase data reads in the same edit unless the phase explicitly allows it. A first endpoint migration can replace only the authorization block and leave existing data query internals untouched when that is the intended scope.

## Proof Route Status

No proof route was migrated in Phase 5H.

Reason: the candidate `/api/users/me/ketua-tim` depends on a Supabase RPC and would require a local Drizzle query replacement to preserve response shape. That belongs with the first low-risk read-only API migration rather than this helper bridge.

## Known Limitations

- Non-auth APIs still generally use legacy `getServerSession`, `hasRole`, `createServerSupabaseClient`, and Supabase data queries.
- The helper depends on the local Drizzle session repository, so DB-backed session validation is not unit-tested here without a local DB test convention.
- Supabase Auth Admin user management remains unmigrated.
- Storage, upload, preview, download, archive lifecycle, and workflow mutations remain Supabase-backed.
- CSRF and rate limiting are still open production-hardening items.

## Next Recommended Route Migration Order

1. Migrate low-risk current-user support reads such as `/api/users/me` and Ketua Tim support endpoints, preserving response shapes.
2. Migrate role-support and profile reads that unblock `AppLayout` and navigation after local login.
3. Migrate read-only domain lists by role: Pegawai, PPK, Bendahara, Arsiparis, then Admin/master data.
4. Migrate read-only detail/report endpoints after list response parity is established.
5. Migrate mutations only after read parity and storage compatibility are stable.

Avoid upload, preview/download, submit, approve/reject, archive mutation, admin user mutation, and master-data mutation routes until their planned phases.

## Validation Run

Focused auth helper tests:

```powershell
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

Result: first sandboxed run failed during Vitest config loading with `spawn EPERM` from esbuild. The same focused command passed after rerunning the test process outside the sandbox: 3 test files passed, 17 tests passed.

Whitespace check:

```powershell
git diff --check
```

Result: passed, with Git CRLF conversion warnings for modified docs only.

Grep/audit checks:

```powershell
git grep --untracked "from '#/lib/auth/local-server-auth'" src/components src/routes/login.tsx src/lib/auth-state.ts
git grep --untracked "dms_session" src/components src/routes/login.tsx src/lib/auth-state.ts
git grep --untracked "from '#/lib/auth'" src/lib/auth/local-server-auth.ts
git grep --untracked "createServerSupabaseClient" src/lib/auth/local-server-auth.ts
```

Result: no matches. Exit code 1 is expected for these no-match grep checks.

Additional checks:

- `src/routeTree.gen.ts` diff was empty.
- Final changed files were limited to the new helper module and migration docs.
