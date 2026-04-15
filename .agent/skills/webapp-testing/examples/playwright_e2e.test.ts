// @ts-nocheck
import { test, expect } from '@playwright/test';

// Example: Testing full browser flows with Playwright for TanStack Start DMS
test.describe('Document Submission Flow', () => {

  test('Pegawai can submit a new document to DRAFT', async ({ page }) => {
    // 1. Visit the app
    await page.goto('/');

    // 2. Perform Login (Simulating PEGAWAI)
    await page.fill('input[name="email"]', 'pegawai@bps.go.id');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. Verify successful redirection and wait for hydration/SSR finish
    await expect(page).toHaveURL('/dashboard');
    
    // 4. Navigate to Create Document
    await page.click('text=Buat Dokumen Baru');
    await expect(page).toHaveURL('/dokumen/new');

    // 5. Fill out the application form
    await page.fill('input[name="judul"]', 'Laporan SAKERNAS 2026');
    await page.selectOption('select[name="kegiatan_id"]', { label: 'SAKERNAS' });
    
    // 6. Submit the form
    await page.click('button:has-text("Simpan Draft")');

    // 7. Verify Document shows up in the inbox with status DRAFT
    await expect(page).toHaveURL('/inbox');
    const row = page.locator('tr', { hasText: 'Laporan SAKERNAS 2026' });
    await expect(row).toBeVisible();
    await expect(row.locator('td', { hasText: 'DRAFT' })).toBeVisible();

    // 8. Capture an annotated screenshot for visual verification
    await page.screenshot({ path: 'test-results/screenshots/pegawai_draft_success.png', fullPage: true });
  });

});
