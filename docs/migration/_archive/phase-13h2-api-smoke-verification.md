# Phase 13H.2 - Manual API Smoke Verification

Date: 2026-05-29

Status: partially completed; targeted static checks passed, runtime manual smoke blocked because no local app server was already running.

## Scope

Phase 13H.2 verifies the Phase 13H folder/berkas API routes with bounded local smoke checks.

This phase does not add UI, folder-first pages, backfill, archive lifecycle mapping, schema changes, migrations, seed changes, package changes, storage/file behavior, cleanup behavior, canonical archive mutation beyond existing route behavior, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Preconditions

- The working tree was clean at the start of the phase.
- The human has already applied migration `0007`.
- `src/routeTree.gen.ts` was already generated in Phase 13H.1 and registers:
  - `POST /api/arsiparis/berkas/open`;
  - `POST /api/arsiparis/berkas/$id/items`;
  - `POST /api/arsiparis/berkas/$id/close`.

## Tests Run

Command:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-schema.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts
```

Result:

```text
3 test files passed.
27 tests passed.
```

The targeted tests cover schema validation, service behavior, API same-origin rejection, unauthenticated rejection, wrong-role and `ADMIN`-only denial, service error mapping, safe response DTOs, and close-folder validation/error handling.

## Runtime Smoke Status

Runtime manual smoke was not performed in this Codex pass because no local app server was already reachable on the configured dev port.

Checked:

```text
http://localhost:3000
http://localhost:5173
```

Both were unavailable.

Per the Phase 13H.2 constraint, Codex did not start `pnpm dev`, did not start a long-running server, and did not stop or kill any process.

## Human Runtime Smoke Instructions

Start the local app when ready:

```bash
pnpm dev
```

For LAN binding, if explicitly needed:

```bash
pnpm dev --host 0.0.0.0
```

Then log in through the browser as a user assigned `KEPALA_SUB_BAGIAN_UMUM`. Use browser DevTools `fetch` calls with same-origin relative URLs. Do not print cookies, session values, DB URLs, env values, raw rows, file paths, tokens, or secrets.

### Recommended Cases

1. Unauthenticated `POST /api/arsiparis/berkas/open`
   - Expected: `401` or the app's standard auth error.

2. Same-origin rejection
   - Expected: `403`.
   - If awkward to perform manually, rely on the targeted API unit test coverage.

3. Wrong role or `ADMIN`-only
   - Expected: `403`.
   - `ADMIN` is not a substitute for `KEPALA_SUB_BAGIAN_UMUM`.

4. Open berkas
   - Use a valid `klasifikasi_id` from local master data without printing raw rows.
   - Expected: `200`, safe `{ berkas }` body, `status_berkas: "OPEN"`.
   - Repeating the request should return the existing open folder instead of creating a duplicate.

5. Add item validation
   - Example invalid body:

```json
{ "source_type": "WORKFLOW", "manual_arsip_id": "<uuid>" }
```

   - Expected: `400`.

6. Close empty berkas
   - Expected: `409`, with safe empty-folder error wording.

7. Add item and close, only if a safe matching source item exists
   - Add item expected: `201`.
   - Close expected: `200`, safe `{ berkas }` body, `status_berkas: "CLOSED"`.
   - Subsequent add item should reject with `409`.
   - Skip this case if no safe matching workflow or manual source item exists; do not seed or invent data for this phase.

## Performed Or Skipped

Performed:

- Clean working tree gate.
- Phase 13H route/source review.
- Route-tree registration spot check.
- Targeted unit test command.
- Local server reachability check.

Skipped:

- Browser/manual runtime smoke, because no local app server was already running.
- Add item and close runtime mutation smoke, because runtime smoke was blocked and no safe source item was selected.
- Broad build, broad tests, E2E, migrations, seeds, cleanup scripts, and storage operations by phase constraint.

## Follow-Up

Run the human browser smoke pass once the local app is started and a valid `KEPALA_SUB_BAGIAN_UMUM` account plus safe local `klasifikasi_id` are available.

Record only endpoint paths, HTTP status codes, generic body shapes, and safe status values such as `OPEN` or `CLOSED`. Do not record cookies, session values, raw rows, IDs unless intentionally test/synthetic, SQL params, DB URLs, env values, storage paths, file tokens, or secrets.
