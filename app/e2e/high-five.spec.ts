import { expect, test, type Page } from '@playwright/test';
import { day, playToday, saved, seed } from './helpers';

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
const next = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
const game = (page: Page) => page.locator('.card.game');
const tryLevel = async (page: Page, l: number) => {
  await page.goto(`/#try=five.${l}`);
  await expect(game(page)).toBeVisible();
};

test('a grown-up adds a child: a nickname, a picture and the stage, and nothing else', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'For a grown-up: who is going to play?' })).toBeVisible();
  const start = page.getByRole('button', { name: 'Start' });
  await expect(start).toBeDisabled();
  await expect(page.locator('input')).toHaveCount(1); // the nickname is the only thing anyone types
  await page.getByLabel('A nickname').fill('  Amani <b>! ');
  await page.getByRole('button', { name: 'owl' }).click();
  await expect(page.getByRole('button', { name: 'Stage 2' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await start.click();
  // First the offer of a short check; a grown-up may skip it.
  await expect(page.getByTestId('startcheck')).toContainText('questions for Amani b.');
  await page.getByRole('button', { name: /skip/ }).click();
  await expect(page.locator('.whoami')).toHaveText('Amani b');
  await expect(page.locator('.whoami img')).toHaveAttribute('alt', 'owl');
  await page.reload();
  await expect(page.locator('.whoami')).toHaveText('Amani b');
  // What is on the device: the profile and nothing about the grown-up or the device.
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys.filter((k) => k.startsWith('tens-and-ones.')).length).toBe(3);
});

