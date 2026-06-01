# Phase 13O.1 - Manual Runtime Smoke Folder-First Archive Pages

Date: 2026-05-29

Status: partially completed; runtime browser/API smoke blocked because no already-running local app server was detected and this phase does not start `pnpm dev` without explicit human approval.

## Scope

Phase 13O.1 is a smoke/report-only verification pass for the Phase 13O folder-first archive pages:

- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `GET /api/arsiparis/berkas`
- `GET /api/arsiparis/berkas/$id`

This phase did not add features and did not change runtime behavior.

## Clean Tree Gate

Initial command:

```bash
git status --short --branch
```

Result:

```text
## migration/postgres-local...origin/migration/postgres-local [ahead 2]
```

No modified or untracked files were present at the start.

## Targeted Tests

Command run:

```bash
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts tests/unit/auth/roles-navigation.test.ts tests/unit/arsiparis/berkas-arsip-read-model.test.ts
```

Result:

```text
3 test files passed.
20 tests passed.
```

Covered expectations include:

- folder-first API routes require local `dms_session`;
- assigned `KEPALA_SUB_BAGIAN_UMUM` is required server-side;
- `ADMIN` alone receives `403`;
- list/detail wrappers delegate to the Phase 13N read model;
- API responses strip `closed_by`, `item_id`, and `canonical_arsip_id`;
- formatter labels remain friendly;
- Kepala Sub Bagian Umum active archive navigation points to `/arsiparis/berkas`;
- old `/arsiparis/aktif` route constant remains available.

## Runtime Smoke

Runtime smoke was not performed.

Reason:

- this phase explicitly must not start `pnpm dev` unless a human approves starting a long-running server;
- no response was detected on common local development ports during harmless localhost probes;
- no browser session was available for logged-in `KEPALA_SUB_BAGIAN_UMUM` smoke verification.

No app process was stopped or killed.

## Manual Browser Instructions

When a human starts or already has the app running, log in as a user assigned `KEPALA_SUB_BAGIAN_UMUM` and verify:

1. Open `/arsiparis/berkas`.
2. Confirm the page title/label says `Pemberkasan Arsip Aktif`.
3. Confirm available `CLOSED` + `AKTIF` folders appear.
4. Confirm friendly labels appear for `Jenis Pembayaran`, `Status Berkas`, `Status Arsip`, `Nomor SPM`, `Jumlah Dokumen`, `Dokumen Workflow`, `Dokumen Manual`, `Total Nominal`, and `Tanggal Ditutup`.
5. Confirm there are no lifecycle, preview, download, or destruction actions.
6. Open detail for one berkas at `/arsiparis/berkas/$id`.
7. Confirm folder metadata and lightweight item cards appear.
8. Confirm item cards show only safe lightweight source metadata.
9. Open `/arsiparis/aktif` and confirm the old compatibility route still resolves.

Manual API checks from a same-origin logged-in browser console:

```js
await fetch('/api/arsiparis/berkas?status_berkas=CLOSED&status_arsip=AKTIF')
  .then(async (r) => ({ status: r.status, body: await r.json() }))
```

Then use one returned local smoke `berkas_id`:

```js
await fetch('/api/arsiparis/berkas/<BERKAS_ID>')
  .then(async (r) => ({ status: r.status, body: await r.json() }))
```

Expected API result:

- list returns status `200` with `body.berkas` as an array;
- detail returns status `200` with `body.berkas.items`;
- detail items use `item_key`, not raw `item_id`;
- no `closed_by`;
- no `canonical_arsip_id`;
- no path, token, storage root, SQL, env, cookie, or session leak.

## Smoke Results

List page `/arsiparis/berkas`: not performed; blocked by no already-running app server.

Detail page `/arsiparis/berkas/$id`: not performed; blocked by no already-running app server.

Old compatibility page `/arsiparis/aktif`: not performed in browser; targeted navigation test confirms the route constant is retained.

API list `GET /api/arsiparis/berkas`: not performed against runtime; targeted API unit test passed.

API detail `GET /api/arsiparis/berkas/$id`: not performed against runtime; targeted API unit test passed.

Negative auth smoke with `ADMIN` only: not performed against runtime; targeted API unit test confirms `403`.

Secrets/path/token leak check: runtime observation was not possible. Targeted unit tests assert safe response DTOs and no `closed_by`, `item_id`, `canonical_arsip_id`, path, token, storage root, SQL, env, cookie, or session strings in mocked API/read-model outputs.

## Non-Changes

No write behavior, lifecycle mutation, de-transitionalization, file-access behavior, preview/download behavior, destruction behavior, storage helper, schema, migration, package, env, seed, cleanup, database row, physical file, or Supabase runtime behavior was changed.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain.

## Follow-Up

Perform the browser/API runtime smoke after a human explicitly starts the local app or confirms an already-running app server, using a session assigned `KEPALA_SUB_BAGIAN_UMUM` and local data with at least one `CLOSED` berkas where `status_arsip='AKTIF'`.
