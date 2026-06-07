# Phase 15L.3C.6 - Archive Form Control and Nominal Typography Polish

## 1. Status

Completed as a visual-only polish for archive metadata form controls, shared Ajukan-style date picker positioning, Pengklasifikasian Dokumen nominal typography, and lifecycle confirmation dialog presentation.

## 2. Scope

- Tutup Berkas / Isi Metadata Arsip form controls.
- Edit Metadata Arsip Aktif form controls.
- Nominal Realisasi display on Pengklasifikasian Dokumen.
- Confirmation dialog presentation for classification, close-folder, and folder lifecycle actions.

No lifecycle, API, backend, schema, route, package, storage, RBAC, or file-access behavior was changed.

## 3. Approved Ajukan Form Control Baseline Used

The approved Ajukan Dokumen baseline uses shared `Select` and `DatePicker` controls with warm archive-compatible surfaces:

- `rounded-xl`
- `border-[#F0E1D5]`
- `bg-[#FFFAF6]`
- orange hover/focus border treatment
- compact label spacing and small bold labels

## 4. Approved Pemberkasan Arsip Aktif Nominal Typography Baseline Used

The approved Pemberkasan Arsip Aktif nominal baseline uses:

- `font-mono`
- `text-sm`
- `font-bold`
- `text-zinc-950`
- `Rp` plus Indonesian thousands formatting
- right-aligned table presentation where applicable

## 5. Files Changed

- `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `src/components/ui/date-picker.tsx`
- `docs/migration/phase-15l3c6-archive-form-control-nominal-typography-polish.md`

## 6. Dropdown/Date Picker Visual Changes

- Replaced raw native retention `select` controls in the close metadata dialog with the shared `Select` primitive.
- Replaced raw date input in the close metadata dialog with the shared `DatePicker` primitive.
- Replaced raw retention `select` controls in Edit Metadata Arsip Aktif with the shared `Select` primitive.
- Replaced the disabled raw date input in Edit Metadata Arsip Aktif with the shared disabled `DatePicker`.
- Aligned labels, border radius, border color, background, hover, focus ring, menu surface, option hover, and disabled treatment to the Ajukan Dokumen visual baseline.
- Updated the shared `DatePicker` trigger and calendar surface to the warm Ajukan Dokumen control treatment.
- Moved the `DatePicker` calendar popover to open below the trigger instead of using fixed bottom positioning that could overlap adjacent controls.
- Added the close-folder summary card and retention preview badges for Masa Aktif Berakhir and Masa Inaktif Berakhir after complete date/retention input.

## 7. Nominal Typography Changes

- Added the visible Nominal Realisasi value to the Pengklasifikasian Dokumen metadata grid.
- Styled it with the Pemberkasan Arsip Aktif nominal typography baseline.
- Kept the same value source and currency formatting behavior already used by that page.

## 7A. Confirmation Dialog Changes

- Added a styled confirmation modal before Pengklasifikasian Dokumen submission.
- Added a second-step styled confirmation modal after complete Tutup Berkas metadata input.
- Replaced browser `window.confirm` for non-destructive folder lifecycle moves with styled React dialogs.
- Kept the explicit typed confirmation requirement for `Musnahkan Data`.

## 8. Behavior Preserved

- Field names are unchanged.
- Form state shape is unchanged.
- Request payload builders are unchanged.
- Validation rules are unchanged.
- Submit handlers are unchanged.
- Status gating and edit availability are unchanged.
- Nominal value calculation/source data is unchanged.
- Lifecycle action names and API payloads are unchanged.
- Retention badge dates are preview-only; final persistence remains server-authoritative.

## 9. API/Backend Changes

Expected none. No API route, service, read-model, schema, migration, storage, or auth/RBAC files were changed.

## 10. Validation Performed

Completed focused validation:

- `pnpm test tests/unit/arsiparis` passed.
- `pnpm test tests/unit/components/ui-foundation.test.ts` passed.
- `git diff --check` passed with line-ending warnings only.
- Protected-file diff check returned no modified protected paths.

## 11. Manual QA Checklist

1. Open Ajukan Dokumen and observe dropdown/date picker style.
2. Open Berkas detail and open Tutup Berkas / Isi Metadata Arsip form.
3. Confirm dropdown/date picker visually matches Ajukan Dokumen.
4. Open Edit Metadata Arsip Aktif form.
5. Confirm dropdown/date picker visually matches Ajukan Dokumen.
6. Open Pengklasifikasian Dokumen.
7. Confirm Nominal Realisasi typography matches Pemberkasan Arsip Aktif.
8. Confirm submit/save behavior still works.
9. Confirm no lifecycle/API behavior changed.
10. Confirm 390px mobile controls remain usable.
11. Confirm classification, close-folder, inactive, usul-musnah, and destruction confirmations render as expected.

## 12. Protected Files Confirmation

No package, env, route tree, DB, Drizzle, Supabase, schema, migration, API route, backend service, storage, or file-access files are expected to be modified by this phase.
