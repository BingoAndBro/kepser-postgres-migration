# Section 07: Ajukan Dokumen - Auto-detect & Badge

## Context

Setelah Section 03 (API user check) selesai, kita perlu update halaman Ajukan Dokumen untuk:
1. Auto-detect peran berdasarkan `ketua_tim_assignments` saat user pilih kegiatan
2. Tampilkan badge "Ketua Tim" atau "Anggota"
3. Remove manual toggle button "Ketua Tim / Anggota"

## Objective

Update `src/routes/pegawai/dokumen/aju.tsx` untuk:
1. Remove toggle button manual
2. Auto-fetch `/api/users/me/is-ketua-tim/[kegiatan_id]` saat kegiatan dipilih
3. Auto-set `is_ketua_tim` state berdasarkan response
4. Tampilkan badge sesuai status

## Prerequisites

- Section(s) yang harus selesai dulu: **03 (API User Check)**
- Files/modules yang harus sudah tersedia:
  - `src/routes/pegawai/dokumen/aju.tsx` (existing)
  - API endpoint `/api/users/me/is-ketua-tim/[kegiatan_id]` sudah ada

## Implementation Steps

### 7.1 Read Existing Code

Pertama, baca existing aju.tsx untuk understand flow dan find where to integrate.

### 7.2 Remove Manual Toggle

Hapus step "Peran dalam Kegiatan" (toggle button). Sistem akan auto-set peran berdasarkan kegiatan yang dipilih.

**Before:**
```tsx
{/* Step 5/6: Peran (Ketua Tim / Anggota) */}
{step === (kategoriHasDetail ? 6 : 5) && (
  <div className="space-y-4">
    <h3 className="font-headline text-base font-bold text-on-surface">
      {kategoriHasDetail ? '6' : '5'}. Peran dalam Kegiatan
    </h3>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setIsKetuaTim(false)}
        className={`flex-1 p-4 rounded-lg border-2 ...`}
      >
        <p className="text-sm font-semibold text-on-surface">Anggota</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Saya adalah anggota tim, bukan ketua.
        </p>
      </button>
      <button
        type="button"
        onClick={() => setIsKetuaTim(true)}
        className={`flex-1 p-4 rounded-lg border-2 ...`}
      >
        <p className="text-sm font-semibold text-on-surface">Ketua Tim</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Saya adalah penanggung jawab kegiatan ini.
        </p>
      </button>
    </div>
    {/* ... */}
  </div>
)}
```

**After:** Hapus entire block ini. Peran akan di-set otomatis.

### 7.3 Add State untuk Badge Loading

```typescript
const [isChairmanLoading, setIsChairmanLoading] = useState(false)
const [chairmanBadgeVisible, setChairmanBadgeVisible] = useState(false)
```

### 7.4 Add Function untuk Check Chairman Status

```typescript
async function checkChairmanStatus(kegiatanId: string) {
  setIsChairmanLoading(true)
  setChairmanBadgeVisible(false)

  try {
    const res = await fetch(`/api/users/me/is-ketua-tim/${kegiatanId}`, {
      credentials: 'include'
    })

    if (res.ok) {
      const data = await res.json()
      setIsKetuaTim(data.is_ketua_tim === true)
      setChairmanBadgeVisible(true)
    } else {
      // Fail: default to anggota
      setIsKetuaTim(false)
      setChairmanBadgeVisible(true)
    }
  } catch (err) {
    console.error('Failed to check chairman status:', err)
    setIsKetuaTim(false)
    setChairmanBadgeVisible(true)
  } finally {
    setIsChairmanLoading(false)
  }
}
```

### 7.5 Call Check di Kegiatan Selection

Di handler where user selects kegiatan (step 3 or 4), call checkChairmanStatus:

```typescript
// Contoh: di handle next dari step kegiatan selection
async function handleNextAfterKegiatan() {
  // ... existing validation ...

  // Check chairman status untuk kegiatan baru
  if (kegiatanId) {
    await checkChairmanStatus(kegiatanId)
  }

  // ... continue to next step ...
}
```

