# Phase 12N.9 - Archive-native Destruction Audit Planning

Date: 2026-05-25

Status: planned audit policy document. This phase is documentation-only and does not implement schema, migrations, audit writes, runtime lifecycle changes, or physical file deletion.

## 1. Scope And Boundary

Phase 12N.9 defines the future archive-native audit model for unified archive lifecycle actions, especially terminal destruction approval and future source-aware physical file deletion.

Reviewed surfaces:

- `docs/migration/phase-12n1-unified-archive-lifecycle-policy-inventory.md`
- `docs/migration/phase-12n4-destruction-approval-policy-and-safety-plan.md`
- `docs/migration/phase-12n5-unified-approve-destruction-api-only.md`
- `docs/migration/phase-12n7-destruction-approval-ui-plan.md`
- `docs/migration/phase-12n8-unified-destruction-approval-ui.md`
- `docs/migration/phase-12n8b-lifecycle-confirmation-copy-hardening.md`
- `src/routes/api/arsiparis/arsip/$id/lifecycle.ts`
- `src/routes/arsiparis/arsip/$id.tsx`
- `src/lib/archive/unified-archive-lifecycle.ts`
- `src/db/schema/arsip/arsip.ts`
- `src/db/schema/arsip/manual-arsip.ts`
- `src/db/schema/dokumen/log-aktivitas.ts`
- `src/db/schema/arsip/usul-musnah.ts`
- legacy proposal/destruction route inventory from 12N.1 and 12N.4

Security and domain boundaries:

- `dms_session` remains the authentication boundary.
- `dms_active_role` is UX-only and must not authorize audit or lifecycle mutation.
- Server/API RBAC remains authoritative.
- `KEPALA_SUB_BAGIAN_UMUM` is the operational archive lifecycle role.
- `ADMIN` remains a dedicated system/admin role and must not inherit operational archive destruction authority.
- Active Supabase runtime/package dependency is retired; historical Supabase artifacts remain.
- Future physical file deletion must preserve archive metadata and must not reintroduce Supabase fallback or old file/data recovery.

This phase does not change runtime source, lifecycle API behavior, unified detail UI, file access helpers, legacy proposal routes, schema, migrations, Drizzle definitions, package files, generated routes, database rows, storage files, audit writes, cleanup, backfill, report/export behavior, or physical file deletion.

## 2. Why Archive-native Audit Is Needed

`dokumen.log_aktivitas` is not sufficient as the long-term audit target for unified archive lifecycle actions.

Reasons:

- `dokumen.log_aktivitas` is workflow-document oriented. Its schema requires `dokumen_id`, which naturally points to `dokumen.dokumen_transaksi`.
- Manual Archive rows do not depend on `dokumen_transaksi`, and forcing them into workflow audit would violate the Manual Archive boundary.
- Unified lifecycle actions apply to canonical `arsip.arsip` rows by canonical archive id, not only to workflow document ids.
- `approve_destruction` is now canonical-only and does not require a legacy `arsip_usul_musnah` proposal row.
- Destructive lifecycle actions need one consistent audit model across `source_type='WORKFLOW'` and `source_type='MANUAL'`.
- Future physical file deletion must remain traceable even though files may be removed from storage.
- Audit must preserve metadata and accountability after file deletion without storing sensitive file paths, raw rows, or token data.

Current no-audit behavior for `approve_destruction` is accepted only as a development/local-LAN limitation. It should not be treated as the final governance model.

## 3. Audit Action Scope

Required future audit actions:

| Action | Status movement or event | Required audit posture |
|---|---|---|
| `mark_inactive` | `AKTIF -> INAKTIF` | Audit accepted transition with previous and next status. |
| `propose_destruction` | `INAKTIF -> USUL_MUSNAH` | Audit proposal movement and actor. |
| `approve_destruction` | `USUL_MUSNAH -> DIMUSNAHKAN` | Audit terminal destructive approval with explicit reason and confirmation evidence. |
| `physical_file_deleted` | Future storage deletion event | Audit deletion outcome summary without paths. |
| `physical_file_delete_failed` | Future storage deletion failure event | Audit safe failure code and counts without paths. |

Optional/backlog action:

