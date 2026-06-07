# Phase 15L.3D.2 - Master Klasifikasi UI Leaf/Induk Visual & Selection Polish

Date: 2026-06-08

## 1. Status

Implemented.

No commit or push was performed.

## 2. Scope

Included:

- Master Klasifikasi Arsip UI/presentation polish only.
- Parent/leaf visual badges derived from child existence.
- Active/nonaktif visual language using `is_active` when present in the UI data shape.
- Detail panel clarity for type, status, hierarchy path, child count, and Jenis Pembayaran usability.
- Soft-deactivate wording alignment for the current `DELETE` endpoint behavior.
- Focused source guard.

Excluded:

- API route behavior changes.
- Backend service behavior changes.
- Schema, migration, package, env, DB, Drizzle, Supabase, and route-tree changes.
- Backend leaf-only validation.
- Delete safety, usage audit, or Aktifkan/reactivation behavior.
- Hard delete implementation.

## 3. Prototype References Inspected

- `D:\Temp\dms-ai-studio-final\src\components\roles\ArchivistView.tsx`
- User screenshots for the prototype Master Klasifikasi page and add-child modal.

Prototype direction used:

- left tree and right detail panel;
- explicit `Klasifikasi Induk` and `Pilihan Akhir` badges;
- hierarchy path in detail;
- `Dipakai Jenis Pembayaran?` messaging;
- add-child modal parent context.

Prototype permanent-delete language was not adopted because current real app behavior is soft deactivation.

## 4. Approved Baseline Pages Inspected

- `docs/migration/phase-15l3c1-approved-archive-entry-pattern-baseline.md`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l3b-cross-role-document-detail-visual-parity.md`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`

## 5. Files Changed

- `src/routes/arsiparis/klasifikasi.tsx`
- `tests/unit/arsiparis/klasifikasi-ui-source.test.ts`
- `docs/migration/phase-15l3d2-master-klasifikasi-ui-leaf-induk-polish.md`

## 6. Parent/Leaf Display Behavior

- `Klasifikasi Induk` is derived from `children.length > 0`.
- `Pilihan Akhir` is derived from `children.length === 0`.
- No stored/manual type field was added or used.
- Tree rows and detail panel both show the derived type.
- Parent nodes are described as structural and not operationally selectable as Jenis Pembayaran.

## 7. Active/Nonaktif Display Behavior

- `is_active !== false` displays as `Aktif`.
- `is_active === false` displays as `Nonaktif`.
- Inactive nodes remain visually distinct if future API responses include them.
- Current API still returns active rows only, so inactive visibility remains limited by backend/API behavior.

## 8. Delete/Deactivate Wording Changes

- Visible action copy now says `Nonaktifkan`, not hard-delete `Hapus`.
- Confirmation modal title is `Nonaktifkan Klasifikasi?`.
- Modal copy explains the classification is removed from operational selection while readable history remains.
- Existing request method and endpoint are preserved: `DELETE /api/arsiparis/klasifikasi/$id`.
- No hard delete or Aktifkan behavior was introduced.

## 9. Limitations

- `GET /api/arsiparis/klasifikasi` still returns active rows only.
- If inactive rows are not returned, Master Klasifikasi cannot yet display inactive classifications.
- Child existence is derived from the returned tree only. If inactive children are hidden by API filtering, UI can still misclassify a parent as a leaf until backend/API support is added.
- Usage counts are not available; the UI does not invent counts.
- Backend can still accept direct parent submissions until Phase 15L.3D.3 implements server-side leaf-only validation.

## 10. Behavior Preserved

- Existing list fetch remains `GET /api/arsiparis/klasifikasi`.
- Existing create, update, and soft-deactivate API calls remain unchanged.
- Root `kode === '000'` remains fixed in UI.
- Existing modal success refresh behavior remains.
- Operational Pengklasifikasian Dokumen and Penambahan Dokumen APIs were not changed.

## 11. API/Backend Changes

Expected none.

- No API route files were modified.
- No backend helper/service files were modified.
- No schema or migration files were modified.
- No request or response contract was intentionally changed.

## 12. Validation Performed

Passed:

```powershell
pnpm test tests/unit/arsiparis
pnpm test tests/unit/components/ui-foundation.test.ts
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

Results:

- `tests/unit/arsiparis`: 18 files, 274 tests passed.
- `tests/unit/components/ui-foundation.test.ts`: 1 file, 4 tests passed.
- `git diff --check`: passed; Git reported only the expected LF-to-CRLF working-copy warning for `src/routes/arsiparis/klasifikasi.tsx`.
- Changed tracked file from `git diff --name-only`: `src/routes/arsiparis/klasifikasi.tsx`.
- Protected-file diff output: empty.

Additional check:

- `pnpm exec tsc --noEmit --pretty false` was run and failed on pre-existing repository-wide TypeScript errors in unrelated files such as `src/components/dokumen/AttachmentEditor.tsx`, storage/file-access helpers, route auth wrappers, retained `supabase/functions`, and existing tests.
- No TypeScript error in that output pointed to `src/routes/arsiparis/klasifikasi.tsx`.

Manual browser QA remains pending.

## 13. Manual QA Checklist

1. Open Master Klasifikasi Arsip.
2. Confirm parent nodes show `Klasifikasi Induk`.
3. Confirm leaf nodes show `Pilihan Akhir`.
4. Confirm selected detail panel shows type, child count, Jenis Pembayaran usability, and status.
5. Confirm Klasifikasi Induk is visually clear as structural, not operational selection.
6. Confirm action wording says `Nonaktifkan`, not misleading hard `Hapus`.
7. Confirm no hard-delete behavior was introduced.
8. Confirm 390px mobile remains usable without horizontal overflow.

## 14. Future Phases

- 15L.3D.3 Backend Leaf-Only Validation.
- 15L.3D.4 Delete Safety and Nonaktif/Aktifkan Klasifikasi.
