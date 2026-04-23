# Section 05: PPK Tervalidasi + Ditolak List Pages

## Context

Section 02 (PPK Inbox) must be complete. This section creates two simple list pages that reuse the inbox pattern for different document statuses.

## Objective

Create two files:
1. `src/routes/ppk/tervalidasi.tsx` — List documents processed by PPK (IN_BENDAHARA_APPROVAL, COMPLETED, ARCHIVED)
2. `src/routes/ppk/ditolak.tsx` — List documents rejected by PPK (NEED_REVISION, target=USER)

## Prerequisites

- Section 02 (PPK Inbox page) — same table component pattern
- API route for this is implied to use existing endpoints OR simple fetch with different params

## Implementation Steps

### Tervalidasi Page (`/ppk/tervalidasi`)

Since there are no dedicated API routes for these secondary lists, implement client-side:

```
1. Page fetches from /api/ppk/inbox (which returns IN_PPK_VALIDATION only)
   → This won't work, we need a different approach

Alternative: Create a shared API route
src/routes/api/ppk/dokumen/list.ts that accepts ?status= filter
This way we can reuse one API for all PPK list pages.

Actually, the simplest MVP approach:
- Create /api/ppk/dokumen/list.ts with GET handler
- Query params: status (comma-separated), revision_target (optional)
- Returns documents matching filter
- Each page (/ppk/inbox, /ppk/tervalidasi, /ppk/ditolak) passes different params
```

Create `src/routes/api/ppk/dokumen/list.ts`:
```
GET /api/ppk/dokumen/list?statuses=IN_PPK_VALIDATION&revision_target=
or
GET /api/ppk/dokumen/list?status=IN_PPK_VALIDATION,IN_BENDAHARA_APPROVAL&revision_target=USER
```

Actually, let me be practical. For MVP, just use Supabase direct query in each page since they're simple filters. The server-side filter approach was for IN_PPK_VALIDATION (the main inbox). For these secondary lists, we can create dedicated simple API routes.

Create `src/routes/api/ppk/tervalidasi.ts` and `src/routes/api/ppk/ditolak.ts`:
- Each is a simple GET handler querying dokumen_transaksi with specific filters
- Returns the same document shape as the inbox API

Page components follow the same table pattern as Section 02 but with different:
- Title and breadcrumb
- Column emphasis (e.g., "Tanggal Validasi" for tervalidasi)
- No filter bar needed (simpler than inbox)
- Status badges vary by page

### Tervalidasi Page Design

Title: "Dokumen Tervalidasi"
Breadcrumb: PPK > Dokumen Tervalidasi
Columns: No, Judul, Fungsi, Kegiatan, Pegawai, Tanggal Validasi, Status, Aksi
Status badges: IN_BENDAHARA_APPROVAL (biru), COMPLETED (hijau), ARCHIVED (abu)
Aksi: Lihat (links to /ppk/dokumen/[id])

### Ditolak Page Design

Title: "Dokumen Tidak Valid"
Breadcrumb: PPK > Dokumen Tidak Valid
Columns: No, Judul, Fungsi, Kegiatan, Pegawai, Tanggal Penolakan, Aksi
Status: NEED_REVISION (merah)
Aksi: Lihat

## Files to Create/Modify

- `src/routes/api/ppk/tervalidasi.ts` (NEW) — GET list of documents in IN_BENDAHARA_APPROVAL, COMPLETED, ARCHIVED
- `src/routes/api/ppk/ditolak.ts` (NEW) — GET list of NEED_REVISION where revision_target='USER'
- `src/routes/ppk/tervalidasi.tsx` (NEW)
- `src/routes/ppk/ditolak.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] Both pages render with correct title and breadcrumb
- [ ] Both pages show loading/empty/error states
- [ ] Both pages render table with correct columns
- [ ] Tervalidasi shows documents in correct statuses
- [ ] Ditolak shows only NEED_REVISION documents
- [ ] "Lihat" button navigates to correct detail page

## Definition of Done

- [ ] Both API routes return correct filtered lists
- [ ] Both pages render with proper title/breadcrumb
- [ ] Table columns match design requirements
- [ ] All states (loading, empty, error) implemented