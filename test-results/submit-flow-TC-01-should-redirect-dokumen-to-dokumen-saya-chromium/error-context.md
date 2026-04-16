# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submit-flow.spec.ts >> TC-01: should redirect /dokumen to /dokumen/saya
- Location: tests\e2e\submit-flow.spec.ts:60:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - complementary [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - img "BPS" [ref=e11]
          - heading "DMS Architect" [level=2] [ref=e12]
        - paragraph [ref=e13]: PEGAWAI Workspace
      - generic [ref=e14]:
        - generic [ref=e15]:
          - heading "GENERAL" [level=3] [ref=e16]
          - navigation [ref=e17]:
            - link "Dashboard" [ref=e18] [cursor=pointer]:
              - /url: /
              - generic [ref=e19]:
                - img [ref=e21]
                - generic [ref=e26]: Dashboard
        - generic [ref=e27]:
          - heading "MANAGEMENT" [level=3] [ref=e28]
          - navigation [ref=e29]:
            - link "Ajukan Dokumen" [ref=e30] [cursor=pointer]:
              - /url: /dokumen/aju
              - generic [ref=e31]:
                - img [ref=e33]
                - generic [ref=e36]: Ajukan Dokumen
            - link "Dokumen Diajukan" [ref=e37] [cursor=pointer]:
              - /url: /dokumen/saya
              - generic [ref=e38]:
                - img [ref=e40]
                - generic [ref=e43]: Dokumen Diajukan
            - link "Revisi Dokumen" [ref=e44] [cursor=pointer]:
              - /url: /dokumen/saya?status=NEED_REVISION
              - generic [ref=e45]:
                - img [ref=e47]
                - generic [ref=e51]: Revisi Dokumen
            - link "Dokumen Selesai" [ref=e52] [cursor=pointer]:
              - /url: /dokumen/saya?status=COMPLETED
              - generic [ref=e53]:
                - img [ref=e55]
                - generic [ref=e58]: Dokumen Selesai
        - generic [ref=e59]:
          - heading "ARSIP" [level=3] [ref=e60]
          - navigation [ref=e61]:
            - link "Cari Arsip" [ref=e62] [cursor=pointer]:
              - /url: /arsip
              - generic [ref=e63]:
                - img [ref=e65]
                - generic [ref=e68]: Cari Arsip
        - generic [ref=e69]:
          - heading "SYSTEM" [level=3] [ref=e70]
          - navigation [ref=e71]:
            - generic "Fitur belum tersedia" [ref=e72]:
              - generic [ref=e73]:
                - img [ref=e75]
                - generic [ref=e79]: Activity Log
              - generic [ref=e80]: Soon
            - generic "Fitur belum tersedia" [ref=e81]:
              - generic [ref=e82]:
                - img [ref=e84]
                - generic [ref=e87]: Settings
              - generic [ref=e88]: Soon
      - generic [ref=e89]:
        - button "Support Center" [ref=e90]:
          - img [ref=e91]
          - text: Support Center
        - button "Sign Out" [ref=e94]:
          - img [ref=e95]
          - text: Sign Out
    - generic [ref=e98]:
      - banner [ref=e99]:
        - generic [ref=e100]:
          - heading "Pegawai" [level=2] [ref=e102]
          - generic [ref=e103]:
            - generic:
              - img
            - textbox "Search documents, archives, or tasks..." [ref=e104]
        - generic [ref=e105]:
          - generic [ref=e106]:
            - button [ref=e107]:
              - img [ref=e108]
            - button [ref=e112]:
              - img [ref=e113]
          - generic [ref=e116]:
            - generic [ref=e117]:
              - paragraph [ref=e118]: pegawai
              - paragraph [ref=e119]: Pegawai
            - generic [ref=e122]: PE
      - main [ref=e123]:
        - generic [ref=e125]:
          - generic [ref=e126]: © 2026 BPS Kabupaten Kepulauan Seribu
          - generic [ref=e127]:
            - button "Support" [ref=e128]
            - button "Kebijakan" [ref=e129]
  - button "Open TanStack Devtools" [ref=e130] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e131]
