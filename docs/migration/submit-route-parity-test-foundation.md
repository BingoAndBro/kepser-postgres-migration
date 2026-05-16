# Phase 6F.6 Submit Route Parity Test Planning / Foundation

Date: 2026-05-16.

## Purpose And Scope

This phase defines the route-level parity test contract for the current legacy `POST /api/dokumen/submit` route before any local submit runtime wiring happens.

The objective is to preserve the current response status and body contract while later phases replace submit internals with local `dms_session` auth, local PostgreSQL/Drizzle writes, and local filesystem storage.

This phase is documentation-only.

`POST /api/dokumen/submit` is still not modified and is not wired to local auth, the local submit write bridge, the local submit repository, the local submit Drizzle adapter, the submit move planner, local disk preflight, or local filesystem movement.

This phase does not add executable route tests, does not import `src/routes/api/dokumen/submit.ts` from a new test, does not mock Supabase/DB/filesystem in executable submit tests, does not execute filesystem movement, does not run DB scripts, does not run migrations or seeds, and does not migrate, copy, download, backfill, or sync Supabase Storage files.

## Current Route Response Inventory

Inventory source:

- `src/routes/api/dokumen/submit.ts`
- `docs/migration/submit-route-response-parity-file-preflight-foundation.md`

Current submit route remains legacy Supabase-backed:

- Auth/session uses `createServerSupabaseClient(...)` and `getServerSession(supabase)`.
- Master reads use Supabase for kegiatan, jenis dokumen, required kelengkapan, request-chain leaf names, and Ketua Tim assignment.
- Storage movement uses route-local Supabase Storage `.move(...)` for dash-pending paths only.
- Document creation uses `createDokumen(supabase, ...)`.
- Status update uses `updateDokumenStatus(admin, ...)`.
- Audit append uses `insertLog(admin, ...)`.

Current request handling order:

1. Parse JSON body with `request.json()`.
2. Validate body with `createAndSubmitDokumenSchema.safeParse(...)`.
3. Validate material `nominal_realisasi`.
4. Resolve Supabase session.
5. Validate required lampiran.
6. Validate non-empty lampiran list.
7. Read kegiatan.
8. Check Ketua Tim assignment when requested.
9. Resolve leaf name.
10. Move dash-pending storage paths to `{userId}/temp-id/{uuid}.{ext}`.
11. Create document as `DRAFT`.
12. Apply material FSM transition or non-material shortcut.
13. Update document status fields.
14. Await audit insert.
15. Return `201 { success: true, dokumen }`.

Current response and status inventory:

| Case | Status | Body contract |
|---|---:|---|
| Invalid or missing JSON body | 400 | `{ error: 'Invalid JSON body' }` |
| Schema validation failure | 400 | `{ error: 'Validasi gagal', details }` |
| Material missing or invalid `nominal_realisasi` | 400 | `{ error: 'Nominal_realisasi wajib untuk dokumen Material' }` |
| Missing session | 401 | `{ error: 'Unauthorized' }` |
| Missing required lampiran | 400 | `{ error: 'Lampiran wajib belum lengkap: ...' }` |
| Empty `lampiranUrls` after required-lampiran branch permits it | 400 | `{ error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }` |
| Missing kegiatan | 400 | `{ error: 'Kegiatan tidak ditemukan' }` |
| Missing Ketua Tim assignment | 403 | `{ error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }` |
| Storage move failure | 500 | `{ error, details: { failedPath, newPath, reason } }` |
| `createDokumen(...)` failure | 500 | `{ error }` |
| FSM transition failure | 500 | `{ error }` |
| `updateDokumenStatus(...)` failure | 500 | `{ error }` |
| Material success | 201 | `{ success: true, dokumen }` with `status='IN_PPK_VALIDATION'`, `current_step='PPK'`, `revision_target=null` |
| Non-material success | 201 | `{ success: true, dokumen }` with `status='TERSIMPAN'`, `current_step=null`, `revision_target=null` |

Current audit behavior:

- Material success uses audit action `SUBMIT`.
- Non-material success uses audit action `STORE`.
- `step_urutan` is `1`.
- `insertLog(...)` is awaited.
- The route does not inspect a returned helper error object before returning success.
- Therefore audit insert failure remains an unresolved parity question until the helper behavior is route-tested or explicitly decided.

## Proposed Route Parity Test Matrix

These tests should be implemented before changing submit route runtime behavior. They are planned tests only in this phase.

