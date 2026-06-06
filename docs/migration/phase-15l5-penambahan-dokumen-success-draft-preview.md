# Phase 15L.5 - Penambahan Dokumen Success, Draft, and Preview Polish

Date: 2026-06-06

## Scope

- Presentation and client-side interaction follow-up for Kepala Sub Bagian Umum `Penambahan Dokumen`.
- Aligns the create flow behavior more closely with the approved `Ajukan Dokumen` baseline.

## Changes

- Successful manual document creation now shows an Ajukan-style success screen instead of only resetting the wizard with a top notice.
- The success screen summarizes the created manual document, category, selected Jenis Pembayaran, and uploaded attachment count.
- The success screen provides actions to open `Pemberkasan Arsip`, return to the Kasubag dashboard, or add another document.
- The wizard now persists temporary form answers in browser `localStorage` while the form is dirty.
- Temporary draft persistence stores form fields, current step, and attachment titles only.
- Temporary draft persistence does not store `File` objects, file contents, logical paths, signed URLs, file tokens, physical paths, storage roots, or secrets.
- Dirty form navigation now uses the same modal confirmation pattern as `Ajukan Dokumen`.
- Confirmed dirty-form exit now suppresses the browser native `beforeunload` prompt to avoid duplicate confirmation after the custom modal.
- Browser/tab close also receives the existing unsaved-change warning.
- Uploaded supporting-document rows now expose a local preview action before final submit.
- Local preview uses an object URL from the selected browser `File` and does not call or change authorized preview/download APIs.
- The duplicate right-panel `Kembali` action was removed; page exit remains available through the header/back and bottom form controls.

## Boundaries

- No archive lifecycle behavior changes.
- No auth/session/RBAC changes.
- No storage/file-access or signed-token behavior changes.
- No schema, migration, package, environment, or route tree changes.
- No Supabase runtime reintroduction.
- No legacy archive/search/report surface restoration.
- File objects must be reselected after reload because browser `localStorage` only persists safe text metadata.

## Verification

- Ran `pnpm exec tsc --noEmit --pretty false`.
- Full TypeScript check still fails on known repo-wide unrelated issues.
- The TypeScript output did not report errors for `src/routes/arsiparis/penambahan-arsip.tsx`.
