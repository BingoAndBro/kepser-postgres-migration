# Phase 13J.1 - Runtime Smoke Penambahan Dokumen to Open Berkas

Date: 2026-05-29

Status: partially completed; runtime smoke blocked because no existing local app server was detected and this phase did not approve starting `pnpm dev`.

## Phase Scope

Phase 13J.1 is a bounded local smoke/report phase for the Phase 13J `Penambahan Dokumen` to `OPEN` berkas integration.

This phase is smoke/report only. It does not add features, UI, schema, migrations, backfill, seeds, storage behavior, cleanup, package changes, route generation, or Supabase fallback.

## Clean Working Tree Gate

Initial command:

```bash
git status --short --branch
```

Result:

```text
## migration/postgres-local...origin/migration/postgres-local [ahead 1]
```

The working tree was clean at start. Git also reported a local global-ignore permission warning outside the repository.

## Targeted Static Tests

Command run:

```bash
pnpm test tests/unit/arsiparis/manual-archive-canonical.test.ts tests/unit/arsiparis/manual-arsip-route.test.ts tests/unit/arsiparis/berkas-arsip-service.test.ts
```

Result:

```text
3 test files passed
106 tests passed
```

Covered behavior includes:

- `manual_arsip` create validation and `KEPALA_SUB_BAGIAN_UMUM` RBAC, with `ADMIN` rejected as a substitute.
- same-origin protection before unsafe manual create work.
- transitional create behavior without required final archive metadata.
- canonical `arsip.arsip` `source_type='MANUAL'` creation.
- `manual_arsip.canonical_arsip_id` bridge update.
- creation/reuse path for `OPEN` berkas by `klasifikasi_id`.
- `MANUAL` berkas item insertion with the canonical bridge populated.
- duplicate source assignment mapped to the safe conflict message.
- attachment upload/preview/download behavior remaining separate from parent create.
- no file path, token, SQL, env, or storage-root data in tested safe responses.

## Runtime Smoke

Runtime browser/API smoke was not performed.

Reason:

- The phase explicitly disallows starting `pnpm dev` unless the human approves a long-running server.
- A local listener check did not find an existing app server on the checked local development ports.
- Existing `node` processes were present, but no matching app listener was detected.

No browser UI submission, DevTools fetch, upload, preview, download, or direct runtime API create was performed by Codex in this phase.

## Runtime Result Matrix

Because runtime smoke was blocked, the following items are not claimed as runtime-verified:

| Check | Runtime Result |
|---|---|
| manual create request status | not run |
| `manual_arsip` created | not runtime-verified |
| canonical `MANUAL` row created | not runtime-verified |
| `manual_arsip.canonical_arsip_id` linked | not runtime-verified |
| `OPEN` berkas created or reused | not runtime-verified |
| `MANUAL` item created | not runtime-verified |
| folder remained `OPEN` | not runtime-verified |
| no `Nomor SPM` was collected or filled | not runtime-verified |
| no retention metadata was collected or filled | not runtime-verified |
| no folder close occurred | not runtime-verified |

These behaviors remain covered by the targeted unit tests listed above and should be human-smoked through the app once an approved local server is available.

## Manual Smoke Instructions

When a local app server is already running or the human explicitly approves starting one, perform this from a browser session logged in as a user assigned `KEPALA_SUB_BAGIAN_UMUM`.

Use the existing `Penambahan Dokumen` UI if available:

1. Open the current manual document add page.
2. Fill `Nama Dokumen` with `SMOKE Manual Berkas 13J.1`.
3. Choose one safe active `Kategori`.
4. Set `Tanggal Dokumen/Sumber` to a safe local date.
5. Choose one safe active `Jenis Pembayaran`.
6. Set `Nominal Realisasi` to a safe small local-development value.
7. Fill `Keterangan` with `Smoke test Phase 13J.1`.
8. Leave `Lampiran` empty for the first smoke.
9. Submit.

Expected UI/API behavior:

- create succeeds;
- no `Nomor SPM` field is required;
- no final retention fields are required;
- no attachment is required.

If the UI is awkward, use browser DevTools from the logged-in same-origin page and inspect the existing `POST /api/arsiparis/manual-arsip` request schema before issuing a fetch. Do not guess field names.

## Safe Verification Guidance

Use Drizzle Studio or safe aggregate/count checks only. Do not print raw rows, large DTOs, cookies, sessions, tokens, env values, storage roots, physical paths, logical paths, SQL params, secrets, or password hashes.

Verify:

- one new `manual_arsip` parent row exists for the smoke document;
- one linked canonical `arsip.arsip` row exists with `source_type='MANUAL'`;
- `manual_arsip.canonical_arsip_id` points to that canonical row;
- one `OPEN` berkas exists or was reused for the chosen `klasifikasi_id`;
- one `berkas_arsip_item` exists with `source_type='MANUAL'`;
- the item has the new `manual_arsip_id`;
- the item has the canonical bridge populated when available;
- the berkas remains `OPEN`;
- `nomor_spm`, `retensi_aktif`, `retensi_inaktif`, `closed_at`, and `closed_by` remain empty for the `OPEN` berkas.

## Negative Duplicate Smoke

Skipped.

Reason: normal manual create creates a fresh `manual_arsip` source each time, so duplicate berkas-item conflict is not naturally exercised through the UI without extra setup or direct DB manipulation. The duplicate conflict path is covered by targeted unit tests.

## Changes Made

Documentation only:

- added this smoke report.
- added no runtime behavior.
- added no code changes.
- added no schema or migration changes.
- added no package or lockfile changes.
- added no route tree changes.
- added no UI changes.
- added no backfill, seed, cleanup, or storage changes.
- added no Supabase runtime/package dependency or fallback.

## Follow-Up

Run the browser/manual smoke after the human confirms an already-running app URL or explicitly approves starting the long-running local dev server.
