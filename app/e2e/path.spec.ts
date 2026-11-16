import { expect, test, type Page } from '@playwright/test';
import { day, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

const garden = (page: Page) => page.getByTestId('garden');
const stone = (page: Page, id: string) => garden(page).locator(`.stone[data-lesson=${id}]`);
const statuses = (page: Page) => garden(page).locator('.stone').evaluateAll((all) => Object.fromEntries(all.map((e) => [e.getAttribute('data-lesson')!, e.getAttribute('data-status')!])));
const count = (all: Record<string, string>, status: string) => Object.values(all).filter((s) => s === status).length;
/** Passed once, on an earlier day: every step done, one more good day masters it. */
const passed = (steps: number) => ({ step: steps - 1, rating: 2, answers: 20, passedOn: [day(-1)] });
/** Marked known by the starting check, not yet checked in a warm-up. */
const known = () => ({ step: 9, passedOn: [], mastered: day(-1), placed: true, reviews: 0, due: day(0), reviewMisses: 0, rating: 3, answers: 0, recent: [], slow: false });
const STAGE1 = ['s1-count', 's1-see', 's1-zero', 's1-estimate', 's1-names', 's1-teens', 's1-compare', 's1-ordinal', 's1-pattern', 's1-skip', 's1-oddeven', 's1-add', 's1-sub', 's1-ten', 's1-doubles', 's1-calc20', 's1-half', 's1-money'];

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

test('after the starting check: what is before her starting point is known, to be checked, and not a row of open stones', async ({ page }) => {
  await seed(page, { stage: 2, soundOff: true, lessons: Object.fromEntries(STAGE1.map((id) => [id, known()])), rewards: {} });
  await page.goto('/');
  const all = await statuses(page);
  for (const id of STAGE1) expect(all[id], id).toBe('known');
  expect(Object.entries(all).filter(([, s]) => s === 'open').map(([id]) => id)).toEqual(['s2-count', 's2-names']);
  expect(count(all, 'locked')).toBe(41 - 18 - 2);
  await expect(stone(page, 's1-add')).toContainText('Known, to be checked in a warm-up.');
  await expect(stone(page, 's1-add').locator('.mark .ic.tick')).toHaveCount(1);
  await expect(stone(page, 's1-add').locator('.mark .ic.paw')).toHaveCount(0); // not a paw: she has not shown it by playing
  await expect(stone(page, 's1-add').locator('.treasure')).toHaveCount(0);
  await expect(stone(page, 's2-count')).toHaveAttribute('data-next', 'true');
  await expect(stone(page, 's2-count').locator('.herepup')).toHaveCount(1);
  await expect(page.getByTestId('today-text')).toContainText('Pack in tens');
  // A gap in what she knew is where she starts: the path does not jump over it.
  await page.evaluate(() => { const k = 'tens-and-ones.profile.child-test'; const p = JSON.parse(localStorage.getItem(k)!); delete p.child.lessons['s1-sub']; localStorage.setItem(k, JSON.stringify(p)); });
  await page.reload();
  await expect(stone(page, 's1-sub')).toHaveAttribute('data-next', 'true');
  // Nothing else in that unit is ahead of her, so the stone beside it is the first one after: still two open, never more.
  expect(Object.entries(await statuses(page)).filter(([, s]) => s === 'open').map(([id]) => id)).toEqual(['s1-sub', 's2-count']);
});

test('a lesson begun under the earlier rules, further on than the path has got, waits there with its step kept', async ({ page }) => {
  await seed(page, { soundOff: true, lessons: { 's1-add': { step: 2, rating: 2, answers: 30, passedOn: [] } } });
  await page.goto('/');
  await expect(stone(page, 's1-add')).toHaveAttribute('data-status', 'locked');
  expect(count(await statuses(page), 'open')).toBe(2);
  expect((await saved(page)).child.lessons['s1-add'].step).toBe(2); // nothing is taken away; it is there when she gets to it
});
