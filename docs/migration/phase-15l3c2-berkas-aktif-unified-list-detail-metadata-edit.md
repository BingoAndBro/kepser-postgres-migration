# Phase 15L.3C.2 - Berkas Aktif Unified List, Detail Tabs, Metadata Modal, and Active Metadata Edit

Date: 2026-06-07

## 1. Status

Implemented for focused local validation. Manual browser QA remains required.

## 2. Scope

This phase updates the folder-first active archive UI for `/arsiparis/berkas` and `/arsiparis/berkas/$id`, adds a document metadata modal from the berkas detail item list, and adds a narrow active-archive metadata edit path.

No schema, migration, package, env, storage, file-access, auth/session, routeTree, DB, Drizzle, Supabase, commit, or push changes are included.

## 3. User Design Decisions

- `/arsiparis/berkas` uses one unified list/table for Berkas Terbuka and Arsip Aktif.
- The list exposes segmented filters: `Semua`, `Terbuka`, `Arsip Aktif`.
- Open berkas detail has only `Daftar Dokumen` and `Riwayat Aktivitas Berkas`.
- Closed/lifecycle berkas detail includes `Metadata Arsip`, `Daftar Dokumen`, and `Riwayat Aktivitas`.
- `WORKFLOW` is displayed as `Persetujuan`; the stored source value remains unchanged.
- Edit Metadata is only available for closed `AKTIF` folders before moving to Inaktif.

## 4. Prototype/Screenshots Used

Used the user-provided screenshots for Pemberkasan Arsip Aktif list, status filter pattern, berkas detail tabs, document metadata modal, and close/edit metadata dialog direction.

Inspected prototype references under `D:\Temp\dms-ai-studio-final`, including `ArchivistView.tsx`, `DetailPane.tsx`, and `ActivityLogView.tsx`. No prototype source was copied or imported.

## 5. Approved Baselines Used

- `docs/migration/phase-15l3c1-approved-archive-entry-pattern-baseline.md`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l3b-cross-role-document-detail-visual-parity.md`
- `docs/migration/phase-15m2-approved-table-row-surface-tone-rollout.md`
- Approved Pengklasifikasian Dokumen and Penambahan Dokumen archive entry pages.

## 6. Files Changed

- `src/components/ui/StatusBadge.tsx`
- `src/lib/archive/berkas-arsip-page-format.ts`
- `src/lib/archive/berkas-arsip-service.ts`
- `src/lib/archive/berkas-arsip-api.ts`
- `src/routes/api/arsiparis/berkas/$id.ts`
- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts`
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`
- `tests/unit/components/ui-foundation.test.ts`
- `docs/migration/phase-15l3c2-berkas-aktif-unified-list-detail-metadata-edit.md`

## 7. Unified Berkas List Behavior

The page still fetches existing safe API data for:

- `OPEN/null`
- `CLOSED/AKTIF`

The UI combines those rows in presentation only. No new list API, schema, legacy canonical runtime, or routeTree change was added.

## 8. Status Filter Behavior

Segmented status filter:

- `Semua`: shows open and active rows.
- `Terbuka`: shows `OPEN/null`.
- `Arsip Aktif`: shows `CLOSED/AKTIF`.

Search remains local and uses safe display fields only.

## 9. Berkas Detail Tab Behavior

- Open berkas: `Daftar Dokumen`, `Riwayat Aktivitas Berkas`.
- Closed/AKTIF and later lifecycle statuses: `Metadata Arsip`, `Daftar Dokumen`, `Riwayat Aktivitas`.
- Metadata edit is hidden unless status is `CLOSED/AKTIF`.

## 10. Daftar Dokumen Table/Modal Behavior

`Daftar Dokumen` now uses a table/list shape with columns:

- Judul Dokumen
- Sumber
- Tanggal Dokumen
- Pengaju / Pembuat
- Nominal Realisasi
- Aksi

The row action opens a metadata modal using safe DTO fields. Attachment preview/download actions continue to use existing folder item file-access URLs.

## 11. Source Label Mapping

Display mapping:

- `WORKFLOW` -> `Persetujuan`
- `MANUAL` -> `Manual`

Internal `source_type` values are not changed.

## 12. Riwayat Aktivitas Berkas Semantics

The history panel is berkas lifecycle-oriented, not raw workflow approval history.

Because there is no dedicated append-only berkas activity log table in this scope, the page shows derived events only where supported by existing status/source dates:

- Dokumen selesai persetujuan PPSPM
- Penambahan dokumen manual sukses
- Dokumen diklasifikasikan ke berkas
- Berkas ditutup
- Berkas dipindahkan ke Inaktif
- Berkas dipindahkan ke Usul Musnah
- File dimusnahkan

No event after `Dimusnahkan` is displayed.

## 13. Edit Metadata Behavior and Server-Side Guard

Added `PATCH /api/arsiparis/berkas/$id` on the existing detail API route.

Server guard:

- requires same-origin for unsafe method;
- requires local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- validates berkas id;
- validates request with existing close metadata schema;
- updates only `nomor_spm`, `retensi_aktif`, `retensi_inaktif`, and derived retention end dates;
- does not update `closed_at` or `closed_by`;
- calculates derived retention end dates from the existing berkas `closed_at`, not the edit request time and not an edited closure date;
- allows update only when the current row is `CLOSED/AKTIF`;
- rejects OPEN, INAKTIF, USUL_MUSNAH, DIMUSNAHKAN, and unknown lifecycle states;
- does not mutate lifecycle status, source items, storage, file access, or physical files.

No berkas append-only activity log exists in this scope, so no fake log row is written and Riwayat Aktivitas Berkas does not claim a precise metadata-edit audit event.

## 14. Folder-First Behavior Preserved

Folder-first authority remains `berkas_arsip` and `berkas_arsip_item` enriched from current source tables. No legacy canonical archive surfaces or assumptions were restored.

## 15. Lifecycle/Destruction Behavior Preserved

Lifecycle order remains:

```text
OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN
```

Destruction confirmation remains `MUSNAHKAN DATA FILE`. Destroyed-file UX remains `Data file sudah dimusnahkan`.

## 16. Attachment/Preview/Download Behavior Preserved

No preview/download route selection, signed URL/token behavior, authorization, storage helper, or physical deletion behavior was changed.

## 17. Mobile Behavior

The unified list and detail document list include mobile card alternatives. Modals use bounded height and scroll when needed.

## 18. API/Backend Changes

Backend change is limited to existing berkas detail API `PATCH` and an archive-domain service helper. No new route file is added, so routeTree remains untouched.

The PATCH response omits `closed_by` and `created_by` actor ids.

## 19. Validation Performed

Passed:

- `pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts`
- `pnpm test tests/unit/arsiparis`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `git diff --check`
- `git diff --name-only`
- protected-file diff check

Notes:

- `git diff --check` emitted line-ending normalization warnings only.
- `git status --short --branch` emitted the existing user-level global git ignore permission warning only.

## 20. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Verify `/arsiparis/berkas`, unified filter behavior, detail tabs, document modal, edit metadata only for Arsip Aktif, read-only metadata after Inaktif/Usul Musnah/Dimusnahkan, destruction phrases, unchanged preview/download, and 390px mobile behavior.

## 21. Protected Files Confirmation

Protected-file diff check was empty. These protected files/trees were not modified:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

## 22. Deferred Items / Phase 15N Reuse Opportunities

- A dedicated append-only berkas activity log would be needed for precise actor/timestamp history across every lifecycle/edit event.
- Reusable archive list/detail/modal primitives can be extracted only after more archive pages are approved.
- Browser QA remains required for visual approval.
