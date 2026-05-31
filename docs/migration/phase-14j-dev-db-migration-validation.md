# Phase 14J - Dev DB Reset/Migration Validation

Date: 2026-05-31

Status: completed for disposable local development database validation.

## Scope

Phase 14J validated the cleaned folder-first archive migration chain after Phase 14I removed the legacy canonical archive schema from active Drizzle/runtime code.

This was a development-only validation against the repo-configured disposable local PostgreSQL target. No feature behavior, schema design, package files, env files, Supabase artifacts, storage cleanup, or physical file deletion behavior was changed.

## Safety Preflight

Initial working tree check:

```text
git status --short --branch
```

Result:

```text
## migration/postgres-local...origin/migration/postgres-local [ahead 4]
```

No modified or untracked files were present. Git emitted only a user-level ignore-file permission warning.

Preflight audit commands run:

```text
git diff --check
git diff --name-only
git grep -n "canonical_arsip_id" src tests
git grep -n "canonicalArsipId" src tests
git grep -n "lampiran_snapshot" src tests
git grep -n "lampiranSnapshot" src tests
git grep -n "arsip_usul_musnah" src tests
git grep -n "arsipUsulMusnah" src tests
git grep -n "api/arsiparis/arsip" src tests
git grep -n "arsiparis/arsip" src tests
git grep -n "unified-archive" src tests
```

Results:

- `git diff --check` passed.
- `git diff --name-only` returned no files before validation/docs edits.
- `canonical_arsip_id` and `canonicalArsipId` appeared only in forbidden metadata handling and its route test.
- `lampiran_snapshot`, `lampiranSnapshot`, `arsip_usul_musnah`, and `arsipUsulMusnah` had no active `src` or `tests` matches.
- Removed legacy route/API/helper strings appeared only in absence assertions.

No env value, database URL, credential, token, cookie, storage root, physical path, logical path, SQL row dump, or secret was printed.

## Migration Chain Inspection

Inspected:

- `package.json`;
- `drizzle/meta/_journal.json`;
- `drizzle/0009_drop_legacy_canonical_archive_schema.sql`;
- active archive schema/service files listed in the Phase 14J prompt.

Findings:

- `_journal.json` includes `0009_drop_legacy_canonical_archive_schema`.
- `drizzle/0009_drop_legacy_canonical_archive_schema.sql` exists.
- 0009 drops only legacy canonical archive bridge objects and tables:
  - `arsip.berkas_arsip_item.canonical_arsip_id`;
  - `arsip.manual_arsip.canonical_arsip_id`;
  - `arsip.arsip_usul_musnah`;
  - `arsip.arsip`.
- 0009 does not drop active folder-first/source tables:
  - `arsip.berkas_arsip`;
  - `arsip.berkas_arsip_item`;
  - `arsip.manual_arsip`;
  - `arsip.manual_arsip_attachment`;
  - `arsip.manual_arsip_category`;
  - `arsip.master_klasifikasi_arsip`;
  - `dokumen.dokumen_transaksi`;
  - `dokumen.log_aktivitas`.

## Safe DB Target Confirmation

The repo-configured local migration environment was checked without printing values:

- `.env.migration` exists.
- `.env.migration` is gitignored.
- a database URL is present.
- the database target is local.
- the database name matches the expected development target name.
- the local Docker PostgreSQL container was present and healthy after reset.

The exact connection string, host value, credential values, and env values were not printed.

## Commands Run

Reset/recreate and migration commands:

```text
docker compose -f infra/docker/postgres/docker-compose.yml down
docker volume rm kepser_postgres_data
docker compose -f infra/docker/postgres/docker-compose.yml up -d
docker inspect --format "{{.State.Health.Status}}" kepser-postgres
pnpm db:local:migrate
```

Notes:

- The reset used the documented local Docker PostgreSQL volume path only.
- One Docker health check required escalated Docker access after sandbox Docker API permission failure.
- `pnpm db:local:migrate` completed successfully.
- `pnpm db:local:seed` was not run because schema validation did not require seed data.

## Schema Validation

Schema inspection used `information_schema` and returned only safe table/column names plus booleans/counts.

Confirmed present:

- `auth.users`;
- `auth.roles`;
- `auth.user_roles`;
- `auth.sessions`;
- `master.ketua_tim_assignments`;
- `master.master_detail_permintaan`;
- `master.master_fungsi`;
- `master.master_jenis_dokumen`;
- `master.master_jenis_permintaan`;
- `master.master_kategori_permintaan`;
- `master.master_kegiatan`;
- `master.master_kelengkapan_dokumen`;
- `dokumen.dokumen_transaksi`;
- `dokumen.log_aktivitas`;
- `arsip.berkas_arsip`;
- `arsip.berkas_arsip_item`;
- `arsip.manual_arsip`;
- `arsip.manual_arsip_attachment`;
- `arsip.manual_arsip_category`;
- `arsip.master_klasifikasi_arsip`.

Confirmed absent:

- `arsip.arsip`;
- `arsip.arsip_usul_musnah`;
- `arsip.arsip.lampiran_snapshot`;
- `arsip.manual_arsip.canonical_arsip_id`;
- `arsip.berkas_arsip_item.canonical_arsip_id`.

Safe table counts by schema after migration:

- `arsip`: 6 base tables.
- `auth`: 4 base tables.
- `dokumen`: 2 base tables.
- `master`: 8 base tables.

## Targeted Tests

Command run:

```text
pnpm test tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/manual-arsip-route.test.ts tests/unit/arsiparis/workflow-archive-route.test.ts tests/unit/arsiparis/berkas-arsip-schema.test.ts tests/unit/storage/internal-file-access.test.ts tests/unit/storage/local-storage-diagnostics.test.ts tests/unit/storage/admin-cleanup-orphan-files-route.test.ts tests/unit/storage/admin-analyze-storage-route.test.ts
```

Result:

- 10 test files passed.
- 206 tests passed.

No broad build, E2E, or dev server command was run.

## Behavior Boundaries

Unchanged:

- folder-first archive routes and APIs;
- folder lifecycle behavior;
- file access behavior;
- destroyed-file UX copy;
- physical deletion behavior;
- storage cleanup behavior;
- package files;
- env files;
- Supabase historical artifacts.

No secret/path/data dump was performed.

## Manual Smoke Checklist

Use a `KEPALA_SUB_BAGIAN_UMUM` user or a multi-role non-admin test account:

1. Log in.
2. Open `/arsiparis/berkas`.
3. Create or attach a manual document to an `OPEN` berkas.
4. Classify a completed workflow document through `Pengklasifikasian Dokumen`.
5. Close the berkas.
6. Move lifecycle `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`.
7. Verify metadata remains visible to authorized users.
8. Verify physical files are deleted after `Musnahkan Data` where applicable.
9. Verify preview/download shows `Data file sudah dimusnahkan`.
10. Verify CSV exports on `/arsiparis/berkas`, `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, and `/arsiparis/berkas/$id`.

## Next Recommendation

Proceed with human browser smoke on the reset local development database. If smoke passes, continue to the next scoped maintenance or feature phase without reintroducing legacy canonical archive runtime/schema surfaces.
