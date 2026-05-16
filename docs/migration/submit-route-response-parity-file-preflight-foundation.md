# Phase 6F.5 Submit Route Response Parity And Local File Preflight Foundation

Date: 2026-05-16.

## Purpose And Scope

This phase documents the current `POST /api/dokumen/submit` route contract and defines the local file preflight and DB/file failure policy needed before submit can be migrated to local PostgreSQL, local session auth, and local filesystem storage.

This phase is readiness and planning only.

`POST /api/dokumen/submit` is still not wired to local auth, the local submit write bridge, the local submit repository, the local submit Drizzle adapter, the submit move planner, local file preflight, or local filesystem movement.

This phase does not modify runtime submit behavior, does not execute filesystem movement, does not check disk existence, does not call Supabase, does not run database scripts, does not run migrations or seeds, and does not migrate, copy, download, backfill, or sync Supabase Storage files.

## Current Submit Route Evidence

Current route:

```text
POST /api/dokumen/submit
```

Current source file:

```text
src/routes/api/dokumen/submit.ts
```

Current implementation remains legacy Supabase-backed:

- Auth/session: `createServerSupabaseClient(...)` plus `getServerSession(supabase)`.
- Master reads: Supabase reads for `master_kegiatan`, `master_jenis_dokumen`, required kelengkapan, request-chain leaf name, and Ketua Tim assignment.
- Storage move: route-local Supabase Storage `.move(...)` for dash-pending paths only.
- Document write: `createDokumen(supabase, ...)`.
- Status write: `updateDokumenStatus(admin, ...)`.
- Audit write: `insertLog(admin, ...)`.

## Current Request Shape

The route parses JSON and validates with `createAndSubmitDokumenSchema`:

```ts
{
  fungsiId: string
  kegiatanJenisId: string
  isKetuaTim: boolean
  tahun: number
  tanggal: string
  lampiranUrls: {
    kelengkapan_id: string
    nama: string
    url: string
    uploaded_at: string
  }[]
  nominal_realisasi?: number | null
  is_non_material?: boolean
  jenisDokumenId?: string
  keteranganDetail?: string
  jenisPermintaanId?: string
  kategoriPermintaanId?: string
  detailPermintaanId?: string
}
```

## Current Response Shape And Status Inventory

Inventory below is based on the current source code only.

| Case | Current status | Current response shape |
|---|---:|---|
| Invalid or missing JSON body | 400 | `{ error: 'Invalid JSON body' }` |
| Schema validation failure | 400 | `{ error: 'Validasi gagal', details: parsed.error.flatten() }` |
| Material nominal validation failure | 400 | `{ error: 'Nominal_realisasi wajib untuk dokumen Material' }` |
| Missing Supabase session | 401 | `{ error: 'Unauthorized' }` |
| Missing required lampiran | 400 | `{ error: 'Lampiran wajib belum lengkap: ...' }` |
| Empty `lampiranUrls` | 400 | `{ error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }` |
| Missing kegiatan | 400 | `{ error: 'Kegiatan tidak ditemukan' }` |
| Ketua Tim assignment missing | 403 | `{ error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }` |
| Supabase Storage move failure | 500 | `{ error, details: { failedPath, newPath, reason } }` |
| Document create failure | 500 | `{ error }` |
| FSM transition failure | 500 | `{ error }` |
| Status update failure | 500 | `{ error }` |
| Success | 201 | `{ success: true, dokumen: updatedDok }` |

There is no route-level `200` success response in the current submit source.

## Material Success Inventory

For material submit, current behavior is:

- Create document first as `DRAFT`.
- Run `transition(dok.status, 'SUBMIT', 'PEGAWAI')`.
- Expected new status: `IN_PPK_VALIDATION`.
- Expected `current_step`: `PPK`.
- Expected `revision_target`: `null`.
- Expected audit action: `SUBMIT`.
- Expected `step_urutan`: `1`.
- Success response status: `201`.
- Success response body: `{ success: true, dokumen: updatedDok }`.

The route response merges transition fields into the created document object before returning:

- `status`
- `current_step`
- `revision_target`
- `updated_at`

## Non-Material Success Inventory

For non-material submit, current behavior is:

- Create document first as `DRAFT`.
- Do not call the generic FSM transition.
- Manually use status `TERSIMPAN`.
- Expected `current_step`: `null`.
- Expected `revision_target`: `null`.
- Expected audit action: `STORE`.
- Expected `step_urutan`: `1`.
- Success response status: `201`.
- Success response body: `{ success: true, dokumen: updatedDok }`.

