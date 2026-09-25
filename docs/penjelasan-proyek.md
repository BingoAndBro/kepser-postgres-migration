# Penjelasan Proyek: Repositori Dokumen Kegiatan: Penyimpanan, Persetujuan, dan Pemberkasan

> Dokumen ini menjelaskan proyek dari sisi **bisnis lebih dulu**, baru turun ke solusi teknis.
> Alurnya: *Permasalahan Bisnis Utama* → *dipecah menjadi masalah spesifik* → *tiap masalah spesifik dijelaskan solusinya, use case-nya, siapa penggunanya, dan kaitannya dengan masalah lain*.
>
> **Pembanding permasalahan = proses kerja manual yang berjalan di kantor SEKARANG** (berbasis kertas, tanpa sistem informasi apa pun). Bukan dibandingkan dengan versi/kode aplikasi sebelumnya. Hal-hal yang bersifat teknis/kode (tumpukan teknologi, status branch, riwayat implementasi) dipindah ke **Lampiran** dan bukan bagian dari permasalahan bisnis.
>
> Sumber acuan: `AGENTS.md` (konstitusi proyek), `arsip/docs-2026-09-25:docs/specs/*`, `docs/ringkasan_arsitektur.md`, `docs/src-architecture-summary.md`.

---

## 1. Gambaran Singkat

Aplikasi ini adalah **aplikasi internal mandiri** (tidak terhubung / tidak berintegrasi dengan aplikasi lain) milik satuan kerja di lingkungan **BPS (Badan Pusat Statistik)**, dengan tiga lapisan yang menyatu:

1. **Repositori dokumen kegiatan** — tempat pegawai menyimpan *semua* dokumen kegiatan (bernilai uang / *material* maupun tidak / *non-material*) secara terpusat dan bisa difilter, supaya tidak tercecer di PC masing-masing.
2. **Alur kerja persetujuan berjenjang** — untuk dokumen yang butuh pengesahan (umumnya material), dirutekan **Pegawai → PPK → PPSPM** lengkap dengan penolakan, revisi, dan pengembalian. Intinya *mesin status* (FSM).
3. **Pemberkasan & unduh** — dokumen selesai dikelompokkan ke dalam **berkas** (1 berkas = 1 Nomor SPM). Aplikasi menyediakan **ekspor/unduh** (per berkas, atau banyak dokumen terfilter) sebagai satu file zip yang rapi. Karena disk terbatas, soft file berkas lama bisa dibersihkan (metadata tetap disimpan).

> **Aplikasi ini tidak mengirim / menerima data dari aplikasi manapun.** Yang dilakukan pengguna dengan hasil unduhan — misalnya pegawai mengunggah laporan bulanan ke **kipApp**, atau Kepala Sub Bagian Umum mengunggah berkas tahunan ke aplikasi arsip nasional — dilakukan **manual di luar sistem ini**. Aplikasi ini hanya bertugas menyimpan dokumen dengan rapi dan menghasilkan file unduhan.

### Kondisi kerja di kantor SEKARANG (titik awal permasalahan)

Seluruh proses pertanggungjawaban dokumen di satuan kerja ini **masih dijalankan konvensional — manual dan berbasis kertas. Belum ada sistem informasi apa pun yang membantu.** Praktik sehari-hari kira-kira begini:

- Pegawai menyusun berkas fisik (map/bundel kertas), lalu **mengantarnya langsung** ke meja PPK; menyusul ke meja PPSPM setelah PPK setuju.
- Status berkas hanya bisa diketahui dengan **bertanya langsung / menyusuri meja**. Berkas bisa "mengendap" di satu meja tanpa ada yang tahu.
- Persetujuan berupa **paraf/tanda tangan basah**; penolakan biasanya **lisan atau coretan** di berkas, kadang tanpa alasan tertulis.
- Syarat kelengkapan tiap jenis kegiatan **"ada di kepala" staf senior**; nama kegiatan/jenis ditulis bebas sehingga tidak seragam.
- Rekap jumlah dokumen selesai & total realisasi anggaran **dihitung manual** dari buku/berkas, dikompilasi dari banyak orang, ke Excel.
- Dokumen digital pendukung **tercecer di PC/flashdisk masing-masing**; berkas fisik menumpuk di lemari.
- Tiap akhir tahun, untuk keperluan arsip, berkas fisik **di-scan ulang satu per satu** lalu diunggah manual ke aplikasi arsip nasional.

**Aplikasi ini adalah upaya pertama menggantikan cara kerja itu.** Tiap permasalahan bisnis di bawah adalah salah satu kelemahan proses manual di atas, dan tiap solusi adalah fitur aplikasi yang menggantikannya.

**North Star proyek:**

> Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh pihak yang berwenang.

---

## 2. Siapa Saja Penggunanya (Aktor)

