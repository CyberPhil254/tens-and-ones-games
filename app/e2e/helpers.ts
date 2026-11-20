import { expect, type Page } from '@playwright/test';
import { readProfileData } from '../src/data/profile';
import { give, owedNext } from '../src/engine/rewards';

/** Collects console errors: a sentence without a recording is reported there too. */
export function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Opens one free round of a game level through the tester's door. Nothing is saved for a visitor without a profile. */
export async function openGame(page: Page, game: string, level = 1): Promise<void> {
  await page.goto(`/#try=${game}.${level}`);
  await expect(page.locator('.card.game')).toBeVisible();
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** A day as the app writes it, counted from today. */
export const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return iso(d);
};
/** A lesson she has mastered, not due for review for a while. */
export const mastered = (more: Record<string, unknown> = {}) => ({
  step: 9, passedOn: [day(-5), day(-4)], mastered: day(-4), reviews: 3, due: day(20), reviewMisses: 0, rating: 3, answers: 30, recent: [], slow: false, ...more,
});
export interface Seed {
  lessons?: Record<string, Record<string, unknown>>;
  doneOn?: string;
  bones?: number;
  best?: number;
  nickname?: string;
  /** Another child than the usual test child. */
  id?: string;
  stage?: 1 | 2;
  soundOff?: boolean;
  /** False: the tricks she has earned have not been given yet. Everything else she has earned is in place. */
  tricks?: boolean;
  /** Exactly these rewards, instead of the ones worked out from the lessons. */
  rewards?: { treasures?: Record<string, string>; tricks?: Record<string, string>; awards?: Record<string, string> };
  /** False: the starting check has not been done yet. */
  checked?: boolean;
}
/**
 * Puts a child on the device before the app starts. Later reloads keep whatever the app has saved since.
 * What her progress has earned is already hers, worked out by the app's own rules, so that a test starts
 * on the home screen and not on a row of reward cards. `tricks: false` leaves the tricks to be given;
 * `rewards` gives exactly those and nothing else.
 */
export async function seed(page: Page, s: Seed = {}): Promise<void> {
  const base = {
    profile: { id: s.id ?? 'child-test', nickname: s.nickname ?? 'Amani', picture: 'zebra', stage: s.stage ?? 1, created: day(-30) },
    child: { lessons: s.lessons ?? {}, ...(s.doneOn ? { doneOn: s.doneOn } : {}) },
    bones: s.bones ?? 0, best: s.best ?? 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: s.checked ?? true,
  };
  let rewards: Record<string, unknown> = { treasures: {}, tricks: {}, awards: {}, ...s.rewards };
  if (!s.rewards) {
    let d = readProfileData(JSON.parse(JSON.stringify(base)), day())!;
    // Given before today, so that today's reward, if a test earns one, can still come.
    for (let e = owedNext(d), n = 0; e && n < 400; e = owedNext(d), n++) d = give(d, e, day(-1));
    rewards = { ...d.rewards, ...(s.tricks === false ? { tricks: {} } : {}) };
  }
  const data = { ...base, rewards };
  await page.addInitScript(([d, soundOff]) => {
    if (localStorage.getItem('tens-and-ones.profiles')) return;
    localStorage.setItem('tens-and-ones.profiles', JSON.stringify([d.profile.id]));
    localStorage.setItem(`tens-and-ones.profile.${d.profile.id}`, JSON.stringify(d));
    if (soundOff) localStorage.setItem('tens-and-ones.settings', JSON.stringify({ soundOff: true }));
  }, [data, s.soundOff ?? false] as const);
}
/**
 * Takes every reward card that is on the screen, one after the other (a treasure: the first of the two),
 * and returns what they were, for example ["treasure t1"] or ["trick k1"].
 */
export async function collect(page: Page): Promise<string[]> {
  const got: string[] = [];
  for (let i = 0; i < 20; i++) {
    const card = page.getByTestId('reward');
    // A card may take a moment to follow the screen before it.
    if (!(await card.count())) { await page.waitForTimeout(150); if (!(await card.count())) break; }
    got.push(`${await card.getAttribute('data-reward')} ${(await card.getAttribute('data-slot')) ?? ''}`.trim());
    if (await card.locator('.treasurecard').count()) await card.locator('.treasurecard').first().click();
    await card.getByRole('button', { name: 'Next' }).click();
  }
  return got;
}
/**
 * Plays today's games to their end from wherever she is in them, every answer right, and returns the reward
 * taken at the end (never more than one a day). `pick` is the lesson to tap when the choice card comes.
 */
export async function playOut(page: Page, pick?: string): Promise<string[]> {
  for (let round = 0; round < 8; round++) {
    await page.locator('.card.game, [data-testid=choice], [data-testid=reward], [data-testid=today-text]').first().waitFor();
    if (await page.getByTestId('choice').count()) {
      const wanted = pick ? page.getByTestId('choice').locator(`[data-lesson=${pick}]`) : page.getByTestId('choice').locator('[data-lesson]').first();
      await ((await wanted.count()) ? wanted : page.getByTestId('choice').locator('[data-lesson]').first()).click();
    }
    if (!(await page.locator('.card.game').count())) return collect(page);
    const n = await page.locator('.dots > span').count();
    for (let i = 0; i < n; i++) await answerRight(page);
    const end = page.getByTestId('end');
    await expect(end).toBeVisible();
    const last = (await end.getByRole('button', { name: 'Back to the start' }).count()) > 0;
    await end.getByRole('button', { name: last ? 'Back to the start' : 'Keep going' }).click();
    if (last) return collect(page);
  }
  throw new Error('today’s games never end');
}
/**
 * The next morning: what was done and given today is now of yesterday. Reloads the app.
 * `finished`: and she has finished that day's games already (for a child whose games the test cannot play).
 */
