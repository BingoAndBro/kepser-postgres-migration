# Validasi Rancangan Bab IV terhadap Kode

> **Objek validasi:** `docs/planning/ubah-alur-v1/kerangka-bab-iv.md` (Revisi 7.1).
> **Sumber kebenaran:** kode di branch `workflow/ubah-alur-v1`, commit `56c6a6d` (termasuk migrasi `drizzle/0018_berkas_tahun_anggaran.sql`).
> **Metode:** graphify (`graphify-out/GRAPH_REPORT.md`, dibangun 19-09-2026, jadi lebih lama dari 3 commit terakhir) dipakai sebagai peta awal: god node `getLocalServerSession()`/`hasLocalRole()`, hyperedge FSM, siklus berkas, dan pipeline submit. **Semua klaim di bawah diverifikasi ulang langsung ke kode.** Dokumen lain di repo (termasuk "Peta Kode") tidak dipakai sebagai bukti.
> **Mode:** baca saja. Tidak ada file kode yang diubah.
> Semua path relatif terhadap `src/` kecuali yang diawali `drizzle/` atau `tests/`.

---

## A. Ringkasan

### Tingkat kesesuaian

| Status | Jumlah butir |
|---|---|
| SESUAI | 50 |
| BEDA | 25 |
| TIDAK ADA DI KODE | 0 |
| ADA DI KODE TAPI TIDAK DI RANCANGAN | 21 |

**Kesesuaian = 50 / 75 butir rancangan yang dapat diperiksa = ±67%.** Tidak ada satu pun dari 24 use case yang tidak ada di kode; semua "BEDA" adalah selisih pada detail aturan, bukan fitur yang hilang. Namun ada **21 hal di kode yang belum tercatat** di kerangka, dan beberapa di antaranya layak menjadi bahan Bab IV (lihat bagian C).

### Lima temuan terpenting

1. **Aturan "satu berkas `OPEN` per klasifikasi" sudah tidak berlaku.** Commit terakhir (`56c6a6d`) menghapus *partial unique index* `berkas_arsip_open_klasifikasi_unique` dan menggantinya dengan *unique index* biasa atas `(klasifikasi_id, tahun_anggaran)` (`drizzle/0018_berkas_tahun_anggaran.sql:25-28`; `db/schema/arsip/berkas-arsip.ts:60-61`). Aturannya sekarang **satu berkas per cara pembayaran per tahun anggaran**, apa pun statusnya. KSBU wajib memilih tahun anggaran saat mengklasifikasikan dan saat menambah dokumen manual. Kerangka 4.2.2.3, 4.2.3, UC-13, dan UC-14 harus direvisi.
2. **Hak akses di server mengikuti *seluruh* peran yang dimiliki, bukan peran aktif.** `hasLocalRole()` memeriksa `session.roles` (`lib/auth/local-server-auth.ts:69-74`); peran aktif hanya disimpan di cookie untuk memilih menu. Pengguna Pegawai+PPK tetap bisa memanggil API PPK saat peran aktifnya Pegawai. Selain itu, setiap pengguna non-Admin **selalu** otomatis diberi peran PEGAWAI (`lib/users/role-assignment.ts:13-15`, dipakai di `lib/users/local-user-mutations.ts:64,138`). Ini keputusan rancangan yang harus ditulis di 4.1.3.3 (a) dan (e).
3. **Checklist kelengkapan di klien dan di server memakai aturan pencocokan yang berbeda.** Klien mencocokkan tepat enam kolom (`components/dokumen/KelengkapanChecklist.tsx:57-72`). Server hanya mencocokkan `kegiatan_id`, `is_ketua_tim`, dan simpul terdalam rantai Jenis–Kategori–Detail; `komponen_id` diabaikan bila rantai permintaan diisi (`lib/dokumen/local-submit-drizzle-adapter.ts:161-190`). Klaim kerangka tentang "*exact-match* atas keenam kolomnya" hanya benar di sisi klien.
4. **Masih ada dua jalur yang melewati modul transisi status, bukan satu.** Jalur non-material yang sah (`DRAFT → TERSIMPAN`, `lib/dokumen/local-submit-write-bridge.ts:442-456`) memang disengaja. Tetapi rute lama `POST /api/dokumen/$id/submit` masih mengubah dokumen non-material `DRAFT` menjadi **`COMPLETED`**, bukan `TERSIMPAN` (`routes/api/dokumen.$id.submit.ts:131-137`). Rute ini masih bisa dipanggil untuk baris `DRAFT` yang dibuat lewat `POST /api/dokumen` (`routes/api/dokumen/index.ts:73-140`), walaupun UI tidak lagi memakai cabang tersebut. Pengecualian yang disebut kerangka ("satu-satunya") tidak akurat.
5. **Pembagian lapisan rute → layanan → *repository* (KNF-12) hanya berlaku sebagian.** Injeksi *repository* memang ada di pengajuan (`lib/dokumen/local-submit-write-bridge.ts:96-110`), layanan berkas (`lib/archive/berkas-arsip-service.ts:173-209`), dan pembersihan (`lib/dokumen/pembersihan-service.ts:114-126`). Namun rute persetujuan/penolakan PPK–PPSPM, revisi, dan ubah/hapus dokumen memanggil Drizzle langsung dari *handler* rute (mis. `routes/api/ppk/dokumen/$id/approve.ts:54-112`). *Sequence diagram* 4.24 tidak boleh menggambar lapisan "Layanan" di antara FSM dan Drizzle.

---

## B. Tabel per bagian

Singkatan status: **S** = SESUAI · **B** = BEDA · **T** = TIDAK ADA DI KODE · **A** = ADA DI KODE TAPI TIDAK DI RANCANGAN.

### B.1 Aktor dan peran

| Butir rancangan | Status | Fakta di kode | Bukti | Usulan koreksi untuk kerangka |
|---|---|---|---|---|
| Enam peran login + Ketua Tim = 7 aktor | S | Enum peran: `PEGAWAI, PPK, PPSPM, KEPALA_SUB_BAGIAN_UMUM, PENANGGUNG_JAWAB_KINERJA, ADMIN` | `lib/constants/roles.ts:1-8` | — |
| Ketua Tim adalah penugasan per kegiatan, bukan peran login | S | Tabel `master.ketua_tim_assignments(user_id, kegiatan_id)`; menu Ketua Tim disembunyikan bila tidak ada penugasan; server mengecek ulang penugasan | `db/schema/master/ketua-tim-assignments.ts:13-32`; `components/layout/AppSidebar.tsx:52,83-91`; `routes/api/pembersihan-dokumen.bersihkan.ts:47-62` | — |
| (tidak disebut) satu kegiatan hanya punya satu Ketua Tim | A | *Unique index* pada `kegiatan_id`; satu pengguna boleh memimpin banyak kegiatan | `db/schema/master/ketua-tim-assignments.ts:28,34-36` | Tambahkan ke narasi aktor dan ke ERD 4.30 sebagai aturan data |
| Admin tidak dapat digabung dengan peran lain | S | Divalidasi di layanan; basis data tidak bisa menegakkannya (komentar skema) | `lib/auth/role-resolution.ts:26-28`; `lib/users/role-assignment.ts:9-11`; `db/schema/auth/user-roles.ts:28-30` | Sebut bahwa invarian ini ditegakkan di lapisan layanan, bukan *constraint* DB |
| Admin tidak dapat berpindah peran | S | `role-switch` mengembalikan 403 untuk akun ADMIN | `routes/api/auth/role-switch.ts:62-66` | — |
| (tidak disebut) setiap pengguna operasional selalu juga Pegawai | A | Saat Admin menyimpan peran non-Admin, PEGAWAI selalu ditambahkan | `lib/users/role-assignment.ts:13-15`; `lib/users/local-user-mutations.ts:64,138` | Generalisasi di diagram M1 lebih tepat: semua peran operasional "adalah" Pegawai. Pertimbangkan menjadikan PPK/PPSPM/KSBU/PJK sebagai spesialisasi Pegawai |
| Otorisasi ditegakkan server; menu hanya kosmetik | S | Setiap rute API memeriksa sesi dan peran; *guard* klien hanya mengalihkan halaman | `lib/auth/local-server-auth.ts:84-106`; `routes/api/ppk/dokumen/$id/approve.ts:25-33`; `lib/guards.ts:50-60` | — |
| Peran aktif menentukan hak | B | Server memeriksa **semua** peran yang dimiliki (`session.roles`); `activeRole` tidak dipakai di satu pun rute API selain login/sesi/role-switch | `lib/auth/local-server-auth.ts:69-82`; hasil `grep activeRole routes/api` (hanya `auth/login.ts`, `auth/role-switch.ts`, `auth/session.ts`, `users/me.ts`) | Tulis eksplisit: "*role switcher* mengatur ruang kerja antarmuka; hak akses server mengikuti gabungan peran yang ditetapkan Admin" |

