import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { DOTS_LEVELS, type DotsQ } from './dots';
import { makeQuestion } from './questions';
import { seededRng } from './random';

const draw = (level: number, n = 4000): DotsQ[] => {
  const rng = seededRng(level * 41 + 3);
  return Array.from({ length: n }, () => makeQuestion('dots', level, rng));
};

describe('See how many, new patterns: every question the maker can make', () => {
  it.each(Array.from({ length: DOTS_LEVELS }, (_, i) => i + 1))('level %i: the picture has exactly the number of dots, none touching, all inside', (level) => {
    for (const q of draw(level)) {
      expect(q.dots).toHaveLength(q.n);
      expect(q.groups.reduce((x, y) => x + y, 0)).toBe(q.n);
      expect(q.n >= 3 - (level === 2 ? 0 : 0) && q.n <= 10).toBe(true);
      for (const [i, p] of q.dots.entries()) {
        expect(p.x >= 9 && p.x <= 191 && p.y >= 9 && p.y <= 91).toBe(true);
        for (const o of q.dots.slice(i + 1)) expect(Math.hypot(p.x - o.x, p.y - o.y)).toBeGreaterThanOrEqual(18); // two radii
      }
      // Each group is small enough to be seen at once.
      for (const g of q.groups) expect(g >= 1 && g <= 6).toBe(true);
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts).size).toBe(4);
      expect(q.opts.filter((o) => o === q.n)).toHaveLength(1);
      expect([...q.opts].sort((x, y) => x - y)).toEqual(q.opts);
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });
  it('level 1 uses dice patterns, still; level 2 is two loose groups that differ from question to question', () => {
    expect(draw(1, 500).some((q) => q.groups.length === 1) && draw(1, 500).some((q) => q.groups.length === 2)).toBe(true);
    const two = draw(2, 500);
    expect(two.every((q) => q.groups.length === 2 && q.groups.every((g) => g <= 5))).toBe(true);
    expect(new Set(two.map((q) => JSON.stringify(q.dots))).size).toBeGreaterThan(450);
  });
  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('dots', 3, seededRng(1))).toThrow(RangeError);
  });
});
