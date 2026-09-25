# Catatan Gambar 4.12 — Rancangan Arsitektur Sistem (25 Sept 2026)

Board Miro: "Bab IV - Gambar 4.1 & 4.5 (DSRM/MW, Fishbone)", frame "Gambar 4.12 - Rancangan Arsitektur Sistem" (di bawah fishbone final).

## Dasar metode penggambaran

- **Dennis, Wixom & Roth (Systems Analysis and Design, bab Physical Architecture Layer Design):** fungsi perangkat lunak dibagi empat — data storage, data access logic, application logic, presentation logic — dan arsitektur client-server/n-tier ditentukan oleh penempatan keempatnya. Dipakai sebagai empat kolom header gambar. Konsisten dengan rujukan notasi Bab II.
- **Sommerville (Software Engineering, bab Architectural Design):** pola layered (tiap lapis melayani lapis di atasnya) dan client-server. Dipakai untuk susunan lapisan di dalam server.
- **C4 model, diagram tingkat Container (Simon Brown):** setiap elemen memuat nama, teknologi, dan deskripsi singkat; relasi diberi label; wajib ada keterangan (legend). Dipakai untuk gaya pelabelan.
- Temuan pada jurnal lokal: banyak skripsi/jurnal SI hanya menampilkan ERD/use case tanpa gambar arsitektur (mis. JATI Vol. 8 No. 1, 2024), sehingga gambar ini mengikuti sumber buku teks di atas, bukan meniru skripsi lain yang justru lemah di bagian ini.

---

## 1. Kerangka besar gambar

Gambar dibagi dua **partisi fisik** (kotak besar bergaris putus-putus, sesuai konvensi "sistem eksternal/perangkat digambar sebagai partisi" yang sudah dipakai di *activity diagram* Bab IV):

| Partisi | Isi | Mewakili |
|---|---|---|
| **Perangkat pengguna (PC di LAN kantor)** | Pengguna, peramban, aplikasi klien React | Physical Architecture Layer Design → *client machine* |
| **Server lokal satuan kerja** | Semua logika aplikasi, Drizzle ORM, PostgreSQL, filesystem | *server machine*, satu mesin fisik untuk semua modul (monolit) |

Di atas kedua partisi itu, empat pita judul horizontal menandai **empat fungsi perangkat lunak** menurut Dennis et al.:

`Logika Presentasi` → `Logika Aplikasi` → `Logika Akses Data` → `Penyimpanan Data`

Ini bukan sekadar dekorasi — pita ini yang menjustifikasi kenapa kotak-kotak di bawahnya diurutkan dari kiri ke kanan seperti itu. Presentasi (peramban) ada di perangkat pengguna; tiga fungsi lainnya semua ada di server lokal, konsisten dengan definisi "server-based/thin-client" yang kerangka Bab IV pakai (tidak ada logika bisnis di klien).

---

## 2. Rincian setiap kotak

### 2.1 Kolom Logika Presentasi

| Kotak | Isi teks | Makna |
|---|---|---|
| **Pengguna** (bentuk pil biru, di luar peramban) | "Pengguna" + "Pegawai, PPK, PPSPM, KSBU, PJ Kinerja, Admin" | Aktor manusia — enam peran login sesuai `ROLE_NAMES` (`src/lib/constants/roles.ts`). Ketua Tim **bukan** peran login terpisah — itu penugasan (`master.ketua_tim_assignments`) yang melekat pada akun Pegawai, diatur oleh Admin, tanpa halaman atau state FSM sendiri. Ditaruh terpisah dari peramban karena aktor bukan bagian dari sistem, hanya pemicu |
| **Peramban web modern** (kotak besar biru, membungkus 3 sub-elemen) | Judul + deskripsi "Aplikasi klien React (Client-Side Rendering)" dengan tiga poin: halaman per peran & role switcher; formulir pengajuan bertahap; penyaringan tabel tanpa muat ulang halaman | Ini représentasi *presentation logic* — satu-satunya logika yang boleh ada di perangkat pengguna. Tiga poin dipilih supaya konkret ke kode, bukan generik ("aplikasi berbasis web" saja) |
| 3 kotak putih putus-putus di dalam Peramban | Placeholder logo React, TanStack Router, Tailwind CSS | Tempat tempel logo pustaka *client-side* |

### 2.2 Kolom Logika Aplikasi (semuanya di dalam server)

