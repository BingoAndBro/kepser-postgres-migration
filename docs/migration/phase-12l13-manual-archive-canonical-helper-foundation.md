# Phase 12L.13 - Manual Archive Canonical Helper Foundation

Date: 2026-05-24

Status: implemented pending human review. This phase adds helper code and focused tests only. It does not wire canonical `MANUAL` writes into Manual Archive create/edit runtime behavior.

## Scope And Boundary

Phase 12L.13 adds a source-specific helper foundation for future Manual Archive canonical `MANUAL` write alignment.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current write boundaries remain unchanged:

- Manual Archive parent rows still write only to `arsip.manual_arsip`;
- Manual Archive attachment rows still write only to `arsip.manual_arsip_attachment`;
- no canonical `MANUAL` rows are created during normal runtime;
- no dual-write is introduced;
- no existing rows are backfilled;
- no lifecycle unification, unified archive list/detail UI, aggregate/export, attachment consolidation, cleanup, or storage change is implemented.

## Helper Functions Added

New helper file:

```text
src/lib/archive/manual-archive-canonical.ts
```

Functions:

- `assertManualArchiveReadyForCanonicalWrite(source)`
- `buildManualArchiveCanonicalInsertValues(source)`
- `createManualArchiveCanonicalWritePlan(source)`

The helper is pure and does not query the database, write rows, read attachment tables, inspect files, access storage, or call Manual Archive routes.

## Required Source Validation

The readiness assertion validates that a source row has complete future-canonical Manual Archive metadata:

- `id`
- `nama`
- `nomorSurat`
- `tanggalDiarsipkan`
- `klasifikasiId`
- `klasifikasiKodeSnapshot`
- `klasifikasiNamaSnapshot`
- `retensiAktif`
- `retensiInaktif`
- `masaAktifBerakhir`
- `masaInaktifBerakhir`
- `archivedBy`
- `createdBy`
- `nominalRealisasi`
- `statusArsip`

Early alignment is limited to `statusArsip='AKTIF'`. Non-`AKTIF` source rows fail with a controlled helper error and are left for later lifecycle/canonical sync phases.

Validation errors use controlled labels only. They do not include raw source row contents, file fields, storage paths, token values, SQL details, env values, DB URLs, or secrets.

## Mapping Behavior

`buildManualArchiveCanonicalInsertValues(source)` maps a complete Manual Archive source row to future `arsip.arsip` insert values:

| Canonical `arsip.arsip` field | Manual Archive source |
| --- | --- |
| `sourceType` | constant `MANUAL` |
| `dokumenId` | `null` |
| `namaArsip` | `source.nama` |
| `nomorSurat` | `source.nomorSurat` |
| `klasifikasiId` | `source.klasifikasiId` |
| `klasifikasiKodeSnapshot` | `source.klasifikasiKodeSnapshot` |
| `klasifikasiNamaSnapshot` | `source.klasifikasiNamaSnapshot` |
| `retensiAktif` | `source.retensiAktif` |
| `retensiInaktif` | `source.retensiInaktif` |
| `masaAktifBerakhir` | `source.masaAktifBerakhir` |
| `masaInaktifBerakhir` | `source.masaInaktifBerakhir` |
| `archivedAt` | `source.tanggalDiarsipkan` converted to the timestamp convention below |
| `archivedBy` | `source.archivedBy` |
| `createdBy` | `source.createdBy` |
| `nominalRealisasi` | `source.nominalRealisasi` |
| `statusArsip` | `source.statusArsip`, currently required to be `AKTIF` |
| `metadata` | empty safe object |

The helper intentionally does not copy source `metadata`, attachment metadata, file paths, logical paths, physical paths, storage roots, file URLs, signed URL/token values, SQL details, env values, DB URLs, or secrets into canonical metadata.

## Idempotency And Reuse Behavior

`createManualArchiveCanonicalWritePlan(source)` is a pure retry-safety plan function:

- if `source.canonicalArsipId` is non-null after trimming, it returns `{ action: 'reuse', canonicalArsipId }`;
- reuse does not build insert values and does not validate unrelated source fields;
- if no canonical link exists and the source is complete, it returns `{ action: 'create', sourceId, insertValues }`;
- if validation fails, it returns `{ action: 'error', reason, field, message }`;
- it does not query the linked canonical row because this phase is pure-helper only.

Future DB-aware canonicalization must still verify that an existing linked canonical row exists and has `source_type='MANUAL'` before trusting reuse for runtime behavior.

## Date-To-Timestamp Behavior

Manual Archive `tanggalDiarsipkan` is date-only business input in `YYYY-MM-DD` format.

The helper maps it to canonical `archivedAt` as UTC midnight for the same date:

```text
YYYY-MM-DD -> YYYY-MM-DDT00:00:00.000Z
```

This is deterministic and does not use the current server timestamp. Invalid date-only strings, including impossible calendar dates such as `2026-02-31`, fail with a controlled helper error.

## What Is Intentionally Not Wired Yet

This phase does not:

- modify Manual Archive POST create route/helper to call the new helper;
- modify Manual Archive PATCH edit behavior;
- modify Manual Archive UI;
- create canonical `MANUAL` rows in `arsip.arsip`;
- dual-write in runtime;
- add a DB-aware transaction helper;
- backfill existing `manual_arsip` rows;
- run a live DB compatibility report;
- add routes;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify attachment upload;
- modify attachment preview/download;
- modify workflow archive routes;
- implement lifecycle APIs;
- implement unified archive list/detail UI;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows, tables, test data, or storage files;
- modify package files, lockfiles, generated routes, `db/`, `drizzle/`, or historical Supabase artifacts.

## Future Implementation Phase

Recommended immediate next implementation phase:

```text
Phase 12L.14 - Manual Archive create path canonical write alignment
```

That phase should wire the helper into Manual Archive POST create using the Phase 12L.12 Option 2 transaction:

1. insert the `manual_arsip` source row;
2. build canonical `MANUAL` insert values from the inserted source row;
3. insert the canonical `arsip.arsip` row;
4. update `manual_arsip.canonical_arsip_id`;
5. commit all DB row changes together.

Attachment upload should remain a separate post-parent action. Existing data backfill, lifecycle unification, unified list/detail UI, aggregate/export, attachment consolidation, and cleanup must remain separate phases.

## Risks And Open Decisions

Risks:

- the helper is not DB-aware yet, so it cannot verify whether a reused `canonicalArsipId` points to an existing `source_type='MANUAL'` canonical row;
- future runtime wiring must preserve one transaction for source insert, canonical insert, and source link update;
- source/canonical drift remains possible if a later edit or lifecycle phase updates only one side after canonicalization;
- canonical `archivedAt` remains timestamp storage for date-only Manual Archive business input.

Open decisions:

- whether future canonical rows need a dedicated `source_manual_arsip_id` column instead of relying only on `manual_arsip.canonical_arsip_id`;
- exact concurrency strategy for retry/backfill canonicalization of existing rows;
- whether Manual Archive `AKTIF` edits after canonicalization update canonical rows immediately or remain source-only until a sync phase;
- whether canonical archive date should later use a true date-only column instead of timestamp-at-midnight convention.

## Validation

Focused helper coverage was added for:

- complete source row mapping;
- controlled missing-field errors;
- non-`AKTIF` rejection;
- existing canonical id reuse/no-create plan;
- safe canonical metadata without file/path/token/SQL/env/secret fields;
- deterministic date-to-timestamp conversion;
- no attachment metadata/path usage.
