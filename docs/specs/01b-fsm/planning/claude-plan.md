# Implementation Plan: 01b — FSM

## Overview

Spec 01b membangun `src/lib/fsm.ts` — satu fungsi pure TypeScript yang mengelola semua transisi status dokumen. Ini adalah fondasi yang dipakai Spec 03 (Submit), Spec 04 (Approval), dan Spec 05 (Arsip). FSM adalah pure function: input sama → output sama. Tidak ada side effects, tidak ada DB, tidak ada network.

Arsitekturnya straightforward: satu file types, satu file logic, satu file tests.

---

## Architecture

```
src/lib/types/fsm.ts       ← Types: StatusDokumen, CurrentStep, FSMAction, TransitionResult
src/lib/fsm.ts             ← transition() pure function
src/lib/types/auth.ts      ← RoleName (existing, re-export if needed)
tests/fsm.test.ts          ← Unit tests untuk semua 9 transitions
```

---

## Implementation Steps

### Step 1: Types (`src/lib/types/fsm.ts`)

**What:** Definisikan semua TypeScript types untuk FSM.

**Why:** Fondasi type safety. Spec 03-05 import dari sini.

**How:**
```typescript
// Status Dokumen enum
export type StatusDokumen =
  | 'DRAFT'
  | 'IN_PPK_VALIDATION'
  | 'IN_BENDAHARA_APPROVAL'
  | 'NEED_REVISION'
  | 'COMPLETED'
  | 'ARCHIVED'

// Current step dalam alur
export type CurrentStep = 'PPK' | 'BENDAHARA' | null

// Target revision
export type RevisionTarget = 'USER' | 'PPK' | null

// Actions yang bisa dilakukan
export type FSMAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'RESUBMIT'
  | 'RESUBMIT_PPK'
  | 'ARCHIVE'
  | 'SKIP'

// Return type
export interface TransitionResult {
  success: boolean
  newStatus: StatusDokumen
  newCurrentStep: CurrentStep
  newRevisionTarget: RevisionTarget
  stepUrutan: number | null
  error?: string
}
```

**Files affected:**
- `src/lib/types/fsm.ts` — baru

**Dependencies:** Tidak ada

---

### Step 2: FSM Function (`src/lib/fsm.ts`)

**What:** Implementasi fungsi `transition()`.

**Why:** Single source of truth untuk semua transisi status.

**How:**

Gunakan lookup table untuk clean, maintainable implementation:

```typescript
// transition.ts
import type {
  StatusDokumen,
  FSMAction,
  TransitionResult,
} from './types/fsm'
import type { RoleName } from './types/auth'

export function transition(
  currentStatus: StatusDokumen,
  action: FSMAction,
  actorRole: RoleName,
  revisionTarget?: RevisionTarget | null
): TransitionResult {
  // 1. Validate actor权限
  if (!isValidActor(currentStatus, action, actorRole)) {
    return {
      success: false,
      newStatus: currentStatus,
      newCurrentStep: null,
      newRevisionTarget: null,
      stepUrutan: null,
      error: `Actor '${actorRole}' tidak bisa melakukan '${action}' pada status '${currentStatus}'`,
    }
  }

  // 2. Validate revisionTarget for REJECT
  if (action === 'REJECT') {
    if (!revisionTarget || (revisionTarget !== 'USER' && revisionTarget !== 'PPK')) {
      return {
        success: false,
        newStatus: currentStatus,
        newCurrentStep: null,
        newRevisionTarget: null,
        stepUrutan: null,
        error: 'REJECT requires revisionTarget: USER or PPK',
      }
    }
  }

  // 3. Validate revisionTarget for RESUBMIT
  if (action === 'RESUBMIT' && revisionTarget !== 'USER') {
    return { success: false, ...error: 'RESUBMIT only valid when revisionTarget is USER' }
  }
  if (action === 'RESUBMIT_PPK' && revisionTarget !== 'PPK') {
    return { success: false, ...error: 'RESUBMIT_PPK only valid when revisionTarget is PPK' }
  }

  // 4. Lookup transition table
  const key = `${currentStatus}:${action}`
  const transitionMap: Record<string, Omit<TransitionResult, 'success' | 'error'>> = {
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
      newRevisionTarget: 'USER',
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
      newRevisionTarget: 'PPK',
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
      newStatus: 'COMPLETED', // stays same
      newCurrentStep: null,
      newRevisionTarget: null,
      stepUrutan: null,
    },
  }

  const result = transitionMap[key]
  if (!result) {
    return {
      success: false,
      newStatus: currentStatus,
      newCurrentStep: null,
      newRevisionTarget: null,
      stepUrutan: null,
      error: `Transisi '${action}' dari '${currentStatus}' tidak valid`,
    }
  }

  return { success: true, ...result }
}
```

