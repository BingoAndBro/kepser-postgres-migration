# Research: Codebase Patterns for Spec 07 (Chairman Assignment)

## Overview

This document captures the existing patterns found in the DMS codebase, which uses:
- **Framework:** TanStack Start (SSR with file-based routing)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL) with RLS
- **ORM:** Drizzle ORM (for schema definition)
- **Validation:** Zod (for API schemas)
- **Package Manager:** pnpm

---

## 1. Primary Key Strategy

### Decision: UUID with `gen_random_uuid()`

All tables use **UUID primary keys** generated server-side via PostgreSQL's `gen_random_uuid()` function.

**Migration Examples:**

```sql
-- From 001_auth_rbac.sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()

-- From 002_master_data.sql  
id uuid PRIMARY KEY DEFAULT gen_random_uuid()

-- From 003_dokumen_transaksi.sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL

-- From 005_arsip.sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**Drizzle Schema (src/lib/db/schema.ts):**
```typescript
id: uuid('id').primaryKey().defaultRandom()
```

**Pattern Summary:**
- Primary keys: `uuid` type
- Default generation: `gen_random_uuid()` in SQL, `defaultRandom()` in Drizzle
- No serial/integer IDs used anywhere
- Foreign keys reference UUID columns

---

## 2. Migration File Naming Convention

### Pattern: `###_description.sql`

**Current migrations in `supabase/migrations/`:**

| File | Description |
|------|-------------|
| `001_auth_rbac.sql` | Auth & RBAC Foundation: roles, user_roles, RLS |
| `002_master_data.sql` | Master Data Management: fungsi, kegiatan, kelengkapan |
| `003_dokumen_transaksi.sql` | Tables for dokumen_transaksi and log_aktivitas |
| `004_storage_rls_cleanup.sql` | Storage RLS cleanup |
| `005_arsip.sql` | Tabel arsip, master klasifikasi, verifikasi penyusutan |
| `006_jenis_kategori_detail.sql` | Jenis / Kategori / Detail Permintaan + extend kelengkapan chain |
| `007_cron_arsip.sql` | pg_cron schedule untuk auto-transition arsip |
| `008_seed_arsiparis.sql` | Seed data untuk arsiparis |
| `009_fix_arsip_status.sql` | Fix arsip status |
| `010_drop_verifikasi_penyusutan.sql` | Drop verifikasi penyusutan table |
| `011_arsip_snapshot_musnah.sql` | Archive snapshot untuk musnah |
| `012_klasifikasi_hierarchy.sql` | Add parent_id and kode columns for hierarchical klasifikasi |
| `013_user_status_tracking.sql` | User status tracking |

**Naming Convention:**
- Prefixed with 3-digit sequential number (`001`, `002`, etc.)
- Lowercase with underscores
- Brief description of migration purpose
- Examples: `auth_rbac`, `master_data`, `dokumen_transaksi`

**For Spec 07, the next migration should be:** `014_chairman_assignment.sql`

---

## 3. RLS (Row Level Security) Patterns

### Pattern Overview

RLS is enabled on all user-facing tables. The project uses two patterns:

#### Pattern A: Simple SELECT with Role-based Write Access

```sql
-- From 002_master_data.sql
ALTER TABLE master_fungsi ENABLE ROW LEVEL SECURITY;

CREATE POLICY master_fungsi_select ON master_fungsi
  FOR SELECT
  USING (true);

CREATE POLICY master_fungsi_admin_all ON master_fungsi
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr
    WHERE gr.nama = 'ADMIN'
  ));
```

#### Pattern B: Conditional SELECT with Role Check (get_user_roles function)

```sql
-- From 001_auth_rbac.sql
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS SETOF roles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.* FROM roles r
  INNER JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
$$;

CREATE POLICY roles_admin_all ON roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM get_user_roles(auth.uid()) gr
    WHERE gr.nama = 'ADMIN'
  ));
```

