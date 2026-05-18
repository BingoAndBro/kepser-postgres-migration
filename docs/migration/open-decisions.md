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
- Local server auth helper compatibility bridge for non-auth APIs.
  Date: 2026-05-14.
  Rationale: Phase 5H added `src/lib/auth/local-server-auth.ts` as an isolated server-only bridge for future non-auth API authorization migrations. It validates local `dms_session` through the hashed session-token repository, resolves active role only after membership validation, and provides reusable session, role, and 401/403 helper functions without migrating non-auth routes or changing endpoint contracts.
- First low-risk support API local auth migration completed.
  Date: 2026-05-14.
  Rationale: Phase 5I migrated only `GET /api/users/me/ketua-tim` and `GET /api/users/me/is-ketua-tim/$kegiatanId` from legacy Supabase session authorization/RPC reads to local `dms_session` authorization plus equivalent Drizzle reads against `master.ketua_tim_assignments` and `master.master_kegiatan`. This reduces the AppLayout/current-user Ketua Tim support gap without deciding or completing broad non-auth API authorization migration, read-only domain API migration, mutation API migration, storage replacement, or Supabase Auth Admin replacement.
- Current-user profile API local auth compatibility completed.
  Date: 2026-05-14.
  Rationale: Phase 5J migrated only `GET /api/users/me` from legacy Supabase session authorization to local `dms_session` authorization through `getLocalServerSession(request)`. The endpoint maps local `auth.users.nama_lengkap`, `auth.users.nip_nrp`, and `auth.users.departemen` to the unchanged profile metadata response shape and keeps broad non-auth API authorization migration, read-only domain API migration, mutation API migration, user-management/Auth Admin replacement, password-change replacement, storage replacement, and full Supabase removal open.
- Auth local runtime stabilization and Phase 6 handoff completed.
  Date: 2026-05-14.
  Rationale: Phase 5K completed a docs/audit/handoff stabilization pass for the local auth runtime boundary and recorded the manual verification checklist, known mixed-runtime risks, remaining Supabase-backed areas, and Phase 6A storage readiness notes in `docs/migration/auth-local-runtime-stabilization-handoff.md`. This does not mark broad non-auth API migration, storage migration, Supabase Auth Admin replacement, CSRF/rate limiting, or Supabase removal complete.
- Storage replacement planning and compatibility contract completed.
  Date: 2026-05-14.
  Rationale: Phase 6A inventoried current Supabase Storage behavior and locked the compatibility contract in `docs/migration/storage-replacement-planning-contract.md`, including upload, direct browser attachment editing, pending/formal path variants, signed URL response expectations, archive snapshot/destruction, diagnostics/orphan cleanup, local filesystem principles, preview/download replacement direction, partial-failure open decisions, and backup/restore notes. This does not mark local filesystem storage implementation, upload/preview/download replacement, move/delete/archive cleanup migration, Supabase Storage retirement, or backup/restore implementation complete.
- Local filesystem storage foundation helpers added.
  Date: 2026-05-14.
  Rationale: Phase 6B added isolated server-only helper/test foundation in `src/lib/storage/local-storage-paths.ts` and `tests/unit/storage/local-storage-paths.test.ts` for local storage root resolution, logical path validation, safe physical path resolution, filename/path-segment sanitization, owner checks, and pending/formal classification. This does not mark local filesystem storage runtime implementation, upload/preview/download replacement, signed-token implementation, pending-to-formal move behavior, archive destruction delete behavior, storage diagnostics/orphan cleanup, Supabase Storage retirement, or backup/restore implementation complete.
- Internal preview/download token contract completed.
  Date: 2026-05-14.
  Rationale: Phase 6C documented the future internal `{ signedUrl }` compatibility model in `docs/migration/internal-preview-download-token-contract.md`, including internal API URL shape, token claims, signing/verification direction, expiry defaults, authorization revalidation, `DIMUSNAHKAN` blocking, filename/content-disposition parity, and revocation limitations. This was docs-only and does not mark signed-token implementation, preview/download runtime replacement, upload behavior, local storage runtime wiring, Supabase Storage retirement, or any file/data migration complete.
