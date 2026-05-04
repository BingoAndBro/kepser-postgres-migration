# Section 03: API Endpoints - User Chairman Check

## Context

Setelah database functions terbuat (Section 01), kita perlu API endpoints untuk user mengecek status chairman mereka sendiri. Endpoint ini akan digunakan oleh AppLayout (menu visibility) dan Ajukan Dokumen (auto-detect badge).

## Objective

Membuat API endpoints untuk:
1. Get current user's chairman kegiatan (GET /api/users/me/ketua-tim)
2. Check apakah current user chairman di kegiatan tertentu (GET /api/users/me/is-ketua-tim/[kegiatan_id])

## Prerequisites

- Section(s) yang harus selesai dulu: **01 (Database Migration)**
- Files/modules yang harus sudah tersedia:
  - Function `is_user_chairman()` dan `get_user_chairman_kegiatan()` sudah ada
  - API pattern dari Section 02

## Implementation Steps

### 3.1 GET /api/users/me/ketua-tim

Endpoint ini digunakan oleh AppLayout untuk cek apakah user punya menu "Laporan Kegiatan".

```typescript
// src/routes/api/users/me/ketua-tim.ts (atau update existing file)
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'

function createClient(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const mockEvent = { request, cookie: { get: () => undefined, set: () => {}, delete: () => {} } } as any
  return createServerSupabaseClient(mockEvent, cookieHeader)
}

export const Route = createFileRoute('/api/users/me/ketua-tim')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use function get_user_chairman_kegiatan(user_id)
        const { data, error } = await supabase
          .rpc('get_user_chairman_kegiatan', { p_user_id: session.user.id })

        if (error) {
          console.error('[API] get_user_chairman_kegiatan error:', error)
          return Response.json({ error: 'Gagal mengambil data' }, { status: 500 })
        }

        const kegiatan = (data ?? []).map((row: { kegiatan_id: string; kegiatan_nama: string }) => ({
          id: row.kegiatan_id,
          nama: row.kegiatan_nama,
        }))

        return Response.json({
          is_ketua_tim: kegiatan.length > 0,
          kegiatan,
        })
      }
    }
  }
})
```

### 3.2 GET /api/users/me/is-ketua-tim/[kegiatan_id]

Endpoint ini digunakan oleh Ajukan Dokumen untuk auto-detect peran user.

```typescript
// src/routes/api/users/me/is-ketua-tim/[kegiatan_id].ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/users/me/is-ketua-tim/[kegiatan_id]')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { kegiatan_id: string } }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { kegiatan_id } = params

        if (!kegiatan_id) {
          return Response.json({ error: 'kegiatan_id wajib diisi' }, { status: 400 })
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(kegiatan_id)) {
          return Response.json({ error: 'Format kegiatan_id tidak valid' }, { status: 400 })
        }

        // Use function is_user_chairman(user_id, kegiatan_id)
        const { data, error } = await supabase
          .rpc('is_user_chairman', {
            p_user_id: session.user.id,
            p_kegiatan_id: kegiatan_id
          })

        if (error) {
          console.error('[API] is_user_chairman error:', error)
          return Response.json({ error: 'Gagal memeriksa status chairman' }, { status: 500 })
        }

        return Response.json({
          is_ketua_tim: data === true,
        })
      }
    }
  }
})
```

## Files to Create/Modify

- `src/routes/api/users/me/ketua-tim.ts` — **CREATE** (atau append ke existing file jika ada)
- `src/routes/api/users/me/is-ketua-tim/[kegiatan_id].ts` — **CREATE**

## Test Stubs

### Happy Path
- [ ] GET /api/users/me/ketua-tim return `{ is_ketua_tim: true, kegiatan: [...] }` untuk chairman
- [ ] GET /api/users/me/ketua-tim return `{ is_ketua_tim: false, kegiatan: [] }` untuk non-chairman
- [ ] GET /api/users/me/is-ketua-tim/[kegiatan_id] return `{ is_ketua_tim: true }` jika chairman
- [ ] GET /api/users/me/is-ketua-tim/[kegiatan_id] return `{ is_ketua_tim: false }` jika bukan chairman

### Edge Cases
- [ ] kegiatan_id tidak valid UUID return 400
- [ ] User tidak login return 401

### Error Cases
- [ ] Database error return 500 dengan proper error message

## Definition of Done

- [ ] GET /api/users/me/ketua-tim berfungsi dengan benar
- [ ] GET /api/users/me/is-ketua-tim/[kegiatan_id] berfungsi dengan benar
- [ ] Response structure sesuai spec
- [ ] Error handling proper
- [ ] Authorization check berfungsi (authenticated users only)