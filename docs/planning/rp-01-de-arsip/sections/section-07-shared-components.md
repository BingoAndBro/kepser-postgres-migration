# Section 07 — Komponen Bersama

## Context

`StatusBadge` dan `StatsBento` dipakai lintas halaman/role. Relabel di sini menular
ke semua konsumen (dokumen, berkas, dashboard). Bisa dikerjakan paralel dengan
section-06. **Wajib** ikuti `.agent/skills/ui-ux-pro-max/SKILL.md`.

## Objective

- `StatusBadge.tsx`: map status arsip → "Tersimpan" / "Usul Pembersihan" / "File
  Dibersihkan"; entri `INAKTIF` dihapus dari map; union type disempitkan.
- `StatsBento.tsx`: tile "Arsip Inaktif" dihapus; "Usul Musnah" → "Usul
  Pembersihan"; "musnah" → "pembersihan".
- Test komponen hijau.

## Prerequisites

- Section 02 selesai (konstanta status). Bisa paralel dengan section-06.

## Implementation Steps

1. **`src/components/ui/StatusBadge.tsx`:**
   - Map status arsip (±ln 68-71):
     - `AKTIF: { label: 'Tersimpan', tone: 'success' }` (tone tetap).
     - `USUL_MUSNAH: { label: 'Usul Pembersihan', tone: 'orange' }`.
     - `DIMUSNAHKAN: { label: 'File Dibersihkan', tone: 'destructive' }`.
     - **Hapus** entri `INAKTIF`.
   - Union type `StatusArsip` (±ln 16-19): buang `"INAKTIF"` supaya TS menandai
     pemakaian lama. (Kalau ada pemakaian sah yang perlu menampilkan nilai mentah
     `INAKTIF`, biarkan fallback "Status tidak dikenal" — tapi target: buang.)
2. **`src/components/dashboard/StatsBento.tsx` (156 baris):**
   - Hapus tile/segmen "Arsip Inaktif".
   - "Usul Musnah" → "Usul Pembersihan".
   - "musnah" → "pembersihan" pada teks bantu.
   - Bila membaca hitung dari sumber yang punya key `INAKTIF` → hapus referensi.
3. **Grep konsumen** `StatusBadge` dengan `value="INAKTIF"` atau `kind`/`variant`
   arsip → pastikan tidak ada yang bergantung pada label lama.
4. **Test:** `tests/unit/components/ui-foundation.test.ts`,
   `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts`.

## Files to Create/Modify

- `src/components/ui/StatusBadge.tsx`
- `src/components/dashboard/StatsBento.tsx`
- `tests/unit/components/ui-foundation.test.ts`
- `tests/unit/dashboard/role-dashboard-visual-parity-source.test.ts`

## Test Stubs

Dari `../claude-plan-tdd.md` "Tests for: Step 7".
- [ ] `StatusBadge` arsip `AKTIF` → "Tersimpan" (tone `success`).
- [ ] `USUL_MUSNAH` → "Usul Pembersihan".
- [ ] `DIMUSNAHKAN` → "File Dibersihkan".
- [ ] `INAKTIF` → fallback "Status tidak dikenal" / union TS menolak.
- [ ] `StatsBento` tanpa tile "Arsip Inaktif".
- [ ] `StatsBento` "Usul Pembersihan" menggantikan "Usul Musnah".

## Definition of Done

- [ ] Dua file komponen diubah; test hijau.
- [ ] Tidak ada konsumen `StatusBadge` yang pecah karena label lama.
- [ ] Tidak ada regresi section 02.
