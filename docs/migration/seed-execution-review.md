# Phase 4C Seed Execution Review

## Phase

Phase 4C Controlled Seed Execution, Option 1.

## Command

Approved seed command:

```bash
pnpm db:local:seed
```

The generic `pnpm db:seed` command was not used.

## Local Environment Confirmation

- `.env.migration` exists: true
- `.env.migration` is ignored: true
- local target host is `localhost` or `127.0.0.1`: true
- local target database is `kepser`: true
- `DMS_DEV_SEED_PASSWORD_HASH` is set: false

No secret values or full database URLs were printed.

## Docker/PostgreSQL Health

- `kepser-postgres` was running.
- `pg_isready -U kepser -d kepser` returned accepting connections.

## Migration Verification

- Drizzle metadata table exists: `drizzle.__drizzle_migrations`
- all 17 expected application tables exist under `auth`, `master`, `dokumen`, and `arsip`

## Pre-Seed Counts

| Table | Count |
|---|---:|
| `auth.roles` | 0 |
| `auth.users` | 0 |
| `auth.user_roles` | 0 |
| `master.master_fungsi` | 0 |
| `master.master_kegiatan` | 0 |
| `master.master_jenis_dokumen` | 0 |
| `master.master_jenis_permintaan` | 0 |
| `master.master_kategori_permintaan` | 0 |
| `master.master_detail_permintaan` | 0 |
| `master.master_kelengkapan_dokumen` | 0 |
| `arsip.master_klasifikasi_arsip` | 0 |
| `master.ketua_tim_assignments` | 0 |
| `dokumen.dokumen_transaksi` | 0 |
| `dokumen.log_aktivitas` | 0 |
| `arsip.arsip` | 0 |
| `arsip.arsip_usul_musnah` | 0 |

## Seed Result

The first sandboxed attempt failed before seed script execution with `tsx`/`esbuild` `spawn EPERM`. The same approved command was then run outside the sandbox after approval and completed successfully.

Seed output confirmed:

- canonical roles were seeded
- development users were skipped because `DMS_DEV_SEED_PASSWORD_HASH` was absent
- minimal master data was seeded
- Ketua Tim fixture was skipped because development users were not seeded

## Post-Seed Counts

| Table | Count |
|---|---:|
| `auth.roles` | 5 |
| `auth.users` | 0 |
| `auth.user_roles` | 0 |
| `auth.sessions` | 0 |
| `master.master_fungsi` | 1 |
| `master.master_kegiatan` | 1 |
| `master.master_jenis_dokumen` | 1 |
| `master.master_jenis_permintaan` | 1 |
| `master.master_kategori_permintaan` | 1 |
| `master.master_detail_permintaan` | 1 |
| `master.master_kelengkapan_dokumen` | 3 |
| `arsip.master_klasifikasi_arsip` | 1 |
| `master.ketua_tim_assignments` | 0 |
| `dokumen.dokumen_transaksi` | 0 |
| `dokumen.log_aktivitas` | 0 |
| `arsip.arsip` | 0 |
| `arsip.arsip_usul_musnah` | 0 |

## Roles Verification

Canonical roles exist and no extra role was inserted:

- `ADMIN`
- `ARSIPARIS`
- `BENDAHARA`
- `PEGAWAI`
- `PPK`

## Development User Skip Verification

- `dev.*@local.test` users in `auth.users`: 0
- `auth.user_roles` rows: 0
- `auth.sessions` rows: 0
- `master.ketua_tim_assignments` rows: 0

## Workflow Data Verification

No workflow or archive transaction data was seeded:

- `dokumen.dokumen_transaksi`: 0
- `dokumen.log_aktivitas`: 0
- `arsip.arsip`: 0
- `arsip.arsip_usul_musnah`: 0

## Idempotency Note

Seed idempotency is designed through upsert and conflict-do-nothing behavior, but it was not re-tested in Phase 4C. The seed was intentionally not run a second time.

## Warnings And Errors

- The sandboxed seed attempt failed before execution with `spawn EPERM` from `tsx`/`esbuild`.
- The approved outside-sandbox run of the same `pnpm db:local:seed` command succeeded.

## Recommendation

Proceed next to the auth/password-hash planning or implementation phase before enabling development user seed execution. Keep open decisions for argon2/password hashing, real password provisioning, production bootstrap admin strategy, dev user seed execution, backup/restore, signed-token implementation, file/DB partial failure policy, archive scheduler replacement, and API migration strategy.
