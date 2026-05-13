# Phase 4A.1 Generated Migration Review

## Run Metadata

- Date/time: 2026-05-13 14:21:33 +07:00
- Initial git status:

```text
## migration/postgres-local
 M docs/migration/drizzle-schema-plan.md
?? docs/migration/generated-migration-review.md
```

The working tree was already dirty from Phase 4A documentation. This was expected for Phase 4A.1 and did not include runtime code changes.

## Previous Failure Summary

Phase 4A attempted:

```bash
pnpm db:generate
```

Drizzle Kit stopped at a non-interactive prompt path:

```text
Interactive prompts require a TTY terminal
```

The stack trace entered `promptNamedWithSchemasConflict`. The cause was stale existing `drizzle/` metadata that described old public-schema application tables while the current target schema uses `auth`, `master`, `dokumen`, `arsip`, and an empty `app` placeholder.

## Stale Baseline Resolution

The old active Drizzle artifacts were moved out of active `drizzle/` into:

```text
docs/migration/legacy-drizzle-baseline/
```

Moved files:

- `drizzle/0000_handy_next_avengers.sql`
- `drizzle/0001_003_dokumen_transaksi.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/_journal.json`

The archived files are stale pre-migration artifacts and are preserved only for audit/reference context. They are not active for the new local PostgreSQL migration baseline.

The active `drizzle/` directory was then cleared of stale SQL and metadata before generation.

## Pre-Generation Validation

`drizzle.config.ts` is configured with:

- dialect: `postgresql`
- schema: `./src/db/schema/index.ts`
- out: `./drizzle`

Schema export check:

```bash
pnpm exec tsc --noEmit --moduleResolution bundler --module ESNext --target ES2022 --strict --skipLibCheck --types node src/db/schema/index.ts
```

Result: passed.

## Command Run

```bash
pnpm db:generate
```

After clearing the active baseline, Drizzle Kit generated:

```text
drizzle/0000_workable_shadowcat.sql
```

Generated metadata:

- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

No `pnpm db:migrate` or `pnpm db:seed` command was run.

## Generated Files

Active `drizzle/` now contains only the fresh baseline generated from the current schema:

- `drizzle/0000_workable_shadowcat.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

## SQL Review Summary

The generated migration creates 17 application tables:

- 4 auth tables
- 8 master tables
- 2 dokumen tables
- 3 arsip tables

The generated table definitions are schema-qualified under `auth`, `master`, `dokumen`, and `arsip`. No app support tables are generated.

However, the generated SQL includes:

```sql
CREATE SCHEMA "auth";
```

It does not include `CREATE SCHEMA` statements for `master`, `dokumen`, or `arsip`.

This is an apply blocker against the current Docker foundation because `infra/docker/postgres/init/001-create-schemas.sql` already creates all five schemas with `CREATE SCHEMA IF NOT EXISTS`. Applying this migration to the normal local database would likely fail immediately if `auth` already exists. Applying it to a database without the Docker init schemas would also fail when it reaches `master`, `dokumen`, or `arsip` tables.

## Expected Tables Found

Auth:

- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`

Master:

- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_kelengkapan_dokumen`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.ketua_tim_assignments`

Dokumen:

- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`

Arsip:

- `arsip.arsip`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`

## Unexpected Objects Found

Unexpected schema statement:

- `CREATE SCHEMA "auth";`

The table objects themselves are expected and schema-qualified.

No application tables were generated in `public`.

## Destructive Statements Check

No destructive statements were found:

- no `DROP TABLE`
- no `DROP SCHEMA`
- no destructive `ALTER TABLE ... DROP`

No imported data statements were found:

- no `INSERT INTO`
- no `COPY`

No Supabase-specific objects were found:

- no Supabase Auth tables
- no storage bucket/policy objects
- no RLS policies
- no Edge Function objects
- no `pg_cron` objects

## Public Schema Check

Passed for application tables.

No `CREATE TABLE "public"...` or unqualified application table creation was found.