### B.2 Dua puluh empat use case

| UC | Status | Fakta di kode (halaman · API · aktor yang diizinkan server) | Bukti | Usulan koreksi |
|---|---|---|---|---|
| UC-01 Login | B | Masuk dengan **username atau NIP**, bukan email; akun nonaktif ditolak; batas 5 gagal per 10 menit; sesi 8 jam | `lib/schemas/auth.ts:6`; `lib/auth/local-auth-service.ts:70,155`; `lib/auth/login-rate-limit.ts:3-4`; `lib/auth/session-constants.ts:9` | Ganti "email" menjadi "username atau NIP" di Lampiran A |
| UC-02 Logout | S | `POST /api/auth/logout` | `routes/api/auth/logout.ts` | — |
| UC-03 Mengelola Profil dan Kata Sandi | S | `/profile`; `GET/POST/DELETE /api/users/me` (termasuk avatar); `POST /api/users/me/change-password`. Riwayat aktivitas **bukan** bagian halaman Profil, melainkan menu "Activity Log" tersendiri | `routes/profile.tsx`; `routes/api/users/me.ts`; `routes/api/users/me/change-password.ts`; `config/navigation.ts:72,106,139,164,189,221` | Pindahkan "melihat riwayat aktivitas sendiri" ke UC terpisah atau sebut sebagai menu lain (lihat baris Activity Log di bawah) |
| UC-04 Berpindah Peran Aktif | S | Hanya untuk peran yang dimiliki; Admin ditolak | `routes/api/auth/role-switch.ts:57-78` | — |
| UC-05 Mengajukan Dokumen | B | `/pegawai/dokumen/aju` → `POST /api/dokumen/submit` (PEGAWAI). Server mewajibkan: lampiran ≥1, `komponenId` (material) atau `namaDokumen` (non-material), `nominal_realisasi > 0` (material), tanggal ≤ hari ini, dan checklist wajib. Server **tidak** mewajibkan jenis/kategori/detail untuk material. Status Ketua Tim dideteksi klien (`/api/users/me/is-ketua-tim/$id`); server hanya memverifikasi bila klien mengirim `true`. Ada lampiran tambahan bebas (`user-custom-…`) | `routes/api/dokumen/submit.ts:430-459`; `lib/schemas/dokumen.ts:12,109-145,176-228`; `lib/dokumen/local-submit-write-bridge.ts:274-323`; `routes/pegawai/dokumen/aju.tsx:492` | Tulis urutan langkah nyata (lihat B.5); sebut lampiran tambahan bebas; sebut bahwa kelengkapan wajib diperiksa ulang di server |
| UC-06 Mengelola Dokumen yang Diajukan | S | Ubah non-material hanya bila `TERSIMPAN` dan lampiran belum dibersihkan; hapus permanen non-material hanya bila `TERSIMPAN` dan belum masuk berkas, dengan jejak `audit_log` | `routes/api/dokumen.$id.ts:495-509,747-813` | Sebut syarat ubah/hapus sebagai prakondisi skenario |
| UC-07 Merevisi Dokumen yang Ditolak | S | `/pegawai/dokumen/$id/revisi` → `PATCH /api/dokumen/$id` lalu `POST /api/dokumen/$id/submit` (aksi `RESUBMIT`) | `routes/pegawai/dokumen/$id/revisi.tsx:319`; `routes/api/dokumen.$id.submit.ts:141-148` | — |
| UC-08 Membersihkan Lampiran Dokumen Non-Material | B | Umur >90 hari hanya **penanda**, bukan syarat; dokumen yang lebih muda tetap boleh dibersihkan. Frasa konfirmasi `BERSIHKAN`; maksimal 200 dokumen per permintaan; hanya non-material "murni" (tanpa rantai jenis permintaan); status tetap `TERSIMPAN`; audit `DOKUMEN_LAMPIRAN_DIBERSIHKAN` | `lib/dokumen/pembersihan.ts:10,18,21`; `lib/dokumen/pembersihan-service.ts:55-99,337-361`; `routes/pegawai/pembersihan-dokumen.tsx:127,260,486` | Ganti "penanda usia > 90 hari" menjadi "penanda (bukan syarat)"; cantumkan frasa `BERSIHKAN` |
| UC-09 Memvalidasi Dokumen | S | `/ppk/inbox` → `POST /api/ppk/dokumen/$id/approve` / `reject` (PPK). Catatan tolak wajib 10–2000 karakter | `routes/api/ppk/dokumen/$id/approve.ts:31,75-112`; `routes/api/ppk/dokumen/$id/reject.ts:31-44,83`; `lib/schemas/dokumen.ts:150-152` | — |
| UC-10 Menindaklanjuti Dokumen yang Ditolak PPSPM | S | `/ppk/revisi` → `GET/PATCH/POST /api/ppk/resubmit/$id` (PPK memperbaiki lampiran dan/atau nominal, lalu `RESUBMIT_PPK`); alternatif `POST /api/ppk/kembalikan/$id` dengan catatan otomatis | `routes/api/ppk/resubmit/$id.ts:190,225-306,396-455`; `routes/api/ppk/kembalikan/$id.ts:10,57-74` | Sebut bahwa catatan "kembalikan" dibuat otomatis, bukan diketik PPK |
| UC-11 Menyetujui Dokumen | S | `/ppspm/inbox` → `POST /api/ppspm/dokumen/$id/approve` / `reject` (PPSPM); ada penjaga persetujuan ganda lewat `log_aktivitas` | `routes/api/ppspm/dokumen/$id/approve.ts:58-77`; `routes/api/ppspm/dokumen/$id/reject.ts:60-81` | — |
| UC-12 Melihat Dokumen yang Telah Diproses | S | PPK: `/ppk/tervalidasi`, `/ppk/ditolak`; PPSPM: `/ppspm/ditolak`, `/ppspm/selesai` | `config/navigation.ts:86-88,120-121`; `routes/api/ppk/tervalidasi.ts`; `routes/api/ppspm/selesai.ts` | — |
| UC-13 Mengklasifikasikan Dokumen ke Berkas | B | `/kasubag/inbox` → `POST /api/kasubag/dokumen/$id/archive` (KSBU). Wajib memilih **cara pembayaran dan tahun anggaran**; hanya dokumen `COMPLETED`; berkas dicari/dibuat per `(klasifikasi, tahun_anggaran)` | `routes/api/kasubag/dokumen.$id.archive.ts:56,61-70,102-109`; `lib/archive/berkas-arsip-service.ts:271-294` | Tambahkan "tahun anggaran" ke cakupan UC-13 |
| UC-14 Menambahkan Dokumen tanpa Alur Persetujuan | B | `/kasubag/penambahan-arsip` → `POST /api/kasubag/manual-arsip` (KSBU). Selain fungsi→kegiatan→komponen→nama, wajib: tanggal, keterangan, **cara pembayaran, tahun anggaran, nominal realisasi**; langsung ke berkas terbuka lewat *get-or-create* yang sama | `lib/schemas/manual-arsip.ts:91-120`; `lib/manual-arsip.ts:187-191,265-275` | Lengkapi cakupan UC-14 dengan cara pembayaran, tahun anggaran, dan nominal |
| UC-15 Mengelola Berkas | B | Tutup berkas mensyaratkan ≥1 isi, Nomor SPM, dan Masa Simpan Minimal (tanggal tutup opsional). Setelah tutup dan selama `AKTIF`, metadata masih bisa diubah (`PATCH /api/kasubag/berkas/$id`). Ada ekspor ZIP per berkas dan ekspor CSV daftar berkas. **Tidak** ada konfirmasi ketik-persis saat menutup | `lib/archive/berkas-arsip-service.ts:377-423,475-520`; `lib/schemas/berkas-arsip.ts:49-60`; `routes/api/kasubag/berkas/$id/export-zip.ts`; `routes/kasubag/berkas/tertutup.tsx:107-110` | Tambahkan "ubah metadata berkas tertutup" dan "ekspor CSV"; hapus "tutup berkas" dari daftar aksi berkonfirmasi ketik-persis (KNF-04) |
| UC-16 Membersihkan File Berkas | S | Aksi `propose_destruction`, `cancel_proposal`, `approve_destruction` (+ frasa `BERSIHKAN FILE BERKAS`) | `routes/api/kasubag/berkas/$id/lifecycle.ts:20-31`; `lib/archive/berkas-arsip-service.ts:904-930`; `lib/archive/berkas-arsip-page-format.ts:16` | Catat bahwa server tidak mensyaratkan jatuh tempo untuk usulan (lihat B.4) |
| UC-17 Mengelola Klasifikasi Dokumen | S | `GET/POST /api/kasubag/klasifikasi`, `PATCH/DELETE /api/kasubag/klasifikasi/$id` (KSBU). Ada **hapus** (409 bila dipakai), bukan hanya menonaktifkan | `routes/api/kasubag/klasifikasi/index.ts`; `routes/api/kasubag/klasifikasi/$id.ts:314-337` | Tambahkan "menghapus bila belum dipakai" |
| UC-18 Melihat Laporan Saya | S | Hanya dokumen milik sendiri berstatus `COMPLETED`/`TERSIMPAN`; ekspor ZIP (PEGAWAI) | `routes/api/laporan/saya.ts:83-84`; `routes/api/laporan/saya.export-zip.ts` | Sebut bahwa dokumen yang masih diproses tidak masuk laporan |
| UC-19 Melihat Laporan Kegiatan | S | Dibatasi kegiatan dalam `ketua_tim_assignments`; ekspor ZIP maksimal 500 dokumen | `routes/api/laporan/kegiatan.ts:46-56`; `routes/api/laporan/kegiatan.export-zip.ts:27,50-52,120` | — |
| UC-20 Memantau Nominal Realisasi | B | Satu *endpoint* dengan UC-21 (`GET /api/laporan/kinerja`, izin PJK/PPK/PPSPM). Hanya material `COMPLETED` yang ber-`komponen_id`; dokumen dalam berkas `DIMUSNAHKAN` **dikeluarkan** dari total | `routes/api/laporan/kinerja.ts:22-33,105-114,130-164`; `components/kinerja/MonitoringRealisasiView.tsx:199-200` | Sebut pengecualian dokumen yatim tanpa komponen dan dokumen dalam berkas yang sudah dibersihkan |
| UC-21 Melihat Laporan Kinerja | B | Perbedaan cakupan dengan UC-20 ditentukan parameter `?scope=laporan_kinerja` yang dikirim halaman PJK, **bukan** oleh peran di server; PPK/PPSPM secara teknis bisa meminta cakupan yang sama. PJK tidak punya akses ke lampiran (metadata saja) | `routes/api/laporan/kinerja.ts:120,167-173`; `routes/penanggung-jawab-kinerja/index.tsx:43`; `lib/storage/document-file-access.ts:353-367` | Jangan klaim "cakupan data berbeda per peran ditegakkan server"; tulis "berbeda per halaman" atau ajukan perbaikan kode |
| UC-22 Mengelola Pengguna dan Penugasan Ketua Tim | S | `/admin/master-data/user` → `/api/users/*` (ADMIN): buat, ubah, aktif/nonaktif, reset sandi, lihat avatar; `/api/ketua-tim/*` (ADMIN). Admin terakhir dan admin diri sendiri dilindungi | `routes/api/users/*`; `routes/admin.master-data.user.tsx:720-838`; `lib/users/role-assignment.ts:47-83` | Sebut perlindungan "minimal satu Admin aktif" |
| UC-23 Mengelola Data Master | B | Semua master punya rute CRUD (ADMIN). **Master Jenis Dokumen** punya halaman (`/admin/master-data/jenis-dokumen`) tetapi **tidak ada di menu** | `config/navigation.ts:194-225`; `routes/admin.master-data.jenis-dokumen.tsx`; `routes/api/master-jenis-dokumen.ts` | Hapus "jenis dokumen" dari cakupan UC-23, atau catat sebagai data peninggalan yang disembunyikan |
| UC-24 Mengatur Tampilan Aplikasi | S | `/admin/settings` → `PUT /api/settings/general` dan `/theme` (ADMIN); tiga tema `se`, `sp`, `st` | `routes/api/settings/theme.ts`; `routes/api/settings/general.ts`; `lib/schemas/settings.ts:3` | — |
| Activity Log per peran | A | Enam halaman `…/activity-log`; `GET /api/activity-log` menampilkan semua aktivitas bagi ADMIN dan PJK, dan aktivitas sendiri bagi yang lain | `routes/*/activity-log.tsx`; `routes/api/activity-log.ts:15` | Tambahkan UC "Melihat Riwayat Aktivitas", atau tulis sebagai langkah di UC-03 dengan catatan cakupan global untuk Admin/PJK |
| Perawatan penyimpanan oleh Admin | A | `GET /api/admin/analyze-storage`, `GET/POST /api/admin/cleanup-orphan-files` (ADMIN), tanpa halaman UI | `routes/api/admin/analyze-storage.ts`; `routes/api/admin/cleanup-orphan-files.ts` | Putuskan: masuk UC-24/UC baru atau dicatat sebagai utilitas di luar cakupan |
| Ubah nominal realisasi | A | `PATCH /api/dokumen/$id/nominal`: pembuat atau KSBU boleh mengubah nominal (dan `is_non_material`) selama dokumen material belum `COMPLETED`, termasuk saat masih divalidasi; tidak ada pemanggil di UI | `routes/api/dokumen/$id.nominal.ts:24-26,77-84,102-108` | Perlu keputusan (lihat D). Jangan dimasukkan ke rancangan bila memang tidak dipakai |
| API DRAFT lama | A | `POST /api/dokumen` membuat `DRAFT`; cabang `DRAFT` di `/api/dokumen/$id/submit` masih aktif (non-material → `COMPLETED`) | `routes/api/dokumen/index.ts:73-140`; `routes/api/dokumen.$id.submit.ts:94-138` | Lihat temuan A.4; sebaiknya dinyatakan usang di Bab IV |
| Lampiran tambahan bebas | A | Pengguna boleh menambah lampiran di luar checklist (`user-custom-{uuid}`); nama tidak boleh duplikat | `lib/schemas/dokumen.ts:12,23-31`; `components/dokumen/KelengkapanChecklist.tsx:38-42,96-105` | Tambahkan ke cakupan UC-05 dan wireframe no. 6 |
| Ubah metadata berkas tertutup | A | Hanya saat `CLOSED` + `AKTIF` | `lib/archive/berkas-arsip-service.ts:475-490` | Masukkan ke UC-15 |
| Ekspor CSV daftar berkas | A | CSV metadata daftar berkas terbuka/tertutup | `routes/kasubag/berkas/tertutup.tsx:107-110`; `lib/archive/berkas-arsip-csv.ts` | Sudah disebut di 4.21 secara umum; tambahkan ke UC-15 |