- File access token helper foundation added.
  Date: 2026-05-14.
  Rationale: Phase 6D.1 added `src/lib/storage/file-access-token.ts` as an isolated server-only helper for future internal preview/download URLs. The helper uses a non-JWT `v1.<base64url-canonical-json-payload>.<base64url-hmac-sha256-signature>` wire format, HMAC-SHA256, deterministic payload serialization, `timingSafeEqual`, expiry enforcement during verification, and claim validation that rejects unsupported or sensitive payload fields. This does not mark `/api/files/access`, preview/download runtime replacement, upload behavior, local storage runtime wiring, Supabase Storage retirement, or any file/data migration complete.
- Internal file access route foundation added.
  Date: 2026-05-14.
  Rationale: Phase 6D.2 added `src/lib/storage/internal-file-access.ts` as a server-only validation service for the future `GET /api/files/access?token=<opaque-token>` route. The service verifies Phase 6D.1 tokens, requires future route wiring to supply a local `dms_session`-validated session, supports only raw logical-path tokens, applies owner/role compatibility checks for raw-path access, validates logical paths, and resolves local paths only for root-containment validation. The actual route file was deferred because registering it would require `src/routeTree.gen.ts` generation, which this phase forbids. This does not mark preview/download endpoint compatibility wiring, upload replacement, local storage streaming, document/archive token access, Supabase Storage retirement, or any file/data migration complete.
- Internal file access route registered.
  Date: 2026-05-15.
  Rationale: Phase 6D.3 added `src/routes/api/files/access.ts` and registered `GET /api/files/access?token=<opaque-token>` in `src/routeTree.gen.ts`. The route is intentionally thin and delegates to the existing Phase 6D.2 service with a local server session and file token secret. This makes the internal route reachable but does not mark preview/download endpoint compatibility wiring, upload replacement, local storage streaming, document/archive token access, `DIMUSNAHKAN` token-streaming behavior, Supabase Storage retirement, or any file/data migration complete.
- Internal file access URL builder foundation added.
  Date: 2026-05-15.
  Rationale: Phase 6D.5 added `src/lib/storage/internal-file-access-url.ts` as an isolated server-only helper that signs a validated file access token payload with an explicit secret and returns only a relative `/api/files/access?token=<opaque-token>` URL. This does not mark preview/download endpoint compatibility wiring, Supabase signed URL replacement, upload replacement, local storage streaming, document/archive token access, `DIMUSNAHKAN` token-streaming behavior, Supabase Storage retirement, or any file/data migration complete.
- Internal file access raw-path local streaming foundation added.
  Date: 2026-05-15.
  Rationale: Phase 6D.7 added local file content responses to `src/lib/storage/internal-file-access.ts` only for already-supported raw logical-path tokens after token, session, logical path, root-containment, and raw owner/role compatibility checks pass. This does not mark document/archive token authorization, `DIMUSNAHKAN` checks for those token types, upload replacement, pending-to-formal local moves, delete/remove behavior, broad preview/download endpoint migration, Supabase Storage retirement, or any file/data migration complete.
- Opt-in raw preview internal URL runtime verification completed.
  Date: 2026-05-15.
  Rationale: Phase 6D.8 verified that `GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true` can return the compatible internal `{ signedUrl, filename }` shape and that the resulting raw logical-path token can serve local file content through the internal access service when a matching local file exists and token/session/path/root-containment/owner-or-role checks pass. The default raw preview request remains Supabase-backed, `useInternal=true` remains opt-in only, normal UI callers remain unchanged, and download/document/role/archive/upload behavior remains outside this decision.
- Controlled raw preview caller enablement strategy documented.
  Date: 2026-05-15.
  Rationale: Phase 6D.9 keeps `useInternal=true` manual/test-only until local file availability, fallback policy, and manual verification are defined for a selected caller. Raw-path preview callers are the only later candidates; download, document-detail, role-specific, archive, and upload surfaces remain Supabase-backed until their own authorization and storage lifecycle work exists. This does not mark runtime caller enablement, upload replacement, document/archive token authorization, or Supabase Storage retirement complete.
- Local upload replacement planning completed.
  Date: 2026-05-15.
  Rationale: Phase 6E.1 documented the conservative upload replacement plan in `docs/migration/local-upload-replacement-planning.md`, including current upload surfaces, pending path compatibility, response shape compatibility, auth/session transition concerns, local filesystem write safety, cleanup/delete implications, preview/internal URL interaction, and recommended small implementation phases. This does not mark upload replacement, UI caller migration, pending-to-formal local moves, delete/remove behavior, archive destruction deletion, preview/download default changes, document/archive token authorization, Supabase Storage retirement, or any Supabase Storage file migration complete.
