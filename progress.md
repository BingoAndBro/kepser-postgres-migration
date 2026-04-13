# progress.md — Active Task Log & Error History
> DMS MVP — Log semua aksi bermakna, error yang ditemukan, dan resolusinya.

---

## ✅ Completed

| Tanggal | Task | Catatan |
|---|---|---|
| 2026-04-01 | Protocol 0: Initialization | Baca DMS_PRD_TechStack.md. Buat AGENTS.md (9 tabel, behavioral rules, invariants), task_plan.md, findings.md, progress.md. Green-field project confirmed. |
| 2026-04-09 | Component 01 — Auth & RBAC Foundation | Semua 8 section deep-implement selesai: schema, supabase clients, auth helpers, login page, route guards, role switcher, API routes. TEST_VERIFICATION.md dibuat. |
| 2026-04-13 | Tahap 1 — Frontend Redesign | Seluruh UI diganti sesuai prototype EDAS KEPSER: AppLayout, login, semua halaman role, halaman admin (Master User), CSS design tokens. |

---

## 🔄 In Progress

| Tanggal | Task | Blocker |
|---|---|---|
| 2026-04-13 | Tahap 1 — TEST_VERIFICATION spec 01 | TEST_VERIFICATION.md belum dijalankan. Perlu Supabase dengan migration + test users. |

---

## ❌ Errors Encountered

*(Belum ada error.)*

---

## 📝 Decisions Log

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-04-01 | MVP scope: 3 sprint (Fondasi → Siklus Hidup → Penyelesaian) | Sesuai PRD DMS_PRD_TechStack.md |
| 2026-04-01 | Post-MVP migration ke Cloudflare R2 + Workers | MVP cukup dengan Supabase Storage + Vercel untuk speed |
| 2026-04-01 | FSM hanya bisa transit via `src/lib/fsm.ts` | Invariant untuk mencegah state corruption |
| 2026-04-01 | `log_aktivitas` adalah append-only | Audit trail tidak boleh dimanipulasi |
| 2026-04-13 | UI 100% sesuai prototype EDAS KEPSER | Prototype sebagai referensi 100% untuk frontend/interface |
| 2026-04-13 | Workflow builder dihapus, admin tanpa workflow | Fitur workflow dihapus; admin hanya mengelola Master User, Departemen, Kegiatan, Kelengkapan Dokumen |
| 2026-04-13 | Halaman/bagian belum diimplementasi → "Coming Soon" | Fokus pada implementasi bertahap |
| 2026-04-13 | Admin = single `/admin` route dengan tab | Tab Master User (implemented) + 3 tab lain sebagai placeholder |
| 2026-04-13 | ADMIN redirect ke `/admin` bukan `/` | ADMIN auto-redirect sesuai TEST_VERIFICATION spec 01 |
| 2026-04-13 | BPS logo替换 orange square di sidebar | Ganti icon dengan `/bps-logo.png` |

---

*Last updated: 2026-04-13 | Status: Frontend Redesign Complete — TEST_VERIFICATION Pending*