| ID | Scenario | Mock setup | Expected response | Contract notes |
|---|---|---|---|---|
| P01 | Invalid or missing JSON body | Synthetic request with malformed JSON or no parseable body | `400 { error: 'Invalid JSON body' }` | Confirms parse-before-auth ordering. |
| P02 | Schema validation failure | Valid JSON that fails `createAndSubmitDokumenSchema` | `400 { error: 'Validasi gagal', details }` | Details should be Zod flattened shape. |
| P03 | Material missing nominal | Valid material payload with missing, null, zero, or invalid nominal | `400 { error: 'Nominal_realisasi wajib untuk dokumen Material' }` | Must occur before session lookup. |
| P04 | Missing session | Valid payload; `getServerSession(...)` returns null | `401 { error: 'Unauthorized' }` | No master, storage, document, status, or audit calls. |
| P05 | Missing required lampiran | Valid material payload; required kelengkapan includes an unuploaded required item | `400 { error: 'Lampiran wajib belum lengkap: ...' }` | Error names come from required item `nama_dokumen`. |
| P06 | Empty `lampiranUrls` | Valid payload with no required items and `lampiranUrls: []` | `400 { error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }` | Required-lampiran branch can take precedence when required rows exist. |
| P07 | Missing kegiatan | Valid payload and session; kegiatan read returns null | `400 { error: 'Kegiatan tidak ditemukan' }` | Must happen before storage move and document creation. |
| P08 | Missing Ketua Tim assignment | `isKetuaTim: true`; assignment read returns null | `403 { error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }` | Must happen before storage move and document creation. |
| P09 | Storage move failure | Dash-pending attachment; mocked `.move(...)` returns an error | `500` with `{ error, details: { failedPath, newPath, reason } }` | `failedPath` and `newPath` are logical paths only. |
| P10 | `createDokumen(...)` failure | Storage processing succeeds or is skipped; create returns `{ error }` | `500 { error }` | Status update and audit insert must not run. |
| P11 | FSM transition failure | Create returns document with status that makes `transition(...)` fail, or mock FSM if import constraints require it | `500 { error }` | Preserve current route status category. |
| P12 | `updateDokumenStatus(...)` failure | Transition succeeds; status update returns `{ error }` | `500 { error }` | Audit insert must not run after status update failure. |
| P13 | Material success | Valid material payload; all reads/writes succeed | `201 { success: true, dokumen }` | Response document has `IN_PPK_VALIDATION`, `PPK`, `null`; audit action is `SUBMIT`; `step_urutan=1`. |
| P14 | Non-material success | Valid non-material payload; all reads/writes succeed | `201 { success: true, dokumen }` | Response document has `TERSIMPAN`, `null`, `null`; audit action is `STORE`; `step_urutan=1`. |
| P15 | Audit insert failure parity question | `insertLog(...)` returns an error-shaped object or throws | Unresolved | Current route awaits the helper but ignores returned error objects. Throw behavior may still fail the handler. Must be tested against actual helper behavior before wiring. |
| P16 | Underscore pending path current behavior | Valid payload with `/api/upload` underscore pending path | Planned current-route assertion: no submit route storage move for underscore path | Current submit detects dash-pending only. Later local submit may intentionally support underscore paths, but that must be regression-gated. |
| P17 | Already formal path current behavior | Valid payload with formal logical path | `201` when other dependencies succeed and no storage move is attempted | Prevents double-moving after `rename-pending`. |

Minimum required scenarios before runtime migration are P01 through P15. P16 and P17 should be added if the later harness can observe storage move calls safely without overcoupling to implementation details.

## Recommended Test Harness Strategy

The next route-test implementation phase should test current submit route behavior before modifying `src/routes/api/dokumen/submit.ts`.

Recommended harness:

- Use Vitest.
- Use synthetic `Request` objects.
- Import the route only in the dedicated future route parity test phase, not in this planning phase.
- Extract the handler from `Route.options.server.handlers.POST`, matching existing route-test patterns used by `tests/unit/storage/upload-route-local.test.ts`, `tests/unit/storage/rename-pending-local-route.test.ts`, and `tests/unit/storage/raw-preview-internal-url-runtime.test.ts`.
- Mock the Supabase server client factory.
- Mock the Supabase admin client factory.
- Mock `getServerSession(...)`.
- Mock `getKelengkapanRequired(...)`, `createDokumen(...)`, `updateDokumenStatus(...)`, `insertLog(...)`, and `resolveLeafNodeName(...)`.
- Mock FSM transition only if current imports or targeted failure scenarios make direct setup impractical.
- Use deterministic `crypto.randomUUID()` mocks for storage move failure and success assertions involving `newPath`.
- Assert no live Supabase network, no live PostgreSQL, no storage root resolution, and no local filesystem read/write/move.
- Assert mocked storage `.move(...)` is called only for dash-pending paths in the current legacy route.
- Assert underscore pending paths are not moved by the current route, then use that as an explicit migration-regression decision point later.

Recommended helper utilities for that later test phase:

- `createSubmitJsonRequest(body)` returning a `Request`.
- `readJson(response)` helper that parses response bodies.
- `createValidMaterialSubmitPayload(overrides)` fixture.
- `createValidNonMaterialSubmitPayload(overrides)` fixture.
- `createSupabaseTableMock(...)` supporting the narrow chains used by current submit: `from(...).select(...).eq(...).single()` and `maybeSingle()`.
- `createStorageMoveMock(...)` supporting `storage.from('dokumen-lampiran').move(oldPath, newPath)`.
- `expectNoRuntimeSideEffects(...)` assertions against mocked DB/storage calls for early validation failures.

If importing `src/routes/api/dokumen/submit.ts` proves brittle because of TanStack Start route module behavior, document that as a blocker and add a minimal route-test harness phase before runtime migration. Do not work around brittleness by changing the submit route in the parity test phase.

## Mocks And Stubs Needed

Required mocks:

- `#/lib/supabase-server`: `createServerSupabaseClient`.
- `#/lib/supabase-admin`: `createAdminClient`.
- `#/lib/auth`: `getServerSession`.
- `#/lib/dokumen-helpers`: `getKelengkapanRequired`, `createDokumen`, `updateDokumenStatus`, `insertLog`, `resolveLeafNodeName`.

Required Supabase client stub behavior:

- `from('master_kegiatan').select('nama').eq('id', kegiatanJenisId).single()` returns either `{ data: { nama } }` or `{ data: null }`.
- `from('master_jenis_dokumen').select('nama').eq('id', jenisDokumenId).single()` returns a non-material leaf-name row or null.
- `from('ketua_tim_assignments').select('id').eq('user_id', session.user.id).eq('kegiatan_id', kegiatanJenisId).maybeSingle()` returns assignment row or null.

Required admin storage stub behavior:

- `storage.from('dokumen-lampiran').move(oldPath, newPath)` returns `{ error: null }` for success or `{ error: { message } }` for move failure.
- The mock must not perform any disk operation.
- The mock must not contact Supabase.

Required session fixture:

- `session.user.id`
- `session.user.email`
- `session.user.user_metadata.nama_lengkap` or `user_name`

Required document fixture:

- Created document starts with `status: 'DRAFT'`.
- Response-compatible keys should include snake_case fields used by UI callers, including `current_step`, `revision_target`, `lampiran_urls`, and `updated_at`.

## Exact Scenarios To Test Before Runtime Migration

Before local submit route wiring is approved, implement and pass focused route parity tests for:

- Invalid or missing JSON body.
- Schema validation failure.
- Material missing `nominal_realisasi`.
- Missing session.
- Missing required lampiran.
- Empty `lampiranUrls`.
- Missing kegiatan.
- Missing Ketua Tim assignment.
- Storage move failure with `details.failedPath`, `details.newPath`, and `details.reason`.
- `createDokumen(...)` failure.
- FSM transition failure.
- `updateDokumenStatus(...)` failure.
- Material success with `IN_PPK_VALIDATION`, `current_step='PPK'`, `revision_target=null`, audit action `SUBMIT`, and `step_urutan=1`.
- Non-material success with `TERSIMPAN`, `current_step=null`, `revision_target=null`, audit action `STORE`, and `step_urutan=1`.
- Current dash-pending-only move detection.
- Current underscore pending path non-move behavior.
- Already formal attachment non-move behavior.

Each test must assert that no live Supabase, no live PostgreSQL, and no filesystem movement occurs.

## Scenarios Deferred To Later Runtime Phases

These scenarios should remain unresolved until a later approved runtime implementation phase:

- Local file disk preflight implementation.
- Missing local file response status and exact message.
- Target-already-exists local file preflight response status and exact message.
- Unsupported safe logical path policy.
- DB/file compensation implementation after moves.
- Best-effort rollback behavior.
- Durable recovery marker behavior.
- Real document-id path strategy replacing `temp-id`.
- Runtime submit support for underscore pending paths.
- Runtime submit local auth switch to `getLocalServerSession(request)`.
- Runtime use of `src/lib/dokumen/local-submit-write-bridge.ts`.
- Runtime use of `src/lib/dokumen/local-submit-repository.ts`.
- Runtime use of `src/lib/dokumen/local-submit-drizzle-adapter.ts`.
- Runtime use of `src/lib/storage/submit-move-plan.ts`.
- Audit insert failure semantics if current helper returns an error object instead of throwing.

Do not guess these behaviors in route code. Preserve the current route until route parity tests and explicit runtime policy decisions exist.

## No-Live-Side-Effects Rule

Future route parity tests for this contract must follow these rules:

- No live Supabase network.
- No live PostgreSQL.
- No local filesystem reads, writes, deletes, renames, or moves.
- No storage root resolution.
- No route generation.
- No UI or browser tests for this phase.
- No DB scripts.
- No migrations.
- No seeds.
- No dev server.
- No full test suite.
- No full typecheck.
- No auth hash script.
- No Supabase Storage migration, copy, download, backfill, or sync.

## Regression Gate Usage

Use this document as the acceptance contract for the next submit route parity test phase.

Recommended gate sequence before runtime wiring:

1. Implement focused current-route parity tests using mocks only.
2. Run only those route parity tests.
3. Confirm tests pass against the unchanged legacy submit route.
4. Only then start a separate approved runtime submit migration phase.
5. During runtime migration, keep the same tests as regression gates.
6. Add local-file-preflight and compensation tests in the runtime phase before enabling filesystem movement.
7. Do not remove or weaken legacy parity assertions unless an intentional behavior change is documented and approved.

The route parity tests should make behavior drift visible before local submit wiring changes any auth, database, status, audit, or storage behavior.

## Remaining Blockers Before Submit Route Wiring

- Route-level submit parity tests are planned here but not implemented.
- Runtime submit route is not wired to local `dms_session`.
- Runtime submit route is not wired to the local submit write bridge, repository, or Drizzle adapter.
- Runtime submit route is not wired to the submit move planner.
- Runtime local file disk preflight is not implemented.
- Runtime filesystem movement is not implemented.
- DB/file failure compensation policy is documented but not implemented.
- Missing local file must still be finalized as a route-compatible controlled failure.
- Unsupported safe logical path policy is unresolved.
- Audit insert failure parity is unresolved.
- `temp-id` remains the default submit planning target.
- Current submit detects dash-pending paths only; underscore pending path migration behavior must be explicit and tested.
- Missing local files must not fallback to Supabase.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

Focused non-mutating validation for this phase:

```powershell
git status --short --branch
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\storage\submit-move-plan.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
git diff -- src\lib\dokumen\local-submit-write-bridge.ts
git diff -- src\lib\dokumen\local-submit-repository.ts
```

Result summary:

- Initial `git status --short --branch` was clean on `migration/postgres-local`.
- Final `git status --short --branch` showed only migration documentation changes and this new untracked planning doc.
- `git diff --check` passed. Git reported line-ending normalization warnings for edited migration docs only.
- `git diff --name-only` listed only tracked migration documentation edits.
- Guarded runtime files had no diff:
  - `src\routeTree.gen.ts`
  - `src\routes\api\dokumen\submit.ts`
  - `src\lib\storage\submit-move-plan.ts`
  - `src\lib\dokumen\local-submit-drizzle-adapter.ts`
  - `src\lib\dokumen\local-submit-write-bridge.ts`
  - `src\lib\dokumen\local-submit-repository.ts`

No helper was added, so no helper unit test or helper audit command was required.

## Explicitly Not Implemented

This phase does not implement:

- executable submit route parity tests;
- submit route wiring;
- runtime local auth changes;
- runtime local DB writes;
- runtime local file preflight;
- filesystem moves;
- local file disk checks;
- Supabase fallback;
- Supabase calls;
- Supabase Storage migration, copy, download, backfill, or sync;
- DB scripts, migrations, or seeds;
- route generation;
- UI behavior changes;
- preview/download changes;
- archive destruction changes;
- delete/remove changes;
- diagnostics/orphan cleanup changes.
