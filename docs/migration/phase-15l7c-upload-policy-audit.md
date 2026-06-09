# Phase 15L.7C - Upload Policy Audit Across Application

Tanggal audit: 2026-06-09

Scope: audit-only. Dokumen ini tidak mengubah source behavior, API, schema, storage helper, preview/download, lifecycle arsip, auth, package, atau migration.

## Executive Summary

Current upload policy state is partly centralized but fragmented by domain:

- Profile avatar upload is the strongest and clearest policy. It allows JPG/JPEG, PNG, and WebP only; enforces 2 MB; validates client-side and server-side; validates extension/MIME consistency; checks basic magic bytes; and returns user-friendly Indonesian copy. Source: `src/routes/profile.tsx:69`, `src/routes/profile.tsx:215`, `src/routes/api/users/me.ts:130`, `src/lib/storage/profile-avatar.ts:14`, `src/lib/storage/profile-avatar.ts:115`, `src/lib/storage/profile-avatar.ts:135`.
- Workflow document uploads through `/api/upload` allow PDF, DOC, DOCX, XLS, and XLSX; enforce 2 MB; validate client-side in `FileUploadButton`; validate server-side in `src/lib/storage/local-upload.ts`; and cross-check extension with declared MIME. They do not inspect file signatures/magic bytes. Source: `src/components/dokumen/FileUploadButton.tsx:13`, `src/components/dokumen/FileUploadButton.tsx:109`, `src/routes/api/upload.ts:49`, `src/lib/storage/local-upload.ts:15`, `src/lib/storage/local-upload.ts:115`.
- Revisi Dokumen and PPK Resubmit use `AttachmentEditor` and post to the same `/api/upload` route, so server authority is consistent, but the component itself mostly relies on the browser `accept` hint and server rejection instead of local preflight copy. Source: `src/components/dokumen/AttachmentEditor.tsx:30`, `src/components/dokumen/AttachmentEditor.tsx:458`, `src/routes/pegawai/dokumen/$id/revisi.tsx:605`, `src/routes/ppk/dokumen/$id/resubmit.tsx:623`.
- Manual archive / Penambahan Dokumen upload allows PDF plus image MIME types including BMP, GIF, HEIC, HEIF, JPEG/JPG, PNG, TIFF, and WebP; enforces maximum 5 files and 10 MB per file; validates client-side and server-side by declared content type and size; does not inspect magic bytes; and does not appear to cross-check the user filename extension with the declared content type. Source: `src/routes/arsiparis/penambahan-arsip.tsx:183`, `src/routes/arsiparis/penambahan-arsip.tsx:186`, `src/routes/arsiparis/penambahan-arsip.tsx:2499`, `src/routes/api/arsiparis/manual-arsip/$id/attachments.ts:92`, `src/lib/storage/manual-arsip-upload.ts:16`, `src/lib/storage/manual-arsip-upload.ts:176`.

Highest-risk inconsistencies:

- Manual archive image/PDF uploads are broader than workflow document uploads and depend on declared MIME only. This is acceptable only as a known bounded policy, not as a hardened file validation posture.
- `AttachmentViewer` editable mode advertises `.jpg/.jpeg/.png` in `accept`, while the active workflow upload API rejects images. It appears to be a stale or partially wired client surface unless its callbacks enforce a different policy elsewhere. Source: `src/components/dokumen/AttachmentViewer.tsx:244`, `src/components/dokumen/AttachmentViewer.tsx:364`.
- Upload limits and allowlists are duplicated between client components and server helpers. Avatar duplication is currently consistent; workflow and manual archive duplication should be centralized in a future phase to avoid drift.
- Error copy is generally Indonesian and safe, but style and specificity vary: `2MB` vs `2 MB`, "Tipe file" vs "Format", `alert(...)` in `AttachmentEditor`, and manual archive partial-success copy can hide exact upload failure causes after metadata creation.

## Upload Surface Inventory

