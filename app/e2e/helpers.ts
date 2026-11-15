import { expect, type Page } from '@playwright/test';

/** Collects console errors: a sentence without a recording is reported there too. */
export function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Opens a game from the home screen at a level. */
export async function openGame(page: Page, name: RegExp, level = 1): Promise<void> {
  await page.goto('/');
  // By its title: another card may mention this game in its description.
  await page.locator('.station').filter({ has: page.locator('strong', { hasText: name }) }).click();
  if (level > 1) await page.locator('.levels').getByRole('button', { name: String(level), exact: true }).click();
  await expect(page.locator('.levels').getByRole('button', { name: String(level), exact: true })).toHaveAttribute('aria-pressed', 'true');
}

export const tensW = (t: number) => (t === 1 ? '1 ten' : `${t} tens`);
export const onesW = (o: number) => (o === 1 ? '1 one' : `${o} ones`);
/** "3 tens and 4 ones. 30 + 4 = 34." */
export const tensAndOnes = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}. ${Math.floor(n / 10) * 10} + ${n % 10} = ${n}.`;

export const feedback = (page: Page) => page.getByTestId('feedback');
export const oreo = (page: Page) => page.locator('.cheer .pup');
export const choice = (page: Page, n: number) => page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) });
export const wrongChoice = (page: Page, n: number) => page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first();
export const next = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
export const bones = (page: Page) => page.locator('.dots .star');
export const paws = (page: Page) => page.locator('.dots .done');

/** The number a blocks picture shows, read from its description as a screen reader would. */
export async function blocksNumber(page: Page, within = '.stage'): Promise<number> {
  const label = await page.locator(`${within} .blocks`).first().getAttribute('aria-label');
  const m = /(\d+) tens? and (\d+) ones?/.exec(label ?? '');
  if (!m) throw new Error(`cannot read the blocks: ${label}`);
  return Number(m[1]) * 10 + Number(m[2]);
}

export async function fitsTheScreen(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}
