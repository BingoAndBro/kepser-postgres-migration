# Synthesized Spec: SPEC 06 User Management

## Problem Statement

Aplikasi DMS BPS tidak memiliki kemampuan untuk mengelola user accounts dari dalam aplikasi. Admin harus ke Supabase Dashboard untuk create user, dan user tidak bisa mengubah password sendiri. Spec 06 memberikan kemampuan full user lifecycle management kepada ADMIN, dan self-service password change kepada semua user.

## Goals

1. ADMIN dapat membuat, mengedit, menonaktifkan, dan mereset password user直接从 dalam aplikasi
2. Semua user dapat mengganti password sendiri dengan verifikasi password lama
3. User dapat melihat profil mereka sendiri (nama, email, NIP, role)
4. Master User page menampilkan data real dari database, menggantikan mock data

## Non-Goals (Explicit Exclusions)

- User self-register / invite via email
- User edit profile fields (nama, NIP, departemen) sendiri
- Bulk user creation / CSV import
- Hard delete user
- SSO / OAuth login
- Two-factor authentication (2FA)
- Login activity tracking
- Chairman assignment per kegiatan (→ SPEC 07)
- Menu "Laporan Kegiatan" (→ SPEC 07)
- Badge info di Ajukan Dokumen (→ SPEC 07)

## Context & Constraints

- Aplikasi sudah punya 5 test users yang dibuat manual
- Auth menggunakan Supabase dengan `auth.users` table
- Role static: PEGAWAI, PPK, BENDAHARA, ARSIPARIS, ADMIN
- Service role key harus di server-side only
- No hard delete — Supabase Auth tidak support

## Key Decisions Made

1. **Email uniqueness** — handle di application level (Supabase Auth return error 400)
2. **Password verification** — wajib pakai `signInWithPassword` sebelum `updateUser`
3. **Self-deactivation prevention** — validasi `auth.uid() !== targetUserId`
4. **Minimum role** — user harus punya minimal 1 role (PEGAWAI mandatory)
5. **Password reset** — hanya shown sekali, tidak di-email
6. **Departemen** — free text field (bukan dropdown)

## Assumptions

1. Admin credentials (service role key) sudah ada di `.env`
2. Tabel `user_roles` dan `roles` sudah ada dengan data seed
3. RLS policies untuk `user_roles` sudah di-setup
4. `SUPABASE_SERVICE_ROLE_KEY` sudah ada di environment

## Open Questions

1. **Activity History** — Tidak diimplementasi untuk MVP. Placeholder section di halaman detail user.
2. **Pagination size** — Default 10 per page, configurable?
   - Decision: 10 per page, simple prev/next pagination
