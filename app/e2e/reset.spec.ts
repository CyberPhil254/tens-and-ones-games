import { expect, test, type Page } from '@playwright/test';
import { answerRight, collect, day, fitsTheScreen, mastered, seed, watch } from './helpers';

async function openParents(page: Page) {
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const m = /(\d+) × (\d+)/.exec(await page.getByTestId('gate-question').innerText())!;
  await page.getByLabel('Your answer').fill(String(Number(m[1]) * Number(m[2])));
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByTestId('parents')).toBeVisible();
}
/** A saved profile, as far as these tests look into it. */
interface Saved { profile: { nickname: string }; child: { lessons: Record<string, unknown> }; bones: number; best: number; checked: boolean; attempts: unknown[]; rewards: unknown }
const profiles = (page: Page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('tens-and-ones.profile.')).map((k) => [k, JSON.parse(localStorage.getItem(k)!)])) as Record<string, Saved>);

/** A child is added on an empty device, as a parent does it. */
async function addChild(page: Page, name: string, animal: string) {
  await page.getByLabel('A nickname').fill(name);
  await page.getByRole('button', { name: animal }).click();
  await page.getByRole('button', { name: 'Stage 1' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
}
/** The whole starting check, every question right, then one whole part of today's games. Leaves her on the home screen. */
async function playADay(page: Page) {
  await page.getByTestId('startcheck').getByRole('button', { name: 'Start', exact: true }).click();
  const n = await page.locator('.dots > span').count();
  for (let i = 0; i < n; i++) await answerRight(page);
  await page.getByRole('button', { name: 'Back to the start' }).click();
  // Rewards the app owes come first, whatever they are; then today's games.
  await collect(page);
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  if (await page.getByTestId('choice').count()) await page.getByTestId('choice').locator('[data-lesson]').first().click();
  // One whole part of today's games (the warm-up, if she has one), and then she stops.
  const part = await page.locator('.dots > span').count();
  for (let i = 0; i < part; i++) await answerRight(page);
  await page.getByRole('button', { name: 'Stop for today' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
}
/** What a child who has never played sees and has, on the home screen, without a reload. */
async function expectFresh(page: Page, name: string) {
  await expect(page.locator('.whoami')).toContainText(name);
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', '0 bones');
  // Nothing among Oreo's things is hers yet: every one is a grey shape.
  await expect(page.getByTestId('things').locator('.thing:not(.not), button.trickbtn')).toHaveCount(0);
  await expect(page.getByTestId('reward')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Play today’s games' })).toBeVisible(); // today's games are not done
  await expect(page.getByTestId('free-note')).toBeVisible();
  const garden = page.getByTestId('garden');
  await expect(garden.locator('.stone.mastered, .stone.resting')).toHaveCount(0);
  // A fresh path: the first two stones open at their first step, with no step done; everything else behind a padlock.
  expect(await garden.locator('.stone.open').evaluateAll((all) => all.map((e) => `${e.getAttribute('data-lesson')} ${e.getAttribute('data-steps')}`))).toEqual(['s1-count 0/3', 's1-see 0/3']);
  await expect(garden.locator('.stone.passed, .stone.known')).toHaveCount(0);
  await expect(garden.locator('.stone.locked')).toHaveCount(39);
  await expect(garden.locator('[data-lesson=s1-count]')).toHaveAttribute('data-status', 'open');
}

test('Start again: a child who did the starting check and part of today’s games is wholly new afterwards, without a reload', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.goto('/');
  await addChild(page, 'Amani', 'zebra');
  await playADay(page);
  // There is something to lose: bones, lessons known and played, answers, the check done.
  const before = Object.values(await profiles(page))[0]!;
  expect(before.bones).toBeGreaterThanOrEqual(5);
  expect(before.checked).toBe(true);
  expect(Object.keys(before.child.lessons).length).toBeGreaterThan(3);
  expect(before.attempts.length).toBeGreaterThan(8);
  await expect(page.getByTestId('store')).not.toHaveAttribute('aria-label', '0 bones');

  await openParents(page);
  await page.getByTestId('p-settings').getByRole('button', { name: 'Start again' }).click();
  await page.getByRole('button', { name: 'Yes, delete Amani’s progress' }).click();
  await page.getByRole('button', { name: '← Home' }).click();

  // The starting check is offered again.
  await expect(page.getByTestId('startcheck')).toBeVisible();
  // What is saved is a new profile: the same child, nothing else.
  const after = Object.values(await profiles(page));
  expect(after).toHaveLength(1);
  expect(after[0]).toEqual({ profile: before.profile, child: { lessons: {} }, bones: 0, best: 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: false });
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expectFresh(page, 'Amani');
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of Count to 20. About ten minutes.');
  await fitsTheScreen(page);

  // Nothing of the old session is kept in memory: today's games start from the beginning, with no bones in the round.
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  if (await page.getByTestId('choice').count()) await page.getByTestId('choice').locator('[data-lesson]').first().click();
  await expect(page.locator('.card.game')).toHaveAttribute('data-step', '0');
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
  await answerRight(page);
  await page.getByRole('button', { name: '← Home' }).click(); // leaving counts for nothing
  await expectFresh(page, 'Amani');
  // And it is still so after the app is opened again.
  await page.reload();
  await expectFresh(page, 'Amani');
  expect(errors).toEqual([]);
});

test('Remove: the child and everything saved for her are gone, and the next child added is new', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.goto('/');
  await addChild(page, 'Amani', 'zebra');
  await playADay(page);
  await openParents(page);
  await page.getByTestId('p-children').getByRole('button', { name: 'Remove Amani' }).click();
  await page.getByRole('button', { name: 'Yes, remove Amani and everything saved' }).click();
  // No child is left: the app asks for one, and nothing of Amani is on the device.
  await expect(page.getByLabel('A nickname')).toBeVisible();
  expect(await profiles(page)).toEqual({});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tens-and-ones.profiles') ?? '[]'))).toEqual([]);
  // The same name again is a new child.
  await addChild(page, 'Amani', 'lion');
  await expect(page.getByTestId('startcheck')).toBeVisible();
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expectFresh(page, 'Amani');
  const now = Object.values(await profiles(page));
  expect(now).toHaveLength(1);
  expect(now[0]).toMatchObject({ child: { lessons: {} }, bones: 0, best: 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: true });
  expect(errors).toEqual([]);
});

test('Add a child: the new child is new, and the first child keeps everything', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.goto('/');
  await addChild(page, 'Amani', 'zebra');
  await playADay(page);
  const amani = Object.values(await profiles(page))[0]!;
  await openParents(page);
  await page.getByTestId('p-children').getByRole('button', { name: 'Add a child' }).click();
  await addChild(page, 'Baraka', 'lion');
  // Baraka is offered the starting check and has nothing of Amani's.
  await expect(page.getByTestId('startcheck')).toContainText('questions for Baraka.');
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expectFresh(page, 'Baraka');
  const all = Object.values(await profiles(page));
  expect(all).toHaveLength(2);
  expect(all.find((p) => p.profile.nickname === 'Amani')).toEqual(amani); // untouched
  expect(all.find((p) => p.profile.nickname === 'Baraka')).toMatchObject({ child: { lessons: {} }, bones: 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: true });
  // Back to Amani: she has what she had.
  await page.locator('.whoami').click();
  await page.getByRole('button', { name: /Amani/ }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${amani.bones} bones`);
  // And removing Baraka (the parents' area removes the child who is playing) leaves Amani as she was, playing.
  await page.locator('.whoami').click();
  await page.getByRole('button', { name: /Baraka/ }).click();
  await openParents(page);
  await page.getByTestId('p-children').getByRole('button', { name: 'Remove Baraka' }).click();
  await page.getByRole('button', { name: 'Yes, remove Baraka and everything saved' }).click();
  await expect(page.locator('.whoami')).toContainText('Amani');
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${amani.bones} bones`);
  expect(Object.values(await profiles(page))).toEqual([amani]);
  expect(errors).toEqual([]);
});

/** A child well into the app: lessons mastered and half done, bones, treasures, a trick, today's games finished. */
const farAlong = { stage: 2 as const, bones: 137, best: 31, doneOn: day(), lessons: { 's1-see': mastered(), 's1-count': mastered(), 's2-count': mastered(), 's2-place': mastered(), 's2-names': mastered(), 's2-regroup': mastered(), 's1-ten': { step: 1, rating: 1, answers: 40, passedOn: [] } } };
async function startAgain(page: Page) {
  await openParents(page);
  await page.getByTestId('p-settings').getByRole('button', { name: 'Start again' }).click();
  await page.getByRole('button', { name: 'Yes, delete Amani’s progress' }).click();
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByTestId('startcheck')).toBeVisible();
}

test('Start again for a Stage 2 child far along, with today’s games done: everything is gone at once', async ({ page }) => {
  await seed(page, farAlong);
  await page.goto('/');
  await expect(page.getByTestId('things').locator('.thing:not(.not)').first()).toBeVisible(); // she has things to lose
  await expect(page.getByRole('button', { name: 'Play again anyway' })).toBeVisible();
  await startAgain(page);
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expectFresh(page, 'Amani');
  expect(Object.values(await profiles(page))[0]).toMatchObject({ child: { lessons: {} }, bones: 0, best: 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [] });
});

test('Start again while the app is open in a second window: the other window does not bring the old progress back', async ({ page, context }) => {
  await seed(page, farAlong);
  await page.goto('/');
  // The same app, open a second time on the same device (a browser tab beside the installed app, say).
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.getByTestId('store')).toHaveAttribute('aria-label', '137 bones');

  await startAgain(page);
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
  await expectFresh(page, 'Amani');

  // The second window shows the new child too, without being reloaded...
  await other.bringToFront();
  await expect(other.getByTestId('store')).toHaveAttribute('aria-label', '0 bones');
  await expect(other.getByTestId('things').locator('.thing:not(.not), button.trickbtn')).toHaveCount(0);
  // ...and whatever is done there saves the new child, not the old one it once had in memory.
  await other.getByRole('button', { name: 'Play today’s games' }).click();
  if (await other.getByTestId('choice').count()) await other.getByTestId('choice').locator('[data-lesson]').first().click();
  const n = await other.locator('.dots > span').count();
  for (let i = 0; i < n; i++) await answerRight(other);
  await other.getByRole('button', { name: /Stop for today|Keep going|Back to the start/ }).first().click();
  const saved = Object.values(await profiles(page))[0]!;
  expect(saved.bones).toBe(n); // the bones of this one round, not 137 and more
  expect(Object.keys(saved.child.lessons)).toEqual(['s1-count']);
  expect(saved.rewards).toEqual({ treasures: {}, tricks: {}, awards: {} });
  // Back in the first window, after a reload: still the new child.
  await page.reload();
  expect(await collect(page)).toEqual(['treasure w1']); // what that one round earned the new child: her first paw's treasure
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${n} bones`);
  await expect(page.getByTestId('things').locator('button.trickbtn')).toHaveCount(0);
});
