# Section 09: Admin Layout & Navigation

## Context

Admin pages perlu tab navigation atau sidebar sub-menu agar navigasi antar Fungsi/Kegiatan/Kelengkapan mudah. Juga perlu redirect dari `/admin/master-data` ke default tab.

## Objective

Wire semua admin master data pages dengan tab navigation yang rapi, dan update NAV_CONFIG untuk route yang benar.

## Prerequisites

- Section(s) yang harus selesai dulu: **Section 06, 07, 08**
- Files/modules yang harus sudah tersedia:
  - `src/routes/admin/master-data/fungsi.tsx`
  - `src/routes/admin/master-data/kegiatan.tsx`
  - `src/routes/admin/master-data/kelengkapan.tsx`

## Implementation Steps

### 9a. Create Index Redirect

`src/routes/admin/master-data/index.tsx`:

Redirect ke `/admin/master-data/fungsi` (default tab).

Pattern: `throw redirect({ to: '/admin/master-data/fungsi' })` — sama dengan pattern yang sudah ada di codebase.

### 9b. Shared Tab Navigation

Buat shared tab component atau letakkan tab navigation di masing-masing page.

Tab items:
1. "Departemen Fungsi" → `/admin/master-data/fungsi`
2. "Master Kegiatan" → `/admin/master-data/kegiatan`
3. "Kelengkapan Dokumen" → `/admin/master-data/kelengkapan`

Design: horizontal tabs di atas content, active tab highlighted (bg-primary, text-white), inactive tab hover effect. Pattern sama dengan tab navigation yang sudah ada di `admin.index.tsx`.

### 9c. Update AppLayout NAV_CONFIG

Edit `src/components/layout/AppLayout.tsx` — NAV_CONFIG ADMIN section:

```typescript
{
  title: 'MANAGEMENT',
  items: [
    { id: 'master_user', label: 'Master User', icon: Shield, to: '/admin/master-data/user' },
    { id: 'master_fungsi', label: 'Departemen Fungsi', icon: Building2, to: '/admin/master-data/fungsi' },
    { id: 'master_kegiatan', label: 'Master Kegiatan', icon: ClipboardList, to: '/admin/master-data/kegiatan' },
    { id: 'master_kelengkapan', label: 'Kelengkapan Dokumen', icon: FileCheck, to: '/admin/master-data/kelengkapan' },
  ],
}
```

### 9d. Update admin.index.tsx

Halaman `admin.index.tsx` yang sekarang (Master User tab) perlu di-migrate ke `/admin/master-data/user.tsx`. Buat file baru `src/routes/admin/master-data/user.tsx` dengan konten yang sama persis dari `admin.index.tsx`, lalu redirect `admin.index.tsx` ke `/admin/master-data/user`.

## Files to Create/Modify

- `src/routes/admin/master-data/index.tsx` — **CREATE**: redirect to fungsi
- `src/routes/admin/master-data/user.tsx` — **CREATE**: migrate from admin.index
- `src/routes/admin/index.tsx` — **MODIFY**: redirect to user
- `src/components/layout/AppLayout.tsx` — **MODIFY**: NAV_CONFIG routes

## Test Stubs

- `/admin/master-data` → redirects to `/admin/master-data/fungsi`
- Tab navigation highlights active tab
- All tabs navigate correctly
- NAV_CONFIG links point to correct routes

## Definition of Done

- [ ] `/admin/master-data` → `/admin/master-data/fungsi`
- [ ] Tabs visible dan clickable di semua 3 halaman
- [ ] Active tab highlighted
- [ ] NAV_CONFIG links correct
- [ ] `/admin` → `/admin/master-data/user`
- [ ] Build succeeds
