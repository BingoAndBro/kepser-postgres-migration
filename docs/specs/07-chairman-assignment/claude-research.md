# Research Report: SPEC 07 — Chairman Assignment

## Overview

Dokumen ini berisi hasil riset untuk implementasi SPEC 07 (Chairman Assignment). Riset mencakup:
1. Codebase patterns dari project yang ada
2. Technical notes tentang PostgreSQL EXCLUDE constraint
3. Menu visibility pattern untuk conditional navigation
4. Async badge determination pattern

---

## 1. Codebase Patterns

### 1.1 Tech Stack yang Digunakan

| Component | Technology |
|-----------|------------|
| Framework | TanStack Start (SSR + file-based routing) |
| Auth | Supabase Auth dengan cookie-based active role |
| ORM | Drizzle ORM |
| Validation | Zod |
| Package Manager | pnpm (mandatory) |
| Primary Keys | UUID dengan `gen_random_uuid()` |
| Timestamps | `timestamp with time zone DEFAULT now()` |

### 1.2 Migration File Naming Convention

Pattern: `###_description.sql` (3-digit sequential)

**Migrations yang ada:**
- `001_auth_rbac.sql` - Auth & RBAC
- `002_master_data.sql` - Master data tables
- `003_dokumen_transaksi.sql` - Dokumen tables
- `005_arsip.sql` - Arsip tables
- `006_jenis_kategori_detail.sql` - Jenis/Kategori/Detail chain
- `007_cron_arsip.sql` - Cron jobs
- `008_seed_arsiparis.sql` - Seed data
- `009_fix_arsip_status.sql` - Fix migration
- `010_drop_verifikasi_penyusutan.sql` - Drop table
- `011_arsip_snapshot_musnah.sql` - Archive snapshot
- `012_klasifikasi_hierarchy.sql` - Hierarchical klasifikasi
- `013_user_status_tracking.sql` - User status tracking

**Untuk Spec 07:** File migration selanjutnya adalah `014_chairman_assignment.sql`

### 1.3 Database Schema Patterns

#### Primary Key
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

#### Foreign Key
```sql
REFERENCES "public"."master_fungsi"("id") ON DELETE restrict ON UPDATE no action
```

#### Index
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

#### Unique Constraint
```sql
CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id)
```

### 1.4 RLS Patterns

Ada 4 pattern yang digunakan:

**Pattern A:** Simple SELECT + Admin-only mutations
```sql
CREATE POLICY master_fungsi_select ON master_fungsi
  FOR SELECT USING (true);

CREATE POLICY master_fungsi_admin_all ON master_fungsi
  FOR ALL USING (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr WHERE gr.nama = 'ADMIN'
  ));
```

**Pattern B:** Using `get_user_roles()` security definer function
```sql
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS SETOF roles
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT r.* FROM roles r
  INNER JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
$$;
```

**Pattern C:** Role-based conditional SELECT
```sql
CREATE POLICY "pegawai_select_own_dokumen" ON "dokumen_transaksi"
  FOR SELECT USING (auth.uid() = "created_by");
```

**Pattern D:** Inline subquery
```sql
CREATE POLICY "arsip_insert_arsiparis_admin" ON arsip
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.nama IN ('ARSIPARIS', 'ADMIN')
    )
  );
```

### 1.5 API Route Patterns (TanStack Start)

#### Route File Structure
```
src/routes/api/
├── auth/
│   ├── login.ts
│   └── logout.ts
├── dokumen/
│   ├── index.ts
│   └── $id.ts
├── master-fungsi.ts
└── users/
    ├── index.ts
    └── $id.ts
```

#### API Handler Pattern
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'

export const Route = createFileRoute('/api/resource/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = createClient(request)
        const session = await getSession(supabase)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // ... implementation
        return Response.json({ data }, 200)
      },
      POST: async ({ request }) => {
        // ...
      }
    }
  }
})

function createClient(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const mockEvent = {
    request,
    cookie: { get: () => undefined, set: () => {}, delete: () => {} },
  } as any
  return createServerSupabaseClient(mockEvent, cookieHeader)
}
```

### 1.6 Zod Schema Pattern

```typescript
import { z } from 'zod'

