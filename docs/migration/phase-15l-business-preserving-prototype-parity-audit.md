# Phase 15L - Business-Preserving Prototype Parity Gap Audit

## 1. Status

- Audit-only.
- No implementation.
- No prototype source copied or imported.
- Existing business context preserved.
- The audit treats the real application's workflow, role authority, archive model, file-access rules, and security boundaries as authoritative.
- The prototype is used only as a visual and interaction reference.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

## 2. Prototype Source Reviewed

The prototype was reviewed structurally. No prototype file was copied, imported, or used as runtime source.

- Shell and layout:
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/DetailPane.tsx`
  - `src/components/Dashboard.tsx`
- Submission and revision:
  - `src/components/roles/SubmitReportView.tsx`
  - `src/components/roles/ReviseReportView.tsx`
  - `src/components/roles/EditNonMaterialView.tsx`
- Role surfaces:
  - `src/components/roles/UserView.tsx`
  - `src/components/roles/PPKView.tsx`
  - `src/components/roles/TreasurerView.tsx`
  - `src/components/roles/ArchivistView.tsx`
  - `src/components/roles/AdminView.tsx`
  - `src/components/roles/ProfileView.tsx`
- Workflow and reporting:
  - `src/components/workflow/InboxView.tsx`
  - `src/components/workflow/DocumentDetailView.tsx`
  - `src/components/workflow/ReportListView.tsx`
  - `src/components/workflow/PerformanceReportView.tsx`
  - `src/components/workflow/ActivityLogView.tsx`
- Shared interaction references:
  - modal and confirmation patterns
  - toast feedback patterns
  - success views
  - tabbed sections and steppers
  - cards, empty states, and loading states
  - dark document-preview presentation
  - `src/components/DocumentPreviewPaper.tsx`
  - `src/components/DatePicker.tsx`

## 3. Current App Source Reviewed

- Governing and Phase 15 documents:
  - `AGENTS.md`
  - `docs/migration/README.md`
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
  - `docs/migration/phase-15h-responsive-interaction-qa.md`
  - `docs/migration/phase-15i-final-frontend-integration-handoff.md`
- Shared application surfaces:
  - `src/components/layout/*`
  - `src/components/ui/*`
  - `src/components/dokumen/*`
  - `src/components/dokumen/form/*`
  - `src/components/pegawai/*`
  - `src/components/workflow/*`
  - `src/components/archive/*`
  - `src/components/kinerja/*`
  - `src/components/admin/*`
- Route groups:
  - `src/routes/pegawai/**`
  - `src/routes/ppk/**`
  - `src/routes/bendahara/**`
  - `src/routes/arsiparis/**`
  - `src/routes/penanggung-jawab-kinerja/**`
  - `src/routes/admin*`
  - `src/routes/profile.tsx`
- Relevant API and server-support surfaces were inspected selectively for response capabilities, authorization boundaries, and whether additional backend support is actually necessary.

## 4. Executive Summary

The real application is substantially closer to the prototype in visual foundation than it is in interaction flow. Phase 15 already established the warm shell, shared cards, canonical badges, responsive tables/cards, mobile drawer, role switcher, dialogs, state components, and a global toast provider. The largest remaining parity gaps are that these shared capabilities are not consistently used in actual mutation flows.

The highest-value business-preserving work is:

1. Regroup Ajukan Dokumen into fewer presentation sections, add explicit submit confirmation, and provide a success state without changing submit semantics.
2. Give Pegawai and PPK revision/resubmit flows tabbed sections, explicit confirmation, and success feedback without changing revision authority or transitions.
3. Wire the existing toast provider into real mutations and replace remaining `alert()` and non-destructive `window.confirm()` usage in bounded slices.
4. Standardize the presentation of authorized previews and downloads while preserving existing document-aware routes, file authorization, destroyed-file behavior, and archive destruction rules.
5. Add accurate role-dashboard metrics and recent-activity presentation using existing endpoints first; use an optional read-only aggregate endpoint only where broad repeated fetches are unsuitable.
6. Improve archive form and lifecycle interaction presentation without changing folder-first authority, lifecycle transitions, typed destruction confirmation, physical deletion, or post-destruction access blocking.

Most gaps do **not** require backend business changes. Existing APIs already provide sufficient results for Ajukan success, revision success, PPK/PPSPM outcomes, archive classification and lifecycle feedback, manual document creation, and admin mutation feedback. Optional backend support should be limited to read-only aggregate DTOs or narrowly scoped, non-breaking response additions.

The prototype's mock notification data, persistent-looking profile photo behavior, mock preview paper, and any richer Laporan Kinerja behavior must not be treated as authority. Notifications remain visual-only, profile photo remains local/mock unless separately approved, real authorized preview routes remain mandatory, and Laporan Kinerja remains metadata-only.

## 5. Page-by-Page Gap Matrix

Priority meanings: P0 is the first parity slice, P1 is high value after P0, P2 is later polish, and Separate means a separately approved business phase.

| Area/Page | Prototype behavior/design | Current app behavior/design | Gap | Required change | Impact classification | Business meaning changed? yes/no | Risk | Recommended priority | Requires user decision? |
|---|---|---|---|---|---|---|---|---|---|
| Shell/header/sidebar | Richer animated shell, notification content, polished role context, and collapsible desktop navigation | Warm shared shell, mobile drawer, role switcher, Profile menu, and empty visual-only notification popover already exist | Desktop density, collapse behavior, and visual feedback are less complete | Polish shell and optionally add desktop collapse; keep notification visual-only and role switch UX-only | Frontend-only interaction | No | Low risk | P2 | Yes |
| Pegawai dashboard | Metrics, task summaries, and recent activity | Quick-action cards and role entry points | Lacks real metrics and recent activity | Build accurate summary cards and recent activity from authorized existing data; consider read-only aggregate support only if needed | Frontend + existing API | No | Medium risk | P1 | Yes |
| Ajukan Dokumen | Three major presentation stages, progress summary, rich review, explicit confirmation, success view, and unsaved-change dialog | Five to seven business-valid microsteps; submits directly and redirects to document list | Interaction is fragmented and lacks confirmation/success presentation | Regroup existing fields into fewer presentation sections, preserve validation and material rules, add confirmation and success state using existing submit response | Frontend + existing API | No | Medium risk | P0 | Yes |
| Dokumen list | Richer cards, filter chips, and denser status presentation | Responsive table/mobile cards, local filters, canonical badges, and shared states | Mainly visual density and filtering polish | Refine cards, chips, and responsive presentation without changing list authority | Frontend-only visual | No | Low risk | P2 | No |
| Dokumen detail | Stronger section hierarchy, tab-like navigation, and contextual actions | Warm detail page, workflow status, attachments, logs, and authorized actions | Long-page presentation is less scannable | Add frontend-only tabs or anchored sections while preserving existing actions and endpoints | Frontend-only interaction | No | Low risk | P1 | Yes |
| Revisi Dokumen | Tabbed revision context, sticky actions, explicit resubmit confirmation, success view, and polished preview | Long single-page revision layout with guards, attachment editor, activity log, direct resubmit, and list redirect | Missing tabbed presentation, confirmation, and outcome feedback | Add tabs/sections, confirmation, toast/success state, and retain current update then resubmit sequence | Frontend + existing API | No | Medium risk | P0 | Yes |
| Laporan Saya | Richer summary, active filters, grouping, and drill-down presentation | Flat report table/cards with existing filters | Less analytical presentation | Add client grouping and drill-down using safe existing report DTOs; add DTO fields only if proven necessary | Frontend + existing API | No | Medium risk | P2 | Yes |
| Laporan Kegiatan | Richer activity grouping, summaries, and contextual drill-down | Flat report table/cards with existing data | Less grouped and less contextual | Add presentation grouping and safe detail navigation using existing report data | Frontend + existing API | No | Medium risk | P2 | Yes |
| PPK dashboard/inbox/detail | Metrics, queue emphasis, richer detail sections, and consistent feedback | Entry-card dashboard, functional inbox/detail, real approve/reject actions, dialogs, and direct redirects | Dashboard lacks real metrics; mutation feedback remains inconsistent | Add accurate metrics, richer sections, and toast/success feedback while preserving PPK semantics | Frontend + existing API | No | Medium risk | P1 | Yes |
| PPSPM dashboard/inbox/detail | Metrics, queue emphasis, richer detail sections, and consistent feedback | Entry-card dashboard, functional inbox/detail, real approve/reject actions, dialogs, and direct redirects | Same interaction gap as PPK | Add accurate metrics, richer sections, and feedback while preserving PPSPM approval semantics and internal `BENDAHARA` value | Frontend + existing API | No | Medium risk | P1 | Yes |
| Kepala Sub Bagian Umum dashboard | Stronger operational summary and activity presentation | Existing archive-role dashboard has real entry points and some counts | Summary and activity presentation are less complete | Enrich dashboard using folder-first authorized data; do not restore global archive search or legacy reports | Frontend + existing API | No | Medium risk | P1 | Yes |
| Pengklasifikasian Dokumen | Guided selection, clearer sections, confirmation, and polished success feedback | Functional list/detail classification flow with existing folder-first API and redirect | Missing guided interaction and consistent feedback | Add sectioning, confirmation, and toast/landing feedback using existing classification API | Frontend + existing API | No | Medium risk | P1 | Yes |
| Penambahan Dokumen | Guided multi-stage document addition with progress and review | Functional large-form/modal surface using manual document and folder-first APIs | Less guided and harder to scan | Present existing fields as a wizard/sections with review and success state; preserve all required metadata and attachment rules | Frontend + existing API | No | Medium risk | P1 | Yes |
| Berkas list | Rich cards, stronger segmentation, and polished local interactions | Folder-first open/active tabs, summaries, local search, responsive cards, and shortcuts | Mostly visual and interaction polish | Refine cards, tab emphasis, and feedback without adding legacy/global archive surfaces | Frontend-only visual | No | Low risk | P2 | No |
| Berkas detail | Strong section hierarchy, polished lifecycle actions, and integrated preview presentation | Folder-first detail, local item filter, close modal, lifecycle actions, and authorized item preview/download | Lifecycle outcomes and preview presentation are inconsistent with prototype | Improve dialogs, outcome feedback, sections, and authorized preview shell without changing lifecycle or file access | Frontend + existing API | No | High risk | P1 | Yes |
| Inaktif | Polished lifecycle action confirmation and outcome feedback | Folder-first inactive list with real propose-destruction action and `window.confirm()` | Confirmation and success feedback are less controlled | Replace browser confirmation with shared dialog and add safe toast/redirect feedback | Frontend + existing API | No | High risk | P1 | Yes |
| Usul Musnah | Polished destructive confirmation and clear success feedback | Folder-first proposed-destruction list with modal and exact typed confirmation | Core safety is correct; presentation and post-action feedback can improve | Preserve exact phrase and physical deletion contract; improve modal hierarchy and safe deletion summary feedback | Frontend + existing API | No | High risk | P0 | Yes |
| Laporan Kinerja | Rich metadata grouping and drill-down/modal presentation | Metadata-only summary/list with filters and responsive cards | Prototype is richer, but current metadata-only boundary is authoritative | Optionally add metadata-only grouping/detail presentation; do not add file actions or operational workflow | Frontend + existing API | No | Needs explicit user decision | P2 | Yes |
| Admin dashboard | Richer metrics and recent activity | Functional admin dashboard with real system/config entry points | Summary and mutation feedback are less polished | Add safe system/config summaries using existing APIs and preserve dedicated ADMIN role | Frontend + existing API | No | Medium risk | P2 | Yes |
| Master User | Consistent dialogs, toasts, and polished list/detail interactions | Functional user management and reset flows with several browser alerts | Feedback is inconsistent and session/reset-sensitive flows need clearer UI | Replace alerts with controlled dialogs/toasts while preserving admin reset-password and session behavior | Frontend + existing API | No | High risk | P1 | Yes |
| Kelengkapan Dokumen Admin | Polished CRUD dialogs, feedback, and empty states | Functional CRUD with integrated visual foundation but inconsistent outcomes | Mutation feedback and dialog consistency lag | Standardize feedback/dialogs using existing APIs | Frontend + existing API | No | Medium risk | P2 | No |
| Admin master-data jenis/detail | Complete visual parity across master-data pages | Functional pages received less deep visual polish than core Phase 15 surfaces | Remaining card, table, dialog, and feedback inconsistency | Complete bounded visual and interaction pass with existing master-data APIs | Frontend + existing API | No | Medium risk | P2 | Yes |
| Profile | Richer profile sections, photo interactions, modal/toast feedback, and password dialog polish | Real Profile page, local-only photo preview, real Profile password flow, roles, and team assignments | Visual feedback and photo interaction are less complete | Improve local/mock photo and Profile feedback only; keep password behavior distinct from Admin reset | Frontend-only interaction | No | Medium risk | P2 | Yes |
| Notification visual | Role-specific mock notifications and unread presentation | Visual-only popover with no backend notification model | Popover feels empty compared with prototype | Improve visual-only empty-state/popover presentation without fabricating real events, or approve a separate backend notification phase | Frontend-only visual | No | Low risk | P2 | Yes |
| File preview/download viewer | Dark, immersive preview shell with consistent viewer controls | Authorized real preview/download exists, including dark overlays, but presentation is fragmented across document/manual/folder surfaces | Consistency and viewer chrome lag; prototype paper is mock-only | Build a shared presentation wrapper around existing authorized routes and preserve destroyed-file messaging | Frontend + existing API | No | High risk | P1 | Yes |

## 6. Interaction/Component Gap Matrix

| Interaction/component | Prototype reference | Current app | Business-preserving gap/action | Impact classification | Risk | User decision |
|---|---|---|---|---|---|---|
| Toast success/error | Pervasive mutation and download feedback | `AppToastProvider` and `useAppToast` exist, but real route/component callers do not use them consistently | Wire safe success/error outcomes in bounded slices; do not expose arbitrary backend details | Frontend + existing API | Medium risk | Decide global rollout breadth and priority |
| Redirect or success page | Submit/resubmit success views provide clear completion state | Most successful actions immediately redirect to a list | Add success state or route after confirmed success; existing responses/current page data are usually sufficient | Frontend + existing API | Medium risk | Decide success state versus dedicated route |
| Confirmation modal | Styled confirmation before important actions | Shared dialogs exist, but some actions still use browser confirmation or direct submit | Replace direct/browser confirmations in bounded slices | Frontend-only interaction | Medium risk | Decide which actions require confirmation |
| Typed confirmation | Destructive typed confirmation | Archive destruction already requires exact `MUSNAHKAN DATA FILE` | Preserve exact phrase and validation; visual polish only | Frontend-only visual | High risk | No semantic change permitted |
| Dark preview overlay | Consistent dark viewer chrome and toolbar | Several real preview surfaces already use dark overlays, but styling and controls differ | Standardize presentation while keeping current authorized URLs and error behavior | Frontend + existing API | High risk | Decide whether to unify all roles/sources |
| Tabs/sectioned forms | Tabs and grouped sections reduce long-page scanning | Used selectively; Ajukan/Revisi/detail surfaces remain more fragmented or long | Add presentation-only tabs/sections with no state-transition changes | Frontend-only interaction | Low risk | Decide target pages and grouping |
| Stepper/wizard behavior | Fewer major stages with progress and review | Ajukan has many microsteps; Penambahan is less guided | Regroup existing inputs and validations into major presentation stages | Frontend-only interaction | Medium risk | Decide three-stage versus current step count |
| Dialog consistency | Consistent modal styling and focus | Shared dialog primitives exist; local modals and browser dialogs vary | Migrate bounded flows to shared dialog primitives | Frontend-only interaction | Medium risk | Decide rollout order |
| Empty/loading/error states | Polished shared states | Shared states exist and are used broadly, with some local inconsistencies | Complete remaining adoption and message consistency | Frontend-only visual | Low risk | Usually no |
| Notification popover | Populated mock notification panel | Visual-only empty popover | Improve the visual-only empty state without implying real events; backend notifications require a separate phase | Frontend-only visual | Low risk | Decide visual-only versus later backend phase |
| Role switcher | Polished role switching | Existing switcher uses real assigned roles and server role-switch endpoint; `dms_active_role` remains UX-only | Visual polish only; no authority change | Frontend-only visual | Low risk | Usually no |
| Profile photo | Interactive profile photo presentation | Local preview/mock only | Keep local/mock for parity polish, or separately approve persistence | Frontend-only interaction | Low risk | Decide mock versus separate persistence phase |
| Status badges | Consistent rich status presentation | Canonical badges already exist and are broadly used | Minor density/placement polish only | Frontend-only visual | Low risk | Usually no |
| Mobile drawer | Responsive sidebar drawer | Existing mobile drawer and close behavior already exist | Minor interaction/polish only | Frontend-only visual | Low risk | Usually no |
| File preview/download handling | Unified preview/download experience | Real document-aware, manual, and folder-aware file access exists; errors often use alerts | Unify presentation and safe feedback without changing access model | Frontend + existing API | High risk | Decide scope and guarded rollout |
| Lifecycle action confirmations | Styled lifecycle confirmations and feedback | Destruction modal is strong; some non-destructive lifecycle actions use `window.confirm()` | Use shared dialogs and safe response feedback; preserve lifecycle contract | Frontend + existing API | High risk | Decide archive phase priority |

## 7. Backend/API Support Matrix

| Feature | Can use existing API? | Needs non-breaking DTO addition? | Needs new read-only endpoint? | Needs business logic change? yes/no | Risk | Tests needed | User decision |
|---|---|---|---|---|---|---|---|
| Ajukan Dokumen success state | Yes. Submit already returns the created document result | No | No | No | Medium risk | Form grouping, submit once, success state, redirect, material/non-material regression | Choose success state or route |
| Pegawai Revisi success state | Yes. Current page data plus existing update/resubmit APIs are sufficient | No | No | No | Medium risk | Update then resubmit ordering, no-change guard, failure recovery, success navigation | Choose success presentation |
| PPK resubmit success state | Yes. Current detail data and resubmit result are sufficient | No | No | No | Medium risk | Resubmit authority, target semantics, success/error navigation | Choose success presentation |
| PPK/PPSPM approval feedback | Yes. Current APIs return success outcome/message and PPSPM redirect information | No | No | No | Medium risk | Approve/reject semantics, redirect, safe message handling | Choose toast/landing behavior |
| Archive classification and manual-create feedback | Yes. Existing APIs return success/message or created manual document data | No | No | No | Medium risk | Folder-first membership, required metadata, attachment behavior, success redirect | Choose guided flow scope |
| Archive close/lifecycle feedback | Yes. Existing APIs return safe berkas results and destruction summary where applicable | No | No | No | High risk | All allowed transitions, invalid jumps, exact typed phrase, physical deletion, post-destruction access | Choose guarded archive phase |
| Role dashboard metrics and recent activity | Usually. Existing list/inbox/report endpoints can be composed | Optional, only for missing safe summary fields | Optional read-only aggregate endpoint may reduce repeated broad fetches | No | Medium risk | Role RBAC, accurate counts, empty states, no cross-role leakage | Choose existing fetches versus helper endpoint |
| Laporan Saya/Kegiatan richer grouping | Usually | Optional, only if safe grouping fields are absent | Usually no | No | Medium risk | Filters, grouping totals, safe drill-down, authorization | Choose grouping depth |
| Laporan Kinerja metadata-only drill-down | Likely, if current DTO contains required metadata | Optional, metadata-only fields only | Optional read-only metadata helper only if necessary | No | Needs explicit user decision | Metadata-only enforcement, role RBAC, no file/action exposure | Confirm metadata-only scope |
| Global toast integration | Yes. Use current mutation outcomes and frontend-safe fallback copy | No | No | No | Medium risk | Success only after confirmed outcome, safe errors, duplicate prevention | Choose global versus phased rollout |
| Unified preview presentation | Yes. Existing authorized preview/download routes remain authority | No | No | No | High risk | Document/manual/folder authorization, destroyed-file `410`, filename handling, download failures | Approve guarded viewer phase |
| Mutation-response normalization | Prefer frontend adapters first | Optional non-breaking `message`, `redirectTo`, or safe summary additions only where proven necessary | No | No | Medium risk | Existing caller compatibility and response-contract tests | Decide whether normalization is worth the blast radius |
| Backend notifications | No current notification backend | Not sufficient | No. This requires a dedicated notification model/API phase, not merely a read-only helper | Yes | High risk | Schema, RBAC, read/unread behavior, privacy, retention | Separate explicit business decision |
| Persistent Profile photo | No current persistence contract | Not sufficient | No. This requires dedicated upload/storage/profile support | Yes | High risk | Upload authorization, file validation, storage lifecycle, deletion, privacy | Separate explicit business decision |
| Admin mutation feedback | Yes. Existing admin/master-data APIs generally return outcome/entity data | No | No | No | High risk | Reset-password/session behavior, CRUD outcomes, server RBAC, safe errors | Choose admin parity priority |

Backend-support recommendation:

- Start with frontend use of existing APIs.
- Add a read-only role-dashboard aggregate endpoint only if measured implementation shows that existing endpoint composition causes excessive broad fetching or inconsistent counts.
- Add non-breaking response fields only for a specific demonstrated UI need and with compatibility tests.
- Do not create backend notifications, persistent profile photos, new file-access behavior, or new Laporan Kinerja business behavior inside a prototype-parity phase.

## 8. Not Allowed Without Explicit Business Decision

The following are outside business-preserving prototype parity and must not be implemented merely because the prototype appears to show a similar interaction:

- Changing submit, revisi, or resubmit workflow meaning or ordering.
- Changing workflow statuses, current-step semantics, revision targets, or transition authority.
- Changing Material versus Non-Material business rules.
- Changing PPK or PPSPM approval/rejection semantics.
- Making `ADMIN` an operational workflow actor or broadening ADMIN authority.
- Treating `dms_active_role` as server authorization proof.
- Weakening server/API RBAC or replacing `dms_session` as the auth boundary.
- Changing folder-first archive authority or restoring legacy canonical archive authority.
- Restoring Cari Arsip/global archive search or Laporan Klasifikasi.
- Changing archive lifecycle transitions, typed destruction confirmation, physical deletion behavior, metadata preservation, or post-destruction file blocking.
- Changing exact destroyed-file user message `Data file sudah dimusnahkan`.
- Weakening document/manual/folder file authorization, exposing direct paths, or replacing authorized preview/download routes with prototype mock behavior.
- Combining Profile password change with Admin reset-password behavior or changing session revocation semantics.
- Making Laporan Kinerja operational, file-backed, downloadable, or more than metadata-only without a separate explicit business decision.
- Adding backend-backed notifications without a separate explicit notification phase.
- Adding persistent profile-photo upload/storage without a separate explicit phase.
- Copying prototype mock data, source code, business state, fake metrics, or mock preview paper into the real application.

## 9. Recommended Implementation Phases

### Phase 15L.1 - Ajukan Dokumen Grouped Sections, Confirmation, and Success Flow

- Regroup existing fields into fewer major presentation sections.
- Preserve every current validation, required field, Material/Non-Material branch, and submit endpoint.
- Add explicit confirmation and an existing-response-backed success state.
- Add focused interaction and workflow regression tests.

### Phase 15L.2 - Revisi and Resubmit Tabs, Confirmation, and Success Flow

- Add tabbed/sectioned revision presentation for Pegawai and PPK.
- Preserve update-before-resubmit behavior, revision targets, guards, and role authority.
- Add confirmation and success feedback using current page data and existing APIs.

### Phase 15L.3 - Global Outcome Feedback and Dialog Parity

- Wire the existing toast provider into bounded mutation groups.
- Replace remaining browser alerts and non-destructive browser confirmations with shared feedback/dialog patterns.
- Keep archive destruction and admin session-sensitive actions in separately guarded sub-slices.

### Phase 15L.4 - Authorized File Preview/Download Presentation Parity

- Create a consistent dark presentation wrapper around existing authorized routes.
- Keep document-aware, manual, and folder-aware access behavior unchanged.
- Preserve destroyed-file response handling and safe download filenames.
- Require targeted file-access and interaction regression tests.

### Phase 15L.5 - Role Dashboard and Report Presentation Parity

- Add accurate dashboard metrics, queue summaries, and recent activity for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, and Admin where appropriate.
- Use existing authorized endpoints first.
- Add an optional read-only aggregate endpoint only if justified by implementation evidence.
- Improve Laporan Saya and Laporan Kegiatan grouping without changing business meaning.

### Phase 15L.6 - Archive Guided Interaction Parity

- Improve Pengklasifikasian and Penambahan Dokumen sectioning, review, confirmation, and feedback.
- Replace non-destructive lifecycle browser confirmation with shared dialogs.
- Preserve folder-first authority, 1:1 eligibility, lifecycle transitions, exact destruction phrase, physical deletion, and file-access blocking.
- Split destructive interaction work from lower-risk archive presentation work.

### Phase 15L.7 - Admin and Profile Remaining Visual/Feedback Parity

- Complete Admin master-data visual parity and replace safe mutation alerts with shared feedback.
- Improve Profile visual interactions while keeping photo local/mock and password behavior distinct.
- Guard reset-password and session-sensitive interactions with focused tests.

### Phase 15L.8 - Optional Read-Only DTO/Aggregate Support

- Implement only proven missing read-only dashboard/report fields or aggregate helpers.
- Keep response additions non-breaking and server-authorized.
- Do not include notification persistence, photo persistence, file-access changes, archive business changes, or Laporan Kinerja boundary changes.

## 10. Decisions Needed From User

All decisions below assume that existing business behavior remains authoritative.

| Decision question | Implement or skip? | Frontend-only or backend-supported? | Business behavior to preserve | Priority choice | Recommended default |
|---|---|---|---|---|---|
| Should Ajukan Dokumen be regrouped into approximately three major presentation stages? | Choose implement/skip | Frontend-only interaction using existing submit API | Current fields, validation, Material/Non-Material rules, and submit semantics | P0/P1/later | Implement at P0 |
| Should Ajukan Dokumen show a success state after submit? | Choose implement/skip | Use existing submit response; no DTO addition recommended | Submit occurs once and retains current resulting status | P0/P1/later | Implement at P0 |
| Should Pegawai Revisi and PPK resubmit show a success state after confirmed resubmit? | Choose implement/skip | Frontend plus existing APIs; no DTO addition recommended | Current revision targets, update ordering, and resubmit authority | P0/P1/later | Implement at P0 |
| Should success presentation be an in-page state or a dedicated success route? | Choose one | In-page is frontend-only; route requires a bounded routing phase | Same mutation and resulting business state | P0/P1/later | Prefer in-page state first |
| Should success views use the existing mutation response/current page data or refetch an existing detail endpoint? | Choose approach | Both use existing APIs; a non-breaking response DTO addition is not currently justified | Same authorized data and mutation result | P0/P1/later | Use existing response/current page data first |
| Should the existing toast system be wired for all mutations? | Choose global/phased/skip | Frontend plus existing API outcomes | Server result remains authoritative; safe error copy only | P0/P1/later | Phased rollout starting P0 flows |
| Should remaining `alert()` and non-destructive `window.confirm()` usage be replaced? | Choose all/phased/skip | Frontend-only interaction with existing APIs | Action authority and mutation semantics unchanged | P1/P2/later | Phased by risk |
| Should authorized preview/download use one consistent dark overlay across all roles and source types? | Choose implement/skip | Frontend plus existing authorized APIs | File authorization, destroyed-file handling, and download semantics unchanged | P1/later | Implement as guarded P1 |
| Should dashboard metrics/recent activity use composed existing endpoints or a read-only aggregate helper? | Choose approach | Existing API first; optional backend-supported read-only helper | Accurate authorized data only; no fake counts or cross-role leakage | P1/P2/later | Existing APIs first |
| Should Penambahan Dokumen become a guided wizard/sectioned flow? | Choose implement/skip | Frontend plus existing APIs | Required metadata, attachments, folder-first write, and eligibility unchanged | P1/P2/later | Implement at P1 |
| Should Laporan Saya and Laporan Kegiatan receive richer grouping and metadata drill-down? | Choose implement/skip | Existing APIs first; optional safe DTO addition | Report authority and authorization unchanged | P2/later | Implement after core workflows |
| Should Laporan Kinerja remain metadata-only while optionally receiving richer grouping/detail presentation? | Confirm boundary and choose presentation implement/skip | Frontend plus existing metadata API; optional read-only DTO only | Must remain metadata-only with no file/action workflow | P2/later | Confirm metadata-only; optional P2 presentation |
| Should notifications remain visual-only or become backend-backed later? | Choose visual-only/separate backend phase | Visual-only now; backend support requires a separate phase | No implied notification authority in current workflow | P2/separate | Keep visual-only |
| Should Profile photo remain local/mock or become persistent later? | Choose local/separate persistence phase | Local is frontend-only; persistence requires backend/storage support | Profile password and authorization boundaries unchanged | P2/separate | Keep local/mock |
| Should Admin master-data jenis/detail receive full visual and interaction parity? | Choose implement/skip | Frontend plus existing APIs | Dedicated ADMIN authority and current CRUD semantics | P2/later | Implement at P2 |
| Should the desktop sidebar become collapsible? | Choose implement/skip | Frontend-only interaction | Role navigation and active-role behavior unchanged | P2/later | Optional P2 |

## 11. Hard Guardrails Preserved

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only.
- Server/API RBAC remains authoritative.
- `ADMIN` remains a dedicated system/config role, not a universal operational workflow actor.
- Internal `BENDAHARA` values may remain; user-facing label remains PPSPM.
- Primary archive-role display remains Kepala Sub Bagian Umum.
- Profile remains Profile, not Settings.
- New archive document-addition UI uses Penambahan Dokumen, not Penambahan Arsip.
- Cari Arsip/global archive search and Laporan Klasifikasi are not restored.
- Folder-first archive authority remains `berkas_arsip`, `berkas_arsip_item`, `dokumen_transaksi`, `manual_arsip`, and `manual_arsip_attachment`.
- Archive destruction through `approve_destruction` physically deletes associated files, preserves metadata where designed, and blocks preview/download afterward.
- Exact destruction confirmation remains `MUSNAHKAN DATA FILE`.
- Destroyed-file message remains `Data file sudah dimusnahkan`.
- Laporan Kinerja remains metadata-only unless separately approved as a business change.
- Notification remains visual-only unless a backend notification phase is explicitly approved.
- Profile password and Admin reset-password remain distinct.
- Storage/file-access authorization and safe-response boundaries remain unchanged.
- No production-ready, go-live approved, fully secure, or Supabase fully removed claim is made.

## 12. Validation

Audit-only validation:

- The starting working tree was clean on branch `ui/prototype-redesign-v1`.
- No source code, prototype source, package file, lockfile, schema, migration, database, Drizzle, Supabase, environment file, or generated route file was intentionally changed.
- No route generation, commit, or push was performed.
- Final validation commands:
  - `git status --short --branch`
  - `git diff --check`
  - `git diff --name-only`
  - protected-path `git diff --name-only` check for environment, package, lockfile, generated route, database, Drizzle, and Supabase paths
- Final result:
  - `git status --short --branch` shows only `docs/migration/phase-15l-business-preserving-prototype-parity-audit.md` as untracked.
  - `git diff --check` produced no output.
  - `git diff --name-only` produced no output because the only change is the untracked audit document.
  - The protected-path diff produced no output.
  - A no-index whitespace check of the untracked audit document reported no whitespace errors.