#### Pattern C: Complex Role-based Policies (dokumen_transaksi)

```sql
-- From 003_dokumen_transaksi.sql
ALTER TABLE "dokumen_transaksi" ENABLE ROW LEVEL SECURITY;

-- PEGAWAI: can see/edit own records
CREATE POLICY "pegawai_select_own_dokumen" ON "dokumen_transaksi"
  FOR SELECT USING (auth.uid() = "created_by");

-- PPK/BENDAHARA/ARSIPARIS/ADMIN: can see documents in their step
CREATE POLICY "approver_select_dokumen" ON "dokumen_transaksi"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."user_roles" ur
      JOIN "public"."roles" r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN')
    )
  );
```

#### Pattern D: Inline Subquery for RLS (arsip tables)

```sql
-- From 005_arsip.sql - Inline subquery pattern
CREATE POLICY "arsip_insert_arsiparis_admin" ON arsip
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.nama IN ('ARSIPARIS', 'ADMIN')
    )
  );
```

### RLS Patterns for Spec 07

For the new `ketua_tim_assignment` table and any related changes:

1. **SELECT policy:** Allow authenticated users to read (for viewing assignments)
2. **INSERT policy:** ADMIN only can create assignments
3. **UPDATE policy:** ADMIN only can modify assignments
4. **Use `get_user_roles()` function** for role checking consistency

---

## 4. API Route Patterns (TanStack Start)

### TanStack Start File Structure

**File-based routing in `src/routes/`:**

```
src/routes/
├── __root.tsx                  # Root layout
├── index.tsx                   # Landing page (/)
├── login.tsx                   # Login page
├── admin.tsx                   # Admin dashboard
├── admin.master-data.index.tsx  # Redirect to fungsi
├── admin.master-data.fungsi.tsx
├── admin.master-data.kegiatan.tsx
├── ppk.tsx                     # PPK dashboard
├── ppk.inbox.tsx
├── ppk.tervalidasi.tsx
├── ppk.ditolak.tsx
├── ppk.revisi.tsx
├── ppk.dokumen.$id.tsx
├── bendahara.tsx
├── bendahara.inbox.tsx
├── arsiparis.tsx
├── arsiparis.inbox.tsx
├── arsiparis.aktif.tsx
├── arsiparis.inaktif.tsx
├── arsiparis.search.tsx
├── dokumen.tsx
├── dokumen.aju.tsx
├── dokumen.saya.tsx
├── dokumen.$id.tsx
├── dokumen.$id.index.tsx
├── dokumen.$id.edit.tsx
├── pegawai.tsx
├── pegawai.dokumen.tsx
├── api/                        # API routes (server functions)
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── session.ts
│   │   └── role-switch.ts
│   ├── dokumen/
│   │   ├── index.ts
│   │   ├── $id.ts
│   │   ├── $id.submit.ts
│   │   └── $id.log.ts
│   ├── master-fungsi.ts
│   ├── master-fungsi.$id.ts
│   ├── master-kegiatan.ts
│   ├── ppk/
│   │   ├── inbox.ts
│   │   ├── ditolak.ts
│   │   ├── tervalidasi.ts
│   │   ├── revisii.ts
│   │   ├── dokumen/
│   │   │   ├── $id.ts
│   │   │   ├── $id.approve.ts
│   │   │   ├── $id.reject.ts
│   │   │   └── $id.preview\$lampiranIndex.ts
│   │   └── resubmit/
│   │       └── $id.ts
│   ├── bendahara/
│   │   ├── inbox.ts
│   │   ├── ditolak.ts
│   │   ├── selesai.ts
│   │   └── dokumen/
│   │       ├── $id.ts
│   │       ├── $id.approve.ts
│   │       ├── $id.reject.ts
│   │       └── $id.preview\$lampiranIndex.ts
│   └── users/
│       ├── index.ts
│       ├── $id.ts
│       ├── me.ts
│       └── ...
```

