# Phase 15M.0 - Global Actionable Cursor Affordance

## 1. Status

Completed as a UI/accessibility polish pass.

## 2. Scope

This phase audits and updates cursor affordance for clickable/actionable UI controls only. It does not change runtime behavior, API/backend logic, authorization, storage, workflow semantics, schema, migrations, packages, or generated route registration.

## 3. Cursor Affordance Rule

- Enabled actionable controls should show `cursor-pointer`.
- Disabled controls should show `cursor-not-allowed` or an equivalent disabled treatment.
- Decorative icons, readonly metadata, labels, badges, progress indicators, and passive overlay/backdrop surfaces should not be made to look like normal actions.
- Clickable rows/cards should show pointer only when the row/card itself is the actionable target.
- Child-only actions should keep pointer treatment on the child action.

## 4. Files Changed

- `src/styles.css`
- `src/components/ui/button.tsx`
- `src/components/ui/select.tsx`
- `src/components/archive/ArchivePagePrimitives.tsx`
- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/AttachmentViewer.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
- `docs/migration/phase-15m0-actionable-cursor-affordance.md`

## 5. Shared Components Updated

- Added base cursor rules for semantic actionable elements in `src/styles.css`: anchors with `href`, enabled buttons, role buttons, enabled selects, and summaries.
- Added disabled cursor treatment for native disabled buttons and selects.
- Updated shared `Button` to include `cursor-pointer` and `disabled:cursor-not-allowed`.
- Removed the shared `Button` disabled pointer-events suppression so disabled cursor affordance can be visible while native disabled behavior remains authoritative.
- Updated shared select trigger, items, and scroll controls with explicit cursor affordance.
- Removed select item disabled pointer-events suppression so disabled item cursor treatment can be visible while disabled state remains represented by Base UI data attributes.

## 6. Page-Local Surfaces Updated

- Archive tabs now explicitly show pointer cursor.
- Workflow dashboard cards now explicitly show pointer cursor.
- Attachment editor preview, download, reset, upload/ganti, remove, close, and add-supporting-document raw buttons now explicitly show pointer cursor.
- Attachment viewer preview-modal close button now explicitly shows pointer cursor.
- File upload preview-modal close button now explicitly shows pointer cursor.

## 7. Disabled/Non-Actionable Treatment

- Disabled shared buttons and native disabled buttons/selects use `cursor-not-allowed`.
- Existing explicit `cursor-default` backdrop buttons remain unchanged for modal/dropdown outside-click surfaces.
- Status badges, labels, readonly metadata, progress indicators, and decorative icons were not given pointer affordance.

## 8. Behavior Preserved

All changes are class/style-only cursor affordance updates. No event handlers, data flow, route behavior, API calls, permissions, storage access, workflow transitions, or schema behavior were changed.

## 9. Validation Performed

- `git status --short --branch`
- `git branch --show-current`
- Source audit with `rg` for click handlers, buttons, links, role buttons, and cursor classes.
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check for env, package, routeTree, db, drizzle, and supabase paths.

## 10. Manual QA Checklist

- Hover sidebar menu items.
- Hover topbar role/profile/notification controls.
- Hover tabs.
- Hover preview/download/edit/delete/replace controls.
- Hover upload/ganti buttons.
- Hover card/list rows that open detail.
- Hover disabled controls and confirm they do not look normally clickable.
- Confirm no non-actionable badge/label looks clickable.
- Check desktop and 390px mobile where hover is not available but visual affordance remains clear.

## 11. Protected Files Confirmation

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
