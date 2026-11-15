import { expect, test } from '@playwright/test';
import { day, seed } from './helpers';

const LEVELS: Record<string, number> = { sums: 12, plus: 3, bonds: 3, teens: 3, regroup: 2, hear: 3, dots: 2, more: 8, skip: 9, groups: 5, share: 3, parts: 7, money: 5, five: 3, pack: 3, look: 3, names: 3, walk: 3, friends: 3, jump: 4, fill: 4, take: 4, mystery: 3, story: 3 };
const RED = 'rgb(229, 72, 77)', BLUE = 'rgb(43, 109, 232)';

test('every game level: buttons a child taps are at least 72 px, the screen is plain, nothing scrolls sideways', async ({ page }) => {
  test.setTimeout(120_000);
  for (const [game, n] of Object.entries(LEVELS)) {
    for (let level = 1; level <= n; level++) {
      await page.goto(`/#try=${game}.${level}`);
      await page.reload();
      await expect(page.locator('.card.game')).toBeVisible();
      const found = await page.evaluate(() => ({
        over: document.documentElement.scrollWidth - window.innerWidth,
        paper: getComputedStyle(document.body).backgroundImage,
        small: [...document.querySelectorAll('button')]
          .filter((b) => b.offsetParent && !b.closest('.hsq') && !b.classList.contains('back') && !b.classList.contains('qspot'))
          .map((b) => ({ what: b.className || b.textContent, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) }))
          .filter((b) => b.w < 72 || b.h < 72),
      }));
      // Two exceptions, written down in docs/decisions.md: the hundred square (a hundred squares cannot each be 72 px on a phone)
      // and the places of the queue of ten, which are 72 px high and 64 px wide on a phone so that five fit in a row.
      expect(found.small, `${game} ${level}`).toEqual([]);
      expect(found.over, `${game} ${level}`).toBeLessThanOrEqual(0);
      expect(found.paper, `${game} ${level}`).toBe('none');
    }
  }
});

test('red and blue mean tens and ones and nothing else', async ({ page }) => {
  await seed(page, { doneOn: day() });
  // On a question screen, and on its end screen: the only red or blue buttons act on a ten or a one.
  for (const at of ['/#try=pack.3', '/#try=walk.2', '/#try=take.1', '/#try=five.1']) {
    await page.goto(at);
    await page.reload();
    await expect(page.locator('.card.game')).toBeVisible();
    const coloured = await page.evaluate(([red, blue]) =>
      [...document.querySelectorAll('button')]
        .filter((b) => b.offsetParent && [red, blue].includes(getComputedStyle(b).backgroundColor))
        .map((b) => `${getComputedStyle(b).backgroundColor === red ? 'red' : 'blue'}: ${b.textContent}`), [RED, BLUE]);
    for (const c of coloured) expect(c).toMatch(/^red: .*(ten|10)|^blue: .*(one|1)$/i);
  }
  // The home screen: the title and the bone count use them for tens and ones; no button does, except the number machine's.
  await page.goto('/');
  await expect(page.getByTestId('garden')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).not.toBe('none'); // the squared paper is for home
  const home = await page.evaluate(([red, blue]) =>
    [...document.querySelectorAll('button, .no')]
      .filter((b) => (b as HTMLElement).offsetParent && [red, blue].includes(getComputedStyle(b).backgroundColor))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent), [RED, BLUE]);
  expect(home.sort()).toEqual(['add one', 'add ten', 'take away one', 'take away ten']);
});

test('with less motion asked for, nothing moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#try=five.1');
  const label = await page.locator('.fiverow [role=img]').last().getAttribute('aria-label');
  const n = /(\d+) (?:fingers|ones?|counters)/.exec(label ?? '')![1];
  await page.locator('.choice').filter({ hasText: new RegExp(`^${n}$`) }).click();
  const pup = page.locator('.cheer .pup');
  await expect(pup).toHaveAttribute('data-pose', 'happy');
  expect(parseFloat(await pup.evaluate((e) => getComputedStyle(e).animationDuration))).toBeLessThan(0.01);
});

test('works offline once it has been opened, voice included', async ({ page, context }) => {
  test.setTimeout(90_000);
  await seed(page);
  await page.goto('/');
  // The service worker fetches everything in the background the first time.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    return reg.scope;
  });
  await expect.poll(async () => page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (k) => (await (await caches.open(k)).keys()).map((r) => r.url)))).flat().filter((u) => u.includes('.mp3')).length), { timeout: 60_000 }).toBeGreaterThanOrEqual(2);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('today-text')).toHaveText('Two rounds of See how many. About ten minutes.');
  await expect.poll(() => page.getByTestId('garden').locator('img').evaluateAll((all) => all.every((i) => (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.goto('/#try=five.1');
  await expect(page.locator('.card.game')).toBeVisible();
  await expect(page.getByText('The voice did not load.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read it to me' })).toBeVisible();
  await context.setOffline(false);
});

test('installs as an app: a manifest with a name and icons', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const manifest = await (await page.request.get(href!)).json();
  expect(manifest).toMatchObject({ name: 'Tens and Ones', display: 'standalone' });
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});
