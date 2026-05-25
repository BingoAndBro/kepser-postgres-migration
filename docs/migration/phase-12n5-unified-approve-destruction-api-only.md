# Phase 12N.5 - Unified approve_destruction API Only

Date: 2026-05-25

Status: implemented for review. This phase adds terminal status mutation through the existing unified lifecycle API only.

Implementation note after 12N.6:

- Phase 12N.6 adds unified detail page buttons only for non-destructive lifecycle actions: `mark_inactive` and `propose_destruction`.
- The `approve_destruction` action remains API-only after 12N.6; no `Musnahkan` UI button is exposed.

## 1. Scope And Boundary

Phase 12N.5 implements only:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

New action:

```text
approve_destruction
```

The route remains canonical archive-id based. `$id` is `arsip.arsip.id`.

This phase does not add UI buttons, route generation, legacy proposal route changes, migrations, schema changes, storage cleanup, file deletion, snapshot clearing, or audit writes.

## 2. Human-Approved Governance Decisions

Accepted for this development/local-LAN phase:

- `approve_destruction` is canonical-only and does not require legacy `arsip_usul_musnah` proposal rows.
- This bypasses legacy proposal governance as an explicit local development/internal governance decision.
- No audit row is written in 12N.5.
- Archive-native audit remains a future schema-approved phase.
- `dokumen.log_aktivitas` is not used because it is workflow-oriented and would be inconsistent for `MANUAL` archives.

## 3. Route And Action Implemented

The existing route now accepts:

```json
{
  "action": "approve_destruction",
  "confirmation": "SETUJUI PEMUSNAHAN ARSIP",
  "reason": "Retensi selesai dan disetujui untuk dimusnahkan"
}
```

Allowed terminal transition:

```text
USUL_MUSNAH -> DIMUSNAHKAN
```

The route still uses:

- centralized same-origin validation before auth and DB work;
- local `dms_session`;
- server-side assigned `KEPALA_SUB_BAGIAN_UMUM`;
- planner validation through `planUnifiedArchiveLifecycleTransition()`;
- guarded DB transaction updates.

## 4. Request Body Confirmation And Reason Policy

For `approve_destruction`:

- `confirmation` is required.
- `confirmation` must exactly equal `SETUJUI PEMUSNAHAN ARSIP`.
- `reason` is required.
- `reason` must be non-empty after trim.
- `reason` max length is 1000 characters.
- Extra fields are rejected by strict request-body validation.

For `mark_inactive` and `propose_destruction`, existing behavior is preserved as much as possible: `reason` remains optional and max 1000 characters.

The `reason` is validated but not stored in 12N.5 because audit storage is not approved.

## 5. WORKFLOW Behavior

For canonical `source_type='WORKFLOW'` archives:

- current canonical status must be `USUL_MUSNAH`;
- canonical `arsip.arsip.status_arsip` is updated to `DIMUSNAHKAN`;
- the guarded update requires id, source type, and current status to still match;
- `dokumen_transaksi` business metadata is not updated;
- no `dokumen.log_aktivitas` row is written;
- no legacy proposal row is created or updated;
- `lampiran_snapshot` is preserved.

## 6. MANUAL Behavior

For linked canonical `source_type='MANUAL'` archives:

- canonical status must be `USUL_MUSNAH`;
- linked `manual_arsip.status_arsip` must also be `USUL_MUSNAH`;
- missing source rows are rejected with conflict;
- source/canonical drift is rejected with conflict;
- canonical `arsip.arsip.status_arsip` and linked `manual_arsip.status_arsip` are updated to `DIMUSNAHKAN` in one transaction;
- guarded source update requires source id, `canonical_arsip_id`, and current source status to still match;
- `manual_arsip.canonical_arsip_id` is not modified;
- `manual_arsip_attachment` rows and attachment files are not touched.

## 7. DIMUSNAHKAN Terminal And File-Access Behavior

`DIMUSNAHKAN` remains terminal in the unified lifecycle planner.

Unified file access already blocks canonical `DIMUSNAHKAN` and linked Manual source `DIMUSNAHKAN` server-side. Stale preview/download action URLs must fail closed with safe `410` responses and no file bytes.

