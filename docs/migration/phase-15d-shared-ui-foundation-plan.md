# Phase 15D - Shared UI Foundation Plan

Date: 2026-06-01

Status: planning-only shared UI foundation. No runtime/source implementation, shell integration, design-token integration, route/page redesign, prototype import, route generation, package change, schema change, or API change is included.

## Purpose And Non-Goals

Phase 15D defines the shared UI component foundation that later Phase 15 implementation slices should use before redesigning shell or pages. It inventories current shared components, identifies reusable candidates, defines contracts and boundaries, records accessibility/responsive requirements, and recommends implementation order.

Non-goals:

- No UI implementation or component refactor.
- No edits under `src/`.
- No shell/header/sidebar integration.
- No design-token integration.
- No route/page redesign.
- No prototype source import, copied files, or copied mock data.
- No route generation.
- No package, env, schema, migration, auth/session/RBAC, storage/file-access, or archive lifecycle changes.
- No commit or push.

## Authority Documents

Current authority read for this plan:

- `AGENTS.md`
- `docs/migration/README.md`
- `docs/migration/phase-15-frontend-redesign-starting-context.md`
- `docs/migration/phase-14k-final-folder-first-archive-regression-handoff.md`
- `docs/migration/phase-15abc-frontend-audit-prototype-policy-and-mapping.md`

`docs/migration/_archive/` is historical/superseded and is not current implementation authority unless a later phase explicitly cross-checks it against the active authority set.

## Current Shared UI Inventory Summary

Existing low-level UI primitives:

- `src/components/ui/button.tsx`: Base UI button wrapper with variants `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` and sizes including icon sizes.
- `src/components/ui/dialog.tsx`: Base UI dialog primitives with overlay, content, title, description, footer, close button.
- `src/components/ui/badge.tsx`: generic badge primitive with variant classes.
- `src/components/ui/StatusBadge.tsx`: current shared document status badge, but it is stale because it uses `IN_REVIEW` and English labels rather than the current DMS status set and terminology.
- `src/components/ui/table.tsx`: table primitives with horizontal overflow wrapper.
- `src/components/ui/card.tsx`: card primitives with header/content/footer/action slots.
- `src/components/ui/input.tsx`, `select.tsx`, `label.tsx`, `avatar.tsx`, `skeleton.tsx`, `date-picker.tsx`: basic form/display primitives.

Existing layout components:

- `src/components/layout/AppLayout.tsx`: owns session bootstrap through `/auth/session`, client auth state, `dms_active_role` UX state, role switching through `/auth/role-switch`, logout, role defaults, and shell composition.
- `src/components/layout/AppHeader.tsx`: renders role display, header search input, notification/settings icon buttons, role dropdown, and user dropdown.
- `src/components/layout/AppSidebar.tsx`: reads `NAV_CONFIG`, active role, pathname, query string, and Ketua Tim assignment visibility.
- `RoleDropdown.tsx` and `UserDropdown.tsx`: current role/account menus.

Existing document and attachment components:

- `AttachmentViewer.tsx`: current document attachment display/preview/download/edit wrapper for Pegawai, PPK, and PPSPM-facing Bendahara APIs.
- `AttachmentEditor.tsx`, `FileUploadButton.tsx`, `KelengkapanChecklist.tsx`, document form step components, `StepIndicator.tsx`, `ActivityLog.tsx`, and `ReviewSummary.tsx`: workflow-specific components that should mostly remain domain-specific for now.

Existing report/filter components:

- `src/components/laporan/HierarchicalFilter.tsx`: page-level hierarchical filter that fetches master data and emits filter values for laporan pages.
- Archive folder-first pages implement local search and CSV export page-locally using safe DTOs and `src/lib/archive/berkas-arsip-csv.ts`.

Other shared areas:

- `src/components/dashboard/*` includes `DashboardShell`, `PageLayout`, and `StatsBento`, which are useful references but are role/dashboard-specific rather than general UI foundation.

