# SPEC 07: Chairman Assignment (Ketua Tim)

## Overview

Memberikan kemampuan kepada ADMIN untuk assign user sebagai "Ketua Tim" (Chairman) pada kegiatan tertentu, dan menampilkan badge info di halaman Ajukan Dokumen untuk membedakan dokumen chairman vs anggota. Laporan Kegiatan hanya accessible oleh user yang punya hak chairman.

---

## Background / Konteks

Spec 01 (Auth & RBAC Foundation) membangun fondasi role-based access control. Spec 06 (User Management) membangun kemampuan admin untuk mengelola user lifecycle.

Kondisi saat ini:
- **Tidak ada kemampuan chairman** — semua user submit dokumen sebagai "anggota"
- **Tidak ada menu Laporan Kegiatan** — hanya "Laporan Saya" untuk setiap user
- **Tidak ada badge** yang membedakan status chairman/anggota di Ajukan Dokumen

Spec 07 menutup gap ini dengan:
1. Chairman assignment per kegiatan (many-to-many: user ↔ kegiatan)
2. Badge info di Ajukan Dokumen (Chairman vs Anggota)
3. Menu baru "Laporan Kegiatan" hanya untuk user yang punya hak chairman

---

## User Stories

- Sebagai **ADMIN**, saya ingin **meng-assign user sebagai chairman** pada kegiatan tertentu, agar user tersebut bisa mengelola dokumen di kegiatan tersebut.
- Sebagai **ADMIN**, saya ingin **melihat daftar kegiatan chairman** setiap user di Master User, agar saya tahu siapa chairman di kegiatan apa.
- Sebagai **ADMIN**, saya ingin **mencabut hak chairman** user dari suatu kegiatan, agar chairman baru bisa ditunjuk.
- Sebagai **USER**, saya ingin **melihat badge info** apakah saya chairman atau anggota di kegiatan yang dipilih, agar saya tahu dokumen akan masuk ke menu mana.
- Sebagai **USER** (ketua tim), saya ingin **melihat menu Laporan Kegiatan**, agar saya bisa memantau seluruh dokumen di kegiatan yang saya pimpin.

---

## Scope — Termasuk

### Admin: Chairman Assignment Management
- [ ] **Assign chairman** — pilih user + pilih kegiatan (dropdown hanya kegiatan tanpa chairman)
- [ ] **View chairman assignments** — tampilkan kolom baru "Kegiatan Ketua Tim" di Master User table
- [ ] **Remove chairman assignment** — cabut hak chairman dari user di kegiatan tertentu
- [ ] **Assign saat create user** — opsional assign kegiatan chairman saat membuat user baru
- [ ] **Constraint enforcement** — satu kegiatan hanya bisa punya 1 chairman

### User: Experience Enhancement
- [ ] **Badge info** — tampilkan badge "Anda Ketua Tim" atau "Anda Anggota" di halaman Ajukan Dokumen (setelah pilih kegiatan)
- [ ] **Menu Laporan Kegiatan** — tampilkan menu baru hanya untuk user yang punya hak chairman
- [ ] **Auto-determine role** — sistem auto-detect apakah user chairman atau anggota berdasarkan kegiatan yang dipilih

### Data & API
- [ ] **Tabel `ketua_tim_assignments`** — schema baru untuk menyimpan assignment
- [ ] **API endpoints** — CRUD untuk chairman assignments
- [ ] **UI Master User** — kolom baru, popup edit dengan manage kegiatan chairman
- [ ] **UI Ajukan Dokumen** — badge info, auto-determine chairman/anggota
- [ ] **UI Laporan Kegiatan** — halaman baru dengan filter per kegiatan

### Navigation
- [ ] **Menu visibility** — "Laporan Kegiatan" hanya tampil jika user ada di `ketua_tim_assignments`
- [ ] **Badge display** — hanya di Ajukan Dokumen + halaman Upload, hilang di halaman Review

---

## Scope — Tidak Termasuk

- [ ] User bisa memilih/minta di-assign sebagai chairman sendiri
- [ ] Chairman bisa delegate ke anggota (sub-chairman)
- [ ] Multiple chairman per kegiatan
- [ ] Activity history tracking per user (di luar scope — butuh tabel/log terpisah)
- [ ] Chairman email notification saat di-assign

