# Phase 15L.3B - Cross-Role Document Detail Visual Parity

## 1. Status

- Implemented.
- Focused source validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Pegawai, PPK, and PPSPM workflow document detail page visual alignment.
- Detail header/back affordance, tabbed metadata/lampiran/riwayat shell, status placement, side action rail, Pegawai single-card metadata layout, attachment section tone, and local reject modal surface tone.
- Tiny visual-only `AttachmentViewer` surface tone refinement.
- Focused source guard for cross-role detail parity.

Excluded:

- API/backend changes.
- Auth/session/RBAC changes.
- Storage/file-access changes.
- Preview/download route changes.
- Workflow/status/action semantics changes.
- Schema, migration, package, lockfile, env, generated route tree, database, Drizzle, and Supabase changes.

## 3. Prototype References Used

Inspected:

- `D:\Temp\dms-ai-studio-final\src\components\workflow\DocumentDetailView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\layout\DetailPane.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\PPKView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\roles\TreasurerView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\workflow\ActivityLogView.tsx`

No prototype source was copied or imported.

## 4. Approved Baseline Pages Used

- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `src/routes/pegawai/dokumen/index.tsx`
- `docs/migration/phase-15l1g-approved-ajukan-pattern-baseline.md`
- `docs/migration/phase-15l2-revisi-dokumen-flow-parity.md`
- `docs/migration/phase-15l2c-ppk-resubmit-visual-parity.md`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l3a2-apply-approved-table-list-baseline.md`
- `docs/migration/phase-15l3a3-workflow-list-header-search-filter-consistency.md`
- `docs/migration/phase-15m0-actionable-cursor-affordance.md`
- `docs/migration/phase-15m1-dark-document-preview-overlay.md`
- `docs/migration/phase-15m2-approved-table-row-surface-tone-rollout.md`

## 5. Files Changed

- `src/routes/pegawai/dokumen/$id/index.tsx`
- `src/routes/ppk/dokumen/$id/index.tsx`
- `src/routes/ppspm/dokumen/$id.tsx`
- `src/components/dokumen/AttachmentViewer.tsx`
- `tests/unit/dokumen/cross-role-detail-parity-source.test.ts`
- `docs/migration/phase-15l3b-cross-role-document-detail-visual-parity.md`

## 6. Cross-Role Detail Visual Changes

- All three detail pages now use a compact list-to-detail handoff with a circular back affordance, title, breadcrumb row, and desktop status badge.
- Each page uses matching `Metadata Dokumen`, `Lampiran`, and `Riwayat` tabs.
- PPK and PPSPM main content keep the approved warm orange section header and off-white content panel.
- Pegawai detail follows the latest prototype screenshot feedback: metadata is consolidated into one large card and the workflow/progress strip sits in the right status panel.
- Pegawai detail keeps the approved orange section header and uses the same page padding, spacing, and left/right panel proportion as the approved Revisi page so transitions feel seamless.
- Pegawai metadata uses a single bordered inner grid instead of separated metadata cards.
- Pegawai attachment rows use the prototype-style document icon, filename/meta row, and text actions for `Preview` and `Unduh`.
- Pegawai metadata removes the duplicate bold inner tab title because the orange section header already provides the tab title.
- Pegawai revision notes are presented in the right panel like the approved Revisi page.
- Pegawai revision workflow markers are source-aware: revision returned to Pegawai highlights the PPK step, while revision returned to PPK highlights the PPSPM step as the source of the return.
- Pegawai right status/action panel was compacted with smaller typography, shorter status copy, tighter card padding, smaller progress nodes, and shorter action buttons while keeping hierarchy readable.
- Attachment and activity sections stay in the same page shell so transitions between roles feel consistent.
- Role actions moved into a right-side rail on desktop and stack naturally below content on smaller screens.

## 7. Pegawai-Specific Notes

- Pegawai detail preserves `/dokumen/:id` fetch and preview/download behavior.
- Per latest screenshot feedback, the right panel shows `Edit Dokumen` plus `Kembali` for Non-Material documents and only `Kembali` for Material documents.
- Delete and revision actions are no longer surfaced from the Pegawai detail right panel.
- No PPK/PPSPM operational actions were added to Pegawai detail.
- Material and Non-Material explanatory copy remains role-appropriate.

## 8. PPK-Specific Notes

- PPK detail preserves approve/reject handlers and payloads:
  - `POST /api/ppk/dokumen/:id/approve`
  - `POST /api/ppk/dokumen/:id/reject` with `{ catatan }`
- PPK action visibility remains tied to `IN_PPK_VALIDATION`.
- Existing completion and PPK revision navigation remains intact.

## 9. PPSPM-Specific Notes

- PPSPM detail keeps the internal `/ppspm` route namespace.
- User-facing visible copy uses `PPSPM`.
- PPSPM approve/reject handlers and payloads remain:
  - `POST /api/ppspm/dokumen/:id/approve`
  - `POST /api/ppspm/dokumen/:id/reject` with `{ catatan }`
- Existing completed/rejected navigation remains intact.

## 10. Attachment/Preview/Download Behavior Preserved

- `AttachmentViewer` preview/download route selection is unchanged for default, PPK, and PPSPM modes.
- Signed URL fetching, blob preview, iframe preview, ESC close, backdrop close, download behavior, destroyed-file copy, and safe filename construction remain unchanged.
- Surface tone changed from stark white to approved off-white/warm rows only.
- Pegawai detail attachment presentation now matches the prototype-style `Lampiran & Kelengkapan Wajib` and `Dokumen Pendukung Tambahan` sections.
- No raw paths, storage roots, tokens, or signed-token internals are exposed.

## 11. Workflow/Action Behavior Preserved

- No workflow status values were added, removed, or renamed.
- No approve/reject conditions were broadened.
- Pegawai detail action surfacing was narrowed per latest screenshot feedback: Material shows only `Kembali`, Non-Material shows `Edit Dokumen` and `Kembali`.
- No request body shapes changed.
- No redirect or navigation target was intentionally changed.
- No authorization, session, RBAC, storage, or file-access helper was touched.

## 12. Mobile Behavior

- The `xl` two-column shell collapses to a single column.
- Tabs wrap and remain reachable on narrow screens.
- Action rail buttons become full-width stacked controls.
- Metadata cards use responsive grid stacking.
- Attachment actions remain delegated to the existing responsive viewer.

## 13. Reuse Opportunities Deferred To Phase 15N

- The three routes now share similar local tab/detail shell structure.
- A future Phase 15N pass can extract a shared document detail shell, detail tab strip, side action rail, and modal surface treatment.
- This phase intentionally avoided a broad shared refactor to keep behavior risk low.

## 14. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helpers were modified.
- No request/response contracts were changed.
- No schema or migration files were modified.

## 15. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/cross-role-detail-parity-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check.

Run but not passing:

- `pnpm exec tsc --noEmit --pretty false`
  - Fails on pre-existing/unrelated repository-wide TypeScript errors in untouched files such as `src/lib/guards.ts`, archive/manual-arsip helpers, route auth wrappers, retained `supabase/functions`, and tests.
  - No reported TypeScript error pointed to `src/routes/pegawai/dokumen/$id/index.tsx` or `src/components/dokumen/AttachmentViewer.tsx`.

Resolved validation blocker:

- `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts` now guards the restored `Catatan dari PPK` revision-note heading and the current approved Revisi shell classes.
- `tests/unit/dokumen/ppk-resubmit-parity-source.test.ts` now guards the restored `Catatan dari PPSPM` revision-note heading and the current approved PPK resubmit shell classes.

Not run:

- full `pnpm test`
- `pnpm build`

## 16. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Login as Pegawai.
2. Open `/pegawai/dokumen/$id`.
3. Confirm detail visual aligns with approved list/detail/form baseline.
4. Confirm preview/download still works.
5. Confirm Pegawai actions/navigations are unchanged.
6. Login/switch as PPK.
7. Open `/ppk/dokumen/$id`.
8. Confirm PPK detail visual aligns with baseline.
9. Confirm approve/reject behavior and confirmations are unchanged.
10. Confirm preview/download still works.
11. Login/switch as PPSPM.
12. Open `/ppspm/dokumen/$id`.
13. Confirm visible label is PPSPM where relevant.
14. Confirm approve/reject behavior and confirmations are unchanged.
15. Confirm preview/download still works.
16. Check metadata/status/notes/history readability.
17. Check 390px mobile:
    - no horizontal overflow;
    - action panel reachable;
    - attachment actions usable;
    - metadata readable.
18. Confirm no forbidden archive/search/report surfaces are restored.

## 17. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
