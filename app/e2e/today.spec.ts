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
  // She meets Oreo here. Without the switch in the parents' area, Star is not mentioned.
  await expect(intro.getByTestId('intro')).toHaveText('This is Oreo. She loves bones and numbers, and she is going to learn with you.');
  await expect(intro).toContainText(/\d+ questions for Amani\./);
  await fitsTheScreen(page);
  const questions = Number(/(\d+) questions/.exec(await intro.innerText())![1]);
  expect(questions).toBeGreaterThanOrEqual(4);
  expect(questions).toBeLessThanOrEqual(10);

  await intro.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('title')).toHaveText('Let’s see what you know');
  await expect(page.locator('.dots > span')).toHaveCount(questions);
  // One question per unit, each at its lesson's last step. The first is counting: bones that are moved.
  await expect(game(page)).toHaveAttribute('data-lesson', 's1-count');
  await expect(game(page)).toHaveAttribute('data-step', '2');
  const n = await page.getByTestId('field').locator('.fbone').count();
  await page.getByRole('button', { name: 'Move them' }).click();
  await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(game(page)).not.toHaveAttribute('data-lesson', 's1-count');

  // Leaving: nothing is marked, and the check is offered again.
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(intro).toBeVisible();
  expect((await saved(page)).child.lessons).toEqual({});

  // Skipped: she starts at the beginning, and is not asked again.
  await intro.getByRole('button', { name: /skip/ }).click();
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of Count to 20. About ten minutes.');
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
  await expect(page.getByTestId('today-text')).toHaveText(/^A warm-up, then .+\. About ten minutes\.$/);
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  // No card before the warm-up: it always comes first.
  await expect(page.getByTestId('title')).toHaveText('Warm-up: a mix of what you know');
  await expect(page.getByTestId('choice')).toHaveCount(0);
});

