# Practical Phase Plan

This plan turns the roadmap into an execution sequence. The main rule is to stabilize the three infrastructure pillars first: database, auth, and storage. Deployment packaging should not happen too early because container/LAN decisions are cheaper after runtime behavior is stable.

## Planning Principle For Remaining Work

Phase 6F proved the required submit foundations, but it also became too granular. From Phase 6G onward, phases should produce direct runtime progress unless a concrete blocker is discovered. Prefer route or domain migration phases with focused tests and controlled runtime changes. Do not add new helper-only or planning-only phases just to reduce uncertainty.

The local target is intentionally clean: old Supabase production/current data is not migrated, old Supabase Storage files are not migrated or copied, local PostgreSQL uses seed/new local data, and local filesystem storage uses newly uploaded local files. Missing old Supabase-backed files are expected during the transition and must fail cleanly without Supabase fallback.

Current active area after Phase 6G.6 is Phase 7 read API migration by domain. Phase 7A inventory is recorded in `docs/migration/read-api-inventory-prioritization.md`; Phase 7B has migrated the first master/current-user read API groups and Phase 7B.3 documented the remaining browser master-data helper read surfaces without runtime changes. Phase 7C migrated the scoped role inbox/list dokumen GET routes on 2026-05-17. Phase 7D migrated the scoped dokumen detail/log GET routes on 2026-05-17. The next runtime phase is Phase 7E Report, Dashboard, And Archive Read APIs unless a Phase 7D stabilization follow-up finds a concrete detail/log parity gap. `POST /api/dokumen/submit` is locally backed for the clean local target, while broader Supabase runtime retirement and remaining storage surfaces stay in later phases.

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

Phase 6D.9 documented the controlled raw preview enablement strategy in `docs/migration/controlled-raw-preview-enablement-strategy.md`. The strategy keeps `useInternal=true` manual/test-only for now, identifies only raw-path preview callers as future controlled candidates, requires local file availability and fallback policy before caller changes, and recommends deferring runtime caller enablement until local upload replacement is planned. No runtime code, UI callers, endpoint defaults, download/document/role/archive/upload endpoints, or route tree files changed in this phase.

Phase 6E.1 documented the local upload replacement plan in `docs/migration/local-upload-replacement-planning.md`. The plan inventories `/api/upload`, `FileUploadButton`, `AttachmentEditor` direct browser upload/delete, pending-to-formal move surfaces, delete/remove surfaces, archive destruction deletion, admin diagnostics/orphan cleanup, local filesystem write safety, auth transition concerns, and the interaction with opt-in internal raw preview. No runtime code, UI callers, upload behavior, preview/download defaults, move/delete behavior, Supabase Storage files, or route tree files changed in this phase.

Phase 6E.2 added the isolated local upload helper foundation in `src/lib/storage/local-upload.ts` and `tests/unit/storage/local-upload.test.ts`. The helper validates upload metadata, sanitizes client filenames, validates `kelengkapan_id`, generates upload-API-compatible pending logical paths, and writes small upload buffers with contained no-overwrite semantics. It is not wired into `/api/upload`, UI callers, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, route generation, or Supabase Storage migration.

Phase 6E.3 documented the local `/api/upload` route wiring plan in `docs/migration/local-upload-route-wiring-plan.md`. The plan inventories current route behavior and `FileUploadButton` assumptions, recommends using `getLocalServerSession(request)` for future local owner semantics, maps the Phase 6E.2 helper into a later route implementation, and locks boundaries around multipart parsing, errors, security, pending moves, `AttachmentEditor`, deletes, archive destruction, diagnostics, and preview/download defaults. No runtime source code, `/api/upload` behavior, UI caller, route tree, database schema, auth runtime, preview/download default, or Supabase Storage file/data changed.

Phase 6E.4 switched only the internals of `POST /api/upload` to local filesystem upload in `src/routes/api/upload.ts`, using `getLocalServerSession(request)`, `createLocalUploadDescriptor(...)`, and `writeLocalUploadContent(...)`. The route path, multipart fields, `201` success status, and `{ url, nama, kelengkapan_id, uploaded_at }` response shape are preserved. UI callers, `AttachmentEditor`, pending-to-formal moves, delete/remove behavior, archive destruction deletion, diagnostics/orphan cleanup, preview/download defaults, Supabase Storage data migration, and Supabase dependency cleanup remain future work.

Phase 6E.5 verified and documented the bounded local upload runtime state in `docs/migration/local-upload-runtime-smoke-handoff.md`. It confirmed that newly uploaded `/api/upload` files are local, existing Supabase Storage files are not locally available, `AttachmentEditor` remains Supabase browser-storage based, pending-to-formal local moves are not implemented, and mixed storage state is expected.

Phase 6E.6 documented the pending-to-formal local move plan in `docs/migration/pending-to-formal-local-move-planning.md`. The plan inventories submit, `rename-pending`, update, PPK resubmit, `syncDocumentAttachments()`, and `AttachmentEditor` producer boundaries; defines dash and underscore pending compatibility, `temp-id` behavior, local owner semantics, filesystem move safety, DB/file partial-failure strategy, mixed storage policy, and future test/phase sequencing. No runtime source code changed and pending-to-formal local moves remain unimplemented.

