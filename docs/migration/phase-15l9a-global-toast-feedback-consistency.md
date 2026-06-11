# Phase 15L.9A - Global Toast Feedback Consistency

Date: 2026-06-11

## Scope

Phase 15L.9A standardizes transient action feedback through the existing local `AppToast` system. This phase does not change business logic, RBAC, file authorization, API contracts, database schema, storage policy, package dependencies, or route generation.

## Toast Design And Behavior

- Toast variants: `success`, `error`, `warning`, and `info`.
- Toast content supports an icon, title, optional description, close button, auto-dismiss duration, and a visible duration/progress bar.
- Default duration is 4.5 seconds unless a caller overrides it or explicitly disables auto-dismiss with `durationMs: null`.
- Visual style is compact and warm-premium: warm off-white surface, soft border, soft shadow, and restrained variant accents.
- Progress bars use variant color accents:
  - success: green
  - error: rose
  - warning: amber
  - info: slate

## Provider Mount

The provider remains mounted once in `src/components/layout/AppLayout.tsx` around the authenticated app shell. This keeps toast state global for the runtime app surfaces without adding dependencies or server behavior.

## Migrated Areas

- Shared document attachment preview/download feedback:
  - `src/components/dokumen/AttachmentViewer.tsx`
  - `src/components/dokumen/AttachmentEditor.tsx`
- Upload success/failure feedback in the attachment editor.
- Pegawai document submit validation summary copy in `src/routes/pegawai/dokumen/aju.tsx`.
- Pegawai saved document edit success/failure in `src/routes/pegawai/dokumen/$id/edit.tsx`.
- PPK approve/reject workflow action success/failure in `src/routes/ppk/dokumen/$id/index.tsx`.
- PPSPM approve/reject workflow action success/failure in `src/routes/bendahara/dokumen/$id.tsx`.
- Folder-first archive lifecycle, close berkas, metadata update, and folder detail preview/download click feedback in `src/routes/arsiparis/berkas/$id.tsx`.
- Profile avatar upload/remove and logout failure feedback in `src/routes/profile.tsx`.
- Admin master-data save/delete feedback and old success-banner removal for:
  - Fungsi
  - Kegiatan
  - Jenis Permintaan
  - Kategori Permintaan
  - Detail Permintaan
  - Jenis Dokumen
  - Kelengkapan Dokumen
  - User management native alert cleanup

## Inline Feedback That Intentionally Remains

- Field-level validation errors remain inline where the user must fix a specific field.
- Modal-level form errors remain inline when they are tied to the open form context.
- Persistent page load failures remain as page/list `ErrorState` displays.
- Empty states remain inline for absent content.
- Non-PDF preview limitation remains the calm inline preview empty state:
  - `Preview hanya tersedia untuk file PDF.`
  - `Silakan unduh file ini untuk membukanya.`

## Preview And Download Handling

Shared preview/download fetch paths now show safe success/error toast copy for explicit user actions. Folder-first detail download links keep their existing href-based file access flow and show a success toast on explicit click only; file authorization and token handling are unchanged.

Failure copy is safe and does not expose storage roots, physical paths, logical storage keys, tokens, cookies, sessions, DB URLs, SQL details, or secrets.

## Accessibility Notes

- Toast viewport uses an aria-live region.
- Error and warning toast records use `role="alert"`; success and info use `role="status"`.
- Close buttons are keyboard accessible and labeled `Tutup notifikasi`.
- Toasts do not trap focus.

## Known Limitations

- Pause-on-hover is not implemented in this foundation phase.
- Existing decision confirmations are not redesigned. The remaining native `confirm()` is an attachment-delete decision prompt, not an action-result notification.
- Folder-first href downloads cannot reliably detect browser-level download failure without changing file access behavior, so success feedback is click-based for those links.

## Manual QA Checklist

1. Ajukan Dokumen success shows a success toast with progress bar and no old temporary success badge.
2. Missing required submit data shows `Data belum lengkap` toast while inline field errors remain.
3. PPK and PPSPM approve/reject actions show success/failure toasts.
4. Admin create/edit/delete actions show toast feedback; delete confirmation dialogs remain.
5. Profile avatar upload/remove uses toast feedback.
6. Preview/download success and failure paths use safe toast copy.
7. Non-PDF preview remains the calm inline empty state, not an error toast.
8. Multiple toasts stack cleanly and do not cover primary form controls.
9. No native `alert()` remains for action-result feedback.
