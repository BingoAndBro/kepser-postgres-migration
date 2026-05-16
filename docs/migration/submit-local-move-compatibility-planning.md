# Phase 6E.11 Submit Local Move Compatibility Planning

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.11 is documentation and planning only. It defines the compatibility plan for replacing the current submit route Supabase Storage pending-to-formal move behavior with local filesystem move behavior in a later implementation phase.

No runtime source code changed in this phase. Submit local move behavior is not implemented in this phase.

This phase does not change submit, update, PPK resubmit, upload, `rename-pending`, UI callers, `AttachmentEditor`, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download behavior, auth/session runtime, database schema, route generation, or Supabase Storage behavior.

## 2. Current Submit Route Inventory

Current route file:

```text
src/routes/api/dokumen/submit.ts
```

Current endpoint:

```text
POST /api/dokumen/submit
```

Current TanStack route registration:

```ts
createFileRoute('/api/dokumen/submit')
```

Current route role:

- Combined create and submit endpoint used by the Pegawai create-document flow.
- It creates a new `dokumen_transaksi` row, then transitions status, then appends an audit log.
- It is not the existing-document submit endpoint. `POST /api/dokumen/$id/submit` is separate and was not changed or planned for local move wiring in this phase.

Current request body shape is validated by `createAndSubmitDokumenSchema`:

```ts
{
  fungsiId: string
  kegiatanJenisId: string
  isKetuaTim: boolean
  tahun: number
  tanggal: string
  lampiranUrls: {
    kelengkapan_id: string
    nama: string
    url: string
    uploaded_at: string
  }[]
  nominal_realisasi?: number | null
  is_non_material?: boolean
  jenisDokumenId?: string
  keteranganDetail?: string
  jenisPermintaanId?: string
  kategoriPermintaanId?: string
  detailPermintaanId?: string
}
```

Current response and status inventory:

- Invalid JSON returns `400 { error: 'Invalid JSON body' }`.
- Schema validation failure returns `400 { error: 'Validasi gagal', details }`.
- Invalid material nominal returns `400 { error }`.
- Missing session returns `401 { error: 'Unauthorized' }`.
- Missing required attachment returns `400 { error: 'Lampiran wajib belum lengkap: ...' }`.
- Empty `lampiranUrls` returns `400 { error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }`.
- Missing kegiatan returns `400 { error: 'Kegiatan tidak ditemukan' }`.
- Invalid Ketua Tim assignment returns `403 { error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }`.
- Supabase move failure returns `500 { error, details: { failedPath, newPath, reason } }`.
- Document create failure returns `500 { error }`.
- FSM transition failure returns `500 { error }`.
- Status update failure returns `500 { error }`.
- Success returns `201 { success: true, dokumen: updatedDok }`.

Current auth/session mechanism:

- Creates a request-scoped Supabase server client from the request cookie header.
- Calls `getServerSession(supabase)` from `src/lib/auth.ts`.
- Uses `session.user.id` as creator, storage owner segment, Ketua Tim assignment user id, status-update/audit user id, and user display metadata source.

Current role/ownership validation:

- The route is effectively Pegawai submit behavior, but it does not explicitly check active role or assigned `PEGAWAI` role in this file.
- Material submit uses `transition(dok.status, 'SUBMIT', 'PEGAWAI')`, so the FSM actor role is hardcoded to `PEGAWAI`.
- If `isKetuaTim` is true, the route checks `ketua_tim_assignments` for a row where `user_id=session.user.id` and `kegiatan_id=kegiatanJenisId`.
- There is no existing document ownership check because the route creates a new document row.
- File owner validation is not performed before Supabase `.move(...)`; the target owner segment is derived from `session.user.id`, but source paths come from client-provided `lampiranUrls`.

Current material vs non-material branching:

- `validateNominalForMaterial(...)` requires `nominal_realisasi > 0` for material documents and exempts non-material documents.
- Required kelengkapan validation runs when the document is material or when `jenisPermintaanId` is present.
- Non-material title leaf name comes from `master_jenis_dokumen` when `jenisDokumenId` is provided.
- Material title leaf name comes from the request chain through `resolveLeafNodeName(...)`.
- Document creation persists `is_non_material`, `jenis_dokumen_id`, `keterangan_detail`, and material request-chain fields through `createDokumen(...)`.

Current FSM/status transition behavior:

- `createDokumen(...)` inserts the row with `status: 'DRAFT'`.
- For material documents, submit calls `transition(dok.status, 'SUBMIT', 'PEGAWAI')`, producing `IN_PPK_VALIDATION`, `current_step='PPK'`, `revision_target=null`, and `stepUrutan=1`.
- For non-material documents, submit does not call the generic FSM transition. It manually creates a successful transition result with `newStatus: 'TERSIMPAN'`, `newCurrentStep: null`, `newRevisionTarget: null`, and `stepUrutan: 1`.
- The code comment says "Non-Material: DRAFT -> COMPLETED", but the actual implemented status is `TERSIMPAN`. The implemented status is the compatibility source of truth.
- `updateDokumenStatus(admin, dok.id, ...)` writes `status`, `current_step`, `revision_target`, resets `revision_notes` to null, and updates `updated_at`.
- The response merges the transition fields into the newly created document object before returning.

Current attachment metadata handling:

- Input attachments are parsed as `lampiranUrls`.
- The route assigns `let processedLampirans = parsed.data.lampiranUrls`.
- For each attachment whose `url` is detected as pending by the route-local dash regex, it moves the storage object and replaces that array entry with `{ ...lamp, url: newPath }`.
- `kelengkapan_id`, `nama`, and `uploaded_at` are preserved.
- `createDokumen(...)` persists `lampiran_urls` as `JSON.stringify(processedLampirans)`.
- The route does not call `syncDocumentAttachments(...)` or any helper in `src/lib/dokumen/storage.ts`.

Current Supabase Storage `.move(...)` behavior:

- The route creates a Supabase admin client with `createAdminClient()`.
- For each dash-pending file, it calls:

```ts
admin.storage.from('dokumen-lampiran').move(oldPath, newPath)
```

- It asks Supabase Storage to move the object by logical bucket path.
- It does not fetch, download, copy, backfill, or sync Supabase files in application code.

Current `temp-id` behavior:

- Submit moves pending files before the real document id exists.
- Its target path is generated as:

```text
{session.user.id}/temp-id/{uuid}.{ext}
```

- This means files moved during combined create+submit do not use the newly created document id in their formal path.
- The persisted `lampiran_urls.url` values can therefore contain `temp-id` even though the row later receives a real `dokumen.id`.

Current audit/log behavior:

- After status update, the route calls `insertLog(admin, ...)`.
- Material submit inserts `aksi: 'SUBMIT'`.
- Non-material submit inserts `aksi: 'STORE'`.
- `step_urutan` comes from the transition result.
- `insertLog(...)` inserts into `log_aktivitas`; it does not update or delete audit rows.
- The route does not handle insert-log failure explicitly. It awaits the helper but does not abort when the helper returns an error object.

Whether the route creates/updates document rows:

- It creates a `dokumen_transaksi` row through `createDokumen(...)`.
- It then updates the same row's status fields through `updateDokumenStatus(...)`.
- It appends a row to `log_aktivitas` through `insertLog(...)`.

Whether it calls helpers in `src/lib/dokumen/storage.ts`:

- It does not call `syncDocumentAttachments(...)`.
- It does not call `deleteOrphanFiles(...)`.
- Its pending detection, extension extraction, formal target generation, and Supabase `.move(...)` loop are route-local.

## 3. Current Storage Move Semantics In Submit

Pending path detection:

- Submit considers an attachment pending only if the last path segment matches:

```text
^\d{13}-[a-zA-Z0-9]+-.+$
```

- This detects dash pending paths in the shape:

```text
{userId}/{timestamp}-{random}-{filename.ext}
```

- It does not detect underscore `/api/upload` pending paths:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