The source comment says non-material moves to completed, but implemented behavior is `TERSIMPAN`. The implemented behavior is the parity target.

## Auth And Session Failure Behavior

Current route behavior:

- JSON parsing and schema validation happen before session lookup.
- Session lookup uses the Supabase-backed `getServerSession(supabase)`.
- Missing session returns `401 { error: 'Unauthorized' }`.
- The route does not currently check active role or assigned role directly.
- Material FSM actor role is hardcoded as `PEGAWAI`.
- Submit route migration must not rely on client-side role state as the authorization boundary.

Planned local route wiring must map local session failures to the same route-compatible `401` category unless a later route-test phase proves a different existing behavior is required.

## Missing Body And Validation Failure Behavior

Current route behavior:

- Missing, malformed, or non-JSON body fails at `request.json()` and returns `400 { error: 'Invalid JSON body' }`.
- JSON body with invalid shape fails Zod `safeParse` and returns `400 { error: 'Validasi gagal', details }`.
- Material documents require `nominal_realisasi > 0`; failure returns `400 { error: 'Nominal_realisasi wajib untuk dokumen Material' }`.

Planned local submit wiring must keep request parsing before auth if preserving exact route order is required. If a later phase intentionally changes parse/auth ordering, it must be documented and route-tested because unauthenticated invalid requests could receive different status codes.

## Attachment Validation Behavior

### Empty Attachment Behavior

Current route behavior:

- `lampiranUrls: []` passes Zod because the schema requires an array but not a minimum length.
- The route then returns `400 { error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }`.

### Missing Required Lampiran Behavior

Current route behavior:

- Required kelengkapan is read when the document is material, or when non-material payload includes `jenisPermintaanId`.
- Missing required items return `400 { error: 'Lampiran wajib belum lengkap: ...' }`.
- The missing item names come from `nama_dokumen`.

Required lampiran validation currently happens before the empty-attachment check. If required kelengkapan exists and `lampiranUrls` is empty, the missing-required response can occur before the generic empty-attachment response.

## Missing Kegiatan Behavior

Current route behavior:

- Route reads `master_kegiatan` by `kegiatanJenisId`.
- Missing row returns `400 { error: 'Kegiatan tidak ditemukan' }`.
- This happens before Ketua Tim assignment validation and before storage move processing.

## Ketua Tim Assignment Failure Behavior

Current route behavior:

- If `isKetuaTim` is true, the route checks `ketua_tim_assignments` for the session user and submitted kegiatan.
- Missing assignment returns `403 { error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }`.
- This happens before storage move processing.

Local submit wiring must keep the assignment check in the same local identity domain as `dms_session` and local upload owner segments.

## Current Storage Move Failure Behavior

Current route storage behavior:

- The route detects only dash-pending source paths whose filename matches `^\d{13}-[a-zA-Z0-9]+-.+$`.
- It does not detect underscore `/api/upload` pending paths.
- For each detected dash-pending path, it builds `{session.user.id}/temp-id/{uuid}.{ext}`.
- It calls Supabase Storage `.move(oldPath, newPath)`.
- On the first move failure, it returns `500` with an `error` string and `details.failedPath`, `details.newPath`, and `details.reason`.
- Earlier successful moves are not rolled back if a later move fails.
- No application-level source existence preflight is visible.

Current source logs logical paths to server logs during move attempts. A later local implementation should avoid exposing physical paths or storage root in responses and should avoid adding sensitive log output.

## Current Document, Status, And Audit Failure Behavior

Current document/status/audit behavior:

- `createDokumen(...)` failure returns `500 { error }`.
- FSM transition failure returns `500 { error }`.
- `updateDokumenStatus(...)` failure returns `500 { error }`.
- `insertLog(...)` is awaited, but the route does not inspect a returned error object before returning success.

Local bridge/repository foundations currently model audit insertion as part of the local transaction and therefore stricter than the current unchecked helper-return behavior. This remains a parity decision before route wiring.

## Local Bridge/Repository/Adapter Outcome Mapping

Planned route-compatible mapping for later wiring:

| Local outcome | Planned route-compatible response |
|---|---|
| `createLocalSubmitActorFromSession(null)` issue `unauthenticated` | `401 { error: 'Unauthorized' }` |
| Actor issue `admin-only-not-allowed` or `actor-not-pegawai-compatible` | unresolved; likely `403 { error }`, but current submit lacks explicit role check, so route parity tests must decide |
| Zod parse failure | `400 { error: 'Validasi gagal', details }` |
| Material nominal failure | `400 { error: 'Nominal_realisasi wajib untuk dokumen Material' }` |
| Bridge issue `empty-attachments` | `400 { error: 'Minimal upload satu lampiran sebelum mengajukan dokumen' }` |
| Bridge issue `required-attachments-missing` | `400 { error: 'Lampiran wajib belum lengkap: ...' }` |
| Bridge issue `kegiatan-not-found` | `400 { error: 'Kegiatan tidak ditemukan' }` |
| Bridge issue `ketua-tim-assignment-missing` | `403 { error: 'Anda bukan Ketua Tim yang ditunjuk untuk kegiatan ini.' }` |
| Bridge issue `transition-failed` | `500 { error }` |
| Submit move plan issue `missing-url`, `invalid-source-path`, `owner-mismatch`, `unsupported-source-path`, `invalid-source-extension`, `invalid-target-path`, `invalid-target-uuid` | fail before DB writes and before moves; exact 400/500 split unresolved and must be route-tested before wiring |
| Missing local source during future disk preflight | fail before DB writes and before moves; no Supabase fallback; planned as controlled storage error without physical path exposure |
| Target already exists during future disk preflight | fail before DB writes and before moves; planned as controlled storage error without physical path exposure |
| Local Drizzle adapter no-row insert/update/audit errors | likely `500 { error }`; exact message should preserve route-compatible generic behavior and avoid adapter internals |
| Successful material write | `201 { success: true, dokumen }` with `IN_PPK_VALIDATION`, `PPK`, `null`, audit `SUBMIT` |
| Successful non-material write | `201 { success: true, dokumen }` with `TERSIMPAN`, `null`, `null`, audit `STORE` |

Unresolved mapping items should not be guessed in runtime code. They need focused route-level tests or an explicit compatibility decision before submit route wiring.

## Local File Preflight Requirements

Future local submit wiring must perform all checks below before any DB write and before any filesystem move:

- Parse and validate JSON body.
- Validate material nominal rules.
- Resolve and validate the local server session.
- Validate role/FSM compatibility without trusting client role state.
- Validate kegiatan/master data.
- Validate required lampiran.
- Validate Ketua Tim assignment in the same local identity domain as the session.
- Build the submit move plan from logical attachment paths.
- Preserve `temp-id` as the default submit planning target unless a later approved phase proves a real-document-id ordering.
- Normalize and validate every logical attachment path.
- Reject unsafe logical paths.
- Validate owner segment against the server-authenticated user for local pending/formal paths.
- Classify supported pending underscore paths, supported pending dash paths, already formal paths, unsupported safe paths, and invalid paths.
- Define the policy for unsupported safe paths before route wiring.
- For supported pending paths, preflight local source existence before moves.
- For planned target paths, preflight target non-existence before moves.
- Fail all-or-nothing before moves if any attachment has a blocking issue.
- Never expose physical paths, storage root, env values, tokens, signed URLs, or file contents in client responses.

## Missing Local File Policy

The local filesystem starts clean in the migration target.

New `/api/upload` files are local.

Older Supabase-backed files may not exist locally.

`AttachmentEditor` may still produce Supabase-backed dash pending paths until it is migrated.

Policy:

- Missing local file is a controlled failure.
- Missing local file must fail before DB writes and before filesystem moves.
- Missing local file must not fallback to Supabase Storage.
- Missing local file must not trigger Supabase fetch, copy, download, backfill, sync, or migration.
- Missing local file errors must expose only safe logical context or generic messages, never physical filesystem paths or storage root.
- Verification should use clean local seed data and newly uploaded local files only.

## DB/File Ordering Options

| Option | Benefit | Risk |
|---|---|---|
| Move before DB writes, preserving current `temp-id` ordering | Closest to current submit route behavior | DB failure after moves can leave orphan local files |
| DB transaction before moves with pending metadata | Real document id can exist first | DB can point to pending or missing files if moves fail later |
| Pre-create draft, move to real document id, then update metadata/status/audit | Cleaner formal paths | Requires draft rollback/cleanup policy and changes current `temp-id` behavior |
| Preflight all local files, move, then perform one DB transaction | Avoids DB metadata pointing at missing moved files if preflight fails | DB failure after moves still needs compensation |
| Preflight all local files, DB transaction, then move files | Avoids orphan files before DB success | DB success followed by move failure can expose missing-file metadata unless metadata/status is delayed or compensated |

