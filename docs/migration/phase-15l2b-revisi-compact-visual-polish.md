# Phase 15L.2B - Revisi Dokumen Compact Visual Polish

## 1. Status

- Implemented.
- Focused validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Compact visual polish for Pegawai Revisi `Metadata & Lampiran`.
- Ajukan `Dokumen Pendukung` alignment with the Revisi supporting-document pattern.
- Visual-only polish in `AttachmentEditor` for Revisi-compatible attachment rows.
- Consistent reset action presentation.
- Orange outline `Ganti` / upload action presentation.
- Orange `Dokumen Pendukung` section and add button.
- Compact global sidebar sizing to match the latest user screenshot preference.

Excluded:

- backend/API route changes;
- upload, preview, download, replace, reset, remove, or storage logic changes;
- Revisi workflow/status/revision target changes;
- schema, migration, package, lockfile, env, generated route tree, database, Drizzle, or Supabase changes.

## 3. User Visual Feedback Addressed

- Tab 2 should feel more compact and clean.
- Reset icons/actions should be consistent.
- Reset actions should reuse the preferred orange reset treatment.
- `Ganti` should look like a compact orange outline pill with an upload/replace icon and label.
- `Dokumen Pendukung` and `Tambah Dokumen Pendukung` should use orange styling instead of blue.
- Summary page composition should follow the latest screenshot more closely with a compact header, tighter tabs, and red revision progress marker.
- Latest screenshot follow-up: Revisi content should not start flush against the sidebar; the right action panel should stay narrow with visible page gutter; the sidebar should be more compact and minimal.
- Latest direction: use the approved `Ajukan Dokumen` page as the primary UI/UX baseline for Revisi page header, spacing, card sizing, typography, back button, and right-column rhythm so moving between pages feels smooth and consistent.
- Ajukan supporting documents should use the same `Dokumen Pendukung` terminology and orange add-area treatment as Revisi, not separate `Dokumen Opsional` / `Dokumen Tambahan` wording.
- Duplicate delete actions should be avoided: if a row already has a file-level remove action, do not also show a second document-level delete action in the same row.
- Delete icons should read as destructive before hover, not only after hover.

## 4. Files Changed

- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
- `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `docs/migration/phase-15l2b-revisi-compact-visual-polish.md`

## 5. Compact Layout Changes

- Reduced editor vertical spacing from the previous heavier stack.
- Reduced card/panel padding in the attachment editor.
- Attachment rows now use compact rounded rows with restrained borders and no heavy shadows.
- File action groups wrap on small screens to avoid horizontal overflow.
- Preview/download actions use compact icon buttons.
- Revisi header was simplified to the screenshot composition: back button, `Revisi Dokumen` title, document title subtitle, and compact status pill.
- Revisi tabs now use a width-fit compact strip instead of stretching across the main column.
- In `NEED_REVISION`, the progress marker highlights `PPK` in red while keeping `Draft` orange as the completed prior step.
- Follow-up polish further reduced icon sizes, tab height, metadata row padding, right-panel width, and attachment action sizes for a more proportional compact layout.
- Right Revisi panel now has internal horizontal gutter so cards do not touch the divider or page edge.
- Revisi page status pill is rendered locally in red for `Perlu Revisi` to match the latest user screenshot feedback.
- Global app sidebar width, logo, menu item height, icons, typography, spacing, and footer actions were compacted without changing navigation targets or role visibility logic.
- Revisi page wrapper now uses explicit responsive horizontal padding and a controlled max width so the content column starts with prototype-like breathing room instead of sitting directly on the sidebar boundary.
- Right Revisi column was reduced to a narrower `20rem` panel and main-column divider spacing was adjusted to better match the latest prototype composition.
- Sidebar desktop width was reduced again for regular pages while retaining the already compact Ajukan route behavior.
- Revisi page now reuses the Ajukan layout rhythm directly:
  - `PageLayout` spacing matches Ajukan (`px-4 py-4 sm:px-6 lg:px-7 lg:py-5`);
  - page max width matches Ajukan (`max-w-[92rem]`);
  - back button matches Ajukan (`size-10`, zinc circular button, `ChevronLeft`);
  - right column matches Ajukan (`18rem`);
  - main content uses the Ajukan-style orange gradient header plus white rounded body panel;
  - sidebar/right cards use `PegawaiPanel` sizing and padding for consistent card density.
- Ajukan `KelengkapanChecklist` now uses the Revisi-style `Dokumen Pendukung` card:
  - orange header and subtitle;
  - empty-state copy;
  - dashed orange `Tambah Dokumen Pendukung` add button;
  - no `Dokumen Opsional` / `Dokumen Tambahan` duplication.
- Ajukan supporting-document rows no longer show a second document delete action after a file is uploaded; the file-level remove action remains the removal control.

## 5A. Frontend Consistency Notes

- Reusable-first rule: when two pages expose the same user action or object type, the visible treatment should be the same or intentionally near-identical. This applies to cards, upload rows, reset controls, replace/upload buttons, delete icons, confirmation dialogs, status pills, and empty states.
- Prefer shared helpers/components for repeated controls instead of recreating similar buttons with different icon size, padding, color, or hover behavior.
- Clickable controls must communicate interactivity with pointer cursor on hover. Custom `button`/clickable wrappers should include `cursor-pointer`; shared button components should preserve pointer behavior for enabled states.
- Destructive icon actions should be visibly destructive at rest when the action is destructive, then become more explicit on hover.

## 6. Reset Icon Consistency

- Added one local `ResetActionButton` helper in `AttachmentEditor`.
- Nominal reset and pending-file reset actions now use the same helper.
- Reset behavior is unchanged; only presentation and reuse changed.

## 7. Ganti Button Visual Change

- Added one local `UploadReplaceButton` helper in `AttachmentEditor`.
- Replace/upload actions now use a compact white/orange outline pill:
  - orange border;
  - orange text;
  - upload icon;
  - `Ganti` when replacing an existing file;
  - `Unggah` when uploading a missing file.
- Click handlers and file input wiring are unchanged.
- `FileUploadButton` delete action now uses destructive red at rest while keeping the existing remove behavior.

## 8. Business Behavior Preserved

- No Revisi endpoint change.
- No update endpoint change.
- No resubmit endpoint change.
- No request payload shape change.
- No PATCH-before-POST behavior change.
- No AttachmentEditor upload, preview, download, replace, reset, remove, validation, pending cleanup, or submit handoff logic change.
- No workflow/status semantics change.
- No revision target semantics change.
- No Material/Non-Material behavior change.
- No auth/session/RBAC change.
- No storage/file-access change.

## 9. API/Backend Changes

- None.
- No API route files were modified.

## 10. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`

Not run:

- full `pnpm test`;
- `pnpm build`.

## 11. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Open Pegawai Revisi page.
- Open `Metadata & Lampiran`.
- Confirm page feels more compact and clean.
- Confirm reset icons/actions are visually consistent.
- Confirm reset action behavior still works.
- Confirm `Ganti` button is a compact orange outline pill with icon and label.
- Confirm `Tambah Dokumen Pendukung` is orange and matches the requested screenshot direction.
- Confirm preview, download, replace, remove, and upload still work.
- Confirm resubmit flow still works.
- Confirm unsaved guard still works.
- Confirm 390px mobile has no horizontal overflow.

## 12. Deferred Items

- Browser manual QA remains pending.
- Broader shared `AttachmentEditor` redesign remains outside this focused polish phase.
- Full build/full test remains for the user to run manually.

## 13. Protected Files Confirmation

- `.env` and `.env.migration` were not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` were not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files were not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
