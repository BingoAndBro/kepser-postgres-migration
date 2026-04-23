# Section 07: Bendahara Inbox — API + Page

## Context

Section 01 (schemas) must be complete. This section mirrors Section 02 (PPK Inbox) but for the Bendahara role. Can be implemented in parallel with Section 02 since they share the same pattern and don't depend on each other.

## Objective

Create two files:
1. `src/routes/api/bendahara/inbox.ts` — GET handler returning documents in `IN_BENDAHARA_APPROVAL` status
2. `src/routes/bendahara/inbox.tsx` — Page with table including PPK validation info

## Prerequisites

- Section 01 (schemas)
- Reuse pattern from Section 02 (PPK Inbox)

## Implementation Steps

### Part A: API Route (`src/routes/api/bendahara/inbox.ts`)

```
GET handler:
1. Auth + role check (BENDAHARA)
2. Query params: fungsi_id (optional), start_date (optional), end_date (optional)
3. Query dokumen_transaksi:
   - status = 'IN_BENDAHARA_APPROVAL'
   - optional filters
   - order by created_at DESC
4. Manual join: fungsi_nama, kegiatan_nama
5. Get created_by user info (nama/email from auth.users user_metadata)
6. Get PPK validation info: query log_aktivitas where dokumen_id=X AND aksi='PPK_APPROVE'
   - Extract user_id → lookup PPK user metadata
   - Extract timestamp as validation_date
7. Return documents with tambahan fields:
   {
     dokumen: [{
       ...basic fields,
       validated_by_nama: string | null,
       validated_at: string | null,
     }]
   }
```

**PPK validation info:** When PPK approves a document, `log_aktivitas` has an entry with `aksi='PPK_APPROVE'`. We can query log_aktivitas for each document to get who validated it. However, for 20 documents, this could be 20 extra queries.

Optimization: Batch fetch all PPK_APPROVE log entries for the returned documents:
```
const docIds = documents.map(d => d.id)
const { data: ppkLogs } = await supabase
  .from('log_aktivitas')
  .select('dokumen_id, user_id, timestamp, user:user_id(full_name)')
  .in('dokumen_id', docIds)
  .eq('aksi', 'PPK_APPROVE')
```

Then match by dokumen_id.

### Part B: Page Component (`/bendahara/inbox`)

```
1. DashboardShell role="BENDAHARA" showHero={false}
2. Title: "Persetujuan Dokumen" — subtitle: "Dokumen yang sudah divalidasi PPK"
3. Filter bar: fungsi select, date range inputs
4. Table columns:
   No | Judul | Fungsi | Kegiatan | Pegawai | Tanggal Ajuan | Divalidasi Oleh | Tanggal Validasi | Aksi
5. Status badge: IN_BENDAHARA_APPROVAL → biru "Persetujuan Bendahara"
6. "Divalidasi Oleh" column shows PPK nama or "—" if not found
7. "Tanggal Validasi" shows the PPK_APPROVE log timestamp
8. "Lihat" → /bendahara/dokumen/[id]
9. All states (loading, empty, error)
```

## Files to Create/Modify

- `src/routes/api/bendahara/inbox.ts` (NEW)
- `src/routes/bendahara/inbox.tsx` (NEW)

## Test Stubs

### Happy Path
- [ ] GET /api/bendahara/inbox returns 401/403 for non-Bendahara
- [ ] Returns documents with status IN_BENDAHARA_APPROVAL
- [ ] Includes validated_by_nama from PPK_APPROVE log
- [ ] Includes validated_at timestamp
- [ ] Page renders table with correct columns
- [ ] Page shows PPK validation info in columns

### Edge Cases
- [ ] No documents → empty state
- [ ] PPK validation info not found → shows "—"

## Definition of Done

- [ ] API route returns filtered list with PPK validation info
- [ ] Page renders table with all columns
- [ ] PPK validation info displayed correctly
- [ ] Filters work
- [ ] All states implemented