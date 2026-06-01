# Phase 15ABC - Frontend Audit, Prototype Policy, and Route Mapping

Date: 2026-06-01

Status: planning baseline for frontend redesign. This document preserves Phase 15A, Phase 15B, and Phase 15C findings. It is not UI implementation, not route generation, not shared component extraction, and not a prototype import.

## Phase Purpose

Phase 15C maps the current DMS route/page surface to the AI Studio prototype visual references so later frontend phases can rebuild the desired warm premium visual direction on top of the current TanStack Start application, current route files, current auth/RBAC boundaries, and current folder-first archive authority.

The prototype remains reference-only. Visual parity is a goal where safe; source-level parity is forbidden.

## Authority Documents

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`

`docs/migration/_archive/` contains historical or superseded docs and is not current implementation authority unless a future phase explicitly cross-checks it against the current authority set.

## Phase 15A Safety Baseline

Branch and repo state confirmed for this phase:

- Branch: `ui/prototype-redesign-v1`
- Git state before work: clean working tree, branch ahead of origin by 1 commit
- Git warning observed: user-level ignore file permission warning only
- No files were edited in Phase 15A or Phase 15B
- This Phase 15C document is the only allowed file change

Current frontend architecture:

- Framework: TanStack Start with TanStack React Router file routes
- Root route: `src/routes/__root.tsx`
- Shell: `src/components/layout/AppLayout.tsx`
- Header: `src/components/layout/AppHeader.tsx`
- Sidebar/navigation: `src/components/layout/AppSidebar.tsx` and `src/config/navigation.ts`
- Route constants/default role routes: `src/lib/constants/routes.ts`
- Role constants/display labels: `src/lib/constants/roles.ts`
- Route generation file `src/routeTree.gen.ts` must not be modified in this phase

Reusable UI findings from Phase 15A and current scan:

- Local UI primitives exist under `src/components/ui/*`, including button, card, dialog, input, select, table, badge, skeleton, avatar, and date-picker.
- No centralized toast foundation was found.
- Dialog/modal patterns are mixed: shared `Dialog`, hand-built modal overlays, and `window.confirm`.
- Status badges are fragmented, including `src/components/ui/StatusBadge.tsx` and page-local badge logic.
- Table, card, form, local search/filter, and CSV export patterns are page-local.
- `AttachmentViewer` and existing preview/download flows are active and must be protected.

Active vs forbidden surfaces:

- Active archive browser surfaces are `/arsiparis/berkas`, `/arsiparis/berkas/$id`, `/arsiparis/inaktif`, and `/arsiparis/usul-musnah`.
- Local archive filters and safe CSV exports are active on folder-first pages.
- No active forbidden legacy archive/search/report routes were found in `src` during Phase 15A/15C route scans.
- Header search is separate UI and is not archive authority. Global/sidebar `Cari Arsip` must not be restored.

Major integration risks:

- Shell replacement can break `dms_session` bootstrap, `dms_active_role` UX state, role switching, default role redirects, and route active-state behavior.
- Header search/notification/profile UI can accidentally imply backend search or notification authority that does not exist.
- File preview/download redesign can break destroyed-file handling or leak unsafe backend errors.
- Archive redesign can accidentally restore legacy canonical archive routes, APIs, or `arsip.arsip` assumptions.
- Admin/profile visual redesign can touch password/session revocation flows and destructive/admin actions.

## Phase 15B Prototype Inventory and Import Policy

Prototype export location:

```text
D:\Temp\dms-ai-studio-final
```

The export exists and is a standalone/generated prototype, not a source module for this repository. Top-level prototype artifacts include standalone app folders and generated/build assumptions:

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `.env.example`
- `app/`
- `workspace/`
- many mutation scripts such as `*.cjs` and `*.js`
- `src/` with generated/monolithic prototype components

Prototype files/folders that must never be copied:

- package metadata and lockfiles
- Vite/npm/Gemini configs
- `.env.example` or any env/config files
- mutation scripts
- `app/` and `workspace/`
- generated `src` files as source code
- prototype mock data or mock routing/state logic

Useful reference-only visual concepts:

- Warm cream/orange base direction, with content canvas near `#FFF8F1` where appropriate
- Lighter/off-white/ivory sidebar separated subtly from the main canvas
- White/off-white cards, panels, tables, and forms for contrast
- Compact dense table/card hybrids with stronger empty states
- Header notification/profile popovers as visual reference only
- Collapsible/mobile sidebar behavior as a future shell visual idea
- Confirmation modal and toast styling as candidates for shared UI planning
- Attachment preview modal visual treatment, but not its mock file behavior
- Archive folder timeline/detail visual treatment, but not its mock lifecycle/data behavior

Incompatible prototype assumptions:

- Lowercase roles such as `user`, `bendahara`, `arsiparis`, `kinerja`
- Mock role switching and client-only authorization
- Mock data arrays and hard-coded names/statuses
- Mock preview/download/toast success without server authorization
- Noncanonical statuses such as `INVALID`, `Archived`, `Terbuka`, `Ditutup`, and display-only lifecycle labels as data authority
- Monolithic role views such as `ArchivistView.tsx` and `AdminView.tsx`
- Generic `Settings` label instead of current `Profile`
- `Arsiparis` as primary user-facing label instead of `Kepala Sub Bagian Umum`
- Any implicit restoration of removed archive search/report/canonical surfaces

Import policy:

- Copy forbidden: do not copy prototype source, configs, package files, env files, scripts, app/workspace folders, or mock data.
- Reference-only: inspect prototype visuals and interaction patterns only.
- Manually rebuild later: rebuild selected UI on current route files, current APIs, current components, and current DMS terminology.
- Ignore entirely: prototype runtime, routing, package model, role switching, mock authorization, mock file access, mock data, and removed/superseded surfaces.

## Current Route and Navigation Inventory

Current route scan found 151 route files under `src/routes`: 63 `.tsx` UI route files and 88 API route files.

Route groups observed:

- Root/shell/global: `__root.tsx`, `index.tsx`, `login.tsx`, `profile.tsx`, `forbidden.tsx`
- Pegawai: `src/routes/pegawai/**` and legacy redirects under `src/routes/dokumen/**`
- PPK: `src/routes/ppk/**`
- PPSPM internal namespace: `src/routes/bendahara/**`, preserving internal role value `BENDAHARA`
- Kepala Sub Bagian Umum archive namespace: `src/routes/arsiparis/**`
- Penanggung Jawab Kinerja: `src/routes/penanggung-jawab-kinerja/**`
- Admin: flat file routes `src/routes/admin*.tsx`
- Active APIs under `src/routes/api/**`

Navigation and role authority:

- `src/config/navigation.ts` is the active sidebar source.
- `src/lib/constants/routes.ts` defines active route constants and role default routes.
- `src/lib/constants/roles.ts` defines canonical role values and display labels.
- `BENDAHARA` internal enum remains unchanged and displays as `PPSPM`.
- `KEPALA_SUB_BAGIAN_UMUM` displays as `Kepala Sub Bagian Umum`.
- `PENANGGUNG_JAWAB_KINERJA` defaults to `/penanggung-jawab-kinerja/laporan-kinerja`.
- Some navigation items are unbuilt UX placeholders with no `to`, such as Activity Log and Settings. Later phases should use `Profile`, not `Settings`, and must not invent backend routes for placeholders.

## Phase 15C Mapping Matrix

| Current DMS area | Current route/page | Current repo file(s) | Role owner | Current data/API/source authority | Prototype reference file/section | Allowed visual ideas | Forbidden prototype assumptions | Existing repo components/helpers to reuse/protect | Risk | Later phase | Target classification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| App shell/root layout | all authenticated pages | `src/routes/__root.tsx`; `src/components/layout/AppLayout.tsx` | all authenticated roles | `/auth/session`; `/auth/role-switch`; `dms_session`; UX-only `dms_active_role`; `ROLE_DEFAULT_ROUTE` | `src/components/layout/Header.tsx`; `Sidebar.tsx` | warm canvas, ivory shell, responsive header/sidebar, mobile drawer, restrained collapse | mock role switching, lowercase roles, client-only auth, generated routing | `AppLayout`, `AppHeader`, `AppSidebar`, `RoleDropdown`, `UserDropdown`, auth-state helpers | High | 15E shell redesign after 15D foundation | Visual-only rebuild |
| Header/topbar | global header | `src/components/layout/AppHeader.tsx` | all authenticated roles | current session/user/role props from `AppLayout`; no archive search authority | `layout/Header.tsx` notification/profile/header controls | compact warm topbar, avatar/profile menu, notification popover shell | fake notifications as authoritative data, global archive search, role switch without server API | `apiMutation('/auth/role-switch')`; `ROLE_DISPLAY`; `UserDropdown`; `RoleDropdown` | High | 15E | Shared primitive candidate |
| Sidebar/navigation | global sidebar | `src/components/layout/AppSidebar.tsx`; `src/config/navigation.ts`; `src/lib/constants/routes.ts` | active role | `NAV_CONFIG`, role defaults, current route constants | `layout/Sidebar.tsx` | ivory sidebar, active nav pill, mobile drawer, optional future collapse | prototype tab router, `Arsiparis` primary label, `Settings`, `Cari Arsip`, removed routes | `NAV_CONFIG`; `ROUTES`; `ROLE_DISPLAY`; active route matching | High | 15E | Visual-only rebuild |
| Profile/account | `/profile` | `src/routes/profile.tsx` | all authenticated roles | `/users/me/`; `/api/users/me/change-password`; session revocation after password change | `roles/ProfileView.tsx` | profile card, password modal styling, avatar visual treatment, toast candidate | fake photo upload, keeping session after password change, exposing password errors/secrets | `apiFetch`, `apiMutation`, `clearClientAuthState`, local `Input/Card/Button` | Medium | 15I or 15F | Visual-only rebuild |
| Notification dropdown/popover | header notification placeholder | `src/components/layout/AppHeader.tsx` | all authenticated roles | no current backend notification source found | `layout/Header.tsx` notification popover | visual-only popover shell, unread dot, empty state | mock notifications as real workflow state, new API assumptions | future `AppPopover/AppToast` only after 15D | Medium | 15D then 15E | Deferred as backend-scoped work |
| Pegawai dashboard | `/pegawai` | `src/routes/pegawai.tsx`; dashboard components | `PEGAWAI` | role guard; dashboard shell/static role summary | `roles/UserView.tsx`; `workflow/ReportListView.tsx` | warm dashboard cards, compact task summary | mock counts/statuses, lowercase `user` role | `DashboardShell`, `StatsBento`, `PageLayout` | Medium | 15F | Visual-only rebuild |
| Pegawai Ajukan Dokumen | `/pegawai/dokumen/aju` | `src/routes/pegawai/dokumen/aju.tsx`; `src/components/dokumen/form/*`; `AttachmentEditor`; `FileUploadButton` | `PEGAWAI` | master data APIs; `/users/me/is-ketua-tim/$id`; `/api/dokumen/submit`; upload helpers | `roles/SubmitReportView.tsx` | stepper density, material/non-material cards, confirm submit modal, upload panel styling | prototype generated filename logic, mock upload, mock Ketua Tim inference, noncanonical data | `Step*` form components, `AttachmentEditor`, Zod/API validation, submit bridge | High | 15G after 15D | Visual-only rebuild |
| Pegawai Revisi Dokumen | `/pegawai/revisi`; `/pegawai/dokumen/$id/revisi` | `src/routes/pegawai/revisi.tsx`; `src/routes/pegawai/dokumen/$id/revisi.tsx` | `PEGAWAI` | `/pegawai/revisi`; `/api/dokumen/$id`; update/resubmit helpers | `roles/ReviseReportView.tsx`; `workflow/InboxView.tsx` | revision summary, required-doc checklist visual, confirm/resubmit modal | mock revision routing, mock preview/download, fake success toasts | `AttachmentEditor`; `matchesCurrentChain`; existing API mutations | High | 15G | Visual-only rebuild |
| Pegawai Dokumen Diajukan/list | `/pegawai/dokumen`; `/pegawai/dokumen/$id` | `src/routes/pegawai/dokumen/index.tsx`; `src/routes/pegawai/dokumen/$id/index.tsx` | `PEGAWAI` | `/auth/session`; `/dokumen`; `/api/dokumen/$id`; document file APIs | `workflow/InboxView.tsx`; `workflow/DocumentDetailView.tsx`; `workflow/ReportListView.tsx` | filter toolbar, responsive table/card, status badges, detail panels | prototype statuses such as `INVALID`; mock file actions | `AttachmentViewer`, `ActivityLog`, current status constants | High | 15G | Visual-only rebuild |
| Pegawai Laporan Saya/Kegiatan | `/pegawai/laporan/saya`; `/pegawai/laporan/kegiatan` | `src/routes/pegawai/laporan/saya.tsx`; `src/routes/pegawai/laporan/kegiatan.tsx`; `src/components/laporan/HierarchicalFilter.tsx` | `PEGAWAI`, Ketua Tim assignment for kegiatan page | `/laporan/saya`; `/laporan/kegiatan`; `/users/me`; `/users/me/ketua-tim` | `workflow/ReportListView.tsx` | advanced filter panel, active filter chips, dense report table/card | export/detail/preview additions unless scoped, mock activity aggregation | `HierarchicalFilter`, safe laporan DTOs | Medium | 15F or 15G | Shared primitive candidate |
| PPK dashboard/inbox/detail | `/ppk`; `/ppk/inbox`; `/ppk/dokumen/$id`; `/ppk/tervalidasi`; `/ppk/ditolak`; `/ppk/revisi`; `/ppk/dokumen/$id/resubmit` | `src/routes/ppk/**` | `PPK` | `/ppk/inbox`; `/ppk/dokumen/$id`; approve/reject/resubmit APIs; PPK preview/download APIs | `roles/PPKView.tsx`; `workflow/InboxView.tsx`; `workflow/DocumentDetailView.tsx` | inbox table/card, approve/reject modal styling, status timeline | mock approval, mock download, fake roles/statuses | `AttachmentViewer apiType="ppk"`; PPK API routes; `PageLayout`; current confirm/reject rules | High | 15G | Visual-only rebuild |
| PPSPM dashboard/inbox/detail | `/bendahara`; `/bendahara/inbox`; `/bendahara/dokumen/$id`; `/bendahara/ditolak`; `/bendahara/selesai` | `src/routes/bendahara/**` | `BENDAHARA` displayed as `PPSPM` | `/bendahara/inbox`; `/bendahara/dokumen/$id`; approve/reject APIs; PPSPM preview/download APIs | `roles/TreasurerView.tsx`; `workflow/InboxView.tsx`; `workflow/DocumentDetailView.tsx` | approval queue layout, PPSPM action footer, reject modal styling | user-facing `Bendahara` label where PPSPM is required; mock financial approval | `AttachmentViewer apiType="bendahara"`; `ROLE_DISPLAY.BENDAHARA` | High | 15G | Visual-only rebuild |
| Kepala Sub Bagian Umum dashboard/archive entry | `/arsiparis` | `src/routes/arsiparis/index.tsx` | `KEPALA_SUB_BAGIAN_UMUM` | `/auth/session`; `/arsiparis/inbox`; `/arsiparis/berkas` filtered stats | `roles/ArchivistView.tsx` dashboard/archive summary sections | archive stat cards, warm page header | `Arsiparis` as primary label, mock lifecycle counts | `DashboardShell`, folder-first API queries | Medium | 15H | Visual-only rebuild |
| Pengklasifikasian Dokumen | `/arsiparis/inbox`; `/arsiparis/dokumen/$id` | `src/routes/arsiparis/inbox.tsx`; `src/routes/arsiparis/dokumen/$id/index.tsx` | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/inbox`; `/api/arsiparis/dokumen/$id`; `/api/arsiparis/dokumen/$id/archive`; `dokumen_transaksi`; `berkas_arsip_item` | `roles/ArchivistView.tsx` `Pengklasifikasian Dokumen` sections | queue cards, classification detail form, attachment visual controls | writing `arsip.arsip`, closed berkas eligibility bypass, mock classification data | folder-first archive API; current eligibility rules; file access helpers | High | 15H | Visual-only rebuild |
| Penambahan Dokumen | `/arsiparis/penambahan-arsip` route, user-facing label `Penambahan Dokumen` | `src/routes/arsiparis/penambahan-arsip.tsx` | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/manual-arsip`; `/arsiparis/manual-arsip/categories`; `/arsiparis/klasifikasi?eligible_for_berkas=true`; manual attachment APIs; `manual_arsip`; `manual_arsip_attachment`; `berkas_arsip_item` | `roles/ArchivistView.tsx` `renderPenambahanDokumen` | guided classification picker, manual attachment rows, preview modal style | `Penambahan Arsip` label, ineligible closed berkas selection, mock download | current manual archive API; attachment URL builder; safe preview/download IDs | High | 15H | Visual-only rebuild |
| Pemberkasan Arsip Aktif | `/arsiparis/berkas` | `src/routes/arsiparis/berkas/index.tsx`; `CloseBerkasDialog.tsx`; `src/lib/archive/berkas-arsip-csv.ts` | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/berkas`; `berkas_arsip`; `berkas_arsip_item`; safe DTOs; CSV helper | `roles/ArchivistView.tsx` folder list/Pemberkasan sections | split open/active sections, folder cards/table, local search, CSV button, close modal styling | `/arsiparis/aktif`, legacy canonical active list, global archive search | `CloseBerkasDialog`; `createBerkasFolderListCsv`; local filter functions | High | 15H | Visual-only rebuild |
| Folder detail | `/arsiparis/berkas/$id` | `src/routes/arsiparis/berkas/$id.tsx` | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/berkas/$id`; `/items`; `/close`; `/lifecycle`; item preview/download APIs | `roles/ArchivistView.tsx` `renderFolderDetail` | timeline, metadata panels, item table/card, lifecycle action placement | `/arsiparis/arsip/$id`, edit lifecycle beyond current policy, mock file actions | folder-first membership revalidation; destroyed-file copy; CSV helper; close dialog | High | 15H | Visual-only rebuild |
| Arsip Inaktif | `/arsiparis/inaktif` | `src/routes/arsiparis/inaktif/index.tsx`; `src/lib/archive/berkas-arsip-csv.ts` | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/berkas?status_berkas=CLOSED&status_arsip=INAKTIF`; lifecycle API | `roles/ArchivistView.tsx` archive list `Inaktif` | local search, export, lifecycle action button, folder cards | legacy `/api/arsiparis/inaktif`, canonical list API, global search | `createBerkasFolderListCsv`; folder-first lifecycle API | High | 15H | Visual-only rebuild |
| Usul Musnah | `/arsiparis/usul-musnah` | `src/routes/arsiparis/usul-musnah/index.tsx`; `src/lib/archive/berkas-arsip-page-format.ts`; CSV helper | `KEPALA_SUB_BAGIAN_UMUM` | `/arsiparis/berkas?status_arsip=USUL_MUSNAH`; `/arsiparis/berkas/$id/lifecycle`; physical deletion summary from server action | `roles/ArchivistView.tsx` archive list `Usul Musnah` and lifecycle confirm modal | destructive confirmation modal visual, warning copy layout, local search/export | general `Dimusnahkan` list, physical deletion button/page, wrong confirmation phrase | `BERKAS_DESTRUCTION_CONFIRMATION_PHRASE`; safe physical deletion summary; CSV helper | High | 15H | Visual-only rebuild |
| Folder lifecycle confirmations | close, inaktif, usul musnah, musnahkan | `src/routes/arsiparis/berkas/$id.tsx`; `src/routes/arsiparis/inaktif/index.tsx`; `src/routes/arsiparis/usul-musnah/index.tsx`; `CloseBerkasDialog.tsx` | `KEPALA_SUB_BAGIAN_UMUM` | folder lifecycle `OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN`; API RBAC | `roles/ArchivistView.tsx` `renderLifecycleConfirmModal`; `renderTutupModal` | consistent modal shell and warning hierarchy | wrong labels `Musnahkan Arsip`, missing exact phrase, reversible lifecycle implication | `CloseBerkasDialog`; lifecycle API; exact typed confirmation `MUSNAHKAN DATA FILE` | High | 15D then 15H | Shared primitive candidate |
| Preview/download UX | document and folder item preview/download | `src/components/dokumen/AttachmentViewer.tsx`; route-specific file APIs; archive item preview/download routes | current role per route | `/api/dokumen/*`; `/api/ppk/dokumen/*`; `/api/bendahara/dokumen/*`; `/api/arsiparis/berkas/$id/items/*`; `/api/files/access`; current storage guards | `workflow/DocumentDetailView.tsx`; `roles/SubmitReportView.tsx`; `roles/ReviseReportView.tsx`; `roles/ArchivistView.tsx` preview modals | polished attachment list, preview modal header/footer, download button states | fake file blobs, direct paths, arbitrary backend error display, mock success toast | `AttachmentViewer`; `storage-client`; destroyed-file allowlist `Data file sudah dimusnahkan` | High | 15D then 15G/15H | Shared primitive candidate |
| Local search/filter/CSV UX | page-local filters and exports | many route files; archive CSV helpers | page owner role | safe page DTOs only; folder-first CSV helpers; no raw IDs/paths/tokens | `workflow/ReportListView.tsx`; `workflow/InboxView.tsx`; `roles/AdminView.tsx`; `roles/ArchivistView.tsx` | reusable search toolbar, mobile filter bar, active filter chips, CSV button | global/sidebar archive search, unsafe CSV columns, server search route resurrection | `berkas-arsip-csv.ts`; page-local filters; `HierarchicalFilter` | Medium | 15D | Shared primitive candidate |
| Penanggung Jawab Kinerja dashboard/report | `/penanggung-jawab-kinerja`; `/penanggung-jawab-kinerja/laporan-kinerja` | `src/routes/penanggung-jawab-kinerja/index.tsx`; `src/routes/penanggung-jawab-kinerja/laporan-kinerja.tsx` | `PENANGGUNG_JAWAB_KINERJA` | `/laporan/kinerja`; metadata-only final docs; no preview/download/export/detail | `workflow/PerformanceReportView.tsx`; `workflow/ReportListView.tsx` | report summary cards, metadata table/card density | ADMIN inheritance, preview/download/export, non-final statuses | RBAC requiring assigned role; safe DTO only | Medium | 15F | Visual-only rebuild |
| Admin dashboard | `/admin` | `src/routes/admin.index.tsx` | `ADMIN` only | `/auth/session`; dedicated admin role check | `roles/AdminView.tsx` dashboard section | admin summary cards, management landing layout | ADMIN as substitute for operational roles, mock cross-role actions | admin route guard, `ROLES.ADMIN` | Medium | 15I | Visual-only rebuild |
| Admin Master User | `/admin/master-data/user` | `src/routes/admin.master-data.user.tsx` | `ADMIN` only | `/api/users/**`; `/api/ketua-tim/**`; password reset; activate/deactivate | `roles/AdminView.tsx` Master User, user modal, reset password modal | dense user table/cards, role badges, reset modal visual | mock users, password printing, client-only conflict resolution | `Dialog`, `Input`, `Button`; server APIs; session revocation behavior | High | 15I after 15D | Visual-only rebuild |
| Admin Master Data | `/admin/master-data/fungsi`; `/kegiatan`; `/jenis`; `/jenis-dokumen`; `/kategori`; `/detail` | `src/routes/admin.master-data.*.tsx` | `ADMIN` only | `/master-fungsi`; `/master-kegiatan`; `/master-jenis`; `/master-jenis-dokumen`; `/master-kategori`; `/master-detail` | `roles/AdminView.tsx` master data sections and generic modals | unified master-data table/card, filters, add/edit/delete dialogs | mock data, client-only persistence, unsafe deletes beyond current APIs | local UI primitives; existing apiFetch/apiMutation contracts | Medium | 15I | Shared primitive candidate |
| Admin Kelengkapan Dokumen | `/admin/master-data/kelengkapan` | `src/routes/admin.master-data.kelengkapan.tsx` | `ADMIN` only | `/master-kelengkapan`; master hierarchy APIs | `roles/AdminView.tsx` Kelengkapan Dokumen hierarchy-first selection | hierarchy-first selector, split Ketua Tim/Anggota panels, modal visual | prototype-only hierarchy assumptions, new schema/contracts | existing kelengkapan API and form constraints | High | 15I or backend-scoped if contract changes needed | Visual-only rebuild |

If a current page is not listed above, later phases should verify it from `src/routes` and `src/config/navigation.ts` before redesigning. Do not invent pages from prototype tabs.

## Prototype Concepts to Ignore Entirely

- Standalone app bootstrap, Vite/npm config, generated scripts, mutation scripts, and workspace/app folders
- Prototype role switcher as authorization or routing logic
- Prototype mock users, mock documents, mock folder records, and mock lifecycle history
- Prototype fake preview/download behavior and automatic success toasts
- Prototype `Activity Log` as a real route unless a later backend phase scopes it
- Prototype notification data as real workflow notification data
- Prototype general `Dimusnahkan` list or any separate physical deletion UI
- Any prototype model that treats `arsip.arsip`, `lampiran_snapshot`, or `canonical_arsip_id` as active archive authority

## Removed DMS Surfaces Never to Restore

Do not restore, recommend restoring, or treat as active:

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
- legacy canonical archive model:
  - `arsip.arsip`
  - `lampiran_snapshot`
  - `canonical_arsip_id`

Current archive authority remains:

- `berkas_arsip`
- `berkas_arsip_item`
- `dokumen_transaksi`
- `manual_arsip`
- `manual_arsip_attachment`

## Prototype Names and Labels Requiring Translation

- `bendahara` route/role references may map to internal `BENDAHARA`, but user-facing label should be `PPSPM`.
- `arsiparis` namespace remains in URLs for compatibility, but user-facing label should be `Kepala Sub Bagian Umum`.
- `Settings` should be `Profile` if it points to account/profile behavior.
- `Penambahan Arsip` should be `Penambahan Dokumen`.
- `Nomor Surat` must not be introduced for new UI. Use `Nomor SPM` only for final archive/folder metadata at close/finalization.
- Lowercase role values must be translated to canonical role values before any UI rebuild planning.

## High-Risk Mappings

- Shell/header/sidebar: preserve `dms_session`, UX-only `dms_active_role`, server role switching, and current role defaults.
- Preview/download/AttachmentViewer: preserve authorization, signed-token internals, folder-first destroyed guards, and exact destroyed-file phrase `Data file sudah dimusnahkan`.
- Folder-first archive pages: preserve `berkas_arsip` and `berkas_arsip_item` authority; do not restore old canonical archive routes or APIs.
- Lifecycle confirmations: preserve exact typed confirmation `MUSNAHKAN DATA FILE`; do not add separate physical deletion button/page.
- Admin user/password flows: preserve server-side password handling and session revocation; do not print or expose secrets.
- Local search/filter/CSV: keep page-local and safe DTO-only; do not restore global/sidebar archive search.

## Recommended Phase 15D Scope

Phase 15D should be:

```text
Phase 15D - Shared UI Foundation Plan
```

Recommended character:

- planning-only unless explicitly changed later
- no runtime/source edits unless separately approved
- no route generation
- no package changes
- decide shared component contracts before shell/page integration

Recommended shared component targets:

- `AppToast`
- `AppDialog` / `ConfirmDialog`
- `StatusBadge`
- `RoleBadge`
- `PageHeader`
- `BackButton`
- `ResponsiveCardList`
- `MobileFilterBar`
- `FilePreviewButton`
- `FileDownloadButton`
- `AttachmentList`
- `SearchFilterToolbar`
- `CsvExportButton`
- `DatePicker` wrapper if needed

Recommended implementation order for later phases:

1. Phase 15D planning: component inventory, contracts, variants, accessibility requirements, and risk boundaries.
2. Phase 15E shell/theme planning or integration, depending on approved scope.
3. Phase 15F shell/design-token integration.
4. Phase 15G role-page integration by slice:
   - 15G.1 Pegawai
   - 15G.2 PPK/PPSPM
   - 15G.3 Kepala Sub Bagian Umum / Archive
   - 15G.4 Penanggung Jawab Kinerja
   - 15G.5 Admin
   - 15G.6 Profile/notification/global polish
5. Phase 15H responsive and interaction QA.
6. Phase 15I final integration handoff.

Risks to resolve before shell/page integration:

- Decide whether toast foundation is visual-only first or wired to existing API outcomes in the same phase.
- Replace `window.confirm` only after `ConfirmDialog` contract covers destructive and non-destructive confirmations.
- Define canonical `StatusBadge` coverage for document status, folder status, archive lifecycle, and role badges without using prototype-only statuses.
- Define file action button contracts that can display `Data file sudah dimusnahkan` only for the allowlisted backend response.
- Define local search/filter toolbar behavior without adding global archive search or new backend search APIs.
- Decide whether notification popover is an empty/presentational shell or deferred entirely until backend notification authority exists.

## Final Implementation Guardrails

- Do not copy prototype files.
- Do not import prototype source.
- Do not install packages.
- Do not modify package/env/schema/migration/routeTree files.
- Do not modify auth/session/RBAC/storage/file-access/archive lifecycle logic.
- Do not reintroduce Supabase runtime/package dependencies.
- Correct Supabase wording remains: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."
- Do not claim production ready, go-live approved, fully secure, operational certification, security certification, compliance validation, or full Supabase repository removal.
- Preserve server/API RBAC as authoritative.
- Preserve `dms_session` as auth boundary.
- Preserve `dms_active_role` as UX-only state.
- Preserve `ADMIN` as a dedicated role, not a substitute for operational roles.
- Preserve folder-first archive authority and destroyed-file UX.
- Future visual work should keep the warm premium cream/orange direction without excessive decorative blob/mesh/gimmick backgrounds.