- Local upload helper foundation added.
  Date: 2026-05-15.
  Rationale: Phase 6E.2 added `src/lib/storage/local-upload.ts` as an isolated server-only helper for future local upload replacement. It validates file metadata, filename safety, `kelengkapan_id`, upload-API-compatible logical pending paths, and small no-overwrite local writes without returning physical paths. This does not mark `/api/upload` migration, UI caller migration, pending-to-formal local moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, Supabase Storage retirement, or any Supabase Storage file migration complete.
- Local upload route wiring plan completed.
  Date: 2026-05-15.
  Rationale: Phase 6E.3 documented the future `/api/upload` local route wiring plan in `docs/migration/local-upload-route-wiring-plan.md`. The accepted implementation direction is to preserve `/api/upload` path, multipart request shape, `201 { url, nama, kelengkapan_id, uploaded_at }` response shape, underscore pending logical path compatibility, and `FileUploadButton` behavior while using local `dms_session` via `getLocalServerSession(request)` so owner segments align with local users. This does not mark `/api/upload` migration, UI caller migration, pending-to-formal local moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, auth runtime changes, Supabase Storage retirement, or any Supabase Storage file migration complete.
- Local `/api/upload` route implementation completed.
  Date: 2026-05-15.
  Rationale: Phase 6E.4 switched only `POST /api/upload` internals from Supabase Storage upload to local filesystem upload through the Phase 6E.2 helper while preserving the endpoint path, multipart request fields, `201` success status, and `{ url, nama, kelengkapan_id, uploaded_at }` response shape. The route uses `getLocalServerSession(request)` for the owner segment and does not trust client-supplied user ids. This does not mark UI caller migration, `AttachmentEditor` migration, pending-to-formal local moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download default changes, Supabase Storage retirement, or any Supabase Storage file migration complete.
