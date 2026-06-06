# Phase 15L.6 - Pengklasifikasian Dokumen Draft and Exit Guard

Date: 2026-06-06

## Scope

- Client-side interaction polish for Kepala Sub Bagian Umum `Pengklasifikasian Dokumen` detail page.
- Aligns unsaved-change behavior with the approved `Ajukan Dokumen` and `Penambahan Dokumen` patterns.

## Changes

- The selected `Jenis Pembayaran` and `Catatan Klasifikasi` are temporarily persisted in browser `localStorage` per document id.
- Temporary persistence stores only safe form text metadata: `klasifikasi_id` and catatan.
- Temporary persistence does not store file contents, logical paths, signed URLs, file tokens, physical paths, storage roots, raw rows, or secrets.
- Navigating away with unsaved classification input now shows the custom `Keluar tanpa menyimpan?` confirmation dialog.
- Browser/tab close still receives the native unsaved-change warning.
- Confirmed dirty-form exit clears the draft and suppresses duplicate native `beforeunload` prompts for that confirmed navigation.
- The right-panel action label `Batal & Kembali` was simplified to `Kembali`.

## Boundaries

- No archive lifecycle behavior changes.
- No auth/session/RBAC changes.
- No storage/file-access or signed-token behavior changes.
- No schema, migration, package, environment, or route tree changes.
- No Supabase runtime reintroduction.
- No legacy archive/search/report surface restoration.

## Verification

- Not run by Codex per human instruction: `pnpm test`, `pnpm build`, and `pnpm dev` are reserved for manual human execution.
