# Phase 5I First Support API Local Auth Migration

Date: 2026-05-14.

## Purpose

Phase 5I migrates the first low-risk, read-only, non-auth support API endpoints from legacy Supabase session authorization to local `dms_session` authorization through `src/lib/auth/local-server-auth.ts`.

This phase is intentionally narrow. It reduces current-user support gaps after local login without migrating workflow, storage, mutations, domain list/detail APIs, admin user-management APIs, or Supabase dependencies.

## Endpoints Inspected

- `GET /api/users/me/ketua-tim`
- `GET /api/users/me/is-ketua-tim/$kegiatanId`
- `GET /api/users/me`

Related behavior inspected:

- `AppLayout` calls `/api/users/me/ketua-tim` after `/api/auth/session`.
- `pegawai/dokumen/aju` calls `/api/users/me/is-ketua-tim/$kegiatanId` after kegiatan selection.
- `pegawai/laporan/kegiatan` calls `/api/users/me` and `/api/users/me/ketua-tim`.
- Supabase RPC definitions in `supabase/migrations/014_chairman_assignment.sql`.
- Local Drizzle schemas for `auth.users`, `auth.user_roles`, `master.ketua_tim_assignments`, and `master.master_kegiatan`.

## Endpoints Migrated

- `GET /api/users/me/ketua-tim`
- `GET /api/users/me/is-ketua-tim/$kegiatanId`

Both routes now validate the local `dms_session` cookie with `getLocalServerSession(request)`.

## Endpoints Not Migrated

- `GET /api/users/me`

Reason: the endpoint is read-only, but it is broader than the Ketua Tim support checks. Its response shape depends on profile metadata parsing and legacy role/profile semantics from Supabase session and `getUserRole`. It should be migrated in a dedicated current-user/profile compatibility step after response parity is reviewed against profile and laporan callers.

## Request And Response Shape Preservation

`GET /api/users/me/ketua-tim` keeps:

```ts
{
  is_ketua_tim: boolean
  kegiatan: { id: string; nama: string }[]
}
```

`GET /api/users/me/is-ketua-tim/$kegiatanId` keeps:

```ts
{
  is_ketua_tim: boolean
}
```

Existing invalid `kegiatanId` handling is preserved:

- missing `kegiatanId`: `400 { error: 'kegiatanId wajib diisi' }`
- invalid UUID: `400 { error: 'Format kegiatanId tidak valid' }`

Existing unauthorized shape is preserved as closely as possible:

- `401 { error: 'Unauthorized' }`

Existing data failure shapes are preserved:

- `/ketua-tim`: `500 { error: 'Gagal mengambil data' }`
- `/is-ketua-tim/$kegiatanId`: `500 { error: 'Gagal memeriksa status chairman' }`

## Auth Migration Pattern

Legacy pattern removed from the migrated endpoints:

- `createServerSupabaseClient`
- `getServerSession`

Replacement pattern:

```ts
const session = await getLocalServerSession(request)
if (!session) {
  return createUnauthorizedResponse('Unauthorized')
}
```

The readable `dms_active_role` cookie is not used as authorization proof. The routes rely on the server-resolved local session user id.

## Drizzle Query Mapping

Supabase RPC `get_user_chairman_kegiatan(p_user_id)` was replaced with:

- `master.ketua_tim_assignments.user_id = session.user.id`
- join `master.master_kegiatan` on `kegiatan_id`
- select `{ id: kegiatan_id, nama: master_kegiatan.nama }`
- order by `master_kegiatan.nama`

Supabase RPC `is_user_chairman(p_user_id, p_kegiatan_id)` was replaced with:

- an `EXISTS`-equivalent Drizzle lookup on `master.ketua_tim_assignments`
- filters: current local user id and requested kegiatan id
- `limit(1)`

No local database schema changes were made.

## AppLayout Gap Impact

`AppLayout` can now call `/api/users/me/ketua-tim` after local `/api/auth/session` without requiring a legacy Supabase session. This reduces the mixed-runtime gap for header/sidebar support state after local login.

The broader page/API gap remains because many other non-auth APIs still use Supabase session authorization.

## Known Limitations

- `/api/users/me` remains Supabase-backed.
- Report reads, document reads, workflow APIs, upload/preview/download, archive APIs, and admin APIs remain Supabase-backed.
- Local DB-backed route behavior was not exercised end to end because this phase did not start the app server or run DB scripts.
- If local `master.ketua_tim_assignments` has no seed rows, the migrated endpoints correctly return non-chairman responses.

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

Additional final checks for this phase:

- `git diff --check`
- grep for legacy auth helpers in migrated endpoint files
- grep for accidental client import of `local-server-auth`
- grep for accidental client-side `dms_session` access
- final `git status --short --branch`
- confirm `src/routeTree.gen.ts` unchanged

Result:

- `git diff --check` passed; Git reported CRLF conversion warnings only.
- No `getServerSession` matches in the migrated endpoint files.
- No `createServerSupabaseClient` matches in the migrated endpoint files.
- No client-side import of `#/lib/auth/local-server-auth` was found in `src/components`, `src/routes/login.tsx`, or `src/lib/auth-state.ts`.
- No client-side `dms_session` access was found in `src/components`, `src/routes/login.tsx`, or `src/lib/auth-state.ts`.
- `src/routeTree.gen.ts` diff was empty.

## Manual Verification Checklist

- Login through `/login` with a local seeded user.
- Confirm `GET /api/auth/session` returns authenticated local session data.
- Confirm `GET /api/users/me/ketua-tim` returns `200` with `{ is_ketua_tim, kegiatan }`.
- With a user assigned in `master.ketua_tim_assignments`, confirm `is_ketua_tim: true` and kegiatan rows are ordered by `nama`.
- With a user without assignments, confirm `is_ketua_tim: false` and `kegiatan: []`.
- Select a kegiatan in `/pegawai/dokumen/aju` and confirm `GET /api/users/me/is-ketua-tim/$kegiatanId` returns the expected boolean.
- Confirm invalid kegiatan id still returns `400 { error: 'Format kegiatanId tidak valid' }`.
- Confirm unauthenticated requests to both migrated endpoints return `401 { error: 'Unauthorized' }`.

## Recommended Next Endpoints

Recommended next phase:

1. Phase 5J migrated `GET /api/users/me` after profile response parity was reviewed against `/profile` and `/pegawai/laporan/kegiatan`; it now uses local `dms_session` authorization and local Drizzle profile reads while preserving `{ user: { id, email, metadata, roles } }`.
2. Migrate small read-only current-user/profile support helpers before broader domain reads.
3. Start Phase 7 read-only domain API migration after current-user support endpoints are stable.

Do not move to mutation, workflow, storage, preview/download, archive lifecycle, or admin user-management replacement until their planned phases.

## Phase 5J Current User Profile Note

Phase 5J migrated the broad current-user profile endpoint:

- `GET /api/users/me`

The endpoint now validates local `dms_session` through `getLocalServerSession(request)` and maps local `auth.users.nama_lengkap`, `auth.users.nip_nrp`, and `auth.users.departemen` into the unchanged `user.metadata` response shape.

`POST /api/users/me/change-password`, user-management/Auth Admin endpoints, broad non-auth API authorization, read-only domain API migration, mutation API migration, storage replacement, and Supabase Auth Admin replacement remain open.
