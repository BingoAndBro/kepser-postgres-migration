# Phase 11G.3 - Human-Run Backup/Restore Drill Evidence

Date/status: 2026-05-21, evidence pending.

This document records Phase 11G.3 backup/restore drill evidence for the clean local DMS target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no Supabase runtime, package, helper, fallback, old-data recovery, or old-file recovery.

Codex did not run backup, restore, database, Docker, firewall, package, build, preview, test, route-generation, deployment, cleanup, migration, seed, or endpoint commands for this evidence phase. The human/operator must run backup and restore commands manually and provide redacted evidence before this phase can pass.

## Evidence Source

| Source type | Status | Notes |
|---|---|---|
| Terminal output | Not provided | Do not paste secrets, DB URLs, tokens, cookie values, password hashes, env values, or physical storage roots. |
| Screenshots | Not provided | Redact screenshots before storing or summarizing them. |
| Manual operator notes | Not provided | Summaries are acceptable if they do not expose sensitive values or physical paths. |
| Summarized operator reporting | Not provided | Missing fields must stay `not recorded` or `pending`. |

Evidence source summary: no human backup/restore drill evidence was provided in this Codex turn.

## Backup Evidence

| Item | Evidence | Result | Notes |
|---|---|---|---|
| backup_id | pending | not recorded | Expected shape: `dms-local-<TIMESTAMP>-<APP_COMMIT>` or operator-selected non-secret equivalent. |
| backup timestamp | pending | not recorded | Record timestamp without exposing local paths. |
| operator | pending | not recorded | Human/operator name or initials. |
| source app commit | pending | not recorded | Record commit hash only. |
| source branch | `migration/postgres-local` | recorded from task context | Confirm during human drill. |
| PostgreSQL dump created | pending | not recorded | Human must report yes/no and high-level result only. |
| storage backup created | pending | not recorded | Human must report yes/no and high-level result only. |
| manifest created | pending | not recorded | Manifest must not contain secrets or physical storage roots. |
| package metadata reference recorded | pending | not recorded | Record lockfile hash/reference or package metadata reference only. |
| non-secret config key names recorded | pending | not recorded | Key names only, not values. |
| backup storage location | pending | not recorded | Record as redacted/operator-held, not a physical path. |
| backup result | pending | partial | No backup execution evidence was provided. |
| notes | pending | not recorded | Do not invent missing details. |

## Restore Evidence

| Item | Evidence | Result | Notes |
|---|---|---|---|
| restore target type | pending | not recorded | Expected default: clean local target. |
| target DB was clean before restore | pending | not recorded | Required for PASS. |
| PostgreSQL restore completed | pending | not recorded | Required for PASS. |
| storage restore completed | pending | not recorded | Required for PASS. |
| app pointed to restored target without printing values | pending | not recorded | Record key names only, not values. |
| app started | pending | not recorded | Required for PASS. |
| login works | pending | not recorded | Required for PASS. |
| document list loads | pending | not recorded | Required for PASS. |
| selected preview works | pending | not recorded | Required for PASS. |
| selected download works | pending | not recorded | Required for PASS. |
| missing old files fail cleanly | pending | not recorded | Use `not applicable` only if no missing-file case was encountered or selected. |
| `DIMUSNAHKAN` access blocked | pending | not recorded | Required for PASS when representative destroyed archive exists; otherwise record dataset limitation. |
| `/api/admin/analyze-storage` run | pending | not recorded | Human-run only; summary must not expose physical paths. |
| cleanup dry-run reviewed | pending | not recorded | Human-run only; dry-run/report-only. |
| destructive cleanup avoided during drill | pending | not recorded | Required safety check. |
| restore result | pending | partial | No restore execution evidence was provided. |
| notes | pending | not recorded | Missing restore validation prevents PASS. |

## DB/Storage Alignment Checks

Representative/sample verification is acceptable for 11G.3 unless a later phase explicitly requires exhaustive full-storage verification.

| Check | Evidence | Result | Notes |
|---|---|---|---|
| Selected `dokumen_transaksi.lampiran_urls` logical paths align with restored storage files | pending | not recorded | Validate through app preview/download, not by publishing physical paths. |
| Selected `arsip.lampiran_snapshot` references are handled correctly | pending | not recorded | Include lifecycle state in notes. |
| Destroyed archive snapshots are not treated as evidence of live file access | pending | not recorded | `DIMUSNAHKAN` remains the access authority. |
| No referenced files are listed as orphan in cleanup dry-run | pending | not recorded | Diagnostics findings require human review. |
| Missing referenced files are classified carefully and not auto-cleaned | pending | not recorded | Do not recommend destructive cleanup automatically. |

## Blockers

Current blocker:

- Human-run backup/restore drill evidence has not been provided.

Missing evidence required before PASS:

- backup id, timestamp, operator, source commit, and source branch;
- PostgreSQL dump created result;
- local storage backup created result;
- manifest created result with non-secret config key names and package metadata reference;
- backup storage location recorded as redacted/operator-held, not a physical path;
- clean restore target confirmation;
- PostgreSQL restore result;
- storage restore result;
- app configured to restored target without printing values;
- app start, login, document list, selected preview, and selected download validation;
- missing-file behavior if encountered or `not applicable` if not encountered;
- `DIMUSNAHKAN` access blocking validation or dataset limitation;
- `/api/admin/analyze-storage` summary;
- cleanup dry-run review summary;
- confirmation destructive cleanup was avoided during the drill;
- DB/storage alignment representative sample results.

## Decision

Decision classification: `PARTIAL`.

Rationale: no human backup/restore evidence was provided. Backup and restore validation are both unrecorded, so PASS is not allowed. No failure evidence was provided either, so this is not classified as FAIL/BLOCKER beyond the missing-evidence blocker.

PASS remains blocked until backup and restore both complete into a clean target and login/list/preview/download/`DIMUSNAHKAN`/diagnostics checks pass with DB/storage alignment evidence and no destructive cleanup needed.

## Next Phase

```text
11G.3 follow-up - complete backup/restore evidence
```

Do not proceed to Phase 11G.4 based on this pending evidence state. Phase 11G.4 becomes the next recommendation only after 11G.3 receives sufficient PASS evidence from the human/operator.

## Evidence Handling Rules

- Do not store secrets, env values, DB URLs, storage roots, password hashes, session tokens, file tokens, cookie values, or physical storage paths.
- If evidence includes sensitive values, record them as `redacted` or `provided privately by operator, not stored in docs`.
- Do not embed raw screenshots that expose sensitive values or local paths.
- Do not treat diagnostics findings as automatic cleanup approval.
- Do not claim LAN readiness, production readiness, release readiness, operational certification, or go-live approval from this drill.