## Recommended Conservative DB/File Failure Policy

Recommended policy for later submit route wiring:

1. Keep this phase unwired.
2. Preflight all request, auth, role, master-data, Ketua Tim, attachment, source, and target checks first.
3. Do not move files if any preflight check fails.
4. Do not write DB rows if local source files are missing.
5. Preserve `temp-id` as the default planning target until a later approved phase proves a real-document-id ordering.
6. Use one local DB transaction for document create, status update, and append-only audit insert.
7. Define whether audit insertion failure should preserve current unchecked behavior or use the stricter local transaction behavior before wiring.
8. If a later implementation moves files before DB persistence, define best-effort rollback to original logical paths and a durable generic recovery marker before enabling the route.
9. If a later implementation writes DB before moving files, prevent workflow success from becoming visible until moves have succeeded or a compensating rollback has completed.
10. Never fallback to Supabase.
11. Never expose physical paths or storage root in responses or logs.

Conservative route preference: fail before DB writes and before filesystem moves whenever local file readiness is not proven. Orphan files are less dangerous than DB metadata pointing at missing files, but both need an explicit compensation path before runtime movement is enabled.

## Remaining Blockers Before Submit Route Migration

- Route-level parity tests are still missing for the current submit response contract.
- Runtime submit route is not wired to local `dms_session`.
- Runtime submit route is not wired to the local submit write bridge/repository/adapter.
- Runtime submit route is not wired to the submit move planner.
- Runtime submit route has no local file disk preflight.
- Runtime submit route has no local filesystem movement.
- Missing local file route response status/message is not finalized.
- Unsupported safe logical path policy is not finalized.
- Append-log failure parity is unresolved because current route awaits `insertLog(...)` but does not inspect returned helper errors.
- DB/file compensation strategy is documented here as a recommendation, not implemented.
- `temp-id` remains the default submit planning target.
- Preview/download defaults and archive behavior remain separate migration surfaces.
- Historical Supabase Storage files are not locally available.
- Supabase cannot be removed.

## Validation Results

This phase is documentation-only. No helper was added, so no new helper unit test was required.

Focused non-mutating validation was run after documentation edits:

```powershell
git status --short --branch
git diff --check
git diff --name-only
git diff -- src\routeTree.gen.ts
git diff -- src\routes\api\dokumen\submit.ts
git diff -- src\lib\storage\submit-move-plan.ts
git diff -- src\lib\dokumen\local-submit-drizzle-adapter.ts
```

Result summary:

- `git diff --check` passed.
- `git diff --name-only` listed only tracked migration documentation edits; `git status --short --branch` listed the new untracked planning doc.
- Guarded runtime files had no diff.
- No DB scripts, migrations, seeds, dev server, build, full test suite, full typecheck, auth hash script, or route generation were run.

## Explicitly Not Implemented

This phase does not implement:

- submit route wiring;
- submit route response tests;
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

## Phase 6F.6 Follow-Up Note

Phase 6F.6 added `docs/migration/submit-route-parity-test-foundation.md`.

The follow-up documented the route-level parity test matrix and safe harness strategy for the unchanged legacy `POST /api/dokumen/submit` route. It recommends a future focused test phase using mocked Supabase server/admin clients, mocked session/helper dependencies, synthetic `Request` objects, and no live Supabase, live PostgreSQL, filesystem movement, storage root resolution, route generation, UI/browser tests, DB scripts, migrations, or seeds.

No helper, executable submit route tests, runtime source code, filesystem movement, local disk checks, route wiring, DB scripts, migrations, seeds, route generation, Supabase calls, or Supabase Storage migration/copy/download/backfill/sync were added.

## Phase 6F.8 Follow-Up Note

Phase 6F.8 added the isolated helper foundation described in `docs/migration/submit-file-preflight-helper-foundation.md`.

The helper evaluates submit move plan output and requires injected logical-path-only source/target checks for move-required operations without wiring `POST /api/dokumen/submit`, without implementing route disk checks, without moving files, without resolving physical paths, and without adding Supabase fallback. Runtime submit preflight and DB/file compensation remain unimplemented.
