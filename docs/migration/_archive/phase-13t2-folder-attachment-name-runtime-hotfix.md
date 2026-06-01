# Phase 13T.2 - Folder Attachment Name Runtime Hotfix

Date: 2026-05-30

Status: implemented pending human smoke.

## Scope

Phase 13T.2 fixes a bounded runtime regression after Phase 13T.1 attachment-name preservation.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Runtime Symptom

Human smoke found 500 responses on folder-first berkas detail and item file access:

- `GET /api/arsiparis/berkas/<berkasId>`
- `GET /api/arsiparis/berkas/<berkasId>/items/<itemId>/preview/<lampiranIndex>`
- `GET /api/arsiparis/berkas/<berkasId>/items/<itemId>/download/<lampiranIndex>`

The safe file-access response was:

```text
Gagal mengakses file berkas
```

## Root Cause Found

Phase 13T.1 introduced best-effort source filename reconstruction for folder-first item attachments.

Two runtime hazards were found:

- `getFileExtension()` was still used by folder item file access but was no longer imported, so workflow file access could throw while inferring content type for attachments without safe content-type metadata.
- `asc()` was used by the folder-first read model manual attachment query but was not imported, so real detail queries involving manual attachment ordering could throw.

The attachment-name resolver also called `buildStorageFilename()` as a direct dependency for source-style workflow filenames. That was too strict for a folder detail/file-access path because incomplete master metadata should only affect the visible filename, not whether the folder detail or file response can load.

## Fix Strategy

The hotfix restores missing imports and makes workflow source filename reconstruction defensive.

`buildStorageFilename()` is now best-effort only:

- it is called only when the document metadata needed for the existing dokumen filename format is present;
- it is wrapped so exceptions fall through to safe fallback naming;
- folder detail DTO creation and file access no longer depend on perfect filename reconstruction.

Manual download remains delegated to the existing Manual Archive responder.

## Naming Fallback Policy

WORKFLOW filename priority:

1. Existing dokumen persetujuan filename format when safely buildable.
2. Safe `lampiran_urls[].nama` plus safe extension from the logical path.
3. Generic `Lampiran {index + 1}` plus safe extension.
4. Generic `Lampiran {index + 1}`.

MANUAL naming policy:

- folder detail labels and preview titles use safe `manual_arsip_attachment.judul_lampiran` metadata;
- manual download `Content-Disposition` remains delegated unchanged.

Unsafe names, path-looking values, tokens, storage roots, logical paths, physical paths, signed URL internals, SQL/env/session/cookie-like values, and traversal values are not exposed.

## Non-Goals

Phase 13T.2 does not:

- change schema, migrations, Drizzle models, or seeds;
- mutate database rows;
- backfill metadata;
- change upload behavior;
- change storage layout or storage helpers;
- move, rename, or delete physical files;
- change preview/download authorization;
- change `DIMUSNAHKAN` blocking;
- change lifecycle, close, workflow/manual classification, or CSV export behavior;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Checklist

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Open a berkas detail containing workflow attachments with complete metadata and confirm the detail loads.
4. Preview and download a workflow attachment with complete metadata and confirm source-style filenames.
5. Open a berkas detail containing workflow attachments with incomplete master metadata and confirm the detail still loads with safe fallback names.
6. Preview and download that workflow attachment and confirm the file is served if authorization, membership, lifecycle, and storage checks pass.
7. Open a berkas detail containing manual attachments and confirm labels/preview titles use manual attachment metadata.
8. Download a manual attachment and confirm the existing Manual Archive filename policy is unchanged.
9. Move a test berkas to `DIMUSNAHKAN` and confirm preview/download are blocked with `Data file sudah dimusnahkan`.
10. Confirm no response exposes logical paths, physical paths, storage roots, file tokens, signed-token internals, cookies, session values, SQL details, env values, or secrets.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-attachment-names.test.ts tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-file-access-route.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
