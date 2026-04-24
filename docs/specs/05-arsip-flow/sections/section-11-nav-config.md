# Section 11: Navigation Config Update

## Context
Section 08, Section 09, Section 10 akan membuat halaman UI untuk Arsiparis. Navigation sidebar perlu di-update dengan menu items baru.

## Objective
Update `NAV_CONFIG['ARSIPARIS']` di `src/components/layout/AppLayout.tsx` agar sidebar menampilkan semua menu items untuk role Arsiparis.

## Prerequisites
- Sections 08, 09, 10 sudah dimulai atau selesai (routes sudah dibuat)
- Pattern: lihat `NAV_CONFIG` yang sudah ada untuk role lain (BENDAHARA, PPK, dll)

## Implementation Steps

### 1. Edit `src/components/layout/AppLayout.tsx`

 Cari `NAV_CONFIG` dan temukan entry untuk `ARSIPARIS`. Update dengan menu items:

```typescript
ARSIPARIS: [
  {
    title: 'GENERAL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/arsiparis' },
    ],
  },
  {
    title: 'PEMBERKASAN',
    items: [
      { id: 'pemberkasan', label: 'Pemberkasan Arsip', icon: Archive, to: '/arsiparis/inbox' },
      { id: 'arsip_aktif', label: 'Daftar Arsip Aktif', icon: FolderOpen, to: '/arsiparis/aktif' },
      { id: 'verifikasi_penyusutan', label: 'Verifikasi Penyusutan', icon: ClipboardCheck, to: '/arsiparis/verifikasi-penyusutan' },
      { id: 'arsip_inaktif', label: 'Daftar Arsip Inaktif', icon: ArchiveX, to: '/arsiparis/inaktif' },
      { id: 'usul_musnah', label: 'Usul Musnah', icon: Trash2, to: '/arsiparis/usul-musnah' },
      { id: 'klasifikasi', label: 'Master Klasifikasi', icon: Network, to: '/arsiparis/klasifikasi' },
    ],
  },
],
```

**Catatan icons:**
- `Archive` — dari lucide-react
- `FolderOpen` — dari lucide-react
- `ClipboardCheck` — dari lucide-react
- `ArchiveX` — dari lucide-react
- `Trash2` — dari lucide-react
- `Network` — dari lucide-react

Pastikan icons yang digunakan ada di import lucide-react yang sudah ada di file.

## Files to Modify

- `src/components/layout/AppLayout.tsx` — update NAV_CONFIG entry untuk ARSIPARIS

## Test Stubs

- [ ] Sidebar ARSIPARIS menampilkan semua menu items
- [ ] Menu items navigasi ke route yang benar
- [ ] Active menu item highlighted
- [ ] Role switcher bisa switch ke ARSIPARIS

## Definition of Done

- [ ] NAV_CONFIG ARSIPARIS di-update dengan semua menu items
- [ ] Icons yang digunakan tersedia di lucide-react
- [ ] Semua route `/arsiparis/*` memiliki menu item di sidebar
- [ ] Test stubs pass