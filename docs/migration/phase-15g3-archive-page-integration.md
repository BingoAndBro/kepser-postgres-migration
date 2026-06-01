# Phase 15G.3 - Kepala Sub Bagian Umum / Archive Page Integration

Date: 2026-06-01

Status: implemented as UI/page integration. Automated validation passed; human browser review still required.

## Scope

Phase 15G.3 applies the Phase 15F warm shell direction and Phase 15E shared UI foundation to Kepala Sub Bagian Umum / folder-first archive pages only.

Touched pages:

- `/arsiparis`
- `/arsiparis/inbox`
- `/arsiparis/dokumen/$id`
- `/arsiparis/penambahan-arsip`, with user-facing label `Penambahan Dokumen`
- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`

The internal `/arsiparis` namespace remains for route compatibility. User-facing labels use `Kepala Sub Bagian Umum`.

## Files Changed

- `src/components/archive/ArchivePagePrimitives.tsx`
- `src/routes/arsiparis/index.tsx`
- `src/routes/arsiparis/inbox.tsx`
- `src/routes/arsiparis/dokumen/$id/index.tsx`
- `src/routes/arsiparis/penambahan-arsip.tsx`
- `src/routes/arsiparis/berkas/index.tsx`
- `src/routes/arsiparis/berkas/$id.tsx`
- `src/routes/arsiparis/inaktif/index.tsx`
- `src/routes/arsiparis/usul-musnah/index.tsx`
- `docs/migration/phase-15g3-archive-page-integration.md`

## Visual Changes

- Added archive-specific page primitives for warm headers, panels, search panels, summary cards, desktop table shells, mobile cards, notices, and tabs.
- Updated the Kepala Sub Bagian Umum dashboard with warm archive entry cards and direct task links.
- Updated Pengklasifikasian Dokumen list/detail with warm headers, shared loading/error/empty states, and clearer copy that classification only selects `Jenis Pembayaran`.
- Updated Penambahan Dokumen with warm header, summary cards, shared archive status badge usage, and destroyed-file copy alignment.
- Updated Pemberkasan Arsip Aktif, Arsip Inaktif, and Usul Musnah list pages with warm folder-first headers, shared search panels, shared status badges, desktop tables, and mobile folder cards.
- Updated folder detail with status-aware tabs:
  - open berkas: `Daftar Dokumen` and `Riwayat Aktivitas Berkas`;
  - closed/lifecycle berkas: `Metadata Arsip`, `Daftar Dokumen`, and `Riwayat Aktivitas`.
- Adjusted open-folder detail metadata so `Nomor SPM`, retention fields, and final archive dates are not shown before closure.
- Improved destruction confirmation wording around user-visible lifecycle effects: status becomes `Dimusnahkan`, preview/download is blocked, and metadata remains.

## Shared Components Used

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `StatusBadge`
- existing `Button`, `Badge`, and dialog primitives

New archive-specific primitives are presentation-only and do not fetch data, mutate state, authorize, construct API requests, or build file URLs.

## Behavior And Domain Boundaries Preserved

Unchanged:

- Route paths.
- API URLs.
- Request bodies and mutation payloads.
- Auth/session/RBAC logic.
- Storage/file-access logic.
- Folder-first archive lifecycle logic.
- CSV helper behavior and safe DTO scope.
- Manual document create/upload/preview/download behavior.
- Pengklasifikasian Dokumen leaf-node selection behavior.
- Close berkas API behavior and required fields.
- Destruction typed confirmation phrase: `MUSNAHKAN DATA FILE`.
- Destroyed-file UX phrase: `Data file sudah dimusnahkan`.

## Folder-First Authority Preserved

Archive authority remains:

- `berkas_arsip`
- `berkas_arsip_item`
- `dokumen_transaksi`
- `manual_arsip`
- `manual_arsip_attachment`

No legacy canonical archive model was restored.

Not restored:

- `/arsiparis/aktif`
- `/arsiparis/search`
- `/arsiparis/arsip/$id`
- `/api/arsiparis/arsip/*`
- `/api/arsiparis/aktif`
- `/api/arsiparis/inaktif`
- `/api/arsiparis/usul-musnah`
- `/api/arsiparis/search`
- `Laporan Klasifikasi`
- global/sidebar `Cari Arsip`
- `arsip.arsip`
- `lampiran_snapshot`
- `canonical_arsip_id`

## Validation

Validation performed:

- `git status --short --branch`: expected archive UI route changes plus new doc/component files only.
- `git diff --check`: passed. Git emitted line-ending normalization warnings only.
- `git diff --name-only`: expected tracked archive route changes only; new doc/component files are untracked until commit.
- `pnpm test tests/unit/components/ui-foundation.test.ts`: passed, 1 test file and 4 tests.
- `pnpm build`: passed. Existing third-party module-level `"use client"` warnings and circular `pg` chunk warning were emitted.
- `src/routeTree.gen.ts` changed during build and was restored with `git restore src\routeTree.gen.ts`.
- Protected-file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`: empty.

Additional exploratory check:

- `pnpm exec tsc --noEmit` was run and failed on broad pre-existing project type errors outside this UI slice; no archive-edited file was reported in that output.

## Known Deferred Items

- Existing `window.confirm` remains for non-destructive lifecycle actions where replacing the flow would require broader interaction QA.
- Existing manual document preview modal and attachment table remain behavior-local; no new file-access abstraction was introduced.
- Existing `AttachmentViewer` behavior is not changed.
- No E2E/browser automation was added.

## Final Guardrails

- No prototype files copied or imported.
- No route generation committed.
- No package, env, schema, migration, DB, storage, auth, RBAC, or API route files changed.
- No API contract changes.
- No forbidden legacy archive/search/report/canonical surfaces restored.
- No production, go-live, operational certification, security certification, compliance validation, full security, or full Supabase repository removal claim is made.
- Correct Supabase wording remains: Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

## Proposed Next Scope

Recommended next phase:

```text
Phase 15G.4 - Penanggung Jawab Kinerja Shell-Compatible Page Integration
```

Suggested scope:

- Apply the warm shared UI direction to metadata-only Laporan Kinerja surfaces.
- Preserve assigned-role RBAC and avoid ADMIN substitution.
- Do not add preview, download, export, or detail actions unless separately scoped.
