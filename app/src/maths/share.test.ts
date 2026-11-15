import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { makeQuestion } from './questions';
import { seededRng } from './random';
import { SHARE_LEVELS, type ShareQ } from './share';

const draw = (level: number, n = 4000): ShareQ[] => {
  const rng = seededRng(level * 83 + 6);
  return Array.from({ length: n }, () => makeQuestion('share', level, rng));
};

describe('Fair shares: every question the maker can make', () => {
  it.each(Array.from({ length: SHARE_LEVELS }, (_, i) => i + 1))('level %i: exact answers only, with 2, 5 and 10; unique choices; everything said has a clip', (level) => {
    for (const q of draw(level)) {
      expect(q.n % q.by).toBe(0);
      expect(q.ans).toBe(q.n / q.by);
      expect([2, 5, 10]).toContain(q.by);
      expect(q.ans).toBeGreaterThanOrEqual(2);
      expect(q.n).toBeLessThanOrEqual(30); // every bone can be drawn
      if (q.opts) {
        expect(q.opts).toHaveLength(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
        expect([...q.opts].sort((x, y) => x - y)).toEqual(q.opts);
      }
      expect(!!q.opts).toBe(level < 3);
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });
  it('level 1 shares, level 2 makes groups, level 3 mixes both; 2, 5 and 10 all turn up', () => {
    expect(draw(1, 300).every((q) => q.kind === 'share')).toBe(true);
    expect(draw(2, 300).every((q) => q.kind === 'group')).toBe(true);
    expect(new Set(draw(3, 300).map((q) => q.kind))).toEqual(new Set(['share', 'group']));
    for (const l of [1, 2, 3]) expect(new Set(draw(l).map((q) => q.by))).toEqual(new Set([2, 5, 10]));
  });
  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('share', 4, seededRng(1))).toThrow(RangeError);
  });
});
