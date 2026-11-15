import { expect, test } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

for (const level of [1, 2]) {
  test(`See how many, new patterns, step ${level}: seen for a moment, then covered; a miss shows the groups`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'dots', level);
    await expect(page.getByTestId('title')).toHaveText('See how many, new patterns');
    const pic = page.locator('.dotpic');
    const n = Number(await pic.getAttribute('data-n'));
    await expect(pic.locator('.pdot')).toHaveCount(n); // exactly as many dots as the answer
    const flash = page.getByTestId('flash');
    await expect(flash).toHaveClass(/covered/, { timeout: 4000 });
    await page.getByRole('button', { name: 'Peek again' }).click();
    await expect(flash).not.toHaveClass(/covered/);

    await wrongChoice(page, n).click();
    await expect(feedback(page)).toHaveText('Do not count them all. Look for small groups you know.');
    // Now it stays, and the groups are marked.
    await expect(flash).not.toHaveClass(/covered/);
    await expect(page.getByRole('button', { name: 'Peek again' })).toHaveCount(0);
    const label = (await pic.getAttribute('aria-label'))!;
    const m = /a group of (\d+) and a group of (\d+)/.exec(label);
    if (m) {
      await expect(pic.locator('.ring')).toHaveCount(2);
      await expect(page.getByTestId('groups')).toHaveText(`${m[1]} and ${m[2]}`);
    }
    await choice(page, n).click();
    await expect(feedback(page)).toHaveText(m ? `Woof! ${m[1]} and ${m[2]} make ${n}.` : `Woof! ${n}. You just saw it!`);
    await expect(paws(page)).toHaveCount(1);
    await next(page);
    await choice(page, Number(await page.locator('.dotpic').getAttribute('data-n'))).click();
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}
