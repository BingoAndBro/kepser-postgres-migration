# Practical Phase Plan

This plan turns the roadmap into an execution sequence. The main rule is to stabilize the three infrastructure pillars first: database, auth, and storage. Deployment packaging should not happen too early because container/LAN decisions are cheaper after runtime behavior is stable.

## Planning Principle For Remaining Work

Phase 6F proved the required submit foundations, but it also became too granular. From Phase 6G onward, phases should produce direct runtime progress unless a concrete blocker is discovered. Prefer route or domain migration phases with focused tests and controlled runtime changes. Do not add new helper-only or planning-only phases just to reduce uncertainty.

The local target is intentionally clean: old Supabase production/current data is not migrated, old Supabase Storage files are not migrated or copied, local PostgreSQL uses seed/new local data, and local filesystem storage uses newly uploaded local files. Missing old Supabase-backed files are expected during the transition and must fail cleanly without Supabase fallback.

Current active area after Phase 6G.6 is Phase 9 storage/file-access completion. Phase 7A inventory is recorded in `docs/migration/read-api-inventory-prioritization.md`; Phase 7B migrated the first master/current-user read API groups and Phase 7B.3 documented the remaining browser master-data helper read surfaces without runtime changes. Phase 7C migrated the scoped role inbox/list dokumen GET routes on 2026-05-17. Phase 7D migrated the scoped dokumen detail/log GET routes on 2026-05-17. Phase 7E migrated scoped laporan and archive metadata/search/classification GET routes on 2026-05-17, while dashboard audit found no dedicated dashboard read API route. Phase 7F closed the major read-domain migration with an audit on 2026-05-17 and found no true remaining Phase 7 read blocker. Phase 8A completed the write/mutation inventory, Phase 8B through 8F migrated the selected clean-local write domains, and Phase 8G closed the write-domain audit on 2026-05-18 with no true Phase 8 blocker found. `POST /api/dokumen/submit` is locally backed for the clean local target, while broader Supabase runtime retirement, storage/file-access surfaces, user-management/Auth Admin, browser helper/UI retirement, and global cleanup stay in later phases.

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

Current phase: Phase 8 Write Workflow API Migration By Domain, after Phase 7F closed the major read-domain migration audit on 2026-05-17. Phase 7A Read API Inventory and Prioritization is complete in `docs/migration/read-api-inventory-prioritization.md`. The first Phase 7B runtime group migrated the six master-data list GET routes to local PostgreSQL/Drizzle, Phase 7B.2 migrated matching master detail and Ketua Tim GET reads, Phase 7B.3 documented remaining browser master-data helper surfaces as inventory/planning only, Phase 7C migrated role list/inbox reads, Phase 7D migrated detail/log reads, Phase 7E migrated laporan and archive metadata/search/classification reads, and Phase 7F found no true remaining blocker for the scoped major read domains.

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

Status: scoped runtime GET group migrated on 2026-05-17 for `GET /api/laporan/saya`, `GET /api/laporan/kegiatan`, `GET /api/arsiparis/aktif`, `GET /api/arsiparis/aktif/$id`, `GET /api/arsiparis/inaktif`, `GET /api/arsiparis/inaktif/$id`, `GET /api/arsiparis/usul-musnah`, `GET /api/arsiparis/usul-musnah/$id`, `GET /api/arsiparis/search`, and `GET /api/arsiparis/klasifikasi/`.

Phase 7E caveats:

- No dedicated dashboard count/stat API route was found, so no dashboard API runtime migration was performed.
- Mixed archive/classification files still keep Supabase-backed mutation handlers where POST/PATCH/DELETE behavior is outside Phase 7E.
- Browser dropdown/filter helper reads in laporan/archive pages remain deferred because server API filtering/authorization is already authoritative.
- `GET /api/arsiparis/search` cannot exactly reproduce the old PPK `step_urutan >= 5` predicate because the local Drizzle schema does not include `step_urutan`; it uses status-based PPK visibility for documents past PPK.
- `DIMUSNAHKAN` metadata/search visibility remains metadata-only. Preview/download blocking remains storage/file-access work and is not completed by Phase 7E.

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

Status: completed on 2026-05-17 as a docs/audit-only stabilization pass. No true remaining Phase 7 major-read blocker was found.

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

Phase 7F closure notes:

- Major server/API read domains from Phase 7B through 7E are considered migrated to local PostgreSQL/Drizzle for their scoped `GET` handlers.
- Remaining Supabase usages are classified as mixed mutation leftovers, storage/file-access surfaces, workflow/write mutations, admin/user-management/auth-admin surfaces, or browser helper/UI reads.
- No Supabase fallback was introduced for migrated reads.
- Dashboard API migration remains skipped because no dedicated dashboard read API route was found.
- Known caveats remain assigned: browser dropdown/helper reads, mixed route mutations, preview/download/storage, user-management/auth-admin replacement, archive search PPK `step_urutan` approximation, and `DIMUSNAHKAN` file-access blocking.
- Next recommended phase: Phase 8 write/workflow migration planning/runtime, unless manual smoke checks expose a concrete Phase 7F read-contract blocker.

## Phase 8: Write Workflow API Migration By Domain

Goal: migrate write/workflow endpoints to local PostgreSQL/Drizzle by practical domain groups while preserving endpoint contracts, FSM/status behavior, role enforcement, and audit behavior.

Phase 8 starts after Phase 7F closed the major server/API read-domain migration audit. It should not re-open read migration except when a write route needs a small local read inside the same transaction or authorization check.

Phase 8 invariants:

- Endpoint paths, HTTP methods, request payloads, response shapes, route/UI behavior, and visible status/error categories stay unchanged.
- Server-side RBAC is authoritative. `dms_active_role` remains UX state only and must be validated against local `dms_session` roles.
- `ADMIN` remains dedicated and is not made workflow-compatible with non-admin roles.
- FSM/status/current_step/revision_target behavior is preserved, including material approval, revision target, non-material `TERSIMPAN`, and archive linkage.
- `log_aktivitas` stays append-only; no `UPDATE` or `DELETE` audit behavior is introduced.
- `arsip.lampiran_snapshot` metadata shape is preserved.
- Migrated write endpoints must not keep Supabase fallback paths.
- No old Supabase data or Supabase Storage file migration, copy, download, backfill, or sync.
- No broad refactor, dependency cleanup, global Supabase removal, browser helper/UI rewrite, tests-only phase, or `src/routeTree.gen.ts` change unless a later explicitly scoped route-generation phase allows it.