- It does not call `classifyStoragePath(...)` or `classifyLocalPendingMovePath(...)`.

Formal path generation:

- Submit extracts the extension from the source URL by splitting the last filename segment on `.`.
- It generates a new UUID filename.
- It builds:

```text
{session.user.id}/temp-id/{uuid}.{ext}
```

How `temp-id` is used:

- `temp-id` is a hardcoded document segment used only because submit moves files before `createDokumen(...)` returns a real document id.
- The later `dokumen.id` is not substituted back into moved paths.
- The moved `temp-id` paths are persisted in `dokumen_transaksi.lampiran_urls`.

How moved URLs are persisted:

- Only the `url` field changes.
- Other attachment metadata fields are preserved.
- The processed attachment array is passed to `createDokumen(...)`.
- `createDokumen(...)` persists the array by JSON-stringifying it into `lampiran_urls`.

Missing and move failure behavior:

- Submit does not preflight source existence in application code.
- Supabase `.move(...)` determines whether the source exists and whether move succeeds.
- On the first `moveError`, the route returns `500` and includes logical `failedPath`, logical `newPath`, and the Supabase error message.
- Earlier successful moves are not rolled back if a later move fails.

Partial move timing:

- File moves happen before `createDokumen(...)`.
- If one or more moves succeed and `createDokumen(...)` later fails, files may already be moved to `temp-id` paths with no database row referencing them.
- If `createDokumen(...)` succeeds but `updateDokumenStatus(...)` fails, the row may exist as `DRAFT` with moved `temp-id` metadata.
- If `updateDokumenStatus(...)` succeeds but `insertLog(...)` fails, the route still returns success because the helper error is not checked.

Retry and rollback:

- Submit does not retry Supabase moves.
- Submit does not roll back moved files on later DB/status/audit failure.
- Submit does not record a durable cleanup marker for moved files.

Supabase file access behavior:

- Submit only asks Supabase Storage to move objects in the bucket.
- It does not fetch, download, copy, backfill, or sync files from Supabase Storage into application memory or local filesystem storage.

## 4. Required Compatibility Contract For Future Local Submit Wiring

Future submit local move wiring must preserve:

- Endpoint path remains `/api/dokumen/submit`.
- HTTP method remains `POST`.
- Request body remains compatible with `createAndSubmitDokumenSchema`.
- Response success status remains `201`.
- Success response remains compatible with `{ success: true, dokumen }`.
- Existing validation error categories and user-facing messages should remain compatible where UI behavior depends on them.
- Material submit status behavior remains `DRAFT -> IN_PPK_VALIDATION`, `current_step='PPK'`, `revision_target=null`, `stepUrutan=1`.
- Non-material submit behavior remains the implemented shortcut to `TERSIMPAN`, `current_step=null`, `revision_target=null`, `aksi='STORE'`.
- FSM behavior and the manual non-material shortcut must not drift.
- Audit log behavior remains append-only and compatible.
- Attachment metadata keeps the same JSON shape.
- `lampiran_urls.url` values remain logical paths only.
- Physical filesystem paths and storage roots must never be returned to clients or persisted in database metadata.
- Future local owner segment must be server-authoritative.
- Client-provided path owner segments must not be treated as authorization proof.
- No Supabase Storage fetch, copy, download, backfill, or sync may be introduced.
- Existing Supabase Storage files must not be migrated or hydrated into local storage.

## 5. Auth And Ownership Plan

Current submit assumptions:

- Session comes from Supabase Auth through `getServerSession(supabase)`.
- `session.user.id` is used as the creator id and formal target owner segment.
- User display name comes from Supabase user metadata or email.
- Ketua Tim validation reads `ketua_tim_assignments` through the Supabase client.
- Document creation and master-data reads remain Supabase-backed.

Target local auth assumptions:

- Local upload now writes owner-prefixed logical paths using local `dms_session`.
- `getLocalServerSession(request)` returns `session.userId`, assigned roles, and active role from the local auth runtime.
- New `/api/upload` files use the local user id as the first logical path segment.
- `rename-pending` local route already treats body `userId` as compatibility input only and validates it against the local session.

