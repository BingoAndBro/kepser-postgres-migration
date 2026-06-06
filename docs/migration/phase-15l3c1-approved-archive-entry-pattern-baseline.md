# Phase 15L.3C.1 - Approved Archive Entry Pattern Baseline

Date: 2026-06-06

## 1. Status

Phase 15L.3C.1 is a baseline/documentation phase.

No source code changes are authorized by this phase. No UI changes, tests, backend/API changes, schema changes, migration changes, package changes, environment changes, generated route-tree changes, DB changes, Drizzle changes, Supabase changes, commits, or pushes are part of this phase.

This document records the approved archive entry visual baseline after user clarification. It does not approve every archive page changed during Phase 15L.3C.

## 2. User Clarification

The user clarified that only these archive pages are currently safe as approved visual references after manual revisions:

- Pengklasifikasian Dokumen.
- Penambahan Dokumen.

Other archive pages touched by Phase 15L.3C must not be considered visually approved yet. They may contain useful exploratory work, but they still require targeted visual refinement and manual review before becoming baselines.

Latest user screenshot/feedback overrides prior broad phase results. Phase 15L.3C should therefore be treated as an attempted archive visual parity phase, not as blanket approval for all archive outputs.

## 3. Reference Hierarchy

Future archive visual work must apply this hierarchy:

1. Business/backend/archive rules are hard authority.
2. The relevant archive prototype page/component remains the page-specific visual and interaction reference.
3. Approved real-app pages are consistency baselines.
4. For archive entry patterns, only these real-app pages are currently approved:
   - Pengklasifikasian Dokumen.
   - Penambahan Dokumen.
5. Latest user screenshot/feedback overrides prior broad phase results.
6. Approved pages do not replace the prototype; they define how the prototype should be adapted into the real app.

Prototype references inspected for this baseline:

- `D:\Temp\dms-ai-studio-final\src\components\roles\ArchivistView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\workflow\InboxView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\layout\DetailPane.tsx`

No prototype source is copied or imported by this phase.

## 4. Approved Archive Entry Pages

Approved real-app archive entry pages:

- Pengklasifikasian Dokumen:
  - `src/routes/arsiparis/dokumen/$id/index.tsx`
- Penambahan Dokumen:
  - `src/routes/arsiparis/penambahan-arsip.tsx`

Route namespace compatibility remains unchanged. The route path may still use `penambahan-arsip`, but visible UI should read `Penambahan Dokumen`.

## 5. Approved Pengklasifikasian Dokumen Pattern

Approved visual and interaction pattern from `src/routes/arsiparis/dokumen/$id/index.tsx`:

- compact archive detail layout;
- soft warm page canvas and off-white surfaces, including `#FFF9F4`, `#FFFDF9`, and related warm cream tones where already used;
- controlled content width and breathing space, using a constrained detail rail instead of raw full-width content;
- clear page header with back navigation, document title, role context, and page context;
- tabbed detail content for metadata, lampiran, and riwayat without turning the page into heavy nested cards;
- refined form controls with rounded inputs, subtle borders, and orange focus treatment;
- clear `Jenis Pembayaran` selection with searchable hierarchical dropdown;
- leaf-node selection behavior for the actual classification value;
- optional `Catatan Klasifikasi` presentation where present;
- restrained orange accent for selected tabs, focus states, nominal emphasis, and the primary classification action;
- no heavy or visually busy cards;
- preview/download actions preserve the existing `AttachmentViewer` behavior where available;
- unsaved-change protection uses the approved modal tone:
  - `Keluar tanpa menyimpan?`
  - `Perubahan yang belum disimpan akan hilang.`
  - `Tetap di halaman`
  - `Keluar tanpa menyimpan`
- mobile behavior should keep the content readable, actions reachable, tabs usable, and avoid horizontal overflow.

Approved business constraints for this page:

- Classification is for completed workflow documents.
- The user only selects a `Jenis Pembayaran` leaf node.
- Initial classification does not fill `Nomor SPM`.
- Initial classification does not fill retention.
- Initial classification does not fill final archive metadata.
- The action attaches the completed workflow document to the folder-first archive model by `Jenis Pembayaran`.
- Do not restore legacy archive/canonical assumptions.

## 6. Approved Penambahan Dokumen Pattern

Approved visual and interaction pattern from `src/routes/arsiparis/penambahan-arsip.tsx`:

- visible UI says `Penambahan Dokumen`, despite the route namespace `penambahan-arsip`;
- compact form layout with staged entry for document identity, `Jenis Pembayaran`, lampiran, and review;
- soft warm page canvas and off-white form/table surfaces;
- clear required-field treatment;
- clean `Jenis Pembayaran` selection with searchable hierarchical dropdown;
- clear nominal realisasi emphasis;
- clean upload and attachment rows, including attachment title and file selection state;
- existing manual document table/list, if displayed in a future state, should keep refined table/list rhythm and not become a raw data grid;
- modal/confirmation/unsaved-change styling follows the approved warm dialog pattern;
- success state uses a centered completion treatment with clear next actions;
- toast/notice feedback remains compact and safe;
- restrained orange accent is used for primary actions, focus, selected states, and important financial metadata;
- mobile behavior should keep steps, fields, upload rows, review content, and actions reachable without horizontal overflow.

Approved business constraints for this page:

- Manual documents enter the same folder-first archive model by `Jenis Pembayaran`.
- Manual document fields remain:
  - `nama dokumen`;
  - `kategori`;
  - `tanggal dokumen/sumber`;
  - `jenis pembayaran`;
  - `nominal realisasi`;
  - required `keterangan`;
  - optional `lampiran`.
- Existing route behavior remains unchanged.
- Existing payload behavior remains unchanged.
- Existing upload behavior remains unchanged.
- Metadata arsip final remains a folder closure/finalization concern, not initial Penambahan Dokumen input.

## 7. Not-Yet-Approved Archive Pages

These pages are not visually approved baselines yet:

- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`, except any parts overlapping the approved Pengklasifikasian Dokumen entry pattern
- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/inaktif/index.tsx`
- `src/routes/arsiparis/usul-musnah/index.tsx`

These pages may contain Phase 15L.3C changes, but they still need targeted visual refinement. Future prompts must not treat them as approved baselines.

## 8. Future Phase Guidance

Recommended targeted future phases:

- Phase 15L.3C.2 - Berkas List Visual Refinement.
- Phase 15L.3C.3 - Berkas Detail Visual Refinement.
- Phase 15L.3C.4 - Inaktif List Visual Refinement.
- Phase 15L.3C.5 - Usul Musnah Visual and Destructive Modal Refinement.

Each future phase must:

- inspect the relevant prototype page/component first;
- inspect the approved archive entry pages from this baseline;
- inspect approved workflow list/detail baselines;
- produce a visual gap list before editing;
- change one page or one pattern at a time;
- preserve folder-first business rules;
- avoid broad reusable-component refactors until enough archive list/detail patterns are approved.

## 9. Archive Business Guardrails

Folder-first archive model remains authoritative:

- `berkas_arsip`;
- `berkas_arsip_item`;
- `dokumen_transaksi` for `WORKFLOW` source metadata;
- `manual_arsip` and `manual_arsip_attachment` for `MANUAL` source metadata.

Do not restore:

- `/arsiparis/aktif`;
- `/arsiparis/search`;
- `/arsiparis/arsip/$id`;
- legacy `/api/arsiparis/arsip/*`;
- `Laporan Klasifikasi`;
- global/sidebar `Cari Arsip`;
- legacy canonical archive assumptions.

Terminology and role guardrails:

- Use `Kepala Sub Bagian Umum` as the primary role label.
- Avoid `Arsiparis` as the primary label.
- Use `Penambahan Dokumen`, not `Penambahan Arsip`, in visible UI.
- Use `Jenis Pembayaran`.
- Use `Nomor SPM` only at archive/folder closure/final metadata context.
- Do not use `Nomor Surat` for this archive/folder context.

Lifecycle, destruction, and file-access guardrails:

- Preserve exact typed confirmation `MUSNAHKAN DATA FILE`.
- Preserve destroyed-file copy `Data file sudah dimusnahkan`.
- Destruction approval physically deletes associated files while preserving metadata where designed.
- Do not weaken file authorization.
- Do not change preview/download/token behavior.
- Do not expose physical paths, storage roots, logical paths, tokens, signed-token internals, SQL details, raw rows, env/session/cookie values, secrets, or file content in UI/API responses.

## 10. Reuse Guidance

Do not do a broad shared-component refactor yet.

After enough approved archive/list/detail patterns exist, Phase 15N should audit reusable components.

Potential future reusable candidates:

- `ArchiveEntryFormShell`;
- `ArchiveFolderListShell`;
- `ArchiveDetailShell`;
- `ArchiveLifecycleActionPanel`;
- `ArchiveMetadataGrid`;
- `ArchiveMobileCard`;
- shared confirmation/destructive modal variants.

Reuse should be extracted from approved real-app patterns only. Do not force unapproved Phase 15L.3C archive pages into shared abstractions.

## 11. Validation

Planned validation for this documentation-only phase:

```text
git status --short --branch
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

Expected result:

- only `docs/migration/phase-15l3c1-approved-archive-entry-pattern-baseline.md` is changed or untracked;
- protected diff output is empty;
- no commit or push is performed.

