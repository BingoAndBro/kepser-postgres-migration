# Phase 3G Seed Foundation

## Purpose

Phase 3G adds a small, deterministic seed foundation for local PostgreSQL development. It prepares seed code only. It does not run the seed, generate migrations, connect to the database, migrate API routes, replace auth/session behavior, or replace storage.

This foundation belongs before Phase 4 database bootstrapping. Phase 4 can decide when to run it as part of a reviewed local setup flow.

## Seed Scope

The seed foundation defines:

- canonical roles in `auth.roles`: `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`
- optional development users in `auth.users`
- optional development user-role joins in `auth.user_roles`
- minimal master data required to create a valid `dokumen_transaksi` later
- one archive classification row for later archive testing
- one Ketua Tim assignment fixture only when development users are seeded

The master data is intentionally minimal:

- one active function
- one active activity
- one material request type, category, and detail
- one non-material document type
- three required attachment checklist rows
- one active archive classification

It does not attempt to simulate full workflow scenarios.

## Development Users Strategy

Seed users use fresh local deterministic UUIDs and development-only email addresses:

- `dev.admin@local.test`
- `dev.pegawai@local.test`
- `dev.ppk@local.test`
- `dev.bendahara@local.test`
- `dev.arsiparis@local.test`

`ADMIN` remains dedicated and is not combined with other roles. Non-admin role accounts include `PEGAWAI` where useful for current app expectations.

User seeding is optional. If `DMS_DEV_SEED_PASSWORD_HASH` is not set, the seed runner skips users and role joins while still allowing roles and master data to be seeded later.

## Password Hash Strategy

No plaintext passwords are committed. Phase 5A adds the approved direct `argon2` dependency and a separate helper script for human-triggered password hash generation.

Development user seeding requires an explicitly supplied Argon2id hash through:

```bash
DMS_DEV_SEED_PASSWORD_HASH=<argon2id-hash>
```

The seed script stores the provided value as `auth.users.password_hash` and marks `password_hash_algorithm` as `argon2id`. It does not generate hashes.

Do not use development credentials or deterministic seed hashes in production.

## Phase 5A Password Hash Helper

Phase 5A adds `argon2` plus a helper script for generating `DMS_DEV_SEED_PASSWORD_HASH` later:

```bash
pnpm auth:hash-password
```

The helper reads `DMS_DEV_SEED_PASSWORD` and prints only the generated Argon2id hash when a human developer explicitly runs it. Codex did not run the helper or generate a hash during Phase 5A.

Development user seed execution remains separate and approval-gated. Supply `DMS_DEV_SEED_PASSWORD_HASH` only when explicitly running a later approved development user seed. Do not commit generated hashes, plaintext passwords, `.env`, or `.env.migration`.

## Phase 5B Controlled Development User Seed

Phase 5B keeps development user seeding local-only and approval-gated. The seed path must be checked before execution:

- `.env.migration` must exist, remain ignored/untracked, and target local PostgreSQL.
- `pnpm db:local:seed` must be the only DB mutation command used for this phase.
- `DMS_DEV_SEED_PASSWORD_HASH` must already be present in the local seed environment.
- The supplied value must only be checked for Argon2id encoded hash shape, such as the `$argon2id$` prefix.
- Codex must not generate, print, or store a hash.
- Seed code must not generate hashes.
- Sessions are not seeded.

If `DMS_DEV_SEED_PASSWORD_HASH` is absent, development users are not seeded and the phase stops before `pnpm db:local:seed`.

The current seed definitions create 5 development users and 8 role joins when the hash is supplied. `ADMIN` remains a dedicated account with no combined roles. The seed still does not create workflow documents, activity logs, archive transaction rows, archive destruction proposal rows, or sessions.

Phase 5B.1 executed the controlled local seed on 2026-05-13 after `DMS_DEV_SEED_PASSWORD_HASH` was already present in the effective local seed environment. Development users are now seeded in the local Docker PostgreSQL database only. This does not decide the production bootstrap strategy. Sessions remain unseeded, and future seed reruns remain approval-gated.

Phase 5B execution details are documented in `docs/migration/dev-user-seed-execution.md`.

## Deterministic UUID Strategy

Seed rows use deterministic UUIDs for repeatable local development. These are fresh local fixture IDs, not old Supabase Auth UUIDs.

This preserves UUID-based ownership and foreign-key semantics without importing Supabase identities.

## Idempotency Strategy

Seed code uses Drizzle insert/upsert-style logic where practical:

- roles upsert by role name
- globally unique master rows upsert or skip by unique constraints
- join rows use conflict-do-nothing behavior
- no seed logic deletes existing rows
- no seed logic restricts future dynamic roles

Existing roles and master rows are preserved.

## Intentionally Not Seeded

Phase 3G does not seed:

- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`
- `arsip.arsip`
- `arsip.arsip_usul_musnah`
- sessions
- realistic production users
- imported Supabase data
- storage files or file metadata beyond existing JSON-compatible master prerequisites
- scheduler/job state

## How To Run Later

Do not run the seed during Phase 3G.

Before running later, Phase 4 should ensure:

- PostgreSQL is running with reviewed Drizzle migrations applied
- `DATABASE_URL` points to the local PostgreSQL database
- a direct TypeScript script runner is approved and available, such as `tsx`
- `DMS_DEV_SEED_PASSWORD_HASH` is set if development users should be created

The intended entrypoint is:

```bash
src/db/seed/index.ts
```

No `package.json` script was added in Phase 3G because `tsx` is only present transitively in the lockfile, not as a direct dependency.

## Relationship To Phase 4

Phase 3G defines seed code and documentation. Phase 4 should decide the reviewed bootstrapping command, package script, password hash provisioning workflow, and local reset procedure.

## Phase 3H Note

Phase 3H adds a direct TypeScript runner for the seed entrypoint by declaring `tsx` as a direct dev dependency. It also adds `pnpm db:seed` as a manual script for later approved bootstrapping.

Seed execution remains manual and approval-gated. Do not run the seed until reviewed Drizzle migrations have been applied to the local PostgreSQL database.

Development user seeding still requires `DMS_DEV_SEED_PASSWORD_HASH`. The seed script does not generate password hashes. Phase 5A adds a separate password hash helper for human-triggered hash generation, but seed execution remains approval-gated.
