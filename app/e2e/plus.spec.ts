import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, onesW, openGame, oreo, paws, tensW, watch, wrongChoice } from './helpers';

async function sum(page: Page) {
  const m = /^(\d+) \+ (\d+) = \?$/.exec((await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' '))!;
  const a = Number(m[1]), b = Number(m[2]);
  return { a, b, ans: a + b, t: [Math.floor(a / 10), Math.floor(b / 10)], o: [a % 10, b % 10] };
}
type Sum = Awaited<ReturnType<typeof sum>>;
const explains = (s: Sum) =>
  `Woof! ${tensW(s.t[0]!)} and ${tensW(s.t[1]!)} are ${tensW(s.t[0]! + s.t[1]!)}. ${onesW(s.o[0]!)} and ${onesW(s.o[1]!)} are ${onesW(s.o[0]! + s.o[1]!)}. ${s.a} + ${s.b} = ${s.ans}.`;
const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};

for (const level of [1, 2]) {
  test(`step ${level + 1} of Tens and ones sums: two numbers in ${level === 1 ? 'blocks' : 'a sketch'}; a miss puts tens with tens and ones with ones`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'plus', level);
    await expect(page.getByTestId('title')).toHaveText('Tens and ones sums');
    const s = await sum(page);
    expect(s.o[0]! + s.o[1]!).toBeLessThanOrEqual(9); // no new ten
    const two = page.getByTestId('twonums').locator('.blocks');
    await expect(two).toHaveCount(2);
    await expect(two.first()).toHaveAttribute('aria-label', `${tensW(s.t[0]!)} and ${onesW(s.o[0]!)}`);
    await expect(two.nth(1)).toHaveAttribute('aria-label', `${tensW(s.t[1]!)} and ${onesW(s.o[1]!)}`);
    if (level === 2) await expect(two.first()).toHaveClass(/sketch/);

    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Add the tens to the tens. Add the ones to the ones.');
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    // The picture now shows it: one set of blocks, and the two little sums.
    const joined = page.getByTestId('joined');
    await expect(joined.locator('.blocks')).toHaveAttribute('aria-label', `${tensW(s.t[0]! + s.t[1]!)} and ${onesW(s.o[0]! + s.o[1]!)}`);
    await expect(joined.locator('.split .tt')).toHaveText(`${tensW(s.t[0]!)} + ${tensW(s.t[1]!)}`);
    await expect(joined.locator('.split .oo')).toHaveText(`${onesW(s.o[0]!)} + ${onesW(s.o[1]!)}`);
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(explains(s));
    await expect(joined.locator('.split .tt')).toHaveText(`${tensW(s.t[0]!)} + ${tensW(s.t[1]!)} = ${tensW(s.t[0]! + s.t[1]!)}`);
    await expect(paws(page)).toHaveCount(1);
    await next(page);
    const s2 = await sum(page);
    await choice(page, s2.ans).click();
    await expect(feedback(page)).toHaveText(explains(s2));
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

test('in her head: typed on the number pad; the blocks if she asks or misses', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'plus', 3);
  const s = await sum(page);
  await expect(page.locator('.blocks')).toHaveCount(0);
  await type(page, s.ans + 10 > 99 ? s.ans - 10 : s.ans + 10);
  await expect(feedback(page)).toHaveText('Add the tens to the tens. Add the ones to the ones.');
  await expect(page.getByTestId('joined')).toBeVisible();
  await type(page, s.ans);
  await expect(feedback(page)).toHaveText(explains(s));
  await next(page);
  const s2 = await sum(page);
  await page.getByRole('button', { name: 'Show the blocks' }).click();
  await expect(page.getByTestId('twonums')).toBeVisible();
  await type(page, s2.ans);
  await expect(paws(page)).toHaveCount(2); // asking for the blocks costs the bone
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
