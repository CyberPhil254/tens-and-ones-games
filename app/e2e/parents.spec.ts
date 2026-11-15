import { expect, test, type Page } from '@playwright/test';
import { day, fitsTheScreen, mastered, saved, seed, watch } from './helpers';

/** Opens the parents' area by answering its question, as a grown-up would. */
async function openParents(page: Page) {
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const q = await page.getByTestId('gate-question').innerText();
  const m = /(\d+) × (\d+)/.exec(q)!;
  await page.getByLabel('Your answer').fill(String(Number(m[1]) * Number(m[2])));
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByTestId('parents')).toBeVisible();
}

test('the parents’ area is behind a check a small child does not pass by tapping', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'For grown-ups' }).click();
  const gate = page.getByTestId('gate');
  await expect(gate.getByRole('button', { name: 'Open' })).toBeDisabled();
  await page.getByLabel('Your answer').fill('12');
  await gate.getByRole('button', { name: 'Open' }).click();
  await expect(gate.getByRole('alert')).toHaveText('That is not it. This part is for grown-ups.');
  await expect(page.getByTestId('parents')).toHaveCount(0);
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
});

test('progress by unit, strong, weak and slow, time this week, and a note with its source for every lesson', async ({ page }) => {
  const errors = watch(page);
  const now = new Date();
  await seed(page, {
    lessons: { 's1-see': mastered(), 's1-ten': { step: 1, rating: -2, answers: 18 }, 's2-names': mastered({ slow: true }) },
  });
  await page.addInitScript((t) => {
    const k = 'tens-and-ones.profile.child-test';
    const d = JSON.parse(localStorage.getItem(k) ?? 'null');
    if (d && !d.attempts.length) {
      // Six answers a minute apart, today.
      d.attempts = Array.from({ length: 6 }, (_, i) => ({ lesson: 's1-ten', step: 1, part: 'new', clean: i % 2 === 0, misses: i % 2, hint: false, ms: 5000, at: new Date(t - (6 - i) * 60_000).toISOString() }));
      localStorage.setItem(k, JSON.stringify(d));
    }
  }, now.getTime());
  await page.goto('/');
  await page.reload();
  await openParents(page);

  await expect(page.getByTestId('p-week')).toContainText(/About [4-6] minutes on 1 day\./);
  await expect(page.getByTestId('p-strong')).toHaveText('See how many, Number names to 100');
  await expect(page.getByTestId('p-weak')).toHaveText('Friends of ten');
  await expect(page.getByTestId('p-slow')).toHaveText('Number names to 100');

  const progress = page.getByTestId('p-progress');
  await expect(progress.locator('[data-unit=s1-u1] h3')).toContainText('1 of 4 mastered');
  await expect(progress.locator('.plesson')).toHaveCount(41);
  const ten = progress.locator('[data-lesson=s1-ten]');
  await expect(ten.locator('summary')).toContainText('Step 2 of 3');
  await ten.locator('summary').click();
  await expect(ten.locator('.pnote')).toContainText('Source: McNeil et al. 2025');
  await expect(ten.locator('.pnote')).toContainText('Strong evidence.');
  const see = progress.locator('[data-lesson=s1-see]');
  await see.locator('summary').click();
  await expect(see.locator('.pnote')).toContainText('Mixed: studies disagree.'); // said as the research says it
  // Every lesson has a note with a source and a strength.
  expect(await progress.locator('.pnote .psource b').count()).toBe(41);

  await fitsTheScreen(page);
  // The approach page: plain words, the sources, and no claim it may not make.
  await page.getByRole('button', { name: 'How this app teaches, and the sources' }).click();
  const approach = page.getByTestId('approach');
  await expect(approach.locator('.sources li')).toHaveCount(24);
  const text = await approach.innerText();
  expect(text).not.toMatch(/endorse/i);
  expect(text.match(/Cambridge/g)).toHaveLength(1);
  expect(text).toContain('for learners following the Cambridge Primary curriculum');
  await fitsTheScreen(page);
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page.getByTestId('parents')).toBeVisible();
  expect(errors).toEqual([]);
});

