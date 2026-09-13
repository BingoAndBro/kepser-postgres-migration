# Brainstorming: Role Ketua Tim & Pembaruan Master User

**Tanggal:** 2026-05-01
**Branch:** feat/arsip-flow-spec-05
**Status:** Di-convert ke SPEC 07 (`docs/specs/07-chairman-assignment/spec.md`)

---

## Ringkasan Percakapan

Klien menginginkan sistem hak akses "Ketua Tim" yang melekat pada user per kegiatan, bukan dipilih saat ajukan dokumen. Admin dapat meng-assign user sebagai chairman per kegiatan.

---

## Decisions / Kesepakatan

| # | Pertanyaan | Keputusan |
|---|------------|-----------|
| 1 | User bisa multiple chairman di beberapa kegiatan? | **Ya** - Satu user bisa chairman di banyak kegiatan (SAKERNAS, SUSENAS, dll) |
| 2 | Hak chairman berlaku untuk periode tertentu? | **Selamanya** - Sampai admin cabut manual |
| 3 | Apakah perlu role baru "Ketua Tim" terpisah? | **Tidak** - Cukup sebagai capability, bukan role baru |
| 4 | User chairman tetap bisa lihat "Laporan Saya"? | **Ya** - Kedua menu co-exist (Laporan Saya + Laporan Kegiatan) |
| 5 | Laporan Kegiatan menampilkan semua kegiatan chairman? | **Ya** - Gabungan: semua dokumen + filter per kegiatan + detail |
| 6 | Badge info chairman muncul di halaman mana? | **Ajukan Dokumen** (sampai halaman upload), **tidak muncul** di halaman Review |
| 7 | Badge harus tampil atau hidden? | **Tampil** sebagai badge info "Anda Ketua Tim di kegiatan ini" atau "Anda Anggota" |
| 8 | Assign chairman saat create user? | **Ya** - Bisa juga saat create user |
| 9 | Aksi di Master User = Edit, Lihat, Hapus | **Ya** - 3 ikon aksi |
| 10 | Halaman detail user (Lihat) = read-only atau advance? | **Advance** - Halaman baru dengan activity history |

---

## Database Schema

### Tabel Baru: `ketua_tim_assignments`

```sql
CREATE TABLE ketua_tim_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kegiatan_id UUID REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, kegiatan_id)
);

CREATE INDEX idx_ketua_tim_user ON ketua_tim_assignments(user_id);
CREATE INDEX idx_ketua_tim_kegiatan ON ketua_tim_assignments(kegiatan_id);
```

**Constraint:** Satu kegiatan hanya bisa memiliki maksimal 1 chairman.

---

## Halaman Master User (`/admin/master-data/user`)

### Tabel dengan Kolom Baru

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Master User                                            [🔍 Search]          [+ Tambah User]    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Nama          │ Jabatan      │ Hak Akses              │ Kegiatan Ketua Tim    │ Status  │ Aksi  │
├───────────────┼──────────────┼────────────────────────┼───────────────────────┼─────────┼───────┤
│ Budi Santoso  │ Staf         │ [PEGAWAI] [PPK]        │ SAKERNAS, SUSENAS     │ Aktif   │ ⋯     │
│ Siti Aminah   │ Supervisor   │ [PEGAWAI]              │ -                     │ Aktif   │ ⋯     │
│ Jono Wijoyo   │ Manager      │ [PEGAWAI] [ARSIPARIS]  │ VAKS                  │ Nonaktif│ ⋯     │
└───────────────┴──────────────┴────────────────────────┴───────────────────────┴─────────┴───────┘
                                                                                                   
