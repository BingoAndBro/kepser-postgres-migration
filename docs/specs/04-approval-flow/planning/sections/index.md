# Section Index: Spec 04 — Approval Flow (PPK → Bendahara)

## Execution Order

**Phase 1 — Foundations (no dependencies)**
1. Zod schemas (Step 1) — prerequisite for all API routes

**Phase 2 — PPK Workflow (depends on Step 1)**
2. PPK Inbox API + Page (Step 2)
3. PPK Detail Page (Step 3)
4. PPK Approve/Reject Actions (Step 4)
5. PPK Tervalidasi & Ditolak Pages (Step 9)

**Phase 3 — PPK Resubmit (depends on Step 4)**
6. PPK Resubmit API + Page (Step 5)

**Phase 4 — Bendahara Workflow (depends on Step 1)**
7. Bendahara Inbox API + Page (Step 6)
8. Bendahara Detail Page (Step 7)
9. Bendahara Approve/Reject Actions (Step 8)
10. Bendahara Ditolak & Selesai Pages (Step 10)

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-schemas.md | Zod schemas: approve, reject, resubmit | - | - |
| 02 | section-02-ppk-inbox.md | PPK Inbox: API list + page table | 01 | No |
| 03 | section-03-ppk-detail.md | PPK Detail: API get + page with preview | 02 | No |
| 04 | section-04-ppk-approve-reject.md | PPK Approve + Reject API routes | 03 | No |
| 05 | section-05-ppk-tervalidasi-ditolak.md | PPK tervalidasi + ditolak list pages | 02 | Yes (with 06) |
| 06 | section-06-ppk-resubmit.md | PPK Resubmit: API + page with lampiran edit | 04 | No |
| 07 | section-07-bendahara-inbox.md | Bendahara Inbox: API list + page table | 01 | Yes (with 02) |
| 08 | section-08-bendahara-detail.md | Bendahara Detail: API + page with PPK badge | 07 | No |
| 09 | section-09-bendahara-approve-reject.md | Bendahara Approve + Reject API routes | 08 | No |
| 10 | section-10-bendahara-ditolak-selesai.md | Bendahara ditolak + selesai list pages | 07 | Yes (with 05) |

**Note:** Sections marked "Yes (with N)" can be started together with that section since they share patterns but don't depend on each other's implementation. They only depend on the foundational schemas (Section 01).