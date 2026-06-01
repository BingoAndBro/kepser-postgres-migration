# Phase 13T.1 - Folder Item Attachment Name Preservation Bugfix

Date: 2026-05-30

Status: implemented pending human smoke.

## Scope

Phase 13T.1 fixes a bounded runtime naming bug on folder-first berkas detail attachment actions.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Human Bug Report

Folder-first berkas detail showed generic attachment names for source items:

- `WORKFLOW` attachments displayed as `Lampiran 1`, `Lampiran 2`, and download filenames did not match existing dokumen persetujuan behavior.
- `MANUAL` download naming was already safe/correct, but folder detail labels and preview titles displayed generic `Lampiran`.

## Source Naming Audit

`WORKFLOW` / dokumen persetujuan attachment metadata is stored in `dokumen_transaksi.lampiran_urls`.

The active validated shape is:

```ts
{
  kelengkapan_id: string
  nama: string
  url: string
  uploaded_at: string
}
```

Existing dokumen persetujuan UI labels use `lampiran_urls[].nama`.

Existing dokumen persetujuan preview/download visible filenames are built client-side through `buildStorageFilename()`:

- pending file paths preserve the upload filename embedded in the safe logical path;
- formal file paths use the dokumen filename format from attachment name, request/document leaf metadata, activity name, date, and extension.

Role-specific PPK/PPSPM/Bendahara access routes return signed internal URLs, but their UI download flow still passes the same `buildStorageFilename()` result to the browser download action.

Manual attachments store:

- `manual_arsip_attachment.judul_lampiran`;
- `manual_arsip_attachment.original_filename`;
- `manual_arsip_attachment.logical_path`;
- content type and size metadata.

Existing manual preview/list UI uses `judul_lampiran`. Existing manual download `Content-Disposition` is produced by `createManualArsipAttachmentFileResponse()` using its policy filename: safe `judul_lampiran`, manual archive name, category, date, and safe extension resolved from `original_filename`/content type.

## Fix

Folder-first read DTOs now expose safe attachment labels/titles, not raw attachment metadata.

`WORKFLOW` folder items:

- detail action labels use safe source attachment metadata, primarily `lampiran_urls[].nama`;
- preview modal titles use the same dokumen persetujuan filename formatting behavior used by existing source document UI;
- download `Content-Disposition` uses that same safe source-document filename formatting;
- generic `Lampiran N` fallback is used only when source name/filename metadata is missing or unsafe.

`MANUAL` folder items:

- detail action labels use safe `manual_arsip_attachment.judul_lampiran`;
- preview modal titles use the same safe manual attachment label;
- download behavior remains delegated to the existing Manual Archive responder and is unchanged.

## Fallback And Sanitization

Resolved names used for labels, preview titles, and `Content-Disposition` reject:

- slash or backslash;
- CR/LF;
- quotes unsafe for headers;
- path traversal;
- absolute paths and Windows drive paths;
- URL-like values;
- token/storage/path-looking values.

Fallback names are:

- `Lampiran {index + 1}` for `WORKFLOW`;
- `Lampiran` for `MANUAL`.

Download filename resolution preserves a safe extension where available and does not use logical paths, storage roots, tokens, or signed URL internals as user-facing names.

## DIMUSNAHKAN Boundary

Folder item preview/download still revalidates folder lifecycle and item membership on every request.

`DIMUSNAHKAN` folders still block file access with:

```text
Data file sudah dimusnahkan
```

No file is served and no physical files are deleted by this phase.

## Non-Goals

Phase 13T.1 does not:

- change schema, migrations, Drizzle models, or seeds;
- mutate existing database rows;
- backfill attachment metadata;
- change upload behavior;
- move, rename, or delete physical files;
- change storage layout;
- change preview/download authorization;
- change folder lifecycle, close behavior, or classification behavior;
- stop transitional Manual Archive `arsip.arsip` writes;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Open a berkas containing a `WORKFLOW` item with multiple attachments.
4. Confirm attachment action labels are the source attachment names, not generic `Lampiran 1`.
5. Preview a `WORKFLOW` attachment and confirm the modal title follows existing dokumen persetujuan filename formatting.
6. Download a `WORKFLOW` attachment and confirm the browser filename matches existing dokumen persetujuan behavior.
7. Open a berkas containing a `MANUAL` item.
8. Confirm manual attachment labels and preview titles use the manual attachment title.
9. Confirm manual downloads still use the existing Manual Archive policy filename.
10. Move a test berkas to `DIMUSNAHKAN` and confirm preview/download are blocked with `Data file sudah dimusnahkan`.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-file-access.test.ts tests/unit/arsiparis/berkas-arsip-file-access-route.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
