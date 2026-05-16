# Phase 6G.5 Submit Route Controlled Local File Movement

Date: 2026-05-16.

## Purpose And Scope

This phase wires controlled local pending-to-formal movement into the existing local submit branch:

```text
POST /api/dokumen/submit?useLocalDbSubmit=true
```

The purpose is to let newly uploaded local pending files complete submit through the local PostgreSQL route path after auth, preflight, and DB transaction success.

This phase is submit-route-only. It does not migrate old Supabase Storage files, does not add Supabase fallback, does not retire the default legacy submit path, and does not add a broad movement or rollback framework.

## Trigger Used

The only trigger is:

```text
POST /api/dokumen/submit?useLocalDbSubmit=true
```

The endpoint path and request body shape are unchanged. Requests without the explicit local query trigger continue through the default legacy Supabase-backed submit path.

## Ordering

The local branch ordering is:

1. Parse JSON and validate the existing submit Zod schema.
2. Validate material `nominal_realisasi`.
3. Resolve local session with `getLocalServerSession(request)`.
4. Require PEGAWAI compatibility through `createLocalSubmitActorFromSession(...)`.
5. Build the submit move plan with `buildSubmitMovePlan(...)`, preserving the default `temp-id` target segment.
6. Run read-only local disk preflight through `preflightSubmitFiles(...)` and `createSubmitDiskPreflightChecker()`.
7. Fail preflight issues before DB writes and before movement.
8. Run the local submit DB transaction through the existing bridge, repository, and Drizzle adapter stack.
9. Execute local file movement only after DB success.
10. Return `201 { success: true, dokumen }` only after DB success and full movement success.

## Movement Success Behavior

For preflight-approved move-required operations, the route executes `moveLocalPendingFileToFormal(...)` from `src/lib/storage/local-pending-move.ts`.

Movement uses only logical paths from the preflight-approved operations:

- source comes from `operation.sourceLogicalPath`;
- target document segment and UUID are parsed from `operation.targetLogicalPath`;
- the returned helper target must exactly match the preflight target.

No Supabase Storage call is used by this local branch. No physical path, storage root, raw filesystem error, signed URL, token, DB URL, hash, or uploaded file content is exposed.

## Formal/No-Move Behavior

Formal/no-move-only payloads keep the Phase 6G.4 behavior:

- preflight succeeds without source/target movement checks;
- the local DB transaction runs;
- no local movement helper is called;
- success returns `201 { success: true, dokumen }`.

## Movement Failure Behavior

If local movement fails after DB success, the route returns a safe non-success response:

```json
{
  "error": "Local file movement failed after local DB submit.",
  "code": "local-file-movement-failed",
  "writePathExecuted": true,
  "filesystemMovementExecuted": true,
  "compensationRequired": true,
  "partialMovement": false,
  "movedCount": 0,
  "issues": []
}
```

The response does not claim DB rollback, file rollback, or compensation success. Runtime DB/file compensation remains incomplete.

## Partial Failure Behavior

Multi-file movement runs sequentially. If a later movement fails after one or more prior movements succeeded:

- the route returns non-success;
- `partialMovement` is `true`;
- `movedCount` records how many operations completed before failure;
- `compensationRequired` is `true`;
- no raw filesystem error or physical path is exposed.

This phase does not implement a broad rollback system, cleanup worker, retry queue, or recovery marker. Partial DB/file recovery remains a submit stabilization blocker.

## Response Shape Summary

Success:

```json
{
  "success": true,
  "dokumen": {}
}
```

with status `201`.

Preflight failure remains a controlled `400` with safe issues before DB and before movement.

DB transaction failure remains:

```json
{ "error": "Gagal mengajukan dokumen" }
```

with status `500`, before movement.

Post-DB movement failure returns safe non-success `500` with `code: "local-file-movement-failed"`.

## Material And Non-Material Behavior

Material submit remains:

```text
DRAFT -> IN_PPK_VALIDATION
current_step = PPK
revision_target = null
audit action = SUBMIT
```

Non-material submit remains:

```text
DRAFT -> TERSIMPAN
current_step = null
revision_target = null
audit action = STORE
```

Both material and non-material local DB submit persist planned final logical attachment metadata for move-required files, not stale pending source paths.

## What Remains Legacy

Default `POST /api/dokumen/submit` remains legacy Supabase-backed unless the explicit local trigger is used.

Without `useLocalDbSubmit=true`, the route still uses legacy Supabase session, Supabase-backed submit helpers, and Supabase Storage movement behavior where the old path does so.

Supabase imports and dependencies remain because other paths still need them during migration.

## Explicit Non-Implementation

No Supabase fallback was added.

No old Supabase Storage file migration, copy, download, backfill, or sync was added or run.

Historical Supabase-backed files are not assumed to exist locally and should fail cleanly when the local path preflights them.

No DB scripts, migrations, seeds, route generation, build, dev server, full typecheck, full test suite, or auth hash script are part of this phase.

No real DB/file rollback or compensation is implemented.

## Tests Added Or Updated

Updated:

- `tests/unit/dokumen/submit-route-parity.test.ts`

Coverage added or retained:

- default legacy path still works;
- `useLocalAuthDryRun=true` still works;
- `useLocalPreflightDryRun=true` still works;
- formal/no-move local DB submit returns `201` and does not call movement;
- move-required local DB submit returns `201` after successful movement;
- persisted and returned `lampiran_urls` use planned final logical paths for move-required files;
- missing source fails before DB write;
- target conflict fails before DB write;
- DB transaction failure does not call movement;
- movement failure after DB success returns safe non-success;
- partial movement failure returns safe non-success;
- local branch does not call legacy Supabase submit helpers or Supabase Storage movement;
- no Supabase fallback is attempted;
- sensitive output does not expose physical paths, storage roots, DB URLs, env values, tokens, hashes, signed URLs, file contents, or raw filesystem errors.

## Remaining Blockers Before Submit Stabilization

- Runtime DB/file compensation and recovery are still incomplete.
- Partial movement cleanup or retry policy remains unresolved.
- `temp-id` remains the submit planning target.
- Default submit is still legacy Supabase-backed until Phase 6G.6 explicitly retires or disables it.
- Preview/download defaults and other storage surfaces remain outside this phase.
- Update/resubmit local pending movement remains future work.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed globally.

## Validation Results

Initial sandboxed Vitest for the parity test failed before tests started with `spawn EPERM` from esbuild. The same focused test was rerun with approved escalation and passed.

The final validation commands and exact results are recorded in the implementation final response.

## Explicit Non-Claims

This phase does not claim default submit has migrated.

This phase does not claim Supabase can be removed.

This phase does not claim global storage migration is complete.

This phase does not claim real DB/file rollback is implemented.

This phase does not claim old Supabase files are locally available.