**Helper function `isValidActor`:**
```typescript
function isValidActor(status: StatusDokumen, action: FSMAction, role: RoleName): boolean {
  const rules = {
    SUBMIT: ['PEGAWAI'],
    APPROVE: {
      'IN_PPK_VALIDATION': ['PPK'],
      'IN_BENDAHARA_APPROVAL': ['BENDAHARA'],
    },
    REJECT: {
      'IN_PPK_VALIDATION': ['PPK'],
      'IN_BENDAHARA_APPROVAL': ['BENDAHARA'],
    },
    RESUBMIT: ['PEGAWAI'],
    RESUBMIT_PPK: ['PPK'],
    ARCHIVE: ['ARSIPARIS'],
    SKIP: ['ARSIPARIS'],
  }
  // ... implementation
}
```

**Files affected:**
- `src/lib/fsm.ts` — baru

**Dependencies:** Step 1 (types)

---

### Step 3: Unit Tests (`tests/fsm.test.ts`)

**What:** Test semua 9 valid transitions + invalid transitions + actor validation.

**Why:** TDD — FSM adalah pure function, testable 100%.

**How:**

```typescript
import { describe, it, expect } from 'vitest'
import { transition } from '../src/lib/fsm'

describe('FSM transition()', () => {
  describe('Valid Transitions', () => {
    it('DRAFT + SUBMIT → IN_PPK_VALIDATION, step=1', () => {
      const result = transition('DRAFT', 'SUBMIT', 'PEGAWAI')
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('IN_PPK_VALIDATION')
      expect(result.newCurrentStep).toBe('PPK')
      expect(result.stepUrutan).toBe(1)
    })
    // ... semua 9 transitions
  })

  describe('Invalid Transitions', () => {
    it('DRAFT + APPROVE → error', () => {
      const result = transition('DRAFT', 'APPROVE', 'PPK')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
    // ... invalid cases
  })

  describe('Actor Validation', () => {
    it('SUBMIT by PPK → error', () => {
      const result = transition('DRAFT', 'SUBMIT', 'PPK')
      expect(result.success).toBe(false)
      expect(result.error).toContain('tidak bisa')
    })
    // ... other actor errors
  })

  describe('REJECT requires revisionTarget', () => {
    it('REJECT from PPK without revisionTarget → error', () => {
      const result = transition('IN_PPK_VALIDATION', 'REJECT', 'PPK')
      expect(result.success).toBe(false)
    })
    it('REJECT from PPK with USER target → NEED_REVISION', () => {
      const result = transition('IN_PPK_VALIDATION', 'REJECT', 'PPK', 'USER')
      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('NEED_REVISION')
    })
  })
})
```

**Files affected:**
- `tests/fsm.test.ts` — baru
- `vitest.config.ts` — setup (perlu bikin jika belum ada)

**Dependencies:** Step 2 (FSM function)

---

## Edge Cases

| Case | Handling |
|---|---|
| Invalid actor untuk action | `{ success: false, error: '...' }` |
| Invalid status + action combo | `{ success: false, error: '...' }` |
| REJECT tanpa revisionTarget | `{ success: false, error: '...' }` |
| RESUBMIT dengan target bukan USER | `{ success: false, error: '...' }` |
| RESUBMIT_PPK dengan target bukan PPK | `{ success: false, error: '...' }` |
| APPROVE dari status bukan approver step | `{ success: false, error: '...' }` |

## Integration Points

| Consumer | How |
|---|---|
| Spec 03 (Submit) | `transition('DRAFT', 'SUBMIT', 'PEGAWAI')` + `transition('NEED_REVISION', 'RESUBMIT', 'PEGAWAI')` |
| Spec 04 (Approval) | `transition('IN_PPK_VALIDATION', 'APPROVE', 'PPK')`, etc. |
| Spec 05 (Arsip) | `transition('COMPLETED', 'ARCHIVE', 'ARSIPARIS')`, `transition('COMPLETED', 'SKIP', 'ARSIPARIS')` |

## Migration Notes

Tidak ada migration. Ini murni TypeScript. Tidak ada efek ke database.

## Open Questions

Tidak ada.