Phase 6E.7 added the isolated local pending-to-formal move helper foundation in `src/lib/storage/local-pending-move.ts` and `tests/unit/storage/local-pending-move.test.ts`. The helper classifies supported pending/formal logical paths, validates owner segments, generates UUID-based formal target logical paths, resolves safe physical paths internally, moves local files with no-overwrite semantics, leaves already formal paths unchanged, and returns logical metadata only. Submit, `rename-pending`, update, resubmit, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download defaults, UI callers, and Supabase Storage migration remain future work.

Phase 6E.8 documented the `rename-pending` local move route plan in `docs/migration/rename-pending-local-move-route-planning.md`. The plan inventories the current Supabase-backed `POST /api/dokumen/rename-pending` behavior, locks request/response/status compatibility, defines future local `dms_session` ownership policy, maps the Phase 6E.7 helper into later route wiring, and records mixed-storage, partial-failure, testing, and boundary rules. No runtime source code changed and `rename-pending` local route wiring remains unimplemented.

Phase 6E.9 switched only `POST /api/dokumen/rename-pending` storage move internals from Supabase Storage `.move(...)` to local filesystem pending-to-formal movement through `src/lib/storage/local-pending-move.ts`. The route now uses local `dms_session` via `getLocalServerSession(request)`, treats body `userId` as compatibility input validated against the local session, preserves document ownership checks, supports local underscore and dash pending files, skips already formal/safe unsupported paths, and returns the existing `{ success: true, renamed, errors? }` success shape with logical paths only. Submit, update, resubmit, upload, `AttachmentEditor`, delete/remove, archive destruction, diagnostics/orphan cleanup, preview/download defaults, route tree changes, and Supabase Storage file migration remain out of scope.

Phase 6E.10 verified and documented the bounded `rename-pending` runtime state in `docs/migration/rename-pending-runtime-smoke-handoff.md`. Focused tests for the route, local pending move helper, and local storage path helper passed after a sandbox `spawn EPERM` rerun with approved escalation. No runtime source code, storage behavior, submit/update/resubmit/upload behavior, UI behavior, delete/archive/diagnostics behavior, preview/download defaults, route tree, database schema, auth/session runtime, or Supabase Storage file migration changed in this phase. The recommended next phase is Phase 6E.11 Submit Local Move Compatibility Planning, not direct broad implementation.

Phase 6E.11 documented the submit route local move compatibility plan in `docs/migration/submit-local-move-compatibility-planning.md`. It inventoried current `POST /api/dokumen/submit` behavior, including Supabase-session assumptions, route-local dash-only `.move(...)`, `temp-id` formal target compatibility, material vs non-material status behavior, attachment metadata persistence, audit logging, mixed storage policy, and DB/file partial-failure risks. No runtime source code, submit behavior, update/resubmit/upload/rename-pending behavior, UI behavior, delete/archive/diagnostics behavior, preview/download defaults, route tree, database schema, auth/session runtime, or Supabase Storage file migration changed in this phase. The recommended next phase is a submit preflight/bridge planning phase unless route implementation can be proven safely bounded.

Phase 6E.12 documented the submit local move preflight/bridge decision in `docs/migration/submit-local-move-preflight-bridge-planning.md`. It concluded that `POST /api/dokumen/submit` should not switch directly to local `dms_session` auth or local filesystem moves while its document/master/status/audit helpers remain Supabase-backed and identity-domain compatibility is unproven. No runtime source code, submit behavior, update/resubmit/upload/rename-pending behavior, UI behavior, delete/archive/diagnostics behavior, preview/download defaults, route tree, database schema, auth/session runtime, or Supabase Storage file migration changed in this phase. The recommended next phase is Phase 6E.13 Submit Move Plan Builder Helper Foundation, with no route wiring.

Phase 6E.13 added the isolated submit move plan builder helper in `src/lib/storage/submit-move-plan.ts` and focused tests in `tests/unit/storage/submit-move-plan.test.ts`. The helper plans logical submit attachment outcomes for pending underscore paths, pending dash paths, already formal paths, unsupported paths, `temp-id` targets, and future real-document-id targets without importing filesystem modules, resolving storage roots, checking file existence, calling Supabase Storage, or wiring any route. Submit local move behavior, submit auth migration, local document write bridge, update/resubmit local moves, UI behavior, delete/archive/diagnostics behavior, preview/download defaults, route tree, database schema, auth/session runtime, and Supabase Storage file migration remain out of scope. The recommended next step is a local submit document/write compatibility bridge or route-specific implementation plan before any submit runtime move wiring.

Phase 6E.14 verified and documented the submit move plan builder handoff in `docs/migration/submit-move-plan-builder-handoff-readiness.md`. The review confirmed the helper remains route-independent and logical-only, no route imports it yet, no filesystem/Supabase/env/storage-root behavior exists in the planner, and `src/routeTree.gen.ts` remains unchanged. Submit route wiring is still not ready because identity, master-data, document creation, status update, and append-only audit write compatibility are not proven in the local domain. The recommended next step is Phase 6F.1 Local Submit Document/Write Compatibility Bridge Planning, not direct submit implementation.

