# Phase 12K - Manual Archive Attachment Preview/Download API

Date: 2026-05-23

Status: Phase 12K.1 implemented pending human retest; Phase 12K.2 filename policy alignment implemented pending human retest; Phase 12K.3 UI button integration implemented pending human retest.

Scope: API/file-access foundation plus UI-only preview/download button integration for Penambahan Arsip manual archive attachments. This phase does not add signed URLs, file tokens, lifecycle transitions, aggregate reports, Excel export, attachment delete, schema changes, migrations, upload behavior changes, or Supabase runtime behavior.

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

## Phase 12K.2 Filename Policy

Manual Archive preview/download responses now build the display/download filename from safe metadata only:

```text
{judul_lampiran}_{nama_arsip}_{kategori}_{tanggal}.{ext}
```

Example:

```text
Bukti_Kegiatan_Pemeliharaan_AC_Pemeliharaan_2026-05-23.pdf
```

The filename is for `Content-Disposition` only. Phase 12K.2 does not change `logical_path`, physical storage layout, uploaded rows, pending-to-formal movement, UI buttons, lifecycle actions, retention fields, edit routes, aggregate reports, exports, signed URLs, or file-token behavior.

Filename construction rules:

- `judul_lampiran` comes from `manual_arsip_attachment.judul_lampiran`.
- `nama_arsip` comes from `manual_arsip.nama`.
- `kategori` comes from `manual_arsip_category.nama`.
- `tanggal` is formatted as deterministic `YYYY-MM-DD`, not a locale-dependent value.
- Extension is derived safely from `original_filename` only when it is compatible with the validated `content_type`; otherwise the validated content type mapping is used.
- Unsafe or empty filename segments fall back to safe labels such as `Lampiran`, `Arsip`, `Kategori`, or `Tanggal`.
- Long filenames are truncated while preserving the extension.
- The filename must not include `logical_path`, physical path, storage root, token, signed URL, SQL, environment values, or secrets.

## Phase 12K.3 UI Button Integration

The `/arsiparis/penambahan-arsip` page now exposes preview and download buttons for Manual Archive attachments after a user expands a specific manual archive row. The list endpoint is not expanded to include attachments; the UI fetches the existing detail endpoint for one selected manual archive item at a time.

The UI renders safe attachment metadata only:

- `judul_lampiran`
- `original_filename`
- `content_type`
- `size_bytes`

The UI builds preview/download links only from `manual_arsip.id` and `manual_arsip_attachment.id`:

- `/api/arsiparis/manual-arsip/{id}/attachments/{attachmentId}/preview`
- `/api/arsiparis/manual-arsip/{id}/attachments/{attachmentId}/download`

Preview opens in a new tab with `rel="noopener noreferrer"`. Download uses direct browser navigation to the authorized API endpoint. No signed URL, token, public/static serving, object URL, file byte parsing, or client-side file cache is introduced.

If the UI-visible parent/detail lifecycle state is `DIMUSNAHKAN`, file buttons are not rendered and the UI shows:

```text
File tidak tersedia - arsip telah dimusnahkan
```

The API remains authoritative for authentication, assigned `KEPALA_SUB_BAGIAN_UMUM` authorization, attachment ownership, lifecycle blocking, content type validation, and file response safety. Phase 12K.3 does not add lifecycle actions, edit/PATCH behavior, retention fields, aggregate reports, exports, attachment deletion, schema changes, migrations, or upload behavior changes.
