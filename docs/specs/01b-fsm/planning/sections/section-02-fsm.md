# Section 02: FSM Function

## Context

Section 01 (types) selesai. Types tersedia di `src/lib/types/fsm.ts`.

## Objective

`src/lib/fsm.ts` exports fungsi `transition()` yang menangani semua transisi status.

## Prerequisites

- Section 01 (types) selesai

## Implementation Steps

### Buat `src/lib/fsm.ts`

Pattern: lookup table + actor validation.

```typescript
// src/lib/fsm.ts
import type { StatusDokumen, FSMAction, TransitionResult } from './types/fsm'
import type { RoleName } from './types/auth'

export function transition(
  currentStatus: StatusDokumen,
  action: FSMAction,
  actorRole: RoleName,
  revisionTarget?: RevisionTarget | null
): TransitionResult
```

### Actor Validation Helper

Buat helper function untuk validasi actor per action:

```typescript
function isActorValidForAction(
  status: StatusDokumen,
  action: FSMAction,
  role: RoleName
): boolean {
  switch (action) {
    case 'SUBMIT':
      return role === 'PEGAWAI'
    case 'APPROVE':
      return (
        (status === 'IN_PPK_VALIDATION' && role === 'PPK') ||
        (status === 'IN_BENDAHARA_APPROVAL' && role === 'BENDAHARA')
      )
    case 'REJECT':
      return (
        (status === 'IN_PPK_VALIDATION' && role === 'PPK') ||
        (status === 'IN_BENDAHARA_APPROVAL' && role === 'BENDAHARA')
      )
    case 'RESUBMIT':
      return role === 'PEGAWAI'
    case 'RESUBMIT_PPK':
      return role === 'PPK'
    case 'ARCHIVE':
    case 'SKIP':
      return role === 'ARSIPARIS'
    default:
      return false
  }
}
```

### Transition Lookup Table

9 valid transitions. Gunakan Record untuk clean lookup:

```typescript
type TransitionEntry = Pick<TransitionResult, 'newStatus' | 'newCurrentStep' | 'newRevisionTarget' | 'stepUrutan'>

const TRANSITIONS: Record<string, TransitionEntry> = {
  'DRAFT:SUBMIT': {
    newStatus: 'IN_PPK_VALIDATION',
    newCurrentStep: 'PPK',
    newRevisionTarget: null,
    stepUrutan: 1,
  },
  'IN_PPK_VALIDATION:APPROVE': {
    newStatus: 'IN_BENDAHARA_APPROVAL',
    newCurrentStep: 'BENDAHARA',
    newRevisionTarget: null,
    stepUrutan: 2,
  },
  'IN_PPK_VALIDATION:REJECT': {
    newStatus: 'NEED_REVISION',
    newCurrentStep: 'PPK',
    newRevisionTarget: 'USER',  // dari PPK, kembali ke USER
    stepUrutan: 1,
  },
  'IN_BENDAHARA_APPROVAL:APPROVE': {
    newStatus: 'COMPLETED',
    newCurrentStep: null,
    newRevisionTarget: null,
    stepUrutan: 2,
  },
  'IN_BENDAHARA_APPROVAL:REJECT': {
    newStatus: 'NEED_REVISION',
    newCurrentStep: 'BENDAHARA',
    newRevisionTarget: 'PPK',  // dari Bendahara, kembali ke PPK
    stepUrutan: 1,
  },
  'NEED_REVISION:RESUBMIT': {
    newStatus: 'IN_PPK_VALIDATION',
    newCurrentStep: 'PPK',
    newRevisionTarget: null,
    stepUrutan: 1,
  },
  'NEED_REVISION:RESUBMIT_PPK': {
    newStatus: 'IN_BENDAHARA_APPROVAL',
    newCurrentStep: 'BENDAHARA',
    newRevisionTarget: null,
    stepUrutan: 2,
  },
  'COMPLETED:ARCHIVE': {
    newStatus: 'ARCHIVED',
    newCurrentStep: null,
    newRevisionTarget: null,
    stepUrutan: null,
  },
  'COMPLETED:SKIP': {
    newStatus: 'COMPLETED',
    newCurrentStep: null,
    newRevisionTarget: null,
    stepUrutan: null,
  },
}
```

### Main Function Body

1. Check actor validity
2. Check revisionTarget for REJECT
3. Check revisionTarget for RESUBMIT/RESUBMIT_PPK
4. Lookup transition table
5. Return result or error

## Files to Create/Modify

- `src/lib/fsm.ts` — baru

## Test Stubs (from TDD Plan)

- [ ] All 9 valid transitions return correct values
- [ ] All actor validation cases return errors
- [ ] REJECT without revisionTarget returns error
- [ ] RESUBMIT with wrong target returns error
- [ ] Invalid status+action combinations return errors
- [ ] Error shape is consistent

## Definition of Done

- [x] `transition()` function exported from `src/lib/fsm.ts`
- [x] All 9 transitions work correctly
- [x] Actor validation prevents wrong role from acting
- [x] revisionTarget validation enforced
- [x] Invalid transitions return `{ success: false, error: '...' }`
- [x] `pnpm build` succeeds with no type errors
- [x] 46 tests passing
