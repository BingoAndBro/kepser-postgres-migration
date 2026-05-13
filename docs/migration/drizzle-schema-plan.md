# Drizzle Schema Plan

## 1. Purpose

This is a planning document for building the new local PostgreSQL schema using Drizzle from scratch.

The schema implementation must use Supabase migrations and active runtime behavior as the reference. `src/lib/db/schema.ts` is only a partial Drizzle mirror and must not be treated as complete. API response compatibility matters more than copying old table shapes blindly, because the current app depends on enriched response fields, PostgREST nested-select behavior, Supabase Auth Admin metadata, and storage path semantics.

PostgreSQL RLS is deferred. The schema should still be RLS-friendly by keeping explicit ownership columns, role joins, stable foreign keys, and indexes that make later policy work practical. Until a later hardening phase, server/API authorization remains authoritative.

## 2. Current Schema Sources

Schema source priority:

1. `supabase/migrations/`
2. Active API routes and helper behavior
3. `docs/migration/supabase-audit.md`
4. `src/lib/db/schema.ts` as partial mirror only

The existing migrations are the broadest historical schema record. Runtime code is required to understand which migrated tables and columns are still active, which obsolete tables were removed, and which manual response enrichments must be preserved.

## 3. Target PostgreSQL Schemas

Target namespaces are already created by the PostgreSQL Docker foundation:

- `auth`: local users, roles, user-role joins, sessions, password/session metadata, and active/inactive state.
- `master`: document master data and assignment tables: `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen`, `master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_jenis_dokumen`, and `ketua_tim_assignments`.
- `dokumen`: workflow tables: `dokumen_transaksi`, `log_aktivitas`, and optional future attachment/file metadata.
- `arsip`: archive lifecycle tables: `arsip`, `master_klasifikasi_arsip`, `arsip_usul_musnah`, and historical notes for removed `arsip_verifikasi_penyusutan`.
- `app`: app support tables such as migration metadata, settings, scheduled job state, or operational audit tables if needed later.

Schema names are organizational namespaces, not security boundaries.

## 4. Proposed Drizzle Folder Structure

Proposed future structure:

```text
src/db/
  client.ts
  index.ts
  schema/
    auth/
      users.ts
      roles.ts
      sessions.ts
      index.ts
    master/
      fungsi.ts
      kegiatan.ts
      kelengkapan-dokumen.ts
      jenis-permintaan.ts
      kategori-permintaan.ts
      detail-permintaan.ts
      jenis-dokumen.ts
      ketua-tim-assignments.ts
      index.ts
    dokumen/
      dokumen-transaksi.ts
      log-aktivitas.ts
      lampiran.ts
      index.ts
    arsip/
      arsip.ts
      klasifikasi-arsip.ts
      usul-musnah.ts
      index.ts
    app/
      settings.ts
      index.ts
```

Conventions:

- Use singular file names for one table per file where the domain term is singular in Indonesian, except existing table names that are naturally plural or join-like: `roles.ts`, `sessions.ts`, `ketua-tim-assignments.ts`.
- Export each table from its domain `index.ts`, then export all domains from `src/db/schema/index.ts`.
- The Drizzle client should import from one schema index so generated queries use one canonical schema object.
- Avoid circular imports by keeping table definitions and relation definitions either in the same file for close pairs or in a separate domain `relations.ts` only after all tables are exported.
- Name relation helpers by domain intent: `dokumenTransaksiRelations`, `arsipRelations`, `userRolesRelations`.
- Keep enum-like TypeScript constants close to existing domain constants when app behavior depends on them. Drizzle schema files may import values for checks only after dependency direction is clear.
- Do not create these files in Phase 3A.

## 5. Naming Convention Decision

Recommended conventions:

- Table names: preserve existing Indonesian snake_case table names for compatibility and migration clarity, but place them under domain schemas.
- Column names: preserve existing snake_case column names where active API/runtime behavior already depends on them.
- Drizzle exported identifiers: camelCase, matching existing style, for example `dokumenTransaksi`, `logAktivitas`, `masterKelengkapanDokumen`.
- Enum/check names: use domain-prefixed names such as `dokumen_status_check` and `arsip_status_arsip_check`; do not add a role-name check because `auth.roles` remains dynamic.
- Relation names: use explicit nouns, for example `createdByUser`, `roles`, `kegiatan`, `fungsi`, `arsip`, `logs`.
- Timestamp columns: use `created_at`, `updated_at`, `archived_at`, `musnah_at`, `expires_at`, `revoked_at`, all `timestamptz` unless a current API requires date-only fields.
- Date-only lifecycle columns: keep `masa_aktif_berakhir` and `masa_inaktif_berakhir` as `date`.
- Foreign key columns: use `<target>_id`, preserving existing names such as `kegiatan_jenis_id` even if `kegiatan_id` would be cleaner.
- Index names: `idx_<table>_<columns>`, with partial predicate suffix where useful.
- Unique constraints: `<table>_<columns>_unique`.

Use Indonesian domain names where they already exist in the app. Keep technical columns consistent across domains.

## 6. User ID Strategy

Recommendation: use UUID primary keys for local users and seed users. Fresh deterministic UUIDs may be used for seed data. Preserve UUID-based ownership and foreign-key semantics. Do not import or preserve actual old Supabase user UUID values unless a future explicit data migration decision changes this.

Rationale:

- This project is creating a new local PostgreSQL schema from scratch with new minimal seed data, not importing existing Supabase data.
- User identity still needs stable UUID semantics because `dokumen_transaksi.created_by`, `log_aktivitas.user_id`, archive user fields, `ketua_tim_assignments`, reports, role joins, and future storage paths should reference users consistently.
- UUID ownership semantics keep the schema compatible with current application assumptions without binding the new local database to old Supabase Auth row values.
- Deterministic seed UUIDs make local development and tests repeatable.

Tradeoffs:

- Fresh local UUIDs are simpler because there is no existing production data import in scope.
- If a future explicit data migration imports real Supabase data, it must separately decide whether to preserve old user IDs or build a mapping layer.
- Seed UUIDs should be deterministic for fixtures, but normal runtime user creation can generate random UUIDs.

Implementation implications:

- `auth.users.id` should be a UUID primary key.
- Dev seed can create deterministic UUIDs.
- New local users should receive generated UUIDs.
- No Phase 3 schema or seed work should import actual old Supabase Auth UUID values.
- Future storage paths should continue using UUID user IDs where ownership path semantics require it.

## 7. Auth Schema Draft Plan

### `auth.users`

Purpose: replace Supabase Auth user identity and user metadata needed by the app.

Proposed fields:

- `id uuid primary key`
- `email text not null unique`
- `password_hash text not null`
- `password_hash_algorithm text not null default 'argon2id'`
- `password_updated_at timestamptz`
- `nama_lengkap text`
- `nip_nrp text`
- `departemen text`
- `metadata jsonb not null default '{}'`
- `is_active boolean not null default true`
- `deactivated_at timestamptz`
- `deactivated_by uuid references auth.users(id)`
- `last_login_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- First-class columns should cover metadata currently parsed from Supabase Auth: `nama_lengkap`, `nip_nrp`, `departemen`.
- JSON metadata remains useful for compatibility or future fields, but app-critical fields should not require JSON parsing.
- Preserve active/inactive behavior currently supplied by `user_status`.
- Duplicate email errors must remain compatible with admin user creation.

### `auth.roles`

Purpose: dynamic role lookup while preserving canonical roles.

Proposed fields:

- `id uuid primary key default gen_random_uuid()`
- `nama text not null unique`
- `deskripsi text`
- `created_at timestamptz not null default now()`

Constraints:

- `nama` is unique but not DB-check-limited; canonical initial roles are enforced through seed, service, and admin validation.
- Keep rows rather than a pure enum so role joins and admin behavior stay close to current runtime behavior.

### `auth.user_roles`

Purpose: many-to-many role membership.

Proposed fields:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role_id uuid not null references auth.roles(id) on delete cascade`
- `created_at timestamptz not null default now()`

