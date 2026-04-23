# DETAIL FIX PLAN - DMS MVP
## Critical Issues Resolution

**Created:** 2026-04-18  
**Based on:** AGENTS.md, docs/BEST_PRACTICES.md, docs/mvp-best-practices.md

---

## EXECUTIVE SUMMARY

Analisis komprehensif codebase DMS MVP menunjukkan beberapa critical issues yang perlu diperbaiki untuk memenuhi best practices yang telah ditetapkan. Berikut ringkasannya:

| Category | Status | Critical Issues |
|----------|--------|----------------|
| **Database Schema** | ⚠️ Partial | Missing `arsip` table, `lampiran_urls` stored as `text` not `jsonb` |
| **FSM Implementation** | ✅ Good | Single source of truth, comprehensive tests |
| **API Security** | ⚠️ Needs Fix | Admin client overuse bypasses RLS, no transactions |
| **SSR Architecture** | ❌ Disabled | `ssr: false` contradicts framework design |
| **Error Handling** | ⚠️ Inconsistent | No standard error format, no Error Boundaries |
| **Arsiparis Flow** | ❌ Incomplete | Dashboard only, no archiving UI |

---

## PRIORITY 1: CRITICAL (Harus Fix Segera)

### 1. Missing `arsip` Table
**Problem:** AGENTS.md mendefinisikan tabel `arsip` (9 tabel inti), tapi tidak ada di schema maupun migration.

**Impact:** Workflow `COMPLETED → ARCHIVED` tidak bisa berfungsi. Arsiparis tidak bisa mengarsipkan dokumen.

**Migration file:** `supabase/migrations/005_arsip_table.sql`
```sql
-- Migration: 005_arsip_table
-- Created by: Deep Implement
-- Description: Arsip table for completed documents

CREATE TABLE IF NOT EXISTS "arsip" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dokumen_id" uuid NOT NULL UNIQUE REFERENCES "public"."dokumen_transaksi"("id") ON DELETE cascade,
  "nomor_surat" text,
  "klasifikasi" text,
  "retensi" text,
  "catatan_arsiparis" text,
  "archived_by" uuid NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE "arsip" IS 'Metadata arsip final untuk dokumen yang sudah COMPLETED dan di-approve Arsiparis';
COMMENT ON COLUMN "arsip"."dokumen_id" IS 'FK ke dokumen_transaksi.id - UNIQUE karena satu dokumen hanya bisa diarsip sekali';

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS "arsip_dokumen_id_idx" ON "arsip"("dokumen_id");
CREATE INDEX IF NOT EXISTS "arsip_archived_by_idx" ON "arsip"("archived_by");

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE "arsip" ENABLE ROW LEVEL SECURITY;

-- Policy: Arsiparis/ADMIN bisa insert arsip baru
CREATE POLICY "arsiparis_insert_arsip" ON "arsip"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."user_roles" ur
      JOIN "public"."roles" r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('ARSIPARIS', 'ADMIN')
    )
  );

-- Policy: Semua approver role bisa read arsip (untuk tracking/audit)
CREATE POLICY "approver_read_arsip" ON "arsip"
  FOR SELECT USING (
    auth.uid() = "archived_by"
    OR EXISTS (
      SELECT 1 FROM "public"."user_roles" ur
      JOIN "public"."roles" r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('PPK', 'BENDAHARA', 'ARSIPARIS', 'ADMIN')
    )
  );

-- Policy: Arsiparis/ADMIN bisa update arsip (untuk edit metadata)
CREATE POLICY "arsiparis_update_arsip" ON "arsip"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."user_roles" ur
      JOIN "public"."roles" r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.nama IN ('ARSIPARIS', 'ADMIN')
    )
  );

-- NOTE: DELETE tidak diizinkan - arsip adalah record permanen
```

**Files to update:**
- `src/lib/db/schema.ts` - add `arsip` table definition:
```typescript
export const arsip = pgTable('arsip', {
  id: uuid('id').primaryKey().defaultRandom(),
  dokumenId: uuid('dokumen_id').notNull().unique().references(() => dokumenTransaksi.id, { onDelete: 'cascade' }),
  nomorSurat: text('nomor_surat'),
  klasifikasi: text('klasifikasi'),
  retensi: text('retensi'),
  catatanArsiparis: text('catatan_arsiparis'),
  archivedBy: uuid('archived_by').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Arsip = typeof arsip.$inferSelect
export type NewArsip = typeof arsip.$inferInsert
```

