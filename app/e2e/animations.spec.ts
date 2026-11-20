import { expect, test, type Page } from '@playwright/test';
import { day, fitsTheScreen, mastered, seed, watch } from './helpers';

const LEVELS: Record<string, number> = { sums: 12, plus: 3, bonds: 3, teens: 3, regroup: 2, hear: 3, dots: 2, more: 8, skip: 9, groups: 5, share: 3, parts: 7, money: 5, count: 7, five: 3, pack: 3, look: 3, names: 3, walk: 3, friends: 3, jump: 4, fill: 4, take: 4, mystery: 3, story: 3 };

/**
 * Everything that is moving on any picture of Oreo, by whatever means: her own animations (the Web
 * Animations API), a CSS animation or a transition. Also the animated Oreos that are on the screen at all.
 */
const oreoNow = (page: Page) => page.evaluate(() => ({
  running: document.getAnimations().filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.target?.closest('.pup, .rewardpic')).length,
  animated: [...document.querySelectorAll('.card.game [data-anim]')].map((e) => `${e.getAttribute('data-anim')}:${e.getAttribute('data-anim-state')}`),
}));
const questionOpen = (page: Page) => page.evaluate(() => !document.querySelector('[data-testid=end]') && ![...document.querySelectorAll('button')].some((b) => /^(Next|Finish)$/.test(b.textContent ?? '') && b.offsetParent));
/** Very fast wrong taps count as guessing and pause the answers; these tests tap slower than that. */
const SLOWLY = 900;
/** Looks several times over a moment: an animation that started late would be seen. */
async function stillWhileOpen(page: Page, where: string) {
  for (let i = 0; i < 4; i++) {
    expect(await questionOpen(page), `${where}: the question is open`).toBe(true);
    expect(await oreoNow(page), `${where}: Oreo is still while the question is open`).toEqual({ running: 0, animated: [] });
    await page.waitForTimeout(120);
  }
}

test('no animation of Oreo runs while a question is open: every game, every level, before and after a wrong answer', async ({ page }) => {
  // The walk through 111 levels takes minutes and does not depend on the width of the screen: once, on the phone, is enough.
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'run once, at phone width');
  test.setTimeout(600_000);
  const errors = watch(page);
  let wrongs = 0, rights = 0;
  for (const [game, n] of Object.entries(LEVELS)) {
    for (let level = 1; level <= n; level++) {
      const where = `${game} ${level}`;
      await page.goto(`/#try=${game}.${level}`);
      await page.reload();
      await expect(page.locator('.card.game')).toBeVisible();
      // The question is read out (she listens, a still picture), then she thinks. Nothing of her moves.
      await stillWhileOpen(page, where);
      // Where the answers are buttons: tap them one after the other. After each wrong one the question
      // is still open and she must be still; the right one closes it, and only then may she wag.
      if (await page.getByTestId('demo').count()) continue; // Oreo's demonstration of guessing: no question is open in it
      for (let tap = 0; tap < 3 && (await page.locator('.choice:not([disabled])').count()) > 0; tap++) {
        await page.locator('.choice:not([disabled])').first().click();
        if (await questionOpen(page)) {
          // A wrong answer shows "not yet"; in a few games a tap is a step and not yet an answer. Either way she is still.
          if ((await page.locator('.cheer .pup').getAttribute('data-pose')) === 'not-yet') wrongs++;
          await stillWhileOpen(page, `${where}, after a tap that did not close the question`);
          await page.waitForTimeout(SLOWLY); // tapped like someone who is looking, not guessing
        } else {
          rights++;
          const pup = page.locator('.cheer .oreoanim');
          await expect(pup, where).toHaveAttribute('data-anim', 'wag-happy');
          break;
        }
      }
    }
  }
  // The walk through really met wrong answers and right ones, in many games.
  expect(wrongs).toBeGreaterThan(40);
  expect(rights).toBeGreaterThan(30);
  expect(errors).toEqual([]);
});

/** Answers the question on the screen right, whatever it takes, in a game whose answers are buttons. */
async function answer(page: Page) {
  for (let tap = 0; tap < 6; tap++) {
    await page.locator('.choice:not([disabled])').first().click();
    if (!(await questionOpen(page))) return;
    await page.waitForTimeout(SLOWLY + 500);
  }
  throw new Error('no right answer found');
}

