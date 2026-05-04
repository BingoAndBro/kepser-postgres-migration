# Synthesized Spec: SPEC 07 — Chairman Assignment

## Problem Statement

User saat ini tidak bisa dibedakan sebagai "Ketua Tim" atau "Anggota" secara systematisch. Semua user submit dokumen dengan peran manual (toggle). Tidak ada:
1. Kemampuan admin untuk assign user sebagai chairman di kegiatan tertentu
2. Menu "Laporan Kegiatan" yang hanya accessible oleh chairman
3. Badge info yang menunjukkan peran user di kegiatan yang dipilih
4. Constraint bahwa 1 kegiatan hanya boleh punya 1 chairman

## Goals

1. **Admin capabilities:**
   - Admin bisa assign user sebagai chairman di kegiatan tertentu
   - Admin bisa view/edit chairman assignments di Master User
   - Admin bisa replace chairman dengan confirmation dialog
   - 1 kegiatan = 1 chairman, 1 user = unlimited chairman assignments

2. **User experience:**
   - Sistem auto-detect peran berdasarkan `ketua_tim_assignments`
   - Badge info tampil di Ajukan Dokumen setelah pilih kegiatan
   - Menu "Laporan Kegiatan" hanya tampil untuk user yang chairman
   - Tidak ada manual toggle — auto-determined

3. **Data integrity:**
   - Constraint UNIQUE(kegiatan_id) untuk guarantee 1 chairman per kegiatan
   - Validation di API layer dengan proper error messages
   - Assignment bersifat permanent sampai revoked

## Non-Goals (Explicit Exclusions)

- User tidak bisa self-assign sebagai chairman
- Tidak ada sub-chairman atau delegation
- Badge tidak tampil di halaman detail (sudah ada metadata "Peran")
- Tidak ada batas maksimum kegiatan chairman per user
- Activity log / history tracking (butuh tabel terpisah)

## Context & Constraints

**Tech Stack:**
- TanStack Start (SSR + file-based routing)
- Supabase Auth dengan cookie-based active role
- UUID primary keys dengan `gen_random_uuid()`
- RLS dengan inline subquery pattern

**Existing Patterns:**
- Migration file: `014_chairman_assignment.sql`
- API route pattern: `createFileRoute` + handlers
- Zod schema untuk validation
- UI components: shadcn/ui style

**Data Flow:**
```
Admin assigns user A as chairman kegiatan SAKERNAS
    ↓
Insert into ketua_tim_assignments(user_id, kegiatan_id)
    ↓
User A memilih kegiatan SAKERNAS di Ajukan Dokumen
    ↓
Sistem cek: is_user_chairman(user_id, kegiatan_id)?
    ↓
Auto-set is_ketua_tim = true, tampilkan badge "Ketua Tim"
    ↓
Submit dokumen dengan is_ketua_tim = true
    ↓
Dokumen masuk ke "Laporan Kegiatan" (bukan "Laporan Saya")
```

## Key Decisions Made (dari Interview)

1. **Auto-detect peran** — Tidak ada toggle button, sistem otomatis set berdasarkan assignment
2. **Constraint enforcement** — 1 kegiatan = 1 chairman, bisa di-replace dengan confirmation
3. **Unlimited assignments** — 1 user bisa chairman di unlimited kegiatan
4. **Badge location** — Hanya di Ajukan Dokumen, hilang di halaman Review/detail
5. **Menu visibility** — "Laporan Kegiatan" hanya tampil jika user ada di `ketua_tim_assignments`
6. **Replace vs block** — Admin bisa replace chairman lama dengan confirmation

## Assumptions

1. Admin tahu kegiatan mana yang butuh chairman — tidak ada notifikasi/request flow
2. User yang bukan chairman di suatu kegiatan, auto-set sebagai anggota
3. Chairman tetap bisa submit di kegiatan lain dimana dia bukan chairman
4. Badge cek dilakukan setiap kali user change kegiatan selection

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Auto vs manual toggle | Auto-detect berdasarkan assignment |
| Chairman submit sebagai anggota | Di kegiatannya sendiri: HARUS chairman. Di kegiatan lain: auto anggota |
| Badge di halaman detail | Tidak perlu — sudah ada metadata "Peran" |
| Replace chairman | Bisa, dengan confirmation dialog |
| Unlimited assignments | Yes, no limit |
| User max chairman count | No limit |

---

*Synthesized from: spec.md + research-codebase.md + claude-interview.md*