- `src/lib/db/index.ts` - re-export `arsip`

---

### 2. SSR Decision (Enable atau Dokumentasi)
**Problem:** `ssr: false` di `__root.tsx` bertentangan dengan TanStack Start SSR architecture dan AGENTS.md yang menyatakan framework sebagai SSR.

**Impact:**
- Auth check berjalan di client-side saja
- Initial page load tidak di-render di server
- SEO tidak optimal

**Fix - Option A (Enable SSR):**
```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  ssr: true,  // Enable SSR
  beforeLoad: async ({ location, cause }) => {
    if (PUBLIC_PATHS.some(p => location.pathname.startsWith(p))) {
      return
    }
    if (cause === 'preload') {
      return
    }
    
    // SSR auth check - dijalankan di server
    const cookieHeader = location.request.headers.get('cookie') ?? null
    const supabase = createServerSupabaseClient({ 
      request: location.request,
      cookie: { 
        get: (name: string) => {
          const cookies = parseCookies(cookieHeader)
          const c = cookies.find(c => c.name === name)
          return c ? { value: c.value } : undefined
        }, 
        set: () => {}, 
        delete: () => {} 
      }
    }, cookieHeader)
    const session = await getSession(supabase)
    
    if (!session) {
      throw redirect({ to: '/login', search: { redirectTo: location.pathname } })
    }
  },
  // ...
})
```

**Fix - Option B (Dokumentasi - jika SPA-only memang diperlukan):**
Tambahkan justification di AGENTS.md pada section Tech Stack:
```markdown
> **Catatan Arsitektur:** Project menggunakan SPA mode (`ssr: false`) karena:
> - Auth dilakukan sepenuhnya client-side via Supabase Auth
> - Tidak ada requirement SEO untuk MVP
> - Initial load tidak kritis untuk aplikasi internal
> - Menghindari kompleksitas SSR untuk phase MVP
```

**Recommendation:** Gunakan Option B (dokumentasikan) untuk MVP. Jika suatu saat nanti SSR diperlukan (misal untuk SEO atau performance), baru enable dengan proper testing.

---

### 3. Database Transactions
**Problem:** Status update + log insert di approve/reject tidak atomic. Jika log insert gagal setelah status diupdate, data menjadi inkonsisten.

**Fix - tambahkan helper transaction:**

