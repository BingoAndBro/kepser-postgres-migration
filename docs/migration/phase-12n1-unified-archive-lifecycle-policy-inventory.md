# Phase 12N.1 - Unified Archive Lifecycle Policy And Route Inventory

Date: 2026-05-25

Status: planned inventory and policy document. This phase is documentation-only and does not implement archive lifecycle mutation.

## 1. Scope And Boundary

Phase 12N.1 inventories the current archive lifecycle surfaces and defines the target policy before any unified lifecycle mutation implementation.

Reviewed surfaces:

- canonical unified list APIs and pages for `AKTIF`, `INAKTIF`, and `USUL_MUSNAH`;
- canonical unified detail API/page `/api/arsiparis/arsip/$id` and `/arsiparis/arsip/$id`;
- legacy workflow-centric active/inactive/usul detail APIs and pages;
- existing workflow archive lifecycle mutation routes;
- existing Manual Archive source APIs, attachment APIs, and helper behavior;
- archive status constants, archive schema definitions, and focused unit-test coverage.

This phase does not change runtime source, route generation, schema, migrations, package files, database rows, storage files, file access behavior, lifecycle UI, export, aggregate behavior, cleanup, backfill, or canonicalization helpers.

Security boundary reminders:

- `dms_session` is the authentication boundary.
- `dms_active_role` is UX-only and must not authorize lifecycle mutation.
- Server/API RBAC is authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` is the operational archive role.
- `ADMIN`-only access must not be treated as operational archive access.
- Active Supabase runtime/package dependency remains retired; historical Supabase artifacts remain.

## 2. Existing Route/API Inventory

### Canonical Read-Only Unified Routes

| Route | File | Method | Affected source | Current auth/RBAC | Current status behavior | Writes `arsip.arsip` | Writes `manual_arsip` | Writes `dokumen_transaksi` | Writes proposal | Files/storage | Audit/log | Path/token/raw metadata exposure |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| `/api/arsiparis/aktif` | `src/routes/api/arsiparis/aktif.ts` | GET | WORKFLOW + linked MANUAL canonical rows | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | filters canonical `arsip.arsip.status_arsip='AKTIF'` | No | No | No | No | No | No | No known path/token exposure; safe mapped DTO |
| `/api/arsiparis/inaktif` | `src/routes/api/arsiparis/inaktif.ts` | GET | WORKFLOW + linked MANUAL canonical rows | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | filters canonical `arsip.arsip.status_arsip='INAKTIF'` | No | No | No | No | No | No | No known path/token exposure; safe mapped DTO |
| `/api/arsiparis/usul-musnah` | `src/routes/api/arsiparis/usul-musnah.ts` | GET | WORKFLOW + linked MANUAL canonical rows | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | filters canonical `arsip.arsip.status_arsip='USUL_MUSNAH'` | No | No | No | No | No | No | No known path/token exposure; safe mapped DTO |
| `/arsiparis/aktif` | `src/routes/arsiparis/aktif/index.tsx` | UI | WORKFLOW + linked MANUAL canonical rows | client fetches authorized API | read-only canonical list | No | No | No | No | No | No | No file action URLs; detail links use canonical id |
| `/arsiparis/inaktif` | `src/routes/arsiparis/inaktif/index.tsx` | UI | WORKFLOW + linked MANUAL canonical rows | client fetches authorized API | read-only canonical list | No | No | No | No | No | No | No file action URLs; detail links use canonical id |
| `/arsiparis/usul-musnah` | `src/routes/arsiparis/usul-musnah/index.tsx` | UI | WORKFLOW + linked MANUAL canonical rows | client fetches authorized API | read-only canonical list | No | No | No | No | No | No | No file action URLs; detail links use canonical id |
| `/api/arsiparis/arsip/$id` | `src/routes/api/arsiparis/arsip/$id.ts` | GET | canonical WORKFLOW or linked MANUAL | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | reads one canonical `arsip.arsip` row by id | No | No | No | No | Only if `action=preview/download` is present | No | Metadata DTO avoids paths/tokens/raw rows; action response streams file bytes only |
| `/arsiparis/arsip/$id` | `src/routes/arsiparis/arsip/$id.tsx` | UI | canonical WORKFLOW or linked MANUAL | client fetches authorized API | read-only canonical detail | No | No | No | No | Preview/download through authorized API only | No | Builds safe action URLs from canonical id + safe attachment ref |

### Legacy Workflow-Centric Detail And Lifecycle Routes

| Route | File | Method | Affected source | Current auth/RBAC | Current status behavior | Writes `arsip.arsip` | Writes `manual_arsip` | Writes `dokumen_transaksi` | Writes proposal | Files/storage | Audit/log | Path/token/raw metadata exposure |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| `/api/arsiparis/aktif/$id` | `src/routes/api/arsiparis/aktif.$id.ts` | GET | WORKFLOW-centric canonical `arsip.arsip` joined to `dokumen_transaksi` | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | requires canonical status `AKTIF` | No | No | No | No | No direct file access | No | Returns snapshot-derived attachment fields; legacy detail surface should be retired or scrubbed before reuse |
| `/arsiparis/aktif/$id` | `src/routes/arsiparis/aktif/$id.tsx` | UI | WORKFLOW-centric | client fetches legacy API | shows `AKTIF` detail and action | No | No | No | No | Preview uses workflow document preview endpoint | No | Receives signed-url style response from workflow preview endpoint; not canonical unified file action |
| `/api/arsiparis/aktif/$id/pindahkan` | `src/routes/api/arsiparis/aktif.$id/pindahkan.ts` | POST | currently WORKFLOW-oriented because audit requires `dokumen_id` | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM` | `AKTIF -> INAKTIF` on `arsip.arsip.status_arsip` | Yes | No | No | No | No | Inserts `log_aktivitas` with `PINDAHKAN_INAKTIF` | No known path/token exposure |
| `/api/arsiparis/inaktif/$id` | `src/routes/api/arsiparis/inaktif.$id.ts` | GET | WORKFLOW-centric canonical `arsip.arsip` joined to `dokumen_transaksi` | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | requires canonical status `INAKTIF` | No | No | No | No | No direct file access | No | Returns snapshot-derived attachment fields; legacy detail surface should be retired or scrubbed before reuse |
| `/arsiparis/inaktif/$id` | `src/routes/arsiparis/inaktif/$id.tsx` | UI | WORKFLOW-centric | client fetches legacy API | shows `INAKTIF` detail and action | No | No | No | No | Preview uses workflow document preview endpoint | No | Receives signed-url style response from workflow preview endpoint; not canonical unified file action |
| `/api/arsiparis/inaktif/$id/musnahkan` | `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts` | POST | currently WORKFLOW-oriented because audit requires `dokumen_id` | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM` | inserts proposal and sets `arsip.arsip.status_arsip: INAKTIF -> USUL_MUSNAH` | Yes | No | No | Yes, inserts `arsip_usul_musnah` | No | Inserts `log_aktivitas` with `PINDAHKAN_USUL_MUSNAH` | No known path/token exposure |
| `/api/arsiparis/usul-musnah/$id` | `src/routes/api/arsiparis/usul-musnah.$id.ts` | GET | proposal row + WORKFLOW-centric archive detail | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` | reads `arsip_usul_musnah` by proposal id | No | No | No | Reads proposal | No direct file access | No | Returns snapshot-derived attachment fields and raw snapshot field; should not be reused for unified safe detail |
| `/arsiparis/usul-musnah/$id` | `src/routes/arsiparis/usul-musnah/$id.tsx` | UI | proposal row + WORKFLOW-centric archive detail | client fetches legacy API | shows proposal detail and approval action | No | No | No | No direct write from UI | Preview uses workflow document preview endpoint | No | Receives signed-url style response from workflow preview endpoint; not canonical unified file action |
| `/api/arsiparis/usul-musnah/$id` | `src/routes/api/arsiparis/usul-musnah.$id.ts` | PATCH | proposal row + WORKFLOW-centric archive | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM`, Zod body `aksi='SETUJUI'` | proposal `MENUNGGU -> DISETUJUI`; archive `USUL_MUSNAH -> DIMUSNAHKAN`; clears snapshot | Yes | No | No | Yes, updates `arsip_usul_musnah` | Yes, prepares and deletes local snapshot files after DB update | Inserts `log_aktivitas` with `USUL_MUSNAH_SETUJUI` | Error payload includes safe counts/codes, but the route contains physical file deletion behavior and raw snapshot coupling |

### Manual Archive Source Routes

| Route | File | Method | Affected source | Current auth/RBAC | Current status behavior | Writes `arsip.arsip` | Writes `manual_arsip` | Writes `dokumen_transaksi` | Writes proposal | Files/storage | Audit/log | Path/token/raw metadata exposure |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| `/api/arsiparis/manual-arsip/categories` | `src/routes/api/arsiparis/manual-arsip/categories.ts` | GET | Manual Archive metadata | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` via helper | none | No | No | No | No | No | No | No known file/path/token exposure |
| `/api/arsiparis/manual-arsip` | `src/routes/api/arsiparis/manual-arsip/index.ts` | GET | `manual_arsip` source rows | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` via helper | optional source `status_arsip` filter | No | No | No | No | No | No | Safe metadata DTO; no attachment logical paths |
| `/api/arsiparis/manual-arsip` | `src/routes/api/arsiparis/manual-arsip/index.ts` | POST | Manual source + canonical MANUAL parent | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM` | creates source `status_arsip='AKTIF'` and linked canonical `source_type='MANUAL'` row in one transaction | Yes, creates canonical row | Yes, creates source and link | No | No | No file write unless later attachment upload | No archive lifecycle audit table currently | Safe metadata DTO; no file paths |
| `/api/arsiparis/manual-arsip/$id` | `src/routes/api/arsiparis/manual-arsip/$id.ts` | GET | `manual_arsip` source detail | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` via helper | reads source status | No | No | No | No | No | No | Safe metadata DTO with attachments but no logical paths/raw metadata |
| `/api/arsiparis/manual-arsip/$id` | `src/routes/api/arsiparis/manual-arsip/$id.ts` | PATCH | `manual_arsip` source and linked canonical MANUAL row when linked | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM` | only allows source `AKTIF`; non-`AKTIF` returns conflict | Yes, syncs linked canonical metadata for linked rows only | Yes, edits source metadata | No | No | No | No archive lifecycle audit table currently | Safe metadata DTO; no file paths |
| `/api/arsiparis/manual-arsip/$id/attachments` | `src/routes/api/arsiparis/manual-arsip/$id/attachments.ts` | POST | Manual source attachments | `requireSameOrigin`, `dms_session`, `KEPALA_SUB_BAGIAN_UMUM` | only allows parent source `AKTIF` | No | No parent status write; inserts attachment rows | No | No | Writes attachment content to local storage | No archive lifecycle audit table currently | Response omits logical paths |
| `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview` | `src/routes/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/preview.ts` | GET | Manual source attachment | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` via helper | blocks source `DIMUSNAHKAN` with `410` | No | No | No | No | Streams file through server | No | No known path/token exposure; no signed URL |
| `/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download` | `src/routes/api/arsiparis/manual-arsip/$id/attachments/$attachmentId/download.ts` | GET | Manual source attachment | `dms_session` + `KEPALA_SUB_BAGIAN_UMUM` via helper | blocks source `DIMUSNAHKAN` with `410` | No | No | No | No | Streams file through server | No | No known path/token exposure; no signed URL |
| `/arsiparis/penambahan-arsip` | `src/routes/arsiparis/penambahan-arsip.tsx` | UI | Manual Archive source rows | client fetches authorized APIs | create/edit/upload only where source allows; no lifecycle buttons | Via POST/PATCH APIs only | Via POST/PATCH/upload APIs | No | No | Preview/download via authorized Manual Archive APIs | No | UI uses server endpoints, not direct storage paths |

## 3. Current Authority Model

### WORKFLOW Archives

- Lifecycle status is stored on canonical `arsip.arsip.status_arsip`.
- Workflow archive creation writes `arsip.arsip.source_type='WORKFLOW'`, `dokumen_id`, canonical archive metadata, `status_arsip='AKTIF'`, and then updates `dokumen_transaksi.status` from `COMPLETED` to `ARCHIVED`.
- Existing lifecycle routes mutate `arsip.arsip.status_arsip` only after archive creation:
  - `POST /api/arsiparis/aktif/$id/pindahkan`: `AKTIF -> INAKTIF`.
  - `POST /api/arsiparis/inaktif/$id/musnahkan`: `INAKTIF -> USUL_MUSNAH` and creates an `arsip_usul_musnah` proposal.
  - `PATCH /api/arsiparis/usul-musnah/$id`: proposal `MENUNGGU -> DISETUJUI` and archive `USUL_MUSNAH -> DIMUSNAHKAN`.
- Existing lifecycle routes do not update completed workflow document business metadata, but they depend on `dokumen_id` for `log_aktivitas`, so they are currently workflow-oriented and unsafe for canonical MANUAL rows as-is.
- Unified list and unified detail read `arsip.arsip.status_arsip`.
- Unified WORKFLOW file access blocks from canonical `arsip.arsip.status_arsip='DIMUSNAHKAN'`, requires source type `WORKFLOW`, requires linked document status `COMPLETED` or `ARCHIVED`, and uses snapshot metadata only server-side.
- Older workflow detail pages use workflow document preview endpoints and may still render legacy file-action behavior. Those pages should not be the target lifecycle UI.

### MANUAL Archives

- Manual Archive has a source status on `arsip.manual_arsip.status_arsip`.
- New Manual Archive creates also create a linked canonical `arsip.arsip` row with `source_type='MANUAL'` and link it through `manual_arsip.canonical_arsip_id`.
- Manual Archive PATCH edits only `AKTIF` source rows. If linked, metadata is synced to the canonical MANUAL row in the same transaction.
- There is no observed Manual Archive lifecycle mutation route for `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`.
- Because both source and canonical tables have `status_arsip`, linked MANUAL rows can drift if future mutation updates only one side or if older/manual DB operations occurred.
- Unified list/detail use canonical `arsip.arsip.status_arsip`.
- Unified MANUAL file access first blocks canonical `DIMUSNAHKAN`, then loads the linked source and also blocks source `DIMUSNAHKAN`.
- Existing Manual Archive source preview/download blocks source `DIMUSNAHKAN` even outside unified detail.
- Existing Manual Archive edit/upload locks source rows once source status leaves `AKTIF`.

Transition authority rule for drift:

- For unified list/detail display, canonical `arsip.arsip.status_arsip` is the displayed lifecycle authority.
- For linked MANUAL source APIs, `manual_arsip.status_arsip` remains the source edit/upload/file guard.
- For any future lifecycle mutation on linked MANUAL rows, if canonical and source statuses differ before mutation, the safe default is to return a conflict and require human-reviewed remediation rather than choosing one status and mutating through drift.
- For file access, the effective status should be fail-closed: if either canonical or linked Manual source status is `DIMUSNAHKAN`, file access must be denied.

### Usul Musnah

- The unified `/arsiparis/usul-musnah` list is canonical archive-id based and reads `arsip.arsip.status_arsip='USUL_MUSNAH'`.
- The legacy `/arsiparis/usul-musnah/$id` detail/API is proposal-id based, where `$id` is `arsip_usul_musnah.id`, not canonical `arsip.arsip.id`.
- Existing destructive approval is tied to the proposal route and updates both the proposal row and the archive row.
- Existing destructive approval also clears `arsip.arsip.lampiran_snapshot` and attempts physical local file deletion. This behavior conflicts with the target 12N lifecycle-unification policy and must be isolated before any canonical lifecycle API is implemented.
- 12M.7/12M.8 unified detail file access blocks canonical `DIMUSNAHKAN` with `410`, including stale unified action URLs.

Proposal-route guard:

- Do not force immediate replacement of proposal-id routes with canonical archive-id routes.
- Future 12N work should either add a bridge/adapter from canonical archive id to active proposal id or keep destruction approval as a separate proposal-route compatibility path until a migration policy is approved.

## 4. Target Unified Lifecycle Policy

Target policy:

1. `arsip.arsip.status_arsip` is the primary unified lifecycle status for list/detail display and canonical lifecycle decisions.
2. During transition, source-specific status must be synced where a source table still owns operational locks.
3. WORKFLOW lifecycle actions must not edit completed document business metadata.
4. MANUAL lifecycle actions must lock Manual Archive parent metadata and attachment upload after leaving `AKTIF`.
5. `DIMUSNAHKAN` must block preview/download/file access server-side for WORKFLOW and MANUAL, including stale URLs/tokens/paths.
6. Metadata detail may remain visible for authorized `KEPALA_SUB_BAGIAN_UMUM`.
7. Lifecycle mutation must require `dms_session` plus assigned `KEPALA_SUB_BAGIAN_UMUM`.
8. `ADMIN`-only must not be treated as operational lifecycle access.
9. `dms_active_role` must never authorize lifecycle mutation.
10. Mutations must use POST or PATCH only. GET must remain read-only.
11. Unsafe methods must use the centralized same-origin guard.
12. Audit/log behavior must be approved before implementation.
13. Lifecycle unification must not delete physical files or perform storage cleanup unless a later approved cleanup/destruction phase explicitly scopes it.
14. Marking `DIMUSNAHKAN` means access blocked. It does not itself mean physical file deletion in 12N lifecycle unification.

## 5. Future API Proposal

Preferred future API shape for 12N.2+:

```text
POST /api/arsiparis/arsip/$id/lifecycle
```

Body:

```json
{
  "action": "mark_inactive",
  "reason": "optional reason"
}
```

Action values:

- `mark_inactive`
- `propose_destruction`
- `approve_destruction`
- `cancel_proposal`

Do not include `restore_active` by default. Restore/reactivation is not approved unless the domain explicitly approves it and tests cover the reversal semantics.

Route-level requirements:

- `$id` is canonical `arsip.arsip.id`.
- Require local session.
- Require assigned `KEPALA_SUB_BAGIAN_UMUM`.
- Reject `ADMIN`-only access.
- Use `requireSameOrigin`.
- Validate UUID and body with Zod.
- Return safe generic errors without paths, storage roots, raw rows, SQL, token internals, or attachment metadata.
- Do not write files or delete files.

## 6. Allowed Transitions

| Action | Required current canonical status | Target status | Source conditions | Canonical update | Source sync update | Proposal behavior | Audit/log requirement | Expected response |
|---|---|---|---|---|---|---|---|---|
| `mark_inactive` | `AKTIF` | `INAKTIF` | WORKFLOW: linked archive row may have `dokumen_id`; MANUAL: linked source must exist and match source status `AKTIF` | update `arsip.arsip.status_arsip` and lifecycle actor/timestamp fields if schema supports them | MANUAL: set `manual_arsip.status_arsip='INAKTIF'` and source lifecycle actor/timestamp if supported | none | append approved archive lifecycle audit record | `200` with safe canonical lifecycle DTO |
| `propose_destruction` | `INAKTIF` | `USUL_MUSNAH` | MANUAL linked source must match `INAKTIF`; WORKFLOW must not update document metadata | update canonical status | MANUAL: set source status `USUL_MUSNAH` | create or bridge to proposal row if proposal workflow remains required | append approved archive lifecycle audit record | `200` or `201` with safe proposal/canonical summary |
| `approve_destruction` | `USUL_MUSNAH` | `DIMUSNAHKAN` | proposal approval policy must be resolved first; linked MANUAL source must match `USUL_MUSNAH` | update canonical status and destruction metadata | MANUAL: set source status `DIMUSNAHKAN` and destruction metadata | if proposal exists, mark proposal decided in same transaction | append approved destructive audit record | `200`; no file deletion; stale file actions return `410` |
| `cancel_proposal` | `USUL_MUSNAH` | `INAKTIF` | only if cancellation/rollback is domain-approved; linked MANUAL source must match `USUL_MUSNAH` | update canonical status back to `INAKTIF` | MANUAL: sync source status back to `INAKTIF` | mark or close proposal as cancelled if supported | append approved cancellation audit record | `200` with safe lifecycle DTO |
| `restore_active` | not approved by default | not approved by default | not approved | not approved | not approved | not approved | not approved | reject unless future phase explicitly approves |

Terminal rule:

- No transition out of `DIMUSNAHKAN` unless a later human-approved policy explicitly allows it. Default is terminal.

## 7. Source Sync Policy

WORKFLOW:

- Canonical `arsip.arsip.status_arsip` is authoritative after archive creation.
- Do not update `dokumen_transaksi.status` during archive lifecycle actions after `ARCHIVED`.
- Do not edit workflow document business metadata during lifecycle actions.
- `log_aktivitas` currently supports workflow audit because it has `dokumen_id`, but this is not sufficient for MANUAL archives.

MANUAL:

- Linked MANUAL lifecycle mutations must update canonical and source rows in one DB transaction.
- A linked MANUAL mutation should require source and canonical statuses to match before applying the transition.
- If source and canonical statuses differ, return a safe `409` drift/conflict response and do not mutate either row.
- Unlinked legacy `manual_arsip` rows are outside unified canonical lifecycle mutation until remediation/canonicalization is approved.
- Existing source APIs may continue to use source status for edit/upload/file guards during transition.

Proposal bridge:

- Existing proposal-id routes should not be replaced abruptly.
- Future unified lifecycle API can create a proposal row and return both canonical archive id and proposal id, or keep `approve_destruction` behind a compatibility adapter that looks up the active proposal for a canonical archive id.
- If multiple active proposals exist for one archive, fail closed and require remediation.

## 8. DIMUSNAHKAN File Access Policy

Required behavior:

- `DIMUSNAHKAN` means server-side file access denied, not physical deletion.
- Unified WORKFLOW file action must check canonical `arsip.arsip.status_arsip`.
- Unified MANUAL file action must check canonical status and linked Manual source status.
- Existing Manual Archive source preview/download must continue checking source status.
- Raw document/storage token access must continue revalidating current archive state.
- Stale preview/download URLs must fail after destruction.
- Metadata detail may remain visible to authorized `KEPALA_SUB_BAGIAN_UMUM`.
- UI buttons must be hidden for destroyed archives, but server checks are mandatory.

Explicit non-policy for 12N:

- Do not clear attachment snapshots as part of lifecycle status mutation.
- Do not physically delete files as part of lifecycle unification.
- Do not expose file URLs, signed URLs, token internals, logical paths, physical paths, storage roots, or raw attachment metadata.

## 9. Audit/Log Policy Questions

Open decision before implementation:

- Should unified lifecycle changes write to `dokumen.log_aktivitas`, a new archive-specific audit table, or both?
- `log_aktivitas` requires a workflow document id and works poorly for MANUAL archives.
- A unified archive lifecycle audit model should support canonical archive id, source type, previous status, next status, actor user id, reason, proposal id when present, timestamp, and safe metadata.
- If `log_aktivitas` remains required for WORKFLOW compatibility, MANUAL lifecycle should still have an archive-native audit record.
- Destructive approval should require stronger audit semantics than normal status movement.

Do not implement lifecycle mutation until the audit target is approved.

## 10. Risk Classification

High risks:

- Status drift between `arsip.arsip.status_arsip` and `manual_arsip.status_arsip`.
- Existing Usul Musnah approval is proposal-id based while unified detail/list are canonical archive-id based.
- Existing destructive approval performs file deletion and snapshot clearing; target 12N policy separates status from storage deletion.
- `DIMUSNAHKAN` stale file access must remain blocked across unified, source-specific, raw token, and old workflow-preview routes.
- Current workflow lifecycle audit uses `log_aktivitas`, which does not naturally fit MANUAL archives.
- Legacy detail APIs return snapshot-derived attachment fields and one route returns a raw snapshot field; these should not be used as future unified policy surfaces.

Medium risks:

- Existing list pages are unified but old detail pages still exist with mutation buttons.
- Users may confuse proposal approval with direct archive lifecycle status transition.
- Old development data may contain unlinked Manual Archive rows or incomplete canonical links.
- Restore/reactivation semantics are not approved and could undermine terminal destruction semantics.
- Destructive UI wording currently implies file deletion. Future lifecycle wording must distinguish access blocking from storage cleanup.

Lower risks:

- Read-only canonical list/detail services already use safe DTO mapping.
- Focused tests already cover unified detail/file-action `DIMUSNAHKAN` blocking and Manual Archive source file-action blocking.
- Same-origin guards already exist on unsafe current routes.

## 11. Future Phase Split

Recommended split:

1. **12N.2 - Unified lifecycle helper foundation, no UI**
   - Add dependency-injected lifecycle planner/helper and tests only.
   - No route mutation yet.
   - Include drift detection, allowed-transition validation, auth-independent pure policy tests, and source sync plan output.

2. **12N.3 - Unified lifecycle API route for non-destructive transitions only**
   - Implement `POST /api/arsiparis/arsip/$id/lifecycle`.
   - Allow only `AKTIF -> INAKTIF` and `INAKTIF -> USUL_MUSNAH`.
   - Sync linked MANUAL source status in the same transaction.
   - Do not add UI buttons.
   - Do not implement `DIMUSNAHKAN`.

3. **12N.4 - Destruction approval transition with extra safety**
   - Decide proposal bridge first.
   - Implement `USUL_MUSNAH -> DIMUSNAHKAN` without physical file deletion.
   - Add stale file-action tests for WORKFLOW, linked MANUAL, source Manual Archive file routes, and raw token paths.

4. **12N.5 - Unified detail/list lifecycle UI integration**
   - Add buttons only after API behavior and tests are stable.
   - Use canonical detail route only.
   - Keep old workflow-centric detail pages out of the primary workflow.

5. **12N.6 - Compatibility cleanup plan for old status-specific routes/pages**
   - Decide whether to redirect, remove buttons, or retire legacy pages.
   - Do not remove routes until human smoke confirms canonical lifecycle behavior.

Safer adjustment:

- Split old destructive file deletion removal into a separate compatibility/hardening phase if the legacy proposal route must stay active during 12N.3/12N.4.

## 12. What Is Intentionally Not Changed

This phase does not:

- implement lifecycle mutation;
- add lifecycle API routes;
- modify existing lifecycle routes;
- modify unified detail file actions;
- add lifecycle buttons;
- add destruction UI;
- change preview/download behavior;
- change file access helpers;
- cleanup seed data;
- cleanup storage files;
- delete rows, tables, test data, or files;
- run live DB reports;
- run live backfill;
- call the 12L.18 mutation helper;
- call the 12L.19 dry-run helper;
- create canonical MANUAL rows;
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

## 13. Validation And Manual Retest Matrix

Documentation validation for this phase:

```bash
git diff --check
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

