# Research: Codebase — Spec 02 Master Data Management

## Architecture Overview

Proyek ini menggunakan **TanStack Start (SSR)** dengan:
- Frontend: React 19 + TanStack Router (file-based routing)
- Backend: Nitro server (via TanStack Start)
- Database: Supabase (PostgreSQL via Supabase JS SDK)
- ORM: Drizzle ORM untuk type-safe schema definitions
- UI: Tailwind CSS v4 + shadcn/ui-like component library (base-ui)

## Key Findings

### 1. API Route Pattern (src/routes/api/)

Semua API route menggunakan `createFileRoute` dari TanStack Router:

```typescript
export const Route = createFileRoute('/api/auth/session')({
  get: async ({ request }) => { ... }
})
```

Format Response: selalu `new Response(JSON.stringify({ ... }), { status: 200, headers: { 'Content-Type': 'application/json' } })`

Pattern untuk guard session:
```typescript
const cookieHeader = request.headers.get('cookie')
const mockEvent = { request, cookie: { get: () => undefined, set: () => {}, delete: () => {} } } as any
const supabase = createServerSupabaseClient(mockEvent, cookieHeader)
const { data: { session } } = await supabase.auth.getSession()
```

### 2. Supabase Clients

Tiga jenis Supabase client:
- **`createServerSupabaseClient(event, cookieHeader)`** — untuk API routes dengan SSR cookie handling
- **`createAdminClient()`** — service role key, untuk admin operations
- **`getBrowserClient()`** — untuk client-side operations (di `supabase-browser.ts`)

### 3. Database Schema (src/lib/db/schema.ts)

Sudah ada schema Drizzle untuk:
- `roles` — id, nama, deskripsi, created_at
- `userRoles` — id, userId (UUID dari auth.users), roleId, created_at

Pattern yang harus diikuti untuk master data schemas:
```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
```

### 4. Auth Guards (src/lib/guards.ts)

Tiga guard functions yang sudah ada:
- `requireAuth(event)` — redirect ke /login jika tidak ada session
- `guardRole(event, role)` — redirect ke /forbidden jika tidak punya role
- `guardAnyRole(event, roles)` — redirect ke /forbidden jika tidak punya satupun

Tapi: **guard ini belum digunakan di page routes** — semua page pakai client-side auth check (useEffect + getBrowserClient).

### 5. UI Components Available

- `Button` — CVA-based variants (default, outline, secondary, ghost, destructive, link) + sizes
- `Dialog` — Base-UI based, dengan DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- `Select` — Base-UI based, dengan SelectTrigger, SelectContent, SelectItem, SelectValue
- `Table` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption
- `Input`, `Label`, `Card`, `Badge`, `Avatar`

### 6. Route Structure

TanStack Router file-based routing. Route tree ada di `routeTree.gen.ts`.

Pattern untuk nested routes dengan shared layout: perlu route group (misal `/admin/` directory) dengan shared layout component.

### 7. Zod Validation

 Sudah ada `src/lib/schemas/auth.ts` dengan validation schemas menggunakan Zod. Harus pakai Zod untuk semua request body validation.

### 8. Types

- `RoleName` enum di `src/lib/types/auth.ts`: 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS' | 'ADMIN'
- `Database` type export dari `src/lib/db/index.ts`

## Tech Stack untuk Spec 02

- API Routes: `src/routes/api/master-fungsi.ts`, `src/routes/api/master-kegiatan.ts`, `src/routes/api/master-kelengkapan.ts`
- Drizzle Schema: `src/lib/db/schema.ts` (extend existing)
- Read helpers: `src/lib/master-data.ts` (new file)
- UI pages: `src/routes/admin/master-data/` directory
- No migration needed — schema di-definition saja (migration SQL sudah ada di Spec 01)

## Naming Conventions

- Schema tables: camelCase (`masterFungsi`, `masterKegiatan`)
- DB columns: snake_case (`created_at`, `is_active`)
- API routes: kebab-case (`master-fungsi`, `master-kegiatan`)
- Page routes: kebab-case (file-based router)
- Components: PascalCase
