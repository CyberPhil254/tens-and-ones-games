import { expect, test, type Page } from '@playwright/test';
import { day, feedback, fitsTheScreen, mastered, seed, watch } from './helpers';

const W1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const W10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const word = (n: number) => (n < 20 ? W1[n]! : W10[Math.floor(n / 10)]! + (n % 10 ? '-' + W1[n % 10]! : ''));

/** The answer to whichever of the three kinds of question is on screen. */
async function answerOf(page: Page): Promise<number> {
  // After an answer the solved question stays for a moment with its explanation; a new one has none yet.
  await expect(feedback(page)).toBeEmpty();
  await expect(page.getByTestId('prompt')).toHaveText(/\?/);
  const t = await page.getByTestId('prompt').innerText();
  let m: RegExpExecArray | null;
  if ((m = /^(\d+) \+ \? = 10$/.exec(t))) return 10 - Number(m[1]);
  if ((m = /^(\d+) ([+−]) (\d+) = \?$/.exec(t))) return m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
  const opts = (await page.locator('.choice').allInnerTexts()).map(Number);
  const n = opts.find((v) => t === `Which is ${word(v)}?`);
  if (n === undefined) throw new Error(`a question the test does not know: ${t}`);
  return n;
}
const tap = (page: Page, n: number) => page.locator('.choice:not(:disabled)').filter({ hasText: new RegExp(`^${n}$`) }).click();
const ready = { 's1-see': mastered(), 's1-ten': mastered(), 's2-calc': mastered() };

test('Quick Paws is closed until its two lessons are mastered, and until today’s games are done', async ({ page }) => {
  await seed(page, { doneOn: day() });
  await page.goto('/');
  const station = page.getByRole('button', { name: /Quick Paws/ });
  await expect(station).toBeDisabled();
  await expect(station).toContainText('Opens when Friends of ten and Tens and ones sums are mastered.');
});

test('Quick Paws: ten fast questions, no clock on screen, the time only at the end', async ({ page }) => {
  const errors = watch(page);
  await seed(page, { lessons: ready, doneOn: day(), soundOff: true });
  await page.goto('/');
  await page.getByRole('button', { name: /Quick Paws/ }).click();
  await expect(page.locator('.gtitle')).toHaveText('Quick Paws');
  await expect(page.locator('.dots > span')).toHaveCount(10);

  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.dots .star, .dots .done')).toHaveCount(i);
    // Nothing on screen counts time while she plays.
    await expect(page.getByText(/seconds?|\btime\b|:\d\d/i)).toHaveCount(0);
    const ans = await answerOf(page);
    if (i === 3) {
      // A wrong tap is still explained, even here.
      const opts = (await page.locator('.choice').allInnerTexts()).map(Number);
      await tap(page, opts.find((v) => v !== ans)!);
      await expect(feedback(page)).not.toBeEmpty();
      await expect(feedback(page)).not.toHaveText(/wrong/i);
      await tap(page, ans);
      continue;
    }
    await tap(page, ans);
    await expect(page.getByRole('button', { name: /^(Next|Finish)$/ })).toHaveCount(0); // it moves on by itself
  }

  const end = page.getByTestId('end');
  await expect(end.getByTestId('time')).toHaveText(/^\d+ seconds$/);
  await expect(end).toContainText('Oreo got 9 bones. That is your first best time.');
  await fitsTheScreen(page);
  const secs = Number((await end.getByTestId('time').innerText()).split(' ')[0]);
  await end.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('button', { name: /Quick Paws/ })).toContainText(`Best: ${secs} s`);
  expect(errors).toEqual([]);
});

test('Quick Paws: a slower run keeps the old best, and too many misses is not a best at all', async ({ page }) => {
  await seed(page, { lessons: ready, doneOn: day(), best: 1, soundOff: true });
  await page.goto('/');
  await page.getByRole('button', { name: /Quick Paws/ }).click();
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.dots .star, .dots .done')).toHaveCount(i);
    const ans = await answerOf(page);
    const opts = (await page.locator('.choice').allInnerTexts()).map(Number);
    if (i < 3) await tap(page, opts.find((v) => v !== ans)!);
    await tap(page, ans);
  }
  const end = page.getByTestId('end');
  await expect(end).toContainText('Oreo got 7 bones. Slow down a little and get them right first.');
  await end.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.dots .star, .dots .done')).toHaveCount(0);
  await expect(page.locator('.gtitle')).toHaveText('Quick Paws');
});