## Duplication And Gap Analysis

| Area | Current pattern | Gap / duplication | Phase 15D conclusion |
|---|---|---|---|
| Toast/notification | No shared toast component found in current repo; prototype has local mock toasts. | Alerts and inline errors are inconsistent; prototype toasts imply fake success if copied. | Plan `AppToast` as display-only outcome messaging, wired only to existing results later. |
| Dialog/confirm | Shared `Dialog` exists, but pages also use hand-built modals and `window.confirm`. | Confirm copy, destructive states, typed confirmation, and focus behavior are duplicated. | Build `AppDialog` and `ConfirmDialog` wrappers first; keep domain modals page-local until contracts are proven. |
| Status/role badge | Generic `Badge` exists; shared `StatusBadge` is stale; many page-local status/archive/source badges exist. | Risk of prototype-only statuses and English labels entering current UI. | Replace with canonical `StatusBadge` strategy and add `RoleBadge`; keep source-specific labels constrained to allowed values. |
| Attachment/file actions | `AttachmentViewer` handles document APIs; archive folder item file actions are page-local. | File buttons need consistent states without changing authorized APIs or exposing backend internals. | Plan `FilePreviewButton`, `FileDownloadButton`, and `AttachmentList` as thin UI wrappers around current call sites only. |
| Table/card responsive lists | Tables and mobile card layouts are repeated across role and archive pages. | Responsive behavior varies; mobile filters and empty states are page-local. | Add `ResponsiveCardList`, `MobileFilterBar`, and state components after badge/dialog foundations. |
| Search/filter/export | Local filters exist on pages; CSV helpers are archive-specific and safe DTO-bound. | Similar toolbar shapes are duplicated; global/sidebar archive search must not return. | `SearchFilterToolbar` and `CsvExportButton` must be page-local data only, not a new backend search/export authority. |
| Date picking | `DatePicker` exists for form step date selection; reports use native date inputs. | Styling and positioning may need normalization, but behavior is already adequate. | Keep existing wrapper; only refine later if needed for accessibility/responsive consistency. |
| Empty/loading/error | `Skeleton` exists; empty/loading/error states are mostly page-local text blocks. | Inconsistent spacing, icons, and retry affordances. | Plan `EmptyState`, `LoadingState/Skeleton`, and `ErrorState` as non-domain wrappers with caller-owned messages/actions. |
| Forms | Form sections are page-specific with repeated label/control/help/error structure. | Shared layout could reduce visual duplication. | Plan `FormSection`/`FieldGroup`; no validation behavior or API behavior inside. |
| Metrics | `StatsBento` and page-local summary cards exist. | Dashboard cards vary by route. | Plan `MetricCard`/`StatsCard` as presentation-only primitives; keep role count logic in pages. |

## Shared UI Foundation Table

