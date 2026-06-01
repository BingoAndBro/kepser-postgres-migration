# Phase 13A - Document Classification To Archive Filing Domain Plan

Date: 2026-05-28

Status: planning/scope-lock only. This phase documents the new client-driven Phase 13 domain direction and does not change runtime behavior, schema, migrations, routes, route generation, package files, database rows, storage files, cleanup behavior, or Supabase runtime behavior.

## 1. Phase Status

Phase 13A is documentation and planning only.

This phase:

- changes no runtime behavior;
- changes no schema, Drizzle model, migration, seed, or database row;
- performs no legacy archive data cleanup or reset;
- performs no route deletion or route generation;
- performs no package change;
- performs no storage or physical file operation.

This is not production readiness, not public rollout approval, not go-live approval, not operational certification, not security certification, and not compliance validation.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog. This document does not claim Supabase is fully removed from the repository and does not approve any Supabase fallback.

## 2. Executive Summary

Phase 13 starts a new client feedback alignment workstream after the bounded local/internal/LAN Phase 12 unified archive milestone.

The new domain direction is that documents are not immediately archives. A completed workflow document or manually added document first enters `Pengklasifikasian Dokumen`, where `KEPALA_SUB_BAGIAN_UMUM` classifies it by `Jenis Pembayaran` and places it into an open folder/berkas for that payment type. The document becomes an archive only after `KEPALA_SUB_BAGIAN_UMUM` closes/finalizes the folder and fills final archive metadata.

The folder/berkas, not a single item row, becomes the primary archive filing and lifecycle unit. Closed folders enter the existing archive lifecycle:

```text
AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

The existing `DIMUSNAHKAN` policy remains: metadata may remain visible to authorized users, but preview/download/file access must be blocked, including stale URL/token/path access.

## 3. Terminology Mapping

| Old term | New target term | Phase 13A decision |
|---|---|---|
| Bendahara | PPSPM - Pejabat Penandatangan Surat Perintah Membayar | Display label changes first. Internal role enum remains `BENDAHARA` unless a future explicit phase approves an internal rename. |
| Pemberkasan Arsip initial stage | Pengklasifikasian Dokumen | Initial pre-archive classification stage for completed/manual documents. |
| Klasifikasi Arsip at initial stage | Jenis Pembayaran | Same conceptual master/category family as archive classification, but stage-specific wording changes before folder closure. |
| Nomor Surat | Nomor SPM | Filled when closing/finalizing a folder, not during initial document classification. |
| Penambahan Arsip | Penambahan Dokumen | Manual entry creates a document entering classification/folder flow, not an immediate final archive. |
| Daftar Arsip Aktif | Pemberkasan Arsip Aktif | Folder-first active archive filing page. |

`Kepala Sub Bagian Umum` remains the canonical user-facing replacement concept for old `Arsiparis` wording. `ADMIN` remains a dedicated administration role and must not be treated as `KEPALA_SUB_BAGIAN_UMUM`, `PEGAWAI`, `PPK`, `BENDAHARA`, or future display-label `PPSPM` automatically.

## 4. New Lifecycle/Domain Flow

Target conceptual flow:

```text
completed workflow document or manually added document
-> Pengklasifikasian Dokumen
-> choose Jenis Pembayaran
-> document enters an OPEN folder/berkas for that Jenis Pembayaran
-> Kepala Sub Bagian Umum chooses a folder/berkas to close
-> system shows final archive metadata form
-> user fills Nomor SPM, retention period, and other final archive metadata
-> folder/berkas becomes CLOSED/finalized
-> documents inside become archives
-> closed folder enters archive lifecycle
-> AKTIF -> INAKTIF -> USUL_MUSNAH -> DIMUSNAHKAN
```

Existing workflow document status rules remain the baseline until a later implementation phase changes them explicitly:

```text
Material:     DRAFT -> IN_PPK_VALIDATION -> IN_BENDAHARA_APPROVAL -> COMPLETED -> ARCHIVED
Non-material: DRAFT -> TERSIMPAN
```

The Phase 13 target reframes when archive metadata becomes final. A document can be ready for classification without already being a finalized archive.

## 5. Folder/Berkas Concept

Virtual grouping by classification alone is unlikely to be enough long-term because one `Jenis Pembayaran` may produce many folder batches over time. A single classification bucket cannot represent separate filing batches, closure dates, archive metadata, retention decisions, lifecycle movement, or destruction state cleanly.

Recommended conceptual direction:

- one `Jenis Pembayaran` can have multiple folder/berkas batches;
- each folder belongs to one `Jenis Pembayaran`;
- folders can be `OPEN` or `CLOSED`;
- `OPEN` folders can receive newly classified documents;
- `CLOSED` folders have final archive metadata;
- `CLOSED` folders enter archive lifecycle status such as `AKTIF`, `INAKTIF`, `USUL_MUSNAH`, and `DIMUSNAHKAN`;
- lifecycle movement should be evaluated at folder level.

Example:

```text
Belanja Barang - Batch 001 - CLOSED / AKTIF
Belanja Barang - Batch 002 - OPEN
```

This implies a later implementation phase will likely need a real folder/berkas entity rather than relying only on virtual grouping by classification fields.

## 6. Metadata Timing

Metadata timing changes by stage:

- `Jenis Pembayaran` is selected during initial document classification.
- `Nomor SPM`, retention period, and final archive metadata are filled only when closing/finalizing a folder.
- `Nomor SPM` is not required during initial document classification.
- The UI wording before closure should be `Jenis Pembayaran`.
- The UI wording after folder closure and archive finalization should be `Klasifikasi Arsip`.

This keeps initial classification lightweight while preserving final archive metadata quality at the point where a folder becomes a lifecycle-managed archive object.

## 7. Folder Closing Rules

Folder closing target behavior:

- only assigned `KEPALA_SUB_BAGIAN_UMUM` should close/finalize folders;
- `dms_session` remains the auth boundary;
- `dms_active_role` remains UX-only state and is not authorization proof;
- server/API RBAC must be authoritative;
- folder fullness is manually decided for now by `KEPALA_SUB_BAGIAN_UMUM`;
- total `nominal_realisasi` per folder may be displayed as decision support;
- no automatic fullness threshold should be introduced unless a formal business rule is approved;
- a closed folder cannot be selected again for closing;
- a closed folder cannot receive newly classified documents;
- UI should hide closed folders from `Jenis Pembayaran`/folder selection dropdowns for new classification;
- backend must still enforce the closed-folder rule even if a stale client submits a closed folder id.

Friendly error for stale or invalid selection:

```text
Berkas ini tidak dapat dipilih karena sudah ditutup.
```

The action concept for closing should be:

```text
PILIH BERKAS UNTUK DITUTUP
```

After selection, the user should see the final archive metadata form, including at minimum `Nomor SPM` and `Masa retensi arsip`.

## 8. Archive Pages Target Behavior

Archive status pages should become folder-first:

- `Pemberkasan Arsip Aktif`
- `Arsip Inaktif`
- `Usul Musnah`

Target behavior:

- list pages show folders/berkas first, filtered by folder archive lifecycle status;
- folder detail shows all documents/archives inside the selected folder;
- document/archive rows inside folder detail can have their own `Detail` action for metadata and attachments;
- lifecycle actions live in the folder detail page, not directly in the list row.

Lifecycle action placement:

- `AKTIF` folder detail: `Pindahkan ke Inaktif`;
- `INAKTIF` folder detail: `Pindahkan ke Usul Musnah`;
- `USUL_MUSNAH` folder detail: `Dimusnahkan`;
- `DIMUSNAHKAN`: no edit, preview/download/file access blocked.

The reason for detail-page lifecycle actions is that `KEPALA_SUB_BAGIAN_UMUM` should inspect folder details and the documents/archives inside before moving lifecycle state.

## 9. Metadata Edit Policy

Current preferred policy:

| Folder status | Archive metadata edit policy |
|---|---|
| `AKTIF` closed folder | Editable by authorized `KEPALA_SUB_BAGIAN_UMUM`. |
| `INAKTIF` | Not editable. |
| `USUL_MUSNAH` | Not editable. |
| `DIMUSNAHKAN` | Not editable; preview/download/file access blocked. |

If the client later requires human-error correction for `INAKTIF` or `USUL_MUSNAH`, that should become a separate future metadata correction flow with required reason and likely audit consideration. Phase 13A does not implement or require that flow.

## 10. Manual Document Addition

`Penambahan Arsip` should become `Penambahan Dokumen`.

Manual entry should no longer imply an immediate final archive. It should create a document that enters the same classification/folder flow as other eligible documents.

Requested fields:

- `Nama Dokumen`
- `Kategori`
- `Tanggal Dokumen/Sumber`
- `Jenis Pembayaran`
- `Nominal Realisasi`
- `Keterangan` (required)
- `Lampiran` (optional)

This may conflict with the old Manual Archive model, where manual entries were already archive-shaped records. Later implementation phases must decide whether to adapt existing tables, introduce a new manual document source model, or bridge both during transition.

## 11. Legacy Archive Dev Data Cleanup Decision

Human decision: Option A is preferred for old archive data.

Option A means a controlled legacy archive development data cleanup/reset is planned so the local development database does not become confusing during the new folder-first model.

Phase 13A does not perform cleanup.

Future cleanup/reset phase must use this sequence:

```text
analyze -> show safe counts only -> explicit confirmation -> cleanup -> analyze again
```

Future cleanup must not blindly delete:

- users;
- roles;
- auth/session data;
- master data;
- fungsi;
- kegiatan;
- `ketua_tim_assignments`;
- workflow documents needed for testing;
- `.env` or `.env.migration`;
- package files;
- `src/routeTree.gen.ts`;
- physical files/storage unless separately and explicitly approved.

Cleanup output must avoid secrets, storage roots, physical paths, logical paths, SQL params, raw rows, tokens, cookies, session values, env values, DB URLs, password hashes, and other sensitive values.

## 12. Standalone Laporan Klasifikasi Arsip

`Laporan Klasifikasi Arsip` is no longer the primary standalone target.

Its useful behavior should be absorbed into folder-first archive status pages:

- `Pemberkasan Arsip Aktif`
- `Arsip Inaktif`
- `Usul Musnah`

Those pages should look and behave like folder/classification reports filtered by archive status. Do not immediately delete existing report routes. A later implementation phase should decide the compatibility, navigation, removal, or redirect approach after the folder-first pages exist.

## 13. Naming/Title Rule

New documents should follow these display/title rules:

- workflow/kegiatan documents: `leafnode-kegiatan-tahun-nama user`;
- manually added documents: `nama dokumen-kategori-tahun-nama user`.

Existing old documents should not be backfilled unless a future explicit phase approves it. Display fallback is allowed where old data lacks kegiatan/manual fields.

This naming alignment is a forward-looking rule for new records and UI display, not a Phase 13A data mutation.

## 14. Reports Target Behavior

`Laporan Kinerja` target behavior:

```text
Fungsi -> Kegiatan -> daftar dokumen -> Detail
```

The page should become folder-first or hierarchy-first by `Fungsi` and `Kegiatan`, then show documents with `Detail` actions, similar to role pages and existing `Laporan Saya` / `Laporan Kegiatan` behavior.

`Laporan Kegiatan` target behavior for Ketua Tim:

```text
kegiatan where current user is ketua tim -> daftar dokumen -> Detail
```

Rules:

- show folders/cards/rows of `kegiatan` where the current user is ketua tim;
- detail shows documents in that kegiatan;
- filtering must be server-authoritative, not only client-side;
- `ketua_tim_assignments` semantics must be preserved: one kegiatan has one ketua tim, and one user can be ketua tim for many kegiatan.

## 15. Proposed Practical Phase 13 Roadmap

Recommended roadmap:

- 13A - Domain Model & Scope Lock for Document Classification to Archive Filing
- 13B-dev - Controlled Legacy Archive Dev Data Reset
- 13C - PPSPM Display Rename
- 13D - Pengklasifikasian Dokumen Terminology & Flow
- 13E - Penambahan Dokumen Manual Flow
- 13F - Folder/Berkas Arsip Data Model Foundation
- 13G - Tutup Berkas / Close Folder Flow
- 13H - Folder-First Pemberkasan Arsip Aktif
- 13I - Folder-First Arsip Inaktif & Usul Musnah
- 13J - De-emphasize / Remove Standalone Laporan Klasifikasi Arsip
- 13K - Document & Archive Title Naming Alignment
- 13L - Laporan Kinerja Folder-First
- 13M - Laporan Kegiatan Ketua Tim Folder-First

The roadmap is intentionally staged. Data cleanup, display rename, terminology changes, folder model foundation, close-folder flow, status pages, reports, and title alignment should not be bundled into one large runtime change.

## 16. Explicit Non-Goals For Phase 13A

Phase 13A does not:

- change runtime behavior;
- change schema, Drizzle models, migrations, seeds, or database rows;
- run cleanup or reset data;
- rename the internal `BENDAHARA` role enum;
- delete routes;
- generate routes;
- change package files or lockfiles;
- delete physical files/storage;
- reintroduce Supabase fallback;
- run broad tests, build, E2E, dev server, migrations, seeds, cleanup scripts, or database scripts;
- approve production readiness, public deployment, go-live, operational certification, security certification, or compliance validation.

## 17. Implementation Risks

Known risks for later phases:

- internal `BENDAHARA` to `PPSPM` rename is high-risk if enum values, database values, routes, RBAC checks, tests, or historical records are changed instead of starting with display labels;
- folder-first archive behavior likely needs a real folder/berkas entity;
- virtual grouping by classification may not support multiple folder batches, closure metadata, independent lifecycle status, or destruction state;
- closed folder assignment needs server-side enforcement, not just UI hiding;
- archive lifecycle movement at folder level must be designed carefully so file access, metadata visibility, audit expectations, and linked document rows remain coherent;
- old Phase 12 archive data may confuse the new model, hence the planned controlled development cleanup/reset phase;
- standalone classification report removal must preserve useful reporting behavior inside folder-first status pages;
- manual document addition may conflict with the old Manual Archive model and should be handled as a scoped migration/design decision.

## 18. Validation For This Phase

Required validation for Phase 13A:

```bash
git status --short --branch
git diff --check
git diff --name-only
```

Do not run dev server, route generation, broad tests, build, E2E, DB migrations, seed scripts, cleanup scripts, or package manager operations for this phase.
