# Section 03: API — Upload, Download & Cleanup

## Context

Section 01 (DB Schema) sudah selesai. Sekarang butuh API untuk upload file ke Supabase Storage dan download via signed URL.

## Objective

File upload endpoint yang menerima file dari client, simpan ke Supabase Storage bucket `dokumen-lampiran`. Download endpoint yang generate signed URL on-demand.

## Prerequisites

- Section 01 selesai (Storage bucket + RLS)
- `supabaseAdmin` client ada di `src/lib/supabase-admin.ts`
- Auth guards tersedia

## Implementation Steps

### 3a. POST /api/upload — Upload File

Route: `src/routes/api/upload.ts`

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { supabaseAdmin } from '~/lib/supabase-admin'

const uploadSchema = z.object({
  kelengkapan_id: z.string().uuid(),
  dokumen_id: z.string().uuid(),
  nama_dokumen: z.string().min(1),
  filename: z.string().min(1),
  content_type: z.string(),
  content: z.instanceof(File).or(z.instanceof(Uint8Array)),
})

export const uploadFile = createServerFn({ method: 'POST' })
  .validator(async ({ request }) => {
    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) throw new Error('File tidak ditemukan')

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, XLS, XLSX')
    }

    // Validate file size (10MB = 10 * 1024 * 1024)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Ukuran file maksimal 10MB')
    }

    return {
      kelengkapan_id: formData.get('kelengkapan_id') as string,
      dokumen_id: formData.get('dokumen_id') as string,
      nama_dokumen: formData.get('nama_dokumen') as string,
      filename: file.name,
      content_type: file.type,
      content: Buffer.from(await file.arrayBuffer()),
    }
  })
  .handler(async ({ data }) => {
    const user = await requireAuth()

    // Generate storage path: [user_id]/[dokumen_id]/[kelengkapan_id]_[timestamp]_[filename]
    const safeFilename = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${data.dokumen_id}/${data.kelengkapan_id}_${Date.now()}_${safeFilename}`

    // Upload to Supabase Storage
    const { data: uploadData, error } = await supabaseAdmin.storage
      .from('dokumen-lampiran')
      .upload(path, data.content, {
        contentType: data.content_type,
        upsert: false,
      })

    if (error) {
      console.error('[UPLOAD_ERROR]', error)
      throw new Error('Gagal mengunggah file. Silakan coba lagi.')
    }

    return {
      url: uploadData.path,
      nama: data.nama_dokumen,
      kelengkapan_id: data.kelengkapan_id,
      uploaded_at: new Date().toISOString(),
    }
  })
```

**Catatan:** Di TanStack Start, parse `FormData` di validator butuh care karena validator berjalan di server. Pastikan `request.formData()` dipanggil di tempat yang benar.

### 3b. GET /api/dokumen/[id]/download/[lampiranIndex] — Download

Route: `src/routes/api/dokumen/[id]/download/[lampiranIndex].ts`

```typescript
export const downloadLampiran = createServerFn({ method: 'GET' })
  .handler(async ({ params }) => {
    const user = await requireAuth()

    // Get dokumen — check ownership
    const dok = await getDokumenById(db, params.id)
    if (!dok) throw new Error('Dokumen tidak ditemukan')

    const isOwner = dok.createdBy === user.id
    const isApprover = await userHasApproverRole(user.id)
    if (!isOwner && !isApprover) {
      throw new Error('Anda tidak memiliki akses')
    }

    // Parse lampiran index
    const index = parseInt(params.lampiranIndex)
    if (isNaN(index) || index < 0 || index >= dok.lampiranUrls.length) {
      throw new Error('Lampiran tidak ditemukan')
    }

    const lampiran = dok.lampiranUrls[index]

    // Generate signed URL (1 hour expiry)
    const { data, error } = await supabaseAdmin.storage
      .from('dokumen-lampiran')
      .createSignedUrl(lampiran.url, 3600) // 1 hour

    if (error || !data) {
      throw new Error('Gagal membuat link download')
    }

    // Return redirect URL — client will navigate to this
    return { signedUrl: data.signedUrl }
  })
```

### 3c. Cleanup Trigger (Supabase SQL)

Tambahkan trigger untuk auto-cleanup orphan files saat dokumen dihapus:

```sql
-- Function to delete files from storage
CREATE OR REPLACE FUNCTION cleanup_dokumen_files()
RETURNS TRIGGER AS $$
DECLARE
  doc_id TEXT;
  user_path TEXT;
BEGIN
  doc_id := OLD.id::text;
  user_path := OLD.created_by::text || '/' || doc_id;

  -- Delete all files in the dokumen's folder
  DELETE FROM storage.objects
  WHERE bucket_id = 'dokumen-lampiran'
  AND name LIKE user_path || '/%';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on dokumen_transaksi delete
CREATE OR REPLACE TRIGGER on_dokumen_delete_cleanup
  AFTER DELETE ON dokumen_transaksi
  FOR EACH ROW EXECUTE FUNCTION cleanup_dokumen_files();
```

**Catatan:** Trigger ini berjalan di Supabase (PostgreSQL), bukan di aplikasi. Jalankan via Supabase Dashboard → SQL Editor.

## Files to Create/Modify

- `src/routes/api/upload.ts` — POST upload
- `src/routes/api/dokumen/[id]/download/[lampiranIndex].ts` — GET download
- `supabase/migrations/004_storage_cleanup.sql` — cleanup trigger (via Dashboard)

## Test Stubs (from TDD Plan)

- [ ] POST /api/upload accepts valid PDF file < 10MB
- [ ] POST /api/upload returns { url, nama, kelengkapan_id, uploaded_at }
- [ ] GET /api/dokumen/[id]/download/[index] returns signed URL
- [ ] POST /api/upload with file > 10MB returns 400
- [ ] POST /api/upload with .exe returns 400
- [ ] POST /api/upload without auth returns 401
- [ ] Non-owner download attempt returns 403

## Definition of Done

- [ ] Upload accepts PDF, DOC, DOCX, XLS, XLSX under 10MB
- [ ] Upload rejects files > 10MB with clear error
- [ ] Upload rejects disallowed file types
- [ ] Download generates signed URL with 1-hour expiry
- [ ] Cleanup trigger deletes files when dokumen_transaksi is deleted
- [ ] All endpoints protected by auth guards
