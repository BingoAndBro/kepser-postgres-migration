# Migration Roadmap

This roadmap keeps migration work small, reviewable, and behavior-preserving.

## Phase 0: Planning, Best Practices, And Constitution Update

Goal: Establish the migration rules before implementation.

Allowed changes:

- Documentation under `docs/migration/` and `docs/best-practices/`.
- `AGENTS.md` updates if migration rules become canonical.
- `.gitkeep` files for storage folders.

Forbidden changes:

- Application source changes.
- Package changes.
- Docker, Drizzle, auth, or storage implementation.

Expected output files:

- Migration planning docs.
- Best-practice notes.
- Open decision log.

Validation checklist:

- Docs cite official/trusted sources.
- No `src/` files changed.
- No package files changed.

## Phase 1: Migration Foundation Setup

Goal: Add non-invasive local migration scaffolding.

Allowed changes:

- Environment example docs.
- Local-only folders.
- Scripts only if explicitly planned and reviewed.

Forbidden changes:

- No endpoint behavior changes.
- No Supabase removal.

Expected output files:

- Local setup notes.
- Environment variable reference.

Validation checklist:

- `pnpm` remains the only package manager.
- App still builds/runs as before.

## Phase 2: Supabase Dependency Audit

Goal: Map every Supabase Auth, Database, Storage, signed URL, RPC, and Realtime dependency.

Allowed changes:

- Audit docs.
- Code search notes.
- Endpoint priority list.

Forbidden changes:

- No replacement implementation.
- No deletion of Supabase helpers.

Expected output files:

- Completed `docs/migration/supabase-audit.md`.
- File and endpoint migration matrix.

Validation checklist:

- All Supabase client factories accounted for.
- All preview/download paths accounted for.
- All auth/session flows accounted for.

## Phase 3: Drizzle PostgreSQL Schema Foundation

Goal: Define the target PostgreSQL schema from scratch.

Allowed changes:

- Drizzle schema files.
- Drizzle config.
- Generated migration files after review.
- Schema documentation.

Forbidden changes:

- No API migration yet.
- No data restore from Supabase dummy data.
- No RLS implementation yet.

Expected output files:

- Drizzle schema organized by domain.
- Migration SQL.
- Schema documentation.

Validation checklist:

- Schemas exist for `auth`, `master`, `dokumen`, `arsip`, and `app`.
- FK/index strategy reviewed.
- RLS-friendly ownership/user columns included where needed.

## Phase 4: Seed And Local DB Bootstrapping

Goal: Make a fresh local database usable for development.

Allowed changes:

- Minimal deterministic seed scripts.
- Admin/bootstrap user setup.
- Master data seed strategy.

Forbidden changes:

- No Supabase dummy restore.
- No production secrets in repo.

Expected output files:

- Seed files.
- Bootstrap docs.
- Local DB reset notes.

Validation checklist:

- Fresh database can initialize.
- Seed produces required roles/master data.
- Admin account bootstrap is documented.

## Phase 5: Auth Compatibility Layer

Goal: Replace Supabase Auth behavior behind compatible app/API semantics.

Allowed changes:

- Auth tables under `auth` schema.
- Password hash helpers.
- Session helpers.
- Login/logout/session endpoints.
- Active-role compatibility.

Forbidden changes:

- No UI redesign.
- No endpoint path changes.
- No role model changes.

Expected output files:

- Auth DB schema.
- Session implementation.
- Auth tests.

Validation checklist:

- Login/logout/session flow works.
- Session expiration and remember-me work.
- `ADMIN` remains dedicated.
- Server authorization remains authoritative.

## Phase 6: Storage Compatibility Layer

Goal: Replace Supabase Storage behavior behind compatible upload/preview/download semantics.

Allowed changes:

- Local storage service helpers.
- Upload API internals.
- Preview/download internals.
- Internal signed-token helpers.

Forbidden changes:

- No public static serving of `storage/`.
- No path shape drift unless compatibility mapping is documented.

Expected output files:

- Storage helper implementation.
- Signed-token helper.
- Storage tests.

Validation checklist:

- Pending upload behavior works.
- Formal file behavior works.
- Preview/download require authorization.
- Path traversal attempts fail.

## Phase 7: Read-Only API Migration

Goal: Move read endpoints from Supabase reads to PostgreSQL/Drizzle without changing responses.

Allowed changes:

- Read query helpers.
- Endpoint internals only.
- Response parsing tests.

Forbidden changes:

- No mutation endpoint migration in this phase.
- No UI behavior changes.

Expected output files:

- Domain read helpers.
- Migrated read endpoints.
- Contract tests or snapshots where practical.

Validation checklist:

- Response shapes match old behavior.
- Role filtering remains server-side.
- Lists/details work for each role domain.

## Phase 8: Mutation API Migration

Goal: Move write endpoints to PostgreSQL/Drizzle while preserving workflow behavior.

Allowed changes:

- Mutation helpers.
- Transaction boundaries.
- Audit log inserts.
- Workflow endpoint internals.

Forbidden changes:

- No FSM behavior drift.
- No audit log update/delete.
- No payload shape changes.

Expected output files:

- Domain mutation helpers.
- Migrated mutation endpoints.
- Workflow tests.

Validation checklist:

- Submit/resubmit works.
- PPK approve/reject works.
- Bendahara approve/reject works.
- Arsiparis archive works.
- Admin/master CRUD works.

## Phase 9: LAN/Server Deployment Packaging

Goal: Package the stabilized local app for LAN/server operation.

Allowed changes:

- Docker Compose for PostgreSQL.
- Optional app container plan or implementation if chosen.
- Backup/restore scripts.
- LAN runbook.

Forbidden changes:

- Do not start before DB/auth/storage are stable.
- Do not expose database broadly by default.

Expected output files:

- Compose file.
- Deployment docs.
- Backup/restore docs.

Validation checklist:

- App accessible from another LAN device.
- PostgreSQL data persists.
- Files persist.
- Backup and restore tested.

## Phase 10: Supabase Removal And Cleanup

Goal: Remove Supabase dependencies only after parity is proven.

Allowed changes:

- Delete unused Supabase clients/helpers.
- Remove unused env vars.
- Remove unused packages if approved.
- Update docs and AGENTS.md.

Forbidden changes:

- No removal before replacement verification.
- No cleanup mixed with behavior migration.

Expected output files:

- Cleanup diff.
- Updated docs.

Validation checklist:

- No Supabase runtime calls remain.
- Tests and manual workflows pass.
- Env documentation matches runtime.

## Phase 11: Regression Testing And Hardening

Goal: Confirm compatibility and harden security/operations.

Allowed changes:

- Tests.
- Security hardening.
- Observability/logging improvements.
- Backup drills.

Forbidden changes:

- No broad feature changes.

Expected output files:

- Regression test report.
- Hardening notes.
- Known risk list.

Validation checklist:

- Critical workflows tested end to end.
- Auth/session security reviewed.
- Storage access reviewed.
- Backup/restore tested.

