# Interview Transcript: SPEC 07 — Chairman Assignment

## Tanggal: 2026-05-03

---

## Pertanyaan & Jawaban

### Q1: Auto-determine vs Manual
**Q:** Apakah sistem harus auto-detect (otomatis set sebagai chairman jika ada di assignment), atau manual toggle seperti sekarang?

**A:** 
> Jika di kegiatan tersebut, user tersebut merupakan chairman, maka sistem auto set ia sebagai chairman, begitu juga jika bukan chairman, maka sistem otomatis set sebagai anggota

**Clarification:** Toggle button "Ketua Tim / Anggota" di halaman Ajukan Dokumen akan dihapus. Sistem akan otomatis mendeteksi berdasarkan `ketua_tim_assignments` setelah user memilih kegiatan.

---

### Q2: Chairman bisa submit sebagai anggota?
**Q:** Jika user chairman di kegiatan X, apakah mereka masih bisa submit dokumen sebagai "anggota" di kegiatan X?

**A:**
> Untuk kegiatan dimana ia merupakan ketua tim, misal user adalah ketua tim sakernas, maka ia tidak bisa submit sebagai anggota di kegiatan sakernas, namun ia bisa submit sebagai anggota di kegiatan lain (malah auto set ia sebagai anggota, jika ia bukan ketua tim)

**Clarification:**
- Di kegiatan `sakernas` (user = chairman): WAJIB submit sebagai chairman, tidak bisa pilih "anggota"
- Di kegiatan `susenas` (user ≠ chairman): WAJIB submit sebagai anggota
- Sistem auto-set berdasarkan `ketua_tim_assignments`, user tidak bisa override

---

### Q3: Badge di halaman detail
**Q:** Apakah badge juga perlu tampil di halaman detail dokumen (PPK, Bendahara, Arsiparis)?

**A:**
> Badge tidak perlu tampil di halaman detail, kan sudah ada metadata peran (anggota atau ketua tim)

**Clarification:** Badge hanya tampil di:
- Halaman Ajukan Dokumen (setelah pilih kegiatan)
- Tidak perlu di halaman Review, detail, inbox, dll (sudah ada field "Peran" di metadata)

---

### Q4: Constraint 1 kegiatan = 1 chairman
**Q:** Bagaimana jika admin mau assign chairman baru ke kegiatan yang sudah punya chairman?

**A:**
> Admin bisa meng-assign chairman baru, namun ada pesan pemberitahuan "Apakah anda yakin ingin menunjuk 'nama user' sebagai chairman kegiatan 'xxx', ini akan menggantikan 'nama user chairman sebelumnya'"

**Clarification:**
- Admin bisa force-replace chairman
-系统 akan show confirmation dialog dengan info chairman sebelumnya
- Jika confirmed, sistem akan:
  1. Delete assignment lama
  2. Create assignment baru
- Atau bisa langsung replace tanpa confirmation (bisa diskusi lebih lanjut)

---

### Q5: User bisa chairman di banyak kegiatan
**Q:** Apakah 1 user bisa menjadi chairman di multiple kegiatan? Apakah admin bisa assign kegiatan chairman baru ke user yang sudah menjadi chairman?

**A:**
> Admin bisa meng-assign chairman kegiatan baru ke user yang sudah menjadi chairman di kegiatan lain, karena 1 user bisa menjadi chairman di banyak kegiatan, tapi 1 kegiatan hanya boleh 1 chairman. Dan ini juga bisa di assign oleh admin saat edit user

**Clarification:**
- 1 user → banyak kegiatan (UNLIMITED)
- 1 kegiatan → 1 chairman (UNIQUE constraint)
- Assign dilakukan dari halaman Edit User (section "Kegiatan sebagai Ketua Tim")

---

### Q6: Batas chairman per user
**Q:** Apakah ada batas jumlah kegiatan yang bisa di-chairman oleh satu user?

**A:**
> Tidak ada batasan chairman kegiatan oleh satu user

**Clarification:** User bisa chairman di semua kegiatan tanpa batasan.

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Role determination | Auto-detect berdasarkan `ketua_tim_assignments`, no manual toggle |
| Chairman constraint | 1 kegiatan = 1 chairman, bisa di-replace dengan confirmation |
| User dapat multiple chairman | Yes, 1 user bisa chairman di unlimited kegiatan |
| Badge location | Hanya di Ajukan Dokumen, tidak di halaman detail |
| User limit | No limit, unlimited kegiatan |

---

*End of interview*