# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spec-06-user-management.spec.ts >> TC-01: Admin can view user list with roles and status
- Location: tests\e2e\spec-06-user-management.spec.ts:103:1

# Error details

```
Error: Login failed: Invalid credentials for multi@testbps.local
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img "BPS Logo" [ref=e11]
        - paragraph [ref=e12]: BPS Kabupaten Kepulauan Seribu
        - heading "Masuk ke Sistem" [level=1] [ref=e13]
        - paragraph [ref=e14]: Gunakan akun BPS Anda untuk mengakses DMS
      - generic [ref=e15]:
        - generic [ref=e16]: Email atau password salah
        - generic [ref=e17]:
          - text: Email
          - textbox "nama@bps.go.id" [ref=e18]: multi@testbps.local
        - generic [ref=e19]:
          - text: Password
          - textbox "Masukkan password" [ref=e20]: Test BPS123
        - button "Masuk" [ref=e21]
      - paragraph [ref=e22]: Hubungi Administrator jika belum memiliki akun
    - paragraph [ref=e23]: © 2026 BPS Kabupaten Kepulauan Seribu
  - button "Open TanStack Devtools" [ref=e24] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e25]
```

# Test source

```ts
  1   | // @ts-nocheck
  2   | import { test, expect, Page } from '@playwright/test'
  3   | 
  4   | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  5   | 
  6   | // Note: admin@testbps.local login fails - using multi@testbps.local which has multiple roles including ADMIN-like access
  7   | // For full admin tests, need to create admin user via Supabase Dashboard
  8   | const ADMIN_EMAIL = 'multi@testbps.local'
  9   | const ADMIN_PASSWORD = 'Test BPS123'
  10  | const PEGAWAI_EMAIL = 'pegawai@testbps.local'
  11  | const PEGAWAI_PASSWORD = 'Test BPS123'
  12  | 
  13  | // Helper: login function with better error handling and retries
  14  | async function login(page: Page, email: string, password: string, retries = 2) {
  15  |   for (let attempt = 0; attempt <= retries; attempt++) {
  16  |     // Clear cookies first
  17  |     await page.context().clearCookies()
  18  | 
  19  |     await page.goto(`${BASE_URL}/login`)
  20  |     await page.waitForLoadState('domcontentloaded')
  21  | 
  22  |     // Wait for form to be fully loaded with timeout
  23  |     try {
  24  |       await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 })
  25  |     } catch {
  26  |       // Page might be in loading state, wait more
  27  |       await page.waitForTimeout(2000)
  28  |     }
  29  | 
  30  |     await page.waitForTimeout(500)
  31  | 
  32  |     // Wait for any loading spinner to disappear
  33  |     const spinner = page.locator('[class*="animate-spin"]')
  34  |     if (await spinner.isVisible({ timeout: 3000 }).catch(() => false)) {
  35  |       await page.waitForTimeout(1000)
  36  |     }
  37  | 
  38  |     // Fill login form
  39  |     const emailInput = page.locator('input[type="email"]')
  40  |     const passwordInput = page.locator('input[type="password"]')
  41  |     const submitBtn = page.locator('button[type="submit"]')
  42  | 
  43  |     // Clear any existing values
  44  |     await emailInput.clear()
  45  |     await passwordInput.clear()
  46  | 
  47  |     await emailInput.fill(email)
  48  |     await passwordInput.fill(password)
  49  | 
  50  |     // Click submit
  51  |     await submitBtn.click()
  52  | 
  53  |     // Wait for navigation with longer timeout
  54  |     try {
  55  |       await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 })
  56  |       return // Success!
  57  |     } catch {
  58  |       // Check if we're still on login page
  59  |       const currentUrl = page.url()
  60  |       if (currentUrl.includes('/login')) {
  61  |         // Check for specific error message
  62  |         const errorMsg = page.getByText(/email atau password salah/i)
  63  |         if (await errorMsg.isVisible({ timeout: 1000 }).catch(() => false)) {
  64  |           if (attempt < retries) {
  65  |             // Retry after a short wait
  66  |             await page.waitForTimeout(2000)
  67  |             continue
  68  |           }
  69  |           // If all retries failed, throw error
> 70  |           throw new Error(`Login failed: Invalid credentials for ${email}`)
      |                 ^ Error: Login failed: Invalid credentials for multi@testbps.local
  71  |         }
  72  |         // Could be slow loading, check if we actually navigated
  73  |         await page.waitForTimeout(2000)
  74  |         const newUrl = page.url()
  75  |         if (!newUrl.includes('/login')) {
  76  |           return // We actually navigated!
  77  |         }
  78  |       }
  79  |     }
  80  |   }
  81  | }
  82  | 
  83  | // Helper: random email for testing
  84  | function randomEmail() {
  85  |   return `test${Date.now()}@bps.go.id`
  86  | }
  87  | 
  88  | // Helper: wait for dialog to be visible
  89  | async function waitForDialog(page: Page) {
  90  |   await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
  91  | }
  92  | 
  93  | // Helper: wait for toast/alert
  94  | async function waitForAlert(page: Page, timeout = 3000) {
  95  |   await page.waitForTimeout(500)
  96  |   return page.locator('[role="alert"], .bg-destructive, .bg-green').first()
  97  | }
  98  | 
  99  | // ============================================================================
  100 | // TC-01: Admin — Lihat Daftar User
  101 | // ============================================================================
  102 | 
  103 | test('TC-01: Admin can view user list with roles and status', async ({ page }) => {
  104 |   await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  105 |   await page.goto(`${BASE_URL}/admin/master-data/user`)
  106 |   await page.waitForLoadState('domcontentloaded')
  107 |   await page.waitForTimeout(2000)
  108 | 
  109 |   // Verify table exists
  110 |   const table = page.locator('table')
  111 |   await expect(table).toBeVisible()
  112 | 
  113 |   // Verify column headers using getByRole for strict mode
  114 |   await expect(page.getByRole('columnheader', { name: 'No' })).toBeVisible()
  115 |   await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  116 |   await expect(page.getByRole('columnheader', { name: 'Hak Akses' })).toBeVisible()
  117 |   await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  118 | 
  119 |   // Verify at least one user is shown
  120 |   const userRows = page.locator('tbody tr')
  121 |   const rowCount = await userRows.count()
  122 |   expect(rowCount).toBeGreaterThan(0)
  123 | 
  124 |   // Verify status indicators exist
  125 |   const statusCell = page.locator('tbody tr:first-child td:nth-child(4)')
  126 |   await expect(statusCell).toBeVisible()
  127 | })
  128 | 
  129 | // ============================================================================
  130 | // TC-02: Admin — Filter User
  131 | // ============================================================================
  132 | 
  133 | test('TC-02: Filter status works correctly', async ({ page }) => {
  134 |   await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  135 |   await page.goto(`${BASE_URL}/admin/master-data/user`)
  136 |   await page.waitForLoadState('domcontentloaded')
  137 |   await page.waitForTimeout(2000)
  138 | 
  139 |   // Find filter dropdown
  140 |   const filterSelect = page.locator('select').first()
  141 |   await expect(filterSelect).toBeVisible()
  142 | 
  143 |   // Test "Semua Status" (default)
  144 |   await expect(filterSelect).toHaveValue('all')
  145 | 
  146 |   // Test "Aktif" filter
  147 |   await filterSelect.selectOption('aktif')
  148 |   await page.waitForTimeout(500)
  149 | 
  150 |   // Reset to all
  151 |   await filterSelect.selectOption('all')
  152 |   await page.waitForTimeout(500)
  153 | 
  154 |   // Test search
  155 |   const searchInput = page.locator('input[placeholder*="Cari"]')
  156 |   if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  157 |     await searchInput.fill('admin')
  158 |     await page.waitForTimeout(300)
  159 |   }
  160 | 
  161 |   // Clear search
  162 |   await searchInput.clear()
  163 | })
  164 | 
  165 | // ============================================================================
  166 | // TC-03: Admin — Tambah User Baru
  167 | // ============================================================================
  168 | 
  169 | test('TC-03: Admin can create new user', async ({ page }) => {
  170 |   await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
```