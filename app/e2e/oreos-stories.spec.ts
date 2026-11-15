import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, oreo, paws, watch, wrongChoice } from './helpers';

/** Reads the story and works out the answer and the number sentence, as a reader would. */
async function story(page: Page): Promise<{ ans: number; eq: string; kind: string }> {
  const t = await page.getByTestId('prompt').innerText();
  let m: RegExpExecArray | null;
  if ((m = /Oreo has (\d+) bones\. She (?:finds|digs up) (\d+) more\./.exec(t))) return { kind: 'more', ans: +m[1]! + +m[2]!, eq: `${m[1]} + ${m[2]} = ${+m[1]! + +m[2]!}` };
  if ((m = /Oreo has (\d+) bones\. She eats (\d+) of them\./.exec(t))) return { kind: 'eats', ans: +m[1]! - +m[2]!, eq: `${m[1]} − ${m[2]} = ${+m[1]! - +m[2]!}` };
  if ((m = /Oreo has (\d+) bones\. She gives (\d+) bones to a friend\./.exec(t))) return { kind: 'gives', ans: +m[1]! - +m[2]!, eq: `${m[1]} − ${m[2]} = ${+m[1]! - +m[2]!}` };
  if ((m = /Oreo has (\d+) bones\. She hides (\d+) of them\./.exec(t))) return { kind: 'hides', ans: +m[1]! - +m[2]!, eq: `${m[1]} − ${m[2]} = ${+m[1]! - +m[2]!}` };
  if ((m = /Oreo wants (\d+) bones\. She has (\d+)\./.exec(t))) return { kind: 'wants', ans: +m[1]! - +m[2]!, eq: `${m[2]} + ${+m[1]! - +m[2]!} = ${m[1]}` };
  throw new Error(`a story the test does not know: ${t}`);
}

for (const level of [1, 2, 3]) {
  test(`Oreo's Stories level ${level}: read, answer, see the number sentence`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'story', level);
    await expect(page.getByTestId('prompt')).not.toContainText(/puppy|\bhe\b/i);
    const kinds = new Set<string>();

    // First story: a wrong answer brings the blocks and a hint that says how to think about it.
    const q = await story(page);
    kinds.add(q.kind);
    await expect(page.locator('.stage .blocks')).toHaveCount(0);
    await wrongChoice(page, q.ans).click();
    await expect(feedback(page)).not.toBeEmpty();
    await expect(feedback(page)).not.toHaveText(/wrong/i);
    await expect(oreo(page)).toHaveAttribute('data-pose', 'not-yet');
    await expect(page.locator('.stage .blocks')).toBeVisible();
    await choice(page, q.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${q.eq}.`);
    await expect(page.getByTestId('equation')).toHaveText(q.eq);
    await expect(paws(page)).toHaveCount(1);

    // Second story: asking for the blocks is free.
    await next(page);
    const r = await story(page);
    kinds.add(r.kind);
    await page.getByRole('button', { name: 'Show the blocks' }).click();
    await expect(page.locator('.stage .blocks')).toBeVisible();
    await choice(page, r.ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${r.eq}.`);
    await expect(bones(page)).toHaveCount(1);

    for (let i = 0; i < 4; i++) {
      await next(page);
      const s = await story(page);
      kinds.add(s.kind);
      await choice(page, s.ans).click();
      await expect(feedback(page)).toHaveText(`Woof! ${s.eq}.`);
    }
    await expect(bones(page)).toHaveCount(5);
    expect(kinds.size).toBeGreaterThanOrEqual(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}