- Pending-to-formal local move planning completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.6 documented the future local move compatibility contract in `docs/migration/pending-to-formal-local-move-planning.md`. The accepted direction is to build a helper foundation before route wiring, handle both underscore `/api/upload` pending paths and dash `AttachmentEditor` pending paths deliberately, preserve logical-only metadata and UUID-based formal path semantics, treat submit `temp-id` behavior as a compatibility risk, use local `dms_session` as the future move authority, and reject or clearly report missing/unsupported Supabase-backed source files without fetching from Supabase. This does not mark local move helper implementation, submit/rename/resubmit changes, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download migration, or Supabase Storage retirement complete.
- Local pending-to-formal move helper foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6E.7 added `src/lib/storage/local-pending-move.ts` as an isolated server-only helper for future route phases. The helper supports both underscore and dash pending path variants, validates owner segments, generates `{ownerId}/{dokumenId}/{uuid}.{ext}` targets, preserves `temp-id` as a safe document segment, resolves physical paths only internally, performs no-overwrite local moves, leaves already formal paths unchanged, and returns logical metadata only. This does not mark submit, `rename-pending`, update, resubmit, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download default migration, UI caller migration, or Supabase Storage retirement complete.
- Rename-pending local move route planning completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.8 documented the future local implementation contract for `POST /api/dokumen/rename-pending` in `docs/migration/rename-pending-local-move-route-planning.md`. The accepted direction is to keep the endpoint path and `{ dokId, lampiranUrls, userId }` request compatibility, preserve `{ success: true, renamed, errors? }` success shape, use local `dms_session` as the route authority later, treat body `userId` as compatibility input only, verify document ownership before moving, use the Phase 6E.7 helper for supported local pending paths, and report missing/unsupported local sources without Supabase fetch/copy/download/backfill/sync. This does not mark route wiring, submit/update/resubmit moves, delete/remove behavior, archive destruction, diagnostics/orphan cleanup, preview/download default migration, UI caller migration, or Supabase Storage retirement complete.
- Rename-pending local move route implementation completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.9 switched only `POST /api/dokumen/rename-pending` storage move internals to local filesystem movement using the Phase 6E.7 helper while preserving endpoint path, request compatibility, document ownership checks, and `{ success: true, renamed, errors? }` success shape. The route now uses local `dms_session` authorization through `getLocalServerSession(request)`, validates body `userId` against the local session as compatibility input, supports local underscore and dash pending paths, skips formal/safe unsupported paths, and reports missing local sources without Supabase fallback. This does not mark submit/update/resubmit local moves, `AttachmentEditor` migration, delete/remove behavior, archive destruction, diagnostics/orphan cleanup, preview/download default migration, Supabase Storage retirement, or any Supabase Storage file migration complete.
- Rename-pending runtime smoke verification completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.10 verified and documented the current `POST /api/dokumen/rename-pending` runtime state after Phase 6E.9 in `docs/migration/rename-pending-runtime-smoke-handoff.md`. The verification confirmed local `dms_session` ownership, compatibility `userId` matching, document ownership checking, local helper movement, logical-only response paths, formal/safe unsupported skips, missing-local-source failure without Supabase fallback, and no Supabase Storage migration/copy/download/backfill/sync. This does not mark submit/update/PPK resubmit local moves, `AttachmentEditor` migration, delete/remove behavior, archive destruction, diagnostics/orphan cleanup, preview/download default migration, route tree changes, database changes, auth/session runtime changes, or Supabase Storage retirement complete.
- Submit local move compatibility planning completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.11 documented `POST /api/dokumen/submit` local move compatibility in `docs/migration/submit-local-move-compatibility-planning.md`. The accepted planning direction is to preserve endpoint/request/response compatibility, preserve material and non-material status behavior, treat current `temp-id` formal paths as a compatibility risk that must not be casually removed, use local `dms_session` ownership only after submit's document/workflow dependencies are safe, preflight local pending paths before moving, and never fetch/copy/download/backfill/sync Supabase Storage files. This does not mark submit/update/PPK resubmit local moves, broad document write migration, `AttachmentEditor` migration, delete/remove behavior, archive destruction, diagnostics/orphan cleanup, preview/download default migration, route tree changes, database changes, auth/session runtime changes, or Supabase Storage retirement complete.
- Submit local move preflight/bridge planning completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.12 documented in `docs/migration/submit-local-move-preflight-bridge-planning.md` that submit is not safe to switch directly to `getLocalServerSession(request)` or local filesystem moves while current submit still uses Supabase-backed master reads, document creation, status updates, and append-only audit helpers. The accepted planning direction is to add a no-route-wiring submit move plan builder helper first, keep route wiring blocked until local id/write compatibility is proven, preserve `temp-id` short-term unless a safer real-document-id ordering is proven, and avoid all Supabase Storage fetch/copy/download/backfill/sync behavior. This does not mark submit/update/PPK resubmit local moves, local document write bridge, broad API migration, `AttachmentEditor` migration, delete/remove behavior, archive destruction, diagnostics/orphan cleanup, preview/download default migration, route tree changes, database changes, auth/session runtime changes, or Supabase Storage retirement complete.
- Submit move plan builder helper foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6E.13 added `src/lib/storage/submit-move-plan.ts` as a pure server-only planning helper for future submit move preflight. The helper produces logical-only planned move mappings and planned attachment metadata for underscore pending, dash pending, formal, unsupported, and invalid paths, defaults submit planning to `temp-id`, and can use deterministic UUID factories in tests. It does not import filesystem modules, resolve storage roots, check file existence, call Supabase Storage, wire submit, migrate submit auth, create local document write bridges, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until local identity, master-data, document writes, status updates, and audit writes are proven compatible.
- Submit move plan builder handoff/readiness review completed.
  Date: 2026-05-16.
  Rationale: Phase 6E.14 verified the Phase 6E.13 helper state in `docs/migration/submit-move-plan-builder-handoff-readiness.md`. The planner is ready as a route-independent logical planning primitive, but submit route wiring remains blocked by local identity and write-domain compatibility. The accepted next direction is Phase 6F.1 Local Submit Document/Write Compatibility Bridge Planning before any submit runtime move wiring.
- Local submit document/write compatibility bridge planning completed.
  Date: 2026-05-16.
  Rationale: Phase 6F.1 documented in `docs/migration/local-submit-document-write-bridge-planning.md` that submit should not switch directly to local `dms_session` route wiring while submit-specific local master reads, document creation, status update, and append-only audit helpers are not implemented. The accepted next direction is a bounded Phase 6F.2 Local Submit Document/Write Bridge Helper Foundation with no route wiring, no filesystem movement, and no Supabase Storage migration/copy/download/backfill/sync.
