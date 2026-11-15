import { describe, expect, it } from 'vitest';
import { clipIds } from '../speech/catalogue';
import { makeQuestion } from './questions';
import { seededRng } from './random';
import { REGROUP_LEVELS, TEENS_LEVELS } from './teens';

const draw = <G extends 'teens' | 'regroup'>(game: G, level: number, n = 4000) => {
  const rng = seededRng(level * 17 + game.length);
  return Array.from({ length: n }, () => makeQuestion(game, level, rng));
};
const choicesOk = (opts: number[] | undefined, ans: number) => {
  if (!opts) return;
  expect(opts).toHaveLength(4);
  expect(new Set(opts).size).toBe(4);
  expect(opts.filter((o) => o === ans)).toHaveLength(1);
  expect([...opts].sort((x, y) => x - y)).toEqual(opts);
};

describe('Ten and some more: every question the maker can make', () => {
  it.each(Array.from({ length: TEENS_LEVELS }, (_, i) => i + 1))('level %i: one right answer, unique choices, numbers 10 to 20, everything said has a clip', (level) => {
    for (const q of draw('teens', level)) {
      expect(q.n >= 10 && q.n <= 20).toBe(true);
      expect(q.ans).toBe(q.kind === 'read' ? q.n : q.n - 10);
      choicesOk(q.opts, q.ans);
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });
  it('reading the blocks covers 10 to 20; the ones question never has zero ones', () => {
    expect(new Set(draw('teens', 1).map((q) => q.n)).size).toBe(11);
    expect(draw('teens', 2).every((q) => q.kind === 'ones' && q.ans >= 1 && q.ans <= 9)).toBe(true);
  });
  it('in her head: both kinds, on the number pad, never ten plus nothing', () => {
    const qs = draw('teens', 3);
    expect(qs.every((q) => !q.opts && q.n % 10 !== 0)).toBe(true);
    expect(new Set(qs.map((q) => q.kind))).toEqual(new Set(['read', 'ones']));
  });
});

describe('Another way: every question the maker can make', () => {
  it.each(Array.from({ length: REGROUP_LEVELS }, (_, i) => i + 1))('level %i: one ten fewer and ten ones more, the same number', (level) => {
    for (const q of draw('regroup', level)) {
      expect(q.n).toBe(q.t * 10 + q.o);
      expect((q.t - 1) * 10 + q.ans).toBe(q.n);
      expect(q.t).toBeGreaterThanOrEqual(2);
      expect(q.ans >= 10 && q.ans <= 19).toBe(true);
      choicesOk(q.opts, q.ans);
      expect(!!q.opts).toBe(level === 1);
      clipIds(q.say);
      clipIds(q.sayEq);
      clipIds(q.sayHint);
    }
  });
  it('refuses levels they do not have', () => {
    expect(() => makeQuestion('teens', 4, seededRng(1))).toThrow(RangeError);
    expect(() => makeQuestion('regroup', 3, seededRng(1))).toThrow(RangeError);
  });
});
