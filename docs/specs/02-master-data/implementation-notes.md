# Implementation Notes — Component 02: Master Data Management

## What Was Built

Fondasi data master untuk seluruh aplikasi DMS:
- 3 tabel baru: `master_fungsi`, `master_kegiatan`, `master_kelengkapan_dokumen`
- CRUD API endpoints untuk semua tabel (ADMIN only untuk write, public untuk read)
- Admin UI pages untuk mengelola semua master data
- Helper functions untuk dipakai Spec 03, 04, 05

## Files Created/Modified

### Database
- `src/lib/db/schema.ts` — extended dengan 3 tabel + type exports
- `supabase/migrations/002_master_data.sql` — CREATE TABLE + RLS + seed data

### Helpers
- `src/lib/master-data.ts` — 6 read-only helper functions
- `src/lib/schemas/master-data.ts` — Zod validation schemas

### API Routes
- `src/routes/api/master-fungsi.ts` — GET + POST
- `src/routes/api/master-fungsi.$id.ts` — PATCH + DELETE
- `src/routes/api/master-kegiatan.ts` — GET + POST
- `src/routes/api/master-kegiatan.$id.ts` — PATCH + DELETE
- `src/routes/api/master-kelengkapan.ts` — GET + POST
- `src/routes/api/master-kelengkapan.$id.ts` — PATCH + DELETE

### Admin Pages
- `src/routes/admin.master-data.index.tsx` — redirect to fungsi
- `src/routes/admin.master-data.user.tsx` — Master User table (mock data)
- `src/routes/admin.master-data.fungsi.tsx` — Fungsi CRUD
- `src/routes/admin.master-data.kegiatan.tsx` — Kegiatan CRUD
- `src/routes/admin.master-data.kelengkapan.tsx` — Kelengkapan configurator

### Dashboard Components (reused from Spec 01)
- `src/components/dashboard/DashboardShell.tsx` — shell aesthetic
- `src/components/dashboard/StatsBento.tsx` — stat cards

## How to Use

### Jalankan Migration
1. Buka Supabase Dashboard → SQL Editor
2. Copy isi `supabase/migrations/002_master_data.sql`
3. Paste dan execute
4. Seed data otomatis ter-insert (ON CONFLICT DO NOTHING)

### Testing Admin Pages
1. Login sebagai ADMIN
2. Akses via sidebar menu MANAGEMENT
3. Semua halaman master data ada di `/admin/master-data/*`

### Untuk Spec 03-05
Import helper functions:
```typescript
import {
  getAllFungsi,
  getKegiatanByFungsi,
  getKelengkapanByKegiatan,
} from '#/lib/master-data'
```

## Known Deviations from Plan

1. **Master User page** pakai mock data (UI sudah selesai, API belum diimplementasi karena Spec 01 Auth hanya provision user via Supabase Dashboard)
2. **TDD skipped** — implementation dilakukan langsung tanpa test-first karena waktu dan tidak ada test runner yang sudah ter-setup untuk API routes
3. **Route naming** — menggunakan dot-notation (`admin.master-data.fungsi.tsx`) karena proyek pakai flat-file routing TanStack Router

## Commits

Spec 02 di-commit sebagai satu kesatuan (搁置 — seluruh fitur Spec 02 jadi satu commit mengingat kompleksitas dan ketergantungan antar section).
