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

Recommended auth subphase order after the Phase 5C planning contract:

1. Phase 5D: add isolated session token utility and session repository foundation without wiring UI/auth runtime.
2. Phase 5E: implement compatible login, logout, session, and role-switch API behavior behind existing endpoint paths.
3. Phase 5F: integrate `AppLayout` and client auth state through the custom session boundary or perform a controlled runtime switch.
4. Phase 5G: add focused auth regression checks and document the Supabase Auth runtime retirement path.

Phase 5G confirmed the local browser auth boundary and documented the remaining Supabase Auth retirement path. The recommended next auth step, before broad endpoint migration, is a narrow local server auth helper compatibility phase for non-auth APIs so routes can validate `dms_session` without changing endpoint paths, request shapes, response shapes, workflow behavior, or storage behavior.

Phase 5I migrated the first two low-risk current-user Ketua Tim support reads after the helper bridge:

- `GET /api/users/me/ketua-tim`
- `GET /api/users/me/is-ketua-tim/$kegiatanId`

Phase 5J migrated `GET /api/users/me` after profile response parity was reviewed against `/profile` and laporan callers. Current-user support reads now use local `dms_session` authorization, but broad domain reads still belong to Phase 7, and mutations still belong to Phase 8.

Phase 5K stabilized and closed the auth runtime segment with a docs/audit/handoff pass. The completed local auth boundary includes login/logout/session/role-switch APIs, `/login`, `AppLayout`, central logout/role switch, the server-only local auth helper bridge, and the current-user support endpoints from Phase 5I/5J. The recommended next step is Phase 6A storage replacement planning/foundation; it should inventory and lock the storage contract before implementation.

## Phase 6: Storage Compatibility

Replace storage behind the same upload/preview/download behavior:

- Keep pending upload semantics.
- Keep formal file semantics after submit/resubmit.
- Keep preview/download through API routes.
- Do not expose `storage/` statically.
- Add signed-token replacement only for preview/download cases that currently depend on Supabase signed URLs.

Storage should be tested before migrating workflow mutations because submit/resubmit depends on file movement.

Phase 6A completed the storage replacement planning and compatibility contract in `docs/migration/storage-replacement-planning-contract.md`. It inventoried current Supabase Storage behavior, path semantics, API response shapes, preview/download expectations, archive snapshot/destruction behavior, diagnostics/orphan cleanup, and backup/restore risks. Implementation remains future Phase 6B+ work; Phase 6A did not change storage runtime behavior.

Phase 6B added the local filesystem storage helper/test foundation in `src/lib/storage/local-storage-paths.ts` and `tests/unit/storage/local-storage-paths.test.ts`. It covers root resolution, logical path validation, path traversal prevention, safe physical path resolution, filename/path-segment sanitization, ownership checks, and pending/formal classification only. Route wiring and runtime upload/preview/download/move/delete/archive behavior remain future Phase 6D+ work.

Phase 6C completed the internal preview/download token compatibility contract in `docs/migration/internal-preview-download-token-contract.md`. It defines the future internal `{ signedUrl }` URL shape, token claims, signing/verification direction, authorization revalidation, `DIMUSNAHKAN` blocking, filename/content-disposition parity, expiry defaults, and revocation limits. It did not add token helper code or runtime route wiring; implementation remains future Phase 6D+ work.

Phase 6D.1 added the isolated file access token helper foundation in `src/lib/storage/file-access-token.ts` and `tests/unit/storage/file-access-token.test.ts`. It implements only the server-only HMAC-SHA256 signing/verification primitive, canonical non-JWT wire format, payload validation, expiry rejection, tamper rejection, and sensitive-claim rejection. It does not add `/api/files/access`, file streaming, upload/preview/download runtime replacement, storage root resolution, route/component wiring, DB schema changes, workflow changes, or Supabase Storage file/data migration.

Phase 6D.2 added the internal file access service foundation in `src/lib/storage/internal-file-access.ts` and `tests/unit/storage/internal-file-access.test.ts`. The actual route file was deferred because registering `GET /api/files/access` would require `src/routeTree.gen.ts` generation, which this phase forbids. The service verifies Phase 6D.1 tokens, expects a future local `dms_session` route session, validates raw logical-path tokens, applies owner/role compatibility checks, resolves local paths for containment only, and returns 501 because streaming and endpoint wiring remain future work.

Phase 6D.3 registered the internal `GET /api/files/access?token=<opaque-token>` route in `src/routes/api/files/access.ts` and `src/routeTree.gen.ts`. The route is only a thin wrapper that supplies `getLocalServerSession(request)`, `getFileTokenSecret()`, and the request to `handleInternalFileAccessRequest(...)`. Existing preview/download/upload endpoints remain Supabase-backed, no internal signed URL generation is wired yet, and local file streaming remains intentionally unimplemented.

Phase 6D.4 completed the preview/download internal URL wiring plan in `docs/migration/preview-download-internal-url-wiring-plan.md`. It inventoried the current raw, document-detail, PPK, and Bendahara signed-URL endpoints, documented archive preview risks, and defined a safe later implementation sequence without changing runtime behavior.

Phase 6D.5 added the isolated internal file access URL builder foundation in `src/lib/storage/internal-file-access-url.ts` and `tests/unit/storage/internal-file-access-url.test.ts`. The helper signs a validated file access token payload and returns only a relative `/api/files/access?token=<opaque-token>` URL. Existing preview/download/upload endpoints remain Supabase-backed, no endpoint imports the helper yet, and local file streaming remains intentionally unimplemented.

Phase 6D.7 added local file content responses to the existing internal file access service for raw logical-path tokens only. `/api/files/access` can now return a local file after token, session, logical path, root-containment, and raw owner/role compatibility checks pass. Document/archive/status-check tokens remain unsupported, `DIMUSNAHKAN` checks for those token types remain future work, and existing preview/download/upload endpoints remain unchanged except the earlier opt-in raw preview internal URL path from Phase 6D.6.

Phase 6D.8 verified the opt-in raw logical-path preview internal URL runtime path with focused tests and documentation. `GET /api/dokumen/preview-url?url={logicalPath}&useInternal=true` can produce the compatible `{ signedUrl, filename }` shape, and the returned internal token URL can serve local file content through `/api/files/access` when a matching local file exists and token/session/path/root-containment/owner-or-role checks pass. The default raw preview request without `useInternal=true` remains Supabase-backed, normal UI callers remain unchanged, and download/document/role/archive/upload endpoints remain out of scope.

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
