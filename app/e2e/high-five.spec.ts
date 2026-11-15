import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any console error: a sentence without a recording is reported there too. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** How many are shown, read from the picture's own description, as a screen reader would. */
async function shown(page: Page): Promise<number> {
  const label = await page.locator('.fiverow [role=img]').last().getAttribute('aria-label');
  const m = /(\d+) (?:fingers|ones?|counters)/.exec(label ?? '');
  if (!m) throw new Error(`cannot read the picture: ${label}`);
  return Number(m[1]);
}
const choice = (page: Page, n: number) => page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) });
const explains = (n: number) =>
  n < 5 ? `${n}. You just saw it!` : n === 5 ? '5. One whole hand!' : n === 10 ? '5 and 5 make 10. Two whole hands!' : `5 and ${n - 5} make ${n}.`;

/** Answers the question on screen; with `missFirst`, taps a wrong number first. Returns the number shown. */
async function answer(page: Page, missFirst = false): Promise<number> {
  const n = await shown(page);
  if (missFirst) {
    const wrong = page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first();
    await wrong.click();
    await expect(wrong).toBeDisabled();
  }
  await choice(page, n).click();
  await expect(page.getByTestId('feedback')).toHaveText(`Woof! ${explains(n)}`);
  return n;
}
const level = (page: Page, l: number) => page.locator('.levels').getByRole('button', { name: String(l), exact: true });
const next = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)$/ }).click();

test("today's games for a new child: two rounds of High Five, levels, bones, and it is all kept", async ({ page }) => {
  const errors = watch(page);
  await page.goto('/');
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of High Five. About ten minutes.');
  await page.getByRole('button', { name: 'Play today’s games' }).click();

  // Round 1, level 1: fingers and the tower side by side, nothing hidden. All right first time.
  await expect(page.getByText('Game 1: High Five')).toBeVisible();
  await expect(level(page, 1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('prompt')).toHaveText('How many?');
  for (let i = 0; i < 6; i++) {
    await expect(page.locator('.fiverow .hands')).toBeVisible();
    await expect(page.locator('.fiverow .blocks')).toBeVisible();
    await expect(page.locator('.choice')).toHaveCount(4);
    await answer(page);
    await expect(page.locator('.cheer .pup[data-pose=happy]')).toBeVisible();
    await expect(page.locator('.dots .star')).toHaveCount(i + 1);
    await next(page);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('Brilliant!');
  await expect(end).toContainText('Oreo got 6 bones. Perfect! You jump up to level 3. Ready for the next one?');
  await end.getByRole('button', { name: 'Keep going' }).click();

  // Round 2, level 3: a ten frame, seen for a moment. One miss, so five bones and a paw.
  await expect(level(page, 3)).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 6; i++) {
    await expect(page.locator('.fiverow .frame')).toBeVisible();
    await expect(page.locator('.fiverow .hands')).toHaveCount(0);
    if (i === 2) {
      const n = await shown(page);
      await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first().click();
      await expect(page.getByTestId('feedback')).toHaveText('Do not count them all. The top row is 5. How many more?');
      await expect(page.locator('.cheer .pup[data-pose=not-yet]')).toBeVisible();
    }
    await answer(page);
    await expect(page.locator('.fiverow .hands')).toBeVisible(); // the fingers come back with the answer
    await next(page);
  }
  await expect(page.locator('.dots .done')).toHaveCount(1);
  await expect(end).toContainText('All done for today!');
  await expect(end).toContainText('Oreo got 5 bones. One more good round like this and the game is finished. Time to stop. See you tomorrow!');
  await end.getByRole('button', { name: 'Back to the start' }).click();

  // Home: today is done, 11 bones packed as a box of ten and one loose, level 3.
  const home = async () => {
    await expect(page.getByTestId('today-text')).toHaveText('Today’s games are done. Well done! See you tomorrow.');
    await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '11 bones');
    await expect(page.locator('.storecap')).toHaveText('1 box of ten and 1 bone. That is 11 bones!');
    await expect(page.getByRole('button', { name: /High Five/ })).toContainText('Level 3 of 3');
  };
  await home();
  await page.reload();
  await home();
  expect(errors).toEqual([]);
});

