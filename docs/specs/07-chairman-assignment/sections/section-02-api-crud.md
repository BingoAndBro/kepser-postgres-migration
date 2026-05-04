# Section 02: API Endpoints - Chairman Assignment CRUD

## Context

Setelah database migration selesai (Section 01), kita perlu API endpoints untuk admin mengelola chairman assignments. API ini akan digunakan oleh Master User page.

## Objective

Membuat API endpoints untuk:
1. List semua chairman assignments (GET /api/ketua-tim)
2. Create assignment baru (POST /api/ketua-tim)
3. Delete assignment (DELETE /api/ketua-tim/[id])
4. Get assignments by user (GET /api/ketua-tim/user/[user_id])
5. Get chairman by kegiatan (GET /api/ketua-tim/kegiatan/[kegiatan_id])

## Prerequisites

- Section(s) yang harus selesai dulu: **01 (Database Migration)**
- Files/modules yang harus sudah tersedia:
  - `supabase/migrations/014_chairman_assignment.sql` (tabel dan functions sudah ada)
  - Pattern API route di `src/routes/api/` existing

## Implementation Steps

### 2.1 Create Directory Structure

Buat folder `src/routes/api/ketua-tim/` dan subdirectories.

### 2.2 GET /api/ketua-tim — List All Assignments

```typescript
// src/routes/api/ketua-tim/index.ts
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession, hasRole } from '#/lib/auth'

function createClient(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const mockEvent = { request, cookie: { get: () => undefined, set: () => {}, delete: () => {} } } as any
  return createServerSupabaseClient(mockEvent, cookieHeader)
}

export const Route = createFileRoute('/api/ketua-tim/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isAdmin = await hasRole(supabase, session.user.id, 'ADMIN')
        if (!isAdmin) {
          return Response.json({ error: 'Hanya ADMIN yang bisa mengakses' }, { status: 403 })
        }

        const { data, error } = await supabase
          .from('ketua_tim_assignments')
          .select(`
            id,
            user_id,
            kegiatan_id,
            created_at,
            created_by,
            user:auth_users!user_id(id, email, raw_user_meta_data),
            kegiatan:master_kegiatan(id, nama)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          return Response.json({ error: 'Gagal mengambil data' }, { status: 500 })
        }

        return Response.json({ assignments: data })
      },

      POST: async ({ request }: { request: Request }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isAdmin = await hasRole(supabase, session.user.id, 'ADMIN')
        if (!isAdmin) {
          return Response.json({ error: 'Hanya ADMIN yang bisa mengakses' }, { status: 403 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { user_id, kegiatan_id } = body as { user_id?: string; kegiatan_id?: string }

        if (!user_id || !kegiatan_id) {
          return Response.json({ error: 'user_id dan kegiatan_id wajib diisi' }, { status: 400 })
        }

        // Check jika kegiatan sudah punya chairman
        const { data: existingChair } = await supabase
          .from('ketua_tim_assignments')
          .select('id, user:auth_users!user_id(id, raw_user_meta_data)')
          .eq('kegiatan_id', kegiatan_id)
          .single()

        if (existingChair) {
          return Response.json({
            error: 'Kegiatan sudah memiliki chairman',
            existing_chairman: {
              id: existingChair.user?.id,
              name: existingChair.user?.raw_user_meta_data?.user_name,
            }
          }, { status: 409 })
        }

        // Insert new assignment
        const { data, error } = await supabase
          .from('ketua_tim_assignments')
          .insert({
            user_id,
            kegiatan_id,
            created_by: session.user.id,
          })
          .select()
          .single()

        if (error) {
          return Response.json({ error: 'Gagal membuat assignment' }, { status: 500 })
        }

        return Response.json({ assignment: data }, { status: 201 })
      }
    }
  }
})
```

### 2.3 DELETE /api/ketua-tim/[id] — Remove Assignment

```typescript
// src/routes/api/ketua-tim/[id].ts
import { createFileRoute } from '@tanstack/react-router'
// ... import helpers

