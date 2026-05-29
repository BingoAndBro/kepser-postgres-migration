# Phase 13H - Folder/Berkas API Foundation

Date: 2026-05-29

Status: implemented as backend-only API route foundation with route-tree registration verified in Phase 13H.1.

## Phase Status

Phase 13H wires the Phase 13G folder/berkas helper foundation into bounded server-side API routes.

This phase does not add browser UI, folder-first pages, data backfill, automatic item attachment, archive lifecycle mapping, canonical archive creation/update/delete, schema changes, migrations, seed changes, package changes, storage/file behavior, cleanup behavior, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Migration Precondition

The human has already applied:

```text
drizzle/0007_folder_berkas_data_model_foundation.sql
```

This phase assumes the local database already contains:

- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`.

Phase 13H does not rerun migrations.

## API Routes Added

### `POST /api/arsiparis/berkas/open`

Request body:

```json
{
  "klasifikasi_id": "<uuid>"
}
```

Behavior:

- validates unsafe same-origin request before auth or database work;
- requires local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM` server-side;
- calls `getOrCreateOpenBerkasForKlasifikasi`;
- returns `{ "berkas": ... }` with the safe service DTO.

### `POST /api/arsiparis/berkas/$id/items`

Workflow body:

```json
{
  "source_type": "WORKFLOW",
  "dokumen_id": "<uuid>"
}
```

Manual body:

```json
{
  "source_type": "MANUAL",
  "manual_arsip_id": "<uuid>"
}
```

Behavior:

- validates unsafe same-origin request before auth or database work;
- requires local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM` server-side;
- validates the route berkas id as UUID;
- validates source-specific request bodies strictly;
- calls `addWorkflowDocumentToOpenBerkas` or `addManualDocumentToOpenBerkas`;
- relies on the Phase 13G service to reject non-`OPEN` folders and classification mismatches;
- returns `{ "item": ... }` with the safe service DTO.

### `POST /api/arsiparis/berkas/$id/close`

Request body:

```json
{
  "nomor_spm": "SPM-001/2026",
  "retensi_aktif": "1 Tahun",
  "retensi_inaktif": "3 Tahun",
  "closed_at": "2026-05-29"
}
```

`closed_at` is optional. When omitted, the service uses the server date.

Behavior:

- validates unsafe same-origin request before auth or database work;
- requires local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM` server-side;
- validates the route berkas id as UUID;
- validates close metadata through `closeBerkasMetadataSchema`;
- calls `closeBerkasArsip`;
- relies on the Phase 13G service to reject empty folders and already closed folders;
- returns `{ "berkas": ... }` with the safe service DTO.

## Auth/RBAC Boundary

The API routes use the local `dms_session` auth boundary. They check assigned roles from the server session through `hasLocalRole`.

`dms_active_role` is not used as authorization proof.

`ADMIN` is not accepted as a substitute for `KEPALA_SUB_BAGIAN_UMUM`. An `ADMIN`-only user receives `403`.

## Same-Origin Boundary

All Phase 13H routes are unsafe `POST` endpoints and call the centralized same-origin guard before auth, request validation, or service/database work.

This remains the bounded same-origin foundation, not a full CSRF token framework.

## Validation Boundary

Request bodies are validated with Zod:

- `klasifikasi_id` must be UUID;
- `berkas` route id must be UUID;
- item body uses a strict `WORKFLOW` or `MANUAL` discriminated union;
- `WORKFLOW` requires `dokumen_id` and rejects `manual_arsip_id`;
- `MANUAL` requires `manual_arsip_id` and rejects `dokumen_id`;
- close metadata uses `closeBerkasMetadataSchema`.

## Error Mapping

`BerkasArsipServiceError` is mapped to safe HTTP responses:

- `KLASIFIKASI_NOT_FOUND`: `400`;
- `BERKAS_NOT_FOUND`: `404`;
- `BERKAS_CLOSED`: `409`;
- `BERKAS_NOT_OPEN`: `409`;
- `BERKAS_EMPTY`: `409`;
- `SOURCE_NOT_FOUND`: `404`;
- `SOURCE_KLASIFIKASI_MISMATCH`: `400`;
- `INVALID_CLOSE_METADATA`: `400`;
- `CONFLICT`: `409`;
- unknown errors: generic `500`.

Responses do not expose stack traces, SQL, raw rows, env values, storage roots, physical/logical paths, file tokens, cookies, sessions, or secrets.

## Route Tree Status

Route files were added for the three API endpoints.

Phase 13H.1 generated `src/routeTree.gen.ts` through the installed TanStack router generator path and verified that the generated diff is limited to registering:

- `/api/arsiparis/berkas/open`;
- `/api/arsiparis/berkas/$id/items`;
- `/api/arsiparis/berkas/$id/close`.

API route registration is no longer pending. `src/routeTree.gen.ts` was not manually edited.

## Tests

Targeted unit coverage was added for:

- open-folder request schema validation;
- source-specific add-item request validation;
- same-origin rejection before auth/service work;
- unauthenticated requests;
- wrong-role and `ADMIN`-only denial;
- open-folder `klasifikasi_id` validation;
- workflow/manual add-item dispatch;
- `BERKAS_CLOSED` mapping to `409`;
- invalid close metadata;
- empty and already-closed close-folder mappings;
- safe success DTO responses.

## Not Changed

Phase 13H does not:

- add browser UI or folder-first pages;
- change current `Pengklasifikasian Dokumen` UI;
- change current `Penambahan Dokumen` UI;
- backfill or auto-attach existing rows;
- create, update, or delete canonical `arsip.arsip` rows;
- change archive lifecycle mapping;
- delete database rows;
- touch physical files or storage;
- change schema, migrations, seed data, packages, env files, or Supabase fallback behavior.

## Follow-Up Recommendation

Manually verify these endpoints against a local database where migration `0007` has already been applied, then decide how future UI/write flows attach classified workflow/manual documents into open folders and close folders without changing the deferred archive lifecycle mapping prematurely.
