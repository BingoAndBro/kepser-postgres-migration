# Kerangka Bab IV — Analisis dan Perancangan

> **Revisi 7 — 23 September 2026.** Menggantikan revisi 6. Daftar use case **disederhanakan dari 61 menjadi 24** (Revisi 7.1, 24 September 2026: penambahan dokumen oleh KSBU dipisah dari pengklasifikasian; Berpindah Peran hanya untuk peran operasional, Admin tidak ikut) dengan merumuskan setiap use case pada tingkat tujuan pengguna, bukan langkah: pengisian metadata, nominal realisasi, dan unggah kelengkapan kini menjadi langkah di dalam *Mengajukan Dokumen*; setujui/tolak menjadi alur utama/alternatif di dalam *Memvalidasi Dokumen* dan *Menyetujui Dokumen*. Modul menjadi 6, satu diagram per modul, tanpa «include»/«extend». Bagian lain Bab IV (activity diagram, *State Machine Diagram*, *sequence*, ERD, *wireframe*) tidak berubah. Lihat 4.1.3.3 dan Lampiran A.
>
> Revisi 6 sebelumnya (22 September 2026): rekonsiliasi terhadap `Peta Kode src - workflow-ubah-alur-v1.md` — koreksi status/aksi FSM (`IN_PPSPM_APPROVAL`, tanpa `ARCHIVED`/`ARCHIVE`/`SKIP`), rute `/kasubag` dan `/ppspm`, master Komponen, fitur Pembersihan Dokumen Non-Material, P-08, subbab 4.2.2.2, *sequence diagram* ke-6, ERD Audit & Pengaturan.
>
> Revisi 5 sebelumnya (22 September 2026, pagi): lima keputusan terbuka diputuskan.
>
> Revisi 4 sebelumnya: istilah "*Finite State Machine*" dibuang, diagramnya disebut *State Machine Diagram*; 4.2.2 dikelompokkan menurut fitur; *sequence diagram* diberi nama polos; matriks hak akses dibuang; matriks penelusuran ditandai sebagai rekomendasi.
>
> Revisi 3 sebelumnya: Subbab 4.2 disusun ulang menjadi empat subbab yang memetakan satu-satu ke luaran tahap *Design* Bab III; rancangan antarmuka ditetapkan berupa wireframe; pembedaan dua lapis kebutuhan (pengguna vs sistem) ditegaskan.
>
> Revisi 2 sebelumnya: BPMN diganti *activity diagram*; alat analisis (fishbone, PIECES, use case) tidak lagi berdiri sebagai subbab sendiri; use case dipindah ke 4.1; ditambah subbab SMART.
>
> Sumber: Pedoman Skripsi KS Edisi Keenam 2025, Templat Skripsi Prodi KS, Bab I–III "Buku Skripsi Daniel.docx", **`Peta Kode src - workflow-ubah-alur-v1.md`** (otoritas kode, sejak Revisi 6), dan "Penjelasan Proyek Aplikasi" (PB-1…PB-8, kini berstatus dokumen lama yang sebagian sudah dikoreksi kode — lihat §8 peta kode untuk daftar koreksinya).

---

## 0. Prinsip Penyusunan Bab IV

Pedoman menyatakan judul dan susunan subbab pada 4.1 dan 4.2 **dapat disesuaikan** dengan karakteristik objek penelitian dan model perancangan yang dipakai. Kerangka ini memakai keleluasaan tersebut dengan tiga aturan:

1. **Subbab = artefak, bukan alat.** Fishbone, PIECES, *activity diagram*, dan *use case* adalah alat bantu; tempatnya di dalam subbab yang mempersoalkan sesuatu, bukan menjadi subbab atas nama dirinya sendiri. Judul subbab menjawab "ini bagian apa", bukan "ini pakai alat apa".
2. **Satu hal ditulis satu kali.** Kalau kebutuhan fungsional sudah disajikan sebagai use case, tidak ada daftar kebutuhan fungsional terpisah. Kalau proses bisnis usulan sudah digambar dengan *activity diagram*, tidak ada subbab *activity diagram* terpisah.
3. **4.1 menjawab "apa yang dibutuhkan", 4.2 menjawab "bagaimana diwujudkan".** Batas ini yang menentukan sesuatu masuk 4.1 atau 4.2, bukan urutan contoh pada pedoman.
4. **Subbab 4.2 memetakan satu-satu ke luaran tahap *Design* pada Bab III.** Bab III menetapkan empat luaran — rancangan arsitektur, rancangan basis data, rancangan proses, dan rancangan antarmuka — sehingga 4.2 terdiri atas empat subbab dengan nama yang sama. Yang disebut pedoman sebagai "Proses Bisnis Sistem Usulan" dan yang disebut Bab III sebagai "rancangan proses" adalah hal yang sama, jadi ditulis sekali.
5. **Diagram dikelompokkan menurut fitur yang dijelaskan, bukan menurut jenis diagram.** *Activity diagram* dan *state machine diagram* untuk satu proses menjawab dua pertanyaan yang saling melengkapi tentang proses yang sama — alurnya, dan status yang sah di sepanjang alur itu — sehingga ditempatkan berdampingan dalam satu subbab bernama menurut fiturnya (mis. "Alur Pengajuan dan Persetujuan Berjenjang Dokumen"), bukan dipisah menjadi subbab "Activity Diagram" dan subbab "State Machine Diagram". *Sequence diagram* dikecualikan karena beroperasi pada tingkat abstraksi berbeda (interaksi antarkomponen di dalam sistem, bukan alur bisnis antar-aktor), sehingga berdiri sendiri.

### Dua lapis kebutuhan

Bab IV memuat dua daftar kebutuhan yang berbeda lapis, bukan dua daftar yang saling mengulang. Perbedaan ini harus dinyatakan eksplisit di awal 4.1.3 agar tidak dibaca sebagai pengulangan Bab I.

| Lapis | Luaran tahap | Isi | Disajikan pada |
|---|---|---|---|
| **Kebutuhan pengguna** (*user requirement*) | DSRM 2 *Define Objectives of a Solution* | Apa yang dibutuhkan organisasi dan pengguna, dinyatakan sebagai tujuan; dipertajam dengan prinsip SMART menjadi indikator keberhasilan yang terukur | Bab I 1.2–1.3 (pernyataan) → **Bab IV 4.1.3.1** (penjabaran) |
| **Kebutuhan sistem** (*system requirement*) | DSRM 3 / MW-1 *Requirement Definitions* | Apa yang harus dilakukan sistem — kebutuhan fungsional dan nonfungsional | **Bab IV 4.1.3.2–4.1.3.4** |

Kalimat pembuka 4.1.3 yang disarankan: *"Bab ini tidak merumuskan ulang tujuan penelitian yang telah ditetapkan pada Bab I, melainkan menjabarkannya menjadi indikator keberhasilan yang terukur, untuk kemudian diturunkan menjadi kebutuhan sistem."*

### Notasi yang dipakai

| Notasi | Menjawab | Dipakai pada |
|---|---|---|
| *Activity diagram* dengan *swimlane* | Siapa melakukan apa, dalam urutan apa, bercabang ke mana | 4.1.1 (sistem berjalan) dan 4.2.2.1–4.2.2.3 (sistem usulan) |
| *Use case diagram* | Aktor mana berhak atas fungsi apa, batas sistem sampai di mana | 4.1.3 (kebutuhan fungsional) |
| ***State Machine Diagram*** | Dokumen/berkas boleh berpindah status ke mana, oleh aktor mana | 4.2.2.1 (status dokumen), 4.2.2.3 (status berkas) — ditempel langsung di bawah *activity diagram* fitur yang sama |
| *Sequence diagram* | Komponen mana bertukar pesan apa di dalam sistem | 4.2.2.4 |
| *Entity Relationship Diagram* | Entitas data dan keterhubungannya | 4.2.3 |
| *Wireframe* | Struktur halaman, komponen, dan alur interaksi pengguna | 4.2.4 |

> **Bukan "*Finite State Machine*".** *State Machine Diagram* adalah diagram perilaku UML — bersumber pada Dennis et al. (2015), buku yang sama dengan yang sudah dikutip untuk Use Case dan Activity Diagram di Bab II — bukan konsep teori otomata/matematika diskrit yang sering muncul saat istilah "*Finite State Machine*" dicari terpisah dari konteks rekayasa perangkat lunak. Saat rancangannya dideskripsikan dalam teks (bukan sebagai nama diagram), dipakai istilah "modul transisi status terpusat", tanpa akronim FSM. Kode aplikasi memang menamai modul ini `fsm.ts`, tetapi itu fakta implementasi milik Bab V, bukan istilah yang perlu dipakai di Bab II/IV.

**BPMN tidak dipakai.** Pedoman mengizinkan "alat pemodelan lainnya yang relevan", dan *activity diagram* dipilih karena tiga alasan: Bab II sudah memuat landasan teori beserta tabel notasinya (BPMN belum dan tidak perlu ditambahkan); Dennis et al. (2015) — pustaka yang sudah dikutip di Bab II — secara eksplisit menempatkan *activity diagram* sebagai alat pemodelan proses bisnis dan pemetaan alur kerja tingkat tinggi; serta satu notasi yang konsisten sepanjang bab lebih mudah diikuti pembaca. Aktor tetap terlihat karena seluruh diagram memakai *swimlane*; sistem eksternal (KipApp, SAKIP, SPIDER, Google Drive) digambarkan sebagai *partition* di luar batas sistem.

---

## 1. Posisi Bab IV dalam Kerangka Metodologi

Ditulis sebagai pengantar bab (maksimal dua paragraf, tanpa nomor subbab), disertai **Gambar 4.1 — Pemetaan Tahapan DSRM dan Modified Waterfall terhadap Struktur Penulisan**.

Kalimat kunci yang harus muncul: *"Bab IV merupakan luaran tahap Design and Development pada DSRM, khususnya tahap Requirement Definitions dan Design pada model Modified Waterfall. Bab I telah menyatakan permasalahan dan tujuan penelitian; bab ini menganalisis permasalahan tersebut sampai ke akarnya dan menerjemahkannya menjadi rancangan sistem."* — kalimat terakhir penting supaya 4.1 tidak dinilai mengulang Bab I.