Constraints:

- Unique `(user_id, role_id)`.
- Enforce ADMIN exclusivity either with a trigger or in app service plus validation tests. A DB trigger is recommended before production because a partial unique constraint alone cannot easily express "ADMIN cannot coexist with non-admin roles" through the join table.
- Non-admin users may have multiple roles.
- User creation should preserve current default PEGAWAI behavior unless explicit ADMIN-only account is created.

### `auth.sessions`

Purpose: cookie session storage.

Proposed fields:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `token_hash text not null unique`
- `remember_me boolean not null default false`
- `created_at timestamptz not null default now()`
- `expires_at timestamptz not null`
- `revoked_at timestamptz`
- `last_seen_at timestamptz`
- `user_agent text`
- `ip_address inet`

Notes:

- Raw session token lives only in the `HttpOnly` cookie and request memory.
- Store hashed session token only.
- Standard expiry is 8 hours.
- Remember-me expiry is 30 days.
- Expired or revoked sessions must not authenticate.

### User status equivalent

Recommendation: fold `user_status` into `auth.users.is_active`, while preserving response behavior. A compatibility view or service mapping can emulate the old table shape if needed during migration.

## 8. Master Schema Draft Plan

### `master.master_fungsi`

Purpose: top-level work function/department.

Key fields: `id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: unique `nama`, index `is_active`.

Notes: current behavior uses soft active flag.

### `master.master_kegiatan`

Purpose: activity under a function.

Key fields: `id`, `fungsi_id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: FK to `master_fungsi`, index `fungsi_id`, index `is_active`. Consider unique `(fungsi_id, nama)` if runtime/admin duplicate behavior confirms it.

### `master.master_kelengkapan_dokumen`

Purpose: required/optional attachment checklist per kegiatan, ketua-tim flag, and material request chain.

Key fields: `id`, `kegiatan_id`, `is_ketua_tim`, `nama_dokumen`, `required`, `jenis_permintaan_id`, `kategori_permintaan_id`, `detail_permintaan_id`, `created_at`, `updated_at`.

Constraints: FK to kegiatan and optional chain FKs. Preserve chain validation from migration `018_validate_kelengkapan_chain.sql`.

Compatibility risks: wildcard nulls in the chain are meaningful. Do not convert nulls to separate sentinel rows.

### `master.master_jenis_permintaan`

Purpose: material request type.

Key fields: `id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: index `is_active`. Consider unique `nama` if admin behavior expects duplicate prevention.

### `master.master_kategori_permintaan`

Purpose: category under jenis permintaan.

Key fields: `id`, `jenis_permintaan_id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: FK to jenis, index `(jenis_permintaan_id, is_active)`. Consider unique `(jenis_permintaan_id, nama)`.

### `master.master_detail_permintaan`

Purpose: optional detail under kategori permintaan.

