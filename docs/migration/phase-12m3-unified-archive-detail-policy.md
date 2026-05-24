# Phase 12M.3 - Unified Archive Detail Policy And Read-Only Detail Planning

Date: 2026-05-24

Status: planned. This phase is documentation and planning only. It does not implement a unified detail route, add routes, regenerate route files, change preview/download behavior, change lifecycle behavior, run reports, backfill data, cleanup rows/files, create migrations, or modify schema.

Implementation note after Phase 12M.4: the internal dependency-injected unified archive detail read service now exists in `src/lib/archive/unified-archive-detail.ts` with mocked unit tests. Route/page integration, source-aware attachment metadata display, preview/download actions, lifecycle mutation, cleanup, backfill, migrations, schema changes, and route generation remain deferred to later phases.

## Scope And Boundary

Phase 12M.3 defines the policy for a future read-only unified archive detail experience after Phase 12M.1 added the internal canonical list query service and Phase 12M.2 wired the Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages to canonical `arsip.arsip` rows.

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative. `ADMIN` remains a dedicated system/admin role, not an operational archive role. Operational archive detail access remains assigned to `KEPALA_SUB_BAGIAN_UMUM`.

The active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

Unified detail must read canonical `arsip.arsip` rows first:

- `source_type='WORKFLOW'` rows use `dokumen_id` as the source reference.
- `source_type='MANUAL'` rows use the linked source row where `manual_arsip.canonical_arsip_id = arsip.id`.
- Unlinked legacy Manual Archive rows remain remediation/report scope and must not be silently mixed into canonical unified detail.

## Current Detail Inventory

Existing detail behavior is source and status specific.

### Arsip Aktif Detail

Current route/page:

```text
/arsiparis/aktif/$id
```

Current API:

```text
GET /api/arsiparis/aktif/$id
POST /api/arsiparis/aktif/$id/pindahkan
```

Current behavior:

- workflow-oriented only;
- requires server-side assigned `KEPALA_SUB_BAGIAN_UMUM`;
- filters the archive row to `status_arsip='AKTIF'`;
- joins workflow document metadata from `dokumen_transaksi` and master data;
- displays archive metadata, workflow document metadata, workflow attachment snapshot entries, activity log, and a lifecycle action to move to Inaktif;
- the page currently offers workflow attachment preview from the detail page.

Limitations for unified detail:

- it is not source-aware for `MANUAL`;
- it assumes a workflow document exists;
- it combines read-only detail, attachment actions, and lifecycle mutation on one status-specific page.

### Arsip Inaktif Detail

Current route/page:

```text
/arsiparis/inaktif/$id
```

Current API:

```text
GET /api/arsiparis/inaktif/$id
POST /api/arsiparis/inaktif/$id/musnahkan
```

Current behavior:

- workflow-oriented only;
- requires server-side assigned `KEPALA_SUB_BAGIAN_UMUM`;
- filters the archive row to `status_arsip='INAKTIF'`;
- joins workflow document metadata from `dokumen_transaksi` and master data;
- displays archive metadata, workflow document metadata, workflow attachment snapshot entries, activity log, and a lifecycle action to propose destruction;
- the page currently offers workflow attachment preview from the detail page.

Limitations for unified detail:

- it is not source-aware for `MANUAL`;
- it assumes a workflow document exists;
- it combines read-only detail, attachment actions, and lifecycle mutation on one status-specific page.

### Usul Musnah Detail

Current route/page:

```text
/arsiparis/usul-musnah/$id
```

Current API:

```text
GET /api/arsiparis/usul-musnah/$id
PATCH /api/arsiparis/usul-musnah/$id
```

Current behavior:

- detail id is the `arsip_usul_musnah` id, not the canonical `arsip.arsip` id;
- requires server-side assigned `KEPALA_SUB_BAGIAN_UMUM`;
- joins `arsip_usul_musnah`, canonical archive row, optional workflow document metadata, and master data;
- displays proposal metadata, archive metadata, workflow source metadata when present, workflow attachment snapshot entries, activity log, and a destructive approval action;
- approval changes the archive to `DIMUSNAHKAN`, clears snapshot attachments, records destruction metadata, writes activity log, and attempts local file deletion.

Limitations for unified detail:

- it is proposal-centric, not canonical archive-id-centric;
- it is not a general detail page for all archive statuses;
- it includes lifecycle mutation and destruction behavior that must remain out of the future read-only detail foundation.

### Workflow Archive Detail Behavior

Workflow archive detail is currently represented by the status-specific pages above after a workflow document is archived.

The pre-archive detail page:

```text
/arsiparis/dokumen/$id
```

is a workflow document filing page for `COMPLETED` documents, not a unified archive detail page. It includes archive creation fields and should not be treated as the future canonical archive detail route.

Workflow file access currently uses authorized server/API boundaries and internal file access helpers. Current file-access hardening rechecks current document/archive state and blocks file access when a related archive is `DIMUSNAHKAN`. Future unified detail must reuse or wrap that policy rather than expose stored paths or file internals.

### Manual Archive Detail And Attachment Behavior

Current Manual Archive APIs:

```text
GET /api/arsiparis/manual-arsip/$id
PATCH /api/arsiparis/manual-arsip/$id
GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview
GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download
```

Current behavior:

- requires local session and assigned `KEPALA_SUB_BAGIAN_UMUM`;
- does not authorize from `dms_active_role`;
- returns Manual Archive parent metadata and safe attachment metadata from the Manual Archive source tables;
- parent metadata edit is locked for non-`AKTIF` rows;
- attachment preview/download is direct authorized API file serving;
- attachment preview/download blocks `DIMUSNAHKAN` with a safe `410` response;
- content type and storage path safety are revalidated server-side.

The existing `/arsiparis/penambahan-arsip` page can expand a Manual Archive row and show Manual Archive attachments. That is source-specific Manual Archive UI, not unified canonical detail.

## Recommended Future Route

Recommended canonical detail route:

```text
/arsiparis/arsip/$id
```

Where `$id` is the canonical `arsip.arsip.id`.

Rationale:

- `/arsiparis` preserves the existing route namespace for the operational archive role.
- `/arsip` clearly identifies canonical archive records rather than status-specific pages.
- One route can handle `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and approved metadata-only `DIMUSNAHKAN` display.
- It avoids overloading `/arsiparis/dokumen/$id`, which is workflow filing/detail for documents before or during archive creation.
- It allows existing status-specific routes to remain temporarily as lifecycle/action pages while unified read-only detail stabilizes.

Future implementation should keep existing status-specific detail routes temporarily. They can later redirect, delegate to the read service, or become lifecycle action views after human review. Do not remove them in the first unified detail implementation.

Future unified list pages should link rows to `/arsiparis/arsip/$id` after the route and read service exist. That future implementation will require route generation because a new file-based TanStack route will be added. Phase 12M.3 does not add the route and does not modify generated route files.

## Unified Detail DTO Policy

Future read service should return a safe read-only DTO, not raw DB rows.

Recommended shape:

```ts
type UnifiedArchiveDetail = {
  id: string
  sourceType: 'WORKFLOW' | 'MANUAL' | 'UNKNOWN'
  statusArsip: 'AKTIF' | 'INAKTIF' | 'USUL_MUSNAH' | 'DIMUSNAHKAN'
  namaArsip: string | null
  nomorSurat: string | null
  klasifikasiId: string | null
  klasifikasiKodeSnapshot: string | null
  klasifikasiNamaSnapshot: string | null
  tanggalArsip: string | null
  retensiAktif: string | null
  retensiInaktif: string | null
  masaAktifBerakhir: string | null
  masaInaktifBerakhir: string | null
  nominalRealisasi: string | number | null
  createdBy: string | null
  archivedBy: string | null
  createdAt: string | null
  updatedAt: string | null
  warnings: UnifiedArchiveDetailWarning[]
  source: WorkflowArchiveDetailSource | ManualArchiveDetailSource | null
  attachments: UnifiedArchiveAttachmentSummary[]
}
```

The DTO must not include stored file paths, physical filesystem paths, storage roots, file URLs, preview/download URLs, tokens, signed URL internals, raw attachment metadata, raw JSON snapshots, SQL details, SQL parameters, environment values, session/cookie values, password data, secrets, or raw DB rows.

Warnings should remain controlled labels or UI-safe messages. Examples:

- missing Manual Archive source for a canonical `MANUAL` row;
- workflow archive row without a workflow document reference;
- Manual Archive row with an unexpected workflow document reference;
- unknown source type;
- attachment metadata unavailable;
- source metadata incomplete.

Warnings are not repair actions and must not leak internal identifiers beyond the canonical archive id already being viewed.

## WORKFLOW-Specific Section Policy

For `sourceType='WORKFLOW'`, future detail may show safe workflow source metadata:

- workflow document id;
- document title or safe source title;
- material/non-material indicator;
- workflow source status when useful for traceability;
- function, activity, request type/category/detail, year, creator display metadata where already safe and useful;
- final/archived relationship metadata needed to understand provenance.

Rules:

- workflow metadata is read-only from this unified detail;
- do not allow editing workflow document metadata from unified archive detail;
- do not use workflow approval metadata as the main list columns;
- do not expose raw workflow row payloads, raw approval internals, stored file paths, or raw attachment snapshots;
- if the canonical archive row is source-incomplete, show safe warnings and keep mutation/backfill out of the detail route.

## MANUAL-Specific Section Policy

For `sourceType='MANUAL'`, future detail may show safe Manual Archive source metadata:

- Manual Archive source id;
- `keterangan`;
- Manual Archive category name/description when safe;
- source document/date metadata such as Manual Archive source date and archive date;
- linked attachment count;
- classification snapshots and retention values already mirrored into canonical archive metadata;
- created/archived user display metadata where safe.

Rules:

- do not show workflow metadata for Manual Archive rows;
- do not require `dokumen_transaksi`;
- do not silently include unlinked legacy Manual Archive rows;
- do not create canonical rows from the detail read service;
- do not update the source link from the detail read service;
- do not expose stored file paths, raw attachment rows, raw metadata JSON, or file internals.

## Attachment Policy

Unified detail should show attachment metadata on the detail page, not on unified list pages.

Recommended future detail metadata:

- attachment id only when needed to target authorized source-specific actions;
- display title;
- friendly type label;
- size when safe;
- created/uploaded date when safe;
- source type;
- availability state such as available, unavailable because destroyed, unavailable because source incomplete.

### WORKFLOW Attachments

For workflow archive rows:

- use archive-time attachment snapshot metadata or an existing authorized workflow/archive attachment access policy;
- do not expose raw stored paths;
- preview/download must go through authorized server/API boundaries;
- stale tokens and direct path-style requests must recheck current archive state;
- `DIMUSNAHKAN` must block preview/download/file access.

Future implementation should first decide whether workflow archive detail should use document lampiran index semantics, archive snapshot attachment ids, or a new source-aware attachment abstraction. Do not guess this in the UI layer.

### MANUAL Attachments

For Manual Archive rows:

- load attachments by the linked Manual Archive source id;
- show safe attachment metadata from the Manual Archive attachment model;
- preview/download should use the existing authorized Manual Archive endpoints if they remain valid;
- do not expose raw stored paths;
- do not include raw source rows or raw attachment metadata;
- `DIMUSNAHKAN` must block preview/download/file access in the API, not only in UI rendering.

Phase 12M.3 does not add attachment actions. Recommended future UI is metadata first, then preview/download actions from detail after the source-aware file policy is verified.

## DIMUSNAHKAN File-Access Policy

Future unified detail may show metadata for `DIMUSNAHKAN` rows if approved by product/governance, because metadata can remain useful for audit and retention history.

File access policy is stricter:

- `DIMUSNAHKAN` must block preview, download, direct file serving, and stale file access tokens;
- UI hiding is not sufficient;
- server/API file routes must enforce the lifecycle check every time;
- stale tokens, stale route parameters, or remembered paths must not bypass destruction state;
- responses must be safe and must not reveal stored paths, storage roots, token internals, file internals, or physical filesystem details.

Later implementation must explicitly retest both existing workflow file access and Manual Archive attachment file access against `DIMUSNAHKAN` before adding unified detail actions.

## Authorization Policy

Future unified detail must:

- require local `dms_session`;
- require assigned `KEPALA_SUB_BAGIAN_UMUM` for operational archive detail;
- not authorize from `dms_active_role`;
- not treat `ADMIN`-only accounts as operational archive access;
- keep server/API RBAC authoritative;
- keep any client-side route guards as UX only;
- avoid exposing SQL, environment values, cookies, session values, tokens, file internals, or storage implementation details in errors.

If other roles later need metadata-only archive detail, that must be a separate authorization decision with its own DTO and route policy.

## Future Phase Split

Recommended split:

```text
Phase 12M.4 - Unified Archive Detail Read Service
Phase 12M.5 - Unified Archive Detail Page Integration
Phase 12M.6 - Source-Aware Detail Attachment Metadata Display
Phase 12M.7 - Source-Aware Preview/Download Actions From Detail
Phase 12N - Lifecycle API Unification
Phase 12O - Aggregate/Export
Phase 12P-dev - Development Archive Data/Storage Cleanup
```

This deliberately increases phase count. The safer split keeps read-only canonical detail, source-specific attachment metadata, file access, lifecycle mutation, export/aggregate, and development cleanup from being bundled into one medium-high-risk change.

Minimum safe sequencing:

1. Build and test the read service with mocked readers and no UI.
2. Add the canonical detail route/page without preview/download actions.
3. Add attachment metadata display only.
4. Add source-aware preview/download actions only after `DIMUSNAHKAN` enforcement is reverified server-side.
5. Unify lifecycle APIs separately.
6. Implement aggregate/export separately.
7. Cleanup old development data/storage only after list/detail behavior is stable.

## Development Cleanup Note

Human decision recorded for planning: old development seed data and related storage files from pre-consolidation Manual Archive work may be cleaned later because this is a development repository.

Cleanup must be a dedicated development cleanup phase after unified list/detail behavior is stable. It must not be mixed into unified detail implementation.

Future cleanup must:

- protect valid canonical rows;
- protect currently referenced attachment records;
- avoid printing stored paths, physical paths, storage roots, tokens, environment values, secrets, raw file metadata, or raw SQL details;
- avoid destructive deletion until a human-reviewed dry-run/report exists;
- keep cleanup separate from backfill, lifecycle unification, and route/page work.

## What Is Intentionally Not Changed

This phase does not:

- implement a unified detail route/page;
- create new routes;
- modify `src/routeTree.gen.ts`;
- run route generation;
- add preview/download buttons;
- change existing preview/download endpoints;
- change Manual Archive attachment upload/preview/download behavior;
- change workflow archive preview/download behavior;
- implement lifecycle mutation;
- implement destruction mutation;
- implement search;
- implement aggregate/export;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run a live DB report;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update Manual Archive source links;
- create migrations;
- modify Drizzle schema;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`.

