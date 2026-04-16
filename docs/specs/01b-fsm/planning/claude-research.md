# Research — Spec 01b: FSM

## Context

Spec 01b adalah fondasi shared infrastructure yang dibutuhkan Spec 03, 04, 05.

## What Already Exists

- **AGENTS.md** — FSM transitions sudah 100% didefinisikan di `## FSM Alur Dokumen` dan `## FSM Final`
- **`db-fsm-guard` skill** — sudah menuliskan pattern FSM dengan benar: `transition()` function, `TransitionResult`, rules
- **Types auth** — `RoleName` sudah ada di `src/lib/types/auth.ts`
- **Spec 01b** — spec.md sudah dibuat

## Key Sources

1. **AGENTS.md** — exhaustive list of valid transitions
2. **`db-fsm-guard/SKILL.md`** — implementation pattern dengan contoh kode
3. **Spec 01b spec.md** — types, function signature, rules, 9 transitions

## Decisions

- FSM sebagai **pure function** (no side effects, no DB, no network)
- `stepUrutan` di-return oleh FSM untuk kemudahan caller (confirmed: FSM handle everything)
- `RevisionTarget` parameter diperlukan untuk validasi REJECT dan RESUBMIT transitions
- Types di `src/lib/types/fsm.ts` — pisah dari `src/lib/types/auth.ts` karena domain berbeda
