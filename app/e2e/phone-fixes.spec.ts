import { expect, test, type Page } from '@playwright/test';
import { day, fitsTheScreen, mastered, saved, seed, watch, collect } from './helpers';

/** A lesson the starting check marked as known, as an earlier version saved it. */
const known = (more: Record<string, unknown> = {}) => ({
  step: 9, passedOn: [], mastered: day(-3), placed: true, reviews: 0, due: day(20), reviewMisses: 0, rating: 3, answers: 0, recent: [], slow: false, ...more,
});
const UNIT = ['s2-count', 's2-place', 's2-names', 's2-regroup'];
/** Nothing is earned yet: every treasure, trick, badge and award among Oreo's things is still a grey shape. */
const nothingEarned = (page: Page) => page.getByTestId('things').evaluate((el) => el.querySelectorAll('.thing:not(.not), button.trickbtn').length === 0 && el.querySelectorAll('.thing.not, .trickbtn.not').length === 6 + 6 + 14 + 3);
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
  await expect(nothingEarned(page)).resolves.toBe(true);
  const garden = page.getByTestId('garden');
  // She still knows the lessons: they are not taken away, only the rewards.
  for (const id of UNIT) await expect(garden.locator(`[data-lesson=${id}]`)).toHaveAttribute('data-status', 'known');
  await expect(garden.locator('[data-lesson=s2-count] .d')).toHaveText('Known, to be checked in a warm-up.');
  // And it is so every time the app is opened.
  await page.reload();
  await expect(page.getByTestId('things')).toBeVisible();
  await expect(nothingEarned(page)).resolves.toBe(true);
  expect(errors).toEqual([]);
});

test('a unit she finished by playing keeps its trick and treasure, next to one that was only known', async ({ page }) => {
  // As an earlier version saved it: treasures per lesson, tricks per unit; one unit played, one only known from the check.
  // She has finished today's games.
  await seed(page, {
    doneOn: day(),
    lessons: { ...Object.fromEntries(UNIT.map((id) => [id, mastered()])), 's2-bonds': known(), 's2-inverse': known(), 's2-calc': known() },
    rewards: { treasures: { welcome: 'bowl', 's2-count': 'ball', 's2-bonds': 'bed' }, tricks: { 's2-u1': 'spin', 's2-u4': 'beg' } },
  });
  await page.goto('/');
  // What is new since then for the same progress is the unit's badge: it is owed and comes first. Nothing else today, and no trick twice.
  expect(await collect(page)).toEqual(['badge']);
  await expect(page.getByTestId('reward')).toHaveCount(0);
  // Her trick is still "spin"; the trick the check gave is gone.
  const tricks = page.getByTestId('things-tricks');
  await expect(tricks.locator('button.trickbtn')).toHaveCount(1);
  await expect(tricks.locator('button.trickbtn')).toHaveAttribute('data-trick', 'spin');
  await expect(tricks.locator('.trickbtn.not')).toHaveCount(5);
  const s = await saved(page);
  expect(s.rewards.tricks).toEqual({ k1: 'spin' });
  expect(s.rewards.treasures).toEqual({ welcome: 'bowl', t1: 'ball' }); // the treasure she had, in the first place treasures have now
  // She has more paws than the one treasure stands for: the next ones are owed, and wait for the next days, one a day.
  await expect(page.getByTestId('line-treasure').getByTestId('pawrow')).toHaveAttribute('data-done', '6');
  await expect(page.getByTestId('line-treasure')).toContainText('Finish tomorrow’s games and Oreo gets a treasure.');
  expect(Object.values(s.rewards.treasures)).not.toContain(undefined);
  expect(s.rewards.awards).toEqual({ 's2-u1': 'badge' });
  await expect(page.getByTestId('things-badges').locator('.thing.badge:not(.not)')).toHaveCount(1);
});

test('every trick has its name under its picture, and the picture fits inside its frame', async ({ page }) => {
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('things');
  await expect(shelf.locator('button.trickbtn')).toHaveCount(6);
  await expect.poll(() => shelf.locator('img').evaluateAll((all) => all.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  for (const width of [320, 360, 400, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const [trick, name] of TRICKS) {
      const btn = shelf.locator(`[data-trick=${trick}]`);
      await expect(btn.locator('.trickname')).toHaveText(name);
      // All four are measured in one reading: after the width changes the page is still settling, and readings a
      // moment apart do not belong together.
      const m = await btn.evaluate((el) => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        return { b: box(el), f: box(el.querySelector('.trickframe')!), i: box(el.querySelector('img')!), n: box(el.querySelector('.trickname')!) };
      });
      const inside = (a: typeof m.b, o: typeof m.b) => a.x >= o.x - 0.5 && a.y >= o.y - 0.5 && a.x + a.width <= o.x + o.width + 0.5 && a.y + a.height <= o.y + o.height + 0.5;
      expect(inside(m.i, m.f), `${trick} picture inside its frame at ${width} px`).toBe(true);
      expect(inside(m.f, m.b) && inside(m.n, m.b), `${trick} frame and name inside the button at ${width} px`).toBe(true);
      expect(m.n.y, `${trick}: the name is under the picture`).toBeGreaterThanOrEqual(m.f.y + m.f.height - 0.5);
      // The whole picture is shown, not a cut-off part of it.
      expect(await btn.locator('img').evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
      expect(m.b.width).toBeGreaterThanOrEqual(72);
      expect(m.b.height).toBeGreaterThanOrEqual(72);
    }
    await fitsTheScreen(page);
  }
});

/** The animations running on Oreo's pictures inside an element, as the browser reports them. */
const moving = (el: Element) => el.getAnimations({ subtree: true }).filter((x) => x.playState === 'running').map((x) => ({ ms: Number(x.effect!.getTiming().duration), times: x.effect!.getTiming().iterations, fill: x.effect!.getTiming().fill }));

test('tapping a trick: Oreo says its name in a recorded sentence and does the trick’s own animation once, then is still', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('things');
  for (const [trick, name, says] of TRICKS) {
    await shelf.locator(`[data-trick=${trick}]`).click();
    const show = shelf.getByTestId('trickshow');
    await expect(show.locator('.sub')).toHaveText(says);
    const pic = show.locator('.oreoanim');
    await expect(pic).toHaveAttribute('data-anim', `trick-${trick}`); // each trick has its own animation
    await expect(pic).toHaveAttribute('aria-label', `Oreo’s trick: ${name}`);
    await expect(pic).toHaveAttribute('data-anim-state', 'playing');
    const runs = await pic.evaluate(moving);
    expect(runs.length).toBeGreaterThan(0);
    for (const r of runs) {
      expect(r.times).toBe(1); // once
      expect(r.fill).toBe('none'); // and nothing is left behind
      expect(r.ms).toBeLessThanOrEqual(2000);
    }
    // It ends, and then she is the still picture: nothing on her is moving or turned.
    await expect(pic).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
    expect(await pic.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    expect(await pic.locator('.oa-pic').evaluate((el) => { const c = getComputedStyle(el); return [c.rotate, c.scale, c.translate, c.transform].join(' '); })).toBe('none none none none');
    await fitsTheScreen(page);
  }
  // Tapping the same trick again does it again.
  await shelf.locator('[data-trick=fetch]').click();
  await expect(shelf.locator('.oreoanim')).toHaveAttribute('data-anim-state', 'playing');
  expect(errors).toEqual([]); // a sentence without a recording would be reported here
});

test('with reduced motion, a tapped trick is shown and named but does not move', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { rewards: sixTricks });
  await page.goto('/');
  const shelf = page.getByTestId('things');
  for (const [trick, , says] of TRICKS) {
    await shelf.locator(`[data-trick=${trick}]`).click();
    await expect(shelf.getByTestId('trickshow').locator('.sub')).toHaveText(says);
    const pic = shelf.locator('.oreoanim');
    await expect(pic).toHaveAttribute('data-anim', `trick-${trick}`);
    await expect(pic).toHaveAttribute('data-anim-state', 'still');
    expect(await pic.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(pic.locator('img.oa-body')).toBeVisible(); // the still picture
  }
});

test('the button for grown-ups on the home screen says where it leads', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  const btn = page.getByRole('button', { name: 'For grown-ups' }), note = page.getByTestId('grown-note');
  await expect(note).toHaveText('Progress, settings, and why the app teaches this way.');
  await expect(btn).toBeVisible();
  // Both are measured in one go: on a slow connection the page is still settling, and two readings a moment apart do not belong together.
  const gap = await note.evaluate((n) => n.getBoundingClientRect().top - n.parentElement!.querySelector('button')!.getBoundingClientRect().bottom);
  expect(gap).toBeGreaterThanOrEqual(-0.5); // under the button
  expect(gap).toBeLessThan(24); // and close to it
  await fitsTheScreen(page);
});

test('the parents’ lock says what to do and why, and does not look like a lesson', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const gate = page.getByTestId('gate');
  await expect(gate.locator('h1')).toHaveText('For grown-ups');
  await expect(gate.getByTestId('gate-why')).toHaveText('To open this area, solve this sum. It keeps children out of the settings.');
  // The explanation comes before the question.
  const why = (await gate.getByTestId('gate-why').boundingBox())!, q = (await gate.getByTestId('gate-question').boundingBox())!;
  expect(why.y + why.height).toBeLessThanOrEqual(q.y + 0.5);
  // No Oreo, none of a lesson's parts, and ordinary type instead of the children's lettering.
  await expect(page.locator('.pup, .card.game, .prompt, .ctl, .choice, .dots')).toHaveCount(0);
  for (const el of [gate.locator('h1'), gate.getByTestId('gate-question'), gate.getByRole('button', { name: 'Open' })]) {
    expect(await el.evaluate((e) => getComputedStyle(e).fontFamily)).not.toMatch(/Fredoka|Andika/);
  }
  await fitsTheScreen(page);
  // A wrong answer: it says so, and gives another sum to try.
  const first = await gate.getByTestId('gate-question').innerText();
  await page.getByLabel('Your answer').fill('12');
  await gate.getByRole('button', { name: 'Open' }).click();
  await expect(gate.getByRole('alert')).toHaveText('That is not it. Try this one.');
  await expect(gate.getByTestId('gate-question')).not.toHaveText(first);
  const alert = (await gate.getByRole('alert').boundingBox())!, q2 = (await gate.getByTestId('gate-question').boundingBox())!;
  expect(alert.y + alert.height).toBeLessThanOrEqual(q2.y + 0.5); // "try this one" stands above the new sum
  await gate.getByRole('button', { name: 'Back to the game' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
});

test('“why this works” under a lesson opens its note without the lock, with a way on to the approach page', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { lessons: { 's1-see': mastered() } });
  await page.goto('/');
  const before = await saved(page);
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
  expect(await saved(page)).toEqual(before); // nothing was changed
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
