# Section 04 — Zod + API Routes

## Context

Service & read-model (section-03) sudah menyediakan tipe & fungsi baru. Sekarang
kontrak API disesuaikan: schema close satu field, enum aksi lifecycle, whitelist
field umur/jatuh tempo di response, dan pesan "Cara Pembayaran". `db-fsm-guard`
tetap relevan (boundary validasi = titik penegakan transisi legal).

⚠️ `closeBerkasMetadataSchema` `.strict()` → begitu `retensi_inaktif` dihapus,
`CloseBerkasDialog` (section-06) yang masih mengirimnya akan kena 400. Section-06
**harus** menyusul section ini tanpa jeda rilis.

## Objective

- `schemas/berkas-arsip.ts`: `closeBerkasMetadataSchema` tanpa `retensi_inaktif`;
  `openBerkasRequestSchema` pesan "Cara pembayaran tidak valid".
- `api/.../lifecycle.ts`: enum aksi `['propose_destruction','cancel_proposal']` +
  `approve_destruction` (frasa via konstanta).
- `api/.../berkas/index.ts` & `$id.ts`: whitelist `umur_berkas`, `jatuh_tempo`,
  `tanggal_jatuh_tempo`; buang referensi `INAKTIF`.
- Label "Jenis Pembayaran" → "Cara Pembayaran" di route archive/manual terkait.
- Test schema & API hijau.

## Prerequisites

- Section 03 selesai (tipe `CloseBerkasMetadataInput` menyusut,
  `BerkasArchiveLifecycleAction` baru, DTO read-model punya field umur).
- Section-06 dijadwalkan langsung setelah ini.

## Implementation Steps

1. **`src/lib/schemas/berkas-arsip.ts`:**
   - `openBerkasRequestSchema.klasifikasi_id`: pesan → `'Cara pembayaran tidak valid'`.
   - `closeBerkasMetadataSchema` (±ln 45):
     - Hapus properti `retensi_inaktif`.
     - `retensi_aktif`: pertahankan key; pesan enum → `'Masa Simpan Minimal tidak valid'`.
     - `.strict()` tetap.
     - `.transform` → `{ nomor_spm, retensi_aktif, closed_at: value.closed_at ?? null }`.
   - `CloseBerkasMetadataInput` otomatis menyusut; perbaiki import di service bila
     TS menandai.
2. **`src/routes/api/arsiparis/berkas/$id/lifecycle.ts`:**
   - `nonDestructiveLifecycleBodySchema.action`:
     `z.enum(['propose_destruction', 'cancel_proposal'])`.
   - `approveDestructionLifecycleBodySchema.confirmation`:
     `z.literal(BERKAS_DESTRUCTION_CONFIRMATION_PHRASE)` — sudah import dari
     `page-format`, jadi otomatis `'BERSIHKAN FILE BERKAS'`.
   - `discriminatedUnion('action', [...])` struktur tetap.
   - Handler: `executePhysicalDeletionAfterLifecycle` tetap dipanggil hanya untuk
     `parsed.data.action === 'approve_destruction'`.
3. **`src/routes/api/arsiparis/berkas/index.ts`:**
   - `safeFolderListRow` (±ln 73): tambah `umur_berkas: row.umur_berkas`,
     `jatuh_tempo: row.jatuh_tempo`, `tanggal_jatuh_tempo: row.tanggal_jatuh_tempo`.
   - `parseFolderListQuery`: bila read-model menambah `due_only`, teruskan
     `url.searchParams.get('due_only') === 'true'`.
4. **`src/routes/api/arsiparis/berkas/$id.ts`:** DTO detail whitelist tambah field
   umur/jatuh tempo; hapus cabang/label `INAKTIF` bila ada.
5. **`src/lib/archive/berkas-arsip-api.ts`:** bersihkan referensi `INAKTIF`
   (param/filter/label). `safeBerkasDto` — hanya tambah field aman.
6. **Label route lain:**
   - `src/routes/api/arsiparis/dokumen.$id.archive.ts` — "Jenis Pembayaran" →
     "Cara Pembayaran".
   - `src/routes/api/arsiparis/manual-arsip/index.ts` & `$id.ts` — idem; retensi
     disederhanakan **hanya bila** `src/lib/schemas/manual-arsip.ts` mengumpulkan
     retensi ganda (cek dulu; kemungkinan hanya label sejak Phase 13E).
7. **Test:** `tests/unit/arsiparis/berkas-arsip-schema.test.ts`,
   `tests/unit/arsiparis/berkas-arsip-api.test.ts` (lihat TDD "Tests for: Step 4").

## Files to Create/Modify

- `src/lib/schemas/berkas-arsip.ts`
- `src/routes/api/arsiparis/berkas/$id/lifecycle.ts`
- `src/routes/api/arsiparis/berkas/index.ts`
- `src/routes/api/arsiparis/berkas/$id.ts`
- `src/lib/archive/berkas-arsip-api.ts`
- `src/routes/api/arsiparis/dokumen.$id.archive.ts`
- `src/routes/api/arsiparis/manual-arsip/index.ts`, `.../$id.ts`
- `src/lib/schemas/manual-arsip.ts` (bila perlu)
- `tests/unit/arsiparis/berkas-arsip-schema.test.ts`
- `tests/unit/arsiparis/berkas-arsip-api.test.ts`

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 4" (4a–4f). Poin kunci:
- [ ] `closeBerkasMetadataSchema`: valid tanpa `retensi_inaktif`; **menolak**
      payload yang menyertakan `retensi_inaktif`; pesan "Masa Simpan Minimal".
- [ ] `openBerkasRequestSchema`: pesan "Cara pembayaran tidak valid".
- [ ] `lifecycleBodySchema`: `propose_destruction` & `cancel_proposal` valid;
      `mark_inactive` ditolak; `approve_destruction` butuh `BERSIHKAN FILE BERKAS`.
- [ ] `GET /api/arsiparis/berkas` row memuat `umur_berkas` / `jatuh_tempo` /
      `tanggal_jatuh_tempo`, tak bocor field lain.
- [ ] `summary.status_arsip_counts` tanpa `INAKTIF`.
- [ ] `GET /api/arsiparis/berkas/$id` detail memuat field umur/jatuh tempo.
- [ ] Route archive/manual: pesan "Cara Pembayaran".

## Definition of Done

- [ ] File src diubah; test stub section ini hijau.
- [ ] Tidak ada endpoint/route file baru (batch pakai endpoint lifecycle yang ada).
- [ ] `.strict()` `closeBerkasMetadataSchema` dipertahankan.
- [ ] Section-06 dijadwalkan segera (jangan tinggalkan `CloseBerkasDialog` rusak
      tanpa catatan PR).
- [ ] Tidak ada regresi test section-03.
