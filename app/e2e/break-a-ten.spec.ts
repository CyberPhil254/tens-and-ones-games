import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

async function sum(page: Page) {
  const m = /^(\d+) − (\d+) =/.exec(await page.getByTestId('prompt').innerText())!;
  const a = Number(m[1]), b = Number(m[2]);
  return { a, b, r: a - b, bt: Math.floor(b / 10), bo: b % 10, ao: a % 10 };
}
const blocks = (page: Page) => page.locator('.stage .blocks');
const shows = (n: number) => new RegExp(`^${Math.floor(n / 10)} tens? and ${n % 10} ones?$`);
const btn = (page: Page, name: string) => page.getByRole('button', { name });
const chips = (page: Page) => page.getByTestId('chips');

/** Takes the tens and ones away with the buttons, breaking a ten when the ones run out. */
async function takeAway(page: Page, q: Awaited<ReturnType<typeof sum>>) {
  for (let i = 0; i < q.bt; i++) await btn(page, 'Take a ten').click();
  if (q.bo > q.ao) await btn(page, 'Break a ten').click();
  if (q.bo > q.ao) await expect(feedback(page)).toHaveText('One ten is now 10 ones.');
  for (let i = 0; i < q.bo; i++) await btn(page, 'Take a one').click();
  await expect(chips(page)).toHaveText('All taken away. How many are left?');
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.r));
}

test('Break a Ten level 1: take away whole tens', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'take', 1);
  const q = await sum(page);
  expect(q.bo).toBe(0);
  await expect(btn(page, 'Take a one')).toHaveCount(0);
  await expect(btn(page, 'Break a ten')).toHaveCount(0);
  await expect(chips(page)).toHaveText(`Still to take away:${q.bt === 1 ? '1 ten' : `${q.bt} tens`}`);
  await expect(page.locator('.choice')).toHaveCount(0); // nothing to answer until it is taken away

  for (let i = 0; i < q.bt; i++) await btn(page, 'Take a ten').click();
  await expect(chips(page)).toHaveText('All taken away. How many are left?');
  await wrongChoice(page, q.r).click();
  await expect(feedback(page)).toHaveText('Count what is left. Red tens in tens: 10, 20, 30. Then the blue ones.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
  await expect(blocks(page)).toHaveClass(/counted/);
  await choice(page, q.r).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.a} − ${q.b} = ${q.r}.`);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Break a Ten level 2: tens and ones, enough ones', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'take', 2);
  const q = await sum(page);
  expect(q.bo).toBeLessThanOrEqual(q.ao);
  await expect(btn(page, 'Break a ten')).toHaveCount(0);
  // One ten too many: the game says so and takes nothing. This is a remark, not a wrong answer.
  for (let i = 0; i < q.bt; i++) await btn(page, 'Take a ten').click();
  await btn(page, 'Take a ten').click();
  await expect(feedback(page)).toHaveText('You have taken all the tens.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'pointing');
  // The blocks themselves can be tapped too.
  await blocks(page).locator('.cube').first().click();
  for (let i = 1; i < q.bo; i++) await btn(page, 'Take a one').click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.r));
  await choice(page, q.r).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.a} − ${q.b} = ${q.r}.`);
  await expect(bones(page)).toHaveCount(1); // the remark did not cost the bone
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Break a Ten level 3: not enough ones, so a ten is broken', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'take', 3);
  const q = await sum(page);
  expect(q.bo).toBeGreaterThan(q.ao);
  for (let i = 0; i < q.bt; i++) await btn(page, 'Take a ten').click();
  for (let i = 0; i < q.ao; i++) await btn(page, 'Take a one').click();
  // The ones have run out.
  await btn(page, 'Take a one').click();
  await expect(feedback(page)).toHaveText('The ones are all gone! Break a ten into 10 ones.');
  await expect(btn(page, 'Break a ten')).toHaveClass(/pulse/);
  // The button pulses to draw the eye; the test tool would wait for it to hold still, a child would not.
  await btn(page, 'Break a ten').click({ force: true });
  await expect(feedback(page)).toHaveText('One ten is now 10 ones.');
  await expect(blocks(page).locator('.cube')).toHaveCount(10);
  // Breaking another when there are enough ones is refused, with the reason.
  await btn(page, 'Break a ten').click();
  await expect(feedback(page)).toHaveText('You have enough ones. Take away a one.');
  for (let i = 0; i < q.bo - q.ao; i++) await btn(page, 'Take a one').click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(q.r));
  await choice(page, q.r).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.a} − ${q.b} = ${q.r}. You broke a ten to get more ones.`);
  await expect(bones(page)).toHaveCount(1);
  await next(page);
  const r = await sum(page);
  await takeAway(page, r);
  await choice(page, r.r).click();
  await expect(bones(page)).toHaveCount(2);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Break a Ten level 4: in her head, the blocks only if she asks', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'take', 4);
  await expect(blocks(page)).toHaveCount(0);
  const q = await sum(page);
  await wrongChoice(page, q.r).click();
  await expect(feedback(page)).toHaveText('Take the tens away first, then the ones. Use the blocks if you like.');
  await choice(page, q.r).click();
  await expect(feedback(page)).toHaveText(`Woof! ${q.a} − ${q.b} = ${q.r}.`);
  await expect(paws(page)).toHaveCount(1);

  await next(page);
  const r = await sum(page);
  await btn(page, 'Use the blocks').click();
  await expect(blocks(page)).toHaveAttribute('aria-label', shows(r.a));
  await takeAway(page, r);
  await choice(page, r.r).click();
  await expect(paws(page)).toHaveCount(2); // the blocks cost the bone

  await next(page);
  const s = await sum(page);
  await choice(page, s.r).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
