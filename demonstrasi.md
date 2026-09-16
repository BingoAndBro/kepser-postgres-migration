Alur Demonstrasi Aplikasi — Dipetakan ke Kuesioner Evaluasi ISO/IEC 25010

Struktur di bawah ini mengikuti urutan Bagian B–H kuesioner, supaya saat responden mengisi form nanti, apa yang mereka lihat di demo masih segar dan sesuai dengan pertanyaan yang mereka jawab. Setiap bagian berisi: apa yang ditunjukkan, kalimat pengantar yang bisa Anda ucapkan, dan item kuesioner yang sedang "dijawab" oleh demo tersebut.

---

0. Pembukaan (sebelum masuk ke fitur)

Sampaikan singkat:

▎ "Sistem ini menggantikan proses manual pengajuan dan persetujuan dokumen di kantor — mulai dari Fungsi, Kegiatan, Komponen, sampai Kelengkapan dokumen. Saya akan menunjukkan alurnya dari sisi pegawai biasa dulu, lalu sisi PPK/PPSPM, baru bagian teknis untuk yang berlatar TI."

Ini penting karena kuesioner nanti membedakan kelompok Non-TI vs TI (Bagian A no. 3) — beri tahu di awal bahwa akan ada sesi tambahan khusus TI di akhir.

---

1. Functional Suitability (Bagian B — item 1–3, semua)

Tunjukkan: alur lengkap satu dokumen — dari pembuatan/pengajuan (Kegiatan → Komponen → Jenis → Kategori → Detail → Kelengkapan) sampai status akhir disetujui/ditolak.

Ucapkan:

▎ "Perhatikan bagaimana sistem menangani seluruh tahapan dokumen sesuai peran masing-masing — pegawai mengajukan, PPK memvalidasi, PPSPM menyetujui. Saya juga akan tunjukkan status dan nominal yang tampil di setiap tahap, supaya Anda bisa menilai apakah datanya sudah benar dan sesuai kebutuhan tugas Anda."

Ini menjawab: completeness (mencakup semua tugas), correctness (status/nominal benar), appropriateness (fitur memudahkan tugas).

---

2. Performance Efficiency (Bagian C — item 4–6)

Tunjukkan: buka beberapa dokumen/lampiran sekaligus, klik antar menu tanpa jeda mencolok.

Ucapkan:

▎ "Saya buka beberapa dokumen dan lampiran secara bersamaan — perhatikan apakah sistem tetap responsif. Ini yang nanti Anda nilai di pertanyaan soal kecepatan dan kelancaran sistem."

Catatan: item 6 (banyak pengguna bersamaan) tidak bisa didemokan realistis dengan satu sesi — cukup sebutkan sekilas, jangan dipaksakan ("Untuk beban banyak pengguna sekaligus, itu bagian yang sudah kami uji terpisah, bukan di sesi demo ini").

---

3. Usability (Bagian D — item 7–21, semua)

Ini bagian terpanjang di kuesioner, jadi beri waktu paling banyak di demo.

Tunjukkan berurutan:
1. Navigasi dasar antar menu (learnability, operability)
2. Cara membaca informasi/status di layar (appropriateness recognizability)
3. Sengaja lakukan satu kesalahan input (misal submit form kosong / upload format salah) agar pesan error muncul (user error protection)
4. Tunjukkan tata letak, warna tema (Tema Aplikasi), ikon (user interface aesthetics)

Ucapkan:

▎ "Saya akan coba beberapa langkah tanpa penjelasan detail dulu — supaya Anda bisa merasakan sendiri apakah sistem ini mudah dipahami. Lalu saya akan sengaja membuat kesalahan input supaya Anda lihat bagaimana sistem meresponnya."

Ini bagian paling berpengaruh ke persepsi kepuasan keseluruhan — jangan terburu-buru di sini.

---

4. Reliability (Bagian E — item 22, +24/25 kondisional)

Tunjukkan: jalankan sesi demo tanpa gangguan sebagai baseline; jika skenario UAT Anda mencakup uji input salah atau simulasi gangguan koneksi, tunjukkan itu di sini juga.

Ucapkan:

▎ "Sepanjang sesi ini, perhatikan apakah sistem berjalan tanpa gangguan — itu yang akan ditanyakan di kuesioner nanti, sebatas pengalaman hari ini saja, bukan klaim jangka panjang."

Jangan berjanji reliability jangka panjang — itu di luar cakupan satu sesi (sudah dicatat sebagai batasan di kuesioner).

Item 24/25 hanya didemokan jika skenario UAT Anda memang mengarahkan ke situasi tersebut — cek dulu skenario UAT sebelum menambahkan langkah ini ke demo.

---

5. Security (Bagian F — item 26–30, semua — ini klaim akuntabilitas utama Anda)

