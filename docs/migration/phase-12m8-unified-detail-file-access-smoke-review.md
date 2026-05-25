# Phase 12M.8 - Unified Detail File Access Human Smoke And Compatibility Review

Date: 2026-05-25

Status: planned human-smoke review document. This phase records source-inspected expected behavior and a focused manual smoke checklist for unified archive detail file access after Phase 12M.7 and Phase 12M.7b. Actual human smoke results must be filled by humans; this document does not claim completion of manual smoke.

## 1. Scope And Boundary

Reviewed surface:

```text
GET /api/arsiparis/arsip/$id
GET /api/arsiparis/arsip/$id?action=preview&attachmentRef=...
GET /api/arsiparis/arsip/$id?action=download&attachmentRef=...
/arsiparis/arsip/$id
```

This is a review and smoke-planning phase only. It does not add runtime behavior, schema changes, migrations, route generation, lifecycle mutation, export, cleanup, backfill, file duplication, public/static serving, signed URL exposure, Supabase fallback, or old file recovery.

Source files inspected:

- `src/routes/api/arsiparis/arsip/$id.ts`
- `src/routes/arsiparis/arsip/$id.tsx`
- `src/lib/archive/unified-archive-file-actions.ts`
- `src/lib/archive/unified-archive-detail.ts`
- `tests/unit/arsiparis/unified-archive-file-actions.test.ts`
- `tests/unit/arsiparis/unified-archive-file-action-route.test.ts`
- `tests/unit/arsiparis/unified-archive-detail.test.ts`

## 2. Source Boundary Review

Source inspection found the Phase 12M.7/12M.7b boundary is implemented as:

- Unified detail file actions use `GET /api/arsiparis/arsip/$id?action=preview|download&attachmentRef=...`.
- Safe attachment refs are `workflow-<one-based index>` for `WORKFLOW` and `manual-<UUID>` for `MANUAL`.
- The API requires a valid local `dms_session`; unauthenticated requests return `401`.
- The API requires assigned `KEPALA_SUB_BAGIAN_UMUM`; non-Kasubag users and `ADMIN`-only users return `403`.
- Authorization is based on server-side session roles through `hasLocalRole`; `dms_active_role` is not used as authorization proof.
- Archive id, action, and attachment ref are validated before file responder delegation; malformed ids/refs return safe `404`.
- Preview opens in a local modal whose iframe source is the authorized unified preview API endpoint.
- Download uses the same authorized unified API endpoint with `action=download`.
- The detail DTO does not include preview URLs, download URLs, signed URLs, logical paths, physical paths, storage roots, token values, raw attachment metadata, or raw DB rows.
- The UI builds only safe action URLs from canonical archive id plus safe attachment refs.
- No direct storage/static file URL is rendered in the UI.
- No file duplication, copy, move, backfill, migration, or recovery is performed by the unified detail page or file-action helper.

Actual status-code behavior observed from source/tests:

- Missing or invalid canonical archive id: `404`.
- Missing session: `401`.
- Non-Kasubag or `ADMIN`-only session: `403`.
- Malformed action or attachment ref: `404`.
- Canonical `DIMUSNAHKAN`: `410`.
- Manual source `DIMUSNAHKAN`: `410`.
- Missing source, wrong source, wrong attachment ownership, invalid snapshot, unsafe snapshot, or missing file: safe `404` where handled by the unified helper or existing manual responder.
- Unexpected file access errors return safe `500` without path disclosure.

## 3. WORKFLOW Compatibility Checklist

Expected behavior for `WORKFLOW` attachments:

- File action uses canonical archive id plus `attachmentRef=workflow-<one-based snapshot index>`.
- Server resolves the canonical `arsip.arsip` row first.
- Server requires `source_type='WORKFLOW'`.
- Server requires canonical `status_arsip` not equal to `DIMUSNAHKAN`.
- Server requires a linked workflow document row.
- Server requires the linked workflow document status to be final/archive-readable: `COMPLETED` or `ARCHIVED`.
- Server resolves the one-based snapshot index against `lampiran_snapshot`.
- Server accepts only a safe logical file reference from the snapshot and resolves it server-side.
- Server resolves the file inside the configured local storage root.
- Preview streams with inline disposition; download streams with attachment disposition.
- Missing archive, document, snapshot entry, unsafe reference, invalid file, or missing file returns a safe `404`.
- `DIMUSNAHKAN` returns a safe `410`, including stale action URLs.
- No Supabase fallback, old file recovery, signed URL reuse, public/static serving, or path/token/root exposure is expected.

## 4. MANUAL Compatibility Checklist

Expected behavior for `MANUAL` attachments:

- File action uses canonical archive id plus `attachmentRef=manual-<manual attachment UUID>`.
- Server resolves the canonical `arsip.arsip` row first.
- Server requires `source_type='MANUAL'`.
- Server requires canonical `status_arsip` not equal to `DIMUSNAHKAN`.
- Server loads the linked `manual_arsip` source by `canonical_arsip_id`.
- Server verifies the requested attachment id belongs to that linked Manual Archive source.
- Existing Manual Archive file responder streams the final file response.
- Manual source `DIMUSNAHKAN` returns a safe `410`.
- Missing canonical row, source row, attachment row, wrong attachment ownership, or missing file returns safe failure without path leakage.
- No Supabase fallback, old file recovery, signed URL exposure, public/static serving, file duplication, or raw attachment metadata exposure is expected.

## 5. Human Smoke Matrix

Use redacted or temporary archive identifiers in notes. Do not record secrets, session/cookie values, storage roots, logical paths, physical paths, file tokens, signed token internals, raw DB rows, SQL params, or raw attachment metadata.

| # | Scenario | Setup/data requirement | Action | Expected result | Expected direct URL status | No-leak check |
|---|---|---|---|---|---|---|
| 1 | Kasubag WORKFLOW preview available file | Kasubag account; canonical `WORKFLOW` archive with available attachment and existing local file | Open detail and click Preview | Preview opens in modal through authorized API | `200` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 2 | Kasubag WORKFLOW download available file | Same as row 1 | Click Download | Browser downloads/opens file through authorized API | `200` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 3 | Kasubag MANUAL preview available file | Kasubag account; linked canonical `MANUAL` archive with attachment and existing local file | Open detail and click Preview | Preview opens in modal through authorized API | `200` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 4 | Kasubag MANUAL download available file | Same as row 3 | Click Download | Browser downloads/opens file through authorized API | `200` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 5 | ADMIN-only unified detail file action | Account with `ADMIN` only; available archive/action URL | Open stale/direct preview or download URL | Access denied before DB/file work | `403` | No file bytes, path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 6 | Non-Kasubag unified detail file action | Non-Kasubag account; available archive/action URL | Open stale/direct preview or download URL | Access denied before DB/file work | `403` | No file bytes, path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 7 | DIMUSNAHKAN detail UI | Canonical archive with `status_arsip='DIMUSNAHKAN'` | Open unified detail | Metadata visible; Preview/Download actions hidden; destroyed notice visible | Detail metadata `200` if authorized | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 8 | DIMUSNAHKAN stale preview URL | Same destroyed archive; previously copied preview URL or constructed safe ref | Open direct preview URL | Server blocks stale access | `410` | No file bytes, path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 9 | DIMUSNAHKAN stale download URL | Same destroyed archive; previously copied download URL or constructed safe ref | Open direct download URL | Server blocks stale access | `410` | No file bytes, path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 10 | Missing/deleted WORKFLOW file, if safe test data exists | Non-production safe archive whose referenced file is intentionally absent; do not delete real retained files | Open preview/download URL | Safe missing-file response | `404` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 11 | Missing/deleted MANUAL file, if safe test data exists | Non-production safe manual archive whose referenced file is intentionally absent; do not delete real retained files | Open preview/download URL | Safe missing-file response from existing manual responder | `404` or existing safe manual responder status | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 12 | Malformed attachmentRef | Authorized Kasubag; malformed ref such as non-UUID manual ref or non-positive workflow ref | Open direct action URL | Rejected before file work | `404` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |
| 13 | AttachmentRef that belongs to another archive/source | Authorized Kasubag; valid-looking ref from a different archive/source | Open direct action URL against wrong canonical archive id | Rejected by snapshot/source ownership checks | `404` | No path, root, token, signed URL, raw metadata, SQL, env, or secret |

