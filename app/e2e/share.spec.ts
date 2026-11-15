import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
async function sum(page: Page) {
  const m = /^(\d+) bones, (?:(\d+) bowls|in groups of (\d+))$/.exec(await page.locator('.card.game .sub').first().innerText())!;
  const n = Number(m[1]), by = Number(m[2] ?? m[3]);
  return { n, by, ans: n / by, kind: m[2] ? 'share' : 'group' };
}

test('Fair shares, step 1: she deals the bones out herself, then says how many each bowl has', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'share', 1);
  await expect(page.getByTestId('title')).toHaveText('Fair shares');
  const q = await sum(page);
  const heap = page.locator('.heap'), bowl = page.locator('.bowl');
  await expect(page.getByTestId('prompt')).toHaveText('Share them out');
  await expect(heap.locator('.ic')).toHaveCount(q.n);
  await expect(bowl).toHaveCount(q.by);
  await expect(page.locator('.choice')).toHaveCount(0); // no answers until the bones are shared out
  for (let r = 1; r <= q.ans; r++) {
    await page.getByRole('button', { name: 'Give one to each bowl' }).click();
    await expect(heap.locator('.ic')).toHaveCount(q.n - r * q.by);
    for (let b = 0; b < q.by; b++) await expect(bowl.nth(b).locator('.ic')).toHaveCount(r); // always the same in every bowl
  }
  await expect(page.getByRole('button', { name: 'Give one to each bowl' })).toHaveCount(0);
  await expect(page.getByTestId('prompt')).toHaveText('How many in each bowl?');
  await wrongChoice(page, q.ans).click();
  await expect(feedback(page)).toHaveText('Deal them out: one for each bowl, again and again.');
  // The dealing is replayed from the start.
  await expect(page.getByTestId('each')).toHaveText(`${q.ans} in each bowl`, { timeout: 8000 });
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.n} shared between ${q.by} is ${q.ans} each. ${q.n} ÷ ${q.by} = ${q.ans}.`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Fair shares, step 2: groups of a size; a miss rings the groups and counts them', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'share', 2);
  const q = await sum(page);
  expect(q.kind).toBe('group');
  const pic = page.getByTestId('grouping');
  await expect(pic.locator('.ic')).toHaveCount(q.n);
  await expect(pic).not.toHaveClass(/ringed/);
  // Before she answers the bones are one plain row: nothing shows the groups.
  expect(await pic.locator('.grp').first().evaluate((e) => getComputedStyle(e).display)).toBe('contents');
  await expect(pic.locator('.running').first()).toBeHidden();
  await wrongChoice(page, q.ans).click();
  await expect(feedback(page)).toHaveText('Make the groups, then count the groups.');
  await expect(pic).toHaveClass(/ringed/);
  expect((await pic.locator('.running').allInnerTexts()).map(Number)).toEqual(Array.from({ length: q.ans }, (_, i) => i + 1));
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.n} in groups of ${q.by} makes ${q.ans} groups. ${q.n} ÷ ${q.by} = ${q.ans}.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Fair shares, step 3: in her head, typed; the picture after a miss', async ({ page }) => {
  await openGame(page, 'share', 3);
  for (let i = 0; i < 6; i++) {
    const q = await sum(page);
    await expect(page.getByTestId('prompt')).toHaveText(`${q.n} ÷ ${q.by} = ?`);
    await expect(page.locator('[data-testid=sharing], [data-testid=grouping]')).toHaveCount(0);
    if (i === 0) {
      await type(page, q.ans + 1);
      await expect(feedback(page)).not.toBeEmpty();
      await expect(page.locator('[data-testid=sharing], [data-testid=grouping]')).toHaveCount(1);
    }
    await type(page, q.ans);
    await expect(feedback(page)).toContainText(`${q.n} ÷ ${q.by} = ${q.ans}.`);
    await next(page);
  }
  await expect(page.getByTestId('end')).toContainText('Oreo got 5 bones.');
  await expect(bones(page)).toHaveCount(5);
});
