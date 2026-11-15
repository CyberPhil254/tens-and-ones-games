import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { COUNT_LEVELS, type CountQ } from './count';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): CountQ[] => {
  const rng = seededRng(level * 101 + 5);
  return Array.from({ length: n }, () => makeQuestion('count', level, rng));
};

describe('Count and guess: every question the maker can make', () => {
  it.each(Array.from({ length: COUNT_LEVELS }, (_, i) => i + 1))('level %i: everything said has a clip; choices unique with one right answer', (level) => {
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

  it.each([[1, 3, 10], [2, 11, 20], [3, 4, 12]] as const)('level %i: exactly n bones, each in a place of its own, n from %i to %i', (level, lo, hi) => {
    for (const q of draw(level)) {
      expect(q.n >= lo && q.n <= hi).toBe(true);
      expect(q.spots).toHaveLength(q.n);
      expect(new Set(q.spots.map((s) => `${s.col},${s.row}`)).size).toBe(q.n); // no two in the same place
      for (const s of q.spots) expect(s.col >= 0 && s.col < q.cols).toBe(true);
      expect(q.ans).toBe(q.n);
    }
    expect(new Set(draw(level).map((q) => q.n)).size).toBe(hi - lo + 1);
  });

  it('zero: the empty plate comes up often; in her head the answer is zero or the number itself', () => {
    const plates = draw(4);
    expect(plates.filter((q) => q.n === 0).length).toBeGreaterThan(1200);
    for (const q of plates) expect(q.opts).toEqual([0, 1, 2, 3, 4]);
    for (const q of draw(5)) {
      const m = /^(\d+) ([+−]) (\d+)$/.exec(q.eq!)!;
      expect(q.ans).toBe(m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]));
      expect(q.eq).toMatch(/\b0\b|^(\d+) − \1$/);
    }
    expect(new Set(draw(5).map((q) => (q.ans === 0 ? 'none' : 'same')))).toEqual(new Set(['none', 'same']));
  });

  it.each([6, 7] as const)('level %i: a guess has one nearest answer, clearly nearer than the others', (level) => {
    for (const q of draw(level)) {
      expect(q.spots).toHaveLength(q.n);
      expect(new Set(q.spots.map((s) => `${s.col},${s.row}`)).size).toBe(q.n);
      const gaps = q.opts!.map((o) => Math.abs(o - q.n)).sort((x, y) => x - y);
      expect(Math.abs(q.ans - q.n)).toBe(gaps[0]);
      expect(gaps[1]! - gaps[0]!).toBeGreaterThanOrEqual(level === 6 ? 2 : 10);
    }
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('count', 8, seededRng(1))).toThrow(RangeError);
  });
});
