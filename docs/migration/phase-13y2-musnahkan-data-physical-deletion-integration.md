# Phase 13Y.2 - Musnahkan Data Physical Deletion Integration

Date: 2026-05-30

Status: implemented pending targeted review and human smoke.

## Phase Status

Phase 13Y.2 integrates the Phase 13Y.1 folder-first physical deletion helper into the existing `Musnahkan Data` / `approve_destruction` lifecycle action.

The existing user-facing destructive action remains:

```text
Musnahkan Data
```

The existing exact typed confirmation remains:

```text
MUSNAHKAN DATA FILE
```

No separate physical deletion button, page, modal, route, or `Dimusnahkan` list is introduced.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain. This phase does not claim Supabase is fully removed from the repository and does not add any Supabase fallback.

## Runtime Behavior

For folder-first berkas, successful `approve_destruction` now performs this ordered flow:

1. Validate same-origin, `dms_session`, assigned `KEPALA_SUB_BAGIAN_UMUM`, route params, request body, and exact `MUSNAHKAN DATA FILE`.
2. Move folder lifecycle from `USUL_MUSNAH` to `DIMUSNAHKAN`.
3. Invoke `executeBerkasPhysicalFileDestruction(...)` for the same berkas id.
4. Pass the helper's internal execution confirmation server-side.
5. Return the existing safe berkas response plus a safe `physical_deletion` summary.

The helper still only operates on:

```text
berkas_arsip.status_berkas = CLOSED
berkas_arsip.status_arsip = DIMUSNAHKAN
```

The lifecycle transition must happen first.

## Metadata Preservation

Physical deletion deletes file contents only. It must preserve:

- `berkas_arsip`;
- `berkas_arsip_item`;
- `dokumen_transaksi`;
- `manual_arsip`;
- `manual_arsip_attachment`;
- logical path references;
- attachment metadata;
- lifecycle and retention metadata.

No database rows are deleted and no logical paths are cleared.

## Safe Response

The lifecycle response may include:

```ts
physical_deletion: {
  status: string
  deleted_count: number
  already_missing_count: number
  skipped_unsafe_count: number
  skipped_duplicate_count: number
  failed_count: number
  physical_deletion_performed: boolean
  errors: string[]
}
```

The response must not include physical paths, logical paths, storage roots, filenames derived from paths, raw rows, SQL details, env values, cookies, session values, file tokens, signed token internals, password hashes, or secrets.

## Partial Failure Semantics

If physical deletion is partial or fails after the status transition:

- lifecycle status remains `DIMUSNAHKAN`;
- preview/download remains blocked by status;
- the API returns a safe count/category summary;
- no lifecycle rollback to `USUL_MUSNAH` is attempted;
- unexpected helper errors are mapped to a safe failed summary with no path/root/token details.

This preserves the authorization decision and prevents stale file access even when filesystem cleanup needs operator review.

## UI Copy

The existing `Musnahkan Data` confirmation copy now states:

- status becomes `Dimusnahkan`;
- physical files related to the berkas will be deleted;
- metadata remains stored;
- preview/download stays blocked;
- the action is not easily reversed.

The UI does not expose the helper's internal phrase:

```text
HAPUS FILE FISIK ARSIP
```

That phrase is server-internal for this phase after the user has already authorized final destruction with `MUSNAHKAN DATA FILE`.

## Not Changed

Phase 13Y.2 does not:

- add a new route;
- add a new page;
- add a separate physical deletion UI button;
- add a `Dimusnahkan` list page;
- change schema, Drizzle models, or migrations;
- delete metadata rows;
- clear logical paths;
- target legacy `arsip.arsip` physical deletion;
- change workflow/manual write behavior;
- change upload behavior;
- change CSV export behavior;
- change storage layout;
- modify package or env files;
- modify `src/routeTree.gen.ts`;
- reintroduce Supabase runtime behavior.

## Manual Smoke Checklist

Use only disposable files and test data.

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Create or choose a disposable folder-first berkas with WORKFLOW and/or MANUAL attachments.
3. Close the berkas and move it through `AKTIF -> INAKTIF -> USUL_MUSNAH`.
4. Open `/arsiparis/usul-musnah` and click `Musnahkan Data`.
5. Confirm the modal says file fisik terkait berkas akan dihapus, metadata remains, and preview/download stays blocked.
6. Confirm submit stays disabled until exact `MUSNAHKAN DATA FILE`.
7. Submit and confirm the row leaves `Usul Musnah`.
8. Confirm no `Dimusnahkan` list page appears.
9. Open the berkas detail directly and confirm status is `DIMUSNAHKAN`.
10. Confirm preview/download return `Data file sudah dimusnahkan`.
11. Confirm only disposable candidate physical files are gone.
12. Confirm metadata and logical references remain visible.
13. Confirm no physical path, logical path, storage root, token, SQL, env value, session/cookie value, or secret is shown.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-file-access.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
