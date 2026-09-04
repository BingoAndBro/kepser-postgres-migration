# Research — Web: `archiver` + streaming `Response` (TanStack Start / nitro-nightly)

Fase 1b dari `deep-plan`, dipicu jawaban interview "Ya, riset dulu".

## 1. API `archiver` (npm, versi 7.x aktif)

Pola standar (dikonfirmasi dari dokumentasi & contoh resmi):

```js
import archiver from 'archiver'

const archive = archiver('zip', { zlib: { level: 9 } })

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    // file hilang / tidak terbaca — non-fatal, catat & lanjut
  } else {
    throw err
  }
})
archive.on('error', (err) => {
  throw err // fatal — hentikan stream
})

archive.pipe(output) // Writable Node — bisa PassThrough
archive.append(fs.createReadStream(physicalPath), { name: 'folder/nama-aman.pdf' })
archive.append(Buffer.from(daftarIsiText, 'utf-8'), { name: 'DAFTAR_ISI.txt' })
await archive.finalize()
```

- `archiver(format, options)` = **factory function**, bukan class — konsisten dengan ekspektasi RP-07 ("library `archiver`").
- `.append()` menerima `Readable | Buffer | string` + `{ name }` untuk path di dalam ZIP (mendukung `folder/subfolder/file.ext` langsung, tak perlu API direktori terpisah).
- Warning `ENOENT` (file hilang) **tidak** menghentikan stream — sejalan dengan keputusan RP-07 "skip + catat di `DAFTAR_ISI.txt`, jangan gagalkan ZIP". Perakit harus mendengarkan `warning`, mencatatnya ke daftar "dilewati", **bukan** melempar.
- `error` (mis. archive-level failure) memang fatal — pantas destroy stream + biarkan koneksi terputus (klien menerima ZIP terpotong; tidak ada cara "rollback" HTTP setelah header terkirim).

## 2. `output` sebagai jembatan ke `Response` Web-standard

`archive.pipe(output)` butuh Node `Writable`. Untuk keluar sebagai `Response` di server route TanStack Start (`Response` Web-standard), dua opsi:

**A. `PassThrough` + `Readable.toWeb()` (direkomendasikan):**

```js
import { PassThrough } from 'node:stream'
import { Readable } from 'node:stream'

const pass = new PassThrough()
archive.pipe(pass)
archive.finalize() // tak perlu await — event-driven

const webStream = Readable.toWeb(pass)
return new Response(webStream, { headers })
```

`Readable.toWeb()` tersedia sejak Node 17 (stabil di Node 22, versi yang dipakai proyek ini — `@types/node ^22`) dan mengonversi Node `Readable` → web `ReadableStream` yang valid sebagai `BodyInit` pada `Response` standar.

**B. Pipe manual ke `ReadableStream` custom** — lebih verbose, tanpa manfaat tambahan untuk kasus ini. Tidak direkomendasikan.

## 3. Kompatibilitas dengan TanStack Start server routes / nitro-nightly

- Server route handler (`createFileRoute(...).server.handlers.GET/POST`) mengembalikan `Response` **Web standar** — dikonfirmasi oleh dokumentasi resmi TanStack Start (`Response.json()`, teks + header custom, status code). Dokumentasi resmi tidak punya contoh eksplisit untuk `ReadableStream`/binary/`Content-Disposition`, tapi ini bukan API khusus TanStack — `Response` adalah primitif Fetch API standar yang **menerima `ReadableStream` sebagai `BodyInit`** di semua runtime yang mengimplementasikan Fetch (termasuk Node ≥ 18, dan nitro yang dibangun di atas h3/Web-standard primitives).
- Nitro sendiri mendukung `return stream` sebagai body respons pada handler h3 (pola `return stream` alih-alih `send()`/`sendStream()` versi lama) — konsisten dengan pendekatan "kembalikan `Response` yang bodinya stream", bukan API nitro-spesifik yang perlu dipelajari terpisah.
- **Tidak ditemukan laporan ketidakcocokan** `archiver` + nitro/h3 di pencarian ini. Satu isu h3 yang muncul (`getRequestWebStream` stall di preset Deno Deploy/Vercel Edge) menyangkut **request body** di runtime edge tertentu, bukan **response body** Node biasa — proyek ini jalan di Node lokal (bukan edge), jadi tidak relevan.

## 4. Kesimpulan untuk plan

- Pendekatan riset codebase (`archiver` → `PassThrough` → `Readable.toWeb()` → `new Response(webStream, { headers })`) **dikonfirmasi valid** dan merupakan pola paling portabel; tidak perlu dependensi tambahan (`readable-web-to-node-stream` dkk. tidak diperlukan — arah konversinya justru sebaliknya, Node→Web, sudah dibuiltin `node:stream`).
- Tidak ada `Content-Length` diketahui di muka (ukuran ZIP hasil streaming compression tidak pasti sebelum selesai) — ini **normal** untuk unduhan ZIP dinamis; browser menangani unduhan tanpa `Content-Length` dengan baik selama `Content-Disposition: attachment` ada.
- Event `warning` (ENOENT / stat gagal) → tangani sebagai "skip", **catat** entri sebelum melempar apa pun; event `error` → biarkan melempar (fatal, tak ada entri parsial yang bisa diselamatkan).
- **Verifikasi wajib saat implementasi** (bukan hanya baca dokumentasi): jalankan smoke test manual (`pnpm dev` + unduh ZIP nyata, termasuk kasus 1 file hilang) sebelum section RP-07 dianggap selesai — riset ini menegaskan pendekatan tapi tidak menggantikan uji langsung terhadap versi `archiver` + nitro-nightly persis yang terpasang.

**Sumber:**
- [node archiver — GitHub](https://github.com/archiverjs/node-archiver)
- [archiver — npm](https://www.npmjs.com/package/archiver)
- [Server Routes — TanStack Start React Docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
- [Stream | Node.js Documentation](https://nodejs.org/api/stream.html)
- [Migration Guide — Nitro](https://nitro.build/docs/migration)
