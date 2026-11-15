import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

/** "47 + 5 = ?" and what filling the ten means for it. */
async function sum(page: Page) {
  const m = /^(\d+) \+ (\d+) =/.exec(await page.getByTestId('prompt').innerText())!;
  const a = Number(m[1]), b = Number(m[2]), fill = 10 - (a % 10), nextTen = a + fill;
  return { a, b, fill, rest: b - fill, nextTen, sum: a + b };
}
const blocks = (page: Page) => page.locator('.stage .blocks');
const shows = (n: number) => new RegExp(`^${Math.floor(n / 10)} tens? and ${n % 10} ones?$`);

test('Fill the Ten level 1: the second number fills the ten exactly', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'fill', 1);
  const q = await sum(page);
  expect(q.rest).toBe(0);
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.a));
  await expect(page.locator('.pile .cube')).toHaveCount(q.b);

  await wrongChoice(page, q.sum).click();
  await expect(feedback(page)).toHaveText('Look at the blue tower. The yellow ones fit in the empty places.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
  await page.locator('.choice:not(:disabled)').filter({ hasNotText: new RegExp(`^${q.sum}$`) }).first().click();
  // The second miss shows it: the yellow ones fill the ten and it packs.
  await expect(feedback(page)).toHaveText('Watch the yellow ones fill up the ten. Now count the tens.');
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.sum));
  await choice(page, q.sum).click();
  await expect(feedback(page)).toHaveText(`Woof! The ones filled up a ten. ${q.a} + ${q.b} = ${q.sum}.`);
  await expect(paws(page)).toHaveCount(1);

  await next(page);
  const r = await sum(page);
  await choice(page, r.sum).click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(r.sum)); // shown after a right answer too
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Fill the Ten level 2: past the ten, in two guided steps', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'fill', 2);
  const q = await sum(page);
  expect(q.rest).toBeGreaterThan(0);
  await expect(page.locator('.card.game .sub')).toHaveText(`First fill the ten: ${q.a} + ? = ${q.nextTen}`);
  await expect(page.locator('.pad .choice')).toHaveCount(9);

  // Step 1: how many fill the ten.
  await wrongChoice(page, q.fill).click();
  await expect(feedback(page)).toHaveText('Count the empty places in the blue tower.');
  await choice(page, q.fill).click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.nextTen));
  await expect(page.locator('.pile .cube')).toHaveCount(q.rest);
  await expect(page.locator('.card.game .sub')).toHaveText(`${q.b} is ${q.fill} and ${q.rest}. Now ${q.nextTen} + ${q.rest} = ?`);
  await expect(feedback(page)).toBeEmpty();

  // Step 2: the ten and the rest.
  await expect(page.locator('.choices:not(.pad) .choice')).toHaveCount(4);
  await wrongChoice(page, q.sum).click();
  await expect(feedback(page)).toHaveText(`${q.nextTen} and ${q.rest} more. The tens stay, just add the ones.`);
  await choice(page, q.sum).click();
  await expect(feedback(page)).toHaveText(`Woof! First to ${q.nextTen}, then ${q.rest} more. ${q.a} + ${q.b} = ${q.sum}.`);
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.sum));
  await expect(paws(page)).toHaveCount(1);

  await next(page);
  const r = await sum(page);
  await choice(page, r.fill).click();
  await expect(page.locator('.choices:not(.pad) .choice')).toHaveCount(4);
  await choice(page, r.sum).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Fill the Ten level 3: the same sums in one step', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'fill', 3);
  const q = await sum(page);
  await wrongChoice(page, q.sum).click();
  await expect(feedback(page)).toHaveText(`Fill the ten first: ${q.a} + ${q.fill} = ${q.nextTen}. Then ${q.rest} more.`);
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.a)); // one miss: words only
  await page.locator('.choice:not(:disabled)').filter({ hasNotText: new RegExp(`^${q.sum}$`) }).first().click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.sum)); // two misses: it is shown
  await choice(page, q.sum).click();
  await expect(feedback(page)).toHaveText(`Woof! First to ${q.nextTen}, then ${q.rest} more. ${q.a} + ${q.b} = ${q.sum}.`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Fill the Ten level 4: in her head, a picture only if she asks', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'fill', 4);
  await expect(blocks(page)).toHaveCount(0);
  for (let i = 0; i < 4; i++) {
    const q = await sum(page);
    if (i === 0) {
      await wrongChoice(page, q.sum).click();
      await expect(feedback(page)).toHaveText(
        q.rest ? `Fill the ten first: ${q.a} + ${q.fill} = ${q.nextTen}. Then ${q.rest} more.` : `${q.a % 10} and ${q.fill} are friends of ten.`,
      );
    }
    if (i === 1) {
      await page.getByRole('button', { name: 'Show a picture' }).click();
      await expect(blocks(page)).toHaveClass(/sketch/); // lines and dots, half way to numbers only
    }
    await choice(page, q.sum).click();
    await expect(feedback(page)).toHaveText(
      q.rest ? `Woof! First to ${q.nextTen}, then ${q.rest} more. ${q.a} + ${q.b} = ${q.sum}.` : `Woof! ${q.a % 10} and ${q.b} make a new ten. ${q.a} + ${q.b} = ${q.sum}.`,
    );
    await next(page);
  }
  await expect(paws(page)).toHaveCount(2); // the miss and the picture each cost the bone
  await expect(bones(page)).toHaveCount(2);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
