# Phase 15L.4B - Penanggung Jawab Kinerja Report Visual Parity

## Status

Implemented for human review.

## Scope

This phase updates the Penanggung Jawab Kinerja `Laporan Kinerja` presentation only. The report now follows the approved report flow:

1. Fungsi list.
2. Detail Fungsi with Kegiatan list.
3. Detail Kegiatan with document list.
4. Metadata-only document modal.

No API, backend service, schema, migration, package, environment, auth, RBAC, routeTree, storage, workflow, archive lifecycle, or file-access behavior is changed.

## Prototype References Inspected

The supplied Laporan Kinerja prototype screenshots were inspected for:

- initial Fungsi-first list structure;
- Detail Fungsi Kegiatan table direction;
- Detail Kegiatan document list direction;
- metadata popup/modal direction;
- warm off-white/orange visual tone, compact search and sort controls, rounded table shell, and chevron-style actions.

The local prototype directory `D:\Temp\dms-ai-studio-final` was inspected for Penanggung Jawab Kinerja report/dashboard references and role navigation context.

## Approved Report Baselines Inspected

Approved app baselines inspected:

- `src/routes/pegawai/laporan/saya.tsx`
- `src/routes/pegawai/laporan/kegiatan.tsx`
- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `docs/migration/phase-15l4a-pegawai-reports-visual-parity.md`

## Files Changed

- `src/routes/penanggung-jawab-kinerja/laporan-kinerja.tsx`
- `src/routes/pegawai/laporan/kegiatan.tsx`
- `tests/unit/laporan/kinerja-visual-parity-source.test.ts`
- `tests/unit/pegawai/pegawai-reports-visual-parity-source.test.ts`
- `docs/migration/phase-15l4b-kinerja-report-visual-parity.md`

## Laporan Kinerja Function List Behavior

The first page now lists Fungsi derived client-side from the existing `/laporan/kinerja` metadata DTO.

The initial page has no summary cards. It provides:

- search;
- sort control;
- sort options: `Terakhir diperbarui`, `Nominal terbesar`, `Dokumen terbanyak`, and `Nama A-Z`;
- table columns for Fungsi, Jumlah Kegiatan, Jumlah Dokumen, Total Nominal Realisasi, Terakhir Diperbarui, and Aksi;
- chevron-style row action matching the approved report table action style.

## Detail Fungsi Behavior

Selecting a Fungsi uses same-route TanStack Router search state and shows a Kegiatan list for that Fungsi.

The detail view includes:

- compact back button;
- selected Fungsi title;
- Laporan Kinerja / Fungsi subtitle;
- four summary cards for Nama Fungsi, Jumlah Kegiatan, Total Dokumen Final, and Total Nominal Realisasi;
- search and the same four sort options;
- Kegiatan table with Jumlah Dokumen, Total Nominal Realisasi, Status Ringkas, Terakhir Diperbarui, and Aksi;
- chevron-style action to open the selected Kegiatan document list.

## Daftar Dokumen Behavior

Selecting a Kegiatan opens the document list inside the same route. The document list reuses the approved Laporan Kegiatan detail direction:

- summary cards;
- search;
- `Filter Lanjutan`;
- sort;
- rounded desktop table;
- mobile cards;
- soft row treatment and warm off-white surfaces.

The action opens a metadata popup/modal instead of navigating to a document route.

The document-list advanced filter uses Status, Jenis, Mulai Dari Tanggal, and Sampai Tanggal. It does not render a Tahun filter.

## Metadata Modal Behavior

The metadata modal follows the Kasubag `Daftar Dokumen` modal visual structure but intentionally includes metadata fields only:

- Judul Dokumen;
- Fungsi;
- Kegiatan;
- Jenis;
- Status;
- Tanggal Dokumen;
- Tahun;
- Pengaju / Pembuat;
- Terakhir Diperbarui;
- Nominal Realisasi.

It does not render attachment sections or file-access actions.

## Laporan Kegiatan Column Label Cleanup

In `src/routes/pegawai/laporan/kegiatan.tsx`, the Kegiatan list table header `Dokumen` was renamed to `Jumlah Dokumen`.

The calculation, route behavior, filtering, and document navigation behavior are unchanged.

The Laporan Kegiatan detail-page advanced filter was also narrowed after user review. Because the selected Kegiatan already implies its parent Fungsi and scoped Kegiatan, the detail filter no longer renders or applies Fungsi/Kegiatan filtering. The detail filter still keeps Pembuat Dokumen, Jenis Permintaan, Kategori Permintaan, Detail Permintaan, Mulai Dari Tanggal, and Sampai Tanggal.

## Metadata-Only Boundary

Laporan Kinerja remains metadata-only.

The route does not add:

- document detail route navigation;
- preview behavior;
- download behavior;
- attachment viewer behavior;
- lampiran display or lampiran actions;
- signed URL behavior;
- file-token behavior;
- workflow approval or revision actions;
- archive lifecycle actions.

Showing Laporan Kinerja attachments exactly like the Kasubag `Daftar Dokumen` modal is intentionally out of scope for this phase. That Kasubag modal includes file-aware attachment behavior and authorized preview/download paths. Adding the same behavior to Penanggung Jawab Kinerja would require a separate explicit policy/API decision and cannot be treated as metadata-only visual parity.

## Behavior Preserved

Preserved behavior:

- existing `/laporan/kinerja` API contract;
- existing server-side role/RBAC behavior;
- `dms_session` as the authorization boundary;
- `dms_active_role` as UX-only state;
- `ADMIN` as a dedicated role, not a Penanggung Jawab Kinerja substitute;
- final document metadata source and status semantics.

## API/Backend Changes

Expected none. No API, backend service, schema, migration, storage, auth, RBAC, routeTree, package, or environment files were changed.

## Validation Commands For User

Commands intentionally not run by Codex in this phase:

```bash
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/dokumen
pnpm test tests/unit/laporan/kinerja-visual-parity-source.test.ts
pnpm build
```

If `pnpm build` changes `src\routeTree.gen.ts`, restore it:

```bash
git restore src\routeTree.gen.ts
```

## Manual QA Checklist

1. Open `/penanggung-jawab-kinerja/laporan-kinerja`.
2. Confirm first page lists Fungsi and has no summary cards.
3. Confirm search works and sort options exist: `Terakhir diperbarui`, `Nominal terbesar`, `Dokumen terbanyak`, `Nama A-Z`.
4. Click Fungsi action and confirm Detail Fungsi lists Kegiatan.
5. Confirm action style is chevron / approved report table action style.
6. Click Kegiatan action and confirm daftar dokumen opens.
7. Confirm document list visually matches Laporan Kegiatan detail.
8. Confirm document action opens metadata modal, not `/pegawai/dokumen/$id`.
9. Confirm modal has metadata only.
10. Confirm no preview/download/lampiran/file actions appear.
11. Confirm `/pegawai/laporan/kegiatan` column label is `Jumlah Dokumen`.
12. Confirm `/pegawai/laporan/kegiatan?kegiatanId=...` detail filter no longer shows Fungsi/Kegiatan filters, but still shows Pembuat Dokumen, Jenis, Kategori, Detail, and date range filters.
13. Confirm `/penanggung-jawab-kinerja/laporan-kinerja?fungsiId=...&kegiatanId=...` detail filter has date range filters and no Tahun filter.
14. Confirm 390px mobile remains usable.

## Protected Files Confirmation

Protected files expected unchanged:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

## Future Reuse Opportunities For Phase 15N

The report toolbar, summary cards, chevron action button, metadata modal field layout, and grouped report table/card patterns can be extracted later into shared report primitives after more report pages converge on the same contract.
