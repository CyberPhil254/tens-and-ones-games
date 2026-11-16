import { expect, test } from '@playwright/test';
import { day, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

/** A lesson the starting check marked as known, as an earlier version saved it. */
const known = (more: Record<string, unknown> = {}) => ({
  step: 9, passedOn: [], mastered: day(-3), placed: true, reviews: 0, due: day(20), reviewMisses: 0, rating: 3, answers: 0, recent: [], slow: false, ...more,
});
const UNIT = ['s2-count', 's2-place', 's2-names', 's2-regroup'];
const TRICKS = [
  ['high-five', 'High five', 'Oreo can give a high five!'], ['beg', 'Beg', 'Oreo can beg!'], ['spin', 'Spin', 'Oreo can spin!'],
  ['roll-over', 'Roll over', 'Oreo can roll over!'], ['play-bow', 'Play bow', 'Oreo can do a play bow!'], ['fetch', 'Fetch', 'Oreo can fetch!'],
] as const;
/** A child who has earned all six tricks. */
const sixTricks = { tricks: Object.fromEntries(['s1-u1', 's1-u2', 's1-u3', 's1-u4', 's1-u5', 's1-u6'].map((u, i) => [u, TRICKS[i]![0]])) };

test('a profile that got rewards from the starting check loses them, and is owed none', async ({ page }) => {
  const errors = watch(page);
  // As an earlier version left it: a whole unit known at the check, with four treasures and a trick for it.
  await seed(page, {
    lessons: Object.fromEntries(['s1-see', ...UNIT].map((id) => [id, known()])),
    rewards: { treasures: Object.fromEntries(['s1-see', ...UNIT].map((id) => [id, 'ball'])), tricks: { 's2-u1': 'spin' }, awards: { s1: 'rosette' } },
  });
  await page.goto('/');
  await expect(page.getByTestId('today-text')).toBeVisible();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await expect(page.getByTestId('rewardshelf')).toHaveCount(0);
  const garden = page.getByTestId('garden');
  await expect(garden.locator('.treasure')).toHaveCount(0);
  // She still knows the lessons: they are not taken away, only the rewards.
  for (const id of UNIT) await expect(garden.locator(`[data-lesson=${id}]`)).toHaveAttribute('data-status', 'mastered');
  await expect(garden.locator('[data-lesson=s2-count] .d')).toHaveText('You know this already. It comes back in the warm-ups.');
  // The next thing saved writes the cleaned rewards to the device.
  await page.getByRole('button', { name: /Sound o/ }).click();
  await page.reload();
  await expect(page.getByTestId('rewardshelf')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a unit she finished by playing keeps its trick, next to one that was only known', async ({ page }) => {
  await seed(page, {
    lessons: { ...Object.fromEntries(UNIT.map((id) => [id, mastered()])), 's2-bonds': known(), 's2-inverse': known(), 's2-calc': known() },
    rewards: { treasures: { 's2-count': 'ball', 's2-bonds': 'bed' }, tricks: { 's2-u1': 'spin', 's2-u4': 'beg' } },
  });
  await page.goto('/');
  // Three of the unit's treasures were never collected: those are still owed, and given first.
  for (let i = 0; i < 3; i++) {
    const reward = page.getByTestId('reward');
    await expect(reward).toHaveAttribute('data-reward', 'treasure');
    await reward.locator('.treasurecard').first().click();
    await reward.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await expect(page.getByTestId('rewardshelf').locator('.trickbtn')).toHaveCount(1);
  await expect(page.getByTestId('rewardshelf').locator('.trickbtn')).toHaveAttribute('data-trick', 'spin');
  const s = await saved(page);
  expect(Object.keys(s.rewards.tricks)).toEqual(['s2-u1']);
  expect(Object.keys(s.rewards.treasures).sort()).toEqual([...UNIT].sort());
});

test('every trick has its name under its picture, and the picture fits inside its frame', async ({ page }) => {
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('rewardshelf');
  await expect(shelf.locator('.trickbtn')).toHaveCount(6);
  await expect.poll(() => shelf.locator('img').evaluateAll((all) => all.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  for (const width of [320, 360, 400, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const [trick, name] of TRICKS) {
      const btn = shelf.locator(`[data-trick=${trick}]`);
      await expect(btn.locator('.trickname')).toHaveText(name);
      const b = (await btn.boundingBox())!, f = (await btn.locator('.trickframe').boundingBox())!, i = (await btn.locator('img').boundingBox())!, n = (await btn.locator('.trickname').boundingBox())!;
      const inside = (a: typeof b, o: typeof b) => a.x >= o.x - 0.5 && a.y >= o.y - 0.5 && a.x + a.width <= o.x + o.width + 0.5 && a.y + a.height <= o.y + o.height + 0.5;
      expect(inside(i, f), `${trick} picture inside its frame at ${width} px`).toBe(true);
      expect(inside(f, b) && inside(n, b), `${trick} frame and name inside the button at ${width} px`).toBe(true);
      expect(n.y, `${trick}: the name is under the picture`).toBeGreaterThanOrEqual(f.y + f.height - 0.5);
      // The whole picture is shown, not a cut-off part of it.
      expect(await btn.locator('img').evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
      expect(b.width).toBeGreaterThanOrEqual(72);
      expect(b.height).toBeGreaterThanOrEqual(72);
    }
    await fitsTheScreen(page);
  }
});

test('tapping a trick: Oreo says its name in a recorded sentence and makes one move, then is still', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('rewardshelf');
  const moves = new Set<string>();
  for (const [trick, name, says] of TRICKS) {
    await shelf.locator(`[data-trick=${trick}]`).click();
    const show = shelf.getByTestId('trickshow');
    await expect(show.locator('.sub')).toHaveText(says);
    const pic = show.locator('.rewardpic');
    await expect(pic).toHaveAttribute('alt', `Oreo’s trick: ${name}`);
    const a = await pic.evaluate((el) => { const c = getComputedStyle(el); return { name: c.animationName, times: c.animationIterationCount, ms: parseFloat(c.animationDuration) * 1000 }; });
    expect(a.name).toBe(`trick-${trick}`);
    expect(a.times).toBe('1');
    expect(a.ms).toBeLessThanOrEqual(1000);
    moves.add(a.name);
    // The move ends, and then nothing on the picture is moving.
    await expect.poll(() => pic.evaluate((el) => el.getAnimations().filter((x) => x.playState === 'running').length)).toBe(0);
    await fitsTheScreen(page);
  }
  expect(moves.size).toBe(6); // each trick has its own move
  // Tapping the same trick again does it again.
  await shelf.locator('[data-trick=fetch]').click();
  await expect.poll(() => shelf.locator('.rewardpic').evaluate((el) => el.getAnimations().length)).toBe(0);
  expect(errors).toEqual([]); // a sentence without a recording would be reported here
});

test('with reduced motion, a tapped trick is shown and named but does not move', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('rewardshelf');
  for (const [trick, , says] of TRICKS) {
    await shelf.locator(`[data-trick=${trick}]`).click();
    await expect(shelf.getByTestId('trickshow').locator('.sub')).toHaveText(says);
    expect(await shelf.locator('.rewardpic').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  }
});

test('the parents’ lock says what it is, and does not look like a lesson', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const gate = page.getByTestId('gate');
  await expect(gate.getByTestId('gate-why')).toHaveText('This part is for parents. Answer to open it.');
  // The explanation comes before the question.
  const why = (await gate.getByTestId('gate-why').boundingBox())!, q = (await gate.getByTestId('gate-question').boundingBox())!;
  expect(why.y + why.height).toBeLessThanOrEqual(q.y + 0.5);
  // No Oreo, none of a lesson's parts, and ordinary type instead of the children's lettering.
  await expect(page.locator('.pup, .card.game, .prompt, .ctl, .choice, .dots')).toHaveCount(0);
  for (const el of [gate.locator('h1'), gate.getByTestId('gate-question'), gate.getByRole('button', { name: 'Open' })]) {
    expect(await el.evaluate((e) => getComputedStyle(e).fontFamily)).not.toMatch(/Fredoka|Andika/);
  }
  await fitsTheScreen(page);
  await gate.getByRole('button', { name: 'Back to the game' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
});

test('“why this works” under a lesson opens its note without the lock, with a way on to the approach page', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { lessons: { 's1-see': mastered() } });
  await page.goto('/');
  const garden = page.getByTestId('garden');
  // Every lesson has the link; it is small and quiet next to the lesson itself.
  await expect(garden.locator('.whylink')).toHaveCount(await garden.locator('.stone').count());
  const link = garden.locator('[data-why=s1-teens]');
  await expect(link).toHaveText('For parents: why this works');
  const size = await link.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const title = await garden.locator('[data-lesson=s1-teens] strong').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(size).toBeLessThanOrEqual(13);
  expect(size).toBeLessThan(title);
  await fitsTheScreen(page);
  // It opens for a lesson that is still closed too, and before today's games are done: it changes nothing.
  await link.click();
  await expect(page.getByTestId('gate')).toHaveCount(0);
  const why = page.getByTestId('why');
  await expect(why).toHaveAttribute('data-lesson', 's1-teens');
  await expect(why.locator('h1')).toHaveText('Why this works: Ten and some more');
  await expect(why.getByTestId('why-text')).toHaveText('Every teen number is built as one ten and some ones, because the English names hide that. Children who built numbers from exact tens and ones placed numbers more accurately afterwards, in a small study.');
  await expect(why.getByTestId('why-source').locator('a')).toHaveText('Zhang & Okamoto 2017, building numbers from tens and ones');
  await expect(why.getByTestId('why-strength')).toHaveText('Promising: small or few studies');
  await expect(page.locator('.pup')).toHaveCount(0);
  await fitsTheScreen(page);
  // On to the approach page and back to the note, then back to the game. No lock anywhere.
  await why.getByRole('button', { name: 'How this app teaches' }).click();
  await expect(page.getByTestId('approach')).toBeVisible();
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(why).toHaveAttribute('data-lesson', 's1-teens');
  await why.getByRole('button', { name: 'Back to the game' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
  expect(await saved(page)).toMatchObject({ rewards: { treasures: { 's1-see': 'ball' } } }); // nothing was changed
  expect(errors).toEqual([]);
});

test('every lesson’s note opens from the garden', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  const ids = await page.getByTestId('garden').locator('.whylink').evaluateAll((all) => all.map((e) => (e as HTMLElement).dataset.why!));
  expect(ids).toHaveLength(41);
  for (const id of ids) {
    await page.getByTestId('garden').locator(`[data-why=${id}]`).click();
    await expect(page.getByTestId('why')).toHaveAttribute('data-lesson', id);
    await expect(page.getByTestId('why-text')).not.toBeEmpty();
    await expect(page.getByTestId('why-strength')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Back to the game' }).click();
  }
});
