/**
 * More or less: comparing, ordering, the nearer ten, and position in a queue.
 * Eight levels, used as the steps of five lessons (see engine/curriculum.ts):
 *   More or less, to 20    1 two numbers in blocks, 2 three numbers in order
 *   More or less, to 100   3 two numbers in blocks, 4 three numbers in order
 *   The nearer ten         5 on the number line, 6 in her head
 *   First to tenth         7 tap the third in a queue
 *   Eleventh and beyond    8 which place in a queue of twenty
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const MORE_LEVELS = 8;

export interface MoreQ {
  /** pair: which of two is more (or less). order: three numbers, smallest first. round: the nearer ten.
   *  nth: tap the k-th in the queue. place: say which place the marked one is in. */
  kind: 'pair' | 'order' | 'round' | 'nth' | 'place';
  nums: number[];
  ask: 'more' | 'less' | null;
  /** pair: the number to tap. round: the ten. nth and place: the position, counted from 1. */
  ans: number;
  /** order: the numbers from smallest to biggest. */
  sorted?: number[];
  /** nth and place: how long the queue is. */
  queue?: number;
  opts?: number[];
  /** The numbers go up to this on the number line shown after a miss. */
  top: 20 | 100;
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

const LINE = { hint: 'On the number line, the number further along is more.', sayHint: ['on-the-number-line-the-number'] as Piece[] };

function pair(d: Dice, top: 20 | 100): MoreQ {
  let a: number, b: number;
  if (top === 20) { a = d.rnd(1, 20); do b = d.rnd(1, 20); while (b === a); }
  else if (d.chance(0.4)) { const t = d.rnd(1, 9), o = d.rnd(0, 8); a = t * 10 + o; b = t * 10 + d.rnd(o + 1, 9); } // the same tens
  else { const t = d.rnd(1, 8), u = d.rnd(t + 1, 9); a = t * 10 + d.rnd(5, 9); b = u * 10 + d.rnd(0, 4); } // fewer tens but more ones: the trap
  if (d.chance(0.5)) [a, b] = [b, a];
  const ask = d.chance(0.65) ? 'more' : 'less';
  const hi = Math.max(a, b), lo = Math.min(a, b), same = top === 100 && Math.floor(a / 10) === Math.floor(b / 10);
  const how = top === 20 ? LINE
    : same ? { hint: 'The tens are the same. Look at the ones.', sayHint: ['the-tens-are-the-same-look'] }
    : { hint: 'Look at the tens first. More tens is more.', sayHint: ['look-at-the-tens-first-more'] };
  return {
    kind: 'pair', nums: [a, b], ask, ans: ask === 'more' ? hi : lo, opts: [a, b], top,
    say: [ask === 'more' ? 'which-is-more' : 'which-is-less'],
    sayEq: ask === 'more' ? [hi, 'frag.is-more-than', lo] : [lo, 'frag.is-less-than', hi],
    ...how,
  };
}

function order(d: Dice, top: 20 | 100): MoreQ {
  const set = new Set<number>();
  if (top === 100 && d.chance(0.5)) { const t = d.rnd(1, 9); set.add(t * 10 + d.rnd(0, 9)); } // two of them often share their tens
  const first = [...set][0];
  while (set.size < 3) set.add(first !== undefined && set.size === 1 && d.chance(0.8) ? Math.floor(first / 10) * 10 + d.rnd(0, 9) : d.rnd(top === 20 ? 0 : 10, top === 20 ? 20 : 99));
  const nums = d.shuffle([...set]), sorted = [...nums].sort((x, y) => x - y);
  return {
    kind: 'order', nums, ask: null, ans: sorted[0]!, sorted, top,
    say: ['tap-the-smallest-first-then-the'], sayEq: ['from-the-smallest-to-the-biggest'],
    ...(top === 20 ? LINE : { hint: 'Look at the tens first. If they are the same, look at the ones.', sayHint: ['look-at-the-tens-first-if'] }),
  };
}

function round(d: Dice, pad: boolean): MoreQ {
  // Never a number ending in 5: which way that goes is a rule to be told, not something to see.
  const t = d.rnd(1, 9), o = d.pick([1, 2, 3, 4, 6, 7, 8, 9]), n = t * 10 + o, ans = o < 5 ? t * 10 : t * 10 + 10;
  return {
    kind: 'round', nums: [n], ask: null, ans, top: 100,
    ...(pad ? {} : { opts: [t * 10, t * 10 + 10] }),
    say: [n, 'which-ten-is-nearer'], sayEq: [n, 'frag.is-nearer-to', ans],
    hint: 'Look where it is on the line. Which ten is closer?', sayHint: ['look-where-it-is-on-the'],
  };
}

export function makeMore(level: number, d: Dice): MoreQ {
  switch (level) {
    case 1: return pair(d, 20);
    case 2: return order(d, 20);
    case 3: return pair(d, 100);
    case 4: return order(d, 100);
    case 5: return round(d, false);
    case 6: return round(d, true);
    case 7: {
      const k = d.rnd(1, 10);
      return { kind: 'nth', nums: [], ask: null, ans: k, queue: 10, top: 20, say: [`tapNth.${k}`], sayEq: [`nthPlace.${k}`],
        hint: 'Count from the front: first, second, third.', sayHint: ['count-from-the-front-first-second'] };
    }
    case 8: {
      const k = d.rnd(11, 20), out: number[] = [];
      for (const c of d.shuffle([k + 1, k - 1, k - 10, k + 2, k - 2])) { if (c >= 1 && c <= 20 && !out.includes(c)) out.push(c); if (out.length === 3) break; }
      return { kind: 'place', nums: [], ask: null, ans: k, queue: 20, top: 20, opts: [...out, k].sort((x, y) => x - y),
        say: ['which-place-is-the-yellow-one'], sayEq: [`nthPlace.${k}`],
        hint: 'The first row is ten. Count on from the eleventh.', sayHint: ['the-first-row-is-ten-count'] };
    }
    default: throw new RangeError(`more has levels 1 to ${MORE_LEVELS}, got ${level}`);
  }
}
