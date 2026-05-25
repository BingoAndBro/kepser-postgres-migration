# Phase 12N.4 - Destruction Approval Policy And DIMUSNAHKAN Safety Plan

Date: 2026-05-25

Status: planned policy and safety document. This phase is documentation-only and does not implement `approve_destruction`.

## 1. Scope And Boundary

Phase 12N.4 defines the policy and safety requirements for a future unified destruction approval action before any `DIMUSNAHKAN` mutation is added to the canonical lifecycle API.

Reviewed surfaces:

- `src/lib/archive/unified-archive-lifecycle.ts`
- `src/routes/api/arsiparis/arsip/$id/lifecycle.ts`
- `tests/unit/arsiparis/unified-archive-lifecycle.test.ts`
- `tests/unit/arsiparis/unified-archive-lifecycle-route.test.ts`
- `src/lib/archive/unified-archive-file-actions.ts`
- `src/routes/api/arsiparis/arsip/$id.ts`
- `src/routes/api/arsiparis/usul-musnah.ts`
- `src/routes/api/arsiparis/usul-musnah.$id.ts`
- `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts`
- `src/routes/api/arsiparis/aktif.$id/pindahkan.ts`
- `src/lib/constants/archive-status.ts`
- `src/lib/manual-arsip.ts`

Security boundary reminders:

- `dms_session` is the authentication boundary.
- `dms_active_role` is UX-only and must not authorize lifecycle mutation.
- Server/API RBAC is authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` is the operational archive lifecycle role.
- `ADMIN`-only access must be rejected for operational archive lifecycle mutation.
- Active Supabase runtime/package dependency is retired; historical Supabase artifacts remain.

This phase does not change runtime source, route behavior, schema, migrations, generated routes, package files, database rows, storage files, file access helpers, lifecycle UI, audit writes, proposal rows, backfill, cleanup, or legacy proposal destruction behavior.

## 2. Current Destructive/Proposal Inventory

### Legacy Proposal And Destruction Routes

| Route | File | Method | Id semantics | Auth/RBAC | Same-origin | Status transition | Writes `arsip.arsip.status_arsip` | Writes `manual_arsip.status_arsip` | Writes proposal/usul table | Writes `dokumen_transaksi` | Deletes physical files | Clears snapshot/path metadata | Audit/log | Leak risk review | Unified canonical id compatibility |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/api/arsiparis/inaktif/$id/musnahkan` | `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts` | POST | canonical `arsip.arsip.id` | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM`; no `ADMIN` operational fallback observed | Yes | `INAKTIF -> USUL_MUSNAH` | Yes | No | Inserts `arsip_usul_musnah` with `MENUNGGU` | No | No | No | Inserts `dokumen.log_aktivitas` with workflow document id | Safe generic responses observed; workflow-oriented because audit requires document id | Partially compatible for WORKFLOW canonical ids, but not linked MANUAL rows |
| `/api/arsiparis/usul-musnah/$id` | `src/routes/api/arsiparis/usul-musnah.$id.ts` | GET | proposal `arsip_usul_musnah.id`, not canonical archive id | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM`; no `ADMIN` operational fallback observed | Safe method only | Read-only proposal/detail | No | No | Reads proposal row | No | No | No | No write | Returns legacy detail including snapshot-derived fields; should not be reused as unified safe detail | Not compatible with unified canonical detail id because `$id` is proposal id |
| `/api/arsiparis/usul-musnah/$id` | `src/routes/api/arsiparis/usul-musnah.$id.ts` | PATCH | proposal `arsip_usul_musnah.id`, not canonical archive id | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM`; no `ADMIN` operational fallback observed | Yes | proposal `MENUNGGU -> DISETUJUI`; archive `USUL_MUSNAH -> DIMUSNAHKAN` | Yes | No | Updates proposal decision fields | No | Yes, after DB transaction | Yes, sets archive snapshot to empty | Inserts `dokumen.log_aktivitas` with workflow document id | Responses use safe counts/codes, but route is tightly coupled to physical deletion and raw snapshot processing | Not compatible with unified canonical id flow; destructive behavior must remain isolated |
| `/api/arsiparis/usul-musnah` | `src/routes/api/arsiparis/usul-musnah.ts` | GET | list rows by canonical `arsip.arsip.id` | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM` | Safe method only | Read-only canonical `USUL_MUSNAH` list | No | No | No | No | No | No | No | Safe unified list DTO | Compatible with canonical id flow for list/detail links |

