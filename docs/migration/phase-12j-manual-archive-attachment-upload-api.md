# Phase 12J.1 - Manual Archive Attachment Upload API

Date: 2026-05-23

Status: implemented pending human retest.

Scope: backend/API upload foundation only for Penambahan Arsip manual archive attachments. This phase does not implement UI changes, preview/download, signed file tokens, lifecycle transitions, aggregate reports, Excel export, schema changes, migrations, or Supabase runtime behavior.

## Endpoint

The upload endpoint is:

- `POST /api/arsiparis/manual-arsip/$id/attachments`

The route namespace keeps the existing `/arsiparis` compatibility path for the internal `KEPALA_SUB_BAGIAN_UMUM` role.

Multipart field name:

- `files`

Multiple files are accepted under the `files` field.

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

The DB metadata insert uses a transaction, but filesystem writes and DB insert are not fully atomic together. If a file write succeeds and a later file write or DB insert fails, an orphan local file may remain because no existing narrowly scoped cleanup helper currently covers this new manual archive path.

## Response Shape

Successful responses return safe attachment metadata only:

```json
{
  "attachments": [
    {
      "id": "uuid",
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