Storage boundary:

- Writes that only update database metadata may belong to Phase 8.
- Writes requiring physical file movement, file deletion, preview/download, storage cleanup, orphan cleanup, or `DIMUSNAHKAN` file-access hardening belong to Phase 9 unless the existing local storage helper fully supports the exact behavior and the runtime subphase explicitly scopes it.
- Existing old Supabase-backed files are not copied, migrated, fetched, or used as fallback. Missing old files must fail cleanly or keep the storage-coupled route deferred.

Recommended order:

1. Phase 8A short inventory/order.
2. Phase 8B Pegawai document update/revision writes.
3. Phase 8C PPK workflow decision writes.
4. Phase 8D Bendahara workflow decision and nominal writes.
5. Phase 8E Arsiparis archive metadata/lifecycle writes.
6. Phase 8F non-user-management master/admin CRUD writes if still appropriate before Phase 10.
7. Phase 8G stabilization/audit.

Do not start Phase 8 with archive physical destruction, preview/download, user-management/Auth Admin, browser helper/UI retirement, package cleanup, or broad Supabase removal.

### Phase 8A: Write Workflow Inventory And Runtime Order

Goal: produce a short execution inventory for remaining Supabase-backed writes and select the first runtime write group.

Status: completed on 2026-05-17 as docs/audit only. No runtime route, helper, schema, test, package, generated route, or submit-route changes were made.

Runtime scope:

- Docs/audit only.
- Inventory remaining mutation endpoints by domain:
  - Pegawai edit/update/revision/resubmit-adjacent writes, including examples such as `src/routes/api/dokumen.$id.ts`, `src/routes/api/dokumen.$id.submit.ts`, and `src/routes/api/dokumen/$id.nominal.ts`.
  - PPK approve/reject/kembalikan/resubmit writes, including `src/routes/api/ppk/dokumen/$id/approve.ts`, `src/routes/api/ppk/dokumen/$id/reject.ts`, `src/routes/api/ppk/kembalikan/$id.ts`, and `src/routes/api/ppk/resubmit/$id.ts`.
  - Bendahara approve/reject/nominal writes, including `src/routes/api/bendahara/dokumen/$id/approve.ts`, `src/routes/api/bendahara/dokumen/$id/reject.ts`, and nominal update surfaces.
  - Arsiparis archive/lifecycle writes, including `src/routes/api/arsiparis/dokumen.$id.archive.ts`, `src/routes/api/arsiparis/aktif.$id/pindahkan.ts`, `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts`, and `src/routes/api/arsiparis/usul-musnah.$id.ts`.
  - Master/admin CRUD and Ketua Tim writes that do not depend on Supabase Auth Admin.
  - Storage-coupled writes deferred or split to Phase 9.
  - User-management/Auth Admin writes deferred to Phase 10.
- Select Phase 8B as the first runtime group unless the inventory finds a concrete blocker.

Non-goals:

- No runtime code, helper creation, route edits, tests, schema/migration/seed changes, package changes, route generation, or Supabase removal.

Validation gates:

- Every remaining write surface is classified as Phase 8, Phase 9, Phase 10, or Phase 11.
- Storage-coupled endpoints are marked split-or-defer.
- First runtime group is selected with a short reason.

Exit criteria:

- Phase 8B can be executed from one bounded prompt without further planning.

Key risks:

- Mixed route files may combine migrated `GET` handlers with Supabase-backed `POST`, `PATCH`, or `DELETE` handlers.
- Some mutation routes may include storage movement or deletion hidden inside otherwise database-like writes.

Deferred items:

- Preview/download/file streaming, storage cleanup/orphan cleanup, physical destruction, user-management/Auth Admin, password flows, browser helper/UI retirement, package cleanup, and global Supabase dependency removal.

#### Phase 8A Inventory Result

Audit method: `rg` over API route handlers and targeted inspection of mutation route files. This is a code inventory, not runtime verification.

