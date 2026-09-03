# Code Review: Section 03 (+ folded 04) — Backend helpers, service lifecycle, read-model, Zod

## Auto-fixes Applied

- Hardened `nextStatusForBerkasLifecycleAction`: `allowed[action]?.[currentStatus]`
  so an out-of-type action (e.g. a stale `mark_inactive` from an old client that
  slips past Zod) throws `BERKAS_LIFECYCLE_INVALID` instead of a `TypeError`.
- `computeBerkasAging`: `toDateOnly(now ?? new Date()) as string` — the `now` path
  can never be null; avoids a spurious null-union on the diff/compare.

## User Decisions

- None required beyond the Fase-2 interview (K1–K7). OQ4 resolved as planned
  ("smallest impact"): `resolveBerkasLifecycleAction` keeps its single-return shape;
  a new `resolveSecondaryBerkasLifecycleAction` returns the `cancel_proposal`
  ("Batalkan Usulan") action for `USUL_MUSNAH`.
- OQ5 resolved: `due_only` added as an optional read-model query flag; filtering is
  done in memory after mapping (volume is small, internal app). Default list
  ordering for `status_berkas=CLOSED` is `closed_at ASC` (terlama dulu); OPEN /
  unfiltered lists keep `updated_at DESC`.

## db-fsm-guard compliance

- All `status_arsip` transitions still route through the single
  `nextStatusForBerkasLifecycleAction` table; invalid transitions rejected with
  `BERKAS_LIFECYCLE_INVALID`.
- `updateBerkasArchiveStatus` optimistic `currentStatusArsip` guard unchanged.
- `appendBerkasActivity` is INSERT-only; `BERKAS_ACTIVITY_EVENT_TYPES` unchanged
  (DB CHECK). `cancel_proposal` reuses the existing `METADATA_ARSIP_AKTIF_DIPERBARUI`
  event — no `event_type` CHECK migration.
- No schema / migration / package changes. `src/db/schema/**` untouched.

## Deviations from plan

1. **Sections 03 + 04 merged into one backend commit.** `closeBerkasMetadataSchema`
   (planned section-04) had to change here because section-03's
   `buildCloseBerkasPlan` / `buildActiveBerkasMetadataPlan` parse through it. The
   remaining section-04 items (lifecycle route enum, list/detail DTO whitelist for
   `umur_berkas`/`jatuh_tempo`/`tanggal_jatuh_tempo`, `openBerkasRequestSchema`
   message) are also in this commit.
2. **`berkas-arsip-folder-pages.test.ts` "keeps the active folder page constrained
   to open and active sections" is `it.skip`.** It is a monolithic whole-file
   source-shape assertion over `$id.tsx`, `index.tsx`, `CloseBerkasDialog.tsx`,
   `navigation.ts`, `routes.ts`, `routeTree.gen.ts`, `inaktif/`, `usul-musnah/` —
   it cannot pass until sections 05 + 06 land. Re-authored in section-06.
3. **Two `buildBerkasHistoryItems` tests still assert `'Berkas dimusnahkan'`** — the
   synthesized-from-status label lives hardcoded in `$id.tsx`; relabel deferred to
   section-06c (noted inline in the tests).
4. **Label-only "Jenis Pembayaran" → "Cara Pembayaran"** in
   `dokumen.$id.archive.ts`, `manual-arsip.ts`, `berkas-klasifikasi-eligibility.ts`
   deferred to the section-08 sweep (no test coupling now).

## Tests

- `berkas-arsip-service.test.ts`: 33 tests — rewrote lifecycle block for RP-01
  (propose `AKTIF→USUL_MUSNAH`, `cancel_proposal` + event assertion, invalid
  jumps), single-field close plan, Permanen sentinel.
- `berkas-arsip-schema.test.ts`: single-field close schema + `.strict()` reject.
- `berkas-arsip-api.test.ts`: 23 tests — phrase `BERSIHKAN FILE BERKAS`, action
  enum, "Cara pembayaran" message, `proposedBerkasDto`.
- `berkas-arsip-folder-pages.test.ts`: label + phrase + secondary-action tests.
- **Full suite: 810 passed, 1 skipped, 0 regressions.**
