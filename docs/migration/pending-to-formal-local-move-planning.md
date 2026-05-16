# Phase 6E.6 Pending-To-Formal Local Move Planning

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.6 is documentation and planning only. It defines how later phases should replace Supabase Storage pending-to-formal move behavior with local filesystem move behavior while preserving current DMS compatibility.

No runtime source code changed in this phase. Pending-to-formal local move behavior is not implemented in this phase.

This phase does not change submit, resubmit, rename-pending, update, upload, preview/download, delete/remove, archive destruction, diagnostics, auth/session runtime, database schema, route generation, or UI caller behavior.

## 2. Current Move Surface Inventory

Current attachment metadata shape remains:

```ts
{
  kelengkapan_id: string
  nama: string
  url: string
  uploaded_at: string
}
```

### `src/routes/api/dokumen/submit.ts`

| Field | Current behavior |
|---|---|
| Caller/context | `POST /api/dokumen/submit`, combined create and submit from the Pegawai create-document flow. |
| Current auth/session | Supabase server client from request cookies, then `getServerSession(supabase)`. |
| Current storage operation | Route-local pre-processing calls Supabase admin `storage.from('dokumen-lampiran').move(oldPath, newPath)` before document creation. |
| Input metadata | Parsed `createAndSubmitDokumenSchema`, including `lampiranUrls` array. |
| Output/DB metadata | Updates the in-memory `processedLampirans` array with moved `url` values, then creates `dokumen_transaksi` through `createDokumen(...)`; response remains `201 { success: true, dokumen }`. |
| Path handling | Detects only dash pending filenames with `^\d{13}-[a-zA-Z0-9]+-.+$`; skips underscore pending and already formal paths. |
| Formal target | Uses `{session.user.id}/temp-id/{uuid}.{ext}` because the real document id is not available yet. |
| Future local move ownership | Should move into a shared helper, but submit needs route-specific compatibility handling for `temp-id` or a separately documented replacement. |

### `src/routes/api/dokumen/rename-pending.ts`

| Field | Current behavior |
|---|---|
| Caller/context | `POST /api/dokumen/rename-pending`, compatibility endpoint for formalizing pending files for an existing document. |
| Current auth/session | Supabase server client from request cookies, then `getServerSession(supabase)`. |
| Current authorization | Requires body `userId` to match `session.user.id`; verifies target document exists and `dokumen.created_by` matches the session user; verifies pending path owner before moving. |
| Current storage operation | Supabase admin `storage.from('dokumen-lampiran').move(oldPath, newPath)`. |
| Input metadata | JSON `{ dokId, lampiranUrls, userId }`. |
| Output/DB metadata | Returns `{ success: true, renamed, errors? }`; the route does not directly update document metadata. |
| Path handling | Detects only dash pending filenames; skips underscore pending and already formal paths. |
| Formal target | `{userId}/{dokId}/{uuid}.{ext}`. |
| Future local move ownership | Best first route-wiring candidate after helper foundation because it has a small input/output contract and no direct DB metadata write. |

### `src/routes/api/dokumen.$id.ts`

| Field | Current behavior |
|---|---|
| Caller/context | `PATCH /api/dokumen/$id`, Pegawai edit/revision update for material documents needing user revision and non-material `TERSIMPAN` edits. |
| Current auth/session | Supabase server client from request cookies, then `getServerSession(supabase)`. |
| Current authorization | Requires owner match against `dokumen.created_by`; route also checks editable status rules. |
| Current storage operation | Delegates to `syncDocumentAttachments(admin, session.user.id, params.id, parsed.data.lampiranUrls, storedLampirans)`. Later calls `deleteOrphanFiles(admin, pathsToDelete)` fire-and-forget after DB update. |
| Input metadata | `updateDokumenSchema`, optionally including `lampiranUrls`. |
| Output/DB metadata | Persists `processedLampirans` through `updateDokumen(...)`; response remains `{ dokumen: result.data }`. |
| Path handling | Inherited from `syncDocumentAttachments()`: dash pending only; formal and underscore pending are skipped as non-pending by the current utility. |
| Formal target | `{session.user.id}/{params.id}/{uuid}.{ext}` for moved files. |
| Future local move ownership | Helper should do common move/classification work; route-specific phase must coordinate DB write and old/replaced file cleanup policy. |

### `src/routes/api/ppk/resubmit/$id.ts`

