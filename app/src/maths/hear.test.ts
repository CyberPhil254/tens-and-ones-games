import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { HEAR_LEVELS } from './hear';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000) => {
  const rng = seededRng(level * 23 + 9);
  return Array.from({ length: n }, () => makeQuestion('hear', level, rng));
};

describe('Number names, the additions: every question the maker can make', () => {
  it('level 1: a word from zero to twenty, four unique choices to 20, one of them right', () => {
    const qs = draw(1);
    expect(new Set(qs.map((q) => q.n)).size).toBe(21);
    for (const q of qs) {
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts).size).toBe(4);
      expect(q.opts!.filter((o) => o === q.n)).toHaveLength(1);
      expect([...q.opts!].sort((x, y) => x - y)).toEqual(q.opts);
      for (const o of q.opts!) expect(o >= 0 && o <= 20).toBe(true);
      clipIds(q.say);
    }
  });
  it('levels 2 and 3: the number is only spoken, and typed', () => {
    for (const q of draw(2)) { expect(q.opts).toBeUndefined(); expect(q.n >= 0 && q.n <= 20).toBe(true); expect(q.say).toEqual([q.n]); clipIds(q.say); }
    const three = draw(3);
    for (const q of three) { expect(q.opts).toBeUndefined(); expect(q.n >= 13 && q.n <= 99).toBe(true); clipIds(q.say); }
    // The pairs that sound alike both turn up often.
    expect(three.filter((q) => q.n < 20).length).toBeGreaterThan(600);
    expect(three.filter((q) => q.n % 10 === 0).length).toBeGreaterThan(600);
  });
  it('refuses a level it does not have', () => {
    expect(HEAR_LEVELS).toBe(3);
    expect(() => makeQuestion('hear', 4, seededRng(1))).toThrow(RangeError);
  });
});
