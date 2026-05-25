# Phase 12N.11 - Legacy Proposal Route Compatibility Cleanup Plan

Date: 2026-05-25

Status: planned compatibility cleanup document. This phase is documentation-only and does not implement runtime route, API, UI, schema, storage, migration, or cleanup changes.

## 1. Scope And Boundary

Phase 12N.11 inventories legacy proposal-based archive destruction routes/pages and defines a compatibility cleanup plan so they do not conflict with the canonical unified archive lifecycle model.

Reviewed surfaces:

- unified lifecycle API and planner;
- Phase 12N.10 physical file destruction helper;
- legacy active/inactive/usul-musnah APIs and pages;
- `arsip.arsip`, `arsip.arsip_usul_musnah`, and Manual Archive schema references;
- existing unified list pages that now link to canonical detail.

Security and governance boundaries:

- `dms_session` remains the authentication boundary.
- `dms_active_role` is UX-only and must not authorize mutation.
- Server/API RBAC remains authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` is the operational archive role.
- `ADMIN` remains dedicated and is not operational archive access.
- Active Supabase runtime/package dependency remains retired; historical Supabase artifacts remain.
- This phase does not add roadmap phases. After 12N.11, the existing roadmap remains 12O then 12P-dev unless a human approves a change.

This phase intentionally does not modify runtime source, legacy routes, unified lifecycle behavior, physical deletion wiring, schema, migrations, package files, generated routes, DB rows, storage files, audit writes, cleanup, or backfill.

## 2. Current Unified Lifecycle Target

The target lifecycle model is canonical archive based:

```text
arsip.arsip.status_arsip:
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Target rules:

- canonical `arsip.arsip.id` is the lifecycle route id;
- `source_type='WORKFLOW'` and `source_type='MANUAL'` must be respected;
- linked Manual Archive source status must stay synced with canonical status for lifecycle mutation;
- source/canonical drift must fail closed;
- `DIMUSNAHKAN` blocks preview/download/file access server-side;
- lifecycle status mutation does not delete files by itself;
- physical file deletion is a separate, source-aware execution path and should use the 12N.10 helper or a reviewed successor;
- metadata is preserved;
- `lampiran_snapshot` is preserved under the canonical policy;
- Manual Archive attachment metadata rows are preserved under the canonical policy;
- no Supabase fallback or old file recovery is expected.

Observed target implementation:

- `src/routes/api/arsiparis/arsip/$id/lifecycle.ts` uses `POST /api/arsiparis/arsip/$id/lifecycle`, same-origin validation, `dms_session`, and `KEPALA_SUB_BAGIAN_UMUM` RBAC.
- The unified route loads canonical `arsip.arsip` by canonical id, plans the transition, guarded-updates canonical status, and syncs linked Manual Archive source status for `MANUAL`.
- `src/lib/archive/unified-archive-lifecycle.ts` plans `mark_inactive`, `propose_destruction`, and `approve_destruction` with `fileDeletion: false`.
- `src/lib/archive/unified-archive-physical-destruction.ts` is an internal/manual-use helper only for canonical rows already `DIMUSNAHKAN`; it preserves metadata and is not wired to UI/API/scheduler/lifecycle.

## 3. Legacy Route, Page, And Helper Inventory

### 3.1 Read-Only Canonical List Surfaces

| Surface | File | Route path | Method/action | Id semantics | Source assumptions | Auth/RBAC | Same-origin | Lifecycle transition | Writes canonical status | Writes Manual status | Writes proposal | Writes workflow log | Deletes files | Clears snapshot | Deletes attachment rows | Exposure risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Usul Musnah list API | `src/routes/api/arsiparis/usul-musnah.ts` | `/api/arsiparis/usul-musnah` | GET | canonical row ids in response | WORKFLOW + MANUAL aware through unified query | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | safe method only | none | no | no | no | no | no | no | no | safe DTO intent; no mutation |
| Usul Musnah list page | `src/routes/arsiparis/usul-musnah/index.tsx` | `/arsiparis/usul-musnah` | UI read/list | canonical `arsip.arsip.id` links | WORKFLOW + MANUAL aware by API DTO | client fetches authorized API | n/a | none | no | no | no | no | no | no | no | links to unified detail |
| Inaktif list page | `src/routes/arsiparis/inaktif/index.tsx` | `/arsiparis/inaktif` | UI read/list | canonical `arsip.arsip.id` links | WORKFLOW + MANUAL aware by API DTO | client fetches authorized API | n/a | none | no | no | no | no | no | no | no | links to unified detail |
| Aktif list page | `src/routes/arsiparis/aktif/index.tsx` | `/arsiparis/aktif` | UI read/list | canonical `arsip.arsip.id` links | WORKFLOW + MANUAL aware by API DTO | client fetches authorized API | n/a | none | no | no | no | no | no | no | no | links to unified detail |

