import { expect, test, type Page } from '@playwright/test';
import { answerRight, collect, day, fitsTheScreen, mastered, nextDay, playOut, saved, seed, watch } from './helpers';

const things = (page: Page) => page.getByTestId('things');
const passed = (steps: number) => ({ step: steps - 1, rating: 2, answers: 20, passedOn: [day(-1)] });

test('day one: the welcome treasure for finishing today’s games, and nothing else on the same day', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = watch(page);
  await seed(page);
  await page.goto('/');
  // Before anything: Oreo's things show what there is to earn, all of it still grey, and what earns the first of each.
  await expect(things(page).getByTestId('line-treasure')).toHaveText('Finish today’s games and Oreo gets a treasure.');
  await expect(things(page).getByTestId('line-trick')).toContainText('Master 7 more lessons and Oreo learns to give a high five.');
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
    // After every round she sees how far the next reward is: what brings it, or that Oreo has something for her.
    const last = (await end.getByRole('button', { name: 'Back to the start' }).count()) > 0;
    await expect(end.getByTestId('endgoal')).toHaveText(last ? 'Oreo has something for you!' : 'Finish today’s games and Oreo gets a treasure.');
    await end.getByRole('button', { name: last ? 'Back to the start' : 'Keep going' }).click();
    got.push(...(await collect(page)));
    if (last) break;
  }
  await expect(page.getByTestId('today-text')).toHaveText('Today’s games are done. Well done! See you tomorrow.');
  // On her first day: the welcome treasure, at the end of today's games. One reward, however many paws she won.
  expect(got).toEqual(['treasure welcome']);
  const s = await saved(page);
  expect(Object.keys(s.rewards.treasures)).toEqual(['welcome']);
  expect(s.rewards.lastOn).toBe(day());
  // It is among Oreo's things, and the line now counts paws.
  const have = await things(page).getByTestId('things-treasures').locator('.thing').evaluateAll((all) => all.reduce((n, e) => n + Number(e.getAttribute('data-count')), 0));
  expect(have).toBe(Object.keys(s.rewards.treasures).length);
  await expect(things(page).getByTestId('line-treasure')).toHaveText(/(\d more paws?|Finish tomorrow’s games) and Oreo gets a treasure\.$/);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Oreo’s things shows everything, earned or not: what is not hers yet is a grey shape with a line saying what earns it', async ({ page }) => {
  // Five paws (one short of the first treasure for paws), one lesson mastered, today's games done once.
  await seed(page, { doneOn: day(-1), lessons: { 's1-count': mastered(), 's1-see': { step: 1, rating: 1, answers: 8 } } });
  await page.goto('/');
  const t = things(page);
  await expect(t.locator('h2')).toHaveText('Oreo’s things');
  // Treasures: the six kinds; the three she has are in colour, with how many; the others are grey shapes.
  const kinds = t.getByTestId('things-treasures').locator('.thing');
  await expect(kinds).toHaveCount(6);
  await expect(t.getByTestId('things-treasures').locator('.thing:not(.not)')).toHaveCount(1); // the welcome treasure
  await expect(t.getByTestId('things-treasures').locator('.thing.not')).toHaveCount(5);
  const grey = await t.getByTestId('things-treasures').locator('.thing.not img').first().evaluate((e) => { const c = getComputedStyle(e); return { filter: c.filter, opacity: Number(c.opacity) }; });
  expect(grey.filter).toContain('grayscale');
  expect(grey.opacity).toBeLessThan(0.3);
  // One plain line says what earns the next one, with the paws so far.
  await expect(t.getByTestId('line-treasure')).toContainText('1 more paw and Oreo gets a treasure.');
  await expect(t.getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-done', '5');
  await expect(t.getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-of', '6');
  await expect(t.getByTestId('line-treasure').locator('.pawrow .on')).toHaveCount(5);
  // Tricks: all six are shown with their names; none is hers yet, so none can be tapped.
  await expect(t.getByTestId('things-tricks').locator('.trickbtn')).toHaveCount(6);
  await expect(t.getByTestId('things-tricks').locator('button')).toHaveCount(0);
  await expect(t.getByTestId('things-tricks').locator('.trickbtn.not .trickname').first()).toHaveText('High five');
  await expect(t.getByTestId('line-trick')).toContainText('Master 6 more lessons and Oreo learns to give a high five.');
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

test('a unit finished: its badge; a stage finished: its award, on the next day; both are then in colour among Oreo’s things', async ({ page }) => {
  const s1 = ['s1-count', 's1-see', 's1-zero', 's1-estimate', 's1-names', 's1-teens', 's1-compare', 's1-ordinal', 's1-pattern', 's1-skip', 's1-oddeven', 's1-add', 's1-sub', 's1-ten', 's1-doubles', 's1-calc20', 's1-half', 's1-money'];
  // All of Stage 1 mastered and today's games finished; everything she earned on the way is hers, except the badge
  // of the last part and the award of the stage (the app was closed).
  await seed(page, { soundOff: true, doneOn: day(), lessons: Object.fromEntries(s1.map((id) => [id, mastered()])) });
  await page.addInitScript(() => {
    const k = 'tens-and-ones.profile.child-test', d = JSON.parse(localStorage.getItem(k)!);
    if (d.rewards.awards.s1 && !localStorage.getItem('taken')) {
      delete d.rewards.awards.s1; delete d.rewards.awards['s1-u1'];
      localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem('taken', '1');
    }
  });
  await page.goto('/');
  const reward = page.getByTestId('reward');
  await expect(reward).toHaveAttribute('data-reward', 'badge');
  await expect(reward.getByTestId('prompt')).toHaveText('You finished a whole part of the garden! This badge is for you.');
  await expect(reward.locator('.sub')).toHaveText('Counting');
  await expect(reward.getByAltText('The badge for Counting')).toBeVisible();
  await expect(reward.locator('.oreoanim')).toHaveAttribute('data-anim', 'wag-proud');
  await fitsTheScreen(page);
  // One reward today: the badge. The award of the stage waits.
  expect(await collect(page)).toEqual(['badge']);
  await expect(things(page).getByTestId('things-badges').locator('.thing.badge:not(.not)')).toHaveCount(6);
  await expect(things(page).getByTestId('things-badges').locator('[data-award=rosette]')).toHaveClass(/not/);
  await page.reload();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  // The next day: nothing when she opens the app, the award when she has finished today's games.
  await nextDay(page);
  await expect(page.getByTestId('today-text')).toBeVisible();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await nextDay(page, true);
  expect(await collect(page)).toEqual(['award']);
  await expect(page.getByTestId('reward')).toHaveCount(0);
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
      // A warm-up: no stone has changed, and the paws stand where they stood: four of the six a treasure takes.
      await expect(end.getByTestId('endstone')).toHaveCount(0);
      await expect(end.getByTestId('endgoal')).toContainText('2 more paws and Oreo gets a treasure.');
      await expect(end.getByTestId('pawrow')).toHaveAttribute('data-done', '4');
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
      // Two paws won: that is the sixth. The row is full, the two new paws pop in, and the line says when the treasure comes:
      // when today's games are finished, not in the middle of them.
      const last = (await end.getByRole('button', { name: 'Back to the start' }).count()) > 0;
      if (last) await expect(end.getByTestId('endgoal')).toHaveText('Oreo has something for you!');
      else {
        await expect(end.getByTestId('endgoal')).toContainText('Finish today’s games and Oreo gets a treasure.');
        await expect(end.getByTestId('pawrow')).toHaveAttribute('data-done', '6');
        await expect(end.getByTestId('pawrow').locator('.on.new')).toHaveCount(2);
      }
      await fitsTheScreen(page);
      await end.getByRole('button', { name: last ? 'Back to the start' : 'Keep going' }).click();
      if (!last) await expect(page.getByTestId('reward')).toHaveCount(0);
      expect(await playOut(page)).toEqual(['treasure t1']);
      expect((await saved(page)).rewards.lastOn).toBe(day());
    }
  }
});

