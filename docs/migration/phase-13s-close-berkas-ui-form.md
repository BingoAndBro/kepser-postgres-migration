# Phase 13S - Close Berkas UI/Form For Open Folder Finalization

Date: 2026-05-30

Status: implemented pending targeted test and human retest.

## Phase Status

Phase 13S adds the missing user-facing close/finalization form on the folder-first berkas detail page:

```text
/arsiparis/berkas/$id
```

The form is shown only for `OPEN` berkas with `status_arsip=null`. It reuses the existing close API:

```text
POST /api/arsiparis/berkas/$id/close
```

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Close Form Metadata

The UI sends the existing close metadata field names:

- `nomor_spm`;
- `retensi_aktif`;
- `retensi_inaktif`;
- optional date-only `closed_at`.

The labels shown to users are:

- `Nomor SPM`;
- `Retensi Aktif`;
- `Retensi Inaktif`;
- `Tanggal Tutup`.

Client-side validation is intentionally minimal. The server remains authoritative through the existing schema and close helper.

## Success Behavior

On successful close, the detail page:

- shows a success message;
- closes the form panel;
- refreshes the detail data;
- displays `status_berkas=CLOSED`;
- displays `status_arsip=AKTIF`;
- displays final metadata including Nomor SPM and retention dates returned by the read model.

The berkas then appears in the `Pemberkasan Arsip Aktif` section of `/arsiparis/berkas`.

## Empty Folder Guard

The UI prevents obvious close attempts when the detail has no documents and shows:

```text
Berkas belum memiliki dokumen. Tambahkan dokumen terlebih dahulu sebelum menutup berkas.
```

The existing close API still rejects empty berkas server-side.

## Jenis Pembayaran 1:1 Effect

Closing a berkas sets it to `CLOSED/AKTIF`. Under the Phase 13P.2 one-to-one rule, that Jenis Pembayaran no longer accepts new workflow/manual document additions after close.

This phase does not change dropdown eligibility logic because the existing server-side rule already excludes classifications whose only berkas is closed.

## CSV Preservation

Phase 13S preserves the Phase 13R CSV behavior:

- `/arsiparis/berkas` still has `Export CSV`;
- `/arsiparis/berkas/$id` still has `Export Daftar Dokumen CSV`;
- CSV output remains read-only and limited to safe user-facing metadata.

No raw IDs, item keys, paths, URLs, file tokens, storage roots, signed-token internals, SQL details, env/session/cookie/secret values, raw attachment metadata, or file content are added to CSV exports.

## Boundaries

Phase 13S does not:

- create a new close API;
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
- run migrations, seeds, cleanup scripts, build, dev server, or broad E2E;
- change package or env files;
- reintroduce Supabase runtime behavior.

`DIMUSNAHKAN` remains status-only, and preview/download blocking for `DIMUSNAHKAN` folders remains unchanged.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm only `Berkas Terbuka` and `Pemberkasan Arsip Aktif` sections are visible.
4. Open an `OPEN` berkas detail with at least one document.
5. Click `Tutup Berkas`.
6. Fill `Nomor SPM`, `Retensi Aktif`, `Retensi Inaktif`, and optionally `Tanggal Tutup`.
7. Submit and confirm the detail refreshes to `Berkas ditutup` and `Aktif`.
8. Confirm final metadata and retention end dates display.
9. Return to `/arsiparis/berkas` and confirm the berkas appears under `Pemberkasan Arsip Aktif`.
10. Confirm the same Jenis Pembayaran is no longer selectable for new document classification/addition.
11. Confirm physical files remain present and preview/download behavior is unchanged for non-`DIMUSNAHKAN` folders.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-csv.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
