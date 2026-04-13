# Interview Transcript: 01-auth-rbac-foundation

## Fase 2: Interview — Critical Ambiguities

Tanggal: 2026-04-09
Spec: docs/specs/01-auth-rbac-foundation/spec.md

---

## Pertanyaan Kritis (Dijawab Langsung dari Spec + AGENTS.md)

Setelah riset codebase, ada beberapa ambiguities yang sudah bisa dijawab dari spec + AGENTS.md, dan beberapa yang perlu konfirmasi tambahan.

### Q1: Primary Role Determination — Apa "primary role" itu?
**Spec:** "Redirect based on primary role" dan "PEGAWAI sebagai role default baru"

**Analisis:**
Spec menyebut "primary role" tapi tidak mendefinisikan bagaimana memilihnya jika user punya 2+ role. AGENTS.md tidak menyebut "primary role", tapi spec spec ini menyebut "active role" yang disimpan di session/client state.

**Jawaban (dari spec):**
- Active role dipilih manual oleh user via role switcher
- Jika user punya >1 role dan belum pilih, default-nya tidak jelas
- ADMIN tidak punya dropdown, langsung ke `/admin`

**Keputusan yang perlu disepakati:**
1. Default active role saat first login: role pertama (by created_at) atau role dengan "priority" tertinggi?
2. Atau: redirect ke `/` (inbox) untuk semua non-ADMIN, tanpa redirect spesifik role?

**Rekomendasi:** Default to PEGAWAI (role dengan id terkecil / first created). Redirect `/` bukan redirect per-role, karena `/` adalah inbox universal. Role-specific routes (`/ppk/*`, `/bendahara/*`, `/arsiparis/*`) hanya untuk pages spesifik, bukan dashboard.

---

### Q2: ADMIN Login — "Akun Dedicated" artinya?
**Spec:** "ADMIN tidak punya dropdown role — akun dedicated, login terpisah"

**Analisis:**
Artinya admin login ke email/akun yang benar-benar berbeda? Atau admin login sama seperti user lain tapi tidak ada dropdown?

**Jawaban (dari spec):**
- ADMIN login dengan credentials mereka sendiri (akun dedicated = akun khusus yang tidak dipakai orang lain)
- ADMIN tidak punya role switcher dropdown di UI (karena mereka cuma punya 1 role: ADMIN)
- ADMIN tidak boleh punya multi-role (jika suatu akun punya ADMIN role, itu harus jadi satu-satunya role)

**Implikasi:**
- ADMIN provisioning dilakukan manual oleh super-admin atau initial setup
- Tidak ada UI untuk ADMIN switch role karena ADMIN tidak punya multi-role
- ADMIN route `/admin/*` bisa diakses langsung dari `/login` tanpa perlu melewati inbox

---

### Q3: Route `/dokumen/*` Access — "PEGAWAI (dan PPK, BENDAHARA, ARSIPARIS)"
**Spec:** `/dokumen/*` → PEGAWAI (dan PPK, BENDAHARA, ARSIPARIS)

**Analisis:**
Ini berarti route `/dokumen/*` bisa diakses oleh semua role KECUALI ADMIN? Atau hanya 4 role itu saja?

**Jawaban:**
- `/dokumen/*` accessible oleh semua authenticated users (PEGAWAI, PPK, BENDAHARA, ARSIPARIS)
- ADMIN TIDAK bisa akses `/dokumen/*` (karena itu untuk workflow dokumen, bukan admin panel)
- Route access check: user boleh akses route X jika **salah satu** dari role-nya mengizinkan

**Implikasi untuk routing:**
- `/dokumen/*` perlu parent route dengan auth check — semua authenticated users
- `/admin/*` — ADMIN only
- `/arsiparis/*` — ARSIPARIS only
- `/ppk/*` — PPK only
- `/bendahara/*` — BENDAHARA only

---

### Q4: RLS Function-Based Policy — Implementasinya Bagaimana?
**Spec:** "RLS untuk tabel user_roles perlu join — Supabase RLS不支持 direct join antar tabel, jadi gunakan function-based policy"

**Pertanyaan:**
Function-based policy di Supabase Postgres menggunakan `SECURITY DEFINER` function yang jalan dengan privileges pengguna yang membuat function.

**Keputusan Desain:**
```sql
-- Function untuk cek role user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_roles(uuid)
RETURNS SETOF roles AS $$
  SELECT r.* FROM roles r
  JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = $1;
$$ SECURITY DEFINER;

-- RLS policy on user_roles
CREATE POLICY user_roles_select ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM get_user_roles(auth.uid()) WHERE nama = 'ADMIN'));
```

Ini membutuhkan Supabase Postgres function. Apakah ini akan di-manage via Supabase dashboard (SQL editor) atau via Drizzle migration?

