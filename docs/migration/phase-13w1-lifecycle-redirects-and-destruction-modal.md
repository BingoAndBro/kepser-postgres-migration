# Phase 13W.1 - Lifecycle Redirects And Destruction Modal UX

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13W.1 polishes folder-first lifecycle UX after Phase 13W without changing lifecycle semantics, storage behavior, schema, or write models.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Success Navigation

Successful `Tutup Berkas` from folder detail now lands on:

```text
/arsiparis/berkas
```

The list-level `Tutup Berkas` shortcut already runs on `/arsiparis/berkas`; after success it closes the modal, resets the form, refreshes the list, and the row can appear under `Pemberkasan Arsip Aktif`.

Successful folder lifecycle action:

```text
action = mark_inactive
```

from folder detail now lands on:

```text
/arsiparis/inaktif
```

Successful folder lifecycle action:

```text
action = propose_destruction
```

from folder detail or `/arsiparis/inaktif` now lands on:

```text
/arsiparis/usul-musnah
```

## Usul Musnah Destruction Modal

`/arsiparis/usul-musnah` keeps each row's `Musnahkan Data` action, but the destructive confirmation is now a modal dialog instead of an inline panel.

The modal includes:

- title `Musnahkan Data`;
- selected berkas or Jenis Pembayaran label;
- copy that status becomes `Dimusnahkan`;
- copy that preview/download will be blocked;
- copy that physical files are not deleted in this phase;
- copy that metadata remains stored;
- exact typed confirmation.

The required phrase remains:

```text
MUSNAHKAN DATA FILE
```

The submit button remains disabled until the phrase matches exactly.

After successful `approve_destruction`, the modal closes, confirmation state resets, the list refreshes, and the row leaves `Usul Musnah`. There is no navigation to a `Dimusnahkan` list.

## Not Changed

Phase 13W.1 does not:

- change lifecycle transition semantics;
- change folder lifecycle API behavior;
- add physical deletion;
- delete physical files;
- create a `Dimusnahkan` list page or section;
- change schema, Drizzle models, or migrations;
- change workflow/manual write behavior;
- change folder item file access;
- change `DIMUSNAHKAN` blocking;
- change CSV export behavior;
- change preview/download filename handling;
- change package files or env files;
- reintroduce Supabase runtime behavior.

## Manual Smoke Checklist

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open an `OPEN/null` berkas detail at `/arsiparis/berkas/$id`.
3. Use `Tutup Berkas`, confirm success lands on `/arsiparis/berkas`.
4. Confirm the closed berkas appears under `Pemberkasan Arsip Aktif`.
5. Open a `CLOSED/AKTIF` berkas detail and use `Jadikan Inaktif`.
6. Confirm success lands on `/arsiparis/inaktif`.
7. From detail or `/arsiparis/inaktif`, use `Usulkan Musnah`.
8. Confirm success lands on `/arsiparis/usul-musnah`.
9. On `/arsiparis/usul-musnah`, click `Musnahkan Data` and confirm a modal opens.
10. Confirm submit is disabled until the exact phrase `MUSNAHKAN DATA FILE` is entered.
11. Submit and confirm the modal closes, the list refreshes, and the row leaves `Usul Musnah`.
12. Confirm there is no general `Dimusnahkan` list page and physical files are not deleted.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/auth/roles-navigation.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
