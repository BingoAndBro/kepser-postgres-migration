# Codebase Research: SPEC 05 — Arsip Flow

## 1. Auth/Roles Pattern

### Role Definition
**File:** `src/lib/types/auth.ts`
- Roles are hardcoded: `['PEGAWAI', 'PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN']`
- `RoleName` type derived from this array
- Display labels in `ROLE_DISPLAY` record

### Database Schema
**File:** `supabase/migrations/001_auth_rbac.sql`
- `roles` table: id, nama (UNIQUE), deskripsi, created_at
- `user_roles` table: id, user_id (UUID from auth.users), role_id (FK to roles), created_at
- Composite UNIQUE on (user_id, role_id)

### Role Check Pattern (API Level)
```typescript
const { data: rolesData } = await supabase.from('user_roles').select('role:roles(nama)').eq('user_id', session.user.id)
const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
if (!roleNames.includes('BENDAHARA')) return Response.json({ error: 'Akses ditolak' }, { status: 403 })
```

### Auth Helpers (`src/lib/auth.ts`)
- `getUserRole(supabase, userId)` - returns `RoleName[]`
- `hasRole(supabase, userId, role)` - returns `boolean`
- `buildAppSession(supabase, cookieHeader)` - builds full `AppSession`
- `getServerSession(supabase)` - verified session using `getUser()`

---

## 2. Approval Flow Pattern (SPEC 04 Implementation)

### FSM (`src/lib/fsm.ts`)
Single source of truth for status transitions. `transition(currentStatus, action, actorRole, revisionTarget?)` function.

Key transitions:
- `COMPLETED:ARCHIVE` → `ARCHIVED`
- `COMPLETED:SKIP` → `COMPLETED`

### FSM Types (`src/lib/types/fsm.ts`)
- `StatusDokumen`: 'DRAFT' | 'IN_PPK_VALIDATION' | 'IN_BENDAHARA_APPROVAL' | 'NEED_REVISION' | 'COMPLETED' | 'ARCHIVED'
- `FSMAction`: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT' | 'RESUBMIT_PPK' | 'KEMBALIKAN' | 'ARCHIVE' | 'SKIP'

### Route Patterns (Bendahara)
- `/api/bendahara/inbox` - list
- `/api/bendahara/dokumen/$id` - detail
- `/api/bendahara/dokumen/$id/approve` - approve action
- `/api/bendahara/dokumen/$id/reject` - reject with catatan

---

## 3. Master Data Pattern

### API Pattern (Fungsi) — `src/routes/api/master-fungsi.ts`
- GET: public access (no auth for dropdowns)
- POST: requires ADMIN role check
- Uses Zod validation
- Returns JSON with proper status codes

### Database Tables
- `master_fungsi`: id, nama, deskripsi, is_active, created_at
- `master_kegiatan`: id, fungsi_id, nama, deskripsi, is_active, created_at
- `master_klasifikasi_arsip`: id, nama, deskripsi, is_active, created_at

---

## 4. Document Transaction Model

### Table Schema (`supabase/migrations/003_dokumen_transaksi.sql`)
```sql
dokumen_transaksi: {
  id uuid PRIMARY KEY,
  judul text NOT NULL,
  fungsi_id uuid REFERENCES master_fungsi(id),
  kegiatan_jenis_id uuid REFERENCES master_kegiatan(id),
  is_ketua_tim boolean DEFAULT false,
  status text NOT NULL DEFAULT 'DRAFT',
  current_step text,
  revision_target text,
  revision_notes text,
  lampiran_urls text NOT NULL DEFAULT '[]', -- JSON array
  tahun integer NOT NULL,
  tanggal text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp,
  updated_at timestamp
}
```

### lampiran_urls Storage
Stored as JSON string: `[{ kelengkapan_id, nama, url, uploaded_at }]`

---

## 5. Storage Pattern (Preview/Download)

### Preview Endpoint
**File:** `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts`
- GET `/api/dokumen/[id]/preview/[lampiranIndex]`
- Uses `createSignedUrl` with 15-minute expiry, no download flag (inline preview)

### Download Endpoint
**File:** `src/routes/api/dokumen.$id.download.$lampiranIndex.ts`
- GET `/api/dokumen/[id]/download/[lampiranIndex]`
- Uses `createSignedUrl` with 1-hour expiry + download flag

### Storage Bucket
- Bucket: `dokumen-lampiran` (public=False, file size limit: 50MB)

---

## 6. Database Migration Pattern

### Location
- `supabase/migrations/` — SQL migration files
- `drizzle/` — Drizzle ORM migrations
- `src/lib/db/schema.ts` — Drizzle schema definitions

### Style
```sql
-- Descriptive header
-- TABLE creation with IF NOT EXISTS
-- COMMENTS on columns
-- INDEX creation
-- RLS policies
```

---

## 7. UI Component Pattern

### PageLayout (`src/components/dashboard/PageLayout.tsx`)
- Breadcrumb header, title, description
- Filters area, content area

### Table Pattern
```typescript
<div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead><tr className="bg-surface-container-low/30 text-left">...</tr></thead>
      <tbody><tr className="border-t border-outline-variant/20 hover:bg-primary/5">...</tr></tbody>
    </table>
  </div>
</div>
```

### Dialog/Modal (`src/components/ui/dialog.tsx`)
- Uses `@base-ui/react/dialog`
- Components: Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter

### Button (`src/components/ui/button.tsx`)
- Variants: default, destructive, outline, ghost
- Sizes: default, sm, icon-sm, icon-xs

