# Phase 4B / 4B.1 Migration Apply Review

## Phase 4B Apply Attempt

Date/time: 2026-05-13.

Command attempted:

```bash
pnpm db:migrate
```

Visible result:

```text
drizzle-kit migrate
No config path provided, using default 'drizzle.config.ts'
Reading config file 'D:\GitHub\kepser-postgres-migration\drizzle.config.ts'
Using 'pg' driver for database querying
[...] applying migrations...
ELIFECYCLE Command failed with exit code 1.
```

No detailed PostgreSQL or Drizzle error was printed in the captured output.

## Environment And Config Findings

Docker/PostgreSQL status:

- `kepser-postgres` is running and healthy.
- `pg_isready -U kepser -d kepser` returns accepting connections.
- Host TCP access to `localhost:5432` succeeds.

Pre-migration local schemas:

- `app`
- `arsip`
- `auth`
- `dokumen`
- `master`
- `public`

`package.json` scripts:

- `db:migrate`: `drizzle-kit migrate`
- `db:generate`: `drizzle-kit generate`
- `db:seed`: `tsx src/db/seed/index.ts`
- no explicit config path is passed to `drizzle-kit`
- no package-script dotenv override points migration to the local Docker database

`drizzle.config.ts`:

- dialect is `postgresql`
- schema source is `./src/db/schema/index.ts`
- migration output is `./drizzle`
- database URL is read from `process.env.DATABASE_URL`

Environment check:

- `DATABASE_URL` is not set in the current PowerShell process.
- `.env` contains a `DATABASE_URL`.
- The `.env` `DATABASE_URL` does not point to the local Docker database.
- Sanitized endpoint found in `.env`: host `aws-1-ap-northeast-1.pooler.supabase.com`, port `6543`, database `postgres`.
- `drizzle-kit` v0.31.10 bundles dotenv support in its CLI, so the Phase 4B command likely loaded `.env` and attempted to migrate the Supabase pooler endpoint instead of local Docker PostgreSQL.

This is the most likely cause of the silent Phase 4B failure. The intended local endpoint from `infra/docker/postgres/docker-compose.yml` and `.env.migration.example` is `localhost:5432/kepser`.

## Generated SQL Spot Check

`drizzle/0000_dry_roland_deschain.sql` starts with:

```sql
CREATE TABLE "auth"."users" (
```

Read-only SQL checks found:

- no `CREATE SCHEMA`
- no `CREATE TABLE "public"...`
- no `DROP TABLE`
- no `DROP SCHEMA`
- no `INSERT INTO`
- no `COPY`

The SQL still assumes the Docker init schemas already exist, which they do on the local database.

## Retry Decision

No migration retry was attempted in Phase 4B.1.

Reason:

- the failure cause was identified as an environment target mismatch before a safe retry was needed
- the current `.env` points at a Supabase pooler endpoint, not local Docker PostgreSQL
- retrying `pnpm db:migrate` without first correcting the effective `DATABASE_URL` would risk another attempt against the wrong database target

## Local DB State After Diagnosis

Read-only inspection of the local Docker PostgreSQL database found:

- no application tables in `auth`, `master`, `dokumen`, `arsip`, `app`, or `public`
- no Drizzle metadata table
- no application tables in `public`

This indicates the failed Phase 4B attempt did not partially apply objects to the local database.

## Seed Confirmation

Seed was not run.

Commands intentionally not run:

- `pnpm db:seed`
- `pnpm db:generate`

## Recommendation

Before retrying Phase 4B, make the effective migration environment point to the local Docker database. Recommended options:

- set `DATABASE_URL` in the shell for the one migration command using the local value from `.env.migration.example`
- or update the migration runbook to use `DOTENV_CONFIG_PATH=.env.migration.example`/an equivalent local migration env file
- or replace the local `.env` `DATABASE_URL` during this migration branch with the local Docker PostgreSQL URL if that matches the branch policy

After the effective URL is confirmed as local `localhost:5432/kepser`, retry `pnpm db:migrate` once against the still-empty local database, then run the Phase 4B table/index/check verification. Do not run seed until migration apply succeeds and seed is explicitly approved.

## Phase 4B.2 Local Migration Env Scripts

Phase 4B.2 added explicit local package scripts so migration and seed commands can load `.env.migration` instead of the regular `.env`:

```bash
pnpm db:local:generate
pnpm db:local:migrate
pnpm db:local:seed
```

Implementation notes:

- `dotenv-cli` was added as a dev dependency.
- the installed CLI supports `--override`, so the local scripts use `.env.migration` values with priority over any existing shell or `.env` values.
- `.env.migration` was created from `.env.migration.example`.
- `.env.migration` is ignored by `.gitignore` and must remain untracked.
- existing generic scripts `db:generate`, `db:migrate`, and `db:seed` were preserved unchanged.

Migration was not retried in Phase 4B.2. Seed was not run.

## Phase 4B.3 Local Migration Apply

Date/time: 2026-05-13 17:15:05 +07:00.

Command run:

```bash
pnpm db:local:migrate
```

Result:

```text
migrations applied successfully
```

The generic `pnpm db:migrate` command was not run.

### Local Environment Confirmation

Checked without printing secrets:

- `.env.migration` exists: true
- `.env.migration` is ignored: true
- local target host is `localhost` or `127.0.0.1`: true
- local target database is `kepser`: true

### Docker And Pre-Migration State

Docker/PostgreSQL health:

- `kepser-postgres` was running and healthy.
- `pg_isready -U kepser -d kepser` returned accepting connections.

Pre-migration schemas existed:

- `app`
- `arsip`
- `auth`
- `dokumen`
- `master`
- `public`

Pre-migration empty check:

- no application tables existed in `auth`, `master`, `dokumen`, or `arsip`
- no application tables existed in `public`
- no Drizzle metadata table existed

### Drizzle Metadata Verification

Drizzle metadata table exists:

- `drizzle.__drizzle_migrations`

The table contains one applied migration row.

### Expected Tables Verification

Expected application tables exist:

- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`
- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_kelengkapan_dokumen`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.ketua_tim_assignments`
- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`
- `arsip.arsip`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`

Public schema check:

- no application tables exist in `public`

### Constraint, Index, Check, And Default Spot Checks

Verified indexes:

- `auth_users_email_unique`
- `auth_roles_nama_unique`
- `auth_user_roles_user_id_role_id_pk`
- `auth_sessions_token_hash_unique`
- `ketua_tim_kegiatan_unique`

Verified constraints/checks:

- `auth.user_roles` composite primary key on `(user_id, role_id)`
- `dokumen_nominal_realisasi_positive`
- `arsip_usul_musnah_status_check`
- no role-name check constraint exists on `auth.roles`

Verified JSONB defaults:

- `auth.users.metadata` is `jsonb` with default `'{}'::jsonb`
- `dokumen.dokumen_transaksi.lampiran_urls` is `jsonb` with default `'[]'::jsonb`

Foreign-key delete behavior spot-check:

- archive rows and user-linked workflow/archive history use `NO ACTION` where expected
- `arsip.master_klasifikasi_arsip.parent_id` uses `SET NULL`
- `dokumen.log_aktivitas.dokumen_id` uses `CASCADE`, matching the reviewed migration
- no unexpected cascade delete was found for archive rows or user-linked workflow/archive history

### Seed Confirmation

Seed was not run.

Zero-count checks passed:

- `auth.roles`: 0
- `auth.users`: 0
- `master.master_fungsi`: 0
- `dokumen.dokumen_transaksi`: 0
- `arsip.arsip`: 0

Commands intentionally not run:

- `pnpm db:seed`
- `pnpm db:local:seed`
- `pnpm db:generate`
- `pnpm db:local:generate`

### Recommendation

Phase 4B.3 successfully applied the reviewed initial Drizzle migration to the local Docker PostgreSQL database. The next recommended phase is a controlled seed run using `pnpm db:local:seed` only after explicit seed approval and required seed password-hash prerequisites are confirmed.