| Component candidate | Current repo status | Proposed responsibility | Proposed variants / states | Data/API boundary | Accessibility requirements | Responsive requirements | DMS-specific rules | Prototype inspiration allowed | Prototype assumptions forbidden | Implementation risk | Recommended implementation phase | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AppToast | Absent. Current flows use alerts, inline messages, or page state. | Display already-known success/error/info/download outcomes. | `success`, `error`, `info`, `warning`, `download`; dismissible; timed; persistent optional. | Must not call APIs or invent success; callers pass sanitized messages. | `role="status"` for neutral/success, `role="alert"` for errors; keyboard dismiss; no secret text. | Stack at top/right desktop, bottom/safe-area mobile; avoid covering action bars. | May display `Data file sudah dimusnahkan` only when returned by allowlisted file access handling. | Warm bordered toast shell, icon, concise subtext. | Fake success for uploads/downloads, mock workflow notifications, arbitrary backend error display. | Medium. | 15E foundation before shell/page work. | First shared component candidate if implementation starts with feedback primitives. |
| AppDialog | `Dialog` primitives exist. | Standard visual shell around Base UI dialog primitives. | Small, medium, large, full-height mobile; close button on/off. | No API behavior; children own data and actions. | Focus trap, labelled title, description support, Escape/overlay behavior intentional. | Width maxes by variant; mobile uses safe padding and scroll body. | Must not weaken destructive confirmation rules. | Warm header/footer treatment, compact modal surfaces. | Hand-copied prototype modal code or motion dependencies. | Low-medium. | 15E foundation. | Wrap existing `Dialog` rather than replace primitive. |
| ConfirmDialog | Mixed `Dialog` and `window.confirm`. | Reusable non-destructive/destructive confirmation with caller-owned action. | `default`, `warning`, `destructive`; optional typed phrase; pending/disabled. | Calls only caller callback; no route/API assumptions. | Title/description required; destructive action must be explicit; typed input labelled. | Full-width stacked buttons on mobile; stable footer. | Must support exact phrase `MUSNAHKAN DATA FILE` for destruction flows. | Confirmation visual hierarchy and warning panels. | Missing typed confirmation, reversible lifecycle implication, fake destructive backend behavior. | High. | 15E, before replacing `window.confirm`. | Should cover unsaved/no-change confirmations later without changing hooks in Phase 15D. |
| DestructiveActionModal | Page-local destruction dialogs exist. | Specialized configuration of `ConfirmDialog` for destructive domain actions. | Typed phrase, warning summary, pending summary, disabled until exact match. | Caller owns mutation and response handling. | Clear irreversible destructive copy; no ambiguous primary action. | Mobile keyboard must not hide confirm input/actions. | `Musnahkan Data` requires `MUSNAHKAN DATA FILE`; must state status becomes `Dimusnahkan`, associated physical files are deleted, preview/download/file access is unavailable after destruction, and metadata remains. | Destructive modal warning layout. | Separate physical deletion page/button, general Dimusnahkan list, wrong phrase, or copy that describes destruction as access blocking only. | High. | 15G.3 after `ConfirmDialog`. | Do not create as standalone until archive pages are touched. |
| LifecycleActionDialog | Lifecycle confirmations are page-local; non-destructive paths use `window.confirm`. | Shared shell for archive folder lifecycle confirmations. | `to-inaktif`, `to-usul-musnah`, `to-dimusnahkan`; optional physical deletion summary. | Uses existing folder-first lifecycle API only through caller. | Status transition copy must be explicit; typed input only where required. | Works in list rows and detail pages. | Folder authority is `berkas_arsip`/`berkas_arsip_item`; no legacy canonical archive. | Timeline/action modal polish. | Restoring old lifecycle APIs or using `arsip.arsip`. | High. | 15G.3. | Keep page-local until archive slice starts. |
| StatusBadge | Generic `Badge` exists; current shared `StatusBadge` is stale. | Canonical badge for document status, folder status, archive lifecycle, and optional source type via explicit kind. | `document`, `berkas`, `archiveLifecycle`, `source`; neutral/info/warning/success/destructive visuals. | Pure display; accepts only canonical values or safe fallback label. | Text not color-only; visible label; no abbreviation without title where needed. | Wrap or shrink safely in tables/cards. | Must include current statuses; no prototype-only statuses; `DIMUSNAHKAN` visibly blocks file access context. | Warm but readable colored pills. | `IN_REVIEW`, `Archived`, `Terbuka`/`Ditutup` as data authority, English canonical labels. | High. | 15E foundation. | First badge refactor candidate. |
| RoleBadge | Absent; role badges are page-local. | Display canonical role labels. | Role color variants plus compact/full wording. | Pure display from `RoleName` constants. | Full label available via text/title; not color-only. | Wrap in user tables and profile chips. | `BENDAHARA` displays `PPSPM`; `KEPALA_SUB_BAGIAN_UMUM` displays `Kepala Sub Bagian Umum`; `ADMIN` remains dedicated. | Profile/admin role chip styling. | Lowercase prototype roles, `ADMIN` as substitute for operational roles. | Medium. | 15E foundation. | Should use existing role display constants. |
| PageHeader | Page-local headers exist. | Standard page title, subtitle, breadcrumbs/back slot, and action slot. | Default, compact, detail, with actions. | No fetching or navigation rules except caller-provided elements. | Heading level controlled by page; actions labelled. | Actions stack under title on mobile. | Uses current terminology: Profile, Penambahan Dokumen, Kepala Sub Bagian Umum, PPSPM. | Compact warm heading/action layout. | Prototype tab labels as route authority. | Low-medium. | 15F or first role slice. | Shell phase may need this before broad page work. |
| BackButton | Page-local back links/buttons exist. | Consistent back affordance with caller-provided route/history behavior. | Link, button, icon-only, text. | No hardcoded route defaults. | `aria-label` for icon-only; visible text preferred. | Stable height; no layout shift. | Must not link to removed archive routes. | Chevron back treatment. | Prototype tab back behavior as router authority. | Low. | 15F. | Can be built with `Button` and TanStack `Link`. |
| ResponsiveCardList | Repeated desktop tables and mobile cards. | Shared responsive wrapper/pattern for table-on-desktop and cards-on-mobile. | Empty/loading/error slots; row/card render props. | Caller provides safe DTOs and actions. | Table headers meaningful; card labels visible; keyboard action access. | Desktop horizontal overflow, mobile card stack, stable actions. | CSV/search remains caller/page-local; no raw IDs/paths/tokens in displayed data. | Prototype table-to-card list density and mobile cards. | Monolithic prototype list logic or mock data. | Medium. | 15G slices after state components. | Start with one low-risk list before broad reuse. |
| MobileFilterBar | Page-local filter panels exist. | Responsive filter/action surface for narrow screens. | Collapsed, expanded, active-count, reset/apply. | Caller owns filter state and filtering. | Toggle labelled; active count announced; controls labelled. | Mobile drawer/panel, desktop inline fallback. | Archive filters remain local to folder-first pages; no global/sidebar Cari Arsip. | Prototype filter drawer/chips. | New server search route or global archive search. | Medium. | 15G slices. | Pair with `SearchFilterToolbar`. |
| FilePreviewButton | Inline buttons in `AttachmentViewer` and archive pages. | Visual/action button for preview attempts. | Idle, loading, disabled, blocked, error. | Caller provides authorized preview URL/function; component must not construct raw paths unless caller already does. | Icon plus label or `aria-label`; loading state announced. | Icon-only allowed in dense tables with tooltip/title; full label on mobile. | Must preserve authorized APIs and show `Data file sudah dimusnahkan` only for allowlisted 410 response. | Polished preview icon/button. | Direct file paths, signed token exposure, arbitrary error text. | High. | 15G.1/15G.3 with file-flow tests. | Prefer wrapper around current `AttachmentViewer` behavior first. |
| FileDownloadButton | Inline buttons and anchors exist. | Visual/action button for download attempts. | Idle, loading, disabled, blocked, error. | Caller owns download helper/API path and safe filename. | Icon plus label/aria; disabled reason available. | Touch target >= current button sizing; label on mobile. | Preserve safe filename handling; no storage root/logical path/token exposure. | Download toast visual only after actual result. | Fake download success, browser-only mock blob. | High. | 15G.1/15G.3. | Must not change file-access APIs. |
| AttachmentList | `AttachmentViewer`, archive item attachments, manual attachment UI are separate. | Presentation wrapper for attachment rows/cards and action slots. | Read-only, editable, grouped required/custom, destroyed/blocked. | Does not fetch files; caller supplies sanitized attachments and actions. | Each attachment has accessible name, type/status, actions. | Dense desktop rows; card stack on mobile. | Destroyed folder/file state displays exact phrase `Data file sudah dimusnahkan`; no raw `lampiran_urls`. | Attachment list and preview modal polish. | Prototype mock file objects or direct preview/download behavior. | High. | 15G.1 then 15G.3. | Keep domain `AttachmentViewer` active until wrapper is proven. |
| SearchFilterToolbar | Many page-local search/filter controls. | Shared toolbar layout for page-local text search, filters, result count, reset. | Search-only, with filters, with actions, active chips. | Filtering stays in caller/page DTOs. | Search input labelled; reset clear; no hidden unlabeled icon buttons. | Desktop row, mobile stacked or paired with `MobileFilterBar`. | Must not restore global/sidebar archive search or `/api/arsiparis/search`. | Prototype filter panel and active chips. | Cross-page/global archive search authority. | Medium. | 15G slices. | Should accept render props for domain filters. |
| CsvExportButton | Archive pages call CSV helper directly. | Standard button state and title for safe client-side CSV export. | Enabled, disabled-empty, pending if needed. | Caller passes prebuilt safe CSV or safe callback; no data selection by component. | Button announces disabled reason; filename not secret. | Full-width on mobile when in toolbar. | Must use safe DTO fields only; no raw IDs, item keys, paths, URLs, tokens, storage roots, SQL, env/session/cookie values, secrets, raw rows, file content. | Export button styling. | New aggregate/export APIs or unsafe columns. | Medium-high. | 15G.3 for archive, later reports if scoped. | Archive helper remains source of CSV content. |
| DatePicker wrapper | Existing `DatePicker` wrapper. | Normalize date input styling and behavior where needed. | Single date; optional min/max later; disabled. | Emits ISO date string only; no API calls. | Keyboard access, labelled control, focus visible, closes predictably. | Popover must fit viewport and not cover submit actions. | Use for date fields only; `Nomor SPM` is unrelated and belongs to close/final archive metadata. | Warm calendar visual. | Prototype date behavior as validation authority. | Medium. | 15F if design tokens touch forms. | Existing wrapper can be reused; do not invent package changes. |
| EmptyState | Page-local blocks exist. | Consistent empty/no-results presentation with optional action. | Empty, no-results, unauthorized-safe fallback if caller needs. | Caller provides copy and action. | Meaningful text; action labelled; no decorative-only meaning. | Centered in table/card space; compact on mobile. | Do not leak forbidden entity existence; no removed route suggestions. | Prototype empty state spacing. | "Go to Cari Arsip" or Laporan Klasifikasi suggestions. | Low. | 15E foundation. | Good early low-risk component. |
| LoadingState/Skeleton | `Skeleton` exists; page loading varies. | Standard loading blocks for lists, cards, details, forms. | Inline spinner, list skeleton, card skeleton, table skeleton. | No data logic. | `aria-busy` where appropriate; avoid infinite announcements. | Skeleton dimensions stable across breakpoints. | Must not show fake data. | Prototype skeleton list/card rhythm. | Mock rows that look like real records. | Low. | 15E foundation. | Build on existing `Skeleton`. |
| ErrorState | Page-local errors and alerts exist. | Standard safe error display with retry/action slot. | Inline, page, destructive warning, file access blocked. | Caller sanitizes messages; component can show allowlisted file phrase. | `role="alert"` for blocking errors; retry labelled. | Does not cover primary content controls on mobile. | Must not expose paths, roots, tokens, SQL, env/session/cookie values, raw rows, secrets. | Warm bordered warning/error panel. | Arbitrary backend error rendering. | Medium. | 15E foundation. | High value for file/access/admin pages. |
| FormSection / FieldGroup | Repeated page-local form layout. | Field grouping, labels/help/error slots, section heading/action. | Default, compact, two-column, readonly. | No validation or API ownership. | Label association, error association, required indication not color-only. | Collapses to one column; no text overlap. | Use current terminology; `Nomor SPM` only for close/final folder metadata. | Prototype dense forms and modal form sections. | Prototype schema or mock validation. | Medium. | 15F/15G. | Start with admin/profile or archive close forms. |
| MetricCard / StatsCard | `StatsBento` and summary cards exist. | Generic stat display for dashboards and report summaries. | Number, label, trend optional, status count, action optional. | Caller computes values from current APIs/DTOs. | Numbers have text labels; no color-only trend. | Grid wraps predictably; cards stable size. | Counts must not imply unauthorized backend authority; Penanggung Jawab Kinerja remains metadata-only. | Warm stat cards. | Mock counts or cross-role admin authority. | Medium. | 15F then role slices. | Keep `StatsBento` until generic contract is proven. |
| RoleAwarePageShell | Not present as shared component; shell already role-aware. | Not recommended yet except as future pattern if page slices prove repeated guard/layout needs. | Deferred. | Would risk coupling auth, navigation, and role behavior. | N/A. | N/A. | Must not move authorization to client UI. | None for now. | Client-only role authorization. | High. | Defer. | Keep role/page guard logic where it is until separately scoped. |

