# Phase 5B Controlled Dev User Seed Execution

## Purpose

Phase 5B prepares the local-only development user seed path for future custom auth/session testing. It does not implement custom auth runtime, login/logout/session APIs, Supabase auth removal, storage replacement, workflow changes, or UI changes.

The current application runtime remains Supabase-backed.

## Preflight Requirements

Before running the development user seed, confirm:

- `git status --short --branch` is clean or contains only intentional Phase 5B documentation/preflight changes.
- `.env.migration` exists.
- `.env.migration` is gitignored and untracked.
- `package.json` contains `db:local:seed`.
- `db:local:seed` loads `.env.migration` with dotenv override semantics and does not read the regular `.env`.
- `DATABASE_URL` resolves to local PostgreSQL, not Supabase.
- `DMS_DEV_SEED_PASSWORD_HASH` is present in the environment used by `db:local:seed`.
- The hash value is not printed.
- The hash appears to start with `$argon2id$`.
- Seed code does not generate hashes.
- Seed code does not create sessions, workflow documents, activity logs, archive rows, or archive destruction proposal rows.
- `ADMIN` remains a dedicated role and is not combined with other roles.
- The seed is safe to rerun against the current local DB because inserts use upsert or conflict-do-nothing behavior where needed.

If any item fails, do not run the seed.

## Providing The Hash

The human developer is responsible for generating and providing the hash. Use the Phase 5A helper manually:

```powershell
$env:DMS_DEV_SEED_PASSWORD = '<password-from-password-manager>'
pnpm auth:hash-password
```

Then provide the resulting hash only in the local shell or local ignored environment used for an approved seed run:

```powershell
$env:DMS_DEV_SEED_PASSWORD_HASH = '<argon2id-hash>'
```

Do not commit plaintext passwords, real hashes, `.env`, or `.env.migration`. Do not paste real hashes into docs, tickets, commits, or chat.

## Approved Command

After all preflight checks pass, the only approved DB mutation command for this phase is:

```bash
pnpm db:local:seed
```

Do not run generic or migration/generation scripts for Phase 5B:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:generate
pnpm db:local:migrate
pnpm db:local:generate
```

Codex must not run the hash helper. The helper is human-triggered only. The human developer may run it manually before an approved seed execution, using local-only secret values.

## Expected Post-Seed State

After a successful development user seed:

- `auth.roles` remains the 5 canonical roles.
- `auth.users` contains the development users defined in `src/db/seed/constants.ts`.
- `auth.user_roles` contains the expected joins from those seed definitions.
- `auth.sessions` remains `0`.
- Minimal master data counts remain stable.
- `dokumen.dokumen_transaksi` remains `0`.
- `dokumen.log_aktivitas` remains `0`.
- `arsip.arsip` remains `0`.
- `arsip.arsip_usul_musnah` remains `0`.
- No application tables exist in `public`.

Derived from current seed definitions, the expected development users are:

- `dev.admin@local.test` with `ADMIN` only.
- `dev.pegawai@local.test` with `PEGAWAI`.
- `dev.ppk@local.test` with `PEGAWAI` and `PPK`.
- `dev.bendahara@local.test` with `PEGAWAI` and `BENDAHARA`.
- `dev.arsiparis@local.test` with `PEGAWAI` and `ARSIPARIS`.

That means a fresh successful dev-user seed should create 5 development users and 8 user-role joins.

## Phase 5B Preflight-Only Result

On 2026-05-13, preflight confirmed that `.env.migration` exists, is ignored/untracked, and targets local PostgreSQL database `kepser`. The effective local seed environment did not contain `DMS_DEV_SEED_PASSWORD_HASH`, so `pnpm db:local:seed` was not run.

Development user seed execution remained blocked until the human developer provided a local Argon2id encoded hash for Phase 5B.1.

## Phase 5B.1 Execution Result

Date: 2026-05-13.

Preflight passed:

- `git status --short --branch` was clean before seed execution.
- `.env.migration` existed, was ignored, and was untracked.
- `db:local:seed` was present and configured to load `.env.migration` with dotenv override semantics.
- The effective local seed environment contained `DMS_DEV_SEED_PASSWORD_HASH`.
- The hash shape check passed for the `$argon2id$` prefix without printing the hash.
- The target database classified as local PostgreSQL database `kepser`; the full URL was not printed.
- Seed code review confirmed no hash generation, no session seeding, no workflow document seeding, and no archive transaction seeding.
- `ADMIN` remained a dedicated role in the seed definitions.

`pnpm db:local:seed` was run and completed successfully. Development users were seeded locally for future custom auth/session testing. No password, hash, token, or database URL value was printed.

Read-only verification counts after seed:

| Table | Count |
|---|---:|
| `auth.roles` | 5 |
| `auth.users` | 5 |
| `auth.user_roles` | 8 |
| `auth.sessions` | 0 |
| `master.master_fungsi` | 1 |
| `master.master_kegiatan` | 1 |
| `master.master_jenis_dokumen` | 1 |
| `master.master_jenis_permintaan` | 1 |
| `master.master_kategori_permintaan` | 1 |
| `master.master_detail_permintaan` | 1 |
| `master.master_kelengkapan_dokumen` | 3 |
| `arsip.master_klasifikasi_arsip` | 1 |
| `master.ketua_tim_assignments` | 1 |
| `dokumen.dokumen_transaksi` | 0 |
| `dokumen.log_aktivitas` | 0 |
| `arsip.arsip` | 0 |
| `arsip.arsip_usul_musnah` | 0 |
| `public` base tables | 0 |

The verified development user role mapping was:

| User | Roles |
|---|---|
| `dev.admin@local.test` | `ADMIN` |
| `dev.pegawai@local.test` | `PEGAWAI` |
| `dev.ppk@local.test` | `PEGAWAI`, `PPK` |
| `dev.bendahara@local.test` | `PEGAWAI`, `BENDAHARA` |
| `dev.arsiparis@local.test` | `PEGAWAI`, `ARSIPARIS` |

The resulting 8 `auth.user_roles` rows match the current seed constants and role mapping above.

The application auth runtime remains Supabase-backed. Custom login/session runtime remains not implemented.

## Intentionally Not Implemented

Phase 5B does not implement:

- custom login/logout/session runtime
- session cookies or token generation/validation
- `/api/auth/*` migration
- Supabase auth removal
- API route migration to Drizzle
- local filesystem storage
- signed-token file access
- workflow/FSM changes
- UI/auth UX changes
- seeded sessions
- seeded workflow or archive transaction data
