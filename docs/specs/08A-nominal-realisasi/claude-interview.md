# Interview: Spec 08A — Nominal Realisasi Foundation

## Pertanyaan Klarifikasi

Berikut hal-hal yang belum terjawab di spec dan perlu diklarifikasi sebelum plan bisa ditulis:

---

### 1. Penentuan Material vs Non-Material

**Spec bilang:** `is_non_material` adalah flag, `nominal_realisasi` WAJIB jika `!is_non_material`.

**Pertanyaan:**
- Flag `is_non_material` diset oleh siapa? User (form) atau otomatis berdasarkan jenis kegiatan?
- Apakah ada jenis kegiatan tertentu yang secara otomatis Non-Material (misalnya: rapat, perjalanan)?
- Atau user yang memilih saat submit dokumen?

**Implikasi:** Jika otomatis, kita perlu lookup table/rule untuk men-set flag. Jika manual, UI perlu tambahkan checkbox/toggle.

---

### 2. Perhitungan Nominal Realisasi

**Spec bilang:** nominal_realisasi wajib untuk Material.

**Pertanyaan:**
- Dari mana nilai `nominal_realisasi` berasal? Input langsung dari user atau dihitung dari RAB/kegiatan?
- Apakah ada calculation logic (misalnya: jumlah volume × harga satuan)?
- Atau user input manual dengan format tertentu (misalnya: selalu dalam rupiah, tanpa mata uang)?

**Implikasi:** Menentukan apakah perlu calculator logic atau cukup input field biasa.

---

### 3. Handling Dokumen Existing

**Spec bilang:** Tambah kolom baru dengan default values.

**Pertanyaan:**
- Dokumen yang sudah ada di database (Material) apakah perlu `nominal_realisasi` di-set manual?
- Atau default NULL dan baru wajib saat create/update baru?
- Migration harus handle case existing data bagaimana?

**Implikasi:** Design decision apakah ada backfill migration atau hanya forward compatibility.

---

### 4. Update Nominal Realisasi

**Pertanyaan:**
- Setelah dokumen di-submit, bisakah `nominal_realisasi` di-update?
- Jika ya, siapa yang bisa update? Hanya creator, arsiparis, atau superadmin?
- Apakah perlu audit trail untuk perubahan nominal?

**Implikasi:** Validasi authorization + history tracking.

---

### 5. Propagasi ke Arsip

**Spec bilang:** Saat dokumen diarsipkan, `nominal_realisasi` di-copy ke tabel `arsip`.

**Pertanyaan:**
- Untuk arsip yang dibuat MANUAL (bukan dari dokumen), apakah `nominal_realisasi` juga wajib?
- Apakah user arsip bisa override/edit `nominal_realisasi` di arsip setelah di-copy dari dokumen?

**Implikasi:** Validasi di endpoint arsip manual + field editability.

---

### 6. Format Number

**Pertanyaan:**
- Apakah ada batasan range untuk `nominal_realisasi`? (max 999,999,999,999.99 atau lebih kecil?)
- Apakah perlu support thousand separator formatting di input?
- Decimal places: apakah 2 decimal (sen/rupiah) sudah cukup?

**Implikasi:** Schema precision + UI formatting.

---

### 7. Konfirmasi sebelum lanjut

Mohon jawab pertanyaan di atas agar saya bisa melanjutkan ke **Spec Synthesis** dan **Implementation Plan**.

Jika ada yang sudah jelas dari context project, silakan skip - saya akan gunakan asumsi sesuai pattern existing.