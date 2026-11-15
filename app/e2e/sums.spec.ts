import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

interface Sum { a: number; b: number; op: '+' | '−' | 'more'; ans: number }

/** Reads the sum on screen, as a child who can read would. */
async function sum(page: Page): Promise<Sum> {
  const t = (await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' ');
  let m: RegExpExecArray | null;
  if ((m = /^(\d+) ([+−]) (\d+) = \?$/.exec(t))) {
    const a = Number(m[1]), b = Number(m[3]);
    return { a, b, op: m[2] as '+' | '−', ans: m[2] === '+' ? a + b : a - b };
  }
  if ((m = /Oreo has (\d+) bones\. She (finds|eats) (\d+)/.exec(t))) {
    const a = Number(m[1]), b = Number(m[3]);
    return m[2] === 'finds' ? { a, b, op: '+', ans: a + b } : { a, b, op: '−', ans: a - b };
  }
  if (t === 'How many more?') {
    const rows = page.locator('.rows2');
    const a = Number(await rows.getAttribute('data-top')), b = Number(await rows.getAttribute('data-bottom'));
    return { a, b, op: 'more', ans: a - b };
  }
  throw new Error(`a question the test cannot read: ${t}`);
}
const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByTestId('typed')).toHaveText(String(n));
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
const through = (s: Sum) => (s.op === '+' ? s.a < 10 && s.ans > 10 : s.op === '−' && s.a > 10 && s.ans < 10);
const hintFor = (s: Sum) =>
  through(s) ? (s.op === '+' ? 'Fill the ten first. Then add the rest.' : 'Go down to ten first. Then take away the rest.')
  : s.op === '+' ? 'Count on from the blue ones. The yellow ones come next.'
  : 'The crossed-out ones are gone. Count the ones that are left.';

test.describe('Adding', () => {
  test('step 1, see it: two colours in one ten frame', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 1);
    await expect(page.getByTestId('title')).toHaveText('Adding');
    const s = await sum(page);
    const frame = page.locator('.frames');
    await expect(frame).toHaveAttribute('data-blue', String(s.a));
    await expect(frame).toHaveAttribute('data-sun', String(s.b));
    await expect(frame.locator('.frame')).toHaveCount(1);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Count on from the blue ones. The yellow ones come next.');
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} + ${s.b} = ${s.ans}.`);
    await expect(paws(page)).toHaveCount(1);
    await next(page);
    const s2 = await sum(page);
    await choice(page, s2.ans).click();
    await expect(bones(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });

  test('step 2, count on: the start is a numeral; a miss brings the frame back', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 2);
    const s = await sum(page);
    expect(s.b).toBeLessThanOrEqual(3);
    await expect(page.getByTestId('counton')).toContainText(String(s.a));
    await expect(page.getByTestId('counton').getByRole('img')).toHaveAttribute('aria-label', `${s.b} more`);
    await expect(page.locator('.frames')).toHaveCount(0);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Start at ${s.a} and count on ${s.b}.`);
    await expect(page.locator('.frames')).toHaveAttribute('data-blue', String(s.a));
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} + ${s.b} = ${s.ans}.`);
    expect(errors).toEqual([]);
  });

  test('step 3, in her head: typed on the number pad; the picture only if she asks or misses', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 3);
    const s = await sum(page);
    await expect(page.locator('.frames')).toHaveCount(0);
    await expect(page.locator('.choices')).toHaveCount(0);
    // The tick does nothing until something is typed, and a digit can be rubbed out.
    await expect(page.getByRole('button', { name: 'That is my answer' })).toBeDisabled();
    await page.getByTestId('numpad').getByRole('button', { name: '7', exact: true }).click();
    await page.getByRole('button', { name: 'Rub out' }).click();
    await expect(page.getByTestId('typed')).toHaveAttribute('aria-label', 'Nothing typed yet');
    await type(page, s.ans + 1);
    await expect(feedback(page)).toHaveText('Count on from the blue ones. The yellow ones come next.');
    await expect(page.locator('.frames')).toHaveAttribute('data-sun', String(s.b));
    await expect(page.getByTestId('typed')).toHaveAttribute('aria-label', 'Nothing typed yet'); // cleared for another go
    await type(page, s.ans);
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} + ${s.b} = ${s.ans}.`);
    await expect(page.getByTestId('numpad').getByRole('button', { name: '1', exact: true })).toBeDisabled();
    await next(page);
    // Asking for the picture is allowed, and costs the bone.
    const s2 = await sum(page);
    await page.getByRole('button', { name: 'Show a picture' }).click();
    await expect(page.locator('.frames')).toBeVisible();
    await type(page, s2.ans);
    await expect(paws(page)).toHaveCount(2);
    await expect(bones(page)).toHaveCount(0);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
});