| Field | Current behavior |
|---|---|
| Caller/context | `PATCH /api/ppk/resubmit/$id` saves PPK revision attachments without FSM transition; `POST /api/ppk/resubmit/$id` resubmits after Bendahara rejection and performs FSM transition. |
| Current auth/session | Supabase server client from request cookies, then `getServerSession(authClient)`. |
| Current authorization | Requires `PPK` role from Supabase `user_roles`; requires document status `NEED_REVISION` and `revision_target='PPK'`. |
| Current storage operation | Both PATCH and POST delegate to `syncDocumentAttachments(...)`; both call `deleteOrphanFiles(...)` fire-and-forget after DB update when there are old/replaced paths. |
| Input metadata | Optional `lampiranUrls` plus optional `nominalRealisasi`, validated by `resubmitDokumenSchema` when provided. |
| Output/DB metadata | PATCH updates `lampiran_urls` and optional nominal then returns `{ success: true }`; POST updates status/current step/revision target plus optional lampiran/nominal and returns `{ success: true }`. |
| Path handling | Inherited from `syncDocumentAttachments()`: dash pending only; formal and underscore pending are skipped as non-pending by the current utility. |
| Formal target | `{session.user.id}/{params.id}/{uuid}.{ext}` for moved files. |
| Future local move ownership | Should be after helper and Pegawai route compatibility because it combines move behavior with PPK role semantics and FSM state updates. |

### `src/lib/dokumen/storage.ts`

| Field | Current behavior |
|---|---|
| Caller/context | Shared helper for update/resubmit attachment synchronization; re-exported through `dokumen-helpers`. |
| Current auth/session | No direct session lookup; caller passes `userId`, `dokumenId`, Supabase admin client, new lampiran metadata, and old lampiran metadata. |
| Current storage operation | `syncDocumentAttachments()` calls Supabase `.move(...)` for pending files; `deleteOrphanFiles()` calls Supabase `.remove(...)` for cleanup. |
| Input metadata | `LampiranUrl[]` new and old arrays. |
| Output/DB metadata | Returns `{ updatedLampirans, pathsToDelete }`; callers persist `updatedLampirans` and later delete paths. |
| Path handling | Uses `isPendingFile()` from `src/lib/utils/file.ts`, which recognizes only dash pending filenames. |
| Formal target | `{userId}/{dokumenId}/{uuid}.{ext}`. |
| Future local move ownership | A new local helper should be separate from this Supabase helper at first. Do not replace this helper globally until route compatibility is proven. |

### `src/components/dokumen/AttachmentEditor.tsx`

| Field | Current behavior |
|---|---|
| Caller/context | Edit/revision/resubmit attachment editor; produces new pending files and can reset/cancel pending uploads. |
| Current auth/session | Browser Supabase client and `supabase.auth.getSession()` to read `session.user.id`. |
| Current storage operation | Direct browser Supabase Storage `.upload(path, file, { cacheControl: '3600', upsert: false })`; pending reset/cancel uses `.remove([pending.url])`. |
| Input metadata | Browser `File` plus UI document/kelengkapan state. |
| Output/DB metadata | Builds `LampiranUrl` client-side with `{ kelengkapan_id, nama, url, uploaded_at }`; later passed to route `onSubmit` handlers. |
| Path handling | Produces dash pending paths: `{userId}/{timestamp}-{random}-{filename.ext}`. |
| Future local move ownership | Not a move executor. Keep as a producer boundary in this plan; migrating it behind local API routes belongs to a separate later phase. |

## 3. Current Path Formats And Semantics

### `/api/upload` underscore pending path

Current local `/api/upload` returns logical paths in this format:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

The owner segment comes from the local `dms_session` user id. These files exist locally only when uploaded through the Phase 6E.4 route.

### `AttachmentEditor` dash pending path

`AttachmentEditor` still uploads directly to Supabase Storage and produces:

```text
{userId}/{timestamp}-{random}-{filename.ext}
```

This is the format most existing pending detectors recognize.

### Formal path

Formal document attachment paths use:

```text
{userId}/{dokumenId}/{uuid}.{ext}
```

The file name is storage-stable and UUID-based; display names are derived elsewhere from document metadata.

### Submit `temp-id` behavior

`POST /api/dokumen/submit` can move dash pending files to:

```text
{userId}/temp-id/{uuid}.{ext}
```

This is current runtime behavior because the combined create+submit route moves files before the real document id exists. It is a compatibility risk. Later implementation must either preserve it or explicitly replace it with a tested route-specific contract.

