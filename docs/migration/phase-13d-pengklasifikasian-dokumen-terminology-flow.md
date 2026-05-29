# Phase 13D - Pengklasifikasian Dokumen Terminology & Flow

Date: 2026-05-29

Status: runtime-visible terminology and lightweight initial-flow alignment only.

## Phase Status

Phase 13D updates the initial Kepala Sub Bagian Umum classification surface so completed workflow documents are presented as entering `Pengklasifikasian Dokumen`, not final archive filing.

This phase changes UI/API display copy and removes the initial `Nomor Surat` and final retention metadata requirements from the workflow classification route. It does not add a folder/berkas model or final close-folder metadata flow.

## User-Facing Terminology

- Initial stage: `Pengklasifikasian Dokumen`.
- Early selection label: `Jenis Pembayaran`.
- Final archive/reporting contexts may still use `Klasifikasi Arsip`.
- `Pemberkasan Arsip` is reserved for later folder-first archive filing work, not the current pre-folder classification inbox.

## Compatibility Boundary

Internal compatibility is unchanged:

- `klasifikasi_id` remains the request/API field for the selected payment/classification id.
- `arsip.master_klasifikasi_arsip` remains the source table for the selectable hierarchy.
- Existing route paths such as `/arsiparis/inbox`, `/arsiparis/dokumen/$id`, and `/api/arsiparis/dokumen/$id/archive` remain unchanged.
- Existing archive persistence remains transitional until the folder/berkas model exists.

No database columns, table names, enum values, route paths, file paths, or API field names are renamed in this phase.

## Nomor Surat And Nomor SPM

Initial document classification no longer requires `Nomor Surat`.

`Nomor SPM` is not introduced in this phase. It belongs to a future close-folder/berkas metadata phase together with final retention metadata.

The current workflow classification API accepts omitted `nomor_surat` for this transitional stage and stores it as `null` when absent. It also accepts omitted retention fields for the same reason; final retention metadata belongs to the future close-folder flow.

## Non-Goals

This phase does not:

- add a folder/berkas schema or data model;
- add close-folder or folder-finalization UI/API;
- add a final `Nomor SPM` form;
- change RBAC, auth, session, or `ADMIN` behavior;
- rename internal classification fields or archive tables;
- change schema, migrations, package files, route generation, `src/routeTree.gen.ts`, storage, seeds, cleanup behavior, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Follow-Up

- Phase 13E: Penambahan Dokumen manual flow alignment.
- Phase 13F: folder/berkas archive data model foundation.
- Phase 13G: close-folder flow with `Nomor SPM` and final retention metadata.
- Later folder-first archive pages can decide how `Pemberkasan Arsip Aktif` and final `Klasifikasi Arsip` reporting should replace transitional list behavior.