| Upload surface | Page/component | API route/helper | Role(s) | Business purpose | Allowed file types/extensions | MIME validation | Signature validation | Max file size | Client-side validation | Server-side validation | Error message quality | Storage path handling | Security notes | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Profile avatar upload | `src/routes/profile.tsx:215`, `src/routes/profile.tsx:427` | `POST /api/users/me?avatar=1`, `src/lib/storage/profile-avatar.ts:115` | Authenticated current user | Foto profil akun | JPG/JPEG, PNG, WebP | Yes, exact allowlist: `image/jpeg`, `image/png`, `image/webp` | Yes, JPEG/PNG/WebP magic-byte checks | 2 MB | Yes: MIME and size | Yes: extension, MIME, size, content length, signature, owner segment | Strong and user-friendly: "Format foto tidak didukung...", "Ukuran foto terlalu besar..." | Generated key under avatar namespace; path normalized and root-contained; API response does not expose storage key | Best current model. SVG/PDF/corrupt/oversized rejected server-side. | Keep as baseline. Later extract shared policy constants without weakening signature checks. |
| Avatar remove | `src/routes/profile.tsx:274` | `DELETE /api/users/me?avatar=1` | Authenticated current user | Hapus foto profil | Not an upload | N/A | N/A | N/A | N/A | Same-origin and session required | Friendly | Uses stored avatar key validation before removal | Included for completeness; no upload policy risk. | No upload-policy change needed. |
| Ajukan Dokumen initial lampiran | `src/routes/pegawai/dokumen/aju.tsx:44`, `src/components/dokumen/KelengkapanChecklist.tsx:321`, `src/components/dokumen/FileUploadButton.tsx:109` | `POST /api/upload`, `src/lib/storage/local-upload.ts:115`, pending-to-formal via submit helpers | `PEGAWAI` submit flow | Upload kelengkapan dokumen workflow sebelum submit | PDF, DOC, DOCX, XLS, XLSX | Yes, client and server declared MIME allowlist | No | 2 MB | Yes: MIME and size in `FileUploadButton` | Yes: extension, declared MIME, extension/MIME match, metadata size, content length | Mostly clear, but "2MB" lacks space and copy differs from avatar | Pending logical path generated server-side from session owner; filename sanitized; root containment in storage helper | No magic-byte validation. Office/PDF content spoofing remains possible if browser-supplied MIME is wrong. | Future hardening should add central policy and optional signature/container checks where practical. |
| Revisi Dokumen upload/replace | `src/routes/pegawai/dokumen/$id/revisi.tsx:605`, `src/components/dokumen/AttachmentEditor.tsx:458` | `POST /api/upload`; final submit uses revision route with existing lampiran DTOs | `PEGAWAI` for returned/revision flow | Replace/add lampiran during revision | UI accept: `.pdf,.doc,.docx,.xls,.xlsx`; server allows same as `/api/upload` | Server yes; component itself does not preflight MIME/size before request | No | 2 MB server-side | Minimal: browser `accept` only in `AttachmentEditor` | Yes via `/api/upload` | Uses `alert(...)`; less polished and less beginner-friendly than profile | Server path generation and pending cleanup guarded by `/api/upload?cleanup=pending` | Server authority is present, but client UX waits for server rejection. Logs include filename/path in dev logger; should remain dev-only. | Add shared client preflight and inline errors later; keep server authority unchanged. |
| PPK Resubmit upload/replace | `src/routes/ppk/dokumen/$id/resubmit.tsx:623`, `src/components/dokumen/AttachmentEditor.tsx:458` | `POST /api/upload`; final submit via PPK resubmit route | `PPK` resubmit flow if present in current route | Replace/add lampiran for PPK resubmit | Same as `AttachmentEditor`: `.pdf,.doc,.docx,.xls,.xlsx`; server same as `/api/upload` | Server yes | No | 2 MB server-side | Minimal: browser `accept` only | Yes via `/api/upload` | Same `alert(...)` pattern as revision | Same pending upload path handling as workflow uploads | Same as revision. | Same as revision. |
| Edit Dokumen upload/replace | `src/routes/pegawai/dokumen/$id/edit.tsx:213`, `src/components/dokumen/AttachmentEditor.tsx:458` | `POST /api/upload` | `PEGAWAI` edit flow | Replace/add existing draft/edit attachments | Same as `AttachmentEditor` | Server yes | No | 2 MB server-side | Minimal: browser `accept` only | Yes via `/api/upload` | Same `alert(...)` pattern | Same pending upload path handling | Same policy family as revision/resubmit. | Include in workflow upload centralization phase. |
| AttachmentViewer editable upload callback | `src/components/dokumen/AttachmentViewer.tsx:244`, `src/components/dokumen/AttachmentViewer.tsx:364` | Parent-provided `onReplace` / `onUpload`; no direct API in component | Depends on parent route | Editable attachment replacement surface | `accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"` | Tidak jelas dari kode saat ini; this component only forwards `File` to parent callbacks | No validation in component | Tidak jelas dari kode saat ini | Browser `accept` only | Depends on parent callback | No inline validation error here | Depends on parent callback | Potential inconsistency: accept includes images, but `/api/upload` rejects images. | Audit parent usages before enabling editable image replacement; align accept with authoritative server policy. |
| Manual archive / Penambahan Dokumen initial attachments | `src/routes/arsiparis/penambahan-arsip.tsx:183`, `src/routes/arsiparis/penambahan-arsip.tsx:1342`, `src/routes/arsiparis/penambahan-arsip.tsx:2499` | `POST /api/arsiparis/manual-arsip/$id/attachments`, `src/lib/manual-arsip.ts:759`, `src/lib/storage/manual-arsip-upload.ts:176` | `KEPALA_SUB_BAGIAN_UMUM` / arsiparis role boundary per manual archive API | Add manual archive document attachments | PDF plus BMP, GIF, HEIC, HEIF, JPEG/JPG, PNG, TIFF, WebP by MIME | Yes, declared content type allowlist | No | 10 MB per file; max 5 files | Yes: file count, title, MIME, size | Yes: file count, title alignment, title length, MIME, size, content length, parent status | Generally understandable, but "PDF atau gambar" hides exact accepted formats; failed attachment upload after metadata creation becomes a warning-like success state | Generated logical path under manual archive namespace; owner/manual id segments sanitized; root-contained | Broader image allowlist than avatar. SVG is rejected by omission. MIME spoofing risk remains. Filename extension is sanitized but storage extension is derived from content type, not verified against original extension. | Decide desired manual archive policy explicitly, then harden declared MIME with extension/signature checks. |
| Manual archive attachment add after existing document | `src/routes/api/arsiparis/manual-arsip/$id/attachments.ts:28` | Same route/helper as above | Authorized manual archive API session | Attach files to existing manual archive with `AKTIF` status | Same as manual archive upload | Yes | No | 10 MB per file; max 5 files | Depends on caller; route is server-authoritative | Yes | Good but not exhaustive | Same as above | Server rejects non-`AKTIF` parent. | Same as above. |
| Archive folder item preview/download | `src/lib/archive/berkas-arsip-file-access.ts:170`, `src/lib/archive/berkas-arsip-file-access.ts:339` | Preview/download file access, not upload | Authorized archive roles | Access archived workflow/manual attachments | Not an upload | Uses stored/inferred content type for response | N/A | N/A | N/A | Revalidates folder/item and path | Safe failure posture, not upload copy | Resolves logical path through storage root containment | `DIMUSNAHKAN` behavior is enforced in file access elsewhere; not changed here. | Keep separate from upload policy changes. |
| Admin/import/master-data upload | `src/routes/admin.master-data.kelengkapan.tsx:524`, `src/routes/admin.master-data.jenis-dokumen.tsx`, `src/routes/api/admin/*`, `src/routes/api/master*` | No active multipart/FormData upload route found in inspected active source | `ADMIN` for master-data pages | Master data CRUD | Tidak jelas dari kode saat ini; no active file upload found | Tidak jelas dari kode saat ini | N/A | N/A | N/A | N/A | N/A | N/A | Only display copy "Format: mengikuti dokumen yang diunggah" found in master kelengkapan UI. | No implementation phase needed unless future import feature is introduced. |
| Pending cleanup | `src/components/dokumen/AttachmentEditor.tsx:31`, `src/routes/api/upload.ts:160` | `POST /api/upload?cleanup=pending` | Current session owner | Delete unused pending uploads | Not an upload | N/A | N/A | Max 50 URLs in body schema | Client sends tracked pending URLs | Server validates same-origin, session, logical path safety, pending classification, owner match, file existence/root containment | Internal cleanup errors are category-like, not polished user copy | Uses logical path only, resolves physical path server-side | Response includes logical pending references back to the authenticated client; does not expose physical path/root. | Later consider safe count-only cleanup response if stricter no-logical-reference posture is desired. |
| Pending-to-formal move | `src/lib/storage/submit-move-plan.ts:86`, `src/lib/storage/local-pending-move.ts:86`, `src/lib/storage/local-pending-move.ts:160` | Submit/write orchestration helpers | Submit actor | Move pending uploads into formal storage layout | Keeps existing extension from pending file | No new MIME validation during move | No | N/A | N/A | Logical path normalized; owner match; source classification; no-overwrite target; source existence | Internal errors mapped by submit flow | Formal target generated server-side and root-contained | Move does not revalidate file content type; relies on upload-time validation. | After central policy hardening, keep move content-neutral but ensure upload-time metadata is trustworthy. |

