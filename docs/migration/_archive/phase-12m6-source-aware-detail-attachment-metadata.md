# Phase 12M.6 - Source-Aware Detail Attachment Metadata Display

Date: 2026-05-25

Status: implemented pending human review. This phase adds safe source-aware attachment metadata to the unified archive detail service and page. It remains metadata-only and read-only.

Implementation note after Phase 12M.6b: the unified detail page labels were cleaned up to use novice-friendly Indonesian wording, and duplicated actor/date metadata was removed from source-specific sections. API/service behavior, attachment metadata policy, preview/download behavior, lifecycle behavior, schema, migrations, and route generation remain unchanged.

Implementation note after Phase 12M.7: the unified detail page now adds source-aware Preview/Download actions for available WORKFLOW and linked MANUAL attachments through the authorized canonical detail API. Attachment metadata remains path/token-free; `DIMUSNAHKAN` rows remain metadata-only with file actions hidden and stale action URLs blocked server-side.

## Scope And Boundary

Phase 12M.6 extends the canonical detail route/page introduced in Phase 12M.5:

```text
GET /api/arsiparis/arsip/$id
/arsiparis/arsip/$id
```

The active data path remains local PostgreSQL plus Drizzle. `dms_session` remains the auth boundary. `dms_active_role` remains UX-only and is not authorization proof. Server/API RBAC remains authoritative through the existing authorized detail API. `ADMIN` remains a dedicated system/admin role, not an operational archive role.

Active Supabase runtime/package dependency remains retired. Historical Supabase artifacts remain and are not changed by this phase.

## DTO Attachment Summary Shape

The unified detail DTO now includes:

```ts
type UnifiedArchiveAttachmentSummary = {
  sourceType: 'WORKFLOW' | 'MANUAL'
  attachmentId: string | null
  index: number | null
  displayName: string | null
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  uploadedAt: string | null
  availability:
    | 'AVAILABLE'
    | 'UNAVAILABLE_DESTROYED'
    | 'UNAVAILABLE_SOURCE_INCOMPLETE'
}
```

`UnifiedArchiveDetail` now includes:

```ts
attachments: UnifiedArchiveAttachmentSummary[]
```

The DTO must not include logical paths, physical paths, storage roots, file URLs, preview/download URLs, signed URL internals, tokens, checksums, raw metadata JSON, raw attachment rows, SQL details, environment values, session/cookie values, password data, secrets, or file contents.

## WORKFLOW Attachment Metadata Policy

For `sourceType='WORKFLOW'`, attachment metadata is read from the canonical `arsip.arsip.lampiran_snapshot` snapshot only.

The reader parses legacy/variable snapshot shape defensively and maps only safe fields:

- display name or title-like fields;
- MIME/content type when safe;
- size in bytes when safe;
- uploaded/created timestamp when safe;
- one-based snapshot index.

The reader does not expose snapshot URLs, stored paths, storage keys, token-like fields, raw snapshot JSON, or file contents. Workflow snapshot entries do not synthesize stable attachment ids from paths or storage keys; index is used when no safe id exists.

If snapshot metadata is unavailable or not safely parseable, the reader returns an empty attachment list and may add:

```text
ATTACHMENT_METADATA_UNAVAILABLE
```

## MANUAL Attachment Metadata Policy

For `sourceType='MANUAL'`, the reader first uses the linked Manual Archive source row:

```text
manual_arsip.canonical_arsip_id = arsip.arsip.id
```

When the source row exists, it reads `manual_arsip_attachment` rows for that source id and maps safe metadata only:

- attachment id as the existing opaque row id;
- `judul_lampiran` as the preferred display name;
- MIME/content type;
- size in bytes;
- created/uploaded timestamp.

When a friendly title exists, raw original filenames are not exposed in the UI-facing metadata. The reader does not expose `logical_path`, physical paths, storage roots, URLs, tokens, raw row data, raw metadata JSON, or file contents.

