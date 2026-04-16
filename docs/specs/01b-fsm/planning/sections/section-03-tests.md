# Section 03: Unit Tests

## Context

Section 02 (FSM function) selesai. Fungsi `transition()` tersedia dan siap ditest.

## Objective

Test suite lengkap di `tests/fsm.test.ts` yang cover semua 9 valid transitions + invalid cases + actor validation.

## Prerequisites

- Section 02 (FSM function) selesai
- Vitest configured (perlu check apakah `vitest.config.ts` sudah ada)

## Implementation Steps

### 3a. Check / Setup Vitest

```bash
# Check if vitest is installed
grep -q '"vitest"' package.json

# If not, install
pnpm add -D vitest @vitest/ui
```

Buat `vitest.config.ts` jika belum ada:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

### 3b. Buat `tests/fsm.test.ts`

Copy test stubs dari `claude-plan-tdd.md` ke dalam test file.

### 3c. Jalankan Tests

```bash
pnpm test
```

Semua tests harus pass.

## Files to Create/Modify

- `vitest.config.ts` — buat jika belum ada
- `tests/fsm.test.ts` — baru

## Test Stubs (from TDD Plan)

Semua test stubs dari `claude-plan-tdd.md` section "Step 2":

**9 Valid Transitions:**
- [ ] DRAFT + SUBMIT → IN_PPK_VALIDATION, step=1
- [ ] IN_PPK_VALIDATION + APPROVE → IN_BENDAHARA_APPROVAL, step=2
- [ ] IN_PPK_VALIDATION + REJECT (USER) → NEED_REVISION
- [ ] IN_BENDAHARA_APPROVAL + APPROVE → COMPLETED
- [ ] IN_BENDAHARA_APPROVAL + REJECT (PPK) → NEED_REVISION
- [ ] NEED_REVISION + RESUBMIT → IN_PPK_VALIDATION
- [ ] NEED_REVISION + RESUBMIT_PPK → IN_BENDAHARA_APPROVAL
- [ ] COMPLETED + ARCHIVE → ARCHIVED
- [ ] COMPLETED + SKIP → COMPLETED

**Actor Validation (17 cases):**
- [ ] SUBMIT only by PEGAWAI
- [ ] APPROVE by correct role per step
- [ ] REJECT by correct role per step
- [ ] RESUBMIT only by PEGAWAI
- [ ] RESUBMIT_PPK only by PPK
- [ ] ARCHIVE/SKIP only by ARSIPARIS

**REJECT Validation:**
- [ ] REJECT without revisionTarget → error
- [ ] REJECT with correct target → success

**RESUBMIT Validation:**
- [ ] RESUBMIT only with USER target
- [ ] RESUBMIT_PPK only with PPK target

**Invalid Combinations (6 cases):**
- [ ] All invalid status+action return errors

**Error Shape:**
- [ ] All failures have consistent shape

## Definition of Done

- [x] `tests/fsm.test.ts` exists with all test cases
- [x] `pnpm test` runs and all tests pass
- [x] No skipped tests
- [x] 46 tests covering all transitions, actor validation, and error cases
