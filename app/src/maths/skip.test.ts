import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { makeQuestion } from './questions';
import { seededRng } from './random';
import { SKIP_LEVELS, type SkipQ } from './skip';

const draw = (level: number, n = 4000): SkipQ[] => {
  const rng = seededRng(level * 61 + 7);
  return Array.from({ length: n }, () => makeQuestion('skip', level, rng));
};

describe('Skip and spot: every question the maker can make', () => {
  it.each(Array.from({ length: SKIP_LEVELS }, (_, i) => i + 1))('level %i: everything said has a clip; choices unique with one right answer', (level) => {
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

  it('patterns: at least two whole repeats are shown, and exactly one shape continues it', () => {
    for (const q of draw(1)) {
      // Find the shortest repeating unit of what is shown; the answer must be what that unit gives next.
      const s = q.seq;
      const len = [2, 3].find((l) => s.length >= 2 * l && s.every((v, i) => v === s[i % l]))!;
      expect(len).toBeDefined();
      expect(q.ans).toBe(s[s.length % len]);
      expect(q.opts).toEqual([0, 1, 2]);
    }
  });

  it.each([[2, 20, [1, 2, 10]], [3, 20, [1, 2, 10]], [6, 100, [2, 5, 10]], [7, 100, [2, 5, 10]]] as const)('level %i: equal hops within %i, on and back, from any number', (level, top, sizes) => {
    const qs = draw(level);
    for (const q of qs) {
      // Three numbers are shown, or two for hops of ten within 20 (0, 10, then 20).
      expect(q.seq.length).toBe(top === 20 && Math.abs(q.step!) === 10 ? 2 : 3);
      for (let i = 1; i < q.seq.length; i++) expect(q.seq[i]! - q.seq[i - 1]!).toBe(q.step);
      const a = q.seq[0]!;
      expect(q.ans).toBe(q.seq.at(-1)! + q.step!);
      expect(sizes as readonly number[]).toContain(Math.abs(q.step!));
      for (const v of [a, q.ans]) expect(v >= (top === 100 ? 1 : 0) && v <= top).toBe(true); // the hundred square starts at 1
      expect(!!q.opts).toBe(level === 2 || level === 6);
    }
    expect(qs.some((q) => q.step! < 0)).toBe(true);
    expect(new Set(qs.map((q) => Math.abs(q.step!)))).toEqual(new Set(sizes));
    // Not only the times-table numbers: hops of 2 from an odd number, hops of 5 from 3.
    expect(qs.some((q) => Math.abs(q.step!) === 2 && q.seq[0]! % 2 === 1)).toBe(true);
  });

  it('odd and even: the answer is right for every number, and the ranges are as the lessons say', () => {
    for (const [level, lo, hi] of [[4, 1, 20], [5, 1, 20], [8, 21, 99]] as const) {
      const qs = draw(level);
      for (const q of qs) {
        expect(q.n! >= lo && q.n! <= hi).toBe(true);
        expect(q.ans).toBe(q.n! % 2);
      }
      expect(new Set(qs.map((q) => q.ans))).toEqual(new Set([0, 1]));
    }
  });

  it('number patterns: four numbers with equal steps, one of the middle two hidden', () => {
    const qs = draw(9);
    for (const q of qs) {
      for (let i = 1; i < 4; i++) expect(q.seq[i]! - q.seq[i - 1]!).toBe(q.step);
      expect([1, 2]).toContain(q.hole);
      expect(q.ans).toBe(q.seq[q.hole!]);
      expect(Math.min(...q.seq) >= 1 && Math.max(...q.seq) <= 99).toBe(true);
    }
    expect(new Set(qs.map((q) => Math.abs(q.step!)))).toEqual(new Set([2, 3, 4, 5, 10]));
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('skip', 10, seededRng(1))).toThrow(RangeError);
  });
});
