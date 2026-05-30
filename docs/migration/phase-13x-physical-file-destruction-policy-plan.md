# Phase 13X - Physical File Destruction Policy And Safeguard Plan

Date: 2026-05-30

Status: docs/planning only.

## Phase Status

Phase 13X plans a future destructive physical file deletion phase for folder-first berkas that have already reached:

```text
berkas_arsip.status_berkas = CLOSED
berkas_arsip.status_arsip = DIMUSNAHKAN
```

This phase does not change runtime behavior, schema, Drizzle models, migrations, routes, route generation, UI, storage files, physical files, database rows, package files, env files, cleanup behavior, seeds, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog. This phase does not claim Supabase is fully removed from the repository and does not approve any Supabase fallback.

## Current State

Folder-first archive lifecycle is active for new runtime:

- `arsip.berkas_arsip` is the canonical folder/archive parent.
- `arsip.berkas_arsip_item` stores folder items from `WORKFLOW` and `MANUAL` sources.
- `WORKFLOW` source data remains in `dokumen.dokumen_transaksi`.
- `MANUAL` source data remains in `arsip.manual_arsip`.
- manual file metadata remains in `arsip.manual_arsip_attachment`.
- old `arsip.arsip` rows are legacy/transitional compatibility/history, not the new write authority.

Current `DIMUSNAHKAN` behavior is status-only:

- folder lifecycle moves `USUL_MUSNAH -> DIMUSNAHKAN`;
- preview/download for folder items is blocked by folder status;
- the safe file-specific message is:

```text
Data file sudah dimusnahkan
```

Physical files are not deleted yet, and metadata remains visible.

## Why Physical Deletion Is Needed

The business goal is to prevent local storage growth after an authorized folder destruction decision while preserving the metadata needed to prove what existed, where it came from, and why the folder is no longer file-accessible.

The future implementation must delete file contents only. It must not delete archive metadata or source rows.

## Source Audit

### WORKFLOW Items

Folder-first WORKFLOW file ownership is derived from:

- `berkas_arsip_item.source_type = 'WORKFLOW'`;
- `berkas_arsip_item.dokumen_id`;
- `dokumen_transaksi.lampiran_urls`;
- safe logical paths inside each attachment entry, currently resolved through `resolveWorkflowAttachmentReference()` in `src/lib/archive/berkas-arsip-attachment-names.ts`.

Current folder item file access reloads the folder, verifies the item belongs to the folder, reads `dokumen_transaksi.lampiran_urls`, validates the logical path, resolves it under the local storage root, and streams only after the folder is not `DIMUSNAHKAN`.

### MANUAL Items

Folder-first MANUAL file ownership is derived from:

- `berkas_arsip_item.source_type = 'MANUAL'`;
- `berkas_arsip_item.manual_arsip_id`;
- `manual_arsip_attachment.manual_arsip_id`;
- `manual_arsip_attachment.logical_path`.

Current folder item file access locates the manual attachment by source id and attachment order, then delegates to the existing Manual Archive attachment responder.

### Legacy Canonical Rows

The repository already has a legacy canonical helper:

```text
src/lib/archive/unified-archive-physical-destruction.ts
```

That helper targets `arsip.arsip` canonical rows and uses `arsip.lampiran_snapshot` for WORKFLOW plus linked `manual_arsip_attachment` rows for MANUAL. It is useful as prior art for path safety, dry-run semantics, no-leak DTOs, and idempotent missing-file handling.

For the first folder-first implementation, physical deletion should target folder-first `berkas_arsip` items only. It should not delete files based on old `arsip.arsip` rows or `arsip.lampiran_snapshot` unless a later human-approved legacy cleanup phase explicitly broadens scope.

## Trigger Policy

Three options were evaluated:

| Option | Description | Risk |
|---|---|---|
| A | Delete immediately inside `approve_destruction` (`USUL_MUSNAH -> DIMUSNAHKAN`) | Couples an irreversible filesystem operation to lifecycle status mutation; partial filesystem failure becomes harder to reason about. |
| B | Separate explicit maintenance action after `DIMUSNAHKAN` | Keeps lifecycle decision status-only and makes file deletion an intentional second step. |
| C | Dry-run/analyze first, then execute with typed confirmation | Safest operational shape; can be implemented as a variant of option B. |

Recommended policy: keep lifecycle transition status-only and add a separate explicit destructive maintenance action in a future implementation phase.

The future action should:

- require the folder to already be `CLOSED/DIMUSNAHKAN`;
- support dry-run;
- require exact typed confirmation for execution;
- report safe counts only;
- delete only files belonging to the selected folder-first berkas;
- treat already-missing files as idempotent;
- never delete paths from client input;
- never expose physical paths, storage roots, logical paths, tokens, SQL details, raw rows, env values, cookies, sessions, or secrets.

