# Phase 6G.3 Submit Route Local Preflight Wiring

Date: 2026-05-16.

## Purpose And Scope

This phase wires a temporary local preflight dry-run branch into:

```text
POST /api/dokumen/submit
```

The branch proves that the submit route can compose local session authorization, submit move planning, and read-only local disk preflight before any document write or file movement.

This phase does not claim submit has migrated.

## Query Trigger

Temporary migration/testing trigger:

```text
POST /api/dokumen/submit?useLocalPreflightDryRun=true
```

The request body shape is unchanged. The existing route still parses JSON, validates the existing Zod submit payload, and validates material `nominal_realisasi` before entering this branch.

The earlier Phase 6G.2 trigger remains available:

```text
POST /api/dokumen/submit?useLocalAuthDryRun=true
```

Requests without either query parameter continue through the legacy Supabase-backed submit path.

## Local Auth Behavior

The local preflight branch calls:

```ts
getLocalServerSession(request)
```

Behavior:

- missing local session returns `401 { error: 'Unauthorized' }`;
- missing local user id returns `401 { error: 'Unauthorized' }`;
- assigned roles must include `PEGAWAI`;
- ADMIN-only and non-PEGAWAI actors return `403 { error: 'Akses ditolak' }`;
- `dms_active_role` is not used as authorization proof.

## Move Plan Behavior

The route builds the submit move plan with:

```ts
buildSubmitMovePlan({
  ownerUserId: localSession.userId,
  attachments: parsed.data.lampiranUrls,
})
```

The planner therefore uses the local session user id as the owner and preserves the helper default target document segment:

```text
temp-id
```

Supported pending paths are planned as future logical moves only. Already formal attachments are treated as no-move entries. Unsupported, unsafe, owner-mismatched, or otherwise invalid attachment paths become controlled preflight failures.

## Disk Preflight Behavior

The branch creates:

```ts
createSubmitDiskPreflightChecker()
```

Then passes that checker into:

```ts
preflightSubmitFiles(...)
```

The checker performs read-only local disk checks through its existing helper boundary. It checks whether planned local sources exist and whether planned targets are available. It does not move, copy, rename, delete, write, create directories, stream files, or expose physical paths.

Missing local sources, target conflicts, unsafe paths, and unsupported paths fail with a controlled `400` response before any DB write and before any filesystem movement.

## Response Shape Summary

Successful preflight returns `200` with a dry-run body:

```json
{
  "dryRun": true,
  "boundary": "local-preflight",
  "submitCompatible": true,
  "preflightOk": true,
  "writePathExecuted": false,
  "filesystemMovementExecuted": false,
  "message": "Local submit preflight validated; submit write path was not executed."
}
```

Preflight failure returns `400` with a controlled dry-run body:

```json
{
  "dryRun": true,
  "boundary": "local-preflight",
  "submitCompatible": true,
  "preflightOk": false,
  "writePathExecuted": false,
  "filesystemMovementExecuted": false,
  "error": "Local submit preflight failed; submit write path was not executed.",
  "issues": []
}
```

The branch never returns:

```json
{ "success": true, "dokumen": {} }
```

Issue entries include safe codes/categories and logical paths only when the route can confirm the value is already a safe logical storage path. Unsafe raw path values are not echoed.

## What Remains Legacy

Default `POST /api/dokumen/submit` behavior remains legacy Supabase-backed.

Without the local dry-run query parameters, the route still uses:

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

No local DB writes occur in this phase.

No local submit repository or local Drizzle adapter is called.

`createLiveLocalSubmitDrizzleAdapter(...)` is not called.

No filesystem movement occurs in this phase.

No file rename, delete, copy, write, directory creation, or stream operation is added to the route.

No Supabase fallback is added.

No Supabase Storage migration, copy, download, backfill, or sync occurs.

Historical Supabase Storage files are not assumed to be locally available.

## Tests Added Or Updated

Updated:

- `tests/unit/dokumen/submit-route-parity.test.ts`

Coverage added:

- default legacy path still works without the local preflight flag;
- existing `useLocalAuthDryRun=true` branch still returns non-success dry-run responses;
- local preflight missing local session returns `401`;
- local preflight ADMIN-only and non-PEGAWAI actors return `403`;
- local preflight missing source returns controlled `400`;
- local preflight target conflict returns controlled `400`;
- local preflight unsupported path returns controlled `400`;
- local preflight unsafe path does not echo the unsafe raw path;
- local preflight formal/no-op attachment can return successful dry-run without movement checks;
- local preflight valid local pending source and available target returns successful dry-run;
- local preflight does not call legacy Supabase client/admin creation, `createDokumen(...)`, `updateDokumenStatus(...)`, `insertLog(...)`, Supabase Storage `.move(...)`, or filesystem movement;
- local preflight responses do not expose physical paths, storage roots, DB URLs, env values, tokens, hashes, signed URLs, or file contents.

## Remaining Blockers Before Full Submit Migration

- Local submit master-data and required-lampiran reads are not wired.
- Local submit DB transaction is not wired.
- Local submit repository and live Drizzle adapter are not called by the route.
- Filesystem movement is not implemented in submit.
- Runtime DB/file compensation and rollback are not implemented.
- Post-DB file-movement failure handling remains unresolved.
- Append-log failure parity remains unresolved.
- `temp-id` remains the default submit planning target.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused tests:

```powershell
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
pnpm test tests/unit/dokumen/submit-file-preflight.test.ts
pnpm test tests/unit/dokumen/submit-disk-preflight-checker.test.ts
```

Result summary:

- Initial sandboxed Vitest runs failed before tests started with `spawn EPERM` from esbuild.
- The same focused tests were rerun with approved escalation.
- `tests/unit/dokumen/submit-route-parity.test.ts` passed: 1 file, 30 tests.
- `tests/unit/dokumen/submit-file-preflight.test.ts` passed: 1 file, 11 tests.
- `tests/unit/dokumen/submit-disk-preflight-checker.test.ts` passed: 1 file, 13 tests.

Required guarded diff and audit commands were run after implementation; final command outputs are recorded in the task final response.

## Explicit Non-Claims

This phase does not claim submit has migrated.

This phase does not claim local DB writes are wired.

This phase does not claim filesystem movement is implemented.

This phase does not claim runtime DB/file compensation is implemented.

This phase does not claim historical Supabase Storage files are locally available.

This phase does not claim Supabase can be removed.

This phase does not change default route behavior.