### AppLayout (`src/components/layout/AppLayout.tsx`)
- `NAV_CONFIG` — Record of role → menu groups
- Role-specific sidebar menus
- Role switcher dropdown

### Preview Component (PPK dokumen detail)
- Modal overlay with backdrop blur
- iframe for PDF/image preview
- ESC key handler
- 15-minute signed URL fetch

---

## 8. Log Activity Pattern

### Table Schema
```sql
log_aktivitas: {
  id uuid PRIMARY KEY,
  dokumen_id uuid REFERENCES dokumen_transaksi(id),
  user_id uuid NOT NULL,
  aksi text NOT NULL, -- 'SUBMIT' | 'RESUBMIT' | 'PPK_APPROVE' | etc.
  catatan text,
  step_urutan integer,
  timestamp timestamp DEFAULT now()
}
```

### Log Insert Helper (`src/lib/dokumen-helpers.ts`)
```typescript
export async function insertLog(supabase, payload) {
  const { data, error } = await supabase
    .from('log_aktivitas')
    .insert({ dokumen_id, user_id, aksi, catatan, step_urutan })
  return { data: data as LogRow, error }
}
```

### ActivityLog Component (`src/components/dokumen/ActivityLog.tsx`)
- Timeline with icons per action type
- Color-coded by action

---

## 9. Cron/Job Pattern

### Current State
- No existing cron job implementations in `src/`
- `croner` dependency exists (used by Nitro)
- Vercel serverless functions environment

### For SPEC 05
- Need `POST /api/cron/arsip-retensi` endpoint
- Logic: auto-transition arsip based on masa retensi dates
- Should validate secret key for cron authentication
- Could use Supabase Edge Functions or external cron service

---

## 10. Preview Document Pattern (Complete Implementation)

### State Management
```typescript
const [previewingIdx, setPreviewingIdx] = useState<number | null>(null)
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
const [previewFilename, setPreviewFilename] = useState('')
const [previewLoading, setPreviewLoading] = useState(false)
```

### Preview Handler
```typescript
async function handlePreview(index: number) {
  setPreviewingIdx(index); setPreviewUrl(null); setPreviewLoading(true)
  try {
    const res = await fetch(`/api/ppk/dokumen/${id}/preview/${index}`, { credentials: 'include' })
    const json = await res.json()
    if (json.signedUrl) {
      setPreviewUrl(json.signedUrl)
      setPreviewFilename(json.filename ?? `lampiran-${index + 1}`)
    }
  } catch { /* silent */ } finally { setPreviewLoading(false) }
}
```

### Preview Modal UI
- Fixed overlay with backdrop blur (`bg-black/60 backdrop-blur-sm`)
- Rounded modal (`rounded-2xl shadow-2xl`)
- iframe preview in flex container
- ESC key handler

---

## 11. FSM Extension

The FSM (`src/lib/fsm.ts`) already has:
- `COMPLETED:ARCHIVE` → `ARCHIVED`
- `COMPLETED:SKIP` → `COMPLETED`

No extension needed for archive flow.

---

## Key Implementation Insights

1. **Follow role check pattern** — always validate role server-side with the `user_roles` join
2. **Use FSM `transition()` function** — never update status directly
3. **Use `insertLog()` for audit trail** — for every state change
4. **Reuse preview pattern** — same iframe modal from PPK dokumen detail
5. **Follow PageLayout/table pattern** — consistent UI structure
6. **Add migrations to `supabase/migrations/`** — SQL files with descriptive headers
7. **Use `createAdminClient()` for privileged operations** — bypass RLS
8. **Use Zod schemas for validation** — request body validation
9. **Follow lampiran_url schema** — store as JSON array in column
10. **Use ActivityLog component** — for displaying history

---

## New Tables Required (SPEC 05)

1. **`arsip`** — archive metadata (id, dokumen_id, nomor_surat, klasifikasi, retensi_aktif, retensi_inaktif, masa_aktif_berakhir, masa_inaktif_berakhir, status_arsip, is_ditolak, catatan_arsiparis, archived_by, archived_at)
2. **`master_klasifikasi_arsip`** — classification master data (id, nama, deskripsi, is_active, created_at)
3. **`arsip_verifikasi_penyusutan`** — verification queue (id, arsip_id, status, catatan, dipindahkan_oleh, decided_by, created_at, decided_at)
4. **`arsip_usul_musnah`** — destruction proposal queue (id, arsip_id, status, catatan, diusulkan_oleh, decided_by, created_at, decided_at)

---

## Navigation Config Update

Need to update `NAV_CONFIG['ARSIPARIS']` in `src/components/layout/AppLayout.tsx` with new menu items.

---

## Summary of Pattern Locations

| Pattern | Location |
|---|---|
| Role check | `src/routes/api/bendahara/inbox.ts` |
| FSM | `src/lib/fsm.ts` |
| Auth helpers | `src/lib/auth.ts` |
| Dokumen helpers | `src/lib/dokumen-helpers.ts` |
| Preview endpoint | `src/routes/api/dokumen.$id.preview.$lampiranIndex.ts` |
| Download endpoint | `src/routes/api/dokumen.$id.download.$lampiranIndex.ts` |
| PageLayout | `src/components/dashboard/PageLayout.tsx` |
| Table/Dialog | `src/components/ui/` |
| AppLayout | `src/components/layout/AppLayout.tsx` |
| ActivityLog | `src/components/dokumen/ActivityLog.tsx` |
| Migrate | `supabase/migrations/` |
| Drizzle schema | `src/lib/db/schema.ts` |