Catatan: dasbor per peran (`routes/*/index.tsx`) memang ada dan sengaja tidak dijadikan UC oleh kerangka; keputusan itu konsisten dengan kode. Rute `/dokumen/*` hanya mengalihkan ke `/pegawai/dokumen/*` (`routes/dokumen.tsx:5-7`, `routes/dokumen/aju.tsx:5-7`) dan tidak perlu disebut.

### B.3 State machine dokumen

**Status dan aksi yang ada** (`lib/constants/document-status.ts:1-44`): status `DRAFT, IN_PPK_VALIDATION, IN_PPSPM_APPROVAL, NEED_REVISION, COMPLETED, TERSIMPAN`; aksi FSM `SUBMIT, APPROVE, REJECT, RESUBMIT, RESUBMIT_PPK, KEMBALIKAN`; `revision_target ∈ {USER, PPK, null}`; `current_step ∈ {PPK, PPSPM, null}`.

**Tabel transisi menurut kode** (`lib/fsm.ts:19-68` untuk hasil, `:129-156` untuk aktor, `:95-115` untuk syarat `revisionTarget`; prasyarat dari rute):

| # | Status asal | Aksi | Aktor | Status tujuan | `revision_target` baru | Prasyarat nyata | Catatan wajib? | Aksi log | Rute |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `DRAFT` | `SUBMIT` | PEGAWAI | `IN_PPK_VALIDATION` | null | Lampiran ≥1; kelengkapan wajib; material: `komponenId` & nominal >0; bila `isKetuaTim=true` harus ada penugasan | Tidak | `SUBMIT` | `routes/api/dokumen/submit.ts:430-459`; `lib/dokumen/local-submit-write-bridge.ts:274-323` |
| 2 | `IN_PPK_VALIDATION` | `APPROVE` | PPK | `IN_PPSPM_APPROVAL` | null | Status harus `IN_PPK_VALIDATION`; *body* kosong (strict) | Tidak | `PPK_APPROVE` | `routes/api/ppk/dokumen/$id/approve.ts:75-110` |
| 3 | `IN_PPK_VALIDATION` | `REJECT` | PPK | `NEED_REVISION` | `USER` | Status `IN_PPK_VALIDATION` | **Ya**, 10–2000 karakter | `PPK_REJECT` | `routes/api/ppk/dokumen/$id/reject.ts:76-118` |
| 4 | `IN_PPSPM_APPROVAL` | `APPROVE` | PPSPM | `COMPLETED` | null | Status `IN_PPSPM_APPROVAL`; belum ada log `PPSPM_APPROVE` | Tidak | `PPSPM_APPROVE` | `routes/api/ppspm/dokumen/$id/approve.ts:58-101` |
| 5 | `IN_PPSPM_APPROVAL` | `REJECT` | PPSPM | `NEED_REVISION` | `PPK` | Status `IN_PPSPM_APPROVAL` | **Ya**, 10–2000 karakter | `PPSPM_REJECT` | `routes/api/ppspm/dokumen/$id/reject.ts:60-106` |
| 6 | `NEED_REVISION` | `RESUBMIT` | PEGAWAI | `IN_PPK_VALIDATION` | null | `revision_target = USER`; dokumen material | Tidak | `RESUBMIT` | `routes/api/dokumen.$id.submit.ts:141-148` |
| 7 | `NEED_REVISION` | `RESUBMIT_PPK` | PPK | `IN_PPSPM_APPROVAL` | null | `revision_target = PPK`; boleh sekaligus memperbarui lampiran/nominal | Tidak | `RESUBMIT_PPK` | `routes/api/ppk/resubmit/$id.ts:396-455` |
| 8 | `NEED_REVISION` | `KEMBALIKAN` | PPK | `NEED_REVISION` (transisi ke diri sendiri) | `USER` | `revision_target = PPK` (dicek di rute, **tidak** di FSM) | Otomatis: "Dikembalikan ke pegawai oleh PPK" | `PPK_KEMBALIKAN` | `routes/api/ppk/kembalikan/$id.ts:10,57-87` |
| — | `DRAFT` | (tanpa FSM) | PEGAWAI | `TERSIMPAN` | null | Non-material: `namaDokumen` wajib | Tidak | `STORE` | `lib/dokumen/local-submit-write-bridge.ts:442-456` |

