# Phase 15L.1E - Ajukan Dokumen Step 2/3 Simplification and Color Harmony

## 1. Status

- Implemented.
- Focused automated validation passed.
- Manual browser visual and submission retest remains pending.
- Scope is visual-only for `/pegawai/dokumen/aju`.
- No commit or push was performed.

## 2. Scope

Phase 15L.1E simplifies Step 2 and Step 3 of Ajukan Dokumen and applies a new page-local warm-orange palette. Step 1 keeps the Phase 15L.1D composition, with only compact spacing and palette alignment.

Included:

- compact Step 2 context, role, required attachment, optional attachment, and nominal/detail presentation;
- compact Step 3 ready state, grouped review summary, attachment list, consequence note, and action footer;
- restrained page-local color harmony across Ajukan Dokumen, confirmation, and success presentation;
- focused source-guard updates.

Excluded:

- business logic, validation, upload behavior, confirmation behavior, success-state logic, API/backend, auth/session/RBAC, storage/file-access, schema, migration, package, environment, routeTree, and other pages.

## 3. User Visual Feedback Addressed

- Replaced the previous yellow-amber iteration with a more controlled premium orange direction based on the prototype.
- Unified CTA, active indicators, progress, and selection states around `#F97316`, with a restrained `#F97316` to `#FB923C` gradient reserved for the main content header.
- Kept white and warm near-white as the dominant surfaces so orange remains intentional rather than visually excessive.
- Reduced excessive visual layers and nested cards in Step 2 and Step 3.
- Reduced vertical height, large headings, badges, borders, and internal section chrome.
- Moved the horizontal three-stage progress outside the main form panel to match the prototype composition.
- Changed the main content header into a rounded-top premium orange gradient with a separate rounded-bottom white form surface.
- Added explicit instructional placeholders to Step 1 selects and direct input fields.
- Normalized empty Ajukan select values to `null` so Base UI renders the visible placeholder instead of an empty control.
- Made Ajukan SelectValue render functions explicitly return their concise placeholder for empty values because Base UI children override the placeholder prop.
- Kept Step 1 progressive: dependent fields remain hidden until relevant, while visible form controls use concise input placeholders.
- Kept orange as an active/action accent instead of a dominant page color.
- Made required attachment rows, optional attachment area, review summary, and action footers more direct and compact.
- Kept the optional-document name form collapsed initially behind a single dashed `Tambah Dokumen Opsional` action.
- Presented Non-Material detail notes as a full-width textarea and replaced the lower right format card with a concise pre-submit review warning.
- Added a compact back-button page header, narrowed the right rail, separated progress connectors from labels, and used neutral gray for untouched progress.
- Rebalanced the desktop composition around a dominant main form and stable `18rem` right rail, and simplified the orange content header to title plus supporting copy only.
- Preserved the accepted Step 1 structure while making its controls slightly denser and color-consistent.

## 4. Screenshot and Prototype References Used

Primary visual references:

- user-provided prototype Step 2 screenshot;
- user-provided prototype Step 3 screenshot;
- user-provided palette references and latest premium-orange prototype direction;
- user feedback that Step 1 composition was acceptable but needed to be more compact.

Secondary structural reference:

- `D:\Temp\dms-ai-studio-final\src\components\roles\SubmitReportView.tsx`
  - Step 2 breadcrumb context;
  - single role-status callout;
  - compact attachment rows and optional attachment action;
  - Step 3 ready callout, light summary grid, document list, consequence note, and flat footer actions.

No prototype source was copied or imported.

## 5. Files Changed

Primary route:

- `src/routes/pegawai/dokumen/aju.tsx`

Ajukan visual components:

- `src/components/layout/AppSidebar.tsx` (Ajukan-route desktop width only)
- `src/components/dokumen/StepIndicator.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
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

- `docs/migration/phase-15l1e-ajukan-step23-color-harmony.md`

## 6. Step 2 Simplification

- Removed the large internal Step 2 title and description block because the active-stage header already provides that context.
- Aligned the visual stage labels with the prototype: `Unggah Dokumen` and `Tinjauan`.
- Replaced two context cards and the extra role card with:
  - one compact breadcrumb-like context row;
  - one compact automatically detected role-status row.
- Removed the large `Lampiran Dokumen` wrapper card.
- Replaced the large progress card with a small count, short progress rail, and subtle readiness state.
- Changed required and optional documents into compact horizontal rows.
- Simplified upload buttons and uploaded-file states.
- Changed the additional-document empty state into one dashed action row.
- Presented Material nominal or Non-Material detail directly below attachments without another large section card.

## 7. Step 3 Simplification

- Restored the clearer earlier Step 3 hierarchy after user review while keeping it compact.
- Kept a compact soft-green ready panel with two direct outcome and final-confirmation rows.
- Restored the `Ringkasan Pengajuan` heading and two grouped summaries:
  - `Informasi Dokumen` for fungsi, kegiatan, date, and role;
  - `Karakteristik Dokumen` for request/document type, category, detail, and Material nominal or Non-Material detail.
- Restored a dedicated `Kelengkapan Lampiran` group with compact two-column document rows.
- Kept the consequence/confirmation note as one restrained warm-tint row.
- Replaced the large confirmation action card with a flat footer action area.
- Made the response-backed success state smaller and aligned it with the same palette.

## 8. Page-Local Color Harmony Decisions

The palette is intentionally local to Ajukan Dokumen and is based on the new user-provided palette rather than a reduced-intensity version of the previous orange:

- page canvas: `#FFF9F4`;
- near-white controls and summary cells: `#FFFAF6`;
- subtle warm-neutral border: `#F0E1D5`;
- light amber tint: `#FFF3D6`;
- secondary light surface: `#FFF4EA`;
- selection/focus border: `#FFBC80`;
- premium content-header gradient: `#F97316` to `#FB923C`;
- primary CTA and active indicator: `#F97316`;
- primary CTA hover: `#EA580C`;
- dark amber text accent: `#B45309` and `#92400E`;
- restrained success surface: `#F1FBF5` with `#CDE9D7` border;
- primary text remains neutral stone/zinc rather than orange.

