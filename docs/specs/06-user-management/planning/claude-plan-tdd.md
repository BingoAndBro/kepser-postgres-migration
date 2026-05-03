# TDD Stubs: SPEC 06 User Management

## Tests for: Step 2 — Admin API User CRUD

### Happy Path
- [ ] Admin can create user with valid email, password, nama_lengkap, nip_nrp, and roles
- [ ] Admin can list all users with roles and status
- [ ] Admin can get single user by ID
- [ ] Admin can update user metadata (nama_lengkap, nip_nrp, departemen)
- [ ] Admin can update user roles (add/remove)
- [ ] Admin can reset password for any user
- [ ] Admin can deactivate user
- [ ] Admin can reactivate deactivated user

### Edge Cases
- [ ] Create user with duplicate email returns 409 Conflict
- [ ] Create user without PEGAWAI role — auto-adds PEGAWAI
- [ ] Create user with empty email returns 400 Bad Request
- [ ] Create user with short password returns 400 Bad Request
- [ ] Get non-existent user returns 404 Not Found
- [ ] Update user with invalid role returns 400 Bad Request
- [ ] Reset password with short password returns 400 Bad Request
- [ ] Deactivate already deactivated user succeeds (idempotent)
- [ ] Reactivate already active user succeeds (idempotent)

### Error Cases
- [ ] Non-admin user calling admin API returns 403 Forbidden
- [ ] Unauthenticated request returns 401 Unauthorized
- [ ] Invalid user ID format returns 400 Bad Request
- [ ] Network error returns 500 Internal Server Error

---

## Tests for: Step 3 — User API Self-Service

### Happy Path
- [ ] Authenticated user can get own profile
- [ ] User can change password with correct old password
- [ ] User can see own roles in profile
- [ ] User can see own metadata (nama_lengkap, nip_nrp, departemen)

### Edge Cases
- [ ] User cannot get another user's profile (403 or filtered)
- [ ] Change password with wrong old password returns 400
- [ ] Change password with new same as old returns 400
- [ ] Change password with too short new password returns 400
- [ ] Empty old password returns 400
- [ ] Empty new password returns 400

### Error Cases
- [ ] Unauthenticated request returns 401 Unauthorized
- [ ] User tries to change another user's password returns 403 Forbidden
- [ ] Network error during password change returns 500

---

## Tests for: Step 4 — Master User Page

### Happy Path
- [ ] Page loads and displays user list from API
- [ ] User list shows name, email, roles, status
- [ ] Search filters user list by name or email
- [ ] Status filter shows only Aktif/Nonaktif users
- [ ] Click "Tambah User" opens create modal
- [ ] Create modal submits and shows new user in list
- [ ] Click edit icon opens edit modal with user data
- [ ] Edit modal updates user and reflects in list
- [ ] Click reset password opens confirmation
- [ ] Reset password confirms and shows success message
- [ ] Click deactivate opens confirmation dialog
- [ ] Deactivate user changes status indicator to red
- [ ] Click activate (on deactivated user) opens confirmation
- [ ] Activate user changes status indicator to green
- [ ] Pagination shows correct page numbers

### Edge Cases
- [ ] Empty search results shows "Tidak ada user yang ditemukan"
- [ ] API error shows error message with retry button
- [ ] Loading state shows skeleton or spinner
- [ ] Delete button is disabled with tooltip explaining soft delete
- [ ] Edit modal has PEGAWAI role checkbox disabled
- [ ] Create modal has PEGAWAI role checkbox pre-checked and disabled

### Error Cases
- [ ] API timeout shows "Gagal memuat data" message
- [ ] Network offline shows error message
- [ ] Form validation errors shown inline
- [ ] Duplicate email error shows in modal

---

## Tests for: Step 5 — Profile Page

### Happy Path
- [ ] Page loads and shows user profile
- [ ] Profile displays name, email, NIP, departemen
- [ ] Profile displays role badges
- [ ] Change password form shows all required fields
- [ ] Valid password change shows success message
- [ ] After password change, form clears

### Edge Cases
- [ ] User without departemen shows "-"
- [ ] User with multiple roles shows all badges
- [ ] Change password with wrong old password shows error
- [ ] Empty form fields show validation errors

### Error Cases
- [ ] Unauthenticated access redirects to login
- [ ] Session expired shows re-login prompt

---

## Tests for: Step 6 — Validation & Error Handling

### Happy Path
- [ ] Valid email passes format validation
- [ ] Valid password (8+ chars) passes length validation
- [ ] Valid NIP (numerik, 8-20 chars) passes format validation
- [ ] Valid role assignment passes role validation

### Edge Cases
- [ ] Email without @ returns 400
- [ ] Email without domain returns 400
- [ ] Password 7 chars returns 400
- [ ] Password 8 chars passes (edge)
- [ ] NIP with letters returns 400
- [ ] NIP 7 chars returns 400
- [ ] NIP 21 chars returns 400
- [ ] Empty required fields return 400

### Error Cases
- [ ] Invalid JSON body returns 400
- [ ] Missing Content-Type header handled gracefully

---

## Tests for: Step 7 — Testing & Polish

### Happy Path
- [ ] Create user → user can login with new credentials
- [ ] Edit user metadata → changes reflect in profile
- [ ] Deactivate user → user cannot login
- [ ] Reactivate user → user can login again
- [ ] Change password → new password works, old fails
- [ ] All UI responsive on mobile

### Edge Cases
- [ ] Rapid successive requests handled gracefully
- [ ] Concurrent edits (rare) — last write wins
- [ ] Page refresh preserves data state

### Error Cases
- [ ] All error states have user-friendly messages
- [ ] All network errors have retry options