Future 12N implementation test matrix:

| Area | Scenario | Expected |
|---|---|---|
| Auth | unauthenticated lifecycle mutation | `401`, no DB/file work |
| RBAC | non-Kasubag or `ADMIN`-only lifecycle mutation | `403`, no DB/file work |
| Same-origin | unsafe cross-origin mutation request | rejected before DB/file work |
| Validation | malformed archive id/action/body | safe `400` or `404` |
| WORKFLOW | `AKTIF -> INAKTIF` | canonical status updates; document business metadata unchanged; audit written |
| WORKFLOW | `INAKTIF -> USUL_MUSNAH` | canonical status updates; proposal bridge policy honored; audit written |
| WORKFLOW | `USUL_MUSNAH -> DIMUSNAHKAN` | canonical status updates; no file deletion; stale file access returns `410` |
| MANUAL linked | status transition with matching source/canonical status | canonical and source statuses sync in one transaction |
| MANUAL drift | source/canonical status mismatch | `409`; no mutation |
| MANUAL unlinked | legacy source-only row | not accepted by unified canonical lifecycle API |
| File access | unified WORKFLOW stale preview/download after destruction | `410`, no path/token/root leak |
| File access | unified MANUAL stale preview/download after destruction | `410`, no path/token/root leak |
| File access | source Manual Archive preview/download after source destruction | `410`, no path/token/root leak |
| Raw token | stale raw/document token after archive destruction | blocked |
| Proposal | proposal id vs canonical id mismatch | safe not found/conflict; no mutation |
| Audit | all accepted transitions | approved audit target receives previous/next status and actor |

Manual retest after future implementation:

- Use redacted canonical archive ids and proposal ids in notes.
- Do not record env values, DB URLs, storage roots, logical paths, physical paths, file tokens, signed token internals, raw attachment metadata, raw DB rows, SQL params, session/cookie values, or secrets.
- Test WORKFLOW and linked MANUAL rows separately.
- Test old status-specific pages only as compatibility surfaces, not as the target UX.

## 14. Next Phase Recommendation

Proceed to:

```text
Phase 12N.2 - Unified Archive Lifecycle Helper Foundation, No UI
```

Recommended 12N.2 constraints:

- no route generation;
- no UI changes;
- no physical file deletion;
- no live DB report/backfill;
- no schema/migration changes unless the audit decision requires a separately approved schema phase;
- dependency-injected helper with mocked tests;
- explicit drift detection and proposal bridge planning before route implementation.