`src/lib/dokumen-helpers.ts`:
```typescript
/**
 * Approve dokumen dengan log activity dalam satu operasi.
 * Jika log gagal, status akan di-rollback.
 */
export async function approveDokumenWithLog(
  supabase: SupabaseClient,
  params: {
    dokumenId: string
    userId: string
    currentStatus: string  // Untuk optimistic lock
    newStatus: string
    newCurrentStep: string | null
    newRevisionTarget: string | null
    stepUrutan: number
    aksi: 'PPK_APPROVE' | 'BENDAHARA_APPROVE'
  }
): Promise<{ error?: string }> {
  // 1. Status update dengan optimistic lock
  const { error: updateError } = await supabase
    .from('dokumen_transaksi')
    .update({
      status: params.newStatus,
      current_step: params.newCurrentStep,
      revision_target: params.newRevisionTarget,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.dokumenId)
    .eq('status', params.currentStatus) // Optimistic lock - hanya update jika status sesuai
  
  if (updateError) {
    console.error('[dokumen-helpers] approveDokumenWithLog - update error:', updateError)
    return { error: 'Gagal update status dokumen' }
  }
  
  // 2. Log insert
  const { error: logError } = await supabase
    .from('log_aktivitas')
    .insert({
      dokumen_id: params.dokumenId,
      user_id: params.userId,
      aksi: params.aksi,
      step_urutan: params.stepUrutan,
    })
  
  if (logError) {
    // 3. Rollback jika log gagal
    console.error('[dokumen-helpers] approveDokumenWithLog - log error, rolling back:', logError)
    
    const { error: rollbackError } = await supabase
      .from('dokumen_transaksi')
      .update({
        status: params.currentStatus,
        current_step: params.currentStatus === 'IN_PPK_VALIDATION' ? 'PPK' : 'BENDAHARA',
        revision_target: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.dokumenId)
    
    if (rollbackError) {
      console.error('[dokumen-helpers] CRITICAL - rollback also failed:', rollbackError)
      return { error: 'CRITICAL: Transaksi gagal dan rollback juga gagal. Segera hubungi admin.' }
    }
    
    return { error: 'Gagal mencatat log aktivitas. Status telah dikembalikan.' }
  }
  
  return {}
}

/**
 * Reject dokumen dengan log activity dalam satu operasi.
 * Jika log gagal, status akan di-rollback.
 */
export async function rejectDokumenWithLog(
  supabase: SupabaseClient,
  params: {
    dokumenId: string
    userId: string
    currentStatus: string
    revisionTarget: 'USER' | 'PPK'
    revisionNotes: string
    stepUrutan: number
    aksi: 'PPK_REJECT' | 'BENDAHARA_REJECT'
  }
): Promise<{ error?: string }> {
  // 1. Status update dengan optimistic lock
  const { error: updateError } = await supabase
    .from('dokumen_transaksi')
    .update({
      status: 'NEED_REVISION',
      revision_target: params.revisionTarget,
      revision_notes: params.revisionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.dokumenId)
    .eq('status', params.currentStatus)
  
  if (updateError) {
    console.error('[dokumen-helpers] rejectDokumenWithLog - update error:', updateError)
    return { error: 'Gagal update status dokumen' }
  }
  
  // 2. Log insert
  const { error: logError } = await supabase
    .from('log_aktivitas')
    .insert({
      dokumen_id: params.dokumenId,
      user_id: params.userId,
      aksi: params.aksi,
      catatan: params.revisionNotes,
      step_urutan: params.stepUrutan,
    })
  
  if (logError) {
    // 3. Rollback jika log gagal
    console.error('[dokumen-helpers] rejectDokumenWithLog - log error, rolling back:', logError)
    
    const { error: rollbackError } = await supabase
      .from('dokumen_transaksi')
      .update({
        status: params.currentStatus,
        revision_target: null,
        revision_notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.dokumenId)
    
    if (rollbackError) {
      console.error('[dokumen-helpers] CRITICAL - rollback also failed:', rollbackError)
      return { error: 'CRITICAL: Transaksi gagal dan rollback juga gagal. Segera hubungi admin.' }
    }
    
    return { error: 'Gagal mencatat log aktivitas. Status telah dikembalikan.' }
  }
  
  return {}
}
```

**Files to update:**
- `src/lib/dokumen-helpers.ts` - add `approveDokumenWithLog` and `rejectDokumenWithLog`
- `src/routes/api/ppk/dokumen/$id/approve.ts` - use `approveDokumenWithLog`
- `src/routes/api/ppk/dokumen/$id/reject.ts` - use `rejectDokumenWithLog`
- `src/routes/api/bendahara/dokumen/$id/approve.ts` - use `approveDokumenWithLog`
- `src/routes/api/bendahara/dokumen/$id/reject.ts` - use `rejectDokumenWithLog`

---

### 4. Kurangi Admin Client Usage, Perbaiki RLS Pattern
**Problem:** Terlalu banyak menggunakan `createAdminClient()` yang bypass RLS. Ini bertentangan dengan AGENTS.md invariant #7: "Supabase RLS = garis pertahanan kedua".

**Current Issues:**
- `approve.ts` menggunakan admin client untuk fetch dokumen
- `submit.ts` menggunakan admin client untuk update status

**Fix:**

