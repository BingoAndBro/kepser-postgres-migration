# task_plan.md — PRD / Blueprint / Phase Checklist
> DMS (Dynamic Document Workflow Management System) — MVP

---

## 🌟 North Star
> **Setiap pegawai tahu persis apa yang harus mereka lakukan hari ini, dan setiap dokumen bisa dilacak statusnya secara real-time oleh siapapun yang berwenang.**

---

## ✅ Discovery Answers (Phase 1-B — COMPLETE)

| # | Pertanyaan | Jawaban |
|---|---|---|
| 1 | **North Star** | Menghapus kebingungan alur dokumen — satu Inbox, satu status terpusat |
| 2 | **Integrations** | Supabase (Auth + PostgreSQL + Storage), Vercel (hosting) |
| 3 | **Source of Truth** | Supabase PostgreSQL — satu DB, 9 tabel inti |
| 4 | **Delivery Payload** | SSR Web App (desktop-first), ~30 pengguna internal kantor |
| 5 | **Behavioral Rules** | RBAC, FSM dokumen, audit trail append-only, workflow sequential |

---

## 📋 Phase Checklist

### ✅ Phase 0: Protocol 0 — Initialization
- [x] Baca DMS_PRD_TechStack.md
- [x] Buat `AGENTS.md` (Project Constitution + Schema + Rules)
- [x] Buat `task_plan.md` (PRD Blueprint)
- [x] Buat `findings.md`
- [x] Buat `progress.md`

---

### 🔲 Phase 1: Blueprint (B) — Data & Architecture Design
> **Belum dimulai.** Tunggu instruksi eksekusi dari user.

- [ ] Finalisasi Drizzle schema untuk 9 tabel inti
- [ ] Tulis SOP routing di `docs/routing-sop.md`
- [ ] Tulis SOP Drizzle schema di `docs/drizzle-schema.md`
- [ ] Tulis SOP Supabase RLS di `docs/supabase-rls.md`
- [ ] Definisikan Zod schemas di `src/lib/schemas/`
- [ ] Definisikan FSM transitions di `src/lib/fsm.ts`

---

### 🔲 Phase 2: Link (L) — Connectivity Verification
- [ ] Setup `.env` (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Inisialisasi Supabase project
- [ ] Scaffold TanStack Start + Drizzle
- [ ] Jalankan migration Drizzle ke Supabase
- [ ] Verifikasi koneksi DB (test query)
- [ ] Verifikasi Supabase Auth (test login)
- [ ] Verifikasi Supabase Storage (test upload)

---

### 🔲 Phase 3: Architect (A) — Sprint 1 Build
> Referensi PRD: **Fase 1 — Fondasi (MVP Sprint 1)**

- [ ] Auth: Login / Logout via Supabase Auth
- [ ] CRUD Master Template (form builder)
- [ ] CRUD Workflow Builder (+ step config, role assignment, revisi target)
- [ ] Inbox Tugas — tampilkan tugas sesuai Role user
- [ ] Eksekusi dokumen: isi form → simpan ke `dokumen_transaksi.data` (JSONB)
- [ ] Transisi status FSM dasar

> Referensi PRD: **Fase 2 — Siklus Hidup (MVP Sprint 2)**

- [ ] Fitur Penolakan + wajib isi Catatan Revisi
- [ ] Audit Trail (`log_aktivitas`) — append-only logging
- [ ] Upload file lampiran via Supabase Storage
- [ ] Polish UI/UX: loading states, empty states, error handling

> Referensi PRD: **Fase 3 — Penyelesaian (MVP Sprint 3)**

- [ ] Modul Arsiparis: Inbox, penambahan metadata, approval final
- [ ] Pencarian dokumen arsip (full-text search PostgreSQL)
- [ ] Dashboard monitoring Admin

---

### 🔲 Phase 4: Stylize (S) — UI/UX Refinement
- [ ] Design system tokens (colors, typography, spacing)
- [ ] Responsive layout (desktop-first)
- [ ] Empty states & loading skeletons
- [ ] User feedback round

---

### 🔲 Phase 5: Trigger (T) — Deployment
- [ ] Build verification (production bundle)
- [ ] Deploy ke Vercel
- [ ] Finalisasi `AGENTS.md` dan `progress.md`
- [ ] Post-MVP migration plan (R2 + Cloudflare Workers)

---

*Last updated: 2026-04-01 | Status: Phase 0 Complete — Awaiting Phase 1 Execution*
