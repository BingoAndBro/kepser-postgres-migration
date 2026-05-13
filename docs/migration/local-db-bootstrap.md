# Local Database Bootstrap Runbook

## Purpose

This runbook documents the safe order for bootstrapping a fresh local PostgreSQL database after the Drizzle schema has been reviewed. It is a later-phase workflow. Phase 3H does not run these commands.

## Prerequisites

- Docker PostgreSQL is running from `infra/docker/postgres/docker-compose.yml`.
- `DATABASE_URL` points to the local PostgreSQL database.
- A Drizzle migration has been generated in a later approved phase.
- The generated SQL has been reviewed.
- The reviewed migration has been applied before seed execution.
- `DMS_DEV_SEED_PASSWORD_HASH` is set if development users should be seeded.

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
pnpm db:generate
```

4. Review generated SQL:

```bash
Get-ChildItem drizzle
```

Open the generated SQL file and verify schema, tables, indexes, foreign keys, and constraints before applying.

5. Apply reviewed migration, later phase / after approval:

```bash
pnpm db:migrate
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
pnpm db:seed
```

Seed must not be run before the reviewed migrations are applied.

## Warnings

- Do not delete the Docker volume `kepser_postgres_data` after it contains meaningful data unless a reset is intentional and backed up.
- Do not use development seed credentials or deterministic seed hashes in production.
- No Supabase data import happens in this bootstrap flow.
- Old Supabase Auth UUID values are not preserved.
- Seed UUIDs are deterministic local fixture IDs only.
