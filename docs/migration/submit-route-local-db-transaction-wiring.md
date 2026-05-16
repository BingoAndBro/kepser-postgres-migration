# Phase 6G.4 Submit Route Local DB Transaction Wiring

Date: 2026-05-16.

## Purpose And Scope

This phase wires a controlled local PostgreSQL submit branch into:

```text
POST /api/dokumen/submit
```

The branch uses local session auth, local submit move planning, read-only disk preflight, and the existing local submit bridge/repository/Drizzle adapter stack for document create, status update, and append-only audit insert.

This phase does not claim full submit migration.

## Query Trigger

Temporary migration/testing trigger:

```text
POST /api/dokumen/submit?useLocalDbSubmit=true
```

The trigger name is intentionally not `DryRun` because this branch writes local PostgreSQL rows when all guards pass.

The request body shape is unchanged. Existing JSON parsing, Zod validation, and material `nominal_realisasi` validation still run before this branch.

Requests without `useLocalDbSubmit=true`, `useLocalAuthDryRun=true`, or `useLocalPreflightDryRun=true` continue through the legacy Supabase-backed submit path.

## Local Auth Behavior

The local DB branch calls:

```ts
getLocalServerSession(request)
```

Behavior:

- missing local session returns `401 { error: 'Unauthorized' }`;
- missing local user id returns `401 { error: 'Unauthorized' }`;
- assigned roles must include `PEGAWAI`;
- ADMIN-only and non-PEGAWAI actors return `403 { error: 'Akses ditolak' }`;
- `dms_active_role` is not authorization proof.

## Preflight Gate Behavior

Before any local DB write, the branch builds:

```ts
buildSubmitMovePlan({
  ownerUserId: localSession.userId,
  attachments: parsed.data.lampiranUrls,
})
```

Then it runs:

```ts
preflightSubmitFiles({
  actorUserId: localSession.userId,
  movePlan,
  existenceChecker: createSubmitDiskPreflightChecker(),
})
```

Missing local sources, target conflicts, unsupported paths, owner mismatches, and unsafe logical paths return controlled `400` responses before DB writes and before any file movement. Response issues include safe codes/categories and logical paths only when they pass the existing safe logical-path check.

## Move-Required Guard Behavior

Filesystem movement is not implemented in this phase.

If the preflight result contains any `move-required` operation, the local DB branch returns a controlled `409`:

```json
{
  "error": "Local DB submit is blocked until local file movement is implemented.",
  "code": "local-file-movement-required",
  "writePathExecuted": false,
  "filesystemMovementExecuted": false
}
```

The branch does not fake movement success and does not return `{ "success": true, "dokumen": ... }` for move-required local files.

Formal/no-move-required-only payloads may proceed to the local DB transaction after preflight succeeds.

## Local DB Transaction Behavior

For no-move-required payloads, the route composes the existing foundation stack:

- `createLocalSubmitActorFromSession(...)`;
- `createLiveLocalSubmitDrizzleAdapter()`;
- `createLocalSubmitBridgeRepository(...)`;
- `prepareLocalSubmitWriteBridge(...)`;
- `executeLocalSubmitWritePlan(...)`.

The write sequence remains one local repository transaction:

```text
create-draft -> update-status -> append-audit-log
```

Audit insert failure fails the local transaction path and returns a safe non-success response. The response does not expose DB errors, SQL, stack traces, DB URLs, environment values, or schema internals.

`log_aktivitas` remains append-only; the branch only calls the insert-oriented audit path exposed by the adapter foundation.

## Material And Non-Material Workflow Behavior

Material submit preserves:

```text
DRAFT -> IN_PPK_VALIDATION
current_step = PPK
revision_target = null
audit action = SUBMIT
step_urutan = 1
```

Non-material submit preserves:

```text
DRAFT -> TERSIMPAN
current_step = null
revision_target = null
audit action = STORE
step_urutan = 1
```

The branch preserves logical `lampiran_urls` metadata. It does not move, rewrite, or normalize files beyond using the preflight-planned no-move metadata.

