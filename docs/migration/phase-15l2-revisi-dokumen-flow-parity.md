# Phase 15L.2 - Revisi Dokumen Flow Parity

## 1. Status

- Implemented.
- Focused automated validation performed.
- Manual browser QA remains pending.
- Scope is Pegawai Revisi Dokumen frontend flow and presentation.
- No commit or push was performed.

## 2. Scope

Included:

- Pegawai Revisi page sectioning and tabbed presentation.
- Three-tab Revisi layout following latest user screenshot preference.
- Right-side revision context and action panel.
- Warm Ajukan-approved visual language for Revisi page chrome, cards, dialogs, and success state.
- Explicit confirmation before Revisi resubmit.
- In-page success state after successful resubmit.
- Toast feedback for success and safe fallback error cases.
- Route-level unsaved changes modal and browser `beforeunload` guard.
- A narrow optional `AttachmentEditor.confirmBeforeSubmit` hook so the page can show confirmation before the existing submit handoff.
- Focused source guard for Revisi parity boundaries.

Excluded:

- backend/API route changes;
- storage, upload, preview, download, or file-access changes;
- workflow/status/revision target changes;
- PPK resubmit route changes;
- schema, migration, package, lockfile, env, generated route tree, database, Drizzle, or Supabase changes.

## 3. Prototype References Used

- `D:\Temp\dms-ai-studio-final\src\components\roles\ReviseReportView.tsx`
- Related prototype modal, toast, success, tab, and action-panel patterns observed through `ReviseReportView`.
- `SubmitReportView.tsx` was used only as secondary context for shared submit/unsaved modal style.

No prototype source was copied or imported.

## 4. Approved Ajukan Baseline Reuse

Reused from the approved Ajukan baseline:

- compact warm orange visual language;
- light cream/off-white canvas;
- subtle neutral borders;
- direct field presentation;
- fewer heavy internal cards;
- modal copy and styling approach;
- success outcome presentation;
- `AppToastProvider` feedback pattern;
- unsaved-change modal wording:
  - `Keluar tanpa menyimpan?`
  - `Perubahan yang belum disimpan akan hilang.`
  - `Tetap di halaman`
  - `Keluar tanpa menyimpan`

## 5. Current Revisi Behavior Preserved

The existing Revisi behavior remains the behavior source of truth:

- Revisi page still loads `/dokumen/:id`.
- Page still rejects documents outside `NEED_REVISION` plus `revision_target='USER'`.
- Material kelengkapan still uses current `master-kelengkapan` filtering.
- Non-Material keeps supporting-document-only editor behavior.
- `AttachmentEditor` still owns attachment state, preview, replace, reset/remove, pending-file cleanup, duplicate additional-document validation, nominal validation, and submit handoff.
- Resubmit still saves the editor output first, then submits:
  - `PATCH /api/dokumen/:id`
  - `POST /api/dokumen/:id/submit`
- PATCH payload shape remains `{ lampiranUrls, nominalRealisasi }`.
- POST request shape remains unchanged.

## 6. Files Changed

- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `docs/migration/phase-15l2-revisi-dokumen-flow-parity.md`

## 7. Layout/Flow Parity Changes

- Revisi now uses three tabbed sections:
  - `Metadata & Ringkasan Revisi`
  - `Metadata & Lampiran`
  - `Riwayat`
- The editor section stays mounted while tabs change, so local attachment/editor state is preserved.
- Tabs are text-only and compact, matching the latest prototype screenshot preference.
- Revision notes, workflow context, metadata, completeness status, and action context are presented with a flatter, cleaner composition.
- Workflow progress is rendered as simple inline text/chevron elements rather than a standalone card.
- The right panel is constrained to a smaller width and carries `Catatan Revisi`, `Aksi Revisi`, required attachment progress, current dirty-state status, and the primary `Ajukan Ulang` / `Batal` actions.
- Activity log moved into the `Riwayat` tab without changing the activity source.

## 8. Confirmation, Success, And Toast Changes

- `AttachmentEditor` accepts an optional `confirmBeforeSubmit` callback.
- `AttachmentEditor` accepts optional external submit/cancel signals so right-panel buttons can reuse the editor's existing validation, submit, cancel, and pending-upload cleanup paths.
- Pegawai Revisi uses that callback to show a page-level `AppDialog` before the existing save/resubmit handoff.
- Confirmation distinguishes:
  - `Ajukan ulang dokumen?`
  - `Ajukan ulang tanpa perubahan?`
- The existing update-before-resubmit sequence is preserved after confirmation.
- Successful resubmit now shows an in-page success state with:
  - document title;
  - Material/Non-Material label;
  - attachment count;
  - next review target;
  - actions to Revisi list, detail page, and document list.
- Success toast uses a stable id so the success toast appears once per successful resubmit.
- Error toast uses safe fallback copy and does not expose backend internals.

## 9. Unsaved Guard Behavior

- Revisi now uses route-level `useBlocker` plus `beforeunload` while dirty.
- Navigation away from the route opens the approved unsaved-change modal.
- `AttachmentEditor` cancel uses the same modal through `confirmIfDirty`.
- Successful resubmit clears the dirty guard.
- Staying on the page keeps editor state intact.
- Leaving without saving allows the editor's existing pending-upload cleanup path to run.

## 10. Business Behavior Preserved

- No Revisi endpoint change.
- No update endpoint change.
- No resubmit endpoint change.
- No request payload shape change.
- No update-before-resubmit behavior change.
- No revision target semantics change.
- No workflow/status semantics change.
- No PPK/PPSPM approval flow change.
- No Material/Non-Material business rule change.
- No upload/storage/file-access behavior change.
- No auth/session/RBAC change.

## 11. API/Backend Changes

- None.
- No API route files were modified.
- No schema, migration, database, Drizzle, package, lockfile, environment, generated route tree, or Supabase files were modified.

## 12. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`

Additional check:

- `pnpm exec tsc --noEmit --pretty false` was run and did not identify the new Revisi route as an error source, but the repository-wide TypeScript baseline is not clean. Existing errors were reported in the pre-existing `AttachmentEditor` source area, archive/manual/storage/routes, historical Supabase functions, and existing test typing.

Not run:

- full `pnpm test`;
- `pnpm build`.

## 13. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Login as Pegawai.
- Open a Revisi Dokumen page.
- Confirm layout follows the prototype Revisi pattern while using the approved Ajukan visual baseline.
- Move between `Ringkasan Revisi`, `Metadata & Lampiran`, `Review & Ajukan`, and `Riwayat`; editor values remain.
- Confirm existing attachment preview, replace, reset/remove, and supporting document behavior still works.
- Modify revision fields or attachments.
- Try leaving with unsaved changes; modal appears.
- Click `Tetap di halaman`; stay.
- Click `Keluar tanpa menyimpan`; leave and let pending cleanup run.
- Resubmit with confirmation.
- Confirm success state appears and success toast appears once.
- Confirm Revisi list, detail, and document list actions work.
- Confirm no workflow/status/API behavior changes.
- Check 390px mobile usability and absence of horizontal overflow.

## 14. Deferred Items

- PPK resubmit route was inspected but not modified in this phase.
- Browser manual QA remains pending.
- Broader full-repo TypeScript cleanup remains outside this phase.
- Any shared redesign of `AttachmentEditor` rows beyond the narrow confirmation hook remains deferred.

## 15. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
