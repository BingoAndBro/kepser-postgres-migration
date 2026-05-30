# Phase 13P.2 - Open Berkas Visibility And Jenis Pembayaran Eligibility

Date: 2026-05-30

Status: implemented pending targeted test and human review.

## Phase Status

Phase 13P.2 adds bounded UX and server eligibility fixes for folder-first berkas behavior.

This phase does not add lifecycle mutations, change `status_arsip`, implement `INAKTIF`/`USUL_MUSNAH`/`DIMUSNAHKAN` transitions, change preview/download/file-access behavior, implement physical deletion, stop transitional `arsip.arsip` writes, change workflow/manual write behavior beyond classification eligibility and duplicate-folder prevention, add schema or migrations, run backfill, mutate existing DB rows, change package/env/storage files, run migrations, run seeds, run cleanup scripts, or reintroduce Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Domain Rule

Phase 13P.2 records the stricter folder-first rule:

```text
Jenis Pembayaran <-> berkas is 1:1.
```

Rules:

- one `master_klasifikasi_arsip` Jenis Pembayaran maps to at most one runtime berkas;
- an `OPEN` berkas means new workflow/manual documents may still attach to that existing berkas;
- a `CLOSED` berkas means that Jenis Pembayaran is no longer selectable for new classification/addition, regardless of folder `status_arsip`;
- future `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN` closed folders are also not selectable for new classification/addition;
- runtime must not create a second berkas for the same Jenis Pembayaran.

The current schema has a partial uniqueness foundation for one `OPEN` berkas per classification. This phase adds runtime guards for the stricter 1:1 behavior without adding schema/migration changes.

## Dropdown Eligibility

The existing classification API remains the shared source for:

- workflow `Pengklasifikasian Dokumen`;
- manual `Penambahan Dokumen`.

Both dropdowns now request:

```text
GET /api/arsiparis/klasifikasi?eligible_for_berkas=true
```

Server-side filtering hides unavailable Jenis Pembayaran options:

- include if no berkas exists for the classification;
- include if exactly one `OPEN` berkas exists, so the existing berkas can be reused;
- exclude if no `OPEN` berkas exists and any `CLOSED` berkas exists;
- fail safe for anomalous multiple `OPEN` rows by excluding the option.

The default classification list without `eligible_for_berkas=true` is preserved for master-data use.

## Duplicate Guard

`getOrCreateOpenBerkasForKlasifikasi()` now checks all berkas rows for the selected classification before creating a new one.

Behavior:

- exactly one `OPEN` berkas exists: reuse it;
- no berkas exists: create one `OPEN` berkas from server-derived classification snapshots;
- only `CLOSED` berkas exists: reject with `Berkas untuk Jenis Pembayaran ini sudah ditutup`;
- multiple `OPEN` rows exist: reject with safe anomaly copy and do not create another berkas.

The guard applies to direct open-folder API use, workflow classification, and manual document creation because they share the same service helper.

## OPEN Berkas Visibility

The folder-first page:

```text
/arsiparis/berkas
```

now shows two read-only sections:

- `Berkas Terbuka` for `status_berkas='OPEN'` and `status_arsip=null`;
- `Pemberkasan Arsip Aktif` for `status_berkas='CLOSED'` and `status_arsip='AKTIF'`.

The OPEN section shows Jenis Pembayaran, status labels, item counts, source-type counts, total nominal, last updated date, and a detail link. It does not require or present `Nomor SPM` or retention metadata as final metadata for OPEN folders.

## Detail Page

The existing detail page:

```text
/arsiparis/berkas/$id
```

continues to support `OPEN` folders with `status_arsip=null`.

It shows:

- `Status Berkas = Berkas terbuka`;
- `Status Arsip = Belum final`;
- item cards when present;
- no lifecycle mutation actions;
- file actions only through the Phase 13P authorized folder-aware routes when the folder is not `DIMUSNAHKAN`;
- no final metadata requirement that would crash on null `Nomor SPM` or retention fields.

## Not Changed

Phase 13P.2 does not add close-folder UI, lifecycle mutation UI/API, lifecycle transitions, physical deletion, schema/migration/package/env/storage changes, route deletion, de-transitionalization, file-access changes, backfill, seeds, migrations, cleanup, or Supabase runtime changes.

## Manual Smoke Recommendation

Recommended human smoke:

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm `Berkas Terbuka` shows existing OPEN folders, if any.
4. Confirm `Pemberkasan Arsip Aktif` still shows CLOSED + AKTIF folders.
5. Open an OPEN folder detail and confirm status labels show `Berkas terbuka` and `Belum final`.
6. Open `Penambahan Dokumen` and confirm Jenis Pembayaran options exclude classifications that only have CLOSED berkas.
7. Open workflow `Pengklasifikasian Dokumen` and confirm the same dropdown eligibility.
8. Try a stale/direct request using a CLOSED-only classification and confirm it fails with `Berkas untuk Jenis Pembayaran ini sudah ditutup`.
9. Confirm no lifecycle mutation, physical deletion, file-access change, or second berkas creation occurs.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/klasifikasi-create-route.test.ts tests/unit/arsiparis/manual-arsip-route.test.ts tests/unit/arsiparis/workflow-archive-route.test.ts tests/unit/auth/roles-navigation.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
```
