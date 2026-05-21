# Phase 11G.1 Backup/Restore Runbook

Date prepared: 2026-05-21.

Status: docs/runbook plus 11G.3 evidence handoff. This file provides templates for a human-run drill and now links to the dedicated 11G.3 evidence log. It does not execute PostgreSQL backup, PostgreSQL restore, local storage backup, local storage restore, LAN binding, firewall changes, deployment, tests, build, preview, migrations, seeds, or cleanup.

## Purpose And Scope

This runbook gives the operator a safe procedure for planning and later executing a paired backup and restore drill for the local DMS target:

- local PostgreSQL plus Drizzle schema;
- local `dms_session` auth;
- local filesystem storage configured by storage-root setting;
- no Supabase runtime, package, helper, or fallback path.

The intended execution phase is Phase 11G.3. Phase 11G.1 only prepares the operator-facing checklist and evidence template.

## Non-Goals And Safety Warnings

- Do not run the commands in this document without human review.
- Do not paste real secrets, DB URLs, cookie values, session tokens, file tokens, password hashes, or physical storage roots into docs, issue comments, screenshots, or chat.
- Do not commit dump files, storage archives, manifests with secrets, or operational screenshots containing secrets.
- Keep backup artifacts outside the repo or in a secure ignored operator folder.
- Do not copy, download, backfill, sync, recover, or restore old Supabase data or old Supabase Storage files.
- Do not overwrite the active runtime environment by default. Use a clean target for drills.
- Do not expose PostgreSQL broadly to LAN as part of backup/restore work.
- Do not run migrations or seeds during restore unless a later approved drill plan explicitly says so.
- Do not treat a successful backup/restore drill as final operational approval. 11H remains the human decision gate.

All command examples below are templates requiring human review before execution.

## Operator Prerequisites

Before running the later 11G.3 drill, the operator should confirm:

- the source app commit is known as `<APP_COMMIT>`;
- the active branch/version label is known without exposing secrets;
- PostgreSQL client tools are available on the operator machine;
- the operator can access the configured database without printing `<DATABASE_URL>`;
- the operator can read the local storage root without printing the real value;
- a secure `<BACKUP_DIR>` exists outside committed source;
- the restore target is clean and separate from the active runtime;
- app login credentials for local test users are available through the approved human-controlled channel;
- admin access exists for `/api/admin/analyze-storage` and dry-run cleanup review;
- the operator understands that file-count/hash manifests are optional operational enhancements, not 11G.1 blockers.

## Required Backup Artifacts

Every backup set should keep DB, storage, and metadata together:

| Artifact | Required | Notes |
|---|---:|---|
| PostgreSQL dump | Yes | Custom-format or plain SQL. |
| Local storage archive/copy | Yes | Preserve relative logical-path structure under `<STORAGE_ROOT>`. |
| Backup manifest metadata | Yes | Use placeholders and config key names only. |
| Timestamp | Yes | Use a single `<TIMESTAMP>` for the set when practical. |
| App commit hash | Yes | Record `<APP_COMMIT>`. |
| App version/branch | Yes | Record branch/version label, not secrets. |
| Package metadata reference | Yes | Record lockfile hash/reference or package metadata reference. |
| Non-secret config names | Yes | Include names only, not values. |
| Storage root config key name | Yes | Record `DMS_LOCAL_STORAGE_ROOT`, not its physical value. |
| Backup operator | Yes | Human/operator name or initials. |
| Backup environment | Yes | Example: local drill source, staging-like local target. |
| Verification status | Yes | Planned, created, restore-tested, blocked, or needs review. |
| File count/hash manifest | Optional | Useful for larger datasets, not mandatory for 11G.1. |

Backup set naming template:

```text
dms-local-<TIMESTAMP>-<APP_COMMIT>
```

## PostgreSQL Backup Template

Use one of the following reviewed templates. Do not paste real credentials into shell history, screenshots, or docs. Prefer environment or credential handling managed by the operator, without printing values.

Custom-format dump:

```powershell
pg_dump -Fc --dbname "<DATABASE_URL>" --file "<BACKUP_DIR>\dms-db-<TIMESTAMP>.dump"
```

Plain SQL dump:

```powershell
pg_dump --dbname "<DATABASE_URL>" --file "<BACKUP_DIR>\dms-db-<TIMESTAMP>.sql"
```

Optional database-name form when the operator uses local auth/host config outside the command:

```powershell
pg_dump -Fc --dbname "<DB_NAME>" --file "<BACKUP_DIR>\dms-db-<TIMESTAMP>.dump"
```

Safety notes:

- Verify the source database before dumping.
- Do not commit `.dump`, `.sql`, `.tar`, `.zip`, `.7z`, or manifest files with environment values.
- Avoid command forms that expose passwords in process lists, terminal transcripts, or shell history.
- Keep the DB dump and storage archive in the same backup set.

## Storage Backup Template

The storage backup must preserve relative logical paths as the application sees them. The operator should archive or copy the contents addressed by the configured storage root, but should not publish or write the real physical path into documentation.

PowerShell archive template:

