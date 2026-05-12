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
- Enum/check names: use domain-prefixed names such as `dokumen_status_check`, `arsip_status_arsip_check`, `auth_roles_nama_check`.
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

- `nama` should be limited to `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, `ADMIN` for the compatibility phase.
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
- Should ADMIN exclusivity be enforced by database trigger in Phase 3C or app service plus tests first?
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

Dependency inspection found `drizzle-orm` and `drizzle-kit` already present, but no PostgreSQL runtime driver dependency such as `pg`, `postgres`, or `@neondatabase/serverless` is declared in `package.json`. Because this task forbids installing packages, `src/db/client.ts` is a safe server-only placeholder: it requires `DATABASE_URL`, exports `db`, and throws a clear driver-missing error if used before an approved PostgreSQL driver is added.

Intentionally unimplemented:

- no domain schema tables
- no relations
- no generated Drizzle migrations
- no Drizzle Kit execution
- no API route usage
- no auth implementation
- no storage implementation

Corrected UUID decision remains: Use fresh local UUIDs for new local users/seeds while preserving UUID-based ownership and foreign-key semantics; old Supabase UUID values are not imported because existing Supabase data is not being migrated.
