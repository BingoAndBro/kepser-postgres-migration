# Phase 15L.1C - Ajukan Dokumen Soft Visual Tone And Simplification Pass

## 1. Status

- Implemented.
- Automated validation passed.
- Manual browser visual and submission retest remains pending.
- Scope is limited to visual simplification for `/pegawai/dokumen/aju`.
- No prototype source was copied or imported.
- No commit or push was performed.

## 2. Scope

Phase 15L.1C softens and simplifies the existing Phase 15L.1 and Phase 15L.1B Ajukan Dokumen presentation without changing behavior.

Included:

- compact the top page header and active-stage banner;
- replace the saturated red-orange stage gradient with a flat soft warm-orange accent;
- keep the existing light cream application canvas and make content cards primarily white or off-white;
- reduce repeated orange borders, heavy shadows, and visually dominant progress treatment;
- reduce wide uppercase tracking in route-local and Ajukan-only presentation labels;
- simplify grouped form, upload, review, confirmation, success, and sidebar surfaces;
- retain readable desktop and narrow-screen stacking.

Excluded:

- submit, validation, workflow, status, Material/Non-Material, required attachment, upload, success-state, or confirmation behavior changes;
- API/backend, auth/session/RBAC, storage, file-access, schema, migration, package, environment, or route changes;
- Revisi Dokumen;
- new dependencies or prototype source reuse.

## 3. Visual Problems Addressed

- The active-stage header used a saturated red-orange gradient that dominated the page.
- Repeated orange borders and warm card fills made the page feel brown and visually dense.
- The top header, stage banner, stepper, progress sidebar, and sticky action surfaces competed for attention.
- Large shadows and high-contrast elevation made otherwise simple sections feel bulky.
- Many labels used small uppercase text with wide tracking, increasing visual noise.
- Upload, review, confirmation, and success surfaces repeated too many accent treatments.

## 4. Files Changed

Primary route:

- `src/routes/pegawai/dokumen/aju.tsx`

Existing Ajukan presentation components:

- `src/components/dokumen/StepIndicator.tsx`
- `src/components/dokumen/ReviewSummary.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/form/StepFungsiTanggal.tsx`
- `src/components/dokumen/form/StepKegiatan.tsx`
- `src/components/dokumen/form/StepJenisPermintaan.tsx`
- `src/components/dokumen/form/StepKategoriPermintaan.tsx`
- `src/components/dokumen/form/StepDetailPermintaan.tsx`
- `src/components/dokumen/form/StepUploadLampiran.tsx`
- `src/components/dokumen/form/StepReview.tsx`
- `src/components/dokumen/form/StepperControls.tsx`

Documentation:

- `docs/migration/phase-15l1c-ajukan-dokumen-soft-visual-tone.md`

The focused Ajukan parity test did not require modification.

## 5. Visual Tone Changes

- Kept the application canvas at the existing light cream `#FFF8F1` direction.
- Replaced the saturated stage gradient with a compact flat `#FFF3E8` banner and bright warm-orange icon accent.
- Changed primary route-local action accents from darker orange to `orange-500` with restrained hover treatment.
- Changed most content surfaces to white or `#FFFAF5` with subtle neutral zinc borders.
- Removed heavy orange-tinted card shadows and reduced sticky action elevation to a small neutral shadow.
- Reduced the main progress rail width and visual weight, including smaller markers, thinner lines, and quieter inactive states.
- Simplified the right progress/help panels with neutral borders, compact spacing, and orange used only for active progress.
- Reduced tracked uppercase treatment across grouped form labels, upload/review summaries, confirmation, status pills, and sidebar labels.
- Simplified success and confirmation presentation while preserving their content and actions.
- Preserved one-column narrow-screen defaults and full-width mobile actions.

## 6. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Submit payload identifiers and conditional payload shape remain unchanged.
- Submit handler behavior and duplicate-submit guard remain unchanged.
- Existing validation remains unchanged.
- Material and Non-Material logic remains unchanged.
- Material positive nominal validation remains unchanged.
- Non-Material continues to send `nominal_realisasi: null`.
- Required attachment logic remains unchanged.
- Upload behavior and pending/formal file handling remain unchanged.
- Existing confirmation opening and confirmed-submit behavior remain unchanged.
- Existing response-backed success state, toast, and success actions remain unchanged.
- Existing workflow/status, auth/session/RBAC, storage, and file-access behavior remain unchanged.

## 7. Validation Result

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 112 tests.
- `pnpm test`
  - 63 files, 688 tests.
- `pnpm build`
  - passed;
  - existing third-party module-level `"use client"` and circular `pg` chunk warnings remain;
  - build-regenerated `src/routeTree.gen.ts` was restored.
- `git diff --check`
  - passed.

## 8. Manual QA Checklist

Use `.env`, not `.env.migration`:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Pending human retest:

- Open `/pegawai/dokumen/aju`.
- Compare against prototype `SubmitReportView`.
- Confirm the tone is softer, cleaner, and less brown/orange-heavy.
- Confirm orange acts as an active/primary accent rather than dominating the page.
- Check `Informasi Dasar`, `Kelengkapan`, and `Review & Ajukan`.
- Check the confirmation dialog and response-backed success state.
- Check 390px mobile width for readable cards, stages, dialog, and actions without horizontal overflow.
- Submit Material and Non-Material documents.
- Verify upload and resulting preview/download still work.

## 9. Deferred Visual Gaps

- Human screenshot comparison and any final browser-specific spacing adjustments.
- Browser-level 390px overflow verification.
- Motion/animation parity; no new motion was added.
- Broader shared shell or shared UI primitive tone changes remain outside this route-local phase.
- Revisi Dokumen remains outside this phase.

## 10. Protected Files Confirmation

- No backend/API route file was changed.
- No auth/session/RBAC file was changed.
- No storage/file-access file was changed.
- No schema, migration, package, lockfile, environment, database, Drizzle, or Supabase file was changed.
- Build-regenerated `src/routeTree.gen.ts` was restored and is not part of this phase.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.

## 11. Prototype Elements Requiring Dependency Decision

- None.
- The soft visual tone and simplification target was implemented with the existing Tailwind CSS, shared UI primitives, and current icon stack.
