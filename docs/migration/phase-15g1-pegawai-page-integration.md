# Phase 15G.1 - Pegawai Shell-Compatible Page Integration

Date: 2026-06-01

Status: implemented. Automated validation passed; pending human browser review.

## Scope

Phase 15G.1 applies the Phase 15F warm shell direction and Phase 15E shared UI foundation to Pegawai-facing pages only.

Touched Pegawai pages:

- `/pegawai`
- `/pegawai/dokumen`
- `/pegawai/dokumen/$id`
- `/pegawai/dokumen/aju`
- `/pegawai/revisi`
- `/pegawai/dokumen/$id/revisi`
- `/pegawai/laporan/saya`
- `/pegawai/laporan/kegiatan`

The additional active Non-Material edit page `/pegawai/dokumen/$id/edit` was inspected but not redesigned in this phase.

## Files Changed

- `src/components/pegawai/PegawaiPagePrimitives.tsx`
- `src/routes/pegawai.tsx`
- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/pegawai/dokumen/$id/index.tsx`
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/revisi.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/pegawai/laporan/saya.tsx`
- `src/routes/pegawai/laporan/kegiatan.tsx`
- `src/components/dokumen/StepIndicator.tsx`
- `src/components/dokumen/form/StepJenisPermintaan.tsx`
- `src/components/dokumen/form/StepUploadLampiran.tsx`
- `src/components/dokumen/FileUploadButton.tsx`
- `docs/migration/phase-15g1-pegawai-page-integration.md`

## Visual Changes

- Added Pegawai-only page primitives for warm page headers, panels, search/filter panels, field cards, and pagination.
- Updated Pegawai dashboard with warm quick-action panels without changing shared shell behavior or other role dashboards.
- Updated document list and revision list with warm headers, local filter panels, shared loading/error/empty states, canonical status badges, and mobile card layouts.
- Updated document detail with warmer header, canonical status badge, clearer workflow panel, metadata field cards, and existing attachment/activity sections preserved.
- Updated Ajukan Dokumen with a wider shell-compatible layout, warm stepper panel, active-step helper panel, and clearer form content container.
- Updated Revisi Dokumen detail with warm header, workflow panel, revision note state, metadata cards, and preserved attachment editor behavior.
- Updated Laporan Saya and Laporan Kegiatan with warm headers, local filter panel presentation, shared states, status badges, desktop table, and mobile card layouts.
- Softened Pegawai document form controls around Non-Material selection, upload detail panels, and stepper color treatment.

## Shared Components Used

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `StatusBadge`
- existing `Button`, `Badge`, `Table`

`AppDialog`, `ConfirmDialog`, and `AppToast` were not forced into Pegawai workflow/file actions in this slice to avoid changing existing submit, delete, upload, download, and unsaved-change behavior.

## Behavior And Domain Boundaries Preserved

- No route paths were added or changed.
- No API URLs, request bodies, response handling contracts, or mutation endpoints were changed.
- No auth/session/RBAC logic was changed.
- No storage/file-access logic was changed.
- `AttachmentViewer`, `AttachmentEditor`, and upload/download helpers remain the behavior owners for preview, download, pending upload, cleanup, and resubmit.
- Material workflow remains `DRAFT -> IN_PPK_VALIDATION -> IN_PPSPM_APPROVAL -> COMPLETED`.
- User-facing approval step copy uses `PPSPM`.
- Non-Material remains `TERSIMPAN`, has no PPK/PPSPM approval flow, and has no nominal realisasi.
- Pegawai pages continue to use dokumen terminology rather than archive/berkas terminology.

## Preserved Guardrails

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state.
- Server/API RBAC remains authoritative.
- `ADMIN` remains a dedicated role and is not presented as a Pegawai substitute.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.
- No production, go-live, operational certification, security certification, or compliance validation claim is made.
- Removed legacy archive/search/report surfaces were not restored.

## Validation Performed

Planned validation for this phase:

- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm build`
- restore `src/routeTree.gen.ts` if build changes it
- protected file diff check for `.env`, `.env.migration`, package lockfiles, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`

## Known Deferred Items

- `/pegawai/dokumen/$id/edit` can receive the same visual treatment in a later Pegawai polish slice if desired.
- Existing `AttachmentViewer` and `AttachmentEditor` still use their current modal and alert/confirm behavior; no broad dialog replacement was attempted.
- Page-level counts remain sourced from existing data already available on each page; no new dashboard count API was introduced.
- No E2E/browser automation was added in this phase.

## Final Guardrails

- Do not copy or import prototype files.
- Do not run or commit route generation.
- Do not modify package, env, schema, migration, database, storage, auth, RBAC, or API route files.
- Do not restore `/arsiparis/aktif`, `/arsiparis/search`, `/arsiparis/arsip/$id`, legacy archive APIs, `Laporan Klasifikasi`, global/sidebar `Cari Arsip`, `arsip.arsip`, `lampiran_snapshot`, or `canonical_arsip_id`.
- Do not claim production readiness, go-live approval, full security, or full Supabase repository removal.
