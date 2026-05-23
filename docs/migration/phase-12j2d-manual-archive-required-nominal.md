# Phase 12J.2d - Manual Archive Required Nominal Realisasi

Date: 2026-05-23

Status: implemented pending human retest.

Scope: Manual Archive creation validation only. This phase does not add preview/download, signed file tokens, attachment delete, lifecycle actions, PATCH/edit behavior, aggregate reports, Excel export, schema changes, migrations, or Supabase runtime behavior.

## Boundary

Manual Archive still uses the separate `arsip.manual_arsip` parent model and optional `arsip.manual_arsip_attachment` child rows. Existing attachment upload behavior remains unchanged: create the parent first, then upload attachments only after the parent create succeeds.

The `manual_arsip.nominal_realisasi` database column may remain nullable for compatibility. The business rule changed at the API/UI boundary: Manual Archive creation now requires a positive integer `nominal_realisasi` greater than 0.

## Validation

Create API rejects:

- missing `nominal_realisasi`;
- `null` `nominal_realisasi`;
- empty `nominal_realisasi`;
- formatted Rupiah strings such as `Rp 1.500.000` or `1.500.000`;
- decimal or fractional numbers;
- zero or negative numbers.

UI validation is a UX aid only. The API remains authoritative.

The UI continues to format nominal input in Rupiah-style `id-ID` grouping without decimals and submits the raw numeric value to the create API.

## Security And Scope

Existing Manual Archive API RBAC remains unchanged:

- assigned `KEPALA_SUB_BAGIAN_UMUM` is allowed;
- unauthenticated requests return `401`;
- non-Kasubag and `ADMIN`-only access remain forbidden.

Responses and validation errors must remain safe and must not expose logical paths, physical paths, storage roots, signed URL/token internals, SQL, environment values, or secrets.
