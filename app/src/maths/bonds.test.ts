import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { BONDS_LEVELS, type BondsQ } from './bonds';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const many = (level: number, n = 4000): BondsQ[] => {
  const rng = seededRng(level * 31 + 2);
  return Array.from({ length: n }, () => makeQuestion('bonds', level, rng));
};

describe('Friends of 20 and 100: every question the maker can make', () => {
  it.each(Array.from({ length: BONDS_LEVELS }, (_, i) => i + 1))('level %i: one right answer, unique choices, everything said has a clip', (level) => {
    for (const q of many(level)) {
      expect(q.n + q.ans).toBe(q.whole);
      expect(q.ans).toBeGreaterThanOrEqual(1);
      expect(q.eq).toBe(`${q.n} + ${q.ans} = ${q.whole}`);
      if (q.kind === 'tens') expect(q.n % 10 === 0 && q.ans % 10 === 0 && q.whole === 100).toBe(true);
      else expect(q.whole === 20 && q.n >= 1 && q.n <= 19).toBe(true);
      if (q.opts) {
        expect(q.opts).toHaveLength(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
        expect([...q.opts].sort((x, y) => x - y)).toEqual(q.opts);
      }
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });

  it('level 1 is to 20, level 2 is tens to 100, level 3 mixes both on the number pad', () => {
    expect(many(1, 200).every((q) => q.kind === 'to20' && q.opts)).toBe(true);
    expect(many(2, 200).every((q) => q.kind === 'tens' && q.opts)).toBe(true);
    const mixed = many(3, 400);
    expect(mixed.every((q) => !q.opts)).toBe(true);
    expect(new Set(mixed.map((q) => q.kind))).toEqual(new Set(['to20', 'tens']));
  });

  it('level 4, step by step: a teen number with ones; the ones question has one right answer, the friend of ten', () => {
    const qs = many(4);
    expect(new Set(qs.map((q) => q.n))).toEqual(new Set([11, 12, 13, 14, 15, 16, 17, 18, 19]));
    for (const q of qs) {
      const o = q.n - 10;
      expect(o + q.ans).toBe(10); // the same friends
      expect(q.onesOpts).toHaveLength(4);
      expect(new Set(q.onesOpts).size).toBe(4);
      expect(q.onesOpts!.filter((c) => c === q.ans)).toHaveLength(1);
      expect([...q.onesOpts!].sort((x, y) => x - y)).toEqual(q.onesOpts);
      expect(q.opts).toBeDefined();
      // What the two steps say has a clip: the ones and their friend, and the new ten.
      clipIds([q.n, 'frag.and-how-many-more-make', 20, 'the-ones-first', `friendsQ.${o}`]);
      clipIds([`newTen.${o}`, 'count-the-yellow-ones-that-is']);
    }
    expect(many(1, 200).every((q) => !q.onesOpts)).toBe(true);
  });

  it('every pair turns up: 1 to 19 for 20, and 10 to 90 for 100', () => {
    expect(new Set(many(1).map((q) => q.n)).size).toBe(19);
    expect(new Set(many(2).map((q) => q.n))).toEqual(new Set([10, 20, 30, 40, 50, 60, 70, 80, 90]));
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('bonds', 5, seededRng(1))).toThrow(RangeError);
  });
});