Tunjukkan (paling penting untuk didemokan eksplisit, karena sub-karakteristik ini abstrak bagi non-TI):
1. Login dengan akun berbeda → tunjukkan menu/akses yang berbeda sesuai peran (confidentiality, authenticity)
2. Coba akses halaman/aksi yang bukan wewenang peran tsb → tunjukkan ditolak (integrity)
3. Buka fitur Log Aktivitas → tunjukkan riwayat siapa mengajukan/menyetujui/menolak beserta waktunya (non-repudiation, accountability)

Ucapkan:

▎ "Ini bagian yang paling ingin saya tunjukkan jelas: setiap tindakan — pengajuan, validasi, persetujuan, penolakan — tercatat di log aktivitas ini, lengkap dengan siapa dan kapan. Dan coba saya login dengan akun lain untuk menunjukkan bahwa akses memang dibatasi sesuai peran."

Karena item ini abstrak, demo eksplisit di sini sangat menentukan skor — jangan hanya disebutkan lisan, harus benar-benar diklik dan ditunjukkan di layar.

---

6. Portability (Bagian H item 36 — semua)

Tunjukkan: buka aplikasi dari device/browser berbeda (laptop + HP, atau 2 browser berbeda) secara singkat.

Ucapkan:

▎ "Saya buka sistem yang sama dari HP saya — tampilannya tetap bisa diakses dengan baik."

---

7. Sesi Khusus Evaluator TI (setelah pegawai non-TI selesai / kelompok terpisah)

Untuk Bagian G (Maintainability, item 31–35) dan Bagian H item 37 (Installability) — ini tidak bisa "didemokan" secara visual seperti UI, karena menyangkut struktur kode dan proses deployment. Pendekatan yang tepat:

Tunjukkan (di layar kode/terminal, bukan UI aplikasi):
1. Struktur folder/modul terpisah (routing per peran, komponen terpisah) → modularity
2. Contoh komponen yang dipakai di lebih dari satu tempat (misal komponen form yang dipakai lintas jenis dokumen) → reusability
3. Contoh log error / stack trace yang jelas saat terjadi bug → analyzability
4. Riwayat commit/branch yang menunjukkan penambahan fitur tanpa merombak total (misal riwayat branch workflow/ubah-alur-v1) → modifiability
5. Hasil test suite (Vitest/Playwright) yang jalan → testability
6. Proses instalasi/deploy di server kantor (docker/script/env) → installability

Ucapkan ke evaluator TI:

▎ "Untuk bagian ini saya akan tunjukkan dari sisi kode dan proses deploy, karena pertanyaannya soal kemudahan pemeliharaan sistem, bukan tampilan aplikasi. Saya tunjukkan bagaimana modul-modulnya terpisah, bagaimana kami menelusuri bug lewat log, dan bagaimana pengujian otomatis kami jalankan."

---

Ringkasan Urutan Demo (checklist saat presentasi)

┌────────┬──────────────────┬────────────────────────────────────────────────┬───────────┐
│ Urutan │ Bagian Kuesioner │                Yang ditunjukkan                │ Kelompok  │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 1      │ B                │ Alur dokumen end-to-end                        │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 2      │ C                │ Buka banyak dokumen sekaligus                  │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 3      │ D                │ Navigasi + sengaja input salah + tampilan      │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 4      │ E                │ Jalankan sesi tanpa gangguan (+ kondisional)   │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 5      │ F                │ Login beda peran, akses ditolak, Log Aktivitas │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 6      │ H-36             │ Buka dari device/browser lain                  │ Semua     │
├────────┼──────────────────┼────────────────────────────────────────────────┼───────────┤
│ 7      │ G, H-37          │ Struktur kode, log error, test, deploy         │ Khusus TI │
└────────┴──────────────────┴────────────────────────────────────────────────┴───────────┘

Setelah demo selesai, baru bagikan link kuesioner — jangan dibagikan di tengah demo agar responden tidak sambil mengisi sambil kehilangan fokus menyimak.

---

Verifikasi sebelum demo sungguhan

- [ ] Siapkan 2 akun uji dengan peran berbeda untuk Bagian F (misal Pegawai vs PPK/PPSPM)
- [ ] Siapkan skenario input salah yang aman untuk didemokan (tidak merusak data asli) untuk Bagian D & E
- [ ] Cek fitur Log Aktivitas sudah menampilkan data yang representatif (bukan kosong) — ini fitur baru dari commit terakhir
- [ ] Tes akses dari HP/browser lain sebelum sesi, pastikan tidak ada masalah jaringan kantor
- [ ] Untuk sesi TI, siapkan terminal/editor terbuka duluan agar tidak ada jeda pindah konteks saat demo
