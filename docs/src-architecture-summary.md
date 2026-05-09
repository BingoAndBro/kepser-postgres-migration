# Ringkasan Arsitektur `src/`

Snapshot analisis ini dibuat dari struktur kode aktual di `src/` pada 2026-05-09, dengan konteks domain mengacu ke `AGENTS.md`.

## Gambaran umum

Aplikasi ini adalah DMS berbasis TanStack Start dengan pola yang saat ini lebih dekat ke **SPA client-heavy** daripada SSR penuh:

- routing memakai file-based route TanStack Start
- autentikasi dan data utama memakai Supabase
- validasi boundary utama memakai Zod
- workflow status dokumen dipusatkan di `src/lib/fsm.ts`
- banyak page memanggil API route internal dengan `fetch()`
- sebagian page admin dan form juga membaca/menulis Supabase langsung dari browser melalui helper `src/lib/master-data.ts`

Secara domain, kode sudah terbagi mengikuti role utama:

- `PEGAWAI`: ajukan dokumen, revisi, laporan
- `PPK`: validasi, reject, resubmit ke Bendahara
- `BENDAHARA`: approve/reject tahap akhir operasional
- `ARSIPARIS`: pengarsipan, pencarian arsip, klasifikasi, usul musnah
- `ADMIN`: master user dan master data

## Peta folder utama

```text
src/
|-- router.tsx                 # inisialisasi router TanStack
|-- routeTree.gen.ts           # generated route tree
|-- styles.css                 # global styles
|-- components/                # UI reusable dan komponen domain
|   |-- auth/                  # role switcher, user menu
|   |-- dashboard/             # shell dashboard dan page wrapper
|   |-- dokumen/               # viewer/editor lampiran, log, checklist
|   |-- laporan/               # filter hierarkis laporan
|   |-- layout/                # AppLayout global
|   `-- ui/                    # primitive UI ala shadcn
|-- lib/                       # helper data, auth, schema, FSM, storage
|   |-- db/                    # Drizzle schema dan export database
|   |-- schemas/               # Zod schemas
|   |-- types/                 # auth/fsm/user types
|   `-- utils/                 # formatter dan helper file
|-- routes/                    # pages + API route handlers
|   |-- api/                   # endpoint server
|   |-- pegawai/               # halaman Pegawai
|   |-- ppk/                   # halaman PPK
|   |-- bendahara/             # halaman Bendahara
|   |-- arsiparis/             # halaman Arsiparis
|   `-- admin.*.tsx            # halaman admin master data
`-- graphify-out/              # artefak cache tooling, bukan kode runtime utama
```

## Skala kode saat ini

- `src/routes`: 134 file
- `src/routes/api`: 75 file
- `src/components`: 26 file
- `src/lib`: 24 file

Pembagian `components`:

- `auth`: 2
- `dashboard`: 3
- `dokumen`: 7
- `layout`: 1
- `laporan`: 1
- `ui`: 12

## Entry points dan fondasi runtime

### Router dan root shell

- `src/router.tsx` membuat router utama dari `routeTree.gen.ts`
- `src/routes/__root.tsx` menjadi shell dokumen HTML global
- `src/routes/__root.tsx` mengaktifkan `AppLayout` untuk hampir semua halaman
- root route diset `ssr: false`, jadi arsitektur berjalan dominan di sisi client

### Layout global

`src/components/layout/AppLayout.tsx` adalah pusat UI aplikasi:

- mengambil session Supabase di browser
- mengambil role user dari tabel `user_roles`
- menyimpan dan membaca active role dari cookie `dms_active_role`
- merender sidebar, header, avatar menu, dan role switcher
- memetakan role ke menu navigasi melalui `NAV_CONFIG`
- melakukan redirect client-side ke `/login` jika session hilang

Secara praktik, `AppLayout` merangkap:

- auth bootstrap
- shell navigasi
- role resolution
- logout handling