### Pemetaan lengkap tahapan penelitian ke struktur buku

| Tahap | Luaran menurut Bab III | Disajikan pada |
|---|---|---|
| **DSRM 1** *Problem Identification and Motivation* | Rumusan permasalahan utama, urgensi, akar permasalahan dan dampaknya, batasan cakupan | **Bab I 1.1–1.2** (pernyataan masalah) → **Bab IV 4.1.1–4.1.2** (analisis proses bisnis berjalan dan akar masalah) |
| **DSRM 2** *Define Objectives of a Solution* | Tujuan penelitian (prinsip SMART), kebutuhan pengguna, indikator keberhasilan | **Bab I 1.3** (tujuan) → **Bab IV 4.1.3.1** (penjabaran SMART, kebutuhan pengguna, indikator keberhasilan) |
| **DSRM 3 / MW-1** *Requirement Definitions* | Pemodelan proses bisnis sistem berjalan (*activity diagram*), analisis fishbone, analisis PIECES, kebutuhan fungsional & nonfungsional, skenario dan diagram use case | **Bab IV 4.1.1–4.1.3** |
| **DSRM 3 / MW-2** *Design* | Rancangan arsitektur, rancangan proses (*activity*, *State Machine Diagram*, *sequence*), rancangan basis data (ERD), rancangan antarmuka (*wireframe*) | **Bab IV 4.2** |
| **DSRM 3 / MW-3** *Implementation* | Aplikasi web (TypeScript, TanStack Start, PostgreSQL, Drizzle ORM) | **Bab V 5.1** |
| **DSRM 3 / MW-4** *Testing* | Hasil *unit testing* (*white-box*), *integration* & *system testing* (*black-box*) | **Bab V 5.2** |
| **DSRM 4** *Demonstration* | Bukti pelaksanaan demonstrasi dan skenario penggunaan | **Bab V 5.2** (mendahului evaluasi) |
| **DSRM 5** *Evaluation* | Hasil kuesioner ISO 25010:2011, skor & interpretasi, ketercapaian indikator, aspek yang perlu diperbaiki | **Bab V 5.2** |
| **DSRM 6** *Communication* | Panduan penggunaan, buku skripsi, presentasi sidang | **Bab V** (panduan penggunaan) + **Bab VI** + kegiatan di luar buku |
| Pengumpulan data — studi literatur | Landasan teori dan penelitian terkait | **Bab II** |
| Pengumpulan data — wawancara & studi dokumentasi | Kondisi berjalan, LHE AKIP 2025, PMK 210/PMK.05/2022 | **Bab I 1.1** & **Bab IV 4.1** |

---

# 4.1 Analisis Sistem Berjalan

## 4.1.1 Proses Bisnis Sistem Berjalan

> **Mengapa fishbone saja tidak cukup.** Pedoman memisahkan 4.1.1 (proses bisnis, wajib disajikan dalam bentuk diagram beserta aktornya) dari 4.1.2 (permasalahan). Keduanya menjawab pertanyaan berbeda: *activity diagram* menjawab **bagaimana proses berjalan sekarang** (deskriptif), sedangkan fishbone menjawab **mengapa proses itu bermasalah** (kausal). Fishbone tanpa diagram proses akan menggantung karena pembaca belum punya gambaran prosesnya; diagram proses tanpa fishbone berhenti sebagai deskripsi tanpa analisis. *Activity diagram* dipilih daripada *flowchart* karena *swimlane*-nya menampilkan aktor, dan penyebutan aktor diwajibkan pedoman pada subbab ini.

Dibuka dengan **tabel aktor pada sistem berjalan** (Pegawai, Ketua Tim, PPK, PPSPM, Kepala Sub Bagian Umum, Penanggung Jawab Kinerja, dan pihak eksternal Inspektorat/BPK) beserta tanggung jawabnya dalam proses manual. Catat bahwa Admin belum muncul di sini — peran itu lahir bersama sistem, dan ini justru menegaskan perubahan yang dibawa sistem usulan.

Tiga *activity diagram* dengan *swimlane*, masing-masing diikuti 2–3 paragraf narasi dan anotasi titik masalah pada diagramnya:

| Gambar | Proses | *Swimlane* | Titik masalah yang dianotasi |
|---|---|---|---|
| 4.2 | Pengajuan dan pencairan dokumen kegiatan | Pegawai · PPK · PPSPM · Google Drive Satker (di luar batas) | Pemeriksaan di dua tempat (fisik + Drive); status hanya diketahui dengan bertanya; dokumen menumpuk di meja PPK saat banyak perjadin; penolakan lisan tanpa catatan; nominal realisasi tidak tercatat |
| 4.3 | Penyusunan laporan kinerja bulanan dan laporan kegiatan | Pegawai · Ketua Tim · KipApp (luar) · SAKIP (luar) | Pencarian sebagai proses tersendiri: cari di PC → tanya KSBU → cari fisik → pindai sendiri; Ketua Tim menagih dokumen anggota satu per satu |
| 4.4 | Pemberkasan administrasi keuangan dan pemenuhan arsip digital akhir tahun | Kepala Sub Bagian Umum · Inspektorat/BPK (luar) · SPIDER & Google Drive (luar) | Pemindaian ulang seluruh berkas fisik; penyimpanan tanpa pengindeksan metadata; PERMINDOK dilayani dengan penelusuran folder manual |

Gambar 4.3 adalah diagram yang paling kuat memperlihatkan masalahnya, karena menggambarkan *pencarian dokumen sebagai aktivitas bercabang*, bukan sekadar keluhan naratif. Jangan disederhanakan.

> **Catatan cakupan (Revisi 6).** Permasalahan penumpukan lampiran dokumen non-material (P-08, lihat 4.1.2) **tidak** ditambahkan sebagai diagram keempat di sini, karena secara kausal bukan bagian dari proses manual berbasis kertas yang direkam wawancara — ia adalah masalah operasional yang baru terlihat setelah sistem berjalan (lampiran non-material menumpuk di penyimpanan setelah diunggah, tanpa mekanisme pembersihan). Tempatnya ada di 4.1.2 sebagai temuan analisis, bukan di 4.1.1 sebagai proses berjalan.

## 4.1.2 Permasalahan Sistem Berjalan

### Identifikasi permasalahan
Tabel berkode, agar dapat ditelusuri sampai ke kebutuhan, use case, dan skenario pengujian di Bab V.

| Kode | Permasalahan | Terlihat pada | Sumber |
|---|---|---|---|
| P-01 | Dokumen elektronik tersebar di PC, *flashdisk*, dan Google Drive tanpa aturan bersama | Gambar 4.3 | Wawancara |
| P-02 | Tidak ada metadata dan daftar kelengkapan yang mengikat; pencarian & verifikasi bergantung pada ingatan pegawai | Gambar 4.2, 4.3 | Wawancara |
| P-03 | Tidak ada media pemantauan posisi dokumen dan realisasi anggaran; PPK menanyakan satu per satu (paling sering terlewat: translok) | Gambar 4.2 | Wawancara |
| P-04 | Persetujuan dan penolakan tidak terekam (paraf basah, penolakan lisan) sehingga jejak audit lemah | Gambar 4.2 | Wawancara |
| P-05 | Arsip digital dipenuhi dengan memindai ulang seluruh berkas fisik di akhir tahun — berulang, lama, berisiko terlewat | Gambar 4.4 | Wawancara |
| P-06 | Permintaan dokumen (PERMINDOK) dari Inspektorat/BPK dilayani dengan penelusuran folder manual | Gambar 4.4 | Wawancara |
| P-07 | Tidak ada kontrol akses maupun akuntabilitas identitas atas dokumen | Gambar 4.2, 4.4 | Analisis |
| **P-08** *(ditambahkan Revisi 6)* | **Lampiran fisik dokumen non-material menumpuk di penyimpanan server tanpa mekanisme pembersihan** — dokumen non-material (`TERSIMPAN`) tidak melalui alur persetujuan maupun pemberkasan, sehingga tidak pernah tersentuh proses "tutup berkas → usul pembersihan" yang berlaku untuk dokumen material; lampirannya bisa menumpuk bertahun-tahun tanpa pernah ditinjau | — (ditemukan lewat analisis rancangan basis data & kode, bukan wawancara awal) | Analisis kode/rancangan |

> **Catatan sumber P-08.** Berbeda dari P-01–P-07 yang berasal dari wawancara terhadap proses manual, P-08 ditemukan dari analisis rancangan sistem usulan itu sendiri (bukan proses berjalan) — konsisten dengan sifat penelitian rekayasa yang berulang: rancangan awal (dokumen material vs non-material dipisah agar non-material tidak perlu proses persetujuan berat) memunculkan konsekuensi baru (lampirannya tidak pernah "selesai" dan tidak pernah dibersihkan). Solusinya menjadi use case tersendiri — lihat **UC-08 Membersihkan Lampiran Dokumen Non-Material** di 4.1.3.3. Fishbone (Gambar 4.5) tetap disusun dari P-01–P-07 sebagai akar masalah AS-IS; P-08 tidak dipaksakan masuk ke fishbone karena bukan akar masalah proses manual, melainkan temuan pada saat iterasi rancangan solusi — tetap dicatat di sini agar tertelusuri ke kebutuhan sistem.

### Analisis akar permasalahan
**Gambar 4.5 — Diagram Fishbone Permasalahan Pengelolaan Dokumentasi Kegiatan dan Pertanggungjawaban Kinerja**

- **Kepala ikan (efek):** "Capaian kinerja dan dokumen pertanggungjawaban kegiatan belum dapat ditelusuri dan dipertanggungjawabkan secara efisien" — dirumuskan dari temuan LHE AKIP 2025 (nilai 72,65, predikat BB), sehingga efeknya berbasis dokumen resmi, bukan opini peneliti.
- **Lima tulang** (berbasis P-01–P-07; P-08 tidak disertakan — lihat catatan di atas):

