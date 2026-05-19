# Practical Phase Plan

This plan turns the roadmap into an execution sequence. The main rule is to stabilize the three infrastructure pillars first: database, auth, and storage. Deployment packaging should not happen too early because container/LAN decisions are cheaper after runtime behavior is stable.

## Planning Principle For Remaining Work

Phase 6F proved the required submit foundations, but it also became too granular. From Phase 6G onward, phases should produce direct runtime progress unless a concrete blocker is discovered. Prefer route or domain migration phases with focused tests and controlled runtime changes. Do not add new helper-only or planning-only phases just to reduce uncertainty.

The local target is intentionally clean: old Supabase production/current data is not migrated, old Supabase Storage files are not migrated or copied, local PostgreSQL uses seed/new local data, and local filesystem storage uses newly uploaded local files. Missing old Supabase-backed files are expected during the transition and must fail cleanly without Supabase fallback.

Current active area after Phase 10F is Phase 11 global cleanup, regression, and release readiness. Phase 7A inventory is recorded in `docs/migration/read-api-inventory-prioritization.md`; Phase 7B migrated the first master/current-user read API groups and Phase 7B.3 documented the remaining browser master-data helper read surfaces without runtime changes. Phase 7C migrated the scoped role inbox/list dokumen GET routes on 2026-05-17. Phase 7D migrated the scoped dokumen detail/log GET routes on 2026-05-17. Phase 7E migrated scoped laporan and archive metadata/search/classification GET routes on 2026-05-17, while dashboard audit found no dedicated dashboard read API route. Phase 7F closed the major read-domain migration with an audit on 2026-05-17 and found no true remaining Phase 7 read blocker. Phase 8A completed the write/mutation inventory, Phase 8B through 8F migrated the selected clean-local write domains, and Phase 8G closed the write-domain audit on 2026-05-18 with no true Phase 8 blocker found. Phase 9 completed the selected clean-local storage/file-access server surfaces on 2026-05-18. Phase 10B migrated only the admin user list/detail reads to local PostgreSQL/Drizzle, Phase 10C migrated admin user create/update/activate/deactivate plus role assignment to local PostgreSQL/Drizzle, Phase 10D migrated admin reset-password plus self-service change-password to local Argon2id password hash updates, Phase 10E completed the user delete/deactivate semantics audit with no hard-delete user behavior accepted by default, and Phase 10F closed user-management/auth runtime stabilization on 2026-05-18. Phase 11C.1 migrated `AttachmentEditor` pending upload/reset/cancel cleanup off browser Supabase Storage and onto existing local `/api/upload` behavior plus a pending-only cleanup branch. Phase 11C.2 migrated `KelengkapanChecklist` master kelengkapan reads off browser Supabase and onto local `/api/master-kelengkapan` reads with scoped client-side chain filtering parity. Phase 11C.3 migrated `HierarchicalFilter` report dropdown reads off browser Supabase and onto existing local master-data GET APIs while preserving report filter state/cascade behavior. Phase 11C.4 migrated the API-covered admin/master-data CRUD pages off browser Supabase and onto existing local master-data APIs, with `admin.master-data.jenis-dokumen.tsx` deferred because no `/api/master-jenis-dokumen` route was registered. Phase 11C.4b inventoried that deferred page and confirmed migration remained blocked under the no-route-generation/no-`routeTree.gen.ts`-edit guardrails. Phase 11C.4c added generated route registration for `/api/master-jenis-dokumen*`, added narrow local Drizzle-backed jenis-dokumen APIs, and migrated the admin jenis-dokumen page off browser Supabase. Phase 11C.5 retired browser Supabase reads from scoped PPK/Bendahara/Arsiparis role dashboard/list pages by using existing local auth, role list, archive list/search, and master dropdown APIs. Phase 11C.6 retired browser Supabase reads from the scoped Pegawai submit, Pegawai revisi, and PPK resubmit pages by using existing local master-data and kelengkapan APIs while preserving submit/revision/resubmit mutation contracts. Phase 11C.7 retired the remaining scoped active browser Supabase usage from the admin dashboard and Pegawai document list by using existing local session and document list APIs. `POST /api/dokumen/submit` is locally backed for the clean local target, while global Supabase helper/package/env cleanup, release hardening, and full regression stay in Phase 11.

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

Status as of 2026-05-18: Phase 9A inventory/order is complete after Phase 9.0 planning, Phase 9B migrated the raw preview/download URL-generation endpoints to internal `/api/files/access?token=...` URLs, Phase 9C migrated the scoped central/PPK/Bendahara document preview/download route handlers to document-aware internal access URLs, Phase 9D migrated scoped update/revision/resubmit attachment movement, Phase 9E migrated the Pegawai UI `DELETE /api/dokumen/$id` path for owner non-material `TERSIMPAN` documents with no material request-chain fields, and Phase 9F migrated destructive archive approval for `PATCH /api/arsiparis/usul-musnah/$id`. Phase 9E is a narrow legacy-compatible exception where hard-deleting the user-owned saved non-approval document may cascade-delete that document's `log_aktivitas` rows; workflow, approval, completed, archived, and archive-destruction audit logs remain outside this exception. Phase 9G diagnostics/orphan cleanup and final storage stabilization remain open.

Phase 9 owns storage/file-access completion only. It builds on the existing local storage foundations: local path safety, local upload, local pending-to-formal movement, submit move planning, internal file access tokens, `/api/files/access`, and raw logical-path local streaming.

Phase 9 must not repeat the earlier helper-only over-fragmentation pattern. Each runtime subphase should move one user-visible storage/file-access domain to the local target, then verify it before moving to more destructive behavior.

Non-goals:

- No Supabase Storage migration, copy, download, backfill, or sync.
- No public static serving of `storage/`.
- No broad endpoint behavior changes unrelated to storage.
- No user-management/Auth Admin, password, package/env cleanup, global Supabase dependency removal, DB schema redesign, browser admin helper retirement, or broad UI rewrite.
- No `src/routeTree.gen.ts` changes unless a later explicitly scoped route-generation task approves them.

Critical invariants:

- Existing endpoint paths, HTTP methods, request payloads, response wrappers, and UI behavior stay compatible.
- `{ signedUrl }` response shape is preserved where current callers expect it.
- Internal signed URLs point to an internal API route such as `/api/files/access?token=...`, never to a filesystem path.
- Server-side RBAC is authoritative; `dms_active_role` remains UX state only; `ADMIN` remains dedicated.
- Migrated storage routes must not keep or add Supabase Storage fallback.
- Old Supabase-backed files are not migrated, copied, downloaded, backfilled, synced, or fetched on demand. Missing old files fail cleanly.
- Absolute physical paths, storage roots, secrets, DB URLs, Supabase URLs, signed-token internals, and raw filesystem errors are never exposed to clients.
- Logical path validation, path traversal prevention, and local storage root containment are required before any file read, move, or delete.
- Token verification alone is not authorization. File access must revalidate the current session, role/owner access, document/archive metadata, logical path safety, and relevant archive state before serving.
- `DIMUSNAHKAN` must block preview/download/file access even if stale files or stale unexpired tokens exist.
- `log_aktivitas` remains append-only where a storage action is also a workflow action.
- `lampiran_snapshot` must not be silently dropped except in the explicitly scoped destructive archive approval behavior that preserves legacy semantics.
- If DB mutation and file mutation are not fully atomic, the route must not claim full rollback. It must use explicit failure handling and safe final states.

Recommended order:

1. Phase 9A inventory/order.
2. Phase 9B raw preview/download URL generation.
3. Phase 9C role/document preview/download routes.
4. Phase 9D update/revision/resubmit attachment movement.
5. Phase 9E document delete and attachment remove/delete.
6. Phase 9F destructive archive approval and `DIMUSNAHKAN` hardening.
7. Phase 9G diagnostics, orphan cleanup, and stabilization.

Reason: preview/download and authorization hardening must be stable before delete/destruction behavior is migrated.

### Phase 9A: Storage Surface Inventory And Runtime Order

Goal: produce the final Phase 9 storage/file-access inventory and select the first runtime group.

Status: complete as of 2026-05-18. This was docs/audit only; no runtime code, route generation, tests, DB scripts, migrations, seeds, package files, or Supabase Storage migration/copy/download/backfill/sync were changed or run.

Runtime scope:

- Docs/audit only.
- Inventory remaining Supabase-backed or mixed storage/file-access routes and helpers.
- Classify preview/download endpoints, raw signed URL replacement endpoints, update/revision/resubmit attachment movement, delete/remove/cleanup, destructive archive approval, browser `AttachmentEditor` surfaces, and admin diagnostics/orphan cleanup.
- Confirm existing local helper readiness and any route-specific gaps.
- Select Phase 9B as the first runtime group unless the inventory finds a concrete blocker.

Non-goals:

- No runtime code, helper creation, route edits, UI rewrite, tests, route generation, DB scripts, migrations, seeds, package changes, Supabase removal, or file migration.

#### Phase 9A Storage Surface Inventory

| Surface / route / helper | Current state | Supabase or mixed state | User-facing contract | Phase | Key parity risk | First action needed |
|---|---|---|---|---|---|---|
| `GET /api/dokumen/preview-url` | Migrated in 9B; returns internal raw logical-path URL by default | Local session, local raw-path authorization, internal token URL | `{ signedUrl, filename }`, 900s preview token | Complete in 9B | Raw path authorization remains coarse by design | Monitor in manual smoke; document-aware access belongs to 9C |
| `GET /api/dokumen/download-url` | Migrated in 9B; returns internal raw logical-path download URL | Local session, local raw-path authorization, internal token URL | `{ signedUrl }`, download token with derived filename | Complete in 9B | Filename/content-disposition parity for underscore and dash pending paths | Monitor in manual smoke; document-aware access belongs to 9C |
| `/api/files/access` plus token/internal URL helpers | Existing foundation; serves local raw logical-path tokens | Local token/path/file read only; no Supabase Storage | Browser-fetchable internal URL returned in `signedUrl` | Foundation for 9B/9C | Supports raw logical-path tokens only; no document/archive token authorization yet | Reuse for 9B raw paths; extend later only when 9C needs document/archive tokens |
| `GET /api/dokumen/$id/preview/$lampiranIndex` | Supabase signed URL | Supabase auth/DB helper/storage | `{ signedUrl }`; owner or approver; blocks `DIMUSNAHKAN` | 9C | Must re-check document/archive state at access time, not only token issue time | Migrate after 9B using document metadata and local session/role checks |
| `GET /api/dokumen/$id/download/$lampiranIndex` | Supabase signed URL | Supabase auth/DB helper/storage | `{ signedUrl }`; 3600s download URL | 9C | Client builds filename; route may not return `filename` today | Preserve `{ signedUrl }` and download disposition without forcing UI rewrite |
| `GET /api/ppk/dokumen/$id/preview/$lampiranIndex` and download | Supabase signed URL | Supabase role reads/storage | `{ signedUrl }`; PPK-only; blocks `DIMUSNAHKAN` | 9C | Existing preview maps object missing to 410 in one path | Preserve role-specific status/error categories |
| `GET /api/bendahara/dokumen/$id/preview/$lampiranIndex` and download | Supabase signed URL | Supabase role reads/storage | `{ signedUrl }`; BENDAHARA-only; blocks `DIMUSNAHKAN` | 9C | Same response shape but role gate differs | Preserve role-specific route paths and wrappers |
| `PATCH /api/dokumen/$id` | Local DB metadata update; blocks pending lampiran paths | Mixed file contains Supabase delete path for `DELETE`; PATCH defers movement | `{ dokumen }` response; edit/revision compatible | 9D | New/replaced attachments cannot move yet | Add local pending move + explicit DB/file failure handling |
| `GET/PATCH/POST /api/ppk/resubmit/$id` | GET/PATCH still Supabase-backed; POST local decision path blocks storage-coupled changes | Mixed Supabase auth/DB/storage for GET/PATCH; local POST | `{ dokumen }`, `{ success: true }` | 9D | PATCH uses `syncDocumentAttachments()` and fire-and-forget orphan delete | Split/migrate attachment save/move/delete before enabling new files |
| `src/lib/dokumen/storage.ts` `syncDocumentAttachments()` / `deleteOrphanFiles()` | Supabase `.move()` / `.remove()` helper | Supabase Storage helper | Internal helper behind update/resubmit flows | 9D/9E | Fire-and-forget deletes and non-atomic DB/file behavior | Replace or bypass with local path/move/delete semantics per route |
| `DELETE /api/dokumen/$id` | Migrated in 9E for owner non-material `TERSIMPAN` documents with no material request-chain fields only | Local DB/filesystem; no Supabase Storage fallback | `{ success: true }` for eligible delete; explicit partial-cleanup 500 if DB delete succeeds but local unlink fails | Complete in 9E for scoped Pegawai delete | Accepted audit exception cascades logs only for this user-owned non-approval document delete | Manual smoke must cover wrong owner, material/workflow states, archive rows, missing files, unsafe paths, legacy URL metadata, and partial cleanup |
| `src/components/dokumen/AttachmentEditor.tsx` | Direct browser Supabase upload/remove; preview/download via raw URL helper | Browser Supabase Storage/Auth | Existing edit/revisi/resubmit upload/reset/cancel UX | 9D/9E | Local filesystem cannot be browser-written; reset/cancel delete policy needed | Move upload/delete through server APIs when owning routes support movement |
| `src/components/dokumen/AttachmentViewer.tsx`, `src/lib/storage-client.ts`, `src/lib/file-helpers.ts` | Call API endpoints and consume `signedUrl` | No direct Supabase Storage except through APIs | iframe/fetch/open/download using returned `signedUrl` | 9B/9C | Callers expect fetchable URL and often build filenames client-side | Preserve returned `{ signedUrl }`; avoid broad UI rewrite |
| `PATCH /api/arsiparis/usul-musnah/$id` | Migrated in 9F; destructive PATCH local-backed | Local session, local DB transaction, local filesystem unlink after DB state change; no Supabase Storage fallback | `{ success: true, message }`; sets `DIMUSNAHKAN`, clears snapshot | Complete in 9F | DB/filesystem deletion is not atomic; raw logical-path tokens remain context-free | Manual smoke must cover ARSIPARIS-only auth, invalid states, missing files, unsafe paths, partial cleanup, and destroyed preview/download |
| `GET /api/admin/analyze-storage` | Supabase Storage listing vs DB metadata | Supabase auth/DB/storage | `{ summary, folder_details, orphan_paths, referenced_paths_count }` | 9G | Diagnostics can expose too much path detail | Rebuild on local filesystem scan after core storage semantics stabilize |
| `GET /api/admin/cleanup-orphan-files` | Supabase Storage list/remove; comments mention dry-run but code deletes | Supabase auth/DB/storage | `{ message, deleted_count, orphan_paths? }` | 9G | Dangerous deletion; must compare docs and archive snapshots | Implement local dry-run-first cleanup after delete/destruction semantics |
| `POST /api/upload`, `POST /api/dokumen/rename-pending`, `POST /api/dokumen/submit` | Already local-backed for scoped clean-local behavior | May retain unrelated Supabase imports/helpers but storage action is local | Existing upload, rename, submit response shapes | Existing foundation | Not remaining Phase 9 blockers; still not proof for update/delete/destruction | Treat as reusable precedent only; do not rework in 9A/9B |

#### Classification By Phase 9 Bucket

- 9B: raw URL generation for `preview-url`, `download-url`, and callers that only require `{ signedUrl }` parity through `storage-client`.
- 9C: central document preview/download plus PPK/Bendahara equivalents and Arsiparis pages that call the central route.
- 9D: `PATCH /api/dokumen/$id`, PPK resubmit GET/PATCH storage-coupled behavior, `syncDocumentAttachments()`, and the upload side of `AttachmentEditor`.
- 9E: `DELETE /api/dokumen/$id` is locally backed for the scoped Pegawai UI delete case: authenticated PEGAWAI owner, `is_non_material=true`, no material request-chain fields, `status='TERSIMPAN'`, and no archive row. Replaced/orphan attachment deletion, pending reset/cancel deletion, and the delete side of `AttachmentEditor` remain scoped/deferred because no active server remove/delete route exists for those browser-only actions.
- 9F: destructive `PATCH /api/arsiparis/usul-musnah/$id` and `DIMUSNAHKAN` stale file/token hardening.
- 9G: `analyze-storage`, `cleanup-orphan-files`, final storage grep/stabilization, and orphan policy.
- Phase 10/11: user-management/Auth Admin/password work, global Supabase package/env/browser-helper retirement, and final Supabase removal are not Phase 9 storage runtime.

#### Existing Helper Readiness

- Ready for reuse: `local-storage-paths.ts` path normalization, traversal prevention, root containment, owner/classification helpers.
- Ready for reuse: `file-access-token.ts`, `internal-file-access-url.ts`, and `/api/files/access` for internal `/api/files/access?token=...` URLs.
- Ready for 9B/9C: `internal-file-access.ts` can serve local raw logical-path tokens and document/lampiran tokens with current session, owner/role compatibility, document/archive revalidation, safe logical path, root containment, content type, and disposition checks.
- Ready for movement surfaces: `local-upload.ts`, `local-pending-move.ts`, and `submit-move-plan.ts` cover local upload, pending/formal classification, no-overwrite movement, and submit planning patterns.
- Existing local runtime precedents: `/api/upload`, `/api/dokumen/rename-pending`, and `/api/dokumen/submit` show compatible local upload/move/submit behavior for clean local data.

#### Route-Specific Gaps

- Document/archive-aware internal access is implemented only for Phase 9C document/lampiran tokens; archive-id-specific tokens remain unsupported.
- Phase 9B must remove the raw preview/download Supabase Storage fallback and preserve `{ signedUrl }`.
- Role preview/download routes now use local session/role/document/archive checks for the scoped central, PPK, and Bendahara paths; filename remains client-built while internal access sets inline/attachment disposition.
- Update/resubmit movement still needs explicit DB/file ordering and failure semantics.
- Document delete now uses route-scoped local delete preflight and explicit partial-failure responses for the accepted non-material `TERSIMPAN` Pegawai-owned exception; archive destruction still needs safe partial-failure semantics and must not claim full rollback.
- `AttachmentEditor` still writes/deletes directly through browser Supabase Storage; its reset/cancel delete behavior needs a later server API/UI compatibility phase or final browser helper retirement.
- Admin orphan cleanup needs a local policy that compares active document metadata and archive snapshots, preferably dry-run-first.

#### First Runtime Group Selection

Phase 9B remains the recommended first runtime group. No concrete blocker was found.

Reason: raw URL-generation migration is less destructive than movement/deletion, preserves current `{ signedUrl }` response shape, can use the existing token/internal access foundations, and establishes the local access path before update, delete, archive destruction, and cleanup work.

#### Phase 9B Readiness

Candidate runtime files:

- `src/routes/api/dokumen/preview-url.ts`
- `src/routes/api/dokumen/download-url.ts`
- `src/lib/storage/internal-file-access-url.ts`
- `src/lib/storage/internal-file-access.ts` only if raw-path behavior must be adjusted for response/header parity
- `src/lib/storage/file-access-token.ts` only if token payload validation blocks required raw download fields

Allowed runtime scope:

- Make raw preview/download URL generation return internal `/api/files/access?token=...` URLs for local logical paths.
- Preserve `GET` methods, query params, status categories, and response wrappers.
- Expected shapes: preview returns `{ signedUrl: "/api/files/access?token=...", filename }`; download returns `{ signedUrl: "/api/files/access?token=..." }`.
- Revalidate authenticated local session, owner-or-compatible-role raw path access, logical path safety, path traversal prevention, storage root containment through the access route, and safe filename/content-disposition behavior.

Must-not scope:

- No document/role preview route migration, no `AttachmentEditor` rewrite, no physical file movement/deletion, no admin diagnostics cleanup, no archive destruction, no route generation, no Supabase Storage fallback, and no old file migration/copy/download/backfill/sync.

Manual validation checklist:

- Unauthenticated raw preview/download returns compatible 401.
- Wrong owner without compatible role returns compatible 403.
- Unsafe `url` values fail closed without physical path or root exposure.
- Preview response contains only internal API `signedUrl` plus existing filename behavior.
- Download response contains only internal API `signedUrl` and uses attachment disposition when fetched.
- Existing local file can be fetched through the returned internal URL.
- Missing old Supabase-backed file fails cleanly through internal access.
- Grep confirms migrated raw endpoints no longer call Supabase Storage or keep Supabase fallback.

Known caveats:

- 9B raw-path authorization remains coarse owner-or-PPK/BENDAHARA/ARSIPARIS compatibility, matching current raw route behavior. Document/archive metadata revalidation belongs to 9C/9F.
- `/api/files/access` currently depends on cookie-backed local session at token use time, so manual validation must fetch the internal URL with credentials.

Validation gates:

- Every remaining storage/file-access surface is assigned to Phase 9B through 9G or explicitly deferred.
- Supabase references are classified by purpose rather than removed.
- Route paths and response shapes needing `{ signedUrl }` compatibility are listed.
- Guarded diffs confirm docs-only changes.

Exit criteria:

- Phase 9B can be executed from one bounded prompt without another broad planning loop.

Key risks:

- Mixed files may contain both already-local reads/writes and deferred storage code.
- Browser `AttachmentEditor` behavior may require server route support before UI callers can be safely switched.

Deferred items:

- Runtime preview/download, movement, deletion, archive destruction, diagnostics, and UI caller changes remain later Phase 9 subphases.

### Phase 9B: Preview/Download Internal URL Route Migration

Goal: migrate raw preview/download URL-generation surfaces away from Supabase signed URLs.

Status: complete as of 2026-05-18 for the two raw logical-path URL-generation endpoints. `GET /api/dokumen/preview-url?url=...` and `GET /api/dokumen/download-url?url=...` now generate relative internal `/api/files/access?token=...` URLs through the existing token helper and raw internal access service. This phase did not move, delete, migrate, copy, download, backfill, sync, or fetch old Supabase Storage files.

Runtime scope:

- `GET /api/dokumen/preview-url?url=...`.
- `GET /api/dokumen/download-url?url=...`.
- Generate internal `/api/files/access?token=...` URLs for local logical paths.
- Preserve current request query parameters, response shapes, filename behavior, expiry intent, and `{ signedUrl }` field names.
- Use existing token and internal access URL foundations where practical.
- Preserve raw access authorization through local `dms_session`, first-segment owner checks, and the existing raw-compatible `PPK`, `BENDAHARA`, and `ARSIPARIS` role policy.
- Remove Supabase Storage signed URL fallback from the migrated raw endpoints.

Non-goals:

- No physical file movement or deletion.
- No document/role preview route migration beyond shared helper work needed for raw URL parity.
- No browser UI rewrite unless a tiny caller compatibility adjustment is strictly required and explicitly scoped.
- No Supabase fallback for migrated raw URL paths.

Validation gates:

- Authorized local raw preview/download returns an internal API URL in `signedUrl`.
- Unauthorized and unauthenticated requests preserve compatible 401/403 categories.
- Unsafe logical paths fail closed without physical path exposure.
- Missing old files fail cleanly when the internal access URL is used.
- Internal token payloads do not contain physical paths, roots, secrets, DB URLs, or Supabase signed URLs.

Exit criteria:

- Raw preview/download URL-generation for local logical paths no longer depends on Supabase signed URLs.

Key risks:

- Raw path endpoints are high-risk because they accept a query-provided logical path.
- Current clients may fetch the returned `signedUrl` directly, so internal access response headers must remain browser-compatible.

Deferred items:

- Role/document preview/download routes for Phase 9C.
- Document delete, attachment remove/delete/reset/cancel behavior, archive destruction, diagnostics/orphan cleanup, and final browser helper retirement for later Phase 9/11 work.
- Document delete, attachment remove/delete, and `AttachmentEditor` reset/cancel deletion for Phase 9E.
- Archive destruction and `DIMUSNAHKAN` stale token/file hardening for Phase 9F.
- Admin diagnostics/orphan cleanup and final storage stabilization for Phase 9G.

### Phase 9C: Role-Specific Preview/Download Route Migration

Goal: migrate document and role preview/download routes to local internal file access.

Status: scoped runtime migration complete as of 2026-05-18 for the central document, PPK, and Bendahara preview/download route handlers. These routes now preserve `{ signedUrl }` while returning relative internal `/api/files/access?token=...` URLs backed by document/lampiran token revalidation. `/api/files/access` now re-checks local session binding, current document role/owner authorization, archive state, `DIMUSNAHKAN`, lampiran index, logical path safety, root containment, and file existence before streaming. No Supabase Storage fallback, old-file migration, movement, deletion, route generation, UI rewrite, DB schema change, seed, package change, or commit is part of this status.

Runtime scope:

- Central document routes: `/api/dokumen/$id/preview/$lampiranIndex` and `/api/dokumen/$id/download/$lampiranIndex`.
- PPK and Bendahara role-specific preview/download routes where present.
- Arsiparis preview/download behavior through the existing central document route callers.
- Document/archive-aware token generation or direct internal access behavior, as needed to preserve existing `{ signedUrl }` contracts.
- Revalidate local session, role, owner/workflow authorization, document status, archive status, lampiran index, logical path safety, and physical root containment.
- Preserve preview/download filename and content-disposition behavior.

Migrated routes:

- `GET /api/dokumen/$id/preview/$lampiranIndex`.
- `GET /api/dokumen/$id/download/$lampiranIndex`.
- `GET /api/ppk/dokumen/$id/preview/$lampiranIndex`.
- `GET /api/ppk/dokumen/$id/download/$lampiranIndex`.
- `GET /api/bendahara/dokumen/$id/preview/$lampiranIndex`.
- `GET /api/bendahara/dokumen/$id/download/$lampiranIndex`.

Implementation notes:

- Central route authorization mirrors local document detail visibility: owner, PPK-compatible workflow states, Bendahara-compatible workflow states, and Arsiparis for `COMPLETED`/`ARCHIVED`.
- PPK and Bendahara route-specific handlers additionally require the corresponding role and route-compatible workflow state.
- If an archive row exists for the document, file selection uses `lampiran_snapshot`; otherwise it uses `dokumen_transaksi.lampiran_urls`.
- Any archive row with `status_arsip='DIMUSNAHKAN'` blocks token issue and token use.
- Internal document tokens are bound to the issuing local user id and session id, and carry only `documentId`, `lampiranIndex`, purpose, disposition, status-check marker, and expiry metadata.

Non-goals:

- No physical file movement or deletion.
- No `AttachmentEditor` rewrite.
- No broad UI rewrite.
- No Supabase fallback.

Validation gates:

- Pegawai owner, PPK, Bendahara, and Arsiparis-compatible callers get authorized preview/download results for local files.
- Wrong role and unauthenticated requests fail with compatible categories.
- Invalid lampiran index and missing file fail cleanly.
- `DIMUSNAHKAN` blocks preview/download.
- Stale internal tokens cannot bypass current authorization or archive status.

Exit criteria:

- Role/document preview/download routes serve local files through internal API access without Supabase signed URLs.

Key risks:

- Existing callers rely on role-specific endpoints and central Arsiparis-through-document behavior.
- Archive detail reads use `lampiran_snapshot`, while document detail routes use `lampiran_urls`; the route must choose the correct metadata source.

Deferred items:

- Attachment remove/delete/reset/cancel behavior, document delete, archive destruction, diagnostics/orphan cleanup, and final browser helper retirement remain later Phase 9/11 work.
- Document delete for the scoped Pegawai non-material `TERSIMPAN` route was handled in Phase 9E; browser-only `AttachmentEditor` reset/cancel deletion remains deferred.
- Destructive archive approval and scoped physical deletion were handled in Phase 9F.
- Admin diagnostics/orphan cleanup and final storage stabilization remain Phase 9G.
- User-management/Auth Admin, browser helper retirement, package/env cleanup, and global Supabase cleanup remain Phase 10/11.

### Phase 9D: Update/Revision/Resubmit Attachment Movement

Goal: complete storage-coupled attachment movement deferred from Phase 8.

Status: scoped runtime migration complete as of 2026-05-18 for Pegawai update/revision metadata saves and PPK resubmit save/transition paths. `PATCH /api/dokumen/$id`, `PATCH /api/ppk/resubmit/$id`, and optional-attachment `POST /api/ppk/resubmit/$id` now preflight local pending attachments, move local pending files to formal `{actorUserId}/{dokumenId}/{uuid.ext}` paths, persist only planned logical paths, and avoid Supabase Storage move/delete fallback. The PPK resubmit route's GET/PATCH/POST auth boundary now uses local `dms_session` plus PPK role checks. Physical deletion of removed/replaced old formal attachments is intentionally deferred.

Runtime scope:

- Update-time pending-to-formal movement for Pegawai update/revision paths.
- PPK resubmit attachment save/move/delete behavior in the mixed resubmit route.
- Server route support needed for `AttachmentEditor` pending/local semantics.
- Use existing local pending move and path safety helpers where practical.
- Explicitly define DB/file operation ordering, partial failure responses, and recovery expectations for each route touched.

Migrated routes:

- `PATCH /api/dokumen/$id` for Pegawai non-material edit and material USER-targeted revision saves.
- `PATCH /api/ppk/resubmit/$id` for PPK-targeted revision attachment/nominal saves.
- `POST /api/ppk/resubmit/$id` when an optional attachment payload is sent with the resubmit transition.

Implementation notes:

- Pending dash and upload-API pending paths are accepted only when owned by the acting local user and present on local disk.
- Already formal local paths remain unchanged.
- Safe unsupported legacy paths may remain only when they are already present in existing document metadata with the same `kelengkapan_id` and URL; new unsupported paths are rejected.
- Missing source, unsafe path, owner mismatch, unsupported new path, and target conflict fail before DB metadata is updated.
- File movement runs before the DB update after full preflight. If a later movement fails, already moved files are rolled back best-effort before returning failure. If the DB update fails after movement, moved files are rolled back best-effort before returning failure.
- True DB/filesystem atomicity is still not available. The known non-atomic window is between successful local movement and successful DB update. If rollback also fails, the response marks compensation required and manual recovery/orphan cleanup is expected in a later storage cleanup phase.
- Removed/replaced old formal files are not physically deleted in 9D. Metadata replacement is correct, and orphan cleanup/delete behavior remains deferred to 9E/9G.

Non-goals:

- No preview/download migration unless already completed by 9B/9C.
- No document delete or archive destructive approval.
- No broad `AttachmentEditor` UI rewrite beyond the minimum server API compatibility required by the scoped route behavior.
- No Supabase fallback.

Validation gates:

- Pending dash and upload-API pending paths are handled according to the local helper support matrix.
- Already formal paths remain unchanged.
- Missing source, unsafe source, target conflict, owner mismatch, and partial movement fail safely.
- DB metadata is not updated to paths that cannot be satisfied without explicit compensation handling.
- No physical path or storage root is exposed.

Exit criteria:

- Update/revision/resubmit attachment movement for new local files is local-filesystem-backed and no longer relies on Supabase Storage movement/deletion.

Key risks:

- DB and filesystem updates are not naturally atomic.
- Attachment replacement can create orphan files if partial failure handling is loose.

Deferred items:

- Document delete, attachment remove/delete, archive destruction, broad orphan cleanup, final browser helper retirement, and global Supabase cleanup.

### Phase 9E: Document Delete And Attachment Remove/Delete Storage Behavior

Goal: migrate storage-coupled document deletion and attachment remove/delete behavior.

Status: scoped runtime migration complete as of 2026-05-18 for the Pegawai UI `DELETE /api/dokumen/$id` path. The route now uses local `dms_session` authorization, requires the `PEGAWAI` role plus document ownership, requires `is_non_material=true`, requires no material request-chain fields, requires `status='TERSIMPAN'`, blocks deletion when an archive row exists, preflights referenced local files safely, hard-deletes the local document row, and then unlinks eligible local files. This is a narrow legacy-compatible audit exception: because current local `log_aktivitas.dokumen_id` cascades on document delete, logs for this user-owned non-approval saved document may be deleted with the document. This exception does not apply to material, approval workflow, revision, completed, archived, archive-linked, or archive destruction paths. No Supabase Storage delete/fallback, old-file migration, old Supabase file lookup/fetch/copy/download/backfill/sync, preview/download route change, route generation, DB schema change, seed, package change, archive destruction, admin cleanup, or commit is part of this status.

Runtime scope:

- `DELETE /api/dokumen/$id` where it remained storage-coupled.
- Attachment remove/delete behavior that currently removes or schedules removal of physical files, inspected only where no active server route existed.
- Local filesystem deletion semantics for files referenced by document metadata in the scoped non-material `TERSIMPAN` delete route.
- Preserve legacy route contracts and status/error categories where callers rely on them.
- Prefer safe metadata-only behavior only if it preserves the existing contract; otherwise define local deletion explicitly.

Migrated routes:

- `DELETE /api/dokumen/$id` for authenticated PEGAWAI owner deletion of non-material `TERSIMPAN` documents with no archive row.

Inspected but unchanged:

- `POST /api/dokumen/rename-pending`; already local move-backed and not a delete route.
- `POST /api/upload`; already local upload-backed and not a delete route.
- `src/lib/dokumen/storage.ts` `deleteOrphanFiles()`; legacy helper remains unused by the Phase 9D migrated routes and is not generalized in 9E.
- `src/components/dokumen/AttachmentEditor.tsx`; reset/cancel delete is direct browser Supabase behavior with no active server remove route. No UI rewrite was done in 9E.

Implementation notes:

- The route path, method, request shape, and legacy success response `{ success: true }` remain unchanged for eligible deletes.
- Existing 401/403/404/400/500 categories remain: unauthenticated, not owner/not `PEGAWAI`, not found, incompatible state, and delete or partial-cleanup failure.
- Delete eligibility is limited to authenticated local session, assigned `PEGAWAI`, document owner, `is_non_material=true`, no material request-chain fields, `status='TERSIMPAN'`, and no archive row. Material, approval workflow, revision, completed, archived, and archive-linked documents are rejected.
- Local path validation happens before DB mutation. URL/protocol-like legacy metadata is treated as unsupported legacy metadata and skipped for physical deletion; traversal, absolute, non-file, symlink, or outside-root candidates fail before DB deletion.
- Existing/missing local files are inspected before DB mutation. Missing local files are a compatible no-op because legacy fire-and-forget Supabase removal tolerated missing objects and old Supabase-backed files may be absent locally.
- DB delete happens before filesystem unlink. This avoids leaving DB metadata pointing at files already deleted if the DB mutation fails, but can leave orphan files when post-DB unlink fails.
- If any post-DB file delete fails, the route returns a 500 response with `documentDeleted: true`, safe counts, failure codes, and `compensationRequired: true` instead of misleading `{ success: true }`.
- Physical deletion uses centralized logical path validation and physical path resolution, then rechecks realpath containment under the configured local storage root before unlink. Physical paths, storage roots, env values, raw filesystem errors, and token internals are not returned to clients.
- Archive/audit safety: any existing archive row blocks this document delete route. Destructive archive approval and `DIMUSNAHKAN` physical cleanup remain Phase 9F.
- Audit exception: the route inserts a legacy-compatible `DELETE` log before hard-deleting the document, but current local FK cascade removes that log and any other logs for this deleted non-material saved document. This exception is accepted only for this Pegawai-owned non-approval `TERSIMPAN` delete path; workflow, approval, completed, archived, and archive-destruction audit rows must remain preserved by ordinary routes.

Non-goals:

- No destructive archive approval.
- No admin-wide orphan cleanup.
- No old Supabase file lookup or fallback.
- No broad UI rewrite.
- No generalized storage deletion framework, cleanup engine, or transaction orchestration layer.

Validation gates:

- Deletion never targets paths outside local storage root.
- Missing local files are handled as compatible no-op for this route.
- Owner and role authorization remain server-enforced.
- Partial file deletion does not return a misleading full-success response.
- No raw physical paths, roots, or filesystem errors leak to clients.

Exit criteria:

- Met for `DELETE /api/dokumen/$id` and its scoped local document-file cleanup for owner non-material `TERSIMPAN` documents.
- Not met for browser-only `AttachmentEditor` reset/cancel delete and broad orphan cleanup; those remain deferred because 9E did not add a new server delete API or UI rewrite.

Key risks:

- The accepted audit exception must not be broadened beyond owner non-material `TERSIMPAN` document deletion.
- DB and filesystem updates are not atomic; post-DB unlink failure leaves local orphans for later manual recovery or Phase 9G cleanup.

Deferred items:

- Archive destruction and `DIMUSNAHKAN` hardening for Phase 9F.
- Admin diagnostics/orphan cleanup and broad removed/replaced-file reconciliation for Phase 9G.
- Final browser helper retirement, `AttachmentEditor` direct browser Supabase upload/remove replacement, user-management/Auth Admin, package/env cleanup, and global Supabase cleanup for Phase 10/11.

### Phase 9F: Archive Destructive Approval And DIMUSNAHKAN Hardening

Goal: migrate destructive archive approval and enforce destroyed-archive file-access blocking.

Status: scoped runtime migration complete as of 2026-05-18 for `PATCH /api/arsiparis/usul-musnah/$id`. The destructive approval route now uses local `dms_session` authorization, requires assigned `ARSIPARIS`, requires a `MENUNGGU` proposal and `USUL_MUSNAH` archive state, preflights `lampiran_snapshot` deletion candidates, updates proposal/archive/audit metadata in one local transaction, sets `status_arsip='DIMUSNAHKAN'`, preserves legacy snapshot clearing by setting `lampiran_snapshot=[]`, then unlinks eligible local files. Missing local files and URL/protocol-like legacy metadata are compatible no-ops with no Supabase fallback. Unsafe/path traversal/non-file/outside-root candidates fail before DB mutation. If post-DB local unlink fails, the route returns a safe partial-cleanup `500` with counts and `compensationRequired=true`; the archive remains `DIMUSNAHKAN` as the runtime authority and manual recovery or Phase 9G cleanup is expected.

Runtime scope:

- `PATCH /api/arsiparis/usul-musnah/$id` or equivalent destructive approval route.
- Preserve legacy metadata semantics: `status_arsip='DIMUSNAHKAN'`, proposal decision fields, `musnah_at`, `musnah_by`, `musnah_catatan`, append-only `log_aktivitas`, and legacy `lampiran_snapshot` clearing behavior if the scoped route currently clears it.
- Implement local file deletion or safe file-access blocking according to the route's accepted destructive behavior.
- Ensure `DIMUSNAHKAN` blocks preview/download/file access even if stale files or tokens exist.

Migrated routes:

- `PATCH /api/arsiparis/usul-musnah/$id` destructive approval.

Inspected but unchanged:

- `GET /api/arsiparis/usul-musnah/$id`; already local-backed read/detail route.
- `POST /api/arsiparis/inaktif/$id/musnahkan`; already local-backed proposal creation route and not physically destructive.
- `GET /api/arsiparis/inaktif/$id`; read-only archive detail.
- `GET /api/dokumen/$id/preview/$lampiranIndex` and `GET /api/dokumen/$id/download/$lampiranIndex`; Phase 9C already blocks `DIMUSNAHKAN` for document-aware tokens at issue and use time.
- `/api/files/access`; Phase 9C document-token revalidation remains unchanged. Raw logical-path tokens remain context-free by contract and cannot reliably infer destroyed archive state once legacy destructive approval clears `lampiran_snapshot`; archive UI preview paths use document-aware routes, not raw-token issue.

Implementation notes:

- Request shape remains `{ "aksi": "SETUJUI" }`.
- Success response remains `{ "success": true, "message": "Arsip berhasil dimusnahkan" }`.
- Proposal fields are updated to `status='DISETUJUI'`, `decided_by=<actor>`, and `decided_at=<decision time>`.
- Archive fields are updated to `status_arsip='DIMUSNAHKAN'`, `lampiran_snapshot=[]`, `musnah_at=<decision time>`, `musnah_by=<actor>`, and `musnah_catatan=<proposal catatan or null>`.
- `log_aktivitas` receives an append-only `USUL_MUSNAH_SETUJUI` row in the same DB transaction.
- DB state is written before local unlink so destroyed archives stop serving through document-aware preview/download and stale document tokens even if physical cleanup later fails.
- Physical deletion only uses safe logical paths from archive metadata, centralized local storage resolution, `lstat`, `realpath`, and containment checks under the local storage root. It does not follow symlinks as files.

Non-goals:

- No admin-wide cleanup sweep.
- No scheduler replacement.
- No Supabase Storage fallback.
- No old file migration or recovery.
- No admin-wide diagnostics/orphan cleanup sweep.
- No raw-token contract redesign or persisted token invalidation infrastructure.

Validation gates:

- ARSIPARIS authorization is enforced with local `dms_session`.
- Approved destruction updates archive/proposal metadata and appends audit consistently.
- Destroyed archive preview/download returns compatible blocked/unavailable behavior.
- Stale internal access tokens cannot serve destroyed archive files.
- Physical deletion, if implemented, is root-contained and safe on missing files.

Exit criteria:

- Archive destructive approval and `DIMUSNAHKAN` file-access blocking are local-backed and compatible for new local files.

Key risks:

- Legacy behavior both deletes files and clears `lampiran_snapshot`; dropping snapshot metadata outside this route would break archive traceability.
- File deletion and DB updates can partially fail.
- Raw logical-path tokens do not carry document/archive context. Physical deletion plus document-aware route use prevents normal archive UI bypass; a pre-existing raw token for an archive logical path can only be fully neutralized when physical deletion succeeds or later cleanup removes the stale file.

Deferred items:

- Storage diagnostics/orphan cleanup, archive scheduler replacement, and global Supabase cleanup.
- Phase 9G should reconcile any local files left after partial post-DB deletion failure and continue classifying remaining browser helper/direct Supabase surfaces.

### Phase 9G: Storage Diagnostics, Orphan Cleanup, And Runtime Stabilization

Goal: finish storage diagnostics/cleanup after core file access and destructive flows are stable.

Status: scoped runtime migration complete as of 2026-05-18 for the two admin storage routes. `GET /api/admin/analyze-storage` now uses local `dms_session` authorization, requires assigned `ADMIN`, scans only the configured local storage root, compares local files against local PostgreSQL metadata from `dokumen_transaksi.lampiran_urls` and retained `arsip.lampiran_snapshot`, and returns logical-path-only diagnostics. `GET /api/admin/cleanup-orphan-files` now uses the same local analysis and is conservative by default: it reports only unless `dry_run=false`, deletes only formal local files that are absent from both document and archive metadata, skips pending files even when `pending_only=true`, skips unsupported local file shapes, treats missing files as no-op, and returns partial-failure details without physical paths. No Supabase Storage listing/removal fallback, old-file migration, copy, download, backfill, sync, package cleanup, route generation, scheduler replacement, user-management/Auth Admin replacement, or browser helper retirement was done.

Runtime scope:

- Admin storage diagnostics route.
- Admin orphan cleanup route.
- Audit remaining Supabase Storage usage in routes, helpers, and browser surfaces.
- Document manual smoke checks and deferred cleanup.
- Prepare Phase 10 handoff.

Non-goals:

- No user-management/Auth Admin replacement.
- No package/env cleanup or global Supabase removal.
- No old Supabase file migration, copy, download, backfill, sync, or recovery.
- No broad UI rewrite.

Key validation gates:

- Upload, preview, download, move, delete, archive destruction, and cleanup routes preserve user-facing contracts.
- Unauthorized access fails.
- `DIMUSNAHKAN` blocks preview/download even if stale files exist.
- Path traversal and physical path leakage checks pass.
- Grep/audit confirms migrated storage/file-access routes have no Supabase Storage fallback.
- Remaining Supabase usage is classified into Phase 10 user-management/Auth Admin, Phase 11 global cleanup/browser helper retirement, or explicit reference-only buckets.

Exit criteria:

- Active storage behavior for new local data is local-filesystem-backed, and missing old Supabase-backed files fail cleanly without fallback.

Key risks:

- Cleanup can delete valid files if metadata comparison is wrong.
- Diagnostics can accidentally expose physical paths or storage root details.

Deferred items:

- Phase 10 user-management/Auth Admin and password work.
- Phase 11 global Supabase package/env cleanup, browser helper/UI retirement, regression, backup/restore, and release hardening.

Implementation notes:

- Diagnostics preserves the legacy top-level fields `{ summary, folder_details, orphan_paths, referenced_paths_count }` and adds conservative local categories for referenced, orphan candidate, pending, unsupported, unsafe, missing referenced, and legacy/unsupported metadata references.
- `orphan_paths` means formal local files that are confidently unreferenced by current local DB metadata. Pending files and unsupported path shapes are reported separately and are not deletion candidates.
- Cleanup preserves `GET`, `pending_only`, `dry_run`, `message`, `deleted_count`, and `orphan_paths` compatibility. Because the legacy route was dangerous and its comments documented `dry_run`, Phase 9G makes report-only behavior the default and requires `dry_run=false` for destructive cleanup.
- Cleanup protects every logical path referenced by `dokumen_transaksi.lampiran_urls` and every retained `arsip.lampiran_snapshot`, including any non-empty destroyed-archive snapshot metadata that still exists. Cleared `DIMUSNAHKAN` snapshots are not treated as proof that old files are valid to delete; files are deleted only when no current metadata source references the logical path.
- URL/protocol-like or invalid metadata references are classified as legacy/unsupported metadata and never converted into local filesystem paths.
- Responses include logical paths and code/count summaries only. They do not include physical paths, storage roots, env values, DB URLs, stack traces, token internals, or raw filesystem errors.

Manual smoke checklist:

- ADMIN can access `/api/admin/analyze-storage` and `/api/admin/cleanup-orphan-files`; unauthorized or non-admin users fail with 401/403.
- Diagnostics response does not expose physical paths or the storage root.
- Cleanup without `dry_run=false` reports only and does not delete files.
- Cleanup with `dry_run=false` deletes only confirmed local formal orphan files.
- Referenced files in `dokumen_transaksi.lampiran_urls` are not deleted.
- Referenced files in retained `arsip.lampiran_snapshot` are not deleted.
- Pending files are reported/skipped, including `pending_only=true`.
- Missing old Supabase-backed logical metadata is reported as missing/skipped without fallback.
- Upload, rename-pending, submit, update, PPK resubmit, preview/download, scoped document delete, and archive destruction still work for new local files.
- Preview/download still return internal `/api/files/access?token=...` URLs.
- `DIMUSNAHKAN` blocks document-aware preview/download and stale document tokens even if stale files remain.
- No Supabase Storage fallback occurs in migrated storage/file-access routes.

Remaining Supabase usage classification:

- Phase 10: `/api/users/*`, password/Auth Admin/user-management flows, and Supabase Auth Admin/user-name enrichment.
- Phase 11: `AttachmentEditor` direct browser Supabase upload/remove, browser master-data helper reads, `src/lib/storage-client.ts` raw helper retirement, global Supabase package/env/import cleanup, regression, backup/restore, and release hardening.
- Reference-only: migration docs, historical specs, legacy audit notes, and tests that mock Supabase to assert fallback absence.

Phase 9 storage-runtime caveat:

For new clean local data, active server-side storage behavior is now local-filesystem-backed for upload, rename-pending, submit movement, update/revision/PPK-resubmit movement, raw and document/role preview/download URL generation and access, scoped Pegawai non-material `TERSIMPAN` document delete, archive destructive approval cleanup, diagnostics, and conservative cleanup. This does not mean full storage retirement is complete: browser helper retirement remains pending, old Supabase Storage files were not migrated, raw logical-path tokens remain context-free, admin cleanup is intentionally conservative, and Phase 10/11 remain open.

## Phase 10: Admin/User Management And Supabase Runtime Retirement

Goal: replace remaining Supabase Auth Admin/user-management/runtime dependencies and prepare final Supabase retirement.

Status: planning only. Phase 10 implementation has not started. This breakdown preserves Phase 9 storage-runtime caveats and does not claim Phase 10 or Phase 11 completion.

Current local auth state:

- Already local-backed: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/auth/role-switch`, `GET /api/users/me`, `GET /api/users/me/ketua-tim`, and `GET /api/users/me/is-ketua-tim/$kegiatanId`.
- Existing foundations: `dms_session` HttpOnly cookie, `dms_active_role` as UX state only, `getLocalServerSession(request)`, local session repository, local role resolution, `hashPassword(...)`, `verifyPassword(...)`, and `auth.users.password_hash` with Argon2id.
- Remaining Phase 10 runtime surface after Phase 10C: `POST /api/users/$id/reset-password`, `POST /api/users/me/change-password`, and legacy `src/lib/user-helpers.ts` behavior used by those deferred password routes. `GET/POST /api/users/`, `GET/PATCH /api/users/$id`, `POST /api/users/$id/activate`, and `POST /api/users/$id/deactivate` are local-backed for the clean local target.

Shared Phase 10 guardrails:

- Preserve endpoint paths, methods, request fields, response wrappers, status categories, UI behavior, and role behavior.
- Use local `dms_session` and local PostgreSQL/Drizzle as the runtime authority.
- Do not trust `dms_active_role` as authorization proof.
- Keep `ADMIN` dedicated. Do not silently treat ADMIN as PEGAWAI, PPK, BENDAHARA, or ARSIPARIS.
- Do not combine `ADMIN` with non-admin roles in admin mutation logic.
- Add no Supabase Auth Admin fallback to migrated user-management/password routes.
- Do not remove global Supabase packages, env values, imports, or browser helpers in Phase 10.
- Do not migrate, copy, backfill, or recover old Supabase Auth data unless a later human-approved phase explicitly scopes it. The migration target remains clean local seed/new data only.
- Do not print plaintext passwords, generated password hashes, raw session tokens, token hashes, cookies, DB URLs, env values, or secrets.
- Do not modify `src/routeTree.gen.ts`, package files, env files, DB migrations, seeds, or scripts unless a later implementation prompt explicitly scopes and approves that work.
- Codex prompts for Phase 10 should say "Do not commit" unless the human explicitly requests a commit.

### Phase 10A: User/Auth Admin Surface Inventory And Contract Planning

Goal: produce the exact migration contract for remaining user-management/Auth Admin/password surfaces before runtime edits.

Status: complete as planning inventory only on 2026-05-18. No Phase 10 runtime implementation is claimed complete.

Runtime/docs scope:

- Docs/read-only audit only.
- Inventory active callers, endpoint paths/methods, request bodies, response wrappers, status categories, validation messages, role behavior, and current Supabase Auth Admin/password usage.
- Classify already-local auth/session/profile behavior versus still-Supabase user-management/password behavior.

Non-goals:

- No runtime code, helper creation, route edits, schema/migration/seed/script changes, route generation, package/env cleanup, or UI rewrite.

Candidate files to read/change:

- Read: `src/routes/api/users/*`, `src/routes/admin.master-data.user.tsx`, `src/routes/profile.tsx`, `src/lib/user-helpers.ts`, `src/lib/user-response.ts`, `src/lib/types/user.ts`, `src/lib/schemas/user.ts`, `src/lib/auth/*`, `src/db/schema/auth/*`, `src/lib/constants/roles.ts`.
- Change in Phase 10A: `docs/migration/phase-plan.md` only.

Auth/RBAC guardrails:

- Confirm current admin routes require ADMIN and preserve ADMIN-only behavior.
- Record that `dms_active_role` must remain UX state only.
- Record current self-service password route authorization separately from ADMIN-only routes.
- Use local `dms_session` plus local PostgreSQL/Drizzle as the future runtime authority.
- Keep `ADMIN` dedicated. Do not combine `ADMIN` with PEGAWAI, PPK, BENDAHARA, or ARSIPARIS in admin mutation logic.
- Do not introduce Supabase Auth Admin fallback in migrated Phase 10 routes.
- Do not remove global Supabase packages, env values, browser helpers, tests, or reference docs until Phase 11/global cleanup.
- Do not import/copy/backfill old Supabase Auth data unless a later human-approved phase explicitly scopes it.
- Do not print plaintext passwords, password hashes, raw session tokens, token hashes, cookies, DB URLs, env values, or secrets.
- Do not modify `src/routeTree.gen.ts`, package files, env files, DB migrations, seeds, scripts, `db`, `drizzle`, or `supabase` during Phase 10A.

Response-shape compatibility expectations:

- Preserve `{ users, total }`, `{ user }`, `{ success, message }`, and existing `{ error }` bodies/status categories unless a current behavior is explicitly documented as unsafe.
- `apiFetch` prepends `/api` for callers such as `apiFetch('/users/')`, while `apiMutation` callers often pass explicit `/api/users/...`; both patterns must continue to hit the same endpoint paths.
- Current route errors are plain JSON `{ error: string }`; keep the same wrapper and status categories for UI-visible failures.
- `parseUserListResponse(...)`, `parseUserResponse(...)`, and `parseUserProfileResponse(...)` normalize metadata and roles. Migrated responses must remain compatible with `src/lib/schemas/user.ts`.

Endpoint inventory:

| Endpoint | Current file | Active caller(s) | Request contract | Success contract | Error/status categories | Current auth/RBAC and deps | Migration target | Subphase / risks |
|---|---|---|---|---|---|---|---|---|
| `GET /api/users/` | `src/routes/api/users/index.ts` | `src/routes/admin.master-data.user.tsx` uses `apiFetch('/users/')` to populate the admin user table. | No body. No query used by current UI. | `200 { users, total }` through `parseUserListResponse`; UI uses `users`, then filters client-side by search/status. | `401 { error: 'Unauthorized' }`; `403 { error: 'Hanya ADMIN yang bisa mengakses' }`; `500 { error: 'Gagal mengambil data user' }`. | Supabase server session via `createServerSupabaseClient` and `getServerSession`; ADMIN check via Supabase `hasRole`; user data via `createAdminClient`, `auth.admin.listUsers`, `user_roles`, `roles`, `user_status`. | Local `getLocalServerSession(request)`, assigned ADMIN check, Drizzle reads from `auth.users`, `auth.user_roles`, `auth.roles`, local active-status fields. Preserve list shape and field names. | Phase 10B. Risk: list/detail currently compute active status differently in helper paths; preserve or document before normalization. |
| `POST /api/users/` | `src/routes/api/users/index.ts` | Admin create dialog calls `apiMutation('/api/users/', { method: 'POST', body })`. | JSON body `{ email, password, nama_lengkap, nip_nrp, departemen?, roles? }`. UI sends `roles`, defaults create form to `['PEGAWAI']`; route defaults omitted `roles` to `['PEGAWAI']`. | `201 { user }` through `parseUserResponse`. | `401`; `403 { error: 'Hanya ADMIN yang bisa membuat user' }`; `400 Invalid JSON body`; `400 Email tidak valid`; `400 Password minimal 8 karakter`; `400 Nama lengkap minimal 2 karakter`; `400 NIP/NRP harus numerik 8-20 karakter`; `400 Roles harus array`; `400 Role tidak valid: ...`; `409 Email sudah terdaftar`; `500 Gagal membuat user`. | Auth/RBAC through Supabase session and `hasRole`; create via `auth.admin.createUser({ email_confirm: true, user_metadata })`; roles via Supabase `roles` lookup and `user_roles` insert; helper always adds PEGAWAI if absent. | Hash password with local `hashPassword(...)`; insert `auth.users`; insert local role joins; reject `ADMIN` mixed with non-admin roles even though current UI does not prevent it; preserve mandatory PEGAWAI behavior for non-admin accounts if accepted by implementation phase. | Phase 10C, with create-time password hashing. Risk: current helper can create auth user even if role insert later fails; future local transaction should avoid partial user/role creation while preserving outward status categories. |
| `GET /api/users/$id` | `src/routes/api/users/$id.ts` | No active admin UI detail fetch found; edit dialog uses list row data. Route remains registered/reference-compatible. | Path param `id`; no body. | `200 { user }` through `parseUserResponse`. | `400 User ID tidak valid`; `401`; `403 Hanya ADMIN yang bisa mengakses`; `404 User tidak ditemukan`; `500 Gagal mengambil data user`. | Supabase session ADMIN check; `createAdminClient`; helper calls `auth.admin.listUsers` then filters in memory; roles from `user_roles`/`roles`; active status from Supabase auth disabled/banned fields, not `user_status`. | Local ADMIN route using `auth.users` by id plus role joins. Preserve `{ user }` field set. | Phase 10B. Risk: current single-user active calculation differs from list calculation; decide whether to preserve local field semantics consistently and document any compatibility note. |
| `PATCH /api/users/$id` | `src/routes/api/users/$id.ts` | Admin edit dialog calls `apiMutation('/api/users/${id}', { method: 'PATCH', body })`, then separately mutates Ketua Tim assignments through `/api/ketua-tim/*`. | JSON body `{ nama_lengkap?, nip_nrp?, departemen?, roles? }`; current UI sends required `nama_lengkap`, `nip_nrp`, optional `departemen`, and `roles`. | `200 { user }` through `parseUserResponse`. | `400 User ID tidak valid`; `401`; `403 Hanya ADMIN yang bisa mengubah user`; `400 Invalid JSON body`; `400 Nama lengkap minimal 2 karakter`; `400 NIP/NRP harus numerik 8-20 karakter`; `400 Roles harus array`; `400 Role tidak valid: ...`; `404 ...tidak ditemukan`; other helper errors as `400`; `500 Gagal mengupdate user`. | Supabase session ADMIN check; metadata update via `auth.admin.updateUserById`; roles synced through `user_roles` upsert/delete; helper never removes PEGAWAI when deleting roles. | Local transaction over `auth.users` metadata/profile columns and role joins; reject ADMIN mixed roles; preserve PEGAWAI non-removal behavior unless a later accepted contract changes it. | Phase 10C. Risk: UI disables PEGAWAI removal but allows selecting ADMIN alongside PEGAWAI; route currently accepts that. Migration should harden and document this as required ADMIN exclusivity. |
| `POST /api/users/$id/activate` | `src/routes/api/users/$id/activate.ts` | Admin activate dialog calls `apiMutation('/api/users/${id}/activate', { method: 'POST' })`. | Path param `id`; no body. | `200 { success: true, message: 'User berhasil diaktifkan' }`. | `400 User ID tidak valid`; `401`; `403 Hanya ADMIN yang bisa mengaktifkan user`; helper error as `400`; `500 Gagal mengaktifkan user`. | Supabase session ADMIN check; helper upserts `user_status` with `is_active=true`, `deactivated_at=null`; no password/session logic. | Local update to `auth.users.is_active=true`, clear inactive/deactivation fields as needed. Preserve message. | Phase 10C. Risk: route does not verify existence before helper success/failure semantics; implementation should keep compatible status categories while avoiding silent no-op surprises if practical. |
| `POST /api/users/$id/deactivate` | `src/routes/api/users/$id/deactivate.ts` | Admin deactivate dialog calls `apiMutation('/api/users/${id}/deactivate', { method: 'POST' })`. | Path param `id`; no body. | `200 { success: true, message: 'User berhasil dinonaktifkan' }`. | `400 User ID tidak valid`; `401`; `403 Hanya ADMIN yang bisa menonaktifkan user`; `400 Tidak bisa menonaktifkan akun sendiri`; helper error as `400`; `500 Gagal menonaktifkan user`. | Supabase session ADMIN check; self-deactivation compares Supabase session user id to path id; helper upserts `user_status` with `is_active=false`, `deactivated_at=now`; existing sessions are not explicitly revoked by this route. | Local update to `auth.users.is_active=false`, set deactivation metadata, preserve self-deactivation prevention, revoke sessions if scoped/accepted because local login/session repository already rejects inactive users and supports `revokeAllUserSessions`. | Phase 10C. Risk/open policy: exact session revocation timing for deactivation should be explicit in implementation. |
| `POST /api/users/$id/reset-password` | `src/routes/api/users/$id/reset-password.ts` | Admin reset dialog calls `apiMutation('/api/users/${id}/reset-password', { method: 'POST', body: { password } })`; UI validates password and confirmation client-side. | JSON body `{ password }`. | `200 { success: true, message: 'Password berhasil direset' }`. | `400 User ID tidak valid`; `401`; `403 Hanya ADMIN yang bisa mereset password`; `400 Invalid JSON body`; `400 Password minimal 8 karakter`; helper error as `400`; `500 Gagal mereset password`. | Supabase session ADMIN check; password update via `auth.admin.updateUserById(userId, { password })`; no explicit session revocation in route. | Local `hashPassword(password)`, update `auth.users.password_hash`, `password_hash_algorithm`, `password_updated_at`; Phase 10D documents all-session revocation after successful hash update; no generated/plaintext/hash logging. | Phase 10D. Risk: production password provisioning/bootstrap policy remains open; do not run password-hash helper or print hashes during implementation. |
| `POST /api/users/me/change-password` | `src/routes/api/users/me/change-password.ts` | `/profile` password form calls `apiMutation('/api/users/me/change-password', { method: 'POST', body: { currentPassword, newPassword } })`; UI also has `confirmPassword` client-only. | JSON body `{ currentPassword, newPassword }`; `confirmPassword` is never sent. | `200 { success: true, message: 'Password berhasil diubah' }`; UI shows "Password berhasil diubah". | `401 Unauthorized`; `400 Invalid JSON body`; `400 Password lama wajib diisi`; `400 Password baru wajib diisi`; `400 Password baru minimal 8 karakter`; `400 Password baru harus berbeda dari password lama`; `400 Password lama salah`; `500 Gagal mengubah password`. | Supabase server session via `getServerSession`; verifies current password by `supabase.auth.signInWithPassword({ email: session.user.email, password: currentPassword })`; updates current Supabase password by `supabase.auth.updateUser({ password: newPassword })`; no ADMIN requirement. | Self-service local route using `getLocalServerSession(request)`, local `verifyPassword(currentHash, currentPassword)`, `hashPassword(newPassword)`, and local password fields. Preserve self-service behavior and messages/statuses. | Phase 10D. Revocation policy resolved in Phase 10D progress: revoke all sessions, including current session. |

Caller map:

- Admin user list page: `src/routes/admin.master-data.user.tsx` loads users with `apiFetch('/users/')`, expects `users?: UserWithRoles[]`, and tolerates missing `users` as `[]`.
- Admin create flow: validates required fields, password confirmation, and password length in UI, then posts `email`, `password`, `nama_lengkap`, `nip_nrp`, optional `departemen`, and `roles` to `POST /api/users/`.
- Admin edit flow: uses selected list-row data rather than `GET /api/users/$id`, then patches profile fields and `roles`; Ketua Tim assignment add/remove remains separate through `/api/ketua-tim/*` and is not Phase 10 user Auth Admin runtime.
- Admin reset/activate/deactivate flows: call the matching `/api/users/$id/...` endpoints, then refresh the list and show alert/dialog feedback based on `{ error }` or success.
- Admin role picker: `PEGAWAI` is disabled and labelled wajib in create/edit dialogs; `ADMIN` can currently be toggled in UI without preventing mixed roles, so server-side Phase 10C must enforce ADMIN exclusivity.
- Profile page: `src/routes/profile.tsx` fetches `/users/me/` for profile display and posts only `{ currentPassword, newPassword }` to `/api/users/me/change-password`; `confirmPassword` remains client-only validation.
- Route tree references exist for all audited `/api/users/*` routes, but Phase 10A must not touch `src/routeTree.gen.ts`.

Supabase Auth Admin and password dependency classification:

- Already local-backed and should not be reworked except regression checks: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/auth/role-switch`, `GET /api/users/me`, `GET /api/users/me/ketua-tim`, and `GET /api/users/me/is-ketua-tim/$kegiatanId`.
- Supabase Auth Admin/user-management runtime to migrate: `GET/POST /api/users/`, `GET/PATCH /api/users/$id`, `POST /api/users/$id/activate`, `POST /api/users/$id/deactivate`, and `src/lib/user-helpers.ts` calls to `auth.admin.listUsers`, `auth.admin.createUser`, `auth.admin.updateUserById`, `user_roles`, `roles`, and `user_status`.
- Password reset/change runtime to migrate: `POST /api/users/$id/reset-password` and `POST /api/users/me/change-password`; current behavior uses Supabase Auth Admin password update or Supabase Auth sign-in/update APIs.
- UI callers that should be preserved without broad rewrite: `src/routes/admin.master-data.user.tsx` and `src/routes/profile.tsx`; preserve existing form fields, dialog behavior, alert/error display, and API wrappers.
- Phase 11/global cleanup only, not Phase 10A: browser helper/UI retirement outside these callers, global Supabase package/env/import cleanup, reference helper removal, final regression, backup/restore, LAN/release hardening.
- Reference-only docs/tests/comments: migration docs, historical Supabase audit notes, routeTree references, and tests/comments that mention Supabase as legacy reference or mock fallback behavior.

Current local DB/runtime support available for later implementation:

- `src/db/schema/auth/users.ts` already has `email`, `password_hash`, `password_hash_algorithm`, profile fields, `metadata`, `is_active`, deactivation fields, `password_updated_at`, and timestamps.
- `src/db/schema/auth/roles.ts` and `src/db/schema/auth/user-roles.ts` model local role rows and joins; code comments already require service/seed/admin mutation logic to reject ADMIN mixed with other roles.
- `src/db/schema/auth/sessions.ts` stores only `token_hash`; `src/lib/auth/session-repository.ts` supports `revokeAllUserSessions(userId)`.
- `src/lib/auth/password.ts` provides Argon2id `hashPassword(...)` and `verifyPassword(...)`.
- `src/lib/auth/local-server-auth.ts` provides `getLocalServerSession(request)` and `hasLocalRole(...)`; `dms_active_role` is resolved only after local assigned-role validation and is not authorization proof.

Risks and open questions for implementation phases:

- Active-status parity is inconsistent today: list reads `user_status` with default active true, while single-user reads Supabase auth disabled/banned fields. Local implementation should pick the local `auth.users.is_active` authority and document any behavior delta.
- Current helper can leave partial state if Supabase Auth user creation succeeds but role insert fails. Local create should prefer a transaction, but keep outward response/status compatibility.
- Current UI and route allow ADMIN to be selected with non-admin roles; Phase 10C should reject this server-side rather than preserving an unsafe mixed role state.
- Create/update currently preserve PEGAWAI as mandatory for non-admin accounts; confirm during Phase 10C whether this remains the accepted contract when ADMIN exclusivity is enforced.
- Phase 10A noted that password reset/change did not yet document session revocation behavior. Phase 10D resolves that policy for password routes by revoking all sessions after a successful password hash update.
- No hard-delete user endpoint was found in the remaining Phase 10 surface. Do not invent one.
- Production/bootstrap password provisioning remains open. Do not generate, print, or commit password hashes in Phase 10 implementation prompts.

Validation gates:

- Grep/audit classifies all `supabase.auth`, `auth.admin`, `createAdminClient`, `createServerSupabaseClient`, `getServerSession`, password, role, and session matches in the Phase 10 surface.
- No implementation is claimed complete.

Manual validation commands for human:

- `git grep -n "supabase.auth\|auth.admin\|createAdminClient\|createServerSupabaseClient\|getServerSession\|password\|user_roles\|roles" -- src/routes/api/users src/lib/user-helpers.ts src/routes/admin.master-data.user.tsx src/routes/profile.tsx`
- `git grep -n "/api/users\|change-password\|reset-password" -- src routes docs/migration`

Deferred items:

- Recommended next sub-phase: Phase 10B, limited to local admin user list/detail read contracts for `GET /api/users/` and `GET /api/users/$id`, if the human accepts the 10A contract.
- Phase 10C should follow for create/update/activate/deactivate role/status mutation behavior.
- Phase 10D should follow for admin reset-password and self-service change-password.
- Phase 10E remains a delete/deactivation/audit review only unless a later prompt explicitly scopes user hard delete.

### Phase 10B: Local User Repository And Admin Query Foundation

Goal: replace Supabase Auth Admin list/detail reads with local DB-backed user query helpers while preserving admin UI response contracts.

Runtime/docs scope:

- Build or verify local query helpers over `auth.users`, `auth.user_roles`, and `auth.roles`.
- Migrate only read behavior for `GET /api/users/` and `GET /api/users/$id` if the implementation prompt scopes routes.
- Preserve admin list/detail ordering/filter-visible behavior as far as current callers depend on it.

Non-goals:

- No user create/update/status/password mutations.
- No password reset or change-password behavior.
- No global Supabase cleanup, package/env cleanup, old data import, or UI redesign.

Candidate files to read/change:

- Read/change if scoped: `src/lib/user-helpers.ts` or a local replacement helper, `src/routes/api/users/index.ts`, `src/routes/api/users/$id.ts`, `src/lib/user-response.ts`, `src/lib/schemas/user.ts`, `src/db/schema/auth/*`.

Auth/RBAC guardrails:

- Use `getLocalServerSession(request)`.
- Require assigned `ADMIN` for admin list/detail.
- Do not trust active-role cookie.

Response-shape compatibility expectations:

- `GET /api/users/` must preserve `{ users, total }`.
- `GET /api/users/$id` must preserve `{ user }`.
- User rows must preserve `id`, `email`, `metadata`, `roles`, `isActive`, `disabledAt`, `createdAt`, and `updatedAt` compatibility.

Validation gates:

- Unauthenticated returns 401.
- Non-admin returns 403.
- Missing user returns 404.
- No Supabase Auth Admin call remains in migrated read routes/helpers.

Manual validation commands for human:

- `pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts`
- Add/run focused user-list/detail route or helper tests if created in the implementation phase.

Progress as of 2026-05-18:

- Migrated `GET /api/users/` to local `dms_session` authorization through `getLocalServerSession(request)`, assigned `ADMIN` validation through `hasLocalRole(...)`, and local Drizzle reads over `auth.users`, `auth.user_roles`, and `auth.roles`.
- Migrated `GET /api/users/$id` to the same local auth/RBAC and local Drizzle user-detail read path.
- Added a scoped local read helper in `src/lib/users/local-user-queries.ts`; `src/lib/user-helpers.ts` remains legacy Supabase-backed for deferred mutation/password behavior.
- Preserved `GET /api/users/` success shape `200 { users, total }` and `GET /api/users/$id` success shape `200 { user }` through the existing `parseUserListResponse(...)` and `parseUserResponse(...)` boundary helpers.
- Preserved admin UI-visible list behavior by returning all users with no pagination or query requirements; filtering/search/status visibility remains client-side in `src/routes/admin.master-data.user.tsx`.
- Local list ordering is deterministic by `auth.users.created_at`, then `email`, with roles normalized to canonical role order. Legacy Supabase Auth Admin reads had no route-level sort, so this is a bounded deterministic ordering delta.
- Active status for migrated reads now uses local `auth.users.is_active` as runtime authority. `disabledAt` compatibility is mapped from local `auth.users.deactivated_at`; this intentionally replaces the earlier inconsistent list `user_status` default-active behavior and detail Supabase disabled/banned behavior.
- Metadata compatibility is limited to existing admin/profile contract fields: `nama_lengkap`, `nip_nrp`, and `departemen`. The helper maps local first-class profile columns into `metadata` and falls back to compatible JSON metadata.
- No Supabase Auth Admin fallback was added to migrated read paths. Remaining Supabase Auth Admin usage in `src/routes/api/users/index.ts`, `src/routes/api/users/$id.ts`, and `src/lib/user-helpers.ts` is for deferred create/update/status/password routes only.
- Deferred mutation/password routes remain unchanged: `POST /api/users/`, `PATCH /api/users/$id`, `POST /api/users/$id/activate`, `POST /api/users/$id/deactivate`, `POST /api/users/$id/reset-password`, and `POST /api/users/me/change-password`.

Deferred items:

- Create/update/status/role/password mutations remain Phase 10C/10D.

### Phase 10C: Admin User Create/Update/Status/Role Assignment Migration

Goal: migrate admin user creation, profile metadata update, role assignment, activation, and deactivation from Supabase Auth Admin to local PostgreSQL/Drizzle.

Runtime/docs scope:

- `POST /api/users/`.
- `PATCH /api/users/$id`.
- `POST /api/users/$id/activate`.
- `POST /api/users/$id/deactivate`.
- Local writes to `auth.users`, `auth.user_roles`, and `auth.roles`.
- Revoke sessions when deactivation makes an account unable to authenticate.

Non-goals:

- No self-service password change.
- No standalone admin password reset unless explicitly bundled with create-time password hashing.
- No hard delete.
- No user import from Supabase Auth.
- No route path or UI rewrite.

Candidate files to read/change:

- `src/routes/api/users/index.ts`, `src/routes/api/users/$id.ts`, `src/routes/api/users/$id/activate.ts`, `src/routes/api/users/$id/deactivate.ts`, `src/lib/user-helpers.ts` or local user admin helper, `src/lib/auth/session-repository.ts`, `src/lib/auth/password.ts`, `src/db/schema/auth/*`.

Auth/RBAC guardrails:

- Require assigned `ADMIN`.
- Preserve self-deactivation prevention.
- Reject role payloads that would combine `ADMIN` with any non-admin role.
- Preserve mandatory `PEGAWAI` behavior only for non-admin accounts if that remains the current UI/route contract after Phase 10A.

Response-shape compatibility expectations:

- Create preserves `201 { user }`.
- Update preserves `200 { user }`.
- Activate/deactivate preserve `{ success: true, message }`.
- Duplicate email remains a conflict-style error.
- Invalid role and invalid NIP/password/profile input remain validation errors.

Validation gates:

- Duplicate email does not create a user.
- Invalid role is rejected.
- ADMIN mixed with other roles is rejected.
- Deactivated user cannot login and existing sessions are invalidated or revoked according to the scoped implementation contract.
- Existing document/audit rows remain readable because user deactivation does not delete historical actors.

Manual validation commands for human:

- `pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts`
- Optional human-only: `pnpm test tests/e2e/spec-06-user-management.spec.ts`

Progress as of 2026-05-18:

- Migrated `POST /api/users/` to local `dms_session` authorization through `getLocalServerSession(request)`, assigned `ADMIN` validation through `hasLocalRole(...)`, create-time `hashPassword(...)`, local `auth.users` inserts, and local `auth.user_roles` joins.
- Migrated `PATCH /api/users/$id` to local `dms_session` ADMIN authorization, local profile column/metadata updates, and local role join replacement.
- Migrated `POST /api/users/$id/activate` to local `auth.users.is_active=true`, clearing local deactivation metadata while preserving the existing success body `{ success: true, message: 'User berhasil diaktifkan' }`.
- Migrated `POST /api/users/$id/deactivate` to local `auth.users.is_active=false`, local deactivation metadata, self-deactivation prevention, and `revokeAllUserSessions(userId)` after a successful user status update while preserving the existing success body `{ success: true, message: 'User berhasil dinonaktifkan' }`.
- Added the scoped local mutation helper `src/lib/users/local-user-mutations.ts`; `src/lib/users/local-user-queries.ts` remains the read mapper used to return response-compatible `{ user }` payloads after create/update.
- Added request boundary envelope schemas in `src/lib/schemas/user.ts` for admin create/update payload parsing; route-level validation still preserves existing user-facing messages for invalid email, password, profile fields, roles array, invalid role names, duplicate email, and invalid user ids.
- Role assignment validates payload names against canonical roles, verifies matching rows in local `auth.roles`, never creates role rows, replaces only `auth.user_roles`, and rejects `ADMIN` combined with any non-admin role.
- Mandatory `PEGAWAI` behavior is preserved only for non-admin accounts: omitted non-admin roles or non-admin payloads without `PEGAWAI` are normalized to include `PEGAWAI`; `ADMIN` payloads must be `ADMIN` only.
- Deactivation is intentionally non-destructive. Existing dokumen/archive/audit rows remain readable because users are not hard-deleted.
- No Supabase Auth Admin fallback was added to the migrated create/update/status routes. Remaining Supabase Auth Admin/password behavior is intentionally deferred to Phase 10D for `POST /api/users/$id/reset-password` and `POST /api/users/me/change-password`.
- Caveat: the current admin UI still renders `PEGAWAI` as mandatory for every role selection, so creating or editing an `ADMIN`-only account through the UI may need a later tiny UI compatibility pass. The server contract is already strict and accepts `roles: ['ADMIN']` only for ADMIN accounts.
- Caveat: session revocation happens immediately after the successful deactivation update via the existing session repository. If that revocation call fails after the user is marked inactive, local login/session lookup still rejects the inactive user through `auth.users.is_active=false`, but manual cleanup of unrevoked session rows may be required.

Deferred items:

- Password reset/change belongs to Phase 10D.
- Hard delete remains Phase 10E decision work unless a later accepted route contract requires it.

### Phase 10D: Password Hash And Admin/Self-Service Password Replacement

Goal: replace Supabase password reset/change behavior with local Argon2id password hash updates.

Runtime/docs scope:

- `POST /api/users/$id/reset-password`.
- `POST /api/users/me/change-password`.
- Reuse `hashPassword(...)` and `verifyPassword(...)`.
- Update `auth.users.password_hash`, `password_hash_algorithm`, `password_updated_at`, and session revocation according to the accepted Phase 10A/10D policy.

Non-goals:

- No email reset/invite flow.
- No production bootstrap password workflow.
- No password hash helper execution by Codex unless explicitly approved.
- No plaintext password storage, fake hashes, env edits, package changes, or old Auth data migration.

Candidate files to read/change:

- `src/routes/api/users/$id/reset-password.ts`, `src/routes/api/users/me/change-password.ts`, `src/lib/auth/password.ts`, `src/lib/auth/session-repository.ts`, `src/db/schema/auth/users.ts`, `src/lib/types/user.ts`, `src/lib/schemas/user.ts`.

Auth/RBAC guardrails:

- Admin reset requires assigned `ADMIN`.
- Self-service change requires a valid local `dms_session`.
- Self-service change must verify the current password before updating the hash.
- Do not trust `dms_active_role`.

Response-shape compatibility expectations:

- Admin reset preserves `{ success: true, message: 'Password berhasil direset' }`.
- Self-service change preserves `{ success: true, message: 'Password berhasil diubah' }`.
- Wrong current password, weak password, missing fields, and same-password checks preserve existing status categories/messages where UI-visible.

Validation gates:

- Wrong current password fails without revealing whether the account exists.
- New password is hashed with Argon2id and never logged.
- Password reset/change invalidates sessions according to the accepted policy.
- Login with old password fails and login with new password succeeds.
- No Supabase Auth password API remains in migrated password routes.

Manual validation commands for human:

- `pnpm test tests/unit/auth/session-token.test.ts tests/unit/auth/session-cookies.test.ts tests/unit/auth/role-resolution.test.ts`
- Add/run focused password route tests for wrong-current, weak-new, same-password, admin reset, and session invalidation if created.

Progress as of 2026-05-18:

- Migrated `POST /api/users/$id/reset-password` to local `dms_session` authorization through `getLocalServerSession(request)`, assigned `ADMIN` validation through `hasLocalRole(...)`, local `auth.users` existence lookup, Argon2id `hashPassword(...)`, and local password field updates.
- Migrated `POST /api/users/me/change-password` to local `dms_session` authorization, current-session user targeting only, local `auth.users.password_hash` read, current password verification through `verifyPassword(...)`, Argon2id `hashPassword(...)`, and local password field updates.
- Added narrow request boundary schemas for reset/change password bodies in `src/lib/schemas/user.ts`; route-level validation preserves existing UI-visible request fields and error messages.
- Added `src/lib/users/local-user-passwords.ts` for the scoped password hash update operations. It updates `auth.users.password_hash`, `password_hash_algorithm='argon2id'`, `password_updated_at`, and `updated_at`; it does not return password hashes or plaintext passwords.
- Admin reset preserves request body `{ password }` and success body `200 { success: true, message: 'Password berhasil direset' }`. Missing target user now returns `404 { error: 'User tidak ditemukan' }`; inactive users may still have passwords reset, matching the existing admin reset capability and allowing admin recovery before reactivation if needed.
- Self-service change preserves request body `{ currentPassword, newPassword }`; `confirmPassword` remains client-only in `/profile` and is not expected server-side. Success remains `200 { success: true, message: 'Password berhasil diubah' }`.
- Self-service change rejects missing current password, missing new password, weak new password, same current/new password, and wrong current password with the existing compatible messages.
- Session revocation policy is now explicit: admin reset revokes all sessions for the target user after the password hash update; self-service change revokes all sessions for the current user after the password hash update. If the current session is included, the user may need to log in again with the new password.
- If session revocation fails after a password hash update, the route returns the existing generic failure category (`Gagal mereset password` or `Gagal mengubah password`) without internal details. The hash update is not rolled back by this scoped implementation; manual session cleanup may be required if that rare failure occurs.
- No Supabase Auth Admin or Supabase Auth password fallback was added to these routes. `createAdminClient`, `createServerSupabaseClient`, `auth.admin.updateUserById`, `supabase.auth.signInWithPassword`, and `supabase.auth.updateUser` were removed from the migrated password routes.
- Production bootstrap password workflow, email invite/reset flow, focused password route tests, global Supabase cleanup, browser helper/UI retirement, and Phase 11 cleanup remain deferred.

Deferred items:

- Production password provisioning and bootstrap strategy remain open unless a later human-approved phase scopes them.

### Phase 10E: User Delete/Deactivate Semantics And Audit Review

Goal: decide whether any hard-delete behavior is needed and protect historical workflow/audit references before adding destructive user management.

Runtime/docs scope:

- Audit current UI and route tree for any user delete route or delete button.
- Audit document, archive, Ketua Tim, log, and session references to user ids.
- Document accepted behavior before implementation.

Non-goals:

- No hard delete implementation by default.
- No audit/log rewrite.
- No FK/schema migration unless a later human-approved implementation phase scopes it.

Candidate files to read/change:

- `src/routes/admin.master-data.user.tsx`, `src/routes/api/users/*`, `src/db/schema/auth/*`, `src/db/schema/dokumen/*`, `src/db/schema/arsip/*`, `src/db/schema/master/ketua-tim-assignments.ts`, migration docs.

Auth/RBAC guardrails:

- Deactivation remains ADMIN-only.
- Deactivation must not allow self-lockout.
- Historical actor identity must remain resolvable or degrade safely.

Response-shape compatibility expectations:

- If no current delete endpoint exists, do not invent one.
- If a later delete endpoint is accepted, document exact request/response shape before implementation.

Validation gates:

- Deactivated users cannot authenticate.
- Existing dokumen, arsip, log, and Ketua Tim reads do not crash when a user is inactive.
- No hard delete occurs without explicit accepted decision.

Manual validation commands for human:

- `git grep -n "deleteUser\|DELETE /api/users\|/api/users/.*/delete\|deactivate" -- src docs`
- Run focused user-management smoke checks after any implementation phase.

Deferred items:

- Any true user hard-delete behavior remains deferred unless explicitly approved after this audit.

Progress as of 2026-05-18:

- Phase 10E audit/docs are complete. No runtime code, route tree, package, env, DB schema, migration, seed, script, or Supabase folder changes were made for this phase.
- UI/route delete surface audit found no active user hard-delete UI contract and no `DELETE /api/users` API route. `src/routes/admin.master-data.user.tsx` imports `Trash2`, but the active user-row actions are edit, reset password, deactivate, and activate. The only `method: 'DELETE'` call in that page is scoped to `/api/ketua-tim/?id=...` for removing Ketua Tim assignments while editing a user, not deleting the user row. `src/routeTree.gen.ts` registers `/api/users/`, `/api/users/$id`, `/api/users/$id/activate`, `/api/users/$id/deactivate`, `/api/users/$id/reset-password`, `/api/users/me`, `/api/users/me/change-password`, `/api/users/me/ketua-tim`, and `/api/users/me/is-ketua-tim/$kegiatanId`; it does not register a user delete route.
- Existing deactivation behavior is the accepted normal admin lifecycle: `POST /api/users/$id/deactivate` validates local `dms_session`, requires assigned `ADMIN`, blocks self-deactivation, sets local `auth.users.is_active=false`, records `inactive_reason`, `deactivated_at`, and `deactivated_by`, then calls `revokeAllUserSessions(userId)`. It does not delete `auth.users`. `POST /api/users/$id/activate` sets `is_active=true` and clears local deactivation metadata. Existing response contracts remain `{ success: true, message: 'User berhasil dinonaktifkan' }` and `{ success: true, message: 'User berhasil diaktifkan' }`.
- Historical reference audit confirms user rows are shared identity anchors. `dokumen.dokumen_transaksi.created_by` references `auth.users.id` with `onDelete: 'no action'`; hard delete would break document ownership, laporan filters, and document detail authorization/display. `dokumen.log_aktivitas.user_id` references `auth.users.id` with `onDelete: 'no action'`; hard delete would break append-only actor history. `arsip.arsip.archived_by` and `arsip.arsip.musnah_by` reference `auth.users.id` with `onDelete: 'no action'`; hard delete would break archive lifecycle attribution. `arsip.arsip_usul_musnah.diusulkan_oleh` and `arsip.arsip_usul_musnah.decided_by` reference `auth.users.id` with `onDelete: 'no action'`; hard delete would break proposal/decision attribution. `master.ketua_tim_assignments.user_id` currently has `onDelete: 'cascade'`, and `created_by` has `onDelete: 'set null'`; hard delete would silently remove active assignment rows and erase who created them. `auth.user_roles.user_id` and `auth.sessions.user_id` have `onDelete: 'cascade'`; these are account/session lifecycle children and do not make user hard delete safe. `auth.users.deactivated_by` is indexed but has no visible FK in the Drizzle schema, so deleting the deactivating admin could still reduce deactivation attribution.
- Accepted policy: do not hard-delete users by default. Use deactivate/reactivate for the normal admin lifecycle. Preserve `auth.users` rows so document, archive, workflow, log, Ketua Tim, role, and session references remain understandable and historically resolvable. The Phase 9E non-material document delete audit exception is document-specific and must not be generalized to users.
- Response contract policy: Phase 10 must not invent `DELETE /api/users` or `DELETE /api/users/$id`. If a future user hard-delete path is ever proposed, it requires a separate explicit decision phase before implementation, including archival/anonymization policy, schema/FK design, audit-history display behavior, route/request/response contract, and manual smoke criteria.
- Manual smoke checklist for Phase 10F or a later implementation phase: deactivated users cannot authenticate; deactivated users' existing sessions are revoked or rejected; historical document/archive/log/Ketua Tim reads do not crash when referenced users are inactive; admin user list/detail still shows inactive users safely; no hard delete occurs without an explicit accepted decision.

### Phase 10F: Auth/User Runtime Stabilization And Tests

Goal: stabilize Phase 10 user-management/Auth Admin/password migration and classify remaining Supabase usage before Phase 11.

Runtime/docs scope:

- Focused unit/API/runtime tests for migrated user-management/password surfaces.
- Grep audits for Supabase Auth Admin fallback absence.
- Manual smoke checklist for admin user page and profile password change.
- Update docs with actual Phase 10 completion status after implementation phases.

Non-goals:

- No browser helper retirement.
- No global Supabase package/env/import cleanup.
- No route generation unless a prior scoped route change requires it and the human approves.
- No broad UI rewrite.
- No DB seed/migration/script execution unless explicitly approved.

Candidate files to read/change:

- Phase 10 touched route/helper/test/docs files only.
- Audit-only: `src/routes/admin.master-data.user.tsx`, `src/routes/profile.tsx`, `src/lib/auth/*`, `src/routes/api/users/*`.

Auth/RBAC guardrails:

- Confirm every migrated admin user route uses local session authorization and assigned ADMIN checks.
- Confirm self-service password uses the current local session.
- Confirm active role cookie is not treated as proof.

Response-shape compatibility expectations:

- Admin UI and profile page should not require UI changes to keep working.
- Any added fields must be backward-compatible.

Validation gates:

- `git grep` confirms migrated `/api/users/*` routes have no Supabase Auth Admin fallback.
- Unauthorized and non-admin access fail cleanly.
- Login, logout, session bootstrap, role switch, admin user list/create/edit/status/password reset, and self password change work for clean local data.
- Remaining Supabase usage is classified as Phase 11 browser helper/global cleanup or reference-only docs/tests.

Manual validation commands for human:

- `pnpm test`
- Optionally `pnpm build` only if the human chooses; if it changes `src/routeTree.gen.ts` due generation or line endings, restore it unless route generation was intentionally scoped.
- Manual smoke: login, logout, session reload, admin user list, create user, edit roles, reject ADMIN mixed roles, deactivate/reactivate, admin reset password, self change password, old password rejected, new password accepted, non-admin denied admin endpoints.

Deferred items:

- Phase 11: global Supabase package/env/import cleanup, browser helper/UI retirement including direct browser Supabase surfaces, regression, backup/restore, LAN/release hardening, and final Supabase removal.

