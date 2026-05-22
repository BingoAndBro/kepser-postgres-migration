# Phase 12G - Manual Archive Schema/Data Model

Date: 2026-05-22

Status: implemented pending human review and migration execution.

Scope: data model and documentation only. No runtime UI, API route, upload route, preview/download route, lifecycle action route, aggregate report, Excel export, route generation, or seed execution was performed in this phase.

## Boundary

Manual archive records for Penambahan Arsip use separate tables under the `arsip` PostgreSQL schema:

- `arsip.manual_arsip_category`
- `arsip.manual_arsip`
- `arsip.manual_arsip_attachment`

Manual archive is intentionally separate from workflow documents. It does not depend on `dokumen.dokumen_transaksi`, and it does not extend `arsip.arsip` as its primary model. Existing workflow-coupled archive behavior remains unchanged.

This phase remains within the post-migration partial/bounded release handoff posture for human-controlled internal/local/LAN use. It does not approve public production use, public internet exposure, operational certification, security certification, or a full Supabase repository cleanup.

## Category Model

`manual_arsip_category` is separate from `master_klasifikasi_arsip`.

Initial canonical categories are seeded by migration:

- Pemeliharaan
- Pengadaan
- Lain-lain

`master_klasifikasi_arsip` remains the archival classification hierarchy. Manual archive rows may optionally reference a classification and keep a nullable classification-name snapshot for future display/reporting resilience.

## Parent Record

`manual_arsip` represents one report/archive record. Aggregates must count parent rows, not attachment rows.

Report-critical fields are explicit columns:

- `nama`
- `tanggal`
- `keterangan`
- `nominal_realisasi`
- `category_id`
- `klasifikasi_id`
- `klasifikasi_nama_snapshot`
- `status_arsip`
- lifecycle actor/date fields
- `created_by`
- timestamps

`keterangan` is required.

`nominal_realisasi` is nullable at the database layer for flexibility. A later API/UI phase may make it required if the business rule is confirmed. That API/UI rule must not be confused with the current database nullability.

`metadata` is available only for supplemental data. Report-critical fields must not be stored only in metadata JSONB.

## Attachments

`manual_arsip_attachment` supports many attachments per manual archive parent row.

Attachments are optional. Later UI may start with one optional file, but the schema supports multiple attachments from day one.

Attachment rows store logical storage paths only. They must not store physical filesystem paths or storage roots.

No runtime upload, preview, download, file token, or public/static serving behavior is added in this phase. Future file access must go through authorized server/API boundaries and must not add Supabase Storage fallback or old Supabase file/data recovery.

## Lifecycle

Manual archive uses the same canonical lifecycle status values:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

The schema includes lifecycle actor/date fields for future behavior:

- `inactivated_at` / `inactivated_by`
- `proposed_destroy_at` / `proposed_destroy_by`
- `destroyed_at` / `destroyed_by`

This phase does not implement lifecycle API behavior.

Future file-access implementation must block access when `status_arsip='DIMUSNAHKAN'`, including stale token/path attempts.

## Export/Aggregate Direction

Future aggregate/report/export behavior should be metadata-only by default:

- count one `manual_arsip` parent row as one report;
- do not multiply counts by attachment rows;
- do not include file contents, file URLs, signed token internals, storage roots, or physical paths by default.

## Migration Notes

Migration created:

- `drizzle/0003_manual_archive_schema.sql`

The migration creates the three manual archive tables, indexes, constraints, foreign keys, and idempotent seed data for the initial categories.

The migration was not executed in this phase.