**Jawaban dari AGENTS.md:**
- Drizzle ORM untuk type-safe query, schema-as-code
- Jadi: Drizzle migration untuk create tables + RLS policies

---

### Q5: Role Switcher Persistence — localStorage vs Cookie vs Supabase Session
**Spec:** "Session simpan active_role: role yang sedang aktif disimpan di localStorage atau session, agar saat reload halaman role tetap konsisten"

**Analisis 3 Opsi:**

**Opsi A — localStorage:**
- Pro: Simple, tidak perlu server round-trip
- Con: Jika user buka tab baru, role tidak sync. Lebih vulnerable terhadap XSS.
- Con: Tidak persist di server-side SSR (saat server pre-render, tidak ada localStorage)

**Opsi B — Cookie (rekomendasi):**
- Pro: SSR-aware, persist across tabs, httpOnly bisa dilindungi
- Pro: Cocok dengan Supabase SSR client pattern
- Con: Perlu update cookie saat switch role

**Opsi C — Supabase session metadata:**
- Supabase tidak punya built-in session metadata extensibility
- Bisa disimpan di `user_metadata` di auth.users, tapi ini requires update ke auth.users setiap switch role
- Con: Auth token akan berubah setiap switch role (karena JWT recalculated)

**Rekomendasi:**
Gunakan Cookie (httpOnly: false, secure: true, sameSite: 'lax') untuk `active_role`. Server baca cookie ini di SSR untuk pre-render halaman dengan role yang tepat.

---

### Q6: Route `/ppk/*` dan `/bendahara/*` — Apakah Sudah Ada?
**Spec:** Route matrix mencakup `/ppk/*` dan `/bendahara/*` tetapi route ini belum ada di codebase.

**Analisis:**
Spec ini adalah FOUNDATION, bukan implementasi route. Route `/ppk/*` dan `/bendahara/*` akan dibuat di iterasi berikutnya (spec lain). Yang perlu di spec ini adalah:
1. Route guard pattern yang bisa dipakai untuk semua role-based routes
2. Auth infrastructure yang reusable

**Jawaban:**
Spec ini cukup membuatkan:
- Auth infrastructure (`src/lib/auth.ts`)
- Route guards (beforeLoad hooks)
- Login page
- Role switcher component
- Middleware/data-access helpers

Route pages (`/ppk/*`, `/bendahara/*`) adalah tanggung jawab spec lain.

---

## Open Questions Remaining

### Q7: Supabase Project Setup — Sudah Ada Atau Belum?
Spec ini mengasumsikan Supabase project sudah ada. Apakah ada Supabase project yang sudah di-setup? Apakah perlu dibuatkan SQL migration file untuk dijalankan manual?

**Jawaban (dari spec):**
- Spec menyebut "Seed data 5 role berhasil di-insert"
- Ini implies ada SQL yang perlu dijalankan (migration file)
- Karena Drizzle ORM belum ada di package.json, migration bisa dilakukan via:
  1. Drizzle Kit migration (jika sudah setup)
  2. Manual SQL script yang dijalankan via Supabase dashboard
  3. SQL file yang diberikan ke owner project untuk dijalankan manual

**Rekomendasi untuk spec ini:**
- Buat SQL migration file di `supabase/migrations/` (konvensi Supabase)
- Buat juga Drizzle schema sebagai code-first alternative
- Berikan 2 opsi: SQL manual atau Drizzle migration

---

## Ringkasan Interview

Dari 7 pertanyaan kritis, 6 sudah bisa dijawab dari spec + research. Hanya Q7 (Supabase setup) yang perlu konfirmasi tambahan tapi sudah bisa diasumsikan sebagai berikut:

**Asumsi diambil:**
1. **Primary role** = role yang pertama kali di-assign ke user (first by created_at). Default active role = PEGAWAI.
2. **ADMIN dedicated account** = akun dengan satu role ADMIN, tidak punya multi-role, login via `/login` biasa.
3. **`/dokumen/*`** = accessible oleh semua authenticated users non-ADMIN.
4. **RLS policy** = menggunakan SECURITY DEFINER function untuk cross-table check, di-manage via Drizzle migration.
5. **Active role persistence** = Cookie (bukan localStorage) untuk SSR compatibility.
6. **Route pages** (`/ppk/*`, `/bendahara/*`) = diimplementasi di spec lain; spec ini fokus pada auth infrastructure.
7. **Supabase setup** = belum ada. Buat SQL migration file + Drizzle schema sebagai deliverable.

**Tidak ada pertanyaan kritis yang mengubah plan secara signifikan.** Plan bisa lanjut ke Fase 3 tanpa konfirmasi tambahan.
