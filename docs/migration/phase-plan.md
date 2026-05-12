# Practical Phase Plan

This plan turns the roadmap into an execution sequence. The main rule is to stabilize the three infrastructure pillars first: database, auth, and storage. Deployment packaging should not happen too early because container/LAN decisions are cheaper after runtime behavior is stable.

## Phase 0 To Phase 2: Planning And Audit

Start by freezing compatibility expectations. The current Supabase-backed code is the reference implementation, so the audit must map actual behavior before replacements are built.

Work order:

1. Complete migration docs and agent rules.
2. Update `AGENTS.md` only when the migration constitution needs to become canonical.
3. Fill the Supabase audit using targeted `rg` searches.
4. Build an endpoint priority list by domain.

Do not modify runtime code in these phases.

## Phase 3 To Phase 4: Database Foundation

Create the PostgreSQL schema from scratch using Drizzle. Do not restore Supabase dummy data. Use domain schemas:

- `auth` for users, password hashes, sessions, and auth audit metadata.
- `master` for fungsi, kegiatan, kelengkapan, request hierarchy, document types, and role metadata if kept as rows.
- `dokumen` for document transactions, attachments metadata, and activity logs.
- `arsip` for archive metadata and archive lifecycle.
- `app` for app settings, migration metadata, and operational tables.

Seed only the minimum required to run local workflows: roles, required master data, and bootstrap admin/user fixtures. Keep seed deterministic and reviewable.

## Phase 5: Auth Compatibility

Build the custom auth layer while preserving UX:

- Login form behavior stays the same.
- Session endpoint behavior stays compatible.
- Active role cookie behavior stays compatible.
- `ADMIN` stays dedicated.
- Server/API role checks remain authoritative.

Use argon2id for password hashes and store only hashed session tokens in PostgreSQL. The raw token only lives in the `HttpOnly` cookie.

## Phase 6: Storage Compatibility

Replace storage behind the same upload/preview/download behavior:

- Keep pending upload semantics.
- Keep formal file semantics after submit/resubmit.
- Keep preview/download through API routes.
- Do not expose `storage/` statically.
- Add signed-token replacement only for preview/download cases that currently depend on Supabase signed URLs.

Storage should be tested before migrating workflow mutations because submit/resubmit depends on file movement.

## Phase 7: Read-Only API Migration By Domain

Migrate reads before writes so response compatibility can be tested without risking workflow state.

Domain split:

- Pegawai: document list/detail, report reads, attachment metadata reads.
- PPK: inbox, tervalidasi, ditolak, revisi, detail reads.
- Bendahara: inbox, ditolak, selesai, detail reads.
- Arsiparis: inbox, archive lists, search, classification reads.
- Admin/master data: user lists, role reads, master data reads, ketua tim reads.

Each domain should preserve response shapes before moving to the next domain.

## Phase 8: Mutation API Migration By Domain

Migrate writes after read parity is stable.

Domain split:

- Pegawai: create draft, submit, update, delete where currently allowed, resubmit after PPK rejection.
- PPK: approve, reject, resubmit after Bendahara rejection, kembalikan.
- Bendahara: approve and reject.
- Arsiparis: archive, lifecycle movements, classification mutations.
- Admin/master data: user management, master data CRUD, ketua tim assignment.

Use transactions for multi-step mutations involving document rows, attachment metadata, and audit logs. Preserve `log_aktivitas` append-only behavior.

## Phase 9 To Phase 11: Deployment, Cleanup, Hardening

Only package for LAN after DB/auth/storage and core endpoint migrations are stable.

Work order:

1. Add Docker Compose for PostgreSQL with persistent volume.
2. Decide whether the app runs directly on host or in Docker.
3. Add backup and restore scripts for PostgreSQL and `storage/`.
4. Test access from another LAN device.
5. Remove Supabase only after full parity is proven.
6. Run regression and security hardening.

## Validation Gates

- After schema work: fresh DB can initialize and seed.
- After auth work: login/logout/session/role switch works.
- After storage work: upload/preview/download works and unauthorized access fails.
- After read migration: all role list/detail pages render with compatible data.
- After mutation migration: submit, approve, reject, revise, archive, and admin CRUD flows work.
- Before Supabase removal: no replacement gaps remain.

