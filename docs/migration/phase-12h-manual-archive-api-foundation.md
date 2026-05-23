# Phase 12H - Manual Archive API Foundation

Date: 2026-05-22

Status: implemented pending human retest.

Scope: minimal server/API foundation for Penambahan Arsip manual archive records. This phase does not implement UI pages, file upload, preview/download, signed file tokens, lifecycle transition routes, aggregate reports, Excel export, seed data, schema changes, or migrations.

## Boundary

Manual archive runtime behavior remains separate from workflow documents:

- no writes to `dokumen.dokumen_transaksi`;
- no writes to workflow-coupled `arsip.arsip`;
- no writes to `dokumen.log_aktivitas`;
- no file move/copy/delete behavior;
- no Supabase Storage fallback or old file/data recovery.

This phase remains within the post-migration partial/bounded release handoff posture for human-controlled internal/local/LAN use. It does not approve public production use, public internet exposure, go-live, operational certification, security certification, or a full Supabase repository cleanup.

## API Routes

The route namespace uses the existing `/arsiparis` compatibility namespace for the internal `KEPALA_SUB_BAGIAN_UMUM` role:

- `GET /api/arsiparis/manual-arsip/categories`
- `GET /api/arsiparis/manual-arsip`
- `POST /api/arsiparis/manual-arsip`
- `GET /api/arsiparis/manual-arsip/$id`

`PATCH` is intentionally skipped in this phase to keep the foundation narrow. Metadata update behavior can be added in a later phase after UI and lifecycle expectations are clearer.

## Security And RBAC

All routes require local `dms_session` resolution. Authorization is server-side and checks assigned roles, not only `dms_active_role`.

Manual archive operational APIs require assigned `KEPALA_SUB_BAGIAN_UMUM`. `ADMIN` is a dedicated system/admin role and is not automatically allowed to access Penambahan Arsip operational APIs. Future admin audit visibility should be designed as separate metadata-only audit endpoints.

Unsafe `POST` uses the centralized same-origin guard.

## Validation

Create request fields:

- `nama`, required non-empty string;
- `tanggal`, required valid `YYYY-MM-DD` date;
- `keterangan`, required non-empty string;
- `category_id`, required active manual archive category UUID;
- `klasifikasi_id`, optional active classification UUID;
- `nominal_realisasi`, optional/nullable non-negative number;
- `metadata`, optional safe JSON object.

`metadata` is supplemental only. It is rejected when it contains explicit core fields or file-access/path fields such as logical paths, physical paths, storage roots, file URLs, signed URLs, or token-like fields.

Create defaults:

- `status_arsip='AKTIF'`;
- `created_by` comes from the server session user id;
- `klasifikasi_nama_snapshot` is filled from active `master_klasifikasi_arsip.nama` when `klasifikasi_id` is provided.

## Response Shape

Responses are metadata-only:

- category list returns `id`, `nama`, and `deskripsi`;
- manual archive list/detail return parent row metadata, category name, and optional classification snapshot/name;
- detail may include safe attachment metadata if attachment rows exist.

Responses do not return:

- `logical_path`;
- physical filesystem paths;
- storage roots;
- preview/download URLs;
- signed token internals;
- file contents;
- SQL or secrets.

The list endpoint uses a conservative default limit of 100 and caps request `limit` at 100.

## Future Work

Future phases should separately scope:

- UI for Penambahan Arsip;
- optional attachment upload;
- preview/download/file-token behavior with lifecycle revalidation;
- lifecycle transitions;
- aggregate/report behavior;
- Excel export;
- optional narrow PATCH behavior.