## Candidate Selection Policy

The future implementation should accept only a server-side folder identifier and then reload all authoritative state.

Required flow:

1. Authenticate through local `dms_session`.
2. Enforce server-side authorization.
3. Validate same-origin for unsafe requests.
4. Parse a body containing `dryRun` and optional confirmation only.
5. Reload the `berkas_arsip` row by id.
6. Reject missing folders.
7. Reject anything except `status_berkas='CLOSED'` and `status_arsip='DIMUSNAHKAN'`.
8. Load all `berkas_arsip_item` rows for that folder.
9. For `WORKFLOW` items, load source `dokumen_transaksi` rows by `dokumen_id`.
10. Parse `dokumen_transaksi.lampiran_urls` with the same defensive shape as file-access code.
11. For `MANUAL` items, load `manual_arsip_attachment` rows by `manual_arsip_id`.
12. Validate every candidate with `assertSafeLogicalStoragePath`.
13. Resolve every candidate with `resolvePhysicalStoragePath`.
14. Perform additional filesystem safety inspection before deletion: regular file only, no symlink target deletion, realpath containment under the configured local storage root.
15. Delete only candidates derived from current DB state and current folder membership.

The future implementation must never:

- accept client-supplied file paths;
- scan the broad storage root as part of this selected-folder action;
- delete public/static files;
- delete directories;
- delete symlinks or reparse-like targets;
- use Supabase Storage fallback or old file recovery behavior;
- infer candidates from old `arsip.arsip` snapshots in the first folder-first phase.

## Metadata Preservation Policy

Physical deletion must preserve all metadata rows and logical references.

The future implementation must not:

- delete `berkas_arsip` rows;
- delete `berkas_arsip_item` rows;
- delete `dokumen_transaksi` rows;
- delete `manual_arsip` rows;
- delete `manual_arsip_attachment` rows;
- delete or clear `dokumen_transaksi.lampiran_urls`;
- null out `manual_arsip_attachment.logical_path`;
- rewrite attachment labels, filenames, retention fields, lifecycle fields, or source metadata;
- clear old `arsip.lampiran_snapshot`;
- remove audit/history metadata.

Metadata must remain sufficient for UI and audit review to show:

- folder identity and classification;
- source document names;
- source type;
- attachment labels;
- destroyed status;
- safe unavailable copy such as `Data file sudah dimusnahkan`.

## Idempotency And Missing Files

The future destructive action should be idempotent.

If a file candidate is already missing:

- count it as `already_missing_count` or `skipped_missing_count`;
- do not fail the whole operation;
- do not reveal the physical path or logical path;
- keep preview/download blocked because `DIMUSNAHKAN` remains the access authority.

If deletion fails for one file:

- continue only if the future implementation deliberately chooses partial-progress semantics;
- return safe failure counts and safe categories;
- do not include filesystem errors, path fragments, storage roots, raw stack traces, or low-level exception messages in user-facing responses.

## Safe Report DTO Policy

The future result DTO should be safe for API responses and UI display.

Recommended fields:

```ts
type FolderPhysicalDestructionReport = {
  status:
    | 'dry_run'
    | 'completed'
    | 'partial'
    | 'skipped'
    | 'not_found'
    | 'not_destroyed'
    | 'failed'
  total_items: number
  workflow_attachment_candidates: number
  manual_attachment_candidates: number
  deleted_count: number
  already_missing_count: number
  skipped_unsafe_count: number
  failed_count: number
  physical_deletion_performed: boolean
  errors: Array<
    | 'FOLDER_NOT_DIMUSNAHKAN'
    | 'UNSAFE_FILE_CANDIDATE_SKIPPED'
    | 'PHYSICAL_FILE_ALREADY_MISSING'
    | 'PHYSICAL_FILE_DELETE_FAILED'
    | 'NO_FILE_CANDIDATES'
  >
}
```

Internal logs may carry a correlation id, but user-facing reports should not need raw ids. If a future internal helper DTO includes `berkas_id`, route/UI mapping must avoid exposing unnecessary internal identifiers beyond existing route context.

The DTO must not include:

- physical path;
- storage root;
- logical path;
- filename/path fragments from storage metadata;
- token or signed URL;
- DB URL;
- raw SQL or SQL params;
- raw rows;
- raw attachment metadata;
- env values;
- cookies, session values, password hashes, or secrets.

## Authorization And Confirmation

The future destructive route/action must require:

- local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` through server-side RBAC, unless a later human-approved maintenance role policy explicitly changes this;
- no `ADMIN` substitution by default;
- same-origin protection for unsafe `POST`;
- Zod validation at the boundary;
- `dryRun: boolean`;
- exact typed confirmation for execution.

Suggested execution phrase:

```text
HAPUS FILE FISIK ARSIP
```

Recommended body shape:

```json
{
  "dryRun": true
}
```

and for execution:

```json
{
  "dryRun": false,
  "confirmation": "HAPUS FILE FISIK ARSIP"
}
```

Execution must reject `dryRun=false` unless the confirmation phrase matches exactly.

This phrase is intentionally different from current lifecycle status confirmation:

```text
MUSNAHKAN DATA FILE
```

The existing phrase approves status movement to `DIMUSNAHKAN`; the new phrase would approve irreversible physical file deletion after that status already exists.

## Future Implementation Proposal

Recommended future phase:

```text
Phase 13Y - Folder-First DIMUSNAHKAN Physical File Deletion Helper And API
```

Suggested scope:

- add a server-only helper, for example `src/lib/archive/berkas-arsip-physical-destruction.ts`;
- add focused unit tests for helper behavior;
- optionally add a narrow API route only if the human approves route/UI exposure for this destructive action;
- keep lifecycle `approve_destruction` status-only;
- keep the existing preview/download block unchanged;
- avoid route generation unless the future phase explicitly allows it;
- do not add schema/migration unless a separate audit-persistence phase is approved.

Recommended helper design:

- repository injection for tests;
- storage adapter injection for tests;
- default local storage adapter using `getLocalStorageRoot`, `resolvePhysicalStoragePath`, `lstat`, `realpath`, and `unlink`;
- dry-run returns counts without deletion;
- execute deletes safe candidates only;
- duplicate logical paths are deduplicated before deletion;
- unsafe candidates are skipped with safe categories;
- missing files count safely;
- no file path details appear in DTOs.

The older `unified-archive-physical-destruction.ts` can inform the implementation but should not be reused blindly, because it is canonical `arsip.arsip` oriented and its candidate model is not folder-first.

## Future Test Plan

Focused tests should cover:

- rejects missing berkas;
- rejects `OPEN/null`;
- rejects `CLOSED/null`;
- rejects non-`DIMUSNAHKAN` berkas;
- rejects terminal execution without exact confirmation;
- rejects `ADMIN`-only authorization if routed;
- dry-run returns counts without deleting files;
- execution deletes only candidate files under the storage root;
- `WORKFLOW` candidates come from `dokumen_transaksi.lampiran_urls` through folder membership;
- `MANUAL` candidates come from `manual_arsip_attachment.logical_path` through folder membership;
- duplicate candidate paths are deduplicated;
- path traversal and root escape are blocked;
- public/static roots or targets are blocked by storage-root policy;
- symlink/non-file candidates are skipped;
- missing files count safely;
- partial failures return safe categories;
- metadata rows and logical references remain unchanged;
- stale preview/download remains blocked with `Data file sudah dimusnahkan`;
- no path, token, root, SQL, raw row, env, cookie, session, or secret leaks in DTOs or route responses;
- idempotent second execution returns already-missing/skipped counts safely.

## Manual Smoke / Future Validation Plan

Do not run against valuable data.

For a later human-approved destructive smoke:

1. Create a disposable folder-first berkas with disposable WORKFLOW and MANUAL attachments.
2. Close it and move it through `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`.
3. Confirm preview/download are blocked before deletion.
4. Run the future dry-run and confirm safe candidate counts only.
5. Execute with exact phrase `HAPUS FILE FISIK ARSIP`.
6. Confirm only disposable candidate files are gone.
7. Confirm metadata remains visible.
8. Confirm preview/download still return `Data file sudah dimusnahkan`.
9. Run the action again and confirm idempotent already-missing behavior.
10. Confirm no physical path, logical path, storage root, token, SQL, env value, session/cookie value, or secret is printed.

## Non-Goals For This Phase

Phase 13X does not:

- delete files;
- implement physical deletion;
- add a cleanup route;
- add a scheduler;
- add DB columns;
- add migrations;
- mutate DB rows;
- backfill data;
- change lifecycle semantics;
- change preview/download behavior;
- change upload behavior;
- change workflow/manual write behavior;
- change CSV export;
- modify package files;
- modify env files;
- run migrations, seeds, dev server, broad build, E2E, cleanup scripts, or route generation;
- modify `src/routeTree.gen.ts`;
- touch `drizzle/` or `supabase/`;
- reintroduce Supabase runtime behavior.

## Validation For This Phase

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

No tests, dev server, route generation, broad build, E2E, DB migrations, seed scripts, cleanup scripts, storage cleanup, package manager operations, or commits are required for this docs-only phase.
