# SPEC 01b: FSM — Finite State Machine for Document Status Transitions

## Overview

Fondasi shared infrastructure untuk mengelola semua transisi status dokumen. FSM adalah **SATU-SATUNYA** tempat logika transisi status dokumen berada — tidak boleh ada logika transisi status di luar FSM. Spec 03, 04, dan 05 adalah consumer FSM ini.

---

## Background / Konteks

Spec 01 (Auth & RBAC) dan Spec 02 (Master Data) sudah selesai. Aplikasi sudah punya auth helpers, guards, session management, dan master data tables. Spec 03, 04, 05 membutuhkan alur dokumen berjenjang: DRAFT → IN_PPK_VALIDATION → IN_BENDAHARA_APPROVAL → COMPLETED → ARCHIVED, dengan kemungkinan penolakan (NEED_REVISION) di setiap step.

Tanpa FSM terpusat, setiap developer (atau AI agent) bisa meng-hardcode transisi status di route handler masing-masing, menyebabkan inkonsistensi dan bug yang sulit ditrace.

---

## User Stories

- Sebagai **sistem**, saya ingin **satu fungsi terpusat** yang mengelola semua transisi status, agar tidak ada inkonsistensi di seluruh codebase.
- Sebagai **Spec 03** (Pegawai), saya ingin FSM mengelola SUBMIT dan RESUBMIT, agar submit flow bersih.
- Sebagai **Spec 04** (PPK/Bendahara), saya ingin FSM mengelola APPROVE dan REJECT, agar approval flow konsisten.
- Sebagai **Spec 05** (Arsiparis), saya ingin FSM mengelola ARCHIVE, agar arsip flow sederhana.

---

## Scope — Termasuk

- **`src/lib/fsm.ts`** — single source of truth untuk semua transisi status
- **`src/lib/types/fsm.ts`** — TypeScript types untuk FSM
- **Semua valid transitions** dari AGENTS.md
- **Error handling** untuk invalid transitions
- **Deterministic output** — input sama, output selalu sama

---

## Scope — Tidak Termasuk

- Konfigurasi workflow builder (dinamis)
- Parallel approval paths
- Delegation / reassignment
- Due date / SLA tracking
- Notification system

---

## Data Model (Types)

### Status Dokumen
```typescript
type StatusDokumen =
  | 'DRAFT'                        // Belum diajukan
  | 'IN_PPK_VALIDATION'            // Sedang divalidasi PPK
  | 'IN_BENDAHARA_APPROVAL'        // Sedang disetujui Bendahara
  | 'NEED_REVISION'                // Ditolak — ada yang perlu diperbaiki
  | 'COMPLETED'                    // Selesai semua persetujuan
  | 'ARCHIVED'                     // Sudah diarsipkan Arsiparis
```

### Current Step
```typescript
type CurrentStep = 'PPK' | 'BENDAHARA' | null
// null saat: DRAFT, COMPLETED, ARCHIVED
```

### Revision Target
```typescript
type RevisionTarget = 'USER' | 'PPK' | null
// null saat: tidak ada revision pending
```

### Action
```typescript
type FSMAction =
  | 'SUBMIT'            // Pegawai ajukan dokumen baru
  | 'APPROVE'           // PPK atau Bendahara approve
  | 'REJECT'            // PPK atau Bendahara reject
  | 'RESUBMIT'          // USER resubmit setelah memperbaiki
  | 'RESUBMIT_PPK'      // PPK resubmit setelah Bendahara reject
  | 'ARCHIVE'           // Arsiparis arsipkan
  | 'SKIP'              // Arsiparis skip (tidak arsip)
```

### Role
```typescript
type RoleName = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS'
```

### Transition Result
```typescript
interface TransitionResult {
  success: boolean
  newStatus: StatusDokumen
  newCurrentStep: CurrentStep
  newRevisionTarget: RevisionTarget
  stepUrutan?: number  // step ke berapa saat aksi dilakukan (untuk log)
  error?: string
}
```

---

## Valid Transitions (Exhaustive List)

```
DRAFT ──────────────────→ IN_PPK_VALIDATION       [SUBMIT, by: PEGAWAI]
                                                           step: 1
IN_PPK_VALIDATION ───────→ IN_BENDAHARA_APPROVAL   [APPROVE, by: PPK]
                                                           step: 2
IN_PPK_VALIDATION ───────→ NEED_REVISION           [REJECT, by: PPK]
                                                           target: 'USER'
                                                           step: 1

IN_BENDAHARA_APPROVAL ──→ COMPLETED               [APPROVE, by: BENDAHARA]
                                                           step: 2
IN_BENDAHARA_APPROVAL ──→ NEED_REVISION           [REJECT, by: BENDAHARA]
                                                           target: 'PPK'
                                                           step: 1

NEED_REVISION ───────────→ IN_PPK_VALIDATION       [RESUBMIT, by: USER]
                                                           step: 1
NEED_REVISION ───────────→ IN_BENDAHARA_APPROVAL   [RESUBMIT_PPK, by: PPK]
                                                           step: 2

COMPLETED ────────────────→ ARCHIVED                 [ARCHIVE, by: ARSIPARIS]
COMPLETED ────────────────→ COMPLETED                [SKIP, by: ARSIPARIS]
                                                           (is_ditolak=true, handled di arsip table)
```

