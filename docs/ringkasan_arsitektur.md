# Arsitektur & Struktur Proyek MVP (Document Management System)

Dokumen ini dibuat untuk membantu Anda memahami secara menyeluruh bagaimana aplikasi ini dibangun, di mana letak *frontend*, di mana letak *backend*, serta fungsi dari masing-masing folder dan file penting. 

Aplikasi ini dibangun menggunakan **TanStack Start**, sebuah *full-stack framework* berbasis React. Artinya, kode untuk frontend (tampilan antarmuka) dan backend (API dan logika server) berada di dalam satu wadah (*repository*), namun tetap dipisahkan tugasnya.

---

## 🏗️ Gambaran Teknologi (Tech Stack)

1. **Framework Utama**: TanStack Start (TypeScript, React)
2. **Database**: Supabase (PostgreSQL)
3. **ORM (Penghubung Database)**: Drizzle ORM
4. **Auth & Storage**: Supabase Auth & Storage
5. **UI / Styling**: Tailwind CSS & shadcn/ui
6. **Validasi Skema**: Zod

---

## 📂 Struktur Folder Utama

Semua kode utama aplikasi Anda berada di dalam folder `src/`. Berikut adalah pembedahan mendetail mengenai apa saja yang ada di dalamnya:

### 1. Sistem Routing & Halaman (`src/routes/`)
Folder ini sangat krusial. TanStack Start menggunakan sistem *file-based routing*. Artinya, nama file di sini langsung menentukan URL di browser Anda.
Di dalam folder ini, terdapat peleburan batas yang elegan antara Frontend dan Backend.

*   **Frontend (Halaman UI)**: File dengan ekstensi `.tsx` (seperti `login.tsx`, `index.tsx`, `dokumen/$id.tsx`) adalah kode tampilan. Mereka me-render komponen React (tombol, tabel, form) yang dilihat oleh *user*.
*   **Backend (API Routes)**: Jika Anda melihat ke dalam folder `src/routes/api/` (contoh: `api/upload.ts`, `api/dokumen/$id.submit.ts`), ini murni tempat berjalannya server (*Backend*). Mereka merespons *request HTTP* (GET, POST), berinteraksi aman dengan database menggunakan Supabase *server client*, dan mengembalikan data (JSON).
*   *Catatan*: Beberapa file `.tsx` memiliki blok `server: { ... }` di dalamnya. Itulah tempat terjadinya *Server-Side Rendering* (SSR) sebelum dikirim ke layar pengguna.

### 2. Komponen Antarmuka / Frontend Murni (`src/components/`)
Hanya memuat elemen-elemen Frontend. Dibagi menjadi beberapa bagian:
*   `ui/` : Berisi komponen *dumb/presentational* yang di-*copy-paste* langsung dari pustaka **shadcn/ui** (seperti `button.tsx`, `dialog.tsx`, `input.tsx`, `table.tsx`). File-file ini mengurus desain, estetika (Tailwind), dan aksesibilitas dasar.
*   `layout/` : Berisi struktur *wrapper* halaman seperti *Navbar*, *Sidebar*, dll.
*   `dokumen/`, `dashboard/`, `auth/` (*Feature Components*): Berisi komponen pintar (*smart components*) yang menangani logika bisnis lokal untuk setiap fitur (seperti Form Pengajuan Dokumen, Tabel List Dokumen).

### 3. Pustaka Logika Bisnis & Backend (`src/lib/`)
Ini adalah jantung fungsional dari aplikasi Anda.
*   `db/` **(Backend/Konfigurasi Database)**:
    *   `schema.ts`: Tempat Anda mendefinisikan bentuk tabel database dengan Drizzle ORM (seperti tabel `dokumen_transaksi`, `kegiatan`, dll). Ini bukan DDL SQL asli, melainkan *TypeScript representation* dari database Anda.
