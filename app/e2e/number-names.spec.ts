import { expect, test, type Page } from '@playwright/test';
import { bones, feedback, fitsTheScreen, next, openGame, oreo, paws, tensW, onesW, watch } from './helpers';

const W1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const W10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const word = (n: number) => (n < 20 ? W1[n]! : W10[Math.floor(n / 10)]! + (n % 10 ? '-' + W1[n % 10]! : ''));
const parts = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`;
const choices = async (page: Page) => (await page.locator('.choice').allInnerTexts()).map(Number);

/** Works out the right answer from what is on screen, taps a wrong one first, then the right one. */
async function play(page: Page, level: number, missFirst: boolean): Promise<void> {
  const opts = await choices(page);
  expect(new Set(opts).size).toBe(4);
  const prompt = await page.getByTestId('prompt').innerText();
  let n: number;
  if (level === 1) {
    n = opts.find((v) => prompt === `Which is ${word(v)}?`)!;
  } else if (level === 2) {
    const m = /Which number has (\d) (tens?|ones?)\?/.exec(prompt)!;
    const fits = opts.filter((v) => (m[2]!.startsWith('ten') ? Math.floor(v / 10) : v % 10) === Number(m[1]));
    expect(fits).toHaveLength(1); // exactly one choice fits
    n = fits[0]!;
  } else {
    // The number is only spoken. With the voice blocked the app writes it instead: read it there.
    const sub = await page.locator('.card.game .sub').innerText();
    n = opts.find((v) => sub === `The number is ${word(v)}.`)!;
  }
  expect(n).toBeDefined();
  if (missFirst) {
    const v = opts.find((o) => o !== n)!;
    await page.locator('.choice').filter({ hasText: new RegExp(`^${v}$`) }).click();
    // The explanation says what the number she tapped really is.
    await expect(feedback(page)).toHaveText(`${v} is ${word(v)}: ${parts(v)}. Have another go.`);
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await expect(page.locator('.stage .blocks')).toHaveCount(0);
  }
  await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
  await expect(feedback(page)).toHaveText(`Woof! ${n} is ${parts(n)}. We say ${word(n)}.`);
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', parts(n));
}

for (const level of [1, 2, 3]) {
  test(`Number Names level ${level}: wrong then right, then right first time`, async ({ page }) => {
    const errors = watch(page);
    // Level 3 is heard, not read. For the test the voice is blocked, so the app shows the word.
    if (level === 3) await page.route('**/voice/*.mp3', (r) => r.abort());
    await openGame(page, 'names', level);
    if (level === 3) await expect(page.getByText('The voice did not load.')).toBeVisible();
    await play(page, level, true);
    await expect(paws(page)).toHaveCount(1);
    await next(page);
    await play(page, level, false);
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e) || level !== 3)).toEqual([]);
  });
}

test('Number Names level 3 with the voice: the number is spoken and the word is not shown', async ({ page }) => {
  await openGame(page, 'names', 3);
  await expect(page.getByTestId('prompt')).toHaveText('Listen. Which number is it?');
  await expect(page.locator('.card.game .sub')).toHaveText('Tap the speaker to hear it again.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'listening');
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeVisible();
});