```typescript
// src/routes/api/ppk/dokumen/$id/approve.ts - AFTER

// Gunakan supabase client yang sudah di-auth dengan user session
// RLS akan enforce berdasarkan auth.uid()

// Fetch dokumen - gunakan user client (RLS akan enforce approver policy)
// Karena kita sudah check role di atas, ini aman
const { data: dok, error: dokError } = await supabase
  .from('dokumen_transaksi')
  .select('id, status, created_by')
  .eq('id', params.id)
  .single()

// Update status - menggunakan admin client karena RLS policy untuk update
// dari PEGAWAI hanya allow UPDATE pada NEED_REVISION status.
// Untuk approve flow, kita perlu bypass RLS ini karena approver bukan owner.
const admin = createAdminClient()
const updateErr = await updateDokumenStatus(admin, params.id, {
  status: result.newStatus,
  currentStep: result.newCurrentStep,
  revisionTarget: result.newRevisionTarget,
})

// Log insert - gunakan admin client karena log_insert policy check auth.uid() = user_id
await insertLog(admin, {
  dokumenId: params.id,
  userId: session.user.id,
  aksi: 'PPK_APPROVE',
  stepUrutan: result.stepUrutan ?? 2,
})
```

**Pattern yang Benar:**
1. **SELECT dokumen:** Gunakan user client (`supabase`) - RLS akan enforce `approver_select_dokumen` policy
2. **UPDATE status:** Gunakan admin client (`createAdminClient()`) - Karena RLS policy `pegawai_update_own_dokumen` hanya allow update untuk `NEED_REVISION` status dengan `revision_target = 'USER'`. Approver tidak bisa update via policy ini.
3. **INSERT log:** Gunakan admin client (`createAdminClient()`) - Karena `log_insert` policy check `auth.uid() = user_id`, dan kita insert dengan user ID dari session.

**Files to update:**
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/ppk/dokumen/$id/reject.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/reject.ts`
- `src/routes/api/dokumen/submit.ts`

---

### 5. Fix Mock Event Pattern
**Problem:** Pattern `mockEvent` dengan `cookie: { get: () => undefined }` merusak cookie handling yang seharusnya dikelola TanStack Start.

**Fix - gunakan helper yang sudah ada:**

`src/lib/supabase-server.ts` (already has `parseCookies`):
```typescript
export function parseCookies(cookieHeader: string | null): Array<{ name: string; value: string }> {
  if (!cookieHeader) return []
  return cookieHeader.split('; ').map(c => {
    const eqIdx = c.indexOf('=')
    if (eqIdx === -1) return { name: c.trim(), value: '' }
    return { name: c.substring(0, eqIdx).trim(), value: decodeURIComponent(c.substring(eqIdx + 1)) }
  })
}
```

**Refactored API helper:**
```typescript
// src/routes/api/_helpers.ts (file baru)

import { createServerSupabaseClient, parseCookies } from '#/lib/supabase-server'
import type { ServerEventContext } from '#/lib/supabase-server'

/**
 * Create authenticated Supabase client from Request.
 * Parses cookies properly without mock objects.
 */
export function createAuthClient(request: Request): ReturnType<typeof createServerSupabaseClient> {
  const cookieHeader = request.headers.get('cookie') ?? null
  const cookies = parseCookies(cookieHeader)
  
  return createServerSupabaseClient({
    request,
    cookie: {
      get: (name: string) => {
        const c = cookies.find(c => c.name === name)
        return c ? { value: c.value } : undefined
      },
      set: () => {
        // No-op for read-only operations
        // Cookie write handled by response headers
      },
      delete: () => {
        // No-op for read-only operations
      },
    },
  }, cookieHeader)
}
```

**Files to update (10+ files):**
- `src/routes/api/auth/login.ts`
- `src/routes/api/auth/logout.ts`
- `src/routes/api/auth/session.ts`
- `src/routes/api/auth/role-switch.ts`
- `src/routes/api/dokumen/index.ts`
- `src/routes/api/dokumen/$id.ts`
- `src/routes/api/dokumen/submit.ts`
- `src/routes/api/dokumen/$id/submit.ts`
- `src/routes/api/master-fungsi.ts`
- `src/routes/api/master-kegiatan.ts`
- `src/routes/api/master-kelengkapan.ts`
- `src/routes/api/ppk/inbox.ts`
- `src/routes/api/ppk/tervalidasi.ts`
- `src/routes/api/ppk/ditolak.ts`
- `src/routes/api/ppk/revisi.ts`
- `src/routes/api/ppk/dokumen/$id.ts`
- `src/routes/api/ppk/dokumen/$id/approve.ts`
- `src/routes/api/ppk/dokumen/$id/reject.ts`
- `src/routes/api/ppk/resubmit/$id.ts`
- `src/routes/api/bendahara/inbox.ts`
- `src/routes/api/bendahara/selesai.ts`
- `src/routes/api/bendahara/ditolak.ts`
- `src/routes/api/bendahara/dokumen/$id.ts`
- `src/routes/api/bendahara/dokumen/$id/approve.ts`
- `src/routes/api/bendahara/dokumen/$id/reject.ts`
- `src/routes/api/upload.ts`

---

## PRIORITY 2: MODERATE

### 6. Ubah `lampiran_urls` ke `jsonb`
**Problem:** `lampiran_urls` disimpan sebagai `text` dengan JSON string, bukan `jsonb`. Ini mencegah native PostgreSQL JSON queries dan indexing.

**Migration:** `supabase/migrations/006_lampiran_urls_jsonb.sql`
```sql
-- Migration: 006_lampiran_urls_jsonb
-- Description: Change lampiran_urls from text to jsonb for native JSON queries

