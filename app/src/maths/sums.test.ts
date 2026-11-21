import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { makeQuestion } from './questions';
import { seededRng } from './random';
import { SUMS_LEVELS, type SumsQ } from './sums';

const many = (level: number, n = 4000): SumsQ[] => {
  const rng = seededRng(level * 7 + 1);
  return Array.from({ length: n }, () => makeQuestion('sums', level, rng));
};
const right = (q: SumsQ) => (q.kind === 'add' || q.kind === 'double' ? q.a + q.b : q.a - q.b);

describe('Sums to 20: every question the maker can make', () => {
  it.each(Array.from({ length: SUMS_LEVELS }, (_, i) => i + 1))('level %i: one right answer, unique choices, numbers in range, everything said has a clip', (level) => {
    for (const q of many(level)) {
      expect(q.ans, q.eq).toBe(right(q));
      expect(q.ans).toBeGreaterThanOrEqual(1);
      expect(q.ans).toBeLessThanOrEqual(20);
      expect(Math.max(q.a, q.b)).toBeLessThanOrEqual(19);
      expect(Math.min(q.a, q.b)).toBeGreaterThanOrEqual(1);
      if (q.opts) {
        expect(q.opts).toHaveLength(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.opts.filter((o) => o === q.ans)).toHaveLength(1);
        expect([...q.opts].sort((a, b) => a - b)).toEqual(q.opts);
        for (const o of q.opts) expect(o >= 0 && o <= 20).toBe(true);
      }
      expect(q.eq).toMatch(new RegExp(`= ${q.ans}$`));
      expect(q.hint.length).toBeGreaterThan(10);
      expect(q.hint).not.toMatch(/wrong/i);
      // Nothing is read out without a recording.
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });

  it('choices from step 1 and 2, the number pad from "in her head" on', () => {
    for (const l of [1, 2, 4, 5, 7, 9, 10]) expect(many(l, 50).every((q) => q.opts)).toBe(true);
    for (const l of [3, 6, 8, 11, 12]) expect(many(l, 50).every((q) => !q.opts)).toBe(true);
  });

  it('adding and taking away within 10 stay within 10', () => {
    for (const l of [1, 2, 3]) for (const q of many(l)) expect(q.kind === 'add' && q.ans <= 10 && !q.via).toBe(true);
    for (const l of [4, 6]) for (const q of many(l)) expect(q.kind === 'sub' && q.a <= 10 && !q.via).toBe(true);
    for (const q of many(5)) expect(q.kind === 'diff' && q.a <= 10 && q.b < q.a).toBe(true);
  });

  it('counting on starts from a number and adds one, two or three', () => {
    for (const q of many(2)) {
      expect(q.b).toBeLessThanOrEqual(3);
      expect(q.hint).toBe(`Start at ${q.a} and count on ${q.b}.`);
    }
  });

  it('doubles go from double 1 to double 10, every one', () => {
    for (const l of [7, 8]) expect(new Set(many(l).map((q) => q.a))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });

  it('through ten: the first part reaches ten exactly, and something is left to do after it', () => {
    for (const q of many(9)) {
      expect(q.via).toBeDefined();
      expect(q.a + q.via!.first).toBe(10);
      expect(q.via!.rest).toBeGreaterThanOrEqual(1);
      expect(q.via!.first + q.via!.rest).toBe(q.b);
      expect(q.hint).toBe('Fill the ten first. Then add the rest.');
    }
    for (const q of many(10)) {
      expect(q.a - q.via!.first).toBe(10);
      expect(q.via!.rest).toBeGreaterThanOrEqual(1);
      expect(q.via!.first + q.via!.rest).toBe(q.b);
      expect(q.hint).toBe('Go down to ten first. Then take away the rest.');
    }
  });

  it('level 10, step by step: "how many more to take away?" has one right answer, the rest after the ones', () => {
    for (const q of many(10)) {
      const { first, rest } = q.via!;
      expect(first).toBe(q.a - 10);
      expect(10 - rest).toBe(q.ans);
      expect(q.restOpts).toHaveLength(4);
      expect(new Set(q.restOpts).size).toBe(4);
      expect(q.restOpts!.filter((c) => c === rest)).toHaveLength(1);
      expect([...q.restOpts!].sort((x, y) => x - y)).toEqual(q.restOpts);
      for (const c of q.restOpts!) expect(c >= 0 && c <= 20).toBe(true);
      // What the three steps say has a clip.
      clipIds([q.a, 'frag.take-away', q.b, 'first-take-away-the-ones-tap']);
      clipIds([q.a, 'frag.take-away', first, 'frag.is', 10, 'how-many-more-do-you-still', 'look-at-the-row-of-dots']);
      clipIds(['now-take-the-rest-from-the', 10, 'frag.take-away', rest, 'how-many-are-left']);
    }
    for (const l of [4, 6, 9, 11, 12]) expect(many(l, 100).every((q) => !q.restOpts)).toBe(true);
  });

  it('in her head: adding and taking away, through ten and not, all turn up', () => {
    const qs = many(11);
    for (const kind of ['add', 'sub'] as const) {
      expect(qs.some((q) => q.kind === kind && q.via)).toBe(true);
      expect(qs.some((q) => q.kind === kind && !q.via)).toBe(true);
    }
    // The hint fits the sum: the move through ten only where there is one.
    for (const q of qs) expect(/ten first/.test(q.hint)).toBe(!!q.via);
  });

  it('stories: the words and the numbers agree', () => {
    for (const q of many(12)) {
      expect(q.story).toContain(`Oreo has ${q.a} bones.`);
      expect(q.story).toContain(q.kind === 'add' ? `She finds ${q.b} more.` : `She eats ${q.b} of them.`);
    }
    expect(new Set(many(12).map((q) => q.kind))).toEqual(new Set(['add', 'sub']));
  });

  it('refuses a level it does not have', () => {
    expect(() => makeQuestion('sums', 13, seededRng(1))).toThrow(RangeError);
  });
});
