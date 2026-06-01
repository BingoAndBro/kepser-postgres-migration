# Phase 12M.7b - Unified Detail File Action UX Alignment

Date: 2026-05-25

Status: implemented pending human review. This phase aligns the Phase 12M.7 unified archive detail file-action UI with existing document attachment UX while preserving the 12M.7 server-side file-access boundary.

Review note after Phase 12M.8: source inspection and manual smoke placeholders are documented in `docs/migration/phase-12m8-unified-detail-file-access-smoke-review.md`. Phase 12M.8 records expected behavior separately from actual human-smoke results and does not add runtime behavior.

## 1. Scope And Boundary

This phase updates the existing unified archive detail page and the WORKFLOW file-action filename policy:

```text
/arsiparis/arsip/$id
GET /api/arsiparis/arsip/$id?action=preview|download&attachmentRef=...
```

No new route files were added. `src/routeTree.gen.ts` is not changed.

## 2. Human UX Feedback Addressed

Human review identified that:

- Preview navigated directly to the API response instead of opening in a popup.
- Attachment cards looked like metadata tables.
- Attachment UI should follow existing document attachment patterns.
- WORKFLOW file naming should align with document transaction attachment naming where possible.
- File security and source-aware server resolution must remain unchanged.

## 3. Existing UI Reference Used

Reference files/components:

- `src/components/dokumen/AttachmentViewer.tsx`
- `src/components/dokumen/AttachmentEditor.tsx`
- `/pegawai/dokumen/$id/revisi` through `AttachmentEditor`
- existing document preview modal pattern with backdrop, header, ESC close, close button, and iframe body

The existing pattern uses compact rows with a status icon, one primary title, small supporting text, and icon actions for preview/download.

## 4. Preview Modal/Popup Behavior

Unified archive detail Preview now opens a local modal instead of navigating away.

The modal:

- uses the authorized unified preview endpoint as iframe `src`;
- includes a close button;
- closes on backdrop click;
- closes on `Escape`;
- does not fetch file bytes in client JavaScript;
- does not render signed URLs, tokens, storage paths, or raw metadata.

Preview URL remains:

```text
/api/arsiparis/arsip/$id?action=preview&attachmentRef=...
```

Download remains a direct authorized API link:

```text
/api/arsiparis/arsip/$id?action=download&attachmentRef=...
```

## 5. Attachment Card Simplification

The `Lampiran Arsip` section now uses compact attachment rows:

- status icon;
- primary attachment name;
- compact subtext: `format - size`;
- small availability badge;
- icon actions for Preview and Download.

The UI no longer shows separate grid/table rows for source, upload date, status, type, and size in each attachment card.

## 6. WORKFLOW Naming/Download Filename Alignment

For WORKFLOW attachment rows, the visible title remains safe metadata from the archived attachment summary. The UI does not expose logical paths, storage keys, raw snapshot JSON, or raw original filename when a friendly title already exists.

For WORKFLOW file responses, `Content-Disposition` filename now aligns with existing document transaction naming where possible:

```text
[Kelengkapan]_[Detail/Kategori/Jenis/Jenis Dokumen]_[Kegiatan]_[Tanggal].ext
```

The server derives this from:

- the safe archived attachment name;
- current workflow document metadata;
- joined master-data names;
- the existing local file extension.

If required metadata is incomplete, the responder falls back to a safe attachment/original filename. Filename sanitization remains enforced.

## 7. MANUAL Naming Behavior

Manual attachment UI continues to prefer `judul_lampiran` as the friendly title. If a title is absent, the safe original filename may be used by the metadata DTO.

Manual file streaming remains delegated to the existing Manual Archive file responder, preserving its filename policy and content-type rules.

## 8. Storage Duplication Note

This phase does not duplicate, move, copy, migrate, backfill, or recover files.

WORKFLOW unified preview/download resolves the archived snapshot reference server-side to the existing local storage file. MANUAL unified preview/download verifies the canonical source relationship and delegates to the existing Manual Archive attachment responder.

Future cleanup must continue protecting files referenced by workflow archive snapshots and Manual Archive attachment rows.

## 9. Security Guarantees Preserved

This phase preserves:

- local `dms_session` requirement;
- assigned `KEPALA_SUB_BAGIAN_UMUM` requirement;
- `ADMIN`-only rejection;
- no authorization from `dms_active_role`;
- canonical archive lookup;
- source-type checks;
- attachment ownership checks;
- `DIMUSNAHKAN` blocking with stale action URLs failing server-side;
- path traversal and storage-root containment checks;
- no public/static file serving;
- no Supabase fallback or old file recovery;
- no logical path, physical path, storage root, signed URL, token, raw DB row, raw metadata, SQL, env, cookie, or secret exposure.

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
- expose signed URLs;
- duplicate files in storage.

## 11. Validation

Focused validation:

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
git diff -- src/routeTree.gen.ts
git diff -- db
git diff -- drizzle
git diff -- supabase
```

## 12. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Open unified detail for a WORKFLOW archive with an attachment.
3. Confirm attachment display uses compact document-style rows.
4. Confirm WORKFLOW attachment naming and download filename are consistent with document transaction naming where metadata is available.
5. Click Preview.
6. Expected: preview opens in a modal, not by navigating away.
7. Close the modal.
8. Click Download.
9. Expected: download works through the authorized unified API.
10. Repeat for a linked MANUAL archive attachment.
11. Confirm `DIMUSNAHKAN` rows show no Preview/Download actions.
12. Confirm no path, token, storage root, signed URL, SQL, env, secret, or raw metadata appears.
13. Confirm files are not duplicated, copied, moved, or recovered.

