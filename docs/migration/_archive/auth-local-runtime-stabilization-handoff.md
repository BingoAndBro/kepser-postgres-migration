# Phase 5K Auth Local Runtime Stabilization And Handoff

Date: 2026-05-14.

## Purpose

Phase 5K closes the local auth runtime migration segment with a focused stabilization audit, manual verification checklist, known-gap summary, and handoff into Phase 6A.

This phase is documentation, audit, and handoff only. It does not migrate additional APIs, storage, workflow, archive lifecycle, mutation behavior, database schema, route generation, or UI behavior.

The next phase should prepare the project for local filesystem storage planning/foundation before any broad storage implementation begins.

## Phase 6A Storage Planning Note

Phase 6A created the storage replacement planning and compatibility contract in `docs/migration/storage-replacement-planning-contract.md`.

That contract inventories the current Supabase Storage upload, direct browser attachment editing, pending-to-formal move, preview/download signed URL, archive snapshot/destruction, and admin diagnostics/orphan cleanup surfaces. It locks the compatibility constraints for the future local filesystem work.

Storage implementation remains future work. Phase 6A does not migrate upload, preview, download, signed URL/token, move, delete, archive destruction, diagnostics, orphan cleanup, workflow, archive lifecycle, mutation API, or filesystem runtime behavior.

## Completed Local Auth Boundary