---

## Perubahan yang Diperlukan

### Data / Model / Schema

**Tabel baru: `ketua_tim_assignments`**

```sql
CREATE TABLE ketua_tim_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kegiatan_id UUID REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, kegiatan_id),
  -- Constraint: satu kegiatan hanya boleh punya 1 chairman
  EXCLUDE USING gist (
    kegiatan_id WITH =,
    user_id WITH <>
  ) WHERE (user_id IS NOT NULL) -- allow NULL for future flexibility
);
```

**Alternative constraint (lebih simple):**
```sql
-- Check di application layer atau trigger
-- Tidak ada UNIQUE di kegiatan_id karena satu kegiatan = 1 chairman
```

**Indexes:**
```sql
CREATE INDEX idx_ketua_tim_user ON ketua_tim_assignments(user_id);
CREATE INDEX idx_ketua_tim_kegiatan ON ketua_tim_assignments(kegiatan_id);
```

### API / Endpoints / Server Functions

#### Chairman Assignment Endpoints (ADMIN only)

```
GET    /api/ketua-tim
  → List semua chairman assignments
  → Response: { assignments: [{ id, user_id, user_name, kegiatan_id, kegiatan_nama, created_at }] }

GET    /api/ketua-tim/user/[user_id]
  → Get semua kegiatan chairman untuk user tertentu
  → Response: { kegiatan: [{ id, nama }] }

GET    /api/ketua-tim/kegiatan/[kegiatan_id]
  → Get chairman untuk kegiatan tertentu
  → Response: { chairman: { id, user_id, user_name } | null }

POST   /api/ketua-tim
  → Assign user sebagai chairman di kegiatan
  → Body: { user_id, kegiatan_id }
  → Validation: kegiatan belum punya chairman, user_id valid, kegiatan_id valid
  → Response: 201 Created atau 409 Conflict (kegiatan sudah punya chairman)

DELETE /api/ketua-tim/[id]
  → Remove chairman assignment
  → Validation: assignment exists
  → Response: 204 No Content
```

#### User Endpoints (Authenticated)

```
GET    /api/users/me/ketua-tim
  → Get kegiatan chairman untuk current user
  → Response: { is_ketua_tim: boolean, kegiatan: [{ id, nama }] }

GET    /api/users/me/is-ketua-tim/[kegiatan_id]
  → Cek apakah current user chairman di kegiatan tertentu
  → Response: { is_ketua_tim: boolean }
```

### UI / Frontend

#### Halaman: `/admin/master-data/user` (Update)

**Perubahan pada tabel:**
- Kolom baru: "Kegiatan Ketua Tim" — tampilkan chip/badge per kegiatan (e.g., [SAKERNAS], [SUSENAS])
- Jika user tidak punya hak chairman: tampil "-"

**Perubahan pada popup Edit User:**
- Section baru: "🏆 Kegiatan sebagai Ketua Tim"
- Chip kegiatan yang sudah di-assign (dengan button x untuk remove)
- Dropdown "Tambah Kegiatan" — hanya tampilkan kegiatan yang belum punya chairman
- Info text: "Satu kegiatan hanya bisa memiliki 1 ketua tim"

**Perubahan pada popup Tambah User:**
- Section opsional: "🏆 Kegiatan sebagai Ketua Tim" (sama seperti Edit, tapi tanpa chip yang ada)

#### Halaman: `/admin/master-data/user/[id]` (Baru — Detail User)

**Layout:**
- Header: Avatar (inisial), Nama Lengkap, Email, NIP/NRP, Status
- Section "Informasi Akun" — card dengan info lengkap
- Section "Hak Akses" — badge role(s)
- Section "Kegiatan sebagai Ketua Tim" — chip per kegiatan (jika ada)
- Section "Riwayat Aktivitas" — tabel dengan pagination (future: butuh tabel activity_log)

**Note:** Riwayat aktivitas butuh implementasi terpisah (tabel `user_activity_log` atau similar).

#### Halaman: `/ajukan-dokumen` (Update)

