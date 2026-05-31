# Phase 14F - Inaktif and Usul Musnah CSV Export

Date: 2026-05-31

Status: implemented with targeted unit test validation.

## Runtime Outcome

`/arsiparis/inaktif` now provides a client-side `Export CSV` action for the currently visible filtered rows on the Daftar Arsip Inaktif page.

`/arsiparis/usul-musnah` now provides a client-side `Export CSV` action for the currently visible filtered rows on the Usul Musnah page.

Both exports reuse the existing folder-first CSV helper and safe folder DTO metadata. The buttons are disabled when loading, when the page has an error, or when the current filtered result has no rows. Empty export state uses the existing `Tidak ada data untuk diekspor.` copy.

## Safety Policy

The CSV output is metadata-only and limited to safe user-facing folder fields such as Jenis Pembayaran, status labels, counts, total nominal display, Nomor SPM, close date, and update date.

The export must not include raw IDs, `item_file_key`, logical paths, physical paths, storage roots, URLs, signed URLs, tokens, signed-token internals, raw rows, SQL details, env values, session/cookie values, secrets, or file content.

## Boundaries

This phase does not:

- restore `Laporan Klasifikasi`;
- restore sidebar/global `Cari Arsip`;
- change header search;
- add routes or API routes;
- use legacy `arsip.arsip` report/export APIs;
- change lifecycle behavior;
- change `Musnahkan Data` behavior;
- change physical deletion behavior;
- change file access behavior;
- change schema, migrations, DB rows, storage code, package files, env files, or Supabase historical artifacts;
- modify `src/routeTree.gen.ts`.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Manual Smoke Checklist

1. Open `/arsiparis/inaktif`.
2. Search by visible Jenis Pembayaran, `Nomor SPM`, close date, count, or nominal text.
3. Click `Export CSV` and confirm only the visible filtered inaktif rows are exported.
4. Open `/arsiparis/usul-musnah`.
5. Search by visible Jenis Pembayaran, `Nomor SPM`, close date, count, or nominal text.
6. Click `Export CSV` and confirm only the visible filtered usul-musnah rows are exported.
7. Confirm the `Musnahkan Data` modal still requires exact phrase `MUSNAHKAN DATA FILE`.
8. Confirm sidebar/global `Cari Arsip` and `Laporan Klasifikasi` remain absent.
