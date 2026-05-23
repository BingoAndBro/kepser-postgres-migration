# Phase 12K.1 - Manual Archive Attachment Preview/Download API

Date: 2026-05-23

Status: implemented pending human retest.

Scope: API/file-access foundation only for Penambahan Arsip manual archive attachments. This phase does not add UI buttons, signed URLs, file tokens, lifecycle transitions, aggregate reports, Excel export, attachment delete, schema changes, migrations, upload behavior changes, or Supabase runtime behavior.

## Endpoints

The direct file response endpoints are:

- `GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview`
- `GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download`

The route namespace keeps `/arsiparis` compatibility for the internal `KEPALA_SUB_BAGIAN_UMUM` role.

## Security And RBAC

Both routes require local `dms_session` resolution and server-side assigned-role authorization. Authorization requires assigned `KEPALA_SUB_BAGIAN_UMUM`; `ADMIN` remains a dedicated system/admin role and is not automatically allowed.

The routes do not authorize from `dms_active_role`.

Unauthenticated requests return `401`. Non-Kasubag and `ADMIN`-only requests return `403`.

## Data And Lifecycle Checks

Both route parameters are validated as UUIDs.

The server loads the manual archive parent and attachment metadata from PostgreSQL. The attachment must belong to the requested parent. Missing parent, missing attachment, or mismatched parent-child references return a safe `404`.

If the parent `status_arsip` is `DIMUSNAHKAN`, preview and download are blocked with `410` and the safe message:

```text
File lampiran tidak tersedia - arsip telah dimusnahkan
```

`AKTIF`, `INAKTIF`, and `USUL_MUSNAH` are allowed for assigned `KEPALA_SUB_BAGIAN_UMUM` in this phase.

## File Serving

Files are served only through authorized API responses. No public/static serving, browser-direct storage access, Supabase Storage fallback, signed URL, or file-token system is introduced.

The stored `logical_path` is resolved server-side only through existing local storage path safety helpers. Path traversal and storage-root escape are rejected before file access.

Stored `content_type` is revalidated against the Manual Archive upload allowlist before serving. Unsafe types such as `text/html`, SVG, unknown image subtypes, and unsupported content types are not served.

Preview responses use inline `Content-Disposition` where practical. Download responses use attachment `Content-Disposition`. Filename values are sanitized to avoid header injection and path leakage.

Responses and logs must not expose logical paths, physical filesystem paths, storage roots, signed token internals, file contents in JSON, SQL details, environment values, or secrets.

Missing local files return a safe `404`.
