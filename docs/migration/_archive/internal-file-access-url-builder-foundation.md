# Phase 6D.5 Internal File Access URL Builder Foundation

Date: 2026-05-15.

## Purpose

Phase 6D.5 adds an isolated server-only helper for building future internal preview/download access URLs:

```text
/api/files/access?token=<opaque-token>
```

This phase does not wire existing preview/download endpoints. Existing preview/download/upload endpoints remain Supabase-backed.

## Files Added

- `src/lib/storage/internal-file-access-url.ts`
- `tests/unit/storage/internal-file-access-url.test.ts`
- `docs/migration/internal-file-access-url-builder-foundation.md`

## Helper API Summary

The new helper exports:

- `INTERNAL_FILE_ACCESS_PATH`
- `CreateInternalFileAccessUrlParams`
- `createInternalFileAccessUrl({ payload, secret })`

The module starts with:

```ts
// Server-only module. Do not import from client components.
```

It accepts a `FileAccessTokenPayload` and an explicit signing secret, delegates token creation to `signFileAccessToken()`, and returns a relative internal URL string.

## Compatibility Behavior

The helper returns only a relative URL:

```text
/api/files/access?token=<opaque-token>
```

The URL query contains only the `token` parameter. It does not include a host, origin, storage root, physical filesystem path, environment-derived base URL, raw logical path query value, Supabase signed URL, DB URL, session token, token hash, password hash, or signing secret.

`URLSearchParams` is used for query construction.

## Security Boundaries

This helper is intentionally small. It:

- does not read environment variables at module import;
- does not read environment variables at runtime;
- does not log token, secret, payload, storage path, filesystem path, or generated URL;
- does not call filesystem APIs;
- does not resolve local storage roots;
- does not check file existence;
- does not perform authorization;
- does not perform session validation;
- does not query document/archive tables;
- does not stream files;
- does not import Supabase helpers;
- does not import runtime route files.

Token payload validation remains owned by `src/lib/storage/file-access-token.ts`. Token use-time validation and authorization remain owned by `src/lib/storage/internal-file-access.ts` and future streaming phases.

## Supported Token References

The builder can sign any payload accepted by the Phase 6D.1 token helper, including:

- raw logical-path tokens;
- document id plus lampiran index tokens;
- archive id tokens.

This does not mean every token type is streamable today. `/api/files/access` currently supports only raw logical-path token validation and still returns 501 because local file streaming is intentionally not implemented.

## Intentionally Not Implemented

- existing preview/download endpoint wiring;
- internal URL generation inside existing endpoints;
- Supabase signed URL replacement;
- upload replacement;
- local file streaming;
- pending-to-formal local move behavior;
- delete/remove behavior;
- archive destruction file deletion;
- document/archive token authorization;
- `DIMUSNAHKAN` token-streaming checks;
- storage diagnostics/orphan cleanup;
- route tree changes;
- DB schema changes;
- auth/session changes;
- workflow/FSM/archive lifecycle changes;
- Supabase Storage file migration, copy, download, backfill, or sync.

## Validation Performed

Focused test:

```powershell
pnpm test tests/unit/storage/internal-file-access-url.test.ts
```

Initial sandboxed run failed with `spawn EPERM` while Vitest/esbuild loaded config. The same focused test was rerun with approved escalation.

Result:

- `tests/unit/storage/internal-file-access-url.test.ts`: passed, 6 tests.

Runtime wiring audit:

```powershell
rg -n "internal-file-access-url|createInternalFileAccessUrl" src tests docs
rg -n "internal-file-access-url|createInternalFileAccessUrl" src -g "!src/lib/storage/internal-file-access-url.ts"
rg -n "createInternalFileAccessUrl" src/routes src/components src/lib/storage-client.ts src/lib/file-helpers.ts
```

Result: only the helper itself appears under `src/`. Existing preview/download/upload route files do not import it.

Whitespace check:

```powershell
git diff --check
```

Result: passed with only existing line-ending normalization warnings for edited docs.

## Recommended Next Phase

Recommended next phase:

```text
Phase 6D.6 Raw Logical-Path Preview Internal URL Wiring
```

That phase should wire at most one low-risk raw logical-path preview endpoint while preserving response shape and keeping Supabase behavior available as the compatibility reference until the local path is tested.
