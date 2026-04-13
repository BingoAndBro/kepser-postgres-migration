# Section Index: 01-auth-rbac-foundation

## Execution Order

Section diurutkan berdasarkan dependency graph — setiap section adalah prerequisite untuk section yang membutuhkannya.

**Urutan linear wajib:**
1. Section 01 (deps) → Section 02 (deps) → Section 03 (deps) → Section 04 (deps) → Section 05 (deps) → Section 06
2. Section 07 bisa dimulai bersamaan dengan Section 06 (independent — menggunakan auth helpers yang sudah ada di lib)
3. Section 08 bisa dimulai bersamaan dengan Section 05 (independent — API routes tidak terkait dengan UI login page)

**Recommended parallelization:**
- Phase A (sequential): 01 → 02 → 03 → 04
- Phase B (parallel group 1): Start 05 and 08 in parallel after Step 04
- Phase C (sequential): Complete 05/08 → 06
- Phase D (parallel group 2): 06 → 07 (both use auth helpers)

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-dependencies.md | Install dependencies, create drizzle.config.ts, update .env | - | - |
| 02 | section-02-db-schema.md | Drizzle schema + SQL migration untuk roles, user_roles, RLS policies | 01 | No |
| 03 | section-03-supabase-clients.md | Server client, browser client, admin client | 02 | No |
| 04 | section-04-auth-helpers.md | Auth helpers library (getSession, getUserRole, hasRole, requireRole, dll) | 03 | No |
| 05 | section-05-login-page.md | Login page UI, active_role cookie, login redirect logic | 04 | No |
| 06 | section-06-route-guards.md | Route guards (beforeLoad hooks) untuk semua protected routes | 04 | No |
| 07 | section-07-rol-switcher-layout.md | RoleSwitcher dropdown, dynamic sidebar, UserMenu di AppLayout | 04 | No |
| 08 | section-08-auth-api-routes.md | Server API routes (POST /api/auth/login, logout, session, role-switch) | 04 | Yes (with 05, 07) |

## Dependency Graph

```
[01] deps
  └─► [02] db-schema
        └─► [03] supabase-clients
              └─► [04] auth-helpers
                    ├─► [05] login-page
                    ├─► [06] route-guards
                    ├─► [07] role-switcher-layout
                    └─► [08] auth-api-routes
```

## Notes

- **Section 05, 07, 08** tidak tergantung satu sama lain — ketiganya hanya butuh Section 04 (auth helpers)
- **Section 06** butuh Section 04 karena route guards menggunakan `requireRole` dari auth helpers
- Setelah Section 04 selesai, tim bisa parallelize: 2 engineer bekerja di Section 05+08 dan Section 06+07 secara bersamaan
- **Section 02** adalah satu-satunya section yang menyentuh database langsung — perlu hati-hati dengan migration idempotency
