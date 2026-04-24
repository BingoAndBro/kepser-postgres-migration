# Section 12: Supabase Edge Function — Cron Auto-Transition

## Context
Section 01 (DB Migration) sudah selesai. Tabel arsip dan sub-tables sudah ada. Cron job perlu dibuat untuk auto-transition berdasarkan masa retensi.

## Objective
Membuat Supabase Edge Function yang dijalankan via pg_cron schedule untuk auto-transition arsip:
- Arsip AKTIF dengan masa_aktif_berakhir <= today → masuk VERIFIKASI_PENYUSUTAN
- Arsip INAKTIF dengan masa_inaktif_berakhir <= today → masuk USUL_MUSNAH

## Prerequisites
- Section 01 selesai (arsip tables ada)
- Supabase Edge Functions sudah dikonfigurasi di project
- pg_cron extension sudah enabled di Supabase

## Implementation Steps

### 1. Buat `supabase/functions/arsip-retensi/index.ts`

Edge Function ini akan:

1. **Phase 1 — Verifikasi Penyusutan:**
   - Query: `SELECT * FROM arsip WHERE status_arsip='AKTIF' AND masa_aktif_berakhir <= CURRENT_DATE AND id NOT IN (SELECT arsip_id FROM arsip_verifikasi_penyusutan)`
   - Untuk setiap arsip hasil:
     - INSERT ke `arsip_verifikasi_penyusutan` (status='MENUNGGU', dipindahkan_oleh=null — ini auto-transition, bukan dari user)
     - UPDATE `arsip` SET status_arsip='VERIFIKASI_PENYUSUTAN'
     - INSERT log_aktivitas (aksi='AUTO_VERIFIKASI_PENYUSUTAN', catatan='Auto-transition via cron')

2. **Phase 2 — Usul Musnah:**
   - Query: `SELECT * FROM arsip WHERE status_arsip='INAKTIF' AND masa_inaktif_berakhir <= CURRENT_DATE AND id NOT IN (SELECT arsip_id FROM arsip_usul_musnah)`
   - Untuk setiap arsip hasil:
     - INSERT ke `arsip_usul_musnah` (status='MENUNGGU', diusulkan_oleh=null — auto-transition)
     - UPDATE `arsip` SET status_arsip='USUL_MUSNAH'
     - INSERT log_aktivitas (aksi='AUTO_USUL_MUSNAH', catatan='Auto-transition via cron')

**Technical details:**
- Gunakan service_role client Supabase untuk bypass RLS
- Fungsi idempotent — aman dijalankan berkali-kali
- UNIQUE constraint di sub-tables akan prevent duplicate jika function run overlap
- Return summary: jumlah arsip yang ditransisi untuk setiap phase

**Response:**
```typescript
{
  timestamp: string,
  verifikasi_penyusutan: { processed: number },
  usul_musnah: { processed: number },
  errors: string[],
}
```

### 2. Buat `supabase/migrations/006_cron_arsip.sql`

Setup pg_cron schedule untuk menjalankan Edge Function:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: setiap jam 2 pagi, setiap hari
-- Hapus schedule lama jika ada (untuk idempotent)
SELECT cron.unschedule('check-arsip-retensi');

-- Schedule Edge Function via pg_cron
SELECT cron.schedule(
  'check-arsip-retensi',
  '0 2 * * *', -- cron expression: every day at 02:00
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/arsip-retensi',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
    body := '{"key": "optional-secret"}'
  );
  $$
);

-- Note: Ganti YOUR_SUPABASE_PROJECT_URL dan SERVICE_ROLE_KEY dengan nilai sebenarnya
-- Atau gunakan environment variable
```

**Alternative approach (tanpa pg_cron di migration SQL):**
Jika pg_cron schedule dikelola langsung di Supabase dashboard atau via CLI, cukup export SQL untuk migration tabel tanpa schedule. Atau bisa pakai `supabase/functions/arsip-retensi/_index.ts` dengan konfigurasi schedule bawaan Edge Function.

**Rekomendasi:** Setup pg_cron schedule melalui Supabase dashboard → Database → Extensions → pg_cron → Configure. Atau melalui CLI: `supabase cron schedule ...`. Migration SQL di atas sebagai dokumentasi/backup.

## Files to Create

- `supabase/functions/arsip-retensi/index.ts` — Edge Function
- `supabase/migrations/006_cron_arsip.sql` — pg_cron schedule (atau dokumentasi)

## Test Stubs

- [ ] Edge Function berjalan tanpa error
- [ ] Arsip AKTIF dengan masa_aktif_berakhir <= today → VERIFIKASI_PENYUSUTAN
- [ ] Arsip INAKTIF dengan masa_inaktif_berakhir <= today → USUL_MUSNAH
- [ ] UNIQUE constraint prevents duplicate transition
- [ ] Log aktivitas created untuk setiap auto-transition
- [ ] Function idempotent (bisa run berkali-kali tanpa side effect)
- [ ] No-op jika tidak ada arsip yang perlu ditransisi

## Definition of Done

- [ ] Edge Function bisa dijalankan
- [ ] Auto-transition dari AKTIF → VERIFIKASI_PENYUSUTAN berfungsi
- [ ] Auto-transition dari INAKTIF → USUL_MUSNAH berfungsi
- [ ] Log aktivitas created untuk setiap transition
- [ ] Idempotent — aman dijalankan berulang
- [ ] pg_cron schedule configured (via dashboard atau migration)
- [ ] Test stubs pass