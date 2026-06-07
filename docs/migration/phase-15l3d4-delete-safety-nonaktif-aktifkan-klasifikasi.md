# Phase 15L.3D.4 - Delete Safety and Nonaktif/Aktifkan Klasifikasi

Date: 2026-06-08

## 1. Status

Implemented pending human retest.

No commit or push was performed.

## 2. Scope

Included:

- Master Klasifikasi management tree visibility for active and inactive classifications.
- Nonaktifkan Klasifikasi as the supported soft-deactivation action.
- Aktifkan Kembali action for inactive classifications.
- Server-side deactivation safety for active child classifications.
- Server-side reactivation safety for inactive parent chains.
- Focused route and UI source tests.

Excluded:

- hard delete;
- schema or migration changes;
- package, env, route-tree, DB, Drizzle, or Supabase changes;
- archive lifecycle changes;
- storage, file-access, or destruction behavior changes;
- operational leaf-only validation changes from Phase 15L.3D.3.

## 3. Current Behavior Before Phase

Before this phase:

- `GET /api/arsiparis/klasifikasi` returned active classifications only.
- Master Klasifikasi could not show inactive classifications after soft deactivation.
- `DELETE /api/arsiparis/klasifikasi/$id` set `is_active=false`, but cascaded to active descendants.
- No `Aktifkan Kembali` UI or backend activation path existed.
- Operational dropdowns used `GET /api/arsiparis/klasifikasi?eligible_for_berkas=true`, which already filtered active rows.

## 4. Nonaktifkan Behavior

`DELETE /api/arsiparis/klasifikasi/$id` remains a soft-deactivation endpoint.

Behavior:

- requires same-origin validation;
- requires authenticated local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- does not use `dms_active_role` as authorization proof;
- returns `Klasifikasi tidak ditemukan.` for missing rows;
- rejects root classification;
- rejects an active parent if it still has active children with `Klasifikasi induk masih memiliki sub-klasifikasi aktif.`;
- sets only the selected row to `is_active=false`;
- does not cascade to children;
- returns `Klasifikasi berhasil dinonaktifkan.`;
- treats already inactive rows as idempotent success.

## 5. Aktifkan Kembali Behavior

`PATCH /api/arsiparis/klasifikasi/$id` now accepts `is_active: true`.

Behavior:

- requires same-origin validation;
- requires authenticated local `dms_session`;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- does not use `dms_active_role` as authorization proof;
- finds inactive rows for management reactivation;
- rejects `is_active:false` on PATCH so deactivation safety cannot be bypassed;
- rejects reactivation if any parent in the parent chain is missing or inactive with `Klasifikasi tidak dapat diaktifkan karena induknya masih nonaktif.`;
- sets only the selected row to `is_active=true`;
- does not automatically activate children.

## 6. Management Tree Inactive Visibility

Default `GET /api/arsiparis/klasifikasi` now returns active and inactive classifications for Master Klasifikasi management.

The response includes `is_active` and builds the tree from all returned rows, so inactive children still participate in parent/leaf derivation for the management page.

## 7. Operational Dropdown Behavior Preserved

`GET /api/arsiparis/klasifikasi?eligible_for_berkas=true` remains active-only before berkas eligibility filtering.

Operational dropdowns for Pengklasifikasian Dokumen and Penambahan Dokumen must still show only active classifications that pass the existing Phase 15L.3D.3 active-leaf backend rules.

## 8. Parent/Child Safety Rules

Rules implemented:

- any classification with child rows remains structurally a Klasifikasi Induk in the management tree;
- active parent with active children cannot be nonactivated in this phase;
- no cascade nonactivation is performed;
- reactivation of a child requires the parent chain to be active;
- reactivation of a parent does not activate children.

## 9. Hard Delete Explicitly Not Implemented

No hard-delete classification behavior was added.

No row is physically deleted from `arsip.master_klasifikasi_arsip`.

No UI copy or action for `Hapus permanen` was added.

## 10. Files Changed