- Local submit document/write bridge helper foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.2 added `src/lib/dokumen/local-submit-write-bridge.ts` as a server-only, no-route-wiring helper foundation for local submit actor compatibility, submit-needed master-data reads, Ketua Tim assignment checks, document creation payloads, material/non-material status transition shapes, append-only audit payloads, and a repository transaction boundary. It intentionally does not import the live DB client, execute database writes, move files, call Supabase, wire `POST /api/dokumen/submit`, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until live local repository behavior, route response compatibility, local file preflight, and DB/file failure policy are proven.
- Local submit live repository mapping foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.3 added `src/lib/dokumen/local-submit-repository.ts` as a server-only, no-route-wiring repository mapping foundation for the Phase 6F.2 submit bridge contract. It records the submit-specific local schema responsibility surface, maps bridge payload names to local Drizzle-shaped insert/update/read response names, preserves JSONB `lampiran_urls` array semantics, converts numeric/timestamp boundary values for a later adapter, and proves transaction shape through an injected fake adapter only. It intentionally does not import the live DB client, execute Drizzle queries, wire `POST /api/dokumen/submit`, move files, call Supabase, run DB scripts, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until a live adapter, response parity, file preflight, and DB/file failure policy are proven.
- Local submit live Drizzle adapter foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.4 added `src/lib/dokumen/local-submit-drizzle-adapter.ts` as a server-only, submit-specific Drizzle adapter foundation behind the Phase 6F.3 injected adapter contract. It uses local Drizzle schema table exports, requires explicit database injection for tests/future composition, and keeps the live `#/db/client` import inside an explicit async factory only. It intentionally does not wire `POST /api/dokumen/submit`, execute filesystem movement, call Supabase, run DB scripts, run migrations/seeds, change route behavior, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until route response parity, submit file preflight, and DB/file failure compensation policy are proven.
- Submit route response parity and local file preflight foundation documented.
  Date: 2026-05-16.
  Rationale: Phase 6F.5 documented the current legacy `POST /api/dokumen/submit` response/status inventory, material and non-material submit result parity, local bridge/repository/adapter issue-to-response mapping, missing-local-file policy, and conservative DB/file ordering recommendation in `docs/migration/submit-route-response-parity-file-preflight-foundation.md`. The accepted direction is to fail missing local files before DB writes and before filesystem moves, never fallback to Supabase Storage, keep `temp-id` as the default submit planning target for now, and define compensation before any runtime movement is enabled. This does not mark submit route migration, route-level tests, runtime local file preflight, filesystem movement, DB/file compensation implementation, Supabase removal, or any Supabase Storage migration/copy/download/backfill/sync complete.
- Submit route parity test planning foundation documented.
  Date: 2026-05-16.
  Rationale: Phase 6F.6 documented the planned route-level parity test contract in `docs/migration/submit-route-parity-test-foundation.md`. The accepted direction is to test the unchanged legacy `POST /api/dokumen/submit` route contract with mocked Supabase server/admin clients, mocked session, mocked submit helpers, synthetic `Request` objects, and no live Supabase, live PostgreSQL, filesystem movement, storage root resolution, route generation, UI/browser tests, DB scripts, migrations, or seeds. This does not mark route parity tests implemented, submit route migration, runtime local file preflight, filesystem movement, DB/file compensation implementation, Supabase removal, or any Supabase Storage migration/copy/download/backfill/sync complete.