test("today's games for a new child: two rounds of See how many, a step up, bones, and it is all kept", async ({ page }) => {
  const errors = watch(page);
  await seed(page);
  await page.goto('/');
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of See how many. About ten minutes.');
  // Free play is closed until today's games are done.
  await expect(page.getByTestId('free-note')).toBeVisible();
  await expect(page.locator('[data-lesson=s1-see]')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Race to 100/ })).toBeDisabled();
  await expect(page.getByTestId('machine')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  // Two lessons are open, so she chooses which one today. Both are things the app wants.
  const card = page.getByTestId('choice');
  await expect(card).toHaveAttribute('data-choice', 'stone');
  await expect(page.getByTestId('prompt')).toHaveText('Which one would you like first? You will do both.');
  await expect(card.locator('.choosecard')).toHaveCount(2);
  await card.locator('[data-lesson=s1-see]').click();

  // Round 1, step 1: fingers and the tower side by side, nothing hidden. All right first time.
  await expect(page.getByTestId('title')).toHaveText('See how many');
  await expect(game(page)).toHaveAttribute('data-step', '0');
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
  // Every one right first time: she jumps over the middle step.
  await expect(end).toContainText('Oreo got 6 bones. Every one right first time! You jump ahead a step. Ready for the next one?');
  // Leaving now keeps the round that is finished.
  expect((await saved(page)).child.lessons['s1-see'].step).toBe(2);
  await end.getByRole('button', { name: 'Keep going' }).click();

  // Round 2, the last step: a ten frame, seen for a moment. One miss, so five bones and a paw: passed.
  await expect(game(page)).toHaveAttribute('data-step', '2');
  for (let i = 0; i < 6; i++) {
    await expect(page.locator('.fiverow .frame')).toBeVisible();
    await answer(page, i === 2);
    await next(page);
  }
  await expect(page.locator('.dots .done')).toHaveCount(1);
  await expect(end).toContainText('All done for today!');
  await expect(end).toContainText('Oreo got 5 bones. You did the last step! Do it once more on another day, and this lesson is yours. Time to stop. See you tomorrow!');
  await end.getByRole('button', { name: 'Back to the start' }).click();

  // Home: today is done, 11 bones packed as a box of ten and one loose, the lesson rests until another day, and free play is open.
  const home = async () => {
    await expect(page.getByTestId('today-text')).toHaveText('Today’s games are done. Well done! See you tomorrow.');
    await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '11 bones');
    await expect(page.locator('.storecap')).toHaveText('1 box of ten and 1 bone. That is 11 bones!');
    await expect(page.locator('[data-lesson=s1-see]')).toContainText('Last step done today. Once more on another day.');
    await expect(page.locator('[data-lesson=s1-see]')).toBeEnabled();
    // The last step passed once opens what is built on it; what needs more stays closed and says what comes first.
    await expect(page.locator('[data-lesson=s1-ten]')).toContainText('Step 1 of 3.');
    await expect(page.locator('[data-lesson=s1-ten]')).toBeEnabled();
    await expect(page.locator('[data-lesson=s2-place]')).toContainText('First: Pack in tens.');
    await expect(page.locator('[data-lesson=s2-place]')).toBeDisabled();
    await expect(page.locator('[data-lesson=s1-count]')).toContainText('Coming soon.');
    await expect(page.getByTestId('free-note')).toHaveCount(0);
    await expect(page.getByTestId('machine')).toBeVisible();
  };
  await home();
  await page.reload();
  await home();
  expect((await saved(page)).attempts).toHaveLength(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('the last step passed today, and again on another day: the lesson is mastered', async ({ page }) => {
  await seed(page, { lessons: { 's1-see': { step: 2, passedOn: [day(-1)], rating: 2, answers: 18 } }, soundOff: true });
  await page.goto('/');
  await playToday(page, 's1-see');
  await expect(game(page)).toHaveAttribute('data-step', '2');
  for (let i = 0; i < 6; i++) {
    await answer(page);
    await next(page);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('You know this now! Oreo is proud of you.');
  const s = await saved(page);
  expect(s.child.lessons['s1-see'].mastered).toBe(day());
  await page.getByRole('button', { name: /Keep going|Back to the start/ }).click();
});

test('leaving a round early counts for nothing', async ({ page }) => {
  await seed(page, { soundOff: true });
  await page.goto('/');
  await playToday(page, 's1-see');
  for (let i = 0; i < 4; i++) {
    await answer(page);
    await next(page);
  }
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '0 bones');
  const s = await saved(page);
  expect(s.child.lessons).toEqual({});
  expect(s.attempts).toEqual([]);
});

test('a weak round moves down a step, and the picture is back', async ({ page }) => {
  await seed(page, { lessons: { 's1-see': { step: 1, rating: 0.5, answers: 6 } }, soundOff: true });
  await page.goto('/');
  await playToday(page, 's1-see');
  await expect(game(page)).toHaveAttribute('data-step', '1');
  for (let i = 0; i < 6; i++) {
    await answer(page, i < 4); // two bones, four paws
    await next(page);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('Good trying!');
  await expect(end.locator('.pup')).toHaveAttribute('data-pose', 'proud');
  await expect(end).toContainText('Oreo got 2 bones. That was hard. Next time the picture will help you.');
  await end.getByRole('button', { name: 'Keep going' }).click();
  await expect(game(page)).toHaveAttribute('data-step', '0');
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
});

test('free play after today’s games: a lesson at her step, and it changes neither the step nor the day', async ({ page }) => {
  await seed(page, { lessons: { 's1-see': { step: 1, rating: 1, answers: 6 } }, doneOn: day(), soundOff: true });
  await page.goto('/');
  await page.locator('[data-lesson=s1-see]').click();
  await expect(game(page)).toHaveAttribute('data-step', '1');
  for (let i = 0; i < 6; i++) {
    await answer(page);
    await next(page);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('Oreo got 6 bones.');
  await expect(end).not.toContainText('step');
  const s = await saved(page);
  expect(s.child.lessons['s1-see'].step).toBe(1);
  expect(s.bones).toBe(6);
  await end.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
});

test('two children on one device: each has her own bones, and they choose by picture', async ({ page }) => {
  await seed(page, { bones: 7 });
  await page.goto('/');
  await expect(page.locator('.whoami')).toBeDisabled();
  await page.evaluate(() => {
    const other = JSON.parse(localStorage.getItem('tens-and-ones.profile.child-test')!);
    other.profile = { ...other.profile, id: 'child-two', nickname: 'Zuri', picture: 'lion' };
    other.bones = 23;
    localStorage.setItem('tens-and-ones.profile.child-two', JSON.stringify(other));
    localStorage.setItem('tens-and-ones.profiles', JSON.stringify(['child-test', 'child-two']));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Who is playing?' })).toBeVisible();
  await page.getByRole('button', { name: /Zuri/ }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '23 bones');
  await page.reload();
  await expect(page.locator('.whoami')).toContainText('Zuri'); // the last one who played
  await page.locator('.whoami').click();
  await page.getByRole('button', { name: /Amani/ }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '7 bones');
});

test('every step, right and wrong: the picture, the hint', async ({ page }) => {
  const errors = watch(page);
  await tryLevel(page, 1);

  // Step 1: a wrong tap gets a hint that says what to look for, and costs the bone, not the question.
  const n1 = await shown(page);
  await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n1}$`) }).first().click();
  await expect(page.getByTestId('feedback')).toHaveText('Do not count them all. The dark blue ones are 5. How many more?');
  await expect(page.getByRole('button', { name: /^(Next|Finish)$/ })).toHaveCount(0);
  await answer(page);
  await expect(page.locator('.dots .done')).toHaveCount(1);
  await expect(page.locator('.dots .star')).toHaveCount(0);

  // Step 2: the tower is covered after a moment; "Peek again" shows it again; it stays once answered.
  await tryLevel(page, 2);
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

  // Step 3: a ten frame, and the hint that goes with it.
  await tryLevel(page, 3);
  await expect(page.locator('.fiverow .frame')).toBeVisible();
  const n3 = await shown(page);
  await page.locator('.choice').filter({ hasNotText: new RegExp(`^${n3}$`) }).first().click();
  await expect(page.getByTestId('feedback')).toHaveText('Do not count them all. The top row is 5. How many more?');
  await expect(page.locator('.cheer .pup[data-pose=not-yet]')).toBeVisible();
  await answer(page);
  await expect(page.locator('.fiverow .hands')).toBeVisible(); // the fingers come back with the answer

  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: '← Home' }).click();
  expect(errors).toEqual([]);
});

test('without the voice pack the game is silent, playable, and offers to try again', async ({ page }) => {
  await page.route('**/voice/*.mp3', (r) => r.abort());
  await tryLevel(page, 1);
  await expect(page.getByText('The voice did not load.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeHidden();
  await answer(page);

  await page.unroute('**/voice/*.mp3');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('The voice did not load.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeVisible();
});

test('Oreo listens while the question is read, then thinks, and reacts only to answers', async ({ page }) => {
  await seed(page, { doneOn: day() });
  await page.goto('/');
  await expect(page.locator('.toppup')).toHaveAttribute('data-pose', 'hello');
  await page.locator('[data-lesson=s1-see]').click();
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
  // The picture of a new pose arrives a moment after the pose changes.
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 100)).toBe(true);
});

test('with the sound off Oreo goes straight to thinking', async ({ page }) => {
  await seed(page, { doneOn: day() });
  await page.goto('/');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await page.locator('[data-lesson=s1-see]').click();
  await expect(page.locator('.cheer .pup')).toHaveAttribute('data-pose', 'thinking');
});

test('the end of a round: celebrating after a good one', async ({ page }) => {
  await tryLevel(page, 1);
  for (let i = 0; i < 6; i++) {
    await answer(page);
    await next(page);
  }
  await expect(page.getByTestId('end').locator('.pup')).toHaveAttribute('data-pose', 'celebrating');
});

test('sound off is remembered', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await expect(page.getByRole('button', { name: 'Sound off' })).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
});
