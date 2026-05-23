# Interview: SPEC 05 — Arsip Flow

## Pertanyaan & Jawaban

---

### Q1: Cron job authentication — bagaimana cron endpoint di-authenticate?
**Spec tidak menyebutkan mekanisme keamanan untuk `/api/cron/arsip-retensi`.**
- Apakah pakai secret key (misalnya via header `x-cron-secret`)?
- Atau menggunakan Supabase service role?
- Apakah endpoint ini harus hanya bisa dipanggil dari dalam infrastruktur (bukan public internet)?

**Jawaban:** Pakai **Supabase Edge Function dengan schedule pg_cron**. Cron berjalan di dalam Supabase — tidak perlu secret key external. Fungsi edge ini akan dijalankan secara terjadwal (misal: daily) dan akan melakukan auto-transition arsip berdasarkan masa retensi.

---

### Q2: Apakah `status_arsip` harus ada di tabel `arsip`, atau cukup dibaca dari `arsip_verifikasi_penyusutan` dan `arsip_usul_musnah`?
**Spec sudah include `status_arsip` di tabel `arsip`, tapi ada opsi lain:**
- Opsi A: `status_arsip` di tabel `arsip` (denormalized, query lebih cepat)
- Opsi B: hanya ada di sub-table, query dilakukan via JOIN
- Opsi C: ada di `arsip` tapi juga bisa ditentukan dari kondisi sub-table

**Keputusan:** Spec sudah memutuskan Opsi A (denormalized di `arsip`). Valid — lebih cepat untuk filtering.

---

### Q3: Log aktivitas untuk arsip — apakah perlu log terpisah dari log dokumen?
**Spec mention `log_aktivitas` yang sudah ada untuk dokumen. Tapi arsip punya lifecycle sendiri (VERIFIKASI_PENYUSUTAN, INAKTIF, USUL_MUSNAH).**
- Apakah `log_aktivitas` dokumen cukup untuk audit trail arsip?
- Atau arsip butuh log sendiri (`arsip_log`)?
- Atau log arsip disimpan di `log_aktivitas` tapi dengan `dokumen_id = arsip_id`? (tidak ideal karena itu UUID berbeda)

**Keputusan:** Spec tidak mengmention log terpisah. Menggunakan `log_aktivitas` yang ada dengan catatan khusus. Jika user butuh log terpisah, perlu ditambahkan.

---

### Q4: Preview arsip — apakah endpoint preview perlu di-copy dari role-specific (PPK/Bendahara) atau bisa dibuat generik?
**Spec bilang "sama seperti yang sudah ada di role PEGAWAI, PPK, dan Bendahara."**
- Option A: Buat `/api/arsip/[id]/preview/[filename]` baru (standalone)
- Option B: Pakai endpoint preview yang sudah ada (`/api/dokumen/[id]/preview/[index]`) karena arsip reference `dokumen_id`
- Option C: Buat helper/utility yang bisa dipakai di semua endpoint preview

**Keputusan:** Option A — endpoint baru di `/api/arsip/` agar scope jelas. Tapi reuse logika preview yang sudah ada (signed URL generation + mime type check).

---

### Q5: File deletion saat musnah — bagaimana handle storage cleanup?
**Spec mention "DELETE arsip (hapus record) + DELETE dokumen_transaksi lampiran dari storage".**
- Apakah hanya hapus file di storage? Atau juga update `lampiran_urls` di dokumen?
- Apakah dokumen yang diarsipkan perlu dipertahankan record-nya? (tidak — hanya arsip yang dihapus, dokumen tetap ada)
- Apakah ada referensi lain yang perlu di-cleanup?

**Keputusan:** Saat SETUJU musnah — hapus record di `arsip`, hapus file di storage bucket `dokumen-lampiran` berdasarkan `lampiran_urls` dari `dokumen_transaksi`. Dokumen record tetap ada (status `ARCHIVED` di `dokumen_transaksi`).

---

### Q6: Nomor surat uniqueness — spec bilang "disarankan unik tapi MVP tidak dibuat unique constraint."
**Ini sudah clear dari spec. Tidak ada pertanyaan tambahan.**

---

### Q7: Apakah arsip yang status_arsip = 'VERIFIKASI_PENYUSUTAN' masih bisa di-pindahkan manual lagi?
**Spec bilang hanya AKTIF → Verifikasi dan INAKTIF → Usul Musnah. Tapi bagaimana jika arsip sedang di VERIFIKASI_PENYUSUTAN (MENUNGGU) — bisakah di-cancel atau di-pindahkan lagi?**
- Asumsi: Tidak bisa. Once di VERIFIKASI_PENYUSUTAN, harus tunggu decide dari Arsiparis.
- Atau: Arsiparis bisa menarik kembali (cancel) dari MENUNGGU.

**Keputusan:** Tidak bisa cancel/pindahkan lagi saat sudah di VERIFIKASI_PENYUSUTAN (MENUNGGU). Harus tunggu decide. Ini sudah implicit di spec — "Pindahkan Sekarang" hanya muncul di halaman AKTIF dan INAKTIF, bukan di halaman verifikasi/usul musnah.