### API Route Pattern

```typescript
// src/routes/api/auth/login.ts
import { createFileRoute } from '@tanstack/react-router'
import { loginSchema } from '#/lib/schemas/auth'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getPrimaryRole, getUserRole, setActiveRoleCookieHeader } from '#/lib/auth'
import type { RoleName } from '#/lib/types/auth'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const result = loginSchema.safeParse(body)
        if (!result.success) {
          return Response.json({
            error: 'Validasi gagal',
            details: result.error.flatten(),
          }, { status: 400 })
        }

        const { email, password } = result.data

        const cookieHeader = request.headers.get('cookie')
        const mockEvent = {
          request,
          cookie: {
            get: () => undefined,
            set: () => {},
            delete: () => {},
          },
        } as any
        const supabase = createServerSupabaseClient(mockEvent, cookieHeader)

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          return Response.json({
            error: 'Email atau password salah',
            code: error.code,
          }, { status: 401 })
        }

        const roles = await getUserRole(supabase, data.user.id)
        const activeRole: RoleName = getPrimaryRole(roles)

        const newCookie = setActiveRoleCookieHeader(cookieHeader, activeRole)

        return Response.json({
          user: {
            id: data.user.id,
            email: data.user.email,
            userName: data.user.user_metadata?.user_name as string | undefined,
          },
          roles,
          activeRole,
        }, {
          headers: {
            'Set-Cookie': newCookie,
          },
        })
      },
    },
  },
})
```

### Pattern Summary for API Routes

1. **Import pattern:**
   ```typescript
   import { createFileRoute } from '@tanstack/react-router'
   import { createServerSupabaseClient } from '#/lib/supabase-server'
   import { getServerSession } from '#/lib/auth'
   import { someSchema } from '#/lib/schemas/...'
   ```

2. **Route definition:**
   ```typescript
   export const Route = createFileRoute('/api/resource/')({
     server: {
       handlers: {
         GET: async ({ request }) => { ... },
         POST: async ({ request }) => { ... },
       }
     }
   })
   ```

3. **Client creation helper:**
   ```typescript
   function createClient(request: Request) {
     const cookieHeader = request.headers.get('cookie')
     const mockEvent = {
       request,
       cookie: { get: () => undefined, set: () => {}, delete: () => {} },
     } as any
     return createServerSupabaseClient(mockEvent, cookieHeader)
   }
   ```

4. **Auth check pattern:**
   ```typescript
   const session = await getServerSession(supabase)
   if (!session) {
     return Response.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

5. **Response pattern:**
   - Success: `Response.json({ data }, status)`
   - Error: `Response.json({ error: 'message' }, status)`

### Client-Side Fetching Pattern

```typescript
// In TanStack Start page components
const fetchData = async () => {
  const res = await fetch('/api/resource', {
    credentials: 'include'
  })
  const json = await res.json()
  // handle data or error
}
```

---

## 5. Database Schema Patterns

### Foreign Key Definition

**Standard FK pattern:**
```sql
REFERENCES "public"."master_fungsi"("id") ON DELETE restrict ON UPDATE no action
```

**With CASCADE for dependent records:**
```sql
REFERENCES master_kelengkapan_dokumen(id) ON DELETE CASCADE
```

**FK to Supabase auth.users (no direct FK constraint):**
```sql
user_id uuid NOT NULL, -- UUID dari auth.users (tanpa FK constraint karena dikelola Supabase)
```

### Index Pattern

**Standard indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_master_fungsi_is_active ON master_fungsi(is_active);
CREATE INDEX IF NOT EXISTS idx_master_kegiatan_fungsi_id ON master_kegiatan(fungsi_id);
```

