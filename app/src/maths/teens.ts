/**
 * Two additions to Pack Ten.
 * "teens": numbers 10 to 20 as a ten and some more (Stage 1). Level 1: read the blocks.
 *   Level 2: how many ones go with the ten. Level 3: both, in her head.
 * "regroup": another way to make a number: 34 is 3 tens and 4 ones, and also 2 tens and 14 ones (Stage 2).
 *   Level 1: with the blocks. Level 2: in her head.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const TEENS_LEVELS = 3;
export const REGROUP_LEVELS = 2;

function pick(d: Dice, ans: number, cands: number[], ok: (c: number) => boolean): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) {
    if (c !== ans && ok(c) && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  for (let k = 1; out.length < 3; k++) for (const c of [ans + k, ans - k]) if (out.length < 3 && c !== ans && ok(c) && !out.includes(c)) out.push(c);
  return [...out, ans].sort((x, y) => x - y);
}

export interface TeensQ {
  /** read: how many is this. ones: n = 10 + ?. */
  kind: 'read' | 'ones';
  n: number;
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

function teen(d: Dice, kind: 'read' | 'ones', pad: boolean): TeensQ {
  if (kind === 'read') {
    const n = d.rnd(10, 20), o = n % 10;
    return {
      kind, n, ans: n,
      // The slips: the ones only, sixteen heard as sixty-one, one out.
      ...(pad ? {} : { opts: pick(d, n, [o, o * 10 + 1, n + 1, n - 1, n + 10], (c) => c >= 1 && c <= 99) }),
      say: pad ? [10, 'frag.plus', o, 'how-many-altogether'] : ['how-many-blocks-do-you-see'],
      sayEq: [`isTO.${n}`],
      hint: 'Start at ten. Then count on the ones.',
      sayHint: ['start-at-ten-then-count-on'],
    };
  }
  const n = d.rnd(11, 19), o = n - 10;
  return {
    kind, n, ans: o,
    ...(pad ? {} : { opts: pick(d, o, [o + 1, o - 1, n, 10, o + 2], (c) => c >= 1 && c <= 19) }),
    say: [10, 'frag.and-how-many-more-make', n],
    sayEq: [`isTO.${n}`],
    hint: 'A teen number is one ten and some ones.',
    sayHint: ['a-teen-number-is-one-ten'],
  };
}

export function makeTeens(level: number, d: Dice): TeensQ {
  if (level === 1) return teen(d, 'read', false);
  if (level === 2) return teen(d, 'ones', false);
  if (level === 3) {
    // In her head: 10 + 6, and 16 = 10 + ?. No tens-only numbers here: 10 + 0 teaches nothing.
    if (d.chance(0.5)) return teen(d, 'ones', true);
    let q; do q = teen(d, 'read', true); while (q.n % 10 === 0);
    return q;
  }
  throw new RangeError(`teens has levels 1 to ${TEENS_LEVELS}, got ${level}`);
}

export interface RegroupQ {
  n: number;
  /** The usual way: t tens and o ones. */
  t: number; o: number;
  /** The other way: one ten fewer, and this many ones. */
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

export function makeRegroup(level: number, d: Dice): RegroupQ {
  if (level < 1 || level > REGROUP_LEVELS) throw new RangeError(`regroup has levels 1 to ${REGROUP_LEVELS}, got ${level}`);
  const t = d.rnd(2, 9), o = d.rnd(0, 9), n = t * 10 + o, ans = 10 + o;
  return {
    n, t, o, ans,
    ...(level === 1 ? { opts: pick(d, ans, [o, ans + 1, ans - 1, o + 1, t, ans + 10], (c) => c >= 0 && c <= 29) } : {}),
    say: [n, 'frag.is', `tens.${t - 1}`, 'and-how-many-ones'],
    sayEq: [`isTO.${n}`, 'breaking-a-ten-does-not-change'],
    hint: 'One ten was broken into 10 ones. Count on from 10.',
    sayHint: ['one-ten-was-broken-into-10'],
  };
}