| Kotak | Isi teks | Makna |
|---|---|---|
| **Pemeriksaan permintaan** | "same-origin (anti-CSRF), sesi, hak akses gabungan peran" | Lapisan paling luar server — persis urutan di 4.2.1 kerangka: *"pemeriksaan sesi & same-origin"*. Frasa "gabungan peran" sengaja dipakai (bukan "peran aktif") karena itu keputusan arsitektur yang sudah difinalkan di 4.1.3.3a4 |
| **Rute API (server route)** | (tanpa sub-teks) | Titik masuk permintaan HTTP: `src/routes/api/*` via `createFileRoute(...).server.handlers`. **Bukan** `createServerFn` — pola itu tidak dipakai di kode (`grep -r "createServerFn" src` nihil). Placeholder logo TanStack Start ditaruh di sebelahnya |
| **Validasi masukan** | "Zod pada mayoritas rute; sebagian rute memvalidasi manual" | Sekitar separuh (~48/96) file `src/routes/api` memakai skema Zod (`src/lib/schemas/*`); sisanya memvalidasi manual di dalam handler (mis. `ketua-tim/index.ts` dengan `isUuid`, `kasubag/manual-arsip/$id.ts`, `users/me.ts`). Jangan menulis "di setiap batas masukan" — itu belum konsisten di kode |
| **Lapisan domain (aturan bisnis)** — kotak besar ungu muda yang membungkus 4 kotak | Judul saja | Ini `src/lib/` — domain/service layer dari tabel arsitektur kode di "Penjelasan Proyek Aplikasi" |
| — sub: **Modul transisi status terpusat** | "validasi transisi status dokumen" | `fsm.ts`, satu-satunya sumber sah aturan transisi status (rujukan tabel transisi 4.2.2.1). Modul ini fungsi murni (`transition()`) — **tidak menulis log**; penulisan `log_aktivitas`/`audit_log` terjadi di route handler dalam transaksi yang sama (mis. `src/routes/api/dokumen.$id.ts`) setelah `fsm.ts` mengonfirmasi transisi valid |
| — sub: **Layanan dan repository** | "pengajuan, pemberkasan, pembersihan" | Modul dengan injeksi *repository* (KNF-12) |
| — sub: **Layanan akses file bertoken** | "pemeriksaan hak baca, token HMAC" | Dasar Gambar 4.26 (akses lampiran terotorisasi) |
| — sub: **Perakitan ekspor** | "ZIP dokumen dan berkas, CSV" | Fitur ekspor UC-15/18/19 |

### 2.3 Kolom Logika Akses Data

| Kotak | Isi teks | Makna |
|---|---|---|
| **Drizzle ORM** | "kueri bertipe dan transaksi" | Satu-satunya jalur ke PostgreSQL. Placeholder logo di bawahnya |
| **Modul penyimpanan file** | "unggah, pindah, hapus aman" | `src/lib/storage/*`, jalur ke filesystem |

### 2.4 Kolom Penyimpanan Data

| Kotak | Isi teks | Makna |
|---|---|---|
| **Basis data PostgreSQL** (kotak besar kuning) | Judul + placeholder logo | Kontainer *data storage* relasional |
| — 6 kotak kecil di dalamnya | `auth`, `master`, `dokumen`, `arsip`, `app`, `audit` | Enam *schema*, sesuai 4.2.1 dan ERD 4.28–4.33 |
| — catatan di bawah 6 schema | "Aturan bisnis penting juga dijaga di lapisan data (unique index dan CHECK)" | Mengantisipasi narasi ERD (4.2.3) soal *unique index* komposit `(klasifikasi_id, tahun_anggaran)` dan CHECK constraint |
| **Penyimpanan file (filesystem lokal)** (kotak besar kuning) | Judul | Kontainer *data storage* non-relasional |
| — **Area pending** | "per pengguna" | Tempat sementara sebelum transaksi berhasil (KNF-11) |
| — **Lokasi tetap** | "lampiran dokumen" | Tujuan akhir setelah commit basis data |
| — catatan di bawah | "File dipindah ke lokasi tetap setelah transaksi basis data berhasil" | Mengutip urutan langkah 7 di 4.2.2.1: transaksi dulu, baru pindah file |

### 2.5 Di luar kedua partisi

| Kotak | Isi teks | Makna |
|---|---|---|
| **Strip abu-abu bawah** | "Di luar batas sistem (tidak terintegrasi): KipApp, SAKIP, SPIDER, Google Drive" | Sesuai pedoman: sistem eksternal digambar sebagai partisi di luar batas sistem, bukan diintegrasikan |

---

## 3. Rincian setiap panah — teks, arah, dan maknanya

Ini bagian yang paling penting untuk Anda rapikan, karena semua panah ini punya alasan spesifik, bukan asal digambar.

