# Phase 14J.2 - Local Seed Password Hash Handling Hardening

Date: 2026-06-01

Status: implemented pending human local seed retest.

## Scope

Phase 14J.2 hardens local development seed behavior after the Phase 14J disposable database validation found that development login could fail when the seed password hash was loaded through dotenv expansion.

This phase changes only local seed command handling, development seed password-hash validation, targeted seed tests, and governance documentation. It does not change schema, migrations, login/auth runtime behavior, seeded identities, storage behavior, Supabase artifacts, or package dependencies.

## Root Cause

`DMS_DEV_SEED_PASSWORD_HASH` is expected to contain a literal Argon2id PHC string beginning with `$argon2id$`.

Argon2id PHC strings contain `$` separators. When dotenv expansion is enabled, those `$` segments can be interpreted as variable expansion and the effective value passed to the seed script can be corrupted. A corrupted value may be inserted as `auth.users.password_hash`, causing login verification to fail later because the stored value is no longer a valid Argon2id PHC hash.

## Implemented Hardening

The local seed package script now loads `.env.migration` with dotenv expansion disabled:

```text
dotenv -e .env.migration --override --no-expand -- tsx src/db/seed/index.ts
```

The script keeps the dotenv CLI separator `--` before `tsx`.

`seedDevelopmentUsers` now validates a present `DMS_DEV_SEED_PASSWORD_HASH` before any development-user database work. The value must start with `$argon2id$`; otherwise seed execution fails with a safe error. An absent variable still skips development users, while an explicitly empty value is treated as invalid.

```text
Invalid DMS_DEV_SEED_PASSWORD_HASH: expected an Argon2id PHC hash starting with $argon2id$.
```

The seed still skips development users when the env var is absent, preserving the existing optional development-user behavior.

## Secret Handling

No password hash, database URL, credential, env value, token, cookie, session value, storage root, physical path, logical path, or secret should be printed by this hardening. Validation errors describe the expected shape only and never echo the provided value.

## Tests

Added a narrow unit test for `seedDevelopmentUsers` covering:

- missing hash skips development-user seeding;
- malformed, expanded, or empty hash values fail before insert;
- valid-looking `$argon2id$` values proceed to the mocked insert path;
- the invalid-hash error does not include the provided hash value.

## Boundaries

Unchanged:

- DB schema and migrations;
- Drizzle schema files;
- auth/login runtime behavior;
- Argon2id algorithm choice;
- seeded user emails, roles, and IDs;
- `.env` and `.env.migration`;
- `pnpm-lock.yaml`;
- Supabase historical artifacts;
- storage and route generation.

## Manual Verification Recommendation

For a human-controlled local development retest, run the normal local seed only after confirming `.env.migration` contains a literal Argon2id PHC value for `DMS_DEV_SEED_PASSWORD_HASH`:

```text
pnpm db:local:seed
```

Do not print the hash or env contents during verification.