Phase 6F.1 documented the local submit document/write compatibility bridge plan in `docs/migration/local-submit-document-write-bridge-planning.md`. It concluded that local schema and seed readiness appear sufficient for a bounded helper-foundation phase, but `POST /api/dokumen/submit` still must not be wired because local submit-specific master/document/status/audit helpers do not exist and DB/file ordering is not proven. No runtime source code, submit/update/resubmit/upload/rename-pending behavior, UI behavior, delete/archive/diagnostics behavior, preview/download defaults, route tree, database schema, DB scripts, or Supabase Storage file migration changed in this phase. The recommended next step is Phase 6F.2 Local Submit Document/Write Bridge Helper Foundation, no route wiring.

Phase 6F.2 added the isolated server-only local submit document/write bridge helper in `src/lib/dokumen/local-submit-write-bridge.ts` and focused tests in `tests/unit/dokumen/local-submit-write-bridge.test.ts`. The helper proves local actor compatibility, submit-needed master-data read shapes, Ketua Tim assignment checks, document creation payloads, material/non-material status transition shapes, append-only audit payloads, and a repository transaction boundary without importing the live DB client, wiring submit, moving files, calling Supabase, running DB scripts, or changing route behavior. `POST /api/dokumen/submit` remains unwired; the next step should be a narrow live local repository or route implementation plan before any filesystem move execution.

Phase 6F.3 added the local submit live repository planning/foundation layer in `docs/migration/local-submit-live-repository-foundation.md`, `src/lib/dokumen/local-submit-repository.ts`, and `tests/unit/dokumen/local-submit-repository.test.ts`. The helper maps the Phase 6F.2 repository contract to local Drizzle schema table/column responsibilities and provides pure mapping plus injected-adapter repository factory functions tested with a fake adapter only. It does not import the live DB client, execute Drizzle queries, wire submit, move files, call Supabase, run DB scripts, or change route behavior. `POST /api/dokumen/submit` remains blocked until live adapter behavior, route response parity, file preflight, and DB/file failure policy are proven.

Phase 6F.4 added the local submit live Drizzle adapter foundation in `docs/migration/local-submit-drizzle-adapter-foundation.md`, `src/lib/dokumen/local-submit-drizzle-adapter.ts`, and `tests/unit/dokumen/local-submit-drizzle-adapter.test.ts`. The adapter implements the Phase 6F.3 injected adapter contract with local Drizzle schema table exports and explicit injected-DB/future-live factory boundaries. It does not import the live DB client at module load time, wire submit, move files, call Supabase, run DB scripts, or change route behavior. `POST /api/dokumen/submit` remains blocked until route response parity, submit file preflight, and DB/file failure compensation policy are proven.

Phase 6F.5 documented submit route response parity and the local file preflight/failure-policy foundation in `docs/migration/submit-route-response-parity-file-preflight-foundation.md`. It inventories the current legacy Supabase-backed submit success/error response shapes, material and non-material workflow results, storage move failure behavior, bridge/repository/adapter outcome mapping, missing-local-file policy with no Supabase fallback, and a conservative DB/file ordering recommendation. No helper, runtime source code, filesystem movement, local disk checks, route wiring, DB scripts, migrations, seeds, route generation, or Supabase Storage migration/copy/download/backfill/sync were added. `POST /api/dokumen/submit` remains blocked until route-level tests and runtime preflight/compensation implementation are explicitly approved.

Phase 6F.6 documented the submit route parity test planning foundation in `docs/migration/submit-route-parity-test-foundation.md`. It defines the current legacy submit route response/status matrix, planned safe route-test harness strategy, mocks/stubs needed to test current behavior without live Supabase, live PostgreSQL, or filesystem movement, and the exact scenarios that must become regression gates before submit runtime wiring. No helper, executable route tests, runtime source code, filesystem movement, local disk checks, route wiring, DB scripts, migrations, seeds, route generation, or Supabase Storage migration/copy/download/backfill/sync were added. `POST /api/dokumen/submit` remains blocked until the planned route-level parity tests are implemented and runtime preflight/compensation is explicitly approved.

Phase 6F.7 added executable parity tests for the unchanged legacy `POST /api/dokumen/submit` route in `tests/unit/dokumen/submit-route-parity.test.ts` and documented the harness in `docs/migration/submit-route-parity-test-harness-foundation.md`. The tests use mocked Supabase server/admin clients, mocked session/helper dependencies, synthetic `Request` objects, and no live Supabase, live PostgreSQL, filesystem movement, storage root resolution, route generation, DB scripts, migrations, seeds, or Supabase Storage migration/copy/download/backfill/sync. `POST /api/dokumen/submit` remains unwired to local auth, local submit repository/adapter, local file preflight, and local filesystem movement; runtime wiring remains blocked until preflight/compensation behavior is explicitly approved.