## Current Known Avatar Policy

Avatar policy is known and should remain:

- allowed formats: JPG/JPEG, PNG, WebP;
- allowed MIME types: `image/jpeg`, `image/png`, `image/webp`;
- max size: 2 MB;
- SVG, PDF, unsupported image types, corrupt files, mismatched extension/MIME, and oversized files are rejected;
- server authority is `writeProfileAvatarContent(...)` in `src/lib/storage/profile-avatar.ts`;
- client-side Profile page gives early feedback but is not the authority;
- API responses use user-friendly Indonesian copy;
- topbar/dropdown consumption was already handled in Phase 15L.7B and is not part of this audit.

Avatar storage is intentionally separate from document/archive attachment storage. Phase 15L.7A also documents that avatar responses must not expose physical paths, storage roots, logical storage keys, tokens, cookies, session values, DB URLs, password hashes, SQL details, or raw rows.

## Document Upload Policy Findings

Workflow document uploads currently do not allow arbitrary files. The active `/api/upload` policy allows:

- PDF: `application/pdf`, `.pdf`;
- Word legacy: `application/msword`, `.doc`;
- Word OOXML: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.docx`;
- Excel legacy: `application/vnd.ms-excel`, `.xls`;
- Excel OOXML: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `.xlsx`;
- max size: 2 MB.

Workflow document uploads do not allow images through `/api/upload`. Source: `src/lib/storage/local-upload.ts:17`.

Workflow document uploads enforce:

- client-side MIME and size in `FileUploadButton`;
- browser `accept` hints in `AttachmentEditor`;
- server-side extension allowlist;
- server-side declared MIME allowlist;
- server-side extension/MIME match;
- server-side metadata size and actual content length checks;
- server-side filename sanitization and logical path normalization.

Workflow document uploads do not currently enforce:

- PDF magic-byte validation;
- Office container signature or ZIP structure validation;
- antivirus/malware scanning;
- durable per-user quota;
- upload route rate limit beyond the broader project backlog.

Manual archive document uploads currently allow PDF and selected images. They do not allow office files. They also do not allow arbitrary image subtypes: SVG and unknown `image/*` are rejected by omission from the allowlist. Source: `src/lib/storage/manual-arsip-upload.ts:21`.

Manual archive uploads enforce:

- max 5 files per upload;
- max 10 MB per file;
- required aligned `titles` multipart field for each file;
- declared content type allowlist;
- positive safe integer file size;
- actual content length <= 10 MB and matching expected bytes;
- sanitized original filename;
- generated logical storage path.

Manual archive uploads do not currently enforce:

- file signature/magic-byte validation;
- original filename extension matching declared MIME;
- image dimension/metadata sanitization;
- malware scanning.

`AttachmentViewer` editable mode is unclear as an upload policy authority. Its `accept` includes PDF, JPG/JPEG, PNG, DOC, DOCX, XLS, and XLSX, but it delegates the selected `File` to parent callbacks. If those callbacks eventually post to `/api/upload`, images will be rejected server-side. Source: `src/components/dokumen/AttachmentViewer.tsx:364`.

## Centralization Analysis

Upload policy is partly centralized:

- Avatar server policy is centralized in `src/lib/storage/profile-avatar.ts`.
- Workflow server policy is centralized in `src/lib/storage/local-upload.ts`.
- Manual archive server policy is centralized in `src/lib/storage/manual-arsip-upload.ts`.
- Path safety is centralized in `src/lib/storage/local-storage-paths.ts`.

Upload policy is also duplicated:

- Avatar MIME and size constants are duplicated in `src/routes/profile.tsx` and `src/lib/storage/profile-avatar.ts`.
- Workflow MIME/extension/size rules are duplicated in `src/components/dokumen/FileUploadButton.tsx` and `src/lib/storage/local-upload.ts`.
- Manual archive MIME/count/size rules are duplicated in `src/routes/arsiparis/penambahan-arsip.tsx` and `src/lib/storage/manual-arsip-upload.ts`.
- `AttachmentEditor` uses an extension-only `accept` constant and relies on server rejection for policy enforcement.
- `AttachmentViewer` has its own broader `accept` string that does not obviously match `/api/upload`.

Server authority exists for every active upload API found. The fragmentation risk is client/server drift, not absence of server validation.

## UX Analysis

Current UX quality:

- Profile avatar UX is the best current example: helper text states accepted formats and max size, client-side errors are direct, server error mapping is friendly, and upload/remove success messages are clear.
- `FileUploadButton` provides inline errors, but copy is less polished: `Ukuran file maksimal 2MB` and `Tipe file tidak diizinkan. Gunakan: .pdf, .doc, .docx, .xls, .xlsx`.
- `AttachmentEditor` uses browser `accept` and `alert(...)` for server errors. This is functional but less accessible, less consistent, and less helpful for repeated correction.
- Manual archive form provides per-row validation and clear required-title errors, but the allowed format copy says "PDF atau gambar yang didukung" without listing the exact image formats. Upload failure after the manual archive record is created is handled as a partial-success notice, but the exact server reason is not surfaced in the inspected snippet.
- Error copy varies between `Format`, `Tipe file`, `2MB`, `2 MB`, `Gagal mengupload`, and `Gagal mengunggah`.

Recommended Indonesian copy for future phases, after policy decision:

- For workflow document uploads: `Format tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX.`
- For workflow size: `Ukuran file terlalu besar. Maksimal 2 MB per file.`
- For manual archive policy if broad image support remains: `Format tidak didukung. Gunakan PDF, JPG, PNG, WebP, GIF, BMP, TIFF, HEIC, atau HEIF.`
- For manual archive size: `Ukuran file terlalu besar. Maksimal 10 MB per file.`
- For corrupt/signature failure after future hardening: `File tidak valid. Pilih file lain.`
- For network/server failure: `Gagal mengunggah file. Coba lagi.`
- For multi-file manual archive failures: `Beberapa file tidak dapat diunggah. Periksa format dan ukuran file.`

Do not implement copy changes until the final allowed-format decision is made, especially for manual archive images and `AttachmentViewer` editable mode.

## Security Analysis

Positive findings:

- Active upload APIs require local `dms_session`.
- Unsafe upload methods are protected by centralized same-origin validation.
- Server-side validation exists for avatar, workflow document upload, and manual archive upload.
- Storage roots and physical paths are resolved server-side and are not returned by upload success responses.
- `resolvePhysicalStoragePath(...)` keeps physical paths under the configured storage root.
- Logical path normalization rejects traversal, URL/protocol values, Windows absolute paths, dot segments, and empty segments.
- Upload writers use no-overwrite behavior and clean up partially opened targets on failure.
- Pending cleanup validates owner, supported pending classification, file type as regular file, and root containment before deletion.
- File access responders set `X-Content-Type-Options: nosniff` in inspected helpers and revalidate document/folder-aware access elsewhere.

Gaps and residual risks:

- Workflow upload validation is extension plus declared MIME plus size/content-length. It does not inspect PDF or Office signatures.
- Manual archive upload validation is declared MIME plus size/content-length. It does not inspect signatures and does not cross-check original filename extension against declared content type.
- Manual archive allows several image formats that may carry parser/metadata risks. SVG is not allowed, which is good.
- `AttachmentViewer` editable accept list includes images even though `/api/upload` rejects images. This can create user confusion or policy ambiguity.
- `AttachmentEditor` does not perform client-side size/type preflight beyond `accept`, so users learn about invalid files only after server response.
- No upload-specific persistent/distributed rate limit or quota was found in this audit.
- No malware scanning was found.
- Pending cleanup returns logical references to the authenticated client. This is not a physical path leak, but a future stricter posture may prefer count/category-only responses.
- `logDev`/`warnDev` in upload components include filenames and upload paths for development diagnostics. They must stay development-only and must not be promoted to production logs.

This audit did not print secrets, env values, DB URLs, cookies, sessions, tokens, password hashes, storage roots, physical paths, or logical storage keys.

## Recommended Next Phases

Recommended safe order:

1. **15L.7D - Upload Policy Decision Matrix**
   - Decide the desired policy per domain before changing code.
   - Explicitly answer whether workflow uploads should remain office/PDF only, whether manual archive should keep broad image support, and whether `AttachmentViewer` image accept is stale or intentional.
   - Decide target max sizes: avatar 2 MB, workflow 2 MB or new value, manual archive 10 MB or new value.

2. **15L.7E - Central Upload Policy Constants**
   - Add shared server-owned policy metadata for display and validation reuse.
   - Keep server helpers authoritative.
   - Export safe client-readable descriptors only where appropriate.
   - Do not weaken avatar signature validation.

3. **15L.7F - Client Upload UX Consistency**
   - Align `accept` strings and helper copy with the decided policy.
   - Replace `AttachmentEditor` upload `alert(...)` with inline, per-file errors.
   - Standardize Indonesian copy and spacing (`2 MB`, `10 MB`).
   - Add helper text near upload controls.

4. **15L.7G - Server Upload Validation Hardening**
   - Add signature/magic-byte validation where practical:
     - avatar already done;
     - PDF header validation for workflow/manual PDF;
     - basic ZIP container validation for DOCX/XLSX if accepted;
     - image signature validation for manual image formats that remain allowed.
   - Add extension/content-type consistency for manual archive original filenames.
   - Preserve current safe error responses and no path leaks.

5. **15L.7H - Upload Regression Tests**
   - Add focused tests for every decided policy:
     - allowed examples;
     - SVG rejection;
     - unsupported MIME rejection;
     - mismatched extension/MIME rejection;
     - corrupt signature rejection where implemented;
     - oversize rejection;
     - multi-file manual archive limits;
     - no physical path/storage root/logical key leak in API responses.

6. **15L.7I - Optional Upload Abuse Controls**
   - Consider upload-specific rate limiting and per-user quota if deployment posture expands beyond bounded internal/LAN use.
   - Keep this separate from format/size correctness to avoid mixing security posture changes with UX refactors.

## Sources Inspected

Primary active source:

- `src/routes/profile.tsx`
- `src/routes/api/users/me.ts`
- `src/lib/storage/profile-avatar.ts`
- `src/lib/storage/local-upload.ts`
- `src/routes/api/upload.ts`
- `src/lib/storage/manual-arsip-upload.ts`
- `src/routes/api/arsiparis/manual-arsip/$id/attachments.ts`
- `src/lib/manual-arsip.ts`
- `src/components/dokumen/FileUploadButton.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `src/components/dokumen/AttachmentViewer.tsx`
- `src/components/dokumen/KelengkapanChecklist.tsx`
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `src/routes/pegawai/dokumen/$id/edit.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/lib/storage/local-storage-paths.ts`
- `src/lib/storage/submit-move-plan.ts`
- `src/lib/storage/local-pending-move.ts`
- `src/lib/storage/internal-file-access.ts`
- `src/lib/archive/berkas-arsip-file-access.ts`

Tests/docs sampled:

- `tests/unit/storage/*`
- `tests/unit/profile/profile-avatar-source.test.ts`
- `tests/unit/dokumen/*`
- `tests/unit/arsiparis/manual-arsip-route.test.ts`
- `docs/migration/phase-15l7a-profile-visual-avatar-upload-foundation.md`
- historical upload planning docs under `docs/migration/_archive/` were used only as traceability, not current authority.

Repository searches used:

- `git grep -n "FormData"`
- `git grep -n "File"`
- `git grep -n "file.type"`
- `git grep -n "file.size"`
- `git grep -n "accept="`
- `git grep -n "multipart"`
- `git grep -n "upload"`
- `git grep -n "lampiran"`
- `git grep -n "MAX"`
- `git grep -n "mime"`
- `git grep -n "content-type"`
- `git grep -n "pending"`
- `git grep -n "storage"`
- `git grep -n "2 MB"`
- `git grep -n "10 MB"`
- `git grep -n "20 MB"`

## Protected Files Confirmation

This audit phase only creates this documentation file:

- `docs/migration/phase-15l7c-upload-policy-audit.md`

Protected files intentionally not changed:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/drizzle/supabase`

No commit was made.
