# Phase 13G - Close-Folder Helper/API Foundation

Date: 2026-05-29

Status: implemented as a bounded server-side helper foundation. API route wiring is deferred.

## Phase Status

Phase 13G adds server-only helper logic for the folder/berkas model introduced in Phase 13F.

This phase is helper-only because adding a new TanStack file route would require route tree generation, and this phase explicitly avoids manual `src/routeTree.gen.ts` edits and route generation.

This phase does not add browser UI, folder-first archive pages, data backfill, archive lifecycle mapping, schema changes, migrations, seed changes, package changes, storage writes, physical file changes, cleanup behavior, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Helper Added

The server-only helper lives in:

```text
src/lib/archive/berkas-arsip-service.ts
```

The helper foundation exposes:

- `findOpenBerkasForKlasifikasi`;
- `createOpenBerkasForKlasifikasi`;
- `getOrCreateOpenBerkasForKlasifikasi`;
- `assertBerkasCanAcceptItems`;
- `addWorkflowDocumentToOpenBerkas`;
- `addManualDocumentToOpenBerkas`;
- `closeBerkasArsip`;
- `buildCloseBerkasPlan`.

The service uses dependency injection so targeted unit tests can exercise behavior without a live database.

## Open Folder Behavior

Open folder creation takes a `klasifikasi_id` and actor user id.

The helper derives display snapshots from `arsip.master_klasifikasi_arsip`:

- `klasifikasi_kode_snapshot`;
- `klasifikasi_nama_snapshot`.

Client-supplied classification code/name snapshots are not accepted.

The helper expects the Phase 13F database uniqueness rule: at most one `OPEN` folder per `klasifikasi_id`. If an open-folder create hits a unique conflict, `getOrCreateOpenBerkasForKlasifikasi` re-selects the existing `OPEN` folder and returns it when safe.

## Add-Item Behavior

The helper can add source items only to `OPEN` folders.

Workflow item behavior:

- source type is `WORKFLOW`;
- the source document must exist;
- if the transitional canonical `arsip.arsip` workflow row has a selected `klasifikasi_id`, it must match the target berkas;
- the helper does not change `dokumen_transaksi.status`;
- the helper does not create archive lifecycle transitions.

Manual item behavior:

- source type is `MANUAL`;
- the source `manual_arsip` row must exist;
- the source `manual_arsip.klasifikasi_id` must match the target berkas;
- when `manual_arsip.canonical_arsip_id` exists, the helper stores it as the berkas item bridge;
- the helper does not change manual archive storage or attachment behavior;
- the helper does not create, update, or delete canonical `MANUAL` rows.

Duplicate source assignment is still enforced by the Phase 13F unique indexes on `berkas_arsip_item`.

## Close-Folder Metadata

Close-folder input is validated through `closeBerkasMetadataSchema`:

- `nomor_spm` is required;
- `retensi_aktif` is required;
- `retensi_inaktif` is required;
- `closed_at` is optional date-only input.

When `closed_at` is omitted, the helper uses the server date. Retention end dates are calculated using the existing retention helper pattern:

- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`.

Closing sets:

- `status_berkas = CLOSED`;
- `nomor_spm`;
- `retensi_aktif`;
- `retensi_inaktif`;
- `masa_aktif_berakhir`;
- `masa_inaktif_berakhir`;
- `closed_at`;
- `closed_by`;
- `updated_at`.

The helper rejects:

- missing berkas;
- already `CLOSED` berkas;
- empty berkas;
- invalid close-folder metadata.

## Server-Side CLOSED Enforcement

`assertBerkasCanAcceptItems` reloads the berkas by id and requires `status_berkas='OPEN'`.

Both add-item helpers call this server-side check before inserting a `berkas_arsip_item`. This is the authoritative enforcement foundation; future UI hiding must not be treated as authorization or state enforcement.

## API Route Decision

No API route is added in Phase 13G.

Reason: a new close-folder API route would require TanStack route registration generation, and this phase disallows route generation and manual `src/routeTree.gen.ts` edits.

Recommended follow-up:

- Phase 13H or 13G.1 can wire a minimal close-folder API route.
- The route must require local `dms_session`.
- The route must require assigned `KEPALA_SUB_BAGIAN_UMUM` server-side.
- Unsafe methods must use centralized same-origin validation.
- The response must return a safe DTO only.

## Migration Precondition

Before live runtime/manual DB testing of Phase 13G helper behavior, the human should apply:

```text
drizzle/0007_folder_berkas_data_model_foundation.sql
```

This phase does not run migrations.

## Not Changed

Phase 13G does not:

- implement folder-first active/inactive/usul musnah pages;
- implement browser UI for close-folder;
- backfill existing workflow or manual rows into folders;
- automatically mutate existing archive/manual data outside explicitly called helper functions;
- change the current `Pengklasifikasian Dokumen` UI flow;
- change the current `Penambahan Dokumen` UI flow;
- change canonical archive lifecycle mapping;
- create final canonical archive rows at folder close;
- delete canonical archive rows;
- delete DB rows;
- touch physical files or storage;
- change auth, sessions, RBAC, or `ADMIN` semantics;
- modify package files, `.env`, `.env.migration`, `src/routeTree.gen.ts`, `drizzle/`, or `supabase/`.

## Tests

Targeted unit coverage was added for:

- open folder creation deriving snapshots from master classification;
- concurrent open-folder unique conflict recovery;
- rejecting add-item into `CLOSED` folder;
- preserving manual `canonical_arsip_id` as berkas item bridge;
- rejecting source classification mismatch;
- rejecting empty folder close;
- rejecting already closed folder close;
- retention date calculation for close-folder metadata;
- close-folder behavior without source item or canonical archive mutation.

## Follow-Up Phases

Recommended next phases:

- wire a minimal close-folder API route after route generation is explicitly allowed;
- integrate helper calls into future classification/folder assignment flows;
- implement folder-first active archive filing pages;
- define folder-level archive lifecycle mapping;
- decide whether folder close updates or supersedes current transitional per-item canonical archive rows.
