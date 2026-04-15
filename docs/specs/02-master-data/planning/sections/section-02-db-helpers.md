# Section 02: Master Data Helper Functions

## Context

Spec 03, 04, dan 05 butuh membaca master data. Butuh helper functions yang bisa dipakai ulang tanpa harus fetch via API di setiap tempat.

## Objective

`src/lib/master-data.ts` dengan 5 read-only helper functions yang di-export untuk dipakai komponen lain.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 01** (schema harus ada)
- Files/modules yang harus sudah tersedia:
  - `src/lib/db/schema.ts` (with new tables)
  - `src/lib/supabase-server.ts` (createServerSupabaseClient)
  - `src/lib/supabase-admin.ts` (createAdminClient) — karena ini read-only, pakai admin client

## Implementation Steps

### Create src/lib/master-data.ts

Imports: `createAdminClient` dari supabase-admin, types dari db/schema.

`getAllFungsi(supabase)` — Query master_fungsi WHERE is_active = true ORDER BY nama ASC. Return array. Empty array jika error.

`getFungsiById(supabase, id)` — Query single fungsi by ID. Return null jika tidak ada.

`getAllKegiatan(supabase)` — Query master_kegiatan WHERE is_active = true ORDER BY nama ASC. Join dengan master_fungsi untuk dapat nama fungsi. Return array dengan `{ id, nama, fungsiId, fungsiNama, deskripsi }`.

`getKegiatanByFungsi(supabase, fungsiId)` — Query master_kegiatan WHERE is_active = true AND fungsi_id = fungsiId ORDER BY nama ASC. Join fungsi. Return array.

`getAllKelengkapan(supabase)` — Query master_kelengkapan_dokumen. Join master_kegiatan + master_fungsi. Return array dengan `{ id, namaDokumen, isKetuaTim, required, kegiatanId, kegiatanNama, fungsiId, fungsiNama }`.

`getKelengkapanByKegiatan(supabase, kegiatanId, isKetuaTim)` — Query dengan filter kegiatan_id DAN is_ketua_tim. Return array.

Pattern semua function: try-catch, return empty array/null on error (graceful degradation).

## Files to Create/Modify

- `src/lib/master-data.ts` — **CREATE**: semua helper functions

## Test Stubs

- `getAllFungsi()` returns fungsi aktif sorted by nama
- `getAllKegiatan()` returns with nested fungsi info
- `getKelengkapanByKegiatan(id, true)` returns only Ketua Tim items
- Graceful degradation: return empty array on error

## Definition of Done

- [ ] `src/lib/master-data.ts` created dengan 5+ helper functions
- [ ] Semua function exportable
- [ ] Build succeeds tanpa error
