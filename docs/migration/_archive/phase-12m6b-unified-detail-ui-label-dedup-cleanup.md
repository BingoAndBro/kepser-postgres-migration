# Phase 12M.6b - Unified Detail UI Label And Duplicate Metadata Cleanup

Date: 2026-05-25

Status: implemented pending human review. This phase is a UI-only cleanup for unified archive detail labels and duplicate metadata display.

Implementation note after Phase 12M.6c: canonical archive actor labels now render resolved display names from the unified detail DTO instead of raw UUIDs. The deduplicated source-section policy from this phase remains unchanged.

## Scope And Boundary

Phase 12M.6b updates only the existing unified archive detail page:

```text
/arsiparis/arsip/$id
```

The existing authorized API remains the data boundary:

```text
GET /api/arsiparis/arsip/$id
```

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative.

## Label Changes

Technical labels in the page were replaced with novice-friendly Indonesian labels:

```text
Created By -> Dibuat oleh
Archived By -> Diarsipkan oleh
Created At -> Tanggal dibuat
Updated At -> Terakhir diperbarui
Dokumen ID -> ID Dokumen
Workflow Status -> Status Workflow
```

Attachment labels from Phase 12M.6 remain:

```text
Nama Lampiran
Jenis
Ukuran
Status Ketersediaan
Sumber
Diunggah Pada
```

## Duplicate Metadata Cleanup Policy

`Metadata Arsip` remains the main section for final canonical archive metadata:

- Nama Arsip
- Nomor Surat
- Status Arsip
- Sumber
- Klasifikasi Arsip
- Tanggal Arsip
- Retensi Aktif
- Retensi Inaktif
- Masa Aktif Berakhir
- Masa Inaktif Berakhir
- Nominal Realisasi
- Dibuat oleh
- Diarsipkan oleh
- Tanggal dibuat
- Terakhir diperbarui

Source-specific sections must avoid repeating the same actor/date/archive metadata already shown in `Metadata Arsip`.

## Source-Specific Section Policy

`Metadata Dokumen Persetujuan` now shows source/provenance fields only:

- ID Dokumen
- Judul Dokumen
- Jenis Dokumen
- Status Workflow
- Fungsi
- Kegiatan
- Tahun

`Metadata Arsip Manual` now shows source/provenance fields only:

- Nama
- Keterangan
- Kategori
- Tanggal Dokumen/Sumber

Manual source `Tanggal Diarsipkan`, `Dibuat oleh`, and `Diarsipkan oleh` are not repeated because canonical archive metadata already shows the archive date and actor fields.

## What Is Intentionally Not Changed

This phase does not:

- change the unified archive detail service or API;
- change database queries;
- add preview/download buttons;
- add file URLs or signed URLs;
- change existing preview/download endpoints;
- implement lifecycle mutation;
- implement destruction mutation;
- implement edit/delete actions;
- implement search, export, cleanup, or backfill;
- create migrations;
- modify schema;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation.

The page must not expose logical paths, physical paths, storage roots, file tokens, signed token internals, raw attachment metadata, raw DB rows, SQL details, environment values, or secrets.

## Validation

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

Do not run broad build/E2E, DB migrations/seeds, route generation, live DB reports, or cleanup for this phase.

## Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/arsip/$id` for a `WORKFLOW` archive.
3. Confirm labels are novice-friendly Indonesian.
4. Confirm `Metadata Dokumen Persetujuan` does not duplicate `Dibuat oleh`, `Diarsipkan oleh`, `Tanggal dibuat`, or `Terakhir diperbarui` from `Metadata Arsip`.
5. Open `/arsiparis/arsip/$id` for a `MANUAL` archive.
6. Confirm `Metadata Arsip Manual` does not duplicate actor or archive date fields already shown in `Metadata Arsip`.
7. Confirm `Lampiran Arsip` still appears.
8. Confirm no preview/download/lifecycle/edit/delete actions appear.
9. Confirm no path, token, storage root, SQL, environment value, secret, or raw attachment metadata appears.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12M.7 - Source-Aware Preview/Download Actions From Detail
```

That phase should remain separate and should only start after server-side file-access enforcement is reverified for `WORKFLOW` and `MANUAL` sources, including `DIMUSNAHKAN` blocking and stale token/path handling.
