# Section 01: Database Schema & Migration

## Context

Belum ada tabel master data. Spec 01 hanya punya `roles` dan `user_roles`. Kita perlu extend dengan 3 tabel baru.

## Objective

- Schema Drizzle lengkap untuk `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen`
- SQL migration file `002_master_data.sql` untuk dijalankan di Supabase
- Seed data: 6 fungsi BPS + contoh kegiatan + kelengkapan SAKERNAS

## Prerequisites

- Section(s) yang harus selesai dulu: **none**
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (existing — extend)
  - `src/lib/db/index.ts` (existing — auto-export)
  - `supabase/migrations/001_auth_rbac.sql` (existing — seed di-append ke migration baru)

## Implementation Steps

### 1a. Extend Drizzle Schema

Edit `src/lib/db/schema.ts` — tambahkan di bawah existing `roles` dan `userRoles`:

```typescript
// master_fungsi: departemen/fungsi BPS
export const masterFungsi = pgTable('master_fungsi', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull().unique(),
  deskripsi: text('deskripsi'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// master_kegiatan: jenis kegiatan per fungsi
export const masterKegiatan = pgTable('master_kegiatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  fungsiId: uuid('fungsi_id').notNull().references(() => masterFungsi.id, { onDelete: 'restrict' }),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// master_kelengkapan_dokumen: dokumen wajib per kegiatan × role
export const masterKelengkapanDokumen = pgTable('master_kelengkapan_dokumen', {
  id: uuid('id').primaryKey().defaultRandom(),
  kegiatanId: uuid('kegiatan_id').notNull().references(() => masterKegiatan.id, { onDelete: 'cascade' }),
  isKetuaTim: boolean('is_ketua_tim').notNull(),
  namaDokumen: text('nama_dokumen').notNull(),
  required: boolean('required').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports
export type MasterFungsi = typeof masterFungsi.$inferSelect
export type NewMasterFungsi = typeof masterFungsi.$inferInsert
export type MasterKegiatan = typeof masterKegiatan.$inferSelect
export type NewMasterKegiatan = typeof masterKegiatan.$inferInsert
export type MasterKelengkapan = typeof masterKelengkapanDokumen.$inferSelect
export type NewMasterKelengkapan = typeof masterKelengkapanDokumen.$inferInsert
```

**Catatan**: `onDelete: 'restrict'` di `fungsiId` berarti tidak bisa hapus fungsi yang punya kegiatan. `onDelete: 'cascade'` di `kegiatanId` di kelengkapan berarti jika kegiatan dihapus, kelampirannya ikut hilang.

### 1b. Create SQL Migration

Buat `supabase/migrations/002_master_data.sql`:

```sql
-- Master Data Tables
CREATE TABLE IF NOT EXISTS master_fungsi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  deskripsi text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS master_kegiatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fungsi_id uuid NOT NULL REFERENCES master_fungsi(id) ON DELETE RESTRICT,
  nama text NOT NULL,
  deskripsi text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS master_kelengkapan_dokumen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id uuid NOT NULL REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  is_ketua_tim boolean NOT NULL,
  nama_dokumen text NOT NULL,
  required boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_kegiatan_fungsi_id ON master_kegiatan(fungsi_id);
CREATE INDEX IF NOT EXISTS idx_master_kelengkapan_kegiatan_id ON master_kelengkapan_dokumen(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_master_fungsi_is_active ON master_fungsi(is_active);
CREATE INDEX IF NOT EXISTS idx_master_kegiatan_is_active ON master_kegiatan(is_active);

-- Seed Data: 6 Fungsi BPS
INSERT INTO master_fungsi (nama, deskripsi) VALUES
  ('Sosial', 'Bidang Sosial — statistik kependudukan dan kesejahteraan'),
  ('Distribusi', 'Bidang Distribusi — statistik perdagangan dan harga'),
  ('Neraca', 'Bidang Neraca — neraca pembayaran dan lingkungan'),
  ('Produksi', 'Bidang Produksi — statistik pertanian dan industri'),
  ('Umum', 'Bidang Umum — administrasi dan kepegawaian'),
  ('IPDS', 'Bidang IPDS — integrasi pengolahan data statistik')
ON CONFLICT (nama) DO NOTHING;

-- Seed Data: Kegiatan per Fungsi
INSERT INTO master_kegiatan (fungsi_id, nama, deskripsi) (
  SELECT id, 'SAKERNAS', 'Survei Angkatan Kerja Nasional — pengangguran dan kesempatan kerja', 'Sosial' FROM master_fungsi WHERE nama = 'Sosial'
), (
  SELECT id, 'SUSENAS', 'Survei Sosial Ekonomi Nasional — konsumsi dan pengeluaran rumah tangga', 'Sosial' FROM master_fungsi WHERE nama = 'Sosial'
), (
  SELECT id, 'PODES', 'Potensi Desa — karakteristik desa dan wilayah', 'Sosial' FROM master_fungsi WHERE nama = 'Sosial'
), (
  SELECT id, 'Survei Harga', 'Survei Harga Konsumen dan Produsen', 'Distribusi' FROM master_fungsi WHERE nama = 'Distribusi'
), (
  SELECT id, 'Survei Perdagangan', 'Survei Statistik Perdagangan Luar Negeri', 'Distribusi' FROM master_fungsi WHERE nama = 'Distribusi'
), (
  SELECT id, 'Neraca Pengeluaran', 'Neraca Pengeluaran Konsumsi Rumah Tangga', 'Neraca' FROM master_fungsi WHERE nama = 'Neraca'
), (
  SELECT id, 'Survei Produksi', 'Survei Produksi Tanaman Pangan', 'Produksi' FROM master_fungsi WHERE nama = 'Produksi'
), (
  SELECT id, 'Administrasi', 'Administrasi Perkantoran dan Kearsipan', 'Umum' FROM master_fungsi WHERE nama = 'Umum'
), (
  SELECT id, 'Pengolahan Data', 'Pengolahan dan Validasi Data Statistik', 'IPDS' FROM master_fungsi WHERE nama = 'IPDS'
) ON CONFLICT DO NOTHING;

-- Seed Data: Kelengkapan SAKERNAS (Ketua Tim)
INSERT INTO master_kelengkapan_dokumen (kegiatan_id, is_ketua_tim, nama_dokumen, required) (
  SELECT id, true, 'Surat Tugas', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, true, 'KAK (Kerangka Acuan Kerja)', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, true, 'Proposal Kegiatan', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, true, 'Form Permintaan', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, true, 'Surat Keterangan Kendaraan Dinas', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, true, 'Laporan Pertanggungjawaban', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
) ON CONFLICT DO NOTHING;

-- Seed Data: Kelengkapan SAKERNAS (Anggota)
INSERT INTO master_kelengkapan_dokumen (kegiatan_id, is_ketua_tim, nama_dokumen, required) (
  SELECT id, false, 'Surat Tugas', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, false, 'KAK (Kerangka Acuan Kerja)', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
), (
  SELECT id, false, 'Laporan Pelaksanaan', true FROM master_kegiatan WHERE nama = 'SAKERNAS'
) ON CONFLICT DO NOTHING;
```

## Files to Create/Modify

- `src/lib/db/schema.ts` — **MODIFY**: add three tables + type exports
- `supabase/migrations/002_master_data.sql` — **CREATE**: CREATE TABLE + seed data

## Test Stubs

- Schema `masterFungsi` has correct fields
- Schema `masterKegiatan` has FK to `masterFungsi`
- Schema `masterKelengkapanDokumen` has FK to `masterKegiatan`
- Types are exported correctly
- SQL migration runs without errors on Supabase
- Seed data creates 6 fungsi, 9 kegiatan, 9 kelengkapan

## Definition of Done

- [ ] `src/lib/db/schema.ts` extended dengan 3 tabel master data
- [ ] All type exports available
- [ ] `002_master_data.sql` created dan bisa dijalankan
- [ ] Seed data: 6 fungsi, kegiatan contoh, kelengkapan SAKERNAS ter-seed
- [ ] Build succeeds tanpa error
