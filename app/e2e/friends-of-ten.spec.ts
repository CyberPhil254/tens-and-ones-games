import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

const nums = async (page: Page) => (await page.getByTestId('prompt').innerText()).match(/\d+/g)!.map(Number);

for (const level of [1, 2]) {
  test(`Friends of Ten level ${level}: how many more make 10`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, /Friends of Ten/, level);
    await expect(page.getByText('Game 6: Friends of Ten')).toBeVisible();
    await expect(page.locator('.pad .choice')).toHaveCount(9); // the number pad: nothing to guess from
    const picture = page.locator('.stage .fiverow');
    let n: number;
    if (level === 1) {
      await expect(page.getByTestId('prompt')).toHaveText('How many more to make 10?');
      n = Number(/(\d+) fingers/.exec((await page.locator('.hands').getAttribute('aria-label'))!)![1]);
      await expect(page.locator('.hands .hand')).toHaveCount(2); // both hands, so the fingers down can be counted
    } else {
      n = (await nums(page))[0]!;
      await expect(page.getByTestId('prompt')).toHaveText(`${n} + ? = 10`);
      await expect(picture).toHaveCount(0); // the picture is hidden until it is needed
    }
    const ans = 10 - n;
    await wrongChoice(page, ans).click();
    await expect(feedback(page)).toHaveText('Count the empty places, or the fingers that are down.');
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await expect(picture).toBeVisible(); // the picture comes back as help
    await choice(page, ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${n} and ${ans} are friends of ten. ${n === 1 ? '1 finger' : `${n} fingers`} up, ${ans} down.`);
    await expect(page.locator('.frame .dot.sun')).toHaveCount(ans); // the empty places fill up
    if (level === 2) await expect(page.getByTestId('prompt')).toHaveText(`${n} + ${ans} = 10`);
    await expect(paws(page)).toHaveCount(1);

    await next(page);
    const m = level === 1 ? Number(/(\d+) fingers/.exec((await page.locator('.hands').getAttribute('aria-label'))!)![1]) : (await nums(page))[0]!;
    await choice(page, 10 - m).click();
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

test('Friends of Ten level 3: the gap to the next ten', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, /Friends of Ten/, 3);
  const [a, nextTen] = await nums(page);
  expect(nextTen! % 10).toBe(0);
  const ans = nextTen! - a!;
  expect(ans).toBeGreaterThan(0);
  expect(ans).toBeLessThan(10);
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', new RegExp(`^${Math.floor(a! / 10)} tens? and ${a! % 10} ones?$`));
  await wrongChoice(page, ans).click();
  await expect(feedback(page)).toHaveText('Count the empty places in the blue tower.');
  await choice(page, ans).click();
  await expect(feedback(page)).toHaveText(`Woof! ${a} + ${ans} = ${nextTen}. The same friends: ${a! % 10} and ${ans}.`);
  // The yellow ones fill the tower and it packs into a new ten.
  await expect(page.locator('.stage .blocks')).toHaveAttribute('aria-label', new RegExp(`^${nextTen! / 10} tens? and 0 ones$`));
  await expect(page.getByTestId('prompt')).toHaveText(`${a} + ${ans} = ${nextTen}`);
  await expect(paws(page)).toHaveCount(1);
  await next(page);
  const [a2, n2] = await nums(page);
  await choice(page, n2! - a2!).click();
  await expect(bones(page)).toHaveCount(1);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});
