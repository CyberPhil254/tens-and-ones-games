import { expect, test, type Page } from '@playwright/test';
import { answerRight, collect, fitsTheScreen, watch } from './helpers';

async function openParents(page: Page) {
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const m = /(\d+) × (\d+)/.exec(await page.getByTestId('gate-question').innerText())!;
  await page.getByLabel('Your answer').fill(String(Number(m[1]) * Number(m[2])));
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByTestId('parents')).toBeVisible();
}
type Saved = { profile: { id: string; nickname: string; picture: string; stage: number; created: string } } & Record<string, unknown>;
const profiles = (page: Page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tens-and-ones.profile.')).map((k) => JSON.parse(localStorage.getItem(k)!))) as Promise<Saved[]>;
const byName = async (page: Page, name: string) => (await profiles(page)).find((p) => p.profile.nickname === name)!;
async function addChild(page: Page, name: string, animal: string) {
  await page.getByLabel('A nickname').fill(name);
  await page.getByRole('button', { name: animal }).click();
  await page.getByRole('button', { name: 'Stage 1' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByTestId('startcheck').getByRole('button', { name: /skip/ }).click();
}

test('change name or picture: only those two change; progress, bones, rewards and the review schedule stay exactly as they were', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.goto('/');
  // A child plays a round of today's games and earns bones, a step and her first treasure.
  await addChild(page, 'Amani', 'zebra');
  await page.getByRole('button', { name: 'Play today’s games' }).click();
  await page.getByTestId('choice').locator('[data-lesson=s1-count]').click();
  const n = await page.locator('.dots > span').count();
  for (let i = 0; i < n; i++) await answerRight(page);
  await page.getByRole('button', { name: 'Keep going' }).click();
  expect(await collect(page)).toEqual(['treasure w1']);
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${n} bones`);
  // A second child on the device, so that there is a profile chooser; then back to Amani.
  await openParents(page);
  await page.getByTestId('p-children').getByRole('button', { name: 'Add a child' }).click();
  await addChild(page, 'Baraka', 'lion');
  await page.locator('.whoami').click();
  await page.getByRole('button', { name: /Amani/ }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${n} bones`);

  const before = await byName(page, 'Amani');
  const baraka = await byName(page, 'Baraka');
  expect(before.bones).toBe(n);
  expect(Object.keys(before.child as object)).toContain('lessons');
  expect((before.attempts as unknown[]).length).toBe(n);
  expect(before.rewards).toMatchObject({ treasures: { w1: expect.any(String) } });

  await openParents(page);
  // Under the child's name.
  const open = page.getByRole('button', { name: 'Change name or picture' });
  const title = (await page.locator('.ptitle').boundingBox())!, btn = (await open.boundingBox())!;
  expect(btn.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
  expect(btn.y - (title.y + title.height)).toBeLessThan(40);
  await open.click();
  const form = page.getByTestId('p-edit');
  // It starts from what she has, offers the same nine pictures, and has nothing about the stage.
  await expect(form.getByLabel('A nickname')).toHaveValue('Amani');
  await expect(form.locator('.friendbtn')).toHaveCount(9);
  await expect(form.getByRole('button', { name: 'zebra' })).toHaveAttribute('aria-pressed', 'true');
  await expect(form.getByText(/stage/i)).toHaveCount(0);
  await fitsTheScreen(page);
  // Cancel changes nothing.
  await form.getByLabel('A nickname').fill('Someone else');
  await form.getByRole('button', { name: 'owl' }).click();
  await form.getByRole('button', { name: 'Cancel' }).click();
  expect(await byName(page, 'Amani')).toEqual(before);
  // The same rules as when a child is added: a name is needed, and only letters, digits and spaces are kept, 16 at most.
  await open.click();
  await expect(form.getByLabel('A nickname')).toHaveValue('Amani'); // not what was typed and cancelled
  await form.getByLabel('A nickname').fill('  !!  ');
  await expect(form.getByRole('button', { name: 'Save' })).toBeDisabled();
  await form.getByLabel('A nickname').fill('Zuri-<b>2</b> the lion!!');
  await form.getByRole('button', { name: 'owl' }).click();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toHaveCount(0);

  // Saved: the name and the picture are new; every other part of the profile is identical.
  const all = await profiles(page);
  expect(all).toHaveLength(2);
  const after = all.find((p) => p.profile.id === before.profile.id)!;
  expect(after.profile.nickname).toBe('Zurib2b the lion');
  expect(after.profile.picture).toBe('owl');
  expect({ ...after, profile: { ...after.profile, nickname: before.profile.nickname, picture: before.profile.picture } }).toEqual(before);
  for (const part of ['child', 'bones', 'best', 'rewards', 'attempts', 'checked'] as const) expect(after[part], part).toEqual(before[part]);
  expect(after.profile.stage).toBe(before.profile.stage);
  expect(after.profile.created).toBe(before.profile.created);
  expect(all.find((p) => p.profile.id === baraka.profile.id)).toEqual(baraka); // the other child is untouched

  // The new name and picture show everywhere at once, without a reload: the parents' area, ...
  await expect(page.locator('.ptitle')).toContainText('Zurib2b the lion: for grown-ups');
  await expect(page.locator('.ptitle img.friend')).toHaveAttribute('alt', 'owl');
  await expect(page.getByTestId('p-children').locator('.whobtn[aria-pressed=true]')).toContainText('Zurib2b the lion');
  await expect(page.getByTestId('p-children').locator('.whobtn[aria-pressed=true] img.friend')).toHaveAttribute('alt', 'owl');
  await expect(page.getByTestId('p-children').getByRole('button', { name: 'Remove Zurib2b the lion' })).toBeVisible();
  await expect(page.getByTestId('parents')).not.toContainText('Amani');
  // ... the home screen, with everything she has, ...
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.locator('.whoami')).toContainText('Zurib2b the lion');
  await expect(page.locator('.whoami img.friend')).toHaveAttribute('alt', 'owl');
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${n} bones`);
  await expect(page.getByTestId('things-treasures').locator('.thing:not(.not)')).toHaveCount(1);
  // ... and the profile chooser.
  await page.locator('.whoami').click();
  const mine = page.locator('.whobtn', { hasText: 'Zurib2b the lion' });
  await expect(mine).toHaveCount(1);
  await expect(mine.locator('img.friend')).toHaveAttribute('alt', 'owl');
  await expect(page.locator('.whobtn', { hasText: 'Amani' })).toHaveCount(0);
  await expect(page.locator('.whobtn', { hasText: 'Baraka' })).toHaveCount(1);
  // And after the app is opened again.
  await page.reload();
  await expect(page.locator('.whobtn', { hasText: 'Zurib2b the lion' })).toHaveCount(1);
  await page.locator('.whobtn', { hasText: 'Zurib2b the lion' }).click();
  await expect(page.getByTestId('store')).toHaveAttribute('aria-label', `${n} bones`);
  expect(errors).toEqual([]);
});
