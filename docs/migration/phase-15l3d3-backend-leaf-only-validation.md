# Phase 15L.3D.3 - Backend Leaf-Only Validation for Archive Classification

Date: 2026-06-08

## 1. Status

Implemented pending human retest.

No commit or push was performed.

## 2. Scope

Included:

- server-side active-leaf validation for operational archive classification selection;
- shared validation helper for Jenis Pembayaran / Klasifikasi Arsip selection;
- validation wiring for workflow Pengklasifikasian Dokumen;
- validation wiring for manual Penambahan Dokumen;
- validation wiring in berkas open/reuse service logic;
- focused unit tests for helper, service bypass prevention, workflow route rejection, and manual route rejection.

Excluded:

- schema, migration, package, env, route-tree, DB, Drizzle, and Supabase changes;
- delete safety, Nonaktifkan/Aktifkan backend behavior, or hard delete;
- archive lifecycle changes;
- UI visual changes.

## 3. Audit Risks Addressed

This phase addresses the Phase 15L.3D.1 backend risk that parent classifications could be submitted by a manipulated client even though the UI visually treats them as structural nodes.

It also addresses the open-berkas bypass risk where an existing `OPEN` berkas could previously be returned before the selected classification was revalidated as active and operationally selectable.

## 4. Helper / Validation Approach

The shared helper lives in:

- `src/lib/archive/berkas-klasifikasi-eligibility.ts`

It validates an operational classification id by checking:

- the classification row exists;
- `is_active` is true;
- no child row exists for the classification id.

The helper returns only a safe snapshot:

- `id`
- `kode`
- `nama`

Safe user-facing errors:

- `Klasifikasi tidak ditemukan.`
- `Klasifikasi tidak aktif.`
- `Klasifikasi induk tidak dapat dipilih sebagai Jenis Pembayaran. Pilih Pilihan Akhir.`

## 5. Operational Flows Protected

Protected flows:

- Pengklasifikasian Dokumen route/API through `src/routes/api/arsiparis/dokumen.$id.archive.ts`;
- Penambahan Dokumen/manual archive service through `src/lib/manual-arsip.ts`;
- direct/open berkas service behavior through `src/lib/archive/berkas-arsip-service.ts`;
- berkas classification eligibility helper namespace through `src/lib/archive/berkas-klasifikasi-eligibility.ts`.

## 6. Parent / Leaf Rule

The backend rule is:

- any classification with any child row is `Klasifikasi Induk`;
- only a classification with no child rows is `Pilihan Akhir` / leaf.

Child existence is checked against actual child rows in the database, not only the active tree response. A classification with inactive children is still treated as a parent and rejected for operational selection.

## 7. Active / Inactive Rule

Operational archive flows accept only active leaf classifications.

Inactive classifications are rejected with:

```text
Klasifikasi tidak aktif.
```

## 8. Existing Open Berkas Bypass Prevention

`getOrCreateOpenBerkasForKlasifikasi` and `findOpenBerkasForKlasifikasi` now validate the selected classification as active leaf before reading or returning an existing `OPEN` berkas.

This prevents a stale existing open berkas from allowing parent or inactive classifications to remain operationally selectable.

## 9. Files Changed

- `src/lib/archive/berkas-klasifikasi-eligibility.ts`
- `src/lib/archive/berkas-arsip-service.ts`
- `src/lib/archive/berkas-arsip-api.ts`
- `src/lib/manual-arsip.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts`
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`
- `tests/unit/arsiparis/workflow-archive-route.test.ts`
- `tests/unit/arsiparis/manual-arsip-route.test.ts`
- `docs/migration/phase-15l3d3-backend-leaf-only-validation.md`

## 10. Tests Added / Updated

Added or updated coverage for:

- active leaf accepted;
- active parent rejected;
- inactive leaf rejected;
- parent with inactive child represented as parent rejection;
- missing classification rejected;
- existing open berkas cannot bypass leaf validation;
- workflow classification cannot use parent;
- manual Penambahan Dokumen cannot use parent;
- rejection responses avoid SQL/path/storage/token leakage.

## 11. API / Backend Behavior

Operational classification selection now returns safe validation errors before creating or reusing berkas rows.

The response shape remains compatible: APIs still return `{ error: string }` for failures and existing success shapes for valid active leaf selections.

## 12. Behavior Preserved

Preserved:

- `dms_session` auth boundary and existing server-side role checks;
- ADMIN not treated as an operational archive bypass;
- folder-first archive authority;
- existing berkas lifecycle behavior;
- existing file-access and destruction behavior;
- existing UI visual behavior;
- existing package/env/schema/route-tree state.

## 13. Validation Performed

Focused validation performed during implementation:

```powershell
pnpm test tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts
pnpm test tests/unit/arsiparis/berkas-arsip-service.test.ts
pnpm test tests/unit/arsiparis/workflow-archive-route.test.ts
pnpm test tests/unit/arsiparis/manual-arsip-route.test.ts
pnpm test tests/unit/arsiparis
pnpm test tests/unit/components/ui-foundation.test.ts
git status --short --branch
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

Results:

- `tests/unit/arsiparis`: 18 files, 283 tests passed.
- `tests/unit/components/ui-foundation.test.ts`: 1 file, 4 tests passed.
- `git diff --check`: passed; Git reported only expected LF-to-CRLF working-copy warnings.
- `git diff --name-only`: changed tracked files are limited to archive backend/helper/API tests in scope.
- protected-file diff output: empty.

## 14. Protected Files Confirmation

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

Protected diff checks are recorded in the final handoff after execution.

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

## 15. Future Phase

Next related phase:

- Phase 15L.3D.4 - Delete Safety and Nonaktif/Aktifkan Klasifikasi

That future phase should handle usage audit, safe Nonaktif/Aktifkan behavior, and any explicit hard-delete policy if later approved.
