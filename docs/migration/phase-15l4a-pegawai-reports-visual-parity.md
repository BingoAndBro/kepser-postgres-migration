# Phase 15L.4A - Pegawai Reports Visual Parity

## 1. Status

- Implemented.
- Focused validation passed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- `/pegawai/laporan/saya` visual parity with the approved `/pegawai/dokumen` list/table baseline.
- `/pegawai/laporan/kegiatan` kegiatan-first presentation using existing assignment and report data.
- Same-route kegiatan detail subview through `?kegiatanId=...` because no generated `$id` route exists in the current route tree.
- Advanced filter presentation aligned to the prototype.
- Phase 15L.4A.1 correction: `/pegawai/laporan/kegiatan` advanced filter is scoped to Fungsi plus date range only, with Sort kept in the toolbar shell.
- Focused source guard for report visual parity.

Excluded:

- API/backend changes.
- Route tree generation changes.
- Schema, migration, package, lockfile, env, storage, auth, RBAC, workflow, archive lifecycle, preview/download, and file-access changes.

## 3. Prototype References Inspected

- `D:\Temp\dms-ai-studio-final\src\components\workflow\ReportListView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\UserView.tsx`
- Related prototype screenshots supplied for Laporan Saya, expanded filter, and Laporan Kegiatan detail.

No prototype source was copied or imported.

## 4. Approved Baselines Inspected

- `src/routes/pegawai/dokumen/index.tsx`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l3a2-apply-approved-table-list-baseline.md`
- `docs/migration/phase-15l3a3-workflow-list-header-search-filter-consistency.md`

## 5. Files Changed

- `src/routes/pegawai/laporan/saya.tsx`
- `src/routes/pegawai/laporan/kegiatan.tsx`
- `src/routes/pegawai/dokumen/$id/index.tsx`
- `src/components/laporan/HierarchicalFilter.tsx`
- `src/components/pegawai/PegawaiPagePrimitives.tsx`
- `tests/unit/pegawai/pegawai-reports-visual-parity-source.test.ts`
- `docs/migration/phase-15l4a-pegawai-reports-visual-parity.md`

## 6. Laporan Saya Changes

- Replaced the older report panel composition with the approved `max-w-[1280px]` list page rhythm.
- Added compact icon-token header, concise subtitle, prototype-like search/filter/sort shell, and approved rounded table shell.
- Kept the report data source as existing `/laporan/saya`.
- Kept existing final/saved report meaning: completed and tersimpan documents remain backend-owned.
- Row action opens `/pegawai/dokumen/$id`.
- Phase 15L.4A.1 follow-up made desktop rows keyboard/click actionable, not only the chevron action.
- Visible wording uses `dokumen`, not `arsip` or `berkas`.

## 7. Laporan Kegiatan List Changes

- Changed the primary page from flat document rows to kegiatan-first rows.
- Grouping is derived from existing Ketua Tim assignments plus existing `/laporan/kegiatan` documents.
- Rows show kegiatan name, fungsi where available from documents, document count, nominal summary, latest date, and a detail action.
- Zero-document assignments remain visible when no filter is active; advanced filters hide rows with no matching documents.
- Follow-up removed summary cards from the kegiatan list page so they appear only in the selected kegiatan detail view.
- Detail summary cards use only existing page state: fungsi name, selected kegiatan count, document count, and material nominal total.

## 8. Laporan Kegiatan Detail Changes

- Added same-route detail subview using `?kegiatanId=...`.
- Phase 15L.4A.1 changed the query handling to TanStack Router search state (`Route.useSearch()` and `useNavigate`) instead of direct `window.history` updates.
- Detail page shows kegiatan header, compact informational note, summary cards, search shell, and document table.
- Detail summary cards now follow the approved attractive card direction: fungsi, jumlah kegiatan, total dokumen final, and total nominal realisasi.
- Detail document list has Filter Lanjutan, sort, and pengaju filtering.
- Document rows use the same visual language as Laporan Saya and approved `/pegawai/dokumen`.
- Document actions open `/pegawai/dokumen/$id`.
- Desktop rows and mobile cards are click/keyboard actionable, not only the chevron action.
- No preview/download action was added.

## 9. Filter/Sort Behavior

- `Filter Lanjutan` now opens an expanded panel styled like the prototype/current app direction.
- `/pegawai/laporan/saya` preserves the broader existing report metadata filter choices:
  - Fungsi
  - Kegiatan
  - Jenis Permintaan
  - Kategori Permintaan
  - Detail Permintaan
  - Tanggal mulai/sampai
- `/pegawai/laporan/kegiatan` list filter was corrected in Phase 15L.4A.1 to include only:
  - Fungsi
  - Tanggal mulai/sampai
  - Sort, presented as the adjacent toolbar control.
- The kegiatan detail filter includes Pengaju plus date range, with sort in the toolbar shell.
- Report date controls now reuse the same local `DatePicker` component used by Ajukan Dokumen.
- The kegiatan list filter does not show Kegiatan, Jenis, Kategori, or Detail selectors.
- `Reset`, `Tutup`, and `Terapkan Filter` actions are shown in the expanded panel.
- Filtering remains client-side and uses only fields already returned by existing APIs.
- Sort controls were added visually:
  - Laporan Saya: date, title, and activity ordering.
  - Laporan Kegiatan: date, name, document count, and nominal ordering.

## 10. Table/List Behavior

- Desktop tables use the approved rounded white/off-white shell, neutral header row, soft dividers, row hover, refined status badges, and chevron/detail action.
- Mobile views render as stacked cards with stable metadata tiles and reachable full-width actions.
- Kegiatan list rows navigate to the same-route kegiatan detail subview.
- Detail document rows navigate to `/pegawai/dokumen/$id`.

## 11. Behavior Preserved

- Existing `/laporan/saya` fetch behavior is unchanged.
- Existing `/laporan/kegiatan`, `/users/me`, and `/users/me/ketua-tim` fetch behavior is unchanged.
- Existing Ketua Tim authorization handling is preserved.
- Existing final report document statuses remain backend-owned.
- Existing document detail route remains the only row action target for documents.
- No auth/session/RBAC, workflow/status, or file-access behavior was changed.

## 12. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend service/helper files were modified.
- No request/response contract was changed.
- No database/schema/migration file was modified.

## 13. Validation Performed

Passed before Phase 15L.4A.1:

- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/dokumen`
- `pnpm test tests/unit/pegawai/pegawai-reports-visual-parity-source.test.ts`
- Filtered TypeScript check for changed report route paths found no errors.