ALTER TABLE "dokumen_transaksi" 
  ALTER COLUMN "lampiran_urls" TYPE jsonb 
  USING (CASE 
    WHEN lampiran_urls = '[]' OR lampiran_urls IS NULL THEN '[]'::jsonb
    ELSE lampiran_urls::jsonb
  END);

-- Add index for JSON queries (if needed)
-- CREATE INDEX IF NOT EXISTS "dokumen_transaksi_lampiran_urls_idx" 
--   ON "dokumen_transaksi" USING GIN ("lampiran_urls");
```

**Files to update:**
- `src/lib/dokumen-helpers.ts` - parseDokumen function:
```typescript
// BEFORE
function parseDokumen(raw: any): DokumenRow {
  let lampiranUrls: LampiranUrl[] = []
  if (raw.lampiran_urls) {
    if (typeof raw.lampiran_urls === 'string') {
      try {
        lampiranUrls = JSON.parse(raw.lampiran_urls)
      } catch {
        lampiranUrls = []
      }
    } else {
      lampiranUrls = raw.lampiran_urls
    }
  }
  // ...
}

// AFTER - jsonb returns object directly
function parseDokumen(raw: any): DokumenRow {
  let lampiranUrls: LampiranUrl[] = []
  if (raw.lampiran_urls) {
    // jsonb column returns object/array directly
    lampiranUrls = Array.isArray(raw.lampiran_urls) 
      ? raw.lampiran_urls 
      : []
  }
  // ...
}
```

---

### 7. Zod v4 Compatibility Check
**Problem:** package.json menggunakan `"zod": "^4.3.6"` yang memiliki breaking API changes dari v3.

**Fix:**
```bash
# Test semua schemas dengan Zod v4
pnpm exec tsc --noEmit
pnpm test
```

**Likely issues to check:**
- Schema dengan `.extend()` - changed in v4
- Schema dengan `.merge()` - changed in v4
- `z.infer` masih supported

**Files to verify:**
- `src/lib/schemas/auth.ts`
- `src/lib/schemas/dokumen.ts`
- `src/lib/schemas/master-data.ts`

---

### 8. Input Sanitization untuk Judul
**Problem:** `userName` dari user metadata langsung disisipkan ke judul tanpa sanitasi.

**Fix:** `src/routes/api/dokumen/submit.ts`
```typescript
/**
 * Sanitize input untuk digunakan dalam judul.
 * Strip HTML tags dan karakter berbahaya.
 */
