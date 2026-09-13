# Phase 15G.2 - PPK/PPSPM Shell-Compatible Page Integration

Date: 2026-06-01

Status: implemented. Automated validation passed; pending human browser review.

## Scope

Phase 15G.2 applies the Phase 15F warm shell direction and Phase 15E shared UI foundation to PPK and PPSPM-facing pages only.

Touched pages:

- `/ppk`
- `/ppk/inbox`
- `/ppk/tervalidasi`
- `/ppk/ditolak`
- `/ppk/revisi`
- `/ppk/dokumen/$id`
- `/ppk/dokumen/$id/resubmit`
- `/ppspm`
- `/ppspm/inbox`
- `/ppspm/ditolak`
- `/ppspm/selesai`
- `/ppspm/dokumen/$id`

The `/ppspm` namespace remains unchanged for route/API compatibility. User-facing copy in the touched pages uses `PPSPM`.

## Files Changed

- `src/components/workflow/PpkPpspmPagePrimitives.tsx`
- `src/routes/ppk/index.tsx`
- `src/routes/ppk/inbox.tsx`
- `src/routes/ppk/tervalidasi.tsx`
- `src/routes/ppk/ditolak.tsx`
- `src/routes/ppk/revisi.tsx`
- `src/routes/ppk/dokumen/$id/index.tsx`
- `src/routes/ppk/dokumen/$id/resubmit.tsx`
- `src/routes/ppspm/index.tsx`
- `src/routes/ppspm/inbox.tsx`
- `src/routes/ppspm/ditolak.tsx`
- `src/routes/ppspm/selesai.tsx`
- `src/routes/ppspm/dokumen/$id.tsx`
- `docs/migration/phase-15g2-ppk-ppspm-page-integration.md`

## Visual Changes

- Added PPK/PPSPM workflow page primitives for warm headers, panels, local filter/search panels, responsive table shells, mobile cards, field cards, pagination, workflow timeline, revision note panels, and dashboard cards.
- Replaced old role dashboard hero/stat shell usage for PPK and PPSPM dashboard landing pages with direct task cards focused on current workflow actions.
- Updated PPK list pages with warm page headers, shared loading/error/empty states, canonical document status badges, and mobile card layouts.
- Updated PPSPM list pages with warm page headers, shared loading/error/empty states, canonical document status badges, and mobile card layouts.
- Updated PPK and PPSPM detail pages with warm headers, canonical status badges, workflow timeline, metadata field cards, clearer action panels, and shared confirmation dialogs for approve/validate actions.
- Kept PPK `Kembalikan ke Pegawai` behavior on the resubmit page as the existing caller-owned confirmation path to avoid conflating it with ordinary reject.

## Shared Components Used

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `StatusBadge`
- `ConfirmDialog`
- existing `Button`, `Table`

New PPK/PPSPM-local workflow primitives are presentation-only and do not fetch, mutate, authorize, or construct API requests.

## Behavior Boundaries Preserved

Unchanged:

- Route paths.
- API URLs.
- Request bodies and mutation payloads.
- Redirect destinations after approve/reject/resubmit/kembalikan.
- PPK validation endpoint and reject endpoint.
- PPSPM approval endpoint and reject endpoint.
- `AttachmentViewer` preview/download behavior and `apiType="ppk"` / `apiType="ppspm"` usage.
- PPK `KEMBALIKAN` semantics and endpoint.
- Auth/session/RBAC logic.
- Storage/file-access logic.
- Archive lifecycle logic.
- Schema, migrations, package files, route generation, and env files.

## Workflow Confirmation

- PPK validation remains for documents in `IN_PPK_VALIDATION`.
- PPK reject still sends the existing `catatan` payload to the existing PPK reject endpoint.
- PPSPM approval remains for documents in `IN_PPSPM_APPROVAL`.
- PPSPM reject still sends the existing `catatan` payload to the existing PPSPM reject endpoint.
- PPK resubmit still uses the existing PATCH-then-POST flow.
- PPK `Kembalikan ke Pegawai` remains a separate action and was not merged into ordinary reject UI.
- Non-Material documents were not added to PPK/PPSPM queues.

## Attachment And File Access Confirmation

- `AttachmentViewer` remains the behavior owner for preview/download.
- No preview/download API paths were changed.
- No file token behavior was changed.
- No raw paths, storage roots, tokens, signed-token internals, env/session/cookie values, SQL, raw rows, or secrets were added to UI output.
- Destroyed-file UX remains owned by existing file-access handling and was not modified.

## Guardrails Preserved

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state.
- Server/API RBAC remains authoritative.
- `ADMIN` remains dedicated and is not presented as a substitute for PPK or PPSPM.
- Internal `PPSPM` enum/route/API compatibility is preserved.
- User-facing label for `PPSPM` is `PPSPM`.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

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

## Validation Performed

Validation performed:

- `git status --short --branch`: branch `ui/prototype-redesign-v1`, expected PPK/PPSPM UI files plus new doc/component changes only.
- `git diff --check`: passed. Git emitted line-ending normalization warnings only.
- `git diff --name-only`: route UI files only among tracked changes; new doc/component are untracked until commit.
- `pnpm test tests/unit/components/ui-foundation.test.ts`: passed, 1 test file and 4 tests.
- `pnpm build`: passed. Existing third-party module-level `"use client"` warnings and circular `pg` chunk warning were emitted.
- `src/routeTree.gen.ts` changed during build and was restored with `git restore src\routeTree.gen.ts`.
- Protected file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`: empty.

## Known Deferred Items

- The PPK resubmit page still contains its existing workflow timeline and attachment editor internals beyond the safe loading/error shell because the `Kembalikan ke Pegawai` path is domain-sensitive.
- Reject note dialogs remain caller-owned local modal implementations; broad dialog replacement can be considered later after more workflow interaction QA.
- No real dashboard counts were introduced; dashboard cards remain task entry points only.
- No E2E/browser automation was added in this phase.

## Final Guardrails

- Do not copy or import prototype files.
- Do not run or commit route generation.
- Do not modify package, env, schema, migration, database, storage, auth, RBAC, or API route files.
- Do not restore forbidden archive/search/report/canonical surfaces.
- Do not claim production readiness, go-live approval, full security, or full Supabase repository removal.