### Archive snapshot behavior

`arsip.lampiran_snapshot` stores logical path snapshots copied from `dokumen_transaksi.lampiran_urls`. Ordinary pending-to-formal move phases must not casually rewrite archive snapshots. Archive snapshot mutation belongs to archive lifecycle phases.

### Classification behavior from `local-storage-paths.ts`

The local path helper currently classifies safe logical paths as:

| Classification | Format |
|---|---|
| `pending-dash` | `{userId}/{13-digit timestamp}-{alphanumeric random}-{filename.ext}` |
| `pending-upload-api` | `{userId}/{kelengkapanId}_{13-digit timestamp}_{filename.ext}` |
| `formal` | `{userId}/{dokumenId}/{uuid}.{ext}` |
| `other` | Safe but unrecognized logical path |

The helper can recognize both pending variants, but current runtime move surfaces mostly recognize only dash pending paths.

## 4. Required Local Move Compatibility Contract

Future local pending-to-formal move behavior must preserve these rules:

- Metadata `url` values remain logical storage paths only.
- Physical filesystem paths and storage roots must never be returned to clients.
- Owner segment must remain server-authoritative. Later route code should not trust a client-provided owner segment for new local moves.
- All source and target logical paths must pass no-traversal and root-containment checks before filesystem operations.
- Local move must not overwrite an existing formal target.
- Formal target generation should preserve current UUID-based filename behavior where applicable.
- Both underscore pending paths and dash pending paths must be handled deliberately, not accidentally.
- Already formal paths must not be moved again.
- Safe-but-unknown paths should be treated as unsupported or left unchanged by explicit policy, not silently moved.
- Archive snapshots must not be modified during ordinary submit/update/resubmit pending moves.
- No Supabase Storage file migration, copy, download, backfill, or sync may be introduced.

## 5. Auth And Ownership Considerations

Current move routes and helpers assume Supabase sessions:

- `submit.ts` uses Supabase `getServerSession(supabase)` and `session.user.id`.
- `rename-pending.ts` uses Supabase `getServerSession(supabase)`, requires body `userId` to equal `session.user.id`, and verifies document ownership.
- `dokumen.$id.ts` uses Supabase `getServerSession(supabase)` and document owner checks.
- `ppk/resubmit/$id.ts` uses Supabase session plus Supabase role lookup for `PPK`.
- `syncDocumentAttachments()` receives `userId` from the calling route and does not authenticate by itself.

Target local upload behavior already uses `getLocalServerSession(request)` and writes owner-prefixed logical paths with the local user id. This creates a mixed-id risk during transition:

- New `/api/upload` files are owned by local auth user ids.
- `AttachmentEditor` direct browser files may still be owned by Supabase auth user ids.
- Existing Supabase-backed metadata, if present, is not locally available and may use old Supabase user ids.

Recommended future direction:

- Use local `dms_session` as the authority for local filesystem moves.
- Derive the expected owner segment from the local session and document ownership/role checks, not from request body alone.
- Treat body `userId` in `rename-pending` as compatibility input only; validate it against the local session if retained.
- Reject owner mismatch with a controlled 403-style response.
- Clearly report unsupported or missing local source files instead of trying to fetch from Supabase.
- Keep any Supabase-session bridge isolated if a transition phase absolutely needs it; do not mix Supabase and local user ids silently.

This phase does not implement the auth/session switch.

## 6. Local Filesystem Move Safety

Future helper behavior should include:

- Validate the source logical path before any filesystem operation.
- Validate/generate the target logical path before any filesystem operation.
- Resolve source and target physical paths under the configured local storage root through the local path helper.
- Require the source to exist and be a regular file.
- Create the target parent directory only after target containment is verified.
- Avoid overwriting existing targets.
- Prefer filesystem rename when source and target are on the same filesystem.
- Use copy plus unlink only as a carefully handled fallback if cross-device moves are possible.
- If copy plus unlink is used, verify target write completion before unlinking source.
- Clean up a partial target if move/copy fails.
- Do not expose physical paths, storage roots, raw tokens, signed URLs, or file contents in responses or logs.
- Distinguish missing local source from unsupported Supabase-backed source.

Missing local source should not trigger an automatic Supabase download. The local filesystem target starts clean by policy.

## 7. DB/File Partial-Failure Strategy

Pending-to-formal moves coordinate a non-transactional filesystem operation with database metadata writes. The plan for later implementation must pick an explicit failure model.

### Option A: Move file before DB write

