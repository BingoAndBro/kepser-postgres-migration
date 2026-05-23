# Phase 12J.1 - Manual Archive Attachment Upload API

Date: 2026-05-23

Status: implemented pending human retest. Phase 12J.2b updates this endpoint to require explicit attachment titles.

Scope: backend/API upload foundation only for Penambahan Arsip manual archive attachments. This phase does not implement UI changes, preview/download, signed file tokens, lifecycle transitions, aggregate reports, Excel export, schema changes, migrations, or Supabase runtime behavior.

## Endpoint

The upload endpoint is:

- `POST /api/arsiparis/manual-arsip/$id/attachments`

The route namespace keeps the existing `/arsiparis` compatibility path for the internal `KEPALA_SUB_BAGIAN_UMUM` role.

Multipart field names:

- `files`
- `titles`

Multiple files are accepted under the `files` field.

Phase 12J.2b requires one repeated string `titles` field per uploaded file. Files and titles are paired by repeated field order/index only; filenames are not used for title matching.

## Security And RBAC

The endpoint uses local `dms_session` resolution and server-side assigned-role authorization. It requires assigned `KEPALA_SUB_BAGIAN_UMUM`.

`ADMIN` remains a dedicated system/admin role and is not automatically allowed to upload operational manual archive attachments. `dms_active_role` is not authorization proof.

Unsafe `POST` is protected by the centralized same-origin guard.

Unauthenticated requests return `401`. Non-Kasubag and ADMIN-only requests return `403`.

## Parent Lifecycle Guard

The parent `manual_arsip` row must already exist.

Upload is allowed only when `manual_arsip.status_arsip='AKTIF'`.

Upload to `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN` is rejected. This phase does not mutate parent metadata or lifecycle fields.

## File Validation

The endpoint requires at least one file and allows at most five files per request.

Per-file size limit is 10 MB.

Allowed declared content types are:

- `application/pdf`
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/bmp`
- `image/tiff`
- `image/heic`
- `image/heif`

Validation uses declared `content_type`, sanitized display filename, size metadata, and a storage extension derived from the explicit content-type allowlist. SVG and unknown `image/*` subtypes are rejected. This phase does not add magic-byte/file-signature validation.

## Storage And DB

Files are written to local filesystem storage only, outside public/static serving.

Logical path pattern:

```text
manual-arsip/{createdBy}/{manualArsipId}/{uuid}.{ext}
```

Only `logical_path` is stored in `arsip.manual_arsip_attachment`. Physical filesystem paths and storage roots are not stored.

One attachment row is inserted per accepted file. `created_by` comes from the server session user id.

Phase 12J.2a adds official attachment title column `judul_lampiran` to `arsip.manual_arsip_attachment`. Existing rows are backfilled from `original_filename`, with `Lampiran` as a fallback if an existing filename is blank. Before Phase 12J.2b, this upload API could set `judul_lampiran` from `original_filename` for compatibility.

As of Phase 12J.2b, the upload API requires explicit `titles` multipart values. Each title is trimmed, required after trim, capped at 120 characters, and stored in `judul_lampiran`. The runtime no longer falls back from `original_filename` to `judul_lampiran`.

The DB metadata insert uses a transaction, but filesystem writes and DB insert are not fully atomic together. If a file write succeeds and a later file write or DB insert fails, an orphan local file may remain because no existing narrowly scoped cleanup helper currently covers this new manual archive path.

## Response Shape

Successful responses return safe attachment metadata only:

```json
{
  "attachments": [
    {
      "id": "uuid",
      "judul_lampiran": "Bukti Kegiatan",
      "original_filename": "lampiran.pdf",
      "content_type": "application/pdf",
      "size_bytes": 1234,
      "created_at": "2026-05-23T00:00:00.000Z"
    }
  ]
}
```

Responses do not return:

- `logical_path`
- physical filesystem paths
- storage roots
- preview/download URLs
- signed URL/token internals
- file contents
- SQL details
- environment values or secrets
