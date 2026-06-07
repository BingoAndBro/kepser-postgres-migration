# Phase 15L.3C.5B - Controlled Dev Archive Data Reset for Clean Berkas Activity Timeline

Date: 2026-06-07

## 1. Status

Implemented as a development-only, confirmation-gated helper plus focused unit tests and documentation.

This phase runs dry-run only. It does not execute destructive cleanup, delete database rows, delete physical files, change schema/migrations, change package/env files, change routeTree, add routes/UI, commit, or push.

This is local development cleanup governance only. It is not production cleanup guidance, go-live approval, operational certification, security certification, or compliance validation.

## 2. Reason

Phase 15L.3C.5A added the authoritative append-only `arsip.berkas_arsip_activity` foundation. Existing local development archive rows were not backfilled, so old berkas rows may still require fallback timeline rendering.

The approved direction is to reset disposable local archive development rows, then create new manual QA data from scratch so every new lifecycle/document-entry event writes authoritative berkas activity events.

## 3. Helper

New server-only helper:

```text
src/lib/archive/phase15-berkas-activity-dev-reset-analysis.ts
```

Exports:

- `PHASE15_BERKAS_ACTIVITY_DEV_RESET_CONFIRMATION`
- `analyzePhase15BerkasActivityDevReset`
- `resetPhase15BerkasActivityDevData`

Dry-run is the default. Destructive mode requires exact confirmation:

```text
RESET DEV ARCHIVE DATA FOR AUTHORITATIVE BERKAS ACTIVITY LOG
```

Wrong or missing confirmation returns `status='confirmation_required'` before repository access or mutation.

Execution is also refused when `NODE_ENV='production'`.

## 4. DB Reset Scope

The active Drizzle schema no longer has legacy canonical archive lifecycle/proposal tables. The current folder-first reset scope is:

- `arsip.berkas_arsip_activity`
- `arsip.berkas_arsip_item`
- `arsip.berkas_arsip`
- `arsip.manual_arsip_attachment`
- `arsip.manual_arsip`

Execution order is FK-safe for current active schema:

```text
berkas_arsip_activity
-> berkas_arsip_item
-> manual_arsip_attachment
-> manual_arsip
-> berkas_arsip
```

`archive_lifecycle_or_proposal` is reported as `0` because no separate active schema table is present.

## 5. Preserved Data

The helper preserves by policy:

- workflow source documents;
- workflow approval history;
- auth users/sessions/RBAC data;
- master data;
- fungsi/kegiatan;
- master klasifikasi arsip;
- kelengkapan configuration;
- manual archive categories;
- file access/token logic;
- storage files and storage metadata outside the scoped DB rows.

The helper reports `workflow_source_documents_referenced_by_berkas_items` as a count-only preserved aggregate and always reports zero deleted rows for protected categories.

## 6. Safe DTO

The helper returns aggregate counts only:

- `would_delete_rows_by_table`
- `deleted_rows_by_table`
- `preserved_counts`
- `physicalFileDeletionPerformed`
- controlled warning labels

It must not return row ids, raw rows, logical paths, physical paths, storage roots, SQL details, SQL parameters, env values, database URLs, tokens, cookies, session values, password hashes, or secrets.

## 7. Physical Files

Physical file deletion is out of scope.

Required value:

```text
physicalFileDeletionPerformed: false
```

Any storage orphan cleanup after a DB reset must be a separate explicit phase with dry-run-first storage diagnostics and safe aggregate output.

## 8. Dry-Run Command

Dry-run command for local development review:

```powershell
$envFile = 'D:\GitHub\kepser-postgres-migration\.env'
foreach ($line in Get-Content -LiteralPath $envFile) {
  $trimmed = $line.Trim()
  if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) { continue }
  $separator = $trimmed.IndexOf('=')
  if ($separator -le 0) { continue }
  $key = $trimmed.Substring(0, $separator).Trim()
  $value = $trimmed.Substring($separator + 1).Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  [Environment]::SetEnvironmentVariable($key, $value, 'Process')
}
pnpm exec tsx -e "import { analyzePhase15BerkasActivityDevReset } from './src/lib/archive/phase15-berkas-activity-dev-reset-analysis.ts'; void (async () => { const result = await analyzePhase15BerkasActivityDevReset(); console.log(JSON.stringify(result, null, 2)); process.exit(0) })()"
```

The output must be reviewed as aggregate counts only. Do not execute destructive cleanup in Phase 15L.3C.5B.

## 9. Future Execution Command

Execution belongs to a separate future phase:

```text
Phase 15L.3C.5C - Execute Controlled Dev Archive Data Reset
```

Future execution command pattern:

```powershell
$envFile = 'D:\GitHub\kepser-postgres-migration\.env'
foreach ($line in Get-Content -LiteralPath $envFile) {
  $trimmed = $line.Trim()
  if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) { continue }
  $separator = $trimmed.IndexOf('=')
  if ($separator -le 0) { continue }
  $key = $trimmed.Substring(0, $separator).Trim()
  $value = $trimmed.Substring($separator + 1).Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  [Environment]::SetEnvironmentVariable($key, $value, 'Process')
}
pnpm exec tsx -e "import { PHASE15_BERKAS_ACTIVITY_DEV_RESET_CONFIRMATION, resetPhase15BerkasActivityDevData } from './src/lib/archive/phase15-berkas-activity-dev-reset-analysis.ts'; void (async () => { const result = await resetPhase15BerkasActivityDevData({ dryRun: false, confirmation: PHASE15_BERKAS_ACTIVITY_DEV_RESET_CONFIRMATION }); console.log(JSON.stringify(result, null, 2)); process.exit(0) })()"
```

Do not run that command until the future execution phase is explicitly approved after reviewing dry-run counts.

## 10. Tests

Focused unit test:

```text
tests/unit/arsiparis/berkas-activity-dev-reset.test.ts
```

Coverage:

- dry-run reports aggregate reset scope and does not call execution;
- wrong destructive confirmation rejects before repository access;
- exact-confirmation execution path remains DB-only and aggregate-only with injected repository.

## 11. Validation

Required validation:

```powershell
pnpm test tests/unit/arsiparis
pnpm test tests/unit/components/ui-foundation.test.ts
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

## 12. Safety Confirmation

- Dry-run only for this phase.
- No data deletion in this phase.
- No physical file deletion in this phase.
- No auth/master/user/fungsi/kegiatan/kelengkapan data deletion.
- No workflow source document deletion.
- No workflow approval history deletion.
- No schema, migration, package, env, routeTree, db, drizzle, or Supabase changes.
- No storage root/path/secret output is allowed.
- No commit or push is performed.