| Kategori | Akar penyebab | Terkait |
|---|---|---|
| Manusia | Penyimpanan & pemindaian bergantung kesadaran masing-masing; syarat kelengkapan hanya diingat staf senior; pegawai lupa mengajukan translok | P-01, P-02, P-03 |
| Metode / Prosedur | Pemindaian ditunda ke akhir tahun; penamaan file bebas; daftar kelengkapan berkedudukan sebagai bacaan bukan kendali; pemantauan dengan bertanya; penolakan lisan | P-02, P-03, P-04, P-05 |
| Sarana / Teknologi | Belum ada aplikasi pengelola dokumen; Google Drive & *flashdisk* tanpa pengindeksan metadata; tidak ada media pemantauan realisasi; kapasitas penyimpanan terbatas | P-01, P-02, P-03 |
| Data / Informasi | Metadata tidak terstruktur; tidak ada daftar dokumen yang ada/belum ada; nominal realisasi tidak melekat pada dokumen; dokumen material & non-material diperlakukan sama | P-02, P-03 |
| Kebijakan / Regulasi | Peraturan internal BPS tentang arsip elektronik masih disusun; kewajiban arsip digital & PERMINDOK tetap berjalan; alur fisik belum boleh digantikan | P-05, P-06, P-07 |

Tulang keenam "Lingkungan" sengaja tidak dipakai karena tidak ada dukungan data wawancara. Diagram digambar ulang sendiri, tidak menyalin dari pustaka (sesuai ketentuan templat dan acuan Liliana, 2016; Xu, 2020).

### Dampak terhadap akuntabilitas kinerja
Dua sampai tiga paragraf yang menyambungkan akar masalah ke komponen "pengukuran kinerja" pada Evaluasi AKIP dan ke rekomendasi Inspektorat agar satuan kerja membangun sistem pengelolaan dokumentasi kegiatan. Bagian ini yang menjaga benang merah akuntabilitas — jangan dihilangkan demi keringkasan.

## 4.1.3 Analisis Kebutuhan Sistem

### 4.1.3.1 Tujuan Solusi dan Indikator Keberhasilan

Subbab ini adalah luaran DSRM tahap *Define Objectives of a Solution* dan **menutup celah yang saat ini ada**: Bab III menyatakan tujuan disusun dengan prinsip SMART dan bahwa evaluasi di Bab V menilai ketercapaian terhadap "indikator keberhasilan yang ditetapkan pada tahap define objectives", padahal indikator tersebut belum dituliskan di bab mana pun.

**Tabel 4.x — Penjabaran Tujuan Penelitian menjadi Tujuan Solusi dan Indikator Keberhasilan**

| Tujuan Khusus (Bab I) | Pernyataan tujuan solusi | Pemenuhan kriteria SMART | Indikator keberhasilan | Diverifikasi pada |
|---|---|---|---|---|
| 1. Repositori terpusat bermetadata + kelengkapan + jejak audit | … | *Specific / Measurable / Achievable / Relevant / Time-bound* diuraikan per kriteria | Seluruh use case modul **M2** dan **M6** (data master) berstatus lolos pada *system testing* | Bab V 5.2 |
| 2. Alur persetujuan berjenjang + pemantauan realisasi | … | … | Seluruh transisi pada tabel transisi status (4.2.2.1) lolos *unit testing*; seluruh use case modul **M3** dan UC-20 lolos *system testing* | Bab V 5.2 |
| 3. Pemberkasan, pembersihan, dan pengunduhan berkas/dokumen | … | … | Seluruh use case modul **M4**, UC-08, UC-18, dan UC-19 lolos *system testing* | Bab V 5.2 |
| 4. Pengujian dan evaluasi dengan ISO 25010:2011 | … | … | Skor rata-rata setiap karakteristik berada pada kategori minimal "Diterima" (≥ 2,50), dengan target "Sangat Diterima" (≥ 3,50) sesuai rentang interpretasi Bab III | Bab V 5.2 |

Catatan: heading **SMART pada Bab II masih kosong** dan harus diisi sebelum subbab ini ditulis, agar teorinya terpakai.

### 4.1.3.2 Analisis Kebutuhan dengan Kerangka PIECES

**Tabel 4.x — Hasil Analisis PIECES terhadap Sistem Berjalan.** Kolom: *Kategori · Temuan pada sistem berjalan (kode P-xx) · Arah kebutuhan (kode UC/KNF)*.

| Dimensi | Temuan | Arah kebutuhan |
|---|---|---|
| *Performance* | Pencarian satu dokumen dapat menghabiskan berjam-jam; pemindaian ulang massal akhir tahun | Repositori terpusat dengan penyaringan berbasis metadata; unggah sejak dokumen dihasilkan |
| *Information* | Tidak ada metadata; nama kegiatan/jenis ditulis bebas; tidak ada rekap realisasi | Data master terkontrol (termasuk Komponen); metadata wajib; agregasi nominal per fungsi, kegiatan & komponen |
| *Economics* | Waktu pegawai habis untuk mencari dan memindai ulang; kapasitas penyimpanan terbatas (termasuk lampiran non-material yang menumpuk, P-08) | Satu kali unggah dipakai tiga keperluan; pembersihan soft file berkas dan lampiran non-material dengan metadata dipertahankan |
| *Control* | Paraf basah dapat dipalsukan; siapa pun pemegang map dapat membaca; penolakan tidak tercatat | RBAC ditegakkan di server; akses lampiran terotorisasi; log *append-only*; catatan penolakan wajib |
| *Efficiency* | Pemeriksaan di dua tempat; menagih dokumen anggota satu per satu; menanyakan status | Satu kanal dokumen; kotak masuk per peran; status & riwayat dapat dilihat mandiri |
| *Service* | Pegawai baru sering ketinggalan berkas; PERMINDOK dilayani penelusuran manual | Checklist kelengkapan dinamis per kegiatan × peran × komponen × jenis permintaan; ekspor ZIP per berkas dan per filter |

### 4.1.3.3 Kebutuhan Fungsional

Kebutuhan fungsional **disajikan langsung dalam bentuk use case** — satu penomoran, satu daftar, tidak ada tabel kebutuhan fungsional terpisah yang isinya sama. Penempatan di 4.1 mengikuti Bab III, yang menetapkan skenario dan diagram use case sebagai luaran tahap *Requirement Definitions*.

> **Penempatan use case di 4.1.3 — final.** Pedoman mencontohkan Use Case Diagram di bagian Perancangan (4.2), tetapi kerangka ini menempatkannya di 4.1.3 karena selaras dengan Bab III (skenario dan diagram use case adalah luaran tahap *Requirement Definitions*) dan menghindari duplikasi kebutuhan fungsional ↔ use case. Disebutkan sekali ke pembimbing sebagai penjelasan struktur.

> **Tingkat kerincian use case: satu use case = satu tujuan pengguna (Revisi 7).** Use case dirumuskan pada tingkat **tujuan pengguna** (*user goal*) — sesuatu yang ingin dicapai aktor dalam satu kali duduk dan bernilai baginya — bukan pada tingkat langkah. Konsekuensinya, langkah-langkah seperti mengisi metadata, memilih komponen, mengisi nominal realisasi, dan mengunggah kelengkapan **tidak** dipecah menjadi use case sendiri, melainkan ditulis sebagai langkah pada alur utama skenario use case induknya (*Mengajukan Dokumen*). Pilihan yang saling meniadakan (setujui **atau** tolak, perbaiki **atau** kembalikan, dokumen material **atau** non-material) juga ditulis sebagai alur utama dan alur alternatif dalam **satu** skenario, bukan sebagai use case terpisah — inilah cara yang tepat untuk memodelkan "Validasi Dokumen berisi setujui/tolak" tanpa menyalahgunakan «include». Dengan prinsip ini daftar kebutuhan turun dari 61 menjadi **24 use case**, dan hampir seluruhnya berpadanan satu-satu dengan menu aplikasi per peran, sehingga mudah ditelusuri ke antarmuka (4.2.4) dan ke skenario pengujian (Bab V).

**a. Aktor sistem usulan.** Tabel tujuh aktor: Pegawai, Ketua Tim, PPK, PPSPM, Kepala Sub Bagian Umum (KSBU), Penanggung Jawab Kinerja (PJ Kinerja), Admin. Tiga hal yang wajib dijelaskan di narasi karena merupakan keputusan rancangan dan sering ditanya penguji:
1. **Ketua Tim bukan peran login, tetapi tetap digambar sebagai aktor.** Dalam UML, aktor adalah *peran yang dimainkan* seseorang terhadap sistem, bukan jenis akun (Dennis et al., 2015). Di aplikasi, Ketua Tim adalah penugasan per kegiatan yang ditetapkan Admin (UC-22) dan melekat pada akun berperan Pegawai. Karena itu Ketua Tim digambarkan sebagai **generalisasi dari Pegawai**: ia mewarisi seluruh use case Pegawai dan menambah dua use case (Laporan Kegiatan dan Pembersihan Lampiran Dokumen Non-Material). Batasan bahwa Ketua Tim hanya dapat mengakses dokumen **pada kegiatan yang dipimpinnya** adalah aturan data, bukan fungsi baru, sehingga tidak digambar di diagram — ditulis pada deskripsi dan prakondisi skenario UC-08 dan UC-19, dan ditegakkan server (otorisasi diulang per dokumen).
2. **Admin tidak mewarisi hak peran operasional dan selalu berperan tunggal.** Admin tidak dapat digabung dengan peran lain, sehingga tidak dapat berpindah peran, menyetujui, maupun memberkaskan. Di diagram M1 hal ini terlihat dari aktor perantara "Pengguna Operasional" yang menjadi satu-satunya pemilik UC-04 Berpindah Peran Aktif.
3. Satu pengguna dapat memegang lebih dari satu peran operasional (mis. Pegawai sekaligus PPK) dan berpindah melalui *role switcher*.

**b. Daftar kebutuhan fungsional.** 24 use case dalam 6 modul (rincian di Lampiran A):

