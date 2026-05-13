# Local Database Bootstrap Runbook

## Purpose

This runbook documents the safe order for bootstrapping a fresh local PostgreSQL database after the Drizzle schema has been reviewed. It is a later-phase workflow. Phase 3H does not run these commands.

## Prerequisites

- Docker PostgreSQL is running from `infra/docker/postgres/docker-compose.yml`.
- `.env.migration` exists, stays untracked, and points `DATABASE_URL` to the local PostgreSQL database.
- A Drizzle migration has been generated in a later approved phase.
- The generated SQL has been reviewed.
- The reviewed migration has been applied before seed execution.
- `DMS_DEV_SEED_PASSWORD_HASH` is set if development users should be seeded.

## Local Migration Environment

Use the explicit local scripts for Docker PostgreSQL bootstrap:

```bash
pnpm db:local:generate
pnpm db:local:migrate
pnpm db:local:seed
```

These scripts load `.env.migration` with `dotenv-cli` and use `--override` so values from `.env.migration` take priority over shell variables and the regular `.env`.

The local migration URL must be:

```text
postgresql://kepser:kepser_dev_password@localhost:5432/kepser
```

`.env.migration` is gitignored and must stay untracked. Do not copy Supabase credentials from `.env` into `.env.migration`, and do not use a Supabase `DATABASE_URL` for local migration or seed commands.

The generic scripts remain available but are not recommended for the local Docker migration flow:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Those generic scripts may read the regular `.env`, which can still point to Supabase during the migration branch.

## Safe Command Order

1. Start PostgreSQL:

```bash
docker compose -f infra/docker/postgres/docker-compose.yml up -d
```

2. Check health:

```bash
docker exec -it kepser-postgres pg_isready -U kepser -d kepser
```

3. Generate Drizzle migration, later phase / after approval:

```bash
pnpm db:local:generate
```

4. Review generated SQL:

```bash
Get-ChildItem drizzle
```

Open the generated SQL file and verify schema, tables, indexes, foreign keys, and constraints before applying.

5. Apply reviewed migration, later phase / after approval:

```bash
pnpm db:local:migrate
```

6. Inspect schemas and tables:

```bash
docker exec -it kepser-postgres psql -U kepser -d kepser
```

Then inspect with:

```sql
\dn
\dt auth.*
\dt master.*
\dt dokumen.*
\dt arsip.*
\dt app.*
```

7. Optionally run seed, later phase / after approval:

```bash
$env:DMS_DEV_SEED_PASSWORD_HASH='<argon2id-hash>'
pnpm db:local:seed
```

Seed must not be run before the reviewed migrations are applied.

## Warnings

- Do not delete the Docker volume `kepser_postgres_data` after it contains meaningful data unless a reset is intentional and backed up.
- Do not use development seed credentials or deterministic seed hashes in production.
- No Supabase data import happens in this bootstrap flow.
- Old Supabase Auth UUID values are not preserved.
- Seed UUIDs are deterministic local fixture IDs only.
