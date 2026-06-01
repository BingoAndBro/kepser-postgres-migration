# Phase 13S.1 - Close Berkas Modal And Open List Shortcut

Date: 2026-05-30

Status: implemented pending targeted test and human retest.

## Phase Status

Phase 13S.1 refactors the `Tutup Berkas` metadata form into a modal/popup and adds a shortcut on the `Berkas Terbuka` list.

The UI still reuses the existing close API:

```text
POST /api/arsiparis/berkas/$id/close
```

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Modal Close Form

The shared modal title is:

```text
Tutup Berkas
```

The modal sends the existing close body fields only:

- `nomor_spm`;
- `retensi_aktif`;
- `retensi_inaktif`;
- optional `closed_at`.

The user-facing fields remain:

- `Nomor SPM`;
- `Retensi Aktif`;
- `Retensi Inaktif`;
- `Tanggal Tutup`.

The modal explains that the berkas will become Arsip Aktif, the Jenis Pembayaran can no longer receive new documents after close, documents and physical files are not deleted, and status becomes `Ditutup/Aktif`.

## List-Level Shortcut

`/arsiparis/berkas` keeps the page placement from Phase 13Q.2 and Phase 13R:

- `Berkas Terbuka`;
- `Pemberkasan Arsip Aktif`.

Rows in `Berkas Terbuka` may show a `Tutup Berkas` shortcut. The shortcut opens the same metadata modal for the selected open berkas.

Rows in `Pemberkasan Arsip Aktif` do not render a close shortcut.

## Success Behavior

After a successful close from detail or list:

- the modal closes;
- the form resets;
- the page data refreshes;
- the berkas moves from `Berkas Terbuka` to `Pemberkasan Arsip Aktif` on the list;
- detail view refreshes to show final metadata and `CLOSED/AKTIF`.

## Empty Folder Guard

The UI keeps the empty-folder guard:

```text
Berkas belum memiliki dokumen. Tambahkan dokumen terlebih dahulu sebelum menutup berkas.
```

The server remains authoritative and still rejects empty berkas.

## CSV Preservation

Phase 13S.1 preserves the Phase 13R CSV behavior:

- `/arsiparis/berkas` keeps `Export CSV`;
- `/arsiparis/berkas/$id` keeps `Export Daftar Dokumen CSV`;
- CSV remains client-side/read-only from safe DTOs.

No raw IDs, item keys, paths, URLs, file tokens, storage roots, signed-token internals, SQL details, env/session/cookie/secret values, raw attachment metadata, or file content are added to CSV.

## Boundaries

Phase 13S.1 does not:

- create a new close API;
- change close API schema;
- change close helper semantics;
- change lifecycle transition semantics;
- delete physical files;
- implement physical destruction;
- mutate rows except when a human uses the existing close API at runtime;
- stop transitional `arsip.arsip` writes;
- de-transitionalize the old archive model;
- change file authorization rules;
- change storage helper behavior;
- add schema or migrations;
- backfill data;
- change package or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm only `Berkas Terbuka` and `Pemberkasan Arsip Aktif` sections are visible.
4. Click `Tutup Berkas` on a non-empty `Berkas Terbuka` row.
5. Fill close metadata in the modal and submit.
6. Confirm the modal closes and the list refreshes so the row moves to `Pemberkasan Arsip Aktif`.
7. Open an `OPEN/null` detail page and confirm the detail `Tutup Berkas` button opens the same modal.
8. Confirm empty berkas cannot be closed from UI and server rejection remains safe.
9. Confirm CSV export, preview/download behavior, lifecycle buttons, and destruction confirmation copy are unchanged.
