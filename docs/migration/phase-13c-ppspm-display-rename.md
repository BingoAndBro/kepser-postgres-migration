# Phase 13C - PPSPM Display Rename

Date: 2026-05-29

Status: runtime-visible display-label alignment only.

## Scope

Phase 13C updates user-facing text for the role currently backed by internal role enum/value `BENDAHARA`.

Display terminology:

- short label: `PPSPM`
- full label: `PPSPM (Pejabat Penandatangan Surat Perintah Membayar)`
- helper wording: `Pejabat Penandatangan Surat Perintah Membayar`

## Compatibility Boundary

Internal compatibility is unchanged:

- role enum/value remains `BENDAHARA`;
- DB role values remain unchanged;
- RBAC checks remain `BENDAHARA`;
- route paths and API paths under `/bendahara` remain unchanged;
- file and folder names remain unchanged;
- workflow status names such as `IN_BENDAHARA_APPROVAL` remain unchanged.

This phase does not rename internal contracts to PPSPM.

## Non-Goals

This phase does not change schema, migrations, seed data, package files, route generation, auth/session behavior, RBAC behavior, API contracts, storage behavior, cleanup behavior, or Supabase runtime behavior.

Active runtime/package Supabase dependency remains retired. Historical Supabase artifacts remain as traceability or cleanup backlog.