- Submit route parity test harness foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.7 added focused executable parity tests for the unchanged legacy `POST /api/dokumen/submit` route in `tests/unit/dokumen/submit-route-parity.test.ts` and documented the harness in `docs/migration/submit-route-parity-test-harness-foundation.md`. The tests use synthetic `Request` objects plus mocked Supabase server/admin clients, mocked session/helper dependencies, and mocked storage `.move(...)` behavior to lock current response status/body parity without live Supabase, live PostgreSQL, filesystem movement, storage root resolution, route generation, DB scripts, migrations, or seeds. This does not mark submit route migration, runtime local file preflight, filesystem movement, DB/file compensation implementation, Supabase removal, or any Supabase Storage migration/copy/download/backfill/sync complete.
- Submit file preflight helper foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.8 added `src/lib/dokumen/submit-file-preflight.ts` as an isolated server-only helper over the submit move plan output. The accepted direction is to preserve move-plan blocking issues, require injected logical-path-only source and target checks for move-required operations, fail closed on missing checkers, missing local sources, and unavailable targets, keep formal/no-op attachments out of movement checks, and avoid default filesystem checking until route wiring is explicitly approved. This does not mark submit route migration, route disk preflight wiring, filesystem movement, DB/file compensation implementation, Supabase removal, or any Supabase Storage migration/copy/download/backfill/sync complete.
- Submit DB/file compensation policy foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.9 added `src/lib/dokumen/submit-db-file-compensation.ts` as a pure route-planning decision model for future submit orchestration. The accepted direction is that preflight failures abort before DB and files, DB transaction failures abort before files, DB success plus full file movement success is the only safe submit success, and DB success plus failed or partial file movement is compensation-required and unsafe to return as success. This does not implement runtime compensation, filesystem movement, route disk preflight, submit route migration, Supabase removal, or any Supabase Storage migration/copy/download/backfill/sync.
- Submit runtime wiring readiness boundary review completed.
  Date: 2026-05-16.
  Rationale: Phase 6F.10 documented in `docs/migration/submit-runtime-wiring-readiness-boundary-plan.md` that direct `POST /api/dokumen/submit` runtime wiring remains unsafe. Existing submit foundations are ready to compose only through a route-independent, injected-dependency boundary first. The accepted next direction is a narrow Phase 6F.11 submit runtime orchestrator or route composition boundary helper outside `src/routes/api/dokumen/submit.ts`, with direct route wiring, route disk preflight, filesystem movement, runtime DB/file compensation, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync still blocked.
- Submit runtime orchestrator boundary helper foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.11 added `src/lib/dokumen/submit-runtime-orchestrator.ts` as a route-independent, injected-dependency submit orchestration classifier. The accepted direction is that submit runtime order is payload validation, actor/role boundary, master/permission boundary, move plan, preflight, local write transaction, file movement, compensation classification, then success only when safe. This does not mark route wiring, route disk preflight, filesystem movement, runtime DB/file compensation, rollback, Supabase fallback, DB scripts, or Supabase Storage migration/copy/download/backfill/sync complete.
- Submit disk preflight checker foundation added.
  Date: 2026-05-16.
  Rationale: Phase 6F.12 added `src/lib/dokumen/submit-disk-preflight-checker.ts` as an isolated submit-specific checker that can later satisfy the `preflightSubmitFiles(...)` injected source/target checker contract. The accepted direction is logical-path-only public methods, internal safe physical path resolution through existing local storage path helpers, read-only source existence and target availability checks, fail-closed behavior for unsafe paths and check failures, no physical path/root/raw error exposure, no route wiring, no file movement, no Supabase fallback, and no Supabase Storage migration/copy/download/backfill/sync. This does not mark submit route migration, route disk preflight wiring, filesystem movement, runtime DB/file compensation, rollback, DB scripts, or Supabase removal complete.
- Submit route local auth dry-run boundary added.
  Date: 2026-05-16.
  Rationale: Phase 6G.2 added a temporary `useLocalAuthDryRun=true` query-parameter branch to `POST /api/dokumen/submit` that validates the local `dms_session` boundary through `getLocalServerSession(request)` after existing payload validation, requires PEGAWAI role compatibility, blocks ADMIN-only and non-PEGAWAI actors, and returns a non-submit-success dry-run response before legacy Supabase clients, document writes, audit writes, or storage moves execute. Default submit behavior remains legacy Supabase-backed. This does not mark local submit DB writes, route disk preflight, filesystem movement, runtime DB/file compensation, Supabase fallback, or Supabase Storage migration/copy/download/backfill/sync complete.
