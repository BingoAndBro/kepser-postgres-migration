# D6K.2 Hybrid Native Miro Use Case Prototype Result

## 1. Purpose

Phase D6K.2 created a hybrid native Miro skeleton for the overall DMS use case diagram.

The prototype applies the D6K.1 connector capability result: MCP creates editable native layout and shape primitives, while the user manually finishes classic UML connector lines in Miro.

## 2. Board Scope

- Target board URL: `https://miro.com/app/board/uXjVHLL4Jsw=/`
- One frame only: `D6K.2 Hybrid Prototype - Use Case Utama`
- One diagram skeleton only
- No other Miro content was intentionally modified

## 3. Diagram Skeleton Created

- Frame name: `D6K.2 Hybrid Prototype - Use Case Utama`
- Diagram title: `Use Case Utama - Dynamic Document Workflow Management System`
- System boundary label: `Dynamic Document Workflow Management System`

Actors used:

- Pegawai
- PPK
- PPSPM
- Kepala Sub Bagian Umum
- Penanggung Jawab Kinerja
- Admin Sistem

Use cases used:

- Login / Logout
- Ganti Peran
- Kelola Dokumen
- Validasi Dokumen
- Setujui Dokumen
- Kelola Berkas Arsip
- Kelola Dokumen Manual
- Kelola Laporan Kinerja
- Kelola User dan Master Data

Notes created:

- Source note: `Source: docs/diagrams/use-cases/dms-overall-use-case.puml`
- Prototype note: `Hybrid prototype. MCP created layout and shapes; user manually finishes connector lines.`
- DMS terminology note covering PPSPM, Admin Sistem, and folder-first archive authority

Manual guide created:

- `Manual Connector Guide`
- `Include / Extend Guidance`

## 4. Manual Connector Guide

The user must draw these solid association connectors manually:

- Pegawai -> Login / Logout
- Pegawai -> Ganti Peran
- Pegawai -> Kelola Dokumen
- PPK -> Login / Logout
- PPK -> Ganti Peran
- PPK -> Validasi Dokumen
- PPSPM -> Login / Logout
- PPSPM -> Ganti Peran
- PPSPM -> Setujui Dokumen
- Kepala Sub Bagian Umum -> Login / Logout
- Kepala Sub Bagian Umum -> Ganti Peran
- Kepala Sub Bagian Umum -> Kelola Berkas Arsip
- Kepala Sub Bagian Umum -> Kelola Dokumen Manual
- Penanggung Jawab Kinerja -> Login / Logout
- Penanggung Jawab Kinerja -> Ganti Peran
- Penanggung Jawab Kinerja -> Kelola Laporan Kinerja
- Admin Sistem -> Login / Logout
- Admin Sistem -> Kelola User dan Master Data

## 5. Include/Extend Guidance

- No include/extend relations were drawn by MCP.
- The main use case diagram should stay high-level and clean.
- Use `<<include>>` only for mandatory reusable behavior.
- Use `<<extend>>` only for optional or conditional behavior.
- Module-level use case diagrams are better places for detailed include/extend relations.
- If manually added later, use dashed arrows labeled `<<include>>` or `<<extend>>`.
- Do not connect every use case to Login with `<<include>>`.

## 6. Visual/Tool Notes

- Native Miro layout primitives were used for the frame, title, actor boxes, system boundary, use case ovals, and guide notes.
- MCP did not draw final association connectors.
- Manual polishing is required for classic UML association lines.
- The skeleton is intended to match the user's preferred simple/classic use case style as much as MCP currently allows.
- Actor labels are outside the system boundary.
- Use case ovals are inside the system boundary and arranged in two neat columns, with the admin use case centered below the two columns.

## 7. Safety Confirmation

- No real bulk generation was performed.
- No unrelated board items were intentionally modified or deleted.
- No repo runtime files were changed.
- No secrets, tokens, API keys, env values, DB URLs, cookies, sessions, password hashes, storage paths, physical paths, logical paths, credentials, or secrets were printed.
- No `.puml` files were changed.

## 8. Recommended Next Step

- Perform human visual review of the D6K.2 frame.
- Manually add connector lines according to the guide inside the frame.
- After manual polish, either accept the prototype or run a small D6K.3 polish/support phase.
- Do not proceed to D6L until the D6K.2 prototype is visually accepted.