If the linked Manual Archive source row is missing, the detail remains safe, returns no attachment rows, and relies on the existing controlled source warnings.

## DIMUSNAHKAN Attachment Availability Policy

For `statusArsip='DIMUSNAHKAN'`, available historical attachment metadata may still be shown. Every returned attachment summary is marked:

```text
UNAVAILABLE_DESTROYED
```

The page shows:

```text
Akses file tidak tersedia karena arsip telah dimusnahkan.
```

This phase does not serve files and does not weaken existing file-access enforcement.

## UI Display Behavior

The unified detail page now includes a `Lampiran Arsip` section.

If no attachment metadata is available, the page shows:

```text
Belum ada metadata lampiran yang tersedia.
```

If attachment metadata exists, the page shows safe metadata only:

- Nama Lampiran
- Jenis
- Ukuran
- Status Ketersediaan
- Sumber
- Diunggah Pada

MIME types are rendered with user-friendly labels where known, such as `PDF` and `Gambar PNG`.

Controlled attachment warnings are mapped to novice-friendly text:

```text
ATTACHMENT_METADATA_UNAVAILABLE -> Metadata lampiran tidak tersedia
ATTACHMENT_SOURCE_INCOMPLETE -> Sumber lampiran belum lengkap
```

## No Preview/Download Guarantee

This phase does not add file actions. The service and page do not return or render file URLs, preview URLs, download URLs, signed URLs, file tokens, path-like values, storage roots, or file contents.

Existing Manual Archive attachment upload/preview/download APIs and workflow file-access APIs are not changed.

## Read-Only And No-Mutation Guarantee

The unified detail reader remains SELECT-only:

1. Select one canonical `arsip.arsip` row.
2. Select safe source metadata based on `source_type`.
3. For `WORKFLOW`, parse the already stored `lampiran_snapshot`.
4. For `MANUAL`, select safe attachment metadata rows by linked Manual Archive source id.

The reader must not call:

```text
insert
update
delete
transaction
```

The phase does not access the filesystem, generate tokens, generate URLs, resolve storage roots, check physical file existence, run reports, backfill rows, or mutate source links.

## What Is Intentionally Not Changed

This phase does not:

- add preview buttons;
- add download buttons;
- add file URLs;
- add signed URLs;
- change existing preview/download endpoints;
- modify Manual Archive attachment upload/preview/download behavior;
- modify workflow archive preview/download behavior;
- implement lifecycle mutation;
- implement destruction mutation;
- implement edit/delete actions;
- implement search;
- implement aggregate/export;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run a live DB report;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical `MANUAL` rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema;
- modify drizzle migration files;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation.

## Validation Commands

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

Do not run broad build/E2E, DB migrations/seeds, route generation, live reports, live backfill, or cleanup for this phase.

## Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for a `WORKFLOW` archive row that has `lampiran_snapshot` metadata.
3. Expected: `Lampiran Arsip` shows safe metadata only.
4. Open unified detail for a linked `MANUAL` archive row with attachment rows.
5. Expected: `Lampiran Arsip` shows safe metadata only.
6. Confirm no file action buttons or links exist.
7. Confirm no file URL, path, storage root, token, raw metadata, or file content appears.
8. If a `DIMUSNAHKAN` row exists, directly open its detail URL.
9. Expected: metadata may show, all attachment availability is unavailable/destroyed, and no file action exists.
10. Login as an `ADMIN`-only account if available.
11. Expected: no operational detail access through the API/page.

## Next Phase Recommendation

Recommended immediate next phase:

```text
Phase 12M.7 - Source-Aware Preview/Download Actions From Detail
```

That phase should only start after server-side file-access enforcement for both WORKFLOW and MANUAL sources is reverified against `DIMUSNAHKAN`, stale tokens, stale paths, role authorization, path traversal, and storage-root leakage. It should remain separate from lifecycle mutation, aggregate/export, cleanup, backfill, migrations, and route generation unless explicitly approved.
