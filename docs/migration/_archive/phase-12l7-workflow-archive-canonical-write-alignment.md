# Phase 12L.7 - Workflow Archive Canonical Write Alignment

Date: 2026-05-24

Status: implemented pending human review and human retest. No database migration, schema change, route generation, Manual Archive write change, backfill, cleanup, lifecycle unification, preview/download change, upload change, package change, seed execution, or live DB compatibility report execution is included in this phase.

## Scope And Boundary

This phase aligns only the workflow archive creation/write path that creates `source_type='WORKFLOW'` rows in `arsip.arsip`.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Workflow archive creation remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Workflow Canonical Fields Written

New workflow archive rows now explicitly write these canonical/transitional fields on `arsip.arsip`:

- `source_type='WORKFLOW'`;
- `dokumen_id=dokumen_transaksi.id`;
- `nama_arsip`, derived server-side from workflow document metadata;
- existing `nomor_surat`;
- `klasifikasi_id`, selected from `master_klasifikasi_arsip`;
- `klasifikasi_kode_snapshot`, derived server-side from `master_klasifikasi_arsip.kode`;
- `klasifikasi_nama_snapshot`, derived server-side from `master_klasifikasi_arsip.nama`;
- legacy `klasifikasi`, preserved during transition from the selected master classification name;
- existing retention fields and retention end dates;
- existing `archived_at` behavior through the database/server timestamp default;
- `archived_by`, from the current authenticated `KEPALA_SUB_BAGIAN_UMUM` session user;
- `created_by`, from `dokumen_transaksi.created_by`;
- existing workflow `nominal_realisasi` behavior;
- `status_arsip='AKTIF'`;
- existing `lampiran_snapshot` behavior.

`metadata` remains supplemental only and is not used to store core required archive fields or file access data.

## Nama Arsip Derivation Policy

Workflow `nama_arsip` is derived by a deterministic helper from already available workflow document metadata.

Derivation order:

1. Use `{jenis_dokumen} - {judul}` when both document type/name and title are available.
2. Use `judul` when only the title is available.
3. Use kegiatan/activity name when title is absent.
4. Use `Arsip Dokumen` only when no reliable title or kegiatan name is available.

The helper trims values, normalizes internal whitespace, and caps the output to a bounded text length. It does not derive names from filenames, physical paths, logical storage paths, attachment metadata, logs, tokens, or file contents.

Runtime writes must not use `TEST`. The `TEST` placeholder remains allowed only for a later explicitly scoped existing-row remediation/backfill phase if humans approve it.

## Classification Id And Snapshot Rule

The workflow archive API contract now validates `klasifikasi_id`.

The UI may still display the friendly classification code/name tree, but it submits the selected master classification id. The server then loads active `master_klasifikasi_arsip` by id and derives both code and name snapshots from that row.

Client-supplied classification name/code is not trusted. Legacy free-text `klasifikasi` is retained only as compatibility text, derived from the selected master classification name.

Missing `klasifikasi_id` returns a safe validation error. Invalid, inactive, or missing classification rows return a safe rejection without inserting an archive row.

## created_by And archived_by Rule

For new workflow archive rows:

- `created_by` is `dokumen_transaksi.created_by`, meaning the creator of the workflow archive source/document.
- `archived_by` is the current authenticated `KEPALA_SUB_BAGIAN_UMUM` session user who submits archive metadata.

If the source document creator is missing, the route fails safely and does not guess from the session user.

## Intentionally Not Changed

This phase does not:

- change Manual Archive create/edit/upload/preview/download behavior;
- create canonical `MANUAL` rows;
- dual-write Manual Archive rows;
- backfill existing workflow archive rows;
- use `TEST` in runtime writes;
- implement existing-row remediation;
- implement unified archive list/detail UI;
- implement lifecycle API unification;
- implement retention calculation changes;
- implement aggregate/export behavior;
- consolidate attachment tables;
- delete old tables;
- delete Manual Archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior;
- create migrations;
- modify Drizzle schema;
- modify route generation or package files;
- run migrations, seeds, broad build, broad E2E, or the live DB compatibility report.

## Validation

Focused coverage was added for:

- workflow `nama_arsip` derivation;
- successful workflow archive canonical field writes;
- server-derived classification snapshots;
- `created_by` from `dokumen_transaksi.created_by`;
- `archived_by` from the session user;
- ignoring client-supplied legacy classification text in favor of master classification lookup;
- missing `klasifikasi_id`;
- missing/inactive classification;
- missing source document creator;
- preserving `lampiran_snapshot` behavior in the insert payload;
- safe response shape without file access fields.

## Existing Data And Backfill Note

Existing workflow archive rows are not backfilled in this phase.

Rows already missing `nama_arsip`, classification id/snapshots, or `created_by` remain future report-first remediation candidates. The placeholder value `TEST` may be used only in a later explicitly scoped existing-row backfill/remediation phase if humans approve that policy. It must not be used by new runtime workflow archive writes.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12L.8 - Retention Metadata Design For Manual Archive Canonical Write Alignment
```

Keep Manual Archive canonical write alignment blocked until `nomor_surat`, required canonical classification, retention fields/policy, date semantics, idempotency, and attachment preservation are explicitly designed.
