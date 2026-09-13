# Phase 15L.3B.1 - Apply Approved Pegawai Detail Baseline to PPK/PPSPM Detail

## 1. Status

- Implemented.
- Focused source validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Visual/presentation alignment for PPK and PPSPM workflow document detail pages.
- Detail header, compact tabbed shell, single metadata card, lampiran tab, riwayat tab, compact right status rail, revision note placement, action button density, and mobile stacking.

Excluded:

- Pegawai detail source changes.
- API/backend changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Preview/download route changes.
- Workflow/status/action semantics changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. User Approval Of Pegawai Detail Baseline

The current `src/routes/pegawai/dokumen/$id/index.tsx` page is treated as the approved real-app document detail baseline for this phase.

The Pegawai detail source was inspected and intentionally left unchanged.

## 4. Approved Pegawai Detail Baseline Reused

The PPK and PPSPM detail pages now reuse the approved composition direction:

- warm off-white page canvas;
- compact detail header and breadcrumb;
- metadata/lampiran/riwayat tabs;
- orange section header with off-white content shell;
- single bordered metadata grid;
- attachment tab delegated to the existing `AttachmentViewer`;
- riwayat tab delegated to the existing `ActivityLog`;
- compact right-side status rail with workflow markers;
- full-width stacked action buttons on smaller screens.

## 5. Files Changed

- `src/routes/ppk/dokumen/$id/index.tsx`
- `src/routes/ppspm/dokumen/$id.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `src/components/dokumen/AttachmentViewer.tsx`
- `tests/unit/dokumen/cross-role-detail-parity-source.test.ts`
- `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `tests/unit/dokumen/ppk-resubmit-parity-source.test.ts`
- `tests/unit/components/attachment-viewer-source.test.ts`
- `docs/migration/phase-15l3b1-apply-approved-pegawai-detail-baseline.md`

## 6. PPK Detail Alignment

- Replaced the older inline workflow timeline and separate field cards with a Pegawai-style `MetadataDetailCard`.
- Moved status/progress presentation into a compact right-side status rail.
- Kept PPK-only approve/reject controls and visibility gate at `IN_PPK_VALIDATION`.
- Follow-up UI polish removes secondary `Tervalidasi` / `Daftar Revisi` actions from the detail rail.
- For active PPK validation, action order is `Validasi ke PPSPM`, `Tolak`, then `Kembali`.
- `Kembali` uses browser history with an inbox fallback, so it returns to the page that opened the detail when available.

## 7. PPSPM Detail Alignment

- Replaced the older inline workflow timeline and separate field cards with a Pegawai-style `MetadataDetailCard`.
- Moved status/progress presentation into a compact right-side status rail.
- Visible page copy remains PPSPM where relevant.
- Internal `/ppspm` route names, endpoint names, and navigation targets remain unchanged.
- Kept PPSPM-only approve/reject controls and visibility gate at `IN_PPSPM_APPROVAL`.
- Follow-up UI polish removes secondary status-list actions from the detail rail, including `Daftar Selesai` and `Daftar Ditolak`.
- For active PPSPM approval, action order is `Setujui Dokumen`, `Tolak`, then `Kembali`.
- For view-only PPSPM detail states, the only right-rail action is `Kembali`.
- `Kembali` uses browser history with an inbox fallback, so it returns to the page that opened the detail when available.

## 7.1 Revisi Button Polish

- Pegawai Revisi and PPK Resubmit right-rail cancel actions now use the visible label `Kembali`.
- The button tone now matches the neutral off-white outline return treatment used by the detail pages.
- The existing cancel/dirty-leave signal behavior remains unchanged.

## 8. Behavior Preserved

- PPK fetch remains `/ppk/dokumen/:id`.
- PPK approve remains `POST /api/ppk/dokumen/:id/approve`.
- PPK reject remains `POST /api/ppk/dokumen/:id/reject` with `{ catatan }`.
- PPK redirect behavior remains `/ppk/inbox`.
- PPK detail `Kembali` uses browser history and falls back to `/ppk/inbox`.
- PPSPM fetch remains `/ppspm/dokumen/:id`.
- PPSPM approve remains `POST /api/ppspm/dokumen/:id/approve`.
- PPSPM reject remains `POST /api/ppspm/dokumen/:id/reject` with `{ catatan }`.
- PPSPM navigation remains `/ppspm/selesai` and `/ppspm/ditolak`.
- PPSPM detail `Kembali` uses browser history and falls back to `/ppspm/inbox`.
- Existing confirmation flows, modal state, validation minimums, and action loading state remain route-local and unchanged in behavior.

## 9. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helper files were modified.
- No request/response contracts were changed.
- No workflow/status semantics were changed.

## 10. Preview/Download Behavior Preserved

- PPK detail still passes `apiType="ppk"` to `AttachmentViewer`.
- PPSPM detail still passes `apiType="ppspm"` to `AttachmentViewer`.
- `AttachmentViewer` route selection, signed URL handling, blob preview, download behavior, and safe filename construction were not changed in this phase.
- Follow-up UI polish gives detail-page `Preview` and `Unduh` buttons a bordered neutral default treatment with premium orange hover, matching the approved Ajukan-style affordance while keeping routes and handlers unchanged.

## 11. Mobile Behavior

- The existing `xl` two-column layout still collapses to a single column.
- Tabs remain wrapped and reachable on narrow screens.
- Action rail buttons use full-width stacked buttons.
- Metadata uses a responsive two-column grid that collapses cleanly.
- Attachment actions remain delegated to the existing responsive viewer.

## 12. Reuse Opportunities Deferred To Phase 15N

- PPK and PPSPM now repeat Pegawai-like local detail helpers.
- A future Phase 15N can extract a shared document detail shell, tab strip, metadata card, role status rail, and revision note card.
- This phase intentionally avoided broad shared refactoring to reduce behavior risk around approve/reject workflows.

## 13. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/cross-role-detail-parity-source.test.ts`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check.

Not run:

- full `pnpm test`
- `pnpm build`
- browser/manual QA

## 14. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Open the approved Pegawai detail page and confirm it remains unchanged.
2. Open `/ppk/dokumen/$id`.
3. Confirm PPK detail visually matches the approved Pegawai detail composition.
4. Confirm PPK approve/reject behavior still works.
5. Confirm PPK preview/download still works.
6. Open `/ppspm/dokumen/$id`.
7. Confirm visible labels use PPSPM where relevant.
8. Confirm PPSPM detail visually matches the approved Pegawai detail composition.
9. Confirm PPSPM approve/reject behavior still works.
10. Confirm PPSPM preview/download still works.
11. Check 390px mobile:
    - no horizontal overflow;
    - tabs usable;
    - action rail buttons reachable;
    - attachment section readable.
12. Confirm no workflow/status/API behavior changed.

## 15. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