- `cancel_proposal` may be audited if a future human-approved phase implements it. It is not a required roadmap item for 12N.9 because cancellation was skipped/backlogged by the human.

Not in this phase:

- `restore_active`
- transition out of `DIMUSNAHKAN`
- legacy proposal route replacement
- aggregate/export audit
- storage cleanup execution

## 4. Proposed Audit Fields

Recommended future archive-native audit table fields:

| Field | Suggested type/shape | Purpose |
|---|---|---|
| `id` | UUID primary key | Stable audit row id. |
| `archive_id` or `arsip_id` | UUID, not null | Canonical `arsip.arsip.id`. |
| `source_type` | `WORKFLOW` or `MANUAL` | Source family at audit time. |
| `source_id` | UUID nullable | `dokumen_id` for WORKFLOW if available; `manual_arsip.id` for MANUAL if available. |
| `action` | controlled text/enum | `mark_inactive`, `propose_destruction`, `approve_destruction`, `physical_file_deleted`, `physical_file_delete_failed`. |
| `previous_status_arsip` | controlled text nullable | Status before lifecycle transition. |
| `next_status_arsip` | controlled text nullable | Status after lifecycle transition. |
| `actor_user_id` | UUID not null | User who initiated or approved the action. |
| `actor_role_used` or `actor_role_snapshot` | controlled text | Expected value for lifecycle mutation: `KEPALA_SUB_BAGIAN_UMUM`. |
| `reason` | text nullable | Human reason, required for `approve_destruction` and recommended for future physical deletion. |
| `confirmation_phrase_matched` | boolean nullable | Whether exact destructive phrase validation passed. |
| `confirmation_type` | controlled text nullable | Alternative or complement to boolean, for example `EXACT_PHRASE`. |
| `created_at` | timestamptz not null | Audit creation timestamp. |
| `request_context` | bounded JSON nullable | Optional safe request marker, user agent, or IP hash if policy allows. |
| `result` | controlled text | `success`, `failed`, or `partial`. |
| `error_code` | controlled text nullable | Safe enum only, for example `manual_status_drift`, `guarded_update_conflict`, `file_not_found`, `delete_failed`. |
| `physical_deletion_summary` | bounded JSON nullable | Future safe counts only: attempted, deleted, failed, skipped, already missing. |
| `notes` or `metadata_json` | bounded JSON nullable | Optional safe extension payload with size and key allowlist. |

The audit table should be append-only by application contract. A future schema phase should decide whether database-level triggers are needed to reject update/delete.

## 5. Excluded Sensitive Fields

Future audit rows, responses, UI history, logs, and docs must not store or expose:

- physical filesystem paths
- storage roots
- logical storage paths
- signed tokens or signed token internals
- file access tokens
- raw attachment metadata
- raw database rows
- SQL text or SQL parameters
- environment values
- database URLs
- secrets
- session tokens or cookie values
- password hashes or plaintext passwords
- physical deletion candidate names when they reveal storage location

Future audit should use safe counts, controlled enums, source type, canonical ids, source ids, actor ids, timestamps, and novice-friendly labels instead.

## 6. Transaction And Timing Policy

Lifecycle status update and audit insert should eventually happen in the same database transaction when the audited event is a database lifecycle transition.

Recommended lifecycle mutation timing:

1. Validate same-origin request.
2. Validate `dms_session`.
3. Require assigned `KEPALA_SUB_BAGIAN_UMUM`.
4. Validate route id and request body with Zod.
5. Reload canonical archive row.
6. Reload linked Manual Archive source row when `source_type='MANUAL'`.
7. Plan lifecycle transition.
8. In one DB transaction, guarded-update lifecycle status and insert the archive-native audit row.
9. Return a safe response containing canonical id, source type, previous status, and next status.

Future physical file deletion needs separate timing decisions because filesystem deletion is outside the database transaction.

Two acceptable future approaches:

- Option 1: write the lifecycle transition audit first, then run physical deletion as a separate step and insert one or more deletion outcome audit rows.
- Option 2: run a single orchestration that writes status and audit rows in the DB transaction, then writes compensating audit rows for filesystem success, failure, or partial completion.

