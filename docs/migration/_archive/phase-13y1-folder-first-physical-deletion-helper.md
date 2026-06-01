# Phase 13Y.1 - Folder-First Physical Deletion Helper Foundation

Date: 2026-05-30

Status: helper foundation implemented pending targeted review and human smoke. No lifecycle integration yet.

## Phase Status

Phase 13Y.1 adds a server-only helper foundation for physical file deletion analysis and execution for one folder-first berkas that has already reached:

```text
berkas_arsip.status_berkas = CLOSED
berkas_arsip.status_arsip = DIMUSNAHKAN
```

The helper is not wired into `Musnahkan Data`, `approve_destruction`, any API route, any UI button, any scheduler, or broad cleanup. Phase 13Y.2 is the intended future phase for integrating this helper into the existing `Musnahkan Data` action.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain. This phase does not claim Supabase is fully removed from the repository and does not add any Supabase fallback.

## Helper Surface

New server-only module:

```text
src/lib/archive/berkas-arsip-physical-destruction.ts
```

Exported helper surface:

- `analyzeBerkasPhysicalFileDestruction(...)`
- `executeBerkasPhysicalFileDestruction(...)`
- `createLocalBerkasPhysicalDestructionStorage(...)`
- `BERKAS_PHYSICAL_DESTRUCTION_CONFIRMATION_PHRASE`

Execution requires the exact confirmation phrase:

```text
HAPUS FILE FISIK ARSIP
```

This phrase is intentionally separate from the existing lifecycle status confirmation phrase:

```text
MUSNAHKAN DATA FILE
```

## Eligibility

The helper reloads the folder from server-side repository state and only operates on `CLOSED/DIMUSNAHKAN`.

It safely rejects:

- missing folder;
- `OPEN/null`;
- `CLOSED/null`;
- `CLOSED/AKTIF`;
- `CLOSED/INAKTIF`;
- `CLOSED/USUL_MUSNAH`.

It does not move `USUL_MUSNAH -> DIMUSNAHKAN` and does not change lifecycle semantics.

## Candidate Selection

Candidates are derived only from current folder membership:

```text
arsip.berkas_arsip_item
```

For `WORKFLOW` items:

- source type must be `WORKFLOW`;
- source id comes from `berkas_arsip_item.dokumen_id`;
- source metadata is loaded from `dokumen_transaksi.lampiran_urls`;
- candidate logical paths come only from safe `lampiran_urls[].url` values.

For `MANUAL` items:

- source type must be `MANUAL`;
- source id comes from `berkas_arsip_item.manual_arsip_id`;
- source metadata is loaded from `manual_arsip_attachment`;
- candidate logical paths come only from `manual_arsip_attachment.logical_path`.

This phase does not use client-supplied paths, route params as file paths, old `arsip.arsip` rows, `arsip.lampiran_snapshot`, broad storage-root scans, Supabase fallback, or old file recovery behavior.

## Path Safety

Every candidate is checked through local storage safety rules:

- logical paths are validated with `assertSafeLogicalStoragePath`;
- physical paths are resolved with `resolvePhysicalStoragePath`;
- final targets must stay under the local storage root;
- deletion inspects filesystem targets with `lstat`;
- only regular files are deleted;
- directories, symlinks, and non-file/reparse-like candidates are skipped;
- realpath containment is checked before unlink;
- duplicate logical/physical candidates are deduplicated before deletion.

## Dry-Run And Execute Behavior

Dry-run:

- collects candidates;
- validates logical and physical safety;
- reports safe counts;
- does not delete files.

Execute:

- requires exact confirmation `HAPUS FILE FISIK ARSIP`;
- deletes only safe existing regular file candidates;
- counts already-missing files as idempotent;
- skips unsafe candidates;
- deduplicates duplicate candidates;
- returns safe partial/failure categories if one file cannot be deleted.

## Safe Report DTO

The helper returns counts/categories only:

- `status`;
- `total_items`;
- `workflow_attachment_candidates`;
- `manual_attachment_candidates`;
- `deleted_count`;
- `already_missing_count`;
- `skipped_unsafe_count`;
- `skipped_duplicate_count`;
- `failed_count`;
- `physical_deletion_performed`;
- `errors`.

The report must not include physical paths, storage roots, logical paths, filenames derived from storage paths, tokens, signed URLs, SQL details, raw rows, internal IDs, env values, cookies, session values, password hashes, or secrets.

## Metadata Preservation

The helper never mutates database rows. It does not:

- delete `berkas_arsip` rows;
- delete `berkas_arsip_item` rows;
- delete `dokumen_transaksi` rows;
- delete `manual_arsip` rows;
- delete `manual_arsip_attachment` rows;
- clear `dokumen_transaksi.lampiran_urls`;
- null out `manual_arsip_attachment.logical_path`;
- rewrite labels, filenames, lifecycle fields, retention fields, or source metadata;
- update lifecycle status;
- backfill data;
- touch old `arsip.arsip` compatibility/history rows.

## Idempotency

The helper is idempotent for already-deleted files:

- first execution deletes safe existing candidates;
- second execution counts those candidates as already missing;
- metadata remains readable;
- preview/download remains governed by `DIMUSNAHKAN` status and stays blocked.

## Test Coverage

Focused unit tests:

```text
tests/unit/arsiparis/berkas-arsip-physical-destruction.test.ts
```

Coverage includes:

- missing berkas;
- `OPEN/null`;
- `CLOSED/null`;
- `CLOSED/AKTIF`;
- `CLOSED/INAKTIF`;
- `CLOSED/USUL_MUSNAH`;
- dry-run for `CLOSED/DIMUSNAHKAN`;
- execution confirmation guard;
- workflow and manual file deletion through folder membership;
- duplicate candidate dedupe;
- already-missing handling;
- unsafe logical path rejection;
- directory/symlink-like non-file skipping where supported by the test environment;
- repository mutation absence;
- safe no-leak report assertions;
- idempotent second execution.

## Not Changed

Phase 13Y.1 does not:

- modify `Musnahkan Data` / `approve_destruction`;
- add an API route;
- add UI;
- add a separate user-facing physical deletion button;
- create a `Dimusnahkan` list page;
- change lifecycle semantics;
- change preview/download behavior;
- change workflow/manual write behavior;
- change upload behavior;
- change CSV export;
- change schema, Drizzle models, or migrations;
- mutate database rows;
- backfill data;
- delete metadata rows;
- clear logical paths;
- target legacy `arsip.arsip` physical deletion;
- modify package or env files;
- modify `src/routeTree.gen.ts`;
- modify `src/lib/storage`;
- touch `drizzle/` or `supabase/`;
- run migrations, seeds, broad build, E2E, dev server, cleanup scripts, or route generation;
- reintroduce Supabase runtime behavior.

## Future Phase 13Y.2

Phase 13Y.2 should integrate this helper into the existing `Musnahkan Data` action rather than adding a separate general physical-deletion UI. The target behavior is that final `Musnahkan Data` eventually performs the authorized status change and physical file cleanup with safe reporting, while metadata remains preserved and preview/download remains blocked.
