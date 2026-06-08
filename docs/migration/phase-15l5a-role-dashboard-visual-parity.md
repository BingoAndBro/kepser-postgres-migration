# Phase 15L.5A - Role Dashboard Visual Parity

## 1. Status

- Implemented pending human validation.
- Phase 15L.5A.1 applies a follow-up dashboard metric badge and summary semantics polish on top of this implementation.
- Codex did not run `pnpm test`, `pnpm build`, or `pnpm dev`.
- No commit or push was performed.

## 2. Scope

Included:

- Role dashboard visual parity for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, Penanggung Jawab Kinerja, and Admin Sistem.
- Four summary cards per role using existing data where available.
- Operational `Perlu Tindakan` sections for Pegawai, PPK, PPSPM, and Kepala Sub Bagian Umum.
- `Aksi Cepat` cards replacing the prototype-only `Rekan Aktif` concept.
- Penanggung Jawab Kinerja root dashboard at the existing route.
- Focused dashboard source guard.

Excluded:

- API/backend changes.
- Schema, migration, package, lockfile, env, DB, Drizzle, Supabase, routeTree, auth/session/RBAC, workflow/status, archive lifecycle, storage, preview/download/file-access changes.
- Activity Log backend implementation.
- New routes.

## 3. Prototype References Inspected

- Supplied screenshots for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, Penanggung Jawab Kinerja, and Admin Sistem dashboards.
- `D:\Temp\dms-ai-studio-final\src\components\Dashboard.tsx`
- Prototype role context files under `D:\Temp\dms-ai-studio-final\src\components\roles`

No prototype source was copied or imported.

## 4. Approved Baselines Inspected

- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l4a-pegawai-reports-visual-parity.md`
- `docs/migration/phase-15l4b-kinerja-report-visual-parity.md`
- `docs/migration/phase-15l3c1-approved-archive-entry-pattern-baseline.md`
- `docs/migration/phase-15l3d5-master-klasifikasi-regression-qa-status-badge-polish.md`
- Current role dashboard route files and workflow/admin/archive primitives.

## 5. Files Changed

- `src/components/dashboard/RoleDashboardPrimitives.tsx`
- `src/routes/pegawai.tsx`
- `src/routes/ppk/index.tsx`
- `src/routes/bendahara/index.tsx`
- `src/routes/arsiparis/index.tsx`
- `src/routes/penanggung-jawab-kinerja/index.tsx`
- `src/routes/admin.index.tsx`
- `src/config/navigation.ts`
- `src/lib/constants/routes.ts`
- `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts`
- `docs/migration/phase-15l5a-role-dashboard-visual-parity.md`

## 6. Role Dashboard Changes

Pegawai:

- Added four cards: Dokumen Diajukan, Perlu Revisi, Dokumen Selesai, Dokumen Tersimpan.
- Uses existing `/dokumen`.
- Shows up to three Pegawai-actionable revision documents.
- Replaces `Rekan Aktif` with `Aksi Cepat`.

PPK:

- Added four cards: Menunggu Validasi, Sudah Divalidasi, Dikembalikan untuk Revisi, Total Nominal Menunggu.
- Uses existing `/ppk/inbox`, `/ppk/tervalidasi`, `/ppk/ditolak`, and `/ppk/revisi`.
- Shows up to three validation/revision action rows.
- Nominal card is refined by Phase 15L.5A.1: it sums `nominal_realisasi` for documents waiting PPK validation by using existing workflow detail data, without adding API/backend fields.

PPSPM:

- Visible UI uses PPSPM wording while internal route/role remains Bendahara.
- Added four cards: Menunggu Persetujuan, Disetujui, Dikembalikan, Total Nominal Menunggu.
- Uses existing `/bendahara/inbox`, `/bendahara/selesai`, and `/bendahara/ditolak`.
- Shows up to three waiting approval rows.
- Nominal card is refined by Phase 15L.5A.1: it sums `nominal_realisasi` for documents waiting PPSPM approval by using existing workflow detail data, without adding API/backend fields.

Kepala Sub Bagian Umum:

- Phase 15L.5A.1 corrects the four main cards to lifecycle metrics: Berkas Terbuka, Arsip Aktif, Arsip Inaktif, Usul Musnah.
- Uses existing `/arsiparis/inbox` and folder-first `/arsiparis/berkas` queries.
- `Berkas Terbuka` uses `status_berkas=OPEN`.
- `Arsip Aktif` uses `status_berkas=CLOSED` and `status_arsip=AKTIF`.
- `Arsip Inaktif` uses `status_berkas=CLOSED` and `status_arsip=INAKTIF`.
- `Usul Musnah` uses `status_berkas=CLOSED` and `status_arsip=USUL_MUSNAH`.
- `Siap Diklasifikasikan` is kept in `Perlu Tindakan Kearsipan`, not as a main lifecycle summary card.
- `Daftar Dokumen Terbaru` uses the latest available classification-ready documents.

Penanggung Jawab Kinerja:

- Existing root route now renders a dashboard instead of redirecting.
- Added four cards: Total Dokumen Final, Total Nominal Realisasi, Dokumen Selesai, Dokumen Diarsipkan.
- Uses existing `/laporan/kinerja`.
- Main section lists latest final document metadata only.
- No preview/download/lampiran/file action is added.

Admin Sistem:

- Added four cards: Total User, User Aktif, Role Terpakai, Total Kegiatan.
- Uses existing `/users/`, `/master-fungsi`, `/master-kegiatan`, and `/master-kelengkapan`.
- Adds dashboard-local `Aktivitas Admin Terbaru` based on already-loaded configuration summary data.
- Adds `Aksi Cepat` for Master User, Departemen Fungsi, Master Kegiatan, and Kelengkapan Dokumen.

## 7. Perlu Tindakan Behavior

- Pegawai shows only `NEED_REVISION` documents where `revision_target='USER'`.
- PPK shows existing validation queue and PPK revision queue.
- PPSPM shows existing approval queue.
- Kepala Sub Bagian Umum shows existing classification queue and Usul Musnah count if available.
- Penanggung Jawab Kinerja and Admin Sistem intentionally have no `Perlu Tindakan` section.

## 8. Aksi Cepat Behavior

- `Rekan Aktif` is not used.
- `Aksi Cepat` is link-only navigation to existing pages.
- No new route is created.
- No workflow, archive lifecycle, or destructive action is performed from dashboard quick links.

## 9. Activity Log Deferred

Activity Log remains deferred.

- No Activity Log table, route, API, event writer, or global audit UI was added.
- Existing navigation entries with no `to` remain non-routing/soon style entries.
- Admin `Aktivitas Admin Terbaru` is dashboard-local presentation from existing configuration data only and does not claim realtime or complete audit coverage.

## 10. Behavior Preserved

- Existing role guards remain authoritative.
- `dms_session` remains the authorization boundary.
- `dms_active_role` remains UX-only.
- PPSPM keeps internal `BENDAHARA` route/role values.
- Folder-first archive authority remains `berkas_arsip` plus `berkas_arsip_item`.
- Penanggung Jawab Kinerja remains metadata-only.
- No preview/download/file-access behavior is added or changed.
- No archive lifecycle or physical deletion behavior is added or changed.

## 11. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend service/helper files were modified.
- No database/schema/migration file was modified.
- No package/env/storage file was modified.

## 12. Validation Commands For User

Codex intentionally did not run these commands in this phase:

```powershell
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/dokumen
pnpm test tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts
pnpm build
```

If `pnpm build` changes the generated route tree, restore it:

```powershell
git restore src\routeTree.gen.ts
```

## 13. Manual QA Checklist

1. Pegawai dashboard: confirm 4 summary cards, Perlu Tindakan revisions, and Aksi Cepat replacing Rekan Aktif.
2. PPK dashboard: confirm 4 summary cards, Perlu Tindakan for validation/revision, and Aksi Cepat.
3. PPSPM dashboard: confirm PPSPM wording, 4 summary cards, approval queue Perlu Tindakan, and Aksi Cepat.
4. Kepala Sub Bagian Umum dashboard: confirm 4 summary cards, Perlu Tindakan Kearsipan, Daftar Dokumen Terbaru top 3 if data exists, and Aksi Cepat.
5. Penanggung Jawab Kinerja dashboard: confirm 4 summary cards, no Perlu Tindakan, metadata-only wording, and Aksi Cepat to Laporan Kinerja.
6. Admin Sistem dashboard: confirm 4 summary cards, no Perlu Tindakan, Aktivitas Admin Terbaru, and Aksi Cepat.
7. Confirm Activity Log menu remains soon/disabled if not implemented.
8. Confirm no preview/download/file actions were added.
9. Check 390px mobile for all dashboards.

## 14. Protected Files Confirmation

Expected unchanged:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

Protected diff check should remain empty.

## 15. Future Phase

- Admin Pages Visual Parity.
- Profile/Notification/Global Feedback Polish.
- Responsive QA.
- Phase 15N reusable component/refactor.
- Activity Log remains deferred until after those phases.
