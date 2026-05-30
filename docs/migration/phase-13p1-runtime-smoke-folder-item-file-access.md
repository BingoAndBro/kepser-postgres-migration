# Phase 13P.1 - Runtime Smoke Folder Item File Access

Date: 2026-05-30

Status: partially completed; targeted tests passed, runtime browser/API smoke blocked because no existing local app server was reachable and this phase does not start a long-running server without human approval.

## Phase Scope

Phase 13P.1 is a smoke/report-only verification pass for Phase 13P folder-aware item preview/download behavior.

This phase does not add UI, add lifecycle mutation, change `status_arsip`, physically delete files, implement physical destruction, stop transitional `arsip.arsip` writes, change workflow/manual write behavior, add schema or migrations, run migrations, run seeds, backfill data, run cleanup scripts, change package/env/storage configuration, or reintroduce Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Clean Working Tree Gate

Initial command:

```bash
git status --short --branch
```

Result:

```text
## migration/postgres-local...origin/migration/postgres-local [ahead 1]
```

The working tree was clean at the start. Git also emitted local user config ignore permission warnings; those warnings did not indicate repository file changes.

## Targeted Tests

Command run:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-file-access-route.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
```

Result:

```text
3 test files passed
21 tests passed
```

Coverage confirmed by these targeted tests:

- folder item file access streams allowed `WORKFLOW` attachments with safe headers;
- `MANUAL` folder item access delegates through the existing manual archive responder;
- current folder lifecycle is revalidated on each request;
- `status_arsip='DIMUSNAHKAN'` returns `Data sudah dimusnahkan`;
- stale item links are blocked after folder status changes;
- item membership is checked against the current folder;
- missing source rows and invalid indexes fail with safe DTOs;
- API routes require local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` is required and `ADMIN` alone is rejected;
- malformed route params are rejected before file work;
- folder page URL construction does not expose logical paths, storage roots, or tokens.

## Runtime Server Check

No `pnpm dev` server was started because the human did not explicitly approve starting a long-running development server.

Local reachability check covered the project dev port and common Vite ports:

```text
3000: not reachable
3001: not reachable
5173: not reachable
5174: not reachable
```

Runtime browser/API smoke was therefore blocked.

## Browser UI Smoke

Runtime UI smoke was not performed because no existing local app server was reachable.

Pending human browser check after starting the app outside this smoke pass:

1. Login as a user assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Open a `CLOSED` + `AKTIF` folder that has at least one item attachment.
4. Confirm the detail page loads and item cards render.
5. Confirm attachment actions render for item attachments.
6. Confirm no lifecycle action, delete action, destruction action, physical path, logical path, storage root, signed URL, token, or raw file location is displayed.
7. Click preview and confirm the file opens through the authorized API route without raw error leakage.
8. Click download and confirm the response downloads with a safe filename/content-disposition.

Observed result in Codex: not observed; runtime blocked.

## API Smoke

Runtime API smoke from a logged-in browser session was not performed because no existing local app server was reachable.

Pending human DevTools checks using a real file action href rendered by the UI:

```js
await fetch('<PREVIEW_HREF>')
  .then(async (r) => ({
    status: r.status,
    contentType: r.headers.get('content-type'),
    contentDisposition: r.headers.get('content-disposition'),
    cacheControl: r.headers.get('cache-control'),
    xContentTypeOptions: r.headers.get('x-content-type-options'),
    bodyPreview: r.status === 200 ? '[binary/file content not printed]' : await r.text(),
  }))
```

```js
await fetch('<DOWNLOAD_HREF>')
  .then(async (r) => ({
    status: r.status,
    contentType: r.headers.get('content-type'),
    contentDisposition: r.headers.get('content-disposition'),
    cacheControl: r.headers.get('cache-control'),
    xContentTypeOptions: r.headers.get('x-content-type-options'),
    bodyPreview: r.status === 200 ? '[binary/file content not printed]' : await r.text(),
  }))
```

Expected:

- allowed preview returns `200`;
- allowed download returns `200`;
- `Cache-Control` is `no-store`;
- `X-Content-Type-Options` is `nosniff` when visible;
- download content-disposition is `attachment` or safe equivalent;
- preview content-disposition is inline or safe equivalent;
- no file body content is printed in test notes;
- no physical path, storage root, logical path, token, session value, cookie value, SQL detail, env value, or secret is exposed.

Observed result in Codex: not observed; runtime blocked.

## Negative Auth Smoke

Runtime negative auth smoke with an `ADMIN`-only session was not performed because no existing local app server was reachable and no safe browser session was available.

Targeted route tests did verify that `ADMIN` alone receives `403` and file work is not delegated.

Observed result in Codex: skipped; covered by targeted tests only.

## DIMUSNAHKAN Smoke

Runtime `DIMUSNAHKAN` smoke was not performed because no existing local app server was reachable and no human-prepared safe destroyed folder fixture was available to Codex.

Targeted helper and route tests did verify:

- `DIMUSNAHKAN` folder state is checked before source/file resolution;
- both `WORKFLOW` and `MANUAL` stale item links are blocked;
- response status is `410`;
- response message is `Data sudah dimusnahkan`;
- manual file responder is not called after the block.

Observed result in Codex: pending manual setup because no safe destroyed folder fixture was available.

## Safety Confirmation

No DB rows were mutated by Codex.

No lifecycle state was changed.

No files were physically deleted.

No de-transitionalization was performed.

No schema, migration, package, env, storage cleanup, route-tree, source, or Supabase artifact changes were made.

Runtime leak behavior could not be observed because runtime smoke was blocked. Targeted tests assert that helper and route/page DTO behavior does not expose physical paths, storage roots, logical paths, tokens, session/cookie terms, raw SQL terms, or raw row markers.

## Runtime Status

Phase 13P.1 is partially completed:

- static targeted verification passed;
- runtime UI/API smoke remains pending human-controlled app startup and local browser session;
- `DIMUSNAHKAN` runtime smoke remains pending a safe destroyed-folder fixture or human-prepared setup;
- negative auth runtime smoke remains pending an available `ADMIN`-only session.
