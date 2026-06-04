# Phase 15L.1 - Ajukan Dokumen Grouped Sections, Confirmation, and Success Flow

## 1. Status

- Implemented.
- Automated validation passed.
- Manual browser QA remains pending.
- Scope is limited to Pegawai Ajukan Dokumen.
- No prototype source was copied or imported.
- No commit or push was performed.

## 2. Scope

Phase 15L.1 improves presentation and interaction parity for `/pegawai/dokumen/aju` while preserving the current submit business behavior.

Included:

- regroup the existing dynamic five-to-seven-step presentation into three major presentation stages;
- retain every current field and conditional field;
- retain current validation and upload/checklist ownership;
- add a clear review state before submission;
- add explicit confirmation before the existing submit mutation;
- add safe success/error toasts;
- replace immediate post-submit redirect with an in-page success state;
- provide success actions for document list, another submission, and document detail;
- improve narrow-screen layout and action reachability;
- add a focused source-level parity guard.

Excluded:

- Revisi Dokumen;
- backend/API changes;
- new routes;
- workflow/status changes;
- auth/session/RBAC changes;
- upload, attachment movement, storage, preview, or download changes;
- schema, migration, package, environment, or generated-route changes.

## 3. Prototype References Used

Reviewed structurally from the AI Studio prototype:

- `src/components/roles/SubmitReportView.tsx`
  - three-stage presentation;
  - progress stepper;
  - grouped information, upload, and review hierarchy;
  - review summary;
  - explicit submit confirmation;
  - success state;
  - success/error toast feedback;
  - mobile-aware action layout.
- Shared prototype submit/success/modal/toast patterns were used only as interaction references.

The real application remains authoritative for fields, validation, payload, endpoint, workflow, status, file handling, RBAC, and terminology.

## 4. Files Changed

Primary route:

- `src/routes/pegawai/dokumen/aju.tsx`

Existing presentation components updated for grouped/mobile rendering:

- `src/components/dokumen/ReviewSummary.tsx`
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

- `docs/migration/phase-15l1-ajukan-dokumen-parity.md`

## 5. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Existing request payload identifiers and conditional payload behavior remain unchanged.
- Existing server validation remains authoritative.
- Existing local submit write, file preflight, file movement, compensation, and audit behavior remain unchanged.
- Existing upload and required-kelengkapan behavior remains owned by the current checklist/upload components.
- Material continues to require positive `nominal_realisasi`.
- Material continues to follow the existing validation and approval workflow.
- Non-Material continues to send `nominal_realisasi: null`.
- Non-Material continues to omit Material request/category/detail values.
- Non-Material continues to become `TERSIMPAN` and does not enter the PPK/PPSPM approval flow.
- Existing role detection for Ketua Tim/Anggota remains unchanged.
- Existing auth/session/RBAC behavior remains unchanged.
- No API route or response contract was changed.

## 6. UI/Interaction Changes

The form now presents three major stages:

1. `Informasi Dasar`
2. `Kelengkapan`
3. `Review & Ajukan`

The first stage groups the existing information into progressive cards:

- fungsi and tanggal;
- kegiatan;
- Material/Non-Material selection and type;
- Material category;
- Material detail where required.

The second stage continues to use the existing upload/checklist surface and existing Material nominal or Non-Material keterangan field.

The third stage presents the existing review summary with a clearer ready-to-submit panel and explicit final confirmation.

Mobile improvements:

- major form sections are one column;
- review summary becomes one column at narrow widths;
- progress navigation remains horizontally scrollable where needed;
- stage and final action controls use reachable sticky mobile panels;
- action buttons stack at narrow widths;
- primary containers use `min-w-0` to avoid avoidable horizontal overflow.

## 7. Success/Confirmation/Toast Behavior

Confirmation:

- Final review action opens the shared `ConfirmDialog`.
- Confirmation title is `Ajukan dokumen ini?`.
- Material confirmation asks the user to verify jenis permintaan, kegiatan, nominal realisasi, and kelengkapan.
- Non-Material confirmation asks the user to verify jenis dokumen, kegiatan, keterangan detail, and kelengkapan without PPK/PPSPM wording.
- The mutation starts only after confirmation.
- An in-flight guard prevents duplicate submit execution.

Success:

- Successful submission no longer redirects immediately.
- The in-page success state uses the existing submit response.
- It shows safe document title, Material/Non-Material type, result status, and next step.
- Actions:
  - `Lihat Daftar Dokumen`;
  - `Ajukan Dokumen Lain`;
  - `Lihat Detail Dokumen` when the existing response includes the document id.
- `Ajukan Dokumen Lain` clears the local form state and returns to a fresh first stage.

Toast:

- Successful Material and Non-Material outcomes show one safe success toast.
- Validation/API failures show safe error toast copy.
- Existing inline submit-error presentation remains available.

## 8. Material/Non-Material Confirmation

Material:

- Positive nominal realisasi remains required.
- The review shows nominal realisasi.
- Confirmation states that the document follows the existing validation and approval flow.
- The success state uses the returned status and next step.

Non-Material:

- No nominal realisasi input or value is introduced.
- Keterangan detail remains required.
- The review states that the document is stored as Tersimpan without nominal realisasi.
- Confirmation and success copy do not imply PPK/PPSPM processing.
- Existing `TERSIMPAN` behavior remains covered by submit-route parity tests.

## 9. Validation Result

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 3 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/components/attachment-viewer-source.test.ts`
  - 1 file, 2 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 111 tests.
- `pnpm test`
  - 63 files, 687 tests.
- `pnpm build`
  - passed.
  - Existing third-party module-level `"use client"` and circular `pg` chunk warnings remain.
  - Build-regenerated `src/routeTree.gen.ts` was restored and is not part of this phase.

The focused source-level test guards:

- three grouped presentation stages;
- explicit confirmation and success state;
- existing submit endpoint and payload identifiers;
- no `Simpan Draft`;
- no `Nomor Surat`;
- no Cari Arsip or Laporan Klasifikasi restoration.

## 10. Manual QA Checklist

Use `.env`, not `.env.migration`, for runtime browser QA:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Pending human retest:

- Login as Pegawai.
- Open `/pegawai/dokumen/aju`.
- Verify the three-stage stepper and grouped sections are readable.
- Submit a Material document with required attachments.
- Confirm the dialog appears before final submit.
- Confirm submit succeeds, the success state appears, and the toast appears once.
- Confirm `Lihat Daftar Dokumen` works.
- Confirm `Ajukan Dokumen Lain` resets to a fresh form safely.
- Confirm `Lihat Detail Dokumen` works.
- Submit a Non-Material document.
- Confirm Non-Material has no nominal realisasi and its confirmation/success copy has no PPK/PPSPM wording.
- Confirm resulting attachment preview/download still works through document-aware routes.
- Verify 390px mobile width has no horizontal overflow and action buttons remain reachable.

## 11. Deferred Items

- Revisi Dokumen parity remains Phase 15L.2.
- Human browser QA for actual Material and Non-Material submissions remains pending.
- Broader global toast/dialog replacement remains a later bounded phase.
- No new unsaved-change behavior was added.
- No backend notification, persistent photo, archive, admin, or Laporan Kinerja work is included.

## 12. Protected Files Confirmation

- No backend/API route file was changed.
- No auth/session/RBAC file was changed.
- No storage/file-access or attachment-movement file was changed.
- No schema, migration, package, lockfile, environment, database, Drizzle, or Supabase file was changed.
- `src/routeTree.gen.ts` was regenerated by build and restored.
- No prototype source was copied or imported.
- No route generation output is included.
- No commit or push was performed.
