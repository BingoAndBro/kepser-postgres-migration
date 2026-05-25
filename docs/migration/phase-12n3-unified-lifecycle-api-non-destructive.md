# Phase 12N.3 - Unified Lifecycle API Route For Non-Destructive Transitions

Date: 2026-05-25

Status: implemented for review. This phase adds a narrow unified lifecycle mutation API for non-destructive status transitions only.

## 1. Scope And Boundary

Phase 12N.3 adds the canonical archive-id lifecycle route:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

This route mutates lifecycle status for canonical `arsip.arsip` rows only after reloading server-side state and consulting the Phase 12N.2 lifecycle planner.

Security boundary reminders:

- `dms_session` is the authentication boundary.
- `dms_active_role` is UX-only and is not used for authorization.
- Server/API RBAC is authoritative.
- Assigned `KEPALA_SUB_BAGIAN_UMUM` is required.
- `ADMIN`-only users are rejected for operational archive lifecycle mutation.
- Active Supabase runtime/package dependency remains retired; historical Supabase artifacts remain.

## 2. Route Added

Route file:

- `src/routes/api/arsiparis/arsip/$id/lifecycle.ts`

Request body:

```json
{
  "action": "mark_inactive",
  "reason": "optional reason"
}
```

Success response is intentionally small:

```json
{
  "ok": true,
  "archiveId": "canonical-archive-id",
  "fromStatus": "AKTIF",
  "toStatus": "INAKTIF",
  "sourceType": "WORKFLOW"
}
```

Failure responses use only safe `{ "error": "..." }` payloads.

## 3. Allowed Actions

Allowed in 12N.3:

- `mark_inactive`: `AKTIF -> INAKTIF`
- `propose_destruction`: `INAKTIF -> USUL_MUSNAH`

The route still reloads canonical status from the database and does not trust client status.

## 4. Rejected Actions

Rejected in 12N.3:

- `approve_destruction`
- `cancel_proposal`
- `restore_active`
- unknown action values
- malformed or extra-field request bodies

`approve_destruction` remains future work because `DIMUSNAHKAN`, proposal bridging, and destructive approval safety need separate approval.

## 5. Authorization Behavior

The route behavior:

- returns `401` for unauthenticated requests;
- returns `403` for users without assigned `KEPALA_SUB_BAGIAN_UMUM`;
- returns `403` for `ADMIN`-only users;
- does not authorize from `dms_active_role`;
- performs DB work only after same-origin, session, role, UUID, and body validation pass.

## 6. Same-Origin Behavior

The route uses the centralized `requireSameOrigin(request)` guard for the unsafe `POST` method.

Cross-origin unsafe requests are rejected before session lookup, DB read, transaction, or storage work.

This remains the bounded same-origin foundation, not a full CSRF token framework.

## 7. WORKFLOW Update Behavior

For `source_type='WORKFLOW'`:

- canonical `arsip.arsip.status_arsip` is updated to the planned target status;
- the guarded update requires the canonical row id, source type, and previous status to still match;
- `dokumen_transaksi` business metadata is not updated;
- no proposal row is created in 12N.3;
- no file or storage helper is called.

## 8. MANUAL Update And Drift Behavior

For `source_type='MANUAL'`:

- the route loads the linked `manual_arsip` source row by `canonical_arsip_id`;
- the planner rejects missing Manual Archive source rows as a conflict;
- the planner rejects source/canonical status drift as a conflict;
- when allowed, canonical `arsip.arsip.status_arsip` and linked `manual_arsip.status_arsip` are updated together;
- `manual_arsip.canonical_arsip_id` is not changed;
- Manual Archive attachments/files are not touched.

## 9. Transaction And Guarded Update Behavior

Approved transitions run in one DB transaction.

Guarded update preconditions:

- canonical id matches the route id;
- canonical source type matches the planner source type;
- canonical status still equals the planner `fromStatus`;
- for MANUAL rows, linked source id and `canonical_arsip_id` match;
- for MANUAL rows, source status still equals the planner `fromStatus`.