| Butir rancangan | Status | Fakta di kode | Bukti | Usulan koreksi |
|---|---|---|---|---|
| Enam status | S | Persis enam | `lib/constants/document-status.ts:1-8` | — |
| Enam aksi | S | Persis enam | `lib/constants/document-status.ts:35-42` | — |
| Delapan baris transisi | S | Delapan kunci pada `TRANSITIONS` | `lib/fsm.ts:19-68` | — |
| "Enam baris …" dan "`REJECT` … bercabang menurut `revision_target`" | B | Jumlahnya delapan. `REJECT` tidak bercabang menurut `revision_target`; tujuannya ditentukan oleh **status asal** (PPK→`USER`, PPSPM→`PPK`). Parameter `revisionTarget` pada `REJECT` hanya divalidasi, hasilnya tetap dari tabel. Yang benar-benar bergantung pada `revision_target` adalah `RESUBMIT` vs `RESUBMIT_PPK` | `lib/fsm.ts:32-49,95-115` | Perbaiki kalimat di 4.2.2.1: "delapan transisi dari enam aksi, karena `APPROVE` dan `REJECT` masing-masing berlaku pada dua status" |
| `DRAFT` sebagai status | A | `DRAFT` hanya ada sesaat di dalam satu transaksi: baris dibuat `DRAFT`, langsung diperbarui, lalu log ditulis | `lib/dokumen/local-submit-write-bridge.ts:230-234,371-401` | Gambarkan `DRAFT` sebagai status awal transien; tidak ada fitur "simpan draf" |
| Non-material `DRAFT → TERSIMPAN` tidak lewat FSM | S | Rencana transisi ditulis langsung, bukan melalui `transition()` | `lib/dokumen/local-submit-write-bridge.ts:442-456` | — |
| "Satu-satunya pengecualian" | B | Rute lama `/api/dokumen/$id/submit` juga melewati FSM untuk non-material dan menghasilkan `COMPLETED` | `routes/api/dokumen.$id.submit.ts:131-137` | Sebut sebagai kode usang atau minta rute ini dirapikan sebelum Bab V |
| Tidak ada `ARCHIVED`/`ARCHIVE`/`SKIP` | S | Tidak ada di kode | `lib/constants/document-status.ts`; `grep` nihil | — |
| (tidak disebut) kunci aksi lama `BENDAHARA_*` | A | Label log masih memetakan `BENDAHARA_APPROVE/REJECT` ke "PPSPM" untuk data lama | `lib/dokumen/aksi-labels.ts:20-21,53-54`; `components/dokumen/ActivityLog.tsx:30-31` | Cukup catatan kaki di kamus data `log_aktivitas` |
| (tidak disebut) `status` tanpa CHECK di DB | A | Kolom `status` bertipe `text` tanpa *constraint* nilai; keabsahan hanya dijaga aplikasi | `db/schema/dokumen/dokumen-transaksi.ts:43-49` | Jangan klaim integritas status ditegakkan DB; tulis "ditegakkan modul transisi status" |
| (tidak disebut) prasyarat `KEMBALIKAN` di rute | A | FSM hanya cek `NEED_REVISION`+PPK; syarat `revision_target = PPK` ada di rute | `lib/fsm.ts:151-152`; `routes/api/ppk/kembalikan/$id.ts:57-59` | Masukkan kolom "Prasyarat" tabel transisi |