### Related Non-Destructive Lifecycle Route

| Route | File | Method | Id semantics | Auth/RBAC | Same-origin | Status transition | Writes `arsip.arsip.status_arsip` | Writes `manual_arsip.status_arsip` | Writes proposal/usul table | Writes `dokumen_transaksi` | Deletes physical files | Clears snapshot/path metadata | Audit/log | Unified canonical id compatibility |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| `/api/arsiparis/aktif/$id/pindahkan` | `src/routes/api/arsiparis/aktif.$id/pindahkan.ts` | POST | canonical `arsip.arsip.id` | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM` | Yes | `AKTIF -> INAKTIF` | Yes | No | No | No | No | No | Inserts `dokumen.log_aktivitas` with workflow document id | Partially compatible for WORKFLOW only; replaced by 12N.3 unified API for canonical non-destructive movement |
| `/api/arsiparis/arsip/$id/lifecycle` | `src/routes/api/arsiparis/arsip/$id/lifecycle.ts` | POST | canonical `arsip.arsip.id` | `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM`; `ADMIN`-only rejected by absence of operational role | Yes | 12N.3 only: `AKTIF -> INAKTIF`, `INAKTIF -> USUL_MUSNAH` | Yes | Yes for linked MANUAL only | No | No | No | No | No audit write in 12N.3 | Target route for future unified lifecycle action, but `approve_destruction` is intentionally rejected today |

### Manual Archive File And Source Guards

| Surface | File | Current guard | Destruction relevance |
|---|---|---|---|
| Unified file action | `src/lib/archive/unified-archive-file-actions.ts` | Blocks canonical `DIMUSNAHKAN`; for MANUAL also blocks linked source `DIMUSNAHKAN` | Existing server-side guard should block stale unified preview/download URLs after future status update |
| Unified detail API | `src/routes/api/arsiparis/arsip/$id.ts` | Requires `dms_session` plus `KEPALA_SUB_BAGIAN_UMUM`; delegates file action validation to unified file helper | Existing detail metadata can remain visible while stale file actions return safe errors |
| Manual source file responder | `src/lib/manual-arsip.ts` | Blocks source `DIMUSNAHKAN` with a safe gone response | Future MANUAL destruction must update source status in the same transaction so source-specific stale file routes also fail closed |
| Manual edit/upload helpers | `src/lib/manual-arsip.ts` | Only allow edit/upload while source status is `AKTIF` | Future lifecycle updates must preserve source/canonical sync for operational locks |

Inventory conclusion:

- Existing destructive approval is legacy proposal-id based.
- Existing destructive approval mutates `arsip.arsip.status_arsip` to `DIMUSNAHKAN`, clears the archive snapshot, writes workflow `log_aktivitas`, and then attempts physical file deletion.
- Existing destructive approval is WORKFLOW-oriented and is not safe to reuse for linked MANUAL canonical rows.
- Unified 12N.3 proposal movement is canonical-id based and does not create legacy proposal rows.
- Unified future `DIMUSNAHKAN` must be a status-based access denial action, not an automatic storage deletion action.

## 3. Unified `approve_destruction` Target Policy

Future target route:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

Future body:

```json
{
  "action": "approve_destruction",
  "confirmation": "fixed phrase or exact archive name",
  "reason": "optional or required policy reason"
}
```

Policy:

1. `$id` is canonical `arsip.arsip.id`, not proposal id.
2. Only current canonical status `USUL_MUSNAH` can transition to `DIMUSNAHKAN`.
3. `DIMUSNAHKAN` is terminal by default.
4. No transition out of `DIMUSNAHKAN` is planned unless a future human-approved exceptional recovery policy exists.
5. `approve_destruction` must require explicit confirmation stronger than a boolean. A fixed phrase or exact archive name should be used if UX/domain approves.
6. `reason` should be required unless the human explicitly accepts a weaker policy.
7. Existing file access helpers must block after the status update.
8. Stale preview/download URLs must fail server-side with `410` or another documented safe status. UI hiding is not sufficient.
9. Unified `DIMUSNAHKAN` means status-based file-access denial. It does not mean automatic physical file deletion.

WORKFLOW policy:

- Update canonical `arsip.arsip.status_arsip` to `DIMUSNAHKAN`.
- Do not edit `dokumen_transaksi` business metadata.
- Do not delete physical files.
- Do not clear `arsip.lampiran_snapshot`.
- Do not copy, move, backfill, sync, or recover files.

MANUAL policy:

- Update canonical `arsip.arsip.status_arsip` to `DIMUSNAHKAN`.
- Update linked `manual_arsip.status_arsip` to `DIMUSNAHKAN` in the same transaction.
- Reject missing linked source rows.
- Reject source/canonical status drift.
- Do not delete physical files.
- Do not delete `manual_arsip_attachment` rows.
- Do not change attachment storage references.

## 4. Proposal Bridge Options And Recommendation

### Option 1 - Canonical-Only Unified Destruction

Future `approve_destruction` works from canonical `arsip.arsip.status_arsip='USUL_MUSNAH'` only.

Pros:

- Minimal safe implementation after 12N.3.
- Matches unified list/detail canonical id flow.
- Supports WORKFLOW and linked MANUAL rows without forcing MANUAL into workflow proposal tables.
- Avoids schema changes and proposal-id lookup ambiguity.
- Keeps physical deletion out of unified lifecycle.

Cons:

- Bypasses legacy proposal governance.
- Existing proposal pages/routes remain compatibility backlog.
- Existing legacy proposal rows may not reflect unified 12N.3 proposals.
- Domain owners must explicitly accept canonical status as sufficient destruction approval governance.

### Option 2 - Bridge Canonical `USUL_MUSNAH` To Legacy Proposal Row

Either `propose_destruction` or `approve_destruction` creates or links a proposal row.

Pros:

- Preserves legacy proposal governance shape.
- Gives a visible proposal record for current proposal pages.
- May ease migration for existing operators who expect proposal approval screens.

Cons:

- Requires a schema or link policy if no canonical relation exists for all source types.
- Current legacy proposal route is WORKFLOW-oriented and depends on workflow document logging.
- MANUAL lifecycle would be forced into a workflow-shaped proposal table unless a new archive-native proposal model is approved.
- Not suitable without explicit schema/policy approval.

### Option 3 - Keep Legacy Proposal Approval Separate

Unified lifecycle does not approve destruction until the legacy proposal route is refactored.

Pros:

- Avoids bypassing legacy proposal governance.
- Avoids adding a new destructive path before proposal semantics are resolved.
- Lowest domain-policy risk if proposal governance is mandatory.

Cons:

- Blocks unified MANUAL destruction because the current proposal route is not MANUAL-ready.
- Leaves canonical unified `USUL_MUSNAH` rows without a unified terminal action.
- Keeps operators split between canonical list/detail and legacy proposal approval.

Recommendation:

- Prefer Option 1 for Phase 12N.5 if the human accepts that canonical-only `approve_destruction` bypasses legacy proposal governance as a domain decision.
- If proposal governance is mandatory, do not implement `approve_destruction` in 12N.5. Choose Option 3 and schedule a separate proposal/refactor policy phase before mutation.
- Do not choose Option 2 without explicit schema and governance approval.

## 5. Audit Policy Options And Recommendation

### Option A - No Audit Write For Now

Implement status mutation without writing audit rows and document the limitation.

Pros:

- No schema change.
- Keeps 12N.5 focused on status safety and file-access blocking.
- Works equally for WORKFLOW and MANUAL.

Cons:

- Destructive approval has weak traceability.
- This is a significant governance limitation for terminal lifecycle status.

### Option B - Reuse `dokumen.log_aktivitas` For WORKFLOW Only

Write workflow audit rows for WORKFLOW and no equivalent MANUAL audit.

Pros:

- Compatible with existing workflow audit pattern.
- No schema change for WORKFLOW.

Cons:

- Incomplete for MANUAL archives.
- Creates inconsistent audit semantics across source types.
- `log_aktivitas` is workflow-document oriented and does not naturally model canonical archive lifecycle.

### Option C - Add Archive-Native Audit Table Later

Create a future schema/migration for archive lifecycle audit.

Pros:

- Correct long-term model.
- Can cover canonical archive id, source type, previous status, next status, actor, reason, confirmation evidence, proposal id if present, and timestamps.
- Supports WORKFLOW and MANUAL consistently.

Cons:

- Requires schema/migration approval.
- Should be a separate phase before or after 12N.5 depending on risk appetite.

### Option D - Minimal Metadata-Only Lifecycle Note In Existing Archive Metadata

Use an existing safe metadata field if one is approved for lifecycle note storage.

Pros:

- Avoids new table if a safe field already exists and is suitable.

Cons:

- No approved field was identified for this phase.
- Could blur business metadata and audit semantics.
- Not recommended without explicit data model approval.

Recommendation:

- Preferred long-term: Option C, archive-native audit table in a later schema-approved phase.
- For 12N.5, either stay Option A with a clear documented limitation or delay 12N.5 until audit policy is approved.
- Do not use Option B as the only audit policy because MANUAL archives would remain uncovered.
- Audit storage remains unresolved after 12N.4.

## 6. Future API Contract

Future request:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

```json
{
  "action": "approve_destruction",
  "confirmation": "fixed phrase or exact archive name",
  "reason": "Retensi selesai dan pemusnahan disetujui"
}
```

Future success response must stay safe and minimal:

```json
{
  "ok": true,
  "archiveId": "canonical archive id",
  "fromStatus": "USUL_MUSNAH",
  "toStatus": "DIMUSNAHKAN",
  "sourceType": "WORKFLOW"
}
```

Future failure responses:

- `401` unauthenticated.
- `403` non-Kasubag or `ADMIN`-only operational denial.
- `400` invalid action/body/confirmation.
- `404` invalid or missing canonical archive.
- `409` invalid status, terminal status, guarded update conflict, missing MANUAL source, or MANUAL drift.
- `410` for stale file-action access after destruction.

Responses must not expose env values, DB URLs, storage roots, physical paths, logical paths, file tokens, signed token internals, raw attachment metadata, raw DB rows, SQL params, session/cookie values, or secrets.

## 7. Safety Requirements

Future `approve_destruction` must require:

- `dms_session` authentication.
- Assigned `KEPALA_SUB_BAGIAN_UMUM`.
- `ADMIN`-only rejection.
- No authorization from `dms_active_role`.
- Centralized same-origin guard.
- Zod validation for route id and strict request body.
- Explicit confirmation stronger than a boolean.
- Reason required or explicitly accepted as optional by the human.
- Canonical archive reload from `arsip.arsip`.
- Linked MANUAL source reload when `source_type='MANUAL'`.
- Lifecycle planner allowed result for `USUL_MUSNAH -> DIMUSNAHKAN`.
- Guarded transaction update requiring current canonical status to still be `USUL_MUSNAH`.
- Guarded MANUAL source update requiring source status to still be `USUL_MUSNAH`.
- Drift rejection with no update.
- Conflict response when guarded updates affect no rows.
- No file deletion.
- No snapshot clearing.
- No attachment row deletion.
- No file helper behavior changes.
- No workflow document business metadata changes.
- Safe response mapping only.

## 8. Stale File-Action Test Matrix

Future 12N.5 implementation must include focused tests:

| # | Scenario | Required assertion |
|---:|---|---|
| 1 | WORKFLOW `USUL_MUSNAH -> DIMUSNAHKAN`, then stale preview URL | Returns `410` or documented safe gone status; no file bytes or sensitive disclosure |
| 2 | WORKFLOW `USUL_MUSNAH -> DIMUSNAHKAN`, then stale download URL | Returns `410` or documented safe gone status; no file bytes or sensitive disclosure |
| 3 | MANUAL `USUL_MUSNAH -> DIMUSNAHKAN`, then stale preview URL | Returns `410` or documented safe gone status through canonical/source checks |
| 4 | MANUAL `USUL_MUSNAH -> DIMUSNAHKAN`, then stale download URL | Returns `410` or documented safe gone status through canonical/source checks |
| 5 | Unified detail for `DIMUSNAHKAN` | Metadata remains visible if authorized; file buttons/actions are absent |
| 6 | File deletion helper/import guard | No storage cleanup, unlink, rm, or delete helper import/call from unified lifecycle route |
| 7 | No-leak response checks | No path, token, storage root, SQL, env, raw row, raw attachment metadata, session/cookie, or secret in responses |
| 8 | MANUAL drift before approval | Returns `409`; no canonical or source update |
| 9 | Guarded update conflict | Returns `409`; no partial success response |
| 10 | Non-`USUL_MUSNAH` approval attempt | `approve_destruction` rejected unless current status is `USUL_MUSNAH` |

Additional route tests should cover:

- unauthenticated request returns `401`;
- non-Kasubag and `ADMIN`-only requests return `403`;
- cross-origin unsafe request is rejected before DB/file work;
- invalid confirmation is rejected before DB mutation;
- malformed/extra body fields are rejected by strict Zod validation.

## 9. No Physical File Deletion Policy

Unified lifecycle destruction in 12N must mean:

```text
DIMUSNAHKAN = status-based server-side file-access denial
```

It must not mean:

- physical file deletion;
- storage cleanup;
- snapshot clearing;
- attachment row deletion;
- file migration;
- file copy;
- file backfill;
- file sync;
- old file/data recovery.

The existing legacy proposal approval route has separate physical deletion behavior. That legacy behavior remains untouched in this phase and must not be treated as the unified lifecycle policy.

Old physical file cleanup or destruction must be deferred to a separate human-approved cleanup/storage phase.

## 10. Future Phase Split

Preferred split:

1. **12N.5 - Implement `approve_destruction` API only**
   - Canonical-only Option 1 if human accepts the governance tradeoff.
   - No UI.
   - No file deletion.
   - No snapshot clearing.
   - Include stale file-action tests.
   - Either no-audit with documented limitation or delay until audit policy is approved.

2. **12N.6 - Add `cancel_proposal` API if approved**
   - `USUL_MUSNAH -> INAKTIF` only.
   - No `restore_active`.
   - No transition from `DIMUSNAHKAN`.

3. **12N.7 - Add lifecycle UI buttons**
   - Use canonical detail route only.
   - Keep server checks authoritative.
   - Use explicit confirmation wording for destruction.

4. **12N.8 - Legacy proposal route compatibility cleanup plan**
   - Decide whether to keep, redirect, hide, or refactor legacy proposal pages/routes.
   - Keep physical deletion behavior separated until a cleanup/storage phase is approved.

5. **12O - Aggregate/export**
   - Metadata-only by default.

6. **12P-dev - Development data/storage cleanup**
   - Separate human-approved cleanup/storage scope only.

Fewer phases are not recommended because destruction approval, cancellation, UI affordances, legacy proposal compatibility, export, and storage cleanup have different risk profiles.

## 11. What Is Intentionally Not Changed

This phase does not:

- implement `approve_destruction`;
- implement `DIMUSNAHKAN` mutation;
- implement `cancel_proposal`;
- implement `restore_active`;
- add lifecycle UI buttons;
- modify the unified lifecycle API route;
- modify legacy proposal-based Usul Musnah routes;
- delete physical files;
- cleanup storage;
- clear `lampiran_snapshot`;
- change preview/download behavior;
- change file access helpers;
- run live DB reports;
- run live backfill;
- run cleanup;
- create audit tables;
- write audit logs;
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

## 12. Validation

Required validation for this documentation-only phase:

```bash
git diff --check
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

Broad tests, build, E2E, migrations, seeds, route generation, live DB reports, cleanup, and destructive tests are intentionally not required for this docs-only phase.

## 13. Next Phase Recommendation

Proceed to:

```text
Phase 12N.5 - Unified approve_destruction API Only
```

Recommended 12N.5 constraints:

- implement only `POST /api/arsiparis/arsip/$id/lifecycle` action `approve_destruction`;
- use canonical-only Option 1 only if human accepts bypassing legacy proposal governance;
- require explicit confirmation stronger than boolean;
- require or explicitly decide reason policy;
- keep audit no-write limitation documented or delay until audit policy is approved;
- use guarded transaction updates;
- sync linked MANUAL source status in the same transaction;
- reject drift/missing source;
- no physical file deletion;
- no snapshot clearing;
- no file helper changes;
- no UI buttons;
- no legacy proposal route changes;
- include stale file-action tests for WORKFLOW and MANUAL.

If the human does not accept canonical-only governance or no-audit limitation, delay 12N.5 and open a proposal/audit policy phase first.
