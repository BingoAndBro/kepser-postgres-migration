# Phase 6D.7 Internal File Access Local Streaming Foundation

Date: 2026-05-15.

## Scope

Phase 6D.7 implements local file access in the existing internal route service for raw logical-path tokens only:

```text
GET /api/files/access?token=<opaque-token>
```

The existing route file remains unchanged. The service now can return local file content after token verification, local session presence, supported token-type checks, logical path validation, root-containment resolution, and raw-path owner/role authorization all succeed.

## Implemented Behavior

Supported token shape in this phase:

- `logicalPath` raw storage reference.
- `purpose: 'preview'` or `purpose: 'download'`.
- No `documentId`.
- No `lampiranIndex`.
- No `archiveId`.
- No `statusCheck`.

After successful validation and authorization, the service:

- resolves the physical file only through the local storage path helper;
- verifies the resolved target is a file;
- returns generic `404` when the file is missing or not a file;
- returns generic `500` when filesystem access fails;
- never includes physical path, storage root, token, secret, or signed URL details in responses.

## Headers

Successful file responses use:

- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- `Content-Type` inferred from a small extension allowlist:
  - `.pdf` -> `application/pdf`
  - `.png` -> `image/png`
  - `.jpg` / `.jpeg` -> `image/jpeg`
  - `.txt` -> `text/plain; charset=utf-8`
  - fallback -> `application/octet-stream`
- `Content-Disposition` derived from token purpose or explicit disposition:
  - preview -> `inline`
  - download -> `attachment`

Filename handling is intentionally conservative. The service uses a safe `downloadFilename` claim when present; otherwise it derives a filename from the logical path leaf. Filenames that contain path separators, traversal markers, CR/LF, quotes, absolute-path forms, Windows-drive forms, or URL-like values are not used.

Error responses also include:

- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`

## Still Not Implemented

This phase does not implement:

- document/lampiran token authorization;
- archive token authorization;
- `statusCheck` token handling;
- `DIMUSNAHKAN` checks for document/archive tokens;
- existing preview/download endpoint migration beyond the earlier opt-in raw preview path from Phase 6D.6;
- download endpoint wiring;
- document-detail endpoint wiring;
- PPK or Bendahara endpoint wiring;
- Arsiparis/archive endpoint wiring;
- upload replacement;
- pending-to-formal local move behavior;
- delete/remove behavior;
- archive destruction local deletion;
- storage diagnostics/orphan cleanup migration;
- route tree changes.

Unsupported document/archive/status-check token types continue to return the existing generic 501 unsupported-token behavior.

## Compatibility Notes

Existing preview/download/upload endpoints remain unchanged except for the earlier Phase 6D.6 opt-in raw preview internal URL path:

```text
GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true
```

Default preview/download/upload behavior remains Supabase-backed. Supabase Storage file migration, copy, download, backfill, or sync was not performed.

The local filesystem storage target starts empty. Real internal preview only works for files already present in local storage using matching logical paths.

No route tree changes were made in this phase.
