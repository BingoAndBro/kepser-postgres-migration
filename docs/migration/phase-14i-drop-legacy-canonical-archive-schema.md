# Phase 14I - Drop Legacy Canonical Archive Schema

Date: 2026-05-31

Status: implemented pending migration validation on a disposable development database and human smoke.

## Scope

Phase 14I removes the obsolete legacy canonical archive schema from active Drizzle/runtime code after Phase 14H runtime cleanup and Phase 14I.0 storage guard replacement.

This is an active-development cleanup. Old canonical archive data is not preserved as a goal.

## Removed Active Schema Objects

Removed from active Drizzle schema:

- `arsip.arsip`;
- `arsip.arsip_usul_musnah`;
- `arsip.arsip.lampiran_snapshot`;
- `arsip.manual_arsip.canonical_arsip_id`;
- `arsip.berkas_arsip_item.canonical_arsip_id`;
- related active Drizzle exports, indexes, foreign keys, and bridge DTO fields.

Kept active:

- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`;
- `arsip.master_klasifikasi_arsip`;
- `arsip.manual_arsip`;
- `arsip.manual_arsip_attachment`;
- `arsip.manual_arsip_category`;
- `dokumen.dokumen_transaksi` as the `WORKFLOW` source.

## Migration Result

Added a scoped manual Drizzle migration:

- `drizzle/0009_drop_legacy_canonical_archive_schema.sql`

The migration drops bridge constraints/indexes/columns first, then drops `arsip.arsip_usul_musnah`, then drops `arsip.arsip`.

`pnpm db:generate` could not safely produce the drop migration non-interactively because Drizzle prompted for a table conflict. The repository already uses manual migration entries after `0000`, so Phase 14I uses a manual SQL migration file and does not apply it to any live database.

## Runtime Cleanup

Folder-first runtime DTO/query/service code no longer carries or returns `canonical_arsip_id`.

Manual Archive create/edit remains source-only:

- creates and updates `manual_arsip`;
- keeps attachment metadata in `manual_arsip_attachment`;
- opens/reuses matching `OPEN` `berkas_arsip`;
- inserts `MANUAL` `berkas_arsip_item`;
- does not create or sync legacy canonical archive rows.

Workflow classification remains folder-first:

- attaches `COMPLETED` workflow documents to an `OPEN` `berkas_arsip`;
- inserts `WORKFLOW` `berkas_arsip_item`;
- does not create `arsip.arsip` rows.

## Protected Folder-First Surfaces

Unchanged:

- `/arsiparis/berkas`;
- `/arsiparis/berkas/$id`;
- `/arsiparis/inaktif`;
- `/arsiparis/usul-musnah`;
- `/api/arsiparis/berkas/**`;
- folder lifecycle `OPEN/CLOSED` and `AKTIF/INAKTIF/USUL_MUSNAH/DIMUSNAHKAN`;
- `Musnahkan Data` folder-first physical file deletion behavior;
- destroyed-file UX copy `Data file sudah dimusnahkan`;
- manual attachment upload/preview/download behavior;
- folder-first CSV exports and local filters.

## Boundaries

This phase does not:

- run a destructive DB reset;
- apply the migration to a live database;
- delete physical files;
- change storage behavior;
- change file-access behavior;
- change lifecycle semantics;
- reintroduce `/arsiparis/aktif`, `/arsiparis/search`, `/arsiparis/arsip/$id`, legacy canonical APIs, global `Cari Arsip`, or `Laporan Klasifikasi`;
- modify package/env files;
- modify `supabase/`;
- claim Supabase is fully removed from the repository.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts and historical docs/migrations may still mention old canonical archive objects.

## Next Phase

Phase 14J should validate the cleaned migration chain against a disposable development database:

1. recreate or reset a disposable dev database;
2. apply migrations from scratch;
3. inspect table/column names only, with no data dumps or secrets;
4. verify active archive authority is folder-first;
5. run the targeted archive/manual/storage regression set again.

## Manual Smoke Checklist

1. Open `/arsiparis/berkas` and confirm `Berkas Terbuka` plus active closed berkas render.
2. Open `/arsiparis/berkas/$id` and confirm item list, local filter, preview/download actions, and detail CSV export render.
3. Open `/arsiparis/inaktif` and confirm local filter, CSV export, and `Usulkan Musnah` action render.
4. Open `/arsiparis/usul-musnah` and confirm local filter, CSV export, and `Musnahkan Data` modal render.
5. Create a manual document and confirm it appears through folder-first berkas membership.
6. Classify a completed workflow document and confirm it appears through folder-first berkas membership.
7. For a destroyed folder item, verify preview/download displays `Data file sudah dimusnahkan`.
8. Confirm removed legacy canonical routes/APIs remain unregistered.
