# Phase 13E - Penambahan Dokumen Manual Flow

Date: 2026-05-29

Status: implemented as a bounded transitional UI/API alignment.

## Phase Status

Phase 13E updates the existing manual entry surface from `Penambahan Arsip` to `Penambahan Dokumen`.

This phase is transitional. It moves the user-facing form toward manual document intake for the future classification/folder flow, while preserving the existing internal compatibility model.

## What Changed

- Navigation and page copy now use `Penambahan Dokumen`.
- Manual entry actions now use `Tambah Dokumen`.
- The create form now shows the Phase 13E document-intake fields:
  - `Nama Dokumen`;
  - `Kategori`;
  - `Tanggal Dokumen/Sumber`;
  - `Jenis Pembayaran`;
  - `Nominal Realisasi`;
  - required `Keterangan`;
  - optional `Lampiran`.
- The initial classification selector is labeled `Jenis Pembayaran`.
- Manual create/update validation messages now use `dokumen` and `jenis pembayaran` for current manual-entry boundaries.
- The current UI no longer collects final archive metadata.

## Transitional Compatibility Boundary

Internal compatibility names remain unchanged:

- route path remains `/arsiparis/penambahan-arsip`;
- API path remains `/api/arsiparis/manual-arsip`;
- `arsip.manual_arsip` remains the manual source table;
- `arsip.manual_arsip_attachment` remains the attachment table;
- `manual_arsip.category_id` remains the category field;
- `manual_arsip.klasifikasi_id` and `arsip.master_klasifikasi_arsip` remain the internal classification/payment source.

New manual creates still write the transitional `manual_arsip` source row and a linked canonical `arsip.arsip` row with `source_type='MANUAL'`. This preserves Phase 12 unified-list/detail compatibility until a true folder/berkas manual document source model exists.

For current Phase 13E UI creates, final archive metadata fields remain null in the transitional source/canonical rows. Legacy API callers may still submit existing final metadata fields for compatibility, but the current UI does not collect them.

## Not Changed

This phase does not:

- add a folder/berkas schema or model;
- add close-folder/finalize-folder flow;
- add a final `Nomor SPM` form;
- add final retention form inputs to the current manual document UI;
- rename database tables or columns;
- rename route paths or API paths;
- change RBAC, auth, session, `ADMIN`, storage, migrations, package files, or route generation;
- backfill rows, run cleanup, or touch physical files.

## Schema Blocker

No schema blocker was encountered. The existing schema can represent the requested manual document intake fields:

- `manual_arsip.nama` for `Nama Dokumen`;
- `manual_arsip_category` for `Kategori`;
- `manual_arsip.tanggal` for `Tanggal Dokumen/Sumber`;
- `manual_arsip.klasifikasi_id` for `Jenis Pembayaran`;
- `manual_arsip.nominal_realisasi` for `Nominal Realisasi`;
- `manual_arsip.keterangan` for required `Keterangan`;
- `manual_arsip_attachment` for optional attachments.

## Next Recommended Phase

Phase 13F should introduce the folder/berkas data-model foundation. Phase 13G should then add the close-folder flow where final archive metadata, including `Nomor SPM` and retention, is collected.

