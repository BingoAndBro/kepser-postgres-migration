# Phase 13I.1 - Runtime Smoke Pengklasifikasian Dokumen To Open Berkas

Date: 2026-05-29

Status: partially completed; targeted static checks passed, runtime manual smoke blocked because no local app server was already running.

## Scope

Phase 13I.1 verifies the Phase 13I workflow `Pengklasifikasian Dokumen` to `OPEN` berkas integration with bounded local smoke checks.

The runtime behavior under review is:

```text
POST /api/arsiparis/dokumen/$id/archive
```

Expected successful classification behavior:

- preserves the existing transitional workflow archive behavior;
- creates a canonical `source_type='WORKFLOW'` archive row;
- transitions `dokumen_transaksi.status` from `COMPLETED` to `ARCHIVED`;
- writes the append-only `ARCHIVE` log;
- gets or creates the matching `OPEN` berkas by `klasifikasi_id`;
- inserts a `WORKFLOW` item into `arsip.berkas_arsip_item`.

This phase does not add UI, folder-first pages, backfill, close-folder behavior, archive lifecycle mapping, schema changes, migrations, seed changes, package changes, storage/file behavior, cleanup behavior, route generation, or Supabase fallback.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.

## Preconditions

- The working tree was clean at the start of the phase.
- The human has already applied migration `0007`.
- Runtime smoke requires a browser session authenticated through local `dms_session` as a user assigned `KEPALA_SUB_BAGIAN_UMUM`.
- `dms_active_role` is UX-only and is not authorization proof.
- `ADMIN` is not a substitute for `KEPALA_SUB_BAGIAN_UMUM`.

## Source Review

Files reviewed:

- `AGENTS.md`
- `docs/migration/phase-13i-pengklasifikasian-dokumen-open-berkas-integration.md`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/lib/archive/berkas-arsip-service.ts`
- `tests/unit/arsiparis/workflow-archive-route.test.ts`
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`

Source inspection confirmed the route performs same-origin validation and local session role authorization before mutation, requires assigned `KEPALA_SUB_BAGIAN_UMUM`, validates `klasifikasi_id`, keeps initial classification independent from `Nomor SPM` and final retention metadata, and runs the berkas item write inside the existing archive transaction.

## Tests Run

Command:

```bash
pnpm test tests/unit/arsiparis/workflow-archive-route.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts
```

Result:

```text
2 test files passed.
21 tests passed.
```

The targeted tests cover canonical workflow archive writes, optional initial `nomor_surat`, optional final retention metadata, existing `OPEN` berkas reuse, new `OPEN` berkas creation, `WORKFLOW` item insertion, duplicate item conflict mapping, missing or inactive classification rejection, source classification mismatch rejection, closed-folder rejection, and `ADMIN`-only denial.

## Runtime Smoke Status

Runtime manual smoke was not performed in this Codex pass because no local app server was already reachable on the common local development ports checked.

Checked:

```text
http://127.0.0.1:3000
http://127.0.0.1:3001
http://127.0.0.1:5173
http://127.0.0.1:4173
http://127.0.0.1:5000
http://127.0.0.1:8080
```

All checks returned unavailable or non-HTTP responses.

Per the Phase 13I.1 constraint, Codex did not start `pnpm dev`, did not start a long-running server, and did not stop or kill any process.

## Human Runtime Smoke Instructions

When the human is ready to run the browser smoke, start the local app explicitly and log in as a user assigned `KEPALA_SUB_BAGIAN_UMUM`.

Use an existing safe local-development workflow document that is:

- `COMPLETED`;
- eligible for `Pengklasifikasian Dokumen`;
- not already archived or classified;
- safe to mutate in local development.

Use a valid active `klasifikasi_id` / `Jenis Pembayaran`.

From the logged-in same-origin browser DevTools console:

```js
await fetch('/api/arsiparis/dokumen/<DOKUMEN_ID>/archive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    klasifikasi_id: '<KLASIFIKASI_ID>',
  }),
}).then(async (r) => ({ status: r.status, body: await r.json() }))
```

Expected:

- status `200`;
- existing success response shape remains compatible;
- no `Nomor Surat`, `Nomor SPM`, or final retention metadata is required for initial classification.

## Safe DB Verification Checklist

Use safe aggregate/count checks or Drizzle Studio visual confirmation only. Do not record cookies, session values, DB URLs, env values, SQL params, raw rows, file paths, tokens, storage roots, or secrets.

Verify:

- one `OPEN` berkas exists for the selected `klasifikasi_id`;
- one `WORKFLOW` `berkas_arsip_item` exists for the selected document;
- the selected document status became `ARCHIVED`;
- no folder became `CLOSED`;
- `Nomor SPM` and final retention metadata remain empty for the `OPEN` berkas.

Record only generic status/count outcomes and intentionally chosen smoke identifiers already known to the human.

## Smoke Result Summary

Runtime smoke result:

```text
Result: BLOCKED
Reason: no local app server was already running, and this phase forbids starting pnpm dev without explicit human permission.
Archive request status: not performed
Berkas OPEN created/reused: not verified at runtime
WORKFLOW item created: not verified at runtime
Document status changed to ARCHIVED: not verified at runtime
No folder close/Nomor SPM/retention happened: not verified at runtime
```

## Negative Duplicate/Retry Smoke

Skipped because the positive runtime mutation smoke was blocked. Re-running the same archive request should be attempted only after a successful positive smoke on intentionally selected local-dev data.

Expected duplicate/retry behavior:

- safe rejection, likely because the document is no longer `COMPLETED`, already has an archive row, or the berkas item assignment conflicts;
- no raw DB error, SQL params, raw rows, paths, cookies, session values, tokens, env values, storage roots, or secrets are exposed.

Follow-up Phase 13I.1a classified the confusing already-`ARCHIVED` retry response as expected behavior with error-copy hardening: `ARCHIVED` remains invalid for re-archive, but the route now returns `Dokumen sudah diarsipkan` for that status.

## Performed Or Skipped

Performed:

- clean working tree gate;
- source and test review;
- targeted unit test command;
- local server reachability check;
- docs-only smoke report.

Skipped:

- browser/manual runtime smoke, because no local app server was already running;
- positive archive request smoke;
- safe aggregate DB verification;
- duplicate/retry smoke;
- broad build, broad tests, E2E, migrations, seeds, cleanup scripts, storage operations, and route generation.

## Follow-Up

Run the browser smoke pass once the local app is explicitly started by the human and a valid `KEPALA_SUB_BAGIAN_UMUM` account, safe `COMPLETED` workflow document, and active `klasifikasi_id` are available.

If the runtime smoke passes, record only endpoint path, HTTP status, generic body shape, and safe state/count summaries. If it fails, create a targeted Phase 13I.1a fix phase scoped only to the failing behavior.

## Validation

Required validation for this documentation/smoke-report phase:

```bash
git status --short --branch
git diff --check
git diff --name-only
git diff -- .env .env.migration package.json pnpm-lock.yaml
git diff -- drizzle supabase src/routeTree.gen.ts
```

Expected result:

- docs-only changes;
- no env/package/drizzle/supabase/routeTree changes;
- no UI, backfill, schema, migration, package, env, storage, cleanup, route generation, or Supabase runtime changes;
- no commit.
