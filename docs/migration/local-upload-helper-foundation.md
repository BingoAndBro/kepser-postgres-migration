# Phase 6E.2 Local Upload Helper Foundation

Date: 2026-05-15.

## Scope

Phase 6E.2 adds an isolated server-only helper foundation for future local filesystem upload replacement.

This phase does not wire `/api/upload`, UI upload callers, submit/resubmit pending moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, route generation, database scripts, or Supabase Storage migration.

Supabase Storage remains the active upload implementation.

## Files Added

- `src/lib/storage/local-upload.ts`
- `tests/unit/storage/local-upload.test.ts`

## Helper Summary

The helper starts with:

```ts
// Server-only module. Do not import from client components.
```

It exports isolated primitives for:

- validating upload file metadata against the current 2 MB limit;
- validating declared MIME type and filename extension for PDF, DOC, DOCX, XLS, and XLSX;
- sanitizing client filenames without accepting path-like or traversal-like names;
- validating `kelengkapan_id` as UUID or `user-custom-{uuid}`;
- generating upload-API-compatible pending logical paths in the current underscore format;
- preparing upload descriptors that contain logical metadata only;
- writing small upload buffers under the configured local storage boundary with no-overwrite semantics.

Returned helper results intentionally expose only logical paths, byte counts, and validated metadata. They do not expose physical filesystem paths.

## Write Semantics

The write helper resolves and validates the target internally through the local storage path foundation before creating directories or writing content.

For this foundation phase, the helper writes with an exclusive no-overwrite file creation mode and removes the target if the write fails after file creation. This is acceptable for the current 2 MB upload limit, but it is not a full streaming, retry, or orphan-recovery implementation.

Future phases can add a stronger temp-file/link strategy if larger files, streaming uploads, or retry recovery are introduced.

## Compatibility Notes

The pending logical path remains compatible with current `/api/upload` behavior:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
```

This helper does not change the existing mismatch where direct `AttachmentEditor` uploads use a dash pending path while `/api/upload` uses an underscore pending path. Pending-to-formal move behavior remains a later phase.

The helper does not inspect deep file signatures. It validates declared MIME type, filename extension, file size metadata, and content length where supplied.

## Explicitly Not Implemented

Phase 6E.2 does not implement:

- `/api/upload` local wiring;
- upload response changes;
- UI caller changes;
- `AttachmentEditor` direct upload migration;
- pending-to-formal local moves;
- delete/remove behavior;
- archive destruction local deletion;
- storage diagnostics or orphan cleanup;
- preview/download default changes;
- internal URL enablement by default;
- database scripts or schema changes;
- route tree changes;
- Supabase Storage file migration, copy, download, backfill, or sync.

## Tests

Focused test added:

```powershell
pnpm test tests/unit/storage/local-upload.test.ts
```

Result: passed, 1 test file and 14 tests.

The first sandboxed attempt failed before tests started because the test runner could not spawn its config bundling worker. The same focused command passed when rerun with approved escalation.