- Submit route local preflight dry-run boundary added.
  Date: 2026-05-16.
  Rationale: Phase 6G.3 added a temporary `useLocalPreflightDryRun=true` query-parameter branch to `POST /api/dokumen/submit` that preserves existing request validation, validates local `dms_session` and PEGAWAI role compatibility, builds a submit move plan from request attachments with local user ownership and default `temp-id` target behavior, and runs read-only disk preflight through `preflightSubmitFiles(...)` plus `createSubmitDiskPreflightChecker()`. Missing local sources, target conflicts, unsupported paths, and unsafe paths fail before DB writes and before filesystem movement. Default submit behavior remains legacy Supabase-backed. This does not mark local submit DB writes, filesystem movement, runtime DB/file compensation, Supabase fallback, or Supabase Storage migration/copy/download/backfill/sync complete.
- Submit route local DB transaction branch added.
  Date: 2026-05-16.
  Rationale: Phase 6G.4 added a controlled `useLocalDbSubmit=true` query-parameter branch to `POST /api/dokumen/submit` that preserves existing request validation, validates local `dms_session` and PEGAWAI role compatibility, builds the submit move plan, runs read-only local disk preflight, blocks move-required payloads because filesystem movement is not implemented, and allows formal/no-move-required-only payloads to create document, update status, and append audit through the local submit bridge/repository/Drizzle adapter transaction. Default submit behavior remains legacy Supabase-backed. This does not mark filesystem movement, runtime DB/file compensation, Supabase fallback, or Supabase Storage migration/copy/download/backfill/sync complete.
- Submit route controlled local file movement added.
  Date: 2026-05-16.
  Rationale: Phase 6G.5 updated the controlled `useLocalDbSubmit=true` branch so preflight-approved move-required local pending files can complete submit after local DB transaction success. The branch uses the existing local pending move helper, preserves planned final logical `lampiran_urls`, returns success only after full movement success, and returns safe non-success for movement or partial movement failure without claiming rollback. Default submit behavior remains legacy Supabase-backed. This does not mark runtime DB/file compensation, Supabase fallback, default submit retirement, global storage migration, or Supabase Storage migration/copy/download/backfill/sync complete.
- Submit runtime stabilization and Supabase submit path retirement completed.
  Date: 2026-05-16.
  Rationale: Phase 6G.6 made the local submit runtime the default for `POST /api/dokumen/submit`, removed the submit-route legacy Supabase execution branch, and kept no diagnostic legacy fallback. The route now uses local `dms_session` auth, submit move planning, read-only local disk preflight, local DB transaction, and controlled local pending-to-formal movement for normal submit requests. `useLocalAuthDryRun=true` and `useLocalPreflightDryRun=true` remain temporary diagnostics; `useLocalDbSubmit=true` is a redundant alias. This does not mark global Supabase runtime retirement, preview/download migration, update/resubmit movement, real DB/file rollback, or Supabase Storage migration/copy/download/backfill/sync complete.
- Remaining migration phases should be runtime-oriented.
  Date: 2026-05-16.
  Rationale: Phase 6F created useful submit foundations but became too granular. From Phase 6G onward, future phases should make route/domain runtime progress unless a concrete blocker is discovered. Planning-only or helper-only phases should be rare, short, and justified by a specific blocker. The accepted submit sequence is compressed into Phase 6G.2 through Phase 6G.6, followed by domain read migration, workflow write migration, storage surface completion, Supabase runtime retirement, and final stabilization through Phase 11.
- Clean local target remains the migration assumption.
  Date: 2026-05-16.
  Rationale: The local target does not import old Supabase production/current data and does not migrate, copy, download, backfill, or sync old Supabase Storage files. Local PostgreSQL uses seed/new local data, and local filesystem storage uses newly uploaded local files. Missing old Supabase-backed files are expected during the transition and should fail cleanly without blocking local runtime integration or adding Supabase Storage fallback.
- Phase 7 major read-domain migration is closed for server/API `GET` routes.
  Date: 2026-05-17.
  Rationale: Phase 7F audit found no true remaining blocker for the scoped major read domains migrated in Phase 7B through 7E. Remaining Supabase usages are not global blockers for Phase 8 because they are assigned to mixed mutation leftovers, storage/file-access, workflow/write mutations, admin/user-management/auth-admin, or browser helper/UI retirement. This does not mark global Supabase retirement, browser helper retirement, preview/download/storage migration, user-management/Auth Admin replacement, archive lifecycle/destruction behavior, or mutation migration complete.