test('the path is a garden: a stone per lesson, a part of the garden per unit, and each stone says where it stands', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { lessons: { 's1-see': mastered(), 's1-ten': { step: 1, rating: 1, answers: 12 } }, soundOff: true });
  await page.goto('/');
  const garden = page.getByTestId('garden');
  await expect(garden.locator('.plot')).toHaveCount(14);
  await expect(garden.locator('.stone')).toHaveCount(41);
  await expect(garden.locator('.plot').first().locator('.post')).toHaveText('Stage 1: Counting');

  const see = garden.locator('[data-lesson=s1-see]');
  await expect(see).toHaveAttribute('data-status', 'mastered');
  await expect(see.locator('.mark .ic.paw')).toHaveCount(1);
  await expect(see).toContainText('Mastered. It comes back in the warm-ups.');
  // Oreo waits on the next stone of the path, which is the lesson today's games are about, and nowhere else.
  await expect(garden.locator('.herepup')).toHaveCount(1);
  const here = garden.locator('.stone', { has: page.locator('.herepup') });
  await expect(here).toHaveAttribute('data-status', 'open');
  await expect(here).toHaveAttribute('data-next', 'true');
  await expect(page.getByTestId('today-text')).toContainText((await here.locator('strong').innerText()).trim()); // the lesson today's games name
  // A lesson begun under the earlier rules, further on than the path has got, waits behind its padlock.
  await expect(garden.locator('[data-lesson=s1-ten]')).toContainText('Further along the path.');
  await expect(garden.locator('[data-lesson=s2-place]')).toContainText('Further along the path.');
  await expect(garden.locator('[data-status=coming]')).toHaveCount(0); // every lesson is built

  // Every stone is big enough for a small finger, and the pictures have loaded.
  for (const id of ['s1-see', 's1-ten', 's2-place']) {
    const box = (await garden.locator(`[data-lesson=${id}]`).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(72);
    expect(box.width).toBeGreaterThanOrEqual(72);
  }
  await expect.poll(() => garden.locator('img').evaluateAll((all) => all.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('lessons mastered: Oreo learns a trick, it is named, and it stays among her things', async ({ page }) => {
  const errors = watch(page);
  const unit = ['s2-count', 's2-place', 's2-names', 's2-regroup'];
  // Five lessons mastered: the second and the fifth each bring a trick. Neither was collected (the app was closed, say).
  await seed(page, { lessons: Object.fromEntries(['s1-see', ...unit].map((id) => [id, mastered()])), tricks: false });
  await page.goto('/');
  // Still owed, and they come first.
  const reward = page.getByTestId('reward');
  await expect(reward).toHaveAttribute('data-reward', 'trick');
  await expect(reward).toHaveAttribute('data-slot', 'm2');
  await expect(reward.getByTestId('prompt')).toHaveText('Oreo has learnt a new trick for you!');
  // Oreo does her new trick, once, and it is named: on the screen and aloud.
  await expect(reward.locator('.oreoanim')).toHaveAttribute('aria-label', 'Oreo’s trick: High five');
  await expect(reward.locator('.oreoanim')).toHaveAttribute('data-anim', 'trick-high-five');
  await expect(reward.locator('.sub')).toHaveText('Oreo can give a high five!');
  await fitsTheScreen(page);
  await reward.getByRole('button', { name: 'Next' }).click();
  await expect(reward).toHaveAttribute('data-slot', 'm5');
  await expect(reward.locator('.sub')).toHaveText('Oreo can beg!');
  await reward.getByRole('button', { name: 'Next' }).click();
  // Home, with both tricks among Oreo's things; tapping one shows it. Nothing more is owed.
  await expect(reward).toHaveCount(0);
  const tricks = page.getByTestId('things-tricks');
  await expect(tricks.locator('button.trickbtn')).toHaveCount(2);
  await tricks.locator('button.trickbtn').first().click();
  await expect(page.getByTestId('trickshow').locator('.oreoanim')).toBeVisible();
  await page.reload();
  await expect(reward).toHaveCount(0);
  await expect(tricks.locator('button.trickbtn')).toHaveCount(2);
  expect((await saved(page)).rewards.tricks).toEqual({ m2: 'high-five', m5: 'beg' });
  expect(errors).toEqual([]);
});

test('no rewards for playing: a child with hundreds of answers and bones who has passed nothing has earned nothing', async ({ page }) => {
  await seed(page, { bones: 480, lessons: { 's1-count': { step: 0, rating: 0, answers: 200 } } });
  await page.goto('/');
  await expect(page.getByTestId('today-text')).toBeVisible();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await expect(page.getByTestId('things').locator('.thing:not(.not), button.trickbtn')).toHaveCount(0);
  expect((await saved(page)).rewards).toEqual({ treasures: {}, tricks: {}, awards: {} });
});

test('with the switch in the parents’ area on, Oreo is introduced as Star’s sister', async ({ page }) => {
  await seed(page, { checked: false });
  await page.addInitScript(() => localStorage.setItem('tens-and-ones.settings', JSON.stringify({ starsSister: true })));
  await page.goto('/');
  await expect(page.getByTestId('startcheck').getByTestId('intro')).toHaveText("This is Oreo, Star's sister. She loves bones and numbers, and she is going to learn with you.");
});

test('the voice comes in packs by lesson family: a round fetches what it needs, not the whole voice', async ({ page }) => {
  const fetched: string[] = [];
  page.on('request', (r) => { const m = /\/voice\/([a-z]+)\.mp3/.exec(r.url()); if (m) fetched.push(m[1]!); });
  await page.goto('/#try=money.1');
  await expect(page.locator('.card.game')).toBeVisible();
  await expect.poll(() => fetched.includes('money') && fetched.includes('core')).toBe(true);
  await page.waitForTimeout(800);
  // Nothing to do with money is not fetched.
  for (const other of ['stories', 'steps', 'parts', 'groups', 'place']) expect(fetched).not.toContain(other);
  const sizes = await page.evaluate(async () => {
    const index = await (await fetch('/voice/index.json')).json();
    return Promise.all((index.packs as string[]).map(async (p) => Number((await fetch(`/voice/${p}.mp3`, { method: 'HEAD' })).headers.get('content-length'))));
  });
  expect(sizes.length).toBeGreaterThanOrEqual(10);
  expect(Math.max(...sizes)).toBeLessThan(3_000_000); // no pack is the 7 MB the single file was
});
