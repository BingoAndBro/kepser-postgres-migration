# Phase 15G.6 - Profile / Notification / Global Polish

Date: 2026-06-02

Status: implemented as bounded UI-only polish. Automated validation performed; human browser review still required.

## Scope

Phase 15G.6 applies final Phase 15G polish to global Profile, notification presentation, and small shell consistency details.

Touched surfaces:

- `/profile`
- authenticated header notification button/popover
- user/account dropdown
- authenticated shell footer presentation

No route paths, route registration, API contracts, auth/session/RBAC logic, password endpoints, storage/file-access behavior, archive lifecycle, workflow lifecycle, schema, migrations, package files, env files, or generated route tree files were intentionally changed.

## Files Changed

- `src/routes/profile.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/UserDropdown.tsx`
- `src/components/layout/AppLayout.tsx`
- `docs/migration/phase-15g6-profile-global-polish.md`

## Profile Changes

- Rebuilt Profile into a warm shell-compatible account page with a cream/orange header card, white/off-white panels, and restrained orange accents.
- Kept the page global for all authenticated roles.
- Uses `Profile` terminology; no `Settings` terminology was introduced.
- Added local-only mock photo preview controls:
  - upload/change photo previews the selected image in the current page state only;
  - remove photo returns the avatar to initials;
  - copy states that no backend upload is implemented in this phase.
- Kept header/avatar consistency through the same initials-based visual language. The mock photo preview is intentionally not persisted or treated as account authority.
- Displays read-only account info from the existing `/users/me/` response.
- Displays role chips with shared `RoleBadge`, preserving `PPSPM`, `Kepala Sub Bagian Umum`, `Penanggung Jawab Kinerja`, and `Admin Sistem` display labels.
- Displays Ketua Tim assignment data from the existing `/users/me/ketua-tim` API when available, with an empty state when no assignment exists.
- Moved Profile password change into an account-security modal while preserving the existing behavior.

## Password And Session Boundaries

Profile change password still requires:

- current password;
- new password;
- confirmation password.

Preserved behavior:

- Profile still posts to the existing `/api/users/me/change-password` endpoint.
- Request payload remains `currentPassword` and `newPassword`.
- Confirmation password remains client-side validation only and is not added to the API payload.
- Successful password change still clears client auth state, clears `dms_active_role`, and redirects to login with `password_changed=1`.
- No password hashes, plaintext passwords, tokens, cookies, sessions, env values, SQL details, storage paths, raw rows, or secrets are displayed.

Admin Reset Password was not modified. It remains separate from Profile change password and was not given an old/current password field.

## Notification Decision

Notification remains visual-only.

- The header notification button now opens a small empty popover.
- The popover clearly states that no backend notification source is connected in this phase.
- It displays neutral copy: `Belum ada notifikasi aktif`.
- No backend notification fetch was added.
- No unread count or fake operational notification data was added.
- No realtime notification claim was made.

## Global Polish

- User dropdown was lightly polished for Profile/account consistency.
- Shell footer copyright rendering was normalized.
- No global search was introduced.
- Sidebar/global `Cari Arsip` was not restored.
- No broad role-page redesign was performed.

## Shared Components Used

- `AppDialog`
- `Button`
- `EmptyState`
- `ErrorState`
- `Input`
- `LoadingState`
- `RoleBadge`

Profile-local presentation remains inside `src/routes/profile.tsx` and does not fetch, mutate, authorize, or construct API requests outside the existing Profile calls.

## Guardrails Preserved

Unchanged:

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state.
- Server/API RBAC remains authoritative.
- `ADMIN` remains dedicated and is not a substitute for operational roles.
- Active runtime/package Supabase dependency retired, historical Supabase artifacts remain.
- Folder-first archive authority remains unchanged.
- Storage/file-access behavior remains unchanged.
- Archive lifecycle and workflow lifecycle remain unchanged.
- Password/session behavior remains unchanged.

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
- restored `src/routeTree.gen.ts` if changed by build
- repeated `git status --short --branch`
- repeated `git diff --check`
- repeated `git diff --name-only`
- protected-file diff check for `.env`, `.env.migration`, package/lock files, `src/routeTree.gen.ts`, `db`, `drizzle`, and `supabase`

## Known Deferred Items

- Real notification backend, notification unread counts, and realtime notification behavior remain deferred to a backend-scoped phase.
- Profile photo upload persistence remains deferred; this phase only adds local preview presentation.
- No broad responsive QA or browser automation was added; Phase 15H should cover responsive and interaction QA.
- Existing role pages were not redesigned again.

## Final Guardrails

- No prototype files copied or imported.
- No route generation committed.
- No package, env, schema, migration, DB, storage, auth, RBAC, archive lifecycle, workflow lifecycle, or API route files changed.
- No API contract changes.
- No password/session behavior changes.
- No backend notification authority added.
- No forbidden legacy archive/search/report/canonical surfaces restored.
- No production, go-live, operational certification, security certification, compliance validation, full security, or full Supabase repository removal claim is made.

## Proposed Next Scope

Recommended next phase:

```text
Phase 15H - Responsive And Interaction QA
```

Suggested scope:

- Review shell plus redesigned role pages across desktop/tablet/mobile breakpoints.
- Verify dialogs, dropdowns, local filters, password modal, lifecycle confirmations, and file-action error displays in browser.
- Keep 15H as QA/polish only unless a separate implementation phase explicitly scopes additional behavior.