## Risks And Open Decisions

Risks:

- existing status-specific detail pages are workflow-only and still expose preview actions, so the future read-only detail page must not copy them wholesale;
- Usul Musnah detail currently uses proposal id, while the recommended unified route uses canonical archive id;
- Manual Archive attachment endpoints are source-specific and may be reused, but they must still be rechecked in the unified context;
- workflow attachment access currently has multiple route styles, so the future implementation should consolidate policy before adding UI actions;
- `DIMUSNAHKAN` metadata display may be useful, but file access must remain blocked everywhere;
- unlinked legacy Manual Archive rows remain absent from canonical unified detail until remediation/backfill is separately approved;
- future route generation is required when `/arsiparis/arsip/$id` is implemented.

Open decisions:

- whether `DIMUSNAHKAN` rows should be reachable by direct canonical detail URL, listed in a separate view, or hidden except audit/admin reports;
- whether existing status-specific pages become redirects, lifecycle action views, or deprecated compatibility pages;
- whether workflow attachments need a new archive attachment id abstraction instead of index-based access;
- whether source display should include user display names from joins or only user ids in the first read service;
- whether a future dedicated Manual Archive source reference column is needed on canonical archive rows;
- exact UI wording for unavailable attachments and source integrity warnings;
- when to schedule the dedicated development cleanup phase.

## Immediate Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12M.4 - Unified Archive Detail Read Service
```

That phase should implement an internal read-only, dependency-injected detail query service for canonical `arsip.arsip.id` with mocked unit tests. It should not add routes/UI, preview/download actions, lifecycle mutation, search, export, cleanup, live reports, backfill, migrations, schema changes, or route generation.
