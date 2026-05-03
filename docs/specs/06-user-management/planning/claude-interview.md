# Interview: SPEC 06 User Management

## Clarifying Questions & Answers

### Q1: Email uniqueness constraint
**Q:** Apakah duplicate email harus dicegah di database level (UNIQUE constraint) atau cukup di application level?
**A:** Application level saja cukup — Supabase Auth akan return error 400 jika email sudah ada. API harus handle dan return 409 Conflict.

### Q2: Self-service change password
**Q:** Apakah perlu verifikasi password lama sebelum bisa change password?
**A:** Ya, wajib. Gunakan `signInWithPassword` untuk verifikasi, baru `updateUser()` untuk update.

### Q3: User deactivation edge case
**Q:** Apakah admin boleh deactivate dirinya sendiri?
**A:** Tidak boleh. Validasi di server: `auth.uid() !== targetUserId`.

### Q4: Role PEGAWAI removal
**Q:** Jika admin remove role PEGAWAI dari user yang punya role lain (misal PPK), apakah allowed?
**A:** Tidak allowed. User harus punya minimal 1 role. Jika remove PEGAWAI, harus ada minimal 1 role lain yang tetap.

### Q5: Reactivate edge case
**Q:** User dinonaktifkan, lalu admin remove semua rolenya. Saat reactivate, user tidak punya role. Bagaimana?
**A:** Warning di UI saat admin remove role terakhir. Reactivate tetap allowed tapi user akan masuk tanpa role sampai admin assign ulang.

### Q6: Password reset confirmation
**Q:** Apakah password baru perlu di-email ke user, atau cukup shown once?
**A:** Password tidak perlu di-email. Admin harus communicate secara out-of-band (WhatsApp/chat). Password displayed sekali saat reset dan harus segera diubah user.

### Q7: Bulk operations
**Q:** Apakah perlu pagination untuk user list?
**A:** Ya, standard pagination. 10-20 users per page dengan sort by nama/email/created_at.

### Q8: NIP/NRP format
**Q:** Apakah ada format validation untuk NIP/NRP?
**A:** Numerik saja. Min 8 karakter, max 20 karakter.

### Q9: Activity history di halaman detail user
**Q:** Apakah perlu implementasi activity history sekarang?
**A:** Tidak untuk MVP. Section placeholder dengan note "Activity history will be available in future version."

### Q10: User profile page
**Q:** Apakah profile page perlu SSR protection atau cukup client-side?
**A:** SSR dengan `requireAuth()` — user hanya bisa lihat profilnya sendiri.

## Open Questions (for spec)

1. **Departemen field** — Apakah ini free text atau dropdown dari master data?
   - Decision: Free text untuk MVP (sesuai spec original)

2. **Avatar/Profile picture** — Apakah perlu upload capability?
   - Decision: Tidak untuk MVP. Gunakan inisial dari nama.

3. **Session timeout** — Apakah perlu configurable session expiry?
   - Decision: Default Supabase policy (1 hour). Tidak ada custom logic.

## Assumptions (confirmed during interview)

1. User tidak bisa self-register — hanya admin yang bisa create
2. No hard delete — deactivate only
3. No SSO/OAuth integration
4. No 2FA untuk MVP
5. No bulk import dari CSV
6. Password policy: minimal 8 karakter
7. Role badge colors sudah fix di spec (tidak perlu konfigurasi)

## Interview Transcript Summary

Topic ini sudah cukup jelas dari spec original. Tidak ada ambiguitas besar yang perlu di-resolve. Implementation straightforward dengan pattern yang sudah ada di codebase.
