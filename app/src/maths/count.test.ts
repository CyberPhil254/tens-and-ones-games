import { describe, expect, it } from 'vitest';
import { CLIP_BY_ID, clipIds } from '../speech/catalogue';
import { SP } from '../speech/script';
import { clearlyNearest, COUNT_LEVELS, DEMO_HEAP, guessHeaps, GUESS, type CountQ } from './count';
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

  it.each([6, 7] as const)('level %i: every heap the maker can show has exactly one nearest choice, by a margin no good estimator would argue with', (level) => {
    const all = guessHeaps(level);
    expect(new Set(all.map((h) => h.n)).size).toBe(all.length); // a heap size belongs to one answer only
    for (const { n, ans, opts } of all) {
      const gaps = opts.map((o) => Math.abs(o - n)).sort((x, y) => x - y);
      expect(opts.filter((o) => Math.abs(o - n) === gaps[0]), `${n}: one nearest`).toEqual([ans]);
      // Any other choice is at least twice as far away, and at least 3 further.
      expect(gaps[1]!, `${n} among ${opts.join(', ')}`).toBeGreaterThanOrEqual(2 * gaps[0]!);
      expect(gaps[1]! - gaps[0]!, `${n} among ${opts.join(', ')}`).toBeGreaterThanOrEqual(3);
      expect(clearlyNearest(n, ans, opts)).toBe(true);
      for (const o of opts) if (o !== ans) expect(clearlyNearest(n, o, opts)).toBe(false);
    }
    // The maker shows these heaps and no others, and every one of them comes up.
    const drawn = draw(level);
    const known = new Map(all.map((h) => [h.n, h]));
    for (const q of drawn) {
      expect(q.spots).toHaveLength(q.n);
      expect(new Set(q.spots.map((s) => `${s.col},${s.row}`)).size).toBe(q.n);
      expect(known.get(q.n)).toEqual({ n: q.n, ans: q.ans, opts: q.opts });
      expect(q.hint).toBe(SP.nearest(q.n, q.ans));
      expect(clipIds(q.sayEq).concat(clipIds(q.sayHint))).toEqual([`nearest.${q.n}`, `nearest.${q.n}`]);
      expect(CLIP_BY_ID.get(`nearest.${q.n}`)!.text).toBe(q.hint); // what is said is what is shown
    }
    expect(new Set(drawn.map((q) => q.n)).size).toBe(all.length);
  });

  it('a heap size both estimating steps can show has the same nearest number in both', () => {
    const six = new Map(guessHeaps(6).map((h) => [h.n, h.ans]));
    const shared = guessHeaps(7).filter((h) => six.has(h.n));
    expect(shared.length).toBeGreaterThan(0);
    for (const h of shared) expect(six.get(h.n)).toBe(h.ans);
  });

  it('an in-between heap would not pass: 7 or 8 among 5, 10 and 20, or 35 among 20, 50 and 80', () => {
    for (const n of [7, 8]) expect(GUESS[6].opts.some((o) => clearlyNearest(n, o, GUESS[6].opts))).toBe(false);
    expect(GUESS[7].opts.some((o) => clearlyNearest(35, o, GUESS[7].opts))).toBe(false);
  });

  it('after a guess the number is said with its tens and ones, and why that is nearest', () => {
    expect(SP.nearest(12, 10)).toBe('12. That is 1 ten and 2 more, so 10 is nearest.');
    expect(SP.nearest(4, 5)).toBe('4. That is 4 ones, so 5 is nearest.');
    expect(SP.nearest(9, 10)).toBe('9. That is 9 ones, nearly 1 ten, so 10 is nearest.');
    expect(SP.nearest(10, 10)).toBe('10. That is 1 ten, so 10 is nearest.');
    expect(SP.nearest(18, 20)).toBe('18. That is 1 ten and 8 more, nearly 2 tens, so 20 is nearest.');
    expect(SP.nearest(20, 20)).toBe('20. That is 2 tens, so 20 is nearest.');
    expect(SP.nearest(44, 50)).toBe('44. That is 4 tens and 4 more, so 50 is nearest.');
    expect(SP.nearest(86, 80)).toBe('86. That is 8 tens and 6 more, so 80 is nearest.');
    expect(clipIds([`nearest.${DEMO_HEAP.n}`])).toHaveLength(1); // the demonstration's heap has its sentence
    expect(clearlyNearest(DEMO_HEAP.n, DEMO_HEAP.ans, DEMO_HEAP.opts)).toBe(true);
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('count', 8, seededRng(1))).toThrow(RangeError);
  });
});
