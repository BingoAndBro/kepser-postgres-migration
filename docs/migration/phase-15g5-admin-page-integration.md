# Phase 15G.5 - Admin Shell-Compatible Page Integration

Date: 2026-06-01

Status: implemented as UI/page integration. Automated validation performed; human browser review still required.

## Scope

Phase 15G.5 applies the Phase 15F warm shell direction and Phase 15E shared UI foundation to Admin Sistem pages only.

Touched active pages:

- `/admin`
- `/admin/master-data/user`
- `/admin/master-data/fungsi`
- `/admin/master-data/kegiatan`
- `/admin/master-data/jenis-dokumen`
- `/admin/master-data/kategori`
- `/admin/master-data/kelengkapan`

Inspected or kept behavior-compatible:

- `/admin/master-data`
- `/admin/master-data/jenis`
- `/admin/master-data/detail`

No admin API routes, auth/session/RBAC logic, storage, archive lifecycle, workflow lifecycle, schema, migrations, package files, env files, or route generation files were changed.

## Files Changed

- `src/components/admin/AdminPagePrimitives.tsx`
- `src/routes/admin.index.tsx`
- `src/routes/admin.master-data.user.tsx`
- `src/routes/admin.master-data.fungsi.tsx`
- `src/routes/admin.master-data.kegiatan.tsx`
- `src/routes/admin.master-data.jenis-dokumen.tsx`
- `src/routes/admin.master-data.kategori.tsx`
- `src/routes/admin.master-data.kelengkapan.tsx`
- `docs/migration/phase-15g5-admin-page-integration.md`

## Visual Changes

- Added Admin-specific presentation primitives for warm headers, panels, summary cards, search/filter panels, table shells, notices, and staged step cards.
- Updated Admin dashboard to present Admin Sistem as a configuration workspace, not a workflow command center.
- Admin dashboard summary focuses on Total User, User Aktif, Role Terpakai, and Konfigurasi Kelengkapan using existing API data where available.
- Admin dashboard quick actions point to Master User, Master Data, and Kelengkapan Dokumen only.
- Updated Master User with warm page header, summary cards, safer role badges, and a clearer local filter panel.
- Added Master User filters for status, role, and Ketua Tim assignment using already-returned user and assignment data.
- Updated Fungsi, Kegiatan, Kategori, Jenis Dokumen, and selected master-data table shells with warm search/table/loading/empty presentation.
- Updated Kelengkapan Dokumen into a staged configuration workspace:
  - Fungsi and Kegiatan context;
  - Jenis Permintaan, Kategori, and Detail/leaf context;
  - `Konfigurasi Aktif` after the leaf is selected;
  - separate but harmonious panels for `Kelengkapan Ketua Tim` and `Kelengkapan Anggota`.
- Kelengkapan item rows now show Nama Dokumen, Format helper copy, WAJIB/OPSIONAL state, and existing Edit/Hapus actions.

## Shared And Local Components Used

Shared Phase 15E components:

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `RoleBadge`

Admin-specific presentation components:

- `AdminPageHeader`
- `AdminPanel`
- `AdminSummaryCard`
- `AdminSearchPanel`
- `AdminTableShell`
- `AdminNotice`
- `AdminStepCard`

These Admin primitives are presentation-only. They do not fetch data, mutate state, authorize users, construct API requests, or own password/session behavior.

## Admin Boundary Preserved

`ADMIN` remains a dedicated system/configuration role.

Not added:

- approval actions;
- validation actions;
- PPSPM approval actions;
- archive classification actions;
- archive lifecycle actions;
- destruction actions;
- operational workflow queues;
- ADMIN substitution for Pegawai, PPK, PPSPM, Kepala Sub Bagian Umum, or Penanggung Jawab Kinerja.

Server/API RBAC remains authoritative. `dms_active_role` remains UX-only state.

## Password And Session Boundary Preserved

Admin Reset Password remains separate from Profile change password.

Preserved:

- Admin Reset Password uses the existing `/api/users/$id/reset-password` route.
- Admin Reset Password still sends only the existing password payload.
- Admin Reset Password does not ask for old/current password.
- The visible fields remain `Password Baru` and `Konfirmasi Password`.
- Login, logout, session revocation, and Profile password-change behavior were not modified.
- No password hashes, plaintext passwords, tokens, cookies, env values, sessions, or secrets were logged or displayed.

## Master User Behavior Preserved

Preserved:

- Existing `/users/` load.
- Existing create user API payload.
- Existing edit user API payload.
- Existing activate/deactivate API calls.
- Existing reset password API call.
- Existing Ketua Tim assignment APIs and replacement confirmation behavior.
- Existing one-kegiatan-one-Ketua-Tim constraint remains server/API-owned.
- Existing one-user-many-kegiatan Ketua Tim capability remains unchanged.

Added UI-only local filters:

- status;
- role;
- Ketua Tim assignment.

## Master Data And Kelengkapan Behavior Preserved

Preserved:

- Existing master data endpoints and payload names.
- Existing CRUD handlers and delete confirmations.
- Existing Kelengkapan Dokumen chain-complete/leaf behavior.
- Existing duplicate prevention helper.
- Existing required/optional boolean behavior.
- Existing Ketua Tim vs Anggota split using `is_ketua_tim`.

No configuration semantics, schema, route paths, API contracts, or validation boundary were changed.

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
- `git diff --check`: passed with Git line-ending warnings only.
- `git diff --name-only`
- `pnpm test tests/unit/components/ui-foundation.test.ts`: passed, 1 file and 4 tests.
- `pnpm build`: passed with existing third-party module-level `"use client"` warnings and circular `pg` chunk warning.
- `src/routeTree.gen.ts` changed during build and was restored with `git restore src\routeTree.gen.ts`.
- protected-file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`: empty.

Additional exploratory check:

- `pnpm exec tsc --noEmit --pretty false` was run and failed on broad pre-existing project type errors outside this Admin UI slice.

## Known Deferred Items

- `/admin/master-data/jenis` and `/admin/master-data/detail` retained more of their prior internal table/form structure after targeted inspection; they can receive the same deeper table/card pass in a later polish phase without changing behavior.
- Existing local `alert()` handling remains for some admin form validation and mutation errors where replacing behavior would require broader interaction QA.
- Existing admin dialogs are not broadly replaced with `AppDialog` or `ConfirmDialog` in this phase to avoid changing password, activation, deactivation, Ketua Tim replacement, and delete flows.
- No E2E/browser automation was added.

## Final Guardrails

- No prototype files copied or imported.
- No route generation committed.
- No package, env, schema, migration, DB, storage, auth, RBAC, archive lifecycle, workflow lifecycle, or API route files changed.
- No API contract changes.
- No password/session behavior changes.
- No operational workflow action was added to ADMIN.
- No forbidden legacy archive/search/report/canonical surfaces restored.
- No production, go-live, operational certification, security certification, compliance validation, full security, or full Supabase repository removal claim is made.
- Correct Supabase wording remains: Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.

## Proposed Next Scope

Recommended next phase:

```text
Phase 15G.6 - Profile, Notification Placeholder, And Global Polish
```

Suggested scope:

- Apply the warm shared UI direction to Profile while preserving current-password requirements and session behavior.
- Keep notification visual-only unless a backend phase scopes notification authority.
- Perform small global responsive/polish fixes without restoring global archive search or Settings terminology.
