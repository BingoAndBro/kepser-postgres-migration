# Section Index — Spec 01b: FSM

## Execution Order

```
01 (Types) → 02 (FSM Function) → 03 (Unit Tests)
```

Sequential karena each step depends on the previous.

## Sections

| # | File | Deskripsi | Depends On | Parallelizable |
|---|---|---|---|---|
| 01 | `section-01-types.md` | TypeScript types di `src/lib/types/fsm.ts` | - | No | ✅ Done |
| 02 | `section-02-fsm.md` | transition() function di `src/lib/fsm.ts` | 01 | No | ✅ Done |
| 03 | `section-03-tests.md` | Unit tests di `tests/fsm.test.ts` | 02 | No | ✅ Done |