---

### Q8: Filter di halaman arsip (search) — apa yang di-filter?
**Spec bilang "menampilkan semua arsip (aktif, verifikasi penyusutan, inaktif, usul musnah)" tapi tidak ada filter untuk status_arsip.**
- Apakah perlu filter berdasarkan status_arsip di halaman search?
- Atau search cukup berdasarkan metadata (nomor surat, judul, fungsi, kegiatan)?

**Keputusan:** Search cukup filter metadata. Tidak perlu filter status_arsip di search karena semua user perlu bisa cari arsip independen dari status.

---

### Q9: RLS policies untuk tabel arsip baru — siapa yang bisa baca/tulis?
**Spec tidak specify RLS untuk `arsip`, `arsip_verifikasi_penyusutan`, `arsip_usul_musnah`.**
- Apakah semua user bisa read arsip? (sesuai spec: "semua user bisa search arsip")
- Apakah ARSIPARIS bisa write (archive, verify, musnah)?
- Apakah ADMIN bisa write?

**Keputusan:**
- `arsip`: SELECT = all authenticated users. INSERT = ARSIPARIS/ADMIN only.
- `arsip_verifikasi_penyusutan`: SELECT/UPDATE = ARSIPARIS/ADMIN only.
- `arsip_usul_musnah`: SELECT/UPDATE = ARSIPARIS/ADMIN only.
- `master_klasifikasi_arsip`: SELECT = all. INSERT/UPDATE/DELETE = Kepala Sub Bagian Umum.

---

### Q10: Edge case — apa yang terjadi jika dokumen yang sudah diarsipkan (ARCHIVED) ternyata perlu diedit?
**Lifecycle saat ini: COMPLETED → ARCHIVED (via arsipkan). Tapi spec tidak menyebutkan apakah edit memungkinkan setelah arsip.**
- Asumsi: Dokumen tidak bisa diedit setelah ARCHIVED. Jika perlu perubahan, Arsiparis harus "tidak diarsipkan" (SKIP) sebelum mengarsipkan ulang. Tapi SKIP tidak bisa di-undo.
- Atau: ada fitur edit arsip?

**Keputusan:** Tidak termasuk dalam scope. Dokumen yang diarsipkan tidak bisa diedit. Jika ada kesalahan, Arsiparis harus koordinasi di luar sistem (manual).

---

### Q11: Preview di halaman Arsip (semua user) — apakah perlu auth check?
**Halaman `/arsip/[id]` bisa diakses semua user. Apakah preview/download juga perlu auth?**
- Spec bilang "semua user bisa search arsip" dan "download arsip untuk semua user terautentikasi."
- Jadi semua authenticated user bisa preview dan download.

**Keputusan:** Authenticated user (login) bisa preview dan download arsip. Tidak perlu role check khusus untuk arsip search/preview/download.

---

### Q12: Apakah `arsip_verifikasi_penyusutan` perlu trigger unik per arsip_id?
**Misalnya, jika "Pindahkan Sekarang" ditekan 2x sebelum decide — apakah bisa ada 2 record?**
- Asumsi: Tidak bisa. UNIQUE constraint pada `arsip_id` di `arsip_verifikasi_penyusutan`.
- Jika sudah ada record MENUNGGU, tidak bisa pindahkan lagi.

**Keputusan:** UNIQUE constraint pada `arsip_id` di `arsip_verifikasi_penyusutan` dan `arsip_usul_musnah`. Hanya satu record aktif per arsip per tahap.

---

## Ringkasan Open Questions

| # | Pertanyaan | Status |
|---|---|---|
| Q1 | Cron authentication mechanism | **OPEN** — perlu keputusan |
| Q2 | status_arsip field | DECIDED — denormalized di tabel arsip |
| Q3 | Log aktivitas untuk arsip | DECIDED — reuse log_aktivitas yang ada |
| Q4 | Preview endpoint generik | DECIDED — endpoint baru di /api/arsip/, reuse logic |
| Q5 | File deletion saat musnah | DECIDED — hapus file storage + arsip record |
| Q6 | Nomor surat uniqueness | DECIDED — warning only, no constraint |
| Q7 | Cancel dari VERIFIKASI_PENYUSUTAN | DECIDED — tidak bisa, tunggu decide |
| Q8 | Filter status_arsip di search | DECIDED — tidak perlu, cukup metadata filter |
| Q9 | RLS policies untuk arsip tables | DECIDED — see decisions above |
| Q10 | Edit setelah ARCHIVED | OUT OF SCOPE |
| Q11 | Auth untuk arsip preview | DECIDED — authenticated user only |
| Q12 | Unique constraint arsip_id | DECIDED — UNIQUE constraint per sub-table |

**Hanya Q1 (Cron authentication) yang perlu jawaban dari user sebelum implementasi dimulai.**
