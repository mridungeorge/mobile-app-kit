import { expect, test } from '@playwright/test';

test('reduced motion shows content with no tween', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.page')).toHaveClass(/is-reduced/);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1');
});

test('normal motion still lands the hero', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.page')).not.toHaveClass(/is-reduced/);
  await expect(page.locator('h1').first()).toBeVisible();
});
