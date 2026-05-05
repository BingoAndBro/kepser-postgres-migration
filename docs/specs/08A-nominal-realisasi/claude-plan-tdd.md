# TDD Stubs: 08A — Nominal Realisasi Foundation

Test stubs untuk memvalidasi setiap step implementasi. Stub ditulis dalam bahasa natural — kode test akan diimplementasi saat fase development.

---

## Tests for: Step 1 - SQL Migration

### Happy Path
- [ ] Migration bisa di-run tanpa error pada fresh database
- [ ] Kolom `nominal_realisasi` (DECIMAL 15,2) ada di tabel `dokumen_transaksi`
- [ ] Kolom `is_non_material` (BOOLEAN DEFAULT false) ada di tabel `dokumen_transaksi`
- [ ] Kolom `nominal_realisasi` (DECIMAL 15,2) ada di tabel `arsip`
- [ ] CHECK constraint `nominal_positive` memastikan nominal >= 0

### Idempotency
- [ ] Migration bisa di-run ulang tanpa error (IF NOT EXISTS pattern)
- [ ] Kolom tidak di-duplicate saat re-run

### Edge Cases
- [ ] Migration terhadap database yang sudah punya kolom tidak crash

---

## Tests for: Step 2 - Drizzle Schema

### Happy Path
- [ ] Schema `dokumenTransaksi` punya field `nominalRealisasi`
- [ ] Schema `dokumenTransaksi` punya field `isNonMaterial`
- [ ] Schema `arsip` punya field `nominalRealisasi`
- [ ] Type inference correctly typed as number | null

### Edge Cases
- [ ] Drizzle generate types match database columns
- [ ] Optional field handling correct (nullable)

---

## Tests for: Step 3 - Zod Validation Schema

### Happy Path
- [ ] `updateNominalSchema.parse({ nominal_realisasi: 100000 })` passes
- [ ] `updateNominalSchema.parse({ nominal_realisasi: 0 })` passes
- [ ] `updateNominalSchema.parse({ nominal_realisasi: null })` passes
- [ ] `updateNominalSchema.parse({ is_non_material: true })` passes
- [ ] Combined: `{ nominal_realisasi: 50000, is_non_material: false }` passes

### Edge Cases
- [ ] `nominal_realisasi: -100` returns error "Nominal tidak boleh negatif"
- [ ] `nominal_realisasi: 999999999999999` (exceeds max) returns error
- [ ] `nominal_realisasi: "invalid"` returns type error
- [ ] `is_non_material: "yes"` returns type error

---

## Tests for: Step 4 - Submit Handler

### Happy Path
- [ ] Submit dengan `is_non_material: true, nominal_realisasi: null` berhasil (Non-Material)
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: 100000` berhasil (Material)
- [ ] Submit dengan `is_non_material: true, nominal_realisasi: 50000` berhasil (Non-Material tapi ada nominal)
- [ ] Dokumen tersimpan dengan nominal_realisasi yang dikirim

### Error Cases
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: null` return 400 "Nominal wajib"
- [ ] Submit dengan `is_non_material: false, nominal_realisasi: 0` return 400 "Nominal wajib > 0"
- [ ] Submit tanpa field baru (backward compatibility check) masih bisa create dokumen
- [ ] Unauthorized request return 401

### Edge Cases
- [ ] Submit dengan very large nominal (接近 max) berhasil
- [ ] Submit dengan decimal nominal (123456.78) berhasil stored correctly

---

## Tests for: Step 5 - Update Nominal Endpoint

### Happy Path
- [ ] Creator bisa update nominal pada dokumen miliknya
- [ ] Arsiparis bisa update nominal pada dokumen apapun
- [ ] Superadmin bisa update nominal pada dokumen apapun
- [ ] Update berhasil dan data tersimpan
- [ ] Log aktivitas tercipta setelah update

### Authorization Cases
- [ ] User biasa (non-creator, non-arsiparis) tidak bisa update → 403
- [ ] User dengan role yang tidak diizinkan tidak bisa update → 403

### Error Cases
- [ ] Update pada dokumen yang tidak ada → 404
- [ ] Update nominal pada dokumen yang sudah ARCHIVED → 400 "Tidak bisa update arsip"

### Validation Cases
- [ ] Update dengan `nominal_realisasi: null` pada dokumen Non-Material → berhasil
- [ ] Update dengan `nominal_realisasi: null` pada dokumen Material → 400 "Nominal wajib"
- [ ] Update dengan negative value → 400

---

## Tests for: Step 6 - Archive Handler

### Happy Path
- [ ] Dokumen dengan nominal tersimpan ke arsip dengan nominal yang sama
- [ ] Dokumen Non-Material dengan null nominal tersimpan dengan null
- [ ] Snapshot includes nominal_realisasi

### Edge Cases
- [ ] Dokumen tanpa nominal (NULL) tetap bisa diarsipkan
- [ ] Arsip baru punya field nominal_realisasi yang sesuai

---

## Tests for: Step 7 - Document Helpers

### Happy Path
- [ ] `createDokumen` accept dan store nominalRealisasi
- [ ] `createDokumen` accept dan store isNonMaterial
- [ ] `updateDokumen` accept dan update nominalRealisasi
- [ ] `getDokumenById` return object dengan nominalRealisasi

### Edge Cases
- [ ] Helper functions handle undefined/null gracefully
- [ ] JSON parsing untuk dokumen dengan field baru tidak error

---

## Integration Tests

### Happy Path
- [ ] End-to-end: Create dokumen dengan nominal → Update nominal → Archive → Check arsip has correct nominal
- [ ] End-to-end: Create Non-Material dokumen → Archive → Check arsip has NULL nominal

### Edge Cases
- [ ] Non-Material dokumen di-submit ulang setelah jadi Material (validasi update)
- [ ] Transition dari NULL ke required value bekerja dengan benar