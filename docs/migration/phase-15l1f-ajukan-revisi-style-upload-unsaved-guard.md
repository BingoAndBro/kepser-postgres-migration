# Phase 15L.1F - Ajukan Revisi-Style Upload UX and Unsaved Changes Guard

## 1. Status

- Implemented.
- Focused automated validation passed.
- Manual browser retest remains pending.
- Scope is Ajukan Dokumen frontend interaction only.
- No commit or push was performed.

## 2. Scope

Included:

- mirror the approved Revisi Dokumen upload row concept in Ajukan's pending-upload context;
- preserve Ajukan's existing pending upload endpoint and submit payload;
- retain uploaded file state when moving between Ajukan stages;
- simplify Step 3 by removing the extra ready-state card before the review summary;
- simplify the post-submit success screen into a centered outcome view with only essential status information and the existing three actions;
- add route-local dirty tracking and unsaved-leave confirmation;
- add browser `beforeunload` protection while Ajukan has unsaved changes;
- update focused source guards and phase documentation.

Excluded:

- backend/API/storage/file-access changes;
- submit endpoint, submit payload, validation, workflow, status, Material/Non-Material, auth/session/RBAC, schema, migration, package, routeTree, or environment changes;
- Revisi Dokumen visual confirmation polish.

## 3. User Clarification

The user clarified that Revisi Dokumen upload, preview, and edit behavior is already correct and should be treated as the source of truth. This phase must not treat the request as a backend problem and must not implement Revisi confirmation visual polish.

## 4. Revisi Implementation Analysis

Revisi route:

- `src/routes/pegawai/dokumen/$id/revisi.tsx` uses `AttachmentEditor`.
- `AttachmentEditor` owns editable attachment state, pending-file tracking, preview modal state, reset/replace/remove handlers, dirty reporting, and submit handoff.
- Revisi preview uses signed direct file access from existing frontend storage helpers.
- Revisi replace uploads through existing `/api/upload`, updates `lampiranUrls` by `kelengkapan_id`, tracks pending uploads, and preserves validation through current attachment state.
- Revisi remove/reset updates local attachment state and lets required-missing validation recalculate from current `lampiranUrls`.

Direct component reuse was not safe because `AttachmentEditor` depends on an existing persisted `dokumen` row, Revisi nominal semantics, formal filename metadata, and Revisi submit/cancel lifecycle. Ajukan is a new pending document flow and must keep its own submit payload and staged form state.

## 5. Revisi Behavior Reused/Mirrored

Mirrored in Ajukan:

- green uploaded state;
- visible filename;
- compact preview action;
- compact replace action;
- compact remove action;
- file state update by `kelengkapan_id`;
- required validation recalculation after remove/replace;
- route-level dirty reporting.

## 6. Files Changed

- `src/routes/pegawai/dokumen/aju.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/dokumen/form/StepUploadLampiran.tsx`
- `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
- `docs/migration/phase-15l1f-ajukan-revisi-style-upload-unsaved-guard.md`

## 7. Upload Row Behavior

- Uploaded Ajukan rows now show a green success treatment, the safe extracted filename, preview, replace, and remove controls.
- After the final visual refinement, the safe extracted filename is displayed below the attachment title in the left metadata column, matching the prototype direction.
- The right side contains only compact preview, replace, and remove actions for uploaded rows.
- The unuploaded `Unggah` action is a softer rounded pill rather than a square block.
- Preview uses the existing signed direct file access helper for the pending logical path.
- Replace reuses the existing `FileUploadButton` upload path and parent `handleUploaded` state update.
- Remove reuses existing `onRemoved` state update, so required-missing validation still blocks submit when a required file is missing.
- Optional/supporting documents keep the existing add/remove behavior and show the same compact uploaded row treatment.

## 8. Form State Retention Behavior

- Ajukan now passes parent `lampiranUrls` into Step 2.
- `KelengkapanChecklist` initializes from those pending attachments when Step 2 remounts.
- Step 1 field state, Material/Non-Material selection, nominal/detail state, and uploaded file state remain local React state and are not persisted to the backend during stage movement.

## 8A. Step 3 Cleanup

- Removed the top `Siap diajukan` ready-state card from Step 3.
- Step 3 now starts directly with the review summary and keeps the confirmation action area below it.
- Submit confirmation semantics remain unchanged.

## 8B. Success Screen Simplification

- Replaced the old success header, detail card grid, and completed-step sidebar with a centered outcome view.
- The success view now prioritizes the result, submitted document title, document type, status, attachment count, and next-step guidance.
- The approved three actions remain available:
  - `Lihat Daftar Dokumen`
  - `Lihat Detail Dokumen`
  - `Ajukan Dokumen Lain`

## 9. Unsaved Changes Behavior

- Ajukan tracks dirty state from form fields and file changes.
- Internal step movement is not blocked.
- Router navigation away from `/pegawai/dokumen/aju` is blocked with the requested modal:
  - `Keluar tanpa menyimpan?`
  - `Perubahan yang belum disimpan akan hilang.`
  - `Tetap di halaman`
  - `Keluar tanpa menyimpan`
- Browser `beforeunload` warning is enabled while dirty.
- Dirty guard is cleared after successful submit and after `Ajukan Dokumen Lain` reset.

## 10. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Submit payload identifiers and conditional payload shape remain unchanged.
- Existing submit handler semantics remain unchanged.
- Existing validation remains unchanged.
- Material and Non-Material behavior remains unchanged.
- Workflow/status semantics remain unchanged.
- File authorization and storage access boundaries remain unchanged.

## 11. API/Backend Changes

- None expected.
- No API route, storage helper, schema, migration, auth/session/RBAC, package, lockfile, environment, or routeTree file was changed.

## 12. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 7 tests.
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
  - 1 file, 2 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 115 tests.

Not run:

- full `pnpm test`;
- `pnpm build`.

## 13. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Open `/pegawai/dokumen/aju`.
- Fill Step 1 fields.
- Move between Step 1, Step 2, and Step 3; values remain.
- Upload a required file.
- Confirm the uploaded file row is compact, green, and shows the filename.
- Preview the uploaded pending file.
- Replace the uploaded file.
- Remove the required file and confirm submit/advance validation blocks while it is missing.
- Add and upload an optional/supporting file.
- Move between stages and confirm uploaded state remains.
- Try leaving with unsaved changes and confirm the modal appears.
- Click `Tetap di halaman` and confirm the page stays.
- Click `Keluar tanpa menyimpan` and confirm navigation proceeds.
- Submit Material successfully and confirm dirty guard clears.
- Submit Non-Material successfully and confirm no nominal and no PPK/PPSPM wording.
- Confirm success state appears.
- Click `Ajukan Dokumen Lain` and confirm state resets without an unsaved prompt.
- Confirm 390px mobile remains usable.

## 14. Deferred Items

- Revisi confirmation visual polish remains deferred and was not implemented in this phase.
- Browser manual QA may identify final spacing or row-width adjustments.
- Empty optional-document slots without uploaded files are still local to the mounted Step 2 editor; uploaded optional files are retained through parent `lampiranUrls`.

## 15. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, lockfiles, `src/routeTree.gen.ts`, `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