Authorized metadata detail may remain visible. File actions are hidden by existing detail behavior for destroyed archives and are still denied server-side if a stale URL is used.

## 8. Stale File-Action Test Coverage

Focused tests cover:

- canonical `DIMUSNAHKAN` WORKFLOW preview returns `410`;
- canonical `DIMUSNAHKAN` WORKFLOW download returns `410`;
- canonical `DIMUSNAHKAN` MANUAL preview returns `410`;
- canonical `DIMUSNAHKAN` MANUAL download returns `410`;
- linked Manual source `DIMUSNAHKAN` preview/download returns `410`;
- no file bytes are returned in stale destroyed responses.

## 9. No File Deletion Or Snapshot Clearing Policy

Unified `DIMUSNAHKAN` in 12N.5 means:

```text
status-based server-side file-access denial
```

It does not mean:

- physical file deletion;
- storage cleanup;
- snapshot clearing;
- attachment row deletion;
- file migration;
- file copy;
- file backfill;
- file sync;
- old file/data recovery.

Legacy proposal-based physical deletion behavior remains untouched and must not be copied into this route.

## 10. No-Audit Limitation

No audit write is intentionally accepted for 12N.5 as a development/local-LAN limitation.

Not written:

- `dokumen.log_aktivitas`;
- archive-native audit rows;
- legacy proposal decision rows.

This is a governance limitation. A future schema-approved archive-native audit phase should cover canonical archive id, source type, previous status, next status, actor, reason, confirmation evidence, and timestamps.

## 11. What Is Intentionally Not Changed

This phase does not:

- add lifecycle UI buttons;
- modify unified detail page;
- modify unified list pages;
- implement `cancel_proposal`;
- implement `restore_active`;
- implement any transition out of `DIMUSNAHKAN`;
- modify legacy proposal-based Usul Musnah routes;
- create legacy proposal rows;
- bridge to `arsip_usul_musnah`;
- write audit logs;
- create audit tables;
- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- change file access helpers;
- create migrations;
- modify Drizzle schema or migration files;
- execute migrations or seeds;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run live DB reports, backfills, or cleanup;
- add public/static file serving;
- expose signed URLs;
- add Supabase fallback or old file recovery.

## 12. Validation

Required validation:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
pnpm test tests/unit/arsiparis/unified-archive-file-actions.test.ts
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

## 13. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Use a direct API call from a same-origin browser context.
3. For a canonical `WORKFLOW` archive currently `USUL_MUSNAH`, call:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

```json
{
  "action": "approve_destruction",
  "confirmation": "SETUJUI PEMUSNAHAN ARSIP",
  "reason": "Retensi selesai dan disetujui untuk dimusnahkan"
}
```

Expected: canonical `arsip.arsip.status_arsip` becomes `DIMUSNAHKAN`.

4. Repeat for a linked `MANUAL` archive.

Expected: canonical `arsip.arsip.status_arsip` and linked `manual_arsip.status_arsip` become `DIMUSNAHKAN`.

5. Try wrong confirmation.

Expected: `400`.

6. Try a non-`USUL_MUSNAH` archive.

Expected: `409`.

7. Try an `ADMIN`-only session.

Expected: `403`.

8. After `DIMUSNAHKAN`, try stale preview/download URLs.

Expected: safe `410` gone response with no file bytes.

9. Confirm authorized metadata detail remains visible.

10. Confirm file buttons are hidden in the detail UI.

11. Confirm no physical files are deleted.

12. Confirm `lampiran_snapshot` remains intact.

13. Confirm no path, token, storage root, SQL, env value, secret, raw row, or raw attachment metadata appears in responses.

## 14. Next Phase Recommendation

Recommended next phase after 12N.5:

```text
Phase 12N.6 - Unified cancel_proposal API Only
```

Suggested boundary:

- implement only `USUL_MUSNAH -> INAKTIF`;
- no transition out of `DIMUSNAHKAN`;
- no UI;
- no file deletion;
- no legacy proposal route changes;
- no audit writes unless an archive-native audit schema phase is approved first.
