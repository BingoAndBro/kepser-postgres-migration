# Phase 13V - Legacy Active Archive Route Cleanup

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13V cleans up the legacy active archive browser surface after workflow and manual de-transitionalization.

The primary active archive surface for new runtime is:

```text
/arsiparis/berkas
```

The page label remains `Pemberkasan Arsip Aktif` and the page continues to show the folder-first `Berkas Terbuka` and `Pemberkasan Arsip Aktif` sections.

## Compatibility Behavior

The old browser route remains registered for compatibility:

```text
/arsiparis/aktif
```

It no longer renders the old canonical active archive list based on `arsip.arsip`. It redirects to:

```text
/arsiparis/berkas
```

This keeps old bookmarks from failing while preventing the legacy page from acting as the main active archive list.

## Navigation

Kepala Sub Bagian Umum navigation keeps the user-facing label:

```text
Pemberkasan Arsip Aktif
```

The navigation target is now the folder-first active archive page:

```text
/arsiparis/berkas
```

The Arsiparis dashboard active card also points to `/arsiparis/berkas` and uses folder-first active-folder summary data.

## Legacy Canonical Detail

The legacy unified canonical detail route remains available:

```text
/arsiparis/arsip/$id
```

It is preserved for old historical canonical `arsip.arsip` rows and compatibility links. It is not the primary active archive list authority for new runtime.

Existing old canonical `arsip.arsip` rows remain untouched as history/compatibility data.

## Not Changed

Phase 13V does not:

- delete historical data;
- delete or mutate `arsip.arsip` rows;
- change schema, Drizzle models, or migrations;
- backfill data;
- change workflow or manual write behavior;
- change close berkas behavior;
- change lifecycle transitions;
- change preview/download or folder item file access;
- change `DIMUSNAHKAN` blocking;
- change CSV export behavior on `/arsiparis/berkas`;
- rewrite `/arsiparis/inaktif`;
- rewrite `/arsiparis/usul-musnah`;
- create a `Dimusnahkan` list page;
- delete physical files;
- change package files or env files;
- reintroduce Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Manual Smoke Recommendation

1. Login as an assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm the page title says `Pemberkasan Arsip Aktif`.
4. Confirm the page shows `Berkas Terbuka` and `Pemberkasan Arsip Aktif`.
5. Confirm `Export CSV` remains available when data exists.
6. Open `/arsiparis/aktif` and confirm it lands on `/arsiparis/berkas`.
7. Open a known old canonical detail URL at `/arsiparis/arsip/$id` and confirm it remains available for historical rows.
8. Confirm `/arsiparis/inaktif` and `/arsiparis/usul-musnah` still resolve as before.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/auth/roles-navigation.test.ts tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
