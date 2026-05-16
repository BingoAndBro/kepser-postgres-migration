# Phase 6F.2 Local Submit Document/Write Bridge Helper Foundation

Date: 2026-05-16.

## Scope

Phase 6F.2 adds an isolated server-only helper foundation for the local submit document/write domain.

This phase does not wire `POST /api/dokumen/submit`, does not change submit behavior, does not execute filesystem movement, does not call Supabase, does not run database scripts, and does not change route generation.

## Files Added

- `src/lib/dokumen/local-submit-write-bridge.ts`
- `tests/unit/dokumen/local-submit-write-bridge.test.ts`

## Helper Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

It provides a route-independent bridge foundation for:

- local submit actor compatibility from `LocalServerSession`;
- `PEGAWAI` submit compatibility checks and ADMIN-only fail-closed behavior;
- local master-data read shapes for kegiatan, required kelengkapan, jenis dokumen, request-chain leaf names, and Ketua Tim assignment checks;
- local document creation payload shape for `dokumen.dokumen_transaksi`;
- material submit transition shape using the existing FSM;
- non-material `TERSIMPAN` shortcut shape and `STORE` audit action;
- append-only audit insert payload shape for `dokumen.log_aktivitas`;
- repository-interface transaction boundary for create document, update status, and append audit.

The helper intentionally does not import the live Drizzle client. Tests use a fake repository so no local database connection is opened.

## Transaction Boundary

The helper defines a repository method:

```ts
withSubmitWriteTransaction(operation)
```

The planned write sequence is:

```text
create-draft -> update-status -> append-audit-log
```

This proves the intended local PostgreSQL transaction boundary for document/status/audit writes without executing against the live database.

Filesystem movement remains outside this transaction. A later route phase still needs a DB/file compensation policy before local file moves can be enabled.

## Compatibility Behavior Preserved

Material submit keeps:

```text
DRAFT -> IN_PPK_VALIDATION
current_step = PPK
revision_target = null
audit action = SUBMIT
step_urutan = 1
```

Non-material submit keeps:

```text
DRAFT -> TERSIMPAN
current_step = null
revision_target = null
audit action = STORE
step_urutan = 1
```

Document creation payloads preserve:

- `createdBy` from the local authenticated actor;
- logical `lampiranUrls` metadata only;
- `nominalRealisasi`;
- `isNonMaterial`;
- `jenisDokumenId`;
- `keteranganDetail`;
- material request-chain ids.

The helper never returns physical filesystem paths, storage roots, signed URLs, tokens, env values, or file contents.

## Explicitly Not Implemented

Phase 6F.2 does not implement:

- submit route wiring;
- submit auth migration in the route;
- live Drizzle repository implementation;
- real database execution;
- filesystem movement;
- local file existence preflight;
- update/resubmit local move behavior;
- upload behavior changes;
- `rename-pending` behavior changes;
- UI behavior changes;
- `AttachmentEditor` migration;
- delete/remove behavior;
- archive destruction deletion;
- diagnostics/orphan cleanup;
- preview/download behavior changes;
- internal URL enablement by default;
- Supabase Storage migration, copy, download, backfill, or sync;
- route tree changes;
- database scripts or schema changes;
- dependency changes.

## Tests

Focused test:

```powershell
pnpm test tests/unit/dokumen/local-submit-write-bridge.test.ts
```

Result:

- The sandboxed attempt failed before tests started because Vitest/esbuild hit `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- 1 test file passed.
- 7 tests passed.

Coverage:

- local actor compatibility and fail-closed unauthenticated/admin/non-pegawai cases;
- material master-data read ordering, Ketua Tim check, detail leaf resolution, document creation payload, FSM status shape, and `SUBMIT` audit payload;
- non-material jenis dokumen leaf resolution, no required-kelengkapan read when no chain is supplied, `TERSIMPAN` status shape, and `STORE` audit payload;
- missing required lampiran failure before transaction;
- missing Ketua Tim assignment failure before transaction;
- material leaf fallback order: detail, kategori, jenis, fallback;
- repository transaction sequence: create draft, update status, append audit;
- rollback path when status update fails before audit append;
- no sensitive or physical path exposure in helper results.

## Current Readiness Verdict

The helper foundation is ready for later route-specific planning or a live local Drizzle repository implementation phase.

`POST /api/dokumen/submit` is still not ready for local route wiring. Remaining blockers:

- live local Drizzle repository implementation is not wired;
- local file preflight and movement are not implemented for submit;
- DB/file partial-failure compensation is still not implemented;
- `temp-id` remains the short-term planning default through the existing submit move planner;
- route response/error parity still needs route-level tests before runtime changes.

## Recommended Next Phase

Recommended next work is a narrow submit route implementation plan or live local repository foundation, still without filesystem movement, unless explicitly approved otherwise.

Direct route wiring should remain blocked until local repository behavior, route response compatibility, local file preflight, and DB/file failure policy are all proven.
