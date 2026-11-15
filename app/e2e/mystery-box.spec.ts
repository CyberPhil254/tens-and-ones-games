import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

/** Solves the number sentence on screen: "? + 4 = 10", "3 + ? + 5 = 14", "? − 20 = 34", "54 − ? = 34". */
async function solve(page: Page): Promise<{ text: string; ans: number }> {
  const text = await page.getByTestId('prompt').innerText();
  const [left, right] = text.split(' = ');
  const total = Number(right);
  const tokens = left!.split(' ');
  let ans: number;
  if (tokens.includes('−')) ans = tokens[0] === '?' ? total + Number(tokens[2]) : Number(tokens[0]) - total;
  else ans = total - tokens.filter((t) => /^\d+$/.test(t)).reduce((s, t) => s + Number(t), 0);
  return { text, ans };
}

const HINTS = [
  'The parts together are as long as the whole. What is missing?',
  'The mystery number is the whole. Put the two parts together.',
  'Take the part away from the whole. Only the tens change.',
  'The ones are the same. How many tens are gone?',
];

for (const level of [1, 2, 3]) {
  test(`Mystery Box level ${level}: find the missing number`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'mystery', level);
    await expect(page.locator('.bar .unk')).toHaveText('?');
    await expect(page.locator('.choice')).toHaveCount(level === 3 ? 4 : 9); // the pad where four choices would give it away

    const q = await solve(page);
    await wrongChoice(page, q.ans).click();
    expect(HINTS).toContain(await feedback(page).innerText());
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await choice(page, q.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! You found it. The mystery number is ${q.ans}.`);
    await expect(page.locator('.bar .unk.found')).toHaveText(String(q.ans));
    await expect(page.getByTestId('prompt')).toHaveText(q.text.replace('?', String(q.ans)));
    await expect(paws(page)).toHaveCount(1);

    // Several more, so every form of the question comes up.
    for (let i = 0; i < 5; i++) {
      await next(page);
      const r = await solve(page);
      await choice(page, r.ans).click();
      await expect(feedback(page)).toHaveText(`Woof! You found it. The mystery number is ${r.ans}.`);
    }
    await expect(bones(page)).toHaveCount(5);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}
