# Section 01: Zod Schemas — Approval Actions

## Context

This is the first section. No prior sections exist. This section provides the Zod validation schemas that will be used by all approval API routes (PPK and Bendahara).

## Objective

Add Zod schemas to `src/lib/schemas/dokumen.ts` for three approval actions:
1. Approve (empty body — no data needed)
2. Reject (body: `{ catatan: string }` min 10 chars)
3. Resubmit (body: `{ lampiranUrls?: LampiranUrl[] }`)

## Prerequisites

- File: `src/lib/schemas/dokumen.ts` exists
- File: `src/lib/types/fsm.ts` exists (already referenced by FSM)
- No other sections required

## Implementation Steps

### 1. Read existing schemas file

Open `src/lib/schemas/dokumen.ts` and understand existing structure. Note that `lampiranUrlSchema` is already defined there.

### 2. Add three new schemas

Append to `src/lib/schemas/dokumen.ts`:

```typescript
// Approve dokumen — no body needed
export const approveDokumenSchema = z.object({}).strict()

// Reject dokumen — catatan wajib min 10 karakter
export const rejectDokumenSchema = z.object({
  catatan: z.string().min(10, 'Catatan minimal 10 karakter').max(2000, 'Catatan maksimal 2000 karakter'),
})

// Resubmit by PPK — optional lampiran update
export const resubmitDokumenSchema = z.object({
  lampiranUrls: z.array(lampiranUrlSchema).optional(),
}).strict()
```

### 3. Export types for consumers

Add inferred types:
```typescript
export type ApproveDokumen = z.infer<typeof approveDokumenSchema>
export type RejectDokumen = z.infer<typeof rejectDokumenSchema>
export type ResubmitDokumen = z.infer<typeof resubmitDokumenSchema>
```

### 4. Verify

Check the file has all 3 new schemas and they can be imported by other files.

## Files to Create/Modify

- `src/lib/schemas/dokumen.ts` — ADD: 3 schemas + 3 inferred types

## Test Stubs

### Happy Path
- [ ] `approveDokumenSchema` accepts `{}`
- [ ] `rejectDokumenSchema` accepts `{ catatan: 'Ini catatan valid dengan 10+ karakter' }`
- [ ] `resubmitDokumenSchema` accepts `{}`
- [ ] `resubmitDokumenSchema` accepts `{ lampiranUrls: [...] }`

### Edge Cases
- [ ] `rejectDokumenSchema` rejects `{ catatan: 'pendek' }` (kurang dari 10 chars)
- [ ] `approveDokumenSchema` rejects `{ extraField: true }` (strict mode)
- [ ] `rejectDokumenSchema` rejects `{}` (missing catatan)

## Definition of Done

- [ ] All 3 schemas present in `src/lib/schemas/dokumen.ts`
- [ ] All 3 inferred types exported
- [ ] File compiles without errors
- [ ] Schemas can be imported in API route handlers