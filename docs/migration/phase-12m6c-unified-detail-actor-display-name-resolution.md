# Phase 12M.6c - Unified Detail Actor Display Name Resolution

Date: 2026-05-25

Status: implemented pending human review. This phase resolves canonical archive actor ids into human-readable display names for the unified archive detail page.

## Scope And Boundary

Phase 12M.6c extends the read-only unified archive detail DTO and page:

```text
GET /api/arsiparis/arsip/$id
/arsiparis/arsip/$id
```

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative through the existing authorized detail API.

## Actor Resolution Policy

The unified detail service now resolves canonical archive actor ids:

- `arsip.created_by`
- `arsip.archived_by`

The DTO includes safe display fields:

```ts
createdByName: string | null
archivedByName: string | null
```

Display name resolution uses local `auth.users` fields in this order:

```text
display_name -> nama_lengkap -> email
```

Email is used only as a final fallback because existing application surfaces already use email as a user-display fallback when no better profile name exists.

## UI Behavior

The unified detail page renders:

```text
Dibuat oleh -> createdByName
Diarsipkan oleh -> archivedByName
```

UI fallback behavior:

- `Pengguna tidak ditemukan` when the canonical actor id exists but the user display cannot be resolved.
- `Tidak tersedia` when the canonical actor id is null or empty.

The UI must not show raw actor UUIDs by default for these fields.

## Deduplication Boundary

Source-specific sections remain deduplicated:

- `Metadata Dokumen Persetujuan` does not re-add source `createdBy`.
- `Metadata Arsip Manual` does not re-add source `createdBy` or `archivedBy`.

Canonical actor display belongs in `Metadata Arsip`.

## Read-Only Guarantee

The service remains SELECT-only:

1. Select one canonical `arsip.arsip` row.
2. Select safe actor display fields from `auth.users` for canonical actor ids.
3. Select existing source and attachment metadata as before.

The phase does not call insert, update, delete, transaction, filesystem access, token generation, URL generation, storage-root resolution, migrations, reports, backfill, cleanup, or source-link mutation.

## What Is Intentionally Not Changed

This phase does not:

- add preview/download actions;
- add file URLs or signed URLs;
- change attachment metadata behavior;
- change existing preview/download endpoints;
- implement lifecycle mutation;
- implement destruction mutation;
- implement edit/delete actions;
- implement search, export, cleanup, or backfill;
- create migrations;
- modify schema;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation.

The API/page must not expose logical paths, physical paths, storage roots, file tokens, signed token internals, raw attachment metadata, raw DB rows, SQL details, environment values, or secrets.

## Validation

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

Do not run broad build/E2E, DB migrations/seeds, route generation, live DB reports, or cleanup for this phase.

## Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/arsip/$id` for a `WORKFLOW` archive.
3. Confirm `Dibuat oleh` and `Diarsipkan oleh` show user names, not UUIDs.
4. Open `/arsiparis/arsip/$id` for a `MANUAL` archive.
5. Confirm canonical actor fields show user names or safe fallbacks.
6. Confirm source-specific sections do not reintroduce actor fields.
7. Confirm `Lampiran Arsip` behavior is unchanged.
8. Confirm no preview/download/lifecycle/edit/delete actions appear.
9. Confirm no path, token, storage root, SQL, environment value, secret, or raw attachment metadata appears.

## Next Phase Recommendation

Recommended next phase:

```text
Phase 12M.7 - Source-Aware Preview/Download Actions From Detail
```

That phase should remain separate and should only start after server-side file-access enforcement is reverified for `WORKFLOW` and `MANUAL` sources, including `DIMUSNAHKAN` blocking and stale token/path handling.