function sanitizeForJudul(input: string): string {
  if (!input) return ''
  
  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous characters
    .replace(/[\\"'`<>]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Truncate to reasonable length
    .substring(0, 50)
}

// Usage
const safeUserName = sanitizeForJudul(
  session.user.user_metadata?.nama_lengkap as string | undefined
  || session.user.user_metadata?.user_name as string | undefined
  || session.user.email?.split('@')[0]
  || 'Unknown'
)

const judul = `${kegiatan.nama} ${parsed.data.tahun} ${safeUserName}`
```

---

### 9. Standard Error Response Format
**Problem:** Tidak ada format unified error response. Setiap API handler mengembalikan format berbeda.

**Fix:** `src/lib/utils/errors.ts`
```typescript
/**
 * Standard error response format.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return Response.json(
    {
      error: true,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Not found error shorthand.
 */
export function notFoundError(resource: string) {
  return errorResponse(`${resource} tidak ditemukan`, 404)
}

/**
 * Unauthorized error shorthand.
 */
export function unauthorizedError() {
  return errorResponse('Unauthorized', 401)
}

/**
 * Forbidden error shorthand.
 */
export function forbiddenError(message: string = 'Akses ditolak') {
  return errorResponse(message, 403)
}

/**
 * Validation error shorthand.
 */
export function validationError(details: unknown) {
  return errorResponse('Validasi gagal', 400, details)
}

/**
 * Server error shorthand.
 */
export function serverError(message: string = 'Terjadi kesalahan server') {
  return errorResponse(message, 500)
}
```

**Usage in API:**
```typescript
import { errorResponse, notFoundError, unauthorizedError, validationError } from '#/lib/utils/errors'

export const Route = createFileRoute('/api/ppk/dokumen/$id/approve')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!session) {
          return unauthorizedError()
        }
        
        if (!dok) {
          return notFoundError('Dokumen')
        }
        
        if (!result.success) {
          return errorResponse(result.error ?? 'Transisi gagal', 400)
        }
        
        // ...
      },
    },
  },
})
```

**Files to create:**
- `src/lib/utils/errors.ts`

**Files to update:** Semua `src/routes/api/**/*.ts`

---

### 10. Error Boundaries
**Problem:** Tidak ada Error Boundary component untuk menangani runtime errors.

**Fix:** `src/components/ui/error-boundary.tsx`
```tsx
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
            <div className="rounded-full bg-destructive/10 p-4">
              <svg
                className="h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Terjadi Kesalahan</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Maaf, terjadi kesalahan yang tidak terduga.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-4 max-w-md text-left rounded-lg bg-destructive/10 p-4 text-xs">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Refresh Halaman
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

**Usage in root:**
```tsx
// src/routes/__root.tsx
import { ErrorBoundary } from '#/components/ui/error-boundary'

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        <ErrorBoundary
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <p>Something went wrong</p>
            </div>
          }
        >
          <AppLayout>
            {children}
          </AppLayout>
        </ErrorBoundary>
        <TanStackDevtools ... />
        <Scripts />
      </body>
    </html>
  )
}
```

**Files to create:**
- `src/components/ui/error-boundary.tsx`

---

### 11. Rate Limiting
**Problem:** Tidak ada rate limiting di endpoint manapun, termasuk `/api/upload`.

**Fix:** `src/lib/utils/rate-limit.ts`
```typescript
/**
 * Simple in-memory rate limiter.
 * Note: Untuk production, gunakan Redis atau similar.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for an identifier.
 * 
 * @param identifier - Unique identifier (e.g., IP, user ID)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now()
  const record = store.get(identifier)

  // Initialize or reset if window expired
  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  // Check limit
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: record.resetAt 
    }
  }

  // Increment
  record.count++
  return { 
    allowed: true, 
    remaining: limit - record.count,
    resetAt: record.resetAt
  }
}

/**
 * Clean up expired records (call periodically).
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredRecords, 5 * 60 * 1000)
```

**Usage in API:**
```typescript
import { checkRateLimit, errorResponse } from '#/lib/utils/rate-limit'

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
        const { allowed, remaining, resetAt } = checkRateLimit(ip, 20, 60000)
        
        if (!allowed) {
          return errorResponse(
            'Terlalu banyak upload request. Silakan coba lagi nanti.',
            429
          )
        }
        
        // Set rate limit headers
        const headers = new Headers()
        headers.set('X-RateLimit-Remaining', remaining.toString())
        headers.set('X-RateLimit-Reset', resetAt.toString())
        
        // ... rest of handler
        return new Response(response, { headers })
      },
    },
  },
})
```

**Files to create:**
- `src/lib/utils/rate-limit.ts`