Because file deletion cannot roll back with the database, future deletion audit must record attempted count, deleted count, failed count, already missing count if approved, and safe failure codes. It must not imply all files were deleted unless the source-aware deletion step confirms that outcome.

## 7. WORKFLOW Audit Policy

For `source_type='WORKFLOW'`:

- Audit canonical `arsip.arsip.id`.
- Audit source `dokumen_id` when available.
- Do not edit completed workflow document business metadata as part of archive lifecycle audit.
- Do not rely solely on `dokumen.log_aktivitas` for unified archive lifecycle audit.
- If a future compatibility decision still writes `dokumen.log_aktivitas` for WORKFLOW, it should be supplemental and must not replace the archive-native audit row.
- Preserve `arsip.lampiran_snapshot` as metadata even after future physical file deletion unless a later human-approved policy explicitly changes that.

## 8. MANUAL Audit Policy

For `source_type='MANUAL'`:

- Audit canonical `arsip.arsip.id`.
- Audit linked `manual_arsip.id` when available.
- Do not create or require `dokumen_transaksi` rows for audit.
- Do not write `dokumen.log_aktivitas` as the primary audit trail.
- Preserve `manual_arsip` metadata.
- Preserve `manual_arsip_attachment` rows by default.
- Source/canonical status drift should block lifecycle mutation as it does today. A future implementation may insert a failed/conflict audit row if policy approves logging failed attempts.
- Audit planning does not include Manual Archive attachment deletion.

## 9. Future Physical File Deletion Audit Policy

The human clarified final business goal:

```text
DIMUSNAHKAN should eventually delete physical files from storage to prevent storage growth, while archive metadata remains preserved.
```

Future physical file deletion should follow these audit rules:

- Physical deletion must preserve archive metadata.
- Physical deletion must not clear `lampiran_snapshot`.
- Physical deletion must not delete `manual_arsip_attachment` rows by default unless a later policy explicitly approves row deletion.
- Deletion must be source-aware for WORKFLOW snapshots and linked MANUAL attachment rows.
- Deletion audit should record safe counts and outcomes only.
- Deletion audit should not record physical paths, storage roots, logical storage paths, raw attachment metadata, or token data.
- Stale file access should remain safe `410` after `DIMUSNAHKAN` and after any physical deletion.
- Missing files should be handled safely. If policy approves, audit with a safe enum such as `already_missing` or `file_not_found`.
- Partial deletion must be auditable as `partial`, not reported as full success.
- Failed deletion must preserve metadata and provide safe remediation signals without leaking storage details.
- No Supabase fallback, old Supabase file recovery, data copy, backfill, sync, or old file recovery is expected.

Future physical deletion should be explicit and separately reviewed because the legacy proposal route currently combines proposal approval, snapshot clearing, workflow audit, and physical deletion in a way that is not the unified archive-native target.

## 10. User-facing Label Recommendations

Recommended novice-friendly Indonesian labels for future audit/history UI:

| Field or event | Label |
|---|---|
| created by | Dibuat oleh |
| archived by | Diarsipkan oleh |
| destroyed by | Dimusnahkan oleh |
| destroyed at | Tanggal dimusnahkan |
| destruction reason | Alasan pemusnahan |
| previous status | Status sebelumnya |
| next status | Status baru |
| file deletion result | Hasil penghapusan file |
| lifecycle action | Aksi lifecycle |
| source type | Sumber arsip |
| audit result | Hasil audit |
| partial deletion | Penghapusan file sebagian |
| failed deletion | Penghapusan file gagal |
| already missing | File sudah tidak ditemukan |

Future UI copy must not imply physical file deletion happened until the deletion phase actually performs and audits it.

## 11. Schema And Migration Considerations For Future Phase

A future schema-approved phase should decide:

- table name, for example `arsip.archive_lifecycle_audit` or `arsip.arsip_lifecycle_audit`;
- action/status enum strategy: DB check constraints, TypeScript constants, or both;
- indexes on `archive_id`, `source_type`, `source_id`, `action`, `actor_user_id`, and `created_at`;
- whether failed attempts are logged or only accepted state changes are logged;
- whether audit rows should reference `auth.users` with `no action` semantics to preserve history;
- whether `source_id` should be generic UUID or split into `dokumen_id` and `manual_arsip_id`;
- whether physical deletion summaries should use typed columns or bounded JSON;
- whether retention/destruction actor fields on `arsip.arsip` should be backfilled or kept separate from audit rows;
- whether database triggers should enforce append-only audit behavior;
- safe response DTOs and Zod schemas for future audit history reads.

No migration is created in 12N.9.

## 12. Future Implementation Requirements And Tests

Future audit implementation should require:

- centralized same-origin validation before unsafe audit-producing work;
- local `dms_session` auth;
- assigned `KEPALA_SUB_BAGIAN_UMUM` RBAC;
- `ADMIN`-only rejection for operational archive audit-producing lifecycle mutation;
- strict Zod validation for route id and request body;
- source-aware row reloads before mutation;
- guarded updates for lifecycle status transitions;
- same-transaction audit insert for database lifecycle transitions when possible;
- safe response DTOs with no sensitive fields;
- append-only audit write behavior;
- no physical deletion unless the future phase explicitly scopes it.

Recommended focused tests for the future audit phase:

| Area | Scenario | Expected assertion |
|---|---|---|
| WORKFLOW audit | `AKTIF -> INAKTIF` | audit row has archive id, source type, dokumen id, actor, previous status, next status. |
| WORKFLOW audit | `USUL_MUSNAH -> DIMUSNAHKAN` | audit row records reason and confirmation evidence without file deletion fields unless deletion ran. |
| MANUAL audit | linked MANUAL lifecycle transition | audit row has archive id, source type, manual source id, actor, previous status, next status. |
| MANUAL drift | source/canonical status mismatch | mutation rejected; optional failed audit row only if policy approves. |
| Auth/RBAC | unauthenticated, non-Kasubag, or ADMIN-only | no lifecycle mutation and no success audit row. |
| Same-origin | unsafe cross-origin request | rejected before DB/file work. |
| Validation | malformed id/body/extra fields | safe rejection and no success audit row. |
| Physical deletion future | partial deletion | audit summary has safe counts and `partial`, no paths. |
| Physical deletion future | missing file | safe enum only if policy approves, no path disclosure. |
| No-leak | audit read/response/error | no physical paths, storage roots, logical storage paths, tokens, raw attachment metadata, raw rows, SQL, env values, or secrets. |

## 13. What Is Intentionally Not Changed

This phase does not:

- create an audit table;
- create a migration;
- modify Drizzle schema;
- write audit logs;
- modify lifecycle API route behavior;
- modify unified detail page behavior;
- modify file access helpers;
- implement physical file deletion;
- cleanup storage;
- clear `lampiran_snapshot`;
- delete `manual_arsip_attachment` rows;
- delete physical files;
- modify legacy proposal routes;
- implement `cancel_proposal`;
- implement `restore_active`;
- implement transition out of `DIMUSNAHKAN`;
- create report/export features;
- modify package files;
- modify `db/`, `drizzle/`, or `supabase/`;
- modify `src/routeTree.gen.ts`;
- run route generation;
- run broad build or E2E;
- run migrations, seeds, cleanup, live DB reports, or destructive storage tests;
- reintroduce Supabase packages, clients, helpers, storage fallback, old file/data recovery, or Supabase runtime assumptions.

## 14. Validation

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

Tests are optional because this phase is docs-only/planning. Do not run broad build, E2E, DB migrations, seeds, route generation, cleanup, or destructive storage tests for this phase.

## 15. Next Phase Recommendation

Proceed next to the existing roadmap item:

```text
12N.10 or 12Q - Physical File Destruction Policy & Implementation
```

Recommended constraints:

- include physical file destruction policy before implementation;
- decide whether audit schema/migration is approved in the same phase;
- if audit schema is too risky to combine with physical deletion, ask the human before splitting scope;
- keep 12N.11, 12O, and 12P-dev unchanged;
- do not add extra roadmap phases without explicit human approval.

Future 12N.10/12Q may include archive-native audit schema only if the human approves combining audit storage with physical deletion. Otherwise, pause and ask before splitting audit schema into its own implementation phase.
