# Section Index: SPEC 06 User Management

## Execution Order

```
1. Database Migration (RLS policies)
2. Admin API — User CRUD
3. User API — Self-Service
4. Master User Page — Real Data
5. Profile Page
6. Validation & Polish
```

**Rationale:**
- Step 1 (migration) harus duluan karena table perlu ready sebelum API
- Step 2 & 3 bisa parallel — keduanya membuat API routes
- Step 4 depend on Step 2 — page butuh API working
- Step 5 depend on Step 3 — profile butuh API working
- Step 6 adalah final polish, depend on semua steps lain

## Sections

| # | File | Deskripsi | Depends On | Parallelizable? |
|---|------|-----------|------------|-----------------|
| 01 | section-01-migration.md | RLS policies untuk user_roles | - | - |
| 02 | section-02-admin-api.md | Admin CRUD API endpoints | 01 | No |
| 03 | section-03-user-api.md | Self-service API endpoints | 01 | Yes (with 02) |
| 04 | section-04-master-user-page.md | Replace mock dengan real data | 02 | No |
| 05 | section-05-profile-page.md | User profile page | 03 | No |
| 06 | section-06-validation-polish.md | Validasi, error handling, UI polish | 02, 03, 04, 05 | No |
