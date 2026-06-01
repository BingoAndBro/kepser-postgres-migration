# Phase 3H Schema And Migration Validation Preparation

## Purpose

Phase 3H prepares the local PostgreSQL migration branch for safe Drizzle migration generation and later local database bootstrapping.

This phase validates schema/module export readiness, dependency/script readiness, and the manual migration workflow. It does not generate migrations, apply migrations, run seed code, connect to a database, migrate API routes, implement auth/session behavior, or implement storage behavior.

## Current Schema Namespaces

The new Drizzle schema source is `src/db/schema/index.ts`, which exports these namespaces:

- `auth`
- `master`
- `dokumen`
- `arsip`
- `app`

The `auth`, `master`, `dokumen`, and `arsip` namespaces currently contain domain table definitions from Phases 3C through 3F. The `app` namespace is intentionally a placeholder and exports no tables yet.

`src/lib/db/schema.ts` remains a legacy partial mirror and is not the new migration source of truth.

## Dependency And Script Readiness

Findings:

- `drizzle-kit` is installed as a direct dev dependency.
- `drizzle-orm` is installed as a direct dev dependency in this branch.
- `pg` is installed as a direct dependency.
- `tsx` is installed as a direct dev dependency for TypeScript seed execution.
- `argon2` is not installed and password hashing implementation remains out of scope for this phase.
- Safe package scripts exist for separate generate, migrate, and seed steps.

Scripts:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

These commands are intentionally separate. There is no combined generate/migrate/seed script and no destructive reset script.

## Why Migrations Are Not Generated Here

Phase 3H is a readiness checkpoint, not a schema execution phase. Running Drizzle Kit would create or update migration artifacts and would need SQL review before any database apply step. That belongs in the next approved phase.

The existing `drizzle/` folder may contain older migration artifacts from previous work. Phase 3H does not validate them as latest, regenerate them, apply them, or treat them as reviewed output for the current schema.

## Schema Export And Module Validation Notes

`src/db/schema/index.ts` exports all five domain namespaces. The `app` placeholder is a valid empty TypeScript module using `export {}` so the root schema export can safely include `./app` before app support tables exist.

No domain table definitions were changed in Phase 3H.

## TypeScript Validation Limitations

A narrow TypeScript check can validate that schema and seed entrypoint files typecheck without executing seed code. It does not:

- run Drizzle Kit
- load generated migration SQL
- connect to PostgreSQL
- prove SQL generation correctness
- prove runtime seed idempotency against a real database

Full validation still requires reviewed migration generation and a later approved local database bootstrapping pass.

## Next-Step Workflow

Use this exact workflow in a later approved phase:

1. Generate a Drizzle migration with `pnpm db:generate`.
2. Review the generated SQL in `drizzle/`.
3. Apply the reviewed migration to local PostgreSQL with `pnpm db:migrate`.
4. Inspect the database schemas and tables with `psql`.
5. Prepare seed prerequisites, including `DMS_DEV_SEED_PASSWORD_HASH` if development users are needed.
6. Run `pnpm db:seed` only after explicit approval.

Do not run seed before migrations are applied. Seed execution expects the target tables to exist.

## Seed And Data Warnings

- `DMS_DEV_SEED_PASSWORD_HASH` is required to create development users.
- The seed script does not generate password hashes.
- No Supabase data is imported.
- Old Supabase UUID values are not preserved.
- Seed UUIDs are fresh deterministic local fixture IDs.
- Development seed credentials and hashes must not be used in production.
