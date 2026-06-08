# Phase 15L.7A - Profile Page Visual Parity and Avatar Upload Foundation

## 1. Status

- Implemented pending human validation.
- Codex did not run `pnpm test`, `pnpm build`, or `pnpm dev`.
- No commit or push was performed.

## 2. Scope

Included:

- Profile page visual parity with the supplied screenshot direction.
- Self-service profile photo upload, replacement, display, and removal for the authenticated current user.
- Minimal avatar metadata schema foundation on `auth.users`.
- Server-only local filesystem avatar helper under a dedicated avatar folder.
- Focused source/helper tests.

Excluded:

- Admin Master User row avatar display.
- Topbar/user menu avatar consumption.
- Activity Log.
- Admin user-management behavior.
- Document/archive upload, preview, download, token, cleanup, lifecycle, or storage behavior changes.

## 3. Prototype/Screenshot Reference

The supplied screenshot is treated as the Profile visual reference:

- page title `Profile`;
- subtitle `Kelola informasi akun, foto profil, dan keamanan password Anda.`;
- left profile card with avatar/initials, name, role badge, email, active-account badge, upload/remove photo actions, and logout;
- security/change-password card;
- right-side panels for account information, access/role information, and assignment information.

No prototype source was copied or imported.

## 4. Files Changed

- `src/routes/profile.tsx`
- `src/routes/api/users/me.ts`
- `src/lib/storage/profile-avatar.ts`
- `src/lib/schemas/user.ts`
- `src/db/schema/auth/users.ts`
- `drizzle/0011_profile_avatar_metadata.sql`
- `tests/unit/storage/profile-avatar.test.ts`
- `tests/unit/profile/profile-avatar-source.test.ts`
- `docs/migration/phase-15l7a-profile-visual-avatar-upload-foundation.md`

## 5. Profile Visual Changes

- Reworked Profile into a two-column layout.
- Left column now contains the profile card and security card.
- Profile card shows uploaded avatar or initials fallback, display name, primary role badge, email, `Akun Aktif`, `Unggah Foto` / `Ganti Foto`, `Hapus Foto`, and `Keluar`.
- Security card keeps the existing change-password modal flow with `Ganti Password`.
- Right column shows `Informasi Akun`, `Hak Akses`, and `Penugasan Ketua Tim` using existing current-user and Ketua Tim data only.
- No fake persistent profile fields were added.

## 6. Avatar Backend/Storage Approach

- Existing `GET /api/users/me` now includes safe avatar display fields:
  - `avatar_url`
  - `avatar_mime_type`
  - `avatar_size_bytes`
  - `avatar_updated_at`
- Existing route file handles avatar operations without adding a new route file:
  - `GET /api/users/me?avatar=1` serves the current user's avatar image after session validation.
  - `POST /api/users/me?avatar=1` uploads/replaces the current user's avatar.
  - `DELETE /api/users/me?avatar=1` removes the current user's avatar metadata and file.
- Avatar files are stored separately from document/archive attachments under the logical prefix `profile-avatars/<user-id>/`.
- The client receives only a safe display URL and metadata, never the stored key or filesystem target.

## 7. Schema/Migration Decision

Existing active user schema had no avatar/photo metadata field.

Added a narrow migration and Drizzle schema fields on `auth.users` only:

- `avatar_storage_key`
- `avatar_mime_type`
- `avatar_size_bytes`
- `avatar_updated_at`

The DB stores a logical storage reference, MIME type, size, and update timestamp. It does not store physical paths or storage roots.

## 8. Security Validations

Avatar upload validates:

- authenticated local `dms_session`;
- same-origin guard for unsafe `POST` and `DELETE`;
- current-user ownership only;
- MIME type allowlist: `image/jpeg`, `image/png`, `image/webp`;
- extension allowlist: `jpg`, `jpeg`, `png`, `webp`;
- size cap: 2MB;
- basic image signature matching for JPEG, PNG, and WebP;
- logical path normalization and root containment through existing local storage helpers.

SVG is not allowed.

## 9. Response/Path Secrecy Guarantees

Profile avatar API responses do not expose:

- raw storage roots;
- physical paths;
- logical storage keys;
- tokens;
- cookies;
- session values;
- DB URLs;
- password hashes;
- SQL details;
- raw rows.

The profile page displays only `avatar_url` and safe user-facing metadata.

## 10. Behavior Preserved

- `dms_session` remains the auth boundary.
- `dms_active_role` remains UX-only state.
- Server/API RBAC remains authoritative.
- Profile password change still requires current password, new password, and confirmation in UI; the server password route remains unchanged.
- Logout uses the existing logout flow.
- Admin password reset remains separate.
- No Supabase runtime dependency was introduced.
- No document/archive upload, preview, download, token, file-access, cleanup, lifecycle, or workflow behavior was changed.

## 11. Deferred Items

- Topbar/user menu avatar consumption is deferred to Phase 15L.7B.
- Admin Master User row avatar display is deferred.
- Activity Log is deferred.

## 12. Validation Commands For User To Run Manually

Codex intentionally did not run these commands:

```powershell
pnpm test tests/unit/components/ui-foundation.test.ts
pnpm test tests/unit/profile/profile-avatar-source.test.ts
pnpm test tests/unit/storage/profile-avatar.test.ts
pnpm test tests/unit/storage
pnpm build
```

If `pnpm build` changes the generated route tree, restore it:

```powershell
git restore src\routeTree.gen.ts
```

## 13. Manual QA Checklist

1. Open Profile page.
2. Confirm layout matches screenshot/prototype.
3. Confirm initials fallback appears before upload.
4. Upload valid png/jpg/webp under size cap.
5. Confirm avatar appears on Profile page.
6. Replace avatar with another valid image.
7. Remove avatar and confirm initials fallback returns.
8. Try invalid file type and oversized file; safe error appears.
9. Confirm no raw path/token/storage info appears in UI/network response.
10. Confirm Ganti Password still works.
11. Confirm logout/keluar still works.
12. Confirm mobile 390px layout is usable.
13. Confirm no document/archive preview/download behavior changed.

## 14. Protected Files Confirmation

Expected unchanged:

- `.env`
- `.env.migration`
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `src/routeTree.gen.ts`
- `supabase/`

Schema/migration files changed only for the narrow `auth.users` avatar metadata foundation.
