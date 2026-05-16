# Phase 6E.12 Submit Local Move Preflight/Bridge Planning

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.12 is documentation and planning only. It determines whether `POST /api/dokumen/submit` can be safely wired to local filesystem pending-to-formal moves in a later phase, or whether a smaller bridge/helper phase is required first.

No runtime source code changed in this phase.

Submit local move behavior is not implemented in this phase.

No local auth/write bridge is implemented in this phase.

This phase does not change submit, update, PPK resubmit, upload, `rename-pending`, UI callers, `AttachmentEditor`, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download behavior, auth/session runtime, database schema, route generation, or Supabase Storage behavior.

## 2. Why A Preflight/Bridge Phase Is Needed

Submit is more complex than `rename-pending`.

`rename-pending` validates an existing document, moves storage objects, and returns a mapping. It does not update `dokumen_transaksi.lampiran_urls`, status fields, or audit rows directly.

`POST /api/dokumen/submit` is a combined create and submit workflow:

- it validates the create/submit payload;
- it reads master data and required kelengkapan;
- it checks Ketua Tim assignment when requested;
- it derives the document title;
- it moves pending storage objects before document creation;
- it creates a `dokumen_transaksi` row;
- it updates status/current-step/revision-target;
- it appends `log_aktivitas`;
- it returns `201 { success: true, dokumen }`.

Current submit still uses Supabase-backed document/master/write helpers and direct Supabase table reads. It also still uses Supabase Auth assumptions through `getServerSession(supabase)` and `session.user.id`.

Local upload now uses local `dms_session` owner ids. Those owner ids are correct for new local files, but they are not proven compatible with the current Supabase-backed submit writes and Supabase-backed `ketua_tim_assignments` reads.

`temp-id` affects persisted attachment metadata because current submit moves files before a real document id exists and stores paths like `{userId}/temp-id/{uuid}.{ext}` in `lampiran_urls`.

DB/file partial failure is broader than `rename-pending`: a submit route failure can leave moved files without a document row, a draft row with already moved metadata, a status update failure after create, or a status change without a checked audit insert.

## 3. Current Submit Dependency Matrix

| Dependency | Current helper/function/module | Current backing | Local-session ids compatible now? | Risk | Bridge/preflight needed before implementation? |
|---|---|---|---|---|---|
| Auth/session source | `getServerSession(supabase)` in `src/routes/api/dokumen/submit.ts` | Supabase Auth | No. Direct replacement with `getLocalServerSession(request)` is not proven safe while writes remain Supabase-backed. | High | Yes. Need local session/write compatibility gate. |
| User id source | `session.user.id` | Supabase Auth user id | No. Local upload owner ids come from local `auth.users`; current submit helpers still write/read through Supabase clients. | High | Yes. Assert user-id domain before route wiring. |
| User display name | `session.user.user_metadata`, `session.user.email` | Supabase Auth metadata | Partially no. Local session exposes `user.userName` and `email`, but not the same metadata surface. | Medium | Yes. Add route-local display-name adapter if submit later switches auth. |
| Master-data reads | direct `supabase.from('master_kegiatan')`, `master_jenis_dokumen` | Supabase PostgREST | Not by user id, but still points at Supabase data, not local PostgreSQL. | Medium | Yes. Verify target data source before route wiring. |
| Required attachment reads | `getKelengkapanRequired(supabase, ...)` | Supabase helper/query | Not user-id dependent, but Supabase-backed. | Medium | Yes. Keep preflight before move and migrate/read-bridge deliberately. |
| Ketua Tim assignment check | direct `supabase.from('ketua_tim_assignments').eq('user_id', session.user.id)` | Supabase PostgREST | No. Local seeded user ids are not guaranteed to exist in Supabase assignment rows. | High | Yes. Needs local Drizzle read or explicit compatibility assertion. |
| Title/leaf resolution | direct `master_jenis_dokumen` read and `resolveLeafNodeName(supabase, ...)` | Supabase helper/query | Not user-id dependent, but still Supabase-backed. | Medium | Yes. Must run before moving files. |
| Document creation | `createDokumen(supabase, payload)` | Supabase insert into `dokumen_transaksi` | No. `createdBy` would become a local id if auth switches, but the helper/client is still Supabase-backed. | Critical | Yes. Needs local document write bridge or route-local adapter with proven id/data compatibility. |
| Status update | `updateDokumenStatus(admin, dok.id, ...)` | Supabase admin update | No. It can update by document id, but follows a Supabase-created row and Supabase admin client. | High | Yes. Must be coordinated with document creation and local write strategy. |
| Audit insert | `insertLog(admin, ...)` | Supabase admin insert into `log_aktivitas` | No. `userId` would be local if auth switches, but audit table remains Supabase-backed. | High | Yes. Needs append-only local audit write plan. |
| Storage move | route-local `admin.storage.from('dokumen-lampiran').move(...)` | Supabase Storage | No. Local move helper exists, but route context is not safe yet. | High | Yes. Build move plan/preflight before touching filesystem. |
| Attachment metadata persistence | `createDokumen(... lampiranUrls: processedLampirans)` | Supabase `lampiran_urls` JSON string insert | Unsafe with local moved paths until DB/write source is settled. | High | Yes. Preflight must prevent metadata pointing to missing files. |
| FSM transition | `transition(dok.status, 'SUBMIT', 'PEGAWAI')`; manual non-material result | Local TypeScript FSM/manual shortcut | Yes for pure transition semantics. | Medium | Preflight should preserve actor/status behavior and non-material shortcut. |
| Nominal/material validation | `validateNominalForMaterial(...)` and schema | Local Zod/helper | Yes. | Low | Must remain before move. |