The following paths and support areas are now on the local custom auth boundary:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/role-switch`
- `/login` browser submit flow
- `AppLayout` browser session bootstrap through `/api/auth/session`
- central logout through `/api/auth/logout`
- central role switch through `/api/auth/role-switch`
- server-only local auth helper bridge in `src/lib/auth/local-server-auth.ts`
- current-user support endpoint `GET /api/users/me`
- current-user support endpoint `GET /api/users/me/ketua-tim`
- current-user support endpoint `GET /api/users/me/is-ketua-tim/$kegiatanId`

`dms_session` remains an opaque HttpOnly cookie and is not read or stored by client JavaScript. `dms_active_role` remains readable UX state only and is validated server-side against assigned roles before it affects authenticated behavior.

## Remaining Supabase-Backed Areas

These areas remain intentionally Supabase-backed or unmigrated after Phase 5K:

- broad non-auth API authorization
- read-only domain APIs
- mutation APIs
- workflow/FSM mutation APIs
- archive lifecycle APIs
- Supabase Auth Admin user management
- password change through `POST /api/users/me/change-password`
- Supabase Storage upload, preview, download, move, delete, and signed URL behavior
- storage diagnostics and orphan cleanup
- report/archive/log/user-name enrichment paths that still use Supabase Auth Admin
- direct browser Supabase access outside the completed `/login` and `AppLayout` auth boundary
- Supabase helpers and dependencies kept as reference until parity is verified

## Known Mixed-Runtime Risks

- Authenticated UI can still hit legacy APIs that expect Supabase sessions or Supabase-backed helpers.
- Domain pages may render from local auth state and then fail until broad API authorization and data reads are migrated.
- Storage remains Supabase-backed, including upload, pending-to-formal movement, preview/download signed URLs, archive destruction deletes, and cleanup tools.
- `AppLayout` and current-user support are improved, but this is not full app parity.
- CSRF and rate limiting remain open hardening items for cookie-auth runtime.
- Cross-tab sign-out and refresh behavior should be revisited after local auth replaces more runtime surfaces.
- `dms_active_role` is UX state only and must not be treated as authorization proof.
- `dms_session` must remain HttpOnly and unavailable to client JavaScript.

## Manual Verification Checklist

Use local seeded development users. Do not record real passwords, password hashes, raw session tokens, token hashes, cookie values, database URLs, or environment values in notes.

- Open `/login` and confirm the page renders.
- Log in successfully with a local seeded user.
- Try the same account with an invalid password and confirm the generic login failure behavior.
- Reload after login and confirm `GET /api/auth/session` returns authenticated session data.
- Switch roles from the header and confirm `POST /api/auth/role-switch` succeeds for assigned non-admin roles.
- Log out and confirm `POST /api/auth/logout` clears authenticated state.
- Call `GET /api/users/me` and confirm `{ user: { id, email, metadata, roles } }` is preserved.
- Call `GET /api/users/me/ketua-tim` and confirm `{ is_ketua_tim, kegiatan }` is preserved.
- Call `GET /api/users/me/is-ketua-tim/$kegiatanId` and confirm `{ is_ketua_tim }` is preserved for a valid kegiatan UUID.
- Visit `/profile` and smoke-check profile identity, role badges, NIP/NRP, and departemen.
- Visit `/pegawai/laporan/kegiatan` with a Ketua Tim user and confirm the current-user id check still works.
- Confirm browser `localStorage` and `sessionStorage` do not contain `dms_session`, raw session tokens, token hashes, password hashes, or cookie values.
- Expect storage, document, workflow, report, archive, admin, and other domain pages to still have legacy mixed-runtime gaps until later phases.

## Phase 6A Readiness Checklist

Phase 6A should inventory and lock the storage compatibility contract before implementation.

- Preserve storage path semantics currently stored in document metadata.
- Preserve pending upload path semantics, including `{userId}/{kelengkapanId}_{timestamp}_{filename}` and legacy pending variants.
- Preserve formal attachment path semantics: `{userId}/{dokumenId}/{uuid}.{ext}`.
- Preserve preview/download behavior and current authorization/error expectations.
- Decide how Supabase signed URLs are replaced while current callers expect `{ signedUrl }`.
- Preserve `arsip.lampiran_snapshot` needs and file resolvability until destruction.
- Preserve `DIMUSNAHKAN` preview/download behavior, including destroyed/unavailable responses.
- Define DB/file partial failure policy for upload, move, delete, archive destruction, and cleanup.
- Define local filesystem root env/config plan without exposing `storage/` as static public files.
- Plan backup/restore interaction for PostgreSQL plus local files.
- Do not implement storage behavior in Phase 5K.

## Audit Commands And Findings

Focused no-match checks, where exit code 1 is expected:

```powershell
git grep --untracked "getBrowserClient" -- src/routes/login.tsx src/components/layout/AppLayout.tsx
git grep --untracked "supabase.auth" -- src/routes/login.tsx src/components/layout/AppLayout.tsx
git grep --untracked "dms_session" -- src/routes/login.tsx src/components/layout/AppLayout.tsx src/lib/auth-state.ts
git grep --untracked "from '#/lib/auth/local-server-auth'" -- src/components src/routes/login.tsx src/lib/auth-state.ts
git grep --untracked "getServerSession" -- src/routes/api/users/me.ts src/routes/api/users/me/ketua-tim.ts src/routes/api/users/me/is-ketua-tim
git grep --untracked "createServerSupabaseClient" -- src/routes/api/users/me.ts src/routes/api/users/me/ketua-tim.ts src/routes/api/users/me/is-ketua-tim
```

Findings:

- No Supabase browser auth dependency was found in `/login` or `AppLayout`.
- No client-side `dms_session` access was found in `/login`, `AppLayout`, or `auth-state`.
- No client import of `local-server-auth` was found.
- The migrated current-user support endpoints no longer use `getServerSession` or `createServerSupabaseClient`.
- The current-user support endpoints do use `getLocalServerSession`.
- Legacy Supabase Auth/Admin/Storage usage remains in the expected unmigrated areas.

Storage and Auth Admin inventory checks confirmed remaining legacy dependencies in:

- `src/components/dokumen/AttachmentEditor.tsx`
- storage routes under `src/routes/api/dokumen*`, `src/routes/api/ppk*`, `src/routes/api/bendahara*`, `src/routes/api/upload.ts`, and archive destruction paths
- `src/lib/user-helpers.ts`
- report/archive/log/user-name enrichment routes
- `src/routes/api/users/me/change-password.ts`

## Focused Test Result

Command:

```powershell
pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts
```

Result:

- first sandboxed attempt failed while Vitest loaded config because esbuild hit `spawn EPERM`
- the same focused command passed after rerunning outside the sandbox
- 3 test files passed
- 17 tests passed

No full test suite, build, dev server, DB migration/generate/seed script, password hash helper, or E2E test was run.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6A  Storage Replacement Planning And Compatibility Contract
```

If the roadmap keeps the existing Phase 6 naming, use:

```text
Phase 6A  Local Filesystem Storage Compatibility Foundation
```

Phase 6A should be planning, contract, and inventory first. It should not start broad storage implementation until the upload, pending/formal path, signed URL, archive snapshot, destruction, partial-failure, and backup/restore rules are explicit.

## Intentionally Not Implemented

- additional non-auth API migration
- document, workflow, report, archive, or domain API migration
- mutation API migration
- admin user-management or Supabase Auth Admin replacement
- password-change replacement
- local filesystem storage
- upload, preview, download, signed URL, move, delete, or cleanup behavior
- workflow/FSM behavior changes
- archive lifecycle behavior changes
- UI behavior changes
- database schema changes
- route generation
- Supabase code/dependency removal
- DB migration, DB generate, DB seed, or local DB scripts
- password hash helper execution
