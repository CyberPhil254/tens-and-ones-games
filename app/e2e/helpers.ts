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
  stage?: 1 | 2;
  soundOff?: boolean;
}
/** Puts a child on the device before the app starts. Later reloads keep whatever the app has saved since. */
export async function seed(page: Page, s: Seed = {}): Promise<void> {
  const data = {
    profile: { id: 'child-test', nickname: s.nickname ?? 'Amani', picture: 'zebra', stage: s.stage ?? 2, created: day(-30) },
    child: { lessons: s.lessons ?? {}, ...(s.doneOn ? { doneOn: s.doneOn } : {}) },
    bones: s.bones ?? 0, best: s.best ?? 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: true,
  };
  await page.addInitScript(([d, soundOff]) => {
    if (localStorage.getItem('tens-and-ones.profiles')) return;
    localStorage.setItem('tens-and-ones.profiles', JSON.stringify(['child-test']));
    localStorage.setItem('tens-and-ones.profile.child-test', JSON.stringify(d));
    if (soundOff) localStorage.setItem('tens-and-ones.settings', JSON.stringify({ soundOff: true }));
  }, [data, s.soundOff ?? false] as const);
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