| Modul | Use case | Jumlah | Aktor |
|---|---|---|---|
| M1 Akses dan Akun | Login, Logout, Mengelola Profil dan Kata Sandi (semua pengguna); Berpindah Peran Aktif (peran operasional saja, **bukan Admin**) | 4 | Semua pengguna |
| M2 Pengajuan Dokumen | Mengajukan Dokumen, Mengelola Dokumen yang Diajukan, Merevisi Dokumen yang Ditolak, Membersihkan Lampiran Dokumen Non-Material | 4 | Pegawai, Ketua Tim |
| M3 Persetujuan Berjenjang | Memvalidasi Dokumen, Menindaklanjuti Dokumen yang Ditolak PPSPM, Menyetujui Dokumen, Melihat Dokumen yang Telah Diproses | 4 | PPK, PPSPM |
| M4 Pemberkasan | Mengklasifikasikan Dokumen ke Berkas, Menambahkan Dokumen tanpa Alur Persetujuan, Mengelola Berkas, Membersihkan File Berkas, Mengelola Klasifikasi Dokumen | 5 | KSBU |
| M5 Pelaporan dan Pemantauan | Melihat Laporan Saya, Melihat Laporan Kegiatan, Memantau Nominal Realisasi, Melihat Laporan Kinerja | 4 | Pegawai, Ketua Tim, PPK, PPSPM, PJ Kinerja |
| M6 Administrasi Sistem | Mengelola Pengguna dan Penugasan Ketua Tim, Mengelola Data Master, Mengatur Tampilan Aplikasi | 3 | Admin |

Yang sengaja **tidak** dijadikan use case, beserta tempat penulisannya:

| Hal | Alasan | Ditulis di |
|---|---|---|
| Pencatatan riwayat aktivitas | Dilakukan otomatis oleh sistem, bukan tujuan aktor | Pascakondisi skenario UC-05, UC-07–UC-11, UC-13, UC-14, UC-16; KNF-08 |
| Unggah kelengkapan, pengisian nominal, pemilihan komponen | Langkah di dalam pengajuan, bukan tujuan tersendiri | Alur utama skenario UC-05 |
| Melihat detail dokumen dan *timeline* riwayatnya | Selalu dilakukan dari dalam daftar dokumen masing-masing peran | Alur utama UC-06, UC-09, UC-11, UC-12, UC-15 |
| Mencari/menyaring dokumen | Fasilitas di setiap halaman daftar | Alur alternatif skenario daftar terkait |
| Ekspor ZIP | Aksi dari dalam laporan dan berkas | Alur alternatif UC-15, UC-18, UC-19 |
| Dasbor | Ringkasan tampilan, bukan tujuan | *Wireframe* (4.2.4) |

**c. Use case diagram.** Satu diagram per modul, enam gambar:

| Gambar | Cakupan |
|---|---|
| 4.6 | M1 Akses dan Akun — aktor abstrak "Pengguna" (induk Admin dan "Pengguna Operasional"); lima peran operasional digeneralisasikan ke "Pengguna Operasional", satu-satunya yang berhak Berpindah Peran |
| 4.7 | M2 Pengajuan Dokumen — Pegawai, Ketua Tim (generalisasi ke Pegawai) |
| 4.8 | M3 Persetujuan Berjenjang — PPK, PPSPM |
| 4.9 | M4 Pemberkasan — KSBU |
| 4.10 | M5 Pelaporan dan Pemantauan — Pegawai, Ketua Tim, PPK, PPSPM, PJ Kinerja |
| 4.11 | M6 Administrasi Sistem — Admin |

Relasi yang dipakai hanya **asosiasi** dan **generalisasi aktor** (Ketua Tim → Pegawai; peran operasional → Pengguna Operasional → Pengguna; Admin → Pengguna). «include» dan «extend» tidak diperlukan pada tingkat kerincian ini, karena perilaku yang dulu dimodelkan dengan keduanya kini sudah menjadi langkah atau alur alternatif di dalam skenario. Hal ini disebutkan sekali di narasi agar penguji tidak menganggapnya terlewat.

**d. Skenario use case.** Format baku: *Nama · Kode · Aktor · Deskripsi · Prakondisi · Pemicu · Alur utama (dua kolom aksi aktor / respons sistem) · Alur alternatif · Alur kesalahan · Pascakondisi*. Sembilan skenario kritis di badan bab, lima belas sisanya di Lampiran:

UC-01 Login · UC-05 Mengajukan Dokumen · UC-07 Merevisi Dokumen yang Ditolak · UC-09 Memvalidasi Dokumen · UC-11 Menyetujui Dokumen · UC-13 Mengklasifikasikan Dokumen ke Berkas · UC-14 Menambahkan Dokumen tanpa Alur Persetujuan · UC-15 Mengelola Berkas · UC-16 Membersihkan File Berkas.

**e. Hak akses per peran — cukup narasi, tanpa tabel terpisah.** Hubungan aktor–use case sudah tergambar pada use case diagram, sehingga tabel matriks peran × use case tidak dibuat. Yang ditulis hanya dua invarian rancangan yang tidak terlihat pada diagram: (1) penyembunyian menu di antarmuka bersifat kosmetik — keputusan akhir selalu diperiksa ulang di sisi server; (2) Admin tidak mewarisi hak peran operasional. Keduanya menjadi dasar klaim pada butir kuesioner *Confidentiality* dan *Integrity* di Bab V.

### 4.1.3.4 Kebutuhan Nonfungsional

Dipetakan langsung ke karakteristik ISO 25010:2011, sehingga Bab V dapat menunjuk "KNF-06 diuji oleh butir kuesioner nomor sekian" tanpa penerjemahan ulang.

| Kode | Karakteristik ISO 25010:2011 | Kebutuhan |
|---|---|---|
| KNF-01 | *Performance Efficiency – Time Behaviour* | Daftar dan penyaringan dokumen tampil di bawah ambang waktu yang ditetapkan pada volume data uji |
| KNF-02 | *Performance Efficiency – Capacity* | Melayani seluruh pegawai satuan kerja secara bersamaan pada jaringan LAN |
| KNF-03 | *Usability – Operability* | Pengajuan berupa formulir bertahap dengan validasi langsung di tiap langkah |
| KNF-04 | *Usability – User Error Protection* | Tombol "Ajukan" nonaktif sampai kelengkapan wajib terpenuhi; peringatan perubahan belum tersimpan; konfirmasi ketik-persis untuk aksi destruktif (tutup berkas, pembersihan file berkas, pembersihan lampiran non-material) |
| KNF-05 | *Usability – UI Aesthetics* | Komponen antarmuka seragam di seluruh peran; tema dapat diatur Admin |
| KNF-06 | *Security – Confidentiality* | RBAC ditegakkan di sisi server; lampiran tidak dapat diakses melalui tautan langsung |
| KNF-07 | *Security – Integrity* | Transisi status hanya melalui satu modul transisi status terpusat; metadata terkunci setelah `COMPLETED`; validasi skema di setiap *boundary* |
| KNF-08 | *Security – Non-repudiation* | Setiap transisi menulis satu baris log berisi aksi, aktor, waktu, dan catatan; aksi tanpa FK langsung (hard-delete dokumen non-material, pembersihan lampiran) tetap tercatat di `audit_log` yang tahan penghapusan |
| KNF-09 | *Security – Accountability* | Riwayat aktivitas tersedia per dokumen, per berkas, dan per pengguna; log bersifat *append-only* |
| KNF-10 | *Security – Authenticity* | Kata sandi di-*hash* (Argon2id); sesi memakai cookie *opaque* + HttpOnly; pembatasan percobaan login |
| KNF-11 | *Reliability – Fault Tolerance & Recoverability* | Kesalahan masukan diberi pesan jelas; draf tidak hilang saat terjadi kendala |
| KNF-12 | *Maintainability – Modularity & Modifiability* | Aturan alur terpusat pada satu modul transisi status; pemisahan lapisan rute–layanan–skema; aturan bisnis diuji tanpa basis data lewat injeksi *repository* |
| KNF-13 | *Portability – Adaptability & Installability* | Berjalan penuh di server lokal satuan kerja tanpa internet, diakses dari peramban modern |
| KNF-14 | *Portability* / pengelolaan sumber daya | Soft file berkas dan lampiran dokumen non-material yang lama dapat dibersihkan sementara metadata dipertahankan |

Karakteristik *Compatibility* tidak dipakai karena sistem bersifat mandiri dan tidak bertukar data dengan sistem lain — konsisten dengan Bab III; sebutkan alasannya sekali di sini.

### 4.1.3.5 Matriks Penelusuran Kebutuhan (opsional, direkomendasikan)

**Bukan kewajiban pedoman** — pedoman hanya meminta kebutuhan disajikan "jelas dan terstruktur", tanpa mensyaratkan bentuk matriks penelusuran. Ini murni usulan tambahan, bukan artefak yang harus ada. Tetap direkomendasikan dipertahankan karena tidak mengulang apa pun yang sudah ada di subbab lain — inilah satu-satunya tempat yang menjawab eksplisit pertanyaan yang hampir selalu muncul dari penguji: "mana buktinya sistem ini menjawab masalahnya?" Biayanya kecil (satu tabel, satu halaman); boleh dipotong bila Bab IV dirasa terlalu padat, tanpa kehilangan artefak yang wajib.

**Tabel 4.x — Matriks Penelusuran Permasalahan, Tujuan Penelitian, dan Kebutuhan Sistem.** Kolom: *Permasalahan (P-xx, termasuk P-08) · Tujuan Khusus · Dimensi PIECES · Kebutuhan (UC/KNF) · Modul*. Versi lanjutannya di Bab V ditambah kolom skenario pengujian.

---

# 4.2 Perancangan Sistem

Empat subbab, memetakan satu-satu ke empat luaran tahap *Design* pada Bab III:

| Subbab | Luaran tahap *Design* (Bab III) | Isi |
|---|---|---|
| 4.2.1 Rancangan Arsitektur Sistem | rancangan arsitektur | Tumpukan teknologi, pembagian lapisan, *Client-Side Rendering*, aplikasi monolitik di server lokal |
| 4.2.2 Rancangan Proses Sistem | rancangan proses | Tiga alur fitur — pengajuan/persetujuan, pembersihan dokumen non-material, dan pemberkasan/pembersihan file — masing-masing dengan *activity diagram* (+ *State Machine Diagram* untuk dua yang pertama dan ketiga); ditutup *sequence diagram* |
| 4.2.3 Rancangan Basis Data | rancangan basis data | ERD dan kamus data |
| 4.2.4 Rancangan Antarmuka | rancangan antarmuka | Struktur navigasi dan *wireframe* |

