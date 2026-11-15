import { expect, test } from '@playwright/test';

test('the app opens without console errors and fits the screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tens and Ones' })).toBeVisible();

  // Tens digit red, ones digit blue.
  await expect(page.locator('.num .t').first()).toHaveCSS('color', 'rgb(229, 72, 77)');
  await expect(page.locator('.num .o').first()).toHaveCSS('color', 'rgb(43, 109, 232)');

  // Nothing may scroll sideways, least of all at 400 px.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  expect(errors).toEqual([]);
});
