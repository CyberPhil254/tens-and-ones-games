import { expect, test, type Page } from '@playwright/test';
import { collect, day, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

const garden = (page: Page) => page.getByTestId('garden');
const stone = (page: Page, id: string) => garden(page).locator(`.stone[data-lesson=${id}]`);
const statuses = (page: Page) => garden(page).locator('.stone').evaluateAll((all) => Object.fromEntries(all.map((e) => [e.getAttribute('data-lesson')!, e.getAttribute('data-status')!])));
const count = (all: Record<string, string>, status: string) => Object.values(all).filter((s) => s === status).length;
/** Passed once, on an earlier day: every step done, one more good day masters it. */
const passed = (steps: number) => ({ step: steps - 1, rating: 2, answers: 20, passedOn: [day(-1)] });

test('day one is a path, not a field: two stones are open, the next one is unmistakable, the rest are locked', async ({ page }) => {
  await seed(page, { soundOff: true });
  await page.goto('/');
  const all = await statuses(page);
  expect(Object.keys(all)).toHaveLength(41);
  expect(Object.entries(all).filter(([, s]) => s === 'open').map(([id]) => id)).toEqual(['s1-count', 's1-see']);
  expect(count(all, 'locked')).toBe(39);
  await expect(garden(page).locator('.stone.locked .ic.lock')).toHaveCount(39); // every locked stone shows a padlock

  // The next stone: the only one marked so, with Oreo standing on it, larger than any other.
  await expect(garden(page).locator('.stone[data-next]')).toHaveCount(1);
  const next = stone(page, 's1-count');
  await expect(next).toHaveAttribute('data-next', 'true');
  await expect(next).toContainText('Next. Step 1 of 3.');
  await expect(garden(page).locator('.herepup')).toHaveCount(1);
  await expect(next.locator('.herepup')).toHaveAttribute('data-pose', 'standing');
  const w = (id: string) => stone(page, id).locator('.stonepic').evaluate((e) => e.getBoundingClientRect().width);
  expect(await w('s1-count')).toBeGreaterThan((await w('s1-see')) + 15);
  expect(await w('s1-see')).toBe(await w('s1-zero'));
  // It is lit: a glow no other stone has.
  const glow = (id: string) => stone(page, id).locator('.stonepic > img').first().evaluate((e) => getComputedStyle(e).filter);
  expect(await glow('s1-count')).toContain('drop-shadow');
  expect(await glow('s1-count')).not.toBe(await glow('s1-see'));
  // Neither open stone is for free play, today's games done or not: they are still ahead of her.
  await expect(next).toBeDisabled();
  await expect(stone(page, 's1-see')).toBeDisabled();
  await expect(stone(page, 's1-see')).toHaveAttribute('data-steps', '0/3');
  await fitsTheScreen(page);
});

test('tapping a locked stone opens nothing: Oreo points at the stone that opens it and says so', async ({ page }) => {
  const errors = watch(page);
  await seed(page);
  await page.goto('/');
  await expect(page.getByTestId('pointsay')).toHaveCount(0);
  const far = stone(page, 's2-money'); // far down the path, with the next stone well out of view
  await far.scrollIntoViewIfNeeded();
  await expect(stone(page, 's1-count')).not.toBeInViewport();
  await far.click();
  // Still the home screen: no lesson has started.
  await expect(page.locator('.card.game')).toHaveCount(0);
  await expect(page.getByTestId('today-text')).toBeVisible();
  // Oreo, on the next stone, points; the words stand beside her; and the stone has come into view.
  const next = stone(page, 's1-count');
  await expect(next.locator('.herepup')).toHaveAttribute('data-pose', 'pointing');
  await expect(page.getByTestId('pointsay')).toHaveText('First finish this one.');
  await expect(next).toBeInViewport();
  const say = (await page.getByTestId('pointsay').boundingBox())!, box = (await next.boundingBox())!;
  expect(Math.abs(say.y - (box.y + box.height))).toBeLessThan(40); // right under that stone
  // Every locked stone answers the same way, and the sentence is a recorded one (an unrecorded one would be reported).
  await stone(page, 's1-zero').click();
  await expect(page.getByTestId('pointsay')).toHaveText('First finish this one.');
  await expect(page.locator('.card.game')).toHaveCount(0);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('passed stones show how far each has come: steps done, then a paw when mastered', async ({ page }) => {
  await seed(page, { soundOff: true, lessons: { 's1-count': mastered(), 's1-see': passed(3), 's1-zero': { step: 1, rating: 1, answers: 8, passedOn: [] } } });
  await page.goto('/');
  // Mastered: a paw (and its treasure). Passed once: every step filled. On the way: the steps done so far.
  await expect(stone(page, 's1-count')).toHaveAttribute('data-status', 'mastered');
  await expect(stone(page, 's1-count').locator('.mark .ic.paw')).toHaveCount(1);
  await expect(stone(page, 's1-see')).toHaveAttribute('data-status', 'passed');
  await expect(stone(page, 's1-see')).toHaveAttribute('data-steps', '3/3');
  await expect(stone(page, 's1-see').locator('.pips i')).toHaveCount(3);
  await expect(stone(page, 's1-see').locator('.pips i.on')).toHaveCount(3);
  await expect(stone(page, 's1-see')).toContainText('Every step done. Once more to master it.');
  await expect(stone(page, 's1-zero')).toHaveAttribute('data-status', 'open');
  await expect(stone(page, 's1-zero')).toHaveAttribute('data-next', 'true');
  await expect(stone(page, 's1-zero')).toHaveAttribute('data-steps', '1/2');
  await expect(stone(page, 's1-zero').locator('.pips i.on')).toHaveCount(1);
  await expect(stone(page, 's1-zero')).toContainText('Next. Step 2 of 2.');
  // The alternative beside the next stone, and nothing else, is open too.
  const all = await statuses(page);
  expect(Object.entries(all).filter(([, s]) => s === 'open').map(([id]) => id)).toEqual(['s1-zero', 's1-estimate']);
  // Today's games bring the passed lesson back first, to be mastered.
  await expect(page.getByTestId('today-text')).toContainText('See how many');
});

test('free play after today’s games is only for stones she has passed, never for what is still ahead', async ({ page }) => {
  const lessons = { 's1-count': mastered(), 's1-see': passed(3), 's1-zero': { step: 1, rating: 1, answers: 8, passedOn: [] } };
  // Before today's games: nothing on the path can be played.
  await seed(page, { soundOff: true, lessons });
  await page.goto('/');
  await expect(page.getByTestId('free-note')).toHaveText('Free play opens when today’s games are done.');
  for (const id of ['s1-count', 's1-see', 's1-zero', 's1-estimate']) await expect(stone(page, id)).toBeDisabled();

  // After them.
  await page.evaluate((d) => { const k = 'tens-and-ones.profile.child-test'; const p = JSON.parse(localStorage.getItem(k)!); p.child.doneOn = d; localStorage.setItem(k, JSON.stringify(p)); }, day());
  await page.reload();
  await collect(page); // today's games finished for the first time: the welcome treasure
  await expect(page.getByTestId('free-note')).toHaveText('Tap a stone you have passed to play it again.');
  await expect(stone(page, 's1-count')).toBeEnabled(); // mastered
  await expect(stone(page, 's1-see')).toBeEnabled(); // passed once
  await expect(stone(page, 's1-zero')).toBeDisabled(); // the next stone: ahead
  await expect(stone(page, 's1-estimate')).toBeDisabled(); // the alternative: ahead
  // A locked stone still only makes Oreo point.
  await stone(page, 's1-names').click();
  await expect(page.locator('.card.game')).toHaveCount(0);
  await expect(page.getByTestId('pointsay')).toBeVisible();
  // A passed stone plays its lesson, and playing it changes nothing on the path.
  const before = (await saved(page)).child.lessons;
  await stone(page, 's1-see').click();
  await expect(page.locator('.card.game')).toHaveAttribute('data-lesson', 's1-see');
  await page.getByRole('button', { name: '← Home' }).click();
  expect((await saved(page)).child.lessons).toEqual(before);
});

test('a Stage 2 child starts in Stage 2: she sees the Stage 2 path, and Stage 1 is one folded banner', async ({ page }) => {
  // Added as a parent adds her, with the starting check skipped: she starts in the stage that was picked.
  await page.goto('/');
  await page.getByLabel('A nickname').fill('Amani');
  await page.getByRole('button', { name: 'Stage 2' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  // The check looks for gaps: two questions about each of the twelve Stage 1 lessons Stage 2 builds on.
  await expect(page.getByTestId('startcheck')).toContainText('24 questions for Amani.');
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expect(page.getByTestId('today-text')).toHaveText('A warm-up, then Pack in tens. About ten minutes.'); // her Stage 1 lessons are known, so there is a warm-up from the first day

  // The path she sees is Stage 2 (and the stretch lessons after it): no Stage 1 stone stands on it.
  const visible = await garden(page).locator('.stone').evaluateAll((all) => all.filter((e) => e.checkVisibility({ contentVisibilityAuto: true })).map((e) => e.getAttribute('data-lesson')!));
  expect(visible).toHaveLength(23);
  expect(visible.filter((id) => id.startsWith('s1-'))).toEqual([]);
  expect(visible[0]).toBe('s2-count');
  await expect(stone(page, 's2-count')).toHaveAttribute('data-next', 'true');
  await expect(stone(page, 's2-count').locator('.herepup')).toHaveCount(1);
  expect(Object.entries(await statuses(page)).filter(([, st]) => st === 'open').map(([id]) => id)).toEqual(['s2-count', 's2-names']);

  // Stage 1 is one banner, folded. A parent can open it: every Stage 1 lesson is there, known, to be checked in a warm-up.
  const year1 = page.getByTestId('year1');
  await expect(year1.locator('summary')).toHaveText('Year 1: known');
  await expect(year1).not.toHaveAttribute('open', '');
  await expect(stone(page, 's1-count')).toBeHidden();
  await year1.locator('summary').click();
  await expect(year1.locator('.stone')).toHaveCount(18);
  await expect(year1.locator('.stone[data-status=known]')).toHaveCount(18);
  await expect(stone(page, 's1-add')).toBeVisible();
  await expect(stone(page, 's1-add')).toContainText('Known, to be checked in a warm-up.');
  await expect(stone(page, 's1-add').locator('.mark .ic.tick')).toHaveCount(1);
  await fitsTheScreen(page);
  // Nothing was earned by any of this.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('tens-and-ones.profile.'))!)!));
  expect(stored.rewards).toEqual({ treasures: {}, tricks: {}, awards: {} });
  expect(stored.profile.stage).toBe(2);
});

test('a gap is a quick step back: that one lesson stands on her path directly before the Stage 2 lesson that needs it', async ({ page }) => {
  // The check found that she lacks "Sums to 20" (both questions missed): it is not known, and starts at its second step.
  await seed(page, { stage: 2, soundOff: true, lessons: { 's1-calc20': { step: 1, from: 1, rating: 0, answers: 0, passedOn: [], back: true } } });
  await page.goto('/');
  // She still starts in Stage 2.
  await expect(page.getByTestId('today-text')).toHaveText('A warm-up, then Pack in tens. About ten minutes.'); // her Stage 1 lessons are known, so there is a warm-up from the first day
  await expect(stone(page, 's2-count')).toHaveAttribute('data-next', 'true');
  // The step back is on the Stage 2 path, in the part of the garden of the lesson that needs it, directly before it.
  const back = stone(page, 's1-calc20');
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute('data-back', 'true');
  await expect(back.locator('.backtag')).toHaveText('A quick step back');
  await expect(back).toHaveAttribute('data-status', 'locked'); // not yet: the path has not got there
  const inPlot = await garden(page).locator('[data-unit=s2-u4] .stone').evaluateAll((all) => all.map((e) => e.getAttribute('data-lesson')));
  expect(inPlot).toEqual(['s2-bonds', 's2-inverse', 's1-calc20', 's2-calc']);
  await expect(garden(page).locator('.stone[data-back]')).toHaveCount(1); // exactly that lesson, no other
  // It is not in the folded banner: the other seventeen Stage 1 lessons are.
  await expect(page.getByTestId('year1').locator('.stone')).toHaveCount(17);
  await expect(page.getByTestId('year1').locator('[data-lesson=s1-calc20]')).toHaveCount(0);
  await fitsTheScreen(page);
});

test('when the path gets there the step back is the next stone, at the step that fits, and the lesson that needs it waits', async ({ page }) => {
  const before = ['s2-count', 's2-place', 's2-names', 's2-regroup', 's2-see', 's2-estimate', 's2-compare', 's2-ordinal', 's2-round', 's2-skip', 's2-oddeven', 's2-sequence', 's2-bonds', 's2-inverse'];
  await seed(page, { stage: 2, soundOff: true, lessons: { ...Object.fromEntries(before.map((id) => [id, mastered()])), 's1-calc20': { step: 1, from: 1, rating: 0, answers: 0, passedOn: [], back: true } } });
  await page.goto('/');
  await collect(page);
  const back = stone(page, 's1-calc20');
  await expect(back).toHaveAttribute('data-next', 'true');
  await expect(back).toContainText('A quick step back');
  await expect(back).toContainText('Next. Step 2 of 3.'); // not step one
  await expect(back).toHaveAttribute('data-steps', '1/3');
  await expect(stone(page, 's2-calc')).toHaveAttribute('data-status', 'locked');
  await expect(page.getByTestId('today-text')).toContainText('Sums to 20');
});

test('an existing Stage 2 profile that one wrong answer had sent back to Stage 1 is placed again, and keeps what she earned by playing', async ({ page }) => {
  // As the earlier check left her: started at the first Stage 1 stone, has since mastered "Count to 20" by playing and
  // is half way through "See how many". She has bones and treasures.
  await seed(page, { stage: 2, soundOff: true, bones: 34, doneOn: day(-1), lessons: { 's1-count': mastered(), 's1-see': { step: 1, rating: 1, answers: 12, passedOn: [] } } });
  await page.goto('/');
  const before = await saved(page);
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '34 bones');
  // She starts in Stage 2 now.
  await expect(stone(page, 's2-count')).toHaveAttribute('data-next', 'true');
  await expect(page.getByTestId('today-text')).toContainText('Pack in tens');
  // The lesson she is in the middle of keeps its step; it is a quick step back before "See how many, new patterns", which needs it.
  await expect(stone(page, 's1-see')).toHaveAttribute('data-back', 'true');
  const inPlot = await garden(page).locator('[data-unit=s2-u2] .stone').evaluateAll((all) => all.map((e) => e.getAttribute('data-lesson')));
  expect(inPlot.slice(0, 2)).toEqual(['s1-see', 's2-see']);
  // What she mastered by playing is still mastered, with its paw, in the Year 1 banner; her treasures are still hers.
  await page.getByTestId('year1').locator('summary').click();
  await expect(stone(page, 's1-count')).toHaveAttribute('data-status', 'mastered');
  await expect(stone(page, 's1-count').locator('.mark .ic.paw')).toHaveCount(1);
  const things = page.getByTestId('things-treasures').locator('.thing:not(.not)');
  expect(await things.count()).toBeGreaterThan(0);
  // On the device nothing she earned has changed (nothing is even written until she plays).
  expect(await saved(page)).toEqual(before);
});

test('a lesson begun under the earlier rules, further on than the path has got, waits there with its step kept', async ({ page }) => {
  await seed(page, { soundOff: true, lessons: { 's1-add': { step: 2, rating: 2, answers: 30, passedOn: [] } } });
  await page.goto('/');
  await expect(stone(page, 's1-add')).toHaveAttribute('data-status', 'locked');
  expect(count(await statuses(page), 'open')).toBe(2);
  expect((await saved(page)).child.lessons['s1-add'].step).toBe(2); // nothing is taken away; it is there when she gets to it
});
