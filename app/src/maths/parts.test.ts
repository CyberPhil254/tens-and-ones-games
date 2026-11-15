import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { isFair, PARTS_LEVELS, type PartsQ } from './parts';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): PartsQ[] => {
  const rng = seededRng(level * 89 + 2);
  return Array.from({ length: n }, () => makeQuestion('parts', level, rng));
};

describe('Halves and quarters: every question the maker can make', () => {
  it.each(Array.from({ length: PARTS_LEVELS }, (_, i) => i + 1))('level %i: everything said has a clip; choices unique with one right answer', (level) => {
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

  it.each([[1, 2], [4, 4]] as const)('level %i: three shapes, exactly one cut into %i equal parts, and the others clearly not', (level, into) => {
    for (const q of draw(level)) {
      expect(q.shapes).toHaveLength(3);
      const fair = q.shapes!.map((s) => isFair(s, into));
      expect(fair.filter(Boolean)).toHaveLength(1);
      expect(fair.indexOf(true)).toBe(q.ans);
      for (const s of q.shapes!) {
        expect(s.parts.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 5);
        // An unfair cut is never nearly fair: its parts differ by a good margin, or their number is wrong.
        if (!isFair(s, into) && s.parts.length === into) expect(Math.max(...s.parts) - Math.min(...s.parts)).toBeGreaterThan(0.12);
      }
    }
  });

  it('half of a set: an even number to 20; a quarter and three quarters: a multiple of four to 20', () => {
    for (const l of [2, 3]) for (const q of draw(l)) { expect(q.n! % 2 === 0 && q.n! >= 2 && q.n! <= 20 && q.quarters === 2).toBe(true); expect(q.ans).toBe(q.n! / 2); expect(!!q.opts).toBe(l === 2); }
    for (const l of [5, 7]) {
      const qs = draw(l);
      for (const q of qs) { expect(q.n! % 4 === 0 && q.n! >= 4 && q.n! <= 20).toBe(true); expect(q.ans).toBe((q.n! / 4) * q.quarters); expect(!!q.opts).toBe(l === 5); }
      expect(qs.some((q) => q.quarters === 1) && qs.some((q) => q.quarters === 3)).toBe(true);
    }
    expect(draw(7).some((q) => q.quarters === 2)).toBe(true);
  });

  it('the bar: a quarter, a half and three quarters are each placed and each read', () => {
    const qs = draw(6);
    for (const kind of ['bar', 'shade'] as const) expect(new Set(qs.filter((q) => q.kind === kind).map((q) => q.quarters))).toEqual(new Set([1, 2, 3]));
    // Two quarters shaded is told as a half.
    for (const q of qs.filter((x) => x.kind === 'shade' && x.quarters === 2)) expect(q.sayEq).toEqual(['two-quarters-are-the-same-as']);
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('parts', 8, seededRng(1))).toThrow(RangeError);
  });
});
