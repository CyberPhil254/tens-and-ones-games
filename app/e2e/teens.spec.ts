import { expect, test, type Page } from '@playwright/test';
import { blocksNumber, bones, choice, feedback, fitsTheScreen, next, onesW, openGame, paws, tensW, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
const isTO = (n: number) => `${n} is ${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}.`;
const prompt = async (page: Page) => (await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' ');

test('Ten and some more, step 1: read a ten and some ones', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'teens', 1);
  await expect(page.getByTestId('title')).toHaveText('Ten and some more');
  const n = await blocksNumber(page);
  expect(n >= 10 && n <= 20).toBe(true);
  await wrongChoice(page, n).click();
  await expect(feedback(page)).toHaveText('Start at ten. Then count on the ones.');
  await expect(page.locator('.stage .blocks')).toHaveClass(/counted/); // the count appears under the blocks
  await choice(page, n).click();
  await expect(feedback(page)).toHaveText(`Woof! ${isTO(n)}`);
  await expect(paws(page)).toHaveCount(1);
  await next(page);
  await choice(page, await blocksNumber(page)).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Ten and some more, step 2: how many ones go with the ten', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'teens', 2);
  const m = /^(\d+) = 10 \+ \?$/.exec(await prompt(page))!;
  const n = Number(m[1]), ans = n - 10;
  expect(await blocksNumber(page)).toBe(10); // only the ten is there
  await wrongChoice(page, ans).click();
  await expect(feedback(page)).toHaveText('A teen number is one ten and some ones.');
  await choice(page, ans).click();
  await expect(feedback(page)).toHaveText(`Woof! ${isTO(n)}`);
  expect(await blocksNumber(page)).toBe(n); // the ones have arrived
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Ten and some more, step 3: in her head, typed', async ({ page }) => {
  await openGame(page, 'teens', 3);
  for (let i = 0; i < 6; i++) {
    const t = await prompt(page);
    let m: RegExpExecArray | null, n: number, ans: number;
    if ((m = /^(\d+) = 10 \+ \?$/.exec(t))) { n = Number(m[1]); ans = n - 10; }
    else { m = /^10 \+ (\d+) = \?$/.exec(t)!; n = 10 + Number(m[1]); ans = n; }
    await expect(page.locator('.stage .blocks')).toHaveCount(0);
    if (i === 0) {
      await type(page, ans + 1);
      await expect(feedback(page)).not.toBeEmpty();
      await expect(page.locator('.stage .blocks')).toBeVisible();
    }
    await type(page, ans);
    await expect(feedback(page)).toHaveText(`Woof! ${isTO(n)}`);
    await next(page);
  }
  await expect(page.getByTestId('end')).toContainText('Oreo got 5 bones.');
});

async function other(page: Page) {
  const m = /^(\d+) = (\d) tens? and \? ones$/.exec(await prompt(page))!;
  const n = Number(m[1]), t = Number(m[2]);
  return { n, t, ans: n - t * 10 };
}

test('Another way, with the blocks: one ten broken into ten ones is still the same number', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'regroup', 1);
  await expect(page.getByTestId('title')).toHaveText('Build and split');
  const q = await other(page);
  expect(q.t * 10 + q.ans).toBe(q.n);
  expect(q.ans).toBeGreaterThanOrEqual(10);
  await expect(page.locator('.card.game .sub')).toHaveText(`${q.n} is ${tensW(q.t + 1)} and ${onesW(q.ans - 10)}. Break one ten.`);
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', `${tensW(q.t)} and ${onesW(q.ans)}`);
  await wrongChoice(page, q.ans).click();
  await expect(feedback(page)).toHaveText('One ten was broken into 10 ones. Count on from 10.');
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(`Woof! ${isTO(q.n)} It is also ${tensW(q.t)} and ${onesW(q.ans)}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Another way, in her head: typed; the blocks after a miss', async ({ page }) => {
  await openGame(page, 'regroup', 2);
  const q = await other(page);
  await expect(page.locator('.stage .blocks')).toHaveCount(0);
  await type(page, q.ans - 10 || 1);
  await expect(feedback(page)).toHaveText('One ten was broken into 10 ones. Count on from 10.');
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', `${tensW(q.t)} and ${onesW(q.ans)}`);
  await type(page, q.ans);
  await expect(feedback(page)).toContainText(`It is also ${tensW(q.t)} and ${onesW(q.ans)}.`);
});