## Components To Defer Or Keep Page-Local

Do not create yet:

- `RoleAwarePageShell`: too risky because `AppLayout`, `dms_session`, `dms_active_role`, server role switching, default redirects, and navigation authority are tightly coupled.
- `NotificationPopover` with real notification semantics: no backend notification authority is currently scoped. A future visual-only empty shell is acceptable only if explicitly labelled as non-authoritative in implementation planning.
- `GlobalSearch` or global archive search: must not restore global/sidebar `Cari Arsip`, `/arsiparis/search`, or `/api/arsiparis/search`.
- General `DataTable` abstraction: current tables have domain-specific actions, mobile card needs, and safe DTO constraints. Start with `ResponsiveCardList` patterns before a broad table framework.
- `ArchiveTimeline` or lifecycle history component: current lifecycle and audit behavior are domain-sensitive and should remain page-local until a backend/audit phase scopes it.
- Separate physical deletion UI component: Phase 13Y.2 wires physical deletion into existing `Musnahkan Data`; no separate button/page/modal should be introduced.

Keep page-local for now:

- `CloseBerkasDialog`: archive close metadata is domain-specific and includes `Nomor SPM`, retention fields, and folder-first close API behavior.
- Existing archive destruction dialogs on `/arsiparis/usul-musnah` and `/arsiparis/berkas/$id` until `ConfirmDialog` supports exact typed confirmation.
- `HierarchicalFilter`: it fetches master data and encodes report hierarchy; extract only shared toolbar/field layout later.
- `AttachmentEditor`, document form step components, and `KelengkapanChecklist`: they own workflow-specific upload/required-document behavior.
- Admin master-data create/edit/delete forms: keep local until `AppDialog`, `ConfirmDialog`, `FormSection`, and `RoleBadge` are stable.
- Manual `Penambahan Dokumen` create and preview modals: keep local because file access and open-berkas eligibility are domain-specific.

