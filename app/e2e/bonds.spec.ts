import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, tensW, watch, wrongChoice } from './helpers';

async function pair(page: Page) {
  const m = /^(\d+) \+ \? = (\d+)$/.exec((await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' '))!;
  const n = Number(m[1]), whole = Number(m[2]);
  return { n, whole, ans: whole - n };
}
type Pair = Awaited<ReturnType<typeof pair>>;
const explains = (p: Pair) =>
  p.whole === 100 ? `Woof! ${tensW(p.n / 10)} and ${tensW(p.ans / 10)} make 10 tens. ${p.n} + ${p.ans} = 100.`
  : p.n % 10 && p.n > 10 ? `Woof! ${p.n} + ${p.ans} = 20. The same friends: ${p.n % 10} and ${p.ans}.` : `Woof! ${p.n} + ${p.ans} = 20.`;
const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};

test('friends of 20: two ten frames, the empty places are the answer', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'bonds', 1);
  await expect(page.getByTestId('title')).toHaveText('Friends of 20 and 100');
  const p = await pair(page);
  expect(p.whole).toBe(20);
  const frames = page.locator('.frames');
  await expect(frames.locator('.frame')).toHaveCount(2); // always both frames, so the empty places can be counted
  await expect(frames.locator('.dot')).toHaveCount(p.n);
  await wrongChoice(page, p.ans).click();
  await expect(feedback(page)).toHaveText('Count the empty places in both frames.');
  await choice(page, p.ans).click();
  await expect(feedback(page)).toHaveText(explains(p));
  await expect(frames.locator('.dot.sun')).toHaveCount(p.ans); // the missing ones arrive in yellow
  await expect(frames.locator('.dot')).toHaveCount(20);
  await expect(paws(page)).toHaveCount(1);
  await next(page);
  const p2 = await pair(page);
  await choice(page, p2.ans).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('tens that make 100: rods of ten, ten of them make 100', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'bonds', 2);
  const p = await pair(page);
  expect(p.whole).toBe(100);
  expect(p.n % 10).toBe(0);
  const pic = page.getByTestId('tensto100');
  await expect(pic.locator('.blocks').first()).toHaveAttribute('aria-label', `${tensW(p.n / 10)} and 0 ones`);
  await wrongChoice(page, p.ans).click();
  await expect(feedback(page)).toHaveText('Ten tens make 100. Count the tens that are missing.');
  await choice(page, p.ans).click();
  await expect(feedback(page)).toHaveText(explains(p));
  await expect(pic.locator('.suntens .blocks')).toHaveAttribute('aria-label', `${tensW(p.ans / 10)} and 0 ones`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('in her head: both kinds, typed; the picture after a miss', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'bonds', 3);
  for (let i = 0; i < 6; i++) {
    const p = await pair(page);
    await expect(page.locator('.frames, [data-testid=tensto100]')).toHaveCount(0);
    if (i === 0) {
      await type(page, p.ans === 1 ? 2 : p.ans - 1);
      await expect(feedback(page)).toHaveText(p.whole === 20 ? 'Count the empty places in both frames.' : 'Ten tens make 100. Count the tens that are missing.');
      await expect(page.locator('.frames, [data-testid=tensto100]')).toHaveCount(1);
    }
    await type(page, p.ans);
    await expect(feedback(page)).toHaveText(explains(p));
    await next(page);
  }
  await expect(page.getByTestId('end')).toContainText('Oreo got 5 bones.');
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
