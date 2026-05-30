# Phase 13Y.3 - Document File Access Destroyed-Folder Awareness

Date: 2026-05-30

Status: implemented pending targeted review and human smoke.

## Observed Issue

After Phase 13Y.2, `Musnahkan Data` can move a folder-first berkas to `DIMUSNAHKAN` and physically delete the related files while preserving metadata and logical references.

Folder-first berkas detail kept returning the safe destroyed-file response. Older document surfaces such as Pegawai, PPK, and PPSPM still used document file-access tokens through:

```text
/api/files/access?token=...
statusCheck=document
```

When the physical file was already deleted, those paths fell through to the generic missing-file response:

```text
File not found
```

That was accurate at the filesystem layer but poor UX and incomplete domain revalidation because the requested workflow document attachment may already belong to a folder-first berkas with `status_berkas='CLOSED'` and `status_arsip='DIMUSNAHKAN'`.

## Runtime Behavior

Document-token file access now reloads folder-first membership for the requested workflow document after session/token authorization and document RBAC have passed.

If the document is attached through `arsip.berkas_arsip_item` as:

```text
source_type = WORKFLOW
dokumen_id = requested document id
```

and the linked `arsip.berkas_arsip` row is:

```text
status_berkas = CLOSED
status_arsip = DIMUSNAHKAN
```

then preview/download returns:

```text
Data file sudah dimusnahkan
```

with the same destroyed-file status used by folder-first item access:

```text
410 Gone
```

This happens before local filesystem `stat`/`readFile`, so physically deleted files no longer surface as generic `File not found` when their folder-first berkas is already destroyed.

## Authorization And No-Leak Boundary

The destroyed-folder check does not bypass authorization.

The flow remains:

1. Verify the file access token.
2. Require a valid local `dms_session`.
3. Enforce token subject/session binding where present.
4. Load the document and enforce server-side document RBAC.
5. Only then apply folder-first destroyed membership handling.

Unauthorized users continue to receive auth/authorization failures, not destroyed-folder existence signals.

Responses must not expose physical paths, logical paths, storage roots, tokens, signed-token internals, raw rows, SQL details, env values, cookies, session values, password hashes, or secrets.

## Not Changed

Phase 13Y.3 does not:

- change physical deletion helper behavior;
- change `Musnahkan Data` lifecycle behavior;
- add routes, pages, or modals;
- create a `Dimusnahkan` list;
- restore or recreate deleted files;
- change upload behavior;
- change workflow/manual write behavior;
- change CSV export behavior;
- target legacy `arsip.arsip` physical deletion;
- change schema, migrations, storage layout, package files, or env files;
- modify `src/routeTree.gen.ts`;
- reintroduce Supabase runtime behavior.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/storage/internal-file-access.test.ts tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-file-access-route.test.ts
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

1. Login as a user who can open an older document surface for a workflow document attached to a folder-first berkas.
2. Move that berkas through the approved lifecycle to `DIMUSNAHKAN` using `Musnahkan Data`.
3. Confirm the physical deletion summary is safe and successful.
4. Open the same document from Pegawai, PPK, or PPSPM surfaces.
5. Use stale and newly generated preview/download links.
6. Confirm the response is `Data file sudah dimusnahkan`, not `File not found`.
7. Confirm metadata remains visible and no path/root/token/session/SQL/env/secret details are shown.