| Aktor | Nama internal (kode) | Tanggung jawab utama |
|---|---|---|
| **Pegawai** | `PEGAWAI` | Mengajukan dokumen pertanggungjawaban, mengunggah lampiran kelengkapan, merevisi jika ditolak, melihat laporan miliknya. |
| **Ketua Tim** | *capability*, bukan role — dari tabel `ketua_tim_assignments` | Pegawai yang ditunjuk sebagai penanggung jawab kegiatan tertentu; dokumennya masuk "Laporan Kegiatan" dan terlihat oleh anggota tim. |
| **PPK** (Pejabat Pembuat Komitmen) | `PPK` | Validasi tahap pertama: menerima/menolak dokumen, memberi catatan revisi, meneruskan ke PPSPM, menangani pengembalian dari PPSPM. |
| **PPSPM** (Pejabat Penandatangan Surat Perintah Membayar) | `PPSPM` *(nilai kode tetap `PPSPM`, label tampilan `PPSPM`)* | Persetujuan tahap akhir operasional: menyetujui/menolak, sehingga dokumen menjadi `COMPLETED`. |
| **Kepala Sub Bagian Umum** | `KEPALA_SUB_BAGIAN_UMUM` *(identifier & namespace route `/arsiparis` dipertahankan untuk kompatibilitas)* | Mengelompokkan dokumen ke dalam **berkas** (per cara pembayaran), menutup berkas + Nomor SPM, membersihkan soft file berkas lama untuk menghemat penyimpanan, master klasifikasi dokumen. **Bukan** kearsipan resmi — lihat PB-6. |
| **Penanggung Jawab Kinerja** | `PENANGGUNG_JAWAB_KINERJA` | Hanya satu menu: **Laporan Kinerja** (metadata-only) untuk dokumen berstatus final. |
| **Admin** | `ADMIN` | Kelola user & role, kelola seluruh data master. Akun terpisah/*dedicated* — tidak boleh digabung ke role operasional. |

Catatan penting:
- Satu user bisa punya **lebih dari satu role non-admin** (mis. `PEGAWAI` + `PPK`) dan berpindah peran lewat *role switcher* di header.
- `ADMIN` **tidak** otomatis mewarisi hak role operasional.

---

## 3. Peta Permasalahan Bisnis (Ringkasan)

| # | Permasalahan Bisnis Utama | Proses manual sekarang → kelemahannya |
|---|---|---|
| **PB-1** | Alur & status dokumen tidak transparan | Berkas kertas diantar dari meja ke meja; pemiliknya tidak tahu berkasnya di tangan siapa, kurang apa, atau harus berbuat apa. |
| **PB-2** | Persetujuan berjenjang lambat & tidak terstandar | PPK lalu PPSPM memaraf tumpukan berkas fisik di meja masing-masing; tidak ada antrian jelas, penolakan sering lisan. |
| **PB-3** | Jejak audit & akuntabilitas lemah | Bukti hanya paraf/tanda tangan di kertas — mudah hilang, sulit ditelusuri, tidak tercatat kapan & alasannya. |
| **PB-4** | Data referensi & kelengkapan tidak seragam | Nama fungsi/kegiatan/jenis ditulis bebas; syarat kelengkapan tiap kegiatan hanya diingat staf senior. |
| **PB-5** | Realisasi anggaran & pembedaan dokumen tidak tertib | Dokumen bernilai uang & administratif diperlakukan sama; nominal realisasi dicatat manual, campur aduk. |
| **PB-6** | Dokumen selesai tercecer & penyimpanan terbatas | Berkas fisik menumpuk di lemari, file digital tercecer di PC masing-masing; tiap akhir tahun di-scan ulang satu per satu. |
| **PB-7** | Pelaporan kinerja & rekap realisasi manual | Rekap jumlah dokumen & total realisasi per fungsi/kegiatan dihitung manual, dikompilasi dari banyak orang ke Excel. |
| **PB-8** | Kontrol akses & akuntabilitas identitas lemah | Siapa pun yang memegang map bisa membacanya; paraf bisa dipalsukan; tidak ada catatan siapa mengakses/mengubah apa. |

> Hal teknis & status pengembangan (tumpukan teknologi, keamanan tingkat implementasi, deployment, status branch UI) ada di **Lampiran** — bukan permasalahan bisnis.

---

# PB-1 — Alur & Status Dokumen Tidak Transparan

**Proses sekarang.** Pegawai menyerahkan berkas pertanggungjawaban (map kertas) ke meja PPK, lalu tidak punya cara tahu: apakah sudah diterima, sedang ditinjau, ditolak, atau sudah diteruskan ke PPSPM. Informasi hanya didapat dengan bertanya langsung atau menyusuri meja. Akibatnya: berkas "mengendap" tanpa ketahuan, deadline terlewat, dan banyak waktu habis untuk saling menanyakan status.

## PB-1.1 — Pegawai tidak tahu dokumennya ada di tahap mana

- **Solusi yang dipakai.** Setiap dokumen punya kolom **`status`** dengan nilai baku (`DRAFT`, `IN_PPK_VALIDATION`, `IN_PPSPM_APPROVAL`, `NEED_REVISION`, `COMPLETED`, `TERSIMPAN`, `ARCHIVED`) plus **`current_step`** (`PPK` / `PPSPM` / `null`). Transisi status hanya boleh lewat **FSM terpusat** (`src/lib/fsm.ts`) sehingga status selalu konsisten di semua endpoint. Halaman **"Dokumen Diajukan"** (`/pegawai/dokumen`) menampilkan daftar dokumen milik user beserta badge status, dan halaman detail (`/pegawai/dokumen/$id`) menampilkan status + timeline.
- **Use case.** Pegawai membuka "Dokumen Diajukan" → melihat "RL-012 SAKERNAS — *Sedang Divalidasi PPK*" tanpa perlu menelepon siapa pun.
- **Pengguna.** Pegawai (pemilik dokumen); PPK/PPSPM/Kepala Sub Bagian Umum melihat status yang sama dari sudut pandang inbox mereka.
- **Keterkaitan.** Status inilah yang memberi makna pada **inbox per-role di PB-2**, pada **audit trail di PB-3**, dan menjadi syarat masuk **pemberkasan di PB-6** (`COMPLETED` → bisa diklasifikasikan).

## PB-1.2 — Tidak jelas "role" dokumen: milik pribadi atau atas nama kegiatan

- **Solusi yang dipakai.** Konsep **Ketua Tim** sebagai *capability* per kegiatan (tabel `ketua_tim_assignments`, unik per `kegiatan_id` → satu kegiatan hanya punya satu ketua tim; satu user bisa jadi ketua tim di banyak kegiatan). Saat mengajukan dokumen, sistem otomatis mendeteksi apakah user adalah ketua tim di kegiatan terpilih, lalu menampilkan **badge info** ("Anda Ketua Tim di kegiatan ini" / "Anda Anggota") dan menyimpan flag `is_ketua_tim` di dokumen.
- **Use case.** Budi memilih kegiatan "SAKERNAS 2026" di form ajukan → badge "Anda Ketua Tim" muncul → dokumennya nanti tampil di **Laporan Kegiatan** dan bisa dilihat anggota tim SAKERNAS. Jika Budi memilih kegiatan lain di mana ia hanya anggota, dokumennya masuk **Laporan Saya** saja.
- **Pengguna.** Pegawai/Ketua Tim (di form ajukan & laporan); Admin (yang meng-assign ketua tim lewat Master User).
- **Keterkaitan.** Menentukan **kelengkapan dokumen mana yang wajib** (PB-4.2, karena kelengkapan dibedakan ketua tim vs anggota) dan **laporan mana yang tampil** (PB-7). Assignment-nya dikelola di **PB-4/PB-8** (Master User).

## PB-1.3 — Pegawai tidak tahu "apa yang kurang" dari berkasnya

- **Solusi yang dipakai.** **Form ajukan dokumen multi-step** dengan **checklist kelengkapan dinamis** (`KelengkapanChecklist.tsx`) yang di-*generate* dari `master_kelengkapan_dokumen` sesuai kegiatan + status ketua tim. Item wajib harus terisi (ada file terunggah) sebelum tombol "Ajukan" aktif. Ada **Review & Submit** sebagai langkah terakhir, dan **guard "unsaved changes"** agar draft tidak hilang tak sengaja.
- **Use case.** Pegawai melihat 5 item kelengkapan, 3 wajib. Sistem tidak mengizinkan submit sampai 3 file wajib terunggah — kesalahan "berkas tidak lengkap" dicegah di hulu, bukan ditemukan PPK di hilir.
- **Pengguna.** Pegawai.
- **Keterkaitan.** Mengurangi beban **penolakan di PB-2/PB-3**; bergantung penuh pada **data master kelengkapan (PB-4.2)**.

---

# PB-2 — Persetujuan Berjenjang yang Lambat & Tidak Terstandar

**Proses sekarang.** Dokumen pertanggungjawaban wajib divalidasi **PPK** dulu, lalu disetujui **PPSPM**. Manual: tiap pejabat menyortir sendiri tumpukan berkas fisik di mejanya, tidak ada antrian yang jelas (yang paling atas belum tentu paling lama), penolakan sering lisan tanpa catatan tertulis, dan tidak ada bukti kapan sesuatu disetujui.

## PB-2.1 — Tidak ada "kotak masuk" kerja per pejabat

- **Solusi yang dipakai.** **Inbox per-role berbasis status**:
  - PPK: `/ppk/inbox` menampilkan dokumen `IN_PPK_VALIDATION`.
  - PPSPM: `/ppspm/inbox` menampilkan dokumen `IN_PPSPM_APPROVAL`.
  - Kepala Sub Bagian Umum: `/arsiparis/inbox` menampilkan dokumen `COMPLETED` yang belum diklasifikasikan.
  Masing-masing API (`/api/ppk/inbox`, dst.) memfilter berdasarkan status **dan** mengecek role di server.
- **Use case.** PPK login → langsung melihat "12 dokumen menunggu validasi" — tidak perlu bertanya berkas mana yang jadi tanggung jawabnya hari ini (langsung menjawab *North Star*).
- **Pengguna.** PPK, PPSPM, Kepala Sub Bagian Umum.
- **Keterkaitan.** Isi inbox sepenuhnya ditentukan **status dokumen (PB-1.1)**; setiap aksi di inbox menulis **audit log (PB-3)**.

## PB-2.2 — Alur persetujuan tidak baku & rawan "loncat tahap"

- **Solusi yang dipakai.** **FSM tunggal** (`src/lib/fsm.ts`) sebagai satu-satunya sumber sah transisi. Alur material:

  ```
  DRAFT ──▶ IN_PPK_VALIDATION ──▶ IN_PPSPM_APPROVAL ──▶ COMPLETED ──▶ ARCHIVED
                 │                        │
                 ▼ (PPK reject)           ▼ (PPSPM reject)
          NEED_REVISION             NEED_REVISION
          (revision_target=USER)    (revision_target=PPK)
  ```

  FSM juga memvalidasi **siapa aktor yang berhak** melakukan tiap aksi (`SUBMIT`, `APPROVE`, `REJECT`, `RESUBMIT`, `RESUBMIT_PPK`, `KEMBALIKAN`, `ARCHIVE`, `SKIP`). Tidak ada endpoint yang boleh meng-`UPDATE` status secara manual di luar FSM.
- **Use case.** PPSPM tidak bisa menyetujui dokumen yang belum lewat PPK, karena dokumen itu tidak akan pernah berstatus `IN_PPSPM_APPROVAL`.
- **Pengguna.** Semua aktor workflow; developer (sebagai invariant arsitektur — "FSM is the legal source for workflow transitions").
- **Keterkaitan.** Menjadi fondasi **PB-1.1** (arti status) dan **PB-6** (`COMPLETED` sebagai pintu masuk arsip). Perbedaan Material vs Non-Material dijelaskan di **PB-5.1**.

## PB-2.3 — Penolakan tanpa alasan yang terekam

- **Solusi yang dipakai.** Endpoint `reject` (PPK & PPSPM) **mewajibkan catatan** (`revision_notes`), divalidasi Zod. Penolakan mengubah status ke `NEED_REVISION` dengan **`revision_target`** yang menandai siapa yang harus memperbaiki:
  - PPK reject → `revision_target = 'USER'` (pegawai yang perbaiki).
  - PPSPM reject → `revision_target = 'PPK'` (PPK yang perbaiki lalu kirim ulang).
- **Use case.** PPK menolak dengan catatan "Nominal di kuitansi tidak sama dengan RAB" → pegawai melihat catatan itu persis di halaman revisinya.
- **Pengguna.** PPK & PPSPM (menolak); Pegawai & PPK (menerima & menindaklanjuti).
- **Keterkaitan.** Catatan penolakan adalah bagian dari **audit trail (PB-3)** dan memicu **alur revisi (PB-2.4)**.

## PB-2.4 — Perbaikan/kirim ulang dokumen berbelit

- **Solusi yang dipakai.** Dua jalur revisi eksplisit:
  - **Pegawai**: halaman `/pegawai/dokumen/$id/revisi` + `AttachmentEditor.tsx` untuk mengganti lampiran, lalu `RESUBMIT` → dokumen kembali ke `IN_PPK_VALIDATION`.
  - **PPK**: halaman `/ppk/dokumen/$id/resubmit` untuk memperbaiki setelah ditolak PPSPM, lalu `RESUBMIT_PPK` → dokumen **langsung** ke `IN_PPSPM_APPROVAL` (tidak mengulang validasi PPK).
  - Aksi khusus **`KEMBALIKAN`** (`/api/ppk/kembalikan/$id`) untuk kasus PPK perlu mengembalikan ke pegawai, dibedakan dari `reject` biasa.
- **Use case.** Dokumen ditolak PPSPM karena salah kode akun → PPK betulkan sendiri → kirim ulang tanpa membebani pegawai dan tanpa mengulang antrian PPK.
- **Pengguna.** Pegawai, PPK.
- **Keterkaitan.** Bergantung pada `revision_target` dari **PB-2.3**; setiap resubmit tercatat di **PB-3**; daftar "Revisi Dokumen" muncul di menu berkat **status (PB-1.1)**.

## PB-2.5 — Daftar hasil kerja (tervalidasi/ditolak/selesai) tidak terpelihara

- **Solusi yang dipakai.** Halaman turunan per-role: PPK punya `/ppk/tervalidasi` & `/ppk/ditolak` & `/ppk/revisi`; PPSPM punya `/ppspm/ditolak` & `/ppspm/selesai`. Semua adalah *view* berbasis query status + filter/sort.
- **Use case.** PPSPM ingin melihat semua dokumen yang sudah ia selesaikan bulan ini → buka `/ppspm/selesai`.
- **Pengguna.** PPK, PPSPM.
- **Keterkaitan.** Sumber datanya sama dengan **PB-7** (pelaporan), hanya beda sudut pandang & filter.

---

# PB-3 — Jejak Audit & Akuntabilitas Lemah

**Proses sekarang.** Dokumen keuangan negara harus bisa diaudit: siapa mengajukan, memvalidasi, menyetujui, kapan, dan atas alasan apa. Manual: bukti hanya paraf/tanda tangan di kertas — mudah hilang, tidak bertanggal jelas, alasan penolakan sering tidak tertulis, dan tidak bisa ditelusuri lintas dokumen.

## PB-3.1 — Tidak ada riwayat aktivitas per dokumen

- **Solusi yang dipakai.** Tabel **`log_aktivitas`** yang bersifat **append-only berdasarkan kontrak** (invariant: "Audit trail is sacred" — tidak boleh `UPDATE`/`DELETE`). Setiap transisi FSM (submit, approve, reject, resubmit, archive, dst.) menuliskan satu baris log berisi aksi, aktor, waktu, `stepUrutan`, dan catatan bila ada. Ditampilkan sebagai **timeline** (`ActivityLog.tsx`) di halaman detail dokumen untuk semua role yang berhak.
- **Use case.** Saat pemeriksaan, Kepala Sub Bagian Umum membuka detail dokumen dan menunjukkan urutan lengkap: *diajukan Budi 01 Mei → divalidasi PPK 02 Mei → ditolak PPSPM 03 Mei (catatan: …) → diperbaiki PPK → disetujui 04 Mei*.
- **Pengguna.** Semua aktor (membaca); sistem (menulis otomatis via FSM).
- **Keterkaitan.** Mendapat "kejadian" dari **PB-2** dan **PB-6**; pengecualian sempit hanya untuk penghapusan dokumen Non-Material `TERSIMPAN` (**PB-5.1**) yang boleh men-*cascade* lognya.

## PB-3.2 — Tidak ada pandangan aktivitas per pengguna

- **Solusi yang dipakai.** Halaman **Detail User** (Admin) menampilkan **riwayat aktivitas** user (login, submit dokumen, pindah role, dsb.) dengan paginasi — dirancang di brainstorm Ketua Tim / SPEC 06.
- **Use case.** Admin mengevaluasi aktivitas seorang PPK sebelum mencabut haknya.
- **Pengguna.** Admin.
- **Keterkaitan.** Memakai data yang sama dengan **PB-3.1**, dikelompokkan per user; bagian dari **User Management (PB-8.2)**.

---

# PB-4 — Data Referensi & Kelengkapan Berkas Tidak Seragam

**Proses sekarang.** Nama "fungsi", "kegiatan", atau "jenis permintaan" ditulis bebas oleh masing-masing orang dengan gaya berbeda, sehingga data tidak bisa direkap dan laporan tidak bisa dipercaya. Syarat kelengkapan berkas untuk tiap jenis kegiatan hanya "ada di kepala" staf senior — pegawai baru sering ketinggalan satu-dua berkas dan berkasnya ditolak di tengah jalan.

## PB-4.1 — Entitas referensi (fungsi, kegiatan, jenis/kategori/detail permintaan, jenis dokumen) tidak terpusat

- **Solusi yang dipakai.** Modul **Master Data** (SPEC 02) dengan tabel terkelola dan halaman admin CRUD:
  - `master_fungsi` (6 fungsi BPS), `master_kegiatan` (terfilter per fungsi),
  - `master_jenis_permintaan` → `master_kategori_permintaan` → `master_detail_permintaan` (rantai hierarkis),
  - `master_jenis_dokumen`.
  Semua dropdown di form ajukan dokumen mengambil dari sini (`src/lib/master-data.ts`), sehingga input pegawai selalu berupa **pilihan terkontrol**, bukan teks bebas.
- **Use case.** Admin menambah kegiatan "SAKERNAS 2026" di bawah fungsi "Statistik Sosial" → seluruh pegawai langsung bisa memilihnya, tertulis identik di semua dokumen.
- **Pengguna.** Admin (mengelola); Pegawai (memakai dropdown); Kepala Sub Bagian Umum & Penanggung Jawab Kinerja (memakai untuk filter laporan).
- **Keterkaitan.** Fondasi untuk **PB-1.2** (kegiatan), **PB-5** (rantai permintaan material), **PB-6** (klasifikasi), dan **PB-7** (agregasi per fungsi/kegiatan).

## PB-4.2 — Syarat kelengkapan dokumen tidak baku per kegiatan & per peran

- **Solusi yang dipakai.** Tabel **`master_kelengkapan_dokumen`** yang mendefinisikan daftar kelengkapan **per kegiatan × per peran (Ketua Tim / Anggota)**, dengan penanda wajib/opsional. Form ajukan membangun checklist dari tabel ini (lihat **PB-1.3**).
- **Use case.** Untuk "SAKERNAS", Ketua Tim wajib mengunggah "Laporan Kegiatan + SPJ + Daftar Hadir", sedangkan Anggota hanya "Kuitansi". Aturan ini dikelola sekali oleh Admin, bukan diingat manual.
- **Pengguna.** Admin (mengelola); Pegawai/Ketua Tim (mengikuti checklist).
- **Keterkaitan.** Menghubungkan **PB-1.2** (status ketua tim) dengan **PB-1.3** (checklist) dan mengurangi **penolakan di PB-2**.

## PB-4.3 — Klasifikasi arsip tidak terstruktur

- **Solusi yang dipakai.** Tabel **`master_klasifikasi_arsip`** berbentuk **hierarki induk–anak (leaf/parent)**. Hanya **node daun (leaf)** yang boleh dipakai untuk mengklasifikasikan dokumen (validasi backend "leaf-only"). Ada juga *delete-safety* (tidak bisa menghapus induk yang punya anak / yang sedang dipakai) dan status aktif/nonaktif.
- **Use case.** Kepala Sub Bagian Umum memilih klasifikasi daun "Belanja Barang → Jasa Konsultansi" saat mengklasifikasikan berkas; klasifikasi induk tidak muncul sebagai pilihan akhir.
- **Pengguna.** Kepala Sub Bagian Umum (mengelola & memakai). *Admin tidak punya akses mutasi operasional ke klasifikasi.*
- **Keterkaitan.** Dipakai oleh **PB-6** (berkas 1:1 dengan **Cara Pembayaran** / klasifikasi daun, **per Tahun Anggaran** — lihat catatan di PB-6.2) dan sebelumnya oleh Laporan Klasifikasi (kini dihapus — lihat **Lampiran E**).
- **Struktur untuk pembayaran revolving (UP/TUP/LS).** Klasifikasi daun bersifat evergreen dan dipakai ulang setiap tahun, misalnya `UP > UP-1 … UP-n`, `TUP > TUP-1 …`, `LS > …`. Jumlah anak per induk boleh bertambah dari tahun ke tahun (mis. 2026 hanya sampai UP-7, 2027 sampai UP-9) — cukup tambah anak baru saat dibutuhkan, tidak perlu membuat ulang setiap tahun anggaran.

---

# PB-5 — Realisasi Anggaran & Pembedaan Dokumen Tidak Tertib

**Proses sekarang.** Sebagian dokumen membawa nilai uang (pembayaran/pertanggungjawaban = **Material**), sebagian hanya administratif (**Non-Material**). Di praktik manual keduanya masuk tumpukan yang sama; nominal realisasi dicatat terpisah di buku/Excel oleh masing-masing orang. Akibatnya rekap realisasi anggaran mudah keliru, lambat, dan sulit dipisahkan mana yang benar-benar transaksi keuangan.

## PB-5.1 — Dokumen bernilai uang & tidak bernilai uang diperlakukan sama

- **Solusi yang dipakai.** Kolom **`is_non_material`** dan **`nominal_realisasi`** (DECIMAL) di `dokumen_transaksi`.
  - **Material**: wajib mengisi `nominal_realisasi` (> 0) saat submit; mengikuti alur penuh `DRAFT → … → COMPLETED → ARCHIVED`; metadata (termasuk nominal) **terkunci setelah `COMPLETED`**.
  - **Non-Material**: mengikuti *shortcut* `DRAFT → TERSIMPAN` (di luar FSM `transition()` umum, ditangani handler submit khusus); **tidak** punya `nominal_realisasi`; tidak masuk antrian PPK/PPSPM; tetap bisa muncul di laporan tertentu.
- **Use case.** SPJ perjalanan dinas (Material, Rp 4.500.000) lewat validasi berjenjang; sedangkan "Surat Tugas" (Non-Material) langsung `TERSIMPAN` tanpa membebani PPK.
- **Pengguna.** Pegawai (menentukan jenis & nominal saat submit); PPK/PPSPM (hanya menangani Material); Penanggung Jawab Kinerja & Kepala Sub Bagian Umum (melihat nominal di laporan/agregasi).
- **Keterkaitan.** Menjadi fondasi (`08A`) untuk **PB-6** (nominal ikut ke arsip) dan **PB-7** (agregasi nominal). "Nominal terkunci setelah COMPLETED" menjaga integritas **audit (PB-3)**.

## PB-5.2 — Rantai "jenis → kategori → detail permintaan" tidak terikat ke dokumen material

- **Solusi yang dipakai.** Kolom rantai permintaan (`jenis_dokumen_id` + kolom *material request-chain*) pada `dokumen_transaksi`, dipilih dari master data hierarkis (**PB-4.1**).
- **Use case.** Dokumen material dikategorikan "Permintaan Pembayaran → Honor → Honor Petugas Lapangan", sehingga bisa diagregasi tepat per detail.
- **Pengguna.** Pegawai (mengisi); Penanggung Jawab Kinerja (memfilter laporan per Jenis/Detail).
- **Keterkaitan.** Menyambungkan **PB-4.1** ke **PB-7** (hierarki laporan Fungsi → Kegiatan → Detail Dokumen).

---

# PB-6 — Dokumen Selesai Tercecer & Penyimpanan Terbatas

**Proses sekarang.** Berkas fisik dokumen selesai menumpuk di lemari; file digitalnya tercecer di PC/flashdisk masing-masing pegawai. Saat perlu laporan bulanan, tiap orang mencari sendiri file-nya. Tiap akhir tahun, berkas fisik **di-scan ulang satu per satu** untuk diunggah manual ke aplikasi arsip nasional — melelahkan dan rawan ada yang terlewat.

**Peran aplikasi (dan batasnya).** Aplikasi ini **bukan sistem kearsipan resmi** dan **tidak berintegrasi** dengan aplikasi manapun. Tugasnya: menyimpan dokumen selesai dengan rapi per berkas + menyediakan **unduhan** (per berkas atau banyak dokumen terfilter). Apa yang dilakukan dengan unduhan itu (mengunggah ke kipApp / aplikasi arsip nasional) **tetap manual, di luar sistem**.

- **Kebutuhan bulanan** — pegawai perlu mengumpulkan dokumen kegiatan satu bulan terakhir untuk keperluan laporan. Aplikasi menyimpannya terpusat & bisa difilter, lalu menyediakan **ekspor banyak dokumen terfilter** ke satu zip (lihat PB-6.4).
- **Kebutuhan tahunan** — dokumen selesai dikelompokkan ke dalam **berkas** (1 berkas = 1 Nomor SPM). Aplikasi menyediakan **ekspor per berkas** ke satu zip; Kepala Sub Bagian Umum yang mengunggahnya manual ke aplikasi lain. Ini menggantikan proses lama *scan ulang seluruh berkas fisik*.
- **Housekeeping** — karena disk terbatas, soft file berkas lama bisa dibersihkan, sambil metadata tetap disimpan.

> **Istilah sengaja tidak memakai bahasa kearsipan.** Alur kearsipan resmi (JRA disahkan ANRI, penyusutan, berita acara pemusnahan) terlalu berat dan tidak relevan di sini. Kata "arsip / retensi / musnah" diganti "berkas / masa simpan / pembersihan file". Identifier internal (`berkas_arsip`, `status_arsip`, route `/arsiparis`) dipertahankan untuk kompatibilitas — lihat **tabel penamaan** di bawah dan `docs/rencana-perubahan.md`.
>
> **Model data:** `berkas_arsip` (status `OPEN`/`CLOSED`) berisi `berkas_arsip_item` (`source_type` `WORKFLOW` atau `MANUAL`). Model kanonik lama (`arsip.arsip`) sudah dipensiunkan.

## Model berkas final

```
Pengklasifikasian Dokumen  ─┐
                            ├─▶  BERKAS TERBUKA  ──(Tutup Berkas: + Nomor SPM + Masa Simpan)──▶  BERKAS TERTUTUP
Penambahan Dokumen  ────────┘        (get-or-create per cara pembayaran)                              │
                                                                                                    │ (Usulkan Pembersihan / jatuh tempo)
                                                                                                    ▼
                                              BERKAS TERTUTUP  ◀──(Batalkan Usulan)──  USUL PEMBERSIHAN
                                                                                                    │ (Bersihkan File — konfirmasi ketik)
                                                                                                    ▼
                                                                                          FILE DIBERSIHKAN  (terminal; metadata tetap)
```

## PB-6.1 — Dokumen selesai tidak terkumpul rapi per berkas

- **Solusi yang dipakai.** Dua pintu masuk yang bermuara sama:
  - **Pengklasifikasian Dokumen** (`/arsiparis/inbox` → `POST /api/arsiparis/dokumen/$id.archive`) — sumbernya dokumen workflow `COMPLETED` (sudah lewat Pegawai→PPK→PPSPM). Item `WORKFLOW`.
  - **Penambahan Dokumen** (`/arsiparis/penambahan-arsip`) — entri manual oleh KSBU, **tanpa** alur berjenjang. Mengumpulkan Nama Dokumen, kategori (`Pemeliharaan`/`Pengadaan`/`Lain-lain`), tanggal, cara pembayaran, nominal (> 0), `keterangan` wajib, lampiran opsional. Item `MANUAL` (tabel `manual_arsip*`).
  KSBU memilih **cara pembayaran** (klasifikasi daun) **dan Tahun Anggaran**. Aturan **get-or-create per (klasifikasi, tahun anggaran)**: belum ada berkas terbuka untuk kombinasi itu → **buat berkas terbuka baru**; sudah ada → item **masuk ke berkas itu**. Dokumen workflow **tetap `COMPLETED`**, tidak berpindah ke `ARCHIVED`.
- **Use case.** Lima honor SAKERNAS yang selesai + satu bukti bayar service AC (manual) masuk ke satu berkas "Honor SAKERNAS 2026" yang masih terbuka.
- **Pengguna.** Kepala Sub Bagian Umum.
- **Keterkaitan.** Pintu workflow butuh status **`COMPLETED` (PB-2.2)**; klasifikasi dari **PB-4.3**; nominal item dari **PB-5**.

## PB-6.2 — Berkas tidak pernah "ditutup" dengan Nomor SPM

- **Solusi yang dipakai.** Aksi **"Tutup Berkas"** (modal, `POST /api/arsiparis/berkas/$id/close`). Wajib mengisi **Nomor SPM** + **satu** field **Masa Simpan Minimal** (menggantikan pasangan retensi aktif + inaktif). Server mengisi `closed_at`/`closed_by`, menghitung `tanggal_jatuh_tempo = closed_at + masa_simpan`, lalu set `status_berkas = 'CLOSED'`. Berkas `CLOSED` **tidak menerima item baru**; kombinasi cara pembayaran + Tahun Anggaran itu tidak bisa dipilih lagi untuk penambahan baru di tahun yang sama (aturan 1:1 **per tahun anggaran** — lihat kolom `tahun_anggaran` di `berkas_arsip`, migrasi `0018_berkas_tahun_anggaran`). Tahun anggaran berikutnya, cara pembayaran yang sama bisa dipilih lagi dan membuka berkas baru.
- **Use case.** Setelah semua item SAKERNAS masuk, KSBU menutup berkas dengan Nomor SPM + "Masa Simpan Minimal 5 Tahun". Berkas siap diunduh sebagai satu paket zip.
- **Pengguna.** Kepala Sub Bagian Umum (server wajib verifikasi role; `ADMIN` bukan pengganti).
- **Keterkaitan.** Nomor SPM = penanda "1 berkas = 1 SPM" & dasar penamaan paket unduhan; `closed_at` = dasar hitung **umur berkas** & **jatuh tempo** di PB-6.3.
- **Jejak perubahan.** Sebelum **RP-01** form meminta **retensi aktif + retensi inaktif** dan menulis `status_arsip = 'AKTIF'`. Sejak RP-01 hanya satu field **"Masa Simpan Minimal"** (`retensi_inaktif` / `masa_inaktif_berakhir` ditulis `null`); detail di `docs/rencana-perubahan.md`.

## PB-6.3 — Tidak ada cara membersihkan file lama dari disk terbatas

- **Solusi yang dipakai.** Jalur pembersihan 2 tahap sesudah `CLOSED`:
  1. **Daftar Berkas Tertutup** menampilkan kolom **Umur Berkas** (`hari ini − closed_at`) dan badge **"Jatuh Tempo"** bila `hari ini ≥ tanggal_jatuh_tempo`. Badge ini **dihitung saat halaman dibuka** — **tidak ada scheduler**, tidak ada state yang berpindah sendiri.
  2. KSBU menekan **"Usulkan Pembersihan"** (per baris, atau batch "Usulkan Semua yang Jatuh Tempo") → berkas pindah ke **Usul Pembersihan**. Bisa dibatalkan (**"Batalkan Usulan"** → kembali ke Tertutup).
  3. Di menu **Pembersihan Berkas** (toggle: *Usulan* / *Sudah Dibersihkan*), aksi **"Bersihkan File"** dengan **konfirmasi ketik-persis** → soft file di storage dihapus (kandidat diturunkan hanya dari keanggotaan `berkas_arsip_item` + tabel sumber). **Metadata berkas, Nomor SPM, daftar item, referensi logis, dan seluruh `log_aktivitas` tetap ada.** Preview/download diblokir permanen. Disarankan: peringatan bila berkas **belum pernah diekspor**.
- **Use case.** Berkas 2019 yang sudah lama diunduh & diamankan di luar sistem dibersihkan file-nya untuk melegakan disk; catatan "berkas SPM-xxx/2019 dibersihkan 10 Jan 2026 oleh KSBU" tetap tersimpan.
- **Pengguna.** Kepala Sub Bagian Umum.
- **Keterkaitan.** Menegakkan kontrol akses file **PB-8.3** (blok akses setelah file hilang); menjaga **audit PB-3** tetap utuh.
- **Jejak perubahan.** Sebelum **RP-01** lifecycle 4 tahap `AKTIF → INAKTIF → USUL_MUSNAH → DIMUSNAHKAN` (route `/arsiparis/inaktif`, `/arsiparis/usul-musnah`, konfirmasi `MUSNAHKAN DATA FILE`). Sejak RP-01: `INAKTIF` dibuang dari alur, `USUL_MUSNAH` tampil **"Usul Pembersihan"** & `DIMUSNAHKAN` tampil **"File Dibersihkan"**, kolom Umur/Jatuh Tempo + tombol **"Batalkan Usulan"** sudah ada, konfirmasi ketik **`BERSIHKAN FILE BERKAS`**. Detail = **RP-01**.

## PB-6.4 — Mengunduh file masih satu per satu

- **Solusi yang dipakai (sebagian).** **Filter lokal per halaman** + **ekspor CSV metadata-only** dari baris terlihat (`/arsiparis/berkas`, `/arsiparis/berkas/$id`, halaman laporan, dsb.). Ekspor tidak memuat ID mentah, path, URL, token, atau isi file. Preview/download **lampiran per item** lewat API terotorisasi.
- **Target — dua jenis ekspor ZIP** (belum ada, di `docs/rencana-perubahan.md`):
  - **Ekspor per berkas** (`RP-02`) — semua soft file dalam satu berkas → satu zip. Untuk Kepala Sub Bagian Umum, keperluan tahunan.
  - **Ekspor banyak dokumen terfilter** (`RP-05`) — dari halaman daftar/laporan, filter (mis. periode 1 bulan terakhir), tekan "Ekspor Semua File (ZIP)". Di dalam zip, **tiap dokumen/kegiatan jadi satu folder** berisi seluruh kelengkapannya, jadi tetap rapi. Untuk pegawai (dan Ketua Tim), keperluan bulanan.
- **Pengguna.** Pegawai & Ketua Tim (ekspor terfilter); Kepala Sub Bagian Umum (ekspor per berkas).
- **Keterkaitan.** Hasil unduhan dipakai **manual di luar sistem** (unggah ke kipApp / aplikasi arsip nasional); pengganti "Pencarian Arsip global" & "Laporan Klasifikasi" yang **dihapus** (lihat **Lampiran E**).

## Tabel penamaan (label tampilan vs identifier internal)

> **Prinsip biaya:** ganti **label tampilan** = murah & aman (pola yang sudah dipakai: `PPSPM` tampil "PPSPM"). Ganti **identifier internal** = perlu migrasi DB + menyentuh banyak test. Sejak **RP-01**: **label baru sudah berlaku, identifier internal dibiarkan.**

| Konsep | Label tampilan (berlaku) | Identifier internal (tetap) |
|---|---|---|
| Berkas menerima dokumen | **Terbuka** | `status_berkas = OPEN` |
| Berkas dikunci (ada Nomor SPM) | **Tertutup** | `status_berkas = CLOSED` |
| Tertutup, belum diusulkan bersih | **Tersimpan** *(chip UI saja; tanpa logika)* | `status_arsip = AKTIF` |
| Dicalonkan untuk pembersihan | **Usul Pembersihan** | `status_arsip = USUL_MUSNAH` |
| Soft file sudah dihapus | **File Dibersihkan** | `status_arsip = DIMUSNAHKAN` |
| ~~Arsip inaktif~~ | *dihapus dari alur* | `status_arsip = INAKTIF` *(tak dipakai)* |
| Jenis Pembayaran / klasifikasi | **Cara Pembayaran** | `klasifikasi_id` |
| Masa retensi aktif + inaktif | **Masa Simpan Minimal** *(satu field)* | `retensi_aktif` *(dipakai ulang; `retensi_inaktif` nullable, ditinggalkan)* |
| ~~Musnahkan Data~~ | **Bersihkan File** | aksi `approve_destruction` |
| Menu "Pengklasifikasian Dokumen" | tetap | route `/arsiparis/inbox` |
| Menu "Pemberkasan Arsip Aktif" | **Berkas Terbuka** + **Berkas Tertutup** | route `/arsiparis/berkas` |
| Menu "Daftar Arsip Inaktif" | *dihapus* | route `/arsiparis/inaktif` *(dihapus)* |
| Menu "Usul Musnah" | **Pembersihan Berkas** | route `/arsiparis/usul-musnah` → `/arsiparis/pembersihan` |
| Menu "Master Klasifikasi" | **Master Klasifikasi Dokumen** | route `/arsiparis/klasifikasi` |

**Menu Kepala Sub Bagian Umum:** Dashboard · Pengklasifikasian Dokumen · Penambahan Dokumen · Berkas Terbuka · Berkas Tertutup · Pembersihan Berkas · Master Klasifikasi Dokumen · (System)

---

# PB-7 — Pelaporan Kinerja & Rekap Realisasi Manual

**Proses sekarang.** Manajemen perlu tahu: berapa dokumen sudah selesai, berapa total realisasi anggaran per fungsi & kegiatan, siapa mengerjakan apa. Manual: seseorang mengumpulkan angka dari banyak orang, menyalin dari berkas/buku ke Excel, tiap kali diminta — makan waktu berhari-hari dan rawan salah hitung.

## PB-7.1 — Ketua Tim tidak bisa memantau seluruh dokumen kegiatannya

- **Solusi yang dipakai.** **"Laporan Kegiatan"** (`/pegawai/laporan/kegiatan`) — hanya muncul untuk user yang punya assignment ketua tim. Menampilkan **gabungan seluruh dokumen** dari semua kegiatan yang ia pimpin, dengan **filter per kegiatan** dan ringkasan (mis. "25 dokumen · 8 pegawai"). Berdampingan dengan **"Laporan Saya"** (`/pegawai/laporan/saya`) untuk dokumen pribadi.
- **Use case.** Ketua Tim SAKERNAS memantau progres 25 dokumen pertanggungjawaban dari 8 anggota timnya dalam satu layar.
- **Pengguna.** Ketua Tim (Pegawai dengan assignment).
- **Keterkaitan.** Visibilitasnya ditentukan **`ketua_tim_assignments` (PB-1.2, PB-4)**; datanya adalah dokumen dari **PB-2**.

## PB-7.2 — Tidak ada rekap kinerja lintas fungsi/kegiatan untuk pihak berwenang

- **Solusi yang dipakai.** Role **`PENANGGUNG_JAWAB_KINERJA`** dengan satu halaman **"Laporan Kinerja"** (`/penanggung-jawab-kinerja/laporan-kinerja`, `GET /api/laporan/kinerja`). Bersifat **metadata-only**: menampilkan dokumen berstatus final (`COMPLETED`, `TERSIMPAN`, `ARCHIVED`) dalam hierarki **Fungsi → Kegiatan → Detail Dokumen**, dengan **agregasi nominal** per Fungsi & Kegiatan dan filter (Fungsi, Kegiatan, Jenis, Detail, Tahun, Tanggal, Pengaju, Kategori). **Tidak ada** preview/download/detail/ekspor pada fondasi ini.
- **Use case.** Penanggung Jawab Kinerja melihat total realisasi Fungsi "Statistik Sosial" tahun 2026 tanpa perlu membuka satu pun file.
- **Pengguna.** Penanggung Jawab Kinerja. `ADMIN` **tidak** mewarisi akses ini; RBAC server wajib memakai role yang benar-benar di-assign.
- **Keterkaitan.** Nominal berasal dari **PB-5**; hierarki & filter dari **PB-4**; status final dari **PB-2 & PB-6**.

---

# PB-8 — Kontrol Akses & Akuntabilitas Identitas Lemah

**Proses sekarang.** Berkas kertas berpindah tangan secara fisik. Siapa pun yang kebetulan memegang map bisa membaca isinya; tidak ada yang mencatat siapa membuka apa. Paraf/tanda tangan bisa dipalsukan atau diparaf orang yang bukan wewenangnya. Daftar "siapa boleh menyetujui apa" hanya berdasarkan kebiasaan, bukan aturan yang ditegakkan.

## PB-8.1 — Siapa pun bisa memegang & memproses berkas

- **Solusi yang dipakai.** **Kontrol akses berbasis peran (RBAC) yang ditegakkan di server**. Setiap aksi (buka inbox, approve, reject, klasifikasi, tutup berkas, dst.) dicek terhadap **peran yang benar-benar diberikan** ke user (tabel `auth.user_roles`). Menyembunyikan menu di layar hanya kosmetik — keputusan akhir selalu di server. `ADMIN` adalah akun terpisah, tidak bisa dipakai untuk menyetujui/mengarsipkan.
- **Use case.** Pegawai yang mencoba membuka layar persetujuan PPSPM ditolak sistem karena ia tidak diberi peran PPSPM — walau tampilannya "diakali".
- **Pengguna.** Semua aktor.
- **Keterkaitan.** Menjaga integritas **inbox & aksi PB-2**, **pemberkasan PB-6**, **laporan PB-7**, dan **master data PB-4**. Identitas yang dipakai untuk pengecekan ini juga yang tercatat di **audit trail PB-3**.

## PB-8.2 — Tidak ada pengelolaan identitas & wewenang pegawai

- **Solusi yang dipakai.** Modul **User Management**: Admin membuat user (nama, NIP/NRP, jabatan) dan menetapkan **peran** (Pegawai, PPK, PPSPM, dst.) serta **assignment Ketua Tim per kegiatan**; bisa menonaktifkan user yang pindah/pensiun, dan mereset password. Setiap user bisa **ganti password sendiri** dan melihat **profil**. Ada halaman **Detail User** berisi riwayat aktivitasnya.
- **Use case.** Pegawai baru dibuat dengan peran `PEGAWAI`; saat ditunjuk jadi PPK, Admin menambah peran `PPK` — tanpa perlu akun baru. Saat pindah kantor, akunnya dinonaktifkan sehingga tidak bisa lagi mengakses apa pun.
- **Pengguna.** Admin (mengelola); semua user (ganti password & profil sendiri).
- **Keterkaitan.** Mengisi data yang dipakai **PB-8.1**; assignment Ketua Tim di sini menggerakkan **PB-1.2 & PB-7.1**.

## PB-8.3 — Lampiran bisa dibuka siapa saja yang memegang filenya

- **Solusi yang dipakai.** File lampiran **tidak** bisa diakses lewat tautan langsung. Preview/download **hanya** lewat jalur terotorisasi yang mengecek ulang: apakah user berhak atas dokumen itu, dan apakah dokumen/berkas masih dalam status yang boleh dilihat. Berkas yang **soft file-nya sudah dibersihkan** memblokir semua akses file (termasuk tautan lama) dengan pesan aman, tanpa membocorkan lokasi file.
- **Use case.** Seorang pegawai tidak bisa membuka lampiran dokumen milik pegawai lain, sekalipun ia menebak alamatnya. Setelah berkas lama dibersihkan (**PB-6.3**), tautan lama gagal dengan pesan "file sudah dibersihkan".
- **Pengguna.** Semua aktor yang berhak melihat lampiran.
- **Keterkaitan.** Menegakkan hasil **PB-6.3**; memakai kontrol akses dari **PB-8.1**.

---

## 4. Bagaimana Semua Masalah Saling Terhubung (Ringkas)

```
                 ┌──────── PB-8 Kontrol Akses & Akuntabilitas Identitas ────────┐
                 │   (peran ditegakkan server · kelola user · akses file terbatas) │
                 └───────────────────────────────┬─────────────────────────────────┘
                                                 │ menegakkan
   PB-4 Master Data ───────► PB-1 Transparansi ───────► PB-2 Persetujuan ───────► PB-3 Audit Trail
   (fungsi, kegiatan,        status, current_step,     Berjenjang (FSM)          (log_aktivitas
    kelengkapan,             Ketua Tim, checklist       PPK → PPSPM               append-only)
    klasifikasi)                     │                  revisi/kembalikan               │
        │                           │                        │  COMPLETED              │
        │                           ▼                        ▼                          │
        └────────► PB-5 Material vs Non-Material ──────► PB-6 Pemberkasan & Unduh ───────┘
                   (nominal_realisasi, TERSIMPAN)        Terbuka → Tertutup (+Nomor SPM)
                             │                           → Usul Pembersihan → File Dibersihkan
                             │                                        │
                             ▼                                        ├─ ekspor ZIP (per berkas / banyak dokumen terfilter)
                   PB-7 Pelaporan (Laporan Saya / Kegiatan / Kinerja) ├─ hasil unduhan dipakai MANUAL di luar sistem
                   ◄── agregasi nominal & status final                └─ housekeeping → bersihkan file lama

   Catatan: aplikasi ini mandiri — TIDAK berintegrasi / bertukar data dengan kipApp, aplikasi arsip nasional, atau aplikasi lain.
   Semua PB di atas dibandingkan dengan PROSES MANUAL/KERTAS yang berjalan di kantor sekarang. Hal teknis (teknologi,
   deployment, penyeragaman UI) ada di Lampiran — bukan permasalahan bisnis.
```

## 5. Peta Cepat: Masalah → Lokasi di Kode

| Area | Berkas/rute kunci |
|---|---|
| Aturan transisi status | `src/lib/fsm.ts`, `src/lib/constants/document-status.ts`, `src/lib/types/fsm.ts` |
| Layanan dokumen | `src/lib/dokumen-helpers.ts`, `src/lib/dokumen/queries.ts`, `src/lib/dokumen/mutations.ts` |
| Submit & lampiran (Pegawai) | `src/routes/pegawai/dokumen/*`, `src/routes/api/dokumen/*`, `src/routes/api/upload.ts` |
| Validasi PPK | `src/routes/ppk/*`, `src/routes/api/ppk/*` (`approve`, `reject`, `resubmit`, `kembalikan`) |
| Persetujuan PPSPM | `src/routes/ppspm/*`, `src/routes/api/ppspm/*` |
| Pemberkasan (berkas + item) | `src/routes/arsiparis/berkas*`, `src/lib/archive/berkas-arsip-*.ts`, `src/routes/api/arsiparis/berkas/**`, `src/db/schema/arsip/berkas-arsip.ts` |
| Status berkas & lifecycle | `src/lib/constants/archive-status.ts`, `src/lib/archive/berkas-arsip-service.ts`, `src/routes/api/arsiparis/berkas/$id/lifecycle.ts`, `src/config/navigation.ts` |
| Penambahan dokumen manual | `src/db/schema/arsip/manual-arsip.ts`, `src/routes/api/arsiparis/manual-arsip/*`, `src/routes/arsiparis/penambahan-arsip.tsx` |
| Master data | `src/lib/master-data.ts`, `src/routes/admin.master-data.*.tsx`, `src/routes/api/master-*` |
| Ketua Tim | tabel `master.ketua_tim_assignments`, `src/routes/api/ketua-tim/*` |
| Laporan Kinerja | `src/routes/penanggung-jawab-kinerja/*`, `src/routes/api/laporan/kinerja.ts` |
| Auth & sesi | `src/lib/auth.ts`, `src/lib/auth-state.ts`, `src/routes/api/auth/*`, tabel `auth.*` |
| RBAC & navigasi | `src/components/layout/AppLayout.tsx`, `src/config/navigation.ts`, `src/lib/constants/roles.ts` |
| Same-origin / keamanan | `src/lib/security/same-origin.ts` |
| Storage / akses file | `src/lib/storage/*`, `src/lib/storage-client.ts`, `src/lib/file-helpers.ts`, `src/lib/utils/file.ts` |
| Konstitusi & aturan | `AGENTS.md`, `arsip/docs-2026-09-25:docs/specs/*`, `arsip/docs-2026-09-25:docs/migration/README.md` |

---

## Lampiran — Catatan Teknis & Status Pengembangan

> **Bukan bagian dari permasalahan bisnis.** Bagian ini murni konteks implementasi/kode. Tidak ada di sini yang dibandingkan dengan "proses manual di kantor".

### A. Tumpukan teknologi

**TanStack Start (React 19 + TypeScript)** · **PostgreSQL lokal + Drizzle ORM** · autentikasi lokal berbasis cookie **`dms_session`** · penyimpanan file di **filesystem lokal** · validasi **Zod** di setiap boundary · pusat aturan alur di **Finite State Machine** (`src/lib/fsm.ts`).

### B. Berjalan mandiri di lingkungan kantor

Aplikasi berjalan **penuh di server lokal / jaringan LAN kantor** — tidak butuh internet, tidak bergantung pada layanan cloud atau langganan pihak ketiga. Basis data, autentikasi, dan penyimpanan file semuanya lokal. (Kode awal proyek pernah dibangun di atas layanan cloud dan kemudian dipindah agar sepenuhnya lokal; ini fakta implementasi, bukan pendorong kebutuhan bisnis.)

### C. Keamanan tingkat implementasi

- Password di-hash dengan **Argon2id**; cookie sesi **opaque + `HttpOnly`**, token sesi disimpan ter-hash; logout & ganti/reset password mencabut sesi dari sisi server.
- Login punya fondasi **rate-limit** anti brute-force (lokal-proses).
- Method API yang mengubah data dilindungi validasi **same-origin** (fondasi anti-CSRF, bukan framework token penuh).
- Akses file mencegah path traversal & tidak pernah membocorkan path fisik/root/token.
- Aksi pembersihan destruktif (mis. hapus file yatim) wajib eksplisit dan melindungi file yang masih dipakai.
- **Postur deployment:** ini **handoff internal/LAN yang terkontrol** — bukan kesiapan produksi publik, bukan sertifikasi keamanan/operasional/kepatuhan. Postur akhir yang diutamakan: HTTPS + cookie `Secure`; HTTP LAN tepercaya hanya untuk internal; PostgreSQL tidak diekspos luas ke klien LAN.

### D. Status branch & penyeragaman tampilan

Branch `ui/prototype-redesign-v1` adalah fase **penyeragaman tampilan & interaksi** (komponen UI konsisten, toast global, kebijakan upload selaras, dsb.) — **tanpa mengubah alur bisnis, skema, atau kontrak API**. Solusi PB-1..PB-8 tidak boleh regresi karena perubahan kosmetik.

### E. Model arsip internal & istilah yang sedang diganti

Model penyimpanan berkas memakai `berkas_arsip` + `berkas_arsip_item` (folder-first). Sejumlah surface lama (`arsip.arsip`, pencarian arsip global, "Laporan Klasifikasi") sudah dihapus dari runtime. Istilah berbau kearsipan resmi (arsip, retensi, penyusutan, musnah) sedang diganti dengan istilah netral (berkas, masa simpan, pembersihan file) — rinciannya di `docs/rencana-perubahan.md` (RP-01).

### F. Catatan istilah "DMS"

Sebagian dokumen lama menyebut proyek ini "DMS (Dynamic Document Workflow Management System)". Aplikasi ini **bukan Document Management System klasik** (tidak ada version control, pencarian isi dokumen, editing kolaboratif, atau browsing folder file bebas). Yang dikelola adalah **record transaksi/kasus** (`dokumen_transaksi`) beserta status prosesnya dan lampirannya.

---

*Dokumen ini bersifat penjelasan/onboarding. Bila perilaku aplikasi berubah, `AGENTS.md` dan spec terkait adalah otoritas — perbarui di sana lebih dulu atau bersamaan.*
