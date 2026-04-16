# Section 01: Database Migration & Schema

## Context

Spec 01 (Auth & RBAC) dan Spec 02 (Master Data) sudah selesai. Tabel `auth.users`, `roles`, `user_roles`, `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen` sudah ada. Spec 03 perlu menambah tabel untuk dokumen_transaksi dan log_aktivitas.

## Objective

Tabel `dokumen_transaksi` dan `log_aktivitas` ada di database dengan Drizzle schema, migration SQL, RLS policies, dan Supabase Storage bucket.

## Prerequisites

- Spec 01 + Spec 02 migration sudah berjalan
- `src/lib/db/schema.ts` sudah ada dengan tabel existing
- `src/lib/db/index.ts` (Drizzle client) sudah ada
- `.env` punya `DATABASE_URL` dan `SUPABASE_URL`

## Implementation Steps

### 1a. Edit Drizzle Schema (`src/lib/db/schema.ts`)

Tambahkan definisi tabel `dokumenTransaksi` dan `logAktivitas` ke schema yang sudah ada. Lihat pattern dari tabel existing (uuid PK, withTimezone timestamp, references dengan onDelete strategy).

**`dokumenTransaksi` fields:**
- `id`: uuid PK defaultRandom()
- `judul`: text NOT NULL
- `fungsiId`: uuid FK → `masterFungsi.id`, `onDelete: 'restrict'`
- `kegiatanJenisId`: uuid FK → `masterKegiatan.id`, `onDelete: 'restrict'`
- `isKetuaTim`: boolean NOT NULL DEFAULT false
- `status`: text NOT NULL DEFAULT 'DRAFT'
- `currentStep`: text (nullable)
- `revisionTarget`: text (nullable)
- `revisionNotes`: text (nullable)
- `lampiranUrls`: jsonb DEFAULT '[]' — array of lampiran entries
- `tahun`: integer (user input year)
- `tanggal`: date (user input date)
- `createdBy`: uuid FK → `auth.users`, `onDelete: 'cascade'`
- `createdAt`: timestamp withTimezone DEFAULT now()
- `updatedAt`: timestamp withTimezone DEFAULT now()

**`logAktivitas` fields:**
- `id`: uuid PK defaultRandom()
- `dokumenId`: uuid FK → `dokumenTransaksi.id`, `onDelete: 'cascade'`
- `userId`: uuid FK → `auth.users`, `onDelete: 'cascade'`
- `aksi`: text NOT NULL (enum: SUBMIT, RESUBMIT, PPK_APPROVE, PPK_REJECT, BENDAHARA_APPROVE, BENDAHARA_REJECT, ARCHIVE, ARCHIVE_SKIP)
- `catatan`: text (nullable)
- `stepUrutan`: integer (nullable)
- `timestamp`: timestamp withTimezone DEFAULT now()

**Export types:** `$inferSelect` dan `$inferInsert` untuk kedua tabel.

### 1b. Generate Drizzle Migration

```bash
pnpm drizzle-kit generate --name 003_dokumen_transaksi
```

Review file `supabase/migrations/003_dokumen_transaksi.sql` — pastikan:
- PK = uuid dengan defaultRandom()
- FK constraints dengan ON DELETE yang benar
- jsonb type untuk lampiran_urls
- Timestamp dengan WITH TIME ZONE

**NOTE:** Drizzle default migration syntax mungkin berbeda dari Supabase. Jika `gen_random_uuid()` tidak muncul, ganti dengan `gen_random_uuid()` atau `public.gen_random_uuid()`.

### 1c. Apply Migration

Dev: `pnpm drizzle-kit push`
Prod: Copy SQL → Supabase Dashboard → SQL Editor → Execute

### 1d. Supabase Storage Bucket

Di Supabase Dashboard → Storage → New Bucket:
- Name: `dokumen-lampiran`
- Public: **OFF** (private — signed URLs only)
- File size limit: 10MB

### 1e. RLS Policies untuk dokumen_transaksi

```sql
-- Enable RLS
ALTER TABLE dokumen_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

-- dokumen_transaksi: PEGAWAI can see/edit own records
CREATE POLICY "pegawai_select_own_dokumen" ON dokumen_transaksi
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "pegawai_insert_own_dokumen" ON dokumen_transaksi
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Update hanya untuk NEED_REVISION target USER
CREATE POLICY "pegawai_update_own_dokumen" ON dokumen_transaksi
  FOR UPDATE USING (
    auth.uid() = created_by
    AND status = 'NEED_REVISION'
    AND revision_target = 'USER'
  );

-- dokumen_transaksi: PPK can see documents in their step
CREATE POLICY "ppk_select_dokumen" ON dokumen_transaksi
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN')
    )
  );

-- log_aktivitas: owner or dokumen creator can read
CREATE POLICY "log_read" ON log_aktivitas
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM dokumen_transaksi dt
      WHERE dt.id = dokumen_id AND dt.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN')
    )
  );

CREATE POLICY "log_insert" ON log_aktivitas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 1f. RLS Policies untuk Storage

```sql
-- Storage bucket RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can upload to their own folder
CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dokumen-lampiran'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can read files in their own folder OR if they own the dokumen
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dokumen-lampiran'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM dokumen_transaksi dt
        WHERE dt.id::text = (storage.foldername(name))[2]
        AND dt.created_by = auth.uid()
      )
    )
  );

-- Users can delete own files only
CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dokumen-lampiran'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Files to Create/Modify

- `src/lib/db/schema.ts` — tambah dokumenTransaksi + logAktivitas
- `supabase/migrations/003_dokumen_transaksi.sql` — generated, review & apply
- RLS policies — via Supabase Dashboard atau raw SQL migration
- `supabase/migrations/003_storage_rls.sql` — RLS untuk storage (bisa digabung atau pisah)

## Test Stubs (from TDD Plan)

- [ ] Migration generates correct SQL for dokumen_transaksi table
- [ ] Migration generates correct SQL for log_aktivitas table
- [ ] RLS policies are created correctly
- [ ] Storage bucket is created (private)
- [ ] Storage RLS policies allow upload by authenticated users

## Definition of Done

- [ ] `src/lib/db/schema.ts` has dokumenTransaksi + logAktivitas with correct types exported
- [ ] Migration SQL reviewed and applied to Supabase
- [ ] Storage bucket `dokumen-lampiran` exists (private)
- [ ] All RLS policies applied
- [ ] `pnpm build` succeeds without type errors
