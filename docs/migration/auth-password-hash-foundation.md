# Phase 5A Auth Password Hash Foundation

## Purpose

Phase 5A adds the password hashing foundation for the future local custom auth system. It does not implement login, logout, sessions, API migration, user seeding, or storage replacement.

Supabase-backed auth/runtime remains active for now.

## Dependency

The approved `argon2` package was added for password hashing.

Chosen algorithm and parameters:

| Setting | Value |
|---|---:|
| Algorithm | `argon2id` |
| Memory cost | `65536` |
| Time cost | `3` |
| Parallelism | `1` |

`parallelism: 1` is intentional for cross-machine local development compatibility.

## Utility

Created server-only password utilities in `src/lib/auth/password.ts`:

- `hashPassword(password: string): Promise<string>`
- `verifyPassword(hash: string, password: string): Promise<boolean>`
- `isArgon2idHash(hash: string): boolean`
- `assertArgon2idHash(hash: string): void`

The encoded Argon2id hash string is stored directly as `auth.users.password_hash`, and `auth.users.password_hash_algorithm` remains `argon2id`.

The utility rejects empty or whitespace-only passwords. Verification returns `false` for invalid hashes, empty passwords, and mismatches instead of crashing for expected invalid-input cases.

Do not import this utility into client components or shared browser modules. Phase 5A only allows the helper script to import it.

## Helper Script

Created `src/scripts/generate-password-hash.ts` and the package script:

```bash
pnpm auth:hash-password
```

The helper reads the password from `DMS_DEV_SEED_PASSWORD` first. If that environment variable is absent, it accepts one CLI argument as a fallback and prints a warning to stderr.

Recommended safer usage:

```powershell
$env:DMS_DEV_SEED_PASSWORD = '<password-from-password-manager>'
pnpm auth:hash-password
```

The script prints only the generated hash to stdout when the human developer explicitly runs it. It does not write to `.env`, `.env.migration`, or any other file.

CLI fallback:

```powershell
pnpm auth:hash-password '<password>'
```

Warning: command-line arguments may be stored in shell history. Prefer `DMS_DEV_SEED_PASSWORD`.

## Seed Hash Workflow

To generate `DMS_DEV_SEED_PASSWORD_HASH` later:

1. The human developer sets `DMS_DEV_SEED_PASSWORD`.
2. The human developer runs `pnpm auth:hash-password`.
3. The human developer copies the stdout hash into `DMS_DEV_SEED_PASSWORD_HASH` only for an explicitly approved later seed run.

Do not commit plaintext passwords or real generated hashes. Do not commit `.env.migration`.

Codex did not run the helper, generate a password hash, print a password hash, seed users, connect to the database, or mutate the database in Phase 5A.

## Not Implemented

Phase 5A does not implement:

- custom login/logout/session runtime
- `/api/auth/*` migration
- Supabase auth removal
- development user seed execution
- local filesystem storage
- signed-token file access
- workflow/FSM changes

Development users are still not seeded in this phase.
