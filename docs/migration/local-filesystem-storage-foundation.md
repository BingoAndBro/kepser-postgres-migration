# Phase 6B Local Filesystem Storage Foundation

Date: 2026-05-14.

## Purpose

Phase 6B adds isolated local filesystem storage foundation helpers for future storage migration. The helpers cover only configuration/root resolution, logical path normalization and validation, safe physical path resolution, filename/path-segment sanitization, ownership helpers, and pending/formal path classification.

This phase does not wire local filesystem storage into upload, preview, download, move, delete, archive destruction, diagnostics, orphan cleanup, workflow mutations, or UI behavior.

The original Supabase-backed storage behavior remains the runtime reference until later parity phases are complete.

## Files Added

- `src/lib/storage/local-storage-paths.ts`
- `tests/unit/storage/local-storage-paths.test.ts`
- `docs/migration/local-filesystem-storage-foundation.md`

## Helper API Summary

The new server-only helper module exports:

- `getLocalStorageRoot()`
- `resolveStorageRoot(input?: string)`
- `normalizeLogicalStoragePath(path: string)`
- `assertSafeLogicalStoragePath(path: string)`
- `resolvePhysicalStoragePath(root: string, logicalPath: string)`
- `getLogicalPathOwnerId(path: string)`
- `storagePathBelongsToUser(path: string, userId: string)`
- `sanitizeStorageFilename(filename: string)`
- `sanitizeStoragePathSegment(segment: string)`
- `getFileExtension(filenameOrPath: string)`
- `isDashPendingPath(path: string)`
- `isUploadApiPendingPath(path: string)`
- `classifyStoragePath(path)`

The module starts with:

```ts
// Server-only module. Do not import from client components.
```

It does not import Supabase helpers and is not imported by runtime routes/components in Phase 6B.

## Storage Root Behavior

`getLocalStorageRoot()` lazily reads `DMS_LOCAL_STORAGE_ROOT` when called. If it is not configured, it falls back to the development/test-only project-relative `storage` root and resolves it to an absolute filesystem path.

`resolveStorageRoot(input)` normalizes and resolves a root path. It rejects empty roots, URL-like roots, and roots that point into detectable public/static folders. It does not create directories, write files, or print the resolved root.

The fallback root is a foundation default only. Production/LAN deployment must explicitly configure and back up the selected storage root before runtime storage is enabled.

## Logical Vs Physical Paths

Logical storage paths are the values preserved in document metadata, such as:

```text
{userId}/{kelengkapanId}_{timestamp}_{filename.ext}
{userId}/{timestamp}-{random}-{filename.ext}
{userId}/{dokumenId}/{uuid}.{ext}
```

Physical paths are resolved server-side under the configured local storage root. Clients must never receive absolute physical filesystem paths.

`resolvePhysicalStoragePath(root, logicalPath)` first validates the logical path, resolves it under the root, and verifies the resolved path remains inside the root. It never returns a public URL.

## Safety Rules

The helpers reject:

- empty logical paths
- URL-like values such as `http://...` and `file://...`
- protocol-relative/network values such as `//host/path`
- Windows drive-letter logical paths such as `C:\temp\file.pdf`
- `.` and `..` path segments
- path traversal attempts
- filenames/segments that become empty or contain no alphanumeric character after sanitization

Logical path normalization converts backslashes to slashes, collapses duplicate separators, and trims leading slashes from bucket-style logical paths.

## Pending/Formal Classification

The classifier recognizes only currently observed compatibility formats:

- `pending-dash`: `{userId}/{13-digit timestamp}-{alphanumeric random}-{filename.ext}`
- `pending-upload-api`: `{userId}/{kelengkapanId}_{13-digit timestamp}_{filename.ext}`
- `formal`: `{userId}/{dokumenId}/{uuid}.{ext}`
- `other`: safe but unrecognized logical paths

The Phase 6A contract notes that current runtime pending detection mostly recognizes dash-format pending paths, while `/api/upload` writes underscore-format pending paths. Phase 6B preserves that ambiguity by classifying both variants without changing runtime behavior.

## Tests Run

Required focused test:

```powershell
pnpm test tests/unit/storage/local-storage-paths.test.ts
```

Result: passed, 1 test file and 24 tests.

Diff whitespace check:

```powershell
git diff --check
```

Result: passed.

## Intentionally Not Implemented

- upload route behavior
- preview/download route behavior
- internal signed URL or signed-token behavior
- file streaming
- pending-to-formal move behavior
- delete/remove behavior
- archive destruction file deletion
- storage diagnostics or orphan cleanup
- production storage directory creation
- runtime API route/component wiring
- Supabase Storage data migration, copy, download, backfill, or sync
- database schema changes
- mutation API migration
- workflow/FSM behavior changes

## No Supabase File Migration

No existing Supabase Storage files or data were migrated, copied, downloaded, backfilled, or synced. The local filesystem storage target remains empty until a later runtime implementation writes new local files.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6C Internal Preview/Download Token Contract
```

That phase should define token claims, expiry, signing secret/config, authorization revalidation, and the compatible `{ signedUrl }` route shape before any upload/preview/download runtime replacement is wired.
