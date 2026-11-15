import { expect, test } from '@playwright/test';
import { blocksNumber, bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, tensAndOnes, watch, wrongChoice } from './helpers';

const HINT = 'Do not count every block. Count the red tens in tens: 10, 20, 30. Then add the blue ones.';

for (const level of [1, 2, 3]) {
  test(`Quick Look level ${level}: wrong, then right, then right first time`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'look', level);
    await expect(page.getByTestId('prompt')).toHaveText('How many?');
    const blocks = page.locator('.stage .blocks');
    const n = await blocksNumber(page);
    expect(n).toBeGreaterThanOrEqual(11);
    expect(n).toBeLessThanOrEqual(level === 1 ? 59 : 99);

    // Level 1 labels the tens from the start; level 2 only after a miss; level 3 hides the blocks after a moment.
    if (level === 1) await expect(blocks).toHaveClass(/counted/);
    else await expect(blocks).not.toHaveClass(/counted/);
    if (level === 3) await expect(page.getByTestId('flash')).toHaveClass(/covered/, { timeout: 4000 });

    await wrongChoice(page, n).click();
    await expect(feedback(page)).toHaveText(HINT);
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    if (level === 2) await expect(blocks).toHaveClass(/counted/);
    if (level === 3) await expect(blocks).not.toHaveClass(/counted/);

    await choice(page, n).click();
    await expect(feedback(page)).toHaveText(`Woof! ${tensAndOnes(n)}`);
    await expect(blocks).toHaveClass(/counted/);
    await expect(page.locator('.blabels')).toContainText(`= ${Math.floor(n / 10) * 10}`);
    if (level === 3) await expect(page.getByTestId('flash')).not.toHaveClass(/covered/);
    await expect(paws(page)).toHaveCount(1);

    await next(page);
    const m = await blocksNumber(page);
    await choice(page, m).click();
    await expect(feedback(page)).toHaveText(`Woof! ${tensAndOnes(m)}`);
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}