export const Route = createFileRoute('/api/ketua-tim/[id]')({
  server: {
    handlers: {
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const supabase = createClient(request)
        const session = await getServerSession(supabase)

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isAdmin = await hasRole(supabase, session.user.id, 'ADMIN')
        if (!isAdmin) {
          return Response.json({ error: 'Hanya ADMIN yang bisa mengakses' }, { status: 403 })
        }

        const { id } = params
        if (!id) {
          return Response.json({ error: 'ID wajib diisi' }, { status: 400 })
        }

        const { error } = await supabase
          .from('ketua_tim_assignments')
          .delete()
          .eq('id', id)

        if (error) {
          return Response.json({ error: 'Gagal menghapus assignment' }, { status: 500 })
        }

        return Response.json({ success: true }, { status: 200 })
      }
    }
  }
})
```

### 2.4 GET /api/ketua-tim/user/[user_id] — Get User's Assignments

```typescript
// src/routes/api/ketua-tim/user/[user_id].ts
export const Route = createFileRoute('/api/ketua-tim/user/[user_id]')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { user_id: string } }) => {
        // ... auth check (ADMIN only)

        const { user_id } = params
        if (!user_id) {
          return Response.json({ error: 'user_id wajib diisi' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('ketua_tim_assignments')
          .select(`
            id,
            kegiatan_id,
            created_at,
            kegiatan:master_kegiatan(id, nama)
          `)
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })

        if (error) {
          return Response.json({ error: 'Gagal mengambil data' }, { status: 500 })
        }

        return Response.json({ assignments: data })
      }
    }
  }
})
```

### 2.5 GET /api/ketua-tim/kegiatan/[kegiatan_id] — Get Kegiatan's Chairman

```typescript
// src/routes/api/ketua-tim/kegiatan/[kegiatan_id].ts
export const Route = createFileRoute('/api/ketua-tim/kegiatan/[kegiatan_id]')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { kegiatan_id: string } }) => {
        // ... auth check (ADMIN only)

        const { kegiatan_id } = params
        if (!kegiatan_id) {
          return Response.json({ error: 'kegiatan_id wajib diisi' }, { status: 400 })
        }

        const { data, error } = await supabase
          .from('ketua_tim_assignments')
          .select(`
            id,
            user_id,
            created_at,
            user:auth_users!user_id(id, email, raw_user_meta_data)
          `)
          .eq('kegiatan_id', kegiatan_id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          return Response.json({ error: 'Gagal mengambil data' }, { status: 500 })
        }

        if (!data) {
          return Response.json({ chairman: null })
        }

        return Response.json({
          chairman: {
            id: data.id,
            user_id: data.user_id,
            user_name: data.user?.raw_user_meta_data?.user_name,
            user_email: data.user?.email,
          }
        })
      }
    }
  }
})
```

## Files to Create

- `src/routes/api/ketua-tim/index.ts` — GET + POST handlers
- `src/routes/api/ketua-tim/[id].ts` — DELETE handler
- `src/routes/api/ketua-tim/user/[user_id].ts` — GET by user
- `src/routes/api/ketua-tim/kegiatan/[kegiatan_id].ts` — GET by kegiatan

## Test Stubs

### Happy Path
- [ ] GET return semua assignments dengan user dan kegiatan info
- [ ] POST berhasil create assignment baru
- [ ] DELETE berhasil hapus assignment
- [ ] GET by user return semua kegiatan chairman user

### Edge Cases
- [ ] POST kegiatan yang sudah punya chairman return 409 dengan data chairman lama
- [ ] DELETE id yang tidak ada return 404 atau handle gracefully

### Error Cases
- [ ] Unauthorized request return 401
- [ ] Non-ADMIN request return 403

## Definition of Done

- [ ] GET /api/ketua-tim berfungsi dan return semua assignments
- [ ] POST /api/ketua-tim berfungsi dengan validation
- [ ] DELETE /api/ketua-tim/[id] berfungsi
- [ ] GET /api/ketua-tim/user/[user_id] berfungsi
- [ ] GET /api/ketua-tim/kegiatan/[kegiatan_id] berfungsi
- [ ] Semua endpoints return proper error messages
- [ ] Authorization check berfungsi (ADMIN only untuk write operations)