Require backend/API work and must be deferred:

- Real notification inbox/popover.
- Cross-page/global search or archive search.
- New CSV/report export endpoints.
- Activity Log route or audit viewer beyond existing local component usage.
- Any component that needs schema changes, new lifecycle APIs, new file-access APIs, or storage cleanup APIs.

## Accessibility And Responsive Requirements

Baseline requirements for future shared UI components:

- Dialogs must have a labelled title, optional description, focus trap, predictable Escape behavior, and focus return.
- Confirm dialogs must require explicit action labels; destructive dialogs must support exact typed confirmation where required.
- Icon-only controls need `aria-label`; unfamiliar icon-only actions should have tooltip/title support.
- Buttons and links must preserve keyboard focus rings and disabled states.
- Error states must use safe messages and `role="alert"` where blocking.
- Toasts should use `role="status"` for non-blocking outcomes and `role="alert"` only for urgent errors.
- Tables must keep semantic table markup on desktop; mobile card alternatives must expose equivalent labels.
- Search/filter inputs require visible or programmatic labels and reset affordances.
- Color must not be the only signal for status, role, error, lifecycle, or destructive action.
- Text must not overflow or overlap at mobile widths; long labels should wrap or truncate with title where safe.
- Components should support warm premium cream/orange direction while preserving white/off-white panels for contrast.
- Avoid excessive decorative blob/mesh/gimmick backgrounds and avoid a one-note palette by using restrained semantic accents.

