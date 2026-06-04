# Phase 15L.1B - Ajukan Dokumen Visual Parity Pass

## 1. Status

- Implemented.
- Automated validation passed.
- Manual browser visual and submission retest remains pending.
- Scope is limited to `/pegawai/dokumen/aju`.
- No prototype source was copied or imported.
- No commit or push was performed.

## 2. Scope

Phase 15L.1B improves the visual hierarchy and interaction feel of Ajukan Dokumen after the functionally safe Phase 15L.1 implementation.

Included:

- stronger warm page composition and grouped form hierarchy;
- prototype-inspired three-stage progress presentation;
- richer progress sidebar and active-stage presentation;
- clearer upload and attachment completeness presentation;
- richer review summary cards;
- stronger confirmation dialog hierarchy and consequence summary;
- stronger response-backed success state and next actions;
- tighter mobile stacking, button reachability, and overflow guards;
- focused source guard updates.

Excluded:

- Revisi Dokumen and Phase 15L.2 work;
- backend/API changes;
- submit, validation, upload, file movement, workflow, status, RBAC, auth, session, storage, or file-access changes;
- schema, migration, package, environment, or route changes;
- new packages;
- prototype source reuse.

## 3. Prototype References Used

Reviewed structurally:

- `D:\Temp\dms-ai-studio-final\src\components\roles\SubmitReportView.tsx`
  - top-level form plus progress-sidebar composition;
  - three-stage stepper hierarchy;
  - active-stage header treatment;
  - upload completeness and review grouping;
  - confirmation modal composition;
  - success-state composition;
  - mobile action grouping assumptions.
- Related prototype shared references:
  - `src/components/DatePicker.tsx`;
  - `src/components/DocumentPreviewPaper.tsx`;
  - `src/components/Icons.tsx`.

The prototype was used only as a structural visual reference. Current DMS terminology, behavior, and data remain authoritative.

## 4. Files Changed

Primary route:

- `src/routes/pegawai/dokumen/aju.tsx`

Ajukan-only presentation components:

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

Focused test:

- `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`

Documentation:

- `docs/migration/phase-15l1b-ajukan-dokumen-visual-parity.md`

## 5. Visual Parity Changes

- Reframed the form as one cohesive workflow card with a warm orange active-stage header.
- Added compact stage subtitles and a readable three-column stepper without horizontal scrolling.
- Added a desktop sticky progress sidebar with percentage, stage status, and safe guidance.
- Strengthened grouped information cards with completion badges and clearer section rhythm.
- Increased typography contrast and spacing hierarchy while retaining the warm cream/orange direction.
- Updated final action groups to use clearer primary/secondary priority and larger reachable controls.
- Kept icons restrained and functional.

## 6. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Request payload identifiers and conditional payload shape remain unchanged.
- API response contract remains unchanged.
- Material and Non-Material logic remains unchanged.
- Material positive nominal validation remains unchanged.
- Non-Material continues to send `nominal_realisasi: null`.
- Required attachment validation remains unchanged.
- Upload behavior and pending/formal file handling remain unchanged.
- Submit in-flight duplicate protection remains unchanged.
- Existing server validation, workflow/status semantics, and role detection remain authoritative.
- Existing auth/session/RBAC, storage, and file-access behavior remain unchanged.

## 7. Confirmation And Success Visual Changes

Confirmation:

- Uses a route-local composition on the existing shared `AppDialog`.
- Adds a stronger icon/title hierarchy, Material/Non-Material summary, attachment count, and consequence panel.
- Preserves the safe Phase 15L.1 confirmation copy and existing submit handler.
- Keeps dialog content scrollable through the existing shared dialog foundation.

Success:

- Adds a stronger completion visual and `Pengajuan selesai` state.
- Uses only the existing submit response and safe current state.
- Shows document title, type, resulting status, next stage, and completed-stage summary.
- Keeps `Lihat Daftar Dokumen`, `Lihat Detail Dokumen`, and `Ajukan Dokumen Lain`.
- Does not fabricate metrics, identifiers, or workflow outcomes.

Review:

- Separates context, document characteristics, consequence, and attachment completeness into clearer cards.
- Makes Material/Non-Material status visually explicit.
- Shows uploaded attachments in responsive summary cards.

## 8. Responsive And Mobile Notes

- The main form and sidebar stack into one column below desktop width.
- The stage indicator uses three bounded columns and wraps labels instead of requiring horizontal scrolling.
- Form, review, upload, confirmation, and success cards use `min-w-0`, wrapping, and one-column mobile defaults.
- Upload controls and action groups stack at narrow widths.
- Sticky action groups keep primary actions reachable.
- Dialog maximum height and overflow behavior continue to come from the shared dialog foundation.
- Human verification at 390px remains required.

## 9. Tests And Validation

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
  - 1 file, 2 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 112 tests.
- `pnpm test`
  - 63 files, 688 tests.
- `pnpm build`
  - passed after correcting a route-local JSX container boundary found by the first build attempt;
  - existing third-party module-level `"use client"` and circular `pg` chunk warnings remain;
  - build-regenerated `src/routeTree.gen.ts` was restored.
- `git diff --check`
  - passed.

The focused source guard now checks:

- all three major stages remain;
- confirmation, success, progress, and consequence presentation remain present;
- submit endpoint and payload identifiers remain unchanged;
- no backend/API route import is introduced;
- forbidden Ajukan terminology/features remain absent.

## 10. Manual QA Checklist

Use `.env`, not `.env.migration`:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Pending human retest:

- Login as Pegawai.
- Open `/pegawai/dokumen/aju`.
- Compare composition against prototype `SubmitReportView`.
- Check `Informasi Dasar`, `Kelengkapan`, and `Review & Ajukan`.
- Submit a Material document and verify confirmation, toast once, success state, and next actions.
- Verify `Lihat Daftar Dokumen`, `Ajukan Dokumen Lain`, and `Lihat Detail Dokumen`.
- Submit a Non-Material document and verify no nominal or PPK/PPSPM wording.
- Verify upload, resulting attachment preview, and download still work.
- Verify 390px width has no horizontal overflow, readable stages/cards, usable dialog, and reachable buttons.

## 11. Deferred Visual Gaps

- Human browser comparison and final visual tuning against the prototype.
- Browser-level 390px overflow verification.
- Any motion/animation parity; no new animation was added in this bounded pass.
- Unsaved-change behavior, which remains outside this phase.
- Revisi Dokumen visual/interaction parity, which remains Phase 15L.2.
- Broader shared dialog, toast, or global workflow visual rollout.

## 12. Protected Files Confirmation

- No backend/API route file was changed.
- No auth/session/RBAC file was changed.
- No storage/file-access or attachment-movement file was changed.
- No schema, migration, package, lockfile, environment, database, Drizzle, or Supabase file was changed.
- No route was changed.
- Build-regenerated `src/routeTree.gen.ts` was restored and is not part of this phase.
- No prototype source was copied or imported.
- No package was installed.
- No commit or push was performed.