## Layer `lib/`: inti logika aplikasi

### 1. Auth dan role

File utama:

- `src/lib/auth.ts`
- `src/lib/types/auth.ts`
- `src/lib/guards.ts`
- `src/lib/supabase-browser.ts`
- `src/lib/supabase-server.ts`
- `src/lib/supabase-admin.ts`

Peran masing-masing:

- `auth.ts`: helper session, role lookup, active-role cookie
- `types/auth.ts`: definisi `RoleName`, `AppSession`, label role UI
- `supabase-browser.ts`: singleton client untuk browser
- `supabase-server.ts`: factory server client berbasis cookie request
- `supabase-admin.ts`: service-role client untuk bypass RLS
- `guards.ts`: guard SSR/helper server, tetapi pemakaiannya di route saat ini relatif terbatas

Catatan penting: secara aktual, enforcement akses banyak dilakukan lewat kombinasi:

- pengecekan session di `AppLayout`
- `useEffect()` auth check di beberapa layout/page role
- pengecekan role lagi di API route server

### 2. FSM status dokumen

File utama:

- `src/lib/fsm.ts`
- `src/lib/types/fsm.ts`

`fsm.ts` adalah titik pusat transisi status:

- `DRAFT -> IN_PPK_VALIDATION`
- `IN_PPK_VALIDATION -> IN_BENDAHARA_APPROVAL`
- `IN_PPK_VALIDATION -> NEED_REVISION(USER)`
- `IN_BENDAHARA_APPROVAL -> COMPLETED`
- `IN_BENDAHARA_APPROVAL -> NEED_REVISION(PPK)`
- `NEED_REVISION -> RESUBMIT / RESUBMIT_PPK`
- `COMPLETED -> ARCHIVED`

Ini adalah file paling penting untuk menjaga konsistensi workflow antar endpoint.

### 3. Dokumen dan lampiran

File utama:

- `src/lib/dokumen-helpers.ts`
- `src/lib/file-helpers.ts`
- `src/lib/storage-client.ts`
- `src/lib/utils/file.ts`
- `src/lib/utils/format.ts`

Peran:

- `dokumen-helpers.ts`: service layer terbesar untuk dokumen
  - get/create/update dokumen
  - update status
  - insert log append-only
  - validasi kelengkapan
  - resolusi leaf node
  - sinkronisasi lampiran dari path pending ke formal
  - hapus orphan file
- `file-helpers.ts`: helper preview/download berbasis role; ada jejak fungsi legacy
- `storage-client.ts`: signed URL dan download di browser
- `utils/file.ts`: sanitasi nama file, ekstraksi ekstensi, deteksi pending file

Pola storage yang terlihat di kode:

- upload awal ke path sementara/pending
- saat submit atau resubmit, file dipindahkan ke path formal
- nama file tampilan dibangun client-side dari metadata dokumen

### 4. Master data

File utama:

- `src/lib/master-data.ts`
- `src/lib/schemas/master-data.ts`

`master-data.ts` adalah service client-side untuk:

- fungsi
- kegiatan
- kelengkapan
- jenis permintaan
- kategori permintaan
- detail permintaan
- jenis dokumen

Pola pentingnya:

- banyak halaman admin memakai helper ini langsung dari browser
- helper ini bypass API route untuk operasi umum, selama RLS/izin Supabase mengizinkan
- Zod schema di `schemas/master-data.ts` dipakai untuk boundary validasi API dan helper tertentu

### 5. User management

File utama:

- `src/lib/user-helpers.ts`
- `src/lib/types/user.ts`

`user-helpers.ts` memakai admin client untuk:

- list user dari Supabase Auth
- gabung role dari tabel `user_roles`
- create/update user
- reset password
- activate/deactivate user

## Layer `components/`

### Dashboard dan shell