Contoh subbab pada pedoman tetap terwakili: Proses Bisnis Sistem Usulan menjadi 4.2.2.1–4.2.2.3 (pedoman menyebutnya "proses bisnis usulan", Bab III menyebutnya "rancangan proses" — hal yang sama, ditulis sekali; dikelompokkan per fitur, bukan per jenis diagram — lihat prinsip 5 pada Subbab 0), Rancangan Basis Data menjadi 4.2.3, Rancangan Antarmuka menjadi 4.2.4, sedangkan Use Case Diagram dipindah ke 4.1.3 sebagai penyajian kebutuhan fungsional agar tidak ditulis dua kali.

## 4.2.1 Rancangan Arsitektur Sistem

**Gambar 4.12 — Rancangan Arsitektur Sistem.** Aplikasi monolitik berbasis web pada server lokal satuan kerja: peramban klien di LAN → server aplikasi (lapisan rute/API, lapisan layanan, modul transisi status terpusat, validasi skema) → PostgreSQL melalui Drizzle ORM (6 *schema*: `auth`, `master`, `dokumen`, `arsip`, `app`, `audit`) + penyimpanan file pada *filesystem* lokal.

Isinya **rancangan** — komponen dan tanggung jawab masing-masing, serta alasan pemilihan *Client-Side Rendering* (teorinya sudah ada di Bab II) beserta implikasinya pada halaman Monitoring Nominal Realisasi dan Laporan Kinerja. Detail versi, konfigurasi, dan struktur direktori kode adalah **hasil implementasi** dan menjadi milik Bab V 5.1.1. Batas ini harus dijaga supaya tidak dinilai sebagai pengulangan.

## 4.2.2 Rancangan Proses Sistem

Dikelompokkan menurut fitur, bukan menurut jenis diagram (lihat prinsip 5 pada Subbab 0). Tiga subbab pertama masing-masing memuat *activity diagram* (dua di antaranya disertai *State Machine Diagram* untuk proses yang sama), ditempatkan berdampingan; subbab keempat memuat *sequence diagram*, berdiri sendiri karena beroperasi pada tingkat abstraksi yang berbeda.

### 4.2.2.1 Alur Pengajuan dan Persetujuan Berjenjang Dokumen

Disajikan dengan *activity diagram* ber-*swimlane*, notasi yang sama dengan 4.1.1 sehingga perbandingan sistem berjalan dan usulan terbaca tanpa perlu tabel perbandingan eksplisit (pedoman menyebut perbandingan boleh implisit).

> **Bukan pengulangan 4.1.1.** *Activity diagram* pada 4.1.1 menggambarkan **sistem berjalan** — proses manual berbasis kertas yang belum dibantu sistem apa pun. *Activity diagram* di sini menggambarkan **sistem usulan** — proses yang sama setelah dibantu sistem. Isinya berbeda sama sekali; yang sama hanya notasinya, dan justru kesamaan notasi itulah yang membuat perubahannya terbaca.

| Gambar | *Activity Diagram* | Yang harus terlihat |
|---|---|---|
| 4.13 | Pengajuan dokumen | Deteksi otomatis status Ketua Tim; percabangan material vs non-material; untuk Material: langkah Komponen (anak Kegiatan) dan rantai Jenis–Kategori–Detail Permintaan (tetap tabel global, cabang independen) berjalan berdampingan sampai bertemu di checklist kelengkapan; untuk Non-material: input teks bebas Nama Dokumen; checklist kelengkapan dinamis sebagai *decision* sebelum pengajuan |
| 4.14 | Persetujuan berjenjang PPK dan PPSPM | *Decision* setuju/tolak/kembalikan pada PPK; *decision* setuju/tolak pada PPSPM; penulisan log pada setiap transisi |
| 4.15 | Revisi dan pengajuan ulang | Dua jalur berbeda menurut `revision_target`: pegawai memperbaiki lalu kembali ke antrian PPK, atau PPK memperbaiki lalu langsung ke PPSPM tanpa mengulang validasi PPK |

Anotasi wajib pada ketiganya: **alur fisik tetap berjalan berdampingan** — sistem mendampingi, bukan menggantikan (konsisten dengan batasan masalah Bab I).

Ketiga *activity diagram* di atas menunjukkan **alurnya**; berikut disajikan **status yang sah** di sepanjang alur tersebut, sebagai pasangan langsungnya:

- **Gambar 4.16 — *State Machine Diagram* Status Dokumen.** Status `DRAFT`, `IN_PPK_VALIDATION`, `IN_PPSPM_APPROVAL`, `NEED_REVISION`, `COMPLETED`, `TERSIMPAN`; transisi berlabel aksi (`SUBMIT`, `APPROVE`, `REJECT`, `RESUBMIT`, `RESUBMIT_PPK`, `KEMBALIKAN`) beserta aktor yang berwenang. **`COMPLETED` adalah status akhir permanen untuk dokumen material** — tidak ada lagi status `ARCHIVED` maupun aksi `ARCHIVE`/`SKIP` (dikoreksi Revisi 6, lihat catatan di bawah); "sudah diberkaskan" digambarkan **bukan** sebagai perpindahan status dokumen, melainkan sebagai keanggotaan dokumen di `berkas_arsip_item` (lihat 4.2.2.3).
- **Tabel 4.x — Tabel Transisi Status Dokumen.** Kolom: *Status asal · Aksi · Aktor berwenang · Status tujuan · Prasyarat · Catatan wajib?*. Enam baris (`DRAFT:SUBMIT`, `IN_PPK_VALIDATION:APPROVE`, `IN_PPK_VALIDATION:REJECT`, `IN_PPSPM_APPROVAL:APPROVE`, `IN_PPSPM_APPROVAL:REJECT`, `NEED_REVISION:RESUBMIT`, `NEED_REVISION:RESUBMIT_PPK`, `NEED_REVISION:KEMBALIKAN` — delapan baris transisi dari enam aksi, karena `REJECT` dan `RESUBMIT`/`RESUBMIT_PPK` bercabang menurut `revision_target`). Tabel ini menjadi dasar langsung penyusunan kasus uji *unit testing* di Bab V — sebutkan keterkaitannya secara eksplisit, karena inilah yang membuat *white-box testing* punya basis rancangan, bukan asal pilih fungsi. Jalur Non-material (`DRAFT → TERSIMPAN`, aksi audit `STORE`) **tidak lewat modul transisi status terpusat** — sebutkan ini sebagai satu-satunya pengecualian yang disengaja (lihat invarian arsitektur, Bab V).

Gambar 4.16 dan tabel transisinya sekaligus menjadi dasar klaim *Integrity* (KNF-07) dan *Non-repudiation* (KNF-08).

> **Koreksi Revisi 6 — status dan aksi yang dihapus.** Revisi 5 masih mencantumkan status `ARCHIVED` dan aksi `ARCHIVE`/`SKIP`, mengikuti dokumen "Penjelasan Proyek Aplikasi" yang lama. Peta kode (`Peta Kode src - workflow-ubah-alur-v1.md`, §0 dan §8) menyatakan keduanya **sudah dihapus total dari kode**: dokumen material yang telah `COMPLETED` tetap `COMPLETED` selamanya; status "sudah diberkaskan" tidak pernah ada sebagai nilai `status` — ia adalah fakta keanggotaan di tabel `berkas_arsip_item`. Status `IN_BENDAHARA_APPROVAL` juga diganti `IN_PPSPM_APPROVAL`, karena peran ini sudah bernama `PPSPM` sampai ke kode (bukan sekadar label tampilan di atas kode `BENDAHARA`).

Prasyarat: **Bab II belum memuat landasan teori *State Machine Diagram***; harus ditambahkan sebelum subbab ini ditulis (lihat Prasyarat pada Bab Lain).

### 4.2.2.2 Alur Pembersihan Dokumen Non-Material *(subbab baru, Revisi 6)*

> **Kenapa subbab baru, bukan ditumpangkan ke 4.2.2.1 atau 4.2.2.3.** Alur ini menjawab masalah tersendiri (P-08) dengan aktor tersendiri (Ketua Tim, bukan Pegawai/PPK/PPSPM di 4.2.2.1, bukan KSBU di 4.2.2.3) dan tidak bergantung pada status FSM dokumen maupun status berkas — dokumen non-material yang dibersihkan tetap berstatus `TERSIMPAN`, hanya kolom `lampiran_dibersihkan_at/by/alasan` yang berubah. Menumpangkannya ke salah satu subbab lain akan mengaburkan bahwa ini alur independen.

**Gambar 4.17 — Pembersihan lampiran dokumen non-material.** Yang harus terlihat: Ketua Tim membuka daftar dokumen non-material `TERSIMPAN` dari kegiatan yang dipimpinnya; sistem menghitung umur dokumen (`tanggal` → hari ini) dan menandai "lama" bila melewati ambang 90 hari (`NON_MATERIAL_STALE_DAYS`, tanpa penjadwal — dihitung saat halaman dibuka, konsisten dengan invarian "tidak ada scheduler" pada 4.2.2.3); Ketua Tim memilih dokumen dan mengetik frasa konfirmasi; server mengulang otorisasi per dokumen sebelum menghapus file fisik.

**Tidak ada *State Machine Diagram* terpisah untuk alur ini** — kondisi "lampiran dibersihkan" bukan status bertingkat, melainkan satu penanda biner (`lampiran_dibersihkan_at` terisi atau tidak) yang tidak memengaruhi `status` dokumen; cukup dijelaskan dalam satu-dua kalimat pada narasi Gambar 4.17, konsisten dengan keputusan rancangan "kondisi file terpisah dari status proses" yang juga berlaku untuk berkas (lihat 4.2.2.3).

### 4.2.2.3 Alur Pemberkasan, Pembersihan File, dan Pemanfaatan Dokumen

