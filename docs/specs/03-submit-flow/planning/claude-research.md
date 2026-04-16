# Research — Spec 03: Submit Flow

## Codebase Research Summary

> ⚠️ LENGKAPKAN SETELAH AGENT SELESAI

### 1. Existing Routes

TBD — agent exploring

### 2. FSM File

TBD — agent exploring

### 3. Zod Schemas

TBD — agent exploring

### 4. DB Schema (dokumen_transaksi)

**Known from AGENTS.md + spec:**
- `id`: uuid PK
- `judul`: text NOT NULL
- `fungsi_id`: uuid FK → master_fungsi
- `kegiatan_jenis_id`: uuid FK → master_kegiatan
- `is_ketua_tim`: boolean
- `status`: StatusDokumen enum
- `current_step`: 'PPK' | 'BENDAHARA' | null
- `revision_target`: 'USER' | 'PPK' | null
- `revision_notes`: text
- `lampiran_urls`: jsonb — array of `{ kelengkapan_id, nama, url, uploaded_at }`
- `created_by`: uuid FK → auth.users
- `created_at`, `updated_at`: timestamp

**Fields tambahan dari interview:**
- `tahun`: integer (user input, tahun ajaran/kegiatan)
- `tanggal`: date (user input, tanggal pengajuan)

### 5. Auth Guards

**Known from Spec 01:**
- `requireAuth()` — validate session, return user
- `guardRole(roles[])` — check user has required role
- `guardAnyRole()` — check user has at least one role
- `getActiveRoleFromCookie()` — read active role from cookie

### 6. Existing Components

TBD — agent exploring

### 7. Supabase Client

**Known:**
- `supabase` client (anon key) — untuk client-side operations
- `supabaseAdmin` client (service role key) — untuk server-side admin operations
- Upload memerlukan `supabaseAdmin` atau signed upload URL

### 8. Upload Pattern (Best Practice)

Supabase Storage upload pattern untuk TanStack Start:

**Option A: Direct Upload (small files)**
- Client → Server Function → Supabase Storage
- File di-read sebagai `FormData`, di-upload via `supabase.storage.from().upload()`

**Option B: Signed URL Upload (recommended for large files)**
- Server generates signed upload URL
- Client uploads directly to Storage via signed URL
- Pros: server tidak bottleneck oleh upload besar
- Cons: lebih kompleks

**Decision MVP:** Option A (Direct Upload) cukup untuk MVP — file max 10MB, tidak besar. Simpler to implement.

### 9. RLS Policies Needed

**dokumen_transaksi:**
- PEGAWAI: SELECT + UPDATE own records only (`created_by = auth.uid()`)
- PPK/BENDAHARA/ARSIPARIS: SELECT records in their step
- ADMIN: SELECT all

**master_fungsi, master_kegiatan, master_kelengkapan_dokumen:**
- SELECT: authenticated users
- INSERT/UPDATE/DELETE: ADMIN only

**log_aktivitas:**
- SELECT: owner + approvers
- INSERT: authenticated users
- NO UPDATE/DELETE (append-only)

### 10. Migration Needed

**Migration 003: dokumen_transaksi + log_aktivitas**

```sql
-- dokumen_transaksi table
CREATE TABLE dokumen_transaksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  fungsi_id uuid REFERENCES master_fungsi(id),
  kegiatan_jenis_id uuid REFERENCES master_kegiatan(id),
  is_ketua_tim boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'DRAFT',
  current_step text,
  revision_target text,
  revision_notes text,
  lampiran_urls jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- log_aktivitas table
CREATE TABLE log_aktivitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id uuid REFERENCES dokumen_transaksi(id),
  user_id uuid REFERENCES auth.users(id),
  aksi text NOT NULL,
  catatan text,
  step_urutan integer,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dokumen_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

-- RLS policies untuk dokumen_transaksi
CREATE POLICY "users_see_own" ON dokumen_transaksi
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "users_insert_own" ON dokumen_transaksi
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "users_update_own_draft" ON dokumen_transaksi
  FOR UPDATE USING (auth.uid() = created_by AND status = 'NEED_REVISION');

-- RLS untuk log_aktivitas
CREATE POLICY "log_read_access" ON log_aktivitas
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM dokumen_transaksi WHERE id = dokumen_id AND created_by = auth.uid())
  );

CREATE POLICY "log_insert" ON log_aktivitas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('dokumen-lampiran', 'dokumen-lampiran', false);

-- Storage RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_upload_own_files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_read_own_files" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 11. Key Decisions

1. **Upload**: Direct upload via `supabaseAdmin.storage.from().upload()` (MVP simplicity)
2. **Signed URL for download**: On-demand via `supabaseAdmin.storage.from().createSignedUrl()`
3. **Judul formula**: `[Nama Kegiatan] [Tahun] [Nama Pegawai]`
4. **Cleanup**: Supabase Database Trigger untuk auto-delete orphan files
5. **Year input**: Dropdown dengan range 5 tahun ke belakang + 2 tahun ke depan dari tahun saat ini
6. **Tanggal input**: Date picker
7. **Step flow**: Fungsi+Tahun+Tanggal → Kegiatan → Ketua Tim? → Upload → Review
