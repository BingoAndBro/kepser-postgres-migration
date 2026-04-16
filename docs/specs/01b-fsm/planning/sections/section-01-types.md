# Section 01: TypeScript Types

## Context

Tidak ada dependensi. Ini langkah pertama.

## Objective

`src/lib/types/fsm.ts` mengekspor semua types yang dibutuhkan FSM.

## Prerequisites

- Tidak ada

## Implementation Steps

### Buat `src/lib/types/fsm.ts`

```typescript
// src/lib/types/fsm.ts

// Status dokumen — 6 kemungkinan status
export type StatusDokumen =
  | 'DRAFT'                        // Belum diajukan
  | 'IN_PPK_VALIDATION'            // Sedang divalidasi PPK
  | 'IN_BENDAHARA_APPROVAL'        // Sedang disetujui Bendahara
  | 'NEED_REVISION'                // Ditolak — ada yang perlu diperbaiki
  | 'COMPLETED'                    // Selesai semua persetujuan
  | 'ARCHIVED'                     // Sudah diarsipkan Arsiparis

// Step saat ini dalam alur berjenjang
export type CurrentStep = 'PPK' | 'BENDAHARA' | null
// null saat DRAFT, COMPLETED, ARCHIVED

// Target revisi — siapa yang perlu memperbaiki
export type RevisionTarget = 'USER' | 'PPK' | null
// null saat tidak ada revision pending

// Aksi yang bisa dilakukan pada dokumen
export type FSMAction =
  | 'SUBMIT'            // Pegawai ajukan dokumen
  | 'APPROVE'           // PPK/Bendahara approve
  | 'REJECT'            // PPK/Bendahara reject
  | 'RESUBMIT'          // USER resubmit setelah perbaikan
  | 'RESUBMIT_PPK'      // PPK resubmit setelah Bendahara reject
  | 'ARCHIVE'           // Arsiparis arsipkan
  | 'SKIP'              // Arsiparis skip

// Return type dari transition()
export interface TransitionResult {
  success: boolean
  newStatus: StatusDokumen
  newCurrentStep: CurrentStep
  newRevisionTarget: RevisionTarget
  stepUrutan: number | null  // untuk log_aktivitas
  error?: string
}
```

## Files to Create/Modify

- `src/lib/types/fsm.ts` — baru

## Test Stubs

- [ ] StatusDokumen type accepts all 6 valid statuses
- [ ] CurrentStep type accepts 'PPK' | 'BENDAHARA' | null
- [ ] RevisionTarget type accepts 'USER' | 'PPK' | null
- [ ] FSMAction type accepts all 7 actions
- [ ] TransitionResult interface has correct shape

## Definition of Done

- [x] `src/lib/types/fsm.ts` created with all types exported
- [x] All types are `export type` (not `export interface` unless needed)
- [x] `pnpm build` succeeds with no type errors