---

## PRIORITY 3: ARSIPARIS COMPLETION

### 12. Arsiparis Flow Implementation

**Problem:** Arsiparis pages hanya dashboard yang ada, semua page lain show "Soon" placeholder.

**Files to create:**

```
src/routes/arsiparis/
├── arsip.tsx                    # Layout route
├── arsip/
│   ├── index.tsx               # List archived documents
│   └── $id.tsx                 # Archived document detail
└── dokumen/
    └── $id.tsx                 # Archive action page

src/routes/api/arsiparis/
└── dokumen/
    └── $id/
        ├── archive.ts          # POST - Archive a document
        └── skip.ts             # POST - Skip archiving
```

**API Implementation:**
```typescript
// src/routes/api/arsiparis/dokumen/$id/archive.ts
import { createFileRoute } from '@tanstack/react-router'
import { createAuthClient } from '~/routes/api/_helpers'
import { getSession } from '#/lib/auth'
import { transition } from '#/lib/fsm'
import { createAdminClient } from '#/lib/supabase-admin'
import { errorResponse, validationError, unauthorizedError, forbiddenError } from '#/lib/utils/errors'

const archiveDokumenSchema = z.object({
  nomorSurat: z.string().optional(),
  klasifikasi: z.string().optional(),
  retensi: z.string().optional(),
  catatan: z.string().optional(),
})

export const Route = createFileRoute('/api/arsiparis/dokumen/$id/archive')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const supabase = createAuthClient(request)
        const session = await getSession(supabase)
        
        if (!session) {
          return unauthorizedError()
        }
        
        // Check ARSIPARIS role
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role:roles(nama)')
          .eq('user_id', session.user.id)
        
        const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
        if (!roleNames.includes('ARSIPARIS') && !roleNames.includes('ADMIN')) {
          return forbiddenError('Hanya Arsiparis yang bisa mengarsip dokumen')
        }
        
        // Parse & validate body
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return errorResponse('Invalid JSON body', 400)
        }
        
        const parsed = archiveDokumenSchema.safeParse(body)
        if (!parsed.success) {
          return validationError(parsed.error.flatten())
        }
        
        // Fetch dokumen
        const admin = createAdminClient()
        const { data: dok, error: dokError } = await admin
          .from('dokumen_transaksi')
          .select('id, status')
          .eq('id', params.id)
          .single()
        
        if (dokError || !dok) {
          return errorResponse('Dokumen tidak ditemukan', 404)
        }
        
        if (dok.status !== 'COMPLETED') {
          return errorResponse('Dokumen belum COMPLETED', 400)
        }
        
        // FSM transition: COMPLETED → ARCHIVED
        const result = transition(dok.status, 'ARCHIVE', 'ARSIPARIS')
        if (!result.success) {
          return errorResponse(result.error ?? 'Transisi gagal', 400)
        }
        
        // Update status
        const { error: updateError } = await admin
          .from('dokumen_transaksi')
          .update({
            status: result.newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.id)
        
        if (updateError) {
          return errorResponse('Gagal update status', 500)
        }
        
        // Insert arsip record
        const { error: arsipError } = await admin
          .from('arsip')
          .insert({
            dokumen_id: params.id,
            nomor_surat: parsed.data.nomorSurat ?? null,
            klasifikasi: parsed.data.klasifikasi ?? null,
            retensi: parsed.data.retensi ?? null,
            catatan_arsiparis: parsed.data.catatan ?? null,
            archived_by: session.user.id,
          })
        
        if (arsipError) {
          return errorResponse('Gagal membuat arsip', 500)
        }
        
        // Insert log
        await admin
          .from('log_aktivitas')
          .insert({
            dokumen_id: params.id,
            user_id: session.user.id,
            aksi: 'ARCHIVE',
            step_urutan: null,
          })
        
        return Response.json({ success: true, message: 'Dokumen berhasil diarsip' })
      },
    },
  },
})
```

