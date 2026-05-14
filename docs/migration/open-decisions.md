# Open Decisions

This file tracks accepted architecture direction and unresolved choices. Rationale should stay linked to the contract docs so implementation agents do not rediscover or override these decisions accidentally.

## Decided

- Local PostgreSQL via Docker.
  Rationale: target deployment is local/LAN and should not depend on Supabase-hosted PostgreSQL.
- No Supabase local stack.
  Rationale: migration target is plain local PostgreSQL plus local auth/storage, not a self-hosted Supabase clone.
- No Supabase dummy restore.
  Rationale: schema and seed should be intentional and deterministic for the new local system.
- Drizzle schema from scratch.
  Rationale: current Drizzle schema is partial; Supabase migrations plus runtime behavior are the compatibility reference.
- PostgreSQL schemas: `auth`, `master`, `dokumen`, `arsip`, `app`.
  Rationale: domain separation and future RLS readiness without making schema names a security boundary.
- Preserve API endpoint paths.
  Rationale: UI and helper contracts are already built around current `/api/*` routes.
- Preserve request/response shapes.
  Rationale: endpoint compatibility is required to avoid UI behavior drift during phased migration.
- Keep Supabase code as reference until parity is verified.
  Rationale: Supabase behavior is broad and scattered; early deletion would remove the only reliable reference.
- Custom cookie session auth.
  Rationale: Supabase Auth is being replaced by local auth while preserving app UX.
- Session token cookie should be `HttpOnly`.
  Rationale: session token is a credential and must not be readable by client JavaScript.
- Active role cookie may remain readable if needed for UX compatibility.
  Rationale: current role switch UX reads/writes `dms_active_role`; server must still validate it against user roles.
- `/api/auth/session` should become the canonical bootstrap endpoint for `AppLayout`.
  Rationale: current browser Supabase session bootstrap must be replaced with server-validated session data.
- Argon2id password hashing.
  Rationale: target auth contract requires modern password hashing.
- Use the `argon2` package for password hashing with Argon2id parameters `memoryCost: 65536`, `timeCost: 3`, and `parallelism: 1`.
  Date: 2026-05-13.
  Rationale: `argon2` is the approved package for Phase 5A, uses the required Argon2id algorithm, and `parallelism: 1` is safer for cross-machine local development compatibility. Bcrypt, bcryptjs, scrypt, PBKDF2, and custom cryptography were not used.
- Session token stored hashed.
  Rationale: raw session tokens must not be stored in the database.
- Session cookie name: `dms_session`.
  Date: 2026-05-13.
  Rationale: Phase 5C selects a dedicated opaque custom session cookie while preserving the existing active-role cookie separately.
- Active role cookie remains `dms_active_role`.
  Date: 2026-05-13.
  Rationale: current UX and role-switch behavior already use this cookie; it remains UX state and not authorization proof.
- Session token hash algorithm: SHA-256 encoded as base64url.
  Date: 2026-05-13.
  Rationale: session tokens are high-entropy random values, so a deterministic fast hash is appropriate for indexed lookup. This decision does not apply to passwords, which remain Argon2id.
- Session token raw encoding: base64url.
  Date: 2026-05-13.
  Rationale: base64url is cookie-safe for opaque random bytes without adding user-readable claims.
- Default session cookie policy: `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when served over HTTPS.
  Date: 2026-05-13.
  Rationale: this matches the auth contract and keeps the session credential unavailable to client JavaScript while preserving LAN HTTP development compatibility.
- Default session expiration: 8 hours.
- Remember me expiration: 30 days.
- ADMIN remains a dedicated role and must not be combined with other roles.
  Rationale: current role-switch behavior and migration constraints require admin exclusivity.
- Do not rely on client-side RBAC for security.
  Rationale: root route is currently `ssr: false`; API/server authorization is the security boundary.
- Authorization remains in API/server layer.
- Do not implement PostgreSQL RLS yet.
  Rationale: current app often uses service-role/admin bypass with app-layer authorization; RLS is a later hardening concern.
- Local filesystem storage under `storage/`.
- Storage not exposed as static public files.
- Preview/download via API.
- Preserve `{ signedUrl }` response shape during storage transition while current UI expects it.
  Rationale: `storage-client` and role file helpers currently consume `signedUrl`.
- Replacement `signedUrl` should point to an internal API route, not a public filesystem path.
  Rationale: local files must never be exposed directly.
- Internal file-access token should be short-lived and signed.
  Rationale: replaces Supabase signed URL expiry while preserving controlled temporary access.
- Raw path query endpoints must strictly validate paths and never map arbitrary input directly to filesystem paths.
  Rationale: `/api/dokumen/preview-url` and `/api/dokumen/download-url` are high-risk after filesystem migration.
- Initial development deployment should run PostgreSQL in Docker and the app on the host.
  Rationale: app containerization should not distract from DB/auth/storage parity.
- Do not containerize the app in the first foundation phase.
- Local/LAN deployment is a target.
- Plan LAN deployment after DB/auth/storage stabilize.
  Rationale: packaging decisions are safer once runtime behavior is known.
- For LAN deployment, app must listen on `0.0.0.0` or an equivalent LAN-reachable interface.
- PostgreSQL should not be exposed to LAN unless explicitly needed.
- HTTPS strategy for LAN is deferred unless required.
- Use UUID primary keys for local users and seed users; do not import or preserve actual old Supabase user UUID values.
  Date: 2026-05-12.
  Rationale: this project creates a new local PostgreSQL schema from scratch with new minimal seed data, not an existing Supabase data import. UUID-based ownership and foreign-key semantics remain required, and fresh deterministic UUIDs may be used for seed data. Preserving actual old Supabase UUID values is deferred unless a future explicit data migration decision changes this. See `docs/migration/drizzle-schema-plan.md` Section 6.
- Keep lampiran metadata embedded in `dokumen_transaksi.lampiran_urls` as JSONB during the compatibility phase.
  Date: 2026-05-12.
  Rationale: current request/response shapes, pending-to-formal storage behavior, and `arsip.lampiran_snapshot` depend on the existing JSON array shape. A normalized file metadata table can be added later as a hybrid after storage parity is proven. See `docs/migration/drizzle-schema-plan.md` Section 11.
- Use text columns with check constraints for status/enum-like values during the compatibility phase.
  Date: 2026-05-12.
  Rationale: workflow and archive states have changed during recent migrations. Text plus check constraints is easier to evolve than PostgreSQL enum types while TypeScript constants and FSM tests remain canonical. See `docs/migration/drizzle-schema-plan.md` Section 12.
- Seed strategy should be deterministic, minimal, and idempotent.
  Date: 2026-05-12.
  Rationale: seed only roles, bootstrap admin, minimal required master data, and dev/test fixtures when explicitly in dev/test mode. Do not restore Supabase dummy data or seed production secrets. See `docs/migration/drizzle-schema-plan.md` Section 13.
- Canonical seed roles are `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`.
  Date: 2026-05-13.
  Rationale: these are the application roles already defined by the domain model. Phase 3G seeds them as initial dynamic `auth.roles` rows without adding a role-name enum/check restriction.
- Seed users use fresh deterministic local UUIDs.
  Date: 2026-05-13.
  Rationale: deterministic IDs make local development repeatable while preserving UUID ownership and FK semantics. Old Supabase Auth UUIDs are not imported or preserved.
- Minimal idempotent seed strategy for Phase 3G.
  Date: 2026-05-13.
  Rationale: Phase 3G seeds only canonical roles, optional development users, minimal FK-supporting master data, one archive classification, and a safe optional Ketua Tim fixture. It does not seed workflow rows or imported Supabase data.
- Use `drizzle-kit generate` with reviewed SQL migrations, not `drizzle-kit push`, as the main migration workflow.
  Date: 2026-05-12.
  Rationale: generated SQL should be reviewed and committed; Docker init SQL remains limited to base schemas/extensions. See `docs/migration/drizzle-schema-plan.md` Section 14.
- Docker init SQL owns application schema creation; Drizzle migrations own tables, indexes, FKs, and checks inside those schemas.
  Date: 2026-05-13.
  Rationale: the local Docker foundation creates `auth`, `master`, `dokumen`, `arsip`, and `app` with `CREATE SCHEMA IF NOT EXISTS`, so generated Drizzle migrations must assume those schemas already exist and must not duplicate schema creation.
- Use `pg`/node-postgres as the local PostgreSQL runtime driver for Drizzle client usage.
  Date: 2026-05-12.
  Rationale: `pg` and `@types/pg` are installed, and `src/db/client.ts` now wires `Pool` from `pg` to `drizzle-orm/node-postgres`. The client remains unused by API routes until later migration phases.
- Auth schema table structure for Phase 3C.
  Date: 2026-05-12.
  Rationale: `src/db/schema/auth/` now defines only `auth.users`, `auth.roles`, `auth.user_roles`, and `auth.sessions` for the future local custom auth system. The implementation uses UUID primary keys for local users and roles, first-class user profile/status fields plus JSONB metadata, hashed session-token storage, and join/session indexes. Canonical initial roles are `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`, but `auth.roles` remains dynamic and is not restricted by a DB CHECK constraint. No migrations, seed users, auth behavior, API wiring, or UI changes were added.
- ADMIN exclusivity enforcement is documented for service/seed/admin mutation logic in Phase 3C.
  Date: 2026-05-12.
  Rationale: Cross-row "ADMIN cannot coexist with non-admin roles" is not expressible with a simple join-table check constraint. Phase 3C documents this in code and leaves trigger or stronger database enforcement for a later explicit hardening decision.
- Master schema table structure for Phase 3D.
  Date: 2026-05-12.
  Rationale: `src/db/schema/master/` now defines only the active master/domain-support tables required by current master-data, workflow, report, and Ketua Tim references under PostgreSQL schema `master`: `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen`, `master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_jenis_dokumen`, and `ketua_tim_assignments`. Compatibility choices preserve current table/column names, active-row filtering, kelengkapan hard-delete behavior, nullable request-chain semantics, and `ketua_tim_assignments` uniqueness per `kegiatan_id`. No migrations, seed data, API wiring, auth behavior, storage behavior, or dokumen/arsip/app tables were added.
- Dokumen schema table structure for Phase 3E.
  Date: 2026-05-12.
  Rationale: `src/db/schema/dokumen/` now defines only `dokumen.dokumen_transaksi` and `dokumen.log_aktivitas` for current workflow rows and append-only audit logging. Compatibility choices preserve current column names, status/current-step/revision-target as text, `tanggal` as text, `lampiran_urls` as JSONB with the existing payload shape, explicit current FK behavior where present, no normalized lampiran table, and no API/FSM/storage behavior wiring. Request-chain columns remain nullable UUID columns without Phase 3E FK constraints because the current Supabase migration added them without FK constraints.
- Arsip schema table structure for Phase 3F.
  Date: 2026-05-12.
  Rationale: `src/db/schema/arsip/` now defines only the active archive lifecycle tables under PostgreSQL schema `arsip`: `arsip`, `master_klasifikasi_arsip`, and `arsip_usul_musnah`. Compatibility choices preserve current table/column names, text `status_arsip` with documented active values, JSONB `lampiran_snapshot`, hierarchy fields `parent_id`/`kode`, destruction metadata, and no API/FSM/storage/scheduler behavior wiring. Historical `arsip_verifikasi_penyusutan` is not modeled as an active table because current migrations dropped it and AGENTS.md defines the direct active lifecycle.
- Historical `arsip_verifikasi_penyusutan` is obsolete for the current schema.
  Date: 2026-05-12.
  Rationale: The table was created in `supabase/migrations/005_arsip.sql` but dropped by `supabase/migrations/010_drop_verifikasi_penyusutan.sql`; AGENTS.md states `VERIFIKASI_PENYUSUTAN` was removed from active lifecycle behavior. The old Edge Function reference remains a scheduler-replacement reconciliation issue, not an active Drizzle table decision.
- Use `tsx` as the direct TypeScript runner for seed scripts.
  Date: 2026-05-13.
  Rationale: `src/db/seed/index.ts` is a TypeScript entrypoint. Declaring `tsx` directly avoids relying on transitive tooling dependencies when running the seed manually after reviewed migrations are applied.
- Package script names for local DB migration preparation.
  Date: 2026-05-13.
  Rationale: Phase 3H defines separate safe scripts: `db:generate` for `drizzle-kit generate`, `db:migrate` for `drizzle-kit migrate`, and `db:seed` for `tsx src/db/seed/index.ts`. Combined generate/migrate/seed and destructive reset scripts remain intentionally absent.
- Development user seed execution for local development.
  Date: 2026-05-13.
  Rationale: Phase 5B.1 confirmed the effective local seed environment already contained an Argon2id-shaped `DMS_DEV_SEED_PASSWORD_HASH`, ran only `pnpm db:local:seed`, and verified 5 development users, 8 user-role joins, 0 sessions, 0 workflow rows, 0 archive transaction rows, and no application tables in `public`. This decision is local-development-only and does not decide production bootstrap, session implementation, login/logout/session API migration, API migration strategy, storage replacement, signed-token implementation, backup/restore, or archive scheduler replacement.
- Phase 5D session token utility and repository foundation lives under `src/lib/auth/`.
  Date: 2026-05-13.
  Rationale: The foundation is server-only and isolated from current runtime imports. `session-constants.ts`, `session-token.ts`, and `session-repository.ts` provide reusable building blocks for future custom auth without changing Supabase-backed login/logout/session behavior or exporting through shared barrels.
- Login/logout/session API compatibility implementation for local custom auth.
  Date: 2026-05-13.
  Rationale: Phase 5E replaced only the internals of `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/session` with local PostgreSQL, Drizzle, Argon2id password verification, opaque `dms_session` cookies, and hashed session-token storage while preserving endpoint paths and JSON response shapes. `AppLayout`, the login page, client auth-state, role-switch, non-auth APIs, storage, and workflow behavior remain outside this decision.
- Role-switch API compatibility implementation for local custom auth.
  Date: 2026-05-14.
  Rationale: Phase 5E.1 replaced only the internals of `POST /api/auth/role-switch` with local `dms_session` validation, hashed session-token lookup, assigned-role validation, ADMIN switch rejection, and compatible `dms_active_role` cookie writing. The auth API layer now covers login, logout, session, and role-switch, while `AppLayout`, the login page, client auth-state, non-auth APIs, storage, and workflow behavior remain outside this decision.
- Browser auth runtime integration for AppLayout/login/auth-state.
  Date: 2026-05-14.
  Rationale: Phase 5F switched the login page to `POST /api/auth/login`, switched `AppLayout` bootstrap to `GET /api/auth/session`, wired central logout to `POST /api/auth/logout`, and wired central role switching to `POST /api/auth/role-switch` while preserving the existing client auth-state shape. This addresses the AppLayout/auth-state local custom session integration and login page switch decisions only. Non-auth API authorization, Supabase Auth Admin replacement, storage, workflow/archive behavior, CSRF/rate limiting, and full Supabase Auth runtime retirement remain open.
- Focused auth regression and Supabase Auth retirement planning completed.
  Date: 2026-05-14.
  Rationale: Phase 5G confirmed the Phase 5F browser/runtime boundary with targeted grep checks and focused auth helper tests, then recorded the manual verification checklist and remaining Supabase Auth retirement order in `docs/migration/auth-regression-and-retirement-plan.md`. This does not decide or complete broad non-auth API authorization migration, Supabase Auth Admin replacement, storage replacement, CSRF/rate limiting, or full Supabase Auth runtime retirement.

## Still Open

- Exact Drizzle schema naming conventions.
  Phase 3A recommendation: preserve existing snake_case table/column names, use camelCase Drizzle identifiers, and use explicit index/constraint names. See `docs/migration/drizzle-schema-plan.md` Section 5.
- Which current Supabase user metadata fields become first-class columns versus JSON metadata.
- Exact repository folder structure for DB/auth/storage modules.
  Phase 3A recommendation: use `src/db/` with domain-grouped schema files. See `docs/migration/drizzle-schema-plan.md` Section 4.
- Exact transition strategy for old Supabase helpers.
- Exact signed-token implementation details, including token claims, nonce/jti persistence, signing algorithm, and expiry durations.
- Whether preview/download endpoints eventually stream directly or keep `{ signedUrl }` permanently after transition.
- Whether local storage preserves current path strings exactly or uses a compatibility mapping layer.
  Phase 3A recommendation: preserve UUID-based ownership semantics and the current lampiran JSON shape during compatibility. Since no existing Supabase data is being imported, old Supabase user UUID path values are not preserved unless a future data migration decision changes scope. See `docs/migration/drizzle-schema-plan.md` Sections 6 and 11.
- Exact DB/file partial-failure and retry policy for move/delete operations.
- Whether password change revokes all sessions or rotates and keeps only the current session.
- Exact production bootstrap admin strategy.
- Real password provisioning workflow for production/bootstrap users.
- Supabase Auth runtime retirement.
- Non-auth API authorization migration to local `dms_session`.
- Supabase Auth Admin replacement for user management and user-name enrichment.
- Local server auth helper compatibility for non-auth APIs.
- CSRF and rate-limiting details for cookie-auth runtime.
- Remember-me request shape support.
- Storage replacement.
- Local filesystem storage.
- Upload/preview/download local storage compatibility.
- Backup/restore process.
- Archive scheduler replacement.
- Whether final LAN deployment runs app directly on host or app plus PostgreSQL in Docker Compose.
- Backup schedule and retention.
- Server hostname/static IP strategy.
- What local scheduled-job mechanism replaces Supabase Edge Function plus pg_cron for archive retention.
- How the obsolete `arsip_verifikasi_penyusutan` references inside the old Supabase Edge Function should be reconciled when replacing archive retention scheduling.
- Exact API migration strategy by endpoint after DB/auth/storage foundations are ready.
- Whether `.env.example` concrete-looking Supabase keys should be replaced with placeholders in a separate hygiene task.

## Decision Log Rules

- Add the date when a decision is made.
- Record the reason and rejected alternatives.
- Update `AGENTS.md` if the decision becomes a project invariant.
- Do not encode an open decision in implementation by accident.
- If a decision affects API, auth, storage, or deployment behavior, update the relevant contract doc before implementation.