test.describe('Taking away', () => {
  test('step 1, see it: the ones taken away are crossed out', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 4);
    await expect(page.getByTestId('title')).toHaveText('Taking away');
    const s = await sum(page);
    expect(s.op).toBe('−');
    await expect(page.locator('.frames')).toHaveAttribute('data-gone', String(s.b));
    await expect(page.locator('.frames .dot.gone')).toHaveCount(s.b);
    await expect(page.locator('.frames .dot:not(.gone)')).toHaveCount(s.ans);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('The crossed-out ones are gone. Count the ones that are left.');
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} − ${s.b} = ${s.ans}.`);
    expect(errors).toEqual([]);
  });

  test('step 2, the difference: two rows; a miss marks the ones with no partner', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 5);
    const s = await sum(page);
    expect(s.op).toBe('more');
    await expect(page.locator('.rows2 .lone')).toHaveCount(0);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Match them up, one to one. Count the ones with no partner.');
    await expect(page.locator('.rows2 .lone')).toHaveCount(s.ans);
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} − ${s.b} = ${s.ans}. ${s.ans} ${s.ans === 1 ? 'has' : 'have'} no partner.`);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });

  test('step 3, in her head, on the number pad', async ({ page }) => {
    await openGame(page, 'sums', 6);
    const s = await sum(page);
    await expect(page.locator('.frames')).toHaveCount(0);
    await type(page, s.ans + 2);
    await expect(feedback(page)).toHaveText('The crossed-out ones are gone. Count the ones that are left.');
    await expect(page.locator('.frames')).toHaveAttribute('data-gone', String(s.b));
    await type(page, s.ans);
    await expect(feedback(page)).toHaveText(`Woof! ${s.a} − ${s.b} = ${s.ans}.`);
  });
});

