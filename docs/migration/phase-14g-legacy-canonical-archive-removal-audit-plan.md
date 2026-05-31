# Phase 14G - Legacy Canonical Archive Removal Audit Plan

Date: 2026-05-31

Status: planning/audit only.

## Phase Status

Phase 14G audits remaining legacy canonical archive code, API, schema, helper, and test surfaces before hard removal.

This phase does not remove runtime code, routes, APIs, helpers, tests, schema, migrations, database rows, or physical files. It does not run migrations, seeds, cleanup scripts, broad build, E2E, dev server, route generation, or package operations.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain. This phase does not claim Supabase is fully removed from the repository and does not add any Supabase fallback.

## User Cleanup Decision

The current cleanup policy is:

- this repository is still in active development;
- old archive data is not important for the development cleanup target;
- legacy canonical archive UI, API, code, and database objects that are not used by the new folder-first runtime should be removed instead of kept indefinitely as redirect or compatibility surfaces;
- the priority is a clean codebase and clean database for the folder-first archive model.

This changes the earlier 13Z/14A compatibility posture. Historical docs can remain as traceability, but future implementation phases should delete unused canonical runtime surfaces and then drop unused canonical schema objects in a separate schema cleanup phase.

## Current Folder-First Runtime Authority

Protect these components:

- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`;
- `dokumen.dokumen_transaksi` as the `WORKFLOW` source;
- `arsip.manual_arsip` as the `MANUAL` source;
- `arsip.manual_arsip_attachment` for manual source files;
- `src/lib/archive/berkas-arsip-api.ts`;
- `src/lib/archive/berkas-arsip-attachment-names.ts`;
- `src/lib/archive/berkas-arsip-csv.ts`;
- `src/lib/archive/berkas-arsip-file-access.ts`;
- `src/lib/archive/berkas-arsip-page-format.ts`;
- `src/lib/archive/berkas-arsip-physical-destruction.ts`;
- `src/lib/archive/berkas-arsip-read-model.ts`;
- `src/lib/archive/berkas-arsip-service.ts`;
- `src/lib/archive/berkas-klasifikasi-eligibility.ts`;
- `src/routes/arsiparis/berkas/index.tsx`;
- `src/routes/arsiparis/berkas/$id.tsx`;
- `src/routes/arsiparis/inaktif/index.tsx`;
- `src/routes/arsiparis/usul-musnah/index.tsx`;
- `src/routes/api/arsiparis/berkas/**`;
- `src/routes/api/arsiparis/dokumen.$id.archive.ts` as the de-transitionalized workflow classification write route;
- `src/routes/api/arsiparis/manual-arsip/**` as the manual source route family.

The folder-first pages and APIs must keep:

- server-side `dms_session` authorization;
- assigned `KEPALA_SUB_BAGIAN_UMUM` authorization for archive/folder operations;
- no `ADMIN` substitution for operational archive actions;
- local filters and metadata-only CSV exports;
- folder-level lifecycle `OPEN/CLOSED` plus `AKTIF/INAKTIF/USUL_MUSNAH/DIMUSNAHKAN`;
- `Musnahkan Data` folder-first physical deletion behavior;
- destroyed-file file-access copy `Data file sudah dimusnahkan`;
- no exposure of raw IDs except required safe routing ids, and no exposure of item file keys, logical paths, physical paths, storage roots, URLs, tokens, signed-token internals, SQL/env/session/cookie values, secrets, raw rows, password hashes, or file content.

## Audit Inputs

Read/audited inputs:

- `AGENTS.md`;
- Phase 13Z, 14A, 14B, 14E, 14F, 13K, 13T, and 13U migration docs;
- `src/db/schema/arsip/*`;
- `src/lib/archive/*`;
- `src/routes/arsiparis/*`;
- `src/routes/api/arsiparis/*`;
- `tests/unit/arsiparis/*`;
- Drizzle migration files for reference only.

Searches run:

- `git grep -n "arsip.arsip" src tests docs drizzle`;
- `git grep -n "lampiran_snapshot" src tests docs drizzle`;
- `git grep -n "canonical_arsip_id" src tests docs drizzle`;
- `git grep -n "canonicalArsipId" src tests docs`;
- `git grep -n "unified-archive" src tests docs`;
- `git grep -n "getUnifiedArchive" src tests docs`;
- `git grep -n "legacy" src tests docs`;
- `git grep -n "arsiparis/arsip" src tests docs`;
- `git grep -n "api/arsiparis/arsip" src tests docs`;
- `git grep -n "api/arsiparis/aktif" src tests docs`;
- `git grep -n "api/arsiparis/inaktif" src tests docs`;
- `git grep -n "api/arsiparis/usul-musnah" src tests docs`;
- `git grep -n "api/arsiparis/search" src tests docs`;
- `git grep -n "arsipUsulMusnah" src tests docs`;
- `git grep -n "arsip_usul_musnah" src tests docs drizzle`;
- `git grep -n "manual_arsip" src/db/schema src/lib src/routes tests docs`;
- `git grep -n "berkas_arsip" src/db/schema src/lib src/routes tests docs`;
- `git grep -n "lampiranSnapshot" src tests docs`;
- `git grep -n "archive snapshot" src tests docs`.

Note: the prompt path `src/db/schema/arsip.ts` is stale. The active schema is split under `src/db/schema/arsip/`.

## Legacy DB Object Audit

| Object | Current references/callers | Decision | Remove phase | Risk | Validation needed |
|---|---|---|---|---|---|
| `arsip.arsip` table, Drizzle model `src/db/schema/arsip/arsip.ts` | Canonical routes/APIs, `unified-*` helpers, storage diagnostics/cleanup guards, old docs/tests, FK targets from canonical bridges | Remove after runtime cleanup and storage guard replacement. Not folder-first authority. | 14I | High: current storage diagnostics and internal/document file-access checks still reference `lampiranSnapshot`; dropping before guard replacement can weaken cleanup protection or file-access destroyed awareness. | `git grep arsip` no active runtime callers outside historical docs; targeted storage diagnostics tests; folder-first file-access tests; migration dry validation. |
| `arsip.arsip.lampiran_snapshot` | `unified-archive-detail`, `unified-archive-file-actions`, `unified-archive-query`, `unified-archive-physical-destruction`, dev cleanup, local storage diagnostics, document/internal file access, admin cleanup | Remove with `arsip.arsip` only after runtime deletion and storage cleanup reference model no longer depends on canonical snapshots. | 14I | High: cleanup currently protects retained canonical snapshot references. In dev data cleanup this may be acceptable only after explicit 14I migration policy. | Storage diagnostics route/unit tests; admin cleanup tests; document destroyed-folder access tests. |
| `arsip.arsip_usul_musnah` table, Drizzle model `src/db/schema/arsip/usul-musnah.ts` | Only schema, Phase 13 legacy dev reset helpers/tests, historical docs; current unified lifecycle route explicitly does not use it | Remove. Folder-first lifecycle does not use proposal table. | 14I | Medium: old dev reset helpers depend on it; old migrations reference it. | `git grep arsipUsulMusnah`; ensure old route files are already absent; remove/reset-helper tests with helper deletion. |
| `manual_arsip.canonical_arsip_id` column/FK/unique index | Manual edit compatibility sync in `src/lib/manual-arsip.ts`, canonicalization/remediation helpers, unified canonical helpers, older tests | Remove after canonical runtime/helper deletion. Keep `manual_arsip` itself as MANUAL source. | 14I | Medium: manual edit code still syncs old linked canonical rows; must remove that branch first in 14H. | Manual archive create/edit tests updated to assert no canonical sync; schema migration validates column/index/FK removal. |
| `berkas_arsip_item.canonical_arsip_id` column/FK/index | `berkas-arsip-service` still maps/persists bridge when old canonical id exists; read model/API strips it from safe DTOs | Remove after bridge writes/read mapping are removed. Keep `berkas_arsip_item` itself. | 14I | Medium: service tests currently include bridge fields; removing schema first breaks inserts/selects. | Folder service/read-model/API tests updated; grep confirms no bridge field in runtime. |
| Canonical `arsip.status_arsip`, `source_type`, destruction columns, nominal/retention fields on `arsip.arsip` | Only relevant while `arsip.arsip` exists | Drop with table. | 14I | Low once table removal is approved. | Drizzle schema/migration check. |
| `ArchiveSourceType`, `LampiranSnapshotJson`, `Arsip`, `NewArsip` types | Exported from `src/db/schema/arsip/arsip.ts` and used by canonical helpers | Delete with canonical schema/helper removal. | 14H/14I split | Medium: imports fail if helpers not removed first. | Typecheck or targeted import grep after 14H. |
| `master_klasifikasi_arsip` | Used by folder-first `berkas_arsip`, manual source, workflow classification | Keep. | none | High if removed. | Existing berkas/manual/workflow tests. |
| `manual_arsip`, `manual_arsip_attachment`, `manual_arsip_category` | Active manual source and attachment model | Keep, except remove `canonical_arsip_id` bridge from parent later. | partial 14I | High if removed. | Manual route, folder read-model, folder file-access, physical deletion tests. |

## Legacy Route And API Audit

| Route/API | File | Current references/callers | Decision | Remove phase | Risk | Validation needed |
|---|---|---|---|---|---|---|
| `/arsiparis/arsip/$id` | `src/routes/arsiparis/arsip/$id.tsx` | Browser route registered; calls canonical detail and lifecycle APIs; no active folder-first list links observed | Delete. Old canonical detail is no longer a cleanup goal. | 14H | Medium: routeTree must be regenerated in implementation phase; old tests must be removed/updated. | Route deletion plus routeTree regeneration in 14H; grep no active links; folder pages still link to `/arsiparis/berkas/$id`. |
| `GET /api/arsiparis/arsip/$id` plus `action=preview/download` | `src/routes/api/arsiparis/arsip/$id.ts` | Called by `/arsiparis/arsip/$id`; tests import route directly | Delete with page. Folder-first item preview/download remains under `/api/arsiparis/berkas/$id/items/...`. | 14H | Medium: remove only after page deletion; ensure no file-access safety regression for folder-first destroyed files. | Unified route tests deleted; folder-first file-access and destroyed-file tests retained. |
| `POST /api/arsiparis/arsip/$id/lifecycle` | `src/routes/api/arsiparis/arsip/$id/lifecycle.ts` | Called by canonical detail page; mutates `arsip.arsip` and linked `manual_arsip` | Delete. Conflicts with folder-level lifecycle authority. | 14H | High if left active: can mutate non-authoritative lifecycle. | Remove page caller and route; grep no `UnifiedArchiveLifecycle`; folder lifecycle route tests pass. |
| `GET /api/arsiparis/aktif` | `src/routes/api/arsiparis/aktif.ts` | No active page caller observed; old redirect `/arsiparis/aktif` does not call it | Delete. Folder-first active data is `/api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF`. | 14H | Low. | Grep no callers; dashboard active count remains folder-first. |
| `GET /api/arsiparis/inaktif` | `src/routes/api/arsiparis/inaktif.ts` | Arsiparis dashboard currently calls `/arsiparis/inaktif` for count through `apiFetch`; folder page itself is folder-first | Move dashboard count to folder-first API, then delete. | 14H | Medium: dashboard count would break if endpoint is deleted first. | Dashboard source grep no `/arsiparis/inaktif` API count; dashboard count unit/source test if present. |
| `GET /api/arsiparis/usul-musnah` | `src/routes/api/arsiparis/usul-musnah.ts` | Arsiparis dashboard currently calls `/arsiparis/usul-musnah` for count through `apiFetch`; folder page itself is folder-first | Move dashboard count to folder-first API, then delete. | 14H | Medium: dashboard count would break if endpoint is deleted first. | Dashboard source grep no `/arsiparis/usul-musnah` API count; dashboard count unit/source test if present. |
| `/arsiparis/aktif` | `src/routes/arsiparis/aktif/index.tsx` | Redirect-only to `/arsiparis/berkas` | Optional delete or keep one more phase as redirect. User policy prefers no permanent compatibility; delete if navigation/constants no longer need it. | 14H | Low: bookmarked URL stops resolving if hard-deleted. Acceptable under new dev cleanup policy. | Navigation/routes constants updated; routeTree regenerated in 14H. |
| `/arsiparis/search` | `src/routes/arsiparis/search.tsx` | Redirect-only to `/arsiparis/berkas`; route constant still exists | Delete or keep only if humans want redirect during one cleanup phase. New policy supports deletion. | 14H | Low: old bookmark loses redirect. | Navigation/constants grep; routeTree regenerated. |
| `GET /api/arsiparis/search` | `src/routes/api/arsiparis/search.ts` | Deprecated compatibility-only canonical search API; no active UI caller after 14B/14C | Delete. Local page filters are the intended search behavior. | 14H | Low-medium: non-UI consumers, if any, lose endpoint; accepted under dev cleanup policy. | Grep no callers; routeTree regenerated; auth navigation search test updated. |
| `GET /api/arsiparis/arsip/aggregate` | `src/routes/api/arsiparis/arsip/aggregate.ts` | No active folder-first caller observed; tests import directly | Delete. Canonical aggregate is not active report authority. | 14H | Low. | Remove tests; grep no callers. |
| `GET /api/arsiparis/arsip/export` | `src/routes/api/arsiparis/arsip/export.ts` | No active folder-first caller observed; tests import directly; folder-first CSV is client-side safe DTO export | Delete. Do not restore backend canonical export. | 14H | Low. | Remove tests; grep no callers; folder-first CSV tests retained. |
| `GET /api/arsiparis/arsip/classification-report` | Removed in Phase 14E | None active | Already removed. | done | None. | Keep routeTree absence assertions until adjusted. |
| `GET /api/arsiparis/arsip/classification-report-detail` | Removed in Phase 14E | None active | Already removed. | done | None. | Keep routeTree absence assertions until adjusted. |

## Legacy Helper And Test Audit

| Helper/test surface | Files | Current references/callers | Decision | Remove phase | Risk | Validation needed |
|---|---|---|---|---|---|---|
| Unified canonical query/detail/file actions | `unified-archive-query.ts`, `unified-archive-detail.ts`, `unified-archive-file-actions.ts` and matching tests | Back canonical list/detail/file APIs | Delete with canonical APIs. | 14H | Medium: `unified-archive-detail.ts` imports file actions; delete as a set. | Grep no imports; folder-first file-access tests pass. |
| Unified canonical lifecycle | `unified-archive-lifecycle.ts`, route tests, helper tests | Back canonical lifecycle API only | Delete with lifecycle API. | 14H | Medium: manual sync branch removed with API. | Grep no imports; folder lifecycle tests retained. |
| Unified canonical aggregate/export | `unified-archive-aggregate-export.ts`, aggregate/export tests | Back `/api/arsiparis/arsip/aggregate` and `/export` only | Delete with aggregate/export APIs. | 14H | Low. | Grep no imports; folder CSV tests retained. |
| Unified compatibility reader/helpers | `unified-compatibility-reader.ts`, `unified-compatibility.ts`, matching tests | Internal compatibility/report helpers for canonical migration gaps | Delete unless a current non-runtime maintenance doc explicitly keeps them. Under new cleanup policy, remove with canonical compatibility surface. | 14H | Low-medium: docs/tests will need updates; no active folder-first caller observed. | Grep no imports; remove tests. |
| Unified canonical physical destruction | `unified-archive-physical-destruction.ts`, matching tests | Not wired to active folder-first runtime; prior-art helper for `arsip.arsip` and `lampiran_snapshot` | Delete in runtime helper cleanup, or keep only as historical doc reference if copied to docs. Prefer delete code. | 14H | Low: folder-first physical deletion uses separate helper. | Folder-first physical destruction tests pass. |
| Manual archive canonicalization/remediation | `manual-archive-canonical.ts`, `manual-archive-canonicalization-backfill.ts`, `manual-archive-canonicalization-dry-run.ts`, `manual-archive-remediation-report.ts`, matching tests | Old canonical bridge/remediation utilities; some manual route edit tests still assert canonical sync behavior through `src/lib/manual-arsip.ts` | Remove canonicalization/remediation utilities after manual edit canonical sync is removed. | 14H | Medium: manual route tests must be rewritten to source/folder-first behavior. | Manual create/edit tests; grep no `canonicalArsipId` in manual route runtime except removed schema bridge. |
| Phase 13 legacy archive dev reset helpers | `phase13-legacy-archive-dev-reset-analysis.ts`, `phase13-legacy-archive-dev-reset-execution.ts`, matching tests | Dev reset helpers for old canonical rows and `arsip_usul_musnah` | Delete. New cleanup policy favors schema reset/migration validation instead of preserving old dev reset helpers. | 14H | Low-medium: remove any docs that recommend running them. | Grep no imports; ensure no scripts call them. |
| Dev manual archive cleanup | `dev-manual-archive-cleanup.ts`, matching tests | Dev cleanup helper protecting canonical/manual relationships and snapshot references | Unclear: keep only if still useful for manual source cleanup without canonical references; otherwise delete or rewrite after canonical schema removal. | 14H or 14I | Medium: helper may still be useful for manual source attachment cleanup but references canonical snapshots. | Human decision or rewrite plan; grep canonical references. |
| `workflow-nama-arsip.ts` | Helper/test | Used for source naming semantics, not inherently canonical | Keep if still used by workflow/folder naming. | none unless grep says unused | Low. | Grep imports before deletion. |
| Folder-first helper/tests | `berkas-*` helpers and tests | Active runtime | Keep. | none | High if removed. | Existing targeted folder-first unit tests. |

## Active Folder-First Dependencies Not To Remove

Do not remove:

- `src/db/schema/arsip/berkas-arsip.ts` except the transitional `canonicalArsipId` column in a later schema cleanup;
- `src/db/schema/arsip/manual-arsip.ts` except the transitional `canonicalArsipId` column in a later schema cleanup;
- `src/db/schema/arsip/klasifikasi-arsip.ts`;
- `src/routes/api/arsiparis/berkas/**`;
- `src/routes/arsiparis/berkas/**`;
- `src/routes/arsiparis/inaktif/index.tsx`;
- `src/routes/arsiparis/usul-musnah/index.tsx`;
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`;
- `src/routes/api/arsiparis/manual-arsip/**`;
- `src/lib/archive/berkas-*`;
- `src/lib/archive/retention.ts`;
- `src/lib/archive/workflow-nama-arsip.ts` if import grep confirms active use;
- `src/lib/storage/document-file-access.ts` destroyed-folder awareness;
- `src/components/dokumen/AttachmentViewer.tsx` destroyed-file UX behavior.

## Recommended Implementation Phases

### Phase 14H - Remove Legacy Canonical Runtime Routes/APIs/Helpers

Scope:

1. Move Arsiparis dashboard `inaktif` and `usulMusnah` counts from old canonical list APIs to `GET /api/arsiparis/berkas` with folder-first filters.
2. Delete canonical browser routes and redirect-only compatibility routes if accepted:
   - `/arsiparis/arsip/$id`;
   - `/arsiparis/aktif`;
   - `/arsiparis/search`.
3. Delete canonical APIs:
   - `GET /api/arsiparis/aktif`;
   - `GET /api/arsiparis/inaktif`;
   - `GET /api/arsiparis/usul-musnah`;
   - `GET /api/arsiparis/search`;
   - `GET /api/arsiparis/arsip/$id`;
   - `POST /api/arsiparis/arsip/$id/lifecycle`;
   - `GET /api/arsiparis/arsip/aggregate`;
   - `GET /api/arsiparis/arsip/export`.
4. Delete now-unused canonical `unified-*` helpers and their tests.
5. Remove or rewrite manual canonical bridge/remediation helpers and old canonical sync branches.
6. Regenerate `src/routeTree.gen.ts` only in that implementation phase.

Validation:

- targeted folder-first unit tests:
  - `tests/unit/arsiparis/berkas-arsip-api.test.ts`;
  - `tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts`;
  - `tests/unit/arsiparis/berkas-arsip-read-model.test.ts`;
  - `tests/unit/arsiparis/berkas-arsip-file-access.test.ts`;
  - `tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts`;
  - `tests/unit/arsiparis/berkas-arsip-csv.test.ts`;
  - `tests/unit/arsiparis/manual-arsip-route.test.ts`;
  - `tests/unit/arsiparis/workflow-archive-route.test.ts`;
- grep checks for deleted route strings and `getUnifiedArchive`;
- routeTree diff confirms only deregistration of removed routes.

### Phase 14I - Drop Legacy Canonical Archive Schema/Tables/Columns

Scope:

1. Drop `arsip.arsip_usul_musnah`.
2. Drop `arsip.arsip`.
3. Drop `manual_arsip.canonical_arsip_id` FK/index/column.
4. Drop `berkas_arsip_item.canonical_arsip_id` FK/index/column.
5. Remove Drizzle schema files/exports/types for dropped canonical objects.
6. Update storage diagnostics/admin cleanup reference guards so they protect current folder-first/manual/workflow source references without canonical snapshots.

Validation:

- Drizzle migration generation/review in the implementation phase;
- migration apply against disposable dev DB only;
- targeted storage diagnostics/admin cleanup tests;
- targeted folder-first and manual source tests;
- `git grep` confirms no active runtime import of dropped schema objects.

Keep 14I separate from 14H unless risk is explicitly accepted. The schema drop depends on proving no runtime/storage/admin cleanup path still reads canonical snapshot data.

### Phase 14J - Dev DB Reset/Migration Validation

Scope:

- reset or recreate a disposable development database from the cleaned migration chain;
- run migrations from scratch;
- verify clean schema has folder-first archive objects only for runtime archive authority;
- do not preserve old archive data.

Validation:

- migration status/apply evidence;
- schema introspection with safe table/column names only;
- no data dumps, secrets, DB URLs, or raw rows in documentation.

### Phase 14K - Final Regression Sweep

Scope:

- focused runtime regression on folder-first archive pages, lifecycle, manual creation, workflow classification, file preview/download, destroyed-file behavior, physical deletion summary, local filters, and CSV export;
- targeted tests first, broader build only if explicitly approved.

Validation:

- folder-first unit test set;
- manual smoke checklist for `/arsiparis/berkas`, `/arsiparis/berkas/$id`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, `Musnahkan Data`, and destroyed preview/download.

## Combining Phases

Do not combine 14H and 14I by default.

It is safe to combine only these narrow pieces if implementation risk is low:

- delete canonical routes/APIs/helpers and tests in 14H;
- remove `canonicalArsipId` mapping from folder-first DTO internals if no schema change is required.

Do not combine:

- route/API deletion with table drops;
- storage diagnostics rewrite with schema drops unless targeted tests are ready;
- package/env/Supabase cleanup with archive cleanup.

## Non-Goals

Phase 14G does not:

- delete route/API files;
- delete helper files;
- delete tests;
- remove or edit Drizzle schema/migrations;
- drop tables or columns;
- mutate database rows;
- run migrations, seeds, cleanup scripts, dev server, broad build, or E2E;
- delete physical files;
- alter storage runtime;
- alter package files or lockfile;
- alter env files;
- alter `src/routeTree.gen.ts`;
- alter `supabase/`;
- reintroduce Supabase runtime/package behavior.

## Protected Checks For This Phase

Expected changed files:

- `AGENTS.md`;
- `docs/migration/phase-14g-legacy-canonical-archive-removal-audit-plan.md`.

Required validation:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