| Bucket | Route files and methods | Purpose | Current dependency | Safe runtime phase | Key behavior to preserve |
|---|---|---|---|---|---|
| A. Phase 8B Pegawai document update/revision writes | `src/routes/api/dokumen/index.ts` `POST`; `src/routes/api/dokumen.$id.ts` `PATCH`; `src/routes/api/dokumen.$id.submit.ts` `POST`; `src/routes/api/dokumen/$id.nominal.ts` `PATCH`; metadata portion of `src/routes/api/dokumen.$id.ts` `DELETE` | draft/create-adjacent document writes, owner update/revision metadata, submit/resubmit of existing document, nominal metadata, non-material delete metadata | Supabase auth/session, Supabase DB helpers, `insertLog`; `PATCH`/`DELETE` also call Supabase Storage helper paths through `syncDocumentAttachments`, `deleteOrphanFiles`, and storage `.remove(...)` | First runtime group, but split storage-heavy pieces | Owner checks, `DRAFT`, `NEED_REVISION` target `USER`, non-material `TERSIMPAN`, `lampiran_urls` shape, nominal validation, current response wrappers, append-only audit. Physical movement/deletion inside update/delete must be avoided or deferred to Phase 9. |
| B. Phase 8C PPK workflow mutations | `src/routes/api/ppk/dokumen/$id/approve.ts` `POST`; `src/routes/api/ppk/dokumen/$id/reject.ts` `POST`; `src/routes/api/ppk/kembalikan/$id.ts` `POST`; `src/routes/api/ppk/resubmit/$id.ts` `PATCH`/`POST` metadata/status portions | PPK approve, reject, return-to-user, save PPK revision metadata, resubmit after Bendahara rejection | Supabase auth/session, Supabase DB/admin client, FSM, `updateDokumenStatus`, `insertLog`; resubmit uses `syncDocumentAttachments` and `deleteOrphanFiles` | 8C after 8B; split storage movement/deletion to Phase 9 | `IN_PPK_VALIDATION -> IN_BENDAHARA_APPROVAL`, reject to `NEED_REVISION` target `USER`, `KEMBALIKAN` target handoff, `RESUBMIT_PPK`, notes, duplicate/invalid action errors, audit action names. |
| C. Phase 8D Bendahara workflow mutations | `src/routes/api/bendahara/dokumen/$id/approve.ts` `POST`; `src/routes/api/bendahara/dokumen/$id/reject.ts` `POST` | Bendahara final approve/reject workflow decisions | Supabase auth/session, Supabase DB/admin client, FSM, `updateDokumenStatus`, `insertLog`, log checks for duplicate decisions | 8D | `IN_BENDAHARA_APPROVAL -> COMPLETED`, reject to `NEED_REVISION` target `PPK`, idempotency/error categories, catatan validation, audit action names. |
| D. Phase 8E Arsiparis archive metadata/lifecycle writes | `src/routes/api/arsiparis/dokumen.$id.archive.ts` `POST`; `src/routes/api/arsiparis/aktif.$id/pindahkan.ts` `POST`; `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts` `POST` | archive completed document, move `AKTIF -> INAKTIF`, propose `INAKTIF -> USUL_MUSNAH` | Supabase auth/session and DB writes, FSM for archive, `insertLog` | 8E | `COMPLETED -> ARCHIVED`, `arsip` row metadata, `lampiran_snapshot`, retention fields, `nominal_realisasi`, lifecycle status changes, proposal row creation, audit inserts. |
| E. Phase 8F non-user-management master/admin CRUD writes | `src/routes/api/master-*.ts` and `src/routes/api/master-*.$id.ts` `POST`/`PATCH`/`DELETE`; `src/routes/api/arsiparis/klasifikasi/index.ts` `POST`; `src/routes/api/arsiparis/klasifikasi/$id.ts` `PATCH`/`DELETE`; `src/routes/api/ketua-tim/index.ts` `POST`/`DELETE`; `src/routes/api/ketua-tim/$id.ts` `DELETE`; `src/routes/api/ketua-tim/kegiatan/$kegiatanId.ts` `PATCH` | master CRUD, classification CRUD, Ketua Tim assignment writes | Supabase auth/session and DB/admin client; Ketua Tim writes use admin DB client but not Supabase Auth Admin | 8F, not before workflow writes | ADMIN or ADMIN/ARSIPARIS access as today, active/soft-delete behavior, kelengkapan hard delete, duplicate/constraint messages, one active Ketua Tim per kegiatan. Do not assume these are low-risk just because they are non-workflow. |
| F. Phase 9 storage-coupled writes/access | Storage portions of `dokumen.$id.ts` `PATCH`/`DELETE`, `ppk/resubmit/$id.ts` `PATCH`/`POST`, `arsiparis/usul-musnah.$id.ts` `PATCH`; `src/routes/api/admin/cleanup-orphan-files.ts` `GET`; `src/routes/api/admin/analyze-storage.ts` `GET`; preview/download routes under central, PPK, and Bendahara document APIs; browser `AttachmentEditor` direct storage behavior | file movement, file deletion, signed URLs, diagnostics, orphan cleanup, destruction file removal, `DIMUSNAHKAN` file access blocking | Supabase Storage/admin storage or local-storage-only partial surfaces depending on route | Defer to Phase 9 unless a later runtime subphase explicitly scopes an already-supported local helper path | No old Supabase file migration/copy/download/backfill/sync, no fallback, clean missing-file failure, path traversal protection, preserve `{ signedUrl }` where callers expect it. |
| G. Phase 10 user-management/Auth Admin | `src/routes/api/users/index.ts` `POST`; `src/routes/api/users/$id.ts` `PATCH`; `src/routes/api/users/$id/activate.ts` `POST`; `src/routes/api/users/$id/deactivate.ts` `POST`; `src/routes/api/users/$id/reset-password.ts` `POST`; `src/routes/api/users/me/change-password.ts` `POST`; `src/lib/user-helpers.ts` | user CRUD, role/status writes, activation/deactivation, reset/change password | Supabase Auth Admin `listUsers`, `createUser`, `updateUserById`, plus `user_roles`/`user_status` | Defer to Phase 10 | Dedicated ADMIN behavior, password provisioning/change semantics, active status semantics, role assignment semantics. |
| H. Phase 11 global cleanup | final Supabase imports/deps/env and browser helper/UI retirement not owned by earlier runtime phases | global removal and release cleanup | remaining Supabase clients/helpers after Phase 8-10 | Defer to Phase 11 | Remove only after parity; no broad cleanup during write migration. |

Already-local write surfaces are not Phase 8 runtime targets: `POST /api/dokumen/submit` is local-backed after Phase 6G.6, `POST /api/upload` is local upload-backed, and `POST /api/dokumen/rename-pending` uses local pending-to-formal movement while still reading document ownership through existing helper compatibility. They remain relevant to storage validation but should not be reworked in Phase 8A/8B.

#### First Runtime Group

Phase 8B remains the recommended first runtime group. It is closest to the already-local submit/read foundations, is mostly Pegawai-owned database metadata and audit behavior, can preserve existing route contracts without route generation, and is lower-risk than archive destruction, preview/download/storage cleanup, and user-management/Auth Admin replacement.

No concrete blocker was found for starting Phase 8B. The main Phase 8B risk is mixed storage behavior inside otherwise database-like routes, so the first runtime prompt must scope metadata writes separately from physical movement/deletion.

#### Phase 8B Readiness

Candidate files:

- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/dokumen.$id.submit.ts`
- `src/routes/api/dokumen/$id.nominal.ts`
- `src/routes/api/dokumen/index.ts` only if the old draft-create route is still an active caller; otherwise audit and classify without broadening the batch

Allowed runtime scope:

- local `dms_session` PEGAWAI-compatible authorization and owner checks;
- local Drizzle updates/inserts for document metadata, status fields where this route already owns them, nominal metadata, and append-only `log_aktivitas`;
- preserve `lampiran_urls` metadata shape when no physical file movement or deletion is required;
- preserve `DRAFT`, `NEED_REVISION` target `USER`, and non-material `TERSIMPAN` edit/delete rules.

Must-not scope:

- no `src/routes/api/dokumen/submit.ts` rework;
- no preview/download migration;
- no physical file movement/deletion, orphan cleanup, or browser `AttachmentEditor` rewrite;
- no Supabase Storage fallback or old file migration/copy/download/backfill/sync;
- no route generation, schema/migration/seed, package, or broad helper creation.

Validation focus for the next runtime prompt:

- unchanged paths, methods, payloads, wrappers, and visible 400/401/403/404/500 categories;
- local session role membership instead of trusting `dms_active_role`;
- owner-only writes for Pegawai document mutations;
- audit insert remains append-only and transactional with the document metadata update where both are part of one logical write;
- grep confirms migrated handlers have no Supabase write fallback while any storage-coupled leftovers are explicitly listed for Phase 9.

### Phase 8B: Pegawai Document Update/Revision Write APIs

Goal: migrate Pegawai-facing document update, delete, revision, and resubmit-adjacent database writes that are not primarily storage-heavy.

Status as of 2026-05-18: complete for the scoped Phase 8B clean-local write surfaces.

Migrated in the first Phase 8B runtime pass:

- `PATCH /api/dokumen/$id` metadata-only update path in `src/routes/api/dokumen.$id.ts` now uses local `dms_session` authorization and local Drizzle writes for owner Pegawai updates. It preserves `DRAFT` exclusion, `NEED_REVISION` target `USER`, Non-Material `TERSIMPAN`, `lampiran_urls` metadata shape, and the Non-Material `UPDATE` audit insert in a local transaction. Physical attachment movement, orphan cleanup, and file deletion from the old `syncDocumentAttachments` / `deleteOrphanFiles` behavior are intentionally deferred to Phase 9; PATCH now fails closed with 400 when a submitted `lampiran_urls` entry is still a pending/move-required path.
- `POST /api/dokumen/$id/submit` in `src/routes/api/dokumen.$id.submit.ts` now uses local `dms_session` authorization, local Drizzle reads for document and required kelengkapan metadata, FSM-compatible status updates, and append-only `log_aktivitas` insertion inside one local transaction. It preserves the existing route's `DRAFT` submit, `NEED_REVISION` target `USER` resubmit, owner-only, required-lampiran, minimum-lampiran, action name, and `{ success: true }` response behavior.

Skipped or deferred in this pass:

- `DELETE /api/dokumen/$id` remains deferred to Phase 9 because the legacy handler combines DB row deletion with Supabase Storage file removal, and a safe local delete policy needs the storage cleanup/orphan strategy.
- `PATCH /api/dokumen/$id/nominal` remains deferred because the legacy route is cross-role (`creator`, `ARSIPARIS`, `ADMIN`) rather than purely Pegawai-owned Phase 8B behavior.
- `POST /api/dokumen` old draft-create remains skipped because current audited Pegawai create UI uses `POST /api/dokumen/submit`; the old draft-create route is ambiguous/redundant and still overlaps legacy Supabase helper behavior.

Runtime scope:

- Central document `PATCH`/`DELETE` and update-revision style writes where the current route contract can be preserved.
- Owner checks and allowed-status checks for `DRAFT`, `NEED_REVISION`, and non-material `TERSIMPAN` behavior.
- Metadata-only `lampiran_urls` updates where local file metadata is already valid or no physical movement is needed.
- Append-only `log_aktivitas` inserts inside local Drizzle transactions.
- Local `dms_session` role enforcement for PEGAWAI-compatible write actions.

Non-goals:

- No preview/download migration.
- No old Supabase file fallback.
- No physical file movement/deletion unless the exact behavior is already locally supported and explicitly scoped.
- No submit route rework beyond compatibility with the already local-backed `POST /api/dokumen/submit`.
- No browser helper/UI rewrite.

Validation gates:

- Paths, payloads, success responses, and UI-visible error behavior match current routes.
- Owner and role checks are server-side and use local `dms_session`.
- `NEED_REVISION` target `USER`, non-material `TERSIMPAN`, `lampiran_urls`, and audit behavior remain compatible.
- Local transactions cover document row updates plus audit inserts where both are part of one logical write.
- Migrated handlers have no Supabase write fallback.

Exit criteria:

- Pegawai document update/revision database writes are local-backed for the clean local target, and storage-coupled leftovers are explicitly listed for Phase 9.

Key risks:

- Document delete and attachment edits can be storage-coupled.
- Revision/resubmit screens may still use browser Supabase helper reads or direct attachment editing outside server write contracts.

Deferred items:

- Pending-to-formal movement for update/resubmit if not already exact, attachment remove/delete behavior, preview/download, direct browser `AttachmentEditor` retirement, and old file availability.
- Phase 9 must reconcile physical file movement/deletion for document update/delete and any orphan cleanup created by metadata-only or DB-only compatibility behavior.

### Phase 8C: PPK Workflow Mutation APIs

Goal: migrate PPK decision writes to local PostgreSQL/Drizzle while preserving FSM, revision target, and audit contracts.

Status as of 2026-05-18: complete for the scoped Phase 8C pure/safe PPK decision writes.

Migrated in this pass:

- `POST /api/ppk/dokumen/$id/approve` in `src/routes/api/ppk/dokumen/$id/approve.ts` now uses local `dms_session` authorization, assigned PPK role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction. It preserves the legacy empty-body validation, `IN_PPK_VALIDATION` status guard, FSM `APPROVE` transition to `IN_BENDAHARA_APPROVAL`, `current_step='BENDAHARA'`, cleared `revision_target`, `PPK_APPROVE`, `stepUrutan=2`, and `{ success: true, message: 'Dokumen diteruskan ke Bendahara' }`.
- `POST /api/ppk/dokumen/$id/reject` in `src/routes/api/ppk/dokumen/$id/reject.ts` now uses local `dms_session` authorization, assigned PPK role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction. It preserves the required `catatan` payload validation, `IN_PPK_VALIDATION` status guard, FSM `REJECT` transition to `NEED_REVISION`, `revision_target='USER'`, `revision_notes=catatan`, `PPK_REJECT`, `stepUrutan=1`, and `{ success: true, message: 'Dokumen dikembalikan ke pegawai' }`.
- `POST /api/ppk/kembalikan/$id` in `src/routes/api/ppk/kembalikan/$id.ts` now uses local `dms_session` authorization, assigned PPK role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction. It preserves the legacy meaning: Bendahara-rejected `NEED_REVISION` rows targeted to PPK are returned to Pegawai by setting `revision_target='USER'`, fixed note `Dikembalikan ke pegawai oleh PPK`, `PPK_KEMBALIKAN`, `stepUrutan=1`, and `{ success: true }`.
- `POST /api/ppk/resubmit/$id` in `src/routes/api/ppk/resubmit/$id.ts` now uses local `dms_session` authorization, assigned PPK role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction for the safe decision path. It preserves the optional body parsing behavior, `NEED_REVISION` plus `revision_target='PPK'` guard, FSM `RESUBMIT_PPK` transition to `IN_BENDAHARA_APPROVAL`, `current_step='BENDAHARA'`, cleared `revision_target`, optional `nominalRealisasi` metadata update, `RESUBMIT_PPK`, `stepUrutan=2`, and `{ success: true }`.

Skipped or deferred in this pass:

- `GET /api/ppk/resubmit/$id` remains a mixed read/detail support surface in the same file and was not part of this write-only pass.
- `PATCH /api/ppk/resubmit/$id` remains deferred because it is storage-coupled attachment save behavior using `syncDocumentAttachments` and `deleteOrphanFiles`.
- `POST /api/ppk/resubmit/$id` intentionally fails closed when submitted `lampiranUrls` contain pending paths or a changed URL set requiring file movement, deletion, or path synchronization. Full update/resubmit attachment movement and orphan cleanup remain Phase 9 work.

Runtime scope:

- PPK approve/reject/kembalikan/resubmit decision writes where practical.
- Preserve `IN_PPK_VALIDATION -> IN_BENDAHARA_APPROVAL`.
- Preserve PPK rejection to `NEED_REVISION` with revision target `USER`.
- Preserve Bendahara-rejected/PPK-targeted revision handling and `kembalikan` behavior where applicable.
- Preserve audit action names, notes, timestamps, and response wrappers.
- Use local Drizzle write transactions and local `dms_session` PPK role enforcement.

Non-goals:

- No role-specific preview/download migration.
- No storage movement inside PPK resubmit unless the exact local movement behavior is already available and explicitly scoped.
- No browser resubmit page rewrite.
- No user-management/Auth Admin replacement.

Validation gates:

- FSM transitions, `current_step`, `revision_target`, and rejection notes match the legacy route behavior.
- Duplicate/invalid decision attempts preserve current status/error categories.
- `log_aktivitas` inserts are append-only and transactional with status updates.
- Migrated PPK writes have no Supabase write fallback.

Exit criteria:

- PPK approve/reject/kembalikan and safe resubmit metadata writes are local-backed, with any storage-coupled resubmit movement split to Phase 9.

Key risks:

- PPK resubmit may combine metadata writes with attachment movement.
- Existing routes may read audit state to prevent duplicate actions; parity needs to be preserved.

Deferred items:

- PPK preview/download, attachment movement not exactly supported locally, browser helper reads, and global Supabase cleanup.
- Remaining PPK resubmit attachment save/move/delete behavior belongs to Phase 9 storage surface completion.

### Phase 8D: Bendahara Workflow Mutation APIs

Goal: migrate Bendahara approval, rejection, and nominal-related writes to local PostgreSQL/Drizzle.

Status as of 2026-05-18: complete for the scoped Phase 8D pure Bendahara decision writes.

Migrated in this pass:

- `POST /api/bendahara/dokumen/$id/approve` in `src/routes/api/bendahara/dokumen/$id/approve.ts` now uses local `dms_session` authorization, assigned BENDAHARA role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction. It preserves the empty-body validation, `IN_BENDAHARA_APPROVAL` status guard, FSM `APPROVE` transition to `COMPLETED`, cleared `current_step`, cleared `revision_target`, cleared `revision_notes`, `BENDAHARA_APPROVE`, `stepUrutan=2`, and `{ success: true, message: 'Dokumen disetujui', redirectTo: '/bendahara/selesai' }`.
- `POST /api/bendahara/dokumen/$id/reject` in `src/routes/api/bendahara/dokumen/$id/reject.ts` now uses local `dms_session` authorization, assigned BENDAHARA role enforcement, local Drizzle document status update, and append-only `log_aktivitas` insert in one transaction. It preserves the required `catatan` payload validation, `IN_BENDAHARA_APPROVAL` status guard, FSM `REJECT` transition to `NEED_REVISION`, `current_step='BENDAHARA'`, `revision_target='PPK'`, `revision_notes=catatan`, `BENDAHARA_REJECT`, `stepUrutan=1`, and `{ success: true, message: 'Dokumen dikembalikan ke PPK', redirectTo: '/bendahara/ditolak' }`.

Skipped or deferred in this pass:

- `PATCH /api/dokumen/$id/nominal` remains deferred because the legacy route is central/cross-role (`creator`, `ARSIPARIS`, `ADMIN`/legacy `SUPERADMIN`) rather than Bendahara-owned. It should be migrated in a later cross-role/admin-compatible phase without silently narrowing role semantics.
- Bendahara preview/download routes remain deferred to Phase 9 storage/file-access work.

Runtime scope:

- Bendahara approve/reject writes.
- Nominal-related document writes when they are part of Bendahara-compatible workflow behavior.
- Preserve `IN_BENDAHARA_APPROVAL -> COMPLETED`.
- Preserve Bendahara rejection to `NEED_REVISION` with revision target `PPK`.
- Preserve `nominal_realisasi`, approval/rejection notes, audit actions, and response shapes.
- Use local Drizzle transactions and local `dms_session` BENDAHARA role enforcement.

Non-goals:

- No preview/download migration.
- No physical storage movement/deletion.
- No PPK resubmit storage handling unless scoped in 8C and backed by local helpers.
- No broad report/list read work already closed by Phase 7.

Validation gates:

- Status/current_step/revision_target outcomes match the FSM behavior.
- Nominal validation and response/error shapes remain compatible.
- Audit insert behavior remains append-only and transactional with workflow updates.
- Migrated Bendahara writes have no Supabase write fallback.

Exit criteria:

- Bendahara approval and rejection database writes are local-backed for seed/new local data. The scoped nominal route is intentionally deferred because ownership is cross-role rather than Bendahara-compatible.

Key risks:

- Nominal update routes may be shared by other role screens or route categories.
- Approval may depend on previous PPK audit rows for response context.

Deferred items:

- Cross-role nominal update migration, Bendahara preview/download, storage/file-access behavior, and any browser helper/UI cleanup.

### Phase 8E: Arsiparis Archive Metadata/Lifecycle Write APIs

Goal: migrate archive creation and safe archive metadata lifecycle writes that are not primarily physical file destruction.

Status as of 2026-05-18: complete for the scoped Phase 8E safe archive metadata/lifecycle writes.

Migrated in this pass:

- `POST /api/arsiparis/dokumen/$id/archive` in `src/routes/api/arsiparis/dokumen.$id.archive.ts` now uses local `dms_session` authorization, assigned ARSIPARIS role enforcement, local Drizzle archive creation, `COMPLETED -> ARCHIVED` document status update through the existing FSM result, and append-only `log_aktivitas` insert in one transaction. It preserves the legacy required archive metadata payload, duplicate-archive guard, `lampiran_snapshot` metadata copy from `dokumen_transaksi.lampiran_urls`, `nominal_realisasi`, `ARCHIVE`, `stepUrutan=null`, and `{ success: true, message: 'Dokumen berhasil diarsipkan' }`.
- `POST /api/arsiparis/aktif/$id/pindahkan` in `src/routes/api/arsiparis/aktif.$id/pindahkan.ts` now uses local `dms_session` authorization, assigned ARSIPARIS role enforcement, local Drizzle `AKTIF -> INAKTIF` status update, and append-only `log_aktivitas` insert in one transaction. It preserves optional `catatan`, `PINDAHKAN_INAKTIF`, `stepUrutan=null`, and `{ success: true, message: 'Arsip dipindahkan ke inaktif' }`.
- `POST /api/arsiparis/inaktif/$id/musnahkan` in `src/routes/api/arsiparis/inaktif.$id/musnahkan.ts` now uses local `dms_session` authorization, assigned ARSIPARIS role enforcement, local Drizzle `arsip_usul_musnah` proposal insert, `INAKTIF -> USUL_MUSNAH` status update, duplicate-proposal guard, and append-only `log_aktivitas` insert in one transaction. It preserves optional `catatan`, proposal status `MENUNGGU`, `PINDAHKAN_USUL_MUSNAH`, `stepUrutan=null`, and `{ success: true, message: 'Arsip diusulkan untuk dimusnahkan' }`.

Skipped or deferred in this pass:

- `PATCH /api/arsiparis/usul-musnah/$id` remains Phase 9 storage-coupled work because the legacy handler approves destruction by deleting Supabase Storage objects, clearing `lampiran_snapshot`, setting `status_arsip='DIMUSNAHKAN'`, and appending audit. Migrating only the metadata portion would not preserve destruction/file-access behavior.
- Arsiparis classification `POST/PATCH/DELETE` routes remain Phase 8F non-user-management master/admin CRUD work.
- Preview/download, archive file-access blocking for `DIMUSNAHKAN`, physical file deletion, storage diagnostics/orphan cleanup, and scheduler replacement remain Phase 9 or later as listed below.

Runtime scope:

- Archive creation from completed documents, including `COMPLETED -> ARCHIVED` document linkage.
- `arsip` row creation with retained metadata, retention fields, `nominal_realisasi`, and `lampiran_snapshot`.
- Safe lifecycle metadata transitions such as `AKTIF -> INAKTIF` and `INAKTIF -> USUL_MUSNAH` when they do not require physical file deletion.
- Append-only `log_aktivitas` behavior for archive actions.
- Local Drizzle transactions and local `dms_session` ARSIPARIS role enforcement.

Non-goals:

- No physical file deletion/destruction.
- No preview/download/file streaming migration.
- No storage diagnostics/orphan cleanup.
- No archive scheduler replacement.
- No global Supabase dependency removal.

Validation gates:

- Archive creation preserves document status, archive metadata, `lampiran_snapshot`, and response shape.
- Lifecycle metadata transitions preserve `status_arsip`, proposal rows, rejection/approval notes, and audit behavior.
- `DIMUSNAHKAN` file-access hardening is not claimed unless a later Phase 9 storage subphase completes it.
- Migrated archive metadata writes have no Supabase write fallback.

Exit criteria:

- Archive creation and safe lifecycle metadata writes are local-backed, and physical destruction/file-access work is clearly deferred to Phase 9.

Key risks:

- `usul-musnah` decisions and `inaktif.$id/musnahkan` may combine metadata updates with physical storage removal.
- Archive behavior must not silently drop `lampiran_snapshot` because preview/download hardening is still later.

Deferred items:

- Physical file deletion, `DIMUSNAHKAN` preview/download blocking, archive file-access checks, storage cleanup/orphan cleanup, and scheduler replacement.

### Phase 8F: Master/Admin CRUD Write APIs, Non-User Management

Goal: migrate master data and non-user-management admin CRUD writes that can move safely before Phase 10.

Status as of 2026-05-18: complete for the scoped Phase 8F safe non-user-management metadata CRUD writes.

Migrated in this pass:

- Master fungsi write routes: `POST /api/master-fungsi`, `PATCH /api/master-fungsi/$id`, and `DELETE /api/master-fungsi/$id` now use local `dms_session` ADMIN authorization and local PostgreSQL/Drizzle writes. Delete remains a soft delete by setting `is_active=false`; create/update preserve the existing validation wrappers and duplicate-name `409` behavior where the route explicitly checked duplicates.
- Master kegiatan write routes: `POST /api/master-kegiatan`, `PATCH /api/master-kegiatan/$id`, and `DELETE /api/master-kegiatan/$id` now use local `dms_session` ADMIN authorization and local PostgreSQL/Drizzle writes. Create/update preserve active fungsi validation where legacy had it, duplicate active `(fungsi_id,nama)` checks where legacy had them, joined `master_fungsi` response enrichment, and soft delete.
- Master jenis/kategori/detail permintaan write routes now use local `dms_session` ADMIN authorization and local PostgreSQL/Drizzle writes for `POST`, `PATCH`, and `DELETE`. Create duplicate checks and FK active-parent validation are preserved where legacy had them; delete remains soft delete through `is_active=false`; update keeps the legacy generic failure category for constraint errors rather than exposing DB internals.
- Master kelengkapan dokumen write routes now use local `dms_session` ADMIN authorization and local PostgreSQL/Drizzle writes for `POST`, `PATCH`, and `DELETE`. Delete remains the legacy hard delete. The route continues to write only the fields the legacy handler wrote on create/update and preserves joined kegiatan/fungsi response enrichment.
- Arsip classification metadata CRUD writes in `POST /api/arsiparis/klasifikasi`, `PATCH /api/arsiparis/klasifikasi/$id`, and `DELETE /api/arsiparis/klasifikasi/$id` now use local `dms_session` authorization and local PostgreSQL/Drizzle writes. The legacy ADMIN-or-ARSIPARIS role behavior is preserved because this page is Arsiparis-owned metadata CRUD, not general Admin user management. Delete remains cascade soft-delete of the selected node and active descendants.
- Ketua Tim assignment metadata writes in `POST /api/ketua-tim/`, `DELETE /api/ketua-tim/`, `DELETE /api/ketua-tim/$id`, and `PATCH /api/ketua-tim/kegiatan/$kegiatanId` now use local `dms_session` ADMIN authorization and local PostgreSQL/Drizzle writes. One assignment per kegiatan is preserved via the existing unique `kegiatan_id` semantics; replacement uses an explicit transaction for the lookup/update-or-insert route.

Skipped or deferred in this pass:

- No `master_jenis_dokumen` API write route exists in the audited route set; browser helper/UI retirement for `src/lib/master-data/jenis-dokumen.ts` remains a later Supabase-runtime cleanup concern.
- `/api/users/*`, reset-password, change-password, activation/deactivation, user creation/update, role administration, password provisioning, and Supabase Auth Admin replacement remain Phase 10.
- Admin storage diagnostics and orphan cleanup remain Phase 9 storage surface work.
- Browser admin page/component rewrites and browser helper retirement remain later phases.
- No workflow routes, preview/download routes, storage helpers, migrations, seeds, route generation, package files, or schema files are part of this pass.

Runtime scope:

- Master fungsi, kegiatan, jenis permintaan, kategori, detail, kelengkapan, jenis dokumen, classification writes, and Ketua Tim assignment writes where they do not depend on Supabase Auth Admin.
- Local `dms_session` ADMIN authorization with dedicated ADMIN behavior preserved.
- Request/response shape parity for existing `POST`, `PATCH`, and `DELETE` or soft-delete behavior.
- Local Drizzle transactions where writes affect multiple tables or assignment replacement semantics.

Non-goals:

- No user creation, user update, activation/deactivation, reset-password, change-password, Auth Admin replacement, password provisioning, or auth-role administration.
- No browser admin page rewrite unless a future UI phase explicitly scopes it.
- No package cleanup or global Supabase removal.

Validation gates:

- ADMIN-only access remains server-enforced and dedicated.
- Existing active/soft-delete/hard-delete behavior is preserved per master route.
- Duplicate/constraint errors preserve UI-compatible status categories and response shapes.
- Migrated master/admin writes have no Supabase write fallback.

Exit criteria:

- Non-user-management master/admin CRUD writes selected for Phase 8 are local-backed, with user-management/Auth Admin surfaces explicitly left for Phase 10.

Key risks:

- Admin master pages may still use browser Supabase helpers for reads or mutations.
- Ketua Tim mutation routes may use user-name enrichment or Auth Admin lookups that should not pull user-management into Phase 8.

Deferred items:

- `/api/users/*`, password/change-password/reset-password flows, Supabase Auth Admin replacement, browser admin helper/UI retirement, and final Supabase dependency cleanup.

### Phase 8G: Write API Stabilization And Supabase Write Retirement Audit

Goal: close Phase 8 only after migrated write domains are audited and remaining writes are assigned to later phases.

Status as of 2026-05-18: complete. Phase 8 is closed for the selected clean-local write domains, with no true Phase 8 blocker found. Phase 9 may begin with storage/file-access completion.

Audit summary:

- Phase 8B Pegawai document update/revision writes: `PATCH /api/dokumen/$id` and `POST /api/dokumen/$id/submit` are local `dms_session` and local Drizzle backed for the scoped metadata/status paths. Update plus Non-Material audit and submit/resubmit status plus audit run inside local transactions. `PATCH /api/dokumen/$id` still imports Supabase helpers only because the same mixed route file retains deferred `DELETE /api/dokumen/$id` storage deletion behavior; the migrated PATCH path has no Supabase write fallback and fails closed on pending/move-required lampiran paths.
- Phase 8C PPK workflow mutations: `POST /api/ppk/dokumen/$id/approve`, `POST /api/ppk/dokumen/$id/reject`, `POST /api/ppk/kembalikan/$id`, and safe `POST /api/ppk/resubmit/$id` use local `dms_session`, local Drizzle writes, FSM transitions, and append-only audit transactions. Supabase remains in `GET`/`PATCH /api/ppk/resubmit/$id` for mixed attachment save/move/delete behavior and is deferred to Phase 9.
- Phase 8D Bendahara workflow mutations: `POST /api/bendahara/dokumen/$id/approve` and `POST /api/bendahara/dokumen/$id/reject` use local `dms_session`, local Drizzle writes, FSM transitions, and append-only audit transactions. `PATCH /api/dokumen/$id/nominal` remains deferred because its legacy authorization is cross-role.
- Phase 8E Arsiparis archive metadata/lifecycle writes: `POST /api/arsiparis/dokumen/$id/archive`, `POST /api/arsiparis/aktif/$id/pindahkan`, and `POST /api/arsiparis/inaktif/$id/musnahkan` use local `dms_session`, local Drizzle writes, transactions, preserved `lampiran_snapshot`/`nominal_realisasi`, metadata-only lifecycle transitions, proposal creation, and append-only audit inserts. Destructive `PATCH /api/arsiparis/usul-musnah/$id` remains Phase 9 because it combines metadata with file destruction and `DIMUSNAHKAN` file-access semantics.
- Phase 8F master/admin non-user-management CRUD writes: master fungsi, kegiatan, jenis/kategori/detail permintaan, kelengkapan dokumen, Arsip classification CRUD, and Ketua Tim assignment writes use local `dms_session` with ADMIN or ADMIN/ARSIPARIS behavior as scoped, plus local Drizzle writes. Transaction use is limited to multi-step replacement/update semantics such as Ketua Tim per-kegiatan replacement; single-row metadata CRUD remains single-write local Drizzle behavior.
- Remaining Supabase references are classified rather than removed. The broad audit still finds Supabase in storage/preview/download, physical file movement/deletion, orphan cleanup/diagnostics, `/api/users/**`, password/Auth Admin routes, browser helpers/UI pages, legacy cross-role nominal update, and inactive/ambiguous old draft-create compatibility. None is a blocker for closing Phase 8 because those surfaces are assigned below.

Remaining work classification:

- Phase 9 storage/file-access: central/role preview and download routes; raw preview/download URL routes except already-local opt-in raw access; physical update/resubmit file movement; PPK resubmit attachment save/move/delete; document delete if storage-coupled; `AttachmentEditor` browser storage cleanup; admin storage diagnostics/orphan cleanup; archive destructive approval; physical file deletion; `DIMUSNAHKAN` file-access hardening.
- Phase 10 user-management/Auth Admin: `/api/users/**`, `/api/users/me/change-password`, reset-password, activation/deactivation, user create/update, role/status administration, password provisioning, `src/lib/user-helpers.ts`, and Supabase Auth Admin replacement.
- Phase 11 global cleanup/browser helper/package/env cleanup: global Supabase dependency/env cleanup after parity, browser helper/UI retirement not required for server API parity, remaining browser master-data helper reads/writes including `master_jenis_dokumen`-related surfaces, release hardening, and final global Supabase removal only after Phase 9 and Phase 10 close their gaps.
- Cross-role deferred write: `PATCH /api/dokumen/$id/nominal` remains deferred because legacy behavior allows multiple role categories and should not be narrowed casually.
- True Phase 8 blockers: none found in the selected migrated write domains.

Focused manual smoke checklist for Phase 8G closure:

- Pegawai `PATCH /api/dokumen/$id` metadata update in an allowed status.
- Pegawai `PATCH /api/dokumen/$id` with pending lampiran path fails closed.
- Pegawai existing-document `POST /api/dokumen/$id/submit`.
- PPK approve, reject, and kembalikan.
- PPK safe `POST /api/ppk/resubmit/$id` without attachment changes or pending paths.
- Bendahara approve and reject.
- Arsiparis archive creation from `COMPLETED`.
- Arsiparis `AKTIF -> INAKTIF`.
- Arsiparis `INAKTIF -> USUL_MUSNAH`.
- ADMIN selected master CRUD route.
- Classification CRUD as ADMIN and ARSIPARIS where current behavior permits both.
- Ketua Tim assignment create, replace, and delete.
- Wrong role returns 403 and unauthenticated request returns 401 on at least one route per role.
- `log_aktivitas` appends where expected and is not updated or deleted.
- Phase 8 flows do not perform physical file movement or deletion.

Runtime scope:

- Audit migrated Phase 8 write domains for Supabase-backed writes and fallback paths.
- Run or document focused workflow/manual checks for Pegawai, PPK, Bendahara, Arsiparis, and selected master/admin writes.
- Confirm local `dms_session` role enforcement, transaction boundaries, FSM behavior, and append-only audit behavior.
- Update migration docs with completed status and deferred items.

Non-goals:

- No preview/download/storage migration.
- No user-management/Auth Admin replacement.
- No browser helper/UI retirement.
- No package cleanup, global Supabase dependency removal, route generation, DB scripts, migrations, or seeds unless a preceding runtime subphase explicitly required them.

Validation gates:

- Grep/audit confirms migrated write domains no longer use Supabase-backed writes or Supabase fallback.
- Remaining writes are explicitly deferred to Phase 9 storage, Phase 10 admin/user-management/Auth Admin, or Phase 11 global cleanup.
- Focused checks cover submit/update/revision, PPK decision, Bendahara decision, archive metadata lifecycle, and selected master/admin CRUD where migrated.
- Guarded diffs confirm no unrelated `src/routeTree.gen.ts`, submit route, DB scripts, migrations, seeds, package files, or tests changed unless explicitly in scope for a runtime subphase.

Exit criteria:

- Core workflow writes selected for Phase 8 are local-backed for the clean local target, and the next phase can start with storage/file-access completion rather than another broad write audit.

Key risks:

- Supabase imports may remain in mixed files for storage, Auth Admin, or browser helper reasons and must be classified rather than removed blindly.
- A migrated write may still call a Supabase-backed helper indirectly.

Deferred items:

- Phase 9: preview/download/file streaming, update/resubmit physical movement, attachment remove/delete, archive physical destruction, storage diagnostics/orphan cleanup, and `DIMUSNAHKAN` file-access hardening.
- Phase 10: user-management, passwords, Supabase Auth Admin replacement, and Supabase runtime retirement planning.
- Phase 11: final dependency/env cleanup, regression, backup/restore, LAN release readiness, and global Supabase removal after parity.

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