### B.4 State machine berkas

| Butir rancangan | Status | Fakta di kode | Bukti | Usulan koreksi |
|---|---|---|---|---|
| `status_berkas` `OPEN → CLOSED`, wajib Nomor SPM + tanggal tutup | S | CHECK nilai + CHECK `closed_at/closed_by` terisi hanya saat `CLOSED`; Nomor SPM wajib di Zod | `db/schema/arsip/berkas-arsip.ts:62,72-76`; `lib/schemas/berkas-arsip.ts:49-55` | — |
| `status_arsip` `AKTIF → USUL_MUSNAH → DIMUSNAHKAN`, plus batalkan | S | Tabel transisi di layanan | `lib/archive/berkas-arsip-service.ts:904-930` | — |
| (tidak disebut) `status_arsip` wajib null selama `OPEN` | A | CHECK `status_berkas <> 'OPEN' or status_arsip is null`; saat ditutup langsung `AKTIF` | `db/schema/arsip/berkas-arsip.ts:68-71`; `lib/archive/berkas-arsip-service.ts:405-412` | Bagus untuk narasi "dua dimensi status" di Gambar 4.20 |
| *Partial unique index* satu berkas `OPEN` per klasifikasi | B | **Dihapus** di migrasi 0018; sekarang *unique* `(klasifikasi_id, tahun_anggaran)` tanpa syarat status | `drizzle/0007_folder_berkas_data_model_foundation.sql:180`; `drizzle/0018_berkas_tahun_anggaran.sql:25-28`; `db/schema/arsip/berkas-arsip.ts:60-61` | Ganti menjadi "satu berkas per cara pembayaran per tahun anggaran, ditegakkan *unique index* komposit" |
| "Klasifikasi yang berkasnya sudah `CLOSED` tidak boleh dipilih lagi" | B | Sekarang per tahun anggaran: bila berkas TA itu sudah ditutup → ditolak, tetapi TA berikutnya boleh dibuka | `lib/archive/berkas-arsip-service.ts:836-860`; komentar `drizzle/0018_berkas_tahun_anggaran.sql:2-6` | Tulis ulang; sebut alasan bisnis (siklus UP/TUP per tahun anggaran) |
| Tidak ada penjadwal | S | Tidak ada pustaka cron di dependensi; jatuh tempo dihitung saat dibaca | `lib/archive/retention.ts:81-104`; `lib/archive/berkas-arsip-read-model.ts:83`; `package.json` (nihil `cron`) | — |
| Ambang 90 hari dihitung saat halaman dibuka | S | `computeDokumenAging()` dipanggil di GET daftar | `lib/dokumen/pembersihan.ts:10,29-45`; `routes/api/pembersihan-dokumen.ts:67-99` | — |
| (tidak disebut) berkas kosong tidak bisa ditutup | A | `BERKAS_EMPTY` | `lib/archive/berkas-arsip-service.ts:391-394` | Tambahkan ke prasyarat transisi `OPEN→CLOSED` |
| (tidak disebut) usulan pembersihan tidak mensyaratkan jatuh tempo | A | Server menerima `propose_destruction` untuk berkas `AKTIF` mana pun; hanya tombol "usulkan semua" di UI yang memfilter yang jatuh tempo | `lib/archive/berkas-arsip-service.ts:910-912`; `routes/kasubag/berkas/tertutup.tsx:105,131` | Tulis bahwa jatuh tempo adalah penanda dan kendali di UI, bukan syarat server |
| Penghapusan file langsung setelah konfirmasi | S | Frasa `BERSIHKAN FILE BERKAS`, lalu penghapusan dijalankan pada permintaan yang sama | `routes/api/kasubag/berkas/$id/lifecycle.ts:26-29,55-62` | Tambahkan catatan: status berubah **lebih dulu**, file dihapus sesudahnya; bila penghapusan gagal status tetap `DIMUSNAHKAN` (akses tetap tertutup) — `lifecycle.ts:76-88` |
| `berkas_arsip_activity` 8 jenis event | S | CHECK berisi 8 nilai; `BERKAS_DIPINDAHKAN_KE_INAKTIF` tidak lagi dipakai, dan "batalkan usulan" dicatat sebagai `METADATA_ARSIP_AKTIF_DIPERBARUI` | `db/schema/arsip/berkas-arsip.ts:141-153`; `lib/archive/berkas-arsip-service.ts:974-985` | Sebut "7 event aktif + 1 peninggalan" |

### B.5 Alur untuk *activity diagram* usulan

**Gambar 4.13 — Pengajuan dokumen (kode nyata)**
1. Pegawai mengisi fungsi dan tanggal (tidak boleh melewati hari ini) → memilih kegiatan (`routes/pegawai/dokumen/aju.tsx:828-844`; `lib/schemas/dokumen.ts:118-127`).
2. Sistem (klien) memanggil `GET /api/users/me/is-ketua-tim/$kegiatanId` dan menyetel `isKetuaTim` (`aju.tsx:492`).
3. *Decision* karakteristik: **material** → Komponen (anak kegiatan) → Jenis → Kategori → Detail (opsional bila kategori adalah daun) → nominal; **non-material** → Nama Dokumen teks bebas (`aju.tsx:244-260`; urutan `Step*` di baris 10-18).
4. Checklist kelengkapan dimuat dari `/api/master-kelengkapan?kegiatan_id&is_ketua_tim` lalu disaring klien dengan kecocokan enam kolom; pengguna boleh menambah lampiran bebas (`KelengkapanChecklist.tsx:57-72,110-145`).
5. Unggah tiap file ke `POST /api/upload` → disimpan di area *pending* milik pengguna (`routes/api/upload.ts:62-131`).
6. Tinjau → Ajukan (tombol nonaktif bila langkah belum lengkap, `aju.tsx:1029`) → `POST /api/dokumen/submit`.
7. Server: Zod → validasi nominal & rantai → *preflight* file → cek kelengkapan wajib (aturan server, lihat temuan A.3) → cek penugasan Ketua Tim bila `true` → satu transaksi (buat `DRAFT` → ubah status → tulis log) → pindahkan file *pending* ke lokasi formal (`routes/api/dokumen/submit.ts:61-137`).

Beda dengan kerangka: (a) deteksi Ketua Tim terjadi di klien dan hanya diverifikasi server bila bernilai `true`; (b) server tidak mewajibkan rantai Jenis–Kategori untuk material, hanya Komponen; (c) aturan pencocokan checklist berbeda antara klien dan server; (d) ada langkah pemindahan file setelah *commit* DB yang tidak digambarkan. **Status: B.**

**Gambar 4.14 — Persetujuan PPK/PPSPM.** PPK: setujui | tolak (catatan wajib). PPSPM: setujui | tolak (catatan wajib). Setiap aksi = satu transaksi update status + insert `log_aktivitas` (`approve.ts:88-112`). Beda: kerangka menaruh *decision* "kembalikan" pada validasi PPK, padahal "kembalikan" hanya tersedia untuk dokumen `NEED_REVISION` dengan `revision_target = PPK` (setelah ditolak PPSPM) dan letaknya di alur 4.15 (`routes/api/ppk/kembalikan/$id.ts:57-59`). **Status: B.**

