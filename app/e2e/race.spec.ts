import { expect, test, type Page } from '@playwright/test';
import { day, feedback, fitsTheScreen, oreo, seed, watch } from './helpers';

const square = (page: Page, n: number) => page.locator('.hsq').getByRole('button', { name: String(n), exact: true });
async function sum(page: Page) {
  await expect(page.getByTestId('prompt')).toHaveText(/^\d+ \+ \d+ = \?$/);
  const m = /^(\d+) \+ (\d+) =/.exec(await page.getByTestId('prompt').innerText())!;
  return { pos: Number(m[1]), move: Number(m[2]), target: Math.min(100, Number(m[1]) + Number(m[2])) };
}

test('Race to 100 against Oreo: count on from where you stand, all the way to 100', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); // no pauses between turns, so the whole race fits in a test
  await seed(page, { doneOn: day() }); // the race is free play: it opens when today's games are done
  await page.goto('/');
  await page.getByRole('button', { name: /Race to 100/ }).click();
  await expect(page.getByTestId('prompt')).toHaveText('Race to 100');
  await page.getByRole('button', { name: 'Oreo', exact: true }).click();
  await expect(page.locator('.dots')).toHaveCount(0); // no bones in the race
  await expect(page.locator('.legend')).toHaveText('You: startOreo: start');

  const seen = { small: false, ten: false, past: false };
  let turn = 0;
  for (let i = 0; i < 200; i++) {
    await expect(page.getByTestId('prompt')).toHaveText(turn ? 'Oreo’s turn' : 'Your turn');
    await page.getByRole('button', { name: 'Spin' }).click();
    const { pos, move, target } = await sum(page);
    expect([1, 2, 3, 10]).toContain(move);
    await expect(page.locator('.card.game .sub')).toHaveText(
      pos + move > 100 ? 'That is past the end. Tap 100 to win!' : turn ? 'Tap the square where Oreo lands.' : 'Tap the square where you land.',
    );
    // Once for each kind of spin, tap a wrong square first and read the hint.
    const wrongSquare = target === 1 ? 2 : target - 1 === pos ? target + 1 : target - 1;
    if (move === 10 && !seen.ten && pos > 0 && pos + move <= 100) {
      seen.ten = true;
      await square(page, wrongSquare).click();
      await expect(feedback(page)).toHaveText('Ten on: go one row down. The ones stay the same.');
      await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
      await expect(page.locator('.hsq .col').first()).toBeVisible();
    } else if (move < 10 && !seen.small && pos + move <= 99) {
      seen.small = true;
      await square(page, wrongSquare).click();
      await expect(feedback(page)).toHaveText(`Start at ${pos} and count on ${move}.`);
    }
    if (pos + move > 100) seen.past = true;
    await square(page, target).click();
    if (target === 100) break;
    await expect(page.locator(`.legend .${turn ? 'p2' : 'p1'}`)).toHaveText(`${turn ? 'Oreo' : 'You'}: ${target}`);
    turn = 1 - turn;
  }
  expect(seen.small && seen.ten).toBe(true);
  await expect(page.getByTestId('prompt')).toHaveText(turn ? 'Oreo got to 100!' : 'You got to 100!');
  await expect(feedback(page)).toHaveText(turn ? 'Woof! What a race! Play again?' : 'Woof! You won the race!');
  await expect(page.getByRole('button', { name: 'Spin' })).toHaveCount(0);
  await fitsTheScreen(page);

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByTestId('prompt')).toHaveText('Race to 100');
  await page.getByRole('button', { name: 'A grown-up' }).click();
  await expect(page.locator('.legend')).toHaveText('You: startGrown-up: start');
  await page.getByRole('button', { name: 'Spin' }).click();
  const first = await sum(page);
  await square(page, first.target).click();
  await expect(page.getByTestId('prompt')).toHaveText('Grown-up’s turn');
  await page.getByRole('button', { name: '← Home' }).click();
  await expect(page.getByTestId('today-text')).toBeVisible();
  expect(errors).toEqual([]);
});
