# Phase 6F.4 Local Submit Live Drizzle Adapter Foundation

Date: 2026-05-16.

## Scope

Phase 6F.4 adds a narrow server-only Drizzle adapter foundation behind the Phase 6F.3 `LocalSubmitRepositoryAdapter` contract.

This phase does not wire `POST /api/dokumen/submit`, does not change submit route behavior, does not execute filesystem movement, does not call Supabase, does not run database scripts, and does not change route generation.

## Files Added

- `src/lib/dokumen/local-submit-drizzle-adapter.ts`
- `tests/unit/dokumen/local-submit-drizzle-adapter.test.ts`

## Adapter Summary

The adapter module starts with the required server-only guardrail comment and remains submit-specific.

It exposes:

- `createLocalSubmitDrizzleAdapter(database)` for explicit Drizzle-shaped database injection.
- `createLiveLocalSubmitDrizzleAdapter()` for a future live factory that dynamically imports `#/db/client` only when explicitly called.
- `LocalSubmitDrizzleAdapterError` for bounded adapter-level no-row failures.

The module imports local Drizzle schema table exports and Drizzle query helpers, but it does not import the live DB client at module load time.

## Implemented Mapping

Read methods:

- `selectKegiatanById()` reads `master.master_kegiatan`.
- `selectRequiredKelengkapan()` reads `master.master_kelengkapan_dokumen`.
- `selectJenisDokumenById()` reads `master.master_jenis_dokumen`.
- `selectJenisPermintaanById()` reads `master.master_jenis_permintaan`.
- `selectKategoriPermintaanById()` reads `master.master_kategori_permintaan`.
- `selectDetailPermintaanById()` reads `master.master_detail_permintaan`.
- `selectKetuaTimAssignmentExists()` reads `master.ketua_tim_assignments`.

Write transaction methods:

- `insertDokumen()` inserts only into `dokumen.dokumen_transaksi` and enriches the inserted row with local fungsi/kegiatan names.
- `updateDokumenStatus()` updates only submit workflow status fields on `dokumen.dokumen_transaksi`.
- `insertLog()` inserts only into `dokumen.log_aktivitas`.

`log_aktivitas` remains append-only. No audit update/delete adapter method was added.

## Required Kelengkapan Filtering

The adapter preserves the submit-specific specificity rules documented in Phase 6F.3:

- base filter: kegiatan id and Ketua Tim flag;
- detail id when provided;
- else kategori id with `detail_permintaan_id IS NULL`;
- else jenis id with `kategori_permintaan_id IS NULL` and `detail_permintaan_id IS NULL`;
- else kegiatan plus role only.

## Live DB Execution Status

No live local database was opened or queried in this phase.

No DB scripts were run:

- no migrations;
- no seeds;
- no Drizzle generate;
- no Drizzle migrate;
- no auth hash script.

The tests use fake Drizzle-shaped query builders only.

## Route And Storage Status

No route imports the new adapter in this phase.

This phase does not modify:

- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/rename-pending.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/upload.ts`
- `src/routeTree.gen.ts`

No filesystem reads, writes, moves, deletes, preflight checks, Supabase Storage migration, copy, download, backfill, sync, or fallback were added.

## Remaining Blockers Before Submit Route Migration

- Route-level submit response parity still needs tests.
- Submit local file preflight is not implemented.
- Filesystem movement is not implemented.
- DB/file failure compensation policy is not implemented.
- Append-log failure behavior must be resolved against current route parity before wiring.
- `temp-id` remains the default submit move planning target.
- Missing local files must remain controlled failures with no Supabase fallback.

## Tests

Focused tests run:

```powershell
pnpm test tests/unit/dokumen/local-submit-drizzle-adapter.test.ts tests/unit/dokumen/local-submit-repository.test.ts tests/unit/dokumen/local-submit-write-bridge.test.ts
```

Result:

- First sandboxed run failed before tests started because Vitest/esbuild hit `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- 3 test files passed.
- 19 tests passed.

Coverage added by Phase 6F.4:

- module import does not construct the live database client;
- injected fake Drizzle-shaped read chains for submit master reads;
- injected fake transaction shape for document insert, status update, and audit insert;
- append-only audit adapter surface;
- bounded no-row status update error;
- no sensitive or physical path exposure in adapter results/errors.

## Recommended Next Phase

Do not wire `POST /api/dokumen/submit` yet.

Recommended next work is a route-level submit response parity and file-preflight planning/foundation phase, still without filesystem movement, or another explicitly bounded phase that resolves the remaining blockers above before runtime submit behavior changes.

## Phase 6F.5 Follow-Up Note

Phase 6F.5 added `docs/migration/submit-route-response-parity-file-preflight-foundation.md`.

The follow-up documented the current submit route response/status inventory, material and non-material success parity, local bridge/repository/adapter issue mapping, missing-local-file policy, and conservative DB/file failure recommendation. It did not add helper code, route tests, runtime submit wiring, local file disk checks, filesystem movement, Supabase calls, DB scripts, migrations, seeds, or Supabase Storage migration/copy/download/backfill/sync.

`POST /api/dokumen/submit` remains blocked until route-level parity tests and an explicitly approved runtime preflight/compensation implementation phase.