If any guarded update affects no row, the transaction fails and the route returns a safe `409` conflict.

## 10. No File Deletion Or Storage Cleanup

Phase 12N.3 does not:

- delete physical files;
- clear archive snapshots;
- run storage cleanup;
- duplicate, copy, move, backfill, sync, or recover files;
- change preview/download behavior;
- expose file URLs, signed URLs, logical paths, physical paths, storage roots, tokens, or raw attachment metadata.

Because 12N.3 only transitions to `INAKTIF` or `USUL_MUSNAH`, existing preview/download behavior remains unchanged unless a separate current policy already blocks those statuses.

## 11. Audit Limitation

Unified archive lifecycle audit storage remains unresolved.

Phase 12N.3 intentionally does not write:

- `dokumen.log_aktivitas`;
- a new audit table;
- Manual Archive lifecycle audit records.

Do not use `dokumen.log_aktivitas` for MANUAL lifecycle changes until a human-approved policy exists.

## 12. What Is Intentionally Not Changed

This phase does not:

- add lifecycle UI buttons;
- modify unified detail or list pages;
- modify existing legacy workflow lifecycle routes;
- replace the proposal-id Usul Musnah approval route;
- implement `approve_destruction`;
- implement any `DIMUSNAHKAN` transition;
- implement `cancel_proposal` or `restore_active`;
- create proposal rows;
- write audit logs;
- change file access helpers;
- change preview/download behavior;
- create canonical MANUAL rows;
- update `manual_arsip.canonical_arsip_id`;
- create migrations;
- modify Drizzle schema or migration files;
- run migrations, seeds, live reports, backfills, or cleanup;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- add public/static file serving;
- add Supabase fallback or old file recovery.

## 13. Validation

Implemented validation:

- Zod UUID validation for canonical archive id.
- Zod strict body validation for `action` and optional `reason`.
- Planner validation for source type, current status, allowed transition, missing Manual source, and Manual status drift.
- Guarded DB update preconditions for race/conflict protection.
- Safe response mapping without raw DB rows, SQL, paths, token internals, env values, storage roots, or secrets.

Focused tests added:

```bash
pnpm test tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
```

## 14. Manual Retest Instructions

1. Login as `KEPALA_SUB_BAGIAN_UMUM`.
2. Use a direct API call for a canonical `AKTIF` WORKFLOW archive:

```text
POST /api/arsiparis/arsip/$id/lifecycle
body { "action": "mark_inactive" }
```

Expected: canonical `arsip.arsip.status_arsip` becomes `INAKTIF`.

3. Use a direct API call for a canonical `INAKTIF` WORKFLOW archive:

```text
POST /api/arsiparis/arsip/$id/lifecycle
body { "action": "propose_destruction" }
```

Expected: canonical `arsip.arsip.status_arsip` becomes `USUL_MUSNAH`.

4. Repeat with a linked MANUAL archive.

Expected: canonical `arsip.arsip.status_arsip` and linked `manual_arsip.status_arsip` update together.

5. Try `approve_destruction`.

Expected: rejected in 12N.3.

6. Try an `ADMIN`-only session.

Expected: `403`.

7. Try a drifted MANUAL row if safe test data exists.

Expected: `409`, no update.

8. Confirm no files are deleted.

9. Confirm preview/download still works for non-`DIMUSNAHKAN` archives according to current policy.

10. Confirm no path, token, storage root, SQL, env value, secret, raw row, or raw attachment metadata appears in responses.

## 15. Next Phase Recommendation

Proceed to a separate 12N.4 phase only after reviewing 12N.3:

```text
Phase 12N.4 - Destruction approval transition with extra safety
```

Recommended 12N.4 decisions before implementation:

- proposal-id to canonical archive-id bridge policy;
- audit storage policy;
- `DIMUSNAHKAN` stale file-access regression tests across WORKFLOW and MANUAL surfaces;
- explicit confirmation requirements;
- confirmation that physical file deletion remains out of unified lifecycle mutation unless a separate cleanup/destruction phase approves it.
