# Phase 15L.3C - Archive/Kepala Sub Bagian Umum List and Detail Visual Parity

## 1. Status

Implemented as a visual/presentation-only archive UI parity phase.

Manual browser QA remains pending. No commit or push was performed.

## 2. Scope

Included:

- Kepala Sub Bagian Umum archive dashboard.
- Pengklasifikasian Dokumen inbox and detail.
- Penambahan Dokumen list, modal, attachment expansion, and manual preview.
- Pemberkasan Arsip Aktif list.
- Berkas detail, metadata/status panel, item cards, attachment actions, and berkas preview modal.
- Arsip Inaktif list.
- Usul Musnah list and destructive confirmation modal.
- Shared archive page primitives for container, table, row, tab, panel, and action styling.

Excluded:

- API/backend changes.
- Archive lifecycle behavior changes.
- Physical deletion behavior changes.
- Auth/session/RBAC changes.
- Storage/file-access/token changes.
- Schema, migration, package, env, route tree, DB, Drizzle, or Supabase changes.

## 3. Prototype References Used

Inspected:

- `D:\Temp\dms-ai-studio-final\src\components\roles\ArchivistView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\workflow\InboxView.tsx`
- `D:\Temp\dms-ai-studio-final\src\components\layout\DetailPane.tsx`

No prototype source was copied or imported.

## 4. Approved Baseline Pages Used

- `src/routes/pegawai/dokumen/index.tsx`
- `src/routes/pegawai/dokumen/$id/index.tsx`
- `src/routes/pegawai/dokumen/aju.tsx`
- `src/routes/pegawai/dokumen/$id/revisi.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `docs/migration/phase-15l1g-approved-ajukan-pattern-baseline.md`
- `docs/migration/phase-15l3a1-pegawai-dokumen-list-table-refinement.md`
- `docs/migration/phase-15l3b-cross-role-document-detail-visual-parity.md`
- `docs/migration/phase-15m1-dark-document-preview-overlay.md`
- `docs/migration/phase-15m2-approved-table-row-surface-tone-rollout.md`

## 5. Files Changed

- `src/components/archive/ArchivePagePrimitives.tsx`
- `src/routes/api/arsiparis/inbox.ts`
- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/inaktif/index.tsx`
- `src/routes/arsiparis/usul-musnah/index.tsx`
- `docs/migration/phase-15l3c-archive-list-detail-visual-parity.md`

## 6. Archive Dashboard Visual Changes

- Dashboard content now uses the same constrained archive page rail as list pages.
- Dashboard cards keep existing counts and links while using softer off-white surfaces.
- Primary actions use compact warm-orange treatment and pointer affordance.

## 7. Inbox/Classification Visual Changes

- Pengklasifikasian Dokumen list uses the shared archive table head and off-white row treatment.
- The inbox content rail is constrained for smoother transitions from approved workflow list pages.
- Classification detail uses the approved warm detail canvas and refined form controls.
- Initial classification remains Jenis Pembayaran plus optional note only.
- The classification inbox table now uses the approved compact workflow table pattern with columns: No, Judul Dokumen, Kegiatan, Nominal Realisasi, Tanggal Selesai, and Aksi.
- Nominal Realisasi is emphasized with a warm-orange visual treatment.
- The inbox has local search, source filter controls, and sort controls. Manual source filtering is UI-safe but does not add manual documents to the workflow classification queue.
- Detail classification now uses a two-column composition with document metadata, attachment/activity content on the left, and the classification action panel on the right.

## 8. Penambahan Dokumen Visual Changes

- Page container, summary cards, table shell, and table rows were aligned with the approved archive/workflow list baseline.
- Manual attachment expansion rows use off-white bordered surfaces.
- Manual preview uses the approved dark document preview overlay pattern.
- Create modal uses a warm off-white surface and the visible submit label is `Simpan Dokumen`.
- The page now includes an Ajukan Dokumen-like step panel for Identitas, Jenis Pembayaran, and Lampiran before the manual document table.

## 9. Berkas List/Detail Visual Changes

- Pemberkasan Arsip Aktif, Arsip Inaktif, and Usul Musnah tables now share refined archive table head, row, and action-link styling.
- Sidebar-entry archive list pages use a direct list-page header: title, short description, search/filter shell, and table. Detail-style breadcrumb/header treatment is reserved for non-sidebar action/detail pages such as document detail, validation/classification detail, and berkas detail.
- Pemberkasan Arsip Aktif includes a local sort control inside the search/filter shell.
- CSV export uses the compact `Ekspor CSV` label and the shared warm outline action treatment.
- Berkas detail uses the approved warm detail canvas.
- Folder metadata/action panel uses compact off-white surface treatment.
- Berkas metadata/arsip metadata follows the approved document-detail metadata rhythm: one inner metadata panel with label/value fields, no per-field mini cards, no total nominal field inside metadata, and `Nomor SPM` as the only orange-emphasis metadata value after close/finalization.
- The detail right rail owns total nominal realization and lifecycle status treatment. The lifecycle card follows the prototype warm status panel direction.
- Item cards, provenance blocks, metadata cells, attachment rows, and preview/download actions were refined.
- Berkas item preview uses the approved dark overlay pattern.
- Riwayat Aktivitas Berkas now uses a folder-first timeline presentation that is visually distinct from workflow approval history.