- `src/routes/api/arsiparis/klasifikasi/index.ts`
- `src/routes/api/arsiparis/klasifikasi/$id.ts`
- `src/routes/arsiparis/klasifikasi.tsx`
- `tests/unit/arsiparis/klasifikasi-create-route.test.ts`
- `tests/unit/arsiparis/klasifikasi-update-route.test.ts`
- `tests/unit/arsiparis/klasifikasi-ui-source.test.ts`
- `docs/migration/phase-15l3d4-delete-safety-nonaktif-aktifkan-klasifikasi.md`

## 11. Tests Added/Updated

Updated focused coverage for:

- management read includes inactive classifications;
- operational eligible read remains active-only;
- ADMIN-only delete/nonaktif requests remain forbidden;
- PATCH `is_active:false` cannot bypass deactivation safety;
- inactive classification can be reactivated when parent chain is active;
- inactive classification cannot be reactivated when parent chain is inactive;
- parent with active child cannot be nonactivated;
- active leaf/non-parent nonactivation updates only the selected row;
- already inactive nonactivation is idempotent;
- UI source includes `Aktifkan Kembali` and no hard-delete wording.

## 12. API/Backend Behavior

`GET /api/arsiparis/klasifikasi`:

- default management read returns active and inactive rows.

`GET /api/arsiparis/klasifikasi?eligible_for_berkas=true`:

- remains active-only and then applies existing berkas eligibility filtering.

`PATCH /api/arsiparis/klasifikasi/$id`:

- updates existing attributes as before;
- supports `is_active:true`;
- rejects `is_active:false`;
- rejects activation under inactive parent chain.

`DELETE /api/arsiparis/klasifikasi/$id`:

- soft-deactivates selected row only;
- rejects active children;
- does not cascade;
- does not hard-delete.

## 13. UI Behavior

Master Klasifikasi now:

- displays inactive rows returned by the management API;
- shows `Nonaktif` badge for inactive rows;
- keeps inactive rows visually muted but readable;
- shows selected inactive detail as `Nonaktif`;
- shows `Nonaktifkan Klasifikasi` for active non-root rows;
- shows `Aktifkan Kembali` for inactive non-root rows;
- keeps Tambah Induk and Tambah Anak behavior unchanged;
- keeps parent/leaf badges derived from children;
- does not show `Hapus permanen`.

## 14. Validation Performed

Validation performed during implementation:

```powershell
pnpm test tests/unit/arsiparis/klasifikasi-create-route.test.ts
pnpm test tests/unit/arsiparis/klasifikasi-update-route.test.ts
pnpm test tests/unit/arsiparis/klasifikasi-ui-source.test.ts
```

Final requested validation:

```powershell
pnpm test tests/unit/arsiparis
pnpm test tests/unit/components/ui-foundation.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

Results:

- `tests/unit/arsiparis`: 18 files, 290 tests passed.
- `tests/unit/components/ui-foundation.test.ts`: 1 file, 4 tests passed.
- `git diff --check`: passed; Git reported LF-to-CRLF working-copy warnings only.
- `git diff --name-only`: changed tracked files are limited to the scoped API/UI/test files.
- protected-file diff output: empty.

## 15. Manual QA Checklist

1. Open Master Klasifikasi Arsip.
2. Confirm active and inactive classifications are visible.
3. Confirm inactive rows show `Nonaktif` badge and muted style.
4. Confirm active node has `Nonaktifkan Klasifikasi` action.
5. Confirm inactive node has `Aktifkan Kembali` action.
6. Confirm Nonaktifkan does not hard delete row.
7. Confirm inactive row remains visible after nonactivation.
8. Confirm inactive row does not appear in operational Pengklasifikasian/Penambahan dropdown.
9. Confirm Aktifkan Kembali works only when parent chain is active.
10. Confirm parent with active children cannot be nonactivated without cascade.
11. Confirm no hard-delete UI/copy exists.
12. Confirm valid leaf operational flow still works.
13. Confirm parent operational selection remains rejected.

## 16. Protected Files Confirmation

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

## 17. Future Phase

Future phase:

- Master Klasifikasi Regression QA

Recommended QA focus:

- end-to-end Master Klasifikasi active/inactive visibility;
- operational dropdown exclusion for inactive rows;
- parent/leaf derivation with inactive children;
- reactivation under inactive parent rejection;
- no regression to Phase 15L.3D.3 backend leaf-only validation.
