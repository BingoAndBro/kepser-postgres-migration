# Section 03: PPK Detail Page — API + Page

## Context

Section 02 (PPK Inbox) must be complete before this. The inbox page links to `/ppk/dokumen/[id]`, so this detail page is the natural next step.

## Objective

Create two files:
1. `src/routes/api/ppk/dokumen/$id.ts` — GET handler returning full dokumen detail for PPK
2. `src/routes/ppk/dokumen/$id.tsx` — Page with dokumen info, workflow, lampiran list, approve/reject buttons

## Prerequisites

- Section 02 (PPK Inbox) must be complete
- `src/lib/dokumen-helpers.ts` — getDokumenById, insertLog helpers
- Preview feature from Spec 03 (`dokumen.$id.tsx`) — reuse pattern

## Implementation Steps

### Part A: API Route (`src/routes/api/ppk/dokumen/$id.ts`)

This route handles GET only (approve/reject are separate routes in Section 04).

```
1. GET handler:
   a. Auth: getServerSession() → 401 if no session
   b. Role: query user_roles for PPK → 403 if not PPK
   c. Fetch dokumen by id from dokumen_transaksi
   d. Verify status = 'IN_PPK_VALIDATION' → else return 403 or 400
   e. Manual join: fungsi_nama, kegiatan_nama
   f. Fetch creator user info: get user_nama from auth.users user_metadata
   g. Return {
     dokumen: {
       ...all fields,
       fungsi_nama, kegiatan_nama,
       creator_nama: string,
       lampiran_urls: LampiranUrl[]
     }
   }
```

**Creator user info:** Use Supabase query to get user metadata from auth.users by id:
```typescript
const { data: creator } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('user_id', dok.created_by)
  .single()
// Then fetch auth.users metadata separately if needed
// Or use the fact that user_metadata is already available
// Keep it simple: just return created_by id and let the page fetch if needed
```
Actually, just return `created_by` id in the response. The page can show "Pegawai #N" or the user can click into the document to see details. For MVP, showing the user ID or email in a truncated form is acceptable.

### Part B: Page Component (`src/routes/ppk/dokumen/$id.tsx`)

Follow the DokumenDetailPage pattern from `src/routes/dokumen.$id.tsx` but adapted for PPK:

```
1. Layout:
   - DashboardShell role="PPK" showHero={false}
   - Breadcrumb: PPK > Validasi Dokumen > Detail
   - Header: judul + status badge (IN_PPK_VALIDATION = kuning)
   - Info grid: Fungsi, Kegiatan, Tahun, Tanggal, Pegawai, Tanggal Ajuan
   - Workflow indicator: show current step (PPK) highlighted
   - Lampiran section: list with [Eye preview] + [Download] buttons
   - Action buttons: [Setujui] primary + [Tolak] outline+destructive
   - Activity log section: show submit log entry

2. Preview modal:
   - Reuse the preview modal pattern from dokumen.$id.tsx
   - Signed URL: 15-minute expiry (NEW endpoint: /api/ppk/dokumen/[id]/preview/[lampiranIndex])
   - Modal: overlay, backdrop blur, iframe, close button, ESC key

3. Reject modal:
   - Overlay modal with textarea "Catatan Revisi"
   - Required: min 10 chars
   - Buttons: "Batal" + "Tolak Dokumen" (destructive)
   - Submit → POST /api/ppk/dokumen/[id]/reject
   - Success → navigate back to /ppk/inbox + toast "Dokumen dikembalikan ke pegawai"

4. Approve button:
   - Click → POST /api/ppk/dokumen/[id]/approve
   - Success → navigate to /ppk/inbox + toast "Dokumen diteruskan ke Bendahara"
```

## Files to Create/Modify

- `src/routes/api/ppk/dokumen/$id.ts` (NEW)
- `src/routes/ppk/dokumen/$id.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] GET /api/ppk/dokumen/[id] returns dokumen for valid PPK
- [ ] Returns 403 for non-PPK
- [ ] Returns 404 for non-existent dokumen
- [ ] Returns 403 for dokumen not in IN_PPK_VALIDATION status
- [ ] Response includes fungsi_nama, kegiatan_nama, created_by id
- [ ] Page renders judul, fungsi, kegiatan, tahun, tanggal, pegawai info
- [ ] Page renders workflow indicator with current step highlighted
- [ ] Page renders lampiran list with preview and download buttons
- [ ] Preview modal opens on Eye click with 15-min signed URL
- [ ] Preview modal closes on X, ESC, or backdrop click
- [ ] Reject modal opens on Tolak button click
- [ ] Reject modal has textarea with min 10 char validation
- [ ] Approve navigates to /ppk/inbox with success toast

### Edge Cases
- [ ] Document not in IN_PPK_VALIDATION → show error or redirect
- [ ] Preview URL expired → re-fetch signed URL
- [ ] Approve fails → show error toast, stay on page

## Definition of Done

- [ ] API route returns complete dokumen detail for PPK
- [ ] API route enforces role and status checks
- [ ] Page shows all required info sections
- [ ] Preview modal works with 15-minute signed URL
- [ ] Reject modal has working form with validation
- [ ] Approve action works and redirects with toast
- [ ] Reject action works and redirects with toast