## Enum And Check Constraint Review

No PostgreSQL enum types were generated for workflow or archive lifecycle status.

Expected checks are present:

- `master_kelengkapan_kategori_requires_jenis_check`
- `master_kelengkapan_detail_requires_kategori_check`
- `dokumen_nominal_realisasi_positive`
- `arsip_usul_musnah_status_check`

The `arsip_usul_musnah_status_check` matches the current active queue values: `MENUNGGU`, `DISETUJUI`, `DITOLAK`.

No role-name `CHECK` constraint was generated for `auth.roles`.

## FK Review

Cross-schema FKs are generated in the expected directions:

- `auth.user_roles.user_id -> auth.users.id`
- `auth.user_roles.role_id -> auth.roles.id`
- `auth.sessions.user_id -> auth.users.id`
- `master.master_kegiatan.fungsi_id -> master.master_fungsi.id`
- `master.master_kategori_permintaan.jenis_permintaan_id -> master.master_jenis_permintaan.id`
- `master.master_detail_permintaan.kategori_permintaan_id -> master.master_kategori_permintaan.id`
- `master.master_kelengkapan_dokumen` request-chain FKs -> `master`
- `master.ketua_tim_assignments.user_id -> auth.users.id`
- `master.ketua_tim_assignments.kegiatan_id -> master.master_kegiatan.id`
- `master.ketua_tim_assignments.created_by -> auth.users.id`
- `dokumen.dokumen_transaksi` FKs -> `auth.users`, `master.master_fungsi`, `master.master_kegiatan`, and `master.master_jenis_dokumen`
- `dokumen.log_aktivitas` FKs -> `dokumen.dokumen_transaksi` and `auth.users`
- `arsip.arsip` FKs -> `dokumen.dokumen_transaksi` and `auth.users`
- `arsip.master_klasifikasi_arsip.parent_id -> arsip.master_klasifikasi_arsip.id`
- `arsip.arsip_usul_musnah` FKs -> `arsip.arsip` and `auth.users`

Cascade delete review:

- Cascades appear only on role/session membership cleanup, master kelengkapan under kegiatan, Ketua Tim assignment rows under user/kegiatan, and `log_aktivitas` under `dokumen_transaksi`.
- Archive rows and user-linked workflow/archive history use `no action`.
- `ketua_tim_assignments.created_by` and classification parent use `set null`.

No unexpected cascade delete was found for archive rows or user-linked workflow/archive history.

## Index Review

Expected indexes are present:

- `auth_users_email_unique`
- `auth_roles_nama_unique`
- `auth_user_roles_user_id_role_id_pk`
- `auth_sessions_token_hash_unique`
- master active/name/FK/partial unique indexes
- `ketua_tim_kegiatan_unique`
- dokumen workflow/report/request-chain indexes
- `log_aktivitas` document/user/timestamp/action indexes
- arsip lifecycle/date/user indexes
- archive classification unique/partial indexes
- `arsip_usul_musnah` unique/status/user/date indexes

## JSONB And Default Review

Expected JSONB defaults are present:

- `auth.users.metadata jsonb DEFAULT '{}'::jsonb NOT NULL`
- `dokumen.dokumen_transaksi.lampiran_urls jsonb DEFAULT '[]'::jsonb NOT NULL`

Expected nullable JSONB field is present:

- `arsip.arsip.lampiran_snapshot jsonb`

No unintended JSON-to-text coercion was found in the fresh migration.

## Known Issues

The generated SQL is not currently safe to apply because schema creation is inconsistent with the Docker foundation:

- Docker init already creates `auth`, `master`, `dokumen`, `arsip`, and `app` with `CREATE SCHEMA IF NOT EXISTS`.
- Generated SQL emits `CREATE SCHEMA "auth";`, which can fail if the Docker-initialized local database already has `auth`.
- Generated SQL does not emit `CREATE SCHEMA` for `master`, `dokumen`, or `arsip`, so it also cannot bootstrap those schemas alone.

