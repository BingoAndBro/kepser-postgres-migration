# Phase 12N.2 - Unified Archive Lifecycle Helper Foundation

Date: 2026-05-25

Status: helper foundation implemented for review. This phase adds a pure planning helper and focused unit tests only. It does not implement archive lifecycle mutation.

## 1. Scope And Boundary

Phase 12N.2 adds a pure, serializable lifecycle planner for future unified archive lifecycle routes.

Files added:

- `src/lib/archive/unified-archive-lifecycle.ts`
- `tests/unit/arsiparis/unified-archive-lifecycle.test.ts`

The helper accepts already-loaded canonical/source status values and returns either an allowed plan or a controlled rejection. It performs no database calls, route handling, auth checks, same-origin checks, file access, file deletion, audit writes, migrations, backfill, or cleanup.

Future routes must still perform:

- canonical archive reload from `arsip.arsip`;
- `dms_session` authentication;
- assigned `KEPALA_SUB_BAGIAN_UMUM` RBAC;
- `ADMIN`-only rejection for operational archive mutation;
- centralized same-origin validation for unsafe methods;
- Zod request validation;
- transaction enforcement;
- safe response mapping.

## 2. Helper Module And Tests

Helper:

- `src/lib/archive/unified-archive-lifecycle.ts`

Test:

- `tests/unit/arsiparis/unified-archive-lifecycle.test.ts`

The helper imports only archive status/source constants. It does not import DB clients, schemas, route utilities, auth/session helpers, request/response types, storage helpers, file helpers, or mutation helpers.

## 3. Allowed Actions And Status Transitions

Allowed action values:

- `mark_inactive`
- `propose_destruction`
- `approve_destruction`
- `cancel_proposal`

Allowed transitions:

| Action | From | To | Meaning |
|---|---|---|---|
| `mark_inactive` | `AKTIF` | `INAKTIF` | move active archive into inactive lifecycle |
| `propose_destruction` | `INAKTIF` | `USUL_MUSNAH` | propose archive for destruction |
| `approve_destruction` | `USUL_MUSNAH` | `DIMUSNAHKAN` | mark archive destroyed for access control |
| `cancel_proposal` | `USUL_MUSNAH` | `INAKTIF` | cancel proposal back to inactive, not restore to active |

`restore_active` is not approved by default and is rejected as an invalid action.

## 4. Rejected Transitions

Rejected by default:

- any transition from `DIMUSNAHKAN`;
- `AKTIF -> USUL_MUSNAH`;
- `AKTIF -> DIMUSNAHKAN`;
- `INAKTIF -> DIMUSNAHKAN`;
- `USUL_MUSNAH -> AKTIF`;
- unknown action;
- unknown current status;
- unknown source type;
- missing canonical current status;
- missing linked Manual Archive source status;
- Manual Archive source/canonical status drift.

Controlled rejection reasons include:

- `ARCHIVE_NOT_FOUND`
- `SOURCE_NOT_SUPPORTED`
- `INVALID_ACTION`
- `INVALID_CURRENT_STATUS`
- `TRANSITION_NOT_ALLOWED`
- `TERMINAL_STATUS`
- `MANUAL_SOURCE_MISSING`
- `MANUAL_STATUS_DRIFT`
- `AUDIT_POLICY_UNRESOLVED`
- `DESTRUCTION_REQUIRES_EXTRA_CONFIRMATION`

The current helper uses safe Indonesian user-facing messages and does not include paths, storage roots, tokens, raw rows, SQL, env values, or secrets.

## 5. WORKFLOW Source Policy

For `WORKFLOW` canonical archives:

- `arsip.arsip.status_arsip` is the lifecycle authority.
- Future mutation should update canonical lifecycle status only.
- `sourceSyncUpdate` is `none`.
- Lifecycle actions must not edit `dokumen_transaksi` business metadata.
- `fileDeletion` is always `false`.

The helper returns transaction-plan text reminding the future route not to update workflow document business metadata.

## 6. MANUAL Source Sync And Drift Policy

For linked `MANUAL` canonical archives:

- `arsip.arsip.status_arsip` is the unified lifecycle authority.
- `manual_arsip.status_arsip` remains a source edit/upload/file guard during transition.
- The helper requires the supplied Manual Archive source status to exist.
- The helper requires source status to match the current canonical status before any allowed plan.
- If source status is missing, the helper rejects with `MANUAL_SOURCE_MISSING`.
- If source status differs from canonical status, the helper rejects with `MANUAL_STATUS_DRIFT`.
- Allowed plans include `sourceSyncUpdate` to set `manual_arsip.status_arsip` to the same target status as the canonical row.

Future route implementation must apply canonical and Manual source status updates in the same DB transaction after reloading both rows.

## 7. DIMUSNAHKAN Terminal And File-Access Policy

`DIMUSNAHKAN` is terminal by default.

The helper rejects any transition from `DIMUSNAHKAN` with `TERMINAL_STATUS`.

`approve_destruction` means:

- canonical status target is `DIMUSNAHKAN`;
- linked Manual source status target is also `DIMUSNAHKAN` for `MANUAL`;
- future file access is blocked by existing server-side file-access checks;
- metadata detail may remain visible to authorized `KEPALA_SUB_BAGIAN_UMUM`;
- no physical storage deletion is planned.

## 8. No File Deletion Invariant

Every allowed helper result includes:

```ts
fileDeletion: false
```

This applies to normal movement, proposal, cancellation, and destruction approval planning.

`DIMUSNAHKAN` in this unified lifecycle foundation means status-based access blocking, not physical file deletion, snapshot clearing, storage cleanup, file migration, file copy, file backfill, or file recovery.

## 9. Audit And Confirmation Placeholders

Allowed plans include `auditIntent` metadata:

- `action`
- `fromStatus`
- `toStatus`
- `sourceType`
- `requiresReason`
- `requiresExplicitConfirmation`
- `auditStorage`

`approve_destruction` sets `requiresExplicitConfirmation: true`.

The helper does not write audit logs. Audit storage remains unresolved for unified lifecycle mutation because `dokumen.log_aktivitas` is workflow-document oriented and does not naturally cover Manual Archive lifecycle changes. Future route work must decide whether to use an archive-native audit table, workflow log compatibility for `WORKFLOW`, or both.

The helper does not block all allowed transitions due to unresolved audit policy. It only returns audit intent as planning metadata.

## 10. What Is Intentionally Not Changed

This phase does not:

- add lifecycle API routes;
- modify existing lifecycle routes;
- add UI buttons;
- modify unified list pages;
- modify unified detail pages;
- change preview/download behavior;
- change file access helpers;
- update database rows;
- execute lifecycle mutation;
- create runtime transaction code invoked by routes;
- delete files;
- cleanup storage;
- run live DB reports;
- run live backfill;
- call the Phase 12L.18 mutation helper;
- call the Phase 12L.19 dry-run helper;
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

Required validation for this phase:

```bash
git diff --check
pnpm test tests/unit/arsiparis/unified-archive-lifecycle.test.ts
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

Unit test coverage includes:

- allowed `WORKFLOW` transitions;
- allowed linked `MANUAL` transitions;
- terminal `DIMUSNAHKAN` rejection;
- direct transition rejection;
- missing Manual source rejection;
- Manual source/canonical drift rejection;
- unknown action/status/source rejection;
- every allowed plan has `fileDeletion: false`;
- helper source purity guard;
- no sensitive output checks.

## 12. Next Phase Recommendation

Proceed to:

```text
Phase 12N.3 - Unified lifecycle API route for non-destructive transitions only
```

Recommended 12N.3 scope:

- add `POST /api/arsiparis/arsip/$id/lifecycle`;
- allow only `mark_inactive` and `propose_destruction`;
- require `dms_session`;
- require assigned `KEPALA_SUB_BAGIAN_UMUM`;
- reject `ADMIN`-only operational access;
- use centralized same-origin guard;
- reload canonical/source rows inside the route;
- use this helper as a planning contract only;
- execute canonical and Manual source status updates in one transaction;
- do not implement `approve_destruction`;
- do not delete files;
- do not add UI buttons.