Phase 15L.4A.1 note:

- Runtime and test commands were not rerun in this update because the current instruction explicitly says not to run `pnpm test`, `pnpm build`, or `pnpm dev`.

Known existing broader TypeScript status:

- Full `pnpm exec tsc --noEmit --pretty false` still fails on pre-existing unrelated errors in archive/manual-arsip/storage/route guard/historical Supabase/test typing areas.

## 14. Manual QA Checklist

1. Open `/pegawai/laporan/saya`.
2. Confirm header/search/filter/table match approved `/pegawai/dokumen` feel.
3. Expand `Filter Lanjutan` and confirm the existing Laporan Saya filter choices remain available with refined prototype-like presentation.
4. Confirm sorting control is usable.
5. Confirm document row action opens `/pegawai/dokumen/$id`.
6. Confirm only existing backend final/saved documents appear.
7. Open `/pegawai/laporan/kegiatan`.
8. Confirm the page is kegiatan-first by Kegiatan.
9. Confirm advanced filter only shows Fungsi and date range, with Sort available in the toolbar shell.
10. Confirm kegiatan row action opens the kegiatan detail subview.
11. Confirm kegiatan detail summary cards use available data only.
12. Confirm kegiatan detail document table matches Laporan Saya visual style.
13. Confirm detail document row action opens `/pegawai/dokumen/$id`.
14. Check 390px mobile for both report pages and the kegiatan detail subview.

## 15. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, and `supabase/` were not changed.
- No package was installed.
- No API route was changed.
- No commit or push was performed.

## 16. Future Reuse Opportunities For Phase 15N

- Consolidate the repeated report toolbar, status badge, date cell, summary card, and mobile metadata tile patterns.
- Decide whether kegiatan detail should become a generated route once route tree changes are allowed.
- Consider a shared report/table primitive after remaining Phase 15 visual parity pages stabilize.
