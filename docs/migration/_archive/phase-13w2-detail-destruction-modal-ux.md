# Phase 13W.2 - Detail Destruction Modal UX

Date: 2026-05-30

Status: implemented pending targeted test and human smoke.

## Phase Status

Phase 13W.2 changes the folder detail page `Musnahkan Data` confirmation from an inline panel to a modal dialog.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Detail Page Modal

On `/arsiparis/berkas/$id`, when a folder is `CLOSED/USUL_MUSNAH`, clicking `Musnahkan Data` opens a popup/modal.

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

Successful submit calls the existing folder lifecycle API:

```text
POST /api/arsiparis/berkas/$id/lifecycle
action = approve_destruction
confirmation = MUSNAHKAN DATA FILE
```

After success, the modal closes, confirmation state resets, and the existing Phase 13W.1 detail success behavior remains in place. There is no navigation to a `Dimusnahkan` list.

## Not Changed

Phase 13W.2 does not:

- change lifecycle transition semantics;
- change folder lifecycle API behavior;
- change `mark_inactive` or `propose_destruction` success navigation;
- change the `/arsiparis/usul-musnah` list modal behavior;
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
2. Open a `CLOSED/USUL_MUSNAH` berkas detail at `/arsiparis/berkas/$id`.
3. Click `Musnahkan Data`.
4. Confirm a modal opens instead of an inline form.
5. Confirm the modal shows the selected berkas label.
6. Confirm submit is disabled until the exact phrase `MUSNAHKAN DATA FILE` is entered.
7. Confirm the modal copy says preview/download will be blocked, physical files are not deleted, and metadata remains.
8. Submit and confirm the folder becomes `DIMUSNAHKAN` without navigating to a Dimusnahkan list.
9. Confirm preview/download actions are blocked with `Data file sudah dimusnahkan`.
10. Confirm `Jadikan Inaktif` and `Usulkan Musnah` detail actions still land on `/arsiparis/inaktif` and `/arsiparis/usul-musnah`.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
