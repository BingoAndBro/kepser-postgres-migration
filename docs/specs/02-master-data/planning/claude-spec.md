# Synthesized Spec: 02 — Master Data Management

## Problem Statement

Tanpa master data, komponen lain (Submit Flow, Approval Flow, Arsip Flow) tidak bisa beroperasi. Pegawai tidak bisa memilih fungsi/kegiatan saat ajukan dokumen, dan sistem tidak tahu kelengkapan dokumen apa yang wajib diupload. Master Data Management adalah fondasi data yang dibutuhkan semua komponen downstream.

## Goals

1. Admin bisa CRUD tiga jenis master data: Fungsi, Kegiatan, Kelengkapan Dokumen
2. Data master bisa dibaca oleh semua komponen lain via helper functions
3. Seed data awal (6 fungsi, contoh kegiatan, kelengkapan SAKERNAS) tersedia saat deploy
4. Soft delete memastikan data tidak hilang — relasi tetap utuh

## Non-Goals (Explicit Exclusions)

- Import/export CSV/Excel master data
- Versioning master data
- Validasi relasi kompleks (handled via soft delete + warning)
- User management (bukan bagian master data — itu di Spec 01)
- RLS policies untuk master data (hanya ADMIN yang write, tidak perlu RLS untuk read)

## Context & Constraints

- Arsitektur: TanStack Start SSR + Supabase (PostgreSQL)
- ORM: Drizzle ORM untuk type-safe schema definitions
- Auth: Sudah ada guardRole/guardAnyRole tapi page routes belum pakai — kita akan pakai API-level validation
- UI Components: Sudah ada Button, Dialog, Select, Table, Input, Label
- Seed data: Via SQL migration (migration `001_auth_rbac.sql` sudah ada — seed data di-append)

## Key Decisions Made

1. **Drizzle schema** untuk type-safe definitions (bukan raw SQL type inference)
2. **API-level validation** untuk ADMIN role (bukan guard di beforeLoad)
3. **Soft delete only** — tidak ada hard delete
4. **Seed via SQL** — seed data di-append ke migration existing
5. **No optimistic locking** — MVP tidak perlu concurrency control

## Assumptions

1. ADMIN user sudah ada dan bisa login (Spec 01 requirement)
2. Migration `001_auth_rbac.sql` sudah dijalankan di Supabase
3. Seed data 6 fungsi + contoh kegiatan + kelengkapan SAKERNAS cukup untuk MVP
4. Semua role (kecuali ADMIN) hanya bisa READ master data via helper functions

## Open Questions

1. Apakah urutan kelengkapan dokumen perlu disimpan? (Jawaban MVP: Urutan alfabet, tidak perlu drag-drop)
2. Apakah perlu pagination untuk list halaman? (Jawaban MVP: List saja, pagination jika > 50 items)
