# Phase 12L.2 - Canonical Archive Schema Foundation

Date: 2026-05-24

Status: implemented pending human migration SQL review. Migration is drafted only and was not executed in this phase.

## Boundary

This phase adds the schema foundation for a future unified archive parent model. It does not change runtime archive writes, Manual Archive create/edit APIs, workflow archive creation, UI pages, lifecycle APIs, preview/download behavior, attachment upload behavior, storage cleanup, aggregate/export behavior, route generation, seeds, or package files.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary, `dms_active_role` remains UX-only, and server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role; operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Table Strategy Decision

Selected option: extend existing `arsip.arsip`.

Reason:

- `arsip.arsip` is already the workflow archive parent and owns the implemented lifecycle status flow.
- Existing workflow archive rows already contain most canonical parent fields: `nomor_surat`, retention labels, retention end dates, archive actor/date fields, lifecycle status, nominal value, and workflow attachment snapshot.
- Creating a second canonical parent table now would add duplicate lifecycle ownership and require runtime write/query changes that are outside Phase 12L.2.
- The main blocker is `dokumen_id NOT NULL`, which can be safely loosened as a transitional compatibility step so future `source_type='MANUAL'` rows do not require `dokumen_transaksi`.

Compatibility impact:

- Existing workflow archive writes can continue inserting `dokumen_id` and existing fields.
- `source_type` has a database-level default of `WORKFLOW`, so current workflow inserts do not need runtime changes in this phase.
- `dokumen_id` is now nullable at the database/schema layer, but no `MANUAL` rows are created in this phase.
- Existing Manual Archive rows remain in `arsip.manual_arsip`; they are not copied, backfilled, deleted, or dual-written.
- Existing workflow attachment snapshots and Manual Archive attachment rows remain separate.

## Schema Foundation

Phase 12L.2 adds or prepares the following canonical parent fields on `arsip.arsip`:

- `source_type`, with allowed values `WORKFLOW` and `MANUAL`;
- `nama_arsip`, nullable during transition;
- existing `dokumen_id` retained as the workflow document reference and made nullable overall;
- existing `nomor_surat`;
- new `klasifikasi_id` reference to `arsip.master_klasifikasi_arsip`;
- new `klasifikasi_kode_snapshot`;
- new `klasifikasi_nama_snapshot`;
- existing `retensi_aktif`;
- existing `retensi_inaktif`;
- existing `masa_aktif_berakhir`;
- existing `masa_inaktif_berakhir`;
- existing `archived_at`, treated as transitional `tanggal_diarsipkan`;
- existing `archived_by`, treated as transitional `diarsipkan_oleh`;
- existing `nominal_realisasi`;
- existing `status_arsip`;
- new supplemental safe `metadata` JSONB;
- new `created_by`, nullable during transition;
- existing `created_at`;
- new `updated_at`.

Legacy/free-text `klasifikasi` is preserved. It is not dropped or renamed in this phase because existing workflow archive runtime and pages still read it.

## Constraints And Defaults

Implemented now:

- `source_type` is `NOT NULL` with database default `WORKFLOW`.
- `source_type` has a check constraint limited to `WORKFLOW` and `MANUAL`.
- `dokumen_id` is nullable overall.
- `klasifikasi_id` has a nullable foreign key to `master_klasifikasi_arsip`.
- `metadata` is `NOT NULL` with default `{}`.
- `updated_at` is `NOT NULL` with default `now()`.

Deferred constraints:

- Require `dokumen_id IS NOT NULL` when `source_type='WORKFLOW'`.
- Require `dokumen_id IS NULL` when `source_type='MANUAL'`.
- Require canonical `nama_arsip`, classification id/snapshots, retention fields, archive actor/date fields, `created_by`, and `updated_at` for all canonical rows.
- Make `klasifikasi_id` mandatory after report-first mapping/backfill.

Strict relationship and requiredness checks are deferred because existing workflow rows are not fully backfilled into the canonical field set and no canonical Manual Archive rows exist yet.

## Migration Draft

Migration added:

- `drizzle/0005_canonical_archive_schema_foundation.sql`

The migration is additive/transitional:

- no old table deletion;
- no seed deletion;
- no storage/file deletion;
- no attachment consolidation;
- no Manual Archive row migration;
- no workflow archive data migration beyond defaulted nullable scaffolding;
- no Supabase migration changes.

Indexes added:

- `idx_arsip_source_type`;
- `idx_arsip_klasifikasi_id`.

Existing indexes on `status_arsip`, `dokumen_id`, retention dates, and archive dates remain in place.

## Known Follow-Up Phases

Future phases must separately handle:

- compatibility read service or view for unified archive DTOs;
- report-first backfill for workflow `nama_arsip`, classification id/snapshots, and `created_by`;
- report-first mapping for existing Manual Archive rows, including missing `nomor_surat`, mandatory classification, and retention data;
- workflow archive write alignment for `source_type='WORKFLOW'`;
- Manual Archive write alignment for `source_type='MANUAL'`;
- unified archive list/detail services;
- lifecycle API unification;
- retention calculation/backfill;
- aggregate/export behavior;
- cleanup only after explicit report-first review and human approval.

## Human Review

Human must review the migration SQL before commit. Migration execution is manual only after commit and explicit approval. After execution, inspect the PostgreSQL schema and verify existing workflow archive inserts still work before any later runtime alignment phase.
