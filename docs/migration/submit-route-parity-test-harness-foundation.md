# Phase 6F.7 Submit Route Parity Test Harness Foundation

Date: 2026-05-16.

## Purpose And Scope

This phase adds focused executable parity tests for the unchanged legacy `POST /api/dokumen/submit` route.

The tests lock the current response status/body contract before any later submit runtime migration to local `dms_session` auth, local PostgreSQL/Drizzle writes, submit move planning, local file preflight, or local filesystem movement.

This phase does not wire submit to local runtime behavior.

`POST /api/dokumen/submit` remains legacy Supabase-backed in production source and was not modified.

## Test File Added

- `tests/unit/dokumen/submit-route-parity.test.ts`

No shared or global test harness was added.

## Harness Strategy

The test imports the route module only from the dedicated parity test file and extracts the handler from:

```ts
Route.options.server.handlers.POST
```

The tests use synthetic `Request` objects and assert observable `Response` status/body first.

Mocks and stubs used:

- `#/lib/supabase-server`: mocked `createServerSupabaseClient`.
- `#/lib/supabase-admin`: mocked `createAdminClient`.
- `#/lib/auth`: mocked `getServerSession`.
- `#/lib/dokumen-helpers`: mocked `getKelengkapanRequired`, `createDokumen`, `updateDokumenStatus`, `insertLog`, and `resolveLeafNodeName`.
- Supabase table reads are narrow in-memory stubs for `master_kegiatan`, `master_jenis_dokumen`, and `ketua_tim_assignments`.
- Supabase Storage is a narrow in-memory stub for `storage.from('dokumen-lampiran').move(oldPath, newPath)`.
- `crypto.randomUUID()` is mocked only in tests that need deterministic `temp-id` target assertions.

The harness does not contact live Supabase, does not open live PostgreSQL, does not resolve a local storage root, and does not read, write, delete, rename, or move local files.

## Scenarios Implemented

Implemented executable parity scenarios:

- missing JSON body returns `400 { error: 'Invalid JSON body' }`;
- malformed JSON body returns `400 { error: 'Invalid JSON body' }`;
- schema validation failure returns `400 { error: 'Validasi gagal', details }`;
- material missing `nominal_realisasi` returns `400 { error: 'Nominal_realisasi wajib untuk dokumen Material' }`;
- material invalid `nominal_realisasi` returns `400 { error: 'Nominal_realisasi wajib untuk dokumen Material' }`;
- missing session returns `401 { error: 'Unauthorized' }`;
- missing required lampiran returns `400 { error: 'Lampiran wajib belum lengkap: ...' }`;
- empty `lampiranUrls` returns `400 { error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }`;
- missing kegiatan returns `400 { error: 'Kegiatan tidak ditemukan' }`;
- missing Ketua Tim assignment returns `403 { error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }`;
- Supabase Storage move failure returns `500` with `details.failedPath`, `details.newPath`, and `details.reason`;
- `createDokumen(...)` failure returns `500 { error }`;
- `updateDokumenStatus(...)` failure returns `500 { error }`;
- material success returns `201 { success: true, dokumen }` with `status='IN_PPK_VALIDATION'`, `current_step='PPK'`, and `revision_target=null`;
- non-material success returns `201 { success: true, dokumen }` with `status='TERSIMPAN'`, `current_step=null`, and `revision_target=null`;
- underscore pending path does not trigger the current submit route storage move;
- already formal path does not trigger the current submit route storage move;
- returned error objects from `insertLog(...)` are ignored by the current route and success is still returned.

## Scenarios Deferred

Deferred scenarios:

- FSM transition failure route response. This can be added later with a targeted invalid created-document status, but it was not needed to prove the required minimum harness and the current success transition parity.
- Thrown `insertLog(...)` failure behavior. This phase documents the returned-error-object behavior only; thrown helper behavior remains a later parity edge case if needed.
- Local file disk preflight outcomes, including missing local source and target-already-exists responses.
- DB/file compensation behavior after future filesystem moves.
- Runtime submit support for underscore pending paths.
- Runtime switch to local `dms_session`.
- Runtime use of `src/lib/storage/submit-move-plan.ts`.
- Runtime use of `src/lib/dokumen/local-submit-write-bridge.ts`.
- Runtime use of `src/lib/dokumen/local-submit-repository.ts`.
- Runtime use of `src/lib/dokumen/local-submit-drizzle-adapter.ts`.

These were deferred because this phase is only a parity harness for the unchanged legacy route. It must not guess future local runtime behavior.

## Route Import And Harness Limitations

Importing `src/routes/api/dokumen/submit.ts` from Vitest with the existing route-test pattern worked.

No production route exports, route handler shape, route config, or route tree files were changed to make the tests pass.

The harness intentionally uses narrow route-local stubs instead of broad global mock infrastructure.

## Validation Results

Focused test command:

```powershell
pnpm test tests/unit/dokumen/submit-route-parity.test.ts
```

Result:

- The first sandboxed run failed before tests started because Vitest/esbuild hit `spawn EPERM`.
- The same focused command was rerun with approved escalation.
- Escalated rerun passed.
- 1 test file passed.
- 16 tests passed.

Additional non-mutating validation and guard commands were run after edits:

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
Select-String -Path tests\unit\dokumen\submit-route-parity.test.ts -Pattern "DMS_LOCAL_STORAGE_ROOT|DATABASE_URL|process\.env|node:fs|fs\.|writeFile|rename|unlink|mkdir|rm\(|rmdir|createWriteStream|createReadStream" -CaseSensitive:$false
```

Result summary:

- `git diff --check` passed.
- Guarded runtime files had no diff.
- The audit `Select-String` command returned no matches for storage root, database URL, environment, or filesystem-operation patterns in the new test file.

## Explicit Confirmations

This phase did not:

- modify `src/routes/api/dokumen/submit.ts`;
- modify `src/routeTree.gen.ts`;
- modify submit runtime wiring;
- execute or implement filesystem movement;
- perform local file disk preflight;
- add Supabase fallback;
- use live Supabase network calls;
- use live PostgreSQL;
- run DB scripts;
- run migrations;
- run seeds;
- run route generation;
- run a dev server;
- run a build;
- run the full test suite;
- run a full typecheck;
- migrate, copy, download, backfill, or sync Supabase Storage files.

## Remaining Blockers Before Submit Runtime Wiring

- Runtime submit local file preflight is still not implemented.
- Runtime filesystem movement is still not implemented.
- DB/file compensation behavior is still not implemented.
- `temp-id` remains the default submit planning target.
- Missing local files must still be treated as controlled failures with no Supabase fallback in a future runtime phase.
- Supabase cannot be removed.

## Phase 6F.8 Follow-Up Note

Phase 6F.8 added `src/lib/dokumen/submit-file-preflight.ts` and `tests/unit/dokumen/submit-file-preflight.test.ts` as a route-independent helper foundation.

The parity harness remains unchanged. `POST /api/dokumen/submit` is still not wired to the helper, runtime route disk checks are still not wired, and filesystem movement plus DB/file compensation remain future blockers.
