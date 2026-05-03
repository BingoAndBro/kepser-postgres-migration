# Section 06: Validation & Polish

## Context

Final pass untuk memastikan semua validation di-place dan UI responsive.

## Objective

Pastikan:
- Server-side validation lengkap
- Error messages user-friendly
- Loading states work
- Edge cases handled
- UI responsive

## Prerequisites
- Sections 02, 03, 04, 05 selesai

## Implementation Steps

### 1. Server-Side Validation

**Email validation:**
```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

**Password validation:**
```typescript
function isValidPassword(password: string): boolean {
  return password.length >= 8
}
```

**NIP validation:**
```typescript
function isValidNip(nip: string): boolean {
  const nipRegex = /^\d{8,20}$/
  return nipRegex.test(nip)
}
```

**Role validation:**
```typescript
function canRemoveRole(userRoles: RoleName[], roleToRemove: RoleName): boolean {
  if (roleToRemove !== 'PEGAWAI') return true
  return userRoles.length > 1
}
```

### 2. Add error handling to API routes

Tambahkan proper error responses:
- 400 Bad Request — validation errors
- 401 Unauthorized — not authenticated
- 403 Forbidden — not authorized
- 404 Not Found — resource not found
- 409 Conflict — duplicate email
- 422 Unprocessable Entity — business rule violation
- 500 Internal Server Error — unexpected errors

### 3. Update UI error states

- Add toast notifications untuk success/error
- Add inline form validation
- Add loading spinners
- Add empty states
- Add retry buttons

### 4. Polish UI

- Add skeleton loading untuk tables
- Add smooth transitions
- Add responsive design
- Add keyboard navigation
- Add focus management di modals

### 5. Security check

- Verify semua admin endpoints punya guard
- Verify service role key tidak di-expose
- Verify RLS policies correct
- Verify no SQL injection vulnerabilities

## Files to Modify
- All API route files — add validation
- `src/routes/admin.master-data.user.tsx` — add error states
- `src/routes/profile.tsx` — add error states

## Test Stubs
- [ ] Email format validation works
- [ ] Password min length enforced
- [ ] NIP format enforced
- [ ] Role removal check works
- [ ] Error responses have proper status codes
- [ ] Error messages are user-friendly
- [ ] Loading states shown during API calls
- [ ] Empty states shown when no data

## Definition of Done
- [ ] All validation in place
- [ ] Error handling comprehensive
- [ ] Loading states work
- [ ] Empty states display
- [ ] UI responsive
- [ ] Security check passed