| Gambar | *Activity Diagram* | Yang harus terlihat |
|---|---|---|
| 4.18 | Pemberkasan dokumen | Dua pintu masuk (pengklasifikasian dokumen selesai dan penambahan dokumen manual) yang bermuara ke satu struktur berkas; aturan *get-or-create* berkas terbuka per cara pembayaran (satu berkas `OPEN` per klasifikasi, ditegakkan *partial unique index* di basis data, bukan hanya di kode); penutupan berkas dengan Nomor SPM dan Masa Simpan Minimal |
| 4.19 | Pembersihan file berkas dan pengelolaan masa simpan | Dua tahap (usul → bersihkan), jalur batalkan usulan, konfirmasi ketik-persis dengan frasa `BERSIHKAN FILE BERKAS`, metadata dan log tetap dipertahankan; penghapusan file fisik **langsung dieksekusi** setelah konfirmasi (tanpa jeda tinjauan tambahan) |
| 4.21 | Pemanfaatan dokumen dan ekspor | Ekspor ZIP terfilter (kebutuhan bulanan, Pegawai/Ketua Tim), ekspor ZIP per berkas (kebutuhan tahunan & PERMINDOK, KSBU), ekspor CSV metadata-only, Monitoring Nominal Realisasi metadata-only (material, PPK/PPSPM), Laporan Kinerja metadata-only (material & non-material, PJ Kinerja); pemanfaatan di luar sistem digambar di luar batas sistem |

Gambar 4.18 memuat salah satu kontribusi penelitian (dua jalur pengisian bermuara pada satu struktur pemberkasan), jadi jangan disederhanakan. Narasinya juga menjelaskan bahwa `getOrCreateOpenBerkasForKlasifikasi` berjalan otomatis di server tanpa keputusan aktor tersendiri — bukan use case terpisah, melainkan langkah di dalam UC-13. Pada Gambar 4.21, **batas sistem digambar tegas** terhadap KipApp, SAKIP, SPIDER, dan Google Drive — bukti bahwa batasan "tidak terintegrasi dengan aplikasi lain" ditepati.

Pasangan langsung untuk Gambar 4.18 dan 4.19:

- **Gambar 4.20 — *State Machine Diagram* Status Berkas.** Dua dimensi status pada `berkas_arsip` digambarkan bersusun: (1) `status_berkas` — `Terbuka` (`OPEN`) → `Tertutup` (`CLOSED`, wajib disertai Nomor SPM dan tanggal penutupan); (2) begitu `Tertutup`, `status_arsip` berjalan **dua tahap** (bukan empat) — `Aktif` (`AKTIF`) → `Usul Pembersihan` (`USUL_MUSNAH`) → `File Dibersihkan` (`DIMUSNAHKAN`, terminal), beserta transisi "Batalkan Usulan" kembali ke `Aktif`. Jelaskan bahwa penanda jatuh tempo dihitung saat halaman dibuka dan tidak ada penjadwal, sehingga tidak ada status yang berpindah sendiri — ini keputusan rancangan yang layak dituliskan.

> **Koreksi Revisi 6 — lifecycle berkas.** Revisi 5 menuliskan lifecycle empat tahap (`Terbuka → Tertutup → Usul Pembersihan → File Dibersihkan`) yang sudah cocok dengan kode saat ini (RP-01 sudah tercapai, `INAKTIF` tidak lagi dipakai di alur — nilai enumnya masih ada di basis data hanya demi memenuhi CHECK constraint lama). Revisi 6 hanya menegaskan pemisahan `status_berkas` (Terbuka/Tertutup) dari `status_arsip` (Aktif/Usul Pembersihan/File Dibersihkan) yang sebelumnya tercampur dalam satu diagram — keduanya dimensi berbeda pada baris yang sama, bukan satu status tunggal.

### 4.2.2.4 Sequence Diagram