**Files to create (6 files):**
- `src/routes/arsiparis/arsip.tsx`
- `src/routes/arsiparis/arsip/index.tsx`
- `src/routes/arsiparis/arsip/$id.tsx`
- `src/routes/arsiparis/dokumen/$id.tsx`
- `src/routes/api/arsiparis/dokumen/$id/archive.ts`
- `src/routes/api/arsiparis/dokumen/$id/skip.ts`

---

## PRIORITY 4: DEVELOPMENT WORKFLOW

### 13. Typecheck Script
**Problem:** Tidak ada `typecheck` di package.json scripts.

**Fix:** `package.json`
```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier src --write"
  }
}
```

---

### 14. Pre-commit Hooks
**Problem:** Tidak ada pre-commit hooks untuk memastikan code quality.

**Fix:**
```bash
# Install
pnpm add -D husky lint-staged
npx husky init
```

**`.husky/pre-commit`:**
```bash
pnpm exec lint-staged
```

**`package.json` update:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"],
    "*.{css,md}": "prettier --write"
  }
}
```

**`.eslintrc.cjs` (jika belum ada):**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Add project-specific rules
  },
}
```

---

## EXECUTION ORDER

```
Phase 1: Database & Schema
├── 1.1 Create 005_arsip_table.sql migration
├── 1.2 Create 006_lampiran_urls_jsonb.sql migration
├── 1.3 Add arsip to schema.ts
└── 1.4 Update parseDokumen for jsonb

Phase 2: Core Fixes
├── 2.1 Add transaction helpers to dokumen-helpers.ts
├── 2.2 Refactor approve/reject handlers to use transactions
├── 2.3 Create src/routes/api/_helpers.ts
├── 2.4 Refactor all API routes to use createAuthClient
├── 2.5 Create src/lib/utils/errors.ts
├── 2.6 Refactor all API routes to use errorResponse helpers
└── 2.7 Add SSR documentation or enable SSR

Phase 3: Security & DX
├── 3.1 Add input sanitization to submit.ts
├── 3.2 Create src/components/ui/error-boundary.tsx
├── 3.3 Create src/lib/utils/rate-limit.ts
├── 3.4 Add typecheck script to package.json
├── 3.5 Setup pre-commit hooks
└── 3.6 Zod v4 compatibility check

Phase 4: Feature Completion
├── 4.1 Create Arsiparis API routes
├── 4.2 Create Arsiparis page routes
└── 4.3 Test complete workflow
```

---

## SUMMARY TABLE

| Priority | Issue | Effort | Files | Status |
|----------|-------|--------|-------|--------|
| **P1-C1** | Missing `arsip` table | Medium | 3 | Pending |
| **P1-C2** | SSR disabled | Low | 1 | Pending |
| **P1-C3** | No transactions | Medium | 5 | Pending |
| **P1-C4** | Admin client overuse | Medium | 5 | Pending |
| **P1-C5** | Mock event pattern | Medium | 26 | Pending |
| **P2-6** | lampiran_urls jsonb | Low | 2 | Pending |
| **P2-7** | Zod v4 compatibility | Low | 1 | Pending |
| **P2-8** | Input sanitization | Low | 1 | Pending |
| **P2-9** | Standard error format | Medium | 1 + 26 API | Pending |
| **P2-10** | Error boundaries | Medium | 2 | Pending |
| **P2-11** | Rate limiting | Medium | 2 | Pending |
| **P3-12** | Arsiparis flow | High | 6 | Pending |
| **P4-13** | typecheck script | Low | 1 | Pending |
| **P4-14** | Pre-commit hooks | Low | 2 | Pending |

---

## PHASED APPROACH RECOMMENDATION

Jika keterbatasan waktu, prioritaskan execution berurutan:

**Minimum Viable Fix (Wajib):**
1. P1-C1: Missing `arsip` table
2. P1-C3: No transactions  
3. P2-9: Standard error format
4. P3-12: Arsiparis flow completion

**Nice to Have (Tingkatkan Kualitas):**
5. P2-6: lampiran_urls jsonb
6. P2-10: Error boundaries
7. P4-13: typecheck script

**Polish (Quality of Life):**
8. P1-C2: SSR documentation
9. P1-C5: Mock event pattern refactor
10. P2-11: Rate limiting

---

*Document version: 1.0.0*  
*Last updated: 2026-04-18*