test.describe('Doubles', () => {
  test('step 1, see it: two equal rows', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 7);
    await expect(page.getByTestId('title')).toHaveText('Doubles');
    const s = await sum(page);
    expect(s.a).toBe(s.b);
    await expect(page.locator('.card.game .sub')).toHaveText(`Double ${s.a}`);
    await expect(page.locator('.rows2')).toHaveAttribute('data-top', String(s.a));
    await expect(page.locator('.rows2')).toHaveAttribute('data-bottom', String(s.a));
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Both rows are the same. Count one row, then count on.');
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! Double ${s.a} is ${s.ans}. ${s.a} + ${s.a} = ${s.ans}.`);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });

  test('step 2, in her head: a two-digit answer is typed', async ({ page }) => {
    await openGame(page, 'sums', 8);
    // Play on until a double that needs two digits comes.
    for (let i = 0; i < 6; i++) {
      const s = await sum(page);
      await expect(page.locator('.rows2')).toHaveCount(0);
      if (i === 0) {
        await type(page, s.ans === 2 ? 3 : s.ans - 1);
        await expect(feedback(page)).toHaveText('Both rows are the same. Count one row, then count on.');
        await expect(page.locator('.rows2')).toBeVisible();
      }
      await type(page, s.ans);
      await expect(feedback(page)).toHaveText(`Woof! Double ${s.a} is ${s.ans}. ${s.a} + ${s.a} = ${s.ans}.`);
      await next(page);
    }
    await expect(page.getByTestId('end')).toBeVisible();
  });
});

test.describe('Sums to 20', () => {
  test('step 1: adding through ten fills the first frame; a miss replays the move', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 9);
    await expect(page.getByTestId('title')).toHaveText('Sums to 20');
    const s = await sum(page);
    expect(through(s)).toBe(true);
    const frames = page.locator('.frames');
    await expect(frames.locator('.frame')).toHaveCount(2);
    // The first frame is full: the blue ones and the yellow ones that went across. The rest are in the second.
    await expect(frames.locator('.frame').first().locator('.dot')).toHaveCount(10);
    await expect(frames.locator('.frame').first().locator('.dot.sun')).toHaveCount(10 - s.a);
    await expect(frames.locator('.frame').nth(1).locator('.dot.sun')).toHaveCount(s.ans - 10);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Fill the ten first. Then add the rest.');
    // The replay: the yellow ones go back and come again, the ten first.
    await expect(frames).toHaveAttribute('data-sun', '0');
    await expect(frames).toHaveAttribute('data-sun', String(10 - s.a));
    await expect(frames).toHaveAttribute('data-sun', String(s.b), { timeout: 8000 });
    await choice(page, s.ans).click();
    const first = 10 - s.a;
    await expect(feedback(page)).toHaveText(`Woof! ${first} ${first === 1 ? 'fills' : 'fill'} the ten. 10 and ${s.ans - 10} make ${s.ans}.`);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });

  test('step 1: taking away through ten crosses out down to ten, then the rest', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 10);
    const s = await sum(page);
    expect(through(s)).toBe(true);
    const frames = page.locator('.frames');
    // Everything in the second frame is gone, and some of the first.
    await expect(frames.locator('.frame').nth(1).locator('.dot:not(.gone)')).toHaveCount(0);
    await expect(frames.locator('.frame').first().locator('.dot.gone')).toHaveCount(10 - s.ans);
    await wrongChoice(page, s.ans).click();
    await expect(feedback(page)).toHaveText('Go down to ten first. Then take away the rest.');
    await expect(frames).toHaveAttribute('data-gone', String(s.a - 10));
    await expect(frames).toHaveAttribute('data-gone', String(s.b), { timeout: 8000 });
    await choice(page, s.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! First down to 10, then ${10 - s.ans} more. ${s.a} − ${s.b} = ${s.ans}.`);
    expect(errors).toEqual([]);
  });

  test('step 2, in her head: a whole round on the number pad, each miss told what fits that sum', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 11);
    for (let i = 0; i < 6; i++) {
      const s = await sum(page);
      await expect(page.locator('.frames')).toHaveCount(0);
      if (i % 2 === 0) {
        await type(page, s.ans === 20 ? 19 : s.ans + 1);
        await expect(feedback(page)).toHaveText(hintFor(s));
        await expect(page.locator('.frames')).toBeVisible();
      }
      await type(page, s.ans);
      await expect(feedback(page)).toContainText('Woof!');
      await expect(page.getByTestId('prompt')).toContainText(String(s.ans));
      await next(page);
    }
    await expect(page.getByTestId('end')).toContainText('Oreo got 3 bones.');
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });

  test('step 3, use it: a story, answered on the number pad, with the number sentence at the end', async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'sums', 12);
    const s = await sum(page);
    await expect(page.getByTestId('prompt')).toContainText(s.op === '+' ? 'How many bones does she have now?' : 'How many bones are left?');
    await type(page, s.ans === 20 ? 19 : s.ans + 1);
    await expect(feedback(page)).toHaveText(hintFor(s));
    await expect(page.locator('.frames')).toBeVisible();
    await type(page, s.ans);
    await expect(page.getByTestId('equation')).toHaveText(`${s.a} ${s.op} ${s.b} = ${s.ans}`);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
});
