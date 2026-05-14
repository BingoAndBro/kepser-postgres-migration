# Phase 5J Current User Profile API Local Auth Migration

Date: 2026-05-14.

## Purpose

Phase 5J migrates only `GET /api/users/me` from legacy Supabase session authorization to local `dms_session` authorization while preserving the endpoint path, method, request shape, response shape, and UI behavior.

This phase does not migrate password change, user-management/Auth Admin behavior, document/workflow APIs, storage APIs, archive APIs, mutations, schema, seeds, or route generation.

## Endpoint Inspected

- `GET /api/users/me`

Related support endpoints checked for migration pattern consistency:

- `GET /api/users/me/ketua-tim`
- `GET /api/users/me/is-ketua-tim/$kegiatanId`

## Callers Inspected

- `src/routes/profile.tsx`
- `src/routes/pegawai/laporan/kegiatan.tsx`
- `src/routes/pegawai/laporan/saya.tsx`
- `src/components/layout/AppLayout.tsx`
- `tests/e2e/spec-06-user-management.spec.ts`
- `git grep "/api/users/me" src`
- docs/tests references found through targeted `rg`

Observed runtime callers:

- `/profile` fetches `/api/users/me/` and uses `user.id`, `user.email`, `user.metadata.nama_lengkap`, `user.metadata.nip_nrp`, `user.metadata.departemen`, and `user.roles`.
- `/pegawai/laporan/kegiatan` fetches `/api/users/me` and uses only `user.id`.
- `AppLayout` calls `/api/users/me/ketua-tim`, not the broad profile endpoint.

## Migration Status

Migrated.

`GET /api/users/me` now validates the local `dms_session` cookie through `getLocalServerSession(request)` from `src/lib/auth/local-server-auth.ts` and reads profile fields from local Drizzle `auth.users`.

## Response Shape Before

Successful response:

```ts
{
  user: {
    id: string
    email: string
    metadata: {
      nama_lengkap?: string
      nip_nrp?: string
      departemen?: string
    }
    roles: RoleName[]
  }
}
```

Unauthorized response:

```ts
401 { error: 'Unauthorized' }
```

## Response Shape After

The successful and unauthorized response shapes are intentionally unchanged:

```ts
{
  user: {
    id: string
    email: string
    metadata: {
      nama_lengkap?: string
      nip_nrp?: string
      departemen?: string
    }
    roles: RoleName[]
  }
}
```

```ts
401 { error: 'Unauthorized' }
```

No `activeRole`, `userName`, status fields, timestamps, or password/auth-admin fields were added.

## Auth Migration Pattern

Legacy pattern removed from `src/routes/api/users/me.ts`:

- `createServerSupabaseClient`
- `getServerSession`
- `getUserRole`
- Supabase Auth user metadata access

Replacement pattern:

```ts
const session = await getLocalServerSession(request)
if (!session) {
  return createUnauthorizedResponse('Unauthorized')
}
```

The readable `dms_active_role` cookie is not used as authorization proof.

## Local Data Mapping

Local auth/session source:

- `session.user.id` -> response `user.id`
- `session.user.email` -> response `user.email`
- `session.roles` -> response `user.roles`

Local Drizzle profile source:

- `auth.users.nama_lengkap` -> response `user.metadata.nama_lengkap`
- `auth.users.nip_nrp` -> response `user.metadata.nip_nrp`
- `auth.users.departemen` -> response `user.metadata.departemen`

The route still uses the existing `parseUserMetadata` and `parseUserProfileResponse` helpers so empty/null metadata behavior remains compatible with the old Supabase metadata parser.

## Blockers

No blocker for this endpoint. The old response shape only required identity, profile metadata, and roles, and the local schema has clear equivalents for all returned fields.

Still blocked or out of scope:

- `POST /api/users/me/change-password`
- user-management/Auth Admin endpoints
- report/domain APIs that still use Supabase Auth Admin enrichment
- broad non-auth API authorization migration

## Validation Run

Initial status:

```powershell
git status --short --branch
```

Result:

```text
## migration/postgres-local
```

Focused auth helper tests:

```powershell
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

Result: first sandboxed attempt failed while Vitest/esbuild loaded config with `spawn EPERM`. The same focused command passed after rerunning the test process outside the sandbox: 3 test files passed, 17 tests passed.

Whitespace check:

```powershell
git diff --check
```

Result: passed, with Git CRLF conversion warnings only.

Grep/audit checks:

```powershell
git grep --untracked "getServerSession" src/routes/api/users/me.ts
git grep --untracked "createServerSupabaseClient" src/routes/api/users/me.ts
git grep --untracked "supabase.auth" src/routes/api/users/me.ts
git grep --untracked "from '#/lib/auth/local-server-auth'" src/components src/routes/login.tsx src/lib/auth-state.ts
git grep --untracked "dms_session" src/components src/routes/login.tsx src/lib/auth-state.ts
```

Result: no matches. Exit code 1 is expected for these no-match grep checks.

Additional checks:

- `git grep --untracked "getLocalServerSession" src/routes/api/users/me.ts` confirmed the target endpoint uses the local server auth helper.
- `git diff -- src/routeTree.gen.ts` returned no diff.
- changed files are limited to `src/routes/api/users/me.ts` and migration docs.

## Manual Verification Checklist

- Login through `/login` with a local seeded user.
- Confirm `GET /api/auth/session` returns authenticated local session data.
- Visit `/profile` and confirm profile identity, email, role badges, NIP/NRP, and departemen render.
- Confirm `GET /api/users/me` returns `200` with the unchanged `{ user: { id, email, metadata, roles } }` shape.
- Confirm unauthenticated `GET /api/users/me` returns `401 { error: 'Unauthorized' }`.
- Visit `/pegawai/laporan/kegiatan` with a Ketua Tim user and confirm the current-user id check still works.
- Confirm password change remains legacy/out of scope for this phase.

## Recommended Next Support Endpoints

1. Keep current-user support endpoints stable under local auth while manual profile checks run.
2. Migrate other small read-only current-user/profile support helpers if discovered.
3. Start Phase 7 read-only domain API migration only after current-user support endpoints are stable.

Do not move to mutation, workflow, storage, preview/download, archive lifecycle, password-change, or user-management/Auth Admin replacement from this phase.