**Gambar 4.15 — Revisi.** Jalur `USER`: Pegawai membuka `/pegawai/revisi` → ubah lampiran/metadata (`PATCH /api/dokumen/$id`, hanya bila `NEED_REVISION`+`USER`, `dokumen.$id.ts:500`) → `RESUBMIT` → antrian PPK. Jalur `PPK`: PPK membuka `/ppk/revisi` → simpan perbaikan lampiran/nominal (`PATCH /api/ppk/resubmit/$id`) → `RESUBMIT_PPK` langsung ke PPSPM, **atau** `KEMBALIKAN` ke Pegawai. Sesuai kerangka. **Status: S.**

**Gambar 4.17 — Pembersihan lampiran non-material.** GET daftar (non-material murni, `TERSIMPAN`, belum dibersihkan, kegiatan yang dipimpin; hitung `is_stale`) → Ketua Tim memilih → ketik `BERSIHKAN` → server: ambil penugasan → `buildPembersihanPlan` per dokumen (tolak bila bukan non-material murni / bukan `TERSIMPAN` / bukan kegiatannya / sudah bersih / ada di berkas) → hapus file yang **tidak** dirujuk baris lain → satu transaksi set `lampiran_dibersihkan_*` + `audit_log` (`routes/api/pembersihan-dokumen.ts:40-99`; `lib/dokumen/pembersihan-service.ts:130-239,307-361`). Beda: umur 90 hari bukan syarat. **Status: B.**

**Gambar 4.18 — Pemberkasan.** Dua pintu masuk: (1) dokumen `COMPLETED` dari kotak masuk KSBU + pilih cara pembayaran + **tahun anggaran**; (2) dokumen manual + cara pembayaran + **tahun anggaran**. Keduanya → `getOrCreateOpenBerkasForKlasifikasi(klasifikasi, TA)`: klasifikasi harus aktif dan daun → bila ada berkas `OPEN` TA itu pakai; bila ada tapi `CLOSED` tolak; bila belum ada buat baru + event `BERKAS_DIBUKA`; tabrakan *unique* ditangani dengan membaca ulang → tambahkan item + event (`lib/archive/berkas-arsip-service.ts:271-375,836-886`). Tutup: ≥1 item, Nomor SPM, Masa Simpan Minimal → `CLOSED` + `AKTIF`. Beda: dimensi tahun anggaran dan aturan keunikan. **Status: B.**

**Gambar 4.19 — Pembersihan file berkas.** `AKTIF` → usul → (batalkan ↔ `AKTIF`) → ketik `BERSIHKAN FILE BERKAS` → `DIMUSNAHKAN` → hapus file workflow dan manual + tandai `lampiran_dibersihkan_* = BERKAS_DIMUSNAHKAN` pada dokumen anggota + `audit_log BERKAS_LAMPIRAN_DIBERSIHKAN` (`lib/archive/berkas-arsip-physical-destruction.ts:170,237-241,684-714`). **Status: S** (tambahkan urutan "status dulu, file kemudian").

**Gambar 4.21 — Pemanfaatan dan ekspor.** ZIP Laporan Saya/Kegiatan (maks 500 dokumen), ZIP per berkas, CSV daftar berkas, Monitoring Realisasi dan Laporan Kinerja (satu *endpoint*). Beda: (a) cakupan Monitoring vs Laporan Kinerja dibedakan parameter, bukan peran; (b) dokumen dalam berkas `DIMUSNAHKAN` dikeluarkan dari total realisasi; (c) dokumen manual KSBU tidak ikut dihitung karena endpoint hanya membaca `dokumen_transaksi` (`routes/api/laporan/kinerja.ts:130-208`). **Status: B.**

### B.6 *Sequence diagram*

| Gambar | Status | Rantai pemanggilan nyata | Bukti | Usulan koreksi |
|---|---|---|---|---|
| 4.22 Pengajuan + log | S | `aju.tsx` → `apiMutation('/api/dokumen/submit')` → `requireSameOrigin` → `createAndSubmitDokumenSchema` → `validateNominalForMaterial` / `validateWorkflowChainForCharacteristic` → `buildSubmitMovePlan` + `preflightSubmitFiles` → `createLiveLocalSubmitDrizzleAdapter` → `createLocalSubmitBridgeRepository` → `prepareLocalSubmitWriteBridge` (memanggil `transition()`) → `executeLocalSubmitWritePlan` (transaksi: `createDokumen` → `updateDokumenStatus` → `appendLog`) → `moveLocalPendingFileToFormal` | `routes/pegawai/dokumen/aju.tsx:584`; `routes/api/dokumen/submit.ts:61-137,407-459`; `lib/dokumen/local-submit-write-bridge.ts:267-401` | Ini satu-satunya alur yang benar-benar memperlihatkan injeksi *repository*; jadikan contoh utama KNF-12 |
| 4.23 Unggah lampiran | B | `FileUploadButton` → `POST /api/upload` (multipart) → sesi → `createLocalUploadDescriptor` (ekstensi, MIME, ukuran ≤5 MB) → `writeLocalUploadContent` (cek *signature* isi) → file di area *pending* → baru dipindah ke lokasi formal saat submit | `routes/api/upload.ts:59-131`; `lib/upload/document-upload-policy.ts:1-27`; `lib/storage/local-upload.ts` | Tidak ada DB/FSM di diagram ini; gambarkan dua tahap *pending → formal* |
| 4.24 Persetujuan PPK | B | Klien → `POST /api/ppk/dokumen/$id/approve` → `requireSameOrigin` → `getLocalServerSession` + `hasLocalRole('PPK')` → `approveDokumenSchema` → **Drizzle langsung** (select) → `transition()` → **Drizzle langsung** (transaksi update + insert log). Tidak ada lapisan layanan | `routes/api/ppk/dokumen/$id/approve.ts:22-121` | Hapus kotak "Layanan"; tulis Rute → Zod → FSM → Drizzle |
| 4.25 Klasifikasi + *get-or-create* | S | `POST /api/kasubag/dokumen/$id/archive` → Zod → cek `COMPLETED` → `db.transaction` → `createWorkflowArchiveBerkasRepository(tx)` → `getOrCreateOpenBerkasForKlasifikasi` → `addWorkflowDocumentToOpenBerkas` → `appendBerkasActivity` | `routes/api/kasubag/dokumen.$id.archive.ts:56-131,170-190` | Tambahkan parameter `tahun_anggaran` |
| 4.26 Akses lampiran terotorisasi | S | Klien minta URL → `createDocumentLampiranAccessUrlResponse` (cek hak baca per peran/status/penugasan) → token HMAC berumur pendek (`signFileAccessToken`) → `GET /api/files/access` → `verifyFileAccessToken` → `resolveDocumentLampiranAccessForToken` → 410 bila lampiran dibersihkan atau berkas `DIMUSNAHKAN` | `lib/storage/document-file-access.ts:61-172,236-281,330-390`; `lib/storage/file-access-token.ts:69-118`; `routes/api/files/access.ts` | Tambahkan langkah token bertanda tangan dan kode 410 |
| 4.27 Pembersihan non-material | S | `POST /api/pembersihan-dokumen/bersihkan` → Zod (`confirmation` literal) → ambil penugasan → `executePembersihanLampiran` (*repository* default) → `buildPembersihanPlan` → `loadProtectedLogicalPaths` → `deleteLogicalFilesSafely` → `applyCleanup` (transaksi + `audit_log`) | `routes/api/pembersihan-dokumen.bersihkan.ts:14-75`; `lib/dokumen/pembersihan-service.ts:130-361` | — |
| KNF-12 pembagian rute–layanan–skema dan injeksi *repository* | B | Ada di submit, berkas, manual arsip, pembersihan, pemusnahan; **tidak** ada di persetujuan/penolakan/revisi/ubah/hapus dokumen | lihat A.5 | Klaim "sebagian modul"; sebut modul mana |