| # | Dari → Ke | Label di panah | Warna | Jenis panah | Makna / kenapa begitu |
|---|---|---|---|---|---|
| 1 | Pengguna → Peramban | **"menggunakan"** | Biru | Satu arah, garis lurus | Hubungan aktor-ke-alat, bukan aliran data. Label sengaja generik karena ini bukan protokol jaringan |
| 2 | Peramban → Pemeriksaan permintaan | **"permintaan HTTP (JSON) + cookie sesi, via LAN"** | Hitam | Satu arah, siku (*elbowed*) | Ini arah **permintaan masuk** (request). Menyebut "via LAN" untuk menegaskan KNF-13 (server lokal tanpa internet). Cookie sesi disebut karena itu mekanisme autentikasi (KNF-10) |
| 3 | Rute API/server function → Peramban | **"berkas aplikasi (JS/CSS) dan respons JSON"** | Hitam | Satu arah, siku | Ini arah **balik** (response) — sengaja dibuat sebagai panah **terpisah** dari panah nomor 2, bukan panah dua-arah pada garis yang sama, karena isinya beda: permintaan berisi JSON+cookie, sedangkan balasannya bisa berupa berkas statis (bundel JS/CSS) atau data JSON. Ini juga alasan kenapa titik keluarnya dari kotak "Rute API" (b2), bukan dari kotak "Pemeriksaan permintaan" (b1) — sesuai kode, respons dirakit setelah melewati rute, bukan langsung dari lapisan pemeriksaan |
| 4 | Pemeriksaan permintaan → Rute API/server function | *(tanpa label)* | Ungu | Satu arah, lurus | Aliran internal pipeline permintaan di dalam server: setelah lolos same-origin+sesi+RBAC, permintaan diteruskan ke rute |
| 5 | Rute API/server function → Validasi skema | *(tanpa label)* | Ungu | Satu arah, lurus | Lanjutan pipeline: rute menyerahkan payload ke Zod. Tiga panah ungu ini (4, 5, 6) sengaja tidak diberi label karena urutannya sudah jelas dari susunan vertikal kotaknya — memberi label di sini justru berlebihan (redundan dengan tata letak) |
| 6 | Validasi skema → Lapisan domain | *(tanpa label)* | Ungu | Satu arah, lurus | Payload yang sudah valid diteruskan ke domain/service untuk dieksekusi aturan bisnisnya |
| 6b *(opsional, disarankan)* | Rute API → Drizzle ORM | **"kueri langsung (CRUD sederhana)"** | Ungu putus-putus | Satu arah, lurus, melewati Lapisan domain | **Realitas kode:** 59 dari 96 file di `src/routes/api` memanggil Drizzle langsung tanpa melalui `src/lib` (mis. `ketua-tim/index.ts`). Pola Rute→Validasi→Domain→ORM konsisten hanya pada alur kompleks (submit dokumen, pemberkasan, pembersihan). Tambahkan panah tipis ini (atau satu kalimat di narasi 4.2.1) supaya gambar tidak diklaim lebih berlapis daripada kode sebenarnya |
| 7 | Layanan akses file bertoken → Peramban | **"URL sementara bertanda tangan (pratinjau/unduh lampiran)"** | Hitam | Satu arah, siku | Server menerbitkan URL bertanda tangan HMAC (`file-access-token.ts`) untuk lampiran, sesuai Gambar 4.26. **Koreksi:** pemanggilan URL itu **tetap lewat rute API biasa** (`src/routes/api/files/access.ts`), yang memverifikasi ulang sesi (`getLocalServerSession`) dan kepemilikan path (`storagePathBelongsToUser`) di atas validasi token HMAC — jadi ini pertahanan berlapis (token + sesi), bukan jalur yang melewati pemeriksaan sesi. Tetap digambar sebagai panah tersendiri dari sub-kotak `dToken` karena secara konsep ini event penerbitan URL, terpisah dari siklus request/response umum (panah 2/3) |
| 8 | Lapisan domain → Drizzle ORM | **"kueri dan transaksi"** | Teal (hijau kebiruan) | Satu arah, siku | Domain memanggil ORM untuk membaca/menulis data terstruktur |
| 9 | Lapisan domain → Modul penyimpanan file | **"operasi file"** | Teal | Satu arah, siku | Domain memanggil modul storage untuk operasi berkas (unggah/pindah/hapus). Warna sama dengan panah 8 karena keduanya sama-sama "domain memanggil akses data", cuma tujuannya beda |
| 10 | Drizzle ORM ↔ PostgreSQL | **"SQL"** | Emas/kuning tua | **Dua arah** (`data-arrow="both"`), siku | Sengaja dua arah, karena kueri SQL memang bolak-balik: ORM mengirim perintah SQL, basis data mengembalikan hasil (baris data atau status transaksi). Ini beda dari panah 2/3 yang saya pisah, karena pada level ORM↔DB granularitasnya terlalu halus untuk dipisah jadi dua panah — satu panah dua arah lebih jujur menggambarkan sifat request-response protokol SQL |
| 11 | Modul penyimpanan file ↔ Filesystem lokal | **"baca/tulis"** | Emas/kuning tua | Dua arah, siku | Sama alasannya dengan panah 10: operasi file (tulis saat unggah, baca saat unduh) terjadi dua arah pada modul yang sama |
| 12 | Peramban → Di luar batas sistem | **"hasil ekspor diunggah manual"** | Abu-abu | Satu arah, putus-putus | Ini **bukan** integrasi otomatis — garis putus-putus dan warna abu (beda dari semua panah lain yang solid) menandai bahwa ini aktivitas **manual manusia** (pegawai mengunduh ZIP/CSV lalu mengunggahnya sendiri ke KipApp/SAKIP/SPIDER/Drive), bukan panggilan API. Ini konsisten dengan catatan kerangka bahwa sistem **tidak** bertukar data otomatis dengan sistem lain (alasan *Compatibility* tidak dipakai di KNF) |

