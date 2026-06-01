# Phase 12L.11 - Manual Archive UI Required Metadata

Date: 2026-05-24

Status: implemented pending human UI review and manual runtime retest.

## Scope And Boundary

Phase 12L.11 updates the Manual Archive browser create form on `/arsiparis/penambahan-arsip` so users can submit the metadata required by the stricter Phase 12L.10 Manual Archive API contract.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational Manual Archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

Manual Archive still writes only to `arsip.manual_arsip` and `arsip.manual_arsip_attachment`. This phase does not create canonical `MANUAL` rows in `arsip.arsip`.

## UI Fields Added Or Relabeled

The create form now collects:

- `nama`, labeled `Nama Arsip`;
- `tanggal`, labeled `Tanggal Dokumen/Sumber`;
- `nomor_surat`, labeled `Nomor Surat`;
- `tanggal_diarsipkan`, labeled `Tanggal Arsip`;
- `category_id`, existing Manual Archive category;
- `klasifikasi_id`, selected through friendly classification code plus name;
- `retensi_aktif`, selected from the approved labels;
- `retensi_inaktif`, selected from the approved labels;
- `nominal_realisasi`, existing Rupiah-style positive integer input;
- `keterangan`, existing required text;
- optional attachment rows, unchanged from the existing repeated file/title behavior.

Approved retention labels remain:

```text
1 Tahun
3 Tahun
5 Tahun
10 Tahun
Permanen
```

The UI explains that `Tanggal Dokumen/Sumber` is source/date metadata, while `Tanggal Arsip` is the official archive date used by the server to calculate retention end dates.

## Submit Payload

The create form submits:

- `nama`;
- `tanggal`;
- `nomor_surat`;
- `tanggal_diarsipkan`;
- `keterangan`;
- `category_id`;
- `klasifikasi_id`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `nominal_realisasi` as a raw numeric integer.

The browser does not submit classification snapshots, retention end dates, archive actor fields, canonical linkage fields, file paths, file URLs, file tokens, SQL, env values, or secrets.

## Server Authority

Client-side validation exists only to help users correct missing fields before submit. The server remains authoritative for authentication, RBAC, same-origin checks, request validation, classification lookup, classification snapshot derivation, retention date calculation, and writes.

The UI does not trust or submit `klasifikasi_kode_snapshot`, `klasifikasi_nama_snapshot`, `masa_aktif_berakhir`, or `masa_inaktif_berakhir` as authority.

## Migration Precondition

Phase 12L.9 migration must be reviewed and applied manually before local runtime smoke testing creates or edits Manual Archive rows using the new columns.

If the migration is not applied, UI code and diffs can still be reviewed, but browser create/edit smoke tests that reach the database boundary can fail because the required target columns may not exist.

## What Is Intentionally Not Changed

This phase does not:

- modify Manual Archive create/edit API validation;
- add a Manual Archive edit UI;
- create canonical `MANUAL` rows in `arsip.arsip`;
- dual-write;
- backfill existing `manual_arsip` rows;
- execute migrations or seeds;
- run a live DB compatibility report;
- change attachment upload, preview, or download behavior;
- change lifecycle behavior or APIs;
- implement unified archive list/detail UI;
- implement aggregate/export;
- consolidate attachment tables;
- delete rows, tables, test data, or storage files;
- modify workflow archive routes;
- modify package files, generated route files, DB folders, Drizzle migrations, or historical Supabase artifacts.

Because `/arsiparis/penambahan-arsip` has no full Manual Archive edit UI in the current page, API `PATCH /api/arsiparis/manual-arsip/$id` remains server-ready but browser edit wiring remains future work.

## Manual Retest Instructions

Precondition: Phase 12L.9 migration is applied locally.

Manual checks:

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/penambahan-arsip`.
3. Create a Manual Archive with all required fields and no attachments.
4. Create a Manual Archive with one attachment row.
5. Try missing `Nomor Surat` and expect client validation.
6. Try missing `Klasifikasi Arsip` and expect client validation.
7. Try missing `Tanggal Arsip` and expect client validation.
8. Try missing `Retensi Aktif` or `Retensi Inaktif` and expect client validation.
9. Try nominal empty or zero and expect client validation.
10. Confirm server responses do not expose logical paths, physical paths, storage roots, file URLs, file tokens, SQL, env values, or secrets.
11. Confirm no canonical `arsip.arsip` row with `source_type='MANUAL'` is created.

## Risks And Open Decisions

Risks:

- Runtime create smoke tests will fail at the DB boundary if the Phase 12L.9 migration has not been applied.
- Existing Manual Archive rows may still lack Phase 12L.10 metadata until a separate remediation/backfill phase.
- The UI currently exposes create flow only; edit flow remains API-only from the browser page perspective.

Open decisions:

- when to add Manual Archive edit UI for the stricter PATCH contract;
- when to create canonical `MANUAL` rows with `canonical_arsip_id` idempotency;
- when to remediate existing rows before stricter DB constraints;
- whether future classification master data should drive retention labels automatically.

## Next Phase Recommendation

Recommended next phase:

```text
Manual Archive canonical MANUAL write-alignment planning, or Manual Archive edit UI wiring if humans want browser PATCH coverage first.
```

Either path should remain separate from backfill, lifecycle unification, aggregate/export, attachment consolidation, and cleanup.
