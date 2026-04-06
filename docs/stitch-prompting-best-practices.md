# 🎨 Panduan Best Practice: Prompting di Stitch (AI UI/UX Generator)

Dokumen ini berisi praktik terbaik (best practices) untuk menggunakan instruksi teks (prompt) pada *Stitch*, alat pembangkit desain UI/UX bertenaga AI. Menggunakan format dan struktur prompt yang tepat akan sangat meningkatkan kualitas, konsistensi, dan akurasi desain yang dihasilkan.

## 1. Spesifik dan Inkremental (Bertahap)
Stitch berkinerja paling baik dengan instruksi yang jelas dan terarah. 
- **Fokus Satu Per Satu:** Jangan meminta desain seluruh aplikasi sekaligus. Fokuslah pada satu layar (screen) atau komponen setiap kali melakukan prompt.
- **Perubahan Inkremental:** Saat melakukan iterasi atau perbaikan (menggunakan `mcp_stitch_edit_screens` / `mcp_stitch_generate_variants`), berikan maksimal satu atau dua parameter perubahan dalam satu prompt.
- **Sebutkan dengan Jelas:** Targetkan elemen spesifik di layar dan mintalah perubahan visual yang spesifik (contoh: *"Ubah tombol call-to-action utama di layar login menjadi lebih besar dan gunakan warna biru utama brand"*).

## 2. Struktur Prompt UI Generation
Untuk menjaga konsistensi desain antar layar, prompt harus selalu menyertakan pedoman yang berisi konstrain *Design System* (Sistem Desain) dan *Page Structure* (Struktur Halaman).

**Contoh Format Prompt Standar:**
```markdown
[Deskripsi singkat dan jelas tentang halaman]

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: [Tema utama, misal: Light, minimal, professional]
- Background: [Warna Latar dengan Hex, misal: Clean White (#ffffff)]
- Surface: [Warna Permukaan/Card, misal: Soft Gray (#f9fafb)]
- Primary Accent: [Warna Aksen Utama, misal: Deep Blue (#2563eb) untuk tombol submit]
- Text Primary: [Warna Teks Utama, misal: Near Black (#111827)]
- Text Secondary: [Warna Teks Sekunder, misal: Medium Gray (#6b7280)]
- Buttons: [Aturan Tombol, misal: Subtly rounded (8px), full-width on form]
- Cards: [Aturan Card, misal: Gently rounded (12px), soft shadow for elevation]

**Page Structure:**
1. **Header:** [Deskripsi header, misal: Minimal logo, centered]
2. **Main Content:** [Komponen utama halaman]
3. **Footer:** [Deskripsi footer]
```

## 3. Mendefinisikan Semantic Design System (Sistem Desain Terpusat)
Project harus memiliki "Source of Truth" untuk Sistem Desain. Jika Anda membuat template untuk proyek besar, rancang dokumen yang mencakup:
1.  **Visual Theme & Atmosphere** (misal: Airy, minimal, photography-first aesthetic).
2.  **Color Palette & Roles** (Warna Utama, Sekunder, Latar Belakang, Aksen). Selalu sertakan kode HEX terperinci.
3.  **Typography Rules** (Aturan untuk Heading dan Body, serta referensi ukuran).
4.  **Component Stylings** (Radius border tombol, bayangan untuk antarmuka).
5.  **Layout Principles** (Penyelarasan konten dan whitespace).

Stitch menyediakan kapabilitas untuk *Apply Design System* dan *Create Design System* di mana konsep ini dapat diterapkan secara terprogram dalam proyek *Workspace*.

## 4. Menggunakan Baton Files untuk Iterasi (Manajemen State)
Gunakan pendekatan berbasis "Baton File" (seperti file *markdown* sementara) untuk menyimpan konteks selama melakukan iterasi desain layar ke layar. Format ini menyematkan *front-matter* untuk mengidentifikasi halaman apa yang sedang dikerjakan.

**Contoh Baton File:**
```markdown
---
page: contact
---
Sebuah halaman kontak yang hangat dan mengundang untuk Toko Bunga dan Tanaman.

**DESIGN SYSTEM (REQUIRED):**
... (Masukkan Design System di sini)

**Page Structure:**
... (Masukkan Page Structure di sini)
```

## 5. Implementasi ke dalam Tools
Ketika menggunakan command / memanggil prompt ke Stitch, pastikan `deviceType` (MOBILE, DESKTOP, TABLET) dispesifikkan jika memungkinkan. Selalu gabungkan teks requirement dengan format *DESIGN SYSTEM* di atas agar *Stitch* tahu batasan komponen UI-nya.