## Response Shape Summary

Successful no-move local DB submit returns:

```json
{
  "success": true,
  "dokumen": {}
}
```

with status `201`.

Preflight failures return controlled `400` non-success responses. Move-required payloads return controlled `409` non-success responses. Local DB transaction failures return:

```json
{ "error": "Gagal mengajukan dokumen" }
```

with status `500`.

## What Remains Legacy

Default `POST /api/dokumen/submit` behavior remains legacy Supabase-backed unless an explicit local query trigger is used.

Without the local query triggers, the route still uses:

- `createServerSupabaseClient(...)`;
- `getServerSession(...)`;
- Supabase-backed required-lampiran and master-data reads;
- Supabase Storage `.move(...)` for current dash pending paths;
- `createDokumen(...)`;
- `updateDokumenStatus(...)`;
- `insertLog(...)`;
- existing material and non-material workflow behavior;
- existing `201 { success: true, dokumen }` success shape.

## Explicit Non-Implementation

Filesystem movement is not implemented.

No file rename, delete, copy, write, directory creation, or stream operation is added to the route.

No runtime rollback or compensation against real files is implemented.

No Supabase fallback is added.

No Supabase Storage migration, copy, download, backfill, or sync occurs.

Historical Supabase Storage files are not assumed to be locally available.

Supabase dependencies and the default legacy submit path remain in place.

## Tests Added Or Updated

Updated:

- `tests/unit/dokumen/submit-route-parity.test.ts`

Coverage added:

- `useLocalDbSubmit=true` missing local session returns `401`;
- `useLocalDbSubmit=true` ADMIN-only and non-PEGAWAI actors return `403`;
- move-required preflight success is blocked before DB write because filesystem movement is not implemented;
- missing source returns controlled `400` before DB write;
- target conflict returns controlled `400` before DB write;
- formal/no-move material submit returns `201 { success: true, dokumen }` with `IN_PPK_VALIDATION`, `current_step='PPK'`, and `revision_target=null`;
- formal/no-move non-material submit returns `201 { success: true, dokumen }` with `TERSIMPAN`, `current_step=null`, and `revision_target=null`;
- local DB transaction failure returns a safe non-success response;
- audit insert failure fails the local transaction path;
- the local DB branch does not call legacy Supabase submit helpers or Supabase Storage movement;
- the local DB branch does not execute filesystem movement;
- local DB responses do not expose physical paths, storage roots, DB URLs, env values, tokens, hashes, signed URLs, or file contents.

## Remaining Blockers Before Full Submit Migration

- Controlled local filesystem movement for submit remains Phase 6G.5.
- Post-DB file movement failure handling and real DB/file compensation remain unresolved.
- Move-required local uploads cannot complete through the local DB branch yet.
- `temp-id` remains the submit move planning target.
- Default submit is still legacy Supabase-backed.
- Preview/download defaults and other storage surfaces remain outside this phase.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused tests:

```powershell
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
pnpm test tests/unit/dokumen/local-submit-write-bridge.test.ts tests/unit/dokumen/local-submit-repository.test.ts tests/unit/dokumen/local-submit-drizzle-adapter.test.ts tests/unit/dokumen/submit-file-preflight.test.ts tests/unit/dokumen/submit-disk-preflight-checker.test.ts
```

Result summary:

- Initial sandboxed Vitest runs failed before tests started with `spawn EPERM` from esbuild.
- The same focused tests were rerun with approved escalation.
- `tests/unit/dokumen/submit-route-parity.test.ts` passed: 1 file, 40 tests.
- Submit foundation tests passed: 5 files, 43 tests.

Required guarded diff and audit commands were run after implementation; final command outputs are recorded in the task final response.

## Explicit Non-Claims

This phase does not claim full submit has migrated.

This phase does not claim filesystem movement is implemented.

This phase does not claim runtime DB/file compensation is implemented.

This phase does not claim rollback is implemented against real files.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.

This phase does not change default route behavior.