Enam *sequence diagram* yang memperlihatkan lapisan arsitektur (Peramban → Rute/*Server Function* → Validasi Skema → Modul Transisi Status Terpusat → Layanan → Drizzle ORM → PostgreSQL / Penyimpanan File). Fungsinya melengkapi *activity diagram*: *activity* menjawab alur bisnis antar-aktor, *sequence* menjawab bagaimana komponen di dalam sistem saling memanggil — sekaligus membuktikan modularitas yang diklaim pada KNF-12.

| Gambar | *Sequence Diagram* |
|---|---|
| 4.22 | Pengajuan dokumen beserta penulisan log aktivitas |
| 4.23 | Unggah lampiran kelengkapan |
| 4.24 | Persetujuan dokumen oleh PPK melalui modul transisi status terpusat |
| 4.25 | Pengklasifikasian dokumen dan pembentukan berkas (*get-or-create*) |
| 4.26 | Akses pratinjau/unduh lampiran terotorisasi, termasuk penolakan ketika soft file telah dibersihkan atau berkasnya sudah `DIMUSNAHKAN` |
| 4.27 | **Pembersihan lampiran dokumen non-material oleh Ketua Tim**, termasuk otorisasi ulang per dokumen di server *(diagram baru, Revisi 6)* |

Prasyarat: **heading *Sequence Diagram* di Bab II masih kosong** dan harus diisi.

## 4.2.3 Rancangan Basis Data

> **Catatan penamaan (diperbarui Revisi 6).** Buku ditulis konsisten memakai **istilah tampilan** yang sudah dipakai pengguna sehari-hari (PPSPM, Berkas, Pembersihan File, Komponen, dsb.), bukan identifier internal aplikasi. Identifier internal berbau kearsipan — *schema* `arsip`, tabel `berkas_arsip`, kolom `status_arsip`, tabel `manual_arsip` — hanya boleh muncul di ERD dan kamus data pada subbab ini, sebagai representasi teknis basis data, bukan istilah yang dipakai di narasi Bab I–V. Batasan ini penting karena Bab I menegaskan sistem bukan aplikasi kearsipan resmi; menjaga istilah tampilan konsisten di seluruh buku menghindari kesan sebaliknya. **Peran PPSPM tidak lagi termasuk contoh di sini** — berbeda dari Revisi 5 yang menyebut kode peran `BENDAHARA` sebagai identifier internal, peta kode menunjukkan peran ini sudah bernama `PPSPM` sampai ke basis data (rename penuh, bukan hanya label tampilan), sehingga tidak ada lagi celah istilah tampilan vs internal untuk peran ini — hanya untuk kata "arsip" pada beberapa nama *schema*/tabel yang bertahan.

### Entity Relationship Diagram
- **Gambar 4.28 — ERD menyeluruh**, ditambah lima ERD per kelompok agar terbaca (semula empat kelompok):

| Gambar | Kelompok | Entitas |
|---|---|---|
| 4.29 | Autentikasi & otorisasi | `auth.users` (kini menyimpan kolom avatar), `auth.roles`, `auth.user_roles`, `auth.sessions` |
| 4.30 | Data master | `master_fungsi`, `master_kegiatan`, **`master_komponen`** *(baru, anak `master_kegiatan`)*, `master_jenis_permintaan` (tetap global, bukan anak Komponen), `master_kategori_permintaan`, `master_detail_permintaan`, `master_jenis_dokumen` (peninggalan, tidak lagi diisi alur baru), `master_kelengkapan_dokumen` (kini menyimpan `komponen_id` **dan** `jenis_permintaan_id` sebagai dua kolom independen), `ketua_tim_assignments` |
| 4.31 | Transaksi dokumen | `dokumen_transaksi` (kini dengan `komponen_id`, `nama_dokumen` teks bebas untuk non-material), `log_aktivitas` |
| 4.32 | Pemberkasan | `berkas_arsip`, `berkas_arsip_item`, **`berkas_arsip_activity`** *(baru — timeline level berkas, 8 jenis event)*, `master_klasifikasi_arsip`, `manual_arsip` (kategori manual sudah dihapus, kini `fungsi_id`/`kegiatan_id`/`komponen_id` wajib) beserta lampirannya |
| 4.33 | **Audit & Pengaturan Aplikasi** *(kelompok baru)* | **`audit.audit_log`** — jejak lintas fitur tanpa FK ke `entity_id` agar tahan *hard-delete* (hapus dokumen non-material, pembersihan lampiran); **`app.app_settings`** — *key–value* JSONB untuk tema (3 pilihan) dan identitas aplikasi, diatur Admin |

- Yang wajib dinarasikan karena merupakan keputusan rancangan, bukan sekadar daftar tabel:
  - **`master_komponen`** sebagai cabang baru Fungsi → Kegiatan → Komponen, **independen** dari cabang Jenis Permintaan (tetap tabel global) — keduanya wajib diisi sampai simpul daun untuk dokumen Material, dan hanya bertemu di `master_kelengkapan_dokumen` lewat *exact-match* atas keenam kolomnya; tidak ada *constraint* basis data yang mengaitkan `komponen_id` ke `jenis_permintaan_id` karena keduanya memang independen
  - `is_non_material` dan `nominal_realisasi` — pembedaan dokumen material & non-material (kontribusi penelitian); untuk non-material, `nama_dokumen` (teks bebas) menggantikan pemilihan dari `master_jenis_dokumen`
  - `status`, `current_step`, dan `revision_target` sebagai penyimpan keadaan transisi status (lihat *State Machine Diagram*, 4.2.2.1) — **tidak ada lagi nilai `ARCHIVED`**
  - `is_ketua_tim` yang dibekukan pada dokumen saat pengajuan
  - `log_aktivitas` bersifat *append-only* — dasar jejak audit; **`audit.audit_log`** melengkapinya untuk aksi yang menghapus baris (hard-delete, pembersihan lampiran), dengan `entity_id` sengaja tanpa *foreign key* agar jejaknya tidak ikut hilang
  - `master_klasifikasi_arsip` hierarkis dengan aturan hanya simpul daun yang boleh dipakai; klasifikasi yang berkasnya sudah `CLOSED` tidak boleh dipilih lagi untuk berkas baru
  - `berkas_arsip_item` dengan penanda sumber `WORKFLOW`/`MANUAL` (CHECK "tepat satu referensi", `dokumen_id` XOR `manual_arsip_id`) — inilah yang menyatukan dua pintu masuk pemberkasan
  - **Satu berkas `OPEN` per klasifikasi** ditegakkan lewat *partial unique index* di basis data (`WHERE status_berkas='OPEN'`), bukan hanya di kode — layak disebut sebagai bukti aturan bisnis ditegakkan di lapisan data
  - **Pemisahan metadata dan soft file**, sehingga file dapat dibersihkan tanpa menghilangkan catatan — berlaku untuk berkas (`berkas_arsip`) **dan** dokumen non-material (`dokumen_transaksi.lampiran_dibersihkan_*`), dasar teorinya sudah ada di Bab II (Abbasova, 2020; APTrust, 2026)
- Gunakan satu notasi ERD secara konsisten (Crow's Foot disarankan) dan sebutkan notasinya; definisi komponen sudah tersedia di Bab II (Connolly & Begg, 2005).

### Kamus data
Tabel struktur per entitas (*nama kolom · tipe · panjang · kunci · boleh kosong · keterangan*). Di badan bab cukup lima entitas inti — `dokumen_transaksi`, `master_komponen`, `log_aktivitas`, `berkas_arsip`, `berkas_arsip_item` — sisanya ke Lampiran, agar Bab IV tidak bertambah belasan halaman tabel. `master_komponen` ditambahkan sebagai entitas inti karena merupakan salah satu perubahan rancangan paling signifikan hasil rekonsiliasi kode.

## 4.2.4 Rancangan Antarmuka

**Artefak yang dipakai: *wireframe*, bukan *mockup*.** Pedoman mengizinkan keduanya. *Wireframe* dipilih karena tiga alasan, dan yang kedua paling menentukan:

1. *Wireframe* menyajikan rangka, tata letak, dan komponen tanpa warna dan gaya; *mockup* sudah mendekati tampilan jadi.
2. Aplikasi sudah dibangun. Bila Bab IV memuat *mockup high-fidelity*, gambarnya akan nyaris identik dengan tangkapan layar di Bab V, sehingga pembaca melihat gambar yang sama dua kali dan subbab Implementasi Antarmuka pada Bab V kehilangan fungsinya. Dengan *wireframe*, Bab IV menunjukkan **rancangan** dan Bab V menunjukkan **realisasi** — perjalanan dari satu ke yang lain terlihat.
3. Enam belas *wireframe low/mid-fidelity* jauh lebih cepat disusun daripada jumlah *mockup* yang sama.

Bab III perlu menyebut artefak ini secara eksplisit (lihat daftar perubahan Bab III di bawah).

Dibuka dengan **Gambar 4.34 — Struktur Navigasi Sistem per Peran** (peta menu untuk Pegawai, Ketua Tim, PPK, PPSPM, KSBU, PJ Kinerja, Admin, sesuai `config/navigation.ts`), yang sekaligus memperlihatkan bahwa menu mengikuti peran.

Enam belas wireframe kunci di badan bab, sisanya ke Lampiran:

| No | Halaman | Peran |
|---|---|---|
| 1 | Halaman login | Semua |
| 2 | Kerangka aplikasi dengan *role switcher* pada header | Semua |
| 3 | Dasbor Pegawai | Pegawai |
| 4 | Formulir pengajuan — langkah data kegiatan (badge status Ketua Tim) | Pegawai |
| 5 | Formulir pengajuan — langkah Karakteristik, Komponen, dan rantai permintaan (Material) | Pegawai |
| 6 | Formulir pengajuan — langkah checklist kelengkapan dinamis | Pegawai |
| 7 | Formulir pengajuan — langkah tinjau dan ajukan | Pegawai |
| 8 | Daftar "Dokumen Diajukan" dengan badge status dan filter | Pegawai |
| 9 | Detail dokumen beserta *timeline* riwayat aktivitas | Semua yang berhak |
| 10 | **Pembersihan Dokumen non-material** — daftar dengan badge usia dan modal konfirmasi ketik-persis *(baru)* | Ketua Tim |
| 11 | Kotak masuk PPK dan modal penolakan (catatan wajib) | PPK |
| 12 | Kotak masuk PPSPM | PPSPM |
| 13 | **Monitoring Nominal Realisasi** (material, PPK/PPSPM) dan **Laporan Kinerja** (material & non-material, PJ Kinerja) — satu komponen, drill-down Fungsi → Kegiatan → Komponen, filter periode, cakupan data berbeda per peran | PPK, PPSPM, PJ Kinerja |
| 14 | Pengklasifikasian dokumen (pemilihan cara pembayaran) dan Penambahan Dokumen manual (Fungsi→Kegiatan→Komponen→Nama Dokumen) | KSBU |
| 15 | Berkas terbuka dan modal Tutup Berkas (Nomor SPM, masa simpan) | KSBU |
| 16 | Berkas tertutup (umur berkas, badge jatuh tempo) dan pembersihan file dengan konfirmasi ketik-persis | KSBU |

Narasi tiap wireframe cukup tiga sampai lima kalimat: tujuan halaman, komponen utama, dan **kebutuhan nonfungsional mana yang diwujudkan** (misalnya halaman 6 → KNF-04 *User Error Protection*). Penautan ini yang mencegah subbab antarmuka terasa seperti album gambar.

Wireframe tambahan ke Lampiran: Profil (termasuk unggah/hapus avatar), Pengaturan tema & identitas aplikasi (Admin), Activity Log (dipakai 6 rute per peran), Master Komponen (Admin), Master Klasifikasi hierarkis (KSBU), Laporan Saya dan Laporan Kegiatan.

*Wireframe* dibuat *low/mid-fidelity* dengan satu gaya konsisten dan tanpa warna. Tangkapan layar aplikasi jadi **tidak** dipakai di sini — itu milik Bab V (Implementasi Antarmuka).

---

## Rekapitulasi Beban Bab IV

| Jenis | Badan bab | Lampiran |
|---|---|---|
| Gambar | ± 49 (pemetaan metodologi 1, *activity* berjalan 3, fishbone 1, *use case* 6, arsitektur 1, *activity* usulan 7 [termasuk alur pembersihan dokumen non-material], *State Machine Diagram* 2, *sequence* 6, ERD 6, navigasi 1, wireframe 16 — sebagian wireframe dapat digeser ke lampiran) | Wireframe tambahan |
| Tabel | ± 13 (aktor ×2, permasalahan [8 kode], SMART & indikator, PIECES, daftar modul KF [11 modul], KNF, penelusuran, transisi status dokumen, kamus data inti ×5) | 15 skenario use case, kamus data lengkap |
| Perkiraan tebal | 34–42 halaman | — |

Struktur akhir: **8 subbab** (4.1.1–4.1.3 dan 4.2.1–4.2.4, dengan 4.2.2 kini memuat empat sub-subbab alih-alih tiga karena penambahan alur pembersihan dokumen non-material). Kenaikan beban dibanding Revisi 5 murni berasal dari fitur yang memang ada di kode tapi belum tercatat (Komponen, Pembersihan Dokumen, pengaturan aplikasi, avatar, Activity Log) — bukan dari penambahan kompleksitas struktural; jumlah subbab tingkat atas tidak bertambah.

---

## Prasyarat pada Bab Lain

### A. Bab II — landasan teori yang belum ada

Ketiganya dipakai berat di Bab IV dan harus selesai lebih dulu:

1. **SMART** — heading sudah ada, isinya masih kosong. Dipakai di 4.1.3.1.
2. ***Sequence Diagram*** — heading sudah ada, isinya masih kosong. Dipakai di 4.2.2.4.
3. ***State Machine Diagram*** — belum ada headingnya sama sekali; **bukan** "*Finite State Machine*". Diposisikan sebagai diagram perilaku UML keempat, sejajar dengan Use Case, Activity, dan Sequence Diagram, dengan sumber yang sama (Dennis et al., 2015) — bukan konsep teori otomata. Dipakai di 4.2.2.1 dan 4.2.2.3. **Paling mendesak**, karena diagram ini adalah inti rancangan sistem, dasar klaim *Integrity* dan *Non-repudiation*, sekaligus dasar penyusunan kasus uji *white-box* di Bab V.

**Landasan teori BPMN tidak perlu ditambahkan** karena notasi tersebut tidak jadi dipakai.

### B. Bab III — perubahan yang diperlukan

Lima butir, semuanya kecil, tetapi harus dikerjakan karena Bab III adalah acuan Bab IV:

| # | Bagian | Perubahan |
|---|---|---|
| 1 | *Requirement Definitions* | Tambahkan pemodelan proses bisnis sistem berjalan dengan *activity diagram* **sebelum** analisis fishbone. Teks sekarang langsung menyebut fishbone tanpa menyebut pemodelan prosesnya, padahal pedoman mewajibkan diagram proses pada Subbab 4.1.1. |
| 2 | *Design* | Tambahkan ***State Machine Diagram*** ke daftar alat perancangan proses, sebagai diagram UML keempat sejajar dengan *activity* dan *sequence diagram* (bukan "*Finite State Machine*"/teori otomata). Sekarang hanya menyebut *activity diagram* dan *sequence diagram*. |
| 3 | *Design* | Sebut artefak rancangan antarmuka secara eksplisit: ***wireframe***. Sekarang hanya menyebut "perancangan antarmuka pengguna" tanpa menyebut bentuk artefaknya. |
| 4 | *Design* | Pastikan tidak lagi menyebut *class diagram*. Versi buku sudah benar; versi proposal masih menyebutnya. |
| 5 | *Evaluation* | Paragraf *"Tahap kelima dalam DSRM adalah evaluation…"* **muncul dua kali** dengan isi yang saling tumpang tindih (versi lama dan versi baru). Salah satunya harus dihapus. |

Yang **tidak** perlu diubah: penempatan *use case* pada tahap *Requirement Definitions* sudah benar dan justru selaras dengan penempatannya di Subbab 4.1.3; penyebutan indikator keberhasilan sebagai luaran *Define Objectives of a Solution* juga sudah benar dan kini punya tempat penyajian yang jelas di 4.1.3.1.

### C. Bab I — Sistematika Penulisan

Paragraf Bab IV versi sekarang menyebut *fishbone*, PIECES, proses bisnis usulan, *use case*, ERD, dan antarmuka. Perlu ditambah *activity diagram*, *State Machine Diagram*, dan *sequence diagram*, serta disesuaikan dengan penempatan *use case* di bagian analisis kebutuhan.

---

## Keputusan yang Sudah Diputuskan

### 24 September 2026 — Revisi 7.1: koreksi penulis

1. **Admin tidak dapat berpindah peran** (selalu berperan tunggal). Diagram M1 memakai aktor perantara "Pengguna Operasional"; Admin hanya mewarisi Login, Logout, dan Mengelola Profil dan Kata Sandi.
2. **Ganti kata sandi** ada di M1, kini tampil di nama use case: **UC-03 Mengelola Profil dan Kata Sandi**. Reset kata sandi pengguna lain oleh Admin ada di UC-22.
3. **Ketua Tim tetap aktor generalisasi dari Pegawai**; batasan "hanya dokumen pada kegiatan yang dipimpinnya" ditulis di skenario, tidak di diagram.
4. **Penambahan dokumen oleh KSBU tanpa alur persetujuan dipisah** menjadi use case sendiri (UC-14), karena merupakan menu tersendiri dan salah satu kontribusi penelitian (dua pintu masuk pemberkasan). Total menjadi **24 use case**; nomor M4–M6 bergeser (M4: UC-13–UC-17, M5: UC-18–UC-21, M6: UC-22–UC-24).

### 23 September 2026 — Revisi 7: penyederhanaan use case

1. **Use case dirumuskan pada tingkat tujuan pengguna**, bukan langkah. Jumlah turun dari 61 (11 modul) menjadi **23 (6 modul)**. Penomoran Revisi 6 tidak berlaku lagi; tabel padanan lama sengaja tidak dipertahankan karena tidak ada naskah bab yang sudah memakainya.
2. **«include» dan «extend» tidak dipakai lagi.** "Mencatat riwayat aktivitas" (dulu UC-41) dan "Melihat detail dokumen" (dulu UC-39) dilebur ke skenario; pencatatan log ditulis sebagai pascakondisi dan tetap menjadi dasar KNF-08/KNF-09.
3. **Setujui/tolak, perbaiki/kembalikan, material/non-material** ditulis sebagai alur utama + alur alternatif dalam satu skenario — menjawab usulan penulis agar "Validasi Dokumen" menjadi satu use case.
4. **Laporan Kinerja (PJ Kinerja, material + non-material) dan Monitoring Nominal Realisasi (PPK/PPSPM, material saja) tetap dua use case** karena aktor dan cakupan datanya berbeda (koreksi penulis, 23 September 2026).
5. **Satu diagram per modul** (Gambar 4.6–4.11), tanpa diagram ikhtisar; nomor gambar setelahnya tidak berubah.
6. Berkas `Blueprint Use Case Diagram - Notasi dan Modul M5.md` beserta gambar acuan M4/M5 sebelumnya **sudah usang** — acuan gambar yang berlaku adalah PNG hasil Revisi 7.

### 22 September 2026 — Revisi 6: rekonsiliasi terhadap peta kode

Terminologi FSM dikoreksi (`IN_PPSPM_APPROVAL`; status `ARCHIVED` dan aksi `ARCHIVE`/`SKIP` dihapus), rute `/kasubag` & `/ppspm`, master Komponen sebagai cabang independen dari Jenis Permintaan, fitur Pembersihan Dokumen Non-Material, pengaturan tema & identitas aplikasi, avatar, P-08, subbab 4.2.2.2, *sequence diagram* ke-6, dan kelompok ERD Audit & Pengaturan. Seluruhnya tetap berlaku; hanya daftar use case-nya yang disederhanakan pada Revisi 7.

### 22 September 2026 — Revisi 5

Lingkup fitur dinyatakan sudah tercapai seluruhnya; istilah tampilan dipakai di narasi dan identifier internal hanya di 4.2.3; use case tetap ditempatkan di 4.1.3.

---

## Lampiran A — Daftar Lengkap Use Case

Kolom "Cakupan" adalah ringkasan isi skenario — langkah dan alur alternatif yang **tidak** dipecah menjadi use case sendiri.

**M1 — Akses dan Akun**

| Kode | Use case | Aktor | Cakupan |
|---|---|---|---|
| UC-01 | Login | Semua pengguna | Masuk dengan email dan kata sandi; pembatasan percobaan login |
| UC-02 | Logout | Semua pengguna | Mengakhiri sesi |
| UC-03 | Mengelola Profil dan Kata Sandi | Semua pengguna | Melihat profil, **mengganti kata sandi sendiri**, mengunggah/menghapus foto profil, melihat riwayat aktivitas sendiri |
| UC-04 | Berpindah Peran Aktif | Peran operasional (bukan Admin) | Bagi pengguna yang memegang lebih dari satu peran operasional |

**M2 — Pengajuan Dokumen** (aktor: Pegawai; Ketua Tim mewarisi)

| Kode | Use case | Aktor | Cakupan |
|---|---|---|---|
| UC-05 | Mengajukan Dokumen | Pegawai | Formulir bertahap: fungsi, tanggal, kegiatan, karakteristik; **material** → komponen, jenis/kategori/detail permintaan, nominal realisasi, unggah kelengkapan (checklist dinamis), ajukan ke PPK; **non-material** (alur alternatif) → nama dokumen, unggah lampiran, langsung tersimpan |
| UC-06 | Mengelola Dokumen yang Diajukan | Pegawai | Daftar dokumen beserta status, detail dan *timeline* riwayat, pratinjau/unduh lampiran, pencarian/filter, ubah atau hapus dokumen non-material |
| UC-07 | Merevisi Dokumen yang Ditolak | Pegawai | Membaca catatan penolakan, memperbaiki metadata/lampiran, mengajukan ulang ke PPK |
| UC-08 | Membersihkan Lampiran Dokumen Non-Material | Ketua Tim | **Prakondisi: hanya dokumen non-material pada kegiatan yang dipimpinnya.** Daftar dokumen dengan penanda usia > 90 hari, pilih dokumen, konfirmasi ketik-persis; metadata tetap tersimpan |

**M3 — Persetujuan Berjenjang** (aktor: PPK, PPSPM)

| Kode | Use case | Aktor | Cakupan |
|---|---|---|---|
| UC-09 | Memvalidasi Dokumen | PPK | Kotak masuk validasi, membuka detail dan lampiran; alur utama **setujui** → diteruskan ke PPSPM; alur alternatif **tolak** dengan catatan wajib → kembali ke pegawai |
| UC-10 | Menindaklanjuti Dokumen yang Ditolak PPSPM | PPK | Alur utama **memperbaiki lalu mengirim ulang** langsung ke PPSPM; alur alternatif **mengembalikan** ke pegawai |
| UC-11 | Menyetujui Dokumen | PPSPM | Kotak masuk persetujuan, membuka detail dan lampiran; alur utama **setujui final** → selesai; alur alternatif **tolak** dengan catatan → kembali ke PPK |
| UC-12 | Melihat Dokumen yang Telah Diproses | PPK, PPSPM | Daftar dokumen tervalidasi/tidak valid (PPK) atau ditolak/selesai (PPSPM), detail dan riwayat |

**M4 — Pemberkasan** (aktor: KSBU)

| Kode | Use case | Cakupan |
|---|---|---|
| UC-13 | Mengklasifikasikan Dokumen ke Berkas | Kotak masuk dokumen yang sudah selesai disetujui; memilih cara pembayaran; berkas terbuka dibuat otomatis bila belum ada |
| UC-14 | Menambahkan Dokumen tanpa Alur Persetujuan | Mengisi fungsi → kegiatan → komponen → nama dokumen dan mengunggah lampiran, lalu dokumen **langsung masuk berkas terbuka tanpa melalui PPK/PPSPM** |
| UC-15 | Mengelola Berkas | Melihat berkas terbuka dan tertutup beserta isi, umur, dan penanda jatuh tempo; menutup berkas dengan Nomor SPM dan masa simpan minimal; mengunduh seluruh isi berkas sebagai ZIP |
| UC-16 | Membersihkan File Berkas | Mengusulkan pembersihan (satuan atau seluruh yang jatuh tempo), membatalkan usulan, membersihkan file dengan konfirmasi `BERSIHKAN FILE BERKAS`; metadata, Nomor SPM, dan log tetap ada |
| UC-17 | Mengelola Klasifikasi Dokumen | Menambah, mengubah, menonaktifkan klasifikasi (cara pembayaran) hierarkis |

**M5 — Pelaporan dan Pemantauan**

| Kode | Use case | Aktor | Cakupan |
|---|---|---|---|
| UC-18 | Melihat Laporan Saya | Pegawai | Dokumen milik sendiri dengan filter bertingkat; ekspor ZIP terfilter |
| UC-19 | Melihat Laporan Kegiatan | Ketua Tim | **Hanya kegiatan yang dipimpinnya**; dokumen seluruh anggota; ekspor ZIP terfilter |
| UC-20 | Memantau Nominal Realisasi | PPK, PPSPM | **Dokumen material saja**; drill-down fungsi → kegiatan → komponen → dokumen, filter periode, total nominal |
| UC-21 | Melihat Laporan Kinerja | PJ Kinerja | **Dokumen material dan non-material**; drill-down dan filter periode yang sama |

**M6 — Administrasi Sistem** (aktor: Admin)

| Kode | Use case | Cakupan |
|---|---|---|
| UC-22 | Mengelola Pengguna dan Penugasan Ketua Tim | Tambah/ubah/nonaktifkan pengguna, menetapkan peran, **menugaskan Ketua Tim per kegiatan**, reset kata sandi pengguna lain, melihat detail dan riwayat aktivitas pengguna |
| UC-23 | Mengelola Data Master | Fungsi, kegiatan, komponen, jenis/kategori/detail permintaan, jenis dokumen, kelengkapan dokumen |
| UC-24 | Mengatur Tampilan Aplikasi | Tema dan identitas (sub-judul) aplikasi |
</content>
