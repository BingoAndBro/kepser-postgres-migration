# Refactoring Plan: DMS Codebase

Status: Revised plan based on current `src/` implementation and `AGENTS.md` invariants.  
Scope: Improve maintainability without changing external behavior, API contracts, workflow status transitions, or RLS assumptions.

## Context

The DMS codebase has grown organically. The main pressure points are large files, repeated data access patterns, mixed UI/session concerns, inconsistent fetch/error handling, and weak runtime parsing for JSON payloads.

The refactor must respect these project rules:

- Use `pnpm` for all project commands.
- Keep document status transitions centralized in `src/lib/fsm.ts`.
- Keep audit log append-only.
- Keep role enforcement on server/API boundaries.
- Add or update docs/SOP before changing behavior.
- Avoid introducing new route/table/env magic strings.
- Preserve existing Supabase/RLS behavior unless a phase explicitly migrates it.

## Current Architecture Reality

Important facts from the current codebase:

- The runtime data layer is mostly Supabase client calls, not Drizzle queries.
- `src/lib/db/schema.ts` is incomplete relative to the active database shape in `AGENTS.md`.
- `src/routes/__root.tsx` uses `ssr: false`; `AppLayout` currently bootstraps auth on the client.
- Many master-data pages call `src/lib/master-data.ts` directly from browser code.
- API routes often use `createAdminClient()` intentionally to bypass RLS for workflow updates.
- Legacy `/dokumen/*` routes redirect to `/pegawai/dokumen/*`.

So this plan does not migrate core document operations to Drizzle yet. That is a separate migration after schema parity is proven.

## Refactoring Principles

1. Preserve behavior first; reduce code second.
2. Prefer small, reversible phases.
3. Keep import compatibility during migration using barrels or compatibility shims.
4. Do not combine visual refactors with auth/security model changes.
5. Add verification gates per phase, not only `pnpm build`.
6. Move constants earlier so later phases do not spread new magic strings.

## Revised Execution Order

```text
Phase 0  Baseline, inventory, and safety checks
Phase 1  Utility consolidation                      DONE
Phase 2  Typed constants and route/table names       early invariant cleanup
Phase 3  Master data modularization                  preserve Supabase client
Phase 4  Document helper decomposition               preserve Supabase + FSM
Phase 5  AppLayout UI extraction                     no auth model change
Phase 6  Runtime type safety and Zod output parsing
Phase 7  API client standardization
Phase 8  Ajukan Dokumen form decomposition
Phase 9  Mutation layer standardization
Phase 10 Server-side auth/RBAC hardening
Phase 11 API parsing hardening and Drizzle evaluation
```

Phases 10 and 11 are intentionally later-stage because they can change security and data-access behavior.

---

## Update Setelah Refactor Plan (Delta)

Added after latest chairman assignment changes so the plan stays aligned with the current codebase without rewriting the existing phase structure.

### Ringkasan perubahan API

- Added `GET /api/ketua-tim` as the aggregate source for chairman assignment reads.
- Added `POST /api/ketua-tim` with replace behavior by `kegiatan_id`; this is no longer a conflict-only flow.
- Added `DELETE /api/ketua-tim` for deletion by assignment id.
- Added supporting read endpoints:
  - `/api/ketua-tim/user/$userId`
  - `/api/ketua-tim/kegiatan/$kegiatanId`
- Implementation currently lives in `src/routes/api/ketua-tim/*`.

### Perubahan behavior penting

- Chairman assignment changes in `src/routes/admin.master-data.user.tsx` now use staging state and are only committed on save.
- Edit user flow now tracks dirty state and shows a cancel confirmation before discarding staged changes.
- Kegiatan dropdown is aware of staged assignment state for the currently edited user.
- Replace behavior is preserved at the API layer and no longer returns `409 Conflict` for an existing `kegiatan_id`.
- Console logging for chairman assignment flows was reduced to focused diagnostic messages.

### Dampak ke phase selanjutnya

- Phase 5 is now partially advanced in one narrow area: `admin.master-data.user.tsx` already contains staged edit-flow behavior that should be preserved during later UI extraction.
- Phase 7 must treat `/api/ketua-tim` as an existing stabilized API surface and must not regress its replace-on-post semantics.
- Any future decomposition of admin user management should preserve the current staging model instead of reverting to immediate mutation on selection.

### Constraint Baru

- Endpoint `/api/ketua-tim` is now the source of truth for chairman assignment persistence.
- UI uses staging state for chairman assignment changes; selecting a kegiatan must not immediately commit to the database.
- Replace behavior on `POST /api/ketua-tim` must be preserved.
- Dirty-state tracking and cancel-confirm behavior in the admin user editor must be preserved.
- Dropdown filtering for kegiatan must remain aware of staged assignments for the active edit session.