**Conditional indexes for partial matches:**
```sql
-- From 005_arsip.sql
CREATE INDEX IF NOT EXISTS idx_arsip_masa_aktif_berakhir ON arsip(masa_aktif_berakhir) WHERE status_arsip = 'AKTIF';
CREATE INDEX IF NOT EXISTS idx_arsip_masa_inaktif_berakhir ON arsip(masa_inaktif_berakhir) WHERE status_arsip = 'INAKTIF';
```

**Unique constraint with partial index:**
```sql
-- From 012_klasifikasi_hierarchy.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_klasifikasi_kode_unique
  ON master_klasifikasi_arsip(kode)
  WHERE kode IS NOT NULL;
```

### Timestamp Pattern

```sql
-- With timezone (preferred for timestamps)
created_at timestamp with time zone DEFAULT now() NOT NULL

-- Simple timestamp (used in some tables)
created_at timestamp DEFAULT now()
```

**Common fields across tables:**
```sql
created_at timestamp with time zone DEFAULT now() NOT NULL
updated_at timestamp with time zone DEFAULT now() NOT NULL
```

### UUID Generation Pattern

**SQL Migration:**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**Drizzle Schema:**
```typescript
id: uuid('id').primaryKey().defaultRandom()
```

### Unique Constraint Pattern

```sql
-- Single column unique
nama text NOT NULL UNIQUE

-- Composite unique
CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id)

-- Unique with partial filter
CONSTRAINT arsip_verifikasi_penyusutan_arsip_id_unique UNIQUE (arsip_id)
```

---

## 6. Frontend Patterns

### Component Naming Conventions

**UI Components (shadcn/ui style):**
- Located in `src/components/ui/`
- File names: `card.tsx`, `button.tsx`, `input.tsx`, `table.tsx`, `dialog.tsx`, `select.tsx`, `badge.tsx`, `avatar.tsx`, `skeleton.tsx`, `label.tsx`
- Component names: PascalCase (e.g., `Card`, `Button`, `Input`)

**Feature Components:**
- Located in `src/components/[feature]/`
- Examples: `src/components/dokumen/FileUploadButton.tsx`, `src/components/dokumen/ActivityLog.tsx`
- File names: PascalCase component names

**Layout Components:**
- Located in `src/components/layout/`
- Example: `AppLayout.tsx`

### Directory Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui style components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── auth/
│   │   ├── RoleSwitcher.tsx
│   │   └── UserMenu.tsx
│   ├── dashboard/
│   │   ├── StatsBento.tsx
│   │   ├── PageLayout.tsx
│   │   └── DashboardShell.tsx
│   ├── dokumen/
│   │   ├── FileUploadButton.tsx
│   │   ├── ActivityLog.tsx
│   │   ├── ReviewSummary.tsx
│   │   ├── StepIndicator.tsx
│   │   └── KelengkapanChecklist.tsx
│   └── laporan/
│       └── HierarchicalFilter.tsx
├── routes/                 # TanStack Start file-based routes
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── admin.tsx
│   ├── admin.master-data.fungsi.tsx
│   ├── api/                # Server functions (API routes)
│   │   ├── auth/
│   │   ├── dokumen/
│   │   ├── master-fungsi.ts
│   │   └── ...
│   ├── ppk.tsx
│   ├── bendahara.tsx
│   └── ...
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── schemas/
│   │   ├── auth.ts
│   │   ├── dokumen.ts
│   │   └── master-data.ts
│   ├── types/
│   │   └── auth.ts
│   ├── auth.ts
│   ├── guards.ts
│   ├── fsm.ts
│   ├── supabase.ts
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   ├── supabase-admin.ts
│   ├── dokumen-helpers.ts
│   └── utils.ts
├── router.tsx
└── styles.css
```

### UI Component Pattern

```typescript
// src/components/ui/button.tsx
"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ...",
        outline: "border-border bg-background hover:bg-muted ...",
        // ...
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 ...",
        xs: "h-6 gap-1 ...",
        sm: "h-7 gap-1 ...",
        lg: "h-9 gap-1.5 ...",
        icon: "size-8",
        // ...
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### Page Structure Pattern

