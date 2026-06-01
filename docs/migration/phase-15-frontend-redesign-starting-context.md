# Phase 15 - Frontend Redesign Starting Context

Date: 2026-06-01

Status: starting context only. This is not a frontend redesign plan yet.

## Current Runtime Truth

The app is an active TanStack Start, React 19, TypeScript, Tailwind CSS v4 application backed by local PostgreSQL, Drizzle ORM, local `dms_session` auth, and local filesystem storage.

Folder-first archive runtime is current authority:

- archive folders live in `arsip.berkas_arsip`;
- folder items live in `arsip.berkas_arsip_item`;
- workflow source metadata comes from `dokumen.dokumen_transaksi`;
- manual source metadata comes from `arsip.manual_arsip` and `arsip.manual_arsip_attachment`;
- folder lifecycle is `OPEN/null -> CLOSED/AKTIF -> CLOSED/INAKTIF -> CLOSED/USUL_MUSNAH -> CLOSED/DIMUSNAHKAN`.

`Musnahkan Data` moves a folder-first berkas from `USUL_MUSNAH` to `DIMUSNAHKAN`, invokes folder-first physical file deletion, preserves metadata/logical references, and keeps preview/download blocked.

Active runtime/package Supabase dependency is retired. Historical Supabase artifacts remain and must not be treated as active fallback.

## Active Pages Frontend May Touch

Use `AGENTS.md` as the route/ownership map. The main active areas are:

- Pegawai document submission, document list, detail, edit, revision, and reports.
- PPK inbox, validation, rejection, revision, and document detail flows.
- PPSPM-facing Bendahara namespace pages, while keeping internal role value `BENDAHARA`.
- Kepala Sub Bagian Umum archive namespace under `/arsiparis`.
- Penanggung Jawab Kinerja `Laporan Kinerja`.
- Admin master-data and user-management pages.

Active archive pages are:

- `/arsiparis/berkas`
- `/arsiparis/berkas/$id`
- `/arsiparis/inaktif`
- `/arsiparis/usul-musnah`

Active archive actions must continue using folder-first APIs under `/api/arsiparis/berkas/**` and `/api/arsiparis/dokumen/$id.archive`.

## Pages Not To Restore

Do not restore these removed surfaces during visual redesign:

- `/arsiparis/aktif`
- `/arsiparis/search`
- `/arsiparis/arsip/$id`
- legacy `/api/arsiparis/aktif`
- legacy `/api/arsiparis/inaktif`
- legacy `/api/arsiparis/usul-musnah`
- legacy `/api/arsiparis/search`
- legacy `/api/arsiparis/arsip/*`
- `Laporan Klasifikasi`
- global/sidebar `Cari Arsip`

Local archive filters belong on the folder-first pages. Header search is a separate UI surface and is not archive authority.

## Backend And API Boundaries

Do not change these without a separately scoped backend phase:

- schema, Drizzle migrations, seed behavior, package files, route generation, storage layout, or API contracts;
- `dms_session` auth boundary;
- `dms_active_role` as UX-only state;
- server/API RBAC as the authorization authority;
- no `ADMIN` substitution for operational roles;
- no Supabase runtime fallback;
- no legacy canonical archive runtime resurrection.

File access must keep blocking `DIMUSNAHKAN`, including stale token/path access. UI error rendering must not expose physical paths, logical paths, storage roots, tokens, signed-token internals, SQL details, env values, cookies, session values, raw rows, password hashes, or secrets.

## Role Labels

Internal role values stay unchanged unless a later backend phase explicitly changes them.

- `BENDAHARA` may display as `PPSPM` where UI requires it.
- Full PPSPM wording is `Pejabat Penandatangan Surat Perintah Membayar`.
- `KEPALA_SUB_BAGIAN_UMUM` should display as `Kepala Sub Bagian Umum`.
- `PENANGGUNG_JAWAB_KINERJA` should display as `Penanggung Jawab Kinerja`.

## Seed And Login Note

`db:local:seed` uses dotenv with `--no-expand` so `DMS_DEV_SEED_PASSWORD_HASH` is treated as a literal Argon2id PHC string.

Do not print password hashes, env contents, DB URLs, credentials, tokens, cookies, sessions, storage roots, physical paths, logical paths, or other secrets during frontend setup or debugging.

## Redesign Constraints

For the first frontend redesign phase:

- prefer UI/component/layout changes only;
- do not modify schema, migrations, packages, route generation, or runtime route contracts unless explicitly scoped;
- do not run DB reset/migrate/seed, broad E2E, or dev-server commands unless the phase requests them;
- do not resurrect legacy canonical archive pages, APIs, or schema assumptions;
- do not claim production readiness, go-live approval, operational certification, security certification, or full Supabase repository removal.