## 10. Inaktif/Usul Musnah Visual Changes

- Inaktif and Usul Musnah lists align with the approved table/list baseline.
- Usul Musnah destructive modal uses a clearer destructive warning panel while preserving existing copy and confirmation requirements.

## 11. Folder-First Archive Behavior Preserved

Unchanged:

- Folder-first authority remains `berkas_arsip` plus `berkas_arsip_item` with source metadata from workflow/manual tables.
- No legacy canonical archive assumptions were restored.
- No forbidden archive/search/report surfaces were restored.

## 12. Lifecycle/Destruction Behavior Preserved

Unchanged:

- Lifecycle sequence remains `OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN`.
- `MUSNAHKAN DATA FILE` remains the exact destruction confirmation phrase.
- `Musnahkan Data` still invokes the existing lifecycle endpoint and physical deletion behavior where designed.
- Destruction copy still states that physical files are deleted and metadata remains.

## 13. Attachment/Preview/Download Behavior Preserved

Unchanged:

- Existing preview/download URLs and endpoint selection remain unchanged.
- Existing token/signed URL behavior remains unchanged.
- `Data file sudah dimusnahkan` remains the destroyed-file phrase.
- No raw paths, storage roots, tokens, cookies, sessions, DB URLs, SQL, raw rows, or secrets are displayed.

## 14. Mobile Behavior

- Shared archive mobile cards retain readable metadata and reachable actions.
- Detail tabs remain horizontally scrollable.
- Attachment actions stack on narrow screens.
- Dark preview overlays use viewport-safe sizing.

## 15. Reuse Opportunities Deferred To Phase 15N

- Archive table row/action constants are now shared, but route-specific tables remain local.
- A future Phase 15N can consolidate a fuller archive list/table component and a shared archive detail shell.
- Close/lifecycle dialogs can also be normalized further in a later explicit UX pass.

## 16. API/Backend Changes

One read-only display response was extended after latest UI feedback:

- `GET /api/arsiparis/inbox` now includes `nominal_realisasi` and `source_type: WORKFLOW` for the classification inbox table.

Unchanged:

- No mutating endpoint behavior was changed.
- No backend helper was modified.
- No archive lifecycle, file-access, storage, auth, session, or RBAC logic was changed.
- No schema or migration change was made.

## 17. Validation Performed

Passed:

```text
pnpm test tests/unit/arsiparis/berkas-arsip-folder-pages.test.ts
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/components/attachment-viewer-source.test.ts
pnpm test tests/unit/arsiparis
pnpm test tests/unit/dokumen
pnpm test tests/unit/arsiparis/workflow-archive-route.test.ts
pnpm exec tsx -e "void (async () => { await import('./src/routes/arsiparis/inbox.tsx'); await import('./src/routes/arsiparis/penambahan-arsip.tsx') })()"
pnpm exec tsx -e "void (async () => { await import('./src/routes/arsiparis/berkas/$id.tsx'); await import('./src/routes/arsiparis/dokumen/$id/index.tsx') })()"
git diff --check
git diff --name-only
git diff --name-only -- .env .env.migration package.json pnpm-lock.yaml package-lock.json src\routeTree.gen.ts db drizzle supabase
```

`git diff --check` reported only Git line-ending normalization warnings and no whitespace errors. The protected-file diff command returned no paths.

`pnpm exec tsc --noEmit --pretty false` was attempted after the UI follow-up and failed on pre-existing repository-wide TypeScript issues outside this scoped change set, including historical Supabase references and unrelated type errors. Changed route TSX files were smoke-imported successfully.

## 18. Manual QA Checklist

Run:

```powershell
pnpm exec dotenv -e "D:\GitHub\kepser-postgres-migration\.env" -- pnpm dev
```

Then verify:

1. Login/switch as Kepala Sub Bagian Umum.
2. Check `/arsiparis`.
3. Check `/arsiparis/inbox`.
4. Check `/arsiparis/dokumen/$id`: Jenis Pembayaran only, no Nomor SPM or retention during initial classification.
5. Check preview/download on classification detail.
6. Check `/arsiparis/penambahan-arsip`: visible title/copy says Penambahan Dokumen and upload behavior is unchanged.
7. Check `/arsiparis/berkas`: list/table/card visual alignment and open/closed status clarity.
8. Check `/arsiparis/berkas/$id`: open tabs exclude Metadata Arsip; closed/lifecycle tabs include the correct metadata tab.
9. Check lifecycle actions and close berkas behavior.
10. Check `/arsiparis/inaktif`: metadata remains read-only.
11. Check `/arsiparis/usul-musnah`: exact confirmation phrase remains `MUSNAHKAN DATA FILE`.
12. Check destroyed-file handling still shows `Data file sudah dimusnahkan`.
13. Check 390px mobile for no horizontal overflow, readable cards, usable tabs, reachable lifecycle buttons, and reachable attachment actions.
14. Confirm no forbidden legacy archive/search/report surfaces are restored.

## 19. Protected Files Confirmation

No changes were made to:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `db/`
- `drizzle/`
- `supabase/`
- schema files
- migration files
- API route files

No package was installed. No commit or push was performed.
