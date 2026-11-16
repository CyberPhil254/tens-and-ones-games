import { expect, type Page } from '@playwright/test';

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
  /** False: the trick for a finished part of the garden has not been given yet. Treasures and tricks are otherwise in place. */
  tricks?: boolean;
  /** Exactly these rewards, instead of the ones worked out from the lessons. */
  rewards?: { treasures?: Record<string, string>; tricks?: Record<string, string>; awards?: Record<string, string> };
  /** False: the starting check has not been done yet. */
  checked?: boolean;
}
/** Puts a child on the device before the app starts. Later reloads keep whatever the app has saved since. */
export async function seed(page: Page, s: Seed = {}): Promise<void> {
  // What mastery has earned is already in the garden, unless the test is about giving it.
  const known = Object.keys(s.lessons ?? {}).filter((id) => s.lessons![id]!.mastered);
  const treasures = Object.fromEntries(known.map((id) => [id, 'ball']));
  const built: Record<string, string[]> = { 's2-u1': ['s2-count', 's2-place', 's2-names', 's2-regroup'], 's2-u4': ['s2-bonds', 's2-inverse', 's2-calc'], 'x-u1': ['x-fill', 'x-break', 'x-line'] };
  const tricks = s.tricks === false ? {} : Object.fromEntries(Object.entries(built).filter(([, ls]) => ls.every((l) => known.includes(l))).map(([u]) => [u, 'spin']));
  const data = {
    profile: { id: s.id ?? 'child-test', nickname: s.nickname ?? 'Amani', picture: 'zebra', stage: s.stage ?? 2, created: day(-30) },
    child: { lessons: s.lessons ?? {}, ...(s.doneOn ? { doneOn: s.doneOn } : {}) },
    bones: s.bones ?? 0, best: s.best ?? 0, rewards: s.rewards ? { treasures: {}, tricks: {}, awards: {}, ...s.rewards } : { treasures, tricks, awards: {} }, attempts: [], checked: s.checked ?? true,
  };
  await page.addInitScript(([d, soundOff]) => {
    if (localStorage.getItem('tens-and-ones.profiles')) return;
    localStorage.setItem('tens-and-ones.profiles', JSON.stringify([d.profile.id]));
    localStorage.setItem(`tens-and-ones.profile.${d.profile.id}`, JSON.stringify(d));
    if (soundOff) localStorage.setItem('tens-and-ones.settings', JSON.stringify({ soundOff: true }));
  }, [data, s.soundOff ?? false] as const);
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