- `src/components/dashboard/DashboardShell.tsx`: hero + shell visual dashboard per role
- `src/components/dashboard/StatsBento.tsx`: kartu statistik per role, sebagian masih placeholder
- `src/components/dashboard/PageLayout.tsx`: wrapper tipis untuk page non-dashboard

### Komponen domain dokumen

Komponen paling penting:

- `AttachmentEditor.tsx`: edit/revisi/resubmit lampiran
- `AttachmentViewer.tsx`: lihat dan unduh lampiran
- `KelengkapanChecklist.tsx`: daftar kelengkapan wajib/opsional
- `ActivityLog.tsx`: timeline log aktivitas dokumen
- `ReviewSummary.tsx`: ringkasan sebelum submit
- `StepIndicator.tsx`: langkah multi-step form
- `FileUploadButton.tsx`: upload file ke `/api/upload`

Keterkaitannya kuat dengan:

- `lib/dokumen-helpers.ts`
- `lib/storage-client.ts`
- endpoint `/api/dokumen/*`, `/api/ppk/*`, `/api/bendahara/*`

### Komponen auth

- `RoleSwitcher.tsx`
- `UserMenu.tsx`

Keduanya ada, tetapi `AppLayout.tsx` saat ini sudah meng-inline implementasi switcher/menu sendiri. Artinya komponen ini lebih terlihat sebagai sisa abstraksi lama atau opsi reuse yang belum dipakai penuh.

### Komponen UI

`src/components/ui/` berisi primitive umum: `button`, `card`, `dialog`, `input`, `select`, `table`, `badge`, `avatar`, `label`, `skeleton`, `date-picker`, dan `StatusBadge`.

## Layer `routes/`: pembagian halaman

### Halaman global

- `/` -> dashboard Pegawai
- `/login`
- `/profile`
- `/forbidden`

### Grup Pegawai

Folder utama:

- `src/routes/pegawai/`
- `src/routes/dokumen/` sebagai alias/redirect legacy ke jalur Pegawai

Fungsi utama:

- daftar dokumen pribadi
- form ajukan dokumen multi-step
- detail dokumen
- edit/revisi dokumen
- laporan saya
- laporan kegiatan untuk ketua tim

Pola datanya:

- halaman memakai `fetch('/api/...')` untuk dokumen aktif
- form ajukan juga memakai `lib/master-data.ts` langsung untuk dropdown master data

### Grup PPK

Folder utama:

- `src/routes/ppk/`

Fungsi utama:

- inbox validasi
- daftar tervalidasi
- daftar ditolak
- daftar revisi untuk PPK
- detail dokumen
- halaman resubmit setelah ditolak Bendahara

### Grup Bendahara

Folder utama:

- `src/routes/bendahara/`

Fungsi utama:

- inbox persetujuan
- daftar ditolak
- daftar selesai
- detail dokumen dan aksi approve/reject

### Grup Arsiparis

Folder utama:

- `src/routes/arsiparis/`

Fungsi utama:

- inbox pemberkasan arsip
- detail arsip/dokumen final
- arsip aktif
- arsip inaktif
- usul musnah
- pencarian arsip
- master klasifikasi arsip

### Grup Admin

Pola admin route memakai file flat:

- `src/routes/admin.index.tsx`
- `src/routes/admin.master-data.*.tsx`

Domain admin yang tercakup:

- user
- fungsi
- kegiatan
- jenis permintaan
- kategori
- detail
- kelengkapan
- jenis dokumen

## Layer `routes/api/`: backend internal

`src/routes/api/` adalah backend utama aplikasi. Endpoint dibagi per domain.

### Auth

- `auth/login.ts`
- `auth/logout.ts`
- `auth/session.ts`
- `auth/role-switch.ts`

Catatan: endpoint auth ini ada, tetapi halaman login saat ini lebih banyak memakai Supabase browser client langsung.

### Dokumen Pegawai

Endpoint penting:

- `dokumen/index.ts` -> list/create draft
- `dokumen/submit.ts` -> create + submit sekaligus
- `dokumen.$id.ts` -> get, patch, delete
- `dokumen.$id.submit.ts` -> submit/resubmit dokumen existing
- `dokumen.$id.log.ts` -> activity log
- `dokumen.$id.preview.$lampiranIndex.ts`
- `dokumen.$id.download.$lampiranIndex.ts`
- `upload.ts`

Ini adalah jalur backend inti untuk lifecycle dokumen dari Pegawai.

### PPK

Endpoint penting:

- `ppk/inbox.ts`
- `ppk/tervalidasi.ts`
- `ppk/ditolak.ts`
- `ppk/revisi.ts`
- `ppk/dokumen/$id.ts`
- `ppk/dokumen/$id/approve.ts`
- `ppk/dokumen/$id/reject.ts`
- `ppk/resubmit/$id.ts`
- `ppk/kembalikan/$id.ts`

Pola umum:

- auth lewat session request
- role check ke `user_roles`
- baca/tulis dokumen sering memakai admin client agar lolos RLS untuk operasi workflow
- status diubah via `fsm.ts` atau helper status terkait

### Bendahara

Endpoint penting:

- `bendahara/inbox.ts`
- `bendahara/ditolak.ts`
- `bendahara/selesai.ts`
- `bendahara/dokumen/$id.ts`
- `bendahara/dokumen/$id/approve.ts`
- `bendahara/dokumen/$id/reject.ts`

### Arsiparis

Endpoint penting:

- `arsiparis/inbox.ts`
- `arsiparis/dokumen.$id.ts`
- `arsiparis/dokumen.$id.archive.ts`
- `arsiparis/aktif*.ts`
- `arsiparis/inaktif*.ts`
- `arsiparis/usul-musnah*.ts`
- `arsiparis/search.ts`
- `arsiparis/klasifikasi/index.ts`
- `arsiparis/klasifikasi/$id.ts`

Endpoint ini memperluas domain dari workflow dokumen ke domain arsip final.

### User dan master data

- `users/*` -> admin user management + profile sendiri
- `master-fungsi*`
- `master-kegiatan*`
- `master-kelengkapan*`
- `master-jenis*`
- `master-kategori*`
- `master-detail*`

### Admin utilitas

- `admin/analyze-storage.ts`
- `admin/cleanup-orphan-files.ts`

Ini adalah endpoint operasional untuk menjaga kebersihan storage.

## Alur hubungan antarmodul

### 1. Login dan role resolution

1. user login dari `src/routes/login.tsx`
2. Supabase browser auth membuat session
3. `AppLayout.tsx` membaca session + role dari `user_roles`
4. active role diambil dari cookie `dms_active_role`
5. sidebar dan landing dashboard ditentukan dari role aktif

### 2. Submit dokumen baru

1. `src/routes/pegawai/dokumen/aju.tsx` mengumpulkan data form
2. dropdown master data diisi dari `src/lib/master-data.ts`
3. lampiran diupload lewat `src/routes/api/upload.ts`
4. submit akhir ke `src/routes/api/dokumen/submit.ts`
5. endpoint memvalidasi Zod, cek kelengkapan, buat record, pindah file pending, lalu jalankan FSM
6. log aktivitas dicatat ke `log_aktivitas`

### 3. Validasi PPK dan Bendahara

1. halaman inbox per role memanggil endpoint list masing-masing
2. detail page memanggil endpoint detail role masing-masing
3. approve/reject memanggil endpoint aksi
4. endpoint memakai `transition()` dari `fsm.ts`
5. status dokumen diupdate
6. log audit ditambahkan

### 4. Revisi

Ada dua jalur revisi:

- PPK menolak -> target revisi ke `USER`
- Bendahara menolak -> target revisi ke `PPK`

Komponen yang paling terlibat:

- `AttachmentEditor.tsx`
- `KelengkapanChecklist.tsx`
- `api/dokumen/$id.ts`
- `api/dokumen/$id/submit.ts`
- `api/ppk/resubmit/$id.ts`

### 5. Arsip

1. dokumen `COMPLETED` masuk inbox Arsiparis
2. Arsiparis melengkapi metadata arsip
3. endpoint archive memasukkan record ke tabel `arsip`
4. status dokumen diubah ke `ARCHIVED`
5. pencarian arsip memakai endpoint `api/arsiparis/search.ts`

## Hubungan data dan dependensi penting

### Dependensi yang paling sentral

- hampir semua route/API bergantung pada Supabase client factory
- hampir semua workflow dokumen bergantung pada `dokumen-helpers.ts`
- semua transisi status seharusnya bergantung pada `fsm.ts`
- semua role logic bergantung pada `auth.ts` dan tabel `user_roles`

### Join data

Saat ini banyak join dilakukan manual di application layer:

- nama fungsi
- nama kegiatan
- jenis/kategori/detail permintaan
- nama user dari Auth admin API

Akibatnya, `dokumen-helpers.ts`, `arsiparis/search.ts`, dan endpoint daftar lain memuat cukup banyak enrichment data setelah query utama.

## Temuan arsitektural penting dari kode aktual

Ini bukan review bug, tetapi hal-hal yang membentuk karakter kode saat ini:

1. **Supabase adalah sumber data nyata utama, bukan Drizzle.**  
   `src/lib/db/schema.ts` hanya memodelkan sebagian tabel, sementara banyak endpoint membaca tabel tambahan langsung lewat Supabase (`master_jenis_permintaan`, `arsip`, `master_klasifikasi_arsip`, dll).

2. **Arsitektur berjalan client-heavy.**  
   Walau ada `guards.ts` dan pola server helper, auth gate nyata banyak terjadi di client (`AppLayout`, `useEffect` pada role layout/page).

3. **Ada jalur ganda antara helper browser dan API route.**  
   Contoh: master data bisa diakses lewat `lib/master-data.ts` langsung dari browser, tetapi API CRUD server juga tetap tersedia.

4. **Ada route legacy yang dipertahankan sebagai redirect.**  
   Folder `src/routes/dokumen/` berfungsi sebagai kompatibilitas untuk jalur lama menuju `src/routes/pegawai/dokumen/*`.

5. **Ada komponen/helper redundan atau transisional.**  
   `RoleSwitcher.tsx`, `UserMenu.tsx`, dan sebagian helper file terlihat tidak lagi menjadi jalur utama karena logikanya sudah terserap ke `AppLayout` atau helper lain.

6. **Ada artefak tooling di dalam `src/`.**  
   `src/graphify-out/` berisi cache AST tooling, dan `src/routes/arsip/` saat ini kosong.

## Kesimpulan ringkas

Struktur aplikasi sudah cukup jelas secara domain: role-based DMS dengan pusat logika pada Supabase, API route internal, helper dokumen, dan FSM status. Kode paling sentral untuk memahami aplikasi ini adalah:

- `src/components/layout/AppLayout.tsx`
- `src/lib/auth.ts`
- `src/lib/fsm.ts`
- `src/lib/dokumen-helpers.ts`
- `src/lib/master-data.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen.$id.ts`
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`

Jika ingin memahami alur aplikasi dari awal sampai akhir, urutan baca yang paling efisien adalah:

1. `AGENTS.md`
2. `src/components/layout/AppLayout.tsx`
3. `src/lib/types/auth.ts`
4. `src/lib/auth.ts`
5. `src/lib/fsm.ts`
6. `src/lib/dokumen-helpers.ts`
7. `src/routes/pegawai/dokumen/aju.tsx`
8. endpoint `src/routes/api/dokumen/*`
9. endpoint `src/routes/api/ppk/*`, `bendahara/*`, `arsiparis/*`