```typescript
// src/routes/ppk/inbox.tsx
import { createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '#/components/dashboard/DashboardShell'

export const Route = createFileRoute('/ppk/inbox')({
  component: PpkInboxPage,
})

function PpkInboxPage() {
  // Data fetching via useEffect + fetch
  // UI rendering with shadcn/ui components
  return (
    <DashboardShell role="PPK">
      <div className="p-6">
        {/* Page content */}
      </div>
    </DashboardShell>
  )
}
```

### Status Badge Pattern

```typescript
// StatusBadge.tsx (existing component)
function StatusBadge({ status, className }: { status: string; className?: string }) {
  // Color-coded based on status value
  // DRAFT = gray, IN_PPK_VALIDATION = blue, IN_BENDAHARA_APPROVAL = purple, etc.
}
```

---

## 7. Authentication & Middleware

### Session Management

**Auth functions (src/lib/auth.ts):**
```typescript
export async function getSession(supabase: SupabaseClient)
export async function getServerSession(supabase: SupabaseClient) // verified
export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<RoleName[]>
export async function hasRole(supabase: SupabaseClient, userId: string, role: RoleName): Promise<boolean>
export async function hasAnyRole(supabase: SupabaseClient, userId: string, roles: RoleName[]): Promise<boolean>
export function getPrimaryRole(roles: RoleName[]): RoleName
```

### Route Guards (src/lib/guards.ts)

```typescript
export async function requireAuth(event: ServerEventContext)
export async function guardRole(event: ServerEventContext, role: RoleName)
export async function guardAnyRole(event: ServerEventContext, roles: RoleName[])
```

### Client-Side Auth Check

**In AppLayout.tsx:**
```typescript
const supabase = getBrowserClient()
const { data: { session } } = await supabase.auth.getSession()

// Check roles from user_roles table
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('role:roles(nama)')
  .eq('user_id', session.user.id)
```

### Active Role Cookie

**Cookie management (src/lib/auth.ts):**
```typescript
export const ACTIVE_ROLE_COOKIE = 'dms_active_role'

export function getActiveRoleFromCookies(cookieHeader: string | null): RoleName | null
export function setActiveRoleCookieHeader(existingHeader: string | null, role: RoleName): string
export function clearActiveRoleCookieHeader(existingHeader: string | null): string
```

---

## 8. Zod Schema Pattern

### Schema Pattern (src/lib/schemas/dokumen.ts)

```typescript
import { z } from 'zod'

// Lampiran entry (stored as JSON in lampiran_urls column)
export const lampiranUrlSchema = z.object({
  kelengkapan_id: z.string().uuid('ID kelengkapan tidak valid'),
  nama: z.string().min(1, 'Nama tidak boleh kosong'),
  url: z.string().min(1, 'URL tidak boleh kosong'),
  uploaded_at: z.string().min(1, 'Timestamp tidak boleh kosong'),
})

// Create dokumen
export const createDokumenSchema = z.object({
  fungsiId: z.string().uuid('ID fungsi tidak valid'),
  kegiatanJenisId: z.string().uuid('ID kegiatan tidak valid'),
  isKetuaTim: z.boolean(),
  tahun: z.number().int().min(2000).max(2100, 'Tahun tidak valid'),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid. Gunakan YYYY-MM-DD'),
  lampiranUrls: z.array(lampiranUrlSchema).default([]),
})

// Update dokumen
export const updateDokumenSchema = z.object({
  lampiranUrls: z.array(lampiranUrlSchema).optional(),
  // ...
})

// Empty body schemas
export const approveDokumenSchema = z.object({}).strict()

// Schemas with required fields
export const rejectDokumenSchema = z.object({
  catatan: z.string().min(10, 'Catatan minimal 10 karakter').max(2000, 'Catatan maksimal 2000 karakter'),
})
```

