# Phase 15L.5A.1 - Dashboard Badge Summary Semantics Polish

## 1. Status

- Implemented pending human validation.
- Built on top of Phase 15L.5A dashboard visual parity.
- Codex did not run `pnpm test`, `pnpm build`, or `pnpm dev`.
- No commit or push was performed.

## 2. Scope

Included:

- Dashboard metric badge semantics polish for all role dashboards.
- Optional metric badges when a badge does not add clear context.
- Dashboard metric card hover interaction polish.
- Kepala Sub Bagian Umum summary card correction to lifecycle metrics.
- `Total Nominal Menunggu` client-side calculation using existing workflow detail APIs for `nominal_realisasi`.
- Dashboard nominal value typography aligned with the Pemberkasan nominal style.
- Focused dashboard source guard updates.

Excluded:

- API/backend changes.
- Schema, migration, package, lockfile, env, DB, Drizzle, Supabase, routeTree, auth/session/RBAC, workflow/status, archive lifecycle, storage, preview/download/file-access changes.
- Activity Log implementation.
- New routes.

## 3. Badge Semantic Decision

Badges now describe the metric context instead of acting as decoration.

- Removed confusing prototype-style labels such as `Segera`, `Bulan Ini`, `Draf/Berkas`, `Estimasi`, `Prioritas`, `Proses`, `Verified`, `Terhitung`, and `Belum Arsip` from the dashboard route sources.
- Kept short Indonesian context labels such as `Perlu Tindakan`, `Selesai`, `Tersimpan`, `Antrean`, `Revisi`, `Nominal`, `Terbuka`, `Aktif`, `Inaktif`, `Usul Musnah`, `Final`, `Realisasi`, `Diarsipkan`, `Terdaftar`, `Akses`, and `Konfigurasi`.
- `DashboardMetricCard` now accepts an optional `badge`; Pegawai `Dokumen Diajukan` keeps badge `Aktif` per follow-up user correction.

## 4. Kasubag Summary Card Correction

Kepala Sub Bagian Umum dashboard summary cards are now lifecycle-focused:

- `Berkas Terbuka`
- `Arsip Aktif`
- `Arsip Inaktif`
- `Usul Musnah`

`Siap Diklasifikasikan` is no longer a main summary card. It remains in `Perlu Tindakan Kearsipan` when the existing `/arsiparis/inbox` data contains classification-ready documents.

## 5. Total Nominal Menunggu Decision

PPK and PPSPM dashboards use existing APIs only.

- Waiting list APIs identify documents that have not been validated or approved.
- Existing detail APIs (`/ppk/dokumen/:id` and `/ppspm/dokumen/:id`) provide `nominal_realisasi`.
- The dashboard enriches waiting documents from those existing detail endpoints and sums `nominal_realisasi` client-side.
- If no nominal values are available, the card shows `Rp 0`.
- No API/backend field was added.

## 5A. Nominal Typography Decision

Dashboard nominal values use the same visual direction as Pemberkasan nominal displays:

- `font-mono`
- bold metric weight
- black nominal color
- formatted as `Rp 200.000`, with a space after `Rp`

Applied to:

- PPK `Total Nominal Menunggu`
- PPSPM `Total Nominal Menunggu`
- Penanggung Jawab Kinerja `Total Nominal Realisasi`

## 5B. Metric Card Hover Interaction

The four dashboard metric cards now use a richer but bounded hover response:

- stronger lift and subtle scale;
- tone-aware glow and border emphasis;
- soft top highlight;
- icon lift, small rotation, and scale;
- value lift/scale;
- active press-down state.

The interaction is visual-only and does not change layout, data, routing, or behavior.

## 6. Files Changed

- `src/components/dashboard/RoleDashboardPrimitives.tsx`
- `src/routes/pegawai.tsx`
- `src/routes/ppk/index.tsx`
- `src/routes/ppspm/index.tsx`
- `src/routes/arsiparis/index.tsx`
- `src/routes/penanggung-jawab-kinerja/index.tsx`
- `src/routes/admin.index.tsx`
- `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts`
- `docs/migration/phase-15l5a-role-dashboard-visual-parity.md`
- `docs/migration/phase-15l5a1-dashboard-badge-summary-semantics-polish.md`

## 7. Behavior Preserved

- Existing role guards and server-side RBAC remain authoritative.
- PPSPM remains internal `PPSPM` for route/role values.
- Folder-first archive authority remains `berkas_arsip` plus `berkas_arsip_item`.
- Penanggung Jawab Kinerja remains metadata-only.
- Dashboard quick actions remain link-only.
- No preview/download/file actions were added.
- Activity Log remains deferred.

## 8. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend service/helper files were modified.
- No database/schema/migration file was modified.
- No package/env/storage file was modified.

## 9. Validation Commands For User

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

## 10. Manual QA Checklist

1. Pegawai dashboard badges are not confusing.
2. Pegawai `Dokumen Diajukan` shows badge `Aktif`.
3. PPK `Total Nominal Menunggu` sums `nominal_realisasi` for documents waiting PPK validation.
4. PPSPM `Total Nominal Menunggu` sums `nominal_realisasi` for documents waiting PPSPM approval.
5. All dashboard nominal cards use the orange monospace `Rp 200.000` style.
6. Kasubag cards are `Berkas Terbuka`, `Arsip Aktif`, `Arsip Inaktif`, and `Usul Musnah`.
7. Kasubag `Siap Diklasifikasikan` appears under `Perlu Tindakan Kearsipan` if data exists.
8. Badges across roles feel semantic, not decorative.
9. No Activity Log feature is implemented.
10. No preview/download/file actions were added.
11. 390px mobile still stacks cleanly.

## 11. Protected Files Confirmation

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
