import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
/** How many groups and how many in each, from the line under the question. */
async function groups(page: Page) {
  const m = /^(\d+) (?:plates, (\d+) bones on each|rows of (\d+)|groups of (\d+))$/.exec(await page.locator('.card.game .sub').innerText())!;
  const g = Number(m[1]), k = Number(m[2] ?? m[3] ?? m[4]);
  return { g, k, ans: g * k, steps: Array.from({ length: g }, (_, i) => (i + 1) * k) };
}
const said = (q: Awaited<ReturnType<typeof groups>>) => `Woof! ${q.steps.join(', ')}. ${q.g} × ${q.k} = ${q.ans}.`;

test('Equal groups, plates: the same number of bones on each; a miss counts the plates in steps', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'groups', 1);
  await expect(page.getByTestId('title')).toHaveText('Equal groups');
  const q = await groups(page);
  const plates = page.getByTestId('plates');
  await expect(plates.locator('.plate')).toHaveCount(q.g);
  await expect(plates.locator('.plate .ic')).toHaveCount(q.ans); // every bone is drawn
  for (let i = 0; i < q.g; i++) await expect(plates.locator('.plate').nth(i).locator('.ic')).toHaveCount(q.k);
  await wrongChoice(page, q.ans).click();
  await expect(feedback(page)).toHaveText('Count the groups in steps, one group at a time.');
  expect((await plates.locator('.running').allInnerTexts()).map(Number)).toEqual(q.steps); // 5, 10, 15 under the plates
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(said(q));
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Equal groups, rows and columns: read as adding the same number again and again', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'groups', 2);
  const q = await groups(page);
  await expect(page.getByTestId('prompt')).toHaveText(`${Array(q.g).fill(q.k).join(' + ')} = ?`);
  const array = page.getByTestId('array');
  await expect(array.locator('.arow')).toHaveCount(q.g);
  await expect(array.locator('.adots i')).toHaveCount(q.ans);
  await wrongChoice(page, q.ans).click();
  expect((await array.locator('.running').allInnerTexts()).map(Number)).toEqual(q.steps);
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(said(q));
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

for (const [level, title] of [[3, 'Equal groups'], [5, 'Times tables']] as const) {
  test(`${title}, in her head: "3 × 5", typed; the rows after a miss`, async ({ page }) => {
    await openGame(page, 'groups', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    for (let i = 0; i < 6; i++) {
      const q = await groups(page);
      await expect(page.getByTestId('prompt')).toHaveText(`${q.g} × ${q.k} = ?`);
      await expect(page.getByTestId('array')).toHaveCount(0);
      if (i === 0) {
        await type(page, q.ans + 1);
        await expect(feedback(page)).toHaveText('Count the groups in steps, one group at a time.');
        await expect(page.getByTestId('array').locator('.arow')).toHaveCount(q.g);
      }
      await type(page, q.ans);
      await expect(feedback(page)).toHaveText(said(q));
      await next(page);
    }
    await expect(page.getByTestId('end')).toContainText('Oreo got 5 bones.');
    await fitsTheScreen(page);
  });
}

test('Times tables: the 1, 2, 5 and 10 tables with the rows to count in steps', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'groups', 4);
  await expect(page.getByTestId('title')).toHaveText('Times tables');
  const q = await groups(page);
  expect([1, 2, 5, 10]).toContain(q.k);
  await expect(page.getByTestId('array').locator('.adots i')).toHaveCount(q.ans);
  await choice(page, q.ans).click();
  await expect(feedback(page)).toHaveText(said(q));
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