Benefit:

- The DB is not updated to a formal path unless the file exists at the formal target.

Risk:

- If the later DB write fails, the file may already be moved and the old metadata may still point at the pending path.

Possible compensation:

- Try to rename the file back to the pending path.
- If rollback fails, record enough information for diagnostics/orphan cleanup.

### Option B: DB write before file move

Benefit:

- Avoids moving files if DB authorization or validation fails.

Risk:

- If the file move fails after DB update, metadata points to a missing formal file.

This is risky for user-facing preview/download and should not be the default unless paired with a durable retry/reconciliation mechanism.

### Option C: Two-phase-ish route workflow

Recommended conservative direction for later implementation:

1. Validate request, auth, owner, document state, source logical paths, and target logical paths.
2. Resolve all local source and target paths and check source existence/target non-existence.
3. Move local files before the DB metadata write.
4. Persist DB metadata/status/audit changes.
5. If DB persistence fails, attempt best-effort rollback of moved files to original pending paths.
6. If rollback fails, return failure and leave a structured server-side marker/log for later diagnostics without exposing physical paths.

This approach minimizes the risk of metadata pointing to missing files. It still has orphan risk and must be covered by diagnostics/orphan cleanup in a later phase.

## 8. Mixed Storage State Policy

This policy is critical for later implementation:

- Local files only exist for newly uploaded local `/api/upload` files.
- Older Supabase Storage files are not locally available.
- Direct `AttachmentEditor` files remain Supabase-backed until that component is migrated.
- Mixed storage state is expected during the migration.
- Future local move code must detect unsupported or missing local files clearly.
- Future local move code must not auto-fetch, copy, download, backfill, or sync files from Supabase into local storage.
- Unsupported Supabase-backed source paths should fail with a controlled compatibility error or be explicitly skipped according to a route-specific contract.
- Tests must prove no Supabase download/copy/backfill path was added.

## 9. Test Strategy For Future Implementation

Future helper-level tests:

- Moves an underscore pending path to a formal path.
- Moves a dash pending path to a formal path.
- Leaves an already formal path unchanged.
- Rejects unsafe source logical paths.
- Rejects unsafe target logical paths.
- Rejects owner mismatch.
- Returns a controlled missing-source error.
- Rejects target-exists/no-overwrite.
- Preserves UUID-based formal filename shape.
- Does not expose physical paths or storage roots.
- Cleans partial target on simulated move/copy failure.
- Does not call Supabase download/copy/backfill.

Future route-level tests:

- `rename-pending` preserves `{ success: true, renamed, errors? }`.
- `rename-pending` rejects body/session owner mismatch.
- `submit` preserves `temp-id` behavior if retained.
- `submit` preserves `201 { success: true, dokumen }` response shape.
- `PATCH /api/dokumen/$id` preserves `{ dokumen }` response shape and metadata update behavior.
- `PATCH /api/ppk/resubmit/$id` preserves `{ success: true }`.
- `POST /api/ppk/resubmit/$id` preserves FSM transition behavior and `{ success: true }`.
- Metadata updates preserve `kelengkapan_id`, `nama`, and `uploaded_at`.
- Partial failure does not persist metadata pointing to a missing formal local file.
- Already formal paths are not removed or re-moved.
- Supabase-backed/missing local source returns a controlled error and does not fetch from Supabase.

Regression/manual checks for later implementation:

- Upload through `FileUploadButton`, then exercise the selected move route using only new local files.
- Verify no physical path, storage root, token, signed URL, or file content appears in network responses or logs.
- Verify default preview/download behavior remains unchanged unless the phase explicitly changes it.

## 10. Boundaries With Other Phases

These areas remain out of scope for this phase:

| Boundary | Why separate |
|---|---|
| `AttachmentEditor` migration | It is a browser Supabase upload/delete producer. Moving it behind local APIs changes UI upload behavior and auth semantics. |
| Delete/remove behavior | Pending reset/cancel, replaced-file cleanup, non-material document delete, and helper cleanup have different failure and retry semantics from move. |
| Archive destruction deletion | Destruction changes archive lifecycle state, `lampiran_snapshot`, and access behavior after `DIMUSNAHKAN`; it must be planned separately. |
| Diagnostics/orphan cleanup | Cleanup needs a dry-run-safe local filesystem scanner and comparison against active document metadata and archive snapshots. |
| Preview/download default migration | Serving files needs token/authorization and `DIMUSNAHKAN` handling beyond move semantics. |
| Internal URL default enablement | Caller enablement depends on local file availability and preview/download fallback policy. |
| Supabase Storage retirement | Supabase remains the reference until storage parity is verified. |
| Broad API migration | Submit/resubmit read/write database migration belongs to later DB/API phases; this phase only plans storage move compatibility. |

