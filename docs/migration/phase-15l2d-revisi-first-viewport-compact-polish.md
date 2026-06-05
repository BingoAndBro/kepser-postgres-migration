# Phase 15L.2D - Revisi First Viewport Compact Polish

## 1. Status

- Implemented.
- Focused validation performed.
- Manual browser QA remains pending.
- No commit or push was performed.

## 2. Scope

Included:

- Pegawai Revisi Dokumen first-viewport compact polish.
- PPK Resubmit/Revisi first-viewport compact polish.
- Visual-only metadata emphasis for `Nominal Realisasi`.

Excluded:

- backend/API changes;
- workflow/status/revision target changes;
- upload/storage/file-access changes;
- schema, migration, package, lockfile, env, generated route tree, database, Drizzle, or Supabase changes.

## 3. User Feedback

- Revisi pages should be more compact.
- On first page entry, as many key elements as possible should already be visible, closer to the prototype screenshot.
- `Nominal Realisasi` should use orange text because it is one of the most important metadata fields.

## 4. Visual Changes

- Reduced page vertical padding.
- Reduced top header height and back button size.
- Reduced tab min-width and surrounding spacing.
- Preserved the internal orange gradient header as a compact short header.
- Kept the main content body attached to that orange header with a compact white panel.
- Reduced summary section spacing, note padding, workflow spacing, metadata card padding, and right action panel width.
- Reduced right panel width, card padding, icon size, text size, status pill height, and action button height.
- Highlighted `Nominal Realisasi` cards with orange border/background, orange label, and orange value text.

## 5. Behavior Preserved

- Pegawai Revisi still uses its existing `/api/dokumen/:id` PATCH then `/api/dokumen/:id/submit` POST flow.
- PPK Resubmit still uses its existing `/api/ppk/resubmit/:id` PATCH then `/api/ppk/resubmit/:id` POST flow.
- PPK `Kembalikan ke Pegawai` still uses the existing `/api/ppk/kembalikan/:id` POST flow.
- `AttachmentEditor` remains the upload, validation, preview, replace, reset/remove, pending cleanup, and submit handoff authority.
- No workflow/status/revision target semantics changed.

## 6. Files Changed

- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `tests/unit/dokumen/ppk-resubmit-parity-source.test.ts`
- `docs/migration/phase-15l2d-revisi-first-viewport-compact-polish.md`

## 7. Validation

Planned focused validation:

- `pnpm test tests/unit/dokumen/revisi-dokumen-parity-source.test.ts`
- `pnpm test tests/unit/dokumen/ppk-resubmit-parity-source.test.ts`
- `pnpm test tests/unit/dokumen`
- `git diff --check`

## 8. Manual QA

Verify on Pegawai Revisi and PPK Resubmit/Revisi:

- first viewport shows header, status, tabs, revision note, workflow, metadata, and action panel with less scrolling;
- `Nominal Realisasi` is orange and visually emphasized;
- tabs remain readable on 390px mobile;
- action buttons remain reachable;
- existing attachment behavior still works;
- existing submit/return/cancel behavior remains unchanged.

## 9. Protected Files Confirmation

- `.env` and `.env.migration` are not changed.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `src/routeTree.gen.ts` are not changed.
- `db/`, `drizzle/`, `supabase/`, schema files, migration files, and API route files are not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