## Recommendation

Do not proceed to Phase 4B apply migration yet.

Before applying, fix the schema-generation baseline so the migration and Docker foundation agree on schema creation. The likely fix is to make Drizzle generation consistently rely on the Docker init schemas, or consistently emit all required schema creation statements in a way that will not conflict with the local foundation. Do not manually edit the generated SQL; fix the schema/config source and regenerate.

## Phase 4A.2 Schema Creation Alignment Review

### Root Cause And Fix

Phase 4A.1 generated `CREATE SCHEMA "auth";` because `src/db/schema/auth/users.ts` exported the raw `pgSchema('auth')` object while the other domain schema objects were local constants.

Phase 4A.2 made that declaration consistent with the rest of the Drizzle schema:

- `authSchema` is now a local `const`.
- all `pgSchema(...)` declarations under `src/db/schema/` are local constants.
- exported table definitions are unchanged.
- table names, columns, indexes, constraints, and FKs were not intentionally changed.

Schema creation responsibility remains delegated to Docker init SQL:

- `infra/docker/postgres/init/001-create-schemas.sql` creates `auth`, `master`, `dokumen`, `arsip`, and `app` with `CREATE SCHEMA IF NOT EXISTS`.
- Drizzle migrations own tables, indexes, FKs, and checks inside those existing schemas.

### Regeneration

The blocked active generated baseline was removed from `drizzle/` and regenerated from source.

Removed active generated artifacts:

- `drizzle/0000_workable_shadowcat.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

Regenerated active files:

- `drizzle/0000_dry_roland_deschain.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

The legacy archived files in `docs/migration/legacy-drizzle-baseline/` were not removed or regenerated.

### Validation Commands

Narrow TypeScript schema check:

```bash
pnpm exec tsc --noEmit --moduleResolution bundler --module ESNext --target ES2022 --strict --skipLibCheck --types node src/db/schema/index.ts
```

Result: passed.

Generation command:

```bash
pnpm db:generate
```

Result: generated `drizzle/0000_dry_roland_deschain.sql`.

No `pnpm db:migrate` or `pnpm db:seed` command was run.

### SQL Review Summary

The regenerated migration creates 17 expected application tables:

- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`
- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.master_kelengkapan_dokumen`
- `master.ketua_tim_assignments`
- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`
- `arsip.arsip`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`

Schema creation check:

- no `CREATE SCHEMA` statements found
- no `CREATE TABLE "public"...` application tables found
- no unqualified application table creation found

Unexpected/destructive statements check:

- no `DROP TABLE`
- no `DROP SCHEMA`
- no destructive `ALTER TABLE ... DROP`
- no `INSERT INTO`
- no `COPY`
- no Supabase storage/auth objects
- no RLS policies
- no Edge Function objects
- no `pg_cron` objects
- no PostgreSQL enum status types
- no imported Supabase data

Constraint/index/default review:

- expected cross-schema FKs are present.
- expected unique indexes and lookup indexes are present.
- `master_kelengkapan_kategori_requires_jenis_check` and `master_kelengkapan_detail_requires_kategori_check` remain present.
- `dokumen_nominal_realisasi_positive` remains present.
- `arsip_usul_musnah_status_check` remains present and matches `MENUNGGU`, `DISETUJUI`, `DITOLAK`.
- `auth.roles` still has unique `nama` via `auth_roles_nama_unique`.
- no role-name `CHECK` constraint was generated.
- expected JSONB defaults remain present for `auth.users.metadata` and `dokumen.dokumen_transaksi.lampiran_urls`.
- `arsip.arsip.lampiran_snapshot` remains JSONB.

### Recommendation

The schema creation inconsistency is resolved. The regenerated migration is now safe to proceed to Phase 4B apply migration against the Docker-initialized local PostgreSQL database, subject to normal Phase 4B approval and runtime prerequisites.

Migration was not applied in Phase 4A.2. Seed was not run.
