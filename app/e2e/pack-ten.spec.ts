import { expect, test, type Page } from '@playwright/test';

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
const open = async (page: Page, level: number) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Pack Ten/ }).click();
  await expect(page.getByText('Game 2: Pack Ten')).toBeVisible();
  if (level > 1) await page.locator('.levels').getByRole('button', { name: String(level), exact: true }).click();
};
const tensW = (t: number) => (t === 1 ? '1 ten' : `${t} tens`);
const onesW = (o: number) => (o === 1 ? '1 one' : `${o} ones`);
const explains = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}. ${Math.floor(n / 10) * 10} + ${n % 10} = ${n}.`;
const feedback = (page: Page) => page.getByTestId('feedback');
const blocks = (page: Page) => page.locator('.stage .blocks');

/** Packs the heap ten at a time and checks what is said on the way. Returns how many there were. */
async function packAll(page: Page): Promise<number> {
  const heap = page.getByTestId('heap');
  const n = await heap.locator('.cube').count();
  const tens = Math.floor(n / 10);
  for (let t = 1; t <= tens; t++) {
    await page.getByRole('button', { name: 'Pack 10' }).click();
    if (t < tens) {
      await expect(feedback(page)).toHaveText(`${tensW(t)}. Keep packing!`);
      await expect(page.locator('.cheer .pup')).toHaveAttribute('data-pose', 'pointing');
      await expect(blocks(page).locator('.rod')).toHaveCount(t);
      await expect(heap.locator('.cube')).toHaveCount(n - t * 10);
    }
  }
  // The last ones are fewer than ten: they stay ones, and only then is she asked.
  await expect(feedback(page)).toHaveText(`Only ${n % 10} left. Not enough for a ten, so they stay ones.`);
  await expect(page.getByTestId('prompt')).toHaveText('How many?');
  await expect(heap.locator('.cube')).toHaveCount(0);
  await expect(blocks(page)).toHaveAttribute('aria-label', `${tensW(tens)} and ${onesW(n % 10)}`);
  await expect(page.getByRole('button', { name: 'Pack 10' })).toHaveCount(0);
  return n;
}

for (const level of [1, 2]) {
  test(`level ${level}: pack a heap into tens, then say how many, wrong and right`, async ({ page }) => {
    const errors = watch(page);
    await open(page, level);
    await expect(page.getByTestId('prompt')).toHaveText('Pack them in tens');
    await expect(page.locator('.choice')).toHaveCount(0); // nothing to answer before it is packed
    const n = await packAll(page);
    expect(n).toBeGreaterThanOrEqual(level === 1 ? 11 : 31);
    expect(n).toBeLessThanOrEqual(level === 1 ? 39 : 69);
    expect(n % 10).not.toBe(0);

    await expect(page.locator('.choice')).toHaveCount(4);
    await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first().click();
    await expect(feedback(page)).toHaveText('Count the red tens: 10, 20, 30. Then add the ones.');
    await expect(page.locator('.cheer .pup')).toHaveAttribute('data-pose', 'not-yet');
    await expect(blocks(page)).toHaveClass(/counted/); // the counting labels appear as help

    await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
    await expect(feedback(page)).toHaveText(`Woof! ${explains(n)}`);
    await expect(page.locator('.dots .done')).toHaveCount(1);
    await page.getByRole('button', { name: 'Next' }).click();

    // A second question, right first time.
    const m = await packAll(page);
    await page.locator('.choice').filter({ hasText: new RegExp(`^${m}$`) }).click();
    await expect(feedback(page)).toHaveText(`Woof! ${explains(m)}`);
    await expect(page.locator('.dots .star')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('level 3: build a number from tens and ones', async ({ page }) => {
  const errors = watch(page);
  await open(page, 3);
  const n = Number((await page.getByTestId('prompt').innerText()).replace('Build ', ''));
  expect(n).toBeGreaterThanOrEqual(11);
  const ten = page.getByRole('button', { name: '+ a ten' });
  const one = page.getByRole('button', { name: '+ a one' });
  const done = page.getByRole('button', { name: 'Done' });

  // Done with nothing built: not enough, said with the number she built.
  await done.click();
  await expect(feedback(page)).toHaveText('You built 0. That is not enough yet.');

  // Ten ones pack themselves into a ten.
  for (let i = 0; i < 10; i++) await one.click();
  await expect(feedback(page)).toHaveText('Ten ones! They pack into a ten.');
  await expect(blocks(page)).toHaveAttribute('aria-label', '1 ten and 0 ones');

  // Too many, then start again.
  for (let i = 0; i < 9; i++) await ten.click();
  await expect(blocks(page).locator('.rod')).toHaveCount(9); // never past 99
  if (n < 90) {
    await done.click();
    await expect(feedback(page)).toHaveText('You built 90. That is too many. Start again.');
  }
  await page.getByRole('button', { name: 'Start again' }).click();
  await expect(blocks(page)).toHaveAttribute('aria-label', '0 tens and 0 ones');
  await expect(feedback(page)).toBeEmpty();

  // Build it properly.
  for (let i = 0; i < Math.floor(n / 10); i++) await ten.click();
  for (let i = 0; i < n % 10; i++) await one.click();
  await done.click();
  await expect(feedback(page)).toHaveText(`Woof! ${explains(n)}`);
  await expect(page.locator('.dots .done')).toHaveCount(1); // it took help, so a paw
  await expect(ten).toBeDisabled();

  // The next one right first time earns a bone.
  await page.getByRole('button', { name: 'Next' }).click();
  const m = Number((await page.getByTestId('prompt').innerText()).replace('Build ', ''));
  for (let i = 0; i < Math.floor(m / 10); i++) await ten.click();
  for (let i = 0; i < m % 10; i++) await one.click();
  await done.click();
  await expect(feedback(page)).toHaveText(`Woof! ${explains(m)}`);
  await expect(page.locator('.dots .star')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("today's games move on to Pack Ten once High Five is finished, with a warm-up first", async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('tens-and-ones.v1', JSON.stringify({ progress: { stars: { five: 20 }, level: { five: 3 }, done: { five: true }, pass: { five: 2 }, miss: {}, day: '', best: 0 }, attempts: [], soundOff: true })),
  );
  await page.reload();
  await expect(page.getByTestId('today-text')).toHaveText('A warm-up, then Pack Ten. About ten minutes.');
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  await expect(page.getByText('Warm-up: a mix of games you know')).toBeVisible();
  await expect(page.locator('.levels')).toHaveCount(0);
  await expect(page.locator('.dots > span')).toHaveCount(5);
  await expect(page.locator('.fiverow .frame')).toBeVisible(); // High Five at its own level, 3
});
