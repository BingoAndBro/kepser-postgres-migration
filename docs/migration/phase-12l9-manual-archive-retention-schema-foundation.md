# Phase 12L.9 - Manual Archive Retention Schema Foundation

Date: 2026-05-24

Status: implemented pending human migration SQL review. Migration is drafted only and was not executed in this phase.

## Scope And Boundary

Phase 12L.9 adds only the Manual Archive source schema foundation needed to capture future canonical `MANUAL` archive metadata.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and must not be used as authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Current runtime write boundaries remain unchanged:

- workflow archive rows write to `arsip.arsip`;
- Manual Archive parent rows write to `arsip.manual_arsip`;
- Manual Archive attachment rows write to `arsip.manual_arsip_attachment`;
- no canonical `MANUAL` rows are created;
- no dual-write is introduced;
- no existing rows are mutated or backfilled.

## Added Source Fields

This phase adds nullable transitional columns to `arsip.manual_arsip`:

- `nomor_surat`;
- `tanggal_diarsipkan`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- `klasifikasi_kode_snapshot`;
- `archived_by`;
- `canonical_arsip_id`.

Existing `klasifikasi_nama_snapshot` is preserved.

## Field Semantics

`nomor_surat` is the future Manual Archive letter/reference number. It is not required by database constraint yet because API/UI collection and existing-data remediation are not implemented in this phase.

`tanggal_diarsipkan` is the future official archive date selected or confirmed by the authenticated `KEPALA_SUB_BAGIAN_UMUM` user. Existing `manual_arsip.tanggal` remains source document/date metadata and is not redefined as the official archive date in this phase.

`retensi_aktif` and `retensi_inaktif` are text retention labels compatible with existing workflow archive retention labels.

`masa_aktif_berakhir` and `masa_inaktif_berakhir` are date-only retention end dates. Future API logic should calculate them server-side from `tanggal_diarsipkan` and selected retention labels.

`klasifikasi_kode_snapshot` is the future server-derived snapshot from `master_klasifikasi_arsip.kode`. `klasifikasi_nama_snapshot` remains the future name snapshot from `master_klasifikasi_arsip.nama`.

`archived_by` is the future authenticated `KEPALA_SUB_BAGIAN_UMUM` session user who records or archives the Manual Archive metadata. `created_by` remains the source creator. For future Manual Archive create/archive submission, both are expected to come from the current Kasubag session user per human domain decision.

`canonical_arsip_id` is the future idempotency/link field from the Manual Archive source row to a canonical `arsip.arsip` row with `source_type='MANUAL'`.

## Nullability And Compatibility

All new source fields are nullable in this phase.

Reason:

- existing `manual_arsip` rows must remain valid;
- Manual Archive API/UI are not updated yet to collect or validate these fields;
- no retention calculation exists yet;
- no existing-data backfill is approved;
- no canonical `MANUAL` parent rows are created yet.

This phase does not add `NOT NULL` constraints, does not require `klasifikasi_id` at the database level, and does not change `manual_arsip.nominal_realisasi` database nullability.

## Relationships And Indexes

`archived_by` has a nullable foreign key to `auth.users.id`.

`canonical_arsip_id` has a nullable foreign key to `arsip.arsip.id` with `ON DELETE set null`. This preserves source rows if a future human-approved remediation phase removes a draft canonical link.

`canonical_arsip_id` also has a partial unique index for non-null values. This supports future duplicate prevention while allowing existing null rows to coexist.

Indexes added:

- `idx_manual_arsip_tanggal_diarsipkan`;
- `manual_arsip_canonical_arsip_id_unique` partial unique index.

Existing indexes on `klasifikasi_id` and `status_arsip` are reused. This phase avoids additional retention-date indexes until query patterns are implemented.

## Migration Draft

Migration added:

- `drizzle/0006_manual_archive_retention_schema_foundation.sql`

The migration is additive and transitional:

- uses `ADD COLUMN IF NOT EXISTS`;
- adds nullable fields only;
- adds guarded foreign-key constraints;
- adds indexes with `IF NOT EXISTS`;
- does not drop, rename, delete, truncate, backfill, seed, or clean up storage.

The migration was not executed in this phase.

## What Is Intentionally Not Changed

This phase does not:

- update Manual Archive create/edit API routes;
- update Manual Archive UI;
- update workflow archive routes;
- create canonical `MANUAL` rows in `arsip.arsip`;
- dual-write;
- backfill existing `manual_arsip` rows;
- run the live DB compatibility report;
- implement retention calculation;
- implement API validation for the new fields;
- enforce required `klasifikasi_id`;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- delete old rows or tables;
- delete Manual Archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior;
- modify package files or generated route files;
- touch `db/` or historical Supabase artifacts.

## Future Phases

Future phases should remain separate:

1. Manual Archive create/edit API validation for `nomor_surat`, required `klasifikasi_id`, `tanggal_diarsipkan`, `retensi_aktif`, and `retensi_inaktif`, with server-side retention-end calculation.
2. Manual Archive UI update for `Nama Arsip`, `Nomor Surat`, canonical `Klasifikasi`, `Tanggal Arsip`, and retention inputs.
3. Manual Archive canonical `MANUAL` write alignment using `canonical_arsip_id` for idempotency/linkage.
4. Existing Manual Archive data remediation/backfill, report-first and human-reviewed.
5. Later stricter database constraints after reports prove rows are complete.

## Migration Review Instructions

Human review is required before commit and before migration execution.

Review checklist:

- verify the SQL is additive only;
- verify all new columns are nullable;
- verify no backfill, delete, drop, truncate, table rename, seed execution, or storage cleanup exists;
- verify `canonical_arsip_id` FK and partial unique index are acceptable for future idempotency;
- verify existing null `canonical_arsip_id` rows will not violate uniqueness;
- verify no Manual Archive API/UI behavior depends on these fields before the later runtime phase.

Migration execution is manual only after commit and explicit approval. After execution, inspect the PostgreSQL schema for `arsip.manual_arsip` and confirm existing Manual Archive create/edit behavior still works before starting any API/UI alignment phase.

## Risks And Open Decisions

Risks:

- `canonical_arsip_id` creates a future linkage path before canonical `MANUAL` rows exist; later runtime phases must preserve idempotency and avoid duplicate parents.
- Nullable retention fields can be misread as complete policy support if docs are ignored; API/UI must still block canonical alignment until validation and calculation are implemented.
- Existing Manual Archive rows still lack required canonical metadata and remain report-first remediation candidates.

Open decisions:

- whether future permanence uses nullable end dates or the existing `9999-12-31` compatibility sentinel;
- exact server-side date calculation behavior, including leap-day handling;
- when `klasifikasi_id` can safely become required for Manual Archive;
- whether `manual_arsip.tanggal` should be relabeled once `tanggal_diarsipkan` is in UI;
- exact canonical `MANUAL` row creation and rollback behavior.