**No other transitions are valid.**

---

## FSM Function Signature

```typescript
// src/lib/fsm.ts

import type {
  StatusDokumen,
  CurrentStep,
  RevisionTarget,
  RoleName,
  FSMAction,
  TransitionResult,
} from './types/fsm'

export function transition(
  currentStatus: StatusDokumen,
  action: FSMAction,
  actorRole: RoleName,
  revisionTarget?: RevisionTarget | null
): TransitionResult
```

### Rules

1. **Actor must match action context:**
   - `SUBMIT` → only `PEGAWAI`
   - `APPROVE` (PPK step) → only `PPK`
   - `APPROVE` (Bendahara step) → only `BENDAHARA`
   - `REJECT` (PPK step) → only `PPK`
   - `REJECT` (Bendahara step) → only `BENDAHARA`
   - `RESUBMIT` → only `PEGAWAI`
   - `RESUBMIT_PPK` → only `PPK`
   - `ARCHIVE` → only `ARSIPARIS`
   - `SKIP` → only `ARSIPARIS`

2. **Actor must match current step context:**
   - APPROVE hanya bisa dilakukan oleh role yang sesuai dengan `currentStep`
   - REJECT hanya bisa dilakukan oleh role yang sesuai dengan `currentStep`

3. **REJECT requires `revisionTarget`:**
   - Dari PPK step → `revisionTarget = 'USER'`
   - Dari Bendahara step → `revisionTarget = 'PPK'`

4. **RESUBMIT requires correct target:**
   - `RESUBMIT` hanya valid jika `revisionTarget === 'USER'`
   - `RESUBMIT_PPK` hanya valid jika `revisionTarget === 'PPK'`

5. **stepUrutan** (untuk log_aktivitas):
   - `SUBMIT` → 1
   - `APPROVE` (PPK) → 2
   - `APPROVE` (Bendahara) → 2
   - `REJECT` → simpan step saat ini sebagai stepUrutan (untuk traceback)
   - `RESUBMIT` → 1
   - `RESUBMIT_PPK` → 2
   - `ARCHIVE` / `SKIP` → null (tidak ada step Urutan)

---

## Implementation

### src/lib/types/fsm.ts

```typescript
export type StatusDokumen =
  | 'DRAFT'
  | 'IN_PPK_VALIDATION'
  | 'IN_BENDAHARA_APPROVAL'
  | 'NEED_REVISION'
  | 'COMPLETED'
  | 'ARCHIVED'

export type CurrentStep = 'PPK' | 'BENDAHARA' | null

export type RevisionTarget = 'USER' | 'PPK' | null

export type FSMAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'RESUBMIT'
  | 'RESUBMIT_PPK'
  | 'ARCHIVE'
  | 'SKIP'

export type RoleName = 'PEGAWAI' | 'PPK' | 'BENDAHARA' | 'ARSIPARIS'

export interface TransitionResult {
  success: boolean
  newStatus: StatusDokumen
  newCurrentStep: CurrentStep
  newRevisionTarget: RevisionTarget
  stepUrutan: number | null
  error?: string
}
```

### src/lib/fsm.ts

```typescript
import type {
  StatusDokumen,
  FSMAction,
  RoleName,
  TransitionResult,
} from './types/fsm'

export function transition(
  currentStatus: StatusDokumen,
  action: FSMAction,
  actorRole: RoleName,
  revisionTarget?: RevisionTarget | null
): TransitionResult {
  // ... implementation
}
```

---

## Dependensi

- **Bergantung pada:** Spec 01 — TypeScript types (`RoleName`) dan konstanta
- **Dibutuhkan oleh:** Spec 03, Spec 04, Spec 05

---

## Definition of Done

- [ ] `src/lib/types/fsm.ts` exports semua types yang dibutuhkan
- [ ] `transition()` function exported dari `src/lib/fsm.ts`
- [ ] Semua 9 valid transitions berfungsi dengan benar
- [ ] Invalid actor/role/revisionTarget mengembalikan `{ success: false, error: '...' }`
- [ ] Invalid status/action combination mengembalikan `{ success: false, error: '...' }`
- [ ] stepUrutan di-return dengan benar untuk setiap aksi
- [ ] Unit tests cover semua transitions (happy path + invalid path)
- [ ] `pnpm build` succeeds tanpa type errors

---

## Estimasi Kompleksitas

**Rendah** — FSM adalah pure function, tidak ada side effects, tidak ada DB, tidak ada network. Logic-nya sudah 100% didefinisikan di spec. Implementasi straightforward.

---

## Catatan / Risiko

1. **Invariant #8 AGENTS.md:** Spec ini adalah enforcement dari AGENTS.md Invariant #8. Setiap route handler yang melakukan `await db.update(dokumenTransaksi).set({ status: ... })` langsung adalah bug.
2. **No side effects:** FSM hanya return data transition — tidak ada DB writes, tidak ada logging, tidak ada notifications. Caller bertanggung jawab untuk persist dan log.
3. **Deterministic:** Input sama → output sama. Tidak ada randomness atau state tambahan.