### 7.6 Update Step Labels

Karena kita hapus step "Peran", update step numbers:
- Before: Step 1-7 (dengan Peran di step 5/6)
- After: Step 1-6 (tanpa Peran)

Adjust semua conditional checks:
```typescript
// Before: step === (kategoriHasDetail ? 6 : 5)
// After: remove this condition entirely (step tidak pernah sama dengan 5/6)

// Before: step === (kategoriHasDetail ? 7 : 6) for upload
// After: step === (kategoriHasDetail ? 6 : 5) for upload
```

### 7.7 Add Badge Component

Tambahkan badge setelah kegiatan dipilih (visible di step-step berikutnya sampai upload):

```tsx
{/* Badge - tampil setelah kegiatan dipilih dan chairman status determined */}
{chairmanBadgeVisible && step > (kategoriHasDetail ? 4 : 3) && step < (kategoriHasDetail ? 6 : 5) && (
  <div className={`rounded-lg p-4 transition-all ${
    isKetuaTim
      ? 'bg-green-50 border border-green-200'
      : 'bg-blue-50 border border-blue-200'
  }`}>
    <div className="flex items-center gap-3">
      {isChairmanLoading ? (
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : isKetuaTim ? (
        <Trophy className="w-5 h-5 text-green-600" />
      ) : (
        <Medal className="w-5 h-5 text-blue-600" />
      )}
      <div>
        <p className={`text-sm font-semibold ${
          isKetuaTim ? 'text-green-800' : 'text-blue-800'
        }`}>
          {isKetuaTim
            ? '🏆 Anda adalah Ketua Tim di kegiatan ini'
            : '🏅 Anda adalah Anggota di kegiatan ini'}
        </p>
        <p className={`text-xs mt-0.5 ${
          isKetuaTim ? 'text-green-600' : 'text-blue-600'
        }`}>
          {isKetuaTim
            ? 'Dokumen yang Anda ajukan akan masuk ke Laporan Kegiatan. Anggota tim Anda juga dapat melihat dokumen ini.'
            : 'Dokumen Anda akan masuk ke Laporan Saya.'}
        </p>
      </div>
    </div>
  </div>
)}
```

### 7.8 Handle Perubahan Kegiatan

Jika user back dan change kegiatan, re-check:

```typescript
// Di handler kegiatan change
function handleKegiatanChange(newKegiatanId: string) {
  setKegiatanId(newKegiatanId)
  setChairmanBadgeVisible(false) // Hide badge sementara

  // Check chairman status for new kegiatan
  checkChairmanStatus(newKegiatanId)
}
```

## Files to Modify

- `src/routes/pegawai/dokumen/aju.tsx` — Update auto-detect dan badge

## Test Stubs

### Happy Path
- [ ] Toggle button "Ketua Tim / Anggota" tidak lagi ada
- [ ] Badge "🏆 Anda adalah Ketua Tim" tampil setelah pilih kegiatan (jika chairman)
- [ ] Badge "🏅 Anda adalah Anggota" tampil setelah pilih kegiatan (jika bukan chairman)
- [ ] Badge muncul setelah fetch API selesai
- [ ] is_ketua_tim state auto-set berdasarkan kegiatan

### Edge Cases
- [ ] Ganti kegiatan → badge update sesuai kegiatan baru
- [ ] User chairman di kegiatan A, pilih kegiatan B (bukan chairman) → badge "Anggota"

### Error Cases
- [ ] API fail → default ke "Anggota", badge tetap tampil

## Definition of Done

- [ ] Toggle button removed
- [ ] Badge tampil setelah kegiatan dipilih
- [ ] Badge correct untuk chairman vs anggota
- [ ] Badge hilang di step upload (tidak di step Form)
- [ ] is_ketua_tim auto-set berdasarkan API response
- [ ] Change kegiatan triggers re-check