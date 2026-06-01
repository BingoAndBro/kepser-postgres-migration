# Phase 15H - Responsive And Interaction QA

Date: 2026-06-02

Status: completed as static responsive/interaction QA with bounded UI polish. Browser smoke remains deferred for human/manual verification.

## Scope

Phase 15H reviewed the Phase 15 redesigned frontend across the authenticated shell, shared UI foundation, Pegawai pages, PPK/PPSPM pages, Kepala Sub Bagian Umum archive pages, Penanggung Jawab Kinerja Laporan Kinerja page, Admin Sistem pages, and Profile page.

This phase is QA and small UI polish only. It does not redesign pages, add routes, change API contracts, change auth/session/RBAC, change storage/file access, change archive lifecycle, change workflow lifecycle, change schema/migrations, install packages, commit, or push.

## Authority Read

Current authority used:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-15abc-frontend-audit-prototype-policy-and-mapping.md`
- `docs/migration/phase-15d-shared-ui-foundation-plan.md`
- `docs/migration/phase-15e-shared-ui-foundation-implementation.md`
- `docs/migration/phase-15f-shell-theme-integration.md`
- `docs/migration/phase-15g1-pegawai-page-integration.md`
- `docs/migration/phase-15g2-ppk-ppspm-page-integration.md`
- `docs/migration/phase-15g3-archive-page-integration.md`
- `docs/migration/phase-15g4-kinerja-page-integration.md`
- `docs/migration/phase-15g5-admin-page-integration.md`
- `docs/migration/phase-15g6-profile-global-polish.md`

`docs/migration/_archive/` remains historical/superseded and was not used as current implementation authority.

## Files Inspected

Shell and shared UI:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/RoleDropdown.tsx`
- `src/components/layout/UserDropdown.tsx`
- `src/components/ui/AppDialog.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/AppToast.tsx`
- `src/components/ui/dialog.tsx`

Representative redesigned role/page surfaces:

- `src/components/pegawai/PegawaiPagePrimitives.tsx`
- `src/routes/pegawai.tsx`
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/$id/index.tsx`
- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/dokumen/$id/index.tsx`
- `src/routes/bendahara/inbox.tsx`
- `src/routes/bendahara/dokumen/$id.tsx`
- `src/components/archive/ArchivePagePrimitives.tsx`
- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/berkas/-components/CloseBerkasDialog.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/components/kinerja/KinerjaPagePrimitives.tsx`
- `src/routes/penanggung-jawab-kinerja/laporan-kinerja.tsx`
- `src/components/admin/AdminPagePrimitives.tsx`
- `src/routes/admin.index.tsx`
- `src/routes/admin.master-data.user.tsx`
- `src/routes/admin.master-data.kelengkapan.tsx`
- `src/routes/profile.tsx`

Additional admin presentation files were inspected after the touch-action scan found the same hover-only action pattern:

- `src/routes/admin.master-data.detail.tsx`
- `src/routes/admin.master-data.fungsi.tsx`
- `src/routes/admin.master-data.jenis-dokumen.tsx`
- `src/routes/admin.master-data.jenis.tsx`
- `src/routes/admin.master-data.kategori.tsx`
- `src/routes/admin.master-data.kegiatan.tsx`

## Files Changed

- `src/components/ui/dialog.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/RoleDropdown.tsx`
- `src/routes/admin.master-data.user.tsx`
- `src/routes/admin.master-data.kelengkapan.tsx`
- `src/routes/admin.master-data.detail.tsx`
- `src/routes/admin.master-data.fungsi.tsx`
- `src/routes/admin.master-data.jenis-dokumen.tsx`
- `src/routes/admin.master-data.jenis.tsx`
- `src/routes/admin.master-data.kategori.tsx`
- `src/routes/admin.master-data.kegiatan.tsx`
- `docs/migration/phase-15h-responsive-interaction-qa.md`

## Responsive Findings

- Shell layout uses full/static sidebar on large screens and hamburger/off-canvas drawer on tablet/mobile. Mobile drawer keeps full labels and does not introduce icon-only navigation.
- Shared role/page primitives generally use stacked mobile layouts, wrapped actions, desktop table shells with horizontal overflow, and mobile cards where the Phase 15G slice implemented a card alternative.
- Archive detail tabs use a horizontally scrollable tab strip.
- Kinerja table/card behavior intentionally switches at `lg`, keeping tablet portrait on metadata cards.
- Dialogs used the shared Base UI `DialogContent`, which lacked a viewport max-height and could make long modal actions difficult to reach on short/mobile screens.
- The notification popover was anchored to the bell icon. On narrow mobile widths, the bell is not the rightmost header control, so the popover could overflow horizontally.
- Compact role switching could show long labels such as `Kepala Sub Bagian Umum` inside a narrow header control without truncation.

## Interaction Findings

- Role and user dropdowns already have click-away overlays and no backend behavior changes.
- Notification popover remains visual-only and has no backend fetch, unread count, or realtime claim.
- Profile password modal preserves current-password, new-password, and confirmation-password fields.
- Admin Reset Password remains separate and does not require current/old password.
- Laporan Kinerja remains metadata-only and does not render preview, download, lampiran, file, export, or detail actions.
- Pegawai/PPK/PPSPM file actions still use existing `AttachmentViewer` ownership.
- Archive file/lifecycle behavior remains route-local and API-owned; the exact destruction phrase remains `MUSNAHKAN DATA FILE`.
- Several Admin Sistem table actions were visible only on hover/focus, which is weak for touch screens and tablet portrait QA.

## Fixes Applied

- Added `max-h-[calc(100dvh-2rem)]` and `overflow-y-auto` to shared `DialogContent` so dialogs can scroll within the viewport and actions remain reachable.
- Repositioned the header notification popover as a viewport-width fixed panel on mobile, while preserving the existing anchored dropdown behavior from `sm` upward.
- Truncated the compact role switcher label and kept the chevron from shrinking, reducing topbar collision risk on mobile/laptop widths.
- Made Admin Sistem row action buttons visible by default across master-data tables so touch users can discover edit/delete/reset actions without hover.

## Browser QA Status

No browser/dev-server inspection was performed in this pass because no browser inspection tool was available in the working session. Static responsive and interaction QA was performed against the current source, and automated validation was run.

Recommended human browser spot-check widths:

- 1440px desktop
- 1024px laptop/tablet landscape
- 768px tablet portrait
- 390px mobile

## Validation Performed

Validation performed:

- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm build`
- restore `src/routeTree.gen.ts` if build changes it
- repeat `git status --short --branch`
- repeat `git diff --check`
- repeat `git diff --name-only`
- protected-file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`

Results:

- Focused UI foundation test passed: 1 test file, 4 tests.
- `pnpm build` passed with existing third-party module-level `"use client"` warnings and circular `pg` chunk warning.
- `pnpm build` regenerated `src/routeTree.gen.ts`; it was restored with `git restore src\routeTree.gen.ts`.
- Final protected-file diff check was empty.
- `git diff --check` passed with Git line-ending normalization warnings only.

## Deferred Items

- Human/browser responsive review remains deferred.
- No E2E or Playwright responsive automation was added.
- Existing `window.confirm` usages remain where replacing them would be broader than Phase 15H QA polish.
- Profile photo persistence remains deferred; current Profile photo behavior is visual/local preview only.
- Real notification backend, unread counts, and realtime notification behavior remain backend-scoped future work.

## Guardrails Preserved

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state.
- Server/API RBAC remains authoritative.
- `ADMIN` remains a dedicated role and is not a substitute for operational roles.
- Profile change password still requires current password, new password, and confirmation password.
- Admin Reset Password remains separate and does not require current/old password.
- Notification UI remains visual-only.
- Laporan Kinerja remains metadata-only.
- AttachmentViewer behavior remains unchanged.
- Preview/download API paths and token behavior remain unchanged.
- Archive lifecycle transitions remain unchanged.
- Destructive typed confirmation phrase remains exactly `MUSNAHKAN DATA FILE`.
- Destroyed-file UX phrase remains exactly `Data file sudah dimusnahkan`.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

Not restored:

- `/arsiparis/aktif`
- `/arsiparis/search`
- `/arsiparis/arsip/$id`
- `/api/arsiparis/arsip/*`
- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`
- `/api/arsiparis/search`
- `Laporan Klasifikasi`
- global/sidebar `Cari Arsip`
- legacy canonical archive model: `arsip.arsip`, `lampiran_snapshot`, `canonical_arsip_id`

## Proposed Next Scope

Recommended next phase:

```text
Phase 15I - Final Frontend Integration Handoff
```

Suggested scope:

- record final frontend integration state;
- summarize Phase 15 responsive/browser retest needs;
- verify protected files and route tree remain clean;
- keep the handoff bounded to local/internal development evidence, not production/go-live/security certification.
