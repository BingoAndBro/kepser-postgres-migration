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
- Session token stored hashed.
  Rationale: raw session tokens must not be stored in the database.
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
- Use `drizzle-kit generate` with reviewed SQL migrations, not `drizzle-kit push`, as the main migration workflow.
  Date: 2026-05-12.
  Rationale: generated SQL should be reviewed and committed; Docker init SQL remains limited to base schemas/extensions. See `docs/migration/drizzle-schema-plan.md` Section 14.
- Use `pg`/node-postgres as the local PostgreSQL runtime driver for Drizzle client usage.
  Date: 2026-05-12.
  Rationale: `pg` and `@types/pg` are installed, and `src/db/client.ts` now wires `Pool` from `pg` to `drizzle-orm/node-postgres`. The client remains unused by API routes until later migration phases.
- Auth schema table structure for Phase 3C.
  Date: 2026-05-12.
  Rationale: `src/db/schema/auth/` now defines only `auth.users`, `auth.roles`, `auth.user_roles`, and `auth.sessions` for the future local custom auth system. The implementation uses UUID primary keys for local users and roles, first-class user profile/status fields plus JSONB metadata, hashed session-token storage, and join/session indexes. Canonical initial roles are `PEGAWAI`, `PPK`, `BENDAHARA`, `ARSIPARIS`, and `ADMIN`, but `auth.roles` remains dynamic and is not restricted by a DB CHECK constraint. No migrations, seed users, auth behavior, API wiring, or UI changes were added.
- ADMIN exclusivity enforcement is documented for service/seed/admin mutation logic in Phase 3C.
  Date: 2026-05-12.
  Rationale: Cross-row "ADMIN cannot coexist with non-admin roles" is not expressible with a simple join-table check constraint. Phase 3C documents this in code and leaves trigger or stronger database enforcement for a later explicit hardening decision.

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
- Whether final LAN deployment runs app directly on host or app plus PostgreSQL in Docker Compose.
- Backup schedule and retention.
- Server hostname/static IP strategy.
- What local scheduled-job mechanism replaces Supabase Edge Function plus pg_cron for archive retention.
- Whether obsolete-looking `arsip_verifikasi_penyusutan` Edge Function behavior should be migrated, removed, or reconciled with current archive lifecycle.
- Whether `.env.example` concrete-looking Supabase keys should be replaced with placeholders in a separate hygiene task.

## Decision Log Rules

- Add the date when a decision is made.
- Record the reason and rejected alternatives.
- Update `AGENTS.md` if the decision becomes a project invariant.
- Do not encode an open decision in implementation by accident.
- If a decision affects API, auth, storage, or deployment behavior, update the relevant contract doc before implementation.