Phase 6F.8 added the isolated submit file preflight helper foundation in `src/lib/dokumen/submit-file-preflight.ts`, focused tests in `tests/unit/dokumen/submit-file-preflight.test.ts`, and documentation in `docs/migration/submit-file-preflight-helper-foundation.md`. The helper evaluates `buildSubmitMovePlan(...)` output, preserves move-plan blocking issues, requires injected source and target logical-path checks for move-required operations, and fails closed for missing checkers, missing local sources, or unavailable targets. It does not create a default filesystem checker, resolve physical paths, move files, wire `POST /api/dokumen/submit`, call Supabase, run DB scripts, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until runtime auth/repository composition, route disk preflight, filesystem movement, and DB/file compensation are explicitly approved.

Phase 6F.9 added the isolated submit DB/file compensation policy foundation in `src/lib/dokumen/submit-db-file-compensation.ts`, focused tests in `tests/unit/dokumen/submit-db-file-compensation.test.ts`, and documentation in `docs/migration/submit-db-file-compensation-policy-foundation.md`. The helper is a pure route-planning decision model: preflight failure aborts before DB and files, DB transaction failure aborts before files, DB success plus file success is the only safe success, and DB success plus failed or partial file movement is compensation-required and unsafe to return as success. It does not wire `POST /api/dokumen/submit`, execute filesystem movement, implement runtime compensation, run DB writes, add Supabase fallback, run DB scripts, or migrate/copy/download/backfill/sync Supabase Storage files. Submit route wiring remains blocked until runtime auth/repository composition, route disk preflight, filesystem movement execution, and a concrete post-DB file-failure recovery strategy are explicitly approved.

Phase 6F.10 completed the submit runtime wiring readiness review in `docs/migration/submit-runtime-wiring-readiness-boundary-plan.md`. It classifies the existing parity tests, submit move planner, file preflight helper, DB/file policy helper, local write bridge, repository, Drizzle adapter, local auth helper, and local storage helpers as useful foundations but blocks direct `src/routes/api/dokumen/submit.ts` wiring. The accepted direction is a conservative Phase 6F.11 submit runtime orchestrator or route composition boundary helper outside the route, with no live route behavior switch, no filesystem movement, no route disk preflight, no runtime DB/file compensation, no Supabase fallback, no DB scripts, and no Supabase Storage migration/copy/download/backfill/sync.

Phase 6F.11 added the submit runtime orchestrator boundary helper in `src/lib/dokumen/submit-runtime-orchestrator.ts`, focused tests in `tests/unit/dokumen/submit-runtime-orchestrator.test.ts`, and documentation in `docs/migration/submit-runtime-orchestrator-boundary-helper-foundation.md`. The helper is route-independent, submit-specific, and classifies injected stage results for payload validation, actor/role compatibility, master/permission checks, move planning, file preflight, DB transaction state, file movement state, and compensation policy state. `POST /api/dokumen/submit` remains unchanged and unwired; route disk preflight, filesystem movement, runtime DB/file compensation, rollback, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain blocked.

Phase 6F.12 added the isolated submit disk preflight checker foundation in `src/lib/dokumen/submit-disk-preflight-checker.ts`, focused tests in `tests/unit/dokumen/submit-disk-preflight-checker.test.ts`, and documentation in `docs/migration/submit-disk-preflight-checker-foundation.md`. The checker exposes logical-path-only source existence and target availability methods compatible with `preflightSubmitFiles(...)`, resolves physical paths internally through the existing local storage path helpers, uses only read-only `stat(...)` checks, and fails closed without exposing physical paths, roots, raw filesystem errors, tokens, signed URLs, or file contents. `POST /api/dokumen/submit` remains unchanged and unwired; route disk preflight wiring, filesystem movement, runtime DB/file compensation, rollback, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain blocked.

Phase 6G.2 added a temporary `useLocalAuthDryRun=true` query-parameter branch to `POST /api/dokumen/submit` and documented it in `docs/migration/submit-route-local-auth-dry-run-boundary.md`. The branch validates the existing payload first, then checks the local `dms_session` boundary through `getLocalServerSession(request)`, requires PEGAWAI role compatibility, blocks ADMIN-only and non-PEGAWAI actors, and returns a non-success dry-run response before any legacy Supabase submit write path or storage move can execute. Default submit behavior remains legacy Supabase-backed; local DB writes, route disk preflight, filesystem movement, runtime DB/file compensation, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain unwired.

Phase 6G.3 added a temporary `useLocalPreflightDryRun=true` query-parameter branch to `POST /api/dokumen/submit` and documented it in `docs/migration/submit-route-local-preflight-wiring.md`. The branch preserves existing JSON, Zod, and material nominal validation, validates the local `dms_session`/PEGAWAI boundary, builds a submit move plan from request attachments with the local user id and default `temp-id` target behavior, and runs `preflightSubmitFiles(...)` with `createSubmitDiskPreflightChecker()`. Missing local sources, target conflicts, unsupported paths, and unsafe paths return controlled dry-run failures before any write or file movement. Default submit behavior remains legacy Supabase-backed; local DB writes, filesystem movement, runtime DB/file compensation, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain unwired.

