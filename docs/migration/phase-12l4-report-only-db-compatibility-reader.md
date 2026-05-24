# Phase 12L.4 - Report-Only DB Compatibility Reader

Date: 2026-05-24

Status: implemented pending human review. This phase adds an internal server-side read helper and focused mocked unit tests only. It does not add routes, UI, public APIs, database migrations, runtime write changes, lifecycle unification, retention calculation, aggregate/export behavior, cleanup, route generation, seed changes, storage changes, or package changes.

## Purpose And Boundary

Phase 12L.4 adds a report-only database compatibility reader for human remediation review during unified archive consolidation.

The reader loads bounded rows from the current workflow archive source and the current Manual Archive source, maps them through the Phase 12L.3 pure compatibility mappers, and returns safe compatibility rows plus summary counts.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary, `dms_active_role` remains UX-only, and server/API RBAC remains authoritative for later caller phases. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive behavior remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## Reader Output Shape

Internal helper:

```ts
getUnifiedArchiveCompatibilityReport(options?: {
  status_arsip?: StatusArsip
  limit?: number
}): Promise<{
  rows: UnifiedArchiveCompatibilityRow[]
  summary: UnifiedArchiveBackfillSummary
}>
```

The implementation also exposes an injected-reader factory so focused tests and later internal callers can provide a Drizzle-shaped read-only database dependency without constructing the live database client at module import time.

The default limit is conservative at 100 rows per source. The maximum accepted limit is capped at 500 rows per source.

## Workflow Query Fields

The workflow read uses `arsip.arsip` with `source_type='WORKFLOW'` and optional `status_arsip` filtering.

Projected fields:

- `arsip.id`
- `arsip.source_type`
- `arsip.dokumen_id`
- `arsip.nama_arsip`
- joined `dokumen_transaksi.judul` as a conservative `documentTitle` fallback
- `arsip.nomor_surat`
- legacy text `arsip.klasifikasi`
- `arsip.klasifikasi_id`
- `arsip.klasifikasi_kode_snapshot`
- `arsip.klasifikasi_nama_snapshot`
- `arsip.archived_at`
- `arsip.archived_by`
- `arsip.created_by`
- `arsip.retensi_aktif`
- `arsip.retensi_inaktif`
- `arsip.masa_aktif_berakhir`
- `arsip.masa_inaktif_berakhir`
- `arsip.nominal_realisasi`
- `arsip.status_arsip`
- `arsip.lampiran_snapshot`

The workflow attachment snapshot is passed only to the pure mapper for numeric attachment counting. The compatibility row does not expose snapshot contents, file names, URLs, file paths, or token-like values.

## Manual Query Fields

The Manual Archive read uses `arsip.manual_arsip` with optional `status_arsip` filtering and a safe left join to `arsip.master_klasifikasi_arsip` for classification code.

Projected fields:

- `manual_arsip.id`
- `manual_arsip.nama`
- `manual_arsip.tanggal`
- `manual_arsip.created_at`
- `manual_arsip.created_by`
- `manual_arsip.klasifikasi_id`
- joined `master_klasifikasi_arsip.kode` as `klasifikasiKodeSnapshot`
- `manual_arsip.klasifikasi_nama_snapshot`
- `manual_arsip.nominal_realisasi`
- `manual_arsip.status_arsip`

Manual Archive rows are not migrated, copied, dual-written, linked to canonical parent rows, or modified by this reader.

## Attachment Count Rule

Manual attachment counts are loaded with a separate grouped count query over `manual_arsip_attachment.manual_arsip_id` for only the bounded Manual Archive parent ids already selected by the reader.

The reader returns only a numeric `attachment_count`. It does not select or return:

- `logical_path`
- `original_filename`
- `judul_lampiran`
- `content_type`
- `size_bytes`
- metadata JSON
- physical paths
- storage roots
- URLs
- signed tokens

## Safety And Redaction Rules

The reader returns only `UnifiedArchiveCompatibilityRow[]` and `UnifiedArchiveBackfillSummary`.

It does not return raw DB rows. It does not log raw query errors. It does not expose SQL details, SQL params, env values, DB URLs, storage roots, physical paths, logical storage paths, filenames, file URLs, token internals, session values, password data, or secrets.

`missing_fields` and `warnings` remain controlled labels from `src/lib/archive/unified-compatibility.ts`.

The reader uses read-only `select` calls. It does not call `insert`, `update`, `delete`, or `transaction`.

## Intentionally Not Changed

This phase does not:

- create API routes;
- create UI;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- backfill database rows;
- update workflow archive writes;
- update Manual Archive create/edit writes;
- create canonical Manual Archive parent rows;
- link Manual Archive rows to canonical parent rows;
- implement unified list pages;
- modify Arsip Aktif/Inaktif/Usul Musnah pages;
- implement lifecycle APIs;
- implement retention calculations;
- implement aggregate/export behavior;
- consolidate attachment tables;
- delete old tables;
- delete manual archive test data;
- delete storage files;
- modify preview/download behavior;
- modify upload behavior;
- modify package files or route generation.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12L.5 - Human-reviewed remediation policy for compatibility report gaps
```

Do not proceed to workflow write alignment, Manual Archive write alignment, lifecycle unification, retention backfill, aggregate/export, UI integration, cleanup, table deletion, or destructive storage work until a human has reviewed the report output and approved a remediation policy for missing `nama_arsip`, `nomor_surat`, classification gaps, retention gaps, Manual Archive canonical parent creation, and attachment preservation.

Implementation note as of 2026-05-24: Phase 12L.5 adds a policy-only remediation document for the compatibility report gaps. It does not run the live reader, add routes/UI, mutate rows, create migrations, align writes, backfill data, or perform cleanup.