test('a paw short of a treasure: the row shows the new paw popping in, once, and with reduced motion not at all', async ({ page }) => {
  test.setTimeout(60_000);
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* not on a page yet */ } }).catch(() => {});
    // Seven paws and the treasure for the first six: "Count to 20" mastered, "See how many" passed. The next treasure is at twelve.
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

test('more earned than one day gives: one today, the rest wait, one for each of the next days she finishes today’s games', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  // Eighteen paws and the first part of the garden finished, with only the welcome treasure given so far (as a profile
  // of an earlier schedule might stand): three treasures and a badge are waiting. Today's games are finished.
  const lessons = Object.fromEntries(['s1-count', 's1-see', 's1-zero', 's1-estimate', 's1-names'].map((id) => [id, mastered()]));
  await seed(page, { soundOff: true, doneOn: day(), lessons, rewards: { treasures: { welcome: 'ball' } } });
  await page.goto('/');
  // Today: one, the rarest first.
  expect(await collect(page)).toEqual(['badge']);
  await expect(page.getByTestId('reward')).toHaveCount(0);
  // The treasure she has earned is waiting, and the line says for when.
  await expect(things(page).getByTestId('line-treasure')).toContainText('Finish tomorrow’s games and Oreo gets a treasure.');
  await expect(things(page).getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-done', '6');
  await page.reload();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await fitsTheScreen(page);
  for (const slot of ['t1', 't2']) {
    // The next day: nothing on opening the app; the line says what brings it.
    await nextDay(page);
    await expect(page.getByTestId('today-text')).toBeVisible();
    await expect(page.getByTestId('reward')).toHaveCount(0);
    await expect(things(page).getByTestId('line-treasure')).toContainText('Finish today’s games and Oreo gets a treasure.');
    // She finishes today's games: one treasure, and only one.
    await page.getByRole('button', { name: 'Play today’s games' }).click();
    expect(await playOut(page)).toEqual([`treasure ${slot}`]);
    await expect(page.getByTestId('reward')).toHaveCount(0);
    expect((await saved(page)).rewards.lastOn).toBe(day());
  }
  expect(Object.keys((await saved(page)).rewards.treasures).sort()).toEqual(['t1', 't2', 'welcome']);
  expect(errors).toEqual([]);
});

