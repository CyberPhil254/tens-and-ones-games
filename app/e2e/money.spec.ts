import { expect, test, type Page } from '@playwright/test';
import { choice, feedback, fitsTheScreen, onesW, openGame, paws, tensW, watch, wrongChoice } from './helpers';

const sh = (n: number) => `${n} ${n === 1 ? 'shilling' : 'shillings'}`;
const value = (label: string | null) => Number(/(\d+) shillings?/.exec(label ?? '')![1]);
const values = async (page: Page, within: string) => (await page.locator(`${within} .coin, ${within} .note`).evaluateAll((all) => all.map((e) => e.getAttribute('aria-label')))).map(value);
const blocks = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`;

test('Coins and notes: find the one asked for; a miss shows each as tens and ones', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'money', 1);
  await expect(page.getByTestId('title')).toHaveText('Coins and notes');
  const want = Number(/^Tap (\d+) shillings?$/.exec(await page.getByTestId('prompt').innerText())![1]);
  const shown = await values(page, '[data-testid=money]');
  expect(new Set(shown).size).toBe(4);
  for (const v of shown) expect([1, 5, 10, 20, 50, 100]).toContain(v); // only money that exists in Kenya
  const other = shown.find((v) => v !== want)!;
  await page.getByRole('button', { name: sh(other), exact: true }).click();
  await expect(feedback(page)).toHaveText('Look at the number on it.');
  await expect(page.getByTestId('money').locator('.blocks')).toHaveCount(4); // swapped for tens and ones
  await page.getByRole('button', { name: sh(want), exact: true }).click();
  await expect(feedback(page)).toHaveText(`Woof! ${sh(want)}.`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Coins and notes: which is worth more, whatever its size', async ({ page }) => {
  await openGame(page, 'money', 2);
  const [a, b] = (await values(page, '[data-testid=money]')) as [number, number];
  const hi = Math.max(a, b), lo = Math.min(a, b);
  await page.getByRole('button', { name: sh(lo), exact: true }).click();
  await expect(feedback(page)).toHaveText('A bigger coin is not always worth more. Look at the number.');
  await page.getByRole('button', { name: sh(hi), exact: true }).click();
  await expect(feedback(page)).toHaveText(`Woof! ${hi} is more than ${lo}.`);
});

test('Amounts of money: how much is in the purse; a miss swaps the coins for blocks', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'money', 3);
  await expect(page.getByTestId('title')).toHaveText('Amounts of money');
  const coins = await values(page, '[data-testid=purse]');
  const sum = coins.reduce((x, y) => x + y, 0);
  await expect(page.locator('.stage .blocks')).toHaveCount(0);
  await wrongChoice(page, sum).click();
  await expect(feedback(page)).toHaveText('Start with the biggest. Then count on.');
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', blocks(sum));
  await choice(page, sum).click();
  await expect(feedback(page)).toHaveText(`Woof! ${coins.join(' + ')} = ${sum}. ${sh(sum)}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Amounts of money: make an amount; too little and too much are told apart; coins can be taken out again', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'money', 4);
  const want = Number(/^Make (\d+) shillings$/.exec(await page.getByTestId('prompt').innerText())![1]);
  const add = (v: number) => page.getByRole('button', { name: `add ${sh(v)}`, exact: true }).click();
  const done = page.getByRole('button', { name: 'Done' });
  await expect(done).toBeDisabled(); // nothing in the purse yet
  // Too little: one shilling.
  await add(1);
  await done.click();
  await expect(feedback(page)).toHaveText('That is 1. Not enough yet. Add some more.');
  const compare = page.getByTestId('compare').locator('.blocks');
  await expect(compare.first()).toHaveAttribute('aria-label', blocks(1));
  await expect(compare.nth(1)).toHaveAttribute('aria-label', blocks(want));
  // Too much: two fifties.
  await add(50); await add(50);
  await done.click();
  await expect(feedback(page)).toHaveText('That is 101. Too much. Take some away.');
  // Empty the purse by tapping what is in it, then make it properly.
  while (await page.getByTestId('mine').locator('.inpurse').count()) await page.getByTestId('mine').locator('.inpurse').first().click();
  let left = want;
  for (const v of [50, 20, 10, 5, 1]) while (left >= v) { await add(v); left -= v; }
  await done.click();
  await expect(feedback(page)).toContainText(`= ${want}. You made ${sh(want)}.`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Amounts of money: which purse holds more', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'money', 5);
  const sums: number[] = [];
  for (const i of [1, 2]) sums.push((await values(page, `[aria-label="purse ${i}"]`)).reduce((x, y) => x + y, 0));
  const more = sums[0]! > sums[1]! ? 1 : 2, less = 3 - more;
  await page.getByRole('button', { name: `purse ${less}`, exact: true }).click();
  await expect(feedback(page)).toHaveText('Count each purse. Start with the biggest.');
  await expect(page.getByTestId('purses').locator('.blocks')).toHaveCount(2);
  await page.getByRole('button', { name: `purse ${more}`, exact: true }).click();
  await expect(feedback(page)).toHaveText(`Woof! ${Math.max(...sums)} is more than ${Math.min(...sums)}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('coins and notes are drawn in code, with no red or blue', async ({ page }) => {
  await openGame(page, 'money', 1);
  const found = await page.locator('.coin, .note').evaluateAll((all) => all.map((e) => ({ img: e.querySelector('img') !== null, bg: getComputedStyle(e).backgroundColor + getComputedStyle(e).backgroundImage })));
  for (const f of found) {
    expect(f.img).toBe(false);
    expect(f.bg).not.toMatch(/229, 72, 77|43, 109, 232/);
  }
});
