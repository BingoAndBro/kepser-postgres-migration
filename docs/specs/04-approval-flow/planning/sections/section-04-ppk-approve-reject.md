# Section 04: PPK Approve + Reject Actions

## Context

Section 03 (PPK Detail) must be complete. The detail page has buttons that call these API routes. This section implements the actual FSM transition logic.

## Objective

Create two files:
1. `src/routes/api/ppk/dokumen/$id/approve.ts` — POST handler for approve
2. `src/routes/api/ppk/dokumen/$id/reject.ts` — POST handler for reject

## Prerequisites

- Section 01 (schemas) — approveDokumenSchema, rejectDokumenSchema
- Section 03 (PPK detail API) — the GET route establishes the role/status checks pattern
- `src/lib/fsm.ts` — MUST be used for status transitions (AGENTS.md Invariant #8)
- `src/lib/dokumen-helpers.ts` — updateDokumenStatus, insertLog helpers

## Implementation Steps

### Part A: Approve Route (`src/routes/api/ppk/dokumen/$id/approve.ts`)

Follow the same helper pattern as existing API routes:

```
1. POST handler:
   a. createClient(request) — Supabase server client
   b. Auth: getServerSession() → 401 if none
   c. Role: query user_roles for PPK → 403 if not PPK
   d. Parse body (should be empty — use approveDokumenSchema)
   e. Fetch dokumen by id
   f. Verify status = 'IN_PPK_VALIDATION' → 400 if wrong
   g. FSM: call transition('IN_PPK_VALIDATION', 'APPROVE', 'PPK')
      → expect: { success: true, newStatus: 'IN_BENDAHARA_APPROVAL', newCurrentStep: 'BENDAHARA', stepUrutan: 2 }
   h. updateDokumenStatus(supabase, id, {
        status: 'IN_BENDAHARA_APPROVAL',
        currentStep: 'BENDAHARA',
        revisionTarget: null,
      })
   i. insertLog(supabase, {
        dokumenId: id,
        userId: session.user.id,
        aksi: 'PPK_APPROVE',
        stepUrutan: 2,
      })
   j. Return { success: true, message: 'Dokumen diteruskan ke Bendahara' }
```

### Part B: Reject Route (`src/routes/api/ppk/dokumen/$id/reject.ts`)

```
1. POST handler:
   a. createClient(request)
   b. Auth + role check (same as approve)
   c. Parse body with rejectDokumenSchema:
      { catatan: string (min 10 chars) }
      → 400 if validation fails
   d. Fetch dokumen, verify status = 'IN_PPK_VALIDATION'
   e. FSM: transition('IN_PPK_VALIDATION', 'REJECT', 'PPK', 'USER')
      → expect: { success: true, newStatus: 'NEED_REVISION', newRevisionTarget: 'USER', stepUrutan: 1 }
   f. updateDokumenStatus(supabase, id, {
        status: 'NEED_REVISION',
        currentStep: 'PPK',
        revisionTarget: 'USER',
        revisionNotes: body.catatan,
      })
   g. insertLog(supabase, {
        dokumenId: id,
        userId: session.user.id,
        aksi: 'PPK_REJECT',
        catatan: body.catatan,
        stepUrutan: 1,
      })
   h. Return { success: true, message: 'Dokumen dikembalikan ke pegawai' }
```

## Files to Create/Modify

- `src/routes/api/ppk/dokumen/$id/approve.ts` (NEW)
- `src/routes/api/ppk/dokumen/$id/reject.ts` (NEW)

## Test Stubs

### Happy Path — Approve
- [ ] POST approve → status changes to IN_BENDAHARA_APPROVAL
- [ ] current_step changes to 'BENDAHARA'
- [ ] log_aktivitas entry created with aksi='PPK_APPROVE', stepUrutan=2
- [ ] Returns success response

### Happy Path — Reject
- [ ] POST reject with valid catatan → status changes to NEED_REVISION
- [ ] revision_target='USER', revision_notes=catatan
- [ ] log_aktivitas entry created with aksi='PPK_REJECT', catatan, stepUrutan=1
- [ ] Returns success response

### Edge Cases
- [ ] Non-PPK trying to approve → 403
- [ ] Document not in IN_PPK_VALIDATION → 400 "Dokumen sudah tidak bisa diproses"
- [ ] Reject without catatan → 400 (Zod validation)
- [ ] Reject with catatan < 10 chars → 400
- [ ] Empty body for approve → accepted (empty schema is fine)

## Definition of Done

- [ ] FSM used for all status transitions (NOT direct DB update)
- [ ] log_aktivitas append-only (only INSERT, no UPDATE/DELETE)
- [ ] Role check enforced before any action
- [ ] Status check prevents double-processing
- [ ] All edge cases return proper error messages