## 11. Recommended Implementation Sequence

Recommended future phases:

1. Phase 6E.7: Local pending-to-formal move helper foundation, no route wiring. Build isolated helper tests for classification, owner checks, no-overwrite moves, missing local source, rollback hooks, and no physical path exposure.
2. Phase 6E.8: `rename-pending` local move route implementation. Wire the smallest route first because it returns renamed paths and does not directly update document rows.
3. Phase 6E.9: submit local move compatibility implementation. Decide whether to preserve `temp-id` or replace it with a tested compatible strategy.
4. Phase 6E.10: update/resubmit local move compatibility. Wire `PATCH /api/dokumen/$id`, `PATCH /api/ppk/resubmit/$id`, and `POST /api/ppk/resubmit/$id` after helper and route behavior are proven.
5. Phase 6E.11: AttachmentEditor migration planning. Plan browser direct upload/delete replacement separately before implementation.
6. Phase 6E.12: Delete/remove and local orphan diagnostics planning. Cover pending reset/cancel, replaced-file cleanup, archive destruction deletion, and admin cleanup dry-run before destructive runtime changes.

Helper foundation should come before route wiring. The helper is where path classification, containment, no-overwrite, source existence, and partial-failure behavior can be tested without mutating workflow state.

## 12. Explicitly Not Implemented

Phase 6E.6 does not implement:

- runtime source changes;
- local move helper;
- submit changes;
- rename-pending changes;
- resubmit changes;
- update route changes;
- upload behavior changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL default enablement;
- Supabase Storage migration, copy, download, backfill, or sync;
- route tree changes;
- DB schema changes;
- auth/session runtime changes.

## 13. Validation Performed

Files read for this planning phase:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/migration-constraints.md`
- `docs/migration/migration-roadmap.md`
- `docs/migration/phase-plan.md`
- `docs/migration/open-decisions.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/local-upload-replacement-planning.md`
- `docs/migration/local-upload-helper-foundation.md`
- `docs/migration/local-upload-route-implementation.md`
- `docs/migration/local-upload-runtime-smoke-handoff.md`
- `docs/migration/local-filesystem-storage-foundation.md`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/lib/dokumen/storage.ts`
- `src/lib/utils/file.ts`
- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `src/routes/api/upload.ts`
- `src/lib/storage/local-upload.ts`
- `src/components/dokumen/AttachmentEditor.tsx`

Commands run:

```powershell
git status --short --branch
```

Result: initial status was clean on branch `migration/postgres-local`.

```powershell
rg -n "\.move\(" src tests
```

Result: found current Supabase move calls in `src/lib/dokumen/storage.ts`, `src/routes/api/dokumen/submit.ts`, and `src/routes/api/dokumen/rename-pending.ts`.

```powershell
rg -n "rename-pending" src tests docs\migration
rg -n "pending-upload-api|pending-dash" src tests docs\migration
rg -n "temp-id" src tests docs\migration
rg -n "\.remove\(" src\components src\routes\api src\lib tests
rg -n "lampiran_snapshot" src\routes\api src\lib tests docs\migration\storage-replacement-planning-contract.md
rg -n "lampiran_urls|lampiranUrls" src\routes\api\dokumen src\routes\api\ppk src\lib\dokumen src\lib\schemas tests\unit\storage
rg -n "isPending|isPendingFile|isStoragePathPending" src tests docs\migration
```

Result: confirmed the pending path classification/tests, `temp-id` compatibility references, delete/remove boundaries, archive snapshot boundaries, lampiran metadata shape, and dash-only current pending detection surfaces documented above.

Final validation commands after documentation edits:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result: recorded in the task final response.

## 14. Phase 6E.7 Follow-Up Note

Phase 6E.7 added the isolated helper foundation described in `docs/migration/local-pending-move-helper-foundation.md`.

The helper implements the planned foundation only: source classification, owner validation, formal target generation, internal physical path resolution, no-overwrite local file movement, formal no-op behavior, and logical-only results.

No submit, `rename-pending`, update, resubmit, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download, UI caller, route tree, database schema, auth runtime, or Supabase Storage migration behavior changed.
