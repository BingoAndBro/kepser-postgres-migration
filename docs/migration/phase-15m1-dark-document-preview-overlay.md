# Phase 15M.1 - Unified Dark Document Preview Overlay

## 1. Status

Completed as a focused visual/UI polish phase.

## 2. Scope

This phase updates document preview popup presentation for the shared document viewer and revision/editor preview flows. It is limited to frontend modal structure, sizing, colors, and toolbar affordance.

## 3. User Visual Request

- Larger preview modal.
- Dark/black full-screen overlay.
- Centered document preview canvas.
- Clean dark top toolbar.
- Filename visible in the toolbar.
- Download action visible.
- Close action visible.
- User focus should remain on reading the document.

## 4. Files Changed

- `src/components/dokumen/AttachmentViewer.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `tests/unit/components/attachment-viewer-source.test.ts`
- `docs/migration/phase-15m1-dark-document-preview-overlay.md`

## 5. Preview Overlay Changes

- Changed the preview backdrop to a stronger dark overlay with subtle backdrop blur.
- Rendered preview overlays through a body-level portal so the dark layer covers the full viewport, including layout footer areas.
- Increased modal sizing to use most of the safe viewport on desktop.
- Added responsive mobile sizing with viewport-safe height and width constraints.
- Switched the preview content area to a dark neutral reading surface.
- Centered the iframe preview inside the dark content area.
- Kept iframe-based preview rendering unchanged.

## 6. Toolbar/Header Changes

- Added a dark header bar.
- Kept the safe client-built preview filename visible and truncated.
- Added visible download and close icon actions on the right.
- Kept `cursor-pointer` for enabled actions.
- Added disabled cursor treatment for toolbar download when no active preview target exists.
- Did not invent or display file size metadata.

## 7. Behavior Preserved

- Existing preview API path selection is unchanged.
- Existing download API path selection is unchanged.
- Existing signed URL fetching is unchanged.
- Existing blob preview behavior is unchanged.
- Existing download handlers remain the authority for download behavior.
- Existing ESC close and backdrop close behavior remain available.
- Existing destroyed-file safe error message flow remains preserved.
- `AttachmentEditor` upload, replace, reset, remove, submit, and cancel behavior are unchanged.

## 8. API/Backend Changes

Expected none. No API routes, backend handlers, schema, migrations, auth, RBAC, storage helpers, token generation, or package files were modified.

## 9. Validation Performed

- `git status --short --branch`
- `git branch --show-current`
- Read target source files and requested phase reference docs.
- `git grep -n "preview\|download\|iframe\|object\|embed\|AttachmentViewer\|signedUrl\|modal\|dialog\|Close\|X\|Download" -- src/components src/routes tests`
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check for env, package, routeTree, db, drizzle, and supabase paths.

## 10. Manual QA Checklist

1. Open a document detail page with attachment.
2. Click preview.
3. Confirm overlay is dark and focus-oriented.
4. Confirm modal is larger and easier to read.
5. Confirm filename is visible.
6. Confirm download button still works.
7. Confirm close button works.
8. Confirm no raw paths/tokens are shown.
9. Confirm preview still works for Pegawai detail.
10. Confirm preview still works for Revisi attachment preview.
11. Confirm preview still works for Ajukan pending/preview if that flow uses the touched preview components.
12. Confirm preview still works for PPK/PPSPM detail if the shared viewer is used.
13. Check 390px mobile for usable overlay, reachable close/download, and no horizontal overflow.

## 11. Deferred Items

- `FileUploadButton` has its own local preview modal, but it was outside the allowed file list for Phase 15M.1 and was not changed.
- Full browser QA and full `pnpm test`/`pnpm build` are deferred to the user per phase instruction.

## 12. Protected Files Confirmation

No changes were made to:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`
- schema files
- migration files
- API route files