Recommended future submit behavior:

- Use `getLocalServerSession(request)` only when the surrounding document/workflow dependencies are safe to run with local user ids and local-compatible reads/writes.
- Do not trust client-provided path owner segments.
- Validate every local pending source path owner against the local session user id before moving.
- Validate the actor is allowed to create/submit as Pegawai or preserve the current hardcoded FSM role behavior only if role compatibility is documented and tested.
- Preserve Ketua Tim assignment enforcement. If submit still reads `ketua_tim_assignments` through Supabase helpers, the local session user id must match the ids used in that table or a smaller bridge phase is needed.
- Preserve document creator semantics. `created_by` must be the server-authenticated user id, not a request body value.
- Do not weaken authorization just to remove Supabase auth from the route.

Implementation blocker risk:

- Current submit still depends heavily on Supabase-backed document/master/write helpers: `getKelengkapanRequired(...)`, direct master-data queries, `resolveLeafNodeName(...)`, `createDokumen(...)`, `updateDokumenStatus(...)`, and `insertLog(...)`.
- If those helpers still expect Supabase Auth ids or Supabase-backed data while local uploads use local ids, submit implementation may need a smaller pre-phase or bridge before local move wiring.
- A safe pre-phase may need to prove local user ids, local seed master data, document writes, Ketua Tim checks, and audit writes are compatible for submit before local file movement is enabled.

## 6. Local Move Helper Usage Plan

Future submit implementation should use the Phase 6E.7 helper only after request, session, role/owner, and document/workflow preconditions are validated.

Relevant helper functions:

```ts
classifyLocalPendingMovePath(...)
generateLocalFormalTargetLogicalPath(...)
moveLocalPendingFileToFormal(...)
```

Recommended usage sequence:

1. Parse and validate the request body with the existing schema.
2. Resolve the server-authoritative local session if the route is ready for local auth.
3. Validate material/non-material prerequisites, required attachments, kegiatan, title leaf, and Ketua Tim assignment before moving files.
4. Classify every attachment `url` with `classifyLocalPendingMovePath(...)`.
5. Leave already formal paths unchanged.
6. Decide route policy for safe unsupported paths before implementation.
7. Preflight supported pending paths for owner match, source existence, and generated target safety before moving any files.
8. Move supported local pending files with `moveLocalPendingFileToFormal(...)`.
9. Map old attachment URLs to returned formal logical URLs in a new processed attachment array.
10. Persist only the processed logical metadata.

Use actual document id or `temp-id`:

- Current submit cannot use the real document id before `createDokumen(...)` because the file move happens first.
- The Phase 6E.7 helper supports `dokumenId: 'temp-id'` and has focused test coverage for that compatibility case.
- A later implementation must not casually switch from `temp-id` to the real `dokumenId` unless response, metadata, preview/download, archive snapshot, cleanup, and retry behavior are proven.

Mapping behavior:

- For `action: 'moved'`, replace only `lamp.url` with `result.targetLogicalPath`.
- For `action: 'unchanged'`, keep the existing formal URL.
- Preserve `kelengkapan_id`, `nama`, and `uploaded_at`.

Unsupported paths:

- Already formal paths should stay unchanged.
- Safe unsupported paths should either stay unchanged or fail according to a route-specific compatibility decision.
- Unsafe paths should fail with a controlled validation error.
- Supported pending paths with missing local source should fail in a controlled way and must not fall back to Supabase.

Avoid Supabase fallback:

- Do not call Supabase Storage `.move(...)` as a fallback for missing local files in a local submit phase.
- Do not fetch/download/copy/backfill/sync Supabase objects.
- Mixed-storage failures must be visible rather than silently converted.

## 7. `temp-id` Compatibility Decision

Current precise behavior:

- Submit receives attachment metadata before a document exists.
- For dash-pending paths only, it calls Supabase Storage `.move(...)` before `createDokumen(...)`.
- It builds the target as `{session.user.id}/temp-id/{uuid}.{ext}`.
- It persists the resulting `temp-id` logical path in `dokumen_transaksi.lampiran_urls`.
- The real `dokumen.id` created later is not used to rewrite those paths.

Why `temp-id` exists:

- It avoids needing a document id before moving files.
- It allows the combined create+submit request to keep a simple order: validate, move pending files, create draft row, transition status, log.

Scope of current behavior:

- It is specific to the combined create+submit flow in `POST /api/dokumen/submit`.
- It applies to material and non-material documents if their attachment URLs match the dash pending detector.
- It does not apply to `rename-pending`, update, or PPK resubmit, which use existing document ids.
- It does not apply to underscore `/api/upload` pending paths today because submit does not detect them.

Risks of preserving `temp-id`:

- It keeps formal logical paths that do not include the real document id.
- It may complicate future diagnostics, orphan cleanup, document-scoped access checks, archive snapshots, and backup verification.
- It keeps the mismatch between document metadata and storage namespace.

Risks of replacing `temp-id` with actual `dokumenId`:

- It changes persisted path semantics for submit-created documents.
- It requires changing operation order, likely create row before file move or insert draft then update metadata.
- DB/file partial-failure behavior becomes more complex because a row may exist before file movement is complete.
- Existing preview/download, archive snapshot, cleanup, and tests may assume current metadata shape or tolerate `temp-id` paths.

Recommended direction:

- Do not casually remove `temp-id`.
- If actual `dokumenId` can be known before move through a safe pre-create transaction or draft-row strategy, prefer formal `{userId}/{dokumenId}/{uuid}.{ext}` only after response and metadata compatibility are proven.
- Otherwise preserve `temp-id` behavior in a bounded submit-local-move implementation and plan a later cleanup/migration only after storage/workflow parity is stable.
- Any cleanup of `temp-id` paths must be a separate phase because it would rewrite persisted metadata and may affect archive snapshots.

No implementation is performed in this phase.

## 8. DB/File Partial-Failure Strategy

Submit coordinates filesystem moves with document row creation, status updates, and audit logging. Local filesystem operations are not automatically transactional with database writes.

Move before DB insert/update:

- Benefit: metadata is not written with a local formal path unless the file move has already succeeded.
- Risk: if DB creation or status update fails after file movement, local formal files become orphaned and the original pending path no longer exists.
- This is closest to current submit order.

DB insert/update before move:

- Benefit: a real `dokumenId` can be used for formal paths.
- Risk: DB metadata can point to pending paths or missing files if moves fail after DB writes.
- This can expose broken preview/download behavior unless paired with transactional status handling and durable cleanup/retry.

Preflight all local paths before moving:

- Strongly recommended for a later local implementation.
- Validate request, session, owner, supported path classification, source existence, target path generation, and target non-existence before moving any files.
- Preflight reduces partial failure but does not eliminate filesystem races.

Partial local moves before DB failure:

- If moves happen first, earlier successful moves may remain after a DB failure.
- Future code should record enough server-side context for diagnostics without exposing physical paths.
- Best-effort rollback to original pending paths may be attempted, but rollback can fail.

DB metadata pointing to missing files:

- Avoid this as the primary failure mode.
- It directly breaks preview/download and archive snapshot consistency.
- Do not persist local formal paths unless file movement is known to have succeeded.

Orphan local formal files:

- Orphans are preferable to metadata pointing at missing files, but they still need diagnostics/orphan cleanup later.
- Diagnostics/orphan cleanup is not implemented in this phase and should not be hidden as a silent side effect.

Audit log consistency:

- `log_aktivitas` remains append-only.
- Do not update or delete audit rows to repair file failures.
- Future implementation should decide whether audit insertion failure after status update is fatal. Current submit does not check `insertLog(...)` errors.

Transaction boundaries:

- If submit document writes are still Supabase-backed, there is no single local PostgreSQL transaction available around file moves.
- If submit writes are migrated to local Drizzle later, the DB transaction can cover document/status/audit writes, but it still cannot atomically include filesystem moves.

Recommended conservative later strategy:

1. Perform all request, auth, role, owner, master-data, and attachment validation before file movement.
2. Classify and preflight every local pending path before moving any file.
3. Preserve `temp-id` initially unless a real document id strategy is proven safe.
4. Move all local files.
5. Create the document, update status, and append audit in the smallest safe DB unit available.
6. If DB persistence fails after moves, attempt best-effort rollback to original pending paths.
7. If rollback fails, return failure and leave a structured server-side marker for later diagnostics.
8. Do not expose physical paths, storage roots, tokens, env values, or file contents in any response or log.

## 9. Mixed Storage State Policy

The future submit local move implementation must explicitly follow the mixed-storage policy:

- Submit local move can only move files that exist locally.
- Old Supabase Storage files are not locally available.
- New `/api/upload` files are local and use underscore pending paths.
- `AttachmentEditor` dash pending files may be Supabase-backed until `AttachmentEditor` is migrated.
- A missing local source must not trigger Supabase fetch, copy, download, backfill, sync, or fallback.
- Future submit must clearly report or preserve unsupported/missing paths according to a chosen policy.
- Do not silently convert Supabase-backed metadata into local paths.
- Use only clean local seed data and newly uploaded local files for verification.

Compatibility warning:

- Current submit detects dash pending only, while current local `/api/upload` creates underscore pending paths.
- A future local submit implementation that supports underscore paths will enable newly uploaded local `/api/upload` files to be moved by submit, but that is a behavior expansion relative to current submit detection and must be tested.

## 10. Interaction With Rename-Pending

Current `rename-pending` state:

- `POST /api/dokumen/rename-pending` is now local-filesystem-backed and route-specific.
- It uses local `dms_session`.
- It validates body `userId` as compatibility input against the local session.
- It checks document ownership.
- It uses the Phase 6E.7 helper for local moves.
- It supports underscore and dash pending paths when files exist locally.
- It skips already formal and safe unsupported paths.
- It reports missing local sources without Supabase fallback.

Submit interaction policy:

- Submit should not duplicate or conflict with `rename-pending` without a deliberate route policy.
- Potential caller flows may be upload -> submit, or upload -> rename-pending -> submit.
- Future submit must avoid double-moving already formal paths.
- Already formal paths should remain unchanged.
- If a file was already formalized by `rename-pending`, submit should persist the formal URL as provided and not move it again.
- If submit performs its own move, it must not assume `rename-pending` already ran.
- The two routes should share helper semantics but keep route-specific response and DB-write behavior separate.

## 11. Test Strategy For Future Implementation

Future submit implementation should add focused tests before broad workflow testing.

Required route-level tests:

- Unauthorized request returns compatible `401`.
- Invalid JSON body returns compatible `400`.
- Invalid schema body returns compatible `400 { error: 'Validasi gagal', details }`.
- Material submit with valid local files creates a document response with `IN_PPK_VALIDATION`, `current_step='PPK'`, and `revision_target=null`.
- Non-material submit with valid local files creates a document response with `TERSIMPAN`, `current_step=null`, and `revision_target=null`.
- Material nominal validation remains enforced.
- Required attachment validation remains enforced.
- Ketua Tim validation remains enforced.
- Attachment metadata preserves `kelengkapan_id`, `nama`, and `uploaded_at`.
- Underscore pending local file move succeeds when the file exists locally.
- Dash pending local file move succeeds when the file exists locally.
- Already formal paths remain unchanged.
- Safe unsupported path behavior is explicit and tested.
- Missing local source returns a controlled error and does not call Supabase fallback.
- Target exists/no-overwrite behavior returns a controlled error.
- `temp-id` behavior is preserved if selected.
- If actual `dokumenId` behavior is selected instead, tests must prove compatibility and document the intentional behavior change.
- DB failure after file preflight does not move files.
- DB failure after file movement triggers the selected compensation behavior.
- File move failure before DB write does not create or update document metadata.
- Responses and errors do not expose physical paths or storage roots.
- Audit log remains append-only.
- `insertLog(...)` failure handling is explicitly tested if behavior changes from current unchecked helper result.
- `src/routeTree.gen.ts` has no diff.
- Update, resubmit, upload, `rename-pending`, and UI behavior have no side effects.

Required helper-level or integration tests:

- `classifyLocalPendingMovePath(...)` is used for both supported pending formats.
- `moveLocalPendingFileToFormal(...)` preserves no-overwrite behavior.
- Missing local source does not trigger any Supabase file access.
- Safe unsupported paths are not moved.
- No physical path/root appears in helper results.

Manual smoke checks for a later implementation:

- Use only new local files uploaded through `/api/upload`.
- Submit a material document and verify status, log action, and logical attachment paths.
- Submit a non-material document and verify `TERSIMPAN`, log action `STORE`, and logical attachment paths.
- Verify default preview/download behavior remains unchanged unless that phase explicitly changes it.
- Verify `rename-pending` behavior remains unchanged.

## 12. Boundaries With Other Phases

Out of scope for this phase and for any narrow submit phase unless explicitly approved:

| Boundary | Why separate |
|---|---|
| Update route local move wiring | `PATCH /api/dokumen/$id` combines attachment sync, metadata update, status edit rules, non-material edit logging, and old/replaced file cleanup. |
| PPK resubmit local move wiring | PPK resubmit combines role checks, revision-target constraints, optional attachment updates, optional nominal updates, and FSM transition in the `POST` path. |
| `AttachmentEditor` migration | It is still a browser Supabase upload/delete producer. Moving it behind APIs changes UI upload/delete behavior and auth ownership semantics. |
| Delete/remove behavior | Pending reset/cancel, replaced-file cleanup, non-material document delete, and orphan cleanup are destructive operations with separate retry and failure policy. |
| Archive destruction deletion | Destruction updates archive lifecycle state, clears snapshots, deletes files, and must preserve `DIMUSNAHKAN` access blocking. |
| Diagnostics/orphan cleanup | Local filesystem scanning needs a dry-run-safe scanner and comparison against document metadata and archive snapshots. |
| Preview/download default migration | Preview/download requires authorization, token or streaming behavior, content headers, local file existence policy, and destroyed-archive checks. |
| Internal URL default enablement | Caller enablement depends on local file availability and fallback/rollback policy. |
| Supabase Storage retirement | Supabase Storage remains the reference until all storage surfaces reach parity. |
| Broad API migration | Submit local move planning does not migrate broad document reads/writes, master-data APIs, or workflow mutations. |

## 13. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.12 Submit Local Move Preflight/Bridge Planning
```

Direct implementation is not automatically recommended yet.

Reasoning:

- Submit still depends on Supabase-backed document/master/write helpers.
- Submit still uses Supabase Auth session ids while local upload uses local `dms_session` owner ids.
- Submit creates the document, updates status, and inserts audit logs in one route.
- Submit has `temp-id` compatibility behavior that affects persisted metadata.
- Submit has broader DB/file partial-failure risk than `rename-pending`.
- The current route does not validate source path owner before moving, but a local implementation should not preserve that weakness without an explicit compatibility/security decision.

Phase 6E.12 should be implementation only if the preflight proves submit can be safely bounded. If local document/read/write helpers or transaction support are required first, the safer next phase is a submit bridge/preflight phase rather than runtime move wiring.

Potential Phase 6E.12 outputs:

- A focused submit preflight/bridge plan proving local session id, local upload owner id, document `created_by`, master-data reads, Ketua Tim checks, status update, and audit writes can coexist safely.
- Or a minimal submit move implementation plan with explicit `temp-id` preservation and no broad API migration.

## 14. Explicitly Not Implemented

Phase 6E.11 does not implement:

- runtime source changes;
- submit local move behavior;
- update local move behavior;
- PPK resubmit local move behavior;
- upload behavior changes;
- `rename-pending` behavior changes;
- UI caller changes;
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

## 15. Validation Performed

Files read for this planning phase:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/migration-constraints.md`
- `docs/migration/migration-roadmap.md`
- `docs/migration/phase-plan.md`
- `docs/migration/open-decisions.md`
- `docs/migration/storage-replacement-contract.md`
- `docs/migration/storage-replacement-planning-contract.md`
- `docs/migration/pending-to-formal-local-move-planning.md`
- `docs/migration/local-pending-move-helper-foundation.md`
- `docs/migration/rename-pending-local-move-route-planning.md`
- `docs/migration/rename-pending-local-move-route-implementation.md`
- `docs/migration/rename-pending-runtime-smoke-handoff.md`
- `docs/migration/local-upload-route-implementation.md`
- `docs/migration/local-upload-runtime-smoke-handoff.md`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/upload.ts`
- `src/lib/dokumen/storage.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/dokumen/logs.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/storage/local-pending-move.ts`
- `src/lib/storage/local-storage-paths.ts`
- `src/lib/storage/local-upload.ts`
- `src/lib/auth/local-server-auth.ts`
- `src/lib/auth.ts`
- `src/lib/fsm.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/schemas/dokumen.ts`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `tests/unit/storage/local-pending-move.test.ts`
- `tests/unit/storage/rename-pending-local-route.test.ts`
- `tests/unit/storage/local-upload.test.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- relevant submit/update/resubmit e2e references found through search in `tests/e2e/submit-flow.spec.ts` and `tests/e2e/approval-flow.spec.ts`

Commands run:

```powershell
git status --short --branch
```

Result: initial status was clean on branch `migration/postgres-local`.

```powershell
rg -n "createFileRoute\('/api/dokumen/submit'\)|\.move\(|storage\.from|temp-id|lampiran_urls|lampiranUrls|log_aktivitas|is_non_material|moveLocalPendingFileToFormal|classifyLocalPendingMovePath|getServerSession|getLocalServerSession|createAdminClient|getDokumenById|current_step|revision_target|AttachmentEditor|rename-pending|preview-url|download-url|routeTree\.gen\.ts" src tests docs\migration
```

Result: confirmed submit route registration; remaining submit/shared-helper Supabase `.move(...)` surfaces; `temp-id` references; attachment metadata references; local move helper usage in `rename-pending`; auth helper split; preview/download boundaries; and route-tree references.

```powershell
rg -n "DRAFT|IN_PPK_VALIDATION|IN_BENDAHARA_APPROVAL|COMPLETED|TERSIMPAN|non_material|non-material|ketua_tim" src tests docs\migration
```

Result: confirmed FSM/status constants and tests, submit material/non-material status handling, Ketua Tim checks, and report/status references.

Final validation after documentation edits:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result: recorded in the task final response.

## 16. Phase 6E.12 Follow-Up Note

Phase 6E.12 added `docs/migration/submit-local-move-preflight-bridge-planning.md`.

The preflight concluded that submit should not directly switch to `getLocalServerSession(request)` or local filesystem moves while current submit still uses Supabase-backed master reads, document creation, status updates, and audit inserts. The recommended next step is a no-route-wiring submit move plan builder helper foundation that can plan logical moves and `temp-id` targets without touching the filesystem or changing submit behavior.

Submit route wiring remains blocked until local identity, master-data, document write, status update, and audit write compatibility is proven.

## 17. Phase 6E.13 Follow-Up Note

Phase 6E.13 added the no-route-wiring submit move plan builder helper described in `docs/migration/submit-move-plan-builder-helper-foundation.md`.

The helper can plan underscore pending paths, dash pending paths, formal unchanged paths, unsupported paths, invalid paths, `temp-id` targets, and future real-document-id targets using logical paths only. It does not perform filesystem IO, Supabase Storage calls, file existence checks, submit route wiring, auth migration, document writes, status updates, or audit writes.

The compatibility position in this document remains unchanged: submit runtime implementation must still wait for local identity and document/master/status/audit write compatibility.
