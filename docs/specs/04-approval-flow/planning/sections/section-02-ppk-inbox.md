# Section 02: PPK Inbox — API + Page

## Context

Section 01 (Zod schemas) is complete. This section builds the PPK inbox: a server-side API route that lists documents in `IN_PPK_VALIDATION` status, and a client-side page component that renders the list as a table.

## Objective

Create two files:
1. `src/routes/api/ppk/inbox.ts` — GET handler returning filtered/sorted document list
2. `src/routes/ppk/inbox.tsx` — Page component with table, filters, empty state

## Prerequisites

- Section 01 (schemas) must be complete
- `src/lib/dokumen-helpers.ts` — existing helpers available
- `src/components/dashboard/DashboardShell.tsx` — existing component
- `src/routes/ppk.tsx` — existing route (for pattern reference)

## Implementation Steps

### Part A: API Route (`src/routes/api/ppk/inbox.ts`)

Follow the pattern established in `src/routes/api/dokumen/index.ts`:

```
1. Helper: createClient(request) — same pattern as dokumen/index.ts
2. GET handler:
   a. Auth check: getServerSession() → 401 if no session
   b. Role check: query user_roles for PPK role → 403 if not PPK
   c. Parse query params: fungsi_id (optional), start_date (optional), end_date (optional)
   d. Query dokumen_transaksi:
      - status = 'IN_PPK_VALIDATION'
      - optional: fungsi_id filter
      - optional: created_at BETWEEN start_date AND end_date
      - order: created_at DESC
   e. Manual join: fungsi_nama from master_fungsi, kegiatan_nama from master_kegiatan
   f. Manual join: created_by user nama from profiles/users metadata
   g. Return { dokumen: [...] }
```

**Query approach:** Because this project uses Supabase client (PostgREST), not Drizzle ORM for queries, use Supabase `.filter()` and `.order()` chained calls. For date range, use `.gte('created_at', startDate)` and `.lte('created_at', endDate)`.

**User info for created_by:** Supabase doesn't easily join across auth.users → profiles. Get user metadata from `auth.users.user_metadata` via a separate query or use the `nama` from user_metadata directly. Do NOT query the profiles table — it may not exist. Use `auth.users(id=created_by)` or just include `created_by` id and let the page join display names.

**Return shape:**
```typescript
{
  dokumen: Array<{
    id: string
    judul: string
    fungsi_id: string
    fungsi_nama: string
    kegiatan_jenis_id: string
    kegiatan_nama: string
    created_by: string
    created_by_nama: string
    tahun: number
    tanggal: string
    created_at: string
  }>
}
```

### Part B: Page Component (`src/routes/ppk/inbox.tsx`)

Follow pattern from `src/routes/dokumen/saya.tsx`:

```
1. Component structure:
   - DashboardShell role="PPK" showHero={false}
   - Header with breadcrumb + title "Dokumen Menunggu Validasi"
   - Filter bar: select fungsi (optional), date input (optional), "Cari" button
   - Table with columns: No, Judul, Fungsi, Kegiatan, Pegawai, Tanggal, Aksi
   - Pagination
   - Empty state
   - Loading state
   - Error state with retry

2. Data fetching:
   - useEffect on mount → fetch('/api/ppk/inbox?fungsi_id=...&start_date=...&end_date=...')
   - credentials: 'include'
   - Set state: items[], loading, error

3. Filters:
   - fungsi dropdown: fetch list fungsi from API or hardcode (fetch from /api/master-fungsi)
   - start_date / end_date: date inputs
   - "Filter" button → rebuild URL with query params → refetch
   - "Reset" button → clear filters → refetch

4. Table row → link to /ppk/dokumen/[id] with Lihat button

5. Status badge: IN_PPK_VALIDATION → kuning "Validasi PPK" (reuse pattern from dokumen/saya.tsx)
```

## Files to Create/Modify

- `src/routes/api/ppk/inbox.ts` (NEW)
- `src/routes/ppk/inbox.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] GET /api/ppk/inbox returns 401 if not logged in
- [ ] GET /api/ppk/inbox returns 403 if user is not PPK
- [ ] GET /api/ppk/inbox returns documents with IN_PPK_VALIDATION status
- [ ] Response includes fungsi_nama and kegiatan_nama (joined)
- [ ] Response includes created_by_nama
- [ ] Documents ordered by created_at DESC
- [ ] Filter by fungsi_id returns only matching
- [ ] Filter by date range works
- [ ] Page renders table with correct columns
- [ ] Page shows loading spinner while fetching
- [ ] Page shows empty state when no documents

### Edge Cases
- [ ] No documents in IN_PPK_VALIDATION → empty array returned + empty state shown
- [ ] Invalid role → 403 returned + page shows error

## Definition of Done

- [ ] API route returns correct filtered/sorted list
- [ ] API route handles 401/403 properly
- [ ] API route handles filter params correctly
- [ ] Page renders table with all columns
- [ ] Page has working filters (fungsi, date range)
- [ ] Page has loading/empty/error states
- [ ] "Lihat" button navigates to /ppk/dokumen/[id]
- [ ] Status badge shows correct color