Exit criteria:

- No required Supabase Auth Admin or Supabase Auth password runtime paths remain in Phase 10-owned routes.
- User-management and password flows work through local auth/database paths for clean local data.
- Final dependency/env/global cleanup has a verified Phase 11 checklist.

Progress as of 2026-05-18:

- Phase 10F stabilization/audit is complete. No runtime source, route tree, package, env, DB schema, migration, seed, script, Supabase folder, or browser helper cleanup changes were made for this phase.
- Phase 10 server-side user-management and password runtime is complete for the clean local data target: login/logout/session/role-switch, current-user reads, admin user list/detail/create/update/activate/deactivate/reset-password, and self-service change-password all use local auth/database paths.
- Clean-local migration philosophy remains explicit: old Supabase Auth users, old Supabase sessions, and old Supabase-backed files are not migrated, copied, backfilled, recovered, or used as fallback. Missing legacy data is acceptable if it fails cleanly.

Route/runtime coverage:

| Route | Status | Phase | Auth/RBAC | Preserved response shape | Caveat |
|---|---|---|---|---|---|
| `POST /api/auth/login` | local-backed | 5E | email/password against local `auth.users`, Argon2id verification, active user and role validation | `{ user, roles, activeRole }` plus `dms_session` and `dms_active_role` cookies | Clean local users only; no Supabase Auth fallback. |
| `POST /api/auth/logout` | local-backed | 5E | hashes `dms_session` cookie and revokes matching local session when present | `{ success: true }` and clears session/active-role cookies | Logout remains idempotent if token is missing or already revoked. |
| `GET /api/auth/session` | local-backed | 5E | validates hashed local `dms_session`, active user, assigned roles; resolves `dms_active_role` only after membership validation | `{ session, roles, activeRole }` or unauthenticated null shape | `dms_active_role` is UX state, not authorization proof. |
| `POST /api/auth/role-switch` | local-backed | 5E.1 | local session required; requested role must be assigned; `ADMIN` switch rejected | `{ success: true, activeRole }` | ADMIN remains dedicated. |
| `GET /api/users/me` | local-backed | 5J | local session required; current user only | `{ user: { id, email, metadata, roles } }` | Profile metadata maps local columns back into legacy metadata keys. |
| `GET /api/users/me/ketua-tim` | local-backed | 5I | local session required; current user only | `{ is_ketua_tim, kegiatan }` | Reads local Ketua Tim assignment tables. |
| `GET /api/users/me/is-ketua-tim/$kegiatanId` | local-backed | 5I | local session required; current user only; validates `kegiatanId` UUID | `{ is_ketua_tim }` | Invalid UUID remains a 400 validation error. |
| `GET /api/users/` | local-backed | 10B | local session plus assigned `ADMIN` | `{ users, total }` | UI search/status filtering remains client-side. |
| `POST /api/users/` | local-backed | 10C | local session plus assigned `ADMIN` | `201 { user }` | Non-admin roles preserve/add `PEGAWAI`; `ADMIN` mixed roles rejected. |
| `GET /api/users/$id` | local-backed | 10B | local session plus assigned `ADMIN`; validates UUID | `{ user }` | Missing user returns `404 { error: 'User tidak ditemukan' }`. |
| `PATCH /api/users/$id` | local-backed | 10C | local session plus assigned `ADMIN`; validates UUID/body | `200 { user }` | Server rejects `ADMIN` mixed with any non-admin role even if UI can select it. |
| `POST /api/users/$id/activate` | local-backed | 10C | local session plus assigned `ADMIN`; validates UUID | `{ success: true, message: 'User berhasil diaktifkan' }` | Clears local deactivation metadata; does not reset password. |
| `POST /api/users/$id/deactivate` | local-backed | 10C | local session plus assigned `ADMIN`; validates UUID; blocks self-deactivation | `{ success: true, message: 'User berhasil dinonaktifkan' }` | Revokes sessions after status update; failed revocation may require manual cleanup. |
| `POST /api/users/$id/reset-password` | local-backed | 10D | local session plus assigned `ADMIN`; validates UUID/body | `{ success: true, message: 'Password berhasil direset' }` | Revokes all target-user sessions after hash update; no email reset/invite flow. |
| `POST /api/users/me/change-password` | local-backed | 10D | local session required; targets current session user only | `{ success: true, message: 'Password berhasil diubah' }` | Verifies current password before same-password check; revokes all current-user sessions after hash update. |

Supabase/Auth/Admin fallback audit classification:

- Migrated Phase 10-owned route files under `src/routes/api/users` have no active `createAdminClient`, `createServerSupabaseClient`, `getServerSession`, `auth.admin`, `supabase.auth`, `signInWithPassword`, `updateUser`, `updateUserById`, `listUsers`, or `createUser` runtime fallback.
- `src/lib/user-helpers.ts` still contains Supabase Auth Admin list/create/update/reset/status helpers. Classification: legacy reference helper no longer used by migrated Phase 10 routes; remove or retire only in Phase 11/global cleanup after callers are re-audited.
- `src/lib/auth.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, and `src/lib/supabase-browser.ts` still contain Supabase helpers. Classification: Phase 11 global cleanup/browser helper retirement surfaces, not Phase 10 blockers.
- Docs and tests still mention or mock Supabase Admin/Auth helpers. Classification: docs/tests/reference-only historical migration notes or focused legacy parity harnesses.
- Browser helper/UI Supabase surfaces remain outside Phase 10F. Classification: Phase 11 browser helper/global Supabase cleanup.
- No unexpected Phase 10 blocker was found.

Auth/RBAC stabilization review:

- Every migrated admin user route uses `getLocalServerSession(request)` and assigned `ADMIN` checks through `hasLocalRole(...)`.
- Unauthenticated admin user routes return 401-style `{ error: string }`; non-admin authenticated access returns 403-style `{ error: string }`.
- Self-service `POST /api/users/me/change-password` uses the current local session user id only and does not accept a target user id.
- `dms_active_role` is resolved only after local session and assigned-role validation; it is not authorization proof.
- `ADMIN` remains dedicated: role-switch rejects ADMIN switching, login/session validate assigned-role consistency, and admin user create/update rejects `ADMIN` combined with non-admin roles.
- Non-admin accounts preserve/add `PEGAWAI` in admin create/update normalization.

Password/session review:

- Create-time password hashing uses the central Argon2id `hashPassword(...)` helper.
- Admin reset-password uses local Argon2id hash update through `resetLocalUserPassword(...)`.
- Self-service change-password reads the current local hash, verifies `currentPassword` through `verifyPassword(...)`, and only then checks whether the new password is the same.
- Reset/change revokes all sessions for the affected user after a successful password hash update.
- Deactivation revokes all sessions for the target user after a successful inactive status update.
- Password hashes, raw session tokens, token hashes, and password values are not returned by the migrated route response shapes.
- Revocation caveat remains: if revocation fails after a hash/status update, the update is not rolled back by this scoped implementation and manual session cleanup may be required.

User lifecycle/hard-delete review:

- No `DELETE /api/users` or `DELETE /api/users/$id` route exists.
- No user hard-delete behavior was implemented or invented.
- Deactivate/reactivate remain the supported lifecycle.
- User rows remain historical identity anchors for documents, archives, logs, Ketua Tim assignments, roles, and sessions.
- Any future user hard-delete proposal remains deferred to a separate explicit decision phase with schema/FK, audit display, archival/anonymization, route contract, and smoke-test criteria.

Response-shape compatibility review:

- Admin user list returns `{ users, total }`.
- Admin user detail returns `{ user }`.
- Admin create returns `201 { user }`.
- Admin update returns `200 { user }`.
- Activate/deactivate return `{ success: true, message }`.
- Reset-password returns `{ success: true, message: 'Password berhasil direset' }`.
- Change-password returns `{ success: true, message: 'Password berhasil diubah' }`.
- Errors remain `{ error: string }` with compatible 400/401/403/404/409/500 categories for the audited routes.

Test strategy result:

- No tests were added in Phase 10F. Existing focused auth helper tests cover token/cookie/role primitives, and adding route-level API tests would require a broader mocked route/database harness than this stabilization scope allows.
- Future low-risk tests should target local role normalization/ADMIN exclusivity, no password hash in user response mapping, unauthorized/non-admin admin route seams, and password same-password-after-verify behavior with injected or mocked dependencies.
- No broad tests, Playwright/E2E, build, full typecheck, dev server, DB scripts, migrations, seeds, route generation, package commands, password hash helper scripts, or commits were run during Phase 10F.

Manual smoke checklist for Phase 10F handoff:

- Login succeeds for active local user.
- Logout clears session.
- Session reload returns current user.
- Role switch accepts only assigned roles.
- Admin user list loads.
- Admin create user works.
- Duplicate email fails cleanly.
- Invalid role fails cleanly.
- ADMIN mixed role is rejected.
- Edit user profile/roles works.
- Deactivate user blocks login and revokes sessions.
- Reactivate user allows login again if password known.
- Admin reset password revokes sessions; old password fails; new password succeeds.
- Profile self change password with wrong current password fails.
- Profile self change password succeeds; old password fails; new password succeeds.
- Non-admin is denied admin user endpoints.
- No user hard delete route exists.
- Remaining Supabase usage is only Phase 11/reference/deferred legacy cleanup.

Manual validation commands for human:

- `pnpm test`
- Optional: `pnpm build` only if the human chooses; if it changes `src/routeTree.gen.ts` due generation or line endings, restore it unless route generation was intentionally scoped.
- Optional human-only: `pnpm test tests/e2e/spec-06-user-management.spec.ts`

Phase 11 handoff:

- Retire or remove legacy Supabase helpers only after browser helper/UI surfaces and any remaining global references are re-audited.
- Classify and retire direct browser Supabase usage, especially UI/helper surfaces outside the migrated server/API paths.
- Keep no Supabase Auth/Admin fallback for local user-management/password routes.
- Preserve clean-local behavior: do not migrate/copy/backfill/recover old Supabase Auth users, sessions, or files unless a later explicit data migration decision changes scope.
- Complete full regression, backup/restore, LAN/release hardening, CSRF/rate-limiting review, final dependency/env cleanup, and operational docs.

## Phase 11: Stabilization, Regression, Cleanup, And Release Readiness

Goal: complete final stabilization, browser helper retirement, Supabase cleanup, regression, backup/restore, LAN hardening, and release readiness for the clean local PostgreSQL/auth/filesystem-storage target.

Phase 11 is intentionally split because it is high-risk. It includes active browser Supabase usage, legacy server helpers, package/env cleanup, full regression, backup/restore, LAN deployment, and release hardening. Do not collapse it into one giant cleanup phase.

Current handoff into Phase 11:

- Phase 9 server-side storage runtime is complete for new clean local data, including new local upload, local moves, preview/download, document-aware file access, destructive archive approval cleanup, and admin storage diagnostics/orphan cleanup.
- Phase 10 server-side auth/user-management/password runtime is complete for clean local data, including local `dms_session`, local session repository, local role checks, local password helpers, and the documented Phase 10-owned routes.
- Old Supabase Auth users, old Supabase sessions, and old Supabase Storage files are intentionally not migrated, copied, backfilled, recovered, downloaded, or synced.
- Missing old Supabase-backed files must fail cleanly without Supabase fallback.
- Browser helper/UI retirement, global Supabase package/env/import cleanup, full regression, backup/restore drills, LAN/release hardening, and operational docs remain Phase 11 work.

Global Phase 11 guardrails:

- Do not remove Supabase packages, env references, imports, or helper wrappers until active runtime and browser/UI dependencies are proven retired by audit.
- Do not edit `.env` or `.env.migration` automatically.
- Do not reintroduce Supabase fallback in any local route, helper, or UI path.
- Do not migrate, copy, backfill, sync, recover, or import old Supabase Auth data.
- Do not migrate, copy, download, backfill, sync, recover, or import old Supabase Storage files.
- Preserve the clean-local target: local PostgreSQL uses seed/new local data and local filesystem storage uses newly uploaded local files.
- Preserve endpoint paths, methods, request shapes, response shapes, UI behavior, role behavior, FSM, archive lifecycle, and logical storage path semantics.
- Preserve server-side RBAC authority; browser/UI checks are UX only.
- `dms_active_role` remains UX state only and never authorization proof.
- `ADMIN` remains dedicated and must not be combined with non-admin roles.
- Do not add `DELETE /api/users` or user hard-delete behavior.
- Do not change `src/routeTree.gen.ts` unless route generation is explicitly scoped and approved.
- Heavy commands are human-only unless explicitly allowed: `pnpm build`, `pnpm test`, typecheck, dev server, DB scripts, migrations, seeds, route generation, and Playwright.
- Codex implementation prompts must say: do not commit unless the human explicitly requests a commit.

### Phase 11A: Supabase Surface Inventory And Active Dependency Classification

Goal: produce the final Supabase surface inventory before any cleanup.

Runtime/docs scope:

- Read-only audit and documentation planning.
- Classify every remaining Supabase import/helper/env/package/reference before any deletion.
- Confirm whether server-side routes still contain active Supabase dependencies before any deletion.
- Record the cleanup order for 11B through 11H.

Non-goals:

- No runtime cleanup.
- No browser helper migration.
- No package/env removal.
- No route generation.
- No source, package, env, database, seed, migration, script, or generated route-tree edits.

Candidate files to read/change:

- Read: `src/lib/auth.ts`, `src/lib/user-helpers.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, `src/lib/supabase-browser.ts`, `src/lib/supabase.ts`, `src/lib/storage-client.ts`.
- Read: `src/components/dokumen/AttachmentEditor.tsx`, `src/components/dokumen/KelengkapanChecklist.tsx`, `src/components/laporan/HierarchicalFilter.tsx`.
- Read: `src/routes/admin*.tsx`, `src/routes/pegawai/**`, `src/routes/ppk/**`, `src/routes/bendahara/**`, `src/routes/arsiparis/**`, `src/routes/api/**`.
- Change: `docs/migration/phase-plan.md` only.

Phase 11A inventory status on 2026-05-18:

- Inventory/classification is recorded here.
- Cleanup has not started.
- Supabase has not been removed.
- Phase 9 and Phase 10 completion/caveats remain preserved: clean-local server-side storage runtime and clean-local server-side user-management/password runtime are complete, but browser helper/UI retirement, global helper retirement, package/env cleanup, full regression, backup/restore, LAN/release hardening, and final Supabase retirement remain Phase 11 work.

Category definitions:

| Category | Meaning | Cleanup stance |
|---|---|---|
| Active server runtime dependency | A server route/helper still executes Supabase client/auth/admin/database behavior on an active route path. | Must be migrated or explicitly retired before helper/package/env cleanup. |
| Active browser/UI dependency | A browser page/component still calls `getBrowserClient()` or a Supabase-backed browser helper for UI data/session/bootstrap behavior. | Plan in 11B and retire in 11C. |
| Active browser storage dependency | Browser code still performs Supabase Storage upload/remove/session operations. | Highest browser priority; plan in 11B and retire in 11C. |
| Legacy helper/reference no longer used by migrated runtime | A helper remains in source but is not part of Phase 9/10 migrated local runtime, or is only used by deferred legacy surfaces. | Retire only in 11D after callers are gone. |
| Tests/mock reference | Tests mock or assert old Supabase helper behavior, or protect migrated routes from calling those helpers. | Keep until later test hygiene or replacement tests are scoped. |
| Docs/reference historical note | Docs/specs describe Supabase-era behavior, old implementation plans, or migration history. | Keep unless a later docs hygiene phase scopes removal. |
| Env/package artifact | Env names and package dependencies remain because active source still imports Supabase code. | Cleanup only in 11E after 11C/11D pass and human approval. |
| Removable artifact candidate | Likely removable after active callers disappear. This is not approval to delete now. | Candidate for 11D/11E only. |
| Unexpected blocker | Active runtime contradiction that invalidates Phase 9/10 completion claims or blocks cleanup sequencing. | Do not fix in 11A; document and assign next phase. |

Active server route inventory:

| Surface | Source match | Category | Active status and runtime path | Risk if removed too early | Recommended next action | Owner |
|---|---|---|---|---|---|---|
| `POST /api/dokumen/` draft-create branch | `src/routes/api/dokumen/index.ts` imports `createServerSupabaseClient`, `getServerSession as getSession`, and `createDokumen`; `createClient(request)` is used by `POST` only. | Active server runtime dependency. | `GET /api/dokumen/` is local-backed, but the `POST` handler still authenticates through Supabase and creates the draft through Supabase-backed `createDokumen(...)`. | Removing `src/lib/supabase-server.ts`, `src/lib/auth.ts`, or the Supabase package would break this route and remove the old draft-create compatibility path before a decision is made. | Classify the route as legacy/deferred. In 11D, either prove the `POST` path is inactive and retire it with explicit approval, or migrate it narrowly to local `dms_session` and local Drizzle before helper removal. | 11D, with a route-specific decision before deletion. |
| `PATCH /api/dokumen/$id/nominal` | `src/routes/api/dokumen/$id.nominal.ts` imports `createServerSupabaseClient`, `getServerSession`, and Supabase-backed `insertLog`. | Active server runtime dependency. | The route reads document data, reads roles, updates `dokumen_transaksi`, and appends log data through Supabase client calls. This is the previously deferred cross-role nominal compatibility route. | Removing Supabase helpers would break nominal update for creator/arsiparis/admin paths and audit logging. Migrating casually could narrow cross-role behavior incorrectly. | Keep as an explicit active server dependency. Migrate or retire in a narrow follow-up before 11D helper removal; do not fold into browser cleanup. | 11D or a dedicated cross-role nominal slice before 11D completion. |
| `POST /api/dokumen/rename-pending` document lookup | `src/routes/api/dokumen/rename-pending.ts` imports `createAdminClient`; passes it to `getDokumenById(admin, dokId)`. | Active server runtime dependency, limited legacy helper call. | Storage movement is local-backed, but document ownership lookup still uses a Supabase admin client through `getDokumenById`. | Removing `createAdminClient`, `src/lib/supabase-admin.ts`, or `@supabase/supabase-js` would break this route even though file movement itself is local. | Replace the document lookup with local Drizzle or local helper, then remove the Supabase admin import. This is a small 11D prerequisite. | 11D. |
| `src/routes/api/users/index.ts` grep hit | `createUserRequestBoundarySchema` contains the string `createUser`. | Not a Supabase dependency. | Phase 10 user-management routes are local-backed; this match is a schema name false positive. | None for Supabase cleanup, but do not use raw grep alone as proof of active dependency. | No action for Supabase cleanup. | None. |
| `GET /api/admin/analyze-storage`, `GET /api/admin/cleanup-orphan-files` | Path-name grep only. | Migrated local-backed route; no Supabase source dependency found. | Both routes use local session and local storage diagnostics. | None for Supabase helper cleanup. | Keep as Phase 9G local runtime surfaces. | None. |

Server route conclusion:

- Active Supabase dependencies remain in `src/routes/api/dokumen/index.ts`, `src/routes/api/dokumen/$id.nominal.ts`, and `src/routes/api/dokumen/rename-pending.ts`.
- This does not contradict Phase 9/10 completion claims because those claims explicitly covered clean-local server-side storage and user-management/password runtime, while Phase 8G already deferred the cross-role nominal route and Phase 11 already owned global cleanup.
- No unexpected server blocker was found in Phase 10-owned user-management/password routes.

Active browser/UI inventory:

| Surface | Source match | Category | Current caller/runtime path | Risk if removed too early | Recommended next action | Owner |
|---|---|---|---|---|---|---|
| `AttachmentEditor` | `src/components/dokumen/AttachmentEditor.tsx` imports `getBrowserClient`; calls `supabase.auth.getSession()`, `supabase.storage.from(...).upload(...)`, and `supabase.storage.from(...).remove(...)`. | Active browser storage dependency plus active browser/UI dependency. | Used by Pegawai edit/revisi and PPK resubmit pages. It creates dash-format pending paths, resets pending replacements, cancel-cleans pending files, previews through `storage-client`, and submits final lampiran metadata to local API routes. | Removing browser Supabase breaks file replace/reset/cancel flows and can leave pending files unmanaged. | 11B must design an API-backed upload and pending cleanup path that preserves dirty-state, reset, cancel, custom docs, preview, download, and submit behavior; 11C implements it. | 11B then 11C. |
| `KelengkapanChecklist` | `src/components/dokumen/KelengkapanChecklist.tsx` imports `getBrowserClient` and directly reads `master_kelengkapan_dokumen`; upload itself uses `FileUploadButton` and local `/api/upload`. | Active browser/UI dependency. | Submit form step loads required/optional kelengkapan in the browser for material documents. | Removing browser helper makes submit form kelengkapan empty or broken. | Replace with API-backed kelengkapan read in 11C after 11B maps required response shape. | 11B then 11C. |
| `HierarchicalFilter` | `src/components/laporan/HierarchicalFilter.tsx` imports `getBrowserClient` and calls Supabase-backed `getAllFungsi`, `getKegiatanByFungsi`, `getAllJenis`, `getKategoriByJenis`, and `getDetailByKategori`. | Active browser/UI dependency. | Used by laporan filters for fungsi/kegiatan/permintaan chain dropdowns. | Removing helper breaks filtering UI even though report APIs are local-backed. | Move dropdown reads to local APIs or an API-backed helper. | 11B then 11C. |
| Admin landing/dashboard | `src/routes/admin.index.tsx` calls browser `supabase.auth.getSession()` and reads `user_roles`. | Active browser/UI session/bootstrap dependency. | Admin dashboard computes role/user info client-side even after local auth runtime exists. | Removing helper may break dashboard rendering or admin role checks in UI. Server remains authoritative, but UI can fail. | Replace with `/api/auth/session` or existing local user/session API. | 11C. |
| Admin master-data pages | `src/routes/admin.master-data.fungsi.tsx`, `kegiatan.tsx`, `jenis.tsx`, `jenis-dokumen.tsx`, `kategori.tsx`, `detail.tsx`, `kelengkapan.tsx` import `getBrowserClient` and Supabase-backed master-data helpers. | Active browser/UI dependency; several are browser data mutation dependencies. | Admin CRUD pages still execute direct Supabase reads/writes through `src/lib/master-data/*`, despite server API equivalents existing for many domains. `admin.master-data.user.tsx` is already API-backed and is not in this browser-Supabase group. | Removing browser helper breaks admin master-data list/create/update/delete pages. | 11B should map each page to existing local API routes and identify any missing API surface; 11C migrates UI calls. | 11B then 11C. |
| Role dashboards and list filters | `src/routes/ppk.tsx`, `src/routes/bendahara.tsx`, `src/routes/arsiparis/index.tsx`, role list pages under `ppk/inbox`, `bendahara/inbox`, `arsiparis/*/index.tsx`, and `pegawai/dokumen/index.tsx` import `getBrowserClient`. | Active browser/UI dependency. | Some dashboard pages read browser session/roles; list pages load `master_fungsi` or `master_kegiatan` dropdown data directly from Supabase while main list APIs are local-backed. | Removing browser helper breaks dashboard stats/session checks or filter dropdowns, not the server authority. | Replace session checks with local auth state/API and dropdown reads with local API-backed data. | 11C. |
| Submit/edit/revisi/resubmit pages | `src/routes/pegawai/dokumen/aju.tsx`, `src/routes/pegawai/dokumen/$id/revisi.tsx`, `src/routes/ppk/dokumen/$id/resubmit.tsx` import `getBrowserClient`. | Active browser/UI dependency. | Submit flow reads master fungsi/kegiatan/jenis/kategori/detail/jenis dokumen; revisi/resubmit pages read `master_kelengkapan_dokumen`. Edit page itself imports `AttachmentEditor`, which carries storage dependency. | Removing helper breaks form dropdowns and revision/resubmit kelengkapan display. | Replace reads with local API-backed helpers and migrate `AttachmentEditor` storage behavior. | 11B then 11C. |
| `storage-client` consumers | `src/lib/storage-client.ts` is imported by `AttachmentEditor` and `AttachmentViewer`. | Active browser/UI dependency, not a Supabase client import. | It calls existing `/api/dokumen/preview-url` and consumes `{ signedUrl }`, which now may point to local internal access routes for migrated server surfaces. | Removing it would break preview/download UI even though it is not Supabase-specific anymore. | Keep. Do not treat as removable Supabase artifact unless preview/download helpers are redesigned later. | Not cleanup target for 11D/11E. |

Helper inventory:

| Helper/module | Active callers | Classification | Safe to remove now? | Next action | Owner |
|---|---|---|---|---|---|
| `src/lib/auth.ts` | `src/routes/api/dokumen/index.ts` `POST`; `src/routes/api/dokumen/$id.nominal.ts`; helper-internal `buildAppSession`. | Active server runtime dependency plus legacy helper. Cookie helper exports may still be reusable, but Supabase session functions are legacy. | No. | Retire or split only after active server route callers are migrated/retired. | 11D. |
| `src/lib/user-helpers.ts` | No active `src/routes/api/users/*` import found after Phase 10; still imports Supabase types and uses Auth Admin methods internally. | Legacy helper/reference no longer used by migrated user-management runtime; removable artifact candidate after caller audit. | Not yet, because 11A does not delete and tests/docs may still reference the behavior. | In 11D, confirm no source callers, then remove or quarantine with tests/docs adjusted only if scoped. | 11D. |
| `src/lib/supabase-server.ts` | `src/routes/api/dokumen/index.ts` `POST`; `src/routes/api/dokumen/$id.nominal.ts`; `src/lib/supabase.ts` re-export; type-only `src/lib/guards.ts`. | Active server runtime dependency. | No. | Replace active route callers first; then remove/rework re-exports and type references. | 11D. |
| `src/lib/supabase-admin.ts` | `src/routes/api/dokumen/rename-pending.ts`; tests mock it; legacy helper docs reference it. | Active server runtime dependency for one route plus tests/mock reference. | No. | Replace `rename-pending` document lookup before removal. | 11D. |
| `src/lib/supabase-browser.ts` | Active browser/UI callers listed above. | Active browser/UI dependency and active browser storage dependency via `AttachmentEditor`. | No. | Retire only after 11C proves no active browser imports remain. | 11B/11C, then 11D. |
| `src/lib/supabase.ts` | Re-export barrel; no direct source import found in active grep besides itself. | Legacy helper/reference and removable artifact candidate after callers are gone. | Not in 11A. | Remove in 11D only after direct and indirect imports are clean. | 11D. |
| `src/lib/storage-client.ts` | `AttachmentEditor`, `AttachmentViewer`. | Active browser helper but not Supabase client/runtime by itself. | No. | Keep while preview/download UI expects `{ signedUrl }`; future cleanup is separate from Supabase package removal. | 11C or later only if API/helper design changes. |
| `src/lib/master-data/*` | Admin master-data pages, submit flow, filters, kelengkapan-related UI. | Active browser/UI dependency because helpers accept `SupabaseClient` and call `.from(...)`; some also perform browser-side mutations. | No. | Replace callers with local API-backed helpers, then retire SupabaseClient typed helper surfaces. | 11B/11C, cleanup in 11D. |
| `src/lib/dokumen/{queries,mutations,logs,storage}.ts` SupabaseClient surfaces | Active through `POST /api/dokumen/`, `PATCH /api/dokumen/$id/nominal`, `POST /api/dokumen/rename-pending` lookup; `storage.ts` exports legacy Supabase Storage move/remove helpers though migrated runtime no longer uses most of them. | Mixed: active server runtime for selected functions, legacy helper/reference for unused storage helpers, removable artifact candidates after caller audit. | No. | Replace active route calls first, then retire unused Supabase-backed helper exports. | 11D. |

Env/package artifact inventory:

| Artifact | Found in | Classification | Cleanup rule |
|---|---|---|---|
| `@supabase/ssr` | `package.json`, `pnpm-lock.yaml`, `src/lib/supabase-server.ts`, `src/lib/supabase-browser.ts`. | Env/package artifact with active source imports. | Do not remove until `supabase-server` and `supabase-browser` active callers are gone. Human approval required before package/lockfile edits. |
| `@supabase/supabase-js` | `package.json`, `pnpm-lock.yaml`, `src/lib/supabase-admin.ts`, type imports in `src/lib/auth.ts`, `src/lib/user-helpers.ts`, `src/lib/master-data/*`, `src/lib/dokumen/*`. | Env/package artifact with active source imports. | Do not remove until active server/browser/helper usage is retired. Human approval required before package/lockfile edits. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `.env`, `.env.example`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, `src/lib/supabase-browser.ts`, `src/lib/constants/env.ts`, docs/specs. | Env/package artifact. `.env` contains local sensitive values and must not be edited by this phase. | Cleanup only in 11E after 11C/11D; `.env` and `.env.migration` edits require explicit human approval. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env`, `src/lib/supabase-browser.ts`, `src/lib/constants/env.ts`, docs. | Env/package artifact tied to active browser client. | Cleanup only after browser Supabase runtime is retired. |
| `NEXT_PUBLIC_SUPABASE_*` | Historical docs/best-practice references only in grep output. | Docs/reference historical note. | No runtime cleanup action; remove only in docs hygiene if later scoped. |
| `DATABASE_URL` | Local Drizzle/db config, docs, env examples. | Required local PostgreSQL artifact, not a Supabase cleanup target by name alone. | Keep. Repointing or secret hygiene belongs to human-approved env/deployment work. |
| `DMS_*` | Local auth/storage seed/token env docs and tests. | Required local runtime/development artifacts, not Supabase. | Keep. Do not remove in Supabase cleanup. |

Tests/docs/reference classification:

- Tests under `tests/unit/dokumen/submit-route-parity.test.ts`, `tests/unit/storage/raw-preview-internal-url-runtime.test.ts`, `tests/unit/storage/raw-preview-internal-url-wiring.test.ts`, and `tests/unit/storage/rename-pending-local-route.test.ts` mock Supabase helpers. These are tests/mock references, not cleanup approval.
- E2E tests mention upload/Playwright behavior and are regression references for later 11F. They are not Supabase runtime proof by themselves.
- Docs under `docs/migration/**`, `docs/specs/**`, `docs/BEST_PRACTICES.md`, `docs/FIX_PLAN.md`, and architecture summaries contain historical Supabase implementation details, command examples, old specs, and migration notes. These are docs/reference historical notes unless a later docs hygiene phase scopes edits.
- `supabase/` migrations/functions were not edited. They remain historical schema/runtime reference material until final retirement policy in 11H decides how to treat the folder.

Blockers and caveats:

- No unexpected Phase 11A blocker was found.
- Active server Supabase dependencies remain and are cleanup blockers for 11D/11E until migrated or explicitly retired.
- Active browser/UI and browser storage dependencies remain and are cleanup blockers for 11D/11E until 11B/11C complete.
- Removable artifact candidate does not imply approved deletion.
- Raw grep/string matches alone are not proof of active runtime dependency; the classifications above are based on caller paths where inspected.
- Current-compatible browser/UI behavior must be preserved during later retirement, even when direct browser Supabase behavior is legacy.

Recommended cleanup order:

1. 11B: Browser helper and `AttachmentEditor` retirement planning. Map every `getBrowserClient()` caller to an existing or required local API, with `AttachmentEditor` upload/remove/reset/cancel first.
2. 11C: Browser/UI runtime retirement. Replace active browser Supabase reads/session checks/storage operations with local API-backed behavior while preserving UI behavior.
3. 11D: Legacy helper retirement. Migrate or retire the remaining active server routes (`POST /api/dokumen/`, `PATCH /api/dokumen/$id/nominal`, `rename-pending` lookup), then remove/quarantine unused Supabase helpers only after caller grep is clean.
4. 11E: Package/env/import cleanup. Remove Supabase packages and env constants only after 11C/11D are done and human approval is given for package/env files.
5. 11F: Full regression and manual smoke validation.
6. 11G: Backup/restore, operational, LAN, CSRF/rate-limit, and release hardening.
7. 11H: Final Supabase retirement decision and handoff, including any remaining historical docs/tests/supabase-folder policy.

Guardrails:

- Treat grep matches in source as active until proven otherwise by route/caller analysis.
- Do not delete helpers just because current Phase 10-owned routes no longer use them.
- Do not remove docs/tests references that are historical references unless a documentation hygiene phase explicitly scopes them.
- Do not edit `.env`, `.env.migration`, `package.json`, `pnpm-lock.yaml`, `src/routeTree.gen.ts`, `src/`, `db/`, `drizzle/`, `supabase/`, seeds, scripts, or migrations during 11A.

Validation gates:

- Supabase references are grouped by category and owner.
- Every active source match has a next action or explicit deferred reason.
- No cleanup phase starts until active browser/UI and active server dependencies are accounted for.
- No cleanup is claimed complete from this inventory.

Manual validation commands for human:

- `git grep -n "createServerSupabaseClient\|createAdminClient\|createBrowserClient\|supabase\.auth\|supabase\.storage\|storage\.from\|auth.admin\|getServerSession\|createSignedUrl\|signInWithPassword\|updateUserById\|listUsers\|createUser" -- src docs tests`
- `git grep -n "supabase-server\|supabase-admin\|supabase-browser\|storage-client\|user-helpers\|AttachmentEditor" -- src docs tests`
- `git grep -n "VITE_SUPABASE\|SUPABASE\|NEXT_PUBLIC_SUPABASE\|DMS_\|DATABASE_URL" -- . docs src package.json pnpm-lock.yaml`
- `git grep -n "preview-url\|download-url\|upload\|rename-pending\|files/access\|cleanup-orphan\|analyze-storage" -- src docs tests`
- `git grep -n "from '#/lib/supabase\|from '@/lib/supabase\|from '#/lib/auth'\|from '@/lib/auth'\|from '#/lib/storage-client'\|from '@/lib/storage-client'" -- src docs tests`
- `git grep -n "routeTree.gen\|pnpm build\|pnpm test\|Playwright\|backup\|restore\|LAN\|release\|CSRF\|rate limit\|rate-limit" -- docs src tests`

Deferred items / exit criteria:

- Exit when the final cleanup order is documented and no active source match is unclassified.
- Defer implementation to 11B through 11E.

### Phase 11B: Browser Helper And AttachmentEditor Retirement Planning/Compatibility

Goal: design the browser Supabase retirement path before touching UI runtime.

Status as of 2026-05-18: planning/compatibility design only. No browser runtime has been migrated, no Supabase helper/package/env cleanup is complete, and `src` remains out of scope for this subphase.

Runtime/docs scope:

- Inspect direct browser Supabase reads/writes and map them to existing or needed local API-backed behavior.
- Focus on `AttachmentEditor` upload/remove/reset/cancel behavior, because it is both browser-only and storage-mutating.
- Verify whether existing local APIs are enough for browser callers or whether a narrow route/component implementation phase is needed.
- Preserve preview/download behavior through existing `{ signedUrl }` helper semantics.

Non-goals:

- No broad UI rewrite.
- No package/env cleanup.
- No server helper removal.
- No old Supabase Storage file migration or fallback.

Candidate files to read/change:

- Read: `src/components/dokumen/AttachmentEditor.tsx`, `src/components/dokumen/KelengkapanChecklist.tsx`, `src/components/laporan/HierarchicalFilter.tsx`, `src/lib/storage-client.ts`.
- Read: pages importing `getBrowserClient()`, especially admin/master-data, Pegawai submit/edit/revisi, PPK resubmit, role dashboards, and archive list/search pages.
- Read: local API routes that can replace browser calls, including master-data routes, role list routes, `/api/upload`, preview/download routes, and cleanup routes.
- Change in this planning phase: docs only.

Audit result summary:

- `AttachmentEditor` remains the only active browser Supabase Storage mutator found by this 11B audit.
- `FileUploadButton` already posts to `POST /api/upload`; it does not call browser Supabase Storage directly.
- `AttachmentViewer` and `storage-client` preserve preview/download through existing `{ signedUrl }` API semantics; they are not storage mutators and must not be removed as Supabase cleanup.
- Browser master-data/dropdown reads remain active in `KelengkapanChecklist`, `HierarchicalFilter`, admin/master-data pages, Pegawai submit/revisi pages, PPK resubmit page, and role/archive filter pages.
- Browser session/role checks remain active in `admin.index.tsx`, `ppk.tsx`, `bendahara.tsx`, `arsiparis/index.tsx`, and `pegawai/dokumen/index.tsx`, even when those pages already use local API routes for primary data.
- Existing local APIs cover many read/write replacements, but response-shape adaptation is still needed in browser callers because current helpers are Supabase-client-shaped.
- Historical 11B note: `GET /api/master-jenis-dokumen` was not yet registered during this planning snapshot. That blocker was later resolved in 11C.4c and reused by 11C.6 for Pegawai submit Non-Material reads.
- No existing local API route narrowly deletes browser-uploaded pending files. A future cleanup route must be pending-only and owner-scoped, not a generalized storage delete API.

#### AttachmentEditor Current Behavior Inventory

Files and active callers:

| Area | Current behavior |
|---|---|
| Active UI callers | `src/routes/pegawai/dokumen/$id/edit.tsx`, `src/routes/pegawai/dokumen/$id/revisi.tsx`, and `src/routes/ppk/dokumen/$id/resubmit.tsx` render `AttachmentEditor`. |
| Session/user lookup | `AttachmentEditor` imports `getBrowserClient()`, calls `supabase.auth.getSession()`, and uses `session.user.id` as the first logical storage path segment. |
| Upload pending replacements | `handleFileChange()` uploads directly from the browser to `dokumen-lampiran` with `supabase.storage.from(...).upload(path, file, { cacheControl: '3600', upsert: false })`. |
| Pending path produced | Dash pending format: `{userId}/{Date.now()}-{Math.random().toString(36).slice(2)}-{safeFilename}`. `safeFilename` is `file.name.replace(/[^a-zA-Z0-9._-]/g, '_')`. |
| Replace file | New upload creates a `LampiranUrl` with `kelengkapan_id`, display `nama`, new pending `url`, and `uploaded_at`. It replaces the existing lampiran with the same `kelengkapan_id` or appends a new one. |
| Pending state | `pendingFiles` is a `Map<docId, { url, filename }>` used to mark dirty file replacements and to know which pending objects must be cleaned on reset/cancel. |
| Dirty state | `hasUnsavedChanges` is `pendingFiles.size > 0 || hasNominalChanged || hasUserDocChanges`; `onDirtyChange` receives this value. |
| Reset pending replacement | `handleResetFile()` removes the pending file from browser storage when `pendingFiles` has a URL, then restores the original lampiran for that `docId` or removes the new lampiran if none existed originally. It clears the pending file and upload status for that `docId`. |
| Cancel dirty edit | `handleCancel()` optionally runs `confirmIfDirty`, sets cancelling state, loops through all `pendingFiles` when `hasFileChanges`, removes each pending URL from browser storage, clears `pendingFiles`, then calls `onCancel()`. |
| Cleanup failure shape | Current browser cleanup is not explicitly isolated from metadata reset/cancel state. A thrown `remove()` during cancel would jump to `finally` and may skip `setPendingFiles(new Map())` and `onCancel()`. 11C must not preserve this failure coupling if a safer best-effort route is introduced. |
| Add custom user docs | `handleAddUserDoc()` creates `user-custom-{crypto.randomUUID()}` entries in `userDocs`; upload for the custom doc uses the same replacement flow and lampiran metadata. |
| Remove custom user docs | `handleRemoveUserDoc()` only removes a custom doc when it has no uploaded lampiran and no pending replacement. If a file exists, removal is blocked and the user must reset/remove through file behavior first. |
| Preview | `handlePreview()` calls `getSignedUrl(lamp.url)`, which fetches `GET /api/dokumen/preview-url?url=...` and expects `{ signedUrl }`; the returned URL is loaded in an iframe. Filename is built client-side with `buildStorageFilename(dokumen, lamp)`. |
| Download | `handleDownload()` also calls `getSignedUrl(lamp.url)`, then `downloadWithSignedUrl(signedUrl, filename)` to fetch the returned URL as a blob and force a browser download. It does not currently call `GET /api/dokumen/download-url`. |
| Submit metadata | `handleSubmit()` filters out custom docs no longer present in `userDocs`, computes `nominalRealisasi` for material documents or `null` for Non-Material, then calls parent `onSubmit({ lampiranUrls, nominalRealisasi })`. Parent pages pass this to `PATCH /api/dokumen/$id`, `POST /api/dokumen/$id/submit`, `PATCH /api/ppk/resubmit/$id`, or `POST /api/ppk/resubmit/$id` as already scoped by those pages. |

#### AttachmentEditor Local API Compatibility Plan

| Behavior | Existing API or planned API | 11B compatibility decision |
|---|---|---|
| Upload pending file | Existing `POST /api/upload` | Use the existing route in 11C. It accepts multipart `file`, `kelengkapan_id`, and `nama_dokumen`; requires local `dms_session`; derives owner from the server session; returns `201 { url, nama, kelengkapan_id, uploaded_at }`. |
| Pending upload response shape | Existing `POST /api/upload` | Response has all fields needed to build the same `LampiranUrl`. `AttachmentEditor` should stop constructing the storage path client-side and use `json.url`, `json.nama`, `json.kelengkapan_id`, and `json.uploaded_at`. |
| Pending path compatibility | Existing `/api/upload` plus Phase 9D helpers | `/api/upload` returns underscore upload-API pending paths, not the current dash path. This is compatible with clean-local runtime because `classifyStoragePath()` and local pending move helpers support both `pending-upload-api` and `pending-dash`. Exact dash preservation is not required if route consumers continue storing logical paths only. |
| Upload auth | Existing `POST /api/upload` | Use cookie auth with `credentials: 'include'`; do not read browser Supabase session and do not send user id from the browser. Server-side RBAC/session remains authoritative. |
| Upload validation | Existing `POST /api/upload` | The route preserves the 2 MB and PDF/DOC/DOCX/XLS/XLSX validation contract. `AttachmentEditor` currently allows images in the file input accept string; 11C should preserve user-facing behavior only if those files were actually accepted before. Current Supabase direct upload did not enforce the route allowlist, so this is a compatibility risk to verify manually. |
| Remove one pending file on reset | Missing local route | Plan a narrow owner-scoped pending cleanup route for 11C.1, for example `DELETE` or `POST` under a scoped upload/pending cleanup API. It must accept logical pending `url` values only, require `dms_session`, allow only current user's pending paths, reject formal/unsupported/unsafe paths, and return logical-only results. |
| Cancel cleanup for multiple pending files | Missing local route | Use the same pending-only cleanup route with an array body such as `{ urls: string[] }`. Cleanup should be best-effort for cancel/reset UI, not a generalized storage delete. |
| Cleanup failure handling | Planned route plus UI adaptation | Cleanup failure must not corrupt attachment metadata state. Prefer safe orphan retention over destructive inconsistency. On reset, restore metadata state after scheduling/attempting cleanup and surface a non-blocking warning only if needed. On cancel, allow navigation/cancel to complete after best-effort cleanup; leave local orphan cleanup/admin diagnostics to later recovery. |
| Cleanup safety | Planned route | No physical path, storage root, or resolved path may be returned to the browser or logs. The route must classify paths server-side, block traversal/absolute/URL-like input, and delete only contained local pending files owned by the current session. |
| Preview/download | Existing `storage-client` and preview/download routes | Do not replace in 11B. Preserve `getSignedUrl()` and `{ signedUrl }` semantics. Existing raw preview/download routes now produce internal file-access URLs for local logical paths; browser callers should keep treating `signedUrl` as an opaque URL. |
| Submit/update/resubmit metadata | Existing parent page API calls | Keep `AttachmentEditor` submitting the same `LampiranUrl[]` and `nominalRealisasi` shape. Do not introduce a frontend repository/query abstraction framework; use lightweight fetch/api helper adaptation. |

#### Pending Path And Safety Semantics

- Current `AttachmentEditor` dash pending format: `{userId}/{timestamp}-{random}-{filename.ext}`.
- Current local `POST /api/upload` pending format: `{userId}/{kelengkapanId}_{timestamp}_{filename.ext}`.
- Phase 9D/local helper support matrix accepts both `pending-dash` and `pending-upload-api` plus formal paths.
- The owner namespace remains the first logical path segment and must come from the local server session for new local uploads.
- Browser code must not compute or trust owner ids after 11C.1.
- Legacy Supabase-backed dash pending files may exist only as historical/mixed-runtime artifacts. The clean local target does not migrate, copy, download, backfill, sync, or fallback to Supabase Storage.
- Missing old files fail cleanly through local route errors or preview/download missing-file behavior.
- Unsafe paths, URL-like paths, absolute paths, traversal, formal paths submitted to pending cleanup, and owner-mismatched paths must be rejected before filesystem mutation.
- Responses and errors must expose logical path identifiers only when needed; physical paths and storage roots must never be returned.

#### Browser Caller Replacement Map

| Caller group | Files | Current browser Supabase behavior | Existing local API | 11C replacement strategy | Shape/gap status |
|---|---|---|---|---|---|
| `AttachmentEditor` | `src/components/dokumen/AttachmentEditor.tsx`; callers in Pegawai edit/revisi and PPK resubmit | Browser session lookup, direct Storage upload, direct pending remove, raw preview through `storage-client` | `POST /api/upload`; `GET /api/dokumen/preview-url`; `GET /api/files/access`; update/resubmit APIs | 11C.1 first: upload through `/api/upload`, add/use narrow pending cleanup route, keep preview/download helper and submit payloads | Upload mostly compatible. Pending cleanup route missing. Image accept vs route allowlist needs verification. |
| `FileUploadButton` through `KelengkapanChecklist` | `src/components/dokumen/FileUploadButton.tsx`, `src/components/dokumen/KelengkapanChecklist.tsx`, `StepUploadLampiran` | `FileUploadButton` already posts to `/api/upload`; `KelengkapanChecklist` reads `master_kelengkapan_dokumen` through browser Supabase | `POST /api/upload`; `GET /api/master-kelengkapan` | 11C.2: keep `FileUploadButton`; replace kelengkapan fetch with API-backed reads and client-side chain filtering if needed | `/api/master-kelengkapan` supports `kegiatan_id` and `is_ketua_tim` but not exact leaf/null chain filters; caller may need light client filtering or route query extension. |
| `HierarchicalFilter` | `src/components/laporan/HierarchicalFilter.tsx`; laporan saya/kegiatan pages | Uses `getBrowserClient()` only to pass a Supabase client into master-data helpers | `GET /api/master-fungsi`, `/api/master-kegiatan?fungsi_id=`, `/api/master-jenis`, `/api/master-kategori?jenis_id=`, `/api/master-detail?kategori_id=` | 11C.3: replace helper calls with `apiFetch`/fetch to existing routes | Response arrays are close to existing row types; verify nested name fields and empty-list behavior. |
| Admin dashboard role check | `src/routes/admin.index.tsx` | Browser `auth.getSession()` and `user_roles` join check | `GET /api/auth/session` | 11C.4 or 11C.5: use local session/auth state or `apiFetch('/auth/session')`; keep server/API RBAC as authority | Existing session response should include assigned roles/active role; no product decision needed. |
| Admin/master-data pages | `admin.master-data.fungsi.tsx`, `kegiatan.tsx`, `jenis.tsx`, `kategori.tsx`, `detail.tsx`, `jenis-dokumen.tsx`, `kelengkapan.tsx` | Browser CRUD via `src/lib/master-data/*` Supabase helper functions | Local `/api/master-fungsi*`, `/api/master-kegiatan*`, `/api/master-jenis*`, `/api/master-kategori*`, `/api/master-detail*`, `/api/master-kelengkapan*`; no `/api/master-jenis-dokumen` found | 11C.4: migrate each page to existing `apiFetch`/`apiMutation` contracts; add a narrow `master-jenis-dokumen` route only if accepted in that slice | Existing master APIs are enough for most pages. `jenis-dokumen` route is missing. Count helpers currently use Supabase nested selects and may need client counts or route-backed count parity. |
| Admin user page | `src/routes/admin.master-data.user.tsx` | Already uses `apiFetch`/`apiMutation` for users and Ketua Tim | Existing `/api/users/*`, `/api/ketua-tim/*`, `/api/master-kegiatan` | No 11B storage/browser action except keep separate from admin/master-data Supabase pages | Already API-backed for this audit. |
| Role root dashboards/layouts | `src/routes/ppk.tsx`, `src/routes/bendahara.tsx`, `src/routes/arsiparis/index.tsx` | Browser `auth.getSession()` plus `user_roles` check; Arsiparis dashboard also uses API reads for counts | `GET /api/auth/session`; role list APIs | 11C.5: replace browser role checks with local session/auth state or remove redundant checks where route/API guards already enforce access | Preserve redirects to `/login` and `/forbidden`; server/API remains authority. |
| Role list filters | `src/routes/ppk/inbox.tsx`, `src/routes/bendahara/inbox.tsx`, `src/routes/arsiparis/inbox.tsx`, archive active/inactive/usul-musnah/search pages | Browser Supabase reads `master_fungsi`, and search also reads `master_kegiatan` | `GET /api/master-fungsi`, `GET /api/master-kegiatan` plus existing role/archive list APIs | 11C.5: replace filter dropdown reads with local master APIs; leave list API calls as-is | Existing APIs are enough for simple dropdown lists. |
| Pegawai submit page | `src/routes/pegawai/dokumen/aju.tsx` | Browser master-data helper reads for fungsi/kegiatan/jenis/kategori/detail/jenis-dokumen; uses API for Ketua Tim check and submit mutation | Existing master routes except missing `/api/master-jenis-dokumen`; existing `/api/users/me/is-ketua-tim/$kegiatanId`; `POST /api/dokumen/submit` | 11C.6: replace dropdown reads with API calls after component-level storage slices are stable | Missing jenis-dokumen route blocks full Non-Material browser retirement unless added or deferred. |
| Pegawai document list | `src/routes/pegawai/dokumen/index.tsx` | Browser session existence check before `apiFetch('/dokumen')` | `GET /api/auth/session`; `GET /api/dokumen` | 11C.5 or 11C.6: replace/removal of redundant session precheck; keep `apiFetch('/dokumen')` | Existing data API is local-backed. |
| Pegawai edit page | `src/routes/pegawai/dokumen/$id/edit.tsx` | No direct page-level browser Supabase; uses `AttachmentEditor` | Existing `/api/dokumen/$id` and `PATCH /api/dokumen/$id` | Covered by 11C.1 `AttachmentEditor` | Page API already local-backed for scoped behavior. |
| Pegawai revisi page | `src/routes/pegawai/dokumen/$id/revisi.tsx` | Browser Supabase reads kelengkapan chain; uses `AttachmentEditor`; uses APIs for detail, patch, submit | `GET /api/master-kelengkapan`; `/api/dokumen/$id`, `PATCH /api/dokumen/$id`, `POST /api/dokumen/$id/submit` | 11C.6 after 11C.1/11C.2: replace kelengkapan chain read with API-backed path and keep parent submit sequence | Requires exact chain/null filtering parity. |
| PPK resubmit page | `src/routes/ppk/dokumen/$id/resubmit.tsx` | Browser Supabase reads kelengkapan chain; uses `AttachmentEditor`; APIs for resubmit/kembalikan | `GET /api/master-kelengkapan`; `/api/ppk/resubmit/$id`, `/api/ppk/kembalikan/$id` | 11C.6 after 11C.1/11C.2: replace kelengkapan read and use migrated `AttachmentEditor` | Requires exact chain/null filtering parity. |
| Arsiparis dashboard/list/search pages | `src/routes/arsiparis/index.tsx`, `inbox.tsx`, `aktif/index.tsx`, `inaktif/index.tsx`, `usul-musnah/index.tsx`, `search.tsx` | Dashboard browser role check; list/search filter dropdown browser reads | Existing `/api/auth/session`, archive/list/search APIs, `/api/master-fungsi`, `/api/master-kegiatan` | 11C.5: separate role/session check retirement from filter dropdown retirement | Existing data APIs are enough for the filter reads found. |
| `src/lib/master-data/*` helpers | `fungsi.ts`, `kegiatan.ts`, `jenis.ts`, `kategori.ts`, `detail.ts`, `kelengkapan.ts`, `jenis-dokumen.ts` | Supabase-client-shaped read and mutation helper functions | Matching API routes for most domains | Do not redesign into a broad abstraction. Either update active callers directly or add small API-backed helper functions in a scoped 11C slice | Helper deletion is 11D, after active callers are gone. |
| Re-export helpers | `src/lib/supabase-browser.ts`, `src/lib/supabase.ts` | Factory/re-export only | N/A | Do not delete in 11B/11C until active imports are gone | 11D/11E cleanup only. |

#### Local API Gap Analysis

| API surface | Current state for 11B | Gap/decision |
|---|---|---|
| `POST /api/upload` | Local filesystem-backed, `dms_session` required, compatible multipart fields and `201 { url, nama, kelengkapan_id, uploaded_at }` | Use for `AttachmentEditor` upload in 11C.1. It returns underscore pending paths; local move helpers support them. |
| Pending cleanup/delete API | Implemented in 11C.1 as `POST /api/upload?cleanup=pending` inside the existing registered `/api/upload` route | Narrow pending-only cleanup for `AttachmentEditor` reset/cancel. It requires local `dms_session`, accepts `{ url }` or `{ urls }`, rejects formal/unsupported/unsafe/owner-mismatched paths before filesystem mutation, treats missing files as safe no-op, and returns logical-only `{ success, deleted, skipped, errors }`. It is not a generalized storage delete API. |
| `POST /api/dokumen/rename-pending` | Local movement already implemented but still uses Supabase admin for document lookup | Not needed for `AttachmentEditor` reset/cancel cleanup. Keep as 11D server dependency; do not use as browser cleanup route. |
| `GET /api/dokumen/preview-url` | Local internal `{ signedUrl, filename }` response for raw logical paths | Keep. Do not replace in 11B/11C. |
| `GET /api/dokumen/download-url` | Local internal `{ signedUrl }` response for raw logical paths | Available, but `AttachmentEditor` currently uses preview helper for download. Do not force helper redesign in 11C.1 unless explicitly scoped. |
| `GET /api/files/access` | Internal signed-token access route | Keep opaque to browser. No UI changes beyond consuming returned `signedUrl`. |
| `/api/master-fungsi` | Existing local GET plus ADMIN mutations | Can replace fungsi dropdowns and admin fungsi page with response adaptation. |
| `/api/master-kegiatan` | Existing local GET supports `fungsi_id`; mutations exist | Can replace kegiatan dropdowns/pages. |
| `/api/master-jenis` | Existing local GET plus mutations | Can replace jenis dropdowns/pages. |
| `/api/master-kategori` | Existing local GET supports `jenis_id`; mutations exist | Can replace kategori dropdowns/pages. |
| `/api/master-detail` | Existing local GET supports `kategori_id`; mutations exist | Can replace detail dropdowns/pages. |
| `/api/master-kelengkapan` | Existing local GET supports `kegiatan_id` and `is_ketua_tim`; mutations exist | Needs exact chain/null behavior decision for `KelengkapanChecklist`, Pegawai revisi, and PPK resubmit. Prefer light client filtering first if it preserves current behavior; otherwise add narrow query params. |
| `/api/master-jenis-dokumen` | Registered in 11C.4c | Used by admin jenis-dokumen and Pegawai submit Non-Material browser-retirement work; no additional 11C.6 route change was required. |
| `/api/ketua-tim/*` | Existing local APIs | Already used by admin user page and submit Ketua Tim check. No new 11B blocker. |
| Role inbox/list APIs | Existing local APIs for PPK/Bendahara/Arsiparis/Pegawai lists | Primary data reads already API-backed; remaining browser calls are mostly filter dropdowns and redundant session/role checks. |
| Report APIs | Existing `laporan/saya` and `laporan/kegiatan` API calls in report pages | `HierarchicalFilter` still needs API-backed dropdown reads. |
| Current user/session APIs | Existing `/api/auth/session`, `/api/users/me`, `/api/users/me/ketua-tim`, `/api/users/me/is-ketua-tim/$kegiatanId` | Use `/api/auth/session` for browser session/role check retirement; do not redesign AppLayout/auth bootstrap in 11B. |

#### Bounded 11C Implementation List

Priority order:

1. 11C.1 AttachmentEditor local upload and pending cleanup compatibility.
   Replace browser session/storage upload with `POST /api/upload`; add/use a narrow pending-only cleanup route for reset/cancel if accepted; keep preview/download through `storage-client`; preserve dirty state and submit metadata shape.
2. 11C.2 KelengkapanChecklist and master kelengkapan dropdown/API reads.
   Replace direct `master_kelengkapan_dokumen` browser reads with `/api/master-kelengkapan` plus exact current chain/null filtering behavior.
3. 11C.3 HierarchicalFilter API-backed reads.
   Replace master-data helper calls with existing `/api/master-*` GET routes; keep date/filter UI behavior unchanged.
4. 11C.4 Admin/master-data browser Supabase retirement.
   Migrate admin master pages domain by domain to existing APIs; add `master-jenis-dokumen` route only if that page is included; keep admin user page out because it is already API-backed.
5. 11C.5 Role dashboard/list page browser Supabase retirement.
   Replace redundant browser session/role checks with `/api/auth/session` or existing local auth state; replace role/archive filter dropdown reads with `/api/master-fungsi` and `/api/master-kegiatan`; leave already-local role/list APIs unchanged.
6. 11C.6 Submit/edit/revisi/resubmit page browser Supabase retirement.
   Replace Pegawai submit master-data reads, Pegawai revisi kelengkapan reads, PPK resubmit kelengkapan reads, and Pegawai list session precheck after 11C.1 through 11C.3 are stable.

Do not combine 11C.1 storage mutation retirement with 11C.4 admin/master-data or 11C.5 dashboard/list caller retirement. These are separate risk surfaces.

Guardrails:

- `AttachmentEditor` must preserve direct user outcomes: choose file, replace file, reset pending replacement, cancel dirty edit and clean up pending files, add/remove custom user docs, preview, download, and submit.
- If a local API route is missing, plan it narrowly rather than routing browser code back to Supabase.
- Do not change endpoint contracts or logical path semantics.
- Missing legacy Supabase-backed files remain clean failures.
- Preserve UI behavior and existing API contracts.
- Use server-side RBAC and local `dms_session`; do not trust browser session or `dms_active_role` for authorization.
- Do not reintroduce Supabase fallback after a caller is migrated to local API behavior.
- Do not migrate old Supabase files; missing old files fail cleanly.
- Do not leak physical paths, storage roots, token values, session tokens, DB URLs, env values, password hashes, or file access secrets.
- Do not edit `src/routeTree.gen.ts` unless a route change is explicitly scoped and approved for 11C.
- Do not perform package/env cleanup before 11E.
- Do not delete Supabase helpers before 11D and a clean active-caller audit.
- Stale/dead browser callers are not blockers unless reachable from active runtime paths.
- Prefer existing API contracts and lightweight fetch/API helper adaptation over introducing a frontend repository/query abstraction framework.

Validation gates:

- Every `getBrowserClient()` caller has a replacement strategy.
- `AttachmentEditor` has a route/API-backed compatibility design for upload and pending cleanup before implementation.
- Admin/master-data browser calls are separated from attachment/storage browser calls.
- 11C implementation slices are small enough that no implementer must make product/design decisions.
- `AttachmentEditor` cleanup failure handling prefers safe orphan retention over metadata corruption.
- Browser storage mutation retirement, master-data/dropdown read retirement, browser session/bootstrap replacement, and role/dashboard/filter data replacement remain separate.
- No source/runtime/package/env cleanup is claimed in 11B.

Manual validation commands for human:

- `git grep -n "getBrowserClient" -- src/routes src/components src/lib`
- `git grep -n "supabase\.auth\|supabase\.storage\|storage\.from\|upload(\|remove(\|getSession" -- src/routes src/components src/lib`
- `git grep -n "fetch('/api/upload'\|fetch(\"/api/upload\"\|preview-url\|download-url\|rename-pending\|files/access\|apiMutation\|apiFetch" -- src/components src/routes src/lib`

Deferred items / exit criteria:

- Exit when 11C has a bounded implementation list and no browser caller requires product/design decisions from the implementer.

### Phase 11C: Browser Helper/UI Runtime Retirement

Goal: replace active browser Supabase calls with local API-backed behavior while preserving UI behavior.

#### Phase 11C.1 AttachmentEditor Local Upload And Pending Cleanup

Status: scoped runtime/docs migration complete as of 2026-05-18 for `AttachmentEditor` upload/reset/cancel pending cleanup only.

Changed files/routes:

- `src/components/dokumen/AttachmentEditor.tsx`
- `src/routes/api/upload.ts`
- `docs/migration/phase-plan.md`
- Modified route/API surface: `POST /api/upload` now also supports the scoped cleanup action `POST /api/upload?cleanup=pending`; no new route file was added and `src/routeTree.gen.ts` was not modified.

Runtime behavior:

- `AttachmentEditor` no longer imports `getBrowserClient()`, no longer calls `supabase.auth.getSession()`, and no longer calls browser `supabase.storage.from(...).upload(...)` or `.remove(...)`.
- Pending upload now uses existing local `POST /api/upload` with `FormData` fields `file`, `kelengkapan_id`, and `nama_dokumen`, plus `credentials: 'include'`.
- The browser no longer constructs owner/user-id storage paths. The upload owner segment comes from the server-side local `dms_session`.
- `AttachmentEditor` builds `LampiranUrl` metadata from the server response fields `url`, `nama`, `kelengkapan_id`, and `uploaded_at`.
- New `AttachmentEditor` pending paths are `/api/upload` underscore pending paths. This is compatible with current local move helpers because they accept both `pending-upload-api` and legacy `pending-dash` path shapes.
- Reset cleanup calls `POST /api/upload?cleanup=pending` for the pending URL when present, then restores the original lampiran metadata or removes the newly added custom lampiran metadata exactly as before.
- Cancel cleanup calls `POST /api/upload?cleanup=pending` for all pending URLs when cancelling dirty file edits, clears `pendingFiles`, and still calls `onCancel()` after the cleanup attempt.
- Cleanup is best-effort. Request failure, server cleanup errors, or timeout logs a dev warning but does not block reset/cancel state restoration. This intentionally improves the old failure coupling where browser storage `.remove(...)` could prevent cancel from proceeding.
- Dirty-state semantics remain `pendingFiles.size > 0 || hasNominalChanged || hasUserDocChanges`, and `onDirtyChange` remains driven by that value.
- Custom user docs still use `user-custom-{crypto.randomUUID()}` ids. Removing a custom user doc remains blocked while it has an uploaded lampiran or pending replacement.
- `handleSubmit()` still sends `{ lampiranUrls, nominalRealisasi }` to the parent page. Material nominal validation and Non-Material `nominalRealisasi: null` behavior are unchanged.

Pending cleanup API behavior:

- `POST /api/upload?cleanup=pending` requires a local `dms_session` through `getLocalServerSession(request)`.
- Body accepts `{ url: string }` or `{ urls: string[] }`.
- Only logical storage paths are accepted. URL/protocol-like values, absolute paths, traversal, invalid paths, unsupported path shapes, formal paths, and owner mismatches are rejected before physical path resolution or filesystem mutation.
- Only `pending-upload-api` and `pending-dash` classifications owned by the current session user are eligible for deletion.
- Deletion uses centralized logical path validation, storage root resolution, `lstat()` regular-file checks, and realpath root-containment verification before `unlink()`.
- Symlinks and non-files are not followed/deleted because `lstat()` must report a regular file before deletion.
- Missing files are safe no-ops reported as skipped.
- Response shape is logical-only: `{ success, deleted, skipped, errors }`. It does not return physical paths, storage roots, raw filesystem errors, env values, session values, or token internals.
- This cleanup branch is intentionally pending-upload-only and must not be reused as a formal document, archive, or arbitrary local storage delete endpoint.

File type compatibility decision:

- `/api/upload` currently enforces the existing document allowlist: PDF, DOC, DOCX, XLS, XLSX with a 2 MB limit.
- Before 11C.1, `AttachmentEditor` file inputs allowed image extensions even though the server upload contract does not. 11C.1 aligns `AttachmentEditor` `accept` downward to `.pdf,.doc,.docx,.xls,.xlsx` instead of broadening server validation.
- Image upload through `AttachmentEditor` is therefore intentionally not preserved unless a later product decision explicitly expands the business upload contract.

Preview/download compatibility:

- `AttachmentEditor` still uses `getSignedUrl(lamp.url)` and `downloadWithSignedUrl(...)` from `src/lib/storage-client.ts`.
- Existing `{ signedUrl }` semantics are preserved. Browser code treats the returned signed URL as opaque and does not inspect `/api/files/access` token internals.
- `AttachmentViewer` and `src/lib/storage-client.ts` were not changed in 11C.1.

Parent page compatibility:

- `src/routes/pegawai/dokumen/$id/edit.tsx`, `src/routes/pegawai/dokumen/$id/revisi.tsx`, and `src/routes/ppk/dokumen/$id/resubmit.tsx` remain unchanged in 11C.1.
- Parent `onSubmit` payload shape remains `{ lampiranUrls, nominalRealisasi }`.
- Edit/revisi/resubmit flows can receive local underscore pending paths from `/api/upload`; Phase 9D storage helpers already accept `pending-upload-api` and `pending-dash`.

Deferred browser callers not touched in 11C.1:

- `KelengkapanChecklist`
- `HierarchicalFilter`
- Admin/master-data pages
- Role dashboard/list pages
- Pegawai submit/revisi master-data reads
- PPK resubmit kelengkapan reads
- Browser session/role checks outside `AttachmentEditor`

11C.1 does not claim package/env cleanup, Supabase helper deletion, global browser Supabase retirement, old Supabase Storage file migration/copy/download/backfill/sync/recovery, preview/download redesign, route generation, DB migration/seed/script changes, or full regression.

#### Phase 11C.2 KelengkapanChecklist And Master-Kelengkapan API-Backed Reads

Status: scoped runtime/docs migration complete as of 2026-05-18 for `KelengkapanChecklist` master kelengkapan reads only.

Changed files/routes:

- `src/components/dokumen/KelengkapanChecklist.tsx`
- `docs/migration/phase-plan.md`
- No route file was changed. Existing `GET /api/master-kelengkapan` is reused; no new route, no route generation, and no `src/routeTree.gen.ts` change.

Runtime behavior:

- `KelengkapanChecklist` no longer imports `getBrowserClient()` and no longer calls browser `supabase.from('master_kelengkapan_dokumen')`.
- Material checklist reads now call local `GET /api/master-kelengkapan?kegiatan_id=<id>&is_ketua_tim=<boolean>` through `apiFetch`, which sends browser cookies with `credentials: 'include'`.
- The component maps the API rows back to its existing item shape: `id`, `nama_dokumen`, `is_ketua_tim`, and `required`.
- Loading state remains `Memuat kelengkapan...`, fetch failures still show `Gagal mengambil daftar kelengkapan`, and the empty state remains `Tidak ada kelengkapan untuk kegiatan dan peran ini.`
- Non-Material behavior remains unchanged: admin kelengkapan fetch is skipped, `items` is cleared, and the UI only exposes user-created supporting documents.
- User-created optional document behavior remains unchanged, including `user-custom-{crypto.randomUUID()}` ids, add/remove title behavior, and removal from `lampiranUrls`.
- Parent `onComplete(lampiranUrls, missingRequired)` behavior remains unchanged. Missing required documents are still computed from `items.required` and matching `lampiranUrls[].kelengkapan_id`.

Filtering behavior preserved:

- Base API query is scoped by `kegiatan_id` and exact `is_ketua_tim`, matching the previous component query.
- Ordering remains compatible: the API orders by `is_ketua_tim` then `nama_dokumen`; because the component requests a single `is_ketua_tim`, visible order is effectively by `nama_dokumen`, matching the previous checklist ordering.
- If `detailPermintaanId` is present, the component keeps rows where `detail_permintaan_id` equals that id.
- Else if `kategoriPermintaanId` is present, the component keeps rows where `kategori_permintaan_id` equals that id and `detail_permintaan_id` is null.
- Else if `jenisPermintaanId` is present, the component keeps rows where `jenis_permintaan_id` equals that id and both `kategori_permintaan_id` and `detail_permintaan_id` are null.
- Else, the component keeps all rows returned by the base `kegiatan_id` and `is_ketua_tim` API query. This preserves the actual old `KelengkapanChecklist` query behavior; the old inline comment about matching only all-null legacy rows was not enforced by the query.
- This slice does not change the broader `src/lib/master-data/kelengkapan.ts` helper behavior, the admin master-data page behavior, or the direct Pegawai revisi / PPK resubmit page kelengkapan queries.

FileUploadButton compatibility:

- `FileUploadButton` remains unchanged and already posts to local `POST /api/upload` with multipart fields `file`, `kelengkapan_id`, and `nama_dokumen`, plus `credentials: 'include'`.
- `KelengkapanChecklist` still passes the same `kelengkapanId`, `namaDokumen`, `initialLampiran`, `onUploaded`, and `onRemoved` props to `FileUploadButton`.
- Upload response handling remains the same through `LampiranUrl` callbacks. No `AttachmentEditor`, `/api/upload`, preview/download, or storage-client behavior changed in 11C.2.

Caller inventory for this slice:

- Active render path found: `src/components/dokumen/form/StepUploadLampiran.tsx` renders `KelengkapanChecklist`.
- Page path found: `src/routes/pegawai/dokumen/aju.tsx` renders `StepUploadLampiran`, so Pegawai submit receives the new local API-backed checklist read.
- `src/routes/pegawai/dokumen/$id/revisi.tsx` and `src/routes/ppk/dokumen/$id/resubmit.tsx` do not render `KelengkapanChecklist`; they render `AttachmentEditor` and keep their existing direct page-level kelengkapan reads deferred.

Deferred browser callers not touched in 11C.2:

- `HierarchicalFilter`
- Admin/master-data pages
- Role dashboard/list pages
- Pegawai submit page-level master-data dropdown reads outside `KelengkapanChecklist`
- Pegawai revisi page-level kelengkapan reads
- PPK resubmit page-level kelengkapan reads
- Browser session/role checks outside `KelengkapanChecklist`
- `src/lib/master-data/*` Supabase-client-shaped helpers
- Supabase package/env/helper cleanup

11C.2 does not claim global browser Supabase retirement, Supabase helper deletion, package/env cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, route generation, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, or full regression.

#### Phase 11C.3 HierarchicalFilter API-Backed Reads

Status: scoped runtime/docs migration complete as of 2026-05-18 for `HierarchicalFilter` master-data dropdown reads only.

Changed files/routes:

- `src/components/laporan/HierarchicalFilter.tsx`
- `docs/migration/phase-plan.md`
- No route file was changed. Existing public local read routes are reused: `GET /api/master-fungsi`, `GET /api/master-kegiatan?fungsi_id=<id>`, `GET /api/master-jenis`, `GET /api/master-kategori?jenis_id=<id>`, and `GET /api/master-detail?kategori_id=<id>`.
- No new route, no route generation, and no `src/routeTree.gen.ts` change.

Runtime behavior:

- `HierarchicalFilter` no longer imports `getBrowserClient()` and no longer calls Supabase-backed browser master-data helpers: `getAllFungsi`, `getKegiatanByFungsi`, `getAllJenis`, `getKategoriByJenis`, or `getDetailByKategori`.
- Dropdown reads now call the existing local master-data APIs through `apiFetch`, which sends browser cookies with `credentials: 'include'`.
- The component still accepts `value`, `onChange`, and `showDateRange`, and still emits the same `HierarchicalFilterValue` shape: `fungsiId`, `kegiatanId`, `jenisId`, `kategoriId`, `detailId`, `tanggalMulai`, and `tanggalAkhir`.
- The component keeps its previous quiet UI behavior for dropdown read failures. There is still no visible loading/error state specific to these dropdowns; failed local API reads log a component-scoped console error and leave the relevant option list empty, matching the previous helper-returned-empty-list behavior.
- Empty lists still render only the `Semua ...` option for visible selects, and the detail select remains hidden when `detailList.length === 0`.

Response-shape mapping:

- Fungsi uses API fields `id` and `nama` from `GET /api/master-fungsi`; optional metadata fields such as `deskripsi`, `is_active`, `created_at`, and `updated_at` are tolerated but not used for labels.
- Kegiatan uses API fields `id`, `nama`, and `fungsi_id` from `GET /api/master-kegiatan?fungsi_id=<id>`; `fungsi_nama` and `master_fungsi` are tolerated but not used by the filter UI.
- Jenis uses API fields `id` and `nama` from `GET /api/master-jenis`.
- Kategori uses API fields `id`, `nama`, and `jenis_permintaan_id` from `GET /api/master-kategori?jenis_id=<id>`; `jenis_nama` and `master_jenis_permintaan` are tolerated but not used by the filter UI.
- Detail uses API fields `id`, `nama`, and `kategori_permintaan_id` from `GET /api/master-detail?kategori_id=<id>`; `kategori_nama`, `jenis_nama`, and `master_kategori_permintaan` are tolerated but not used by the filter UI.
- Visible option labels remain `row.nama`, matching the prior Supabase helper row shape.

Cascade and reset behavior preserved:

- On mount, the component loads fungsi and jenis option lists.
- When `fungsiId` is truthy, it loads kegiatan with `fungsi_id=<fungsiId>`; when falsy, it clears `kegiatans`.
- Selecting a fungsi still emits `{ ...value, fungsiId, kegiatanId: undefined }`, so changing or clearing fungsi clears the selected kegiatan before the parent receives the new filter object.
- Selecting kegiatan still emits `{ ...value, kegiatanId }`.
- When `jenisId` is truthy, it loads kategori with `jenis_id=<jenisId>`; when falsy, it clears `kategoriList` and `detailList`.
- Selecting a jenis still emits `{ ...value, jenisId, kategoriId: undefined, detailId: undefined }`, so changing or clearing jenis clears kategori and detail before the parent receives the new filter object.
- When `kategoriId` is truthy, it loads detail with `kategori_id=<kategoriId>`; when falsy, it clears `detailList`.
- Selecting a kategori still emits `{ ...value, kategoriId, detailId: undefined }`, so changing or clearing kategori clears detail before the parent receives the new filter object.
- `SelectItem value="_all"` still maps to an empty string for that field. Because parent report filters treat falsy values as unset, the existing `Semua ...` / empty / unset semantics remain compatible.
- `Reset Filter` still emits `{}`.

Caller inventory and parent compatibility:

- Active caller: `src/routes/pegawai/laporan/saya.tsx` renders `<HierarchicalFilter value={filter} onChange={setFilter} />`.
- Active caller: `src/routes/pegawai/laporan/kegiatan.tsx` renders `<HierarchicalFilter value={filter} onChange={setFilter} />`.
- Both parent pages keep the same `HierarchicalFilterValue` state shape and apply the same client-side predicates against report rows: `fungsi_id`, `kegiatan_jenis_id`, `jenis_permintaan_id`, `kategori_permintaan_id`, `detail_permintaan_id`, and date range.
- No parent page was changed in 11C.3.

Deferred browser callers not touched in 11C.3:

- Admin/master-data pages
- Role dashboard/list page filters
- Pegawai submit page-wide master-data dropdown reads
- Pegawai revisi page-level kelengkapan reads
- PPK resubmit page-level kelengkapan reads
- Browser session/role checks outside `HierarchicalFilter`
- `src/lib/master-data/*` Supabase-client-shaped helpers
- Supabase package/env/helper cleanup

11C.3 does not claim global browser Supabase retirement, Supabase helper deletion, package/env cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, route generation, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, or full regression.

#### Phase 11C.4 Admin/Master-Data Browser Supabase Retirement

Status: scoped runtime/docs migration complete as of 2026-05-18 for API-covered admin/master-data pages only.

Changed files/routes:

- `src/routes/admin.master-data.fungsi.tsx`
- `src/routes/admin.master-data.kegiatan.tsx`
- `src/routes/admin.master-data.jenis.tsx`
- `src/routes/admin.master-data.kategori.tsx`
- `src/routes/admin.master-data.detail.tsx`
- `src/routes/admin.master-data.kelengkapan.tsx`
- `src/routes/api/master-kelengkapan.ts`
- `src/routes/api/master-kelengkapan.$id.ts`
- `docs/migration/phase-plan.md`
- No new route was added, no route generation was run, and `src/routeTree.gen.ts` was not changed.

Runtime behavior:

- The six migrated admin pages no longer import `getBrowserClient()` and no longer call Supabase-backed `src/lib/master-data/*` helper functions.
- Reads now use existing local APIs through `apiFetch`; create/update/delete actions use existing local APIs through `apiMutation`.
- `apiFetch`/`apiMutation` keep browser cookie behavior through `credentials: 'include'`; server routes remain the RBAC authority.
- Page loading behavior remains quiet for list/dropdown fetch failures where the old helpers returned empty lists or swallowed errors.
- Dialog/form validation messages for required local fields remain on the page: empty name/document-name and missing parent selections still show the existing Indonesian messages.
- Save/delete success messages, modal closing, delete confirmation dialogs, and refresh-after-mutation behavior are preserved.

Local APIs used:

- `GET /api/master-fungsi`, `POST /api/master-fungsi`, `PATCH /api/master-fungsi/$id`, `DELETE /api/master-fungsi/$id`
- `GET /api/master-kegiatan`, `POST /api/master-kegiatan`, `PATCH /api/master-kegiatan/$id`, `DELETE /api/master-kegiatan/$id`
- `GET /api/master-jenis`, `POST /api/master-jenis`, `PATCH /api/master-jenis/$id`, `DELETE /api/master-jenis/$id`
- `GET /api/master-kategori`, `POST /api/master-kategori`, `PATCH /api/master-kategori/$id`, `DELETE /api/master-kategori/$id`
- `GET /api/master-detail`, `POST /api/master-detail`, `PATCH /api/master-detail/$id`, `DELETE /api/master-detail/$id`
- `GET /api/master-kelengkapan`, `POST /api/master-kelengkapan`, `PATCH /api/master-kelengkapan/$id`, `DELETE /api/master-kelengkapan/$id`

Per-page inventory and response-shape mapping:

- Fungsi page is CRUD. It uses fungsi rows from `GET /api/master-fungsi` with `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and `updated_at`. Because the API does not return `jumlah_kegiatan`, the page also reads `GET /api/master-kegiatan` and computes active kegiatan counts by `fungsi_id` client-side to preserve the visible count column.
- Kegiatan page is CRUD. It uses kegiatan rows from `GET /api/master-kegiatan` with `id`, `nama`, `deskripsi`, `fungsi_id`, `fungsi_nama`, `is_active`, `created_at`, and `updated_at`; fungsi dropdown rows come from `GET /api/master-fungsi`. Create/update bodies use `fungsiId`, `nama`, and `deskripsi`.
- Jenis page is CRUD. It uses jenis rows from `GET /api/master-jenis` with `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and `updated_at`. Because the API does not return `jumlah_kategori`, the page also reads `GET /api/master-kategori` and computes active kategori counts by `jenis_permintaan_id` client-side.
- Kategori page is CRUD. It uses kategori rows from `GET /api/master-kategori` with `id`, `nama`, `deskripsi`, `jenis_permintaan_id`, `jenis_nama`, `is_active`, `created_at`, and `updated_at`; jenis dropdown rows come from `GET /api/master-jenis`. Because the API does not return `jumlah_detail`, the page also reads `GET /api/master-detail` and computes active detail counts by `kategori_permintaan_id` client-side.
- Detail page is CRUD. It uses detail rows from `GET /api/master-detail` with `id`, `nama`, `deskripsi`, `kategori_permintaan_id`, `kategori_nama`, `jenis_nama`, `is_active`, `created_at`, and `updated_at`; parent dropdown rows come from `GET /api/master-jenis` and `GET /api/master-kategori`.
- Kelengkapan page is CRUD. It uses fungsi, kegiatan, jenis, kategori, and detail dropdown reads from their existing master APIs. It reads kelengkapan rows from `GET /api/master-kelengkapan?kegiatan_id=<id>`, then preserves the old helper's client-side chain matching behavior: legacy rows with all chain ids null remain visible, and non-legacy rows match the selected `jenis_permintaan_id`, `kategori_permintaan_id`, and optional `detail_permintaan_id`. Visible row fields are `id`, `kegiatan_id`, `is_ketua_tim`, `nama_dokumen`, `required`, request-chain ids, `kegiatan_nama`, `fungsi_nama`, `created_at`, and `updated_at`.

Create/update/delete compatibility:

- Create/update bodies preserve the existing camelCase Zod/API contract: `fungsiId`, `jenisPermintaanId`, `kategoriPermintaanId`, `detailPermintaanId`, `kegiatanId`, `isKetuaTim`, `namaDokumen`, `required`, `nama`, and `deskripsi`.
- Delete actions use the existing local DELETE endpoints and keep the existing UI confirmations. Fungsi, kegiatan, jenis, kategori, and detail delete behavior follows the local API soft-delete contract. Kelengkapan delete keeps the existing local hard-delete endpoint contract for master kelengkapan rows.
- A narrow compatibility gap was fixed in `POST /api/master-kelengkapan` and `PATCH /api/master-kelengkapan/$id`: the schemas already accepted `jenisPermintaanId`, `kategoriPermintaanId`, and `detailPermintaanId`, but the handlers did not persist those fields. They now persist the request-chain ids and return the existing snake_case row fields. The handlers also preserve the old helper's chain validation messages for missing/mismatched kategori/detail relations.

Admin/RBAC behavior:

- The browser pages only call local APIs; they do not add client-side authorization logic.
- Public master-data GET behavior is unchanged where the existing route is public.
- POST/PATCH/DELETE remain protected by `getLocalServerSession(request)` plus `hasLocalRole(session, 'ADMIN')` in the existing server routes.
- `dms_active_role` is not trusted by the browser pages as authorization proof.

Pages inspected but unchanged:

- `src/routes/admin.master-data.user.tsx` remains untouched. It already uses `apiFetch`/`apiMutation` for `/api/users/*`, `/api/ketua-tim/*`, and `GET /api/master-kegiatan`, so it is outside this browser Supabase page group.

Pages deferred from 11C.4:

- `src/routes/admin.master-data.jenis-dokumen.tsx` was deferred during 11C.4 because no `src/routes/api/master-jenis-dokumen*` route was registered. That blocker was carried through 11C.4b and resolved in 11C.4c below.

#### Phase 11C.4b Admin Jenis Dokumen Route Registration Blocker

Status: scoped inventory/docs update complete as of 2026-05-18; runtime migration deferred.

Inventory result:

- `src/routes/admin.master-data.jenis-dokumen.tsx` is a CRUD admin page for Non-Material document types.
- The page currently imports `getBrowserClient` from `#/lib/supabase-browser` and imports `getAllJenisDokumen`, `createJenisDokumen`, `updateJenisDokumen`, `deleteJenisDokumen`, and `JenisDokumenRow` from `#/lib/master-data`.
- The table displays row number, `nama`, `deskripsi`, and edit/delete actions.
- The create/update dialog uses `nama` and `deskripsi`, with visible validation `Nama tidak boleh kosong`, save error `Gagal menyimpan`, and connection error `Koneksi database tidak tersedia`.
- The delete dialog asks `Hapus Jenis Dokumen?`, shows the selected `nama`, and currently soft-deletes through the Supabase helper by setting `is_active=false`.
- The current list helper reads active rows from `master_jenis_dokumen`, orders by `nama`, and returns `JenisDokumenRow[]`.
- The current mutation helpers use payloads `{ nama, deskripsi? }` for create/update and return `{ data?: JenisDokumenRow; error?: string }`; the page only needs `id`, `nama`, and `deskripsi`, while the schema also supports `is_active`, `created_at`, and `updated_at`.

Local schema and route registration result:

- Local Drizzle source for this table is `src/db/schema/master/jenis-dokumen.ts`.
- Actual local DB fields are `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and `updated_at`.
- `master.master_jenis_dokumen` has an active-name partial unique index and `is_active` support, so the safe delete convention would be soft-delete by setting `is_active=false`; hard-delete is not acceptable by default because `dokumen.dokumen_transaksi.jenis_dokumen_id` can reference historical rows.
- No `src/routes/api/master-jenis-dokumen.ts` or `src/routes/api/master-jenis-dokumen.$id.ts` route file is registered.
- `src/router.tsx` consumes `src/routeTree.gen.ts`, and `src/routeTree.gen.ts` contains no `/api/master-jenis-dokumen` or `/api/master-jenis-dokumen/$id` entries.
- Under the 11C.4b guardrails, adding route files without route generation would leave the new API unregistered, while manually editing `src/routeTree.gen.ts` or running route generation is explicitly disallowed.

Runtime decision:

- `src/routes/admin.master-data.jenis-dokumen.tsx` was not migrated in 11C.4b because switching it to `/api/master-jenis-dokumen` would point the browser at an unregistered route.
- No `master-jenis-dokumen` API route files were added, because route discovery/registration requires route generation or generated route tree edits.
- No Supabase fallback was added.
- The next safe implementation needs explicit approval to run route generation after adding narrow route files, or a separate route-registration phase that allows `src/routeTree.gen.ts` changes generated by the TanStack router tooling.

Expected route behavior when registration is approved:

- `GET /api/master-jenis-dokumen` should be a public local Drizzle read returning active rows as a raw array with `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and `updated_at`, ordered by `nama`.
- `POST /api/master-jenis-dokumen` should require local `dms_session`, require assigned `ADMIN` through `hasLocalRole`, validate `{ nama, deskripsi? }`, reject duplicate active names, create a row, and return the created row with status `201`.
- `PATCH /api/master-jenis-dokumen/$id` should require assigned `ADMIN`, validate `{ nama?, deskripsi?, isActive? }`, update only supplied fields, and return the updated row.
- `DELETE /api/master-jenis-dokumen/$id` should require assigned `ADMIN`, soft-delete by setting `is_active=false`, and return a success shape compatible with existing local master route conventions.

#### Phase 11C.4c Master Jenis Dokumen API Route Registration And Page Migration

Status: scoped runtime/docs migration complete as of 2026-05-19.

Changed runtime/docs surface:

- Added `src/routes/api/master-jenis-dokumen.ts`.
- Added `src/routes/api/master-jenis-dokumen.$id.ts`.
- Generated `src/routeTree.gen.ts` with scoped entries for `/api/master-jenis-dokumen` and `/api/master-jenis-dokumen/$id`; the file was not manually edited.
- Migrated `src/routes/admin.master-data.jenis-dokumen.tsx` from browser Supabase helpers to local `apiFetch`/`apiMutation`.
- Added local Zod boundary schemas `createMasterJenisDokumenSchema` and `updateMasterJenisDokumenSchema` in `src/lib/schemas/master-data.ts`.

Route registration:

- The repo still has no dedicated package script or top-level TanStack generator binary for route generation.
- The existing documented route update path used `pnpm build`, but this phase explicitly disallowed build as an automatic validation/generation substitute.
- Route registration was completed with the installed TanStack router generator package using the default repo route config plus the existing TanStack Start route-tree footer.
- The generated route tree diff is scoped to imports, route nodes, type map entries, module augmentation entries, child wiring, and root child wiring for `/api/master-jenis-dokumen` and `/api/master-jenis-dokumen/$id`.

Local API behavior:

- `GET /api/master-jenis-dokumen` performs a public local Drizzle read from `master.master_jenis_dokumen`, filters `is_active=true`, orders by `nama`, and returns a raw array of `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and `updated_at`.
- `POST /api/master-jenis-dokumen` requires local `dms_session`, requires assigned `ADMIN` through `hasLocalRole(session, 'ADMIN')`, validates `nama` and optional nullable `deskripsi`, rejects duplicate active names with `409`, inserts `is_active=true`, and returns the created row with status `201`.
- `PATCH /api/master-jenis-dokumen/$id` validates the UUID path id, requires assigned `ADMIN`, validates optional `nama`, optional nullable `deskripsi`, and optional `isActive`, rejects duplicate active names when the resulting row is active, updates only supplied fields, and returns the updated row.
- `DELETE /api/master-jenis-dokumen/$id` validates the UUID path id, requires assigned `ADMIN`, soft-deletes only by setting `is_active=false`, and returns a success/message shape. It does not hard-delete, cascade, or modify `dokumen.dokumen_transaksi`.

Admin page migration:

- The admin jenis-dokumen page is still CRUD and preserves the table columns `No`, `Nama`, `Deskripsi`, and `Aksi`.
- The create/update dialog still uses `Nama Jenis` and `Deskripsi`, keeps `Nama tidak boleh kosong`, keeps `Gagal menyimpan` as the non-API fallback save error, and preserves create/update success messages.
- The delete confirmation still uses `Hapus Jenis Dokumen?` and the page still refreshes after create/update/delete.
- The old browser-client connection error `Koneksi database tidak tersedia` is no longer applicable because the page no longer instantiates a browser Supabase client; local API failures now surface the API error message or the preserved fallback error.

Response-shape mapping:

- Browser page type maps only the row fields it uses or receives from the local API: `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and optional `updated_at`.
- The API response shape intentionally mirrors the old helper's row contract plus `updated_at`, matching nearby local master APIs and supporting later Non-Material dropdown migration.
- Create/update request bodies preserve the visible form semantics: `nama` is trimmed and required, and blank `deskripsi` is sent as `null`.

Delete/reference safety:

- `master.master_jenis_dokumen` supports `is_active`, and `dokumen.dokumen_transaksi.jenis_dokumen_id` references this table with no-action semantics.
- 11C.4c therefore uses soft-delete only. Historical `dokumen_transaksi` rows keep their referenced jenis-dokumen row available in the database.
- Inactive duplicate-name rows are not implicitly reactivated by create. Reactivation is only possible through explicit `PATCH` with `isActive=true`, and duplicate active-name validation still applies.

Deferred browser Supabase callers after 11C.4c:

- Role dashboard/list page filters.
- Pegawai submit page-wide master-data dropdown reads, including possible future use of `GET /api/master-jenis-dokumen` for Non-Material document type selection.
- Pegawai revisi page-level kelengkapan reads.
- PPK resubmit page-level kelengkapan reads.
- Browser session/role checks outside this admin/master-data slice.
- `src/lib/master-data/*` Supabase-client-shaped helper deletion.
- Supabase package/env/helper cleanup.

11C.4c does not claim global browser Supabase retirement, Supabase helper deletion, package/env cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, Playwright/E2E validation, package install/remove/update, or full regression.

Deferred browser Supabase callers not touched in 11C.4 through 11C.4c:

- Role dashboard/list page filters.
- Pegawai submit page-wide master-data dropdown reads, including Non-Material `jenis_dokumen`.
- Pegawai revisi page-level kelengkapan reads.
- PPK resubmit page-level kelengkapan reads.
- Browser session/role checks outside this admin/master-data slice.
- `src/lib/master-data/*` Supabase-client-shaped helper deletion.
- Supabase package/env/helper cleanup.

11C.4 does not claim global browser Supabase retirement, Supabase helper deletion, package/env cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, Playwright/E2E validation, route generation, or full regression.

#### Phase 11C.5 Role Dashboard/List Page Browser Supabase Retirement

Status: scoped runtime/docs migration complete as of 2026-05-19.

Changed runtime/docs surface:

- Migrated role layout/dashboard browser auth checks in `src/routes/ppk.tsx`, `src/routes/bendahara.tsx`, and `src/routes/arsiparis/index.tsx` from browser Supabase Auth plus `user_roles` reads to existing local `GET /api/auth/session` through `apiFetch`.
- Migrated PPK/Bendahara/Arsiparis list filter dropdown reads from browser `master_fungsi`/`master_kegiatan` queries to existing local master APIs:
  - `src/routes/ppk/inbox.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/bendahara/inbox.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/arsiparis/inbox.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/arsiparis/aktif/index.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/arsiparis/inaktif/index.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/arsiparis/usul-musnah/index.tsx` -> `GET /api/master-fungsi`.
  - `src/routes/arsiparis/search.tsx` -> `GET /api/master-fungsi` and `GET /api/master-kegiatan`.
- No API route, route tree, package/env, database migration/seed/script, helper deletion, or workflow/archive lifecycle behavior changed in 11C.5.

Pages inspected but unchanged:

- `src/routes/ppk/index.tsx` and `src/routes/bendahara/index.tsx` already render static `StatsBento` dashboard cards without browser Supabase reads.
- `src/routes/ppk/tervalidasi.tsx`, `src/routes/ppk/ditolak.tsx`, `src/routes/ppk/revisi.tsx`, `src/routes/bendahara/ditolak.tsx`, and `src/routes/bendahara/selesai.tsx` already read their local role list APIs through `apiFetch`.
- Arsiparis detail/classification pages already use local API fetch/mutation paths for the inspected list/detail surfaces and were not part of the filter-dropdown retirement slice.

Response-shape and behavior compatibility:

- The master dropdown mapping uses only `{ id, nama }`, matching the old browser Supabase projections and preserving `Semua Fungsi`/`Semua Kegiatan` options, filter state, reset buttons, and empty dropdown fallback to `[]` on fetch failure.
- Existing list APIs remain unchanged and keep their wrappers: `{ dokumen }`, `{ inbox }`, `{ aktif }`, `{ inaktif }`, `{ usul_musnah }`, and `{ arsip, total, page, per_page }`.
- PPK inbox keeps server-side `fungsi_id`, `start_date`, and `end_date` query parameters plus client-side search/pagination.
- Bendahara inbox and Arsiparis inbox/aktif/inaktif/usul-musnah keep server-side `fungsi_id` filtering.
- Arsiparis search keeps `fungsi_id`, `kegiatan_id`, `tahun`, `q`, and `page`, with dropdown data now loaded from local master APIs.
- Dashboard summary counts continue to use the existing local list endpoints already called by `src/routes/arsiparis/index.tsx`; no new broad dashboard/count API was added.
- `src/routes/ppk/index.tsx` and `src/routes/bendahara/index.tsx` still show static dash values because the existing `StatsBento` behavior is static.

Auth/current-user handling:

- `src/routes/ppk.tsx`, `src/routes/bendahara.tsx`, and `src/routes/arsiparis/index.tsx` now use `GET /api/auth/session` for presentational client redirects. Missing session redirects to `/login`; missing assigned role redirects to `/forbidden`.
- Server APIs remain the authorization authority through local `dms_session` checks and assigned-role validation. `dms_active_role` was not trusted or read directly by the migrated pages.

Deferred browser Supabase callers after 11C.5, before 11C.6:

- `src/routes/ppk/dokumen/$id/resubmit.tsx` still imported `getBrowserClient()` for page-level `master_kelengkapan_dokumen` reads at the end of 11C.5. This carry-forward item is resolved by 11C.6 below.
- Pegawai submit page-wide master-data reads and Pegawai revisi page-level kelengkapan reads also remained deferred at the end of 11C.5 and are resolved by 11C.6 below.
- Browser session/role checks outside scoped role pages, Supabase helper deletion, package/env cleanup, and global Supabase cleanup remain deferred.

11C.5 does not claim global browser Supabase retirement, Supabase package/env/helper cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, route generation, route tree changes, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, Playwright/E2E validation, package install/remove/update, or full regression.

#### Phase 11C.6 Submit/Revisi/Resubmit Page Browser Supabase Retirement

Status: scoped runtime/docs migration complete as of 2026-05-19 for the remaining scoped Pegawai submit, Pegawai revisi, and PPK resubmit browser Supabase reads.

Changed runtime/docs surface:

- `src/routes/pegawai/dokumen/aju.tsx` no longer imports `getBrowserClient()` and no longer calls Supabase-backed `src/lib/master-data/*` helper reads.
- `src/routes/pegawai/dokumen/$id/revisi.tsx` no longer imports `getBrowserClient()` and no longer reads `master_kelengkapan_dokumen` through browser Supabase.
- `src/routes/ppk/dokumen/$id/resubmit.tsx` no longer imports `getBrowserClient()` and no longer reads `master_kelengkapan_dokumen` through browser Supabase.
- No API route, route tree, package/env, database migration/seed/script, helper deletion, workflow/FSM, archive lifecycle, storage movement/delete, `AttachmentEditor`, `KelengkapanChecklist`, `HierarchicalFilter`, admin/master-data, or role dashboard/list behavior changed in 11C.6.

Local APIs used:

- Pegawai submit page dropdowns now use `GET /api/master-fungsi`, `GET /api/master-kegiatan?fungsi_id=<id>`, `GET /api/master-jenis`, `GET /api/master-kategori?jenis_id=<id>`, `GET /api/master-detail?kategori_id=<id>`, and `GET /api/master-jenis-dokumen`.
- Pegawai submit Ketua Tim check continues to use existing local `GET /api/users/me/is-ketua-tim/$kegiatanId`.
- Pegawai submit mutation continues to use existing `POST /api/dokumen/submit` with the same body shape.
- Pegawai revisi page continues to use existing `GET /api/dokumen/$id`, `PATCH /api/dokumen/$id`, and `POST /api/dokumen/$id/submit`.
- PPK resubmit page continues to use existing `GET /api/ppk/resubmit/$id`, `PATCH /api/ppk/resubmit/$id`, `POST /api/ppk/resubmit/$id`, and `POST /api/ppk/kembalikan/$id`.
- Pegawai revisi and PPK resubmit page-level kelengkapan reads now use `GET /api/master-kelengkapan?kegiatan_id=<id>&is_ketua_tim=<boolean>` with client-side chain filtering matching the previous page query.

Response-shape mapping:

- Fungsi dropdown uses `id` and `nama` from `GET /api/master-fungsi`; optional metadata remains tolerated but unused.
- Kegiatan dropdown uses `id`, `nama`, and `fungsi_id` from `GET /api/master-kegiatan?fungsi_id=<id>`.
- Jenis permintaan dropdown uses `id`, `nama`, and optional `deskripsi` from `GET /api/master-jenis`.
- Kategori dropdown uses `id`, `nama`, and `jenis_permintaan_id` from `GET /api/master-kategori?jenis_id=<id>`.
- Detail dropdown uses `id`, `nama`, and `kategori_permintaan_id` from `GET /api/master-detail?kategori_id=<id>`; `data.length > 0` remains the `kategoriHasDetail` signal.
- Non-Material jenis dokumen dropdown uses `id`, `nama`, `deskripsi`, `is_active`, `created_at`, and optional `updated_at` from `GET /api/master-jenis-dokumen`; the submit page only needs `id`, `nama`, and optional `deskripsi`.
- Revisi/resubmit kelengkapan maps API rows to `AttachmentEditor`'s `KelengkapanItem` shape: `id`, `nama_dokumen`, and `required`. API fields `kegiatan_id`, `is_ketua_tim`, `jenis_permintaan_id`, `kategori_permintaan_id`, and `detail_permintaan_id` are used only for request filtering and chain matching.

Cascade/reset compatibility:

- Changing fungsi still clears kegiatan, material request-chain selections, detail state, and `kategoriHasDetail`.
- Changing kegiatan still clears material request-chain selections and triggers the existing Ketua Tim check.
- Changing jenis still clears kategori/detail selections and detail state.
- Changing kategori still clears detail selection.
- Switching Material/Non-Material still clears material request-chain fields, `jenisDokumenId`, `jenisDokumenNama`, and `kategoriHasDetail` before downstream step validation/progression is reused.
- The step labels, completed-step behavior, `canAdvance*` checks, and review step remain page-local and unchanged except for their data source.

Material and Non-Material compatibility:

- Material submit still follows fungsi -> kegiatan -> jenis permintaan -> kategori -> optional detail -> upload/nominal -> review.
- Material submit still sends `is_non_material: false`, `nominal_realisasi`, and only non-empty `jenisPermintaanId`, `kategoriPermintaanId`, and optional `detailPermintaanId`.
- Non-Material submit still follows fungsi -> kegiatan -> jenis dokumen -> upload/keterangan -> review.
- Non-Material submit still sends `is_non_material: true`, `jenisDokumenId`, and `keteranganDetail`, while omitting material request-chain fields by using `undefined`.
- `jenisDokumenNama` remains UI-only and is derived from the selected local API row.

Required kelengkapan and Ketua Tim compatibility:

- Pegawai submit does not add page-level kelengkapan ownership. The existing 11C.2 `KelengkapanChecklist` local `/api/master-kelengkapan` behavior remains the single owner for required kelengkapan state in the submit upload step.
- Pegawai submit still receives `missingRequired` through `StepUploadLampiran`/`KelengkapanChecklist` and blocks progression/submit when required uploads are missing.
- Pegawai submit still checks Ketua Tim through existing local `GET /api/users/me/is-ketua-tim/$kegiatanId`; server APIs remain the authorization authority.
- Pegawai revisi and PPK resubmit keep page-level kelengkapan ownership because they render `AttachmentEditor`, not `KelengkapanChecklist`.
- Revisi/resubmit chain filtering preserves the old direct query semantics: if `detail_permintaan_id` exists, match exact detail; else if `kategori_permintaan_id` exists, match exact kategori and `detail_permintaan_id` null; else if `jenis_permintaan_id` exists, match exact jenis with kategori/detail null; else keep all rows returned by the base kegiatan/role API query.

Attachment/upload/preview/download compatibility:

- `AttachmentEditor` was not modified. It still owns dirty state, pending upload state, reset/cancel pending cleanup, custom user docs, preview, download, and final `lampiranUrls` submission behavior from 11C.1.
- `FileUploadButton`, `/api/upload`, local pending path semantics, preview/download helpers, and `{ signedUrl }` behavior were not changed.
- No old Supabase Storage file/data migration, copy, download, backfill, sync, or recovery was added.

Submit/revisi/resubmit payload compatibility:

- `POST /api/dokumen/submit` payload shape remains `fungsiId`, `kegiatanJenisId`, `isKetuaTim`, `tahun`, `tanggal`, `lampiranUrls`, `nominal_realisasi`, `is_non_material`, and the existing conditional `jenisDokumenId`/`keteranganDetail` or request-chain ids.
- Pegawai revisi still PATCHes `/api/dokumen/$id` with `{ lampiranUrls, nominalRealisasi }`, then POSTs `/api/dokumen/$id/submit` without changing the workflow route contract.
- PPK resubmit still PATCHes `/api/ppk/resubmit/$id` with `{ lampiranUrls, nominalRealisasi }`, then POSTs `/api/ppk/resubmit/$id` without resending stale attachment payload.
- PPK `Kembalikan ke Pegawai` still POSTs `/api/ppk/kembalikan/$id`.

Deferred browser Supabase callers after 11C.6:

- Browser session/role checks outside the scoped pages, including `src/routes/admin.index.tsx` and `src/routes/pegawai/dokumen/index.tsx`. These are resolved by 11C.7 below.
- Pegawai edit page remains out of scope for 11C.6 because it uses the already-migrated `AttachmentEditor` path and does not need additional page-level browser-read retirement in this slice.
- `src/lib/master-data/*` Supabase-client-shaped helper deletion remains deferred cleanup, not 11C.6 runtime scope.
- `src/lib/supabase-browser.ts` and `src/lib/supabase.ts` remain deferred helper cleanup surfaces.
- Supabase package/env cleanup and global Supabase helper cleanup.

11C.6 does not claim global browser Supabase retirement, Supabase package/env/helper cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, route generation, route tree changes, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, Playwright/E2E validation, package install/remove/update, dependency cleanup, or full regression.

#### Phase 11C.7 Remaining Browser Session/Admin/Pegawai List Supabase Retirement

Status: scoped runtime/docs migration complete as of 2026-05-19 for `src/routes/admin.index.tsx` and `src/routes/pegawai/dokumen/index.tsx`.

Changed runtime/docs surface:

- `src/routes/admin.index.tsx` no longer imports `getBrowserClient()` and no longer calls browser `supabase.auth.getSession()` or reads `user_roles` through `supabase.from(...)`.
- `src/routes/pegawai/dokumen/index.tsx` no longer imports `getBrowserClient()` and no longer calls browser `supabase.auth.getSession()` before loading the existing document list API.
- No API route, route tree, package/env, database migration/seed/script, helper deletion, workflow/FSM, archive lifecycle, storage movement/delete, submit/revisi/resubmit, admin/master-data, role dashboard/list, `AttachmentEditor`, `KelengkapanChecklist`, `HierarchicalFilter`, or file upload/preview/download behavior changed in 11C.7.

Local APIs used:

- Admin dashboard auth check now uses existing `GET /api/auth/session` through `apiFetch`.
- Pegawai dokumen list session precheck now uses existing `GET /api/auth/session` through `apiFetch`.
- Pegawai dokumen list data continues to use existing `GET /api/dokumen` through `apiFetch`.

Current behavior inventory:

- Admin dashboard previously used browser Supabase for session lookup and `user_roles` role lookup only. It rendered the existing static/dashboard content immediately while the client-side check ran, redirected missing session to `/login`, and redirected missing `ADMIN` assigned role to `/forbidden`.
- Pegawai dokumen list previously used browser Supabase only as a session existence precheck. List data already came from `GET /api/dokumen`.
- Pegawai dokumen list loading/error/empty behavior remains page-local: spinner while loading, error panel with retry on failure, and empty-state copy that distinguishes no documents from filtered results.
- Pegawai dokumen rows/cards remain table rows with `judul`, `fungsi_nama`, `kegiatan_nama`, `tahun`, status badge, current-step badge, formatted `tanggal`, and an action icon.
- Pegawai dokumen list keeps search across `judul`, `fungsi_nama`, and `kegiatan_nama`; status filtering; URL `status` query sync; page size `10`; client-side pagination; and existing create/detail/revisi links.

Admin dashboard auth/redirect compatibility:

- Missing local session from `GET /api/auth/session` still redirects to `/login`.
- Any session fetch failure redirects to `/login`, matching the conservative legacy failure direction.
- Missing assigned `ADMIN` role redirects to `/forbidden`.
- The check uses assigned roles from the server session response and does not trust `dms_active_role` as authorization proof.
- Dashboard UI remains `DashboardShell role="ADMIN"` plus `StatsBento role="ADMIN"`; no aggregation or new admin data read was added.

Pegawai dokumen list response mapping and compatibility:

- The list still expects the existing `{ dokumen }` wrapper from `GET /api/dokumen`.
- The current page uses `id`, `judul`, `fungsi_nama`, `kegiatan_nama`, `tahun`, `status`, `current_step`, `revision_target`, and `tanggal`.
- The existing local API response also includes document metadata such as `fungsi_id`, `kegiatan_jenis_id`, `is_ketua_tim`, `revision_notes`, `lampiran_urls`, `created_by`, `nominal_realisasi`, `is_non_material`, `jenis_dokumen_id`, `keterangan_detail`, `created_at`, `updated_at`, and optional name fields where selected by the route/parser. No new server response contract was added.
- Sorting remains the existing server order from `GET /api/dokumen`: owner-scoped rows ordered by `created_at` descending. Client-side filtering and pagination preserve that order.
- Status labels remain page-local for `DRAFT`, `IN_PPK_VALIDATION`, `IN_BENDAHARA_APPROVAL`, `NEED_REVISION`, `COMPLETED`, and `ARCHIVED`; unknown statuses fall back to the raw status string. The page did not previously include a special `TERSIMPAN` label in this filter/badge table, so 11C.7 does not add one.
- The revision action condition remains `status === 'NEED_REVISION' && revision_target === 'USER'`; other rows link to detail.

Auth/RBAC/server-authority review:

- Admin dashboard's client check is presentational; server/API boundaries remain the authority.
- Pegawai document ownership and role scope remain enforced by `GET /api/dokumen`, which uses local `dms_session`, requires assigned `PEGAWAI`, and filters by `created_by=session.user.id`.
- `dms_active_role` remains UX state only and is not used as authorization proof in either migrated page.

Workflow/FSM/archive/storage preservation:

- No document status transition, FSM action, archive lifecycle, document delete, submit/revisi/resubmit, nominal, storage movement/delete, preview/download, or old Supabase file/data migration behavior changed.
- No Supabase fallback was added.

Remaining browser Supabase/helper matches after 11C.7:

- `src/lib/supabase-browser.ts` and `src/lib/supabase.ts` remain helper/export surfaces for 11D/11E cleanup and were not modified.
- `src/lib/auth.ts`, `src/lib/dokumen/queries.ts`, `src/lib/dokumen/mutations.ts`, `src/lib/dokumen/storage.ts`, `src/lib/user-helpers.ts`, and selected server routes may still contain Supabase server/helper usage already classified for 11D or later server/helper retirement. These are not active browser UI imports in the 11C scoped pages.
- Phase 11C runtime retirement here means active browser runtime callers only. It does not claim Supabase package/env/helper cleanup or old Supabase Auth/Storage data/file recovery.

11C.7 does not claim Supabase package/env/helper cleanup, old Supabase Auth or Storage data/file migration/copy/download/backfill/sync/recovery, route generation, route tree changes, DB migration/seed/script changes, broad tests, build/typecheck, dev server validation, Playwright/E2E validation, package install/remove/update, dependency cleanup, or full regression.

Runtime/docs scope:

- Replace `getBrowserClient()` usage in active UI/components with local API calls or local auth state.
- Move `AttachmentEditor` pending upload and pending cleanup behind authorized API routes or an explicitly scoped local API surface.
- Preserve response parsing, dirty-state behavior, loading/error UX, and file logical path semantics.
- Keep server-side RBAC as the authority; UI role checks remain presentational.

Non-goals:

- No Supabase package/env cleanup yet.
- No removal of legacy server helpers yet.
- No route tree changes unless a missing replacement endpoint is explicitly approved.
- No old Supabase Auth or Storage data/file migration.

Candidate files to read/change:

- Change candidates: `src/components/dokumen/AttachmentEditor.tsx`, `src/components/dokumen/KelengkapanChecklist.tsx`, `src/components/laporan/HierarchicalFilter.tsx`, selected pages importing `getBrowserClient()`, and any narrow API route explicitly scoped by 11B.
- Read candidates: existing `src/lib/api-client.ts`, `src/lib/api-mutation.ts`, `src/lib/storage-client.ts`, master-data API routes, role/list API routes, and storage routes.

Guardrails:

- Preserve clean-local behavior and no Supabase fallback.
- Preserve pending path compatibility for underscore `/api/upload` paths and dash `AttachmentEditor` paths where local code still accepts both.
- Do not expose `storage/` as static files.
- Do not trust `dms_active_role` for authorization.
- Do not broaden user delete or document delete semantics.

Validation gates:

- `git grep` shows no active browser UI import of `#/lib/supabase-browser`.
- `AttachmentEditor` no longer calls `supabase.auth.getSession()`, `supabase.storage.upload(...)`, or `supabase.storage.remove(...)`.
- Upload, reset, cancel cleanup, preview, download, edit/revisi/resubmit submit behavior remain compatible for clean local data.
- Missing old Supabase-backed files fail cleanly.

Manual validation commands for human:

- `git grep -n "getBrowserClient\|supabase\.auth\|supabase\.storage\|storage\.from" -- src/routes src/components src/lib`
- `pnpm test` only when explicitly allowed.
- Manual smoke: Pegawai submit upload, Pegawai edit file replace/reset/cancel, Pegawai revisi, PPK resubmit, preview/download, admin/master-data pages, role list filters.

Deferred items / exit criteria:

- Exit when active browser Supabase runtime is retired and documented, with package/env cleanup still deferred to 11E.

### Phase 11D: Legacy Supabase Helper Retirement

Goal: remove or quarantine unused Supabase helper modules only after source audits prove no active runtime dependency.

Runtime/docs scope:

- Retire unused server/browser helper wrappers and legacy user helper code.
- Remove imports only after callers are migrated.
- If a helper must remain for tests/docs/reference, quarantine or document it explicitly rather than leaving it ambiguous.

Non-goals:

- No package/env cleanup in this phase unless 11E is explicitly combined later by human approval.
- No broad refactor.
- No runtime behavior change beyond deleting proven-unused legacy code.

Candidate files to read/change:

- `src/lib/user-helpers.ts`
- `src/lib/auth.ts`
- `src/lib/supabase-server.ts`
- `src/lib/supabase-admin.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/supabase.ts`
- Any imports from these files found by `git grep`.

Guardrails:

- Do not remove `src/lib/auth.ts` if active code still imports cookie/role helpers from it.
- Do not remove `src/lib/supabase-admin.ts` if `rename-pending`, tests, or any active route still imports `createAdminClient`.
- Do not remove `src/lib/supabase-server.ts` if `POST /api/dokumen/` or `PATCH /api/dokumen/$id/nominal` still imports it.
- Do not remove `src/lib/supabase-browser.ts` until 11C proves no active browser import.

Validation gates:

- `git grep` has no active source imports for each helper removed.
- Migrated route imports are clean.
- Type/build validation is scheduled for human run after removal.

Manual validation commands for human:

- `git grep -n "from '#/lib/auth'\|from '#/lib/supabase-server'\|from '#/lib/supabase-admin'\|from '#/lib/supabase-browser'\|from '#/lib/supabase'\|from '#/lib/user-helpers'" -- src tests`
- `git grep -n "createServerSupabaseClient\|createAdminClient\|getBrowserClient\|getServerSession\|auth.admin" -- src tests`
- Optional after scoped edits: `pnpm build` only if human approves.

Deferred items / exit criteria:

- Exit when no active runtime helper dependency remains, or when any remaining helper is explicitly documented as reference/test-only and not shipped runtime.

#### Phase 11D.1: Legacy Supabase Helper/Server Caller Inventory And Classification

Date: 2026-05-19.

Status: docs/audit inventory complete. No helpers were deleted, no runtime routes were migrated, no imports were removed, no package/env cleanup was performed, and no commit was made.

Scope:

- Inventory and classify remaining Supabase helper/server references after Phase 11C.7.
- Use import/caller evidence, not helper-export presence alone, to decide whether a file is an active runtime dependency.
- Preserve the Phase 11C completion caveat: active browser UI runtime is retired, but server/helper cleanup remains.
- Defer all source cleanup to later 11D slices.

Classification categories used:

| Category | Meaning |
|---|---|
| Active server runtime dependency | An active server route can execute Supabase client/Auth/Admin/database/storage behavior today. Must be migrated or explicitly retired before helper removal. |
| Active browser runtime dependency | A browser page/component imports or calls browser Supabase runtime today. |
| Legacy helper still imported by active runtime | A helper is superseded by local modules but remains on an active route import path. |
| Dead/unused helper candidate | Caller grep found no active source import of the runtime helper functions, but deletion remains deferred. |
| Tests/mock reference | Tests mock or reference Supabase helper names without proving live runtime dependency. |
| Docs/history reference | Migration docs/specs/history mention Supabase helpers. These references are not runtime blockers. |
| Safe removal candidate after caller migration | Removal appears reasonable only after active callers are migrated and final grep/build validation is approved. |
| Requires runtime migration before removal | A source route/helper must be migrated or explicitly retired before deleting the helper. |
| Blocker/unclear | Caller or compatibility status is not proven enough for removal. |

Audit commands used:

- `git status --short --branch`
- `git grep -n "getBrowserClient\|createBrowserClient\|supabase-browser\|from '#/lib/supabase'\|from '@/lib/supabase'" -- src/routes src/components src/lib tests docs/migration`
- `git grep -n "createServerSupabaseClient\|createAdminClient\|supabase\.auth\|auth.admin\|supabase\.from\|supabase\.storage\|storage\.from" -- src/routes src/components src/lib tests docs/migration`
- `git grep -n "from '#/lib/auth'\|from '@/lib/auth'\|from '#/lib/supabase-server'\|from '@/lib/supabase-server'\|from '#/lib/supabase-admin'\|from '@/lib/supabase-admin'\|from '#/lib/supabase-browser'\|from '@/lib/supabase-browser'\|from '#/lib/supabase'\|from '@/lib/supabase'\|from '#/lib/user-helpers'\|from '@/lib/user-helpers'" -- src tests docs/migration`
- `git grep -n "src/lib/auth.ts\|src/lib/user-helpers.ts\|src/lib/supabase-server.ts\|src/lib/supabase-admin.ts\|src/lib/supabase-browser.ts\|src/lib/supabase.ts\|src/lib/dokumen/mutations.ts\|src/lib/dokumen/queries.ts" -- docs src tests`
- `git grep -n "dokumen/index\|dokumen/\$id.nominal\|rename-pending\|nominal\|GET /api/dokumen\|PATCH /api/dokumen/\$id/nominal\|rename pending" -- src docs/migration tests`
- `git grep -n "getLocalServerSession\|hasLocalRole\|apiFetch\|apiMutation\|local-submit\|local-user" -- src/routes src/lib docs/migration`
- Follow-up source-only checks for `@supabase/ssr`, `@supabase/supabase-js`, `SupabaseClient`, dokumen helper exports, and active imports from `#/lib/dokumen-helpers`, `#/lib/dokumen`, and `#/lib/master-data`.

Active browser runtime finding:

- No active `src/routes` or `src/components` import of `getBrowserClient`, `#/lib/supabase-browser`, or `#/lib/supabase` remains after 11C.7.
- Source matches are limited to `src/lib/supabase-browser.ts` and `src/lib/supabase.ts` helper/export surfaces.
- Active browser UI runtime is therefore retired for the audited grep scope.
- Do not delete the helper files in 11D.1. Removal/quarantine belongs after server/helper callers are handled and final grep validation is approved.

Remaining helper/server classification:

| Surface | Evidence | Classification | Safe to remove now? | Required next action |
|---|---|---|---|---|
| `src/lib/supabase-browser.ts` | Defines `getBrowserClient()` and imports `createBrowserClient`; no active `src/routes` or `src/components` caller remains. | Dead/unused helper candidate; safe removal candidate after final caller validation. | No. 11D.1 is docs-only, and package/env cleanup is not scoped. | Defer to 11D.3 or 11E after server/helper cleanup and final source/package/env audit. |
| `src/lib/supabase.ts` | Re-exports `createServerSupabaseClient` and `getBrowserClient`; no active source import found by the audited import grep. | Dead/unused re-export barrel candidate; docs/history reference. | No. | Defer to 11D.3 after direct helper callers are migrated and re-export absence is rechecked. |
| `src/lib/supabase-server.ts` | Imported by `src/routes/api/dokumen/index.ts` and `src/routes/api/dokumen/$id.nominal.ts`. | Active server runtime dependency. | No. | Migrate or explicitly retire those route callers in 11D.2 before helper cleanup. |
| `src/lib/supabase-admin.ts` | Imported by `src/routes/api/dokumen/rename-pending.ts`; tests mock it. | Active server runtime dependency for one route plus tests/mock reference. | No. | Replace the `rename-pending` document lookup with local Drizzle/local helper in 11D.2, then re-audit tests. |
| `src/lib/auth.ts` | Imported by `src/routes/api/dokumen/index.ts` as `getServerSession as getSession` and by `src/routes/api/dokumen/$id.nominal.ts` as `getServerSession`; internally wraps `supabase.auth.getSession()`, `supabase.auth.getUser()`, role reads, and active-role cookie helpers. | Legacy helper still imported by active runtime; partially superseded by `src/lib/auth/local-server-auth.ts` and session repository modules. | No. | Keep until active route callers are migrated. Later split/retire Supabase session helpers only after checking whether cookie helpers are still imported anywhere. |
| `src/lib/user-helpers.ts` | No active `src/routes/api/users/*` import found after Phase 10; still imports `SupabaseClient` and contains Auth Admin list/create/update/reset/status helpers. | Dead/unused helper candidate for runtime; docs/history reference. | No. | Re-audit in 11D.3 and remove/quarantine only if tests/docs impact is explicitly scoped. |
| `src/lib/dokumen/mutations.ts` | Supabase-backed `createDokumen`, `updateDokumen`, `updateDokumenStatus`; `createDokumen` is active through `POST /api/dokumen` via `#/lib/dokumen-helpers`. | Legacy helper still imported by active runtime; requires runtime migration before removal. | No. | 11D.2 should migrate or explicitly retire `POST /api/dokumen` draft-create path before removing this helper. |
| `src/lib/dokumen/queries.ts` | Supabase-backed reads; active `getDokumenById` caller remains in `POST /api/dokumen/rename-pending`; other query functions have no active runtime callers in current grep. | Legacy helper still imported by active runtime for `rename-pending`; partial dead-code candidate for unused exports. | No. | Replace `rename-pending` ownership lookup first; later classify unused query exports in 11D.3. |
| `src/lib/dokumen/logs.ts` | Supabase-backed `insertLog` and `getLogsByDokumen`; active `insertLog` caller remains in `PATCH /api/dokumen/$id/nominal`. | Legacy helper still imported by active runtime; requires runtime migration before removal. | No. | 11D.2 nominal migration must use local append-only audit insert before this helper can be retired. |
| `src/lib/dokumen/storage.ts` | Imports `SupabaseClient`; storage move/remove functions call Supabase Storage, but active source callers found only for pure/type helpers such as `buildStorageFilename`, `storagePathBelongsToUser`, and type exports. Tests mock `canAccessStoragePath` for old raw-preview wiring. | Mixed helper: active pure helper/type surface plus dead/unused Supabase storage functions candidate. | No. | Do not delete whole file while pure/type helpers are imported. 11D.3 should split pure helpers/types from Supabase storage functions or retire unused storage functions after caller validation. |
| `src/lib/master-data/*` Supabase helper functions | Follow-up `SupabaseClient` grep shows legacy master-data helper files still type against Supabase clients, while current active pages import only shared row types after 11C. | Dead/unused helper candidate for runtime, except shared type exports. | No. | Defer to 11D.3 or a later helper quarantine pass; do not remove shared types used by admin pages and form types. |

Active API route classification:

| Route | Current Supabase helper imported | Active runtime? | Current local replacement status | Risk | Recommended 11D.2 action |
|---|---|---|---|---|---|
| `GET /api/dokumen` in `src/routes/api/dokumen/index.ts` | Same file imports `createServerSupabaseClient` and `getServerSession`, but `GET` itself uses `getLocalServerSession`, `hasLocalRole`, local `db`, and Drizzle joins. | Yes, but the `GET` handler is local-backed. | Local replacement already active for the Pegawai list used by `src/routes/pegawai/dokumen/index.tsx`. | Low for `GET`; do not regress it while touching the mixed file. | Do not migrate `GET`; only isolate or migrate the Supabase-backed `POST` branch. |
| `POST /api/dokumen` in `src/routes/api/dokumen/index.ts` | `createServerSupabaseClient`, `getServerSession as getSession`, and `createDokumen`. | Active route path, but current UI appears to use `/api/dokumen/submit` for normal submit. Treat as active/compatibility until explicitly retired. | Local submit exists under `/api/dokumen/submit`; no local replacement for this exact draft-create branch is wired. | Medium. Removing casually may break legacy compatibility; migrating casually may duplicate submit semantics. | Split as 11D.2a. Decide whether to retire as inactive compatibility path with approval or migrate narrowly to local session plus Drizzle draft creation. |
| `PATCH /api/dokumen/$id/nominal` in `src/routes/api/dokumen/$id.nominal.ts` | `createServerSupabaseClient`, `getServerSession`, and Supabase-backed `insertLog`. | Yes. Route tree registers `/api/dokumen/$id/nominal`, and docs keep it as the deferred cross-role nominal route. | No local replacement route found for this exact cross-role contract. Related document update/resubmit routes handle some nominal fields but not this compatibility path. | High. It is cross-role and audit-sensitive, and Phase 8G explicitly warned not to narrow it casually. | Split as 11D.2b. Migrate with local `dms_session`, creator/ARSIPARIS/ADMIN authorization parity, local Drizzle update, and append-only local audit insert. |
| `POST /api/dokumen/rename-pending` in `src/routes/api/dokumen/rename-pending.ts` | `createAdminClient` only for `getDokumenById(admin, dokId)` document lookup. | Yes. Route tree registers `/api/dokumen/rename-pending`; tests cover it. | Storage movement and auth are local-backed through `getLocalServerSession` and `local-pending-move`, but document lookup remains Supabase-helper-backed. | Low to medium. It is a narrow ownership lookup, but storage-adjacent behavior must not change response/error shape. | Split as 11D.2c. Replace only document lookup with local Drizzle/local query, preserve local movement behavior and response shape, then remove `createAdminClient` import. |

Auth/user helper classification:

- `src/lib/auth.ts` is superseded for local runtime by `src/lib/auth/local-server-auth.ts`, `src/lib/auth/session-repository.ts`, session-token/cookie helpers, and local role-resolution modules. It is not safe to delete because active dokumen routes still import its Supabase session functions. Cookie helper exports also require import-level verification before any split.
- `src/lib/user-helpers.ts` is superseded by `src/lib/users/local-user-queries.ts`, `src/lib/users/local-user-mutations.ts`, `src/lib/users/local-user-passwords.ts`, and local `/api/users/*` routes. Current grep found no active source import from `#/lib/user-helpers`, so it is a dead/unused helper candidate, not an active runtime dependency. Deletion remains deferred to 11D.3.

Dokumen helper classification:

- `src/lib/dokumen/mutations.ts` remains active only through legacy `createDokumen` on `POST /api/dokumen`. `updateDokumen` and `updateDokumenStatus` are candidate unused Supabase exports by current caller grep, but the file cannot be removed while `createDokumen` is active.
- `src/lib/dokumen/queries.ts` remains active through `getDokumenById` on `POST /api/dokumen/rename-pending`. Other Supabase query exports are candidate unused legacy helpers by current caller grep, but must be rechecked after `rename-pending` is migrated.
- `src/lib/dokumen/logs.ts` remains active through `insertLog` on `PATCH /api/dokumen/$id/nominal`.
- `src/lib/dokumen/storage.ts` should not be deleted as a whole because pure helper/type surfaces are still imported by active components/routes. Its Supabase Storage functions are cleanup candidates only after a split or export-level cleanup plan.

Tests/docs/reference classification:

- `tests/unit/dokumen/submit-route-parity.test.ts`, `tests/unit/storage/raw-preview-internal-url-runtime.test.ts`, `tests/unit/storage/raw-preview-internal-url-wiring.test.ts`, and `tests/unit/storage/rename-pending-local-route.test.ts` contain mocks or assertions for Supabase helper names. Classification: tests/mock reference, not live runtime dependency.
- Migration docs and historical specs contain many Supabase references. Classification: docs/history reference. Do not delete historical references in 11D.1.
- `src/routeTree.gen.ts` registers `/api/dokumen`, `/api/dokumen/rename-pending`, and `/api/dokumen/$id/nominal`. Classification: route registration evidence only; no route tree modification is allowed in 11D.1.

Safe removal candidates, deferred:

- `src/lib/supabase-browser.ts`: candidate only after final source/package/env audit proves no imports remain.
- `src/lib/supabase.ts`: candidate re-export barrel after direct helper callers are gone.
- `src/lib/user-helpers.ts`: candidate after source/test/doc impact is explicitly scoped.
- Legacy Supabase functions in `src/lib/master-data/*`, unused exports in `src/lib/dokumen/queries.ts`, `src/lib/dokumen/mutations.ts`, and Supabase Storage functions in `src/lib/dokumen/storage.ts`: candidates only after export-level caller validation and any needed pure-helper/type split.

Not safe to remove now:

- `src/lib/supabase-server.ts`: active callers in `POST /api/dokumen` and `PATCH /api/dokumen/$id/nominal`.
- `src/lib/supabase-admin.ts`: active caller in `POST /api/dokumen/rename-pending`.
- `src/lib/auth.ts`: active callers in the same dokumen routes.
- `src/lib/dokumen/mutations.ts`: active `createDokumen` path.
- `src/lib/dokumen/queries.ts`: active `getDokumenById` path.
- `src/lib/dokumen/logs.ts`: active `insertLog` path.
- `src/lib/dokumen/storage.ts`: active pure helper/type imports even though Supabase storage functions look unused.
- Supabase packages/env references: not scoped until 11E and still required by active server/helper files.

Recommended next sequence:

1. 11D.2a: Resolve `POST /api/dokumen` mixed-route debt. Prefer proving it is inactive and explicitly retiring it only if approved; otherwise migrate it narrowly to local `dms_session` and local Drizzle draft creation while leaving `GET /api/dokumen` unchanged.
2. 11D.2b: Migrate `PATCH /api/dokumen/$id/nominal` as its own cross-role nominal compatibility slice. Preserve creator/ARSIPARIS/ADMIN access, `ARCHIVED` blocking, material nominal validation, update response shape, and append-only audit logging.
3. 11D.2c: Migrate only the `rename-pending` document lookup from Supabase admin/helper to a local Drizzle/local query. Preserve local pending movement behavior and tests.
4. 11D.3: Helper import cleanup/dead-code removal after active callers are gone. Re-audit `src/lib/auth.ts`, `src/lib/user-helpers.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, `src/lib/supabase-browser.ts`, `src/lib/supabase.ts`, `src/lib/dokumen/*`, and `src/lib/master-data/*`; split pure/type helpers before deleting mixed files.
5. 11D.4: Final grep/audit and handoff into 11E. Confirm no active runtime Supabase source dependency remains before any package/env cleanup.

Open blockers/questions:

- `POST /api/dokumen` draft-create branch needs an explicit keep/migrate/retire decision before deleting `supabase-server`, `auth.ts` Supabase session helpers, or `dokumen/mutations.ts`.
- `PATCH /api/dokumen/$id/nominal` should be split from other cleanup because its cross-role contract is higher risk.
- `src/lib/dokumen/storage.ts` needs a split/delete strategy because pure filename/path helpers are still active while Supabase Storage functions appear unused.

#### Phase 11D.2a: Resolve POST /api/dokumen Supabase Runtime Dependency

Date: 2026-05-19.

Status: scoped runtime/docs migration complete for the `POST /api/dokumen` branch in `src/routes/api/dokumen/index.ts`. No commit was made.

Decision:

- Chosen path: narrow local migration, not retirement.
- Reason: current active Pegawai submit UI uses `POST /api/dokumen/submit`, but historical specs/docs still describe bare `POST /api/dokumen` draft creation and Phase 11D.1 classified it as compatibility debt. Absence of an obvious active UI caller is not enough evidence to safely delete the route.
- The migrated branch remains draft-oriented compatibility behavior only. It does not duplicate `/api/dokumen/submit` orchestration.

Runtime changes:

- Removed `createServerSupabaseClient`, legacy `getServerSession as getSession`, and Supabase-backed `createDokumen` imports from `src/routes/api/dokumen/index.ts`.
- Removed the route-local Supabase client helper that was used only by the POST branch.
- `POST /api/dokumen` now uses `getLocalServerSession(request)` and requires assigned `PEGAWAI` via `hasLocalRole(session, 'PEGAWAI')`.
- The route still validates JSON with the existing `createDokumenSchema`.
- The route still looks up `master_kegiatan.nama` for title generation and returns `400 { error: 'Kegiatan tidak ditemukan' }` when the kegiatan id is unknown.
- The route inserts one local `dokumen.dokumen_transaksi` row with `status='DRAFT'`, `created_by=session.user.id`, generated `judul`, and the legacy draft fields: `fungsi_id`, `kegiatan_jenis_id`, `is_ketua_tim`, `tahun`, `tanggal`, and `lampiran_urls`.
- The route explicitly preserves old helper defaults/nulls for the draft-only branch: `nominal_realisasi='0'`, `is_non_material=false`, `jenis_dokumen_id=null`, `keterangan_detail=null`, and material request-chain ids as `null`.
- The route returns `201 { dokumen }` using the same local parser shape as the existing document list/detail code, including `fungsi_nama` and `kegiatan_nama` where available.

Compatibility notes:

- GET `/api/dokumen` was intentionally preserved: it still uses local `getLocalServerSession`, requires `PEGAWAI`, filters `created_by=session.user.id`, orders by `created_at desc`, uses the same Drizzle joins to fungsi/kegiatan, and returns `{ dokumen }`.
- Current bare POST request validation remains based on `createDokumenSchema`. Fields outside that schema remain non-contract submit-era fields for `/api/dokumen/submit`, not bare draft-create behavior.
- Current legacy POST parsed optional request-chain ids through the schema but did not pass them into `createDokumen(...)`; 11D.2a preserves that omission rather than silently turning this branch into submit-like material/non-material orchestration.
- No audit log is appended by bare draft creation because the legacy `POST /api/dokumen` branch did not append one.
- No file upload, pending-to-formal movement, delete, preview/download, submit transition, FSM transition, archive lifecycle, or storage fallback behavior changed.

Remaining 11D.2 dependencies:

- 11D.2b remains: `PATCH /api/dokumen/$id/nominal` still imports legacy Supabase server/session behavior and Supabase-backed audit helper behavior.
- 11D.2c remains: `POST /api/dokumen/rename-pending` still has a deferred Supabase admin/helper-backed document lookup even though its auth and local pending movement behavior are already local-backed.
- Do not claim global Supabase helper retirement, package/env cleanup, or helper deletion complete after 11D.2a.

Validation notes:

- Lightweight validation only was used for this phase. Heavy validation such as `pnpm build`, broad tests, typecheck, dev server, DB scripts, migrations, seeds, route generation, package commands, and Playwright/E2E remain human-run only.
- Expected source audit after this phase: `src/routes/api/dokumen/index.ts` has no `createServerSupabaseClient`, legacy `getServerSession/getSession`, `createDokumen`, or `supabase.from` runtime dependency.
- Expected broader audit after this phase: remaining Supabase matches in `src/routes/api/dokumen/$id.nominal.ts` and `src/routes/api/dokumen/rename-pending.ts` are deferred 11D.2b/11D.2c work, not regressions from 11D.2a.

#### Phase 11D.2b: Resolve PATCH /api/dokumen/$id/nominal Supabase Runtime Dependency

Date: 2026-05-19.

Status: scoped runtime/docs migration complete for `PATCH /api/dokumen/$id/nominal` in `src/routes/api/dokumen/$id.nominal.ts`. No commit was made.

Runtime decision:

- Chosen path: narrow local migration, not helper deletion.
- The route path and method remain `PATCH /api/dokumen/$id/nominal`.
- The request body still validates the legacy fields `{ nominal_realisasi?: number | null, is_non_material?: boolean }` through `updateNominalSchema`.
- The route now uses `getLocalServerSession(request)` and assigned local session roles. It does not trust `dms_active_role` alone.
- Authorization preserves the documented legacy cross-role contract for the local role model: document creator, assigned `ARSIPARIS`, or assigned `ADMIN`. Legacy `SUPERADMIN` is not a local role in the canonical role set, so no local `SUPERADMIN` grant was introduced.
- Assigned `PPK` and `BENDAHARA` roles are not granted by this route unless the caller is also the document creator.

Local data behavior:

- Document lookup now reads local `dokumen.dokumen_transaksi` through Drizzle.
- Invalid UUID-like route ids fail cleanly as `404 { error: 'Dokumen tidak ditemukan' }`, matching nearby local document routes.
- Missing documents still return `404 { error: 'Dokumen tidak ditemukan' }`.
- The route updates only `dokumen_transaksi.nominal_realisasi`. It does not update status, current step, revision target, lampiran metadata, ownership fields, archive metadata, or workflow fields.
- `is_non_material` remains accepted by the schema for request-shape compatibility but does not determine or persist document type. The stored `dokumen_transaksi.is_non_material` value controls validation, because this nominal route must not convert document type.
- Drizzle numeric writes convert provided numbers to strings for the local PostgreSQL numeric column and preserve `null` when the request explicitly sends `nominal_realisasi: null`.

Validation and safety:

- Existing JSON parse errors still return `400 { error: 'Invalid JSON body' }`.
- Existing Zod validation failures still return `400 { error: 'Validasi gagal', details }`.
- Material validation still uses `validateNominalForMaterial(...)`, preserving the existing rule that material documents require an effective nominal value greater than zero and non-material documents are exempt.
- Non-Material documents remain exempt from nominal requirement, but the route rejects attempts to write a non-null `nominal_realisasi` to an existing Non-Material document with `400 { error: 'Dokumen Non-Material tidak memiliki nominal_realisasi' }`. Sending `nominal_realisasi: null` remains allowed as a cleanup/no-nominal value.
- The legacy `ARCHIVED` block is preserved as `400 { error: 'Tidak bisa update dokumen yang sudah diarsipkan' }`.
- Additional safe destroyed-archive protection was added: if a related `arsip` row has `status_arsip='DIMUSNAHKAN'`, the route returns `400 { error: 'Tidak bisa update dokumen yang sudah dimusnahkan' }` and performs no mutation. This intentionally fails closed for destroyed archive contexts rather than preserving a historically unsafe permissive edge case.

Audit and transaction behavior:

- Supabase-backed `insertLog(...)` is no longer used by this route.
- Successful nominal updates append one local `dokumen.log_aktivitas` row inside the same Drizzle transaction as the nominal update.
- The audit action remains `UPDATE_NOMINAL`.
- The audit `catatan` remains `Update nominal: <effective nominal>` and uses the same nullish-coalescing semantics as the legacy route for the effective nominal value.
- `step_urutan` is inserted as `null`, matching the old helper default.
- If either the nominal update or audit insert fails, the transaction rolls back and the route returns `500 { error: 'Update gagal' }`. The route does not return success after a nominal update without the append-only audit row.

Response compatibility:

- Unauthenticated remains `401 { error: 'Unauthorized' }`.
- Unauthorized remains `403 { error: 'Akses ditolak' }`.
- Missing/invalid id remains `404 { error: 'Dokumen tidak ditemukan' }`.
- Archived and validation failures remain `400` with `{ error }` or `{ error, details }` shapes.
- No nominal field supplied returns `200 { success: true, message: 'Tidak ada perubahan' }`.
- Successful nominal update returns `200 { success: true }`.

Supabase dependency status after 11D.2b:

- `src/routes/api/dokumen/$id.nominal.ts` no longer imports or uses `createServerSupabaseClient`, legacy `getServerSession/getSession`, Supabase-backed `insertLog`, `supabase.from`, or `supabase.auth`.
- No Supabase fallback was added.
- No Supabase helper files were deleted. `src/lib/dokumen/logs.ts`, `src/lib/auth.ts`, `src/lib/supabase-server.ts`, and related legacy helpers remain for later audited cleanup only.
- 11D.2a remains complete for `POST /api/dokumen`.
- 11D.2c remains deferred: `POST /api/dokumen/rename-pending` still has a Supabase admin/helper-backed document lookup while its auth and local pending movement behavior are already local-backed.
- Do not claim global Supabase helper retirement, package/env cleanup, or helper deletion complete after 11D.2b.

Validation notes:

- Lightweight validation only was used for this phase. Heavy validation such as `pnpm build`, broad tests, typecheck, dev server, DB scripts, migrations, seeds, route generation, package commands, and Playwright/E2E remain human-run only.
- Expected source audit after this phase: `src/routes/api/dokumen/$id.nominal.ts` has no `createServerSupabaseClient`, legacy `getServerSession/getSession`, Supabase-backed `insertLog`, `supabase.from`, or `supabase.auth` runtime dependency.
- Expected broader audit after this phase: remaining Supabase matches in `src/routes/api/dokumen/rename-pending.ts` are deferred 11D.2c work, not regressions from 11D.2b.

### Phase 11E: Package/Env/Import Cleanup

Goal: remove global Supabase packages and env references only after active runtime/helper usage is retired.

Runtime/docs scope:

- Remove Supabase package dependencies only after source imports are gone.
- Update setup/deployment docs to prefer local PostgreSQL, local session secrets, and local storage settings.
- Replace concrete-looking Supabase examples in docs/env examples with safe placeholders only when explicitly scoped.

Non-goals:

- Do not edit `.env` or `.env.migration` automatically.
- Do not remove `DATABASE_URL`; it remains required for local PostgreSQL.
- Do not remove docs/spec historical references unless explicitly scoped as docs hygiene.

Candidate files to read/change:

- `package.json`
- `pnpm-lock.yaml`
- `.env.example` and `.env.migration.example` only if human-approved.
- `src/lib/constants/env.ts`
- setup/deployment docs that mention Supabase runtime env.

Guardrails:

- Package removal must follow successful 11C/11D audits.
- `.env` and `.env.migration` are local/sensitive and must not be edited automatically.
- Do not remove `DMS_FILE_TOKEN_SECRET`, `DMS_LOCAL_STORAGE_ROOT`, `DMS_DEV_SEED_PASSWORD_HASH`, or local `DATABASE_URL` references.

Validation gates:

- `git grep` confirms no source imports from Supabase packages before dependency removal.
- Docs distinguish obsolete Supabase env from required local env.
- Lockfile changes are limited to approved dependency cleanup.

Manual validation commands for human:

- `git grep -n "@supabase/ssr\|@supabase/supabase-js\|SUPABASE_\|VITE_SUPABASE" -- src docs tests package.json pnpm-lock.yaml`
- `git diff -- package.json pnpm-lock.yaml`
- `git diff -- .env .env.migration`
- Optional after package cleanup: `pnpm install` and `pnpm build` only if explicitly approved.

Deferred items / exit criteria:

- Exit when runtime package/env cleanup is complete or remaining references are documented as historical docs/tests only.

### Phase 11F: Full Regression And Manual Smoke Validation

Goal: validate the local PostgreSQL/auth/storage app end to end before release hardening.

Runtime/docs scope:

- Human-run test and manual smoke plan.
- Regression report with pass/fail, skipped checks, known issues, and rollback decision.
- Focus on clean local data, not old Supabase data recovery.

Non-goals:

- No feature work hidden inside regression.
- No route generation unless explicitly approved.
- No Supabase fallback to make tests pass.

Candidate files to read/change:

- Read: `tests/`, Playwright config, migration docs, user-management spec, storage contracts, route docs.
- Change: regression report docs only unless a separate implementation phase fixes a found bug.

Guardrails:

- If `pnpm build` or route generation modifies `src/routeTree.gen.ts`, keep it only when route generation was intentionally scoped and approved; otherwise restore/revert that generated diff with human approval.
- Tests must use local clean data and local filesystem storage.
- Do not run DB scripts, migrations, or seeds unless explicitly approved.

Validation gates:

- Auth/session: login, logout, reload session, role switch, inactive user rejection, session revocation after password reset/change.
- User management: list/create/update/activate/deactivate/reset-password/change-password, ADMIN exclusivity, no hard delete.
- Storage: upload, pending-to-formal movement, preview, download, reset/cancel cleanup, missing file failure, path traversal rejection, `DIMUSNAHKAN` blocking.
- Workflow: submit, material approval, rejection/revision, PPK resubmit/kembalikan, Bendahara approve/reject, non-material `TERSIMPAN`.
- Archive/admin: archive, active/inactive/usul-musnah lifecycle, destruction, diagnostics, orphan cleanup dry-run/deletion safety.
- UI: Pegawai, PPK, Bendahara, Arsiparis, and Admin pages render and enforce expected access.

Manual validation commands for human:

- `pnpm test`
- Optional: `pnpm build`
- Optional focused E2E: `pnpm test tests/e2e/submit-flow.spec.ts`
- Optional focused E2E: `pnpm test tests/e2e/approval-flow.spec.ts`
- Optional focused E2E: `pnpm test tests/e2e/spec-06-user-management.spec.ts`

Deferred items / exit criteria:

- Exit when critical workflow smoke checks pass or blocking issues are documented with a fix/rollback decision.

### Phase 11G: Backup/Restore, Operational, LAN, And Release Hardening

Goal: make the local/LAN deployment operationally safe.

Runtime/docs scope:

- Backup/restore checklist for local PostgreSQL plus local filesystem storage.
- LAN/local deployment notes for app binding, firewall, server hostname/static IP, storage root, logs, and operator runbook.
- CSRF/rate-limit/security review for cookie-auth state-changing routes.
- Release readiness checklist and rollback plan.

Non-goals:

- No app containerization unless separately approved.
- No exposing PostgreSQL broadly to LAN by default.
- No old Supabase data/file recovery.

Candidate files to read/change:

- `docs/migration/local-deployment-notes.md`
- `docs/migration/deployment-target-contract.md`
- `docs/best-practices/docker-postgres-local-server-notes.md`
- `docs/best-practices/custom-session-auth-notes.md`
- Any later release checklist doc explicitly scoped by the phase.

Guardrails:

- Backup sets must include PostgreSQL dump, `storage/` files, timestamp/version metadata, and storage root configuration.
- Restore validation must prove DB metadata and file logical paths still line up.
- `DIMUSNAHKAN` files must remain inaccessible after restore.
- PostgreSQL port should not be exposed to the whole LAN without an explicit operational reason.
- CSRF/rate-limit review must not rely on Supabase Auth protections.

Validation gates:

- Backup can be created.
- Restore can be performed into a clean local target.
- Restored app can login, list documents, preview/download valid files, block destroyed archives, and run storage diagnostics.
- App is reachable from intended LAN client only when intentionally bound/firewall-opened.
- Rollback path is documented.

Manual validation commands for human:

- PostgreSQL backup/restore commands chosen by the operator environment, such as `pg_dump` and `pg_restore` or `psql`.
- File backup/restore commands chosen by the operator environment.
- Manual LAN smoke from another device on the same network.
- Manual security smoke for cookie flags, same-origin expectations, unauthenticated POST rejection, non-admin denial, and brute-force/rate-limit posture.

Deferred items / exit criteria:

- Exit when backup/restore and LAN release checklists are documented and at least one human-run drill is recorded.

### Phase 11H: Final Supabase Retirement Decision And Handoff

Goal: decide whether final Supabase retirement is complete, partial, or deferred.

Runtime/docs scope:

- Final source/package/env/docs/tests audit.
- Record remaining reference-only docs/tests if any.
- Record release risks, accepted limitations, and next maintenance tasks.
- Produce final handoff for the local/LAN target.

Non-goals:

- No last-minute cleanup without audit.
- No overclaiming final Supabase removal.
- No commit unless explicitly requested.

Candidate files to read/change:

- `docs/migration/phase-plan.md`
- Any final handoff/release note explicitly scoped by the human.
- Read-only audit over `src`, `tests`, `docs`, package files, env examples, DB/drizzle/supabase folders.

Guardrails:

- Final Supabase removal can be claimed only if no active runtime dependency remains.
- Remaining docs/spec/test references must be explicitly classified as reference-only.
- If `supabase/` historical migrations/functions remain in the repo, do not call that runtime removal unless the release policy says historical migration references can remain.

Validation gates:

- `git grep` confirms no active Supabase runtime dependency in `src`.
- Package/env cleanup status is documented.
- Regression, backup/restore, and LAN readiness are complete or blockers are listed.
- No unapproved files changed.

Manual validation commands for human:

- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- `git grep -n "supabase\|SUPABASE\|@supabase" -- src tests docs package.json pnpm-lock.yaml`
- `git diff -- src/routeTree.gen.ts package.json pnpm-lock.yaml .env .env.migration db drizzle supabase`

Deferred items / exit criteria:

- Exit when the release handoff clearly states whether Supabase is fully retired from active runtime, partially retained, or deferred with exact blockers.
- Release readiness is accepted only after clean-local runtime, regression, backup/restore, and LAN hardening gates are satisfied.

## Validation Gates

- After schema work: fresh DB can initialize and seed.
- After auth work: login/logout/session/role switch works.
- After storage work: upload/preview/download works and unauthorized access fails.
- After read migration: all role list/detail pages render with compatible data.
- After mutation migration: submit, approve, reject, revise, archive, and admin CRUD flows work.
- Before Supabase removal: no replacement gaps remain.
