import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, onesW, openGame, paws, tensW, watch, wrongChoice } from './helpers';

const W1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const W10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const word = (n: number) => (n < 20 ? W1[n]! : W10[Math.floor(n / 10)]! + (n % 10 ? '-' + W1[n % 10]! : ''));
const said = (n: number) => `${n} is ${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}. We say ${word(n)}.`;
const told = (v: number) => `${v} is ${word(v)}: ${tensW(Math.floor(v / 10))} and ${onesW(v % 10)}. Have another go.`;
const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};

test('Number names to 20, step 1: read the word, find the numeral', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'hear', 1);
  await expect(page.getByTestId('title')).toHaveText('Number names to 20');
  const w = /^Which is ([a-z]+)\?$/.exec(await page.getByTestId('prompt').innerText())![1]!;
  const n = [...W1, 'twenty'].indexOf(w);
  expect(n).toBeGreaterThanOrEqual(0);
  const opts = (await page.locator('.choice').allInnerTexts()).map(Number);
  expect(Math.max(...opts)).toBeLessThanOrEqual(20);
  const v = opts.find((o) => o !== n)!;
  await wrongChoice(page, n).click();
  await expect(feedback(page)).toHaveText(told(v)); // she is told what the number she tapped is
  await choice(page, n).click();
  await expect(feedback(page)).toHaveText(`Woof! ${said(n)}`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

for (const [level, title, max] of [[2, 'Number names to 20', 20], [3, 'Number names to 100', 99]] as const) {
  test(`${title}: hear a number and type it`, async ({ page }) => {
    const errors = watch(page);
    // Without the voice the word is shown instead, which is also how the test knows the number.
    await page.route('**/voice/*.mp3', (r) => r.abort());
    await openGame(page, 'hear', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    await expect(page.getByTestId('prompt')).toHaveText('Listen. Type the number.');
    for (let i = 0; i < 2; i++) {
      await expect(page.locator('.card.game .sub')).toHaveText(/^The number is [a-z-]+\.$/); // shown once the voice is known to be missing
      const w = /^The number is ([a-z-]+)\.$/.exec(await page.locator('.card.game .sub').innerText())![1]!;
      const n = Array.from({ length: 100 }, (_, k) => k).find((k) => word(k) === w)!;
      expect(n).toBeLessThanOrEqual(max);
      await expect(page.locator('.stage .blocks')).toHaveCount(0);
      if (i === 0) {
        const v = n === 0 ? 1 : n - 1;
        await type(page, v);
        await expect(feedback(page)).toHaveText(told(v));
        await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`);
      }
      await type(page, n);
      await expect(feedback(page)).toHaveText(`Woof! ${said(n)}`);
      await next(page);
    }
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors.filter((e) => !/voice|ERR_FAILED|Failed to load/i.test(e))).toEqual([]);
  });
}

test('with the voice: nothing on screen gives the number away', async ({ page }) => {
  await openGame(page, 'hear', 3);
  await expect(page.locator('.card.game .sub')).toHaveText('Tap the speaker to hear it again.');
  await expect(page.locator('.card.game .wordy')).toHaveCount(0);
  await expect(page.locator('.stage .blocks')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeVisible();
});
