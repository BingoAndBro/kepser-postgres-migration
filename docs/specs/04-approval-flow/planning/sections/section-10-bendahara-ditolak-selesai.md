# Section 10: Bendahara Ditolak + Selesai List Pages

## Context

Section 07 (Bendahara Inbox) should be complete. Mirrors Section 05 (PPK Tervalidasi + Ditolak).

## Objective

Create two files:
1. `src/routes/bendahara/ditolak.tsx` — List NEED_REVISION where revision_target='PPK'
2. `src/routes/bendahara/selesai.tsx` — List COMPLETED documents

## Prerequisites

- Section 07 (Bendahara Inbox) — same pattern
- Section 09 (Bendahara approve/reject) — for context on which statuses are relevant

## Implementation Steps

### Ditolak Page (`/bendahara/ditolak`)

```
1. DashboardShell role="BENDAHARA" showHero={false}
2. Title: "Dokumen Ditolak"
3. Breadcrumb: Bendahara > Dokumen Ditolak
4. API: GET /api/bendahara/ditolak
   - Query: status='NEED_REVISION', revision_target='PPK'
5. Table columns: No, Judul, Fungsi, Kegiatan, Tanggal Penolakan, Aksi
6. Show rejection notes preview in table (truncated)
7. "Lihat" → /bendahara/dokumen/[id] (can still view the document)
```

API route: `src/routes/api/bendahara/ditolak.ts` — GET list of NEED_REVISION where revision_target='PPK'

### Selesai Page (`/bendahara/selesai`)

```
1. DashboardShell role="BENDAHARA" showHero={false}
2. Title: "Dokumen Selesai"
3. Breadcrumb: Bendahara > Dokumen Selesai
4. API: GET /api/bendahara/selesai
   - Query: status='COMPLETED'
5. Table columns: No, Judul, Fungsi, Kegiatan, Pegawai, Tanggal Selesai, Aksi
6. Status badge: COMPLETED → hijau "Selesai"
7. "Lihat" → /bendahara/dokumen/[id] (read-only view)
```

API route: `src/routes/api/bendahara/selesai.ts` — GET list of COMPLETED documents

## Files to Create/Modify

- `src/routes/api/bendahara/ditolak.ts` (NEW)
- `src/routes/api/bendahara/selesai.ts` (NEW)
- `src/routes/bendahara/ditolak.tsx` (NEW)
- `src/routes/bendahara/selesai.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] Both API routes return correct filtered lists
- [ ] Ditolak shows NEED_REVISION where revision_target='PPK'
- [ ] Selesai shows only COMPLETED documents
- [ ] Both pages render with correct title/breadcrumb
- [ ] Table columns match design
- [ ] Rejection notes preview shown in ditolak table
- [ ] All states implemented

## Definition of Done

- [ ] Both API routes return correct data
- [ ] Both pages render properly
- [ ] Table columns correct
- [ ] All states (loading, empty, error) implemented