*   `schemas/` **(Full-stack Validasi)**: Berisi skema Zod (seperti memeriksa email harus valid, form judul wajib diisi). Skema ini dipakai bersama-sama oleh form di *Frontend* dan divalidasi juga oleh *Backend* (`api/*.ts`) agar tidak bobol.
*   `fsm.ts` **(Core Logic / Backend)**: File terpenting untuk mengatur **Alur Kerjanya (Workflow)**. *Finite State Machine (FSM)* mengatur apakah dokumen berhak pindah status dari `DRAFT` ke `IN_PPK_VALIDATION`, dan siapa yang boleh melakukannya.
*   `supabase.ts`, `supabase-browser.ts`, `supabase-server.ts`: Pembantu untuk menghubungkan aplikasi Anda dengan database Supabase, dibedakan mana yang berjalan di *browser* (klien) dan mana yang berjalan di *server* agara aman (opsional proteksi token/cookie).

### 4. Skema Migrasi Database (`drizzle/`)
*   Folder ini berada di *root* (luar `src/`), berfungsi menyimpan rekam jejak (*history*) dari bentuk tabel database Anda dalam bentuk bahasa SQL (`.sql`). File ini dipakai saat kita mengeksekusi `pnpm db:push` agar database Supabase asli di internet berubah bentuk menyesuaikan isi file `schema.ts`.

### 5. Aturan Main Aplikasi (`docs/` dan `.agent/skills/`)
Meskipun bukan kode aplikasi, Anda sangat perlu tahu ini:
*   `AGENTS.md`: Konstitusi proyek Anda! Jika ada perbedaan pendapat soal bisnis, semuanya harus tunduk pada file ini (menjelaskan tabel MVP, fungsi pegawai, fungsi PPK).
*   `arsip/docs-2026-09-25:docs/specs/`: Cetak biru per-fitur (seperti `03-submit-flow`, `04-approve-flow`) di mana tim/agen menguji secara detil (*Test Verification* markdown).
*   `.agent/skills/`: Berisi prompt dan batasan panduan (seperti arahan UI/UX, Webapp testing) agar seluruh sistem stabil.

---

## 🛠️ Peta Alur Contoh: Apa yang terjadi ketika User Menyimpan Dokumen?

Untuk memahaminya, mari simulasikan alur **Submit Dokumen**:

1. **(Frontend)** Pengguna berada di halaman browser `/dokumen/aju`. Kode React yang menangani tampilan berada di `src/routes/dokumen/aju.tsx`.
2. **(Frontend -> Backend)** Saat pengguna menekan submit, sebuah fungsi (`fetch`) akan mengirim data (JSON) ke endpoint URL `/api/dokumen/xxx/submit`.
3. **(Backend)** *Request* ini ditangkap oleh file `src/routes/api/dokumen/$id.submit.ts`. 
4. **(Backend Validation)** Backend akan memvalidasi data menggunakan `src/lib/schemas/` lalu memastikan hak akses akunnya via token (Supabase Session).
5. **(Backend Business Logic)** Backend memanggil fungsi transisi di `src/lib/fsm.ts` untuk memajukan status dokumen.
6. **(DB Query)** Drizzle (menggunakan bentuk konfigurasi dari `src/lib/db/schema.ts`) menginjeksi langsung perintah aslinya (SQL) ke server Supabase untuk meng-*update* baris data.

---

## 📋 Ringkasan Singkat (Cheat Sheet)

| Butuh mengubah... | Pergi ke Folder... |
| :--- | :--- |
| Warna Tombol, Jarak, Animasi, Desain dasar UI | `src/components/ui/` |
| Mengganti bentuk halaman/layout secara general | `src/routes/*.tsx` |
| Logika UI spesifik (seperti tabel atau form khusus) | `src/components/dokumen/` |
| Ada fitur gagal memproses data/Error validasi ke database | `src/routes/api/` |
| Menambah kolom tabel baru di database | `src/lib/db/schema.ts` |
| Menambah syarat penolakan dokumen PPK | `src/lib/fsm.ts` |
| Konfigurasi Rahasia / API Key | File `.env` di ROOT aplikasi |

Semoga ringkasan bedah sistem aplikasi ini menjawab kebingungan Anda dan menjadikan Anda sepenuhnya paham tentang fondasi aplikasi ini!
