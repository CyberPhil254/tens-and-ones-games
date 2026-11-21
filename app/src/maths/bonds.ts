/**
 * Friends of 20 and 100: the pairs that make 20, and the pairs of tens that make 100.
 * Both are the friends of ten again: 13 + 7 is 3 + 7 with a ten beside it, 30 + 70 is 3 + 7 in tens.
 * Level 1: to 20, on two ten frames. Level 2: tens to 100, as rods. Level 3: both, in her head.
 * Level 4: to 20 from a teen number, step by step in the blocks: one question about the ones (3 and how many more
 * make ten?), and the blocks show that the same friend makes 20.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const BONDS_LEVELS = 4;

export interface BondsQ {
  /** to20: n + ? = 20. tens: n + ? = 100, n a whole number of tens. */
  kind: 'to20' | 'tens';
  n: number;
  whole: 20 | 100;
  ans: number;
  opts?: number[];
  /** Step by step: the choices for "the ones and how many more make ten?" (the answer is `ans`). */
  onesOpts?: number[];
  eq: string;
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

function pick(d: Dice, ans: number, cands: number[], ok: (c: number) => boolean): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) {
    if (c !== ans && ok(c) && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  return [...out, ans].sort((x, y) => x - y);
}

function to20(d: Dice, pad: boolean): BondsQ {
  // Not 10 + 10 every time, and never a number that leaves nothing to find.
  const n = d.rnd(1, 19), ans = 20 - n;
  return {
    kind: 'to20', n, whole: 20, ans,
    ...(pad ? {} : { opts: pick(d, ans, [ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, n], (c) => c >= 1 && c <= 19) }),
    eq: `${n} + ${ans} = 20`,
    say: [n, 'frag.and-how-many-more-make', 20],
    sayEq: [n, 'frag.plus', ans, 'frag.is', 20],
    hint: 'Count the empty places in both frames.',
    sayHint: ['count-the-empty-places-in-both'],
  };
}

function tens(d: Dice, pad: boolean): BondsQ {
  const k = d.rnd(1, 9), n = k * 10, ans = 100 - n;
  return {
    kind: 'tens', n, whole: 100, ans,
    ...(pad ? {} : { opts: pick(d, ans, [ans + 10, ans - 10, ans + 20, ans - 20, 10 - k, n], (c) => c >= 1 && c <= 90) }),
    eq: `${n} + ${ans} = 100`,
    say: [n, 'frag.and-how-many-more-make', 100],
    sayEq: [n, 'frag.plus', ans, 'frag.is', 100],
    hint: 'Ten tens make 100. Count the tens that are missing.',
    sayHint: ['ten-tens-make-100-count-the'],
  };
}

export function makeBonds(level: number, d: Dice): BondsQ {
  if (level === 1) return to20(d, false);
  if (level === 2) return tens(d, false);
  if (level === 3) return d.chance(0.5) ? to20(d, true) : tens(d, true);
  if (level === 4) {
    // A teen number with ones: 13 + ? = 20 is 3 + ? = 10 with a ten beside it.
    const n = d.rnd(11, 19), o = n - 10, ans = 10 - o;
    return {
      kind: 'to20', n, whole: 20, ans,
      onesOpts: pick(d, ans, [ans + 1, ans - 1, o, ans + 2, ans - 2, 10], (c) => c >= 1 && c <= 10),
      eq: `${n} + ${ans} = 20`,
      say: [n, 'frag.and-how-many-more-make', 20],
      sayEq: [n, 'frag.plus', ans, 'frag.is', 20],
      hint: 'Look at the blue ones. Count the empty places up to ten.',
      sayHint: ['look-at-the-blue-ones-count'],
    };
  }
  throw new RangeError(`bonds has levels 1 to ${BONDS_LEVELS}, got ${level}`);
}
