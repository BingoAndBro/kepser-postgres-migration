# Phase 15L.3D.1 - Master Klasifikasi Leaf/Parent Rule and Delete Safety Audit

Date: 2026-06-08

## 1. Status

Audit/planning only.

No runtime behavior, API behavior, schema, migration, package, route-tree, DB, Drizzle, Supabase, environment, source UI, deletion, deactivation, commit, or push changes are included.

## 2. Scope

This phase audits Master Klasifikasi Arsip and the operational Jenis Pembayaran selection paths for:

- automatic Klasifikasi Induk versus Pilihan Akhir/Leaf detection;
- leaf-only selection for Jenis Pembayaran / Klasifikasi Arsip;
- delete safety for used classifications;
- future Nonaktif/Aktifkan behavior.

The folder-first archive model remains authoritative. Master Klasifikasi Arsip leaf nodes are the source for Jenis Pembayaran in Pengklasifikasian Dokumen, Penambahan Dokumen, and berkas creation/attachment flows.

## 3. Current Implementation Map

Master data schema:

- `src/db/schema/arsip/klasifikasi-arsip.ts`
  - table: `arsip.master_klasifikasi_arsip`
  - fields: `id`, `nama`, `deskripsi`, `is_active`, `created_at`, `parent_id`, `kode`
  - self-FK: `parent_id` references `master_klasifikasi_arsip.id` with `on delete set null`
  - no stored classification type field exists.

Folder-first archive references:

- `src/db/schema/arsip/berkas-arsip.ts`
  - `berkas_arsip.klasifikasi_id` references `master_klasifikasi_arsip.id` with `onDelete: restrict`
  - `berkas_arsip` stores `klasifikasi_kode_snapshot` and `klasifikasi_nama_snapshot`
  - `berkas_arsip_item` references source documents, not classification directly.
- `src/db/schema/arsip/manual-arsip.ts`
  - `manual_arsip.klasifikasi_id` references `master_klasifikasi_arsip.id` with `onDelete: set null`
  - `manual_arsip` stores `klasifikasi_kode_snapshot` and `klasifikasi_nama_snapshot`.

Master Klasifikasi UI:

- `src/routes/arsiparis/klasifikasi.tsx`
  - tree page at `/arsiparis/klasifikasi`
  - fetches `GET /api/arsiparis/klasifikasi`
  - creates via `POST /api/arsiparis/klasifikasi`
  - updates via `PATCH /api/arsiparis/klasifikasi/$id`
  - deletes/deactivates via `DELETE /api/arsiparis/klasifikasi/$id`.

Classification API:

- `src/routes/api/arsiparis/klasifikasi/index.ts`
  - `GET /api/arsiparis/klasifikasi`
  - `GET /api/arsiparis/klasifikasi?eligible_for_berkas=true`
  - `POST /api/arsiparis/klasifikasi`
- `src/routes/api/arsiparis/klasifikasi/$id.ts`
  - `PATCH /api/arsiparis/klasifikasi/$id`
  - `DELETE /api/arsiparis/klasifikasi/$id`.

Operational selection paths:

- Pengklasifikasian Dokumen UI: `src/routes/arsiparis/dokumen/$id/index.tsx`
- Pengklasifikasian Dokumen API: `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- Penambahan Dokumen UI: `src/routes/arsiparis/penambahan-arsip.tsx`
- Penambahan Dokumen API/service: `src/routes/api/arsiparis/manual-arsip/index.ts`, `src/lib/manual-arsip.ts`
- Direct open berkas API/service: `src/routes/api/arsiparis/berkas/open.ts`, `src/lib/archive/berkas-arsip-service.ts`
- Berkas eligibility helper: `src/lib/archive/berkas-klasifikasi-eligibility.ts`.

## 4. Prototype Behavior Summary

Prototype inspected:

- `D:\Temp\dms-ai-studio-final\src\components\roles\ArchivistView.tsx`

Prototype Master Klasifikasi behavior:

- labels nodes with children as `Induk` / `Klasifikasi Induk`;
- labels nodes without children as `Pilihan Akhir (Leaf)`;
- explains that leaf-level classifications act as active Jenis Pembayaran;
- shows whether a node is used as Jenis Pembayaran based on child existence;
- disables delete when a node has child classifications;
- warns that used classifications should not be deleted because it can damage berkas history;
- models deletion as permanent in the prototype, but the current app uses soft deactivation.

The prototype is useful for visual/status language, but current runtime must prefer folder-first data integrity over prototype-only permanent deletion behavior.

## 5. Current Parent/Leaf Detection Behavior

Current schema has no stored `type`, `node_type`, or equivalent field. There is no stored conflict between a type field and child existence.

Current source of truth is derived:

- API builds a tree from active rows only.
- UI treats `node.children.length > 0` as parent/Induk.
- UI treats `node.children.length === 0` as selectable leaf behavior in operational dropdowns.
- Master route uses icons based on child existence, but does not yet show explicit `Klasifikasi Induk` / `Pilihan Akhir` badges.
- Root is inferred from `kode === '000'`, not from a dedicated field.

Important gap: because `GET /api/arsiparis/klasifikasi` filters `is_active = true`, inactive children are invisible. A classification with inactive children can appear as a leaf in the current active-only tree even though the physical child relation proves it has children. Safer future rule: any child row, active or inactive, makes the node a Klasifikasi Induk for structural/delete safety; operational selection should require active and no child rows.

## 6. Current Operational Selection Behavior

Both approved entry pages fetch:

```text
GET /api/arsiparis/klasifikasi?eligible_for_berkas=true
```

Current eligibility behavior:

- active classifications only are returned;
- leaf/parent shape is inferred after building the active-only tree;
- classifications with a closed berkas are filtered out;
- classifications with exactly one open berkas remain available;
- classifications with multiple open berkas are excluded as an anomaly.

Pengklasifikasian Dokumen UI:

- navigating a parent opens its children;
- a value is assigned only when clicking a node with no children in the returned tree;
- search results include flattened tree nodes, but clicking a result still routes through the same handler, so parent search results open children instead of selecting.

Penambahan Dokumen UI:

- uses the same hierarchical pattern;
- a value is assigned only when clicking a node with no children in the returned tree;
- search results use the same handler and therefore do not directly select parent nodes.

Backend behavior:

- `src/routes/api/arsiparis/dokumen.$id.archive.ts` validates UUID and checks `master_klasifikasi_arsip.is_active = true`, but does not check child existence.
- `src/lib/manual-arsip.ts` validates UUID and checks `master_klasifikasi_arsip.is_active = true`, but does not check child existence.
- `src/lib/archive/berkas-arsip-service.ts` validates active classification only through `findActiveKlasifikasi`, and that query does not check child existence.
- `getOrCreateOpenBerkasForKlasifikasi` resolves existing berkas rows before validating active classification. Therefore, a direct berkas-open path can return an existing open berkas even if the classification later became inactive or a parent.

Conclusion: UI behavior is mostly leaf-only within the active filtered tree, but backend leaf-only enforcement is not present.

## 7. Current Delete Behavior

There is no hard-delete classification API in the inspected runtime. Current `DELETE /api/arsiparis/klasifikasi/$id` is a soft deactivation:

- requires same-origin;
- requires assigned `KEPALA_SUB_BAGIAN_UMUM`;
- rejects missing rows;
- rejects root `kode === '000'`;
- finds active descendants;
- sets `is_active = false` for the target and active descendants.

Current delete/deactivation does not:

- reject if the classification has children;
- reject if the classification or descendants are referenced by `berkas_arsip`;
- check `berkas_arsip_item` through folder membership;
- check `manual_arsip`;
- check whether the classification was ever used by closed, inactive, proposed-destruction, or destroyed metadata/history;
- distinguish `Hapus`, `Nonaktifkan`, and future physical hard delete in visible copy;
- expose inactive classifications in Master Klasifikasi after deactivation.

Physical hard-delete implications if introduced later:

- `berkas_arsip.klasifikasi_id` with `restrict` should block deletion of used berkas classifications.
- `manual_arsip.klasifikasi_id` with `set null` would preserve snapshots but lose the FK pointer, so runtime hard delete should still be rejected for any manual usage.
- `parent_id on delete set null` would orphan children if a parent were physically deleted, so hard delete should reject any child existence before the delete attempt.

## 8. Current Active/Nonaktif Support

Support exists at the schema/runtime level:

- `master_klasifikasi_arsip.is_active` exists and defaults to `true`;
- list APIs return only active classifications;
- create/update duplicate checks consider active rows;
- current delete endpoint sets `is_active = false`.

Support is incomplete for the desired domain behavior:

- inactive classifications are not visible in Master Klasifikasi;
- no `deactivated_at`, `deactivated_by`, `deactivation_reason`, `reactivated_at`, or `reactivated_by` metadata exists;
- no Aktifkan/reactivation API exists;
- no explicit Nonaktifkan action exists separate from delete wording;
- inactive parent/child creation policy is not modeled;
- operational dropdowns exclude inactive nodes because the list query filters active rows.

## 9. Risks Found

- Backend does not enforce leaf-only selection for Pengklasifikasian Dokumen, Penambahan Dokumen, or direct berkas creation.
- Active-only tree building can misclassify a node with inactive children as a leaf.
- `getOrCreateOpenBerkasForKlasifikasi` can return an existing open berkas before validating the selected classification is still active and leaf.
- Current deactivation cascades through active descendants and can hide classifications that have berkas/manual history without a usage review.
- Current delete wording says `Hapus`, while actual behavior is `is_active=false`; this can confuse operators.
- Master Klasifikasi does not currently show inactive rows, so deactivated data becomes hidden from the master page.
- No current usage-count/readiness report exists before deactivation.
- Future physical hard delete would be unsafe without checking children, `berkas_arsip`, `manual_arsip`, and historical/destroyed metadata.

## 10. Recommended Domain Rules

Recommended rules:

- A classification is `Klasifikasi Induk` if any child row exists.
- A classification is `Pilihan Akhir` / `Leaf` only if no child row exists.
- Child existence should be the source of truth; do not rely on a stored type unless it is derived or validated against children.
- Only active leaf classifications may be selected as Jenis Pembayaran / Klasifikasi Arsip in operational flows.
- Parent nodes must remain navigable but not selectable.
- Backend must reject parent nodes even if a client submits the id.
- Used classifications must not be hard-deleted.
- Used classifications should be deactivated/nonaktif instead of physically deleted.
- Nonaktif classifications remain readable in Master Klasifikasi and history.
- Nonaktif leaf nodes must not appear in operational dropdowns.
- Nonaktif parent nodes should not accept new active children unless a future explicit policy designs that behavior.

## 11. Recommended Backend Validation Plan

Add a shared server-only validation helper in a future phase, for example under `src/lib/archive/`:

- input: classification id;
- query `master_klasifikasi_arsip` by id;
- reject missing rows;
- reject `is_active=false`;
- check child existence without filtering to active children;
- reject if any child row exists;
- return a safe snapshot `{ id, kode, nama }` for writes.

Apply it before creating/reusing berkas in:

- `src/routes/api/arsiparis/dokumen.$id.archive.ts`;
- `src/lib/manual-arsip.ts`;
- `src/lib/archive/berkas-arsip-service.ts`;
- `src/routes/api/arsiparis/berkas/open.ts` through the service.

Validation order should be:

1. Validate session/RBAC and request schema.
2. Validate selected classification is active leaf.
3. Then evaluate open/closed berkas eligibility.
4. Then create/reuse open berkas or attach item.

This order avoids accepting an existing open berkas for a classification that is no longer a valid active leaf.

## 12. Recommended UI Behavior Plan

Master Klasifikasi:

- show explicit badges: `Klasifikasi Induk` and `Pilihan Akhir`;
- compute badges from child existence;
- show active/nonaktif state when future API returns inactive rows;
- use `Nonaktifkan` wording for soft deactivation, not `Hapus`;
- keep hard delete visually separate and only for unused leaf rows if approved later;
- show usage summary before deactivation/delete: child count, berkas count, manual source count, open/closed/destroyed status categories.

Operational dropdowns:

- keep parent nodes navigable with `Buka sub-klasifikasi`;
- visually disable or mark parent nodes as `Klasifikasi Induk` when shown in search;
- show leaf nodes as `Pilihan Akhir`;
- exclude inactive nodes from operational dropdowns;
- preserve current behavior that metadata final seperti Nomor SPM and retention is not filled during initial classification.

## 13. Recommended Delete/Nonaktif Plan

Future delete/nonaktif policy:

- If a classification has children: reject hard delete.
- If a classification is referenced by `berkas_arsip`: reject hard delete.
- If a classification is referenced by `manual_arsip`: reject hard delete.
- If a classification appears in closed, inactive, proposed-destruction, or destroyed metadata/history: reject hard delete.
- If unused and has no children: hard delete may be allowed only after explicit future approval.
- If used: expose `Nonaktifkan`, not hard delete.
- If nonaktif: keep visible in Master Klasifikasi and keep metadata/history readable.
- If reactivation is added: ensure parent/child state remains coherent and duplicate code/name behavior is defined.

Recommended usage audit inputs:

- direct child rows from `master_klasifikasi_arsip.parent_id`;
- direct folder rows from `berkas_arsip.klasifikasi_id`;
- manual source rows from `manual_arsip.klasifikasi_id`;
- folder item membership via `berkas_arsip_item` only for count/category summaries after resolving associated berkas;
- lifecycle categories from `berkas_arsip.status_berkas` and `status_arsip`.

Responses must use safe aggregate counts/categories only and must not expose raw rows, SQL details, storage paths, logical paths, tokens, env/session/cookie values, or secrets.

## 14. Recommended Future Phases

- 15L.3D.2 - Master Klasifikasi UI Leaf/Induk Visual & Selection Polish
  - update visual labels/badges and dropdown parent/leaf affordances only.
- 15L.3D.3 - Backend Leaf-Only Validation for Archive Classification
  - add server-side active-leaf validation and focused tests for Dokumen Persetujuan, manual, and berkas-open paths.
- 15L.3D.4 - Delete Safety and Nonaktif/Aktifkan Klasifikasi
  - add usage audit, safe Nonaktifkan/Aktifkan behavior, and only allow hard delete for unused leaf rows if explicitly approved.
- 15L.3D.5 - Master Klasifikasi Regression QA
  - validate UI, API, closed/destroyed metadata readability, and no file-access/destruction regressions.

## 15. Files Inspected

Docs:

- `docs/migration/phase-15l3c1-approved-archive-entry-pattern-baseline.md`
- `docs/migration/phase-15l3c2-berkas-aktif-unified-list-detail-metadata-edit.md`
- `docs/migration/phase-15l3c5a-authoritative-berkas-activity-log-foundation.md`
- `docs/migration/phase-15l3c5b-controlled-dev-archive-data-reset-plan.md`
- `docs/migration/phase-15g3-archive-page-integration.md`

Current app:

- `src/config/navigation.ts`
- `src/routes/arsiparis/klasifikasi.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/routes/api/arsiparis/klasifikasi/index.ts`
- `src/routes/api/arsiparis/klasifikasi/$id.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/routes/api/arsiparis/manual-arsip/index.ts`
- `src/routes/api/arsiparis/berkas/open.ts`
- `src/lib/archive/berkas-klasifikasi-eligibility.ts`
- `src/lib/archive/berkas-arsip-service.ts`
- `src/lib/archive/berkas-arsip-api.ts`
- `src/lib/archive/berkas-arsip-read-model.ts`
- `src/lib/manual-arsip.ts`
- `src/lib/schemas/manual-arsip.ts`
- `src/lib/schemas/berkas-arsip.ts`
- `src/db/schema/arsip/klasifikasi-arsip.ts`
- `src/db/schema/arsip/berkas-arsip.ts`
- `src/db/schema/arsip/manual-arsip.ts`
- `src/db/seed/master-data.ts`
- `tests/unit/arsiparis/klasifikasi-create-route.test.ts`
- `tests/unit/arsiparis/klasifikasi-update-route.test.ts`
- `tests/unit/arsiparis/berkas-klasifikasi-eligibility.test.ts`
- `tests/unit/arsiparis/berkas-arsip-service.test.ts`
- `tests/unit/arsiparis/berkas-arsip-api.test.ts`
- `tests/unit/arsiparis/workflow-archive-route.test.ts`
- `tests/unit/arsiparis/manual-arsip-route.test.ts`

Prototype:

- `D:\Temp\dms-ai-studio-final\src\components\roles\ArchivistView.tsx`

## 16. Protected Files Confirmation

This phase is intended to change only:

- `docs/migration/phase-15l3d1-master-klasifikasi-leaf-parent-delete-safety-audit.md`

Protected files/trees are not intentionally modified:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`

No commit or push is performed.
