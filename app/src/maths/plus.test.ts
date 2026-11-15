import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { PLUS_LEVELS, type PlusQ } from './plus';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const many = (level: number, n = 4000): PlusQ[] => {
  const rng = seededRng(level * 13 + 5);
  return Array.from({ length: n }, () => makeQuestion('plus', level, rng));
};

describe('Tens and ones sums, adding: every question the maker can make', () => {
  it.each(Array.from({ length: PLUS_LEVELS }, (_, i) => i + 1))('level %i: one right answer, unique choices, no new ten, everything said has a clip', (level) => {
    for (const q of many(level)) {
      expect(q.ans).toBe(q.a + q.b);
      expect(q.ans).toBeLessThanOrEqual(99);
      // Two real two-digit numbers, each with ones.
      for (const n of [q.a, q.b]) expect(n >= 11 && n <= 88 && n % 10 !== 0).toBe(true);
      // No new ten: the ones together stay under ten, and so do the tens.
      expect((q.a % 10) + (q.b % 10)).toBeLessThanOrEqual(9);
      expect(q.t).toEqual([Math.floor(q.a / 10), Math.floor(q.b / 10), Math.floor(q.ans / 10)]);
      expect(q.o).toEqual([q.a % 10, q.b % 10, q.ans % 10]);
      if (q.opts) {
        expect(q.opts).toHaveLength(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
        expect([...q.opts].sort((x, y) => x - y)).toEqual(q.opts);
        for (const o of q.opts) expect(o >= 11 && o <= 99).toBe(true);
      }
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });

  it('choices with the blocks and the sketch, the number pad in her head', () => {
    expect(many(1, 50).every((q) => q.opts) && many(2, 50).every((q) => q.opts)).toBe(true);
    expect(many(3, 50).every((q) => !q.opts)).toBe(true);
  });

  it('the wrong choices are the slips children make: a ten or a one out', () => {
    const qs = many(1);
    const near = qs.filter((q) => q.opts!.some((o) => Math.abs(o - q.ans) === 10) && q.opts!.some((o) => Math.abs(o - q.ans) === 1));
    expect(near.length).toBeGreaterThan(qs.length * 0.5);
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('plus', 4, seededRng(1))).toThrow(RangeError);
  });
});
