# Section 08: Bendahara Detail Page — API + Page

## Context

Section 07 (Bendahara Inbox) must be complete. Mirrors Section 03 (PPK Detail) but includes PPK validation badge.

## Objective

Create two files:
1. `src/routes/api/bendahara/dokumen/$id.ts` — GET handler with PPK validation info
2. `src/routes/bendahara/dokumen/$id.tsx` — Page with detail, PPK badge, approve/reject buttons

## Prerequisites

- Section 07 (Bendahara Inbox)
- Reuse pattern from Section 03 (PPK Detail)

## Implementation Steps

### Part A: API Route (`src/routes/api/bendahara/dokumen/$id.ts`)

```
GET handler:
1. Auth + role check (BENDAHARA)
2. Fetch dokumen by id
3. Verify status = 'IN_BENDAHARA_APPROVAL' → 400 if wrong
4. Join: fungsi_nama, kegiatan_nama
5. Get creator info (created_by nama)
6. Get PPK validation info: query log_aktivitas where dokumen_id=X AND aksi='PPK_APPROVE'
   - Return ppk_user_nama and ppk_approved_at
7. Return full dokumen detail with validation_info
```

### Part B: Page Component (`/bendahara/dokumen/[id]`)

```
1. DashboardShell role="BENDAHARA" showHero={false}
2. Breadcrumb: Bendahara > Persetujuan Dokumen > Detail
3. Header: judul + status badge (biru IN_BENDAHARA_APPROVAL)
4. PPK Validation Badge (highlighted section):
   - Label: "Hasil Validasi PPK"
   - Content: "Divalidasi oleh [Nama PPK] pada [Tanggal]"
   - Style: green-ish bg, check icon
5. Info grid: Fungsi, Kegiatan, Tahun, Tanggal, Pegawai, Tanggal Ajuan
6. Lampiran section: list with [Eye preview] + [Download]
7. Action buttons:
   - [Setujui Pencairan] (primary, green-ish)
   - [Tolak] (outline, red)
8. Activity log section
9. Reject modal: textarea "Catatan Penolakan" (min 10 chars)
10. Preview modal: same as PPK detail (15-min signed URL)
```

## Files to Create/Modify

- `src/routes/api/bendahara/dokumen/$id.ts` (NEW)
- `src/routes/bendahara/dokumen/$id.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] GET returns dokumen detail for valid Bendahara
- [ ] Returns 403 for non-Bendahara
- [ ] Returns 403 for document not in IN_BENDAHARA_APPROVAL
- [ ] Includes PPK validation info (nama + tanggal)
- [ ] Page shows validation badge with PPK info
- [ ] Preview modal works
- [ ] Approve navigates to /bendahara/inbox with toast
- [ ] Reject modal works with catatan validation

### Edge Cases
- [ ] PPK validation info not found → badge shows "—"
- [ ] Document wrong status → proper error

## Definition of Done

- [ ] API route returns complete detail with validation info
- [ ] PPK validation badge displays correctly
- [ ] All info sections rendered
- [ ] Preview and approve/reject work correctly