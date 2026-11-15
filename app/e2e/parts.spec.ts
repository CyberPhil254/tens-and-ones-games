import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
const FRAC: Record<string, number> = { 'Half of': 1 / 2, 'A quarter of': 1 / 4, 'Three quarters of': 3 / 4 };
async function ofSet(page: Page) {
  const m = /^(Half of|A quarter of|Three quarters of) (\d+) = \?$/.exec((await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' '))!;
  return { words: m[1]!, n: Number(m[2]), ans: Number(m[2]) * FRAC[m[1]!]! };
}

for (const [level, title, what, hint, said] of [
  [1, 'Halves', 'in half', 'Halves are two parts of the same size.', 'Two parts of the same size. Two halves make a whole.'],
  [4, 'Quarters', 'in quarters', 'Quarters are four parts of the same size.', 'Four parts of the same size. Four quarters make a whole.'],
] as const) {
  test(`${title}: which shape is cut ${what}; a miss lays the parts over each other`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'parts', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    await expect(page.getByTestId('prompt')).toHaveText(`Which one is cut ${what}?`);
    const shapes = page.getByTestId('cuts').locator('.cutbtn');
    await expect(shapes).toHaveCount(3);
    await expect(page.locator('.laid')).toHaveCount(0);
    // Find the fair one as the test of the maker does: tap until right, the first tap wrong on purpose if possible.
    await shapes.nth(0).click();
    if ((await feedback(page).innerText()).startsWith('Woof!')) {
      await expect(feedback(page)).toHaveText(`Woof! ${said}`);
    } else {
      await expect(feedback(page)).toHaveText(hint);
      await expect(page.locator('.laid')).toHaveCount(3); // every shape now shows its parts laid over each other
      // The fair one is the one whose laid bars all have the same length, and as many as asked for.
      const fair = await shapes.evaluateAll((all, into) => all.findIndex((b) => {
        const w = [...b.querySelectorAll('.laid i')].map((i) => Math.round(i.getBoundingClientRect().width));
        return w.length === into && w.every((x) => Math.abs(x - w[0]!) <= 1);
      }), level === 1 ? 2 : 4);
      expect(fair).toBeGreaterThan(0);
      await shapes.nth(fair).click();
      await expect(feedback(page)).toHaveText(`Woof! ${said}`);
      await expect(paws(page)).toHaveCount(1);
    }
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

for (const [level, groups] of [[2, 2], [5, 4]] as const) {
  test(`${level === 2 ? 'half' : 'a quarter'} of a set: a miss shares the counters into ${groups} groups`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'parts', level);
    const q = await ofSet(page);
    const set = page.getByTestId('set');
    await expect(set.locator('i')).toHaveCount(q.n);
    await expect(set).not.toHaveClass(/shared/);
    await wrongChoice(page, q.ans).click();
    await expect(feedback(page)).toContainText(`Share them into ${groups === 2 ? 'two' : 'four'} equal groups.`);
    await expect(set).toHaveAttribute('aria-label', `${q.n} counters shared into ${groups} groups of ${q.n / groups}`);
    await expect(set.locator('.sgroup.take i')).toHaveCount(q.ans); // the groups that are the answer are marked
    await choice(page, q.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${q.words} ${q.n} is ${q.ans}.`);
    await next(page);
    const q2 = await ofSet(page);
    await choice(page, q2.ans).click();
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

for (const level of [3, 7]) {
  test(`${level === 3 ? 'half' : 'quarters'} of a number in her head: typed; the set shared out after a miss`, async ({ page }) => {
    await openGame(page, 'parts', level);
    const q = await ofSet(page);
    await expect(page.getByTestId('set')).toHaveCount(0);
    await type(page, q.ans + 1);
    await expect(feedback(page)).toContainText('Share them into');
    await expect(page.getByTestId('set')).toHaveClass(/shared/);
    await type(page, q.ans);
    await expect(feedback(page)).toHaveText(`Woof! ${q.words} ${q.n} is ${q.ans}.`);
  });
}

test('the bar from 0 to 1: tap a quarter, a half or three quarters; say how much is yellow', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await openGame(page, 'parts', 6);
  await expect(page.getByTestId('title')).toHaveText('Quarters');
  const seen = new Set<string>();
  const Q: Record<string, number> = { 'a quarter': 1, 'one half': 2, 'three quarters': 3 };
  for (let round = 0; round < 4 && seen.size < 2; round++) {
    for (let i = 0; i < 6; i++) {
      const t = await page.getByTestId('prompt').innerText();
      const bar = page.getByTestId('bar');
      await expect(bar.locator('.fcells i')).toHaveCount(4);
      if (t.startsWith('Tap ')) {
        const k = Q[t.slice(4)]!;
        if (!seen.has('bar')) {
          await bar.locator('.fpoint').nth(k === 1 ? 1 : 0).click(); // a wrong cut
          await expect(feedback(page)).toHaveText('The bar is cut into four equal parts. Count the parts from the start.');
          await expect(bar.locator('.fpoint').nth(1)).toHaveText('½'); // the cuts are now named
          const box = (await bar.locator('.fpoint').first().boundingBox())!;
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(72);
        }
        await bar.locator('.fpoint').nth(k - 1).click();
        await expect(feedback(page)).toHaveText(`Woof! That is ${t.slice(4)}.`);
        seen.add('bar');
      } else {
        expect(t).toBe('How much is yellow?');
        const k = await bar.locator('.fcells i.on').count();
        const word = Object.keys(Q).find((w) => Q[w] === k)!;
        if (!seen.has('shade')) {
          await page.locator('.wordbtn').filter({ hasNotText: word }).first().click();
          await expect(feedback(page)).toHaveText('The bar is cut into four equal parts. Count the yellow parts.');
        }
        await page.getByRole('button', { name: word, exact: true }).click();
        await expect(feedback(page)).toHaveText(k === 2 ? 'Woof! Two quarters are the same as one half.' : `Woof! That is ${word}.`);
        seen.add('shade');
      }
      await fitsTheScreen(page);
      await next(page);
    }
    await page.getByRole('button', { name: 'Play again' }).click();
  }
  expect([...seen].sort()).toEqual(['bar', 'shade']);
  expect(errors).toEqual([]);
});