**Perubahan:**
- Setelah user pilih kegiatan → cek apakah user chairman di kegiatan tersebut
- Jika chairman: tampilkan badge hijau "🏆 Anda adalah Ketua Tim di kegiatan ini"
- Jika anggota: tampilkan badge biru "🏅 Anda adalah Anggota di kegiatan ini"
- Badge hanya tampil di halaman form, hilang di halaman Review

**Badge Chairman:**
```
┌────────────────────────────────────────────────────────────┐
│ 🏆 Anda adalah Ketua Tim di kegiatan ini                   │
│    Dokumen yang Anda ajukan akan masuk ke Laporan          │
│    Kegiatan. Anggota tim Anda juga dapat melihat dokumen ini│
└────────────────────────────────────────────────────────────┘
```

**Badge Anggota:**
```
┌────────────────────────────────────────────────────────────┐
│ 🏅 Anda adalah Anggota di kegiatan ini                     │
│    Dokumen Anda akan masuk ke Laporan Saya.               │
└────────────────────────────────────────────────────────────┘
```

#### Halaman: `/laporan/kegiatan` (Baru)

**Access:** Hanya untuk user yang punya hak chairman (visible hanya jika ada di `ketua_tim_assignments`)

**Layout:**
- Header: "Laporan Kegiatan"
- Subtitle: "Seluruh dokumen dari kegiatan yang pernah Anda pimpin sebagai Ketua Tim."
- Filter dropdown: "Semua Kegiatan" | [daftar kegiatan chairman user]
- Summary: "N dokumen · M pegawai"
- Tabel dokumen: No | Judul Dokumen | Kegiatan | Pengaju | Aksi (view)

#### Navigation Update

```
GENERAL
├─ 📊 Dashboard
│
MANAGEMENT
├─ 📝 Ajukan Dokumen
├─ 📋 Dokumen Diajukan
├─ ✏️ Revisi Dokumen
├─ 📄 Laporan Saya
└─ 📈 Laporan Kegiatan  ← (HANYA jika user punya hak chairman)
│
ARSIP
└─ 🔍 Cari Arsip
│
SYSTEM
├─ 📜 Activity Log
└─ ⚙️ Settings
```

### Logic / Business Rules

1. **One chairman per kegiatan** — constraint di DB + validation di API. Jika kegiatan sudah punya chairman, return 409 Conflict.
2. **User bisa chairman di banyak kegiatan** — satu user bisa punya multiple entries di `ketua_tim_assignments`.
3. **Chairman assignment permanent until revoked** — tidak ada expiry date. Admin harus manual cabut.
4. **Badge determination** — cek `ketua_tim_assignments` dengan `user_id = currentUser AND kegiatan_id = selectedKegiatanId`.
5. **Menu visibility** — cek apakah user ada di `ketua_tim_assignments`. Jika ada minimal 1 entry, show "Laporan Kegiatan".
6. **User chairman bisa juga jadi anggota** — di kegiatan lain, user bisa chairman; di kegiatan lain lagi, user bisa anggota. Badge berdasarkan kegiatan yang dipilih.
7. **Chairman tetap bisa submit sebagai anggota** — tidak ada enforcement bahwa chairman harus selalu submit ke "Laporan Kegiatan". User memilih submit ke Laporan Saya atau Laporan Kegiatan? (Clarification needed: apakah chairman bisa submit ke "Laporan Saya" di kegiatannya sendiri?)

**Clarification pending:**
- Apakah chairman bisa submit dokumen "untuk dirinya sendiri" (masuk Laporan Saya)?
- Atau semua dokumen dari chairman HARUS masuk Laporan Kegiatan?

**Asumsi saat ini:**
- Chairman bisa pilih: submit ke "Laporan Saya" atau "Laporan Kegiatan"
- Default: jika badge menunjukkan "Ketua Tim", suggest submit ke "Laporan Kegiatan"

---

## Dependensi

- **Bergantung pada:** Spec 01 (Auth & RBAC), Spec 06 (User Management), Spec 05 (Arsip Flow — untuk menu navigation consistency)
- **Dibutuhkan oleh:** Spec 04 (Submit Flow), Spec 05 (Arsip Flow) — chairman status mempengaruhi badge dan routing dokumen