## Phase 0: Baseline, Inventory, And Safety Checks

Goal: Establish a measurable baseline before touching large areas.

Tasks:

- Record current route/API inventory.
- Record current workflow endpoints and expected status transitions.
- Run current verification suite.
- Add focused smoke tests if missing for critical helpers.
- Document current architecture summary in `docs/`.

Recommended checks:

```bash
pnpm build
pnpm test | tail -50
```

Critical manual workflow checks:

- login/logout
- role switching
- Pegawai submit material document
- Pegawai submit non-material document
- PPK approve and reject
- Ppspm approve and reject
- Pegawai revision resubmit
- PPK resubmit after Ppspm rejection
- Arsiparis archive completed document
- preview/download lampiran from Pegawai, PPK, Ppspm, Arsiparis views

Exit criteria:

- Current behavior is documented.
- Known failing tests or manual gaps are listed in `progress.md` or a phase note.

---

## Phase 1: Utility Consolidation

Status: Done.

Goal: Remove duplicated utility functions.

Created:

- `src/lib/utils/format.ts`
- `src/lib/utils/file.ts`

Modified:

- `src/lib/file-helpers.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/storage-client.ts`
- `src/components/dokumen/ActivityLog.tsx`

Follow-up:

- Keep `storage-client.ts` as a browser-side client helper only.
- Remove `alert()` from helper utilities in a later UI/error-handling phase.

---

## Phase 2: Typed Constants And Magic String Reduction

Goal: Satisfy the `AGENTS.md` no-magic-strings invariant before larger refactors.

Create:

- `src/lib/constants/roles.ts`
- `src/lib/constants/document-status.ts`
- `src/lib/constants/routes.ts`
- `src/lib/constants/tables.ts`
- `src/lib/constants/env.ts`
- `src/lib/constants/index.ts`

Suggested shape:

```typescript
export const ROLES = {
  PEGAWAI: 'PEGAWAI',
  PPK: 'PPK',
  PPSPM: 'PPSPM',
  ARSIPARIS: 'ARSIPARIS',
  ADMIN: 'ADMIN',
} as const

export type RoleName = typeof ROLES[keyof typeof ROLES]
```

```typescript
export const DOC_STATUS = {
  DRAFT: 'DRAFT',
  IN_PPK_VALIDATION: 'IN_PPK_VALIDATION',
  IN_PPSPM_APPROVAL: 'IN_PPSPM_APPROVAL',
  NEED_REVISION: 'NEED_REVISION',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
  TERSIMPAN: 'TERSIMPAN',
} as const
```

Important: `TERSIMPAN` exists in the current code for non-material documents even though it is not in the original MVP FSM section. Before broad use, update the relevant SOP/docs or normalize the status model.

Route constants must reflect actual current routes:

- Pegawai submit route is `/pegawai/dokumen/aju`, not `/pegawai/aju`.
- Pegawai default route is currently `/`, not `/pegawai/saya`.
- Legacy `/dokumen/*` routes are redirect aliases and should be documented as compatibility paths.

Verification:

- `pnpm build`
- Search for high-risk magic strings still present in core files:

```bash
rg "'(PEGAWAI|PPK|PPSPM|ARSIPARIS|ADMIN|DRAFT|IN_PPK_VALIDATION|IN_PPSPM_APPROVAL|NEED_REVISION|COMPLETED|ARCHIVED|TERSIMPAN)'" src
```

Exit criteria:

- Constants are available.
- No behavior changes.
- Do not attempt to replace every string in one massive patch; start with FSM, auth, navigation, and route targets.

---

## Phase 3: Master Data Modularization

Goal: Split `src/lib/master-data.ts` into focused modules while preserving the existing Supabase-browser service pattern.

Do not start by deleting `src/lib/master-data.ts`. First create a compatibility barrel so imports like `#/lib/master-data` keep working.

Create folder:

```text
src/lib/master-data/
|-- index.ts
|-- shared.ts
|-- fungsi.ts
|-- kegiatan.ts
|-- kelengkapan.ts
|-- jenis.ts
|-- kategori.ts
|-- detail.ts
`-- jenis-dokumen.ts
```

Recommended approach:

- Use small shared helpers for repeated Supabase patterns.
- Avoid an over-generic CRUD factory until entity-specific behavior is fully mapped.
- If a factory is used, it must support payload-to-column mapping.
- Keep specialized queries manual.

Why a naive factory is risky:

- Payload fields use camelCase (`fungsiId`) while DB columns use snake_case (`fungsi_id`).
- Some deletes are hard deletes (`fungsi`, `kegiatan`, `kelengkapan`) while others are soft deletes (`jenis`, `kategori`, `detail`, `jenis_dokumen`).
- Some entities require parent checks and joined transforms.
- `kelengkapan` has chain filtering and should remain explicit.

Safer shared helper example:

```typescript
type DuplicateField<TPayload> = {
  column: string
  value: (payload: TPayload) => unknown
}