### B.7 ERD

**Skema dan tabel nyata** (`db/schema/*/index.ts`):
- `auth`: `users`, `roles`, `user_roles`, `sessions`
- `master`: `master_fungsi`, `master_kegiatan`, `master_komponen`, `master_jenis_permintaan`, `master_kategori_permintaan`, `master_detail_permintaan`, `master_jenis_dokumen`, `master_kelengkapan_dokumen`, `ketua_tim_assignments`
- `dokumen`: `dokumen_transaksi`, `log_aktivitas`
- `arsip`: `berkas_arsip`, `berkas_arsip_item`, `berkas_arsip_activity`, `master_klasifikasi_arsip`, `manual_arsip`, `manual_arsip_attachment`
- `audit`: `audit_log`
- `app`: `app_settings`

| Butir rancangan | Status | Fakta di kode | Bukti | Usulan koreksi |
|---|---|---|---|---|
| Enam *schema* | S | `auth, master, dokumen, arsip, app, audit` | `db/schema/index.ts` | — |
| Kelompok autentikasi (+ avatar) | S | `users` punya `username`, `nip_nrp` (keduanya *unique*), kolom avatar; `sessions.token_hash` *unique* | `db/schema/auth/users.ts:20-47`; `db/schema/auth/sessions.ts:21,31` | Tambahkan `username`/`nip_nrp` sebagai identitas login |
| Kelompok data master | S | Semua tabel ada; Jenis Permintaan global (tanpa FK ke Komponen); Komponen anak Kegiatan | `db/schema/master/jenis-permintaan.ts:14-26`; `db/schema/master/komponen.ts:15-32` | — |
| Kelengkapan menyimpan `komponen_id` dan `jenis_permintaan_id` terpisah, tanpa *constraint* yang mengaitkan | S | Benar; ada CHECK "kategori butuh jenis" dan "detail butuh kategori"; tidak ada *unique* enam kolom (hanya *index*) | `db/schema/master/kelengkapan-dokumen.ts:29-58` | Sebut dua CHECK rantai tersebut |
| Transaksi dokumen (`komponen_id`, `nama_dokumen`) | S | Ada | `db/schema/dokumen/dokumen-transaksi.ts:67-69` | — |
| Kolom kunci `is_non_material`, `nominal_realisasi`, `revision_target`, `is_ketua_tim`, `lampiran_dibersihkan_*` | S | Semua ada; nominal `numeric(15,2)` dengan CHECK ≥0 | `db/schema/dokumen/dokumen-transaksi.ts:42-49,62-63,75-78,98-101` | — |
| (tidak disebut) `lampiran_dibersihkan_alasan` punya dua nilai | A | `PEMBERSIHAN_NON_MATERIAL` **dan** `BERKAS_DIMUSNAHKAN` | `db/schema/dokumen/dokumen-transaksi.ts:70-78,102-105` | Tulis bahwa kolom ini dipakai kedua fitur pembersihan |
| (tidak disebut) `jenis/kategori/detail_permintaan_id` di `dokumen_transaksi` tanpa FK | A | Tiga kolom UUID tanpa `.references()` | `db/schema/dokumen/dokumen-transaksi.ts:59-61` | Gambarkan sebagai relasi logis (garis putus-putus) atau ajukan perbaikan |
| Pemberkasan (`berkas_arsip`, `_item`, `_activity`, klasifikasi, manual + lampiran) | S | Ada; `berkas_arsip_item` punya CHECK "tepat satu referensi" dan *unique* per dokumen | `db/schema/arsip/berkas-arsip.ts:80-113` | — |
| (tidak disebut) `berkas_arsip.tahun_anggaran` + snapshot klasifikasi | A | `tahun_anggaran` wajib (2000–2100); `klasifikasi_kode/nama_snapshot` | `db/schema/arsip/berkas-arsip.ts:35-37,63` | Masukkan ke kamus data inti |
| `manual_arsip` dengan `fungsi_id/kegiatan_id/komponen_id` wajib | S | Ketiganya `notNull` | `db/schema/arsip/manual-arsip.ts:34-42` | — |
| `audit.audit_log` tanpa FK ke `entity_id` | S | Disengaja; 3 nilai aksi | `db/schema/audit/audit-log.ts` (komentar + `entityId` tanpa `.references`) | — |
| (tidak disebut) `log_aktivitas` ikut terhapus bila dokumen dihapus | A | FK `dokumen_id … onDelete: 'cascade'`; *append-only* hanya kontrak aplikasi, tanpa *trigger* | `db/schema/dokumen/log-aktivitas.ts:18-20,37-38`; `grep TRIGGER drizzle/*.sql` nihil | Jelaskan bahwa inilah alasan `audit_log` dibutuhkan |
| `app.app_settings` *key–value* JSONB | S | Ada | `db/schema/app/app-settings.ts` | — |

### B.8 Kebutuhan nonfungsional

| KNF | Status | Fakta di kode | Bukti | Usulan koreksi |
|---|---|---|---|---|
| KNF-04 *User Error Protection* | B | Tombol lanjut/ajukan nonaktif sampai langkah lengkap; peringatan perubahan belum tersimpan di 5 halaman; konfirmasi ketik-persis hanya untuk **pembersihan file berkas** dan **pembersihan lampiran non-material**. Tutup berkas memakai dialog isian, bukan ketik-persis | `routes/pegawai/dokumen/aju.tsx:163-178,1029`; `hooks/useUnsavedChangesGuard.ts`; `routes/kasubag/berkas/$id.tsx:963`; `routes/kasubag/pembersihan/index.tsx:441`; `routes/pegawai/pembersihan-dokumen.tsx:486` | Hapus "tutup berkas" dari daftar ketik-persis |
| KNF-06 *Confidentiality* | S | RBAC di server; lampiran hanya lewat token HMAC berumur pendek; hak baca per peran/status/penugasan; PJK tidak bisa membuka lampiran | `lib/storage/file-access-token.ts:69-118`; `lib/storage/document-file-access.ts:330-390` | Tambahkan "token akses bertanda tangan" sebagai mekanisme |
| KNF-07 *Integrity* | B | FSM terpusat dipakai 8 titik transisi; metadata dokumen material terkunci setelah `COMPLETED` (ubah hanya saat `NEED_REVISION`/`TERSIMPAN`); Zod di *boundary*. Pengecualian: dua jalur di luar FSM (A.4), `status` tanpa CHECK DB, dan *endpoint* nominal yang boleh mengubah nominal selama validasi | `lib/fsm.ts:81-127`; `routes/api/dokumen.$id.ts:495-509`; `routes/api/dokumen/$id.nominal.ts:102-108`; `db/schema/dokumen/dokumen-transaksi.ts:45` | Sesuaikan klaim; sebut pengecualian |
| KNF-08 *Non-repudiation* | S | Setiap transisi menulis log di transaksi yang sama; `audit_log` untuk hapus permanen dan pembersihan; `berkas_arsip_activity` untuk level berkas | `routes/api/ppk/dokumen/$id/approve.ts:88-112`; `lib/dokumen/pembersihan-service.ts:342-361`; `routes/api/dokumen.$id.ts:791-813` | — |
| KNF-10 *Authenticity* | S | Argon2id (m=64 MiB, t=3, p=1); token sesi 32 byte, disimpan sebagai hash SHA-256; cookie `HttpOnly; SameSite=Lax; Secure` (kondisional); sesi 8 jam; batas login 5×/10 menit per identitas+IP, disimpan di memori; cek *same-origin* untuk metode yang mengubah data | `lib/auth/password.ts:9-14`; `lib/auth/session-constants.ts:6-9`; `lib/auth/session-token.ts:13-25`; `lib/auth/session-cookies.ts:68-76`; `lib/auth/login-rate-limit.ts:3-4,28-47`; `lib/security/same-origin.ts:11-17` | Tambahkan *same-origin* (perlindungan CSRF) dan catatan bahwa batas login hilang bila server dimulai ulang |
| KNF-12 *Modularity* | B | Lihat B.6 baris terakhir. Uji FSM tanpa DB tersedia (`tests/fsm.test.ts`, 39 kasus) | `tests/fsm.test.ts`; `lib/dokumen/local-submit-write-bridge.ts:96-110` | Sesuaikan klaim |
| KNF-14 pengelolaan sumber daya | S | Metadata dipertahankan, file dihapus; file yang masih dirujuk baris lain dilindungi | `lib/dokumen/pembersihan-service.ts:161-192,307-335` | — |

