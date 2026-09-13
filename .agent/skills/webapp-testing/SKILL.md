
---
name: webapp-testing
description: Executes unit, integration, and Playwright E2E tests for the TanStack Start webapp. Use when validating Supabase database logic with RLS, Drizzle ORM queries, authentication, or frontend SSR components to enforce Test—Driven Development (TDD).
---

# Webapp Testing (DMS Project)

## Goal
To enforce strict Test-Driven Development (TDD) and ensure the DMS (Document Management System) behaves correctly under integration, adhering to Supabase RLS security, Drizzle ORM query invariants, and TanStack Start SSR behavior.

## Core Testing Philosophy
1.  **Test-Driven Development (TDD) is Mandatory**: You MUST write tests *first* for any new feature or logic change. Do not implement the logic until you have a failing test (`pnpm test` must fail).
2.  **External Verification**: Do not rely on your own context window to judge correctness. Rely solely on the output of failing/passing tests as your external oracle.
3.  **Behavioral Coverage over Line Coverage**: Always test boundary conditions (e.g., null values, empty strings, missing tokens, large inputs).
4.  **Enforce FSM Strictness**: Tests MUST explicitly verify that documents cannot jump statuses illegally (e.g., DRAFT to COMPLETED), respecting the strict FSM transitions defined in `db-fsm-guard`.

## TDD Workflow
1.  **Write Failing Tests**: Write tests (Vitest for Unit/Integration, Playwright for E2E) corresponding to the feature or bug.
2.  **Commit Checkpoint**: Make a commit or save the tests as a checkpoint.
3.  **Implement Logic**: Write the Supabase RLS policy, Drizzle query, or TanStack Start route handler.
4.  **Run Tests**: Run `pnpm test` (or `npx playwright test` for E2E).
5.  **Iterate**: If tests fail, fixing the code is your only priority. Do not rewrite the tests to force a pass unless the test logic itself was flawed.

## Instructions by Layer

### 1. Drizzle ORM & Database
-   **No Raw SQL**: Do not mock raw SQL. Use Drizzle's typed query builder.
-   **Rollback Transactions**: Wrap database operations in transactions that rollback at the end of the test to keep the test database clean.
-   **Reference Example**: See `examples/drizzle_mock.ts`.

### 2. Supabase & Row Level Security (RLS)
-   **Simulate Roles**: The DMS relies heavily on RLS (Roles: PEGAWAI, PPK, PPSPM, ARSIPARIS, ADMIN). Integration tests must simulate requests from different authenticated user roles.
-   **Negative Testing**: Always include tests that attempt to bypass RLS (e.g., PEGAWAI trying to approve a document meant for PPSPM) to ensure the query returns empty or errors out.
-   **Reference Example**: See `examples/supabase_rls_test.ts`.

### 3. TanStack Start (SSR & Frontend)
-   **Hydration Mismatches & Concurrency**: Ensure that data fetched on the server matches what the client expects.
-   **State Management**: Be careful of stale closures inside hooks or loader functions.
-   **UI Interactions**: Test component rendering and interaction states (loading states, errors from Zod validation).

### 4. E2E Testing (Playwright)
-   **Visual & Flow Verification**: Use Playwright for full lifecycle tests. E.g., Login -> Submit Form as PEGAWAI -> Login as PPK -> Validate.
-   **Check Screenshots**: If visual regressions are suspected, rely on Playwright screenshot comparisons.
-   **Reference Example**: See `examples/playwright_e2e.spec.ts`.

## Available Scripts
-   `pnpm test` : Runs the Vitest test suite.
-   `pnpm test:ui` : Runs Vitest in UI watch mode.
-   `pnpm dlx playwright test` : Runs E2E Playwright tests.

## Markdown Test Verification Protocol
If the user provides a `TEST_VERIFICATION.md` or similar markdown checklist and asks you to execute it:
1.  **Analyze**: Read the test cases (TC-xx) to understand the requirements.
2.  **Translate to Automation**: Convert those test cases into automated tests (Playwright for UI, Vitest for backend/logic) wherever possible.
3.  **Execute & Diagnose**: Run the tests. If they fail, capture the exact output, pinpoint the cause (e.g., "500 Server Error due to missing Supabase RLS policy"), and explain it clearly.
4.  **Reporting**: Edit the `TEST_VERIFICATION.md` directly. Change `⬜` to `✅` (Pass) or `❌` (Fail). Fill out the "Bug yang Ditemukan" and "Manual Verification Checklist" tables thoroughly.

## Constraints
-   Do not test implementation details (e.g., testing that a specific internal helper function is called exactly once). Test the *output* or *state mutation*.
-   Do not use actual production external API keys or DB instances. Use local Supabase instance (`supabase start` / localhost).
-   Always use `pnpm` to install missing testing dependencies (`pnpm add -D vitest @vitest/ui playwright`).