## 6. Smoke Result Placeholders

Actual human-smoke evidence has not been provided in this phase. Fill these fields only after manual execution.

```text
Date/time:
Tester:
Environment:
Branch/commit:
Browser:
WORKFLOW archive id used (optional/redacted):
MANUAL archive id used (optional/redacted):
Result: PASS / FAIL / SKIPPED
Notes:
```

Per-row result log:

| Row | Result | Notes |
|---|---|---|
| 1 | PASS / FAIL / SKIPPED | |
| 2 | PASS / FAIL / SKIPPED | |
| 3 | PASS / FAIL / SKIPPED | |
| 4 | PASS / FAIL / SKIPPED | |
| 5 | PASS / FAIL / SKIPPED | |
| 6 | PASS / FAIL / SKIPPED | |
| 7 | PASS / FAIL / SKIPPED | |
| 8 | PASS / FAIL / SKIPPED | |
| 9 | PASS / FAIL / SKIPPED | |
| 10 | PASS / FAIL / SKIPPED | |
| 11 | PASS / FAIL / SKIPPED | |
| 12 | PASS / FAIL / SKIPPED | |
| 13 | PASS / FAIL / SKIPPED | |

## 7. No-Leak Checklist

During UI and direct URL smoke, confirm responses and browser-visible output do not expose:

- environment values;
- DB URLs;
- storage roots;
- physical filesystem paths;
- logical storage paths;
- file tokens;
- signed token internals;
- signed URLs;
- raw attachment metadata;
- raw database rows;
- SQL text or SQL params;
- session or cookie values;
- secrets.

Expected safe output is limited to authorized streamed file bytes, safe filenames/content headers, metadata DTO fields, and generic error messages.

## 8. Known Limitations

- This is not production readiness, go-live approval, operational certification, security certification, or compliance validation.
- Browser iframe preview depends on content type and browser support.
- WORKFLOW filename parity depends on metadata completeness; fallback safe filenames may appear when metadata is incomplete.
- Old or unlinked legacy `manual_arsip` rows remain outside canonical unified detail.
- Cleanup of old development data/storage remains a future 12P-dev option.
- Archive lifecycle mutation remains future Phase 12N.
- Export and aggregate behavior remains future Phase 12O.
- Existing manual file responder status-code behavior should be documented as actual behavior if it differs from preferred policy; do not rewrite it inside this review phase.

## 9. Recommendation

If human smoke passes, proceed to Phase 12N lifecycle unification, or choose Phase 12P-dev cleanup after lifecycle/detail stability if cleanup risk is preferred next.

If human smoke fails, create a targeted Phase 12M.8a fix phase scoped only to the failing case. Do not combine smoke failures with lifecycle mutation, export, cleanup, backfill, migrations, route generation, or storage cleanup.

## 10. What Is Intentionally Not Changed

This phase does not:

- implement lifecycle mutation;
- implement destruction mutation;
- add edit/delete actions;
- implement search;
- implement aggregate/export;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run live DB reports;
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
- run route generation;
- add public/static file serving;
- expose signed URLs;
- add Supabase fallback or old file recovery;
- duplicate, copy, move, migrate, backfill, sync, or recover files.

## 11. Validation

Required validation for this documentation/review phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-detail.test.ts
pnpm test tests/unit/arsiparis/unified-archive-query.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-action-route.test.ts
```

Required protected diff checks:

```bash
git diff -- .env .env.migration
git diff -- package.json pnpm-lock.yaml
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```