async function checkDuplicate<TPayload>(
  supabase: SupabaseClient,
  table: string,
  fields: DuplicateField<TPayload>[],
  payload: TPayload,
  activeOnly = true,
) {
  let query = supabase.from(table).select('id')
  for (const field of fields) {
    query = query.eq(field.column, field.value(payload))
  }
  if (activeOnly) query = query.eq('is_active', true)
  return query.maybeSingle()
}
```

Migration steps:

1. Move types to entity modules or `shared.ts`.
2. Move read helpers first.
3. Move create/update/delete helpers after read helpers are stable.
4. Export all old function names from `src/lib/master-data/index.ts`.
5. Convert `src/lib/master-data.ts` into a compatibility re-export, or remove it only after import resolution is verified.

Verification:

- `pnpm build`
- Admin manual checks for fungsi, kegiatan, jenis, kategori, detail, kelengkapan, jenis dokumen.
- Confirm pages importing `#/lib/master-data` still resolve.

Exit criteria:

- Public function names unchanged.
- No API contract changes.
- Hard delete vs soft delete behavior preserved exactly.

---

## Phase 4: Document Helper Decomposition

Goal: Split `src/lib/dokumen-helpers.ts` into focused modules without changing storage behavior, RLS assumptions, or FSM transitions.

Do not migrate document helpers to Drizzle in this phase. Current helpers intentionally accept a `SupabaseClient`, including admin clients for RLS bypass.

Create folder:

```text
src/lib/dokumen/
|-- index.ts
|-- types.ts
|-- parse.ts
|-- queries.ts
|-- mutations.ts
|-- logs.ts
|-- kelengkapan.ts
|-- laporan.ts
|-- filenames.ts
`-- storage.ts
```

Module responsibilities:

- `types.ts`: `LampiranUrl`, `DokumenRow`, `LogRow`, report row types.
- `parse.ts`: safe parsing of raw Supabase rows, especially `lampiran_urls`.
- `queries.ts`: `getDokumenById`, `getDokumenByUser`.
- `mutations.ts`: `createDokumen`, `updateDokumen`, `updateDokumenStatus`.
- `logs.ts`: `insertLog`, `getLogsByDokumen`.
- `kelengkapan.ts`: `getKelengkapanRequired`, `resolveLeafNodeName`.
- `laporan.ts`: report-specific helpers.
- `filenames.ts`: display/storage filename builders.
- `storage.ts`: `syncDocumentAttachments`, `deleteOrphanFiles`, pending/formal path helpers.

Important boundaries:

- `logs.ts` must only insert into `log_aktivitas`; no update/delete.
- `mutations.ts` must not make status decisions; it only applies status returned by `fsm.ts`.
- `storage.ts` must not decide workflow status.
- API routes remain responsible for session/role authorization.

Compatibility:

- Keep `src/lib/dokumen-helpers.ts` as a temporary re-export:

```typescript
export * from './dokumen'
```

Verification:

- `pnpm build`
- Unit tests for parsing and filename helpers.
- Manual workflow checks from Phase 0.

Exit criteria:

- No route/API import must break.
- `transition()` in `src/lib/fsm.ts` remains the only status decision source.

---

## Phase 5: AppLayout UI Extraction

Goal: Make `AppLayout.tsx` smaller without changing the current auth model.

Updated behavior: this phase should remain focused on `AppLayout`, but there is now adjacent staged UI logic in `src/routes/admin.master-data.user.tsx` for chairman assignment editing. Do not fold that work into AppLayout extraction or revert it while simplifying layout components.

This phase is UI extraction only. Do not move auth to route loaders here.

Create:

```text
src/config/navigation.ts
src/components/layout/AppSidebar.tsx
src/components/layout/AppHeader.tsx
src/components/layout/UserDropdown.tsx
src/components/layout/RoleDropdown.tsx
src/components/layout/layout-utils.ts
```

Move out of `AppLayout.tsx`:

- `ROLE_DEFAULT_ROUTE`
- `NAV_CONFIG`
- menu item types
- initials helper
- sidebar rendering
- header rendering
- user dropdown rendering
- role dropdown rendering

Keep in `AppLayout.tsx` for now:

- Supabase browser session bootstrap
- inactive account check
- active-role cookie reading/writing
- redirect behavior
- auth state subscription

Do not use this incorrect route mapping:

```typescript
PEGAWAI: '/pegawai/saya'
```

Use current behavior unless intentionally changed with routing docs:

```typescript
PEGAWAI: '/'
PPK: '/ppk'
PPSPM: '/ppspm'
ARSIPARIS: '/arsiparis'
ADMIN: '/admin'
```

Verification:

- `pnpm build`
- login page renders without sidebar
- authenticated pages render sidebar/header
- role switch redirects to correct dashboard
- logout still clears session and active-role cookie

Exit criteria:

- `AppLayout.tsx` is smaller and easier to read.
- No auth/security behavior changed.

---

## Phase 6: Runtime Type Safety And Zod Output Parsing

Goal: Reduce unsafe casts and validate JSON data crossing boundaries.

Start with data that is known to be fragile:

- `lampiran_urls`
- API response bodies used by shared components
- user metadata
- role arrays

Extend existing `src/lib/schemas/dokumen.ts`; do not create duplicate schema names.

Important schema correction:

- `kelengkapan_id` must allow both UUID and `user-custom-{uuid}`.
- `url` is a Supabase storage path, not necessarily an absolute URL.

Recommended schema:

```typescript
const kelengkapanIdRegex =
  /^(user-custom-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const lampiranUrlSchema = z.object({
  kelengkapan_id: z.string().regex(kelengkapanIdRegex),
  nama: z.string().min(1),
  url: z.string().min(1),
  uploaded_at: z.string().min(1),
})

export const lampiranUrlsSchema = z.array(lampiranUrlSchema)
```

Add parse helpers:

```typescript
export function parseLampiranUrls(value: unknown): LampiranUrl[] {
  const raw = typeof value === 'string' ? JSON.parse(value) : value
  const parsed = lampiranUrlsSchema.safeParse(raw)
  return parsed.success ? parsed.data : []
}
```

Use this helper in document parsing modules rather than repeating `JSON.parse`.

Verification:

- Unit tests for `parseLampiranUrls`.
- Tests for valid UUID and `user-custom-*` IDs.
- Tests for malformed JSON returning `[]`.

Exit criteria:

- Parsing is centralized.
- Existing document pages do not crash on malformed `lampiran_urls`.

---

## Phase 7: API Client Standardization

Goal: Standardize browser-side API calls and error handling without breaking uploads or signed URL flows.

Updated behavior: `/api/ketua-tim` is now an established API family with read, staged-save, replace-on-post, and delete-by-id flows already used by the admin user page. Standardization in this phase must preserve those semantics and must not reintroduce conflict-first chairman assignment behavior.

Create:

- `src/lib/api-client.ts`

Requirements:

- `credentials: 'include'` by default.
- Do not force `Content-Type: application/json` for `FormData`.
- Support query params.
- Throw typed `ApiError`.
- Preserve ability to call non-JSON endpoints if needed.

Safer shape:

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message: string,
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData

  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : response.statusText
    throw new ApiError(response.status, payload, message)
  }

  return payload as T
}
```

Migration strategy:

- Start with low-risk list pages.
- Then move simple POST actions.
- Keep upload code explicit until tested.
- Do not change API routes in this phase.

Verification:

- `pnpm build`
- manual checks for list pages and action buttons
- upload still works

Exit criteria:

- New client helper exists.
- At least one role module migrated as a pattern.
- No hidden behavior change to request credentials or content type.

---

## Phase 8: Ajukan Dokumen Form Decomposition

Goal: Reduce the complexity of `src/routes/pegawai/dokumen/aju.tsx` while preserving the exact submit flow.

Actual route:

```text
/pegawai/dokumen/aju
src/routes/pegawai/dokumen/aju.tsx
```

Create:

```text
src/components/dokumen/form/
|-- DokumenFormContext.tsx
|-- dokumen-form-types.ts
|-- dokumen-form-reducer.ts
|-- StepFungsiTanggal.tsx
|-- StepKegiatan.tsx
|-- StepJenisPermintaan.tsx
|-- StepKategoriPermintaan.tsx
|-- StepDetailPermintaan.tsx
|-- StepUploadLampiran.tsx
|-- StepReview.tsx
`-- StepperControls.tsx
```

Preferred state model:

- Use `useReducer` instead of many independent `useState`.
- Keep derived data as derived values, not duplicated state.
- Keep master-data fetching either in small hooks or in the route component.

Potential hooks:

```text
src/components/dokumen/form/hooks/
|-- useMasterFungsi.ts
|-- useKegiatanByFungsi.ts
|-- usePermintaanChain.ts
`-- useKetuaTimStatus.ts
```

Do not change:

- submit endpoint `/api/dokumen/submit`
- payload field names
- validation rules for material vs non-material
- required lampiran behavior
- chairman detection behavior

Verification:

- `pnpm build`
- manual submit material document
- manual submit non-material document
- test date cannot exceed today
- test required lampiran blocking
- test nominal required for material
- test keterangan required for non-material

Exit criteria:

- Route file becomes an orchestrator.
- Step components are understandable and independently testable.
- Submit behavior remains identical.

---

## Phase 9: Mutation Layer Standardization

Goal: Standardize mutation requests across the app using a safe abstraction layer.

This phase is intentionally separate from auth hardening because it should preserve existing workflow behavior while reducing mutation inconsistency.

Tasks:

- Extend `apiFetch` or add a dedicated `apiMutation<T>()` helper.
- Standardize mutation error handling, JSON body handling, and response parsing.
- Replace raw `fetch` calls incrementally in mutation paths.
- Preserve existing side effects and workflow behavior.

Scope:

- submit dokumen
- approve / reject flows
- update dokumen
- user management mutations
- ketua-tim assignment mutations
- other existing POST / PATCH / DELETE flows

Verification:

- submit dokumen end-to-end
- approve / reject flow
- revisi flow
- no double submit / race condition regression
- error handling stays consistent with current UI

Exit criteria:

- All mutation paths use a consistent abstraction.
- No regression in workflow or side effects.
- Error handling is centralized enough to reduce divergence.

---

## Phase 10: Server-Side Auth / RBAC Hardening

Goal: Move security responsibility from client-side checks to server-side enforcement.

This phase should happen after mutation standardization stabilizes so that authorization changes are isolated from write-flow changes.

Tasks:

- Review TanStack Start SSR constraints for the current app.
- Decide whether root route should remain `ssr: false`.
- Move role/session resolution to server functions where feasible.
- Replace client-only role checks with server guards and API authorization.
- Keep client checks only as UX hints.

Prerequisites:

- Phase 5 complete.
- Phase 9 stable.
- API authorization already reliable.

Verification:

- unauthorized user blocked or redirected
- wrong role goes to `/forbidden`
- direct API access remains protected
- role switch still works

Exit criteria:

- Server-side RBAC is enforced.
- Client no longer acts as the primary security layer.

---

## Phase 11: API Parsing Hardening & Drizzle Evaluation

Goal: Continue parser hardening for risky API payloads and evaluate Drizzle safely.

This phase combines a practical parsing pass with a later architecture check, not a full migration.

Part A: API parsing hardening

- Replace raw `JSON.parse` in API routes gradually.
- Reuse centralized parsers from Phase 6.
- Add validation only to high-risk or frequently used endpoints.

Do not:

- aim for 100% coverage
- over-validate every endpoint

Part B: Drizzle schema parity

- Update `src/lib/db/schema.ts` and `docs/drizzle-schema.md`.
- Ensure parity for:
  - `arsip`
  - `dokumen_transaksi`
  - `master_klasifikasi_arsip`
  - `user_status`
  - `lampiran_urls`
- Build read-only query proof first.
- Do not migrate workflow mutations blindly.

Verification:

- schema diff reviewed
- read query parity checked
- no workflow endpoint migrated blindly

Exit criteria:

- API parsing is safer.
- Drizzle is ready for selective use if chosen.
- Behavior remains unchanged.

---

## Global Verification Matrix

Run after every phase that changes code:

```bash
pnpm build
pnpm test
```

Manual checks by domain:

- Auth: login, logout, inactive account handling, role switch.
- Pegawai: list, submit material, submit non-material, revise, preview, download.
- PPK: inbox, approve, reject, resubmit, preview, download.
- Ppspm: inbox, approve, reject, finished list, preview, download.
- Arsiparis: inbox, archive, active list, inactive list, usul musnah, search.
- Admin: all master-data CRUD and user management.

Regression risks to watch:

- lost `credentials: 'include'` on fetch
- accidentally changing hard delete to soft delete or the reverse
- changing storage path format
- bypassing `src/lib/fsm.ts`
- updating or deleting `log_aktivitas`
- breaking `#/lib/master-data` or `#/lib/dokumen-helpers` imports
- changing `/pegawai/dokumen/aju` route path

## Recommendation

Execute Phase 2 first, then Phase 3 or Phase 5. After that, prioritize Phase 8, then Phase 9, then Phase 10. Keep Phase 11 for hardening and architecture evaluation after the write flow is stable.
