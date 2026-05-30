# Phase 13P - Folder Item File Access And DIMUSNAHKAN Block

Date: 2026-05-29

Status: implemented pending targeted test and human review.

## Phase Status

Phase 13P adds bounded folder-aware preview/download for items shown on folder-first archive detail pages.

This phase does not delete physical files, implement physical destruction, add lifecycle transitions, add lifecycle mutation UI, stop transitional `arsip.arsip` writes, change workflow/manual write behavior, add schema or migrations, run backfill, change package/env files, run seeds, run migrations, run cleanup scripts, or reintroduce Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Helper Added

New server-only helper:

```text
src/lib/archive/berkas-arsip-file-access.ts
```

The helper:

- loads the current `berkas_arsip` folder on every request;
- loads the current `berkas_arsip_item` and verifies it belongs to the folder;
- resolves `WORKFLOW` attachments from `dokumen_transaksi.lampiran_urls`;
- resolves `MANUAL` attachments through `manual_arsip_attachment` ordering and delegates file streaming to the existing manual archive file responder;
- blocks folder-level `status_arsip='DIMUSNAHKAN'` before source/file resolution;
- returns safe blocked copy for file access; after Phase 13Q.2 this is `Data file sudah dimusnahkan`;
- avoids exposing physical paths, storage roots, logical paths, tokens, raw rows, SQL details, env values, session/cookie values, or secrets in error DTOs.

## API Routes Added

New authorized GET routes:

```text
GET /api/arsiparis/berkas/$id/items/$itemId/preview/$lampiranIndex
GET /api/arsiparis/berkas/$id/items/$itemId/download/$lampiranIndex
```

The routes require local `dms_session` and assigned `KEPALA_SUB_BAGIAN_UMUM`. `ADMIN` is not a substitute.

The routes are read-only and do not require same-origin protection because they are safe `GET` handlers, but they still enforce server-authoritative auth/RBAC.

## DIMUSNAHKAN Revalidation

Every preview/download request re-checks the current folder row.

If `berkas_arsip.status_arsip = DIMUSNAHKAN`, every item attachment request in that folder is blocked with file-specific copy:

```text
Data file sudah dimusnahkan
```

This applies to stale links rendered before the folder status changed. No physical deletion occurs in this phase.

## Source Behavior

### WORKFLOW

`WORKFLOW` item file access uses the attached item source from `dokumen_transaksi`.

The helper resolves the requested attachment index from `dokumen_transaksi.lampiran_urls`, validates the logical storage path, resolves it inside the local storage root, and streams it with safe headers.

The folder attachment relationship and assigned `KEPALA_SUB_BAGIAN_UMUM` authorization are the access boundary for this phase. The helper does not require workflow source status `ARCHIVED` when the source is attached to a valid folder.

### MANUAL

`MANUAL` item file access uses `manual_arsip_attachment` metadata for the source row referenced by the folder item.

The helper resolves the requested attachment index, then delegates actual file streaming to the existing manual archive attachment responder so existing manual storage/content-disposition behavior is preserved.

## UI Behavior

Folder detail page:

```text
/arsiparis/berkas/$id
```

now shows preview/download actions for items with attachments.

If the folder is `DIMUSNAHKAN`, active preview/download actions are hidden and the item card shows:

```text
Data sudah dimusnahkan
```

No new lifecycle action, mutation, modal workflow, physical deletion, or cleanup UI is added.

## Route Tree Status

New route files were added. `src/routeTree.gen.ts` was regenerated through the TanStack route generator and was not edited manually.

## Manual Smoke Recommendation

Recommended human smoke:

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Open a folder detail with at least one `WORKFLOW` item attachment and one `MANUAL` item attachment.
4. Preview and download both item types.
5. Mark a test folder as `DIMUSNAHKAN` only through an approved lifecycle path or controlled test fixture.
6. Reuse an old preview/download link and confirm it returns `Data file sudah dimusnahkan`.
7. Confirm no physical files are deleted by this phase.

Phase 13P.1 smoke report:

- `docs/migration/phase-13p1-runtime-smoke-folder-item-file-access.md`

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
pnpm test tests/unit/arsiparis/berkas-arsip-file-access-route.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db
git diff -- src/routeTree.gen.ts
```
