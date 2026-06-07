# Phase 15L.3D.5 - Master Klasifikasi Regression QA and Status Badge Polish

Date: 2026-06-08

## 1. Status

Implemented pending human retest.

No commit or push was performed.

## 2. Scope

Included:

- bounded Master Klasifikasi visual polish for status badges;
- focused source guard coverage for active/nonaktif status tone and parent/leaf badge separation;
- regression validation for Master Klasifikasi UI/API/helper behavior through existing unit suites.

Excluded:

- hard delete;
- schema or migration changes;
- package, env, route-tree, DB, Drizzle, or Supabase changes;
- archive lifecycle changes;
- operational dropdown behavior changes;
- backend API behavior changes.

## 3. Status Badge Polish

`Aktif` status now uses a green success tone:

- `border-emerald-200`
- `bg-emerald-50`
- `text-emerald-700`

`Nonaktif` remains muted/neutral:

- `border-zinc-200`
- `bg-zinc-100`
- `text-zinc-600`

Structural type badges remain distinct from status badges:

- `Klasifikasi Induk` uses amber structural styling.
- `Pilihan Akhir` uses sky structural/selectable-type styling.

This prevents `Pilihan Akhir` from sharing the same green success tone as `Aktif`.

## 4. Regression Checks

Confirmed by source guards and focused test suites:

- Master Klasifikasi source still contains `Klasifikasi Induk`.
- Master Klasifikasi source still contains `Pilihan Akhir`.
- Master Klasifikasi source still contains `Aktif`.
- Master Klasifikasi source still contains `Nonaktif`.
- `Aktif` badge source uses emerald/green styling.
- `Nonaktif` badge source uses muted zinc styling.
- `Klasifikasi Induk` and `Pilihan Akhir` badges use separate structural tones.
- action copy remains `Nonaktifkan Klasifikasi`.
- action copy remains `Aktifkan Kembali`.
- no `Hapus permanen` UI copy is present.
- Master Klasifikasi UI source does not fetch or alter `eligible_for_berkas`.
- route/API tests continue covering active/inactive management reads, operational active-only eligible reads, non-cascade reactivation, non-cascade deactivation, and no hard delete.
- backend helper tests continue covering parent rejection, inactive rejection, and parent-with-inactive-child rejection.

## 5. Files Changed

- `src/routes/arsiparis/klasifikasi.tsx`
- `tests/unit/arsiparis/klasifikasi-ui-source.test.ts`
- `docs/migration/phase-15l3d5-master-klasifikasi-regression-qa-status-badge-polish.md`

## 6. Behavior Preserved

Preserved:

- Master Klasifikasi parent/leaf derivation from child existence.
- `Klasifikasi Induk` remains structural.
- `Pilihan Akhir` remains the selectable-type label.
- operational dropdowns continue using `eligible_for_berkas=true`.
- operational dropdowns remain active-leaf-only through backend helper validation and eligibility filtering.
- inactive classifications remain excluded from operational dropdowns.
- parent classifications remain rejected by backend operational selection validation.
- parent with inactive child remains treated as parent by backend validation.
- reactivation does not cascade to children.
- deactivation does not cascade and does not hard delete.
- `dms_session` remains the server auth boundary.

## 7. API / Backend Changes

Expected none.

No API route, backend helper, service, schema, migration, package, env, route-tree, DB, Drizzle, Supabase, storage, file-access, or archive lifecycle code was changed in this phase.

## 8. Validation Performed

Passed:

```powershell
pnpm test tests/unit/arsiparis
pnpm test tests/unit/components/ui-foundation.test.ts
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

Results:

- `tests/unit/arsiparis`: 18 files, 291 tests passed.
- `tests/unit/components/ui-foundation.test.ts`: 1 file, 4 tests passed.
- `git diff --check`: passed; Git reported LF-to-CRLF working-copy warnings only for touched UI/test files.
- `git diff --name-only`: tracked diffs are limited to `src/routes/arsiparis/klasifikasi.tsx` and `tests/unit/arsiparis/klasifikasi-ui-source.test.ts`; the new phase doc is untracked until added.
- protected-file diff output: empty.

## 9. Manual QA Checklist

1. Open Master Klasifikasi Arsip.
2. Confirm active classifications show green `Aktif` badge.
3. Confirm inactive classifications show muted `Nonaktif` badge.
4. Confirm `Klasifikasi Induk` and `Pilihan Akhir` badges remain visually distinct from status badges.
5. Confirm active leaf still appears in operational dropdowns.
6. Confirm inactive leaf does not appear in operational dropdowns.
7. Confirm parent/induk does not appear as selectable Jenis Pembayaran.
8. Confirm `Nonaktifkan Klasifikasi` still works.
9. Confirm `Aktifkan Kembali` still works.
10. Confirm no hard-delete copy/action appears.
11. Check 390px mobile.

## 10. Protected Files Confirmation

This phase must not modify:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

Protected diff check is expected to remain empty.

Protected diff check was empty. These files/trees were not modified:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`
