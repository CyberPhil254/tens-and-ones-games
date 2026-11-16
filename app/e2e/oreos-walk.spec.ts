import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, tensW, onesW, watch, wrongChoice } from './helpers';

const parts = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`;
const target = async (page: Page) => Number(/(\d+)/.exec(await page.getByTestId('prompt').innerText())![1]);
const lineShows = async (page: Page) => (await page.locator('.nline .hrod').count()) * 10 + (await page.locator('.nline .hcube').count());

test("Oreo's Walk level 1: read where she stands", async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'walk', 1);
  await expect(page.getByTestId('prompt')).toHaveText('Where is Oreo?');
  const n = await lineShows(page);
  await wrongChoice(page, n).click();
  await expect(feedback(page)).toHaveText('Count the red tens along the line: 10, 20, 30. Then add the blue ones.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
  await choice(page, n).click();
  await expect(feedback(page)).toHaveText(`Woof! ${parts(n)} along the line. That is ${n}.`);
  await expect(paws(page)).toHaveCount(1);
  await next(page);
  await choice(page, await lineShows(page)).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test("Oreo's Walk level 2: walk her there in tens and ones", async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'walk', 2);
  const n = await target(page);
  const jump = page.getByRole('button', { name: 'Jump 10' });
  const step = page.getByRole('button', { name: 'Step 1' });
  const done = page.getByRole('button', { name: 'Done' });

  await done.click();
  await expect(feedback(page)).toHaveText('Oreo is on 0. Walk a little further.');
  for (let i = 0; i < 12; i++) await jump.click(); // never past 100
  expect(await lineShows(page)).toBe(100);
  await done.click();
  await expect(feedback(page)).toHaveText('Oreo is on 100. That is too far. Go back to the start.');
  await page.getByRole('button', { name: 'Back to start' }).click();
  expect(await lineShows(page)).toBe(0);
  await expect(feedback(page)).toBeEmpty();

  for (let i = 0; i < Math.floor(n / 10); i++) await jump.click();
  for (let i = 0; i < n % 10; i++) await step.click();
  expect(await lineShows(page)).toBe(n);
  await done.click();
  await expect(feedback(page)).toHaveText(`Woof! ${parts(n)}. Oreo is on ${n}.`);
  await expect(paws(page)).toHaveCount(1);
  await expect(jump).toBeDisabled();

  await next(page);
  const m = await target(page);
  for (let i = 0; i < Math.floor(m / 10); i++) await jump.click();
  for (let i = 0; i < m % 10; i++) await step.click();
  await done.click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test("Oreo's Walk level 3: tap where a number belongs on a nearly empty line", async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'walk', 3);
  const tapAt = async (v: number) => {
    const bar = (await page.locator('.nl-bar').boundingBox())!;
    const hit = (await page.getByTestId('line-hit').boundingBox())!;
    await page.getByTestId('line-hit').click({ position: { x: bar.x - hit.x + (bar.width * v) / 100, y: hit.height / 2 } });
  };
  const n = await target(page);
  const far = n > 50 ? n - 30 : n + 30;
  await expect(page.locator('.nline')).toHaveClass(/sparse/);
  expect(await lineShows(page)).toBe(0); // no blocks to read the answer from

  await tapAt(far);
  await expect(feedback(page)).toHaveText('Not quite. Count the tens along the line: 10, 20, 30.');
  await expect(page.locator('.nline')).not.toHaveClass(/sparse/); // every ten is now written
  await tapAt(far);
  await expect(feedback(page)).toHaveText('Look at the blocks. Tap where they end.');
  expect(await lineShows(page)).toBe(n); // the blocks are laid out up to the number
  await tapAt(n);
  await expect(feedback(page)).toHaveText(`Woof! ${n} is here: ${parts(n)} along the line.`);
  await expect(paws(page)).toHaveCount(1);

  await next(page);
  const m = await target(page);
  await tapAt(m + (m < 90 ? 4 : -4)); // close enough counts
  await expect(feedback(page)).toHaveText(`Woof! ${m} is here: ${parts(m)} along the line.`);
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
