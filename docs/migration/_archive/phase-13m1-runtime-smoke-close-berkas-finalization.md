# Phase 13M.1 - Runtime Smoke Close Berkas Finalization

Date: 2026-05-29

Status: partially completed; targeted tests passed, runtime smoke blocked because no local app server was already running.

## Phase Status

Phase 13M.1 is a bounded local runtime smoke/report phase for Phase 13M close-folder finalization behavior.

This phase assumes the human has already applied:

```text
drizzle/0008_berkas_status_arsip_schema_foundation.sql
```

No migration, seed, backfill, schema, package, route generation, storage, UI, lifecycle-transition, destruction, or Supabase runtime change was performed.

## Tests Run

Command:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-service.test.ts tests/unit/arsiparis/berkas-arsip-api.test.ts tests/unit/arsiparis/berkas-arsip-schema.test.ts
```

Result:

```text
3 test files passed
31 tests passed
```

Covered behavior includes:

- close of a non-empty `OPEN` berkas returns `status_berkas='CLOSED'`;
- close sets folder lifecycle `status_arsip='AKTIF'`;
- close response uses the safe berkas DTO;
- invalid close metadata is rejected before service work;
- empty berkas and already-closed berkas are mapped to safe conflict responses;
- wrong-role and `ADMIN`-only requests are rejected server-side;
- unsafe requests remain same-origin protected.

## Runtime Smoke Status

Runtime smoke was not performed in this pass.

Reason: no local app server was already listening on the checked development ports, and this phase explicitly does not start `pnpm dev` unless the human approves a long-running server.

Because runtime smoke was blocked, this pass did not send a close request, did not select a berkas, and did not mutate local database rows.

## Human Manual Smoke Procedure

Prerequisites:

- app server already running locally;
- human logged in through the browser as a user assigned `KEPALA_SUB_BAGIAN_UMUM`;
- one safe local-development berkas that is `OPEN`, has `status_arsip IS NULL`, has at least one item, and is safe to close.

From the same-origin browser DevTools console:

```js
await fetch('/api/arsiparis/berkas/<BERKAS_ID>/close', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nomor_spm: 'SPM-SMOKE-13M-001/2026',
    retensi_aktif: '1 Tahun',
    retensi_inaktif: '3 Tahun',
    closed_at: '2026-05-29'
  })
}).then(async (r) => ({ status: r.status, body: await r.json() }))
```

Expected close result:

- HTTP status `200`;
- safe DTO reports `status_berkas='CLOSED'`;
- safe DTO reports `status_arsip='AKTIF'`;
- `nomor_spm`, `retensi_aktif`, `retensi_inaktif`, `closed_at`, and `closed_by` are present;
- calculated retention end dates are present;
- no SQL, raw DB error, stack trace, env value, cookie, session value, token, file path, storage root, or physical path is exposed.

After a successful close, verify through Drizzle Studio visual confirmation or safe aggregate/count checks only:

- the selected berkas is `CLOSED`;
- folder lifecycle is `AKTIF`;
- final metadata is filled;
- berkas items remain present;
- there is no folder lifecycle move to `INAKTIF`, `USUL_MUSNAH`, or `DIMUSNAHKAN`;
- there is no file/storage mutation;
- there is no physical deletion;
- there is no canonical `arsip.arsip` de-transitionalization change.

Optional negative smoke after a successful close:

```js
await fetch('/api/arsiparis/berkas/<BERKAS_ID>/close', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nomor_spm: 'SPM-SMOKE-13M-001/2026',
    retensi_aktif: '1 Tahun',
    retensi_inaktif: '3 Tahun',
    closed_at: '2026-05-29'
  })
}).then(async (r) => ({ status: r.status, body: await r.json() }))
```

Expected duplicate-close result:

- safe rejection, likely HTTP `409`;
- no raw SQL, raw DB error, stack trace, env value, cookie, session value, token, path, storage root, or secret leakage.

## Smoke Result Summary

This pass did not perform runtime/manual smoke, so runtime values remain unverified in the local database:

- close request status: not performed;
- `status_berkas='CLOSED'`: not runtime-verified;
- `status_arsip='AKTIF'`: not runtime-verified;
- final metadata filled: not runtime-verified;
- duplicate close rejection: skipped because no successful runtime close was performed.

Static targeted tests confirm the expected close behavior at service/API/schema level.

## Boundaries Confirmed

Phase 13M.1 did not add or change:

- UI;
- backfill;
- schema or migration files;
- package or env files;
- route generation;
- storage or file behavior;
- lifecycle transitions beyond initial `AKTIF`;
- physical deletion;
- Supabase runtime behavior.

No commit was made.