test('a right answer: her tail wags once and she is still again; the next question finds her still', async ({ page }) => {
  await page.goto('/#try=count.4');
  await expect(page.locator('.card.game')).toBeVisible();
  await answer(page);
  const pup = page.locator('.cheer .oreoanim');
  await expect(pup).toHaveAttribute('data-anim', 'wag-happy');
  const runs = await pup.evaluate((el) => el.getAnimations({ subtree: true }).map((a) => ({ on: (a.effect as KeyframeEffect).target!.className, times: a.effect!.getTiming().iterations, fill: a.effect!.getTiming().fill, ms: a.effect!.getTiming().duration })));
  expect(runs.map((r) => r.on).sort()).toEqual(['oa-pic', 'oa-tail']); // the small hop, and the tail
  for (const r of runs) expect([r.times, r.fill, r.ms]).toEqual([1, 'none', 2000]);
  // The tail lies under the body and exactly on it, and turns about a point inside the picture.
  const layers = await pup.evaluate((el) => {
    // Sizes and places before any turning: the layout boxes, not what is on screen mid-wag.
    const [tail, body] = [el.querySelector<HTMLElement>('.oa-tail')!, el.querySelector<HTMLElement>('.oa-body')!];
    const kids = [...el.querySelector('.oa-pic')!.children].map((c) => c.className);
    const same = tail.offsetWidth === body.offsetWidth && tail.offsetHeight === body.offsetHeight && tail.offsetLeft === body.offsetLeft && tail.offsetTop === body.offsetTop;
    const [ox, oy] = getComputedStyle(tail).transformOrigin.split(' ').map(parseFloat);
    return { kids, same, inside: ox! > 0 && ox! < tail.offsetWidth && oy! > 0 && oy! < tail.offsetHeight };
  });
  expect(layers.kids).toEqual(['oa-tail', 'oa-body']);
  expect(layers.same).toBe(true);
  expect(layers.inside).toBe(true);
  await expect(pup).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
  expect(await pup.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  await fitsTheScreen(page);
  await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  await stillWhileOpen(page, 'the next question');
});

test('the end of a round: she jumps for a round that went well, and is still afterwards', async ({ page }) => {
  await page.goto('/#try=count.4');
  await expect(page.locator('.card.game')).toBeVisible();
  for (let q = 0; q < 6; q++) {
    // Right first time: an empty plate is 0, otherwise count the bones on it.
    const n = await page.getByTestId('plate').locator('.ic').count();
    await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
    await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  }
  const pup = page.getByTestId('end').locator('.oreoanim');
  await expect(pup).toHaveAttribute('data-anim', 'hop-celebrating');
  await expect(pup).toHaveAttribute('data-pose', 'celebrating');
  expect(await pup.evaluate((el) => el.getAnimations({ subtree: true }).every((a) => a.effect!.getTiming().iterations === 1 && a.effect!.getTiming().fill === 'none'))).toBe(true);
  await expect(pup).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
  expect(await pup.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  await fitsTheScreen(page);
});

test('the end of any other round: she is proud and her tail wags once', async ({ page }) => {
  await page.goto('/#try=count.4');
  await expect(page.locator('.card.game')).toBeVisible();
  for (let q = 0; q < 6; q++) {
    // Wrong first, on purpose, then right.
    const n = await page.getByTestId('plate').locator('.ic').count();
    await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first().click();
    await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
    await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  }
  const pup = page.getByTestId('end').locator('.oreoanim');
  await expect(pup).toHaveAttribute('data-anim', 'wag-proud');
  await expect(pup.locator('.oa-tail')).toHaveCount(1);
  await expect(pup).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
  expect(await pup.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test('hello at the start of a session: she rocks once when the app opens, and not again on coming back', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  const pup = page.locator('.toppup');
  await expect(pup).toHaveAttribute('data-anim', 'wave-hello');
  await expect(pup).toHaveAttribute('data-anim-state', 'playing');
  await expect(pup).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
  // Away and back, in the same session: she is there, still.
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  await page.getByRole('button', { name: 'Back to the game' }).click();
  await expect(pup).toHaveAttribute('data-anim', 'wave-hello');
  await page.waitForTimeout(300);
  await expect(pup).toHaveAttribute('data-anim-state', 'still');
  expect(await pup.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  await fitsTheScreen(page);
});

test('the reward screen: her tail wags for a treasure and for an award', async ({ page }) => {
  await seed(page, { lessons: { 's1-see': mastered() }, rewards: {}, doneOn: day() });
  await page.goto('/');
  const reward = page.getByTestId('reward');
  await expect(reward).toHaveAttribute('data-reward', 'treasure');
  const pup = reward.locator('.oreoanim');
  await expect(pup).toHaveAttribute('data-anim', 'wag-proud');
  await expect(pup).toHaveAttribute('data-anim-state', 'still', { timeout: 4000 });
  await fitsTheScreen(page);
});

test('with reduced motion Oreo is the still picture everywhere: answer, end of round, hello, reward', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const none = async () => expect(await page.evaluate(() => document.getAnimations().filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('.pup, .rewardpic')).length)).toBe(0);
  await page.goto('/#try=count.4');
  await expect(page.locator('.card.game')).toBeVisible();
  for (let q = 0; q < 6; q++) {
    await answer(page);
    const pup = page.locator('.cheer .oreoanim');
    await expect(pup).toHaveAttribute('data-anim-state', 'still');
    await expect(pup.locator('img.oa-body')).toBeVisible();
    await none();
    await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  }
  await expect(page.getByTestId('end').locator('.oreoanim')).toHaveAttribute('data-anim-state', 'still');
  await none();
  await seed(page, { lessons: { 's1-see': mastered() }, rewards: {}, doneOn: day() });
  await page.goto('/');
  await expect(page.getByTestId('reward').locator('.oreoanim')).toHaveAttribute('data-anim-state', 'still');
  await none();
});