## DMS-Specific Guardrails

Security and auth:

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state and is not authorization proof.
- Server/API RBAC remains authoritative.
- `ADMIN` is dedicated and is not a substitute for `PEGAWAI`, `PPK`, `BENDAHARA`, `KEPALA_SUB_BAGIAN_UMUM`, or `PENANGGUNG_JAWAB_KINERJA`.
- Do not claim production ready, go-live approved, operational certification, security certification, compliance validation, fully secure, or full Supabase repository removal.
- Correct Supabase wording: "Active runtime/package Supabase dependency retired, historical Supabase artifacts remain."

Archive and file access:

- Folder-first archive authority remains `berkas_arsip`, `berkas_arsip_item`, `dokumen_transaksi`, `manual_arsip`, and `manual_arsip_attachment`.
- Do not restore or treat as active: `/arsiparis/aktif`, `/arsiparis/search`, `/arsiparis/arsip/$id`, `/api/arsiparis/arsip/*`, `/api/arsiparis/aktif`, `/api/arsiparis/inaktif`, `/api/arsiparis/usul-musnah`, `/api/arsiparis/search`, `Laporan Klasifikasi`, global/sidebar `Cari Arsip`, `arsip.arsip`, `lampiran_snapshot`, or `canonical_arsip_id`.
- Preview/download components must preserve current authorized APIs, current safe filename handling, and destroyed-file handling.
- Exact destroyed-file phrase where applicable: `Data file sudah dimusnahkan`.
- Exact destructive typed confirmation where applicable: `MUSNAHKAN DATA FILE`.
- CSV export UI must use safe DTO fields only and must not expose raw IDs, item keys, paths, URLs, tokens, storage roots, signed-token internals, SQL, env/session/cookie values, secrets, raw rows, or file content.

