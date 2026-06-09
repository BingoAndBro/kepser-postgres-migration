# Phase 15L.7D - Central Document Upload Policy Alignment and Security Validation

Tanggal: 2026-06-09

## Final Policy Summary

Profile avatar upload remains separate and stricter:

- allowed: JPG/JPEG, PNG, WebP;
- MIME: `image/jpeg`, `image/png`, `image/webp`;
- max size: 2 MB per file;
- server-side avatar validation remains authoritative in `src/lib/storage/profile-avatar.ts`.

Document/lampiran upload policy is now centralized for workflow and manual archive uploads:

- allowed extensions: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.jpg`, `.jpeg`, `.png`;
- allowed MIME types: PDF, Microsoft Word legacy/OOXML, Microsoft Excel legacy/OOXML, JPEG, PNG;
- max size: 5 MB per file;
- server-side validation is authoritative;
- client-side validation is UX assistance only.

Preview policy:

- preview is PDF-only;
- non-PDF preview surfaces show:
  - `Preview hanya tersedia untuk file PDF.`
  - `Silakan unduh file ini untuk membukanya.`
- download actions remain routed through existing authorized download paths.

## 15L.7D.1 UX Polish Note

15L.7D.1 keeps the same approved upload policy and only polishes presentation consistency:

- Penambahan Dokumen follows the same document/lampiran policy as Ajukan Dokumen.
- Normal upload validation failures now use a compact warm inline warning style, not a harsh danger alert.
- Validation actions distinguish normal file selection failures (`Pilih File Lain`) from generic upload failures (`Coba Lagi`).

## Files Changed

- `src/lib/upload/document-upload-policy.ts`
- `src/lib/storage/local-upload.ts`
- `src/lib/storage/manual-arsip-upload.ts`
- `src/lib/manual-arsip.ts`
- `src/routes/api/upload.ts`
- `src/routes/api/arsiparis/manual-arsip/$id/attachments.ts`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/AttachmentViewer.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/routes/profile.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `tests/unit/dokumen/penambahan-dokumen-upload-source.test.ts`
- `tests/unit/profile/profile-avatar-source.test.ts`
- `tests/unit/storage/document-upload-policy.test.ts`
- `tests/unit/storage/manual-arsip-upload.test.ts`
- `tests/unit/storage/local-upload.test.ts`
- `tests/unit/storage/upload-route-local.test.ts`
- `tests/unit/dokumen/ajukan-dokumen-parity-source.test.ts`
- `tests/unit/components/attachment-viewer-source.test.ts`
- `tests/unit/arsiparis/manual-arsip-route.test.ts`

## Upload Surfaces Aligned

- Ajukan Dokumen upload through `FileUploadButton` and `/api/upload`.
- Revisi Dokumen upload through `AttachmentEditor` and `/api/upload`.
- PPK Resubmit/Edit attachment upload through the same `AttachmentEditor` flow.
- Manual archive / Penambahan Dokumen upload page.
- Manual archive supporting attachment API/helper.
- Editable `AttachmentViewer` delegated upload input.
- Folder-first archive detail preview UX for existing lampiran access.

## Server-Side Validation Changes

- Workflow `/api/upload` now uses 5 MB max size.
- Workflow upload allows PDF, DOC, DOCX, XLS, XLSX, JPG/JPEG, and PNG.
- Manual archive attachment upload now uses the same document/lampiran policy instead of the old broad image/10 MB policy.
- Filename extension, declared MIME, and extension/MIME pairing are enforced.
- Basic signature validation is enforced before writes:
  - PDF requires `%PDF-`;
  - JPEG requires JPEG leading bytes;
  - PNG requires PNG leading bytes;
  - DOC/XLS legacy Office requires OLE compound signature;
  - DOCX/XLSX requires ZIP signature.
- SVG, HTML/XML/JS, archives, executables/scripts, unknown binary, mismatched extension/MIME, unsafe filenames, empty files, and oversized files are rejected by allowlist, filename safety, size, or signature checks.

## Client-Side UX/Message Changes

Client upload hints and preflight checks now use:

- helper: `PDF, DOC, DOCX, XLS, XLSX, JPG, atau PNG • Maks. 5 MB`
- invalid format: `Format file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, JPG, atau PNG.`
- too large: `Ukuran file terlalu besar. Maksimal 5 MB per file.`
- invalid/corrupt: `File tidak valid. Pilih file lain.`
- generic upload failure: `Gagal mengunggah file. Coba lagi.`
- partial/multiple failure: `Beberapa file tidak dapat diunggah. Periksa format dan ukuran file.`

Inline validation presentation maps those categories to compact user-facing copy:

- invalid format: `Format tidak didukung` / `Gunakan PDF, DOC, DOCX, XLS, XLSX, JPG, atau PNG. Maksimal 5 MB.` / `Pilih File Lain`
- too large: `Ukuran file terlalu besar` / `Maksimal 5 MB per file.` / `Pilih File Lain`
- invalid/corrupt: `File tidak valid` / `Pilih file lain dengan format yang didukung.` / `Pilih File Lain`
- generic upload failure: `Gagal mengunggah file` / `Coba lagi atau pilih file lain.` / `Coba Lagi`

## Preview PDF-Only Behavior

Workflow preview components, manual archive preview modals, and folder-first detail preview now avoid iframe preview for non-PDF files where the client can infer the file type. The download action stays available through the existing authorized route/link.

## Known Limitations

- DOCX/XLSX validation checks extension, MIME, and ZIP signature only.
- This phase does not inspect internal OOXML ZIP entries such as `[Content_Types].xml`, `word/`, or `xl/` because no new dependencies were added.
- Client-side validation is not authoritative and can be bypassed; server helpers remain the policy boundary.
- No virus scanning, image compression, rate-limit expansion, quota system, schema change, or package dependency change was added.
- Existing archive file-access MIME inference for historical stored files was not narrowed in this phase.

## Manual Validation Checklist

1. Avatar JPG/PNG/WebP under 2 MB succeeds.
2. Avatar PDF/DOC/XLS/SVG and image over 2 MB fail with avatar-specific messages.
3. Ajukan Dokumen accepts PDF/DOC/DOCX/XLS/XLSX/JPG/PNG under 5 MB.
4. Revisi Dokumen accepts the same document/lampiran formats and rejects unsupported/oversized files.
5. PPK Resubmit/Edit attachment upload accepts the same policy.
6. Penambahan Dokumen accepts the same policy and rejects WebP/SVG/archives/scripts/oversized files.
7. PDF preview opens.
8. DOC/DOCX/XLS/XLSX/JPG/PNG preview shows the PDF-only empty state and keeps download available.
9. Network/UI responses do not expose storage roots, physical paths, tokens, cookies, sessions, DB URLs, env values, SQL details, or secrets; existing lampiran `url` response use remains a compatibility contract for workflow form state.

## Security/Privacy Confirmation

- Avatar policy was preserved and not merged into the broader document/lampiran policy.
- Server-side upload validation remains authoritative.
- Same-origin/session/auth boundaries were not changed.
- No schema, migration, package, lockfile, route tree, Supabase, auth/session, RBAC, lifecycle, destruction, notification, activity-log, or environment changes were made.
- Upload and error responses use user-facing categories and do not expose physical storage paths, storage roots, tokens, cookies, sessions, DB URLs, env values, SQL details, password hashes, or secrets.
- This phase did not redesign the existing lampiran `url` response contract used by workflow form state and pending cleanup; it avoided adding new path exposure and removed a dev log that printed the uploaded logical reference.