Legend aksi: ✏️ Edit   👁️ Lihat   🗑️ Hapus                                                
```

### Popup Edit User

```
┌──────────────────────────────────────────────────────────────┐
│ Edit User                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📝 Nama: Budi Santoso                                        │
│ 📧 Email: budi.santoso@bps.go.id                             │
│ 💼 Jabatan: [Staf                                    ]       │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ 👥 Hak Akses:                                                │
│   ☑ PEGAWAI (mandatory)                                      │
│   ☑ PPK                                                      │
│   ☐ PPSPM                                                │
│   ☐ ARSIPARIS                                                │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ 🏆 Kegiatan sebagai Ketua Tim:                                │
│ ┌────────────────────────────────────────────────────┐      │
│ │ [SAKERNAS     x] [SUSENAS x]                        │      │
│ └────────────────────────────────────────────────────┘      │
│                                                              │
│ [+ Tambah Kegiatan]                                          │
│   ▼                                                          │
│   ┌─────────────────┐                                       │
│   │ VAKS             │  ← kegiatan tanpa KT                 │
│   │ SURVEI GELANG    │                                       │
│   │ PODES            │                                       │
│   └─────────────────┘                                        │
│                                                              │
│ ℹ️ Satu kegiatan hanya bisa memiliki 1 ketua tim             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                    [Batal]   [Simpan]        │
└──────────────────────────────────────────────────────────────┘
```

### Popup Tambah User (Create)

```
┌──────────────────────────────────────────────────────────────┐
│ Tambah User                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📧 Email:        [                        ]                   │
│ 🔐 Password:     [                        ]                   │
│ 🔐 Konfirmasi:   [                        ]                   │
│                                                              │
│ 📝 Nama Lengkap: [                        ]                   │
│ 🔢 NIP/NRP:      [                        ]                   │
│ 🏢 Jabatan:      [                        ]                   │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ 👥 Hak Akses:                                                │
│   ☑ PEGAWAI (selalu ada)                                     │
│   ☐ PPK                                                      │
│   ☐ PPSPM                                               │
│   ☐ ARSIPARIS                                                │
│                                                              │
│ 🏆 Kegiatan sebagai Ketua Tim: (opsional)                    │
│   [+ Tambah Kegiatan]                                        │
│   ▼                                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                    [Batal]   [Simpan]        │
└──────────────────────────────────────────────────────────────┘
```

### Halaman Detail User (Lihat)

```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali ke Master User                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 👤 Budi Santoso                                              │
│ 📧 budi.santoso@bps.go.id | NIP: 19850120199031001           │
│ 💼 Staf | Aktif                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📋 Informasi Akun                                            │
│ ┌───────────────────────┬───────────────────────┐            │
│ │ Email                  │ budi.santos@bps.go.id│            │
│ │ NIP/NRP                │ 19850120199031001     │            │
│ │ Jabatan                │ Staf                  │            │
│ │ Status                 │ ● Aktif              │            │
│ │ Tanggal Bergabung      │ 15 Maret 2024        │            │
│ └───────────────────────┴───────────────────────┘            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 👥 Hak Akses                                                 │
│ [PEGAWAI] [PPK]                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🏆 Kegiatan sebagai Ketua Tim                                 │
│ [SAKERNAS] [SUSENAS]                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Riwayat Aktivitas                                         │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Tanggal        │ Aktivitas                  │ Detail   │   │
│ ├────────────────┼────────────────────────────┼───────────┤   │
│ │ 2026-04-28     │ Login                      │ -         │   │
│ │ 2026-04-27     │ Submit Dokumen             │ DOK-123   │   │
│ │ 2026-04-26     │ Mengubah Role              │ PPK       │   │
│ │ 2026-04-25     │ Submit Dokumen             │ DOK-119   │   │
│ │ 2026-04-24     │ Login                      │ -         │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [◀ Prev] Halaman 1 dari 5 [Next ▶]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Halaman Ajukan Dokumen

### Badge Info (Setelah Pilih Kegiatan)

```
┌──────────────────────────────────────────────────────────────┐
│ Ajukan Dokumen                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📁 Fungsi      : [Pilih Fungsi        ▼]                      │
│ 🎯 Kegiatan    : [SAKERNAS 2026      ▼]                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🏆 Anda adalah Ketua Tim di kegiatan ini                 │  │
│ │    Dokumen yang Anda ajukan akan masuk ke Laporan        │  │
│ │    Kegiatan. Anggota tim Anda juga dapat melihat          │  │
│ │    dokumen ini.                                          │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 📄 Jenis       : [Pilih Jenis        ▼]                      │
│ 📁 Kategori    : [Pilih Kategori     ▼]                      │
│ 📝 Detail      : [Pilih Detail       ▼]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Alternative Badge (Jika Anggota)

```
┌──────────────────────────────────────────────────────────────┐
│ 🏅 Anda adalah Anggota di kegiatan ini                      │
│    Dokumen Anda akan masuk ke Laporan Saya.                  │
└──────────────────────────────────────────────────────────────┘
```

### Halaman Review (Tanpa Badge)

```
┌──────────────────────────────────────────────────────────────┐
│ Review & Submit                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📁 Fungsi          : Fungsi Statistik Sosial                 │
│ 🎯 Kegiatan        : SAKERNAS 2026                           │
│ 📄 Jenis           : Kuesioner Rumah Tangga                  │
│ 📁 Kategori        : Sensus Pertanian                        │
│ 📝 Detail          : Pendataan Rumah Tangga                   │
│                                                              │
│ 👤 Pengaju          : Budi Santoso                           │
│ 📅 Tanggal          : 01 Mei 2026                            │
│                                                              │
│ [← Kembali]        [Ajukan Dokumen →]                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Halaman Laporan Kegiatan

```
┌──────────────────────────────────────────────────────────────┐
│ Laporan                                                        │
│ > Laporan Kegiatan                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Laporan Kegiatan                                              │
│ Seluruh dokumen dari kegiatan yang pernah Anda pimpin        │
│ sebagai Ketua Tim.                                           │
│                                                              │
│ 🎯 Filter Kegiatan: [Semua Kegiatan     ▼]                    │
│                    [SAKERNAS 2026    ]                       │
│                    [SUSENAS 2026     ]                       │
│                                                              │
│ 📊 25 dokumen · 8 pegawai                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ No │ Judul Dokumen        │ Kegiatan     │ Pengaju  │ Aksi  │
├─────┼─────────────────────┼──────────────┼──────────┼──────┤
│  1  │ RL-012 SAKERNAS     │ SAKERNAS     │ Budi S.  │ [👁]  │
│  2  │ RL-011 SAKERNAS     │ SAKERNAS     │ Siti A.  │ [👁]  │
│  3  │ RL-010 SUSENAS       │ SUSENAS      │ Jono W.  │ [👁]  │
└─────┴─────────────────────┴──────────────┴──────────┴──────┘
```

---

## Menu Navigation (PEGAWAI)

```
┌────────────────────────────────────────────────┐
│ GENERAL                                       │
│ ├─ 📊 Dashboard                               │
│                                              │
│ MANAGEMENT                                    │
│ ├─ 📝 Ajukan Dokumen                          │
│ ├─ 📋 Dokumen Diajukan                        │
│ ├─ ✏️ Revisi Dokumen                          │
│ ├─ 📄 Laporan Saya                           │
│ └─ 📈 Laporan Kegiatan  ← (muncul jika user  │
│                              punya hak KT)    │
│                                              │
│ ARSIP                                         │
│ └─ 🔍 Cari Arsip                              │
│                                              │
│ SYSTEM                                        │
│ ├─ 📜 Activity Log                           │
│ └─ ⚙️ Settings                               │
└────────────────────────────────────────────────┘
```

---

## Logika Sistem

### 1. Cek Apakah User Chairman di Kegiatan Tertentu

```sql
-- Query untuk cek
SELECT EXISTS(
  SELECT 1 FROM ketua_tim_assignments 
  WHERE user_id = :userId AND kegiatan_id = :kegiatanId
) AS is_chairman;
```

### 2. Ambil Semua Kegiatan Chairman User

```sql
-- Query untuk list kegiatan chairman user
SELECT k.nama as kegiatan_nama, k.id as kegiatan_id
FROM ketua_tim_assignments kta
JOIN master_kegiatan k ON kta.kegiatan_id = k.id
WHERE kta.user_id = :userId
ORDER BY k.nama;
```

### 3. Menu Visibility

```
IF (user ada di ketua_tim_assignments) THEN
  show "Laporan Kegiatan" menu
ELSE
  hide "Laporan Kegiatan" menu
END IF
```

### 4. Auto-Determine Role di Ajukan Dokumen

```
SELECT kegiatan_id FROM form
IF (kegiatan_id ada di ketua_tim_assignments WHERE user_id = currentUser) THEN
  SET is_ketua_tim = TRUE
  SHOW badge "Anda Ketua Tim"
ELSE
  SET is_ketua_tim = FALSE
  SHOW badge "Anda Anggota"
END IF
```

---

## Spec yang Perlu di-Update

### SPEC 06: User Management

**Yang perlu ditambahkan:**

1. **Tabel `ketua_tim_assignments`** - schema baru
2. **Kolom "Kegiatan Ketua Tim"** di Master User table
3. **Popup Edit** dengan manage kegiatan chairman (add/remove dengan dropdown)
4. **Form Create User** dengan opsi assign kegiatan chairman
5. **Halaman Detail User** (`/admin/master-data/user/[id]`) dengan:
   - Info user lengkap
   - Hak akses
   - Daftar kegiatan chairman
   - Activity history table
6. **Constraint:** Satu kegiatan = maksimal 1 chairman

---

## Todo / Action Items

- [ ] Buat migration `013_ketua_tim_assignments.sql`
- [ ] Update API `/api/users` untuk include kegiatan chairman
- [ ] Update API `/api/users/[id]` untuk update kegiatan chairman
- [ ] Update Master User page dengan kolom baru
- [ ] Buat popup Edit dengan manage kegiatan chairman
- [ ] Buat form Tambah User dengan opsi kegiatan chairman
- [ ] Buat halaman Detail User dengan activity history
- [ ] Update Navigation untuk "Laporan Kegiatan" visibility
- [ ] Update Ajukan Dokumen - auto determine chairman/anggota
- [ ] Update Badge display logic
- [ ] Update SPEC 06 dengan perubahan ini

---

## Notes Tambahan

1. Badge hanya tampil di halaman "Ajukan Dokumen" dan "Unggah Dokumen", hilang di "Review"
2. User chairman tetap bisa ajukan dokumen di kegiatan lain sebagai anggota
3. Satu kegiatan hanya bisa punya 1 chairman (constraint di DB)
4. Activity history di halaman detail user perlu tabel baru atau log dari aplikasi