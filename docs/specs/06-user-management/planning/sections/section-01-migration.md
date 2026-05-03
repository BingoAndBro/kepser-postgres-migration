# Section 01: Database Migration (RLS Policies)

## Context

Spec 01 sudah membuat tabel `user_roles` dan `roles`, tapi belum ada RLS policies untuk read operations. Master User page perlu bisa read semua user roles untuk display badge di tabel.

## Objective

Tambah RLS policies untuk `user_roles` table agar:
- Admin bisa read semua user roles
- User bisa read roles miliknya sendiri

## Prerequisites
- Tables `user_roles` dan `roles` sudah ada (Spec 01)
- Migration folder sudah ada

## Implementation Steps

### 1. Buat Migration File

Buat file `supabase/migrations/013_user_management_rls.sql`:

```sql
-- Enable RLS on user_roles if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can read all user_roles
CREATE POLICY "Admin can select all user_roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      -- User is ADMIN
      EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r ON ur2.role_id = r.id
        WHERE ur2.user_id = auth.uid() AND r.nama = 'ADMIN'
      )
      OR
      -- User reading their own roles
      user_id = auth.uid()
    )
  )
);

-- Policy: Service role (admin client) bypasses RLS
-- This is automatic with service role key
```

### 2. Verifikasi Migration

1. Check bahwa migration bisa run tanpa error
2. Verify RLS enabled on user_roles
3. Verify policies created correctly

## Files to Create/Modify
- `supabase/migrations/013_user_management_rls.sql` — new file

## Test Stubs
- [ ] RLS enabled on user_roles
- [ ] Admin can SELECT all user_roles
- [ ] Regular user can SELECT own user_roles
- [ ] Regular user cannot SELECT other user's user_roles

## Definition of Done
- [ ] Migration file created
- [ ] Migration runs without error
- [ ] RLS policies verified in database
- [ ] Admin can read all roles
- [ ] Users can read own roles only