### Pola pewarnaan panah (supaya Anda bisa cek konsistensi saat merapikan)

- **Biru** — interaksi aktor manusia dengan antarmuka (hanya panah 1)
- **Hitam** — lalu lintas antara peramban dan server (panah 2, 3, 7) — dipilih netral karena ini "batas jaringan" yang paling penting secara keamanan (KNF-06, KNF-10)
- **Ungu** — pipeline internal di dalam lapisan aplikasi (panah 4, 5, 6), warna sama dengan warna kotak-kotak di kolom Logika Aplikasi
- **Teal** — panggilan dari domain ke lapisan akses data (panah 8, 9), warna sama dengan kotak-kotak kolom Logika Akses Data
- **Emas** — pertukaran dengan penyimpanan data (panah 10, 11), warna sama dengan kotak-kotak kolom Penyimpanan Data
- **Abu-abu putus-putus** — aktivitas di luar sistem/manual (panah 12)

Jadi aturan sebenarnya: **warna panah = warna kolom tujuan (atau kolom asal untuk arah balik)**. Ini prinsip C4 model — "match a connector's color to its branch" — supaya mata bisa mengikuti satu kolom tanpa harus baca label.

---

## 4. Kenapa ada tiga "pasang" panah bolak-balik dengan gaya berbeda

Ini poin yang paling gampang bikin bingung, jadi saya perjelas:

1. **Panah 2 dan 3** (peramban ↔ server, lewat b1/b2): digambar sebagai **dua panah satu-arah terpisah** dengan label berbeda, karena isi permintaan dan isi balasan benar-benar berbeda jenis data.
2. **Panah 7** (token akses ↔ peramban): juga satu-arah, karena ini cuma satu event (server mengeluarkan URL sementara). Pemanggilan URL itu sendiri oleh klien tidak digambar sebagai panah terpisah — dianggap sudah termasuk dalam mekanisme umum panah 2 (permintaan HTTP), supaya gambar tidak terlalu padat.
3. **Panah 10 dan 11** (ORM↔DB, storage↔filesystem): digambar **dua-arah dalam satu panah**, karena di level ini keduanya memang simetris (protokol tanya-jawab yang setiap saat terjadi dua arah, tidak ada perbedaan "bentuk data" yang berarti untuk dipisah).

Kalau menurut Anda ini tidak konsisten, ada dua pilihan saat merapikan:
- **Opsi A (lebih detail):** pecah panah 10 dan 11 juga jadi dua panah satu-arah (mis. "kueri SQL" turun, "baris hasil" naik) — konsisten penuh dengan gaya panah 2/3.
- **Opsi B (lebih ringkas, dan ini yang saya pakai sekarang):** biarkan panah 10/11 dua-arah karena levelnya sudah dianggap "protokol", sementara panah 2/3 dipisah karena levelnya masih "arsitektur aplikasi" (beda jenis muatan). Ini yang biasa dilihat pada diagram C4 container: panah antarcontainer sering satu garis berlabel "reads/writes from", sementara panah aplikasi-ke-server API biasanya ditulis lebih rinci.

Saya sarankan pilih **Opsi B** dan sebut alasan ini satu kalimat di narasi 4.2.1 (skala abstraksi diagram tidak seragam by design), supaya penguji tidak menganggapnya kelalaian.