test('settings: sound, stage, Star’s sister, and start again asks first', async ({ page }) => {
  await seed(page, { lessons: { 's1-see': mastered() }, bones: 40, doneOn: day() });
  await page.goto('/');
  await openParents(page);
  const settings = page.getByTestId('p-settings');

  await settings.getByRole('button', { name: 'Sound on' }).click();
  await expect(settings.getByRole('button', { name: 'Sound off' })).toBeVisible();
  await settings.getByRole('button', { name: 'Stage 1' }).click();
  await expect(settings.getByRole('button', { name: 'Stage 1' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('stars-sister')).toHaveText('Off'); // off unless a parent turns it on
  await page.getByTestId('stars-sister').click();
  await expect(page.getByTestId('stars-sister')).toHaveText('On');
  await expect(settings.locator('select')).toHaveValue('KES');

  // Start again: one tap does nothing final.
  await settings.getByRole('button', { name: 'Start again' }).click();
  await settings.getByRole('button', { name: 'No, keep it' }).click();
  expect((await saved(page)).bones).toBe(40);
  await settings.getByRole('button', { name: 'Start again' }).click();
  await settings.getByRole('button', { name: 'Yes, delete Amani’s progress' }).click();
  const s = await saved(page);
  expect(s.bones).toBe(0);
  expect(s.child.lessons).toEqual({});
  expect(s.profile).toMatchObject({ nickname: 'Amani', picture: 'zebra', stage: 1 });

  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tens-and-ones.settings')!))).toMatchObject({ soundOff: true, starsSister: true, currency: 'KES' });
});

test('a profile moves to another device as a code, and a wrong code is refused', async ({ page, browser }) => {
  await seed(page, { lessons: { 's1-see': mastered() }, bones: 23, nickname: 'Zuri' });
  await page.goto('/');
  await openParents(page);
  const move = page.getByTestId('p-move');
  await move.getByRole('button', { name: 'Make the code' }).click();
  const code = await page.getByTestId('code').inputValue();
  expect(code).toMatch(/^TENS1\.[A-Za-z0-9_-]+$/);
  await expect(move.getByRole('link', { name: 'Save as a file' })).toHaveAttribute('download', 'Zuri-tens-and-ones.txt');

  // Another device, with another child on it.
  const other = await (await browser.newContext({ viewport: page.viewportSize()! })).newPage();
  await seed(other, { bones: 2, id: 'child-other' });
  await other.goto(page.url());
  await openParents(other);
  await other.getByTestId('paste').fill('TENS1.not-a-code');
  await other.getByTestId('p-move').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(other.getByTestId('load-msg')).toHaveText('That is not a profile code from this app.');
  await other.getByTestId('paste').fill(code);
  await other.getByTestId('p-move').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(other.getByTestId('load-msg')).toContainText('Zuri is loaded');
  await expect(other.getByTestId('p-children').locator('.whobtn')).toHaveCount(2);
  await other.getByRole('button', { name: '← Home' }).click();
  await expect(other.locator('.whoami')).toContainText('Zuri');
  await expect(other.getByTestId('store')).toHaveAttribute('aria-label', '23 bones');
  await expect(other.locator('[data-lesson=s1-see]')).toHaveAttribute('data-status', 'mastered');
  await other.context().close();
});

test('children on the device: add one, switch, remove asks first', async ({ page }) => {
  await seed(page, { bones: 5 });
  await page.goto('/');
  await openParents(page);
  const kids = page.getByTestId('p-children');
  await kids.getByRole('button', { name: 'Add a child' }).click();
  await page.getByLabel('A nickname').fill('Baraka');
  await page.getByRole('button', { name: 'lion' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: /skip/ }).click();
  await expect(page.locator('.whoami')).toContainText('Baraka');
  await openParents(page);
  await expect(kids.locator('.whobtn')).toHaveCount(2);
  await kids.getByRole('button', { name: 'Remove Baraka' }).click();
  await kids.getByRole('button', { name: 'Yes, remove Baraka and everything saved' }).click();
  // One child is left, so she is the one playing.
  await expect(page.locator('.whoami')).toContainText('Amani');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tens-and-ones.profile.')).length)).toBe(1);
});
