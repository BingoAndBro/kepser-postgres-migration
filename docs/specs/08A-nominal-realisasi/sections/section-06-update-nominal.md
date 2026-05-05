# Section 06: Update Nominal Endpoint

## Context

User mungkin perlu mengoreksi nominal setelah dokumen dibuat. Endpoint ini memungkinkan update dengan authorization check yang tepat.

## Objective

Buat endpoint PATCH untuk update `nominal_realisasi` pada dokumen yang sudah ada.

## Prerequisites

- Section 01 (SQL Migration) harus selesai
- Section 02 (Drizzle Schema) harus selesai
- Section 03 (Zod Schema) harus selesai

## Implementation Steps

### 6.1 Buat File Endpoint

Buat `src/routes/api/dokumen/[id]/nominal.ts`

Struktur folder mungkin berbeda — cek existing pattern di `src/routes/api/dokumen/`.

### 6.2 Implement Handler

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'
import { updateNominalSchema } from '#/lib/schemas/dokumen'
import { validateNominalForMaterial } from '#/lib/schemas/dokumen'
import { insertLog } from '#/lib/dokumen-helpers'

export const Route = createFileRoute('/api/dokumen/$id/nominal')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        // 1. Auth check
        const supabase = createServerSupabaseClient(request)
        const session = await getServerSession(supabase)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Get dokumen
        const { data: dok } = await supabase
          .from('dokumen_transaksi')
          .select('id, created_by, status, is_non_material, nominal_realisasi')
          .eq('id', params.id)
          .single()

        if (!dok) {
          return Response.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
        }

        // 3. Authorization check
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role:roles(nama)')
          .eq('user_id', session.user.id)

        const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
        const isCreator = dok.created_by === session.user.id
        const isArsiparis = roleNames.includes('ARSIPARIS')
        const isAdmin = roleNames.includes('SUPERADMIN') || roleNames.includes('ADMIN')

        if (!isCreator && !isArsiparis && !isAdmin) {
          return Response.json({ error: 'Akses ditolak' }, { status: 403 })
        }

        // 4. Parse body
        const body = await request.json()
        const parsed = updateNominalSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ 
            error: 'Validasi gagal', 
            details: parsed.error.flatten() 
          }, { status: 400 })
        }

        // 5. Check status
        if (dok.status === 'ARCHIVED') {
          return Response.json(
            { error: 'Tidak bisa update dokumen yang sudah diarsipkan' },
            { status: 400 }
          )
        }

        // 6. Validate material requirement
        const isNonMaterial = parsed.data.is_non_material ?? dok.is_non_material
        const nominalRealisasi = parsed.data.nominal_realisasi ?? dok.nominal_realisasi

        const validation = validateNominalForMaterial(isNonMaterial, nominalRealisasi)
        if (!validation.valid) {
          return Response.json({ error: validation.error }, { status: 400 })
        }

        // 7. Update
        const updatePayload: Record<string, any> = {}
        if (parsed.data.nominal_realisasi !== undefined) {
          updatePayload.nominal_realisasi = parsed.data.nominal_realisasi
        }
        if (parsed.data.is_non_material !== undefined) {
          updatePayload.is_non_material = parsed.data.is_non_material
        }

        const { error } = await supabase
          .from('dokumen_transaksi')
          .update(updatePayload)
          .eq('id', params.id)

        if (error) {
          return Response.json({ error: 'Update gagal' }, { status: 500 })
        }

        // 8. Log aktivitas
        await insertLog(supabase, {
          dokumenId: params.id,
          userId: session.user.id,
          aksi: 'UPDATE_NOMINAL',
          catatan: `Update nominal: ${nominalRealisasi}`,
        })

        return Response.json({ success: true })
      }
    }
  }
})
```

## Files to Create/Modify

- `src/routes/api/dokumen/[id]/nominal.ts` — Create

## Test Stubs

- [ ] Creator bisa update nominal pada dokumen miliknya
- [ ] Arsiparis bisa update nominal pada dokumen apapun
- [ ] Admin bisa update nominal pada dokumen apapun
- [ ] User biasa tidak bisa update → 403
- [ ] Update pada dokumen tidak ada → 404
- [ ] Update pada dokumen ARCHIVED → 400
- [ ] Update dengan null pada Non-Material → berhasil
- [ ] Update dengan null pada Material → 400
- [ ] Log aktivitas tercipta setelah update

## Definition of Done

- [ ] Endpoint PATCH `/api/dokumen/[id]/nominal` ada dan berfungsi
- [ ] Authorization check: creator, arsiparis, atau admin
- [ ] Validasi material requirement applies
- [ ] Status ARCHIVED tidak bisa diupdate
- [ ] Audit log tercipta untuk setiap update
- [ ] Test stubs untuk happy path dan authorization cases