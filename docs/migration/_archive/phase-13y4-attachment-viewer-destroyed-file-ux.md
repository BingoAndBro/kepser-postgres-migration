# Phase 13Y.4 - Attachment Viewer Destroyed-File UX

Date: 2026-05-30

Status: implemented pending targeted review and human smoke.

## Observed Issue

After Phase 13Y.3, backend file access correctly returns:

```text
410 Gone
```

with safe JSON:

```json
{ "error": "Data file sudah dimusnahkan" }
```

for document/legacy token file access when the requested workflow document belongs to a folder-first berkas that is already `CLOSED/DIMUSNAHKAN`.

On role document surfaces that use `AttachmentViewer`, preview and download still showed generic failure copy such as:

```text
Gagal memuat pratinjau
```

or did not show a clear user-facing download error.

## Runtime Behavior

`AttachmentViewer` preview now fetches the signed file response before rendering the preview content. If that response is the expected destroyed-file response, the preview modal displays:

```text
Data file sudah dimusnahkan
```

Downloads now propagate the same safe message through the existing alert/error path:

```text
Data file sudah dimusnahkan
```

Generic failures still use existing fallback copy such as:

```text
Gagal memuat pratinjau
Gagal mengunduh file
```

## Safe Error Parsing

The storage client only surfaces the destroyed-file message when all of these are true:

- response status is `410`;
- response body is JSON;
- `error` is exactly `Data file sudah dimusnahkan`.

Unauthorized responses and arbitrary backend text are not converted into destroyed-file messages.

The UI must not render physical paths, logical paths, storage roots, file tokens, signed-token internals, route stacks, raw rows, SQL details, env values, cookies, session values, password hashes, or secrets.

## Not Changed

Phase 13Y.4 does not:

- change `/api/files/access` backend semantics;
- change file authorization;
- change physical deletion helper behavior;
- change `Musnahkan Data` lifecycle behavior;
- restore or recreate deleted files;
- add routes, pages, or modals;
- create a `Dimusnahkan` list;
- change upload behavior;
- change workflow/manual write behavior;
- change CSV export behavior;
- change schema, migrations, storage layout, package files, or env files;
- modify `src/routeTree.gen.ts`;
- reintroduce Supabase runtime behavior.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/storage/storage-client.test.ts tests/unit/components/attachment-viewer-source.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```

## Manual Smoke Recommendation

Use disposable files and test data only.

1. Login as Pegawai, PPK, PPSPM, or Bendahara with access to a document attached to a folder-first berkas.
2. Move the berkas through the approved lifecycle to `DIMUSNAHKAN` using `Musnahkan Data`.
3. Confirm backend file access returns `410` with `Data file sudah dimusnahkan`.
4. Open the role document detail page.
5. Click preview for the destroyed attachment.
6. Confirm the preview modal displays `Data file sudah dimusnahkan`.
7. Click download for the destroyed attachment.
8. Confirm the visible error/alert says `Data file sudah dimusnahkan`.
9. Confirm non-destroyed failures still use generic fallback copy.
10. Confirm no path/root/token/session/SQL/env/secret details are shown.