---

## Technical Notes

### Database Relationship

```
┌─────────────────┐       ┌────────────────────────────┐       ┌─────────────────┐
│   auth.users    │       │  ketua_tim_assignments     │       │ master_kegiatan │
├─────────────────┤       ├────────────────────────────┤       ├─────────────────┤
│ id (UUID)       │◄──────│ user_id                    │       │ id (UUID)       │
│ email           │       │ kegiatan_id                │──────►│ nama            │
│ raw_user_meta_* │       │ created_at                 │       │ fungsi_id       │
│ disabled_at     │       │ created_by                 │       │ tahun           │
└─────────────────┘       └────────────────────────────┘       └─────────────────┘
```

### Check Chairman Status Function

```sql
-- Function untuk cek apakah user chairman di kegiatan tertentu
CREATE OR REPLACE FUNCTION is_user_chairman(
  p_user_id UUID,
  p_kegiatan_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM ketua_tim_assignments
    WHERE user_id = p_user_id AND kegiatan_id = p_kegiatan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Get User's Chairman Kegiatan

```sql
-- Function untuk get semua kegiatan chairman user
CREATE OR REPLACE FUNCTION get_user_chairman_kegiatan(
  p_user_id UUID
) RETURNS TABLE(kegiatan_id UUID, kegiatan_nama TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.nama
  FROM ketua_tim_assignments kta
  JOIN master_kegiatan k ON kta.kegiatan_id = k.id
  WHERE kta.user_id = p_user_id
  ORDER BY k.nama;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migration Checklist

1. Migration 013: Buat tabel `ketua_tim_assignments`
2. Migration 014: Buat indexes
3. Migration 015: Buat function `is_user_chairman`
4. Migration 016: Buat function `get_user_chairman_kegiatan`

---

## Estimasi Kompleksitas

**Rendah-Sedang** — Implementasi straightforward. Yang perlu atenção khusus:

1. **Constraint uniqueness** — satu kegiatan = 1 chairman, perlu handle conflict gracefully
2. **Badge auto-determination** — harus fetch data sebelum render form
3. **Menu visibility logic** — perlu check di server side untuk security
4. **Integration dengan existing pages** — Ajukan Dokumen sudah ada, perlu add badge logic

---

## Definition of Done

- [ ] Tabel `ketua_tim_assignments` terbuat dengan constraint yang benar
- [ ] API CRUD chairman assignment berfungsi
- [ ] Master User table menampilkan kolom "Kegiatan Ketua Tim"
- [ ] Popup Edit User bisa add/remove kegiatan chairman
- [ ] Form Tambah User bisa assign kegiatan chairman
- [ ] Halaman Detail User (/admin/master-data/user/[id]) tersedia
- [ ] Badge "Ketua Tim/Anggota" tampil di Ajukan Dokumen
- [ ] Menu "Laporan Kegiatan" hanya visible untuk user yang punya hak chairman
- [ ] Halaman Laporan Kegiatan berfungsi dengan filter per kegiatan
- [ ] Konstrain 1 kegiatan = 1 chairman berjalan (validation di API)
- [ ] Build succeeds tanpa error

---

## Catatan / Risiko

1. **Activity history** — halaman detail user punya section "Riwayat Aktivitas" tapi implementasinya butuh tabel baru (`user_activity_log`) yang di luar scope SPEC 07. Section ini bisa di-hidden atau placeholder saja untuk MVP.
2. **Constraint uniqueness** — implementasi EXCLUDE constraint di PostgreSQL butuh extension `btree_gist`. Alternative: handle uniqueness di application layer + trigger.
3. **Menu visibility security** — pastikan menu visibility dicek di server-side, bukan hanya client-side hide/show.
4. **Badge timing** — badge harus muncul setelah user pilih kegiatan (tidak bisa saat page load karena kegiatan belum dipilih).

---

## Status

**Phase:** Planning

**Progress:**
- [ ] Planning
- [ ] Database Migration
- [ ] API Implementation
- [ ] UI Implementation
- [ ] Testing
- [ ] Documentation Update
