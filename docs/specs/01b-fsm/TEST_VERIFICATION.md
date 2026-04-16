# Test & Verification Guide — Spec 01b: FSM (Finite State Machine)

## Overview

Spec 01b membangun `src/lib/fsm.ts` — single source of truth untuk semua transisi status dokumen. FSM dipakai oleh Spec 03, 04, dan 05.

---

## Prerequisites

- `pnpm test` dapat dijalankan (vitest sudah terinstall)
- `pnpm build` berhasil (tidak ada type errors)

---

## Automated Tests

Jalankan test suite:

```bash
pnpm test
```

**Ekspektasi:** `46 tests passed`

Test cases yang di-cover:

### Valid Transitions (9 tests)
- [ ] DRAFT + SUBMIT → IN_PPK_VALIDATION (step=1, currentStep='PPK')
- [ ] IN_PPK_VALIDATION + APPROVE → IN_BENDAHARA_APPROVAL (step=2)
- [ ] IN_PPK_VALIDATION + REJECT → NEED_REVISION (target='USER', step=1)
- [ ] IN_BENDAHARA_APPROVAL + APPROVE → COMPLETED (step=2)
- [ ] IN_BENDAHARA_APPROVAL + REJECT → NEED_REVISION (target='PPK', step=1)
- [ ] NEED_REVISION + RESUBMIT → IN_PPK_VALIDATION (step=1)
- [ ] NEED_REVISION + RESUBMIT_PPK → IN_BENDAHARA_APPROVAL (step=2)
- [ ] COMPLETED + ARCHIVE → ARCHIVED
- [ ] COMPLETED + SKIP → COMPLETED (stays, step=null)

### Actor Validation (17 tests)
- [ ] SUBMIT hanya bisa oleh PEGAWAI
- [ ] APPROVE oleh role yang sesuai per step
- [ ] REJECT oleh role yang sesuai per step
- [ ] RESUBMIT hanya oleh PEGAWAI
- [ ] RESUBMIT_PPK hanya oleh PPK
- [ ] ARCHIVE/SKIP hanya oleh ARSIPARIS
- [ ] Actor yang salah → error

### REJECT Validation (3 tests)
- [ ] REJECT tanpa revisionTarget → error
- [ ] REJECT dengan USER target (dari PPK step) → success
- [ ] REJECT dengan PPK target (dari Bendahara step) → success

### RESUBMIT Validation (4 tests)
- [ ] RESUBMIT hanya dengan target='USER' → success
- [ ] RESUBMIT dengan target='PPK' → error
- [ ] RESUBMIT_PPK hanya dengan target='PPK' → success
- [ ] RESUBMIT_PPK dengan target='USER' → error

### Invalid Combinations (8 tests)
- [ ] DRAFT + APPROVE → error
- [ ] DRAFT + REJECT → error
- [ ] COMPLETED + SUBMIT → error
- [ ] ARCHIVED + any action → error
- [ ] NEED_REVISION + APPROVE → error
- [ ] NEED_REVISION + REJECT → error
- [ ] IN_PPK_VALIDATION + RESUBMIT → error
- [ ] IN_BENDAHARA_APPROVAL + SUBMIT → error

### Error Shape (2 tests)
- [ ] All failures return `{ success: false, newStatus=original, error: string }`
- [ ] Error message descriptive

---

## Build Verification

```bash
pnpm build
```

**Ekspektasi:** Build succeeds tanpa type errors.

---

## Usage Verification (Consumer Specs)

FSM akan diverifikasi lebih lanjut saat Spec 03, 04, 05 menggunakan `transition()`:

- **Spec 03:** Submit dokumen → `transition('DRAFT', 'SUBMIT', 'PEGAWAI')`
- **Spec 04:** PPK Approve → `transition('IN_PPK_VALIDATION', 'APPROVE', 'PPK')`
- **Spec 05:** Arsiparis Archive → `transition('COMPLETED', 'ARCHIVE', 'ARSIPARIS')`

---

## Sign-off

- **Tester:** _______________________
- **Tanggal:** _______________________
- **Hasil:** ⬜ Lolos / ⬜ Perlu Perbaikan
