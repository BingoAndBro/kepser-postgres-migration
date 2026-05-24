# Phase 12L.10 - Manual Archive API Retention Validation

Date: 2026-05-24

Status: implemented pending human review and manual runtime retest. Phase 12L.9 migration must be reviewed and applied manually before local runtime smoke testing uses the new columns.

## Scope And Boundary

Phase 12L.10 updates Manual Archive create/edit API validation and server-side write behavior only.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Manual Archive still writes to `arsip.manual_arsip` and `arsip.manual_arsip_attachment`. This phase does not create canonical `MANUAL` rows in `arsip.arsip`.

## Required Manual Archive API Fields

After this phase, Manual Archive `POST /api/arsiparis/manual-arsip` and `PATCH /api/arsiparis/manual-arsip/$id` require:

- `nomor_surat`: non-empty trimmed string;
- `nama`: existing required field, with canonical-facing label `Nama Arsip`;
- `tanggal`: existing required source document/date metadata field;
- `tanggal_diarsipkan`: required date-only `YYYY-MM-DD`, official Manual Archive archive date;
- `category_id`: existing required Manual Archive category;
- `klasifikasi_id`: required UUID referencing an active `master_klasifikasi_arsip` row;
- `nominal_realisasi`: positive integer greater than 0;
- `retensi_aktif`: one approved retention label;
- `retensi_inaktif`: one approved retention label;
- `keterangan`: existing required field;
- `metadata`: optional safe JSON object only.

The API rejects formatted Rupiah strings, decimals, zero, negative nominal values, invalid dates, invalid retention labels, missing `klasifikasi_id`, unsafe metadata, and client-provided classification snapshots or core write fields.

## Retention Calculation Policy

Manual Archive retention end dates are calculated server-side from:

- `tanggal_diarsipkan`;
- `retensi_aktif`;
- `retensi_inaktif`.

Approved retention labels are:

```text
1 Tahun
3 Tahun
5 Tahun
10 Tahun
Permanen
```

For numeric `N Tahun` labels, the helper adds `N` calendar years to the date-only base. Leap-day additions clamp to the last valid day of February, so `2024-02-29 + 1 Tahun` becomes `2025-02-28`.

The server writes:

- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- `retensi_aktif`;
- `retensi_inaktif`.

## Permanen Transitional Sentinel

`Permanen` is semantic permanence, not a normal numeric duration.

For transitional compatibility with existing workflow archive date fields, this phase uses:

```text
9999-12-31
```

Rules:

- if `retensi_aktif='Permanen'`, both `masa_aktif_berakhir` and `masa_inaktif_berakhir` are `9999-12-31`;
- if `retensi_inaktif='Permanen'`, `masa_aktif_berakhir` is calculated normally and `masa_inaktif_berakhir` is `9999-12-31`.

Future schema/API hardening may replace the sentinel with nullable permanence semantics if humans approve that policy.

## Classification Snapshot Derivation

The server loads the active `master_klasifikasi_arsip` row by `klasifikasi_id`.

If the row is missing or inactive, the API returns a safe validation error and does not write the Manual Archive row.

The server derives and writes:

- `klasifikasi_kode_snapshot` from `master_klasifikasi_arsip.kode`;
- `klasifikasi_nama_snapshot` from `master_klasifikasi_arsip.nama`.

Client-supplied classification snapshots are not trusted.

## created_by And archived_by

On create:

- `created_by` is the current authenticated `KEPALA_SUB_BAGIAN_UMUM` session user;
- `archived_by` is the same current authenticated `KEPALA_SUB_BAGIAN_UMUM` session user;
- `canonical_arsip_id` remains `null`.

On edit:

- the existing `AKTIF`-only edit guard remains;
- `created_by` is not changed;
- `archived_by` is not changed in this phase;
- `canonical_arsip_id` is not changed.

Reason: the schema has no `updated_by` field. Changing `archived_by` on metadata edit would blur the original archive-recording actor. A future phase should add an explicit update actor if human audit requirements need it.

## What Is Intentionally Not Changed

This phase does not:

- update Manual Archive UI;
- create canonical `MANUAL` rows in `arsip.arsip`;
- dual-write;
- backfill existing `manual_arsip` rows;
- execute migrations or seeds;
- run the live DB compatibility report;
- change attachment upload;
- change attachment preview/download;
- change workflow archive routes;
- implement lifecycle APIs;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows, tables, test data, or storage files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `package.json`, `pnpm-lock.yaml`, or generated route files.

## Migration Precondition

Phase 12L.9 migration must be reviewed and applied manually before runtime smoke testing this phase against a local PostgreSQL database.

If the migration is not applied, code and unit tests can still be reviewed, but direct API create/edit smoke tests that write the new columns are expected to fail at the database boundary.

## Next Phase Recommendation

Recommended next phase:

```text
Manual Archive UI collection for Phase 12L.10 API fields
```

That phase should add UI inputs for `Nama Arsip`, `Nomor Surat`, required canonical classification, `Tanggal Arsip`, and retention labels. It should not create canonical `MANUAL` rows, backfill existing rows, unify lifecycle, change attachment behavior, or run cleanup.