```powershell
Compress-Archive -Path "<STORAGE_ROOT>\*" -DestinationPath "<BACKUP_DIR>\dms-storage-<TIMESTAMP>.zip"
```

PowerShell copy template for a folder-style backup:

```powershell
Copy-Item -Path "<STORAGE_ROOT>\*" -Destination "<BACKUP_DIR>\storage-<TIMESTAMP>" -Recurse
```

Optional file count template:

```powershell
Get-ChildItem -Path "<STORAGE_ROOT>" -Recurse -File | Measure-Object
```

Optional hash manifest template:

```powershell
Get-ChildItem -Path "<STORAGE_ROOT>" -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv "<BACKUP_DIR>\storage-hashes-<TIMESTAMP>.csv" -NoTypeInformation
```

Cross-platform note:

```text
Use a platform-appropriate archive tool that preserves the directory tree below <STORAGE_ROOT>.
```

Safety notes:

- Do not alter current storage while creating the backup.
- Do not serve or inspect files by physical path in evidence.
- Verify selected files through app preview/download after restore, not by direct physical path.
- Do not include old Supabase file recovery in this backup set.

## Metadata Manifest Template

Create a manifest beside the dump and storage archive. Keep it free of secrets and real physical paths.

```yaml
backup_id: dms-local-<TIMESTAMP>-<APP_COMMIT>
created_at: <TIMESTAMP>
operator: <OPERATOR>
source_environment: <BACKUP_ENVIRONMENT>
app_commit: <APP_COMMIT>
branch: migration/postgres-local
app_version_label: <APP_VERSION_OR_PHASE>
package_metadata_reference: <PACKAGE_LOCK_HASH_OR_REFERENCE>
database:
  dump_file: dms-db-<TIMESTAMP>.dump
  dump_format: custom
  database_name: <DB_NAME>
  config_key_names:
    - DATABASE_URL
storage:
  archive_file: dms-storage-<TIMESTAMP>.zip
  root_config_key_name: DMS_LOCAL_STORAGE_ROOT
  storage_file_count: <COUNT_OR_NOT_RECORDED>
  hash_manifest_file: <OPTIONAL_HASH_MANIFEST_OR_NOT_RECORDED>
auth_and_file_token_config_key_names:
  - SESSION_SECRET
  - DMS_FILE_TOKEN_SECRET
app_config_key_names:
  - APP_URL
  - HOST
  - PORT
database_row_count_summary:
  dokumen_transaksi: <COUNT_OR_NOT_RECORDED>
  arsip: <COUNT_OR_NOT_RECORDED>
  log_aktivitas: <COUNT_OR_NOT_RECORDED>
notes: <NON_SECRET_NOTES>
verification_status: planned
restore_drill_status: not_run
```

If a plain SQL dump is used, update `dump_file` and `dump_format` accordingly.

## Restore-To-Clean-Target Template

The default drill target is a clean local target, not the active runtime. The operator should verify the restore target before every restore command.

Preparation:

1. Stop the app or use a separate clean target.
2. Confirm the target database is the intended clean restore target.
3. Confirm the target storage root is empty or intentionally prepared for the drill.
4. Confirm environment/config points to the restore target without printing values.
5. Confirm migrations/seeds are not part of this restore unless the later drill plan explicitly calls for them.

Custom-format restore template:

```powershell
pg_restore --dbname "<DATABASE_URL>" --clean --if-exists "<BACKUP_DIR>\dms-db-<TIMESTAMP>.dump"
```

Alternative custom-format restore into database-name target:

```powershell
pg_restore --dbname "<DB_NAME>" --clean --if-exists "<BACKUP_DIR>\dms-db-<TIMESTAMP>.dump"
```

Plain SQL restore template:

```powershell
psql --dbname "<DATABASE_URL>" --file "<BACKUP_DIR>\dms-db-<TIMESTAMP>.sql"
```

Storage restore from archive template:

```powershell
Expand-Archive -Path "<BACKUP_DIR>\dms-storage-<TIMESTAMP>.zip" -DestinationPath "<STORAGE_ROOT>"
```

Storage restore from folder copy template:

```powershell
Copy-Item -Path "<BACKUP_DIR>\storage-<TIMESTAMP>\*" -Destination "<STORAGE_ROOT>" -Recurse
```

After restore, the operator starts the app manually, logs in, and performs the validation checklist below.

## Restore Validation Checklist

Representative/sample document verification is acceptable for 11G.3 unless a later phase explicitly requires exhaustive full-storage verification.

| Check | Expected evidence | Result |
|---|---|---|
| Target confirmed clean before restore | Operator note, no secrets | TODO |
| PostgreSQL restore attempted on intended target | Manifest/evidence note | TODO |
| Storage restored to configured target root | Config key confirmed, no physical path printed | TODO |
| App config points at restored DB/storage target | Key names only | TODO |
| App starts manually | Operator note | TODO |
| Login works | Role/user class noted, no password/token shown | TODO |
| Document list loads | Route and role noted | TODO |
| Valid active document preview works | Representative doc id or safe label | TODO |
| Valid active document download works | Representative doc id or safe label | TODO |
| Missing old files fail cleanly if encountered | Error category, no physical path | TODO |
| `DIMUSNAHKAN` archive access is blocked | 403/404/410 or UI-safe blocked result | TODO |
| `/api/admin/analyze-storage` runs | Summary only, no physical path | TODO |
| Admin cleanup dry-run reviewed | Dry-run only; no destructive cleanup | TODO |
| Referenced files are not listed as orphan | Representative result | TODO |
| Blockers recorded | Link or notes | TODO |

## DB/Storage Alignment Checks

After restore, validate DB metadata against app-visible storage behavior:

- Selected `dokumen_transaksi.lampiran_urls` logical paths should preview/download through the app when the document is active and the role is authorized.
- Selected `arsip.lampiran_snapshot` retained references should remain present and accessible only when lifecycle rules allow access.
- Archives marked `DIMUSNAHKAN` must block preview/download even if stale files exist after restore.
- `missing_referenced` diagnostics must be interpreted carefully. Destroyed archive snapshots or intentionally absent files may need separate classification and must not trigger metadata deletion by default.
- Admin cleanup dry-run must not list referenced current document files or retained archive snapshot files as orphan candidates.
- Unsupported, unsafe, legacy URL-like, and missing metadata categories are diagnostic categories, not automatic delete approval.

## DIMUSNAHKAN Access Validation

For at least one representative destroyed archive where safe test data exists:

1. Open the archive or related document through an authorized role.
2. Attempt preview/download through normal UI/API flow.
3. Confirm access is blocked by lifecycle state.
4. Confirm no physical storage root or file path appears in the UI or evidence.
5. Record status code or UI message category only.

If no representative destroyed archive exists in the drill dataset, record `not_available_in_dataset` and do not fabricate evidence.

## Storage Diagnostics Dry-Run Validation

Run diagnostics only in the later human drill:

```text
GET /api/admin/analyze-storage
```

Review cleanup in dry-run/report-only mode only:

```text
GET /api/admin/cleanup-orphan-files
```

Dry-run interpretation:

- `missing_referenced` means a DB reference points to a file that diagnostics could not find. Investigate lifecycle and dataset history before changing metadata.
- Destroyed archive records may intentionally differ from active document expectations.
- `orphan_paths` should not contain referenced `dokumen_transaksi.lampiran_urls` paths or retained `arsip.lampiran_snapshot` paths.
- Do not run destructive cleanup as part of the 11G.3 restore drill unless a separate approved phase explicitly authorizes it.

## Rollback Pairing Rules

- Treat the DB dump and storage archive as an inseparable pair.
- Avoid mixing a DB dump from one time with a storage backup from another time.
- If rolling back the app commit changes schema, storage semantics, file-token behavior, or auth/session behavior, verify compatibility before starting the app.
- Keep the previous known-good backup set until restore validation passes and blockers are reviewed.
- Rollback requires human approval and should name the selected `<APP_COMMIT>`, DB dump, storage archive, and manifest.
- Do not use old Supabase data/files as a rollback source.

## Evidence Log Template

Dedicated 11G.3 evidence log:

- `docs/migration/phase-11g-backup-restore-evidence.md`

Current evidence status: pending. No human backup/restore drill output has been provided yet, so the evidence log is a template plus missing-evidence checklist and the decision remains `PARTIAL`.

| Date/time | Operator | Source commit | Backup id | Backup result | Restore target | Restore result | Login result | Document list result | Preview/download result | DIMUSNAHKAN blocking result | Storage diagnostics result | Blockers | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TODO | TODO | `<APP_COMMIT>` | `dms-local-<TIMESTAMP>-<APP_COMMIT>` | TODO | Clean local target | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO |

Evidence rules:

- Record command names and high-level result only.
- Do not paste DB URLs, physical storage roots, secrets, tokens, cookie values, password hashes, or raw dump/storage paths.
- Redact screenshots before storing them.
- Record blockers without trying destructive cleanup unless separately approved.

## Known Blockers And Deferred Items

- Backup schedule and retention remain open; this runbook does not invent mandatory rotation policy.
- File-count/hash manifests are useful but optional for 11G.1.
- LAN binding and client smoke remain Phase 11G.4.
- Cookie auth, CSRF, and rate-limit posture remain Phase 11G.5.
- Rollback consolidation and final handoff remain Phase 11G.6.
- Performance baseline and asset hygiene planning remain Phase 11G.2.
- Archive scheduler replacement remains a separate open migration decision.
- App containerization remains deferred.

## Handoff To 11G.3

Next recommended phase:

```text
11G.3 follow-up - complete backup/restore evidence
```

Rationale: Phase 11G.2a clean preview Lighthouse evidence is already recorded. Phase 11G.3 now has a dedicated evidence log, but no human backup/restore drill evidence has been provided yet.

The human executes the selected templates, then Codex records evidence from the human-provided results without running backup/restore commands itself. Do not proceed to 11G.4 until 11G.3 evidence is complete enough to classify as PASS.
