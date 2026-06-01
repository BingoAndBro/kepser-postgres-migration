# Phase 15F - Shell Theme Integration

Date: 2026-06-01

Status: implemented as bounded shell/theme integration. No route generation, package change, schema change, API change, auth/session/RBAC change, storage/file-access change, archive lifecycle change, prototype import, commit, or push is included.

## Authority Read

Current authority used:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-15abc-frontend-audit-prototype-policy-and-mapping.md`
- `docs/migration/phase-15d-shared-ui-foundation-plan.md`
- `docs/migration/phase-15e-shared-ui-foundation-implementation.md`

`docs/migration/_archive/` remains historical/superseded and was not used as current implementation authority.

## Files Changed

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/RoleDropdown.tsx`
- `src/components/layout/UserDropdown.tsx`
- `docs/migration/phase-15f-shell-theme-integration.md`

## Shell Visual Changes

- Integrated the warm cream/orange shell canvas around the authenticated layout.
- Kept main content on a warm cream background near `#FFF8F1`, with restrained orange radial warmth and no heavy decorative mesh/blobs for normal shell pages.
- Kept the sidebar distinct as a lighter ivory/off-white surface.
- Kept downstream page cards, tables, forms, and panels untouched for later role-page phases.
- Updated footer shell styling and labels without changing links, route registration, or backend behavior.

## Header Changes

- Reworked the topbar into a compact warm shell header.
- Added a mobile/tablet hamburger that opens the sidebar drawer.
- Kept the role title visible and added a `RoleBadge` display chip on wider screens.
- Removed the broad global header search input from the shell to avoid implying restored archive/global search authority.
- Removed the settings gear presentation from the header. Account behavior is exposed through `Profile`.
- Kept notification as a visual-only button with no unread count, no mock notification list, and no backend claims.

## Sidebar Changes

- Kept `NAV_CONFIG` as the navigation source.
- Kept current active-route matching behavior.
- Added responsive behavior:
  - large screens use a full/static sidebar;
  - mobile/tablet use a hamburger-controlled off-canvas drawer;
  - the mobile drawer shows full labels, not icon-only navigation.
- Did not add a risky desktop collapse state.
- Did not add routes or restore removed archive/search/report surfaces.
- Hid the unbuilt `settings` placeholder from rendered shell navigation so the shell does not present Settings as an account destination. The existing `Profile` route remains available.

## Role And User Dropdown Changes

- Kept role switching through the existing caller-owned `/auth/role-switch` flow.
- Kept logout through the existing caller-owned logout flow.
- Used Phase 15E `RoleBadge` for role/profile display consistency.
- Preserved canonical role labels:
  - `BENDAHARA` displays as `PPSPM`;
  - `KEPALA_SUB_BAGIAN_UMUM` displays as `Kepala Sub Bagian Umum`;
  - `ADMIN` remains a dedicated role display and is not presented as an operational substitute.

## AppToastProvider Decision

`AppToastProvider` is wired around the authenticated app shell only.

Rationale:

- It is a local React provider from Phase 15E.
- It does not fetch data, mutate auth state, register routes, or change API behavior.
- It only exposes a future caller-owned `showToast` context and renders an empty viewport until callers use it.
- Login and unauthenticated redirect states remain outside the provider.

## Boundaries Preserved

Unchanged:

- `dms_session` remains the auth boundary.
- `/auth/session` bootstrap remains in `AppLayout`.
- `dms_active_role` remains UX-only state.
- `/auth/role-switch` remains the role switch path.
- Server/API RBAC remains authoritative.
- `ADMIN` remains dedicated and is not a substitute for operational roles.
- Folder-first archive authority remains `berkas_arsip`, `berkas_arsip_item`, `dokumen_transaksi`, `manual_arsip`, and `manual_arsip_attachment`.
- Destroyed-file UX phrase remains `Data file sudah dimusnahkan` where applicable.
- Destructive typed confirmation phrase remains `MUSNAHKAN DATA FILE` where applicable.
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

## Prototype Reference Policy

Prototype files under `D:\Temp\dms-ai-studio-final` were used only through targeted `Select-String` inspection of visual shell concepts.

No prototype files were copied. No prototype source was imported. Prototype role switching, mock notifications, mock routing, mock data, package/config assumptions, and removed archive/search/report concepts were rejected.

## Validation Performed

Validation performed:

- `git status --short --branch`: expected shell/doc changes only after build-generated route tree restoration.
- `git diff --check`: passed. Git emitted line-ending normalization warnings only.
- `git diff --name-only`: shell files only; the new Phase 15F doc is untracked until commit.
- `pnpm test tests/unit/components/ui-foundation.test.ts`: passed, 1 test file and 4 tests.
- `pnpm build`: passed. Existing third-party bundler warnings about module-level `"use client"` directives and a circular `pg` chunk were emitted.
- `src/routeTree.gen.ts` changed during build and was restored with `git restore src\routeTree.gen.ts`.
- Protected file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`: empty.

## Known Deferred Items

- No role pages were redesigned in this phase.
- No page-local dialogs, filters, tables, cards, forms, file preview/download controls, or lifecycle confirmations were replaced.
- No real notification backend or notification list was introduced.
- No desktop sidebar collapse was added.
- No global search or archive search was introduced.

## Final Guardrails

- Do not treat this phase as production readiness, go-live approval, operational certification, security certification, or compliance validation.
- Do not claim Supabase is fully removed from the repository.
- Do not restore legacy canonical archive/search/report surfaces.
- Do not move authorization into client-only shell behavior.
- Do not commit generated route tree changes in this phase.

## Proposed Next Scope

Recommended next phase:

```text
Phase 15G.1 - Pegawai Shell-Compatible Page Integration
```

Suggested scope:

- Apply the warm shared UI direction to Pegawai dashboard, document list/detail, submission, revision, and report pages.
- Reuse Phase 15E state/badge/dialog primitives only where behavior remains caller-owned.
- Preserve existing Pegawai APIs, attachment behavior, authorization, and file-access handling.
