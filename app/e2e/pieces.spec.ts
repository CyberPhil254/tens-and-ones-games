import { expect, test } from '@playwright/test';

test('the app opens without console errors and fits the screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  const foreign: string[] = [];
  page.on('request', (r) => new URL(r.url()).host !== 'localhost:4173' && foreign.push(r.url()));

  await page.goto('/#pieces');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'Tens and Ones' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Blocks' })).toBeVisible();

  // Tens digit red, ones digit blue.
  await expect(page.locator('.num .t').first()).toHaveCSS('color', 'rgb(229, 72, 77)');
  await expect(page.locator('.num .o').first()).toHaveCSS('color', 'rgb(43, 109, 232)');

  // Nothing may scroll sideways, least of all at 400 px.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // The fonts come with the app; nothing is fetched from another site.
  expect(foreign).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('600 20px Fredoka') && document.fonts.check('18px Andika'))).toBe(true);

  expect(errors).toEqual([]);
});

test('blocks: tens are red in groups of five, ones are blue, five dark then five light', async ({ page }) => {
  await page.goto('/#pieces');
  const widest = page.getByTestId('widest');
  const rods = widest.locator('.rod');
  await expect(rods).toHaveCount(9);
  await expect(rods.first().locator('i').first()).toHaveCSS('background-color', 'rgb(229, 72, 77)');

  // A wider gap before the sixth ten.
  const x = await rods.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
  expect(x[5]! - x[4]!).toBeGreaterThan(x[4]! - x[3]! + 5);

  const cubes = widest.locator('.cube');
  await expect(cubes.nth(4)).toHaveCSS('background-color', 'rgb(43, 109, 232)');
  await expect(cubes.nth(5)).toHaveCSS('background-color', 'rgb(134, 180, 255)');

  // 99 fits inside its card on the narrowest screen.
  const card = await widest.boundingBox();
  const blocks = await widest.locator('.blocks').boundingBox();
  expect(blocks!.x + blocks!.width).toBeLessThanOrEqual(card!.x + card!.width);
});

test('blocks follow the number', async ({ page }) => {
  await page.goto('/#pieces');
  const m = page.getByTestId('machine');
  await m.getByRole('button', { name: '+ 10' }).click();
  await m.getByRole('button', { name: '− 1', exact: true }).click();
  await expect(m.getByRole('img')).toHaveAttribute('aria-label', '4 tens and 3 ones');
  await expect(m.locator('.rod')).toHaveCount(4);
  await expect(m.locator('.cube')).toHaveCount(3);
});

test('the voice plays recorded clips by sentence id', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#pieces');
  const voice = page.getByTestId('voice');

  await voice.getByRole('button', { name: 'Hear the number' }).click();
  await expect(voice).toHaveAttribute('data-said', 'isTO.34');

  // An equation is stitched from number clips; the sentence after it is one whole clip.
  await voice.getByRole('button', { name: 'Hear 34 plus 10' }).click();
  await expect(voice).toHaveAttribute('data-said', 'num.34.mid frag.plus num.10.mid frag.is num.44.end only-the-tens-change');
  expect(errors).toEqual([]);
});

test('pictures: the number line and the hundred square follow a tap and fit a phone', async ({ page }) => {
  await page.goto('/#pieces');
  // Tap the middle of the line: 50.
  const hit = page.getByTestId('line-hit');
  const box = (await page.getByTestId('line').locator('.nl-bar').boundingBox())!;
  await hit.click({ position: { x: 10 + box.width / 2, y: 48 } });
  await expect(page.getByTestId('line').locator('.hrod')).toHaveCount(5);
  await expect(page.getByTestId('machine').getByRole('img')).toHaveAttribute('aria-label', '5 tens and 0 ones');

  const square = page.getByTestId('square');
  await square.getByRole('button', { name: '73', exact: true }).click();
  await expect(square.locator('.here')).toHaveText('73');
  await expect(square.locator('.col')).toHaveCount(9);

  // Every square is big enough for a small finger, and nothing is wider than the screen.
  const cell = (await square.getByRole('button', { name: '73', exact: true }).boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(28);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
