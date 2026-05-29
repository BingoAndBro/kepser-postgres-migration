# Phase 13M - Close Berkas Finalization Sets AKTIF

Date: 2026-05-29

Status: implemented pending targeted test and human runtime retest.

## Phase Status

Phase 13M updates the bounded close/finalize berkas runtime behavior after the Phase 13L folder-level `status_arsip` schema foundation.

When an assigned `KEPALA_SUB_BAGIAN_UMUM` closes a non-empty `OPEN` berkas with valid final metadata, runtime now sets:

```text
status_berkas = CLOSED
status_arsip = AKTIF
```

This phase assumes the human has already applied:

```text
drizzle/0008_berkas_status_arsip_schema_foundation.sql
```

The local database must contain `arsip.berkas_arsip.status_arsip` before runtime close behavior or targeted close tests are exercised against a real database. This phase does not run migrations.

## Runtime Behavior

The close helper keeps existing validation and metadata behavior:

- berkas must exist;
- berkas must still be `OPEN`;
- berkas must have at least one item;
- close metadata must be valid;
- final metadata fields remain `nomor_spm`, `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, `masa_inaktif_berakhir`, `closed_at`, `closed_by`, and `updated_at`;
- close now additionally sets initial folder lifecycle `status_arsip='AKTIF'`.

The safe berkas DTO includes folder lifecycle status so close API callers can observe `status_arsip='AKTIF'` after a successful close.

## Boundaries

Phase 13M does not:

- add schema or migration files;
- run migrations or seeds;
- backfill existing `CLOSED` berkas rows;
- mutate existing rows outside normal close helper/API behavior;
- implement lifecycle transitions beyond initial `AKTIF`;
- add lifecycle UI/API;
- add folder-first pages;
- change workflow `Pengklasifikasian Dokumen` behavior;
- change `Penambahan Dokumen` manual behavior;
- stop transitional `arsip.arsip` writes;
- change preview/download/file-access behavior;
- implement folder-level `DIMUSNAHKAN` blocking;
- delete physical files;
- touch storage helpers;
- change package or env files;
- change Supabase runtime behavior.

Existing `CLOSED` berkas rows may remain `status_arsip IS NULL` until a later human-approved backfill or remediation phase.

## Security And Domain Boundary

The close API remains server-authoritative:

- `dms_session` is the auth boundary;
- `dms_active_role` is UX-only and not authorization proof;
- assigned `KEPALA_SUB_BAGIAN_UMUM` is required server-side;
- `ADMIN` is not a substitute for `KEPALA_SUB_BAGIAN_UMUM`;
- unsafe `POST` remains protected by the centralized same-origin foundation.

No response should expose env values, DB URLs, SQL params, storage roots, physical paths, logical paths, file tokens, signed token internals, cookies, session values, secrets, raw rows, or password material.

## Next Phase Recommendation

Recommended follow-ups remain separate:

1. Add folder-first archive list/detail read models.
2. Add folder-first archive pages using the read model.
3. Add folder-level lifecycle transitions.
4. Add folder-item preview/download checks that block `DIMUSNAHKAN`.
5. De-transitionalize workflow/manual create behavior so new runtime stops writing `arsip.arsip` only after folder-first replacements are ready.
6. Plan any existing-row backfill/remediation as a separate human-approved phase.

## Runtime Smoke Follow-Up

Phase 13M.1 smoke/report notes are recorded in:

- `docs/migration/phase-13m1-runtime-smoke-close-berkas-finalization.md`
