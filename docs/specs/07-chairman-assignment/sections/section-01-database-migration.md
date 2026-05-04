# Section 01: Database Migration

## Context

Ini adalah langkah pertama dalam implementasi SPEC 07. Tidak ada dependensi dari section lain — kita membangun fondasi database.

## Objective

Membuat tabel `ketua_tim_assignments` dengan constraint yang benar, indexes untuk performance, RLS policies untuk security, dan helper functions untuk query.

## Prerequisites

- Section(s) yang harus selesai dulu: **None** (baseline)
- Files/modules yang harus sudah tersedia: **None**

## Implementation Steps

### 1.1 Create Migration File

Buat file `supabase/migrations/014_chairman_assignment.sql`.

### 1.2 Enable btree_gist Extension (Optional)

Extension ini dibutuhkan untuk EXCLUDE constraint, tapi karena kita menggunakan UNIQUE constraint instead, extension ini tidak diperlukan. Skip这一步.

### 1.3 Create Table Schema

```sql
CREATE TABLE IF NOT EXISTS ketua_tim_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kegiatan_id uuid NOT NULL REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT ketua_tim_kegiatan_unique UNIQUE (kegiatan_id)
);

COMMENT ON TABLE ketua_tim_assignments IS 'Assignment user sebagai Ketua Tim pada kegiatan tertentu. 1 kegiatan = 1 chairman, 1 user = unlimited chairman assignments.';
COMMENT ON COLUMN ketua_tim_assignments.user_id IS 'User yang ditunjuk sebagai chairman';
COMMENT ON COLUMN ketua_tim_assignments.kegiatan_id IS 'Kegiatan dimana user ditunjuk sebagai chairman';
```

**Why UNIQUE instead of EXCLUDE:** Lebih simple, tidak butuh extension tambahan, dan constraint lebih obvious.

### 1.4 Create Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ketua_tim_user_id ON ketua_tim_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ketua_tim_kegiatan_id ON ketua_tim_assignments(kegiatan_id);
```

### 1.5 Create RLS Policies

```sql
ALTER TABLE ketua_tim_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can SELECT (needed for badge check and menu visibility)
CREATE POLICY "ketua_tim_select_all" ON ketua_tim_assignments
  FOR SELECT USING (true);

-- Only ADMIN can INSERT
CREATE POLICY "ketua_tim_insert_admin" ON ketua_tim_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nama = 'ADMIN'
    )
  );

-- Only ADMIN can UPDATE (for future use)
CREATE POLICY "ketua_tim_update_admin" ON ketua_tim_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nama = 'ADMIN'
    )
  );

-- Only ADMIN can DELETE
CREATE POLICY "ketua_tim_delete_admin" ON ketua_tim_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nama = 'ADMIN'
    )
  );
```

### 1.6 Create Helper Functions

**Function: is_user_chairman**
```sql
CREATE OR REPLACE FUNCTION is_user_chairman(
  p_user_id uuid,
  p_kegiatan_id uuid
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM ketua_tim_assignments
    WHERE user_id = p_user_id AND kegiatan_id = p_kegiatan_id
  );
END;
$$;

COMMENT ON FUNCTION is_user_chairman(uuid, uuid) IS 'Cek apakah user adalah chairman di kegiatan tertentu. Returns true/false.';
```

**Function: get_user_chairman_kegiatan**
```sql
CREATE OR REPLACE FUNCTION get_user_chairman_kegiatan(
  p_user_id uuid
) RETURNS TABLE(kegiatan_id uuid, kegiatan_nama text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT kta.kegiatan_id, mk.nama as kegiatan_nama
  FROM ketua_tim_assignments kta
  JOIN master_kegiatan mk ON kta.kegiatan_id = mk.id
  WHERE kta.user_id = p_user_id
  ORDER BY mk.nama;
END;
$$;

COMMENT ON FUNCTION get_user_chairman_kegiatan(uuid) IS 'Get semua kegiatan dimana user adalah chairman. Returns table of kegiatan_id and kegiatan_nama.';
```

## Files to Create/Modify

- `supabase/migrations/014_chairman_assignment.sql` — **CREATE**

## Test Stubs (dari TDD plan)

### Happy Path
- [ ] Migration berhasil tanpa error
- [ ] Tabel `ketua_tim_assignments` terbuat dengan kolom yang benar
- [ ] UNIQUE constraint pada kegiatan_id berfungsi
- [ ] Indexes terbuat untuk user_id dan kegiatan_id
- [ ] RLS policies terbuat
- [ ] Function `is_user_chairman()` return true/false dengan benar
- [ ] Function `get_user_chairman_kegiatan()` return data dengan benar

### Edge Cases
- [ ] Cascade delete works saat user dihapus
- [ ] Cascade delete works saat kegiatan dihapus

### Error Cases
- [ ] UNIQUE constraint prevent duplicate kegiatan_id

## Definition of Done

- [ ] Migration file `014_chairman_assignment.sql` terbuat
- [ ] Tabel terbuat dengan semua kolom dan constraint
- [ ] Indexes terbuat untuk query optimization
- [ ] RLS policies aktif untuk SELECT (all) dan DML (ADMIN only)
- [ ] Function `is_user_chairman()` berfungsi dengan benar
- [ ] Function `get_user_chairman_kegiatan()` berfungsi dengan benar
- [ ] Tidak ada error saat run migration