---

## C. Insight: hal di kode yang layak ditonjolkan di Bab IV

1. **Berkas per tahun anggaran (keputusan rancangan terbaru).** Migrasi 0018 memberi alasan bisnis yang jelas: siklus pembayaran UP/TUP berulang setiap tahun anggaran, jadi satu cara pembayaran harus bisa punya satu berkas per TA, sementara master klasifikasi tetap abadi (`drizzle/0018_berkas_tahun_anggaran.sql:2-6`). Ini contoh bagus penelitian berulang (DSRM) dan layak jadi paragraf di 4.2.3.
2. **Hak akses mengikuti gabungan peran, dan Pegawai adalah peran dasar.** Setiap akun operasional otomatis Pegawai (`lib/users/role-assignment.ts:13-15`), Admin eksklusif, dan server menilai hak dari gabungan peran. Ini menjelaskan dengan rapi mengapa diagram M1 memakai generalisasi, dan mengapa *role switcher* hanya urusan ruang kerja.
3. **Kelengkapan dibedakan Ketua Tim vs anggota.** `master_kelengkapan_dokumen.is_ketua_tim` dan status Ketua Tim yang dibekukan pada dokumen membuat checklist berbeda untuk ketua dan anggota pada kegiatan yang sama (`db/schema/master/kelengkapan-dokumen.ts:26`; `lib/dokumen/local-submit-drizzle-adapter.ts:165-168`). Dimensi "peran" dalam PIECES *Service* punya dasar kode ini.
4. **Pengajuan yang tahan kegagalan file.** Lampiran diunggah ke area *pending*, DB di-*commit* dalam satu transaksi, lalu file dipindah ke lokasi formal; kegagalan pemindahan dilaporkan sebagai "perlu kompensasi" (`routes/api/dokumen/submit.ts:113-137`; `lib/dokumen/submit-db-file-compensation.ts`). Ini bahan kuat untuk KNF-11 *Recoverability* yang saat ini belum punya bukti di kerangka.
5. **Validasi isi file, bukan hanya ekstensi.** Ukuran maksimal 5 MB, daftar ekstensi/MIME, dan pemeriksaan *signature* biner (`lib/upload/document-upload-policy.ts:1-27`; hyperedge graphify "Document upload validation"). Layak untuk KNF-06/KNF-07.
6. **Token akses lampiran bertanda tangan + 410 Gone.** Lampiran tidak pernah dilayani lewat path langsung; URL sementara bertanda tangan HMAC, dan file yang sudah dibersihkan memberi 410, bukan 404 (`lib/storage/document-file-access.ts:273-281`). Ini bukti konkret klaim "lampiran tidak dapat diakses melalui tautan langsung".
7. **Perlindungan file bersama saat pembersihan.** Penghapusan melewati file yang masih dirujuk dokumen lain atau lampiran manual (`lib/dokumen/pembersihan-service.ts:307-335`). Ini keputusan rancangan yang mencegah kehilangan data tak sengaja.
8. **Realisasi yang dapat dipertanggungjawabkan.** Total realisasi mengecualikan dokumen yatim tanpa Komponen dan dokumen dalam berkas yang sudah dibersihkan (`routes/api/laporan/kinerja.ts:22-30,130-145`). Ini menghubungkan fitur pemantauan ke benang merah akuntabilitas AKIP.
9. **Idempotensi dan kondisi balapan.** *Get-or-create* berkas menangani tabrakan *unique* dengan membaca ulang (`lib/archive/berkas-arsip-service.ts:286-293`); persetujuan PPSPM dijaga dari persetujuan ganda (`routes/api/ppspm/dokumen/$id/approve.ts:61-75`); pembersihan non-material idempoten (`ALREADY_CLEANED`).
10. **Perlindungan CSRF.** Semua metode yang mengubah data diawali `requireSameOrigin()` (god node ke-6 di graphify, 64 edge; `lib/security/same-origin.ts:11-17`). Belum disebut di KNF mana pun.

---

## D. Pertanyaan yang perlu dikonfirmasi

1. **Tahun anggaran berkas.** Apakah perubahan ke "satu berkas per cara pembayaran per tahun anggaran" (commit `56c6a6d`) sudah final dan boleh ditulis di Bab IV? Apakah tahun anggaran boleh berbeda dari tahun dokumen (`dokumen_transaksi.tahun`)? Kode tidak memvalidasi keduanya sama.
2. **Peran aktif vs gabungan peran.** Apakah memang disengaja bahwa server tidak membatasi aksi berdasarkan peran aktif? Jawabannya menentukan bunyi invarian di 4.1.3.3 (e).
3. **Aturan checklist kelengkapan.** Aturan mana yang benar menurut bisnis: pencocokan enam kolom (klien) atau simpul terdalam tanpa Komponen (server)? Bila enam kolom, server perlu diperbaiki sebelum Bab V; bila tidak, kerangka yang diubah.
4. **Rute lama `POST /api/dokumen` dan cabang `DRAFT` di `/api/dokumen/$id/submit`.** Apakah akan dihapus? Selama masih ada, non-material bisa berakhir `COMPLETED`.
5. **`PATCH /api/dokumen/$id/nominal`.** Tidak ada pemanggil di UI. Apakah ini fitur koreksi nominal oleh KSBU yang perlu dijadikan UC, atau sisa yang akan dihapus? Saat ini pembuat dokumen bisa mengubah nominal ketika dokumen masih di tangan PPK/PPSPM.
6. **Laporan Kinerja vs Monitoring Realisasi.** Perlukah server membatasi `scope=laporan_kinerja` hanya untuk PJK, agar klaim "cakupan berbeda per peran" bisa dipertahankan?
7. **Jatuh tempo sebagai syarat.** Apakah usulan pembersihan berkas dan pembersihan non-material *boleh* dilakukan sebelum jatuh tempo/90 hari? Kode mengizinkannya.
8. **Dokumen manual di realisasi.** Dokumen yang ditambahkan KSBU punya `nominal_realisasi` wajib, tetapi tidak ikut dihitung di Monitoring/Laporan Kinerja. Disengaja?
9. **Perawatan penyimpanan Admin** (`analyze-storage`, `cleanup-orphan-files`): masuk cakupan skripsi atau tidak?
10. **Master Jenis Dokumen**: halaman ada tapi disembunyikan dari menu. Tetap disebut di UC-23 dan ERD sebagai data peninggalan, atau dihilangkan dari Bab IV?
11. **Admin dan Activity Log global.** Apakah PJK memang seharusnya melihat riwayat aktivitas **semua** pengguna (`routes/api/activity-log.ts:15`)? Ini perlu dituliskan sebagai hak akses bila disengaja.
