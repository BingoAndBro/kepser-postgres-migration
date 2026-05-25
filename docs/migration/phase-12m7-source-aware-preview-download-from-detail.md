# Phase 12M.7 - Source-Aware Preview/Download Actions From Detail

Date: 2026-05-25

Status: implemented pending human review. This phase adds narrow source-aware preview/download actions from unified archive detail while keeping lifecycle, export, cleanup, backfill, schema, migrations, and storage cleanup out of scope.

Implementation note after Phase 12M.7b: unified detail Preview now opens in a local modal using the authorized unified preview endpoint instead of navigating away, attachment cards use the compact document-attachment row pattern, and WORKFLOW `Content-Disposition` filenames align with document transaction naming where metadata is available. Server-side authorization, source checks, `DIMUSNAHKAN` blocking, no path/token leak guarantees, and no file duplication remain unchanged.

Review note after Phase 12M.8: source inspection and the human-smoke checklist are documented in `docs/migration/phase-12m8-unified-detail-file-access-smoke-review.md`. Phase 12M.8 is review/documentation only and does not add runtime behavior.

## 1. Scope And Boundary

Phase 12M.7 extends the existing canonical detail page and API:

```text
GET /api/arsiparis/arsip/$id
/arsiparis/arsip/$id
```

The detail API remains the metadata boundary by default. File access is activated only when both safe query parameters are present:

```text
?action=preview&attachmentRef=...
?action=download&attachmentRef=...
```

No new TanStack route files were added. `src/routeTree.gen.ts` is not changed.

## 2. Existing File Access Inventory

WORKFLOW document attachment routes already existed:

```text
GET /api/dokumen/$id/preview/$lampiranIndex
GET /api/dokumen/$id/download/$lampiranIndex
```

Those routes require local `dms_session`, authorize from server-side roles, resolve current document/archive state, block `DIMUSNAHKAN` with `410`, and revalidate stale document tokens through `/api/files/access`. They issue internal signed file-access URLs in JSON, so Phase 12M.7 does not expose or reuse those URLs from the unified detail page.

Manual Archive attachment routes already existed:

```text
GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview
GET /api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download
```

Those routes require local `dms_session`, require assigned `KEPALA_SUB_BAGIAN_UMUM`, reject non-Kasubag and `ADMIN`-only access, validate UUID params, re-check Manual Archive parent status, block `DIMUSNAHKAN` with `410`, resolve logical paths server-side, prevent root escape, stream files with safe headers, and return safe 404/500 errors without path disclosure.

## 3. Source-Aware Action Design

Unified detail action links use canonical archive id plus a safe source-aware attachment reference:

```text
WORKFLOW: attachmentRef=workflow-<one-based snapshot index>
MANUAL:   attachmentRef=manual-<manual attachment UUID>
```

The UI does not include logical paths, physical paths, storage roots, file URLs, signed URLs, tokens, raw snapshot JSON, or raw attachment rows.

## 4. WORKFLOW Preview/Download Behavior

WORKFLOW file access is resolved by the new unified file-action helper:

- load canonical `arsip.arsip` by id;
- require `source_type='WORKFLOW'`;
- require canonical `status_arsip !== 'DIMUSNAHKAN'`;
- require linked workflow document row with final archive-readable status;
- resolve the one-based attachment index against canonical `lampiran_snapshot`;
- require a safe logical path in the snapshot entry server-side;
- resolve the physical file inside the configured local storage root;
- stream file bytes directly with `inline` for preview and `attachment` for download.

The route does not issue or return signed URLs.

## 5. MANUAL Preview/Download Behavior

MANUAL file access uses the canonical wrapper first:

- load canonical `arsip.arsip` by id;
- require `source_type='MANUAL'`;
- require canonical `status_arsip !== 'DIMUSNAHKAN'`;
- load the linked `manual_arsip` source by `canonical_arsip_id`;
- require the attachment id to belong to that linked Manual Archive source;
- reject stale destroyed source rows with `410`;
- delegate to the existing Manual Archive file responder for final file streaming.

This preserves the existing Manual Archive content-type, filename, path safety, and missing-file behavior.

## 6. DIMUSNAHKAN Blocking Behavior

For `DIMUSNAHKAN` detail rows:

- metadata may still display;
- attachment action buttons are hidden;
- the destroyed note remains visible;
- stale unified action URLs fail server-side with `410`;
- existing manual source `DIMUSNAHKAN` checks also remain in force.

## 7. Authorization Behavior

Unified file actions:

- require local `dms_session`;
- return `401` when unauthenticated;
- require assigned `KEPALA_SUB_BAGIAN_UMUM`;
- return `403` for non-Kasubag users, including `ADMIN`-only users;
- do not authorize from `dms_active_role`;
- validate canonical archive id and attachment refs before file resolution.

## 8. No Path/Token/Storage Leak Guarantee

The API and UI must not expose:

- logical storage paths;
- physical filesystem paths;
- storage roots;
- file URLs;
- signed URLs;
- token values or token internals;
- raw attachment metadata;
- raw database rows;
- SQL details or params;
- environment values, cookies, sessions, or secrets.

Safe errors use generic messages such as `Lampiran arsip tidak ditemukan`, `File arsip tidak ditemukan`, or `File arsip tidak tersedia karena arsip telah dimusnahkan`.

## 9. UI Behavior

On `/arsiparis/arsip/$id`, each attachment card now shows `Preview` and `Download` only when:

- attachment availability is `AVAILABLE`;
- a source-aware attachment ref can be built safely.

Unavailable attachments show safe text:

```text
Tidak tersedia - dimusnahkan
Tidak tersedia - sumber belum lengkap
```

Preview/download links point to the authorized unified API endpoint. The browser does not fetch file contents through client JavaScript, and no signed URL is rendered.

## 10. What Is Intentionally Not Changed

This phase does not:

- add lifecycle mutation;
- add destruction mutation;
- add edit/delete actions;
- implement search;
- implement aggregate/export;
- cleanup seed data or storage files;
- delete rows, tables, test data, or files;
- run live DB reports;
- run live backfill;
- call 12L.18 mutation helper;
- call 12L.19 dry-run helper;
- create canonical Manual Archive rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema;
- modify drizzle migration files;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- add public/static file serving;
- add Supabase fallback or old file recovery.

## 11. Validation

Focused validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-action-route.test.ts
```

Protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- db
git diff -- drizzle
git diff -- supabase
git diff -- src/routeTree.gen.ts
```

## 12. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open `/arsiparis/arsip/$id` for a WORKFLOW archive with attachment metadata.
3. If file exists and archive is not `DIMUSNAHKAN`, `Preview` and `Download` should appear and work through the authorized unified server route.
4. Open `/arsiparis/arsip/$id` for a linked MANUAL archive with attachment metadata.
5. If file exists and archive is not `DIMUSNAHKAN`, `Preview` and `Download` should appear and work through the authorized unified server route.
6. Confirm no path, token, storage root, SQL, env, secrets, or raw metadata appears in UI or errors.
7. Open a `DIMUSNAHKAN` detail if available.
8. Expected: metadata visible and no actions; stale action URL fails with `410`.
9. Login as `ADMIN`-only if available.
10. Expected: no operational file access.
11. Try a missing/deleted file if safe test data exists.
12. Expected: safe `404` or `410` without path leakage.

## 13. Next Phase Recommendation

Recommended next phase:

```text
Phase 12M.8 - Unified Detail File Access Human Smoke And Lifecycle Compatibility Review
```

Keep it focused on human smoke evidence, stale-link checks, and compatibility notes. Do not combine with lifecycle mutation, export, cleanup, backfill, migrations, or storage cleanup.