Color hierarchy:

- the `#F97316` to `#FB923C` gradient is reserved for the main content header and does not spread into the form body;
- cream and peach tints provide visual relationship without turning the whole page orange;
- white and near-white remain the dominant visual area.

No global CSS, Tailwind configuration, shell theme, or shared application theme was changed.

## 9. Business Behavior Preserved

- Submit endpoint remains `POST /api/dokumen/submit`.
- Submit payload identifiers and conditional payload shape remain unchanged.
- Submit handler and duplicate-submit guard remain unchanged.
- Existing validation remains unchanged.
- Material and Non-Material logic remains unchanged.
- Material positive nominal validation remains unchanged.
- Non-Material continues to send `nominal_realisasi: null`.
- Required attachment selection and validation remain unchanged.
- Upload endpoint, accepted formats, size validation, and upload behavior remain unchanged.
- Confirmation opening and confirmed-submit behavior remain unchanged.
- Response-backed success state, toast behavior, and success actions remain unchanged.
- Existing workflow/status, auth/session/RBAC, storage, preview/download, and file-access behavior remain unchanged.

## 10. Validation Performed

Passed:

- `pnpm test tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
  - 1 file, 6 tests.
- `pnpm test tests/unit/components/ui-foundation.test.ts`
  - 1 file, 4 tests.
- `pnpm test tests/unit/dokumen`
  - 11 files, 114 tests.
- `pnpm exec tsc --noEmit --pretty false`
  - failed on existing unrelated repository-wide TypeScript errors;
  - no reported error referenced a file changed by Phase 15L.1E.

Not run:

- full `pnpm test`;
- `pnpm build`.

## 11. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

- Open `/pegawai/dokumen/aju`.
- Confirm the premium orange direction feels controlled, clear, and close to the prototype.
- Confirm CTA, progress, active indicators, and selection states use one consistent amber family.
- Confirm Step 1 remains direct and is slightly more compact.
- Compare Step 2 against the supplied prototype screenshot:
  - compact context row;
  - compact role status;
  - direct attachment rows;
  - simple optional-document action;
  - direct nominal or Non-Material detail field.
- Compare Step 3 against the supplied prototype screenshot and earlier preferred app composition:
  - compact ready state with outcome and confirmation rows;
  - grouped `Informasi Dokumen` and `Karakteristik Dokumen`;
  - compact `Kelengkapan Lampiran`;
  - clear final action.
- Submit Material and Non-Material documents.
- Confirm required attachments, upload, confirmation, toast, success state, preview, and download still work.
- Confirm 390px mobile has no horizontal overflow and sticky mobile actions remain reachable.

## 12. Deferred Visual Gaps

- Human browser comparison may identify final spacing, line-wrap, or color adjustments.
- Shared DatePicker and global shell colors remain outside this page-local phase.
- A global theme rollout remains deferred until the user approves this Ajukan color direction.
- Motion/animation parity remains outside scope.
- Revisi Dokumen and other pages remain outside scope.

### Final composition refinement

- The desktop sidebar uses a narrower width only on `/pegawai/dokumen/aju`, preserving the existing width on other application pages.
- The horizontal stage progress now occupies the form column instead of stretching across the form and right rail.
- The form and right progress rail retain the same grid proportions, keeping the main task area dominant without making the right rail visually detached.
- The circular back action now returns to the Pegawai dashboard at `/pegawai`.

## 13. Dependency Decisions

- No dependency was added or changed.
- Existing React, Tailwind CSS, Base UI, Lucide icons, and local UI primitives were sufficient.

## 14. Protected Files Confirmation

- No API/backend route file was changed.
- No auth/session/RBAC file was changed.
- No storage/file-access file was changed.
- No schema, migration, package, lockfile, environment, database, Drizzle, or Supabase file was changed.
- `src/routeTree.gen.ts` was not changed.
- No package was installed.
- No prototype source was copied or imported.
- No commit or push was performed.
