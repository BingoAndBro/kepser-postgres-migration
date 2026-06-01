# Phase 13Q.2 - Lifecycle UX Placement, Confirmation, And Filename Preservation

Date: 2026-05-30

Status: implemented pending targeted test and human retest.

## Scope

Phase 13Q.2 applies bounded corrections after Phase 13Q manual smoke feedback for folder-first archive lifecycle UX and folder item file access.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Page Placement Correction

The folder-first active archive page keeps the client-requested title/navigation name:

```text
Pemberkasan Arsip Aktif
```

`/arsiparis/berkas` now shows only:

- `Berkas Terbuka`;
- `Pemberkasan Arsip Aktif`.

`Arsip Inaktif`, `Usul Musnah`, and `Dimusnahkan` are not rendered as sections on this page.

Existing `Daftar Arsip Inaktif` and `Usul Musnah` pages remain the appropriate future integration surfaces if folder-first lifecycle visibility is expanded there. This phase does not broadly rewrite those older pages. `Dimusnahkan` does not need a general list section; metadata remains available through existing authorized source/detail contexts where applicable.

## Strict Destruction Confirmation

`Musnahkan Data` now follows the stricter typed-confirmation pattern.

The required phrase is:

```text
MUSNAHKAN DATA FILE
```

The confirmation copy states that:

- status will become `Dimusnahkan`;
- preview/download file access will be blocked;
- physical files are not deleted in this phase;
- metadata remains.

The folder lifecycle API also requires the same confirmation phrase for `approve_destruction`. Non-destructive lifecycle actions keep simple confirmation.

## Lifecycle Button Style

Folder-first lifecycle buttons were aligned closer to the older archive lifecycle action style:

- icon plus text action button;
- primary action styling for non-destructive transitions;
- visually distinct error/destructive styling for `Musnahkan Data`;
- typed confirmation panel for the terminal status-destruction action.

No broad design-system changes were made.

## Filename Preservation

Folder item file access preserves filename semantics:

- `WORKFLOW` item download/preview `Content-Disposition` prefers original filename metadata from `dokumen_transaksi.lampiran_urls` when available;
- recognized safe metadata keys are prioritized before display labels;
- unsafe filename metadata is rejected for header use;
- if no safe original filename exists, the helper falls back to a safe attachment label plus extension from the logical path;
- logical paths, storage roots, physical paths, tokens, and signed-token internals are not exposed;
- `MANUAL` item file access continues delegating to the existing manual archive attachment responder so existing manual filename policy remains unchanged.

Header filename sanitization still rejects slash/backslash, CR/LF, quotes, absolute paths, traversal-like names, and URL-like names.

## File Blocking Copy

Folder item preview/download blocking for `DIMUSNAHKAN` folders now uses file-specific copy:

```text
Data file sudah dimusnahkan
```

`DIMUSNAHKAN` remains status-only.

## Non-Goals

Phase 13Q.2 does not:

- change lifecycle transition semantics;
- remove lifecycle APIs;
- add lifecycle states;
- delete physical files;
- implement physical destruction;
- mutate existing data rows;
- stop transitional `arsip.arsip` writes;
- de-transitionalize old archive pages or routes;
- add schema, migration, backfill, seed, package, env, storage, or Supabase runtime changes.

## Manual Smoke Recommendation

1. Login as assigned `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/berkas`.
3. Confirm only `Berkas Terbuka` and `Pemberkasan Arsip Aktif` sections are visible.
4. Open a folder detail in `USUL_MUSNAH`.
5. Click `Musnahkan Data` and confirm the typed phrase is required before submit.
6. Confirm the copy says physical files are not deleted and metadata remains.
7. After status becomes `DIMUSNAHKAN`, confirm preview/download actions are blocked with `Data file sudah dimusnahkan`.
8. Confirm `WORKFLOW` downloads preserve original filename metadata where present.
9. Confirm `MANUAL` downloads retain the existing manual archive filename policy.

## Validation

Targeted validation for this phase:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/arsiparis/berkas-arsip-file-access.test.ts
pnpm test tests/unit/arsiparis/berkas-arsip-api.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase
git diff -- src/db src/lib/storage
git diff -- src/routeTree.gen.ts
```