test('a lesson the starting check marked as known, confirmed in a warm-up, brings no paw and no reward', async ({ page }) => {
  test.setTimeout(90_000);
  // A Stage 2 child: all of Stage 1 known from the check and due for review today. She has finished a day before.
  const known = { step: 9, passedOn: [], mastered: day(-3), placed: true, back: true, reviews: 0, due: day(), reviewMisses: 0, rating: 3, answers: 0, recent: [], slow: false };
  const s1 = ['s1-count', 's1-see', 's1-zero', 's1-estimate', 's1-names', 's1-teens', 's1-compare', 's1-ordinal', 's1-pattern', 's1-skip', 's1-oddeven', 's1-add', 's1-sub', 's1-ten', 's1-doubles', 's1-calc20', 's1-half', 's1-money'];
  await seed(page, { stage: 2, soundOff: true, doneOn: day(-1), lessons: Object.fromEntries(s1.map((id) => [id, known])) });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  // The warm-up reviews known lessons: every answer right confirms them.
  const n = await page.locator('.dots > span').count();
  for (let i = 0; i < n; i++) await answerRight(page);
  const end = page.getByTestId('end');
  await expect(end).toBeVisible();
  const after = await saved(page);
  const confirmed = Object.entries(after.child.lessons as Record<string, { known?: boolean; placed?: boolean }>).filter(([, l]) => l.known);
  expect(confirmed.length).toBeGreaterThan(0);
  // Not one paw for them: the row stands empty, and no reward follows.
  await expect(end.getByTestId('pawrow')).toHaveAttribute('data-done', '0');
  await expect(end.getByTestId('pawrow').locator('.new')).toHaveCount(0);
  await expect(end.getByTestId('endgoal')).toContainText('6 more paws and Oreo gets a treasure.');
  await end.getByRole('button', { name: /Keep going|Back to the start/ }).click();
  await expect(page.getByTestId('reward')).toHaveCount(0);
  expect(after.rewards.treasures).toEqual({ welcome: expect.any(String) });
});