---

## 5. Area yang berpotensi masih tumpang tindih (perlu Anda rapikan manual di Miro)

Saat gambar dibuat, alat memberi peringatan bahwa beberapa label teks otomatis (label pada beberapa kotak dan panah) berukuran berbeda dari yang saya perkirakan, sehingga posisi persisnya bisa meleset dan saling menimpa. Titik-titik yang paling rawan untuk dicek dan digeser manual:

1. **Sudut kiri-atas server, sekitar kotak "Pemeriksaan permintaan" dan "Rute API"** — dua label panjang (panah 2 dan 3) sama-sama menempel di sisi kanan kotak Peramban dengan jarak vertikal yang mepet (±140px). Kalau teksnya terlihat saling menutupi, geser salah satu titik tengah label ke atas/bawah.
2. **Panah 7 (token akses) yang melengkung dari `dToken` kembali ke peramban** — jalurnya memotong area lapisan domain dan bisa menimpa kotak "Modul transisi status terpusat" atau kotak Peramban itu sendiri. Ini panah dengan rute terpanjang di gambar, jadi paling rawan.
3. **Label panjang pada panah 2 dan 3** ("permintaan HTTP (JSON) + cookie sesi, via LAN" dan "berkas aplikasi (JS/CSS) dan respons JSON") — ini teks terpanjang di seluruh gambar, cek apakah melebar sampai menabrak kotak Pengguna di atasnya.
4. **Placeholder logo TanStack Start dan Zod** yang saya taruh di celah antara kolom Logika Aplikasi dan Logika Akses Data — pastikan tidak kena lintasan panah 8/9 (bDomain → c1/c2) yang lewat di celah yang sama.

Cara paling cepat merapikannya di Miro: klik satu per satu panah yang labelnya terlihat tabrakan, lalu geser titik tengah labelnya (bukan geser kotaknya) ke ruang kosong terdekat di jalur yang sama.

---

## 6. Isi gambar (ringkas)

Kolom: Logika Presentasi | Logika Aplikasi | Logika Akses Data | Penyimpanan Data.

- Perangkat pengguna (LAN): Pengguna 7 peran → Peramban, aplikasi klien React CSR.
- Server lokal (monolit TanStack Start): pemeriksaan permintaan (same-origin, sesi, gabungan peran) → rute API/server function → validasi skema → lapisan domain (modul transisi status, layanan & repository, layanan akses file bertoken HMAC, perakitan ekspor).
- Akses data: Drizzle ORM; modul penyimpanan file.
- Penyimpanan: PostgreSQL (6 schema) dan filesystem lokal (area pending, lokasi tetap).
- Di luar batas sistem: KipApp, SAKIP, SPIDER, Google Drive (unggah manual hasil ekspor).
- Slot logo (kotak putih putus-putus) untuk ditempel Daniel: Node.js, React, TanStack Router, Tailwind CSS, TanStack Start, Zod, Drizzle ORM, PostgreSQL.

## Perlu dikonfirmasi

- ~~Runtime server benar Node.js~~ — **terkonfirmasi**: Nitro + skrip `start` = `node .output/server/index.mjs`.
- Apakah Opsi A atau Opsi B (lihat bagian 4) yang dipakai untuk panah ORM↔DB dan storage↔filesystem.
- Apakah panah 6b (Rute API → Drizzle ORM langsung) digambar eksplisit, atau cukup satu kalimat di narasi 4.2.1 yang menyebut bahwa CRUD sederhana melewati lapisan domain.
- Panah 3 (respons balik) sebaiknya menyertakan bahwa berkas statis JS/CSS dilayani Nitro sebagai static file server, bukan oleh kotak "Rute API" — pertimbangkan memisah label atau titik keluar panahnya.

## Riwayat verifikasi terhadap kode

Verifikasi 25 Sept 2026 terhadap `src/` menemukan dan sudah diperbaiki di dokumen ini:
1. Jumlah peran login: 6, bukan 7 (Ketua Tim adalah penugasan, bukan peran login).
2. `createServerFn` tidak dipakai — semua endpoint via `createFileRoute(...).server.handlers`.
3. `fsm.ts` tidak menulis log; hanya memvalidasi transisi. Log ditulis di route handler.
4. Panah token akses file (panah 7) tetap lewat rute API dan verifikasi sesi ulang, bukan jalur pintas.
5. Pola Rute→Validasi→Domain→ORM tidak konsisten di seluruh endpoint (~61% rute memanggil ORM langsung).
6. Validasi Zod tidak ada "di setiap batas masukan" — sekitar separuh rute masih memvalidasi manual.
