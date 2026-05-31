# Phase 14C - Local Archive Page Search Filters

Date: 2026-05-31

Status: implemented with targeted unit test validation.

## Decision

The global `Cari Arsip` / `Pencarian Arsip` surface remains removed. Phase 14C does not replace it with a new global archive search page or API.

Archive lookup is local to the page/table the user is viewing:

- `/arsiparis/berkas`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`
- `/arsiparis/berkas/$id`

The top header search is unchanged and is not archive authority.

## Runtime Outcome

`/arsiparis/berkas` now has a client-side local search field with copy `Cari berkas di halaman ini...`. The filter applies to both sections on the page:

- `Berkas Terbuka`
- `Pemberkasan Arsip Aktif`

The filter uses visible safe folder metadata such as classification code/name, `Nomor SPM`, folder/archive status labels, document counts, nominal display, and visible dates.

`/arsiparis/inaktif` now has a client-side local search field with copy `Cari berkas inaktif di halaman ini...`. The filter uses visible safe folder metadata such as classification code/name, `Nomor SPM`, close date, counts, and nominal display.

`/arsiparis/usul-musnah` now has a client-side local search field with copy `Cari berkas usul musnah di halaman ini...`. The filter uses visible safe folder metadata such as classification code/name, `Nomor SPM`, close date, counts, and nominal display.

`/arsiparis/berkas/$id` now has a client-side local item search field with copy `Cari dokumen dalam berkas...`. The filter uses visible safe item metadata such as source title/type, workflow/manual provenance labels, creator display name, nominal display, attachment count, and safe attachment labels/titles/filenames already present in the DTO.

Filtered CSV export on the folder list and detail item pages follows the rows/items currently visible after local filtering.

## Boundaries

This phase does not:

- reintroduce sidebar/global `Cari Arsip`;
- change header search;
- add routes;
- add or call a global archive search API;
- call `GET /api/arsiparis/search` from active UI;
- change `/arsiparis/search` compatibility redirect;
- change lifecycle behavior;
- change physical deletion behavior;
- change file access behavior;
- change report/export APIs;
- change schema, migrations, package files, env files, storage code, or Supabase historical artifacts;
- mutate database rows;
- delete physical files;
- modify `src/routeTree.gen.ts`.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Safety Notes

Local filter text builders use existing safe DTO/display fields only.

They must not search or expose raw IDs, bridge IDs, logical paths, URLs, storage roots, signed-token internals, file tokens, SQL details, env/session/cookie values, raw rows, or secrets. Folder detail file-action URLs still use existing server-authorized endpoints and are not part of the local search text.

## Manual Smoke Checklist

1. Open `/arsiparis/berkas`.
2. Confirm `Berkas Terbuka` and `Pemberkasan Arsip Aktif` remain visible.
3. Search by visible Jenis Pembayaran text, `Nomor SPM`, status label, or document count and confirm both sections filter locally.
4. Open `/arsiparis/inaktif`.
5. Search by visible Jenis Pembayaran text, `Nomor SPM`, close date, or document count and confirm only the current page table filters.
6. Open `/arsiparis/usul-musnah`.
7. Search by visible Jenis Pembayaran text, `Nomor SPM`, close date, or document count and confirm the `Musnahkan Data` modal and exact confirmation phrase remain unchanged.
8. Open `/arsiparis/berkas/$id`.
9. Search by document title, source type, workflow/manual provenance, creator display name, nominal text, or attachment label and confirm only the item list in that berkas filters.
10. Confirm `/arsiparis/search` still redirects to `/arsiparis/berkas`.
11. Confirm sidebar navigation still has no `Cari Arsip` / `Pencarian Arsip` item.