Observed evidence:

- Usul Musnah list API calls `getUnifiedArchiveList({ statusArsip: ARCHIVE_STATUS.USUL_MUSNAH })` and maps `sourceType` to source labels.
- The Aktif, Inaktif, and Usul Musnah list pages link row actions to `/arsiparis/arsip/$id` with canonical row ids.

### 3.2 Legacy Workflow-Centric Detail Pages And Detail APIs

| Surface | File | Route path | Method/action | Id semantics | Source assumptions | Auth/RBAC | Same-origin | Lifecycle transition | Writes canonical status | Writes Manual status | Writes proposal | Writes workflow log | Deletes files | Clears snapshot | Deletes attachment rows | Exposure risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Active detail API | `src/routes/api/arsiparis/aktif.$id.ts` | `/api/arsiparis/aktif/$id` | GET | canonical `arsip.arsip.id` | WORKFLOW-only by inner join to workflow document | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | safe method only | none | no | no | no | no | no | no | no | returns snapshot-derived attachment DTO; legacy-only |
| Active detail page | `src/routes/arsiparis/aktif/$id.tsx` | `/arsiparis/aktif/$id` | UI detail + action | canonical `arsip.arsip.id` | WORKFLOW-only by API shape and workflow document preview | client fetches legacy API | n/a | calls legacy `AKTIF -> INAKTIF` mutation | via API | no | no | via API | no | no | no | uses workflow document preview endpoint, not unified source-aware file action |
| Inactive detail API | `src/routes/api/arsiparis/inaktif.$id.ts` | `/api/arsiparis/inaktif/$id` | GET | canonical `arsip.arsip.id` | WORKFLOW-only by inner join to workflow document | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | safe method only | none | no | no | no | no | no | no | no | returns snapshot-derived attachment DTO; legacy-only |
| Inactive detail page | `src/routes/arsiparis/inaktif/$id.tsx` | `/arsiparis/inaktif/$id` | UI detail + action | canonical `arsip.arsip.id` | WORKFLOW-only by API shape and workflow document preview | client fetches legacy API | n/a | calls legacy `INAKTIF -> USUL_MUSNAH` proposal mutation | via API | no | via API | via API | no | no | no | uses workflow document preview endpoint, not unified source-aware file action |
| Proposal detail API | `src/routes/api/arsiparis/usul-musnah.$id.ts` | `/api/arsiparis/usul-musnah/$id` | GET | `arsip_usul_musnah` proposal id | WORKFLOW-oriented by joins and workflow document fields | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | safe method only | none | no | no | reads proposal | no | no | no | no | returns snapshot-derived attachments and raw snapshot field; not safe as unified detail |
| Proposal detail page | `src/routes/arsiparis/usul-musnah/$id.tsx` | `/arsiparis/usul-musnah/$id` | UI detail + destructive action | `arsip_usul_musnah` proposal id | WORKFLOW-oriented by API shape and workflow document preview | client fetches legacy API | n/a | calls legacy proposal approval | via API | no | via API | via API | via API | via API | no | uses workflow document preview endpoint and destructive copy |

Observed evidence:

- Active and inactive detail APIs inner-join `arsip.arsip` to `dokumen_transaksi`, filter exact canonical status, and parse `lampiran_snapshot` into page DTOs.
- Active and inactive detail pages call workflow document preview endpoints directly.
- Proposal detail API looks up `arsip_usul_musnah.id` and joins to `arsip.arsip`; `$id` is proposal id, not canonical archive id.
- Proposal detail API includes both parsed attachment DTO and the raw snapshot value in its response.
- Proposal detail page calls the proposal API with `PATCH` body `{ aksi: 'SETUJUI' }` and displays copy that says files will be permanently deleted.

### 3.3 Legacy Mutation Routes

