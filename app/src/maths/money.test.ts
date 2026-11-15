import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { MONEY, MONEY_LEVELS, PAY, type MoneyQ } from './money';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): MoneyQ[] => {
  const rng = seededRng(level * 97 + 8);
  return Array.from({ length: n }, () => makeQuestion('money', level, rng));
};
const total = (p: number[]) => p.reduce((x, y) => x + y, 0);

describe('Money: every question the maker can make', () => {
  it.each(Array.from({ length: MONEY_LEVELS }, (_, i) => i + 1))('level %i: only coins and notes that exist; everything said has a clip; choices unique with one right answer', (level) => {
    for (const q of draw(level)) {
      for (const v of [...q.items, ...(q.purses?.flat() ?? [])]) expect(MONEY).toContain(v);
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
      if (q.opts) {
        expect(new Set(q.opts).size).toBe(q.opts.length);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
      }
    }
  });
  it('the coins and notes are those of Kenya that the lessons need', () => {
    expect(MONEY).toEqual([1, 5, 10, 20, 50, 100]);
  });
  it('find the value: four different coins or notes, one of them asked for; every value is asked', () => {
    const qs = draw(1);
    for (const q of qs) { expect(new Set(q.items).size).toBe(4); expect(q.items).toContain(q.ans); }
    expect(new Set(qs.map((q) => q.ans))).toEqual(new Set(MONEY));
  });
  it('worth more: two different ones, the answer is the bigger value', () => {
    for (const q of draw(2)) { expect(q.items[0]).not.toBe(q.items[1]); expect(q.ans).toBe(Math.max(...q.items)); }
  });
  it('a purse: two to six pieces, biggest first, under 100, and the answer is its total', () => {
    for (const q of draw(3)) {
      expect(q.items.length >= 2 && q.items.length <= 6).toBe(true);
      expect([...q.items].sort((x, y) => y - x)).toEqual(q.items);
      expect(q.ans).toBe(total(q.items));
      expect(q.ans).toBeLessThanOrEqual(99);
      expect(q.opts).toHaveLength(4);
    }
  });
  it('make an amount: every amount asked can be made from what she is given', () => {
    for (const q of draw(4)) {
      expect(q.ans >= 6 && q.ans <= 99).toBe(true);
      let left = q.ans;
      for (const c of PAY) left %= c; // the ones always finish it
      expect(left).toBe(0);
    }
  });
  it('two purses: never the same amount; the answer is the one with more, whichever has more pieces', () => {
    const qs = draw(5);
    for (const q of qs) {
      const [a, b] = q.purses!;
      expect(total(a)).not.toBe(total(b));
      expect(q.ans).toBe(total(a) > total(b) ? 0 : 1);
    }
    // More pieces is not always more money: that case must turn up.
    expect(qs.some((q) => q.purses![q.ans]!.length < q.purses![1 - q.ans]!.length)).toBe(true);
  });
  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('money', 6, seededRng(1))).toThrow(RangeError);
  });
});
