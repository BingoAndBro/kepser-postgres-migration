# Phase 6E.14 Submit Move Plan Builder Handoff And Route Wiring Readiness Review

Date: 2026-05-16.

## 1. Phase Scope

Phase 6E.14 is docs, handoff, and readiness review only.

No runtime source code changed in this phase.

The submit move plan helper code did not change in this phase.

Submit route wiring is not implemented in this phase.

This phase verifies the Phase 6E.13 helper state, records route-wiring blockers, and selects the safest next phase.

## 2. Current Helper State

Helper path:

- `src/lib/storage/submit-move-plan.ts`

Test path:

- `tests/unit/storage/submit-move-plan.test.ts`

Public API summary:

- `buildSubmitMovePlan(...)` accepts a server-authoritative `ownerUserId`, optional `dokumenId`, ordered `attachments`, and optional deterministic `targetUuidFactory`.
- It returns ordered `entries`, `moves`, `plannedAttachments`, `issues`, and `hasBlockingIssues`.
- Results are logical metadata only.

Default `temp-id` behavior:

- If `dokumenId` is omitted, the helper plans submit targets under the logical document segment `temp-id`.
- This preserves current submit compatibility while the combined create+submit route still lacks a real document id before move planning.

Explicit document id support:

- A caller can pass a real `dokumenId`.
- This is future-only for submit route wiring and must not be used until route/write ordering proves it safe.

Supported pending classifications:

- `pending-upload-api`: `{userId}/{kelengkapanId}_{timestamp}_{filename.ext}`
- `pending-dash`: `{userId}/{timestamp}-{random}-{filename.ext}`

Formal unchanged behavior:

- Existing formal paths in `{userId}/{dokumenId}/{uuid}.{ext}` shape are returned as `unchanged`.
- They are preserved in `plannedAttachments`.
- They are not included in `moves`.

Unsupported blocking behavior:

- Safe but unrecognized logical paths become `unsupported` entries.
- They produce an `unsupported-source-path` issue.
- They set `hasBlockingIssues` to `true`.

Issue collection behavior:

- Invalid owner/document segments, missing URLs, unsafe source paths, owner mismatch, invalid extensions, invalid target UUIDs, invalid targets, and unsupported source paths are accumulated in `issues`.
- The helper does not throw for normal planning issues.
- Each issue includes the attachment index.

Logical-only output:

- The helper returns logical source and target paths only.
- It does not return physical filesystem paths or storage roots.
- It preserves attachment metadata and changes only `url` for planned moves.

## 3. Guardrail Verification

Confirmed from code, tests, and audit:

- No Supabase imports or calls exist in `src/lib/storage/submit-move-plan.ts`.
- No filesystem imports or calls exist in `src/lib/storage/submit-move-plan.ts`.
- No env reads exist in `src/lib/storage/submit-move-plan.ts`.
- No storage root resolution exists in `src/lib/storage/submit-move-plan.ts`.
- No file existence checks exist in `src/lib/storage/submit-move-plan.ts`.
- No file movement, copy, delete, or rename exists in `src/lib/storage/submit-move-plan.ts`.
- No route imports the helper yet.
- `src/routeTree.gen.ts` has no diff.

Audit notes:

- `src/lib/storage/submit-move-plan.ts` imports `node:crypto` for UUID generation and local logical-path helpers for classification/safety.
- Filesystem modules remain in the local pending move executor helper, not in the submit planner.
- Remaining submit runtime storage movement is still in `src/routes/api/dokumen/submit.ts` through Supabase Storage `.move(...)`.

## 4. Policy Decisions Locked By Phase 6E.13

Locked decisions:

- Default submit target segment remains `temp-id`.
- Real document id targets remain explicit and future-only.
- Safe unsupported paths are blocking issues, not silently successful outcomes.
- Missing local file is not checked by this helper and remains a future route preflight responsibility.
- The helper is a planner, not an executor.
- Future submit route wiring must not call Supabase fallback for missing local files.

## 5. Route Wiring Readiness Criteria

Before `POST /api/dokumen/submit` can use this helper, all criteria below must be true:

- Local `dms_session` user id is compatible with the document, master-data, status, and audit write domain.
- Local document creation path exists, or a bridge is proven safe for local ids and local storage owner segments.
- Ketua Tim assignment check works in the same identity/data domain as the submit actor.
- Required master-data reads are local-compatible.
- Status update and audit insert are local-compatible.
- Route-level preflight validates that every supported local source exists and every target does not exist before any move.
- DB/file failure strategy is selected and documented.
- `temp-id` preservation or real document id ordering is explicitly chosen.
- Tests cover both material and non-material submit behavior.

## 6. Current Readiness Verdict

Submit route is not ready for local move wiring yet.

The helper is ready as a route-independent planning primitive.

Next work should prove local document/write compatibility or build route-specific readiness artifacts before any submit runtime move behavior changes.

Blocking reason:

- Submit is blocked by identity/write-domain compatibility, not by storage planning.
- The current submit route still uses Supabase Auth assumptions, Supabase-backed master reads, Supabase-backed document creation, Supabase-backed status update, Supabase-backed append-only audit insertion, and Supabase Storage `.move(...)`.

## 7. Recommended Next Phase

Options compared:

- Phase 6F Local Submit Document/Write Compatibility Bridge Planning.
- Phase 6E.15 Submit Route Wiring Implementation Plan.
- Phase 6E.15 Submit Move Plan Runtime Preflight Helper.

Recommended next phase:

```text
Phase 6F.1 Local Submit Document/Write Compatibility Bridge Planning
```

Reason:

- Route wiring remains blocked by local identity, master-data, document-write, status-write, and audit-write compatibility.
- The submit move planner already covers logical planning well enough for now.
- A runtime preflight helper would still not solve whether submit can safely create documents, check Ketua Tim assignments, update status, and append logs in the same local data domain.

Why not direct submit implementation:

- Direct implementation would risk mixing local `dms_session` user ids and local upload owner paths with Supabase-backed document/master/status/audit helpers.
- It would also risk persisting metadata for files that were moved in a different storage domain.
- It would change the highest-risk workflow boundary before the write-domain bridge is proven.

Why not a route wiring implementation plan as the next step:

- A route wiring plan would still be speculative without proving local write compatibility.
- The safer artifact is a bridge/readiness plan that decides whether submit writes can run locally, whether a temporary bridge is acceptable, and how `temp-id` or real document id ordering should be selected.

Why not a runtime preflight helper as the next step:

- Source/target filesystem preflight is useful later, but it is not the current blocker.
- Adding it before the write-domain decision risks over-optimizing the storage side while the route remains unsafe to wire.

## 8. Test/Validation Summary

Focused helper test:

```powershell
pnpm test tests/unit/storage/submit-move-plan.test.ts
```

Result:

- Sandboxed attempt failed before tests started with `spawn EPERM`.
- Escalated rerun passed.
- 1 test file passed.
- 6 tests passed.

Combined focused storage regression:

```powershell
pnpm test tests/unit/storage/submit-move-plan.test.ts tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- Sandboxed attempt failed before tests started with `spawn EPERM`.
- Escalated rerun passed.
- 3 test files passed.
- 43 tests passed.

## 9. Explicitly Not Implemented

Phase 6E.14 does not implement:

- runtime source changes;
- helper behavior changes;
- submit route wiring;
- submit auth migration;
- local document write bridge;
- filesystem movement;
- file existence checks;
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

## 10. Validation Performed

Files read for this readiness phase:

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
- `docs/migration/submit-local-move-preflight-bridge-planning.md`
- `docs/migration/submit-move-plan-builder-helper-foundation.md`
- `src/lib/storage/submit-move-plan.ts`
- `tests/unit/storage/submit-move-plan.test.ts`
- `src/lib/storage/local-pending-move.ts`
- `tests/unit/storage/local-pending-move.test.ts`
- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/lib/dokumen/mutations.ts`
- `src/lib/dokumen/queries.ts`
- `src/lib/dokumen/logs.ts`
- `src/lib/auth/local-server-auth.ts`
- `src/lib/auth.ts`

Commands run:

```powershell
git status --short --branch
```

Result before documentation edits:

```text
## migration/postgres-local
```

```powershell
rg -n "buildSubmitMovePlan|submit-move-plan|planned-move|hasBlockingIssues|unsupported-source-path" src tests docs\migration
```

Result:

- Confirmed helper API, issue/action names, tests, and migration docs.
- Confirmed the planner is represented in `src/lib/storage/submit-move-plan.ts` and `tests/unit/storage/submit-move-plan.test.ts`.

```powershell
rg -n "buildSubmitMovePlan|submit-move-plan" src\routes src\lib
```

Result:

- Returned only `src/lib/storage/submit-move-plan.ts`.
- No route imports the helper yet.

```powershell
rg -n "node:fs|fs/promises|getLocalStorageRoot|resolvePhysicalStoragePath|stat\(|moveLocalPendingFile|storage\.from|createAdminClient|createServerSupabaseClient|process\.env" src\lib\storage\submit-move-plan.ts
```

Result:

- No output.
- This confirms no filesystem, storage-root, env, Supabase, or local move executor usage in the planner.

```powershell
rg -n "createAdminClient|createServerSupabaseClient|storage\.from|\.move\(|getServerSession|getLocalServerSession|createDokumen|updateDokumenStatus|insertLog|ketua_tim_assignments" src\routes\api\dokumen\submit.ts src\lib\dokumen\mutations.ts src\lib\dokumen\queries.ts src\lib\dokumen\logs.ts src\lib\auth\local-server-auth.ts src\lib\auth.ts
```

Result:

- Confirmed submit still imports/uses `createServerSupabaseClient`, `createAdminClient`, `getServerSession`, Supabase Storage `.move(...)`, `createDokumen`, `updateDokumenStatus`, `insertLog`, and `ketua_tim_assignments`.
- Confirmed local session helper exists separately but is not used by submit.

Focused tests:

```powershell
pnpm test tests/unit/storage/submit-move-plan.test.ts
pnpm test tests/unit/storage/submit-move-plan.test.ts tests/unit/storage/local-pending-move.test.ts tests/unit/storage/local-storage-paths.test.ts
```

Result:

- Both sandboxed attempts failed with `spawn EPERM`.
- Both escalated reruns passed.
- Results are listed in Section 8.

Final validation commands after documentation edits:

```powershell
git diff --check
git diff --name-only -- src\routeTree.gen.ts
git status --short --branch
```

Result:

- `git diff --check` passed.
- `git diff --name-only -- src\routeTree.gen.ts` returned no output.
- Final status is recorded in the task final response.

## 11. Phase 6F.2 Follow-Up Note

Phase 6F.2 added `src/lib/dokumen/local-submit-write-bridge.ts` as the no-route-wiring local submit document/write bridge helper foundation recommended after Phase 6F.1 planning.

The submit move planner remains route-independent and logical-only. The new write bridge helper proves actor/master/status/audit payload shapes and a repository transaction boundary, but it still does not execute filesystem moves, wire submit, call Supabase, or run database scripts. Submit route wiring remains blocked until live local repository behavior, route response compatibility, local file preflight, and DB/file failure policy are proven.
