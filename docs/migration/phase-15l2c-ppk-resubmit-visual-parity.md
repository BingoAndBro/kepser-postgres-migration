# Phase 15L.2C - PPK Resubmit Visual Parity

## 1. Status

- Implemented.
- Focused automated validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- PPK resubmit/revisi page visual and interaction parity.
- Compact tabbed PPK resubmit presentation.
- Page-level submit confirmation, success state, toast feedback, and unsaved-change guard.
- Modal confirmation for the existing `Kembalikan ke Pegawai` action.

Excluded:

- backend/API route changes;
- upload, preview, download, replace, reset, remove, storage, or file-access logic changes;
- workflow/status/revision target changes;
- schema, migration, package, lockfile, env, generated route tree, database, Drizzle, or Supabase changes.

## 3. User Finding

- User found that PPK Revisi/Resubmit still used the older page design after Pegawai Revisi Dokumen was approved.
- This phase aligns the PPK page with the approved Pegawai Revisi/Ajukan visual language while preserving PPK-specific behavior.

## 4. Current PPK Behavior Preserved

- Page still loads PPK resubmit data from `/ppk/resubmit/:id`.
- Material kelengkapan still uses the current `master-kelengkapan` filtering helper.
- Non-Material still uses supporting-document-only editor behavior.
- `AttachmentEditor` still owns attachment state, preview, replace, reset/remove, pending-file cleanup, duplicate additional-document validation, nominal validation, and submit handoff.
- PPK resubmit still saves first, then resubmits:
  - `PATCH /api/ppk/resubmit/:id`
  - `POST /api/ppk/resubmit/:id`
- PATCH payload shape remains `{ lampiranUrls, nominalRealisasi }`.
- `Kembalikan ke Pegawai` still calls `POST /api/ppk/kembalikan/:id`.

## 5. Approved Pegawai Revisi/Ajukan Baseline Reused

Reused:

- light cream page canvas;
- compact warm-orange tab strip;
- orange gradient section header with white body panel;
- three tabs:
  - `Metadata & Ringkasan Revisi`;
  - `Metadata & Lampiran`;
  - `Riwayat`;
- right-side action/context panel;
- soft orange confirmation dialog style;
- success state;
- toast feedback;
- unsaved-change modal copy:
  - `Keluar tanpa menyimpan?`;
  - `Perubahan yang belum disimpan akan hilang.`;
  - `Tetap di halaman`;
  - `Keluar tanpa menyimpan`.

## 6. Files Changed

- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `tests/unit/dokumen/ppk-resubmit-parity-source.test.ts`
- `docs/migration/phase-15l2c-ppk-resubmit-visual-parity.md`

## 7. Layout/Visual Parity Changes

- Replaced the old narrow stack of cards with the approved compact revision shell.
- Added PPK-specific tabs for summary, editor, and history.
- Moved activity log into the `Riwayat` tab.
- Activity log is mounted lazily only when `Riwayat` is active, so page load does not eagerly request the log endpoint while the editor is mounting.
- Converted the workflow display into compact inline steps.
- Presented revision note, metadata, and required attachment progress with flatter warm-orange panels.
- Added right-side PPK action rail for `Ajukan Ulang`, `Kembalikan ke Pegawai`, and `Batal`.
- Kept attachment rows delegated to the already polished `AttachmentEditor`.

## 8. Confirmation/Success/Toast Changes

- `AttachmentEditor.confirmBeforeSubmit` is now used by PPK resubmit for a page-level submit confirmation.
- Confirmation distinguishes changed versus no-change submissions.
- Successful PPK resubmit shows an in-page success state with document type, attachment count, and next stage.
- Success toast uses a stable id per document.
- Error toast uses safe fallback copy.
- `Kembalikan ke Pegawai` uses an app dialog instead of a browser `confirm()`.

## 9. Business Behavior Preserved

- No PPK endpoint change.
- No request payload shape change.
- No update-before-resubmit order change.
- No workflow/status semantics change.
- No revision target semantics change.
- No Material/Non-Material rule change.
- No upload/storage/file-access behavior change.
- No auth/session/RBAC change.

## 10. API/Backend Changes

- None.
- No API route files were modified.

## 11. Reuse Opportunities Deferred To Phase 15N

- Pegawai Revisi and PPK Resubmit now intentionally share similar local page structure.
- Broader extraction of shared Revisi page shell, confirmation modal content, right action rail, or success state is deferred to Phase 15N reuse/consolidation audit.
- No broad shared component refactor was done in this phase.

## 12. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/ppk-resubmit-parity-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`

Not run:

- full `pnpm test`;
- `pnpm build`.

## 13. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Login as PPK.
- Open PPK resubmit/revisi page.
- Confirm visual aligns with approved Pegawai Revisi/Ajukan baseline.
- Confirm existing attachment preview/replace/remove still works.
- Modify fields if supported.
- Move between tabs; editor values remain.
- Resubmit with confirmation.
- Confirm success state and success toast appear.
- Confirm PPK detail/list actions work.
- Confirm `Kembalikan ke Pegawai` still calls the existing PPK return flow.
- Confirm no workflow/status/API behavior changes.
- Check 390px mobile usability and absence of horizontal overflow.

## 14. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
