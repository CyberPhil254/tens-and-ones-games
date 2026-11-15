import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, openGame, paws, watch, wrongChoice } from './helpers';

const type = async (page: Page, n: number) => {
  for (const d of String(n)) await page.getByTestId('numpad').getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'That is my answer' }).click();
};
const said = (n: number) => (n === 1 ? '1 bone' : `${n} bones`);

for (const [level, lo, hi] of [[1, 3, 10], [2, 11, 20]] as const) {
  test(`Count to 20, ${lo} to ${hi}: she touches each bone once; the last number is how many`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'count', level);
    await expect(page.getByTestId('title')).toHaveText('Count to 20');
    const field = page.getByTestId('field');
    const n = await field.locator('.fbone').count();
    expect(n >= lo && n <= hi).toBe(true);
    await expect(page.locator('.choice')).toHaveCount(0); // she counts first
    for (let i = 0; i < n; i++) {
      await field.getByRole('button', { name: 'a bone', exact: true }).first().click();
      await expect(field).toHaveAttribute('data-counted', String(i + 1));
    }
    // Every bone has its own number, and none can be counted twice.
    await expect(field.getByRole('button', { name: 'a bone', exact: true })).toHaveCount(0);
    await expect(field.getByRole('button', { name: `bone number ${n}`, exact: true })).toBeDisabled();
    await expect(page.getByTestId('prompt')).toHaveText('How many?');
    await wrongChoice(page, n).click();
    await expect(feedback(page)).toHaveText('Count again. Touch each one once and say one number.');
    await expect(field).toHaveAttribute('data-counted', String(n), { timeout: 10_000 }); // counted again, one by one
    await choice(page, n).click();
    await expect(feedback(page)).toHaveText(`Woof! ${said(n)}. The last number you say is how many.`);
    await expect(paws(page)).toHaveCount(1);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}

test('Count to 20: the bones are moved, and there are still as many', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'count', 3);
  const field = page.getByTestId('field');
  const n = await field.locator('.fbone').count();
  await expect(page.locator('.card.game .sub')).toHaveText(`Here are ${said(n)}.`);
  const before = await field.locator('.fbone').first().boundingBox();
  await page.getByRole('button', { name: 'Move them' }).click();
  await expect(page.getByTestId('prompt')).toHaveText('How many now?');
  await expect(page.locator('.card.game .sub')).toHaveCount(0); // the number is no longer written
  await expect(field.locator('.fbone')).toHaveCount(n); // none added, none taken
  await expect.poll(async () => JSON.stringify(await field.locator('.fbone').evaluateAll((all) => all.map((b) => Math.round(b.getBoundingClientRect().left))))).not.toBe(JSON.stringify([Math.round(before!.x)]));
  await wrongChoice(page, n).click();
  await expect(feedback(page)).toHaveText('Nothing was added and nothing was taken away. The number is the same.');
  await expect(field).toHaveAttribute('data-counted', String(n), { timeout: 10_000 });
  await choice(page, n).click();
  await expect(feedback(page)).toHaveText(`Woof! Still ${n}. Nothing was added and nothing was taken away.`);
  await fitsTheScreen(page);
  expect(errors).toEqual([]);
});

test('Zero: a plate that is sometimes empty', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = watch(page);
  await openGame(page, 'count', 4);
  await expect(page.getByTestId('title')).toHaveText('Zero');
  let sawEmpty = false;
  for (let round = 0; round < 5 && !sawEmpty; round++) {
    for (let i = 0; i < 6; i++) {
      const n = await page.getByTestId('plate').locator('.ic').count();
      if (n === 0 && !sawEmpty) {
        sawEmpty = true;
        await wrongChoice(page, 0).click();
        await expect(feedback(page)).toHaveText('The plate is empty. Zero means none.');
      }
      await choice(page, n).click();
      await expect(feedback(page)).toHaveText(n === 0 ? 'Woof! The plate is empty. Zero means none.' : `Woof! ${said(n)}.`);
      await next(page);
    }
    if (!sawEmpty) await page.getByRole('button', { name: 'Play again' }).click();
  }
  expect(sawEmpty).toBe(true);
  expect(errors).toEqual([]);
});

test('Zero in her head: taking everything away, and adding nothing', async ({ page }) => {
  await openGame(page, 'count', 5);
  for (let i = 0; i < 6; i++) {
    const m = /^(\d+) ([+−]) (\d+) = \?$/.exec((await page.getByTestId('prompt').innerText()).replace(/\s+/g, ' '))!;
    const ans = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
    await expect(page.getByTestId('plate')).toHaveCount(0);
    if (i === 0) {
      await type(page, ans + 1);
      await expect(feedback(page)).toHaveText(m[2] === '+' ? 'Zero is nothing. Adding nothing changes nothing.' : 'Take them all away and none are left. None is zero.');
      await expect(page.getByTestId('plate').locator('.ic')).toHaveCount(ans);
    }
    await type(page, ans); // zero can be typed
    await expect(feedback(page)).toHaveText(`Woof! ${m[1]} ${m[2]} ${m[3]} = ${ans}.`);
    await next(page);
  }
  await expect(bones(page)).toHaveCount(5);
});

for (const [level, title, opts] of [[6, 'Guess, then check', [5, 10, 20]], [7, 'Guess a heap', [20, 50, 80]]] as const) {
  test(`${title}: a heap seen for a moment; a miss counts or packs it`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'count', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    const heap = page.getByTestId('heap');
    const n = Number(await heap.getAttribute('data-n'));
    await expect(heap.locator('.hbone')).toHaveCount(n); // exactly as many as it says
    expect((await page.locator('.choice').allInnerTexts()).map(Number)).toEqual([...opts]);
    const ans = [...opts].sort((a, b) => Math.abs(a - n) - Math.abs(b - n))[0]!;
    await expect(page.getByTestId('flash')).toHaveClass(/covered/, { timeout: 4000 });
    await wrongChoice(page, ans).click();
    await expect(feedback(page)).toContainText('Let’s check.');
    const checked = page.getByTestId('checked');
    await expect(checked).toContainText(said(n));
    if (level === 6) await expect(checked.locator('.frames .dot')).toHaveCount(n);
    else await expect(checked.locator('.blocks')).toHaveAttribute('aria-label', new RegExp(`^${Math.floor(n / 10)} tens? and ${n % 10} ones?$`));
    await choice(page, ans).click();
    await expect(feedback(page)).toHaveText(`Woof! Let’s check. ${said(n)}: nearest to ${ans}.`);
    await fitsTheScreen(page);
    expect(errors).toEqual([]);
  });
}
