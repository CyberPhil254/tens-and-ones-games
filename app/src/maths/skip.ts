/**
 * Skip and spot: patterns, hops, odd and even. Nine levels over six lessons (see engine/curriculum.ts):
 *   What comes next             1 a pattern of shapes
 *   Steps of one, two and ten   2 hops on a line to 20, 3 the numbers only
 *   Odd and even to 20          4 counters paired up, 5 the number only
 *   Steps of two, five and ten  6 hops on the hundred square, 7 the numbers only
 *   Odd and even to 100         8 the number only
 *   Number patterns             9 the missing number in a pattern
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const SKIP_LEVELS = 9;

export interface SkipQ {
  kind: 'pattern' | 'hops' | 'oddeven' | 'missing';
  /** pattern: the shapes shown (0, 1 or 2), in order. hops: the numbers shown. missing: all four numbers. */
  seq: number[];
  /** hops and missing: the size of each hop, negative when going back. */
  step?: number;
  /** missing: which of the four is hidden. */
  hole?: number;
  /** oddeven: the number. */
  n?: number;
  /** pattern: the shape. hops and missing: the number. oddeven: 1 for odd, 0 for even. */
  ans: number;
  opts?: number[];
  top: 20 | 100;
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

const UNITS = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]];
const HOPS = { hint: 'Look at the hops. How big is each one?', sayHint: ['look-at-the-hops-how-big'] as Piece[] };

function near(d: Dice, ans: number, cands: number[], top: number): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) { if (c !== ans && c >= 0 && c <= top && !out.includes(c)) out.push(c); if (out.length === 3) break; }
  for (let k = 1; out.length < 3; k++) for (const c of [ans + k, ans - k]) if (out.length < 3 && c !== ans && c >= 0 && c <= top && !out.includes(c)) out.push(c);
  return [...out, ans].sort((x, y) => x - y);
}

function hops(d: Dice, top: 20 | 100, pad: boolean): SkipQ {
  const sizes = top === 20 ? [1, 2, 2, 10] : [2, 5, 5, 10];
  const size = d.pick(sizes), back = d.chance(0.35);
  // Within 20 there is room for only two hops of ten: 0, 10, 20, or back again.
  const shown = top === 20 && size === 10 ? 2 : 3;
  // From any number, not only from the multiples: 3, 5, 7 as well as 2, 4, 6.
  const room = top - shown * size;
  // To 100 the hops are shown on the hundred square, which starts at 1.
  const low = top === 100 ? 1 : 0;
  const start = shown === 2 ? (back ? 20 : 0) : back ? d.rnd(shown * size + low, top) : d.rnd(low, room);
  const step = back ? -size : size, all = Array.from({ length: shown + 1 }, (_, i) => start + i * step), ans = all[shown]!;
  return {
    kind: 'hops', seq: all.slice(0, shown), step, ans, top,
    ...(pad ? {} : { opts: near(d, ans, [ans + 1, ans - 1, ans + size, ans - size, all[shown - 1]! + (size === 10 ? 1 : 10)], top) }),
    say: [...all.slice(0, shown), 'what-comes-next'],
    sayEq: [`hops.${size}`, ...(back ? ['going-back'] : []), ...all],
    ...HOPS,
  };
}

function oddEven(n: number, pairs: boolean): SkipQ {
  const odd = n % 2;
  return {
    kind: 'oddeven', seq: [], n, ans: odd, top: n <= 20 ? 20 : 100,
    say: [n, 'is-it-odd-or-even'],
    sayEq: [n, odd ? 'it-is-odd-one-is-left' : 'it-is-even-everything-has-a'],
    ...(pairs ? { hint: 'Pair them up. If one is left over, the number is odd.', sayHint: ['pair-them-up-if-one-is'] }
      : { hint: 'Look at the ones. Even numbers end in 0, 2, 4, 6 or 8.', sayHint: ['look-at-the-ones-even-numbers'] }),
  };
}

export function makeSkip(level: number, d: Dice): SkipQ {
  switch (level) {
    case 1: {
      const unit = d.pick(UNITS), shape = d.shuffle([0, 1, 2]), len = unit.length * 2 + d.rnd(1, unit.length - 1 || 1) % unit.length;
      const shown = Array.from({ length: Math.max(len, unit.length * 2) }, (_, i) => shape[unit[i % unit.length]!]!);
      return {
        kind: 'pattern', seq: shown, ans: shape[unit[shown.length % unit.length]!]!, opts: [0, 1, 2], top: 20,
        say: ['what-comes-next'], sayEq: ['the-pattern-starts-again'],
        hint: 'Say the pattern out loud. Where does it start again?', sayHint: ['say-the-pattern-out-loud-where'],
      };
    }
    case 2: return hops(d, 20, false);
    case 3: return hops(d, 20, true);
    case 4: return oddEven(d.rnd(1, 20), true);
    case 5: return oddEven(d.rnd(1, 20), false);
    case 6: return hops(d, 100, false);
    case 7: return hops(d, 100, true);
    case 8: return oddEven(d.rnd(21, 99), false);
    case 9: {
      let size: number, back: boolean, start: number;
      do { size = d.pick([2, 3, 4, 5, 10]); back = d.chance(0.35); start = d.rnd(1, 99); }
      while ((back ? start - 3 * size : start) < 1 || (back ? start : start + 3 * size) > 99);
      const step = back ? -size : size, seq = [0, 1, 2, 3].map((i) => start + i * step), hole = d.rnd(1, 2);
      return {
        kind: 'missing', seq, step, hole, ans: seq[hole]!, top: 100,
        say: ['which-number-is-missing'], sayEq: [`hops.${size}`, ...(back ? ['going-back'] : []), ...seq],
        hint: 'Find the step from one number to the next. It is the same every time.', sayHint: ['find-the-step-from-one-number'],
      };
    }
    default: throw new RangeError(`skip has levels 1 to ${SKIP_LEVELS}, got ${level}`);
  }
}
