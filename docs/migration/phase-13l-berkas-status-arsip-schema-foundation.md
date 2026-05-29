# Phase 13L - Berkas `status_arsip` Schema Foundation

Date: 2026-05-29

Status: schema/data-model foundation only.

## Phase Status

Phase 13L adds a bounded folder-level archive lifecycle schema foundation to `arsip.berkas_arsip`.

This phase is additive only. It does not change runtime close-folder behavior, workflow `Pengklasifikasian Dokumen`, `Penambahan Dokumen`, transitional `arsip.arsip` writes, lifecycle API/UI, folder-first pages, file access, storage behavior, route generation, package files, env files, seeds, backfill, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Schema Changes

`arsip.berkas_arsip` now has:

- nullable `status_arsip text`;
- a check constraint allowing only `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN` when `status_arsip` is not null;
- a transitional-safe check constraint requiring `status_arsip IS NULL` while `status_berkas='OPEN'`.

No index is added in this foundation phase because no folder-level lifecycle read path is implemented yet.

## Status Semantics

Target folder model:

```text
status_berkas = OPEN | CLOSED
status_arsip = null while OPEN
status_arsip = AKTIF when CLOSED/finalized in a later runtime phase
```

Folder-level lifecycle remains:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

`DIMUSNAHKAN` folder-level file-access blocking is not implemented in this phase. Future file-access phases must block preview/download for every item in a `DIMUSNAHKAN` folder, including stale token/path attempts.

## Transitional Constraint Choice

Phase 13L intentionally does not require `CLOSED -> status_arsip NOT NULL`.

Reason: existing Phase 13G/13H close-folder helper/API behavior closes folders without setting folder-level `status_arsip`. Requiring non-null `status_arsip` for `CLOSED` now would break current runtime before Phase 13M updates close behavior.

Current transitional rule:

- `OPEN` requires `status_arsip IS NULL`;
- `CLOSED` may temporarily keep `status_arsip IS NULL`;
- later close/finalization behavior should set `status_arsip='AKTIF'`.

## Constants And Validation

The folder lifecycle schema reuses the existing archive lifecycle values:

```text
AKTIF
INAKTIF
USUL_MUSNAH
DIMUSNAHKAN
```

The Zod foundation exposes nullable folder lifecycle validation for future API/read DTO work. It is not wired to route mutations in this phase.

## Non-Goals

Phase 13L does not:

- backfill existing `berkas_arsip` rows;
- update existing data;
- run migrations against a database;
- change close-folder helper/API behavior;
- set `status_arsip='AKTIF'` during close;
- add lifecycle API/UI;
- add folder-first pages;
- stop workflow/manual runtime from writing transitional `arsip.arsip` rows;
- change preview/download/file-access behavior;
- implement `DIMUSNAHKAN` blocking for folder items;
- delete physical files;
- change storage helpers or physical storage;
- modify `src/routeTree.gen.ts`;
- modify package or env files;
- modify historical Supabase artifacts.

## Next Phase

Phase 13M should update close/finalize berkas behavior so assigned `KEPALA_SUB_BAGIAN_UMUM` close-folder runtime sets:

```text
status_berkas = CLOSED
status_arsip = AKTIF
```

That phase should remain separate from lifecycle mutation, folder-first list/detail pages, de-transitionalized `arsip.arsip` write removal, file access changes, and physical destruction.
