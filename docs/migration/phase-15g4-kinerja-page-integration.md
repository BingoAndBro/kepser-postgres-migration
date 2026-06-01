# Phase 15G.4 - Penanggung Jawab Kinerja Page Integration

Date: 2026-06-01

Status: implemented as UI/page integration. Automated validation passed; human browser review still required.

## Scope

Phase 15G.4 applies the Phase 15F warm shell direction and Phase 15E shared UI foundation to Penanggung Jawab Kinerja / Laporan Kinerja pages only.

Touched active pages:

- `/penanggung-jawab-kinerja/laporan-kinerja`

Inspected but behavior-unchanged:

- `/penanggung-jawab-kinerja`
- `/penanggung-jawab-kinerja/`

No separate Detail Fungsi or Detail Kegiatan route exists in the current runtime, so no route or path was added.

## Files Changed

- `src/components/kinerja/KinerjaPagePrimitives.tsx`
- `src/routes/penanggung-jawab-kinerja/laporan-kinerja.tsx`
- `docs/migration/phase-15g4-kinerja-page-integration.md`

## Visual Changes

- Added Penanggung Jawab Kinerja-specific presentation primitives for warm headers, panels, summary cards, search/filter panel, desktop table shell, mobile cards, and metadata-only notice copy.
- Updated Laporan Kinerja header to align with the warm cream/orange authenticated shell.
- Replaced page-local loading, error, and empty blocks with Phase 15E shared state components.
- Replaced raw status text badges with canonical `StatusBadge` document mappings.
- Focused dashboard summary on:
  - Total Dokumen Final;
  - Total Nominal Realisasi;
  - Dokumen Selesai;
  - Tersimpan / Diarsipkan distribution.
- Added a local client-side metadata filter/search panel over the already-returned safe DTO fields.
- Added responsive mobile metadata cards while preserving the desktop table.
- Removed the previous partial raw document ID display from the table presentation.

## Shared And Local Components Used

Shared Phase 15E components:

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `StatusBadge`

Kinerja-specific presentation components:

- `KinerjaPageHeader`
- `KinerjaPanel`
- `KinerjaSummaryCard`
- `KinerjaSearchPanel`
- `KinerjaTableShell`
- `KinerjaMobileList`
- `KinerjaMobileCard`
- `KinerjaNotice`

These Kinerja primitives are presentation-only. They do not fetch data, mutate state, authorize users, construct API requests, or build file URLs.

## Metadata-Only Boundaries Preserved

Laporan Kinerja remains metadata-only.

Preserved:

- The page still fetches only `/laporan/kinerja`.
- The route remains guarded by existing Penanggung Jawab Kinerja route/RBAC behavior.
- Report rows remain limited to final document metadata returned by the existing API.
- Final statuses remain `COMPLETED`, `TERSIMPAN`, and `ARCHIVED`.
- Client-side filtering uses only already-present safe display fields: judul, fungsi, kegiatan, pengaju, tahun, status, and material/non-material type.

Not added:

- preview actions;
- download actions;
- lampiran actions;
- file URL or signed URL display;
- AttachmentViewer;
- archive lifecycle actions;
- workflow approval actions;
- export actions;
- route paths;
- route generation;
- API routes;
- API request/response contract changes.

## Behavior And Domain Boundaries Preserved

Unchanged:

- Route paths.
- API URL `/laporan/kinerja`.
- API request parameters and response handling contract.
- Auth/session/RBAC logic.
- `dms_session` auth boundary.
- `dms_active_role` UX-only state.
- `ADMIN` as a dedicated role, not a Penanggung Jawab Kinerja substitute.
- Storage/file-access logic.
- Archive lifecycle logic.
- Workflow lifecycle logic.
- Schema, migrations, package files, env files, and route generation.

## Forbidden Surfaces Not Restored

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
- legacy canonical archive model: `arsip.arsip`, `lampiran_snapshot`, `canonical_arsip_id`

## Validation

Validation performed:

- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- `pnpm test tests/unit/components/ui-foundation.test.ts`
- `pnpm build`
- `src/routeTree.gen.ts` changed during build and was restored with `git restore src\routeTree.gen.ts`
- `git status --short --branch`
- `git diff --check`
- `git diff --name-only`
- Protected-file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`

## Known Deferred Items

- No separate Detail Fungsi or Detail Kegiatan route exists; this phase does not invent one.
- No report export action was added.
- No metadata detail modal was added because current authority says Laporan Kinerja does not provide detail actions by default.
- No E2E/browser automation was added.

## Final Guardrails

- No prototype files copied or imported.
- No route generation committed.
- No package, env, schema, migration, DB, storage, auth, RBAC, workflow, archive lifecycle, or API route files changed.
- No API contract changes.
- No preview, download, lampiran, file-action, AttachmentViewer, export, archive lifecycle, or workflow approval behavior added.
- No forbidden legacy archive/search/report/canonical surfaces restored.
- No production, go-live, operational certification, security certification, compliance validation, full security, or full Supabase repository removal claim is made.
- Correct Supabase wording remains: Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

## Proposed Next Scope

Recommended next phase:

```text
Phase 15G.5 - Admin Shell-Compatible Page Integration
```

Suggested scope:

- Apply the warm shared UI direction to Admin dashboard and master-data/user-management pages.
- Preserve `ADMIN` as a dedicated role.
- Preserve admin API contracts, password/session behavior, destructive cleanup boundaries, and safe error handling.
