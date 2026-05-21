# Phase 11G.3 - Human-Run Backup/Restore Drill Evidence

Date/status: 2026-05-21, evidence recorded.

This document records Phase 11G.3 backup/restore drill evidence for the clean local DMS target:

- local PostgreSQL plus Drizzle;
- local `dms_session` auth;
- local filesystem storage;
- no Supabase runtime, package, helper, fallback, old-data recovery, or old-file recovery.

Codex did not run backup, restore, database, Docker, firewall, package, build, preview, test, route-generation, deployment, cleanup, migration, seed, or endpoint commands for this evidence phase. The evidence below comes from human-provided manual notes and summarized terminal output only.

## Evidence Source

| Source type | Status | Notes |
|---|---|---|
| Terminal output | Summarized by operator | Human summarized command results; raw output with paths/secrets is not stored. |
| Screenshots | Not provided | No screenshot evidence was embedded. |
| Manual operator notes | Recorded | Operator provided structured result notes. |
| Summarized operator reporting | Recorded | Sensitive values and physical paths are intentionally omitted. |

Evidence source summary: operator `Urek` provided manual notes and summarized terminal output for the 2026-05-21 backup/restore drill. Source commit is operator-held and recorded in the manifest, not reproduced in this document.

## Backup Evidence

| Item | Evidence | Result | Notes |
|---|---|---|---|
| backup_id | `dms-local-2026-05-21-110000` | recorded | Non-secret backup identifier. |
| backup timestamp | 2026-05-21 | recorded | Time component captured in backup id. |
| operator | Urek | recorded | Human operator. |
| source app commit | operator-held / recorded in manifest | recorded privately | Commit hash is not reproduced here. |
| source branch | `migration/postgres-local` | recorded | Matches selected migration branch. |
| PostgreSQL dump created | yes | pass | Human reported dump was recreated safely inside the PostgreSQL Docker container. |
| DB dump validation | `pg_restore -l` passed | pass | Human-reported validation only; Codex did not run `pg_restore`. |
| storage backup created | yes | pass | Storage backup was recreated as a matching pair with the DB dump. |
| storage file count | 13 | recorded | Count only; no file names or physical paths recorded. |
| manifest created | yes | pass | Manifest is operator-held and must not contain secrets or physical roots. |
| package metadata reference recorded | yes | pass | Non-secret package metadata reference recorded by operator. |
| non-secret config key names recorded | yes | pass | Key names only, not values. |
| backup storage location | operator-held/redacted | pass | No physical backup path recorded. |
| backup result | pass | pass | Human evidence supports backup PASS. |
| notes | Human reported DB dump was validated, copied to operator-held backup storage, and paired with matching storage backup. | recorded | No secrets or physical paths stored in docs. |

## Restore Evidence

| Item | Evidence | Result | Notes |
|---|---|---|---|
| restore target type | clean local target | pass | Human-reported clean target. |
| target DB was clean before restore | yes | pass | Required PASS condition recorded. |
| PostgreSQL restore completed | yes | pass | Human-reported. |
| storage restore completed | yes | pass | Human-reported. |
| restored storage file count | 13 | pass | Matches recorded backup storage count. |
| app pointed to restored target without printing values | yes | pass | Config values were not recorded. |
| app started | yes | pass | Serving mode was `dev`. |
| login works | yes | pass | Human-reported. |
| document list loads | yes | pass | Human-reported. |
| selected preview works | yes | pass | Human-reported. |
| selected download works | yes | pass | Human-reported. |
| missing old files fail cleanly | yes / not applicable / not recorded | accepted with caveat | Operator reported safe validation; exact dataset applicability is mixed. No blocker recorded. |
| `DIMUSNAHKAN` access blocked | yes / not recorded if no representative dataset | accepted with caveat | Operator reported safe validation; representative dataset availability is not fully specified. No blocker recorded. |
| `/api/admin/analyze-storage` run | yes | pass | Human-run only; Codex did not call endpoint. |
| cleanup dry-run reviewed | yes | pass | Human-run only; dry-run/report-only. |
| destructive cleanup avoided during drill | yes | pass | Required safety check recorded. |
| restore result | pass | pass | Human evidence supports restore PASS. |
| notes | Human reported all restore validation tests were safe. | recorded | No secrets, endpoint output, DB URLs, or physical paths stored. |

## DB/Storage Alignment Checks

Representative/sample verification is acceptable for 11G.3 unless a later phase explicitly requires exhaustive full-storage verification.

| Check | Evidence | Result | Notes |
|---|---|---|---|
| Selected `dokumen_transaksi.lampiran_urls` logical paths align with restored storage files | yes | pass | Human-reported representative validation. |
| Selected `arsip.lampiran_snapshot` references are handled correctly | yes / not recorded | accepted with caveat | Operator reported safe validation; exact sample detail not fully specified. |
| Destroyed archive snapshots are not treated as evidence of live file access | yes / not recorded | accepted with caveat | `DIMUSNAHKAN` remains the access authority; exact representative dataset not fully specified. |
| No referenced files are listed as orphan in cleanup dry-run | yes | pass | Human-reported diagnostics review. |
| Missing referenced files are classified carefully and not auto-cleaned | yes | pass | Human-reported. |
| Destructive cleanup avoided | yes | pass | Human-reported. |

## Blockers

None reported by the human operator for this bounded backup/restore drill.

Residual caveats:

- Source commit is recorded in the operator-held manifest and not reproduced here.
- Missing old-file and `DIMUSNAHKAN` checks were reported safe, but the exact representative dataset availability is not fully specified in the provided evidence.
- PASS means bounded operational recovery validation for the recorded drill only. It is not exhaustive full-system certification and does not imply LAN, production, release, or go-live readiness.

## Decision

Decision classification: `PASS`.

Rationale: human evidence records a paired PostgreSQL dump plus local storage backup, dump validation, restore into a clean local target, restored app startup, login, document-list, preview/download, diagnostics, cleanup dry-run review, destructive-cleanup avoidance, and representative DB/storage alignment checks. No blocker was reported.

## Next Phase

```text
Phase 11G.4 - LAN Binding And Client Smoke Evidence
```

Proceed only as a separate human-controlled phase. 11G.4 must not expose PostgreSQL broadly to the LAN by default, must avoid leaking host/port/firewall details that include secrets, and must not claim final operational approval.

## Evidence Handling Rules

- Do not store secrets, env values, DB URLs, storage roots, password hashes, session tokens, file tokens, cookie values, or physical storage paths.
- If evidence includes sensitive values, record them as `redacted` or `provided privately by operator, not stored in docs`.
- Do not embed raw screenshots that expose sensitive values or local paths.
- Do not treat diagnostics findings as automatic cleanup approval.
- Do not claim LAN readiness, production readiness, release readiness, operational certification, or go-live approval from this drill.
