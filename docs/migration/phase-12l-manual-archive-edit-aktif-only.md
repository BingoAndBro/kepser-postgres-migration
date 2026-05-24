# Phase 12L.1 - Manual Archive Edit/PATCH API AKTIF-only

Date: 2026-05-24

Status: implemented pending human retest.

Scope: API-only parent metadata edit for Manual Archive. This phase does not implement UI edit behavior, attachment add/edit/delete, lifecycle transitions, retention fields, aggregate reports, Excel export, schema changes, migrations, preview/download changes, upload changes, pending-to-formal storage movement, or Supabase runtime behavior.

## Boundary

Manual Archive parent metadata can be edited only through:

- `PATCH /api/arsiparis/manual-arsip/$id`

The route namespace keeps `/arsiparis` compatibility for the internal `KEPALA_SUB_BAGIAN_UMUM` operational role.

This phase remains within the post-migration partial/bounded release handoff posture for human-controlled internal/local/LAN use. It does not approve public production use, public internet exposure, go-live, operational certification, security certification, or a full Supabase repository cleanup.

## Security And RBAC

The PATCH route requires local `dms_session` resolution and server-side assigned-role authorization.

Allowed:

- assigned `KEPALA_SUB_BAGIAN_UMUM`

Rejected:

- unauthenticated requests with `401`;
- `ADMIN`-only requests with `403`;
- non-Kasubag requests with `403`.

The route does not authorize from `dms_active_role`. Unsafe `PATCH` uses the centralized same-origin guard.

## AKTIF-only Edit Rule

The server loads the current manual archive before validating the metadata update payload.

Allowed lifecycle state:

- `AKTIF`

Locked lifecycle states:

- `INAKTIF`
- `USUL_MUSNAH`
- `DIMUSNAHKAN`

Locked records reject metadata edit with `409` and the safe message:

```text
Arsip manual hanya dapat diedit saat status AKTIF
```

This phase does not add lifecycle transition behavior and does not change preview/download behavior.

## Editable Fields

PATCH is treated as a full parent metadata update for the allowed fields. Required fields must be present; omitted required fields are rejected instead of silently preserving old values.

Editable fields:

- `nama`, required non-empty string;
- `tanggal`, required valid `YYYY-MM-DD` date-only string;
- `keterangan`, required non-empty string;
- `category_id`, required active Manual Archive category UUID;
- `klasifikasi_id`, optional nullable active archive classification UUID;
- `nominal_realisasi`, required positive integer greater than 0;
- `metadata`, optional safe JSON object.

The database column `manual_arsip.nominal_realisasi` may remain nullable for compatibility, but Manual Archive create and edit API boundaries require a positive integer value greater than 0.

Formatted Rupiah strings, decimal values, zero, negative values, `null`, empty, and missing `nominal_realisasi` are rejected at the API boundary.

`metadata` is supplemental only. It must not override explicit fields and must not contain file-access/path/token-like fields.

## Update Behavior

The PATCH route updates parent metadata only.

It updates:

- parent metadata columns listed above;
- `klasifikasi_nama_snapshot` from the active classification name when `klasifikasi_id` is provided;
- `updated_at` according to the existing repository convention.

It does not update:

- `status_arsip`;
- `created_by`;
- `created_at`;
- attachment rows;
- `logical_path`;
- preview/download data;
- lifecycle actor/date fields;
- retention fields.

Responses are safe parent metadata responses and must not expose logical paths, physical filesystem paths, storage roots, file URLs, signed token internals, file contents, SQL details, environment values, or secrets.

## Future Work

Future phases should separately scope:

- UI edit modal/page;
- attachment add/edit/delete;
- lifecycle transitions;
- retention fields;
- aggregate/report behavior;
- Excel export.