export async function nextDay(page: Page, finished = false): Promise<void> {
  await page.evaluate(([today, yesterday, finished]) => {
    for (const id of JSON.parse(localStorage.getItem('tens-and-ones.profiles') ?? '[]')) {
      const k = `tens-and-ones.profile.${id}`, d = JSON.parse(localStorage.getItem(k)!);
      if (d.child.doneOn === today) d.child.doneOn = yesterday;
      if (d.rewards.lastOn === today) d.rewards.lastOn = yesterday;
      if (finished) d.child.doneOn = today;
      for (const l of Object.values(d.child.lessons) as { passedOn?: string[]; mastered?: string; reviewedOn?: string; due?: string }[]) {
        l.passedOn = (l.passedOn ?? []).map((x) => (x === today ? yesterday : x));
        if (l.mastered === today) l.mastered = yesterday;
        if (l.reviewedOn === today) l.reviewedOn = yesterday;
      }
      localStorage.setItem(k, JSON.stringify(d));
    }
  }, [day(), day(-1), finished] as const);
  await page.reload();
}
/** Starts today's games; `pick` is the lesson to tap when the choice card comes. */
export async function playToday(page: Page, pick?: string): Promise<void> {
  await page.getByRole('button', { name: /Play today’s games|Play again anyway/ }).click();
  if (pick) await page.getByTestId('choice').locator(`[data-lesson=${pick}]`).click();
}
/** What the app has saved for the test child. */
export const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('tens-and-ones.profile.child-test') ?? 'null'));

export const tensW = (t: number) => (t === 1 ? '1 ten' : `${t} tens`);
export const onesW = (o: number) => (o === 1 ? '1 one' : `${o} ones`);
/** "3 tens and 4 ones. 30 + 4 = 34." */
export const tensAndOnes = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}. ${Math.floor(n / 10) * 10} + ${n % 10} = ${n}.`;

export const feedback = (page: Page) => page.getByTestId('feedback');
export const oreo = (page: Page) => page.locator('.cheer .pup');
export const choice = (page: Page, n: number) => page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) });
export const wrongChoice = (page: Page, n: number) => page.locator('.choice').filter({ hasNotText: new RegExp(`^${n}$`) }).first();
export const next = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
export const bones = (page: Page) => page.locator('.dots .star');
export const paws = (page: Page) => page.locator('.dots .done');

/** The number a blocks picture shows, read from its description as a screen reader would. */
export async function blocksNumber(page: Page, within = '.stage'): Promise<number> {
  const label = await page.locator(`${within} .blocks`).first().getAttribute('aria-label');
  const m = /(\d+) tens? and (\d+) ones?/.exec(label ?? '');
  if (!m) throw new Error(`cannot read the blocks: ${label}`);
  return Number(m[1]) * 10 + Number(m[2]);
}

export async function fitsTheScreen(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

/**
 * The question on the screen, as the game was given it. Read from the page's own state, which only a
 * test does: it lets a test play any lesson right first time without knowing every game by heart.
 */
export const question = (page: Page) => page.evaluate(() => {
  // Start from an element the game itself has just drawn (its question line) and climb to the game: that way
  // the question read is the one on the screen now, not the one before it.
  const from = document.querySelector('.card.game[data-lesson] .prompt') as unknown as Record<string, unknown> | null;
  if (!from) return null;
  const key = Object.keys(from).find((k) => k.startsWith('__reactFiber'));
  type Fiber = { memoizedProps?: { q?: Record<string, unknown>; round?: unknown }; return?: Fiber };
  for (let f = key ? (from[key] as Fiber) : undefined, up = 0; f && up < 40; f = f.return, up++) {
    if (f.memoizedProps?.q && f.memoizedProps.round) return f.memoizedProps.q;
  }
  return null;
});

/**
 * Answers the question on the screen right first time and goes on to the next (or to the end of the round).
 * Knows the kinds of question the first lessons and the Stage 1 starting check ask: counting, a number
 * to type, a choice of numbers, shapes or coins. Throws for anything else, so a test never passes by luck.
 */
export async function answerRight(page: Page): Promise<void> {
  const card = page.locator('.card.game[data-lesson]');
  await expect(card).toBeVisible();
  const demo = page.getByRole('button', { name: 'Now you' });
  if (await demo.count()) { await expect(demo).toBeEnabled({ timeout: 12_000 }); await demo.click(); }
  // The question is on the screen and not yet answered: nothing is said under it.
  await expect(card.locator('.prompt')).toBeVisible();
  await expect(feedback(page)).toHaveText('');
  const q = await question(page);
  if (!q) throw new Error('answerRight could not read the question on the screen');
  const ans = Number(q.ans ?? q.n);
  if (await card.getByRole('button', { name: 'Move them' }).count()) await card.getByRole('button', { name: 'Move them' }).click();
  if (q.kind === 'count') for (const b of await card.locator('.fbone').all()) await b.click();
  if (await card.getByTestId('numpad').count()) {
    for (const d of String(ans)) await card.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
    await card.getByRole('button', { name: 'That is my answer' }).click();
  } else if (await card.locator('.moneybtn').count()) {
    await card.locator('.moneybtn').nth((q.opts as number[]).indexOf(ans)).click();
  } else if (await card.locator('.choice').count()) {
    const byText = card.locator('.choice').filter({ hasText: new RegExp(`^${ans}$`) });
    if (await byText.count()) await byText.click();
    else await card.locator('.choice').nth((q.opts as number[]).indexOf(ans)).click(); // shapes stand in the order of the choices
  } else throw new Error(`answerRight does not know this kind of question: ${JSON.stringify(q).slice(0, 200)}`);
  await expect(feedback(page)).toContainText('Woof!');
  await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
}
