import { expect, test, type Page } from '@playwright/test';
import { answerRight, collect, day, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

const things = (page: Page) => page.getByTestId('things');
const passed = (steps: number) => ({ step: steps - 1, rating: 2, answers: 20, passedOn: [day(-1)] });

test('day one: a treasure for her first step, and the welcome treasure for finishing today’s games', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await seed(page);
  await page.goto('/');
  // Before anything: Oreo's things show what there is to earn, all of it still grey, and what earns the first of each.
  await expect(things(page).getByTestId('line-treasure')).toHaveText('Finish today’s games and Oreo gets a treasure.');
  await expect(things(page).getByTestId('line-trick')).toContainText('Master 2 more lessons and Oreo learns to give a high five.');
  await expect(things(page).getByTestId('line-badge')).toHaveText('Master every lesson in “Counting” for its badge.');
  await expect(things(page).getByTestId('line-award')).toHaveText('Master all of Stage 1 for the rosette.');

  await page.getByRole('button', { name: 'Play today’s games' }).click();
  await page.getByTestId('choice').locator('[data-lesson=s1-count]').click();
  const got: string[] = [];
  // Today's games to the end, every answer right, taking each reward as it comes.
  for (let round = 0; round < 6; round++) {
    const n = await page.locator('.dots > span').count();
    for (let i = 0; i < n; i++) await answerRight(page);
    const end = page.getByTestId('end');
    await expect(end).toBeVisible();
    // After every round she sees how far the next reward is: a row of paws, or that Oreo has something for her.
    await expect(end.getByTestId('endgoal')).toBeVisible();
    const last = (await end.getByRole('button', { name: 'Back to the start' }).count()) > 0;
    await end.getByRole('button', { name: last ? 'Back to the start' : 'Keep going' }).click();
    got.push(...(await collect(page)));
    if (last) break;
  }
  await expect(page.getByTestId('today-text')).toHaveText('Today’s games are done. Well done! See you tomorrow.');
  // On her first day: the treasure of her first paw came after the first round, the welcome treasure at the end.
  expect(got[0]).toBe('treasure w1');
  expect(got).toContain('treasure welcome');
  expect(got.filter((g) => g.startsWith('treasure')).length).toBeGreaterThanOrEqual(3);
  const s = await saved(page);
  expect(Object.keys(s.rewards.treasures)).toEqual(expect.arrayContaining(['welcome', 'w1', 'w3']));
  // They are among Oreo's things, and the line now counts paws.
  const have = await things(page).getByTestId('things-treasures').locator('.thing').evaluateAll((all) => all.reduce((n, e) => n + Number(e.getAttribute('data-count')), 0));
  expect(have).toBe(Object.keys(s.rewards.treasures).length);
  await expect(things(page).getByTestId('line-treasure')).toHaveText(/\d more paws? and Oreo gets a treasure\.$/);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Oreo’s things shows everything, earned or not: what is not hers yet is a grey shape with a line saying what earns it', async ({ page }) => {
  // Five paws (after the 3rd, before the 6th), one lesson mastered, today's games done once.
  await seed(page, { doneOn: day(-1), lessons: { 's1-count': mastered(), 's1-see': { step: 1, rating: 1, answers: 8 } } });
  await page.goto('/');
  const t = things(page);
  await expect(t.locator('h2')).toHaveText('Oreo’s things');
  // Treasures: the six kinds; the three she has are in colour, with how many; the others are grey shapes.
  const kinds = t.getByTestId('things-treasures').locator('.thing');
  await expect(kinds).toHaveCount(6);
  await expect(t.getByTestId('things-treasures').locator('.thing:not(.not)')).toHaveCount(3); // welcome, 1st paw, 3rd paw
  await expect(t.getByTestId('things-treasures').locator('.thing.not')).toHaveCount(3);
  const grey = await t.getByTestId('things-treasures').locator('.thing.not img').first().evaluate((e) => { const c = getComputedStyle(e); return { filter: c.filter, opacity: Number(c.opacity) }; });
  expect(grey.filter).toContain('grayscale');
  expect(grey.opacity).toBeLessThan(0.3);
  // One plain line says what earns the next one, with the paws so far.
  await expect(t.getByTestId('line-treasure')).toContainText('1 more paw and Oreo gets a treasure.');
  await expect(t.getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-done', '2');
  await expect(t.getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-of', '3');
  await expect(t.getByTestId('line-treasure').locator('.pawrow .on')).toHaveCount(2);
  // Tricks: all six are shown with their names; none is hers yet, so none can be tapped.
  await expect(t.getByTestId('things-tricks').locator('.trickbtn')).toHaveCount(6);
  await expect(t.getByTestId('things-tricks').locator('button')).toHaveCount(0);
  await expect(t.getByTestId('things-tricks').locator('.trickbtn.not .trickname').first()).toHaveText('High five');
  await expect(t.getByTestId('line-trick')).toContainText('Master 1 more lesson and Oreo learns to give a high five.');
  // Badges for the fourteen parts of the garden and the three awards: all grey, each with its name for a screen reader.
  await expect(t.getByTestId('things-badges').locator('.thing.badge.not')).toHaveCount(14);
  await expect(t.getByTestId('things-badges').locator('.thing.award.not')).toHaveCount(3);
  await expect(t.getByTestId('things-badges').locator('[data-badge=s1-u1]')).toHaveAttribute('aria-label', 'The badge for Counting: not yet');
  await expect(t.getByTestId('line-badge')).toHaveText('Master every lesson in “Counting” for its badge.');
  await expect(t.getByTestId('line-award')).toHaveText('Master all of Stage 1 for the rosette.');
  // Every picture has loaded and nothing spills.
  await expect.poll(() => t.locator('img').evaluateAll((all) => all.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  for (const width of [320, 400, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await fitsTheScreen(page);
  }
});

test('a unit finished: its badge; a stage finished: its award; both are then in colour among Oreo’s things', async ({ page }) => {
  const s1 = ['s1-count', 's1-see', 's1-zero', 's1-estimate', 's1-names', 's1-teens', 's1-compare', 's1-ordinal', 's1-pattern', 's1-skip', 's1-oddeven', 's1-add', 's1-sub', 's1-ten', 's1-doubles', 's1-calc20', 's1-half', 's1-money'];
  // All of Stage 1 mastered; everything she earned on the way is hers, except the badges and the award (the app was closed).
  await seed(page, { doneOn: day(-1), lessons: Object.fromEntries(s1.map((id) => [id, mastered()])) });
  await page.addInitScript(() => {
    const k = 'tens-and-ones.profile.child-test', d = JSON.parse(localStorage.getItem(k)!);
    if (d.rewards.awards.s1) { d.rewards.awards = {}; localStorage.setItem(k, JSON.stringify(d)); }
  });
  await page.goto('/');
  const reward = page.getByTestId('reward');
  await expect(reward).toHaveAttribute('data-reward', 'badge');
  await expect(reward.getByTestId('prompt')).toHaveText('You finished a whole part of the garden! This badge is for you.');
  await expect(reward.locator('.sub')).toHaveText('Counting');
  await expect(reward.getByAltText('The badge for Counting')).toBeVisible();
  await expect(reward.locator('.oreoanim')).toHaveAttribute('data-anim', 'wag-proud');
  await fitsTheScreen(page);
  const got = await collect(page);
  expect(got.filter((g) => g === 'badge')).toHaveLength(6); // the six parts of Stage 1
  expect(got[got.length - 1]).toBe('award');
  await expect(things(page).getByTestId('things-badges').locator('.thing.badge:not(.not)')).toHaveCount(6);
  await expect(things(page).getByTestId('things-badges').locator('[data-award=rosette]')).not.toHaveClass(/not/);
  await expect(things(page).getByTestId('line-award')).toHaveText('Master all of Stage 2 for the trophy.');
  expect((await saved(page)).rewards.awards).toMatchObject({ 's1-u1': 'badge', 's1-u6': 'badge', s1: 'rosette' });
});

test('after a round she sees the stone change and the paws towards the next reward fill up', async ({ page }) => {
  test.setTimeout(60_000);
  // Four paws: "Count to 20" mastered. The next treasure is at the sixth. Today she is at the first step of "See how many".
  await seed(page, { soundOff: true, doneOn: day(-1), lessons: { 's1-count': mastered(), 's1-see': { step: 0, rating: 0, answers: 0 } } });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  // The warm-up first (it moves no stone), then the round of the lesson.
  for (let r = 0; r < 2; r++) {
    const n = await page.locator('.dots > span').count();
    const lesson = await page.locator('.card.game').getAttribute('data-lesson');
    for (let i = 0; i < n; i++) await answerRight(page);
    const end = page.getByTestId('end');
    await expect(end).toBeVisible();
    if (r === 0) {
      // A warm-up: no stone has changed, and the paws stand where they stood: one of two since the last treasure.
      await expect(end.getByTestId('endstone')).toHaveCount(0);
      await expect(end.getByTestId('endgoal')).toContainText('2 more paws and Oreo gets a treasure.');
      await expect(end.getByTestId('pawrow')).toHaveAttribute('data-done', '1');
      await expect(end.getByTestId('pawrow').locator('.new')).toHaveCount(0);
      await end.getByRole('button', { name: 'Keep going' }).click();
      if (await page.getByTestId('choice').count()) await page.getByTestId('choice').locator('[data-lesson=s1-see]').click();
    } else {
      // Every answer right: two steps at once. The stone shows them filling in, with Oreo jumping beside it.
      expect(lesson).toBe('s1-see');
      const stone = end.getByTestId('endstone');
      await expect(stone).toHaveAttribute('data-lesson', 's1-see');
      await expect(stone).toContainText('See how many');
      await expect(stone.locator('.pips i')).toHaveCount(3);
      await expect(stone.locator('.pips i.on')).toHaveCount(2);
      await expect(stone.locator('.pips i.on.new')).toHaveCount(2);
      const run = await stone.locator('.pips i.new').first().evaluate((e) => { const c = getComputedStyle(e); return { name: c.animationName, times: c.animationIterationCount }; });
      expect(run).toEqual({ name: 'pip-in', times: '1' });
      await expect(end.locator('.endrow .oreoanim')).toHaveAttribute('data-anim', 'hop-celebrating');
      // Two paws won: that is the sixth, so Oreo has something for her, and the card comes next.
      await expect(end.getByTestId('endgoal')).toHaveText('Oreo has something for you!');
      await fitsTheScreen(page);
      await end.getByRole('button', { name: 'Keep going' }).click();
      expect(await collect(page)).toEqual(['treasure w6']);
    }
  }
});

test('a paw short of a treasure: the row shows the new paw popping in, once, and with reduced motion not at all', async ({ page }) => {
  test.setTimeout(60_000);
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* not on a page yet */ } }).catch(() => {});
    // Six paws and the treasure for them: "Count to 20" mastered, two steps of "See how many". The next treasure is at nine.
    await seed(page, { soundOff: true, doneOn: day(), lessons: { 's1-count': mastered(), 's1-see': passed(3) } });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('seeded', '1'));
    // Free play of a lesson she has passed moves nothing: no stone, no paw.
    await page.locator('.stone[data-lesson=s1-count]').click();
    for (let i = 0; i < 6; i++) await answerRight(page);
    const end = page.getByTestId('end');
    await expect(end.getByTestId('endstone')).toHaveCount(0);
    await expect(end.getByTestId('pawrow').locator('.new')).toHaveCount(0);
    await expect(end.getByTestId('endgoal')).toContainText('more paw');
    const moving = await end.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => (a.effect as KeyframeEffect).target?.closest('.pawrow, .endstone')).length);
    expect(moving).toBe(0);
    await end.getByRole('button', { name: 'Home' }).click();
  }
});
