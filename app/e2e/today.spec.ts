import { expect, test, type Page } from '@playwright/test';
import { feedback, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

const game = (page: Page) => page.locator('.card.game');
/** How many High Five shows, read as a screen reader would. */
async function shown(page: Page): Promise<number> {
  const label = await page.locator('.fiverow [role=img]').last().getAttribute('aria-label');
  return Number(/(\d+) (?:fingers|ones?|counters)/.exec(label ?? '')![1]);
}

test('the starting check: offered once, leaving it counts for nothing, a grown-up may skip it', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { checked: false });
  await page.goto('/');
  const intro = page.getByTestId('startcheck');
  await expect(intro.getByTestId('prompt')).toHaveText("Let's see what you already know. Just try your best.");
  await expect(intro).toContainText(/\d+ questions for Amani\./);
  await fitsTheScreen(page);
  const n = Number(/(\d+) questions/.exec(await intro.innerText())![1]);
  expect(n).toBeGreaterThanOrEqual(4);
  expect(n).toBeLessThanOrEqual(10);

  await intro.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('title')).toHaveText('Let’s see what you know');
  await expect(page.locator('.dots > span')).toHaveCount(n);
  // One question per lesson, each at the lesson's last step. The first is See how many, on the ten frame.
  await expect(game(page)).toHaveAttribute('data-lesson', 's1-see');
  await expect(game(page)).toHaveAttribute('data-step', '2');
  const v = await shown(page);
  await page.locator('.choice').filter({ hasText: new RegExp(`^${v}$`) }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(game(page)).not.toHaveAttribute('data-lesson', 's1-see');

  // Leaving: nothing is marked, and the check is offered again.
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(intro).toBeVisible();
  expect((await saved(page)).child.lessons).toEqual({});

  // Skipped: she starts at the beginning, and is not asked again.
  await intro.getByRole('button', { name: /skip/ }).click();
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of See how many. About ten minutes.');
  await page.reload();
  await expect(page.getByTestId('today-text')).toBeVisible();
  expect((await saved(page)).checked).toBe(true);
  expect(errors).toEqual([]);
});

test('fast wrong taps are guesses: Oreo asks her to look, the answers pause, the question does not count', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/#try=five.1');
  await expect(game(page)).toBeVisible();
  const v = await shown(page);
  for (const c of await page.locator('.choice').filter({ hasNotText: new RegExp(`^${v}$`) }).all()) await c.click();
  await expect(feedback(page)).toHaveText('Take a moment. Look again before you tap.');
  await expect(game(page)).toHaveAttribute('data-paused', 'true');
  // While it pauses the answers cannot be tapped.
  expect(await game(page).evaluate((e) => (e as HTMLElement).inert)).toBe(true);
  // Then a fresh question, with nothing won or lost.
  await expect(game(page)).not.toHaveAttribute('data-paused', 'true', { timeout: 6000 });
  await expect(feedback(page)).toBeEmpty();
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
  await expect(page.locator('.choice:not(:disabled)')).toHaveCount(4);
  const w = await shown(page);
  await page.locator('.choice').filter({ hasText: new RegExp(`^${w}$`) }).click();
  await expect(page.locator('.dots .star')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a slow wrong answer is not a guess: it is explained as always', async ({ page }) => {
  await page.goto('/#try=five.1');
  const v = await shown(page);
  const wrong = await page.locator('.choice').filter({ hasNotText: new RegExp(`^${v}$`) }).all();
  for (const c of wrong) {
    await page.waitForTimeout(1300);
    await c.click();
  }
  await expect(feedback(page)).not.toHaveText('Take a moment. Look again before you tap.');
  await expect(game(page)).not.toHaveAttribute('data-paused', 'true');
});

test('no choice card before the warm-up: the warm-up always comes first', async ({ page }) => {
  const all = ['s1-see', 's1-ten', 's2-count', 's2-place', 's2-names', 's2-regroup', 's2-skip', 's2-bonds', 's2-inverse', 's2-calc', 'x-fill', 'x-break'];
  await seed(page, { lessons: Object.fromEntries(all.map((id) => [id, mastered(id === 's2-calc' ? { rating: 0.2 } : {})])), soundOff: true });
  await page.goto('/');
  await expect(page.getByTestId('today-text')).toHaveText('A warm-up, then Find it on the line. About ten minutes.');
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  // No card before the warm-up: it always comes first.
  await expect(page.getByTestId('title')).toHaveText('Warm-up: a mix of what you know');
  await expect(page.getByTestId('choice')).toHaveCount(0);
});