| Surface | File | Route path | Method/action | Id semantics | Source assumptions | Auth/RBAC | Same-origin | Lifecycle transition | Writes canonical status | Writes Manual status | Writes proposal | Writes workflow log | Deletes files | Clears snapshot | Deletes attachment rows | Exposure risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Legacy active movement | `src/routes/api/arsiparis/aktif.$id/pindahkan.ts` | `/api/arsiparis/aktif/$id/pindahkan` | POST | canonical `arsip.arsip.id` | WORKFLOW-oriented because it requires workflow document id for log | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | yes | `AKTIF -> INAKTIF` | yes | no | no | yes | no | no | no | no known path/token/root response exposure |
| Legacy proposal creation | `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts` | `/api/arsiparis/inaktif/$id/musnahkan` | POST | canonical `arsip.arsip.id` | WORKFLOW-oriented because it requires workflow document id for log | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | yes | `INAKTIF -> USUL_MUSNAH` | yes | no | inserts proposal | yes | no | no | no | no known path/token/root response exposure |
| Legacy proposal approval | `src/routes/api/arsiparis/usul-musnah.$id.ts` | `/api/arsiparis/usul-musnah/$id` | PATCH `{ aksi: 'SETUJUI' }` | `arsip_usul_musnah` proposal id | WORKFLOW-oriented; no Manual source sync | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` observed | yes | proposal `MENUNGGU -> DISETUJUI`; archive `USUL_MUSNAH -> DIMUSNAHKAN` | yes | no | updates proposal | yes | yes, direct local deletion after DB update | yes, sets snapshot to empty | no | high risk: direct physical deletion and raw snapshot coupling |

Observed evidence:

- `aktif.$id/pindahkan.ts` updates `arsip.statusArsip` to `INAKTIF` and inserts `logAktivitas` using the archive row's workflow document id.
- `inaktif.$id/musnahkan.ts` inserts `arsip_usul_musnah`, updates `arsip.statusArsip` to `USUL_MUSNAH`, and inserts `logAktivitas` using the workflow document id.
- `usul-musnah.$id.ts` imports local filesystem deletion primitives, prepares deletion candidates from the archive snapshot, updates the proposal and canonical archive, sets `lampiranSnapshot: []`, inserts `logAktivitas`, then deletes files after the DB transaction.
- The legacy proposal approval route does not update `manual_arsip.status_arsip` and does not use the 12N.10 source-aware helper.

### 3.4 Proposal Schema Surface

| Surface | File | Purpose | Observed behavior |
|---|---|---|---|
| Legacy proposal table | `src/db/schema/arsip/usul-musnah.ts` | Stores proposal rows linked to canonical archive id | `arsip_id` references `arsip.arsip.id`; status values are `MENUNGGU`, `DISETUJUI`, `DITOLAK`; one proposal per archive is enforced by a unique index |
| Canonical archive table | `src/db/schema/arsip/arsip.ts` | Stores unified archive parent and lifecycle authority | has `source_type`, `status_arsip`, `lampiran_snapshot`, destruction actor/time fields, and `dokumen_id` is nullable overall |
| Manual Archive tables | `src/db/schema/arsip/manual-arsip.ts` | Stores Manual Archive source rows and attachments | source rows have `canonical_arsip_id` and source status; attachments are separate metadata rows and should be preserved |

## 4. Conflict Analysis

### 4.1 Proposal Id Versus Canonical Id

Conflict:

- Unified lifecycle routes use canonical `arsip.arsip.id`.
- Legacy proposal detail and approval use `arsip_usul_musnah.id`.

Impact:

- A canonical archive id from `/arsiparis/arsip/$id` cannot be passed directly to `/api/arsiparis/usul-musnah/$id`.
- Existing canonical list pages already link to unified detail, so the old proposal detail page is no longer the primary route but can still be opened directly if a proposal id is known.
- Future redirects must resolve proposal id to canonical archive id safely. If there is no safe mapping, the route should show a safe compatibility message instead of mutating.

### 4.2 WORKFLOW-Only Assumptions

Conflict:

- Legacy detail APIs join to workflow documents and legacy mutation routes write `dokumen.log_aktivitas` with a workflow document id.
- The unified model supports both `WORKFLOW` and linked `MANUAL`.

Impact:

- Legacy active/inactive/proposal detail pages are not suitable for Manual Archive rows.
- Legacy mutation routes should not be the future lifecycle authority because they do not sync linked Manual source status and do not handle source/canonical drift.
- Manual Archive should not be forced into `arsip_usul_musnah` as the target governance model.

### 4.3 Duplicate Destruction Path

Conflict:

- Unified detail now exposes canonical lifecycle actions including `approve_destruction`.
- Legacy proposal page still exposes `Setuju Musnah` and calls the proposal PATCH route.

Impact:

- Operators can potentially reach two terminal destruction paths if the old URL is used directly.
- Unified `approve_destruction` is status-only and source-aware for Manual sync.
- Legacy proposal approval is proposal-coupled, WORKFLOW-oriented, deletes files directly, and clears snapshot metadata.

### 4.4 Physical Deletion And Snapshot Clearing

Conflict:

- Canonical policy preserves metadata and does not clear `lampiran_snapshot`.
- 12N.10 physical deletion helper preserves metadata and is source-aware.
- Legacy proposal approval clears snapshot metadata and directly deletes local files from snapshot candidates.

Impact:

- This is the highest-risk legacy surface.
- The old proposal approval route should not remain authoritative for destruction approval.
- Any direct file deletion or snapshot clearing in legacy proposal approval is incompatible with the canonical preservation policy.

### 4.5 Missing MANUAL Handling And Drift Protection

Conflict:

- Unified lifecycle route loads linked Manual Archive source rows, checks source/canonical status alignment through the planner, and updates both statuses for `MANUAL`.
- Legacy proposal routes do not load or update Manual Archive source status.

Impact:

- Legacy proposal routes can create status drift or leave Manual source rows operationally inconsistent if applied to a Manual canonical row.
- Existing `arsip_usul_musnah` schema links only to canonical archive id, but the legacy route behavior around logs and detail fields remains workflow-shaped.

### 4.6 Audit Model Conflict

Conflict:

- Legacy mutation routes write `dokumen.log_aktivitas`.
- Phase 12N.9 identifies the future target as archive-native audit because Manual Archive does not depend on workflow documents.
- No archive-native audit schema/table exists yet.

Impact:

- Legacy workflow log writes are not a complete unified audit model.
- The absence of archive-native audit remains an accepted limitation for this local/internal development phase, not a final governance posture.

### 4.7 File Action Compatibility

Conflict:

- Legacy status-specific detail pages call workflow document preview endpoints.
- Unified detail uses source-aware archive file actions and blocks `DIMUSNAHKAN`.

Impact:

- Legacy detail pages are not the target file-action surface.
- If retained temporarily, they should be treated as compatibility-only for WORKFLOW rows and should not receive new lifecycle features.

## 5. Compatibility Recommendation Per Route

| Surface | Recommendation | Rationale |
|---|---|---|
| `/api/arsiparis/usul-musnah` GET | Retain temporarily | It is already read-only and canonical-list based through unified query. Keep as list API until aggregate/export or routing cleanup changes it. |
| `/arsiparis/usul-musnah` page | Retain temporarily | Existing UI is still linked and already points row detail actions to `/arsiparis/arsip/$id`. No immediate removal needed. |
| `/api/arsiparis/usul-musnah/$id` GET | Refactor later to compatibility resolver or redirect support | `$id` is proposal id and the response is workflow/proposal shaped. Future behavior should either resolve proposal to canonical archive id and return a safe compatibility DTO, or return a safe message that unified detail should be used. |
| `/arsiparis/usul-musnah/$id` page | Redirect to unified route when safe; otherwise disable with safe message | The page is still a route surface and still calls destructive legacy approval. If proposal id maps to exactly one canonical archive, future cleanup should redirect to `/arsiparis/arsip/$id`. If not, disable mutation and show a safe compatibility message. Do not remove immediately because direct links/bookmarks may exist. |
| `/api/arsiparis/usul-musnah/$id` PATCH | Disable mutation or refactor later to canonical lifecycle; high risk | It is proposal-id based, directly deletes files, clears snapshot metadata, does not sync Manual source status, and does not use the 12N.10 source-aware helper. It should not remain authoritative. Do not wire it to physical deletion helper without human-approved implementation scope. |
| `/api/arsiparis/inaktif/$id/musnahkan` POST | Disable mutation or refactor later to canonical lifecycle | It creates legacy proposal rows and writes workflow log only. Unified `propose_destruction` already exists on canonical lifecycle and supports Manual sync. If old page still calls it, future cleanup should show a safe redirect/disabled message rather than removing without smoke review. |
| `/arsiparis/inaktif/$id` page | Redirect to unified detail when safe | The current list no longer links here, but the page still exposes legacy proposal creation and workflow preview. Future cleanup should redirect canonical archive ids to `/arsiparis/arsip/$id` or disable if the id is not a safe canonical archive id. |
| `/api/arsiparis/inaktif/$id` GET | Retain only as temporary compatibility view or refactor to redirect-support API | It is read-only but WORKFLOW-only. It can remain temporarily for old links, but should not be extended and should eventually yield to unified detail. |
| `/api/arsiparis/aktif/$id/pindahkan` POST | Disable mutation or refactor later to canonical lifecycle | Unified `mark_inactive` already exists and handles source-aware lifecycle planning. The old route writes workflow log only and does not support Manual source sync. |
| `/arsiparis/aktif/$id` page | Redirect to unified detail when safe | The current list no longer links here, but the page still exposes legacy movement and workflow preview. Future cleanup should redirect canonical archive ids to `/arsiparis/arsip/$id` or disable if unsafe. |
| `/api/arsiparis/aktif/$id` GET | Retain only as temporary compatibility view or refactor to redirect-support API | It is read-only but WORKFLOW-only. It should not be a target detail API for new behavior. |
| `arsip.arsip_usul_musnah` table/schema | Keep for historical/proposal compatibility until human-approved cleanup | Existing rows may exist and the schema is still referenced by legacy routes. Do not delete or backfill in this phase. |
| `destroyPhysicalFilesForDestroyedArchive()` helper | Retain as future canonical physical deletion helper | It is source-aware, status-guarded to `DIMUSNAHKAN`, metadata-preserving, and not wired to runtime. Future physical deletion should use it or a reviewed successor, not old proposal route logic. |

## 6. Legacy Destructive Approval Policy

Target policy:

- Legacy proposal-based physical deletion route should not remain the authoritative destruction path.
- Unified canonical lifecycle is the target status path.
- Any future physical file deletion should use the 12N.10 source-aware helper/policy or a reviewed successor.
- A legacy route that clears snapshot metadata or deletes files directly should be disabled or refactored before broader operational use.
- Do not delete the legacy route immediately in this phase.
- Do not modify runtime behavior in this phase.
- Do not wire physical deletion helper to legacy routes in this phase.
- Do not wire physical deletion helper to unified `approve_destruction` in this phase.

Recommended future behavior for the legacy PATCH route:

1. Stop treating proposal approval as the authoritative terminal lifecycle mutation.
2. If kept temporarily, return a safe compatibility response that directs operators to canonical unified detail.
3. If human approves refactor, resolve proposal id to canonical archive id and call the same canonical lifecycle policy path without direct file deletion or snapshot clearing.
4. Preserve existing proposal rows as historical/development provenance unless a later cleanup phase approves data cleanup.

## 7. Existing Proposal Row And Backward Compatibility Policy

Policy for existing `arsip_usul_musnah` rows:

- Do not backfill automatically in this phase.
- Do not create new legacy proposal rows from unified lifecycle in this phase.
- Existing proposal rows may remain historical/development artifacts until cleanup.
- If a proposal row links safely to one canonical archive, a future read-only compatibility view may display that relation or redirect to unified detail.
- If a proposal row has no safe canonical mapping, keep it out of unified lifecycle mutation and return a safe not-found/conflict message.
- If a proposal row points to a Manual Archive canonical row, do not force it through the workflow proposal model.
- Manual Archive should not be forced into the legacy workflow proposal governance shape.
- Multiple or inconsistent proposal/canonical states should fail closed and require human-reviewed remediation.

## 8. Future Implementation Recommendation

Roadmap discipline:

- 12O remains Aggregate / Export arsip unified.
- 12P-dev remains Development data/storage cleanup.
- Do not add extra phases without human approval.
- If route compatibility cleanup must be implemented before 12O, ask the human before adding a remediation implementation phase.
- Otherwise record 12N.11 as the plan and move to 12O.

Recommended implementation order if the human later approves cleanup:

1. Add compatibility guards or redirects for old status-specific pages before removing routes.
2. Disable or refactor legacy mutation endpoints before any broad operational use of old URLs.
3. Replace proposal approval mutation with canonical lifecycle behavior only after deciding whether proposal rows are historical-only, read-only compatibility, or a future archive-native proposal model.
4. Keep physical deletion separate from lifecycle status change and source-aware through the 12N.10 helper or successor.
5. Preserve metadata and attachment metadata rows.
6. Add archive-native audit schema only in a future schema-approved phase.

## 9. What Is Intentionally Not Changed

This phase does not:

- modify legacy proposal routes;
- delete legacy routes;
- redirect routes;
- disable routes;
- change unified lifecycle API behavior;
- wire physical deletion helper to legacy routes;
- wire physical deletion helper to `approve_destruction`;
- add audit schema;
- write audit rows;
- create migrations;
- modify Drizzle schema;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run DB migrations or seeds;
- run broad build or E2E;
- run cleanup;
- run destructive storage tests;
- reintroduce Supabase runtime behavior or old file/data recovery.

## 10. Validation

Required validation for this documentation-only phase:

```bash
git diff --check
```

Required protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

Tests are optional because this phase is docs-only/planning. Do not run broad build, E2E, DB migrations, seeds, route generation, cleanup, or destructive storage tests for this phase.

## 11. Next Roadmap Item

Proceed next to the existing roadmap item:

```text
12O - Aggregate / Export arsip unified
```

Do not add a route-compatibility implementation phase before 12O unless the human explicitly approves changing the roadmap.