export const createDokumenSchema = z.object({
  fungsiId: z.string().uuid('ID fungsi tidak valid'),
  kegiatanJenisId: z.string().uuid('ID kegiatan tidak valid'),
  isKetuaTim: z.boolean(),
  tahun: z.number().int().min(2000).max(2100),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  lampiranUrls: z.array(lampiranUrlSchema).default([]),
})
```

### 1.7 Navigation Pattern (AppLayout.tsx)

**Current Implementation:**
- Navigation configured in `NAV_CONFIG` object
- Role-based menu groups
- Static configuration per role

**Current PEGAWAI menu:**
```typescript
{
  title: 'MANAGEMENT',
  items: [
    { id: 'aju', label: 'Ajukan Dokumen', icon: FilePlus, to: '/pegawai/dokumen/aju' },
    { id: 'diajukan', label: 'Dokumen Diajukan', icon: ClipboardList, to: '/pegawai/dokumen' },
    { id: 'revisi', label: 'Revisi Dokumen', icon: FileEdit, to: '/pegawai/dokumen?status=NEED_REVISION' },
    { id: 'laporan_saya', label: 'Laporan Saya', icon: FileText, to: '/pegawai/laporan/saya' },
    { id: 'laporan_kegiatan', label: 'Laporan Kegiatan', icon: BarChart3, to: '/pegawai/laporan/kegiatan' },
  ],
}
```

**Important:** "Laporan Kegiatan" sudah ada di menu, tapi spec mengatakan menu ini seharusnya "hanya tampil jika user punya hak chairman". Saat ini menu selalu tampil.

### 1.8 Existing Pages yang Relevan

#### `/pegawai/dokumen/aju.tsx` (Ajukan Dokumen)
- Step 5: "Peran dalam Kegiatan" (Ketua Tim / Anggota)
- Toggle manual dengan state `isKetuaTim`
- Badge info BELUM ada — perlu diimplementasi

#### `/pegawai/laporan/kegiatan.tsx` (Laporan Kegiatan)
- Sudah ada page untuk melihat dokumen kegiatan
- Cek `is_ketua_tim` dari dokumen_transaksi table
- Filter client-side dengan HierarchicalFilter

#### `/admin/master-data/user.tsx` (Master User)
- Tabel dengan user list
- Dialog untuk create/edit user
- Belum ada kolom "Kegiatan Ketua Tim"
- Belum ada section untuk manage chairman assignments

### 1.9 Dokumen Helpers Pattern

```typescript
// src/lib/dokumen-helpers.ts
export async function getKelengkapanRequired(supabase, kegiatanId, isKetuaTim, options?)
export async function userHasApproverRole(supabase, userId): Promise<boolean>
```

### 1.10 User Helpers Pattern

```typescript
// src/lib/user-helpers.ts
import { createAdminClient } from '#/lib/supabase-admin'
import { getUsersWithRoles, createUserWithRoles } from '#/lib/user-helpers'
```

---

## 2. Technical Notes: PostgreSQL EXCLUDE Constraint

### 2.1 About btree_gist Extension

PostgreSQL EXCLUDE constraint memungkinkan constraint yang lebih kompleks dari UNIQUE. Extension `btree_gist` dibutuhkan untuk menggunakan operator `=` pada tipe non-range (seperti UUID) dengan GiST index.

### 2.2 Syntax

```sql
EXCLUDE [ USING index_method ] ( exclude_element WITH operator [, ...] )
         [ index_parameters ] [ WHERE ( predicate ) ]
```

### 2.3 Implementasi untuk "1 kegiatan = 1 chairman"

**Option A: Dengan btree_gist (Complex)**
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE ketua_tim_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kegiatan_id uuid REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  EXCLUDE USING gist (kegiatan_id WITH =) WHERE (user_id IS NOT NULL)
);
```

**Option B: Simple UNIQUE + Application Layer (Recommended)**
```sql
CREATE TABLE ketua_tim_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kegiatan_id uuid NOT NULL REFERENCES master_kegiatan(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(kegiatan_id)  -- 1 kegiatan = 1 chairman
);
```

**Rekomendasi:** Gunakan Option B karena:
1. Tidak butuh extension tambahan
2. Constraint lebih simple dan jelas
3. Validation bisa dilakukan di API layer (return 409 Conflict)
4. Konsisten dengan pattern existing codebase

---

## 3. Menu Visibility Pattern

### 3.1 Current State

Menu "Laporan Kegiatan" saat ini **selalu tampil** untuk semua PEGAWAI user. Spec membutuhkan menu ini hanya tampil jika user punya hak chairman.

### 3.2 Server-Side vs Client-Side

**Server-side (Recommended):**
- Cek di server saat generate navigation config
- Datafetch dari `ketua_tim_assignments` table
- Lebih secure — user tidak bisa manipulate client-side hiding

**Client-side (Simple):**
- Fetch di AppLayout component
- Conditionally render based on API response
- Risk: user bisa inspect source dan melihat hidden menu

### 3.3 Recommended Approach

1. API endpoint baru: `GET /api/users/me/ketua-tim` — return list kegiatan chairman user
2. AppLayout fetch data ini saat mount
3. Conditionally add "Laporan Kegiatan" ke NAV_CONFIG berdasarkan response

### 3.4 Implementation Pattern

