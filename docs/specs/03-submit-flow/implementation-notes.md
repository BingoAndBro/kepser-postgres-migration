# Implementation Notes — Spec 03: Submit Flow

## What Was Built

Full Submit Flow for PEGAWAI role: document creation via multi-step form, document list, detail view, file upload/download, and resubmit workflow.

## Files Created/Modified

### Database
| File | Description |
|------|-------------|
| `src/lib/db/schema.ts` | Added `dokumenTransaksi` + `logAktivitas` tables + types |
| `drizzle/0001_003_dokumen_transaksi.sql` | Auto-generated Drizzle migration |
| `supabase/migrations/003_dokumen_transaksi.sql` | Supabase migration with tables + RLS policies |
| `supabase/migrations/004_storage_rls_cleanup.sql` | Storage RLS + orphan cleanup trigger |

### API Layer
| File | Description |
|------|-------------|
| `src/lib/schemas/dokumen.ts` | Zod schemas: lampiranUrl, createDokumen, updateDokumen, createAndSubmitDokumen |
| `src/lib/dokumen-helpers.ts` | Helper functions: getDokumenById, getDokumenByUser, createDokumen, updateDokumen, updateDokumenStatus, insertLog (append-only), getKelengkapanRequired, userHasApproverRole |
| `src/routes/api/dokumen/index.ts` | GET /api/dokumen + POST create |
| `src/routes/api/dokumen.$id.ts` | GET /api/dokumen/[id] + PATCH update lampiran |
| `src/routes/api/dokumen.$id.submit.ts` | POST /api/dokumen/[id]/submit (submit + resubmit) |
| `src/routes/api/dokumen/submit.ts` | POST /api/dokumen/submit (combined create + submit) |
| `src/routes/api/upload.ts` | POST /api/upload (file to Supabase Storage) |
| `src/routes/api/dokumen.$id.download.$lampiranIndex.ts` | GET download signed URL |

### UI Layer
| File | Description |
|------|-------------|
| `src/routes/dokumen.tsx` | Redirect /dokumen → /dokumen/saya |
| `src/routes/dokumen/saya.tsx` | Dokumen list page with search + filter + pagination |
| `src/routes/dokumen/aju.tsx` | 5-step Ajukan Dokumen form |
| `src/routes/dokumen/aji.tsx` | Redirect /dokumen/aji → /dokumen/aju (typo) |
| `src/routes/dokumen.$id.tsx` | Dokumen detail page with workflow timeline |
| `src/routes/dokumen.$id.edit.tsx` | Edit & resubmit page |
| `src/components/dokumen/StepIndicator.tsx` | 5-step horizontal progress bar |
| `src/components/dokumen/FileUploadButton.tsx` | File picker → validation → upload → state display |
| `src/components/dokumen/KelengkapanChecklist.tsx` | Kelengkapan list with per-item upload |
| `src/components/dokumen/ReviewSummary.tsx` | Review card for step 5 |
| `src/lib/utils/tahun.ts` | Tahun dropdown helper (current-5 to current+2) |

## How to Use

### Submit dokumen baru
1. Login sebagai PEGAWAI
2. Navigate ke `/dokumen/saya`
3. Klik "Ajukan Dokumen Baru"
4. Ikuti 5 steps: Fungsi → Kegiatan → Role → Upload → Review & Submit

### Download lampiran
1. Buka detail dokumen
2. Klik icon download pada lampiran
3. File terbuka di tab baru (signed URL aktif 1 jam)

### Resubmit dokumen
1. Buka detail dokumen dengan status "Perlu Revisi"
2. Klik "Perbaiki & Ajukan Ulang"
3. Upload ulang lampiran sesuai catatan PPK
4. Klik "Ajukan Ulang"

## Architecture Notes

- **Storage path**: `[user_id]/[dokumen_id]/[kelengkapan_id]_[timestamp]_[filename]`
- **Judul format**: `[Nama Kegiatan] [Tahun] [Nama Pegawai]`
- **FSM**: Semua transisi status lewat `src/lib/fsm.ts` — tidak ada direct status update
- **log_aktivitas**: Append-only (INSERT only, NO UPDATE/DELETE)
- **Signed URL**: 1-hour expiry untuk download lampiran
- **Cleanup**: PostgreSQL trigger auto-delete storage files saat dokumen_transaksi dihapus

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dokumen` | List user's documents |
| POST | `/api/dokumen` | Create DRAFT document |
| GET | `/api/dokumen/[id]` | Get document detail |
| PATCH | `/api/dokumen/[id]` | Update lampiran_urls |
| POST | `/api/dokumen/[id]/submit` | Submit or resubmit |
| POST | `/api/dokumen/submit` | Create + submit in one call |
| POST | `/api/upload` | Upload file to Storage |
| GET | `/api/dokumen/[id]/download/[index]` | Get signed URL |

## Known Deviations from Plan

1. **Storage path**: Added `Date.now()` timestamp to prevent filename collisions when re-uploading
2. **Submit endpoint split**: Created separate `/api/dokumen/submit` (combined) instead of modifying `/api/dokumen` — cleaner separation
3. **UI pattern**: Used browser client for data fetching (existing project convention) instead of loader-based approach
4. **Status badge colors**: Used Tailwind color classes directly instead of CSS variable tokens for status-specific colors (required for visual clarity)

## Commits

| Commit | Section | Description |
|--------|---------|-------------|
| `91021a6` | 01 | DB schema, migration, RLS policies, storage |
| `3ce203e` | 02 | API core: schemas, helpers, CRUD + submit |
| `2baa71a` | 03 | Upload API, download signed URL |
| `c4d6204` | 04 | List UI: dokumen/saya page |
| `4256611` | 05 | Multi-step form: form UI + components |
| `68bd5d6` | 06 | Detail page + edit/resubmit page |
