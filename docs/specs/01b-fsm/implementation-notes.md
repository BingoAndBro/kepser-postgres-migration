# Implementation Notes — Spec 01b: FSM

## What Was Built

`src/lib/fsm.ts` — pure TypeScript finite state machine untuk mengelola semua transisi status dokumen. Single source of truth, dipakai oleh Spec 03, 04, 05.

## Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `src/lib/types/fsm.ts` | TypeScript types: StatusDokumen, CurrentStep, RevisionTarget, FSMAction, TransitionResult |
| `src/lib/fsm.ts` | FSM transition() function dengan lookup table |
| `tests/fsm.test.ts` | 46 unit tests |
| `vitest.config.ts` | Vitest configuration |
| `docs/specs/01b-fsm/TEST_VERIFICATION.md` | Test guide |
| `docs/specs/01b-fsm/implementation-notes.md` | This file |

## How to Use

```typescript
import { transition } from '~/lib/fsm'

// Contoh: Submit dokumen
const result = transition('DRAFT', 'SUBMIT', 'PEGAWAI')
if (!result.success) {
  throw new Error(result.error)
}
// result.newStatus === 'IN_PPK_VALIDATION'
// result.newCurrentStep === 'PPK'
// result.stepUrutan === 1

// Contoh: Reject oleh PPK
const rejectResult = transition('IN_PPK_VALIDATION', 'REJECT', 'PPK', 'USER')
if (!rejectResult.success) {
  throw new Error(rejectResult.error)
}
// rejectResult.newStatus === 'NEED_REVISION'
// rejectResult.newRevisionTarget === 'USER'
```

## Architecture

- **Lookup table** — 9 valid transitions di Record, O(1) lookup
- **Actor validation** — helper function `isActorValidForAction()`
- **RevisionTarget validation** — inline guards untuk REJECT/RESUBMIT/RESUBMIT_PPK
- **Error helper** — `makeError()` untuk konsistensi error shape

## Known Deviations from Plan

Tidak ada deviasi. Implementasi sesuai plan.

## Commits

| Commit | Section | Description |
|--------|---------|-------------|
| `935b2d9` | 01 - Types | Add FSM TypeScript types |
| `59485a0` | 02 - FSM Function | Add transition() function, tests, vitest config |