```typescript
// In AppLayout.tsx
const [chairmanKegiatan, setChairmanKegiatan] = useState<Kegiatan[]>([])

useEffect(() => {
  fetch('/api/users/me/ketua-tim', { credentials: 'include' })
    .then(r => r.json())
    .then(d => setChairmanKegiatan(d.kegiatan ?? []))
}, [])

// Conditionally build nav based on chairman status
const isChairman = chairmanKegiatan.length > 0
```

---

## 4. Async Badge Determination Pattern

### 4.1 Requirement

Badge "Ketua Tim/Anggota" harus muncul **setelah user pilih kegiatan**, bukan saat page load.

### 4.2 Current Implementation

Di `aju.tsx`, state `isKetuaTim` di-set manual oleh user (toggle button). Spec meminta auto-detect berdasarkan apakah user chairman di kegiatan tersebut.

### 4.3 Recommended Approach

1. User pilih kegiatan di step 3/4
2. Setelah kegiatan dipilih, fetch ke `GET /api/users/me/is-ketua-tim/[kegiatan_id]`
3. Set badge berdasarkan response
4. User tetap bisa override jika needed (atau spec baru minta auto-set?)

### 4.4 Pattern for Async Check

```typescript
// In kegiatan selection handler
const handleKegiatanChange = async (kegiatanId: string) => {
  setSelectedKegiatanId(kegiatanId)
  setLoadingBadge(true)

  try {
    const res = await fetch(`/api/users/me/is-ketua-tim/${kegiatanId}`, {
      credentials: 'include'
    })
    const data = await res.json()
    setIsChairmanInKegiatan(data.is_ketua_tim)
  } catch {
    setIsChairmanInKegiatan(false)
  } finally {
    setLoadingBadge(false)
  }
}
```

### 4.5 Badge UI Pattern

**Chairman Badge:**
```tsx
<div className="flex items-center gap-2 bg-green-100 text-green-800 p-3 rounded-lg">
  <Trophy className="w-5 h-5" />
  <div>
    <p className="text-sm font-semibold">Anda adalah Ketua Tim di kegiatan ini</p>
    <p className="text-xs">Dokumen akan masuk ke Laporan Kegiatan</p>
  </div>
</div>
```

**Anggota Badge:**
```tsx
<div className="flex items-center gap-2 bg-blue-100 text-blue-800 p-3 rounded-lg">
  <Medal className="w-5 h-5" />
  <div>
    <p className="text-sm font-semibold">Anda adalah Anggota di kegiatan ini</p>
    <p className="text-xs">Dokumen akan masuk ke Laporan Saya</p>
  </div>
</div>
```

---

## 5. Summary of Findings

### 5.1 Yang Sudah Ada

- Tabel `dokumen_transaksi` sudah punya kolom `is_ketua_tim`
- Function `get_user_roles()` sudah ada untuk RLS
- API pattern sudah established
- Zod schema pattern sudah ada
- Navigation sudah ada (tapi perlu conditional visibility)

### 5.2 Yang Perlu Dibuat

1. **Database:**
   - Tabel `ketua_tim_assignments` (014_chairman_assignment.sql)
   - Function `is_user_chairman()`
   - Function `get_user_chairman_kegiatan()`

2. **API:**
   - `GET /api/ketua-tim` — list all assignments (ADMIN)
   - `POST /api/ketua-tim` — create assignment (ADMIN)
   - `DELETE /api/ketua-tim/[id]` — remove assignment (ADMIN)
   - `GET /api/users/me/ketua-tim` — get current user's chairman kegiatan
   - `GET /api/users/me/is-ketua-tim/[kegiatan_id]` — check chairman status

3. **UI:**
   - Update Master User table dengan kolom "Kegiatan Ketua Tim"
   - Update popup Edit User dengan section manage chairman
   - Add badge di Ajukan Dokumen (after kegiatan selection)
   - Update AppLayout untuk conditional menu visibility
   - Halaman Detail User (optional, untuk MVP bisa skip)

### 5.3 Considerations

- **Constraint:** Gunakan UNIQUE(kegiatan_id) + application layer validation
- **Menu visibility:** Fetch di client-side, lebih simple
- **Badge timing:** Setelah user pilih kegiatan, fetch async
- **Existing table:** `is_ketua_tim` di dokumen_transaksi — perbedaannya dengan spec adalah spec butuh assignment table, bukan flag per dokumen

---

## 6. Open Questions

1. **Auto-determine vs Manual:** Apakah user harus auto-detect sebagai chairman jika ada di `ketua_tim_assignments`, atau tetap manual seperti sekarang?

2. **Chairman bisa submit sebagai anggota?:** Jika user chairman di suatu kegiatan, apakah mereka masih bisa submit dokumen sebagai "anggota" (masuk Laporan Saya)?

3. **Badge display:** Spec menyebut badge "hanya di Ajukan Dokumen + halaman Upload, hilang di halaman Review" — apakah ini berlaku juga untuk semua halaman detail dokumen?

---

*Last updated: 2026-05-03*