```

# Test source

```ts
  1   | // @ts-nocheck
  2   | import { test, expect, Page } from '@playwright/test'
  3   | 
  4   | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  5   | const TEST_EMAIL = 'pegawai@testbps.local'
  6   | const TEST_PASSWORD = 'Test BPS123'
  7   | 
  8   | async function login(page: Page) {
  9   |   await page.goto(`${BASE_URL}/login`)
  10  |   await page.waitForLoadState('domcontentloaded')
  11  |   await page.waitForTimeout(1000)
  12  |   await page.locator('input[type="email"]').fill(TEST_EMAIL)
  13  |   await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  14  |   await page.locator('button[type="submit"]').click()
  15  |   await page.waitForURL(url => !url.href.includes('/login'), { timeout: 30000 })
  16  | }
  17  | 
  18  | // Helper: advance to step N in Ajukan Dokumen form (after login + navigate to /dokumen/aju)
  19  | async function advanceToStep(page: Page, targetStep: number) {
  20  |   for (let step = 1; step < targetStep; step++) {
  21  |     // Step 1: Select fungsi dropdown (Radix Select = [role="combobox"])
  22  |     if (step === 1) {
  23  |       const fungsiBox = page.locator('[role="combobox"]').first()
  24  |       if (await fungsiBox.isVisible().catch(() => false)) {
  25  |         await fungsiBox.click()
  26  |         await page.waitForTimeout(300)
  27  |         const option = page.locator('[role="option"]').first()
  28  |         if (await option.isVisible().catch(() => false)) {
  29  |           await option.click()
  30  |           await page.waitForTimeout(500)
  31  |         }
  32  |       }
  33  |     }
  34  |     // Step 2: Select kegiatan dropdown
  35  |     if (step === 2) {
  36  |       const kegBox = page.locator('[role="combobox"]').last()
  37  |       if (await kegBox.isVisible().catch(() => false)) {
  38  |         await kegBox.click()
  39  |         await page.waitForTimeout(300)
  40  |         const option = page.locator('[role="option"]').first()
  41  |         if (await option.isVisible().catch(() => false)) {
  42  |           await option.click()
  43  |           await page.waitForTimeout(500)
  44  |         }
  45  |       }
  46  |     }
  47  |     // Click Lanjut
  48  |     const lanjutBtn = page.locator('button', { hasText: 'Lanjut' }).first()
  49  |     if (await lanjutBtn.isEnabled().catch(() => false)) {
  50  |       await lanjutBtn.click()
  51  |       await page.waitForTimeout(500)
  52  |     }
  53  |   }
  54  | }
  55  | 
  56  | // =============================================================================
  57  | // TC-01: Redirect /dokumen → /dokumen/saya
  58  | // =============================================================================
  59  | 
  60  | test('TC-01: should redirect /dokumen to /dokumen/saya', async ({ page }) => {
  61  |   await login(page)
  62  |   await page.goto(`${BASE_URL}/dokumen`)
  63  |   await page.waitForLoadState('load')
  64  |   await page.waitForTimeout(3000)
  65  |   const url = page.url()
  66  |   expect(url).toMatch(/\/dokumen\/saya/)
  67  |   // Wait for dokumen saya page to finish loading
> 68  |   await page.waitForFunction(() => {
      |              ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  69  |     return document.body.textContent?.includes('Belum ada dokumen') === true
  70  |     || document.querySelector('table tbody tr') !== null
  71  |   }, { timeout: 15000 })
  72  | })
  73  | 
  74  | // =============================================================================
  75  | // TC-02: Step 1 — Fungsi, Tahun, Tanggal
  76  | // =============================================================================
  77  | 
  78  | test('TC-02: Step 1 — fungsi dropdown, tahun, tanggal', async ({ page }) => {
  79  |   await login(page)
  80  |   await page.goto(`${BASE_URL}/dokumen/aju`)
  81  |   await page.waitForLoadState('domcontentloaded')
  82  |   await page.waitForTimeout(1000)
  83  | 
  84  |   const fungsiBox = page.locator('[role="combobox"]').first()
  85  |   await expect(fungsiBox).toBeVisible({ timeout: 15000 })
  86  | 
  87  |   const lanjutBtn = page.locator('button', { hasText: 'Lanjut' })
  88  |   await expect(lanjutBtn).toBeDisabled()
  89  | 
  90  |   await fungsiBox.click()
  91  |   await page.waitForTimeout(500)
  92  |   await page.locator('[role="option"]').first().click()
  93  |   await page.waitForTimeout(500)
  94  | 
  95  |   await expect(lanjutBtn).toBeEnabled()
  96  | })
  97  | 
  98  | // =============================================================================
  99  | // TC-03: Step 2 — Kegiatan filtered by fungsi
  100 | // =============================================================================
  101 | 
  102 | test('TC-03: Step 2 — kegiatan filtered by fungsi', async ({ page }) => {
  103 |   await login(page)
  104 |   await page.goto(`${BASE_URL}/dokumen/aju`)
  105 |   await page.waitForLoadState('domcontentloaded')
  106 |   await page.waitForTimeout(1000)
  107 | 
  108 |   // Fill step 1
  109 |   await page.locator('[role="combobox"]').first().click()
  110 |   await page.waitForTimeout(500)
  111 |   await page.locator('[role="option"]').first().click()
  112 |   await page.waitForTimeout(500)
  113 |   await page.locator('button', { hasText: 'Lanjut' }).click()
  114 |   await page.waitForTimeout(500)
  115 | 
  116 |   await expect(page.locator('h3', { hasText: 'Pilih Kegiatan' })).toBeVisible()
  117 |   const kegBox = page.locator('[role="combobox"]').last()
  118 |   await expect(kegBox).toBeVisible()
  119 | })
  120 | 
  121 | // =============================================================================
  122 | // TC-04: Step 3 — Role toggle
  123 | // =============================================================================
  124 | 
  125 | test('TC-04: Step 3 — role toggle (Anggota / Ketua Tim)', async ({ page }) => {
  126 |   await login(page)
  127 |   await page.goto(`${BASE_URL}/dokumen/aju`)
  128 |   await page.waitForLoadState('domcontentloaded')
  129 |   await page.waitForTimeout(1000)
  130 | 
  131 |   await advanceToStep(page, 3)
  132 | 
  133 |   await expect(page.locator('text=Anggota')).toBeVisible()
  134 |   await expect(page.locator('text=Ketua Tim')).toBeVisible()
  135 |   await expect(page.locator('text=Saya adalah anggota tim')).toBeVisible()
  136 |   await page.locator('button', { hasText: 'Ketua Tim' }).click()
  137 |   await expect(page.locator('text=Saya adalah penanggung jawab')).toBeVisible()
  138 | })
  139 | 
  140 | // =============================================================================
  141 | // TC-05: Step 4 — Upload Lampiran
  142 | // =============================================================================
  143 | 
  144 | test('TC-05: Step 4 — upload lampiran flow', async ({ page }) => {
  145 |   await login(page)
  146 |   await page.goto(`${BASE_URL}/dokumen/aju`)
  147 |   await page.waitForLoadState('domcontentloaded')
  148 |   await page.waitForTimeout(1000)
  149 | 
  150 |   await advanceToStep(page, 4)
  151 | 
  152 |   await expect(page.locator('h3', { hasText: 'Unggah Lampiran' })).toBeVisible({ timeout: 10000 })
  153 |   const wajibBadge = page.locator('text=WAJIB')
  154 |   if (await wajibBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
  155 |     const uploadBtns = page.locator('button', { hasText: 'Unggah File' })
  156 |     const count = await uploadBtns.count()
  157 |     expect(count).toBeGreaterThan(0)
  158 |   }
  159 | })
  160 | 
  161 | // =============================================================================
  162 | // TC-06: Upload Validation — frontend
  163 | // =============================================================================
  164 | 
  165 | test('TC-06: Upload validation — frontend rejects invalid files', async ({ page }) => {
  166 |   await login(page)
  167 |   await page.goto(`${BASE_URL}/dokumen/aju`)
  168 |   await page.waitForLoadState('domcontentloaded')
```