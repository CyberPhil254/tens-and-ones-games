import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

/** "47 + 30 = ?" → start 47, the jump (+30 or −30), where it lands. */
async function sum(page: Page) {
  const m = /(\d+) ([+−]) (\d+) =/.exec(await page.getByTestId('prompt').innerText())!;
  const s = Number(m[1]), plus = m[2] === '+', jump = Number(m[3]);
  return { s, plus, jump, end: plus ? s + jump : s - jump, sign: m[2]! };
}
const square = (page: Page, n: number) => page.locator('.hsq').getByRole('button', { name: String(n), exact: true });

for (const level of [1, 2]) {
  test(`Jump in Tens level ${level}: tap where the jump lands`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, /Jump in Tens/, level);
    await expect(page.getByText('Game 7: Jump in Tens')).toBeVisible();
    const { s, plus, jump, end, sign } = await sum(page);
    expect(level === 1 ? [10] : [20, 30]).toContain(jump);
    await expect(page.locator('.hsq .here')).toHaveText(String(s));

    // One square to the side instead: the hint says which way a ten goes, and the column lights up.
    await square(page, s % 10 === 9 ? s - 1 : s + 1).click();
    const rows = jump === 10 || level === 1 ? 'one row' : `${jump / 10} rows`;
    await expect(feedback(page)).toHaveText(`A jump of ten goes straight ${plus ? 'down' : 'up'}. Go ${rows} ${plus ? 'down' : 'up'} the blue line.`);
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await expect(page.locator('.hsq .col').first()).toBeVisible();

    await square(page, end).click();
    await expect(feedback(page)).toHaveText(`Woof! ${s} ${sign} ${jump} = ${end}. Only the tens change.`);
    await expect(page.locator('.hsq .here')).toHaveText(String(end));
    await expect(page.locator('.hsq .was')).toHaveText(String(s));
    await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', new RegExp(`^${Math.floor(end / 10)} tens? and ${end % 10} ones?$`));
    await expect(paws(page)).toHaveCount(1);
    await square(page, 50).click(); // nothing more happens once it is answered
    await expect(page.locator('.hsq .here')).toHaveText(String(end));

    await next(page);
    const b = await sum(page);
    await square(page, b.end).click();
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

test('Jump in Tens level 3: count on or back in tens, three numbers', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, /Jump in Tens/, 3);
  const m = /Count (on|back) in tens from (\d+)/.exec(await page.getByTestId('prompt').innerText())!;
  const dir = m[1] === 'on' ? 10 : -10, s = Number(m[2]);
  await square(page, s + dir).click();
  await expect(feedback(page)).toHaveText('Yes! Keep going.');
  await expect(oreo(page)).toHaveAttribute('data-pose', 'pointing');
  await square(page, s + 3 * dir).click(); // skipping one is a miss
  await expect(feedback(page)).toHaveText(`A jump of ten goes straight ${dir > 0 ? 'down' : 'up'}. Go one row ${dir > 0 ? 'down' : 'up'} the blue line.`);
  await square(page, s + 2 * dir).click();
  await square(page, s + 3 * dir).click();
  await expect(feedback(page)).toHaveText(`Woof! Only the tens change. The ${s % 10 === 1 ? '1 one' : `${s % 10} ones`} stay the same.`);
  await expect(page.locator('.hsq .was')).toHaveCount(3);
  await expect(paws(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Jump in Tens level 4: in her head, the square only if she asks', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, /Jump in Tens/, 4);
  await expect(page.locator('.hsq')).toHaveCount(0);
  const a = await sum(page);
  await wrongChoice(page, a.end).click();
  await expect(feedback(page)).toHaveText(`${a.jump} is ${a.jump === 10 ? '1 ten' : `${a.jump / 10} tens`}. Change only the tens. The ones stay ${a.s % 10}.`);
  await choice(page, a.end).click();
  await expect(feedback(page)).toHaveText(`Woof! ${a.s} ${a.sign} ${a.jump} = ${a.end}. Only the tens change.`);
  await expect(paws(page)).toHaveCount(1);

  // Asking for the square is allowed, and then the answer earns a paw, not a bone.
  await next(page);
  const b = await sum(page);
  await page.getByRole('button', { name: 'Show the hundred square' }).click();
  await expect(page.locator('.hsq .here')).toHaveText(String(b.s));
  await expect(page.locator('.hsq button').first()).toBeDisabled(); // a picture, not an answer sheet
  await choice(page, b.end).click();
  await expect(paws(page)).toHaveCount(2);

  await next(page);
  const c = await sum(page);
  await choice(page, c.end).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