- Phase 8 selected clean-local write-domain migration is closed.
  Date: 2026-05-18.
  Rationale: Phase 8G audit found no true remaining Phase 8 blocker in the selected migrated write domains from Phase 8B through 8F. Pegawai update/revision metadata writes, PPK decision writes, Bendahara decision writes, safe Arsiparis archive metadata/lifecycle writes, and non-user-management master/admin metadata CRUD writes are local-backed for the clean local target. Remaining Supabase usages are not global blockers for Phase 9 because they are assigned to storage/file-access, user-management/Auth Admin, global cleanup/browser helper retirement, or the cross-role nominal compatibility decision. This does not mark preview/download/storage completion, user-management/Auth Admin replacement, browser helper/UI retirement, package/env cleanup, or global Supabase removal complete.
- Scoped non-material document delete audit exception accepted.
  Date: 2026-05-18.
  Rationale: Caller audit confirmed `DELETE /api/dokumen/$id` is the Pegawai UI delete path for owner non-material `TERSIMPAN` documents, not archive destruction or approval workflow deletion. To preserve that legacy behavior, the route may hard-delete only when the caller has a local session, assigned `PEGAWAI` role, document ownership, `is_non_material=true`, no material request-chain fields, `status='TERSIMPAN'`, and no archive row. Under the current `log_aktivitas.dokumen_id` cascade FK, logs for that deleted user-owned non-approval saved document may be removed with the document. This exception must not be generalized to material, approval, revision, completed, archived, archive-linked, or archive-destruction paths.

## Still Open

- Exact Drizzle schema naming conventions.
  Phase 3A recommendation: preserve existing snake_case table/column names, use camelCase Drizzle identifiers, and use explicit index/constraint names. See `docs/migration/drizzle-schema-plan.md` Section 5.
- Which current Supabase user metadata fields become first-class columns versus JSON metadata.
- Exact repository folder structure for DB/auth/storage modules.
  Phase 3A recommendation: use `src/db/` with domain-grouped schema files. See `docs/migration/drizzle-schema-plan.md` Section 4.
- Exact transition strategy for old Supabase helpers.
- Internal signed-token runtime implementation remains open for document/archive authorization revalidation, `DIMUSNAHKAN` blocking, and whether later phases need persisted nonce/jti records or stronger session binding beyond the Phase 6D.1 stateless helper claims. Phase 6D.7 streams only raw logical-path token files after existing validation; document/archive/status-check token streaming remains unsupported.
- Preview/download endpoint compatibility wiring.
- Pending-to-formal local move implementation for update and PPK resubmit.
- Archive destruction local delete behavior.
- Storage diagnostics/orphan cleanup local implementation.
- Whether preview/download endpoints eventually stream directly or keep `{ signedUrl }` permanently after transition.
- Whether local storage preserves current path strings exactly or uses a compatibility mapping layer.
  Phase 3A recommendation: preserve UUID-based ownership semantics and the current lampiran JSON shape during compatibility. Since no existing Supabase data is being imported, old Supabase user UUID path values are not preserved unless a future data migration decision changes scope. See `docs/migration/drizzle-schema-plan.md` Sections 6 and 11.
- Exact DB/file partial-failure and retry policy for move/delete operations.
- Local filesystem storage runtime implementation.
- Whether password change revokes all sessions or rotates and keeps only the current session.
- Exact production bootstrap admin strategy.
- Real password provisioning workflow for production/bootstrap users.
- Supabase Auth runtime retirement.
- Non-auth API authorization migration to local `dms_session`.
- Browser helper/UI read replacement strategy after server/API read migration closure.
- Mutation API migration.
- Cross-role nominal update compatibility.
  Phase 8G note: `PATCH /api/dokumen/$id/nominal` remains deferred because the legacy route is cross-role and should not be narrowed casually during selected write-domain closure.
- Destructive archive approval compatibility.
  Phase 8G note: `PATCH /api/arsiparis/usul-musnah/$id` remains Phase 9 work because the legacy route combines archive metadata, physical file deletion, snapshot clearing, `DIMUSNAHKAN`, and file-access semantics.
- Supabase Auth Admin replacement for user management and user-name enrichment.
- User management and password-change replacement.
- CSRF and rate-limiting details for cookie-auth runtime.
- Remember-me request shape support.
- Storage replacement.
- Supabase Storage retirement.
- Backup/restore process.
- Archive scheduler replacement.
- Full Supabase removal.
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
