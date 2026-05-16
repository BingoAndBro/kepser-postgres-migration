# Phase 6G.2 Submit Route Local Auth Dry-Run Boundary

Date: 2026-05-16.

## Purpose And Scope

This phase adds the first controlled runtime integration point to:

```text
POST /api/dokumen/submit
```

The change proves the route can access the local `dms_session` boundary through the existing local server auth helper without switching the real submit write path to local PostgreSQL or local filesystem storage.

This phase does not claim submit has migrated.

## Route Behavior Added

`src/routes/api/dokumen/submit.ts` now recognizes an explicit temporary query parameter:

```text
useLocalAuthDryRun=true
```

When that query parameter is present, the route still parses JSON, validates the existing submit payload with the existing Zod schema, and validates material `nominal_realisasi`.

After those existing request validation steps, the route enters a local-auth dry-run branch and returns before any legacy Supabase submit runtime executes.

## Dry-Run Trigger

Trigger:

```text
POST /api/dokumen/submit?useLocalAuthDryRun=true
```

No request body field was added. The existing submit payload shape remains unchanged.

Requests without `useLocalAuthDryRun=true` continue through the existing legacy Supabase-backed submit path.

## Local Auth Validation

The dry-run branch calls:

```ts
getLocalServerSession(request)
```

Validation in this phase:

- missing local session returns `401 { error: 'Unauthorized' }`;
- missing local user id returns `401 { error: 'Unauthorized' }`;
- actors without `PEGAWAI` in assigned roles return `403 { error: 'Akses ditolak' }`;
- ADMIN-only actors do not become submit-compatible;
- `dms_active_role` is not treated as authorization proof by the route.

The successful dry-run response is deliberately not the real submit success shape. It returns `200` with:

```json
{
  "dryRun": true,
  "boundary": "local-auth",
  "submitCompatible": true,
  "writePathExecuted": false,
  "filesystemMovementExecuted": false,
  "message": "Local auth boundary validated; submit write path was not executed."
}
```

It does not return `{ "success": true, "dokumen": ... }`.

## What Remains Legacy

Default submit behavior remains legacy Supabase-backed.

Without the dry-run query parameter, the route still uses:

- `createServerSupabaseClient(...)`;
- `getServerSession(...)`;
- Supabase-backed required lampiran and master-data reads;
- Supabase Storage `.move(...)` for current dash pending paths;
- `createDokumen(...)`;
- `updateDokumenStatus(...)`;
- `insertLog(...)`;
- existing material and non-material status behavior;
- existing `201 { success: true, dokumen }` success shape.

## Explicit Non-Implementation

This phase does not implement local DB writes.

This phase does not execute filesystem movement.

This phase does not wire route disk preflight.

This phase does not import or call the local submit repository or local submit Drizzle adapter.

This phase does not call `createLiveLocalSubmitDrizzleAdapter(...)`.

This phase does not add Supabase fallback.

This phase does not migrate, copy, download, backfill, or sync Supabase Storage files.

This phase does not expose physical paths, storage roots, tokens, hashes, DB URLs, env values, signed URLs, generated internal signed URLs, or uploaded file contents.

## Tests Added Or Updated

Updated:

- `tests/unit/dokumen/submit-route-parity.test.ts`

Coverage added:

- default legacy path still executes without local dry-run auth;
- dry-run missing local session returns `401 { error: 'Unauthorized' }`;
- dry-run ADMIN-only and non-PEGAWAI actors return `403 { error: 'Akses ditolak' }`;
- dry-run valid PEGAWAI session returns a non-success dry-run response;
- dry-run branch does not call `createDokumen(...)`, `updateDokumenStatus(...)`, `insertLog(...)`, `createAdminClient(...)`, legacy Supabase client creation, or Supabase Storage `.move(...)`;
- dry-run response does not expose token/hash/DB URL/storage-root/signed-URL/physical-path indicators.

## Remaining Blockers Before Full Submit Migration

- Local submit master-data reads are not route-wired.
- Local submit DB transaction is not route-wired.
- Route disk preflight is not wired.
- Filesystem movement is not implemented in submit.
- Runtime DB/file compensation and rollback are not implemented.
- Missing local file route status/message remains unresolved.
- Target conflict route status/message remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains unchanged.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused validation run:

```powershell
git status --short --branch
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- tests\unit\dokumen\submit-route-parity.test.ts
git diff -- src\lib\dokumen\submit-runtime-orchestrator.ts
git diff -- src\lib\dokumen\submit-disk-preflight-checker.ts
git diff -- src\lib\dokumen\local-submit-repository.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
Select-String -Path src\routes\api\dokumen\submit.ts -Pattern "createLiveLocalSubmitDrizzleAdapter|createLocalSubmitDrizzleAdapter|local-submit-repository|local-submit-drizzle-adapter|renameSync|writeFile|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream|DMS_LOCAL_STORAGE_ROOT|DATABASE_URL" -CaseSensitive:$false
Select-String -Path tests\unit\dokumen\submit-route-parity.test.ts -Pattern "DMS_LOCAL_STORAGE_ROOT|DATABASE_URL|secret-token|session-token|password_hash|storage root" -CaseSensitive:$false
```

Result summary:

- Initial `git status --short --branch` was clean on `migration/postgres-local`.
- The first sandboxed parity test run failed before tests started with `spawn EPERM` from esbuild.
- The same focused parity test was rerun with approved escalation and passed: 1 test file, 21 tests.
- Final validation and audit results are recorded in the task final response.

