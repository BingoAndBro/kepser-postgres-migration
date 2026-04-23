# Research: Codebase Patterns for Spec 04 (Approval Flow)

## 1. Route Architecture

### API Routes Pattern
File-based TanStack Start routes with server handlers:
```
src/routes/api/[resource].ts
createFileRoute('/api/resource/')({
  server: {
    handlers: {
      GET: async ({ request, params }) => { ... },
      POST: async ({ request, params }) => { ... },
    }
  }
})
```
- Helpers: `createClient(request)` creates Supabase client from cookie header
- Auth: `getServerSession()` (verifikasi via `getUser()`)
- Response: `Response.json({ data }, status)`

### Page Routes Pattern
```
src/routes/[role]/[page].tsx
createFileRoute('/role/page')({ component: PageComponent })
```
- Auth check via `useEffect` + browser Supabase client + role query
- Data fetching via `fetch()` to API routes with `credentials: 'include'`
- Use `DashboardShell` wrapper

## 2. Auth & Role Guards

**Client-side (pages):**
```typescript
// Fetch roles from user_roles table, check include
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('role:roles(nama)')
  .eq('user_id', session.user.id)
const roleNames = rolesData?.map((r: any) => r.role?.nama).filter(Boolean) ?? []
if (!roleNames.includes('PPK')) { window.location.href = '/forbidden'; return }
```

**Server-side (API routes):**
- `getSession(supabase)` → session
- `userHasApproverRole(supabase, userId)` → boolean (PPK/BENDAHARA/ARSIPARIS/ADMIN)

## 3. FSM — Already Implemented

`src/lib/fsm.ts` sudah punya semua transisi yang dibutuhkan Spec 04:
- `IN_PPK_VALIDATION:APPROVE` → `IN_BENDAHARA_APPROVAL`, step=2
- `IN_PPK_VALIDATION:REJECT` → `NEED_REVISION`, target=USER, step=1
- `IN_BENDAHARA_APPROVAL:APPROVE` → `COMPLETED`, step=2
- `IN_BENDAHARA_APPROVAL:REJECT` → `NEED_REVISION`, target=PPK, step=1
- `NEED_REVISION:RESUBMIT_PPK` → `IN_BENDAHARA_APPROVAL`, step=2 (untuk PPK resubmit)

## 4. Dokumen Helpers

**Helper functions yang sudah ada:**
- `getDokumenById(supabase, id)` → DokumenRow
- `updateDokumenStatus(supabase, id, payload)` → `{ error? }`
- `insertLog(supabase, payload)` → `{ data?, error? }` (append-only)
- `userHasApproverRole(supabase, userId)` → boolean

**Existing types:**
- `DokumenRow` — all fields including lampiran_urls, status, current_step, revision_target
- `LogRow` — id, dokumen_id, user_id, aksi, catatan, step_urutan, timestamp

**Lampiran handling:** stored as JSON in `lampiran_urls` column, parsed with JSON.parse in helper

## 5. Zod Schemas

`src/lib/schemas/dokumen.ts` sudah ada:
- `createDokumenSchema` — for new dokumen
- `updateDokumenSchema` — for lampiran update
- `submitDokumenSchema` — empty object

**Yang perlu ditambahkan:**
- Schema untuk approve action (kosong body)
- Schema untuk reject action (body: { catatan: string })

## 6. Existing UI Patterns

**Status badge:** Used in dokumen/saya.tsx — COLOR-coded badges with custom className for each status

**Table pattern:** shadcn/ui Table with overflow-x-auto wrapper

**DashboardShell:** `showHero={false}` untuk non-dashboard pages. Props: `role: RoleName`, `children`, `showHero?: boolean`

**Loading states:** Spinner div + error state dengan retry button

**Empty state:** Icon + title + description + CTA button

## 7. Storage & Files

**Signed URL generation:** Already implemented in `/api/dokumen/[id]/download/[lampiranIndex]` — creates 1-hour signed URL via `supabaseAdmin.storage.from('dokumen-lampiran').createSignedUrl(path, 3600)`

## 8. Navigation Config

`AppLayout.tsx` NAV_CONFIG sudah mendefinisikan semua route untuk PPK dan BENDAHARA:
- PPK: `/ppk/inbox`, `/ppk/tervalidasi`, `/ppk/ditolak`, `/ppk/revisi`
- BENDAHARA: `/bendahara/inbox`, `/bendahara/ditolak`, `/bendahara/selesai`

## 9. Key Files That Will Be Created/Modified

**New files:**
- `src/routes/api/ppk/inbox.ts` — GET list
- `src/routes/api/ppk/dokumen/$id.ts` — GET detail
- `src/routes/api/ppk/dokumen/$id/approve.ts` — POST
- `src/routes/api/ppk/dokumen/$id/reject.ts` — POST
- `src/routes/api/ppk/resubmit/$id.ts` — POST
- `src/routes/api/bendahara/inbox.ts` — GET list
- `src/routes/api/bendahara/dokumen/$id.ts` — GET detail
- `src/routes/api/bendahara/dokumen/$id/approve.ts` — POST
- `src/routes/api/bendahara/dokumen/$id/reject.ts` — POST
- `src/routes/ppk/inbox.tsx` — page
- `src/routes/ppk/tervalidasi.tsx` — page
- `src/routes/ppk/ditolak.tsx` — page
- `src/routes/ppk/revisi.tsx` — page
- `src/routes/ppk/dokumen/$id.tsx` — page
- `src/routes/bendahara/inbox.tsx` — page
- `src/routes/bendahara/ditolak.tsx` — page
- `src/routes/bendahara/selesai.tsx` — page
- `src/routes/bendahara/dokumen/$id.tsx` — page
- `src/lib/schemas/approval.ts` — Zod schemas

**Files to modify:**
- `src/lib/schemas/dokumen.ts` — add approve/reject schemas
- `src/routes/ppk.tsx` — update hero CTA to point to /ppk/inbox (already correct)
- `src/routes/bendahara.tsx` — update hero CTA to point to /bendahara/inbox (already correct)
- AppLayout nav config — already has routes, but some still "soon" (need real pages)

## 10. RLS Considerations

Documents in IN_PPK_VALIDATION need to be visible to PPK role. Current RLS policies allow PPK to see via `userHasApproverRole` check. API routes enforce server-side auth check before any DB access.

## 11. Pattern Reference

Existing approve workflow belum ada — Spec 04 adalah yang pertama. Semua pola yang ada adalah dari submit flow (Spec 03). Tidak ada existing approval API pattern di codebase.