Conclusion: submit should not be wired directly to local auth or local filesystem moves while its create/status/audit writes remain Supabase-helper-backed.

## 4. Local Session Compatibility Check

`getLocalServerSession(request).userId` cannot safely replace `session.user.id` in submit today.

Inspected evidence:

- `src/routes/api/dokumen/submit.ts` uses `session.user.id` for creator id, storage owner segment, Ketua Tim assignment user id, status/audit user id, and display-name derivation.
- `createDokumen(...)`, `updateDokumenStatus(...)`, and `insertLog(...)` in `src/lib/dokumen/*` accept Supabase clients and write to Supabase-backed tables.
- `getKelengkapanRequired(...)` and `resolveLeafNodeName(...)` accept Supabase clients and read Supabase-backed master tables.
- Ketua Tim validation in submit directly queries `ketua_tim_assignments` with `session.user.id`.
- Local upload and local `rename-pending` use local `dms_session` ids through `getLocalServerSession(request)`.
- Migration decisions state local seed users use fresh deterministic local UUIDs and old Supabase Auth UUIDs are not imported or preserved.

Local seeded users may share UUID shape with document/master/ketua-tim data, but the inspected docs do not prove that the local user ids are the same ids present in the currently Supabase-backed submit dependencies. The local PostgreSQL seed strategy is fresh and intentionally not a Supabase data restore.

Current Supabase-backed helpers expect identifiers that make sense in the Supabase-backed tables they query or write. Replacing the session source with local ids while still calling those helpers would mix identity domains.

Local auth ids and local upload owner segments match each other for new `/api/upload` files. They do not automatically match current Supabase-backed document writes, audit writes, or `ketua_tim_assignments`.

Before implementation, verify:

- the document write source for submit is local PostgreSQL, or a route-local bridge explicitly supports local ids;
- `created_by` points to the same local user id used by upload owner segments;
- `ketua_tim_assignments.user_id` is checked in the same identity domain as local auth;
- required master data exists in the data source submit reads;
- audit insert uses the same local user id domain;
- role/active-role expectations are preserved without relying on client state.

Recommendation: not yet safe. Create a bridge/helper phase first. Do not switch submit directly to `getLocalServerSession(request)` in the route implementation until local document/master/write compatibility is proven.

## 5. Submit Storage Preflight Requirements

All checks below should happen before any local file move:

- Request schema validation with `createAndSubmitDokumenSchema.safeParse(...)`.
- Auth/session validation through the selected server authority.
- Role/FSM compatibility, including preserving material submit as `SUBMIT` by `PEGAWAI` and preserving the non-material shortcut.
- Material/non-material validation, including `nominal_realisasi` rules.
- Required attachment validation before touching storage.
- Kegiatan/master data validation before touching storage.
- Ketua Tim assignment validation before touching storage.
- Attachment URL classification for every `lampiranUrls[].url`.
- Source owner match against the server-authenticated user id for any local pending path.
- Supported pending vs formal vs unsupported classification policy.
- Local source existence for supported pending paths.
- Generated target path safety, including safe owner segment, safe document segment, safe UUID filename, and logical path classification.
- Target does not exist before moving.
- No physical path, storage root, env value, token, signed URL, or file content exposure in responses or logs.

Preflight must be all-or-nothing where practical: if any supported pending attachment cannot be safely moved, fail before moving any file. This reduces partial-move risk and makes mixed-storage failures visible.

## 6. `temp-id` Bridge Decision

Options:

| Option | Pros | Cons | Compatibility impact |
|---|---|---|---|
| Preserve `temp-id` temporarily | Matches current submit order; avoids needing a real document id before move; helper already supports it. | Keeps formal paths that do not include the real document id; complicates later diagnostics/orphan cleanup. | Conservative. Maintains current persisted metadata shape for submit-created moved paths. |
| Replace with real `dokumenId` | Cleaner final namespace; better document-scoped file ownership and diagnostics. | Requires creating a row before moving or updating metadata after moving; increases DB/file partial-failure complexity. | Behavior change for persisted submit attachment paths. Needs dedicated tests and docs. |
| Two-step draft-create strategy | Can use real id and local DB transaction for row/status/audit writes. | Changes current route ordering; needs local document write bridge first; may create draft rows that must be cleaned up on move failure. | Potentially better long-term, but not a storage-only change. |

Relation to current route order:

- Current route moves files before `createDokumen(...)`, so it cannot use the real document id.
- Preserving `temp-id` allows the later local move to keep current ordering.
- Replacing `temp-id` requires changing route ordering and DB/file compensation strategy.

Relation to the local pending move helper:

- `generateLocalFormalTargetLogicalPath(...)` and `moveLocalPendingFileToFormal(...)` support `dokumenId: 'temp-id'`.
- The helper also supports real document ids, but choosing the real id is a route/workflow decision, not a helper default.

Recommended short-term decision: preserve `temp-id` temporarily for any future bounded submit local move implementation unless a prior local document write bridge proves a safer real-`dokumenId` ordering. Do not introduce a metadata rewrite or cleanup of `temp-id` paths in the submit wiring phase.

## 7. DB/File Ordering Options

| Ordering option | Summary | Benefits | Risks |
|---|---|---|---|
| Current order: move before create | Validate, move pending files to `temp-id`, create row, update status, insert log. | Closest to current behavior; avoids DB metadata pointing to missing moved files if move fails first. | DB failure after move leaves orphaned local files; `temp-id` remains. |
| Pre-create draft row then move to `{dokumenId}` | Create draft, move files to real id path, update attachment metadata/status/audit. | Cleaner path semantics; can know real document id. | If move fails after draft create, route must delete/roll back draft or leave incomplete state. |
| Preflight then move then create | Validate all data and source/target paths, move files, then create/status/audit. | Reduces partial move risk and avoids persisting missing-file metadata. | Still leaves orphan risk if DB write fails after move. |
| Create row with pending paths then move then update metadata | Persist row first, then move files, then update `lampiran_urls`. | Real id is available; row can be a recovery anchor. | If move/update fails, DB may point to pending or missing paths and workflow state must not advance incorrectly. |
| Rollback/compensation strategies | Best-effort move-back or structured cleanup marker after failures. | Mitigates orphan files and retry ambiguity. | Rollback can fail; cleanup marker requires a later diagnostics/orphan mechanism. |

Recommended bounded strategy for the next implementation or bridge phase:

1. Do not implement route wiring yet.
2. Build a submit move plan builder that performs classification and target planning without touching the filesystem.
3. When route wiring becomes safe, perform full request/master/auth/role validation first.
4. Preflight every local source and target before any move.
5. Preserve `temp-id` initially unless a local document write bridge has proven a safe real-id ordering.
6. Move files only after all preflight passes.
7. Persist document/status/audit in the smallest safe DB unit available.
8. If DB persistence fails after moves, attempt best-effort rollback and record a generic server-side recovery marker later, without exposing physical paths.

## 8. Bridge/Helper Options

Possible pre-implementation artifacts:

| Option | What it does | Risk reduction |
|---|---|---|
| Submit attachment preflight helper | Validates attachment metadata, classifies paths, and checks owner/classification policy before moves. | Prevents file moves before route/domain validation. |
| Local session/user-id compatibility assertion helper | Asserts local session id can be used with a target data source and creator/assignment/audit writes. | Blocks identity-domain mixing. |
| Submit move plan builder | Returns planned logical moves and unchanged paths without touching the filesystem. | Allows tests for underscore, dash, formal, unsupported, `temp-id`, and target generation before route wiring. |
| Route-local adapter around existing Supabase-backed document helpers | Attempts to keep current helpers while adapting local session ids. | Risky unless it proves local ids exist in the same write/read domain. |
| Defer until submit document writes are migrated to local Drizzle | Avoids identity mixing; moves submit into the local DB/auth/storage domain together. | Larger phase and delayed storage submit parity. |

Recommendation: create a submit move plan builder helper foundation first, with no route wiring and no filesystem movement. It should be paired with an explicit route gate stating submit cannot switch to local session or local moves until document/master/write compatibility is proven.

The route-local adapter around current Supabase-backed helpers is not recommended as the primary bridge because it can hide identity-domain mismatches.

## 9. Mixed Storage Policy For Submit

Submit local move can only move files that exist locally.

Old Supabase Storage files are not locally available.

`AttachmentEditor` files may still be Supabase-backed because it still uploads through browser Supabase Storage and produces dash pending paths.

Missing local source must not trigger Supabase fetch, copy, download, backfill, sync, or fallback.

Unsupported or missing paths must be visible and controlled. They should not be silently converted into local formal paths.

Do not silently convert Supabase-backed metadata into local paths.

Verification for a later phase must use clean local seed data and newly uploaded local files only.

## 10. Impact On Existing Caller Flows

| Caller flow | Current state | Impact of future submit local move | Recommendation |
|---|---|---|---|
| `FileUploadButton -> /api/upload -> submit` | `/api/upload` writes new local files with underscore pending paths. Current submit does not recognize underscore paths. | Future local submit should support underscore pending paths only when local source exists and preflight passes. | Share helper semantics; do not rely on current dash-only route detector. |
| `FileUploadButton -> /api/upload -> rename-pending -> submit` | `rename-pending` can formalize local files for an existing document. Combined submit creates a new document, so this flow is not the normal create+submit path. | Submit must not double-move already formal paths. | Treat formal paths as unchanged. Submit should not call `rename-pending`. |
| `AttachmentEditor` flows | Still direct browser Supabase Storage upload/delete with dash pending paths. | Dash paths may be missing locally until `AttachmentEditor` is migrated. | Missing local dash sources must be controlled errors or deferred by route policy; no Supabase fallback. |
| Existing formal paths | Formal logical paths can be passed in metadata. | Should not be moved again. | Leave unchanged and preserve metadata. |
| Non-material flow | Current submit creates row then sets `TERSIMPAN` and log action `STORE`. | Storage preflight must not drift the non-material shortcut. | Preserve implemented `TERSIMPAN`, not stale comments. |
| Material flow | Current submit transitions `DRAFT -> IN_PPK_VALIDATION`. | Storage preflight must occur before move and before row/status mutation. | Preserve FSM transition and `current_step='PPK'`. |

Submit should not call the `rename-pending` route. Routes should share helpers, not route-to-route side effects. `rename-pending` is an endpoint contract for existing documents; submit is a combined create+submit workflow with its own validation, DB writes, and response shape.

## 11. Test Strategy For Future Phase

Future helper or implementation tests should cover:

- Local session id compatibility gate.
- Required attachment preflight before file move.
- Underscore pending path preflight.
- Dash pending path preflight when local file exists.
- Missing local source before file move.
- Target exists before file move.
- Already formal path unchanged.
- Safe unsupported path policy.
- `temp-id` target planning.
- Material submit status remains `IN_PPK_VALIDATION`.
- Non-material submit remains `TERSIMPAN`.
- Audit append-only behavior.
- DB failure before move does not move files.
- DB failure after move triggers selected compensation behavior.
- No physical path/root exposure.
- No Supabase fallback.
- No update/resubmit/upload/rename-pending side effects.

Specific future test assertions:

- The move plan builder returns logical paths only.
- The move plan builder does not call filesystem APIs.
- The route implementation, when it exists, does not call Supabase Storage `.move(...)` as fallback for missing local files.
- `insertLog(...)` failure behavior is explicitly preserved or intentionally changed with tests.
- `src/routeTree.gen.ts` remains unchanged for existing route wiring.

## 12. Boundaries With Other Phases

| Boundary | Why separate |
|---|---|
| Actual submit route wiring | It changes runtime workflow/storage behavior and is blocked by local auth/write compatibility. |
| Update route local move wiring | `PATCH /api/dokumen/$id` uses attachment sync, metadata updates, edit status rules, and cleanup deletes. |
| PPK resubmit local move wiring | PPK resubmit combines role checks, revision-target checks, optional attachment updates, optional nominal updates, and FSM transition. |
| `AttachmentEditor` migration | It changes browser upload/delete behavior and ownership semantics. |
| Delete/remove behavior | Pending cleanup, replaced-file cleanup, non-material delete, and orphan deletion are destructive and need retry policy. |
| Archive destruction deletion | It mutates archive lifecycle state, clears snapshots, deletes files, and must preserve destroyed-file access blocking. |
| Diagnostics/orphan cleanup | Needs safe local filesystem scanning, dry-run behavior, and DB metadata comparison. |
| Preview/download default migration | Needs authorization, token/streaming behavior, content headers, and destroyed-archive checks. |
| Internal URL default enablement | Depends on local file availability and fallback/rollback policy. |
| Supabase Storage retirement | Supabase remains the reference until parity is verified. |
| Broad API migration | Submit preflight does not migrate all reads/writes or replace domain services. |

## 13. Recommended Next Phase

Recommended next phase:

```text
Phase 6E.13 Submit Move Plan Builder Helper Foundation, no route wiring
```

Direct submit local move implementation is not recommended yet.

Reasoning:

- Submit cannot safely switch to `getLocalServerSession(request)` while its document/master/status/audit writes remain Supabase-helper-backed.
- Current helper dependencies do not prove local user ids are compatible with Supabase-backed `created_by`, `ketua_tim_assignments.user_id`, and `log_aktivitas.user_id`.
- A no-touch move plan builder can be tested without changing runtime behavior, moving files, or mixing auth/data domains.
- The builder is useful regardless of whether a later route preserves `temp-id` or moves to real document ids.
- Route wiring should remain blocked until a local document write bridge or route-local compatibility assertion proves local auth ids, master data, document writes, status updates, and audit inserts are in the same identity/data domain.

Phase 6F local document write bridge is still required before final submit route wiring if submit continues to depend on local `dms_session` and local file owner ids. The immediate smaller and safer next step is the move plan builder because it creates the preflight artifact without changing submit behavior.

## 14. Explicitly Not Implemented

Phase 6E.12 does not implement:

- runtime source changes;
- submit local move behavior;
- submit auth migration;
- local document write bridge;
- update/resubmit local move behavior;
- upload behavior changes;
- rename-pending behavior changes;
- UI caller changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download default changes;
- internal URL default enablement;
- Supabase Storage migration, copy, download, backfill, or sync;
- routeTree changes;
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
- `docs/migration/submit-local-move-compatibility-planning.md`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/upload.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/dokumen/logs.ts`
- `src/lib/dokumen/storage.ts`
- `src/lib/dokumen-helpers.ts`
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
- `tests/e2e/submit-flow.spec.ts`
- `tests/e2e/approval-flow.spec.ts`

Commands run:

```powershell
git status --short --branch
```

Result before documentation edits: branch was `migration/postgres-local` and no changes were listed.

```powershell
rg -n "createFileRoute\('/api/dokumen/submit'\)|getServerSession|getLocalServerSession|session\.user\.id|session\.userId|createAdminClient|createDokumen|updateDokumenStatus|insertLog|getKelengkapanRequired|resolveLeafNodeName|ketua_tim_assignments" src tests docs\migration
```

Result: confirmed submit route registration, submit's Supabase session dependency, local session usage in upload and `rename-pending`, Supabase-backed document/status/audit helpers, and Ketua Tim dependency references.

```powershell
rg -n "\.move\(|storage\.from|temp-id|lampiran_urls|lampiranUrls|log_aktivitas|transition\(|SUBMIT|STORE|TERSIMPAN|IN_PPK_VALIDATION|current_step|revision_target|is_non_material" src tests docs\migration
```

Result: confirmed remaining submit/shared-helper Supabase move surfaces, submit `temp-id` behavior, attachment metadata persistence, audit references, material/non-material status behavior, and FSM coverage.

```powershell
rg -n "moveLocalPendingFileToFormal|classifyLocalPendingMovePath|DMS_LOCAL_STORAGE_ROOT|routeTree\.gen\.ts" src tests docs\migration
```

Result: confirmed local move helper usage is currently limited to helper/tests and `rename-pending`, and confirmed route-tree guardrail references.

Final validation after documentation edits:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result: recorded in the task final response.
