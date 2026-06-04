# Phase 15L.1D - Ajukan Dokumen Prototype Layout Simplification Pass

## 1. Status

- Implemented.
- Focused automated validation passed.
- Manual browser visual and submission retest remains pending.
- Scope is visual/layout-only for `/pegawai/dokumen/aju`.
- No commit or push was performed.

## 2. Scope

Phase 15L.1D simplifies the existing safe three-stage Ajukan Dokumen flow so Step 1 is closer to the reviewed prototype composition.

Included:

- remove nested Step 1 section cards and completion badges;
- present Step 1 fields directly in one form body;
- change Fungsi into horizontal selectable options;
- change Material and Non-Material into side-by-side selectable options;
- keep Kegiatan, Jenis Permintaan, Kategori Permintaan, Detail Permintaan, and Tanggal as direct field rows;
- simplify the page title, active-stage header, canvas tone, card borders, desktop width, and right progress-panel tone;
- retain readable one-column controls on narrow screens;
- add a focused source guard for the simplified composition.

Excluded:

- submit, payload, validation, workflow, status, Material/Non-Material, required attachment, upload, success-state, or confirmation behavior changes;
- API/backend, auth/session/RBAC, storage, file-access, schema, migration, package, environment, routeTree, or route changes;
- Revisi Dokumen;
- new dependencies or prototype source reuse.

## 3. User Visual Feedback Addressed

- Step 1 no longer renders separate large cards titled `Informasi Dasar`, `Detail Kegiatan`, `Jenis Dokumen`, `Kategori Permintaan`, and `Detail Permintaan`.
- `Lengkap` and `Perlu dilengkapi` badges were removed from Step 1.
- Fields are presented directly with clear labels and restrained spacing.
- Fungsi is presented as horizontal selectable cards instead of a dropdown.
- Material and Non-Material are presented as side-by-side selectable cards instead of a checkbox.
- The top title is no longer rendered as a large bordered card.
- The active-stage header uses a clean flat warm orange.
- The route canvas and controls use near-white/soft-cream surfaces and subtle neutral borders.

## 4. Files Changed

Primary route:

- `src/routes/pegawai/dokumen/aju.tsx`

Ajukan-only form presentation components:

- `src/components/dokumen/form/StepFungsiTanggal.tsx`
- `src/components/dokumen/form/StepKegiatan.tsx`
- `src/components/dokumen/form/StepJenisPermintaan.tsx`
- `src/components/dokumen/form/StepKategoriPermintaan.tsx`
- `src/components/dokumen/form/StepDetailPermintaan.tsx`

Focused test:

- `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`

Documentation:

- `docs/migration/phase-15l1d-ajukan-dokumen-layout-simplification.md`

## 5. Layout Simplification Changes

- Removed the route-local `GroupedFormSection` wrapper and its numbered section headers.
- Kept the three major stages and horizontal step indicator.
- Placed the step indicator before the compact active-stage header.
- Kept the active-stage header as the single strong visual header for the form.
- Changed Step 1 into one direct sequence:
  - Pilih Fungsi;
  - Pilih Kegiatan;
  - Karakteristik Dokumen;
  - Pilih Jenis Permintaan or Pilih Jenis Dokumen;
  - Pilih Kategori Permintaan when required;
  - Pilih Detail Permintaan when required;
  - Pilih Tanggal Laporan.
- Moved the Step 1 continue action into a simple divider/footer instead of a separate sticky card.
- Increased the desktop content width while preserving a single-column mobile layout.

## 6. Color/Tone Changes

- Route canvas uses near-white soft cream `#FFFBF7`.
- Main form and progress card surfaces are white.
- Neutral control/card borders use the `#F1E5DA` direction.
- Input/select surfaces use near-white `#FFFCF9`.
- The active-stage header uses flat `orange-500`.
- Orange is limited to active/selected states, required markers, and primary actions.
- Heavy beige, brown-orange fills, repeated orange borders, and extra shadows were avoided.

## 7. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Submit payload identifiers and conditional payload shape remain unchanged.
- Submit handler and duplicate-submit guard remain unchanged.
- Existing validation remains unchanged.
- Material and Non-Material logic remains unchanged.
- Material positive nominal validation remains unchanged.
- Non-Material continues to send `nominal_realisasi: null`.
- Required attachment logic and upload behavior remain unchanged.
- Existing confirmation, response-backed success state, toast, and success actions remain unchanged.
- Existing workflow/status, auth/session/RBAC, storage, and file-access behavior remain unchanged.

## 8. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 5 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 113 tests.
- `git diff --check`
  - passed.

Additional check:

- `pnpm exec tsc --noEmit --pretty false`
  - failed on existing unrelated repository-wide TypeScript errors.
  - No reported error referenced a file changed by Phase 15L.1D.

Not run:

- full `pnpm test`;
- `pnpm build`.

## 9. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Open `/pegawai/dokumen/aju`.
- Compare Step 1 against the prototype screenshots.
- Confirm Step 1 has no nested titled section cards or completion badges.
- Confirm Fungsi options are horizontal on desktop and stack cleanly on mobile.
- Confirm Material and Non-Material options work and retain their existing reset behavior when switching branches.
- Confirm Kegiatan, Jenis Permintaan, Kategori, Detail, and Tanggal remain usable.
- Confirm Material and Non-Material submissions still work.
- Confirm upload, confirmation, success state, preview, and download behavior still work.
- Confirm 390px mobile has no horizontal overflow.

## 10. Deferred Visual Gaps

- Human browser comparison may still identify browser-specific spacing or sizing adjustments.
- Step 2 and Step 3 retain their existing Phase 15L.1C structure, apart from route-level tone consistency.
- Shared shell background and shared DatePicker styling remain outside this route-local phase.
- Motion/animation parity remains outside scope.
- Revisi Dokumen remains outside scope.

## 11. Protected Files Confirmation

- No backend/API route file was changed.
- No auth/session/RBAC file was changed.
- No storage/file-access file was changed.
- No schema, migration, package, lockfile, environment, database, Drizzle, or Supabase file was changed.
- `src/routeTree.gen.ts` was not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.

## 12. Dependency Decisions

- No dependency was added or changed.
- Existing React, Tailwind CSS, Base UI Select, Lucide icons, and route-local Ajukan components were sufficient.
