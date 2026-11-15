import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { GROUPS_LEVELS, type GroupsQ } from './groups';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): GroupsQ[] => {
  const rng = seededRng(level * 71 + 4);
  return Array.from({ length: n }, () => makeQuestion('groups', level, rng));
};

describe('Equal groups: every question the maker can make', () => {
  it.each(Array.from({ length: GROUPS_LEVELS }, (_, i) => i + 1))('level %i: groups times size is the answer, to 100; unique choices; everything said has a clip', (level) => {
    for (const q of draw(level)) {
      expect(q.ans).toBe(q.g * q.k);
      expect(q.ans >= 1 && q.ans <= 100).toBe(true);
      if (q.opts) {
        expect(q.opts).toHaveLength(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
        expect([...q.opts].sort((x, y) => x - y)).toEqual(q.opts);
      }
      expect(!!q.opts).toBe([1, 2, 4].includes(level));
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });
  it('plates: at most five plates of at most five, so every bone can be seen', () => {
    for (const q of draw(1)) expect(q.g >= 2 && q.g <= 5 && q.k >= 2 && q.k <= 5).toBe(true);
  });
  it('the tables are the 1, 2, 5 and 10 times tables, each up to ten times', () => {
    for (const l of [4, 5]) {
      const qs = draw(l);
      expect(new Set(qs.map((q) => q.k))).toEqual(new Set([1, 2, 5, 10]));
      expect(new Set(qs.map((q) => q.g)).size).toBe(10);
    }
  });
  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('groups', 6, seededRng(1))).toThrow(RangeError);
  });
});
