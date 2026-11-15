import { expect, test, type Page } from '@playwright/test';
import { bones, feedback, fitsTheScreen, next, openGame, paws, watch } from './helpers';

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'];
const nums = async (page: Page) => (await page.locator('.choice').allInnerTexts()).map((t) => Number(t.replace(/\D/g, '')));
const tap = (page: Page, n: number) => page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};

for (const [level, title, top] of [[1, 'More or less, to 20', 20], [3, 'More or less, to 100', 100]] as const) {
  test(`${title}: two numbers in blocks; a miss puts both on the number line`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'more', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    const ask = (await page.getByTestId('prompt').innerText()) === 'Which is more?' ? 'more' : 'less';
    const [a, b] = (await nums(page)) as [number, number];
    expect(Math.max(a, b)).toBeLessThanOrEqual(top);
    await expect(page.getByTestId('twonums').locator('.blocks')).toHaveCount(2);
    const hi = Math.max(a, b), lo = Math.min(a, b), ans = ask === 'more' ? hi : lo, other = ask === 'more' ? lo : hi;
    await expect(page.getByTestId('markline')).toHaveCount(0);
    await tap(page, other);
    const same = Math.floor(a / 10) === Math.floor(b / 10);
    await expect(feedback(page)).toHaveText(
      top === 20 ? 'On the number line, the number further along is more.' : same ? 'The tens are the same. Look at the ones.' : 'Look at the tens first. More tens is more.');
    // To 100 the line shows only the tens the two numbers are in, so close numbers stand apart.
    const from = top === 20 ? 0 : Math.floor(lo / 10) * 10, to = top === 20 ? 20 : Math.max(from + 10, Math.ceil(hi / 10) * 10);
    await expect(page.getByTestId('markline')).toHaveAttribute('aria-label', `number line from ${from} to ${to} with ${a} and ${b}`);
    // The two flags do not cover each other.
    const boxes = await page.getByTestId('markline').locator('.flag').evaluateAll((fs) => fs.map((f) => f.getBoundingClientRect()).map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom })));
    const [f1, f2] = boxes as [typeof boxes[0], typeof boxes[0]];
    expect(f1.r <= f2.l || f2.r <= f1.l || f1.b <= f2.t || f2.b <= f1.t).toBe(true);
    await tap(page, ans);
    await expect(feedback(page)).toHaveText(`Woof! ${ans} is ${ask} than ${other}.`);
    await expect(paws(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

for (const level of [2, 4]) {
  test(`three numbers in order, ${level === 2 ? 'to 20' : 'to 100'}: tap from the smallest; a wrong tap is explained and nothing is lost`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'more', level);
    const three = await nums(page);
    expect(new Set(three).size).toBe(3);
    const sorted = [...three].sort((x, y) => x - y);
    await tap(page, sorted[2]!); // the biggest first: not yet
    await expect(feedback(page)).not.toBeEmpty();
    await expect(feedback(page)).not.toHaveText(/wrong/i);
    await expect(page.getByTestId('markline')).toBeVisible();
    await expect(page.getByTestId('ordered')).toHaveAttribute('aria-label', 'in order so far: nothing');
    await tap(page, sorted[0]!);
    await expect(page.getByTestId('ordered')).toHaveAttribute('aria-label', `in order so far: ${sorted[0]}`);
    await tap(page, sorted[1]!);
    await tap(page, sorted[2]!); // it can be tapped again once its turn has come
    await expect(feedback(page)).toHaveText(`Woof! ${sorted.join(', ')}. From the smallest to the biggest.`);
    await next(page);
    const again = (await nums(page)).sort((x, y) => x - y);
    for (const n of again) await tap(page, n);
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

test('the nearer ten, on the line and then typed', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'more', 5);
  await expect(page.getByTestId('title')).toHaveText('The nearer ten');
  const n = Number(await page.getByTestId('prompt').innerText());
  const lo = Math.floor(n / 10) * 10, ans = n % 10 < 5 ? lo : lo + 10;
  await expect(page.getByTestId('markline')).toHaveAttribute('aria-label', `number line from ${lo} to ${lo + 10} with ${n}`);
  expect(await nums(page)).toEqual([lo, lo + 10]);
  await tap(page, ans === lo ? lo + 10 : lo);
  await expect(feedback(page)).toHaveText('Look where it is on the line. Which ten is closer?');
  await tap(page, ans);
  await expect(feedback(page)).toHaveText(`Woof! ${n} is nearer to ${ans}.`);

  await openGame(page, 'more', 6);
  const m = Number(await page.getByTestId('prompt').innerText());
  const lo2 = Math.floor(m / 10) * 10, ans2 = m % 10 < 5 ? lo2 : lo2 + 10;
  await expect(page.getByTestId('markline')).toHaveCount(0);
  await type(page, ans2 === lo2 ? lo2 + 10 : lo2);
  await expect(feedback(page)).toHaveText('Look where it is on the line. Which ten is closer?');
  await expect(page.getByTestId('markline')).toBeVisible();
  await type(page, ans2);
  await expect(feedback(page)).toHaveText(`Woof! ${m} is nearer to ${ans2}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('first to tenth: tap the place in a queue; a miss numbers the queue', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'more', 7);
  await expect(page.getByTestId('title')).toHaveText('First to tenth');
  const w = /^Tap the ([a-z]+)$/.exec(await page.getByTestId('prompt').innerText())![1]!;
  const k = ORD.indexOf(w);
  const queue = page.getByTestId('queue');
  await expect(queue.locator('.qspot')).toHaveCount(10);
  const other = k === 1 ? 2 : k - 1;
  await queue.getByRole('button', { name: `place ${other}`, exact: true }).click();
  await expect(feedback(page)).toHaveText('Count from the front: first, second, third.');
  await expect(queue.locator('.qspot.numbered')).toHaveCount(10);
  await queue.getByRole('button', { name: `place ${k}`, exact: true }).click();
  await expect(feedback(page)).toHaveText(`Woof! It is the ${w}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('eleventh and beyond: which place in a queue of twenty', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'more', 8);
  await expect(page.getByTestId('title')).toHaveText('Eleventh and beyond');
  const queue = page.getByTestId('queue');
  await expect(queue.locator('.qspot')).toHaveCount(20);
  await expect(queue.locator('.qspot.mark')).toHaveCount(1);
  const k = (await queue.locator('.qspot').evaluateAll((all) => all.findIndex((e) => e.classList.contains('mark')))) + 1;
  expect(k).toBeGreaterThanOrEqual(11);
  const label = (n: number) => `${n}th`;
  await page.locator('.choice').filter({ hasNotText: new RegExp(`^${label(k)}$`) }).first().click();
  await expect(feedback(page)).toHaveText('The first row is ten. Count on from the eleventh.');
  await page.locator('.choice').filter({ hasText: new RegExp(`^${label(k)}$`) }).click();
  await expect(feedback(page)).toHaveText(`Woof! It is the ${ORD[k]}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
