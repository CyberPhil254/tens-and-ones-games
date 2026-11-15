import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
/** The numbers of the pattern on screen; null where the question mark is. */
const sequence = async (page: Page) => (await page.getByTestId('sequence').locator('.seqchip').allInnerTexts()).map((t) => (t.trim() === '?' ? null : Number(t)));
const said = (step: number, all: number[]) => `Woof! Hops of ${Math.abs(step)}${step < 0 ? ', going back' : ''}. ${all.join(', ')}.`;

test('What comes next: a pattern of shapes', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'skip', 1);
  await expect(page.getByTestId('title')).toHaveText('What comes next');
  const shapes = ((await page.getByTestId('pattern').getAttribute('aria-label')) ?? '').replace('a pattern: ', '').split(', ');
  const len = [2, 3].find((l) => shapes.length >= 2 * l && shapes.every((v, i) => v === shapes[i % l]))!;
  const ans = shapes[shapes.length % len]!;
  await page.locator('.shapebtn:not([aria-label="' + ans + '"])').first().click();
  await expect(feedback(page)).toHaveText('Say the pattern out loud. Where does it start again?');
  await page.getByRole('button', { name: ans, exact: true }).click();
  await expect(feedback(page)).toHaveText('Woof! The pattern starts again.');
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

for (const [level, title] of [[2, 'Steps of one, two and ten'], [6, 'Steps of two, five and ten']] as const) {
  test(`${title}: hops shown, what comes next; a miss writes the size on each hop`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'skip', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    const seq = (await sequence(page)).filter((n): n is number => n !== null);
    const step = seq[1]! - seq[0]!, ans = seq.at(-1)! + step;
    if (level === 2) await expect(page.getByTestId('hopline').locator('.hop')).toHaveCount(seq.length - 1);
    else await expect(page.locator('.hsq .was')).toHaveCount(seq.length); // the landings are tinted
    await wrongChoice(page, ans).click();
    await expect(feedback(page)).toHaveText('Look at the hops. How big is each one?');
    await expect(page.getByTestId('sequence').locator('.gapsize').first()).toHaveText(step > 0 ? `+${step}` : `−${-step}`);
    await choice(page, ans).click();
    await expect(feedback(page)).toHaveText(said(step, [...seq, ans]));
    if (level === 2) await expect(page.getByTestId('hopline').locator('.hop.new')).toHaveCount(1);
    else await expect(page.locator('.hsq .here')).toHaveText(String(ans));
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

for (const level of [3, 7]) {
  test(`hops as numbers only, typed (${level === 3 ? 'to 20' : 'to 100'}); the picture after a miss`, async ({ page }) => {
    await openGame(page, 'skip', level);
    const seq = (await sequence(page)).filter((n): n is number => n !== null);
    const step = seq[1]! - seq[0]!, ans = seq.at(-1)! + step;
    await expect(page.locator('[data-testid=hopline], .hsq')).toHaveCount(0);
    await type(page, ans === 0 ? 1 : ans - 1 < 0 ? ans + 1 : ans - 1);
    await expect(feedback(page)).toHaveText('Look at the hops. How big is each one?');
    await expect(page.locator('[data-testid=hopline], .hsq')).toHaveCount(1);
    await type(page, ans);
    await expect(feedback(page)).toHaveText(said(step, [...seq, ans]));
  });
}

test('Odd and even to 20: counters paired up; a miss marks the one left over', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'skip', 4);
  await expect(page.getByTestId('title')).toHaveText('Odd and even to 20');
  const n = Number(await page.getByTestId('prompt').innerText());
  const rows = page.locator('.rows2');
  expect(Number(await rows.getAttribute('data-top')) + Number(await rows.getAttribute('data-bottom'))).toBe(n);
  await expect(rows.locator('.lone')).toHaveCount(0);
  const ans = n % 2 ? 'Odd' : 'Even', other = n % 2 ? 'Even' : 'Odd';
  await page.getByRole('button', { name: other, exact: true }).click();
  await expect(feedback(page)).toHaveText('Pair them up. If one is left over, the number is odd.');
  await expect(rows.locator('.lone')).toHaveCount(n % 2);
  await page.getByRole('button', { name: ans, exact: true }).click();
  await expect(feedback(page)).toHaveText(`Woof! ${n} is ${n % 2 ? 'odd. One is left over.' : 'even. Everything has a partner.'}`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

for (const [level, title] of [[5, 'Odd and even to 20'], [8, 'Odd and even to 100']] as const) {
  test(`${title}, the number only: a miss points at the ones`, async ({ page }) => {
    await openGame(page, 'skip', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    const n = Number(await page.getByTestId('prompt').innerText());
    await page.getByRole('button', { name: n % 2 ? 'Even' : 'Odd', exact: true }).click();
    await expect(feedback(page)).toHaveText('Look at the ones. Even numbers end in 0, 2, 4, 6 or 8.');
    await expect(page.locator('.onesmark')).toHaveCount(1);
    await page.getByRole('button', { name: n % 2 ? 'Odd' : 'Even', exact: true }).click();
    await expect(feedback(page)).toContainText(`Woof! ${n} is ${n % 2 ? 'odd' : 'even'}.`);
    await next(page);
    const m = Number(await page.getByTestId('prompt').innerText());
    await page.getByRole('button', { name: m % 2 ? 'Odd' : 'Even', exact: true }).click();
    await expect(bones(page)).toHaveCount(1);
  });
}

test('Number patterns: the missing number, typed; a miss shows the step between the numbers', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'skip', 9);
  await expect(page.getByTestId('title')).toHaveText('Number patterns');
  const seq = await sequence(page);
  const hole = seq.indexOf(null);
  expect([1, 2]).toContain(hole);
  const step = hole === 1 ? seq[3]! - seq[2]! : seq[1]! - seq[0]!;
  const ans = seq[hole - 1]! + step;
  await type(page, ans + 1);
  await expect(feedback(page)).toHaveText('Find the step from one number to the next. It is the same every time.');
  await expect(page.getByTestId('sequence').locator('.gapsize').first()).toHaveText(step > 0 ? `+${step}` : `−${-step}`);
  await type(page, ans);
  const all = seq.map((n) => n ?? ans);
  await expect(feedback(page)).toHaveText(said(step, all));
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
