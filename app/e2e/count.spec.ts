import { expect, test, type Page } from '@playwright/test';
import { bones, choice, feedback, fitsTheScreen, next, onesW, openGame, paws, seed, tensW, watch, wrongChoice } from './helpers';

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
  /** Goes past Oreo's demonstration, which comes before a child's first heap. */
  const pastDemo = async (page: Page) => {
    await expect(page.getByTestId('demo')).toHaveAttribute('data-step', 'packed', { timeout: 10_000 });
    await page.getByRole('button', { name: 'Now you' }).click();
  };
  const nearest = (n: number, ans: number) => {
    const t = Math.floor(n / 10), o = n % 10;
    const packed = t === 0 ? onesW(o) : o === 0 ? tensW(t) : `${tensW(t)} and ${o} more`;
    return `${n}. That is ${packed}${ans > n && o >= 5 ? `, nearly ${tensW(t + 1)}` : ''}, so ${ans} is nearest.`;
  };

  test(`${title}: one more peek and no more; after a miss and after the right answer the same bones pack into tens and ones`, async ({ page }) => {
    const errors = watch(page);
    await openGame(page, 'count', level);
    await expect(page.getByTestId('title')).toHaveText(title);
    await pastDemo(page);
    await expect(page.getByTestId('prompt')).toHaveText('About how many?');
    await expect(page.locator('.card.game .sub').first()).toHaveText('Pick the number that is closest.');
    const heap = page.getByTestId('heap');
    const n = Number(await heap.getAttribute('data-n'));
    await expect(heap.locator('.hbone')).toHaveCount(n); // exactly as many as it says
    expect((await page.locator('.choice').allInnerTexts()).map(Number)).toEqual([...opts]);
    const ans = [...opts].sort((a, b) => Math.abs(a - n) - Math.abs(b - n))[0]!;
    // Seen for a moment, then covered. One peek, and the button is gone: she cannot count them.
    const flash = page.getByTestId('flash'), peek = page.getByRole('button', { name: 'Peek again' });
    await expect(flash).toHaveClass(/covered/, { timeout: 4000 });
    await peek.click();
    await expect(flash).not.toHaveClass(/covered/);
    await expect(peek).toHaveCount(0);
    await expect(flash).toHaveClass(/covered/, { timeout: 4000 });
    // Mark every bone, to see afterwards that the packed ones are the very same.
    await heap.locator('.hbone').evaluateAll((all) => all.forEach((b, i) => ((b as HTMLElement).dataset.seen = String(i))));
    const before = await heap.locator('.hbone').evaluateAll((all) => all.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));

    await wrongChoice(page, ans).click();
    await expect(feedback(page)).toHaveText(nearest(n, ans));
    await expect(flash).not.toHaveClass(/covered/);
    await expect(heap).toHaveAttribute('data-packed', 'true');
    await expect(heap.locator('.hbone[data-seen]')).toHaveCount(n); // the same bones, not new ones
    await expect(heap.locator('.hbone')).toHaveCount(n);
    await expect(heap.locator('.tenbox')).toHaveCount(Math.floor(n / 10));
    await expect(heap).toHaveAttribute('aria-label', new RegExp(`: ${Math.floor(n / 10)} tens? and ${n % 10} more$`));
    await expect(page.getByTestId('checked')).toHaveCount(0); // no separate picture takes their place
    // They have moved, and come to rest in columns: each full ten is ten bones in one frame.
    await expect.poll(() => heap.locator('.hbone').evaluateAll((all) => all.every((b) => b.getAnimations().length === 0))).toBe(true);
    const after = await heap.locator('.hbone').evaluateAll((all) => all.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }));
    expect(after.map(([x, y]) => `${x},${y}`).join(' ')).not.toBe(before.map(([x, y]) => `${x},${y}`).join(' '));
    const boxes = await heap.locator('.tenbox').evaluateAll((all) => all.map((b) => { const r = b.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }));
    const field = (await heap.boundingBox())!;
    for (const [i, box] of boxes.entries()) {
      expect(after.filter(([x, y]) => x! > box.l && x! < box.r && y! > box.t && y! < box.b), `ten ${i + 1} holds ten bones`).toHaveLength(10);
      expect(box.l >= field.x - 1 && box.r <= field.x + field.width + 1).toBe(true);
    }
    expect(after.filter(([x, y]) => !boxes.some((box) => x! > box.l && x! < box.r && y! > box.t && y! < box.b))).toHaveLength(n % 10);
    expect(new Set(after.map(([x, y]) => `${x},${y}`)).size).toBe(n); // no two on top of each other
    for (const [x, y] of after) expect(x! > field.x && x! < field.x + field.width && y! > field.y && y! < field.y + field.height).toBe(true);
    await expect(peek).toHaveCount(0);

    await choice(page, ans).click();
    await expect(feedback(page)).toHaveText(`Woof! ${nearest(n, ans)}`);
    await expect(heap.locator('.hbone[data-seen]')).toHaveCount(n);
    await fitsTheScreen(page);

    // The next heap: answered right straight away, it packs just the same.
    await next(page);
    await expect(page.getByTestId('demo')).toHaveCount(0); // the demonstration comes once
    const n2 = Number(await heap.getAttribute('data-n'));
    const ans2 = [...opts].sort((a, b) => Math.abs(a - n2) - Math.abs(b - n2))[0]!;
    await expect(heap).not.toHaveAttribute('data-packed', 'true');
    await choice(page, ans2).click();
    await expect(feedback(page)).toHaveText(`Woof! ${nearest(n2, ans2)}`);
    await expect(heap).toHaveAttribute('data-packed', 'true');
    await expect(heap.locator('.tenbox')).toHaveCount(Math.floor(n2 / 10));
    await expect(heap.locator('.hbone')).toHaveCount(n2);
    expect(errors).toEqual([]);
  });
}

test('the first heap ever: Oreo shows how, guesses about ten, and the bones pack into a ten to show she was close', async ({ page }) => {
  const errors = watch(page);
  await openGame(page, 'count', 6);
  const demo = page.getByTestId('demo'), heap = page.getByTestId('heap'), go = page.getByRole('button', { name: 'Now you' });
  await expect(page.getByTestId('prompt')).toHaveText('Watch Oreo first');
  await expect(page.locator('.card.game .sub').first()).toHaveText('“Hmm, that looks like about ten.”');
  await expect(heap.locator('.hbone')).toHaveCount(11);
  await expect(go).toBeDisabled();
  await expect(page.locator('.choice')).toHaveCount(0); // nothing to answer yet
  expect(await demo.locator('span').allInnerTexts()).toEqual(['5', '10', '20']);
  await expect(demo.locator('.picked')).toHaveText('10', { timeout: 8000 });
  await expect(demo).toHaveAttribute('data-step', 'packed', { timeout: 8000 });
  await expect(heap.locator('.tenbox')).toHaveCount(1);
  await expect(heap.locator('.hbone')).toHaveCount(11);
  await expect(feedback(page)).toHaveText('11. That is 1 ten and 1 more, so 10 is nearest.');
  await fitsTheScreen(page);
  await go.click();
  await expect(page.getByTestId('prompt')).toHaveText('About how many?');
  await expect(feedback(page)).toHaveText('');
  await expect(page.locator('.choice')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('a child who has guessed heaps before gets no demonstration', async ({ page }) => {
  await seed(page, { lessons: { 's1-estimate': { step: 0, rating: 0, answers: 6 } } });
  await page.goto('/#try=count.6');
  await expect(page.getByTestId('prompt')).toHaveText('About how many?');
  await expect(page.getByTestId('demo')).toHaveCount(0);
});
