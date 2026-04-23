# Section 09: Bendahara Approve + Reject Actions

## Context

Section 08 (Bendahara Detail) must be complete. Mirrors Section 04 (PPK Approve/Reject).

## Objective

Create two files:
1. `src/routes/api/bendahara/dokumen/$id/approve.ts` — POST for approve
2. `src/routes/api/bendahara/dokumen/$id/reject.ts` — POST for reject

## Prerequisites

- Section 01 (schemas) — approveDokumenSchema, rejectDokumenSchema
- Section 08 (Bendahara detail) — establishes pattern

## Implementation Steps

### Part A: Approve Route (`src/routes/api/bendahara/dokumen/$id/approve.ts`)

```
POST handler:
1. Auth + role check (BENDAHARA)
2. Parse body: approveDokumenSchema (empty body OK)
3. Fetch dokumen, verify status = 'IN_BENDAHARA_APPROVAL' → 400 if wrong
4. FSM: transition('IN_BENDAHARA_APPROVAL', 'APPROVE', 'BENDAHARA')
   → expect: { newStatus: 'COMPLETED', newCurrentStep: null, stepUrutan: 2 }
5. updateDokumenStatus(supabase, id, {
     status: 'COMPLETED',
     currentStep: null,
     revisionTarget: null,
   })
6. insertLog(supabase, {
     dokumenId: id,
     userId: session.user.id,
     aksi: 'BENDAHARA_APPROVE',
     stepUrutan: 2,
   })
7. Return { success: true, message: 'Dokumen selesai, menunggu arsip dari Arsiparis' }
```

### Part B: Reject Route (`src/routes/api/bendahara/dokumen/$id/reject.ts`)

```
POST handler:
1. Auth + role check (BENDAHARA)
2. Parse body: rejectDokumenSchema { catatan: min 10 chars }
3. Fetch dokumen, verify status = 'IN_BENDAHARA_APPROVAL'
4. FSM: transition('IN_BENDAHARA_APPROVAL', 'REJECT', 'BENDAHARA', 'PPK')
   → expect: { newStatus: 'NEED_REVISION', newRevisionTarget: 'PPK', stepUrutan: 1 }
5. updateDokumenStatus(supabase, id, {
     status: 'NEED_REVISION',
     currentStep: 'BENDAHARA',
     revisionTarget: 'PPK',
     revisionNotes: body.catatan,
   })
6. insertLog(supabase, {
     dokumenId: id,
     userId: session.user.id,
     aksi: 'BENDAHARA_REJECT',
     catatan: body.catatan,
     stepUrutan: 1,
   })
7. Return { success: true, message: 'Dokumen dikembalikan ke PPK' }
```

## Files to Create/Modify

- `src/routes/api/bendahara/dokumen/$id/approve.ts` (NEW)
- `src/routes/api/bendahara/dokumen/$id/reject.ts` (NEW)

## Test Stubs

### Happy Path
- [ ] Approve → status COMPLETED, current_step=null, log BENDAHARA_APPROVE
- [ ] Reject → status NEED_REVISION, target=PPK, catatan, log BENDAHARA_REJECT

### Edge Cases
- [ ] Non-Bendahara → 403
- [ ] Document not IN_BENDAHARA_APPROVAL → 400
- [ ] Reject without catatan → 400
- [ ] Reject catatan < 10 chars → 400

## Definition of Done

- [ ] FSM used for all transitions
- [ ] log_aktivitas append-only
- [ ] Role and status checks enforced
- [ ] Edge cases handled with proper errors