Key fields: `id`, `kategori_permintaan_id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: FK to kategori, index `(kategori_permintaan_id, is_active)`. Consider unique `(kategori_permintaan_id, nama)`.

Compatibility risks: some categories intentionally have no detail children.

### `master.master_jenis_dokumen`

Purpose: non-material document type.

Key fields: `id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`.

Constraints: index `is_active`. Seed default rows only if needed for local workflows.

### `master.ketua_tim_assignments`

Purpose: assignment of one chairperson per kegiatan.

Key fields: `id`, `user_id`, `kegiatan_id`, `created_at`, `created_by`.

Constraints: FK to `auth.users`, FK to `master_kegiatan`, unique `kegiatan_id`, index `user_id`, index `kegiatan_id`.

Compatibility risks: current schema is unique per `kegiatan_id`, not unique `(user_id, kegiatan_id)`. Preserve replace semantics by kegiatan.

## 9. Dokumen Schema Draft Plan

### `dokumen.dokumen_transaksi`

Purpose: primary document workflow row.

Key fields:

- `id uuid primary key`
- `judul text not null`
- `fungsi_id uuid not null references master.master_fungsi(id)`
- `kegiatan_jenis_id uuid not null references master.master_kegiatan(id)`
- `is_ketua_tim boolean not null default false`
- `status text not null default 'DRAFT'`
- `current_step text`
- `revision_target text`
- `revision_notes text`
- `lampiran_urls jsonb not null default '[]'`
- `tahun integer not null`
- `tanggal text not null`
- `created_by uuid not null references auth.users(id)`
- `nominal_realisasi numeric(15,2) default 0`
- `is_non_material boolean not null default false`
- `jenis_dokumen_id uuid references master.master_jenis_dokumen(id)`
- `keterangan_detail text`
- `jenis_permintaan_id uuid references master.master_jenis_permintaan(id)`
- `kategori_permintaan_id uuid references master.master_kategori_permintaan(id)`
- `detail_permintaan_id uuid references master.master_detail_permintaan(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- Use `jsonb` for `lampiran_urls` in the new schema, while preserving response shape.
- Keep `tanggal` as text during compatibility unless all callers are audited for date-only conversion.
- Status transitions must remain governed by `src/lib/fsm.ts`.
- `TERSIMPAN` for non-material shortcut must remain valid even though it is not a normal `transition()` output.
- Add non-negative check for `nominal_realisasi`.

Indexes:

- `(created_by, status)`
- `(status, current_step)`
- `(status, current_step, updated_at)`
- `(fungsi_id, kegiatan_jenis_id, tahun)`
- chain indexes for report/filter queries.

### `dokumen.log_aktivitas`

Purpose: append-only audit trail.

Key fields: `id`, `dokumen_id`, `user_id`, `aksi`, `catatan`, `step_urutan`, `timestamp`.

Constraints:

- FK to `dokumen_transaksi`.
- FK to `auth.users`.
- No update/delete in application service. Consider DB trigger later to reject update/delete if stronger enforcement is needed.

Indexes:

- `dokumen_id`
- `user_id`
- `(dokumen_id, timestamp)`
- `(aksi, timestamp)` for idempotency checks such as Bendahara approval.

### Attachment/file metadata table

Do not introduce a required normalized file table in the first schema implementation unless storage migration explicitly needs it. See Section 11.

## 10. Arsip Schema Draft Plan

### `arsip.arsip`

Purpose: archive row created after a completed document is archived.

Key fields:

- `id uuid primary key`
- `dokumen_id uuid not null references dokumen.dokumen_transaksi(id)`
- `nomor_surat text`
- `klasifikasi text`
- `klasifikasi_id uuid references arsip.master_klasifikasi_arsip(id)` if runtime can migrate from text safely
- `retensi_aktif text`
- `retensi_inaktif text`
- `masa_aktif_berakhir date`
- `masa_inaktif_berakhir date`
- `status_arsip text not null default 'AKTIF'`
- `is_ditolak boolean not null default false`
- `catatan_arsiparis text`
- `archived_by uuid references auth.users(id)`
- `archived_at timestamptz default now()`
- `lampiran_snapshot jsonb`
- `musnah_at timestamptz`
- `musnah_by uuid references auth.users(id)`
- `musnah_catatan text`
- `nominal_realisasi numeric(15,2)`
- `created_at timestamptz default now()`
- `updated_at timestamptz`

Lifecycle statuses: `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`.

Notes:

- Preserve relationship to `dokumen_transaksi`.
- `DIMUSNAHKAN` must block preview/download even if stale files still exist.
- `lampiran_snapshot` must preserve enough metadata to render archive detail pages and locate files until destruction.

### `arsip.master_klasifikasi_arsip`

Purpose: archive classification tree.

Key fields: `id`, `nama`, `deskripsi`, `is_active`, `parent_id`, `kode`, `created_at`, `updated_at`.

Constraints: unique `nama`, partial unique `kode where kode is not null`, FK `parent_id` to self with `on delete set null`, index `parent_id`, index active rows.

Compatibility risks: current `arsip.klasifikasi` is text. A future implementation must decide whether to keep text, add `klasifikasi_id`, or support both during transition.

### `arsip.arsip_usul_musnah`

Purpose: queue/status for destruction proposals.

Key fields: `id`, `arsip_id`, `status`, `catatan`, `diusulkan_oleh`, `decided_by`, `created_at`, `decided_at`.

Constraints: FK to `arsip`, unique `arsip_id`, status check `MENUNGGU`, `DISETUJUI`, `DITOLAK`.

### Historical `arsip_verifikasi_penyusutan`

The table existed in migration `005_arsip.sql` and was dropped by `010_drop_verifikasi_penyusutan.sql`. Do not recreate it for active runtime behavior unless a separate decision reverses the current archive lifecycle. The Edge Function still references historical behavior and must be reconciled when replacing cron/Edge behavior.

### Edge/cron replacement implications

Supabase Edge Function plus pg_cron must be replaced later by a local scheduler, app-managed maintenance endpoint, or PostgreSQL job strategy. Do not model scheduled-job state in the core arsip schema until the replacement mechanism is chosen.

## 11. File/Lampiran Metadata Strategy

Recommendation: keep lampiran data embedded in `dokumen_transaksi.lampiran_urls` as JSONB during the compatibility phase, with a later optional normalized `dokumen.lampiran` table after storage parity is proven.

Rationale:

- Current request/response shapes use arrays of `{ kelengkapan_id, nama, url, uploaded_at }`.
- Archive snapshots copy lampiran metadata into `arsip.lampiran_snapshot`.
- Pending upload and formal path behavior is coupled to stored `url` strings.
- Creating a mandatory normalized file table now would force mapping logic before storage replacement is verified.
- JSONB improves query and validation options over legacy text while preserving the payload shape.

Migration risk:

- Embedded JSON makes orphan cleanup and referential integrity harder.
- Normalized metadata would better track MIME type, size, checksum, storage state, and deletion.
- A hybrid approach can add an optional `dokumen.lampiran` table later, populated alongside JSON, while APIs continue returning the old JSON shape.

Compatibility considerations:

- Preserve pending path formats recognized today.
- Preserve formal path format `{userId}/{dokumenId}/{uuid}.{ext}`.
- Internal signed-token preview/download must not expose raw filesystem paths.
- Archive destruction must invalidate file access independently of JSON snapshots.
- Orphan cleanup should be dry-run first and compare filesystem paths against JSON metadata until a normalized table exists.

## 12. Enum and Constants Strategy

Enum-like values:

- Roles: `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, `ADMIN`
- `StatusDokumen`: `DRAFT`, `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, `NEED_REVISION`, `COMPLETED`, `TERSIMPAN`, `ARCHIVED`
- `CurrentStep`: `PPK`, `BENDAHARA`, or null
- `RevisionTarget`: `USER`, `PPK`, or null
- `StatusArsip`: `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, `DIMUSNAHKAN`
- Destruction proposal status: `MENUNGGU`, `DISETUJUI`, `DITOLAK`
- Material and non-material categories currently live in master-data rows, not code enums.

Recommendation: use `text` columns with explicit check constraints plus TypeScript constants/types in app code. Do not use PostgreSQL enum types during the compatibility phase.

Rationale:

- Status history has changed during migration (`VERIFIKASI_PENYUSUTAN` removed, `DIMUSNAHKAN` added, `TERSIMPAN` added).
- Check constraints are easier to change than PostgreSQL enum types.
- Existing constants and FSM tests remain the app-level source for behavior.
- Role rows still support dynamic joins and admin behavior.

## 13. Seed Strategy

Seed data should be deterministic, minimal, and idempotent.

Plan:

- Seed roles: `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, `ADMIN`.
- Seed a bootstrap admin account with explicit local password only through a safe dev/bootstrap path.
- Seed optional minimal master data needed for local workflow smoke tests.
- Seed dev/test user accounts only in dev/test seed mode.
- Use fixed UUIDs for deterministic development fixtures.
- Do not restore Supabase dummy data.
- Do not seed production passwords or secrets.
- Do not seed large realistic workflow datasets until API compatibility tests need them.

Recommendation: use a TypeScript seed script in a later phase for password hashing and idempotent upserts, with SQL allowed only for simple static data if it does not need argon2id hashes.

## 14. Drizzle Migration Workflow Recommendation

Recommended workflow:

- Use Drizzle schema as the code source and `drizzle-kit generate` to create SQL migrations.
- Review generated SQL before applying.
- Do not use `drizzle-kit push` as the main migration path.
- Keep Docker init SQL limited to creating base schemas/extensions only.
- Keep Drizzle migrations responsible for tables, indexes, constraints, and future schema evolution.
- Avoid conflicts with Docker init SQL by not duplicating table creation in `infra/docker/postgres/init`.
- In early local phases, reset by intentionally dropping the named Docker volume only when local data is disposable.
- Once useful seed/data exists, prefer explicit down/reset runbooks and backups over volume deletion.

Do not run drizzle-kit in Phase 3A.

## 15. Index and Constraint Strategy

Proposed important indexes and constraints:

- `auth.sessions`: unique `token_hash`, index `(user_id)`, index `(expires_at)`, partial index active sessions where `revoked_at is null`.
- `auth.roles`: unique `nama`.
- `auth.user_roles`: unique `(user_id, role_id)`, index `user_id`, index `role_id`, ADMIN exclusivity enforcement.
- `auth.users`: unique `email`, index `is_active`.
- `dokumen.dokumen_transaksi`: index `(created_by, status)`, `(status, current_step)`, `(status, current_step, updated_at)`, `(fungsi_id, kegiatan_jenis_id, tahun)`, chain indexes for `jenis_permintaan_id`, `kategori_permintaan_id`, `detail_permintaan_id`.
- PPK inbox: `(status, current_step)` where status is `IN_PPK_VALIDATION` or `NEED_REVISION`.
- Bendahara inbox: `(status, current_step)` where status is `IN_BENDAHARA_APPROVAL`.
- Reports: `(created_by, tahun)`, `(status, tahun)`, `(kegiatan_jenis_id, tahun)`.
- `master.ketua_tim_assignments`: unique `kegiatan_id`, index `user_id`.
- `arsip.arsip`: unique or at least indexed `dokumen_id`, index `status_arsip`, partial indexes for retention dates, index `archived_by`.
- `arsip.arsip_usul_musnah`: unique `arsip_id`, index `status`.
- `dokumen.log_aktivitas`: index `dokumen_id`, `user_id`, `(dokumen_id, timestamp)`, `(aksi, timestamp)`.

Names above are proposed conventions, not implemented names.

## 16. Compatibility Risks

Key risks:

- PostgREST nested select replacement must be implemented as explicit Drizzle joins/enrichment.
- Manual enrichment response fields such as `fungsi_nama`, `kegiatan_nama`, leaf node names, user names, and archive fields must be preserved.
- Supabase Auth Admin user metadata must become local auth columns or compatibility metadata.
- Future file path ownership should remain UUID-based, but Phase 3 does not import old Supabase user UUID values.
- `lampiran_urls` JSON shape must remain stable.
- `arsip.lampiran_snapshot` shape must remain stable.
- App-layer authorization replaces Supabase RLS/service role behavior and must be complete.
- Timestamp defaults and string/date serialization can drift.
- Status and enum-like values can drift from `src/lib/constants/*` and `src/lib/fsm.ts`.
- `kegiatan_jenis_id` is a legacy column name that points to kegiatan. Renaming it would risk response and helper drift.
- `arsip_verifikasi_penyusutan` exists historically but is not active lifecycle behavior.
- `klasifikasi` text versus classification FK requires a later explicit transition decision.

## 17. Proposed Implementation Iterations

### 3B: Drizzle config/client only

Allowed: add new DB folder, client bootstrap, environment validation notes, update Drizzle config path after review.

Forbidden: table schema implementation, migrations, endpoint changes, package changes unless separately approved.

### 3C: Auth schema

Allowed: Drizzle definitions for `auth.users`, `auth.roles`, `auth.user_roles`, `auth.sessions`, checks/indexes.

Forbidden: login/session implementation, password hashing services, UI changes, route changes.

### 3D: Master schema

Allowed: Drizzle definitions for master tables and ketua tim assignments.

Forbidden: master-data API migration, browser helper replacement, seed scripts unless explicitly in 3G.

### 3E: Dokumen schema

Allowed: Drizzle definitions for `dokumen_transaksi`, `log_aktivitas`, JSONB lampiran field, indexes/checks.

Forbidden: workflow endpoint migration, FSM behavior changes, storage movement implementation.

### 3F: Arsip schema

Allowed: Drizzle definitions for archive tables and archive lifecycle constraints.

Forbidden: cron/Edge replacement, destruction workflow migration, storage delete implementation.

### 3G: Seed foundation

Allowed: deterministic seed script/data for roles, bootstrap admin, minimal master data, dev/test fixtures.

Forbidden: Supabase dummy restore, production secrets, broad realistic data import.

### 3H: Migration validation against Docker PostgreSQL

Allowed: generate/review/apply Drizzle migrations against local Docker PostgreSQL, inspect schema, document reset behavior.

Forbidden: API route migration, auth/storage implementation, app containerization.

## 18. Open Questions Before Implementation

Remaining questions:

- Which exact Supabase Auth metadata fields beyond `nama_lengkap`, `nip_nrp`, and `departemen` must be first-class columns?
- Should `auth.users` keep a separate `metadata jsonb` field in addition to first-class columns?
- Should ADMIN exclusivity later gain a database trigger or remain enforced by service, seed, and admin mutation logic plus tests?
- Should `arsip.klasifikasi` remain text only, gain `klasifikasi_id`, or support both during migration?
- What exact local scheduler replaces Supabase Edge Function plus pg_cron for archive retention?
- Should a normalized `dokumen.lampiran` table be introduced in Phase 6 after storage compatibility, and what fields should it contain?
- What exact internal signed-token claims, expiry, and replay policy should be used for preview/download?
- Should `tanggal` in `dokumen_transaksi` remain text permanently or become `date` after API serialization is audited?
- Which master-data tables require hard delete behavior and which require soft delete behavior in admin APIs?
- Should database triggers enforce `updated_at` and `log_aktivitas` append-only rules, or should Phase 3 only model them at service/test level?

## Phase 3B Status

Phase 3B created the minimal Drizzle config and client foundation only.

Foundation files created:

- `src/db/index.ts`
- `src/db/client.ts`
- `src/db/schema/index.ts`
- `src/db/schema/auth/index.ts`
- `src/db/schema/master/index.ts`
- `src/db/schema/dokumen/index.ts`
- `src/db/schema/arsip/index.ts`
- `src/db/schema/app/index.ts`

Drizzle config now targets schema entrypoint `./src/db/schema/index.ts` and migration output folder `./drizzle`.

Dependency inspection found `drizzle-orm` and `drizzle-kit` already present. Phase 3B.1 selected `pg`/node-postgres as the local PostgreSQL runtime driver, with `@types/pg` added for TypeScript. `src/db/client.ts` now uses `Pool` from `pg` and `drizzle` from `drizzle-orm/node-postgres`, requires `DATABASE_URL`, exports `pool`, and exports `db`.

Intentionally unimplemented:

- no domain schema tables
- no relations
- no generated Drizzle migrations
- no Drizzle Kit execution
- no API route usage
- no auth implementation
- no storage implementation

Corrected UUID decision remains: Use fresh local UUIDs for new local users/seeds while preserving UUID-based ownership and foreign-key semantics; old Supabase UUID values are not imported because existing Supabase data is not being migrated.

## Phase 3C Status

Phase 3C created only the auth namespace Drizzle table definitions for the future local custom auth system.

Auth schema files created:

- `src/db/schema/auth/users.ts`
- `src/db/schema/auth/roles.ts`
- `src/db/schema/auth/user-roles.ts`
- `src/db/schema/auth/sessions.ts`
- `src/db/schema/auth/index.ts`

Tables defined under PostgreSQL schema `auth`:

- `auth.users`
  - UUID primary key generated locally.
  - Unique non-null `email`.
  - Non-null `password_hash`; plaintext passwords are not represented.
  - `password_hash_algorithm` defaulting to `argon2id`.
  - UI/report compatibility fields: `display_name`, `nama_lengkap`, `nip_nrp`, `departemen`.
  - `metadata` JSONB defaulting to `{}` for Supabase metadata compatibility and future fields.
  - Active/inactive replacement fields: `is_active`, `inactive_reason`, `deactivated_at`, `deactivated_by`.
  - Login/password/timestamp metadata: `last_login_at`, `password_updated_at`, `created_at`, `updated_at`.
- `auth.roles`
  - UUID primary key generated locally.
  - Unique non-null `nama`.
  - `description`, `created_at`, and `updated_at`.
  - No DB check constraint on `nama`; canonical initial roles are `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`, but `auth.roles` remains dynamic.
- `auth.user_roles`
  - Join table with `user_id` FK to `auth.users.id`.
  - `role_id` FK to `auth.roles.id`.
  - Composite primary key on `(user_id, role_id)`.
  - Lookup indexes on `user_id` and `role_id`.
- `auth.sessions`
  - UUID primary key generated locally.
  - `user_id` FK to `auth.users.id`.
  - Unique non-null `token_hash`.
  - `expires_at`, `created_at`, `last_used_at`, `revoked_at`, `remember_me`, `user_agent`, and `ip_address`.

Important constraints and indexes added:

- `auth_users_email_unique`
- `idx_auth_users_is_active`
- `idx_auth_users_deactivated_by`
- `auth_roles_nama_unique`
- `auth_user_roles_user_id_role_id_pk`
- `idx_auth_user_roles_user_id`
- `idx_auth_user_roles_role_id`
- `auth_sessions_token_hash_unique`
- `idx_auth_sessions_user_id`
- `idx_auth_sessions_expires_at`
- `idx_auth_sessions_revoked_at`

ADMIN exclusivity note:

- `ADMIN` remains a dedicated account mode.
- Phase 3C does not add a database trigger for cross-row ADMIN exclusivity.
- The join-table file documents that seed logic, auth services, and admin mutation logic must reject `ADMIN` combined with any non-admin role.
- A trigger or stronger database enforcement can be added later before production hardening if chosen.

Intentionally unimplemented:

- no generated Drizzle migrations
- no Drizzle Kit execution
- no seed users, seed passwords, or role seed script
- no login/session implementation
- no password hashing service
- no cookie/session behavior wiring
- no API route changes
- no UI changes
- no storage implementation
- no master, dokumen, arsip, or app domain tables

Corrected UUID strategy remains confirmed: local users and seed users use fresh local UUID primary keys; UUID-based ownership and foreign-key semantics are preserved; old Supabase Auth user UUID values are not imported or preserved unless a future explicit data migration decision changes scope.

## Phase 3D Status

Phase 3D created only the master namespace Drizzle table definitions used by current master-data, workflow, report, and Ketua Tim references.

Master schema files created:

- `src/db/schema/master/fungsi.ts`
- `src/db/schema/master/kegiatan.ts`
- `src/db/schema/master/kelengkapan-dokumen.ts`
- `src/db/schema/master/jenis-permintaan.ts`
- `src/db/schema/master/kategori-permintaan.ts`
- `src/db/schema/master/detail-permintaan.ts`
- `src/db/schema/master/jenis-dokumen.ts`
- `src/db/schema/master/ketua-tim-assignments.ts`
- `src/db/schema/master/index.ts`

Tables defined under PostgreSQL schema `master`:

- `master.master_fungsi`
- `master.master_kegiatan`
- `master.master_kelengkapan_dokumen`
- `master.master_jenis_permintaan`
- `master.master_kategori_permintaan`
- `master.master_detail_permintaan`
- `master.master_jenis_dokumen`
- `master.ketua_tim_assignments`

Key constraints and indexes:

- `master.master_fungsi`
  - UUID primary key generated locally.
  - Unique `nama`, matching the existing Supabase migration.
  - Indexes on `is_active` and `nama`.
- `master.master_kegiatan`
  - FK `fungsi_id` to `master.master_fungsi.id` with restrict delete behavior.
  - Indexes on `fungsi_id`, `is_active`, and `(fungsi_id, is_active)`.
  - Partial unique index on active `(fungsi_id, nama)` to match current active-duplicate validation while allowing inactive historical rows.
- `master.master_jenis_permintaan`
  - Indexes on `is_active` and `nama`.
  - Partial unique index on active `nama`.
- `master.master_kategori_permintaan`
  - FK `jenis_permintaan_id` to `master.master_jenis_permintaan.id` with restrict delete behavior.
  - Indexes on `jenis_permintaan_id` and `(jenis_permintaan_id, is_active)`.
  - Partial unique index on active `(jenis_permintaan_id, nama)`.
- `master.master_detail_permintaan`
  - FK `kategori_permintaan_id` to `master.master_kategori_permintaan.id` with restrict delete behavior.
  - Indexes on `kategori_permintaan_id` and `(kategori_permintaan_id, is_active)`.
  - Partial unique index on active `(kategori_permintaan_id, nama)`.
- `master.master_jenis_dokumen`
  - Indexes on `is_active` and `nama`.
  - Partial unique index on active `nama`.
- `master.master_kelengkapan_dokumen`
  - FK `kegiatan_id` to `master.master_kegiatan.id` with cascade delete behavior.
  - Optional FKs to `master_jenis_permintaan`, `master_kategori_permintaan`, and `master_detail_permintaan`.
  - Indexes on `kegiatan_id`, `is_ketua_tim`, and the chain `(kegiatan_id, is_ketua_tim, jenis_permintaan_id, kategori_permintaan_id, detail_permintaan_id)`.
  - Check constraints that require `jenis_permintaan_id` when `kategori_permintaan_id` is filled and require `kategori_permintaan_id` when `detail_permintaan_id` is filled.
  - Full parent-child chain consistency from current migration `018_validate_kelengkapan_chain.sql` remains a later generated SQL trigger or service-validation concern.
- `master.ketua_tim_assignments`
  - FK `user_id` to `auth.users.id` with cascade delete behavior.
  - FK `kegiatan_id` to `master.master_kegiatan.id` with cascade delete behavior.
  - FK `created_by` to `auth.users.id` with set-null delete behavior.
  - Unique `kegiatan_id`, preserving current behavior: one kegiatan has one Ketua Tim assignment, while one user can be assigned to many kegiatan.
  - Indexes on `user_id` and `kegiatan_id`, matching the current migration lookup indexes.
  - No `assigned_by`, `assigned_at`, or `updated_at` column is defined because the current migration/runtime does not use those fields.

Known compatibility choices:

- Existing table names and snake_case column names are preserved, but moved into the target `master` namespace.
- Dynamic business-configurable names are not DB-check-limited with enums or hardcoded value lists.
- `is_active` is present for master entities currently filtered or soft-deleted by runtime behavior: fungsi, kegiatan, jenis permintaan, kategori permintaan, detail permintaan, and jenis dokumen.
- `master_kelengkapan_dokumen` does not add `is_active` because current runtime deletes kelengkapan rows directly and does not filter it through soft-delete semantics.
- `updated_at` is included as a forward-compatible timestamp column on master-data tables where Phase 3D modeled it, but no trigger or API behavior is wired in Phase 3D. It is intentionally not added to `ketua_tim_assignments` because the current migration/runtime only uses `created_at` plus `created_by`.
- Active duplicate prevention is modeled with partial unique indexes for entities where current runtime checks duplicates among active rows. `master_fungsi.nama` remains globally unique because the existing Supabase migration already uses global uniqueness.

Intentionally unimplemented:

- no generated Drizzle migrations
- no Drizzle Kit execution
- no seed data
- no master-data API migration
- no auth/session behavior implementation
- no storage implementation
- no dokumen, arsip, or app domain tables
- no route changes
- no UI changes

No migrations have been generated yet and no API behavior is wired to these tables yet.

## Phase 4B / 4B.1 Status

Phase 4B attempted to apply the reviewed initial migration with:

```bash
pnpm db:migrate
```

Result: failed with exit code 1 and no detailed PostgreSQL error in the visible output.

Phase 4B.1 diagnosis found:

- local Docker PostgreSQL is running and healthy
- required schemas `app`, `arsip`, `auth`, `dokumen`, `master`, and `public` exist locally
- local database remains empty: no application tables and no Drizzle metadata table
- `DATABASE_URL` is not set in the current PowerShell process
- `.env` contains `DATABASE_URL`, but it points to a Supabase pooler endpoint instead of local `localhost:5432/kepser`
- `drizzle.config.ts` reads `process.env.DATABASE_URL`
- `drizzle-kit` v0.31.10 bundles dotenv support, so the failed command likely loaded `.env` and targeted the wrong database endpoint
- generated SQL still starts with schema-qualified `CREATE TABLE "auth"."users"` and contains no `CREATE SCHEMA` or public application table creation

No retry was attempted in Phase 4B.1 because the effective database target must be corrected first.

Seed was not run. `pnpm db:seed` and `pnpm db:generate` were not run.

Next recommended step: set or load a local migration `DATABASE_URL` pointing to `localhost:5432/kepser`, confirm the local database is still empty, then retry `pnpm db:migrate` once and complete the Phase 4B verification checks.

## Phase 4B.2 Status

Phase 4B.2 added explicit local migration scripts so Drizzle commands can target Docker PostgreSQL through `.env.migration` instead of the regular `.env`:

```bash
pnpm db:local:generate
pnpm db:local:migrate
pnpm db:local:seed
```

`dotenv-cli` was added as a dev dependency. The installed CLI supports `--override`, and the local scripts use it so `.env.migration` values take priority over shell variables and the Supabase-oriented `.env`.

`.env.migration` was created from `.env.migration.example`, is gitignored, and must remain untracked. The existing generic scripts remain unchanged for non-local use.

Migration was not retried in Phase 4B.2. Seed was not run.

## Phase 3G Status

Phase 3G created only the seed foundation for future local PostgreSQL development. The seed code was not run, Drizzle Kit was not run, and no database connection or write was performed.

Seed files created:

- `src/db/seed/constants.ts`
- `src/db/seed/roles.ts`
- `src/db/seed/users.ts`
- `src/db/seed/master-data.ts`
- `src/db/seed/index.ts`
- `src/db/seed/README.md`

Documentation created:

- `docs/migration/seed-foundation.md`

Planned seed data:

- canonical roles: `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`
- optional development users with fresh deterministic local UUIDs
- optional user-role joins, with `ADMIN` kept as a dedicated role
- minimal master data required to create a valid document later: one function, one activity, one material request chain, one non-material document type, and three required attachment rows
- one minimal archive classification
- one Ketua Tim assignment fixture only when development users are seeded

Dependency findings:

- `pg` and Drizzle are already present and the seed runner imports the existing `src/db/client.ts`.
- No direct `argon2` dependency or other approved password hashing dependency is installed.
- `tsx` appears in `pnpm-lock.yaml` only transitively through existing tooling; it is not a direct dependency or script runner declared in `package.json`.

Password hash strategy:

- Phase 3G does not generate password hashes.
- Development user seeding is skipped unless `DMS_DEV_SEED_PASSWORD_HASH` is set to an externally generated argon2id hash.
- No plaintext passwords or realistic secrets are committed.

Package script status:

- No `db:seed` script was added.
- Adding a script is deferred until Phase 4 or an approved dependency task adds a direct TypeScript runner such as `tsx`.

Intentionally unimplemented:

- no generated Drizzle migrations
- no Drizzle Kit execution
- no seed execution
- no database connection or write
- no API route migration
- no auth/session behavior implementation
- no login/logout/session APIs
- no password hashing service layer
- no storage implementation
- no FSM or workflow behavior changes
- no workflow rows in `dokumen_transaksi`, `log_aktivitas`, `arsip`, or `arsip_usul_musnah`

## Phase 3F Status

Phase 3F created only the arsip namespace Drizzle table definitions required by the current active archive lifecycle.

Arsip schema files created:

- `src/db/schema/arsip/arsip.ts`
- `src/db/schema/arsip/klasifikasi-arsip.ts`
- `src/db/schema/arsip/usul-musnah.ts`
- `src/db/schema/arsip/index.ts`

Tables defined under PostgreSQL schema `arsip`:

- `arsip.arsip`
- `arsip.master_klasifikasi_arsip`
- `arsip.arsip_usul_musnah`

Source evidence used:

- `supabase/migrations/005_arsip.sql`
  - base `arsip` columns: `id`, `dokumen_id`, `nomor_surat`, `klasifikasi`, `retensi_aktif`, `retensi_inaktif`, `masa_aktif_berakhir`, `masa_inaktif_berakhir`, `status_arsip`, `is_ditolak`, `catatan_arsiparis`, `archived_by`, `archived_at`, `created_at`
  - base `master_klasifikasi_arsip` columns: `id`, `nama`, `deskripsi`, `is_active`, `created_at`
  - base `arsip_usul_musnah` columns: `id`, `arsip_id`, `status`, `catatan`, `diusulkan_oleh`, `decided_by`, `created_at`, `decided_at`
  - current source indexes on `arsip.status_arsip`, `arsip.dokumen_id`, retention dates, `arsip_usul_musnah.arsip_id`, and active classifications
- `supabase/migrations/010_drop_verifikasi_penyusutan.sql`
  - drops `arsip_verifikasi_penyusutan`
  - removes `VERIFIKASI_PENYUSUTAN` from active `status_arsip`
- `supabase/migrations/011_arsip_snapshot_musnah.sql`
  - adds `lampiran_snapshot`, `musnah_at`, `musnah_by`, and `musnah_catatan`
  - adds `DIMUSNAHKAN` to active archive lifecycle
- `supabase/migrations/012_klasifikasi_hierarchy.sql`
  - adds `master_klasifikasi_arsip.parent_id` and `kode`
  - adds partial unique `kode` index and parent lookup index
- `supabase/migrations/016_nominal_realisasi.sql`
  - adds `arsip.nominal_realisasi`
- Active arsiparis API/UI routes:
  - `src/routes/api/arsiparis/dokumen.$id.archive.ts`
  - `src/routes/api/arsiparis/aktif.ts`
  - `src/routes/api/arsiparis/aktif.$id.ts`
  - `src/routes/api/arsiparis/aktif.$id/pindahkan.ts`
  - `src/routes/api/arsiparis/inaktif.ts`
  - `src/routes/api/arsiparis/inaktif.$id.ts`
  - `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts`
  - `src/routes/api/arsiparis/usul-musnah.ts`
  - `src/routes/api/arsiparis/usul-musnah.$id.ts`
  - `src/routes/api/arsiparis/search.ts`
  - `src/routes/api/arsiparis/klasifikasi/*`
  - `src/routes/arsiparis/*`

Key fields modeled:

- `arsip.arsip`
  - UUID primary key generated locally.
  - `dokumen_id` FK to `dokumen.dokumen_transaksi.id`.
  - archive metadata: `nomor_surat`, `klasifikasi`, retention labels, retention end dates, `catatan_arsiparis`, `archived_by`, `archived_at`, `created_at`.
  - lifecycle fields: `status_arsip` and `is_ditolak`.
  - `lampiran_snapshot` as JSONB to preserve archived attachment snapshots copied from `dokumen_transaksi.lampiran_urls`.
  - destruction fields: `musnah_at`, `musnah_by`, and `musnah_catatan`.
  - `nominal_realisasi` as numeric `(15,2)`.
- `arsip.master_klasifikasi_arsip`
  - `id`, `nama`, `deskripsi`, `is_active`, `created_at`, `parent_id`, and `kode`.
  - self-FK `parent_id` with set-null delete behavior, matching current hierarchy migration.
  - no `updated_at` column because current migrations/runtime do not define or update one.
- `arsip.arsip_usul_musnah`
  - `id`, `arsip_id`, `status`, `catatan`, `diusulkan_oleh`, `decided_by`, `created_at`, and `decided_at`.
  - status values remain text with the current queue-status check: `MENUNGGU`, `DISETUJUI`, `DITOLAK`.

Indexes added and why:

- `arsip.status_arsip`: active/inactive/usul-musnah/search lifecycle lists.
- `arsip.dokumen_id`: archive lookup from document detail and duplicate archive checks.
- partial `arsip.masa_aktif_berakhir` where `status_arsip='AKTIF'`: current retention lookup pattern.
- partial `arsip.masa_inaktif_berakhir` where `status_arsip='INAKTIF'`: current usul-musnah retention lookup pattern.
- `arsip.archived_at`: current archive lists and search order by archive date.
- `arsip.musnah_by`: destruction user reference lookup support.
- `master_klasifikasi_arsip.nama` unique: present in the original migration.
- partial unique `master_klasifikasi_arsip.kode` where non-null: present in hierarchy migration.
- partial `master_klasifikasi_arsip.is_active`: active classification tree queries.
- partial `master_klasifikasi_arsip.parent_id`: tree traversal and descendant soft-delete behavior.
- unique and lookup indexes on `arsip_usul_musnah.arsip_id`: current migration uniqueness and active duplicate prevention.
- `arsip_usul_musnah.status`, `diusulkan_oleh`, and `created_at`: current status/user/date list/detail patterns.

FK/onDelete policy:

- `arsip.dokumen_id` uses no-action/restrict-compatible behavior so document deletes do not silently delete archive history.
- archive user references (`archived_by`, `musnah_by`, `diusulkan_oleh`, `decided_by`) use no-action behavior so user deletion cannot erase lifecycle history.
- `arsip_usul_musnah.arsip_id` uses no-action behavior so archive rows are not silently removed through queue deletion behavior.
- `master_klasifikasi_arsip.parent_id` uses `ON DELETE SET NULL`, matching migration `012_klasifikasi_hierarchy.sql`.

Status strategy:

- `arsip.status_arsip` is modeled as text with documented canonical active values only: `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`.
- No Drizzle lifecycle check constraint was added for `status_arsip` in Phase 3F to keep migration flexibility and avoid reviving historical states.
- `DIMUSNAHKAN` remains a queryable archive history state. Preview/download blocking remains an API/storage authorization responsibility, not a schema behavior.

Historical `VERIFIKASI_PENYUSUTAN` handling:

- `arsip_verifikasi_penyusutan` is not implemented in the new Drizzle schema.
- It was created in `005_arsip.sql`, dropped by `010_drop_verifikasi_penyusutan.sql`, and AGENTS.md states the active lifecycle now moves directly `AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN`.
- `supabase/functions/arsip-retensi/index.ts` still references the old table and old status, so the Edge Function is treated as historical/deferred behavior to reconcile when the scheduler replacement is designed.

Known compatibility choices:

- Existing table names and snake_case column names are preserved, but moved into the target `arsip` namespace.
- `klasifikasi` remains text on `arsip.arsip`; no `klasifikasi_id` field was introduced because current migrations and active archive insert/read paths store the selected classification name as text.
- `lampiran_snapshot` remains JSONB and preserves the current archived attachment snapshot shape.
- No soft-delete field beyond existing `master_klasifikasi_arsip.is_active` was added.
- No `updated_at` was added to archive tables because current migrations/runtime do not define it for these tables.
- No app/support tables were created.

Intentionally unimplemented:

- no generated Drizzle migrations
- no Drizzle Kit execution
- no API route migration
- no auth/session behavior implementation
- no storage implementation
- no archive scheduler/cron/Edge replacement
- no `arsip_verifikasi_penyusutan` active table
- no normalized archive attachment/file metadata table
- no FSM or workflow behavior changes
- no UI changes

No migrations have been generated yet and no API behavior is wired to these tables yet.

## Phase 3H Status

Phase 3H prepared schema and migration validation without generating migrations, applying migrations, running seed code, connecting to the database, or changing runtime behavior.

Schema export/module readiness:

- `src/db/schema/index.ts` exports `./auth`, `./master`, `./dokumen`, `./arsip`, and `./app`.
- The `app` namespace remains a placeholder with no tables.
- `src/db/schema/app/index.ts` was made an explicit empty TypeScript module with `export {}` so root schema exports remain valid.
- No auth, master, dokumen, or arsip table definitions were changed.

Dependency and script decisions:

- `drizzle-kit` is already a direct dev dependency.
- `drizzle-orm` is already a direct dev dependency in this branch.
- `pg` is already a direct dependency.
- `tsx` was added as a direct dev dependency because seed execution uses a TypeScript entrypoint.
- `argon2` was not installed.
- Package scripts added: `db:generate`, `db:migrate`, and `db:seed`.

Validation workflow documentation:

- `docs/migration/schema-validation.md`
- `docs/migration/local-db-bootstrap.md`

Intentionally unimplemented:

- no Drizzle Kit execution
- no new migration generation
- no migration apply
- no seed execution
- no database connection or mutation
- no API route migration
- no auth/session runtime
- no storage runtime
- no FSM/workflow behavior change

The next step should be migration generation followed by SQL review in a later approved phase.

## Phase 4A Status

Phase 4A attempted to generate the first reviewed Drizzle migration from the current local schema, but generation is blocked by stale existing Drizzle migration metadata.

Pre-generation checks:

- Initial `git status --short --branch` was clean on `migration/postgres-local`.
- `drizzle.config.ts` points to `./src/db/schema/index.ts` and outputs to `./drizzle`.
- `src/db/schema/index.ts` exports `auth`, `master`, `dokumen`, `arsip`, and the empty `app` placeholder.
- A narrow schema TypeScript check passed:

```bash
pnpm exec tsc --noEmit --moduleResolution bundler --module ESNext --target ES2022 --strict --skipLibCheck --types node src/db/schema/index.ts
```

Generation command:

```bash
pnpm db:generate
```

Result:

- The first sandboxed attempt failed with `spawn EPERM`.
- The approved rerun loaded `drizzle.config.ts` but stopped at Drizzle Kit's non-interactive prompt path: `Interactive prompts require a TTY terminal`.
- The stack trace entered `promptNamedWithSchemasConflict`, consistent with conflicts between existing old public-schema snapshots and the current domain-schema model.
- No new migration files were generated.
- Existing files remain:
  - `drizzle/0000_handy_next_avengers.sql`
  - `drizzle/0001_003_dokumen_transaksi.sql`
  - `drizzle/meta/0000_snapshot.json`
  - `drizzle/meta/0001_snapshot.json`
  - `drizzle/meta/_journal.json`

SQL review summary:

- No new SQL exists to review.
- Existing stale migration SQL creates application tables in the implicit/public schema, which is not compatible with the current target schemas `auth`, `master`, `dokumen`, and `arsip`.
- No generated Phase 4A migration is recommended for apply.

Intentionally unimplemented:

- no migration applied
- no `pnpm db:migrate`
- no seed execution
- no database connection or mutation
- no API route migration
- no auth/session runtime
- no storage runtime
- no generated SQL edits

Recommendation: do not proceed to Phase 4B until an explicit follow-up task resolves the stale `drizzle/` baseline and a fresh migration can be generated and reviewed.

## Phase 4A.1 Status

Phase 4A.1 resolved the stale active Drizzle baseline and generated a fresh initial migration from the current local multi-schema Drizzle schema.

Stale baseline handling:

- Old active Drizzle artifacts were moved to `docs/migration/legacy-drizzle-baseline/`.
- Archived old files:
  - `0000_handy_next_avengers.sql`
  - `0001_003_dokumen_transaksi.sql`
  - `0000_snapshot.json`
  - `0001_snapshot.json`
  - `_journal.json`
- A README was added to explain that these files targeted the old/public schema and are preserved only for audit/reference.
- Active `drizzle/` was cleared before generation.

Fresh generation:

```bash
pnpm db:generate
```

Generated active files:

- `drizzle/0000_workable_shadowcat.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

SQL review summary:

- The generated migration creates the expected 17 application tables under `auth`, `master`, `dokumen`, and `arsip`.
- No app placeholder tables are generated.
- No application tables are generated in `public`.
- No `DROP TABLE`, `DROP SCHEMA`, destructive alter, Supabase storage/auth objects, RLS policies, Edge Function objects, `pg_cron` objects, enum status types, or imported Supabase data were found.
- Expected unique indexes, composite primary key, check constraints, cross-schema FKs, lifecycle/report indexes, and JSONB defaults were generated.

Apply blocker:

- The generated migration emits `CREATE SCHEMA "auth";`.
- It does not emit `CREATE SCHEMA` for `master`, `dokumen`, or `arsip`.
- The Docker foundation already creates all five schemas with `CREATE SCHEMA IF NOT EXISTS`.
- This means the generated migration is not safe to apply as-is against the normal Docker-initialized local database, and it is not self-contained for a database without the Docker init schemas.

Recommendation:

- Do not proceed to Phase 4B apply migration yet.
- Fix the schema-generation baseline so Drizzle and the Docker foundation agree on schema creation, then regenerate and review again.

Intentionally unimplemented:

- no migration applied
- no `pnpm db:migrate`
- no seed execution
- no database connection or mutation
- no API route migration
- no auth/session runtime
- no storage runtime
- no generated SQL edits

## Phase 4A.2 Status

Phase 4A.2 fixed Drizzle schema creation consistency with the Docker PostgreSQL foundation and regenerated the fresh initial migration.

Schema creation responsibility:

- `infra/docker/postgres/init/001-create-schemas.sql` owns schema creation for `auth`, `master`, `dokumen`, `arsip`, and `app`.
- Drizzle migrations own tables, indexes, FKs, and checks inside those pre-created schemas.
- Generated Drizzle SQL must not emit `CREATE SCHEMA` statements for these application schemas.

Root cause fixed:

- `src/db/schema/auth/users.ts` exported `authSchema = pgSchema('auth')`.
- Other `pgSchema(...)` objects were local constants.
- `authSchema` is now a local constant, so all domain schemas are treated consistently.
- No table definitions, columns, indexes, constraints, or relations were intentionally changed.

Regenerated active files:

- `drizzle/0000_dry_roland_deschain.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

SQL review summary:

- The regenerated migration creates the expected 17 application tables under `auth`, `master`, `dokumen`, and `arsip`.
- It no longer emits any `CREATE SCHEMA` statement.
- No application tables are generated in `public`.
- No `DROP TABLE`, `DROP SCHEMA`, destructive alter, Supabase storage/auth objects, RLS policies, Edge Function objects, `pg_cron` objects, enum status types, inserts, or imported Supabase data were found.
- Expected FKs, indexes, checks, and JSONB defaults remain present.
- `arsip_usul_musnah_status_check` remains present with `MENUNGGU`, `DISETUJUI`, and `DITOLAK`.
- `auth.roles` still has unique `nama` and no role-name `CHECK` constraint.

Recommendation:

- Phase 4B apply migration may proceed after explicit approval and normal local PostgreSQL prerequisites.

Intentionally unimplemented:

- no migration applied
- no `pnpm db:migrate`
- no seed execution
- no database connection or mutation
- no API route migration
- no auth/session runtime
- no storage runtime
- no generated SQL edits

## Phase 3E Status

Phase 3E created only the dokumen namespace Drizzle table definitions required by current document workflow and audit logging.

Dokumen schema files created:

- `src/db/schema/dokumen/dokumen-transaksi.ts`
- `src/db/schema/dokumen/log-aktivitas.ts`
- `src/db/schema/dokumen/index.ts`

Tables defined under PostgreSQL schema `dokumen`:

- `dokumen.dokumen_transaksi`
- `dokumen.log_aktivitas`

Source evidence used:

- `supabase/migrations/003_dokumen_transaksi.sql`
  - base `dokumen_transaksi` columns: `id`, `judul`, `fungsi_id`, `kegiatan_jenis_id`, `is_ketua_tim`, `status`, `current_step`, `revision_target`, `revision_notes`, `lampiran_urls`, `tahun`, `tanggal`, `created_by`, `created_at`, `updated_at`
  - base `log_aktivitas` columns: `id`, `dokumen_id`, `user_id`, `aksi`, `catatan`, `step_urutan`, `timestamp`
  - `log_aktivitas.dokumen_id` has cascade delete in the current migration
  - current log indexes exist on `dokumen_id` and `user_id`
- `supabase/migrations/006_jenis_kategori_detail.sql`
  - adds nullable `jenis_permintaan_id`, `kategori_permintaan_id`, and `detail_permintaan_id` to `dokumen_transaksi`
  - does not add FK constraints for those three document-chain columns
- `supabase/migrations/016_nominal_realisasi.sql`
  - adds `nominal_realisasi` and `is_non_material`
  - adds `dokumen_nominal_realisasi_positive`
- `supabase/migrations/017_master_jenis_dokumen.sql`
  - adds `keterangan_detail`
  - adds `jenis_dokumen_id` FK to `master_jenis_dokumen(id)`
- Active runtime helpers/routes:
  - `src/lib/dokumen/queries.ts`
  - `src/lib/dokumen/mutations.ts`
  - `src/lib/dokumen/logs.ts`
  - role APIs under `src/routes/api/dokumen`, `src/routes/api/ppk`, `src/routes/api/bendahara`, and `src/routes/api/laporan`
  - these confirm filters on `created_by`, `status`, `revision_target`, `fungsi_id`, `kegiatan_jenis_id`, `created_at`, `updated_at`, and log lookups by `dokumen_id`, `aksi`, and `timestamp`

Key fields modeled:

- `dokumen.dokumen_transaksi`
  - UUID primary key generated locally.
  - FK `fungsi_id` to `master.master_fungsi.id` with restrict/no-action behavior.
  - FK `kegiatan_jenis_id` to `master.master_kegiatan.id` with restrict/no-action behavior.
  - FK `created_by` to `auth.users.id` with no-action delete/update behavior so user deletion cannot silently remove workflow history.
  - FK `jenis_dokumen_id` to `master.master_jenis_dokumen.id` with no-action behavior, matching the explicit current migration FK.
  - `lampiran_urls` modeled as JSONB with default `[]` for compatibility with the current JSON array payload shape.
  - `status`, `current_step`, and `revision_target` remain text. Canonical values are documented in code comments only; no status/current-step/revision-target DB checks were added in Phase 3E.
  - `tanggal` remains text because current APIs and helpers treat it as a serialized date string.
  - `nominal_realisasi` uses numeric `(15,2)` and preserves the current non-negative check.
- `dokumen.log_aktivitas`
  - UUID primary key generated locally.
  - FK `dokumen_id` to `dokumen.dokumen_transaksi.id` with cascade delete because current migration uses cascade and the current Non-Material delete flow relies on deleting the document row.
  - FK `user_id` to `auth.users.id` with no-action delete/update behavior so audit history is not removed by user deletion.
  - Append-only contract is documented in code; no trigger/rule is implemented in Phase 3E.

Indexes added and why:

- `dokumen_transaksi.created_by`: user document lists and owner lookups.
- `dokumen_transaksi.created_by, status`: report/list filtering for a user's completed or stored documents.
- `dokumen_transaksi.status`: role inboxes and status lists.
- `dokumen_transaksi.status, current_step`: workflow inbox patterns.
- `dokumen_transaksi.revision_target`: PPK/Pegawai revision lists.
- `dokumen_transaksi.fungsi_id`: PPK/Bendahara filter and enrichment patterns.
- `dokumen_transaksi.kegiatan_jenis_id`: Ketua Tim activity report and enrichment patterns.
- `dokumen_transaksi.created_at`: user and role lists ordered by creation time.
- `dokumen_transaksi.updated_at`: status/revision lists ordered by update time.
- `dokumen_transaksi.status, updated_at`: completed/revision/status list ordering.
- `dokumen_transaksi.created_by, tahun` and `dokumen_transaksi.kegiatan_jenis_id, tahun`: laporan filters.
- `dokumen_transaksi.jenis_permintaan_id`, `kategori_permintaan_id`, `detail_permintaan_id`: report/filter enrichment and request-chain filtering.
- `log_aktivitas.dokumen_id` and `log_aktivitas.user_id`: current migration indexes.
- `log_aktivitas.dokumen_id, timestamp`: document detail log ordering.
- `log_aktivitas.dokumen_id, aksi`: PPK/Bendahara approval/rejection and idempotency checks.

Known compatibility choices:

- Existing table names and snake_case column names are preserved, but moved into the target `dokumen` namespace.
- `lampiran_urls` changes storage type from legacy text to JSONB by accepted migration decision while preserving the same JSON array response/request shape.
- No normalized lampiran/file table was created.
- No soft-delete fields were added to `dokumen_transaksi` or `log_aktivitas`.
- No status enum, PostgreSQL enum, or status check constraint was added.
- Nullable request-chain columns on `dokumen_transaksi` are intentionally not given FK constraints in Phase 3E because the current Supabase migration adds only UUID columns there. Runtime treats them as master IDs, but Phase 3E avoids adding stricter constraints not present in the source schema.
- `log_aktivitas` remains append-only by application contract. No database trigger is added yet.

Intentionally unimplemented:

- no generated Drizzle migrations
- no Drizzle Kit execution
- no API route migration
- no auth/session behavior implementation
- no storage implementation
- no normalized lampiran/file table
- no arsip or app domain tables
- no workflow/FSM behavior changes
- no UI changes

No migrations have been generated yet and no API behavior is wired to these tables yet.
