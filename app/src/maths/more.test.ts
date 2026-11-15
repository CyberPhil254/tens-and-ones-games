import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { MORE_LEVELS, type MoreQ } from './more';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): MoreQ[] => {
  const rng = seededRng(level * 53 + 1);
  return Array.from({ length: n }, () => makeQuestion('more', level, rng));
};

describe('More or less: every question the maker can make', () => {
  it.each(Array.from({ length: MORE_LEVELS }, (_, i) => i + 1))('level %i: everything said has a clip; choices are unique with one right answer', (level) => {
    for (const q of draw(level)) {
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
      if (q.opts) {
        expect(new Set(q.opts).size).toBe(q.opts.length);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
      }
    }
  });

  it.each([[1, 20], [3, 100]] as const)('level %i: two different numbers to %i; the answer is the bigger or the smaller as asked', (level, top) => {
    for (const q of draw(level)) {
      const [a, b] = q.nums as [number, number];
      expect(a).not.toBe(b);
      expect(Math.max(a, b)).toBeLessThanOrEqual(top);
      expect(q.ans).toBe(q.ask === 'more' ? Math.max(a, b) : Math.min(a, b));
      expect(q.opts).toEqual([a, b]);
    }
    expect(new Set(draw(level).map((q) => q.ask))).toEqual(new Set(['more', 'less']));
  });

  it('to 100: the same tens, and fewer tens with more ones, both turn up, each with the hint that fits', () => {
    const qs = draw(3);
    const same = qs.filter((q) => Math.floor(q.nums[0]! / 10) === Math.floor(q.nums[1]! / 10));
    expect(same.length).toBeGreaterThan(1000);
    for (const q of same) expect(q.hint).toBe('The tens are the same. Look at the ones.');
    for (const q of qs.filter((x) => !same.includes(x))) {
      expect(q.hint).toBe('Look at the tens first. More tens is more.');
      const [lo, hi] = [...q.nums].sort((x, y) => x - y) as [number, number];
      expect(lo % 10).toBeGreaterThan(hi % 10); // the smaller number has more ones: looking at the ones misleads
    }
  });

  it.each([[2, 20], [4, 100]] as const)('level %i: three different numbers to %i, and their order', (level, top) => {
    for (const q of draw(level)) {
      expect(new Set(q.nums).size).toBe(3);
      expect(Math.max(...q.nums)).toBeLessThanOrEqual(top);
      expect(q.sorted).toEqual([...q.nums].sort((x, y) => x - y));
    }
  });

  it('the nearer ten: never a number ending in 0 or 5; the answer is the closer ten', () => {
    for (const l of [5, 6]) {
      for (const q of draw(l)) {
        const n = q.nums[0]!;
        expect(n % 5).not.toBe(0);
        expect(q.ans % 10).toBe(0);
        expect(Math.abs(q.ans - n)).toBeLessThan(5);
        expect(!!q.opts).toBe(l === 5);
      }
    }
    // 100 is a possible answer (96 is nearer to 100), so the pad for it must take three digits.
    expect(draw(6).some((q) => q.ans === 100)).toBe(true);
  });

  it('places: first to tenth are tapped; eleventh to twentieth are named, in a queue of twenty', () => {
    expect(new Set(draw(7).map((q) => q.ans))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    for (const q of draw(8)) {
      expect(q.ans >= 11 && q.ans <= 20 && q.queue === 20).toBe(true);
      expect(q.opts).toHaveLength(4);
      for (const o of q.opts!) expect(o >= 1 && o <= 20).toBe(true);
    }
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('more', 9, seededRng(1))).toThrow(RangeError);
  });
});