test('every level, right and wrong: the picture, the hint, the level buttons', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/');
  await page.getByRole('button', { name: /High Five/ }).click();

  // Level 1: a wrong tap gets a hint that says what to look for, and costs the bone, not the question.
  const n1 = await shown(page);
  await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n1}$`) }).first().click();
  await expect(page.getByTestId('feedback')).toHaveText('Do not count them all. The dark blue ones are 5. How many more?');
  await expect(page.getByRole('button', { name: /^(Next|Finish)$/ })).toHaveCount(0);
  await answer(page);
  await expect(page.locator('.dots .done')).toHaveCount(1);
  await expect(page.locator('.dots .star')).toHaveCount(0);

  // Level 2: the tower is covered after a moment; "Peek again" shows it again; it stays once answered.
  await level(page, 2).click();
  await expect(level(page, 2)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.dots .done')).toHaveCount(0); // a fresh round
  const flash = page.getByTestId('flash');
  await expect(flash.locator('.blocks')).toBeVisible();
  await expect(page.locator('.fiverow .hands')).toHaveCount(0);
  await expect(flash).toHaveClass(/covered/, { timeout: 4000 });
  await page.getByRole('button', { name: 'Peek again' }).click();
  await expect(flash).not.toHaveClass(/covered/);
  await expect(flash).toHaveClass(/covered/, { timeout: 4000 });
  const n2 = await answer(page, true);
  expect(n2).toBeGreaterThanOrEqual(3);
  await expect(flash).not.toHaveClass(/covered/);
  await expect(page.getByRole('button', { name: 'Peek again' })).toHaveCount(0);
  await expect(page.locator('.fiverow .hands')).toBeVisible();

  // Level 3: a ten frame.
  await level(page, 3).click();
  await expect(page.locator('.fiverow .frame')).toBeVisible();
  await answer(page);

  // The game fits the screen, and the level chosen is where the game starts next time.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: '← All games' }).click();
  await expect(page.getByRole('button', { name: /High Five/ })).toContainText('Level 3 of 3');
  expect(errors).toEqual([]);
});

test('a weak round moves down a level, and "Play again" starts there', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /High Five/ }).click();
  await level(page, 2).click();
  for (let i = 0; i < 6; i++) {
    await answer(page, i < 4); // two bones, four paws
    await next(page);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('Good trying!');
  await expect(end.locator('.pup')).toHaveAttribute('data-pose', 'proud');
  await expect(end).toContainText('Oreo got 2 bones. Next time we start with an easier level.');
  await end.getByRole('button', { name: 'Play again' }).click();
  await expect(level(page, 1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
});

test('without the voice pack the game is silent, playable, and offers to try again', async ({ page }) => {
  await page.route('**/voice/*.mp3', (r) => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: /High Five/ }).click();
  await expect(page.getByText('The voice did not load.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeHidden();
  await answer(page);

  await page.unroute('**/voice/*.mp3');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('The voice did not load.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeVisible();
});

test('Oreo listens while the question is read, then thinks, and reacts only to answers', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.toppup')).toHaveAttribute('data-pose', 'hello');
  await page.getByRole('button', { name: /High Five/ }).click();
  const oreo = page.locator('.cheer .pup');

  // The voice reads the question: she listens. When it has finished she thinks, and stays so.
  await expect(oreo).toHaveAttribute('data-pose', 'listening');
  await expect(oreo).toHaveAttribute('data-pose', 'thinking', { timeout: 15000 });
  const still = await oreo.evaluate((e) => getComputedStyle(e).animationName);
  expect(still).toBe('none');

  // A wrong answer: "not yet", with the explanation beside her, and no movement.
  const n = await shown(page);
  await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first().click();
  await expect(oreo).toHaveAttribute('data-pose', 'not-yet');
  expect(await oreo.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.getByTestId('feedback')).not.toBeEmpty();
  // She does not go back to listening while the hint is read out.
  await page.waitForTimeout(600);
  await expect(oreo).toHaveAttribute('data-pose', 'not-yet');

  // The right answer: happy, with one hop.
  await choice(page, n).click();
  await expect(oreo).toHaveAttribute('data-pose', 'happy');
  expect(await oreo.evaluate((e) => getComputedStyle(e).animationName)).toBe('hop');

  // Her pictures are loaded and shown whole.
  const img = oreo.locator('img');
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 100)).toBe(true);
});

test('with the sound off Oreo goes straight to thinking', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await page.getByRole('button', { name: /High Five/ }).click();
  await expect(page.locator('.cheer .pup')).toHaveAttribute('data-pose', 'thinking');
});

test('the end of a round: celebrating after a good one', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /High Five/ }).click();
  for (let i = 0; i < 6; i++) {
    await answer(page);
    await next(page);
  }
  await expect(page.getByTestId('end').locator('.pup')).toHaveAttribute('data-pose', 'celebrating');
});

test('sound off is remembered', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await expect(page.getByRole('button', { name: 'Sound off' })).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
});
