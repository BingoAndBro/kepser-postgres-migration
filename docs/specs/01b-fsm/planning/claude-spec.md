# Synthesized Spec: 01b — FSM (Finite State Machine)

## Problem Statement

Spec 03, 04, 05 membutuhkan satu fungsi terpusat untuk mengelola transisi status dokumen. Tanpa ini, setiap route handler bisa meng-hardcode transisi status, menyebabkan inkonsistensi dan bug.

## Goals

1. `src/lib/fsm.ts` exports `transition()` function sebagai single source of truth
2. Semua 9 valid transitions terimplementasi dengan benar
3. Invalid transitions return `{ success: false, error: '...' }`
4. Types TypeScript yang strict mencegah invalid usage

## Non-Goals

- Workflow builder dinamis
- Side effects (DB writes, logging, notifications)
- Parallel approval paths

## Context & Constraints

- Spec 01 sudah menyediakan `RoleName` type di `src/lib/types/auth.ts`
- AGENTS.md Invariant #8: FSM adalah SATU-SATUNYA tempat transisi status
- `db-fsm-guard` skill mendefinisikan pattern implementasi

## Key Decisions

1. **Pure function** — tidak ada side effects, caller responsible untuk persist
2. **Types di file terpisah** — `src/lib/types/fsm.ts` pisah dari `auth.ts`
3. **stepUrutan returned** — FSM return stepUrutan untuk setiap aksi
4. **Deterministic** — input sama → output sama

## Assumptions

1. `RoleName` dari `src/lib/types/auth.ts` compatible dengan FSM
2. Semua caller (Spec 03-05) pakai `transition()` sebelum update DB

## Open Questions

Tidak ada.
