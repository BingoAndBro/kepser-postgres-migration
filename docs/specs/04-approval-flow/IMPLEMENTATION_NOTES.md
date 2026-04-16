# Implementation Notes: Spec 04 — Approval Flow (PPK → Bendahara)

## What Was Built

Full two-tier approval workflow:

**PPK Side:**
- `/ppk/inbox` — list dokumen IN_PPK_VALIDATION dengan server-side filter
- `/ppk/tervalidasi` — list dokumen yang sudah PPK approve (IN_BENDAHARA_APPROVAL, COMPLETED, ARCHIVED)
- `/ppk/ditolak` — list dokumen yang PPK tolak (NEED_REVISION, target=USER)
- `/ppk/revisi` — list dokumen dari Bendahara yang perlu PPK perbaiki (NEED_REVISION, target=PPK)
- `/ppk/dokumen/[id]` — detail + approve/reject dengan preview modal (15-min signed URL)
- `/ppk/dokumen/[id]/resubmit` — resubmit page dengan edit lampiran

**Bendahara Side:**
- `/bendahara/inbox` — list dokumen IN_BENDAHARA_APPROVAL dengan PPK validation info
- `/bendahara/ditolak` — list dokumen yang Bendahara tolak
- `/bendahara/selesai` — list dokumen COMPLETED
- `/bendahara/dokumen/[id]` — detail + approve/reject dengan preview modal + PPK badge

**API Routes (18 files):**
- `/api/ppk/inbox` — list IN_PPK_VALIDATION
- `/api/ppk/tervalidasi` — list approved docs
- `/api/ppk/ditolak` — list rejected by PPK
- `/api/ppk/revisi` — list NEED_REVISION (target=PPK)
- `/api/ppk/dokumen/[id]` — GET detail
- `/api/ppk/dokumen/[id]/approve` — FSM APPROVE
- `/api/ppk/dokumen/[id]/reject` — FSM REJECT target=USER
- `/api/ppk/dokumen/[id]/preview/[index]` — 15-min signed URL
- `/api/ppk/resubmit/[id]` (GET+POST) — get detail + FSM RESUBMIT_PPK
- `/api/bendahara/inbox` — list IN_BENDAHARA_APPROVAL
- `/api/bendahara/ditolak` — list NEED_REVISION (target=PPK)
- `/api/bendahara/selesai` — list COMPLETED
- `/api/bendahara/dokumen/[id]` — GET detail + PPK validation
- `/api/bendahara/dokumen/[id]/approve` — FSM APPROVE
- `/api/bendahara/dokumen/[id]/reject` — FSM REJECT target=PPK
- `/api/bendahara/dokumen/[id]/preview/[index]` — 15-min signed URL

## Files Created/Modified

| File | Status |
|------|--------|
| `src/lib/schemas/dokumen.ts` | MODIFIED — added approve/reject/resubmit schemas |
| `src/routes/ppk/inbox.tsx` | NEW |
| `src/routes/ppk/tervalidasi.tsx` | NEW |
| `src/routes/ppk/ditolak.tsx` | NEW |
| `src/routes/ppk/revisi.tsx` | NEW |
| `src/routes/ppk/dokumen/$id.tsx` | NEW |
| `src/routes/ppk/dokumen/$id/resubmit.tsx` | NEW |
| `src/routes/bendahara/inbox.tsx` | NEW |
| `src/routes/bendahara/ditolak.tsx` | NEW |
| `src/routes/bendahara/selesai.tsx` | NEW |
| `src/routes/bendahara/dokumen/$id.tsx` | NEW |
| 17 API route files | NEW |
| `docs/specs/04-approval-flow/TEST_VERIFICATION.md` | NEW |

## How to Use

1. **Submit dokumen** sebagai PEGAWAI → status IN_PPK_VALIDATION
2. **Login PPK** → buka `/ppk/inbox` → approve/reject
3. **Login Bendahara** → buka `/bendahara/inbox` → approve/reject
4. **Jika Bendahara reject** → PPK login → `/ppk/revisi` → edit lampiran → resubmit

## Known Deviations from Plan

- Section 05 + 10 (list pages) digabung jadi satu commit per phase (bukan satu per section) untuk efisiensi
- semua secondary list API routes menggunakan pattern manual join yang sama, tidak menggunakan query builder terpisah
- Preview untuk PPK resubmit page menggunakan `window.open` ke preview endpoint (bukan modal iframe seperti detail page)

## Commits

```
9f71c0f feat: add approval schemas for Spec 04
cd304d1 feat: implement PPK inbox — API route + page
d427449 feat: implement PPK detail page + approve/reject actions
8dfd63c feat: implement PPK tervalidasi + ditolak list pages
5f726d8 feat: implement PPK resubmit — API + list page + resubmit page
3024630 feat: implement Bendahara approval flow — sections 07, 08, 09
2d75235 feat: implement Bendahara ditolak + selesai list pages — section 10
```