Terminology:

- Internal `BENDAHARA` remains unchanged; user-facing label is `PPSPM`.
- Use `Kepala Sub Bagian Umum` as the primary user-facing label, not Arsiparis.
- Use `Profile`, not Settings.
- Use `Penambahan Dokumen`, not Penambahan Arsip.
- Do not introduce `Nomor Surat` for new UI.
- Use `Nomor SPM` only for final archive/folder metadata at close/finalization.

## Prototype Visual Ideas Allowed

Allowed as visual inspiration only:

- Warm cream/orange main canvas near `#FFF8F1` where appropriate.
- Lighter/off-white/ivory sidebar that is subtly distinct from the content canvas.
- White/off-white cards, panels, tables, dialogs, and forms for contrast.
- Compact header/profile visual treatment, avatar/menu polish, and an optional visual-only notification shell if later scoped.
- Mobile drawer and sidebar collapse patterns for shell planning.
- Filter toolbar with active count, active chips, and mobile filter panel.
- Dense desktop table with mobile card equivalent.
- Toast and dialog visual hierarchy.
- Attachment list, preview modal, and download action polish.
- Archive folder detail visual density and lifecycle action placement, without adopting prototype data or behavior.

## Prototype Assumptions Rejected

Rejected for current DMS work:

- Copying prototype source, config, package metadata, lockfiles, env files, scripts, app/workspace folders, generated components, or mock data.
- Lowercase roles, prototype role switching, or client-only authorization.
- Mock notifications as real workflow authority.
- Mock file blobs, direct paths, fake preview/download success, or success toasts not backed by current flows.
- Prototype-only statuses or labels as canonical state.
- Monolithic `AdminView`, `ArchivistView`, `InboxView`, or `ReportListView` as source modules.
- `Settings` label for account behavior.
- `Arsiparis` as primary user-facing label.
- `Penambahan Arsip` label in user-facing redesign.
- `Nomor Surat` in new UI.
- Any restoration of removed archive/search/report/canonical surfaces.

## Recommended Implementation Order

1. Phase 15E shell/theme planning or foundation integration:
   Define and, if approved, implement the first shared primitives: `AppDialog`, `ConfirmDialog`, `AppToast`, canonical `StatusBadge`, `RoleBadge`, `EmptyState`, `LoadingState/Skeleton`, and `ErrorState`. Keep shell behavior unchanged unless explicitly scoped.
2. Phase 15F shell/design-token integration:
   Apply warm theme/shell visual integration using existing `AppLayout`, `AppHeader`, `AppSidebar`, `RoleDropdown`, and `UserDropdown` contracts. Preserve `/auth/session`, `/auth/role-switch`, `dms_session`, `dms_active_role`, role defaults, and `NAV_CONFIG`.
3. Phase 15G.1 Pegawai:
   Use shared states, badges, page headers, search/filter toolbar, attachment actions, and responsive list patterns on Pegawai document/list/detail/revision flows.
4. Phase 15G.2 PPK/PPSPM:
   Reuse confirmation, badge, attachment, list, and action patterns for PPK and PPSPM-facing Bendahara namespace pages while displaying PPSPM.
5. Phase 15G.3 Kepala Sub Bagian Umum / Archive:
   Apply folder-first archive visuals to `/arsiparis/berkas`, `/arsiparis/berkas/$id`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, Pengklasifikasian Dokumen, and Penambahan Dokumen without restoring legacy canonical surfaces.
6. Phase 15G.4 Penanggung Jawab Kinerja:
   Redesign metadata-only Laporan Kinerja surfaces without preview, download, export, detail actions, or ADMIN inheritance.
7. Phase 15G.5 Admin:
   Redesign admin master-data/user-management views using shared dialog, confirm, role badge, form section, table/card, and error-state primitives while preserving admin-only authority.
8. Phase 15G.6 Profile/notification/global polish:
   Redesign Profile and global polish. Notification remains visual-only/empty unless a backend phase scopes real notification authority.
9. Phase 15H responsive/interaction QA:
   Keep 15H as responsive and interaction QA, not archive implementation.
10. Phase 15I final integration handoff:
   Keep 15I as final integration handoff, not admin implementation.

## Proposed Phase 15E Scope

Recommended Phase 15E scope:

- Remain narrowly scoped to shared foundation implementation or shell/theme planning, depending on human approval.
- Build/refactor first: `AppDialog`, `ConfirmDialog`, `AppToast`, canonical `StatusBadge`, `RoleBadge`, `EmptyState`, `LoadingState/Skeleton`, and `ErrorState`.
- Document or test high-risk contracts before replacing `window.confirm`.
- Do not integrate archive lifecycle dialogs until typed confirmation behavior is covered.
- Do not modify route generation unless a later phase explicitly permits it.
- Do not alter auth/session/RBAC, storage/file access, archive lifecycle APIs, schema, migrations, packages, or env files.

Recommended first implementation sequence inside 15E if implementation is approved:

1. Low-risk display/state primitives: `EmptyState`, `LoadingState/Skeleton`, `ErrorState`.
2. Canonical display primitives: `StatusBadge`, `RoleBadge`.
3. Dialog foundation: `AppDialog`, then `ConfirmDialog`.
4. Toast foundation: `AppToast` with caller-owned messages only.
5. Planning-only contracts for file actions, CSV export, responsive lists, and form sections before applying them in route slices.

## Final Guardrails

This Phase 15D document is the only allowed file output for the phase.

Future phases must preserve:

- Current TanStack Start/TanStack Router app structure.
- `pnpm` package manager rule.
- `src/routeTree.gen.ts` untouched unless route generation is explicitly scoped.
- No prototype source import or copied files.
- No legacy archive/search/report/canonical restoration.
- No runtime Supabase fallback.
- No claims beyond bounded local/internal/LAN development handoff.
- Current server/API authorization and file-access boundaries.
- Current folder-first archive authority and destroyed-file UX.