---

## 9. Key Helper Patterns

### Dokumen Helpers (src/lib/dokumen-helpers.ts)

```typescript
export async function getDokumenById(supabase, id): Promise<DokumenRow | null>
export async function getDokumenByUser(supabase, userId): Promise<DokumenRow[]>
export async function createDokumen(supabase, payload): Promise<{ data?, error? }>
export async function updateDokumen(supabase, id, payload): Promise<{ data?, error? }>
export async function updateDokumenStatus(supabase, id, payload): Promise<{ error? }>
export async function insertLog(supabase, payload): Promise<{ data?, error? }>
export async function getLogsByDokumen(supabase, dokumenId): Promise<LogRow[]>
export async function getKelengkapanRequired(supabase, kegiatanId, isKetuaTim, options?): Promise<KelengkapanRequired[]>
export async function userHasApproverRole(supabase, userId): Promise<boolean>
```

### User Helpers Pattern (if exists)

Admin API routes use:
```typescript
import { createAdminClient } from '#/lib/supabase-admin'
import { getUsersWithRoles, createUserWithRoles } from '#/lib/user-helpers'
```

---

## 10. Navigation Config

**AppLayout.tsx** defines `NAV_CONFIG` for each role:

```typescript
const NAV_CONFIG: Record<RoleName, MenuGroup[]> = {
  PEGAWAI: [
    { title: 'GENERAL', items: [...] },
    { title: 'MANAGEMENT', items: [...] },
    { title: 'ARSIP', items: [...] },
    { title: 'SYSTEM', items: [...] },
  ],
  PPK: [...],
  BENDAHARA: [...],
  ARSIPARIS: [...],
  ADMIN: [
    { title: 'GENERAL', items: [...] },
    { title: 'MANAGEMENT', items: [
      { id: 'master_user', label: 'Master User', icon: Shield, to: '/admin/master-data/user' },
      { id: 'master_fungsi', label: 'Departemen Fungsi', icon: Building2, to: '/admin/master-data/fungsi' },
      // ... more items
    ]},
  ],
}
```

---

## 11. FSM Pattern (src/lib/fsm.ts)

Status transitions are managed through a finite state machine with typed transitions.

---

## 12. Summary for Spec 07 Implementation

### Migration File
- **New file:** `supabase/migrations/014_chairman_assignment.sql`

### Schema Pattern
```sql
CREATE TABLE IF NOT EXISTS chairman_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id uuid NOT NULL REFERENCES dokumen_transaksi(id),
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chairman_assignment_dokumen_id ON chairman_assignment(dokumen_id);
CREATE INDEX IF NOT EXISTS idx_chairman_assignment_assigned_by ON chairman_assignment(assigned_by);

ALTER TABLE chairman_assignment ENABLE ROW LEVEL SECURITY;
-- RLS policies following Pattern D (inline subquery)
```

### API Route Pattern
```typescript
// src/routes/api/ketua-tim/assignment.ts
import { createFileRoute } from '@tanstack/react-router'
import { createServerSupabaseClient } from '#/lib/supabase-server'
import { getServerSession } from '#/lib/auth'

export const Route = createFileRoute('/api/ketua-tim/assignment')({
  server: {
    handlers: {
      GET: async ({ request }) => { ... },
      POST: async ({ request }) => { ... },
    }
  }
})
```

### Zod Schema Pattern
```typescript
// src/lib/schemas/ketua-tim.ts
import { z } from 'zod'

export const createAssignmentSchema = z.object({
  dokumenId: z.string().uuid(),
})

export const getAssignmentSchema = z.object({
  dokumenId: z.string().uuid(),
})
```

### Frontend Pattern
- Create components in `src/components/ketua-tim/`
- Create pages in `src/routes/ketua-tim/`
- Use existing UI components from `src/components/ui/`
- Use `DashboardShell` wrapper with role context

---

*Last updated: 2026-05-03*