Phase 6G.4 added a controlled `useLocalDbSubmit=true` query-parameter branch to `POST /api/dokumen/submit` and documented it in `docs/migration/submit-route-local-db-transaction-wiring.md`. The branch preserves existing request validation, validates local `dms_session` and PEGAWAI compatibility, builds the submit move plan, runs read-only local disk preflight, blocks move-required payloads with `409` because filesystem movement is not implemented, and allows formal/no-move-required-only payloads to create document, update status, and append audit through the local submit bridge/repository/Drizzle adapter transaction. Default submit behavior remains legacy Supabase-backed; filesystem movement, runtime DB/file compensation, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain unwired.

Phase 6G.5 added controlled local pending-to-formal movement to the same `useLocalDbSubmit=true` branch and documented it in `docs/migration/submit-route-controlled-local-file-movement.md`. The branch still preserves request validation, local auth, move planning, and read-only disk preflight before DB writes; after local DB transaction success it now executes preflight-approved move-required operations through the existing local pending move helper and returns `201 { success: true, dokumen }` only after full movement success. Formal/no-move payloads still skip movement. Movement or partial movement failure after DB success returns a safe non-success response with compensation-required metadata, without claiming rollback. Default submit behavior remains legacy Supabase-backed; runtime DB/file compensation, Supabase fallback, DB scripts, and Supabase Storage migration/copy/download/backfill/sync remain unwired.

Phase 6G.6 made the local submit runtime the default for `POST /api/dokumen/submit` and documented it in `docs/migration/submit-runtime-stabilization-supabase-submit-retirement.md`. The route now uses local session auth, local preflight, local DB transaction, and controlled local pending-to-formal movement without requiring `useLocalDbSubmit=true`. The submit-route legacy Supabase execution branch was removed and no Supabase fallback was added. `useLocalAuthDryRun=true` and `useLocalPreflightDryRun=true` remain temporary diagnostics, while `useLocalDbSubmit=true` is only a redundant alias. Global Supabase removal, preview/download migration, update/resubmit movement, and other endpoint migration remain later phases.

## Phase 6G: Submit Runtime Integration

Phase 6G is complete. It was kept compressed and runtime-oriented:

- Phase 6G.2: Submit Route Local Auth and Dry-Run Boundary Wiring.
  - Goal: validate the local `dms_session`/PEGAWAI boundary in `POST /api/dokumen/submit`.
  - Allowed scope: a narrow route branch or boundary check after existing payload validation.
  - Non-goals: local DB writes, disk preflight, filesystem movement, Supabase submit retirement.
  - Validation gates: submit route parity tests and guarded diffs for route tree and unrelated files.
  - Exit criteria: default submit remains legacy; dry-run blocks missing, non-PEGAWAI, and ADMIN-only local actors without executing writes or moves.

- Phase 6G.3: Submit Route Local Preflight Wiring.
  - Goal: wire the local move plan, disk checker, and preflight helper into submit before any write or move.
  - Allowed scope: local logical path planning and read-only source/target checks for local files.
  - Non-goals: local DB transaction, filesystem movement, Supabase fallback, old file recovery.
  - Validation gates: parity tests plus missing-local-source, unavailable-target, formal/no-op, and safe unsupported-path cases.
  - Exit criteria: local preflight failures abort cleanly before DB writes and file moves, without exposing physical paths or storage roots.

- Phase 6G.4: Submit Route Local DB Transaction Wiring.
  - Goal: use the local submit bridge, repository, and Drizzle adapter for document create/status/audit.
  - Allowed scope: local DB transaction wiring while movement remains disabled or guarded unless no move is required.
  - Non-goals: uncontrolled file movement, runtime rollback claims, Supabase dependency removal.
  - Validation gates: material and non-material submit parity, role behavior, append-only audit, DB error-to-response mapping.
  - Exit criteria: local DB submit path preserves request/response shape, workflow status behavior, and `log_aktivitas` append-only behavior.

- Phase 6G.5: Submit Route Controlled Local File Movement.
  - Goal: execute controlled local pending-to-formal movement in submit.
  - Allowed scope: local moves for preflight-approved new local files with explicit failure handling.
  - Non-goals: Supabase fallback, old Supabase file migration, broad storage cleanup, global storage retirement.
  - Validation gates: full-success, missing source, target conflict, partial failure, sensitive-output, and retry-relevant cases.
  - Exit criteria: newly uploaded local files can submit through the local path; failed movement never returns false submit success.

- Phase 6G.6: Submit Runtime Stabilization And Supabase Submit Path Retirement.
  - Goal: stabilize submit parity and remove or disable the legacy Supabase submit path only after the local path passes checks.
  - Allowed scope: submit-specific cleanup, docs updates, focused smoke checks, and removal of dead submit-only Supabase branches.
  - Non-goals: global Supabase removal, broad endpoint migration, unrelated refactors.
  - Validation gates: submit parity tests, material/non-material smoke checks, audit checks, role checks, and local file checks.
  - Exit criteria: `POST /api/dokumen/submit` is locally backed for the clean local target and remaining migration gaps are assigned to later phases.

## Phase 7: Read API Migration By Domain

Goal: migrate read endpoints from Supabase reads to local PostgreSQL/Drizzle without changing endpoint paths, request query/body shapes, response shapes, or UI behavior.

Current active phase: Phase 7E Report, Dashboard, And Archive Read APIs, after Phase 7D migrated the scoped dokumen detail/log GET routes on 2026-05-17. Phase 7A Read API Inventory and Prioritization is complete in `docs/migration/read-api-inventory-prioritization.md`. The first Phase 7B runtime group migrated the six master-data list GET routes to local PostgreSQL/Drizzle, Phase 7B.2 migrated matching master detail and Ketua Tim GET reads, Phase 7B.3 documented remaining browser master-data helper surfaces as inventory/planning only, Phase 7C migrated role list/inbox reads, and Phase 7D migrated detail/log reads.

Phase 7 guardrails:

- Preserve endpoint paths, request query/body shapes, response shapes, and UI behavior.
- Server-side authorization and filtering are authoritative; do not rely on UI filtering.
- `dms_active_role` is UX state only and must be validated against the local server session/assigned roles.
- `ADMIN` remains dedicated and must not be merged with other roles.
- `log_aktivitas` remains append-only.
- No Supabase fallback for migrated read endpoints.
- No old Supabase Storage migration, copy, download, backfill, or sync.
- Do not remove global Supabase dependencies until later Phase 10/11 after parity.
- `DIMUSNAHKAN` must block preview/download in relevant archive/file phases, but Phase 7 must not overclaim preview/download migration.
- Archive destruction/delete behavior is not part of Phase 7 read migration.

### Phase 7A: Read API Inventory And Prioritization

Goal: produce a short domain inventory and runtime order for Supabase-backed read endpoints.

Status: complete. See `docs/migration/read-api-inventory-prioritization.md`.

Runtime scope:

- No runtime code.
- List Supabase-backed read endpoints by domain.
- Record rough priority order, response shape compatibility notes, intentionally deferred endpoints, and test/validation strategy.
- Recommend the exact first runtime endpoint group for Phase 7B.

Non-goals:

- No helper creation.
- No endpoint migration.
- No route edits.
- No test implementation.
- No broad planning rabbit hole beyond the inventory needed to start 7B.

Validation gates:

- Inventory covers master/current-user, role list, detail, report/dashboard, and archive read surfaces.
- Deferred endpoints are explicitly named with a reason.
- Response-shape parity risks are noted before runtime migration.
- First runtime group is selected.

Exit criteria:

- Phase 7B is ready to start with read-only master data `GET` endpoints first: master fungsi, master kegiatan, master kelengkapan dokumen, jenis permintaan, kategori permintaan, and detail permintaan.
- Then continue within 7B to matching detail reads, available jenis dokumen reads, Ketua Tim read helpers still Supabase-backed, and remaining current-user support reads if any are found.

### Phase 7B: Master Data And Current User Read APIs

Goal: migrate low-risk, frequently used master/current-user read APIs to local PostgreSQL/Drizzle.

Progress note:

- First runtime group migrated only the six public master-data list GET routes: `GET /api/master-fungsi`, `GET /api/master-jenis`, `GET /api/master-kegiatan`, `GET /api/master-kategori`, `GET /api/master-detail`, and `GET /api/master-kelengkapan`.
- The migration preserved route paths, query params, response shapes, active/filter/order behavior, and public-read behavior for those GET handlers.
- Phase 7B.2 migrated the matching public master detail GET routes: `GET /api/master-jenis/$id`, `GET /api/master-kategori/$id`, and `GET /api/master-detail/$id`.
- Phase 7B.2 also migrated ADMIN-only Ketua Tim read routes to local `dms_session` authorization and Drizzle reads: `GET /api/ketua-tim/`, `GET /api/ketua-tim/user/$userId`, and `GET /api/ketua-tim/kegiatan/$kegiatanId`.
- Phase 7B.2 audited the remaining current-user support reads and found `/api/users/me`, `/api/users/me/ketua-tim`, and `/api/users/me/is-ketua-tim/$kegiatanId` already local; no runtime work was needed there.
- Phase 7B.3 completed a docs-only browser master-data read surface inventory in `docs/migration/read-api-inventory-prioritization.md`.
- The `src/lib/master-data/jenis-dokumen.ts` read helper remains deferred because current callers are UI/browser routes passing a browser Supabase client directly and no compatible API-backed read surface exists yet.
- Phase 7B.3 does not recommend an immediate Phase 7B.4: a future `GET /api/master-jenis-dokumen` read route is justified eventually, but a one-route carve-out would not by itself make `/pegawai/dokumen/aju` API-backed because that page also uses other browser Supabase master-data helpers.
- Mutations in the same route files remain outside this read phase and may still use Supabase until Phase 8/admin mutation work.
- Next recommended target: Phase 7C role inbox/list dokumen reads. If `master_jenis_dokumen` is later accepted as a concrete blocker before Phase 10/11, create a narrow Phase 7B.4 only for that read surface and minimal direct read callers.

Runtime scope:

- Master fungsi reads.
- Master kegiatan reads.
- Master kelengkapan dokumen reads.
- Jenis permintaan reads.
- Kategori permintaan reads.
- Detail permintaan reads.
- Jenis dokumen reads where existing route/helper surfaces are present; browser-only helper usage remains a documented 7B.2 blocker until a compatible API surface is scoped.
- Ketua Tim admin GET reads are local as of Phase 7B.2; mutations remain later work.
- Remaining current-user read endpoints not already local; Phase 7B.2 found none.

Non-goals:

- No master/admin mutations.
- No user-management mutations or password flows.
- No route path changes.
- No UI behavior changes.

Validation gates:

- Preserve existing route paths, query/body shapes, status categories, and response shapes.
- Preserve active-row/filter behavior and existing ordering where UI-visible.
- Use local `dms_session` server authorization where authorization is required.
- Confirm `ADMIN` remains dedicated and is not made compatible with non-admin read assumptions accidentally.

Exit criteria:

- Master/current-user read surfaces needed by forms, navigation, and support badges use local PostgreSQL/Drizzle with compatible responses.

### Phase 7C: Role Inbox/List Dokumen Read APIs

Goal: migrate role/status-filtered document list APIs.

Status: runtime GET group migrated on 2026-05-17 for `GET /api/dokumen`, `GET /api/pegawai/revisi`, PPK inbox/list reads, Bendahara inbox/list reads, and `GET /api/arsiparis/inbox`.

Runtime scope:

- Pegawai document lists, including revision list reads.
- PPK inbox, tervalidasi, ditolak, and revisi list reads.
- Bendahara inbox, selesai, and ditolak list reads.
- Arsiparis inbox and list/search reads when they are list-only and do not require archive destruction/delete behavior.

Non-goals:

- No dokumen detail migration.
- No approve/reject/resubmit/archive mutations.
- No preview/download migration.
- No storage movement or deletion.

Validation gates:

- Server-side RBAC and status filtering are preserved.
- `current_step`, `revision_target`, status filters, owner filters, and role-specific visibility match the legacy behavior.
- Response shapes remain compatible for each role page.
- UI filtering must not be the security boundary.

Exit criteria:

- Role list/inbox pages render from local PostgreSQL/Drizzle reads with compatible responses and server-side filtering.

Phase 7C caveats:

- `POST /api/dokumen` remains Supabase-backed because it is a mutation in the same mixed route file and is not part of role list reads.
- Role list pages still have browser Supabase `master_fungsi` filter dropdown reads; server-side API filtering is local and authoritative, while filter UI helper retirement remains later cleanup.
- Dokumen detail/log, report/dashboard, archive active/inactive/usul-musnah/search/detail, storage, and mutations remain later phases.

### Phase 7D: Dokumen Detail Read API

Goal: migrate central and role-specific document detail reads without behavior drift.

Status: scoped runtime GET group migrated on 2026-05-17 for `GET /api/dokumen/$id`, `GET /api/dokumen/$id/log`, `GET /api/ppk/dokumen/$id`, `GET /api/bendahara/dokumen/$id`, and `GET /api/arsiparis/dokumen/$id`.

Phase 7D caveats:

- PATCH/DELETE/mutation handlers in mixed route files remain deferred to write/storage phases.
- Preview/download/file-access routes remain deferred to storage phases.
- Archive active/inactive/usul-musnah detail routes and `lampiran_snapshot` metadata remain Phase 7E archive read work.
- Central detail/log authorization now fails closed to owner or relevant non-admin workflow roles; `ADMIN` is not merged into role detail behavior.

Runtime scope:

- Document detail reads.
- Lampiran metadata reads from `lampiran_urls`/archive snapshots where the endpoint returns metadata only.
- `log_aktivitas` reads.
- Status, `current_step`, and `revision_target` fields.
- Role authorization for Pegawai, PPK, Bendahara, and Arsiparis detail views.

Non-goals:

- No preview/download route migration unless a route is metadata-only.
- No file streaming.
- No storage movement.
- No workflow mutations.

Validation gates:

- Detail response shape matches current route contracts.
- Audit log ordering and fields remain compatible.
- Role authorization is enforced server-side.
- Missing local old files are not treated as a detail-read blocker; no Supabase fallback is added.

Exit criteria:

- Pegawai, PPK, Bendahara, and Arsiparis detail pages can read document metadata, lampiran metadata, status, and audit logs from local PostgreSQL/Drizzle.

### Phase 7E: Report, Dashboard, And Archive Read APIs

Goal: migrate broader read-only reporting, dashboard, and archive metadata surfaces.

Runtime scope:

- Laporan saya.
- Laporan kegiatan.
- Dashboard counts/statistics where present.
- Archive list/detail/search aggregates and read-only archive metadata.
- Archive classification reads where they are read-only.

Non-goals:

- No archive destruction/delete behavior.
- No archive lifecycle mutations.
- No storage cleanup.
- No preview/download migration.

Validation gates:

- Report and dashboard counts/aggregates match current semantics.
- Ketua Tim report authorization remains server-side.
- Archive `status_arsip` filters and metadata response shapes remain compatible.
- `DIMUSNAHKAN` handling is documented where metadata touches file availability, without claiming Phase 7 completes preview/download blocking.

Exit criteria:

- Report, dashboard, and archive read pages render from local PostgreSQL/Drizzle reads with compatible responses.

### Phase 7F: Read API Stabilization And Supabase Read Retirement

Goal: close the read migration only when supported by audit and focused validation.

Runtime scope:

- Audit remaining Supabase-backed read endpoints.
- Add or run focused read API tests/contract checks where practical.
- Check response shape parity for migrated domains.
- Update migration docs with completed read status and deferred blockers.

Non-goals:

- No global Supabase dependency removal.
- No write workflow migration.
- No storage surface completion.
- No Phase 10/11 cleanup.

Validation gates:

- Grep/audit confirms migrated read domains no longer use Supabase-backed reads, or each remaining read is explicitly deferred with a blocker.
- Focused role read pages are manually or automatically checked against local seed/new data.
- No Supabase fallback was introduced.
- Guarded diffs confirm no unrelated route tree, submit route, DB script, migration, seed, package, or test changes were included unless explicitly required by that runtime subphase.

Exit criteria:

- Major read pages for Pegawai, PPK, Bendahara, Arsiparis, and Admin/master data use local PostgreSQL/Drizzle reads with compatible responses, and any remaining read blockers are documented before Phase 8 starts.

## Phase 8: Write Workflow API Migration By Domain

Goal: migrate write endpoints to local PostgreSQL/Drizzle while preserving workflow, FSM, role, and audit behavior.

Allowed scope:

- Pegawai: create draft, submit, update, delete where currently allowed, resubmit after PPK rejection.
- PPK: approve, reject, resubmit after Bendahara rejection, kembalikan.
- Bendahara: approve and reject.
- Arsiparis: archive, lifecycle movements, classification mutations.
- Admin/master data: user management, master data CRUD, ketua tim assignment.

Non-goals:

- No FSM behavior drift.
- No audit log update/delete.
- No payload, response, route path, or UI behavior changes.

Key validation gates:

- Transactions cover document rows, attachment metadata, status updates, and audit inserts where needed.
- Submit, approve, reject, revise, archive, and admin CRUD flows pass focused checks.
- `log_aktivitas` remains append-only.

Exit criteria:

- Core workflow writes no longer depend on Supabase database helpers and preserve existing workflow semantics.

## Phase 9: Storage Surface Completion

Goal: finish local filesystem storage replacement across the remaining surfaces.

Allowed scope:

- Preview/download defaults and role-specific file access.
- `AttachmentEditor` upload/remove behavior.
- Update/resubmit pending-to-formal moves.
- Document delete/remove file behavior.
- Archive destruction file deletion.
- Admin storage diagnostics and orphan cleanup.

Non-goals:

- No Supabase Storage migration, copy, download, backfill, or sync.
- No public static serving of `storage/`.
- No broad endpoint behavior changes unrelated to storage.

Key validation gates:

- Upload, preview, download, move, delete, archive destruction, and cleanup routes preserve user-facing contracts.
- Unauthorized access fails.
- `DIMUSNAHKAN` blocks preview/download even if stale files exist.
- Path traversal and physical path leakage checks pass.

Exit criteria:

- Active storage behavior for new local data is local-filesystem-backed, and missing old Supabase-backed files fail cleanly without fallback.

## Phase 10: Admin/User Management And Supabase Runtime Retirement

Goal: replace remaining Supabase Auth Admin/user-management/runtime dependencies and prepare final Supabase retirement.

Allowed scope:

- User management and password provisioning/change replacements.
- Remaining Supabase Auth Admin usage.
- Session hardening, CSRF, and rate limiting where appropriate.
- Supabase runtime dependency audit and cleanup planning.

Non-goals:

- No global Supabase dependency removal before parity is verified.
- No cleanup mixed with unresolved behavior migration.
- No role model changes.

Key validation gates:

- Admin/user-management flows work through local auth/database paths.
- Auth/session regression checks pass.
- Grep/audit shows remaining Supabase usage is either removed or explicitly documented as reference-only.

Exit criteria:

- No required Supabase Auth/Admin runtime paths remain, and final dependency/env cleanup has a verified checklist.

## Phase 11: Stabilization, Regression, Cleanup, And Release Readiness

Goal: complete regression, cleanup, operations, and release readiness for the local/LAN target.

Allowed scope:

- End-to-end regression and workflow smoke checks.
- Backup/restore scripts and drills for PostgreSQL plus `storage/`.
- LAN deployment runbook and local ops documentation.
- Final Supabase dependency/env cleanup after verified parity.
- Known-risk cleanup and security hardening.

Non-goals:

- No broad feature changes.
- No late architecture rewrite.

Key validation gates:

- Critical Playwright/manual workflows pass for Pegawai, PPK, Bendahara, Arsiparis, and Admin.
- Backup and restore preserve DB/file consistency.
- LAN access smoke check passes.
- Final Supabase usage audit is clean or contains only documented non-runtime references.

Exit criteria:

- The local PostgreSQL/auth/storage application is ready for the intended local/LAN deployment.

## Validation Gates

- After schema work: fresh DB can initialize and seed.
- After auth work: login/logout/session/role switch works.
- After storage work: upload/preview/download works and unauthorized access fails.
- After read migration: all role list/detail pages render with compatible data.
- After mutation migration: submit, approve, reject, revise, archive, and admin CRUD flows work.
- Before Supabase removal: no replacement gaps remain.
