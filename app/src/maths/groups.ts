/**
 * Equal groups: multiplying as so many groups of the same size. Five levels over two lessons:
 *   Equal groups   1 plates of bones, 2 rows and columns as repeated adding, 3 "3 × 5" in her head
 *   Times tables   4 the 1, 2, 5 and 10 tables as hops, 5 in her head
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const GROUPS_LEVELS = 5;

export interface GroupsQ {
  /** How many groups, and how many in each. */
  g: number;
  k: number;
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

function make(d: Dice, g: number, k: number, pad: boolean, times: boolean): GroupsQ {
  const ans = g * k;
  let opts: number[] | undefined;
  if (!pad) {
    // The slips: one group too many or too few, adding the two numbers, counting the groups only.
    const out: number[] = [];
    for (const c of d.shuffle([ans + k, ans - k, g + k, ans + 1, ans - 1, g, k])) { if (c !== ans && c >= 1 && c <= 100 && !out.includes(c)) out.push(c); if (out.length === 3) break; }
    for (let i = 2; out.length < 3; i++) for (const c of [ans + i, ans - i]) if (out.length < 3 && c >= 1 && c !== ans && !out.includes(c)) out.push(c);
    opts = [...out, ans].sort((x, y) => x - y);
  }
  return {
    g, k, ans, ...(opts ? { opts } : {}),
    say: times ? [g, 'frag.times', k, 'how-many-is-that'] : [g, 'frag.groups-of', k, 'how-many-altogether'],
    sayEq: [g, 'frag.times', k, 'frag.is', ans],
    hint: 'Count the groups in steps, one group at a time.',
    sayHint: ['count-the-groups-in-steps-one'],
  };
}

export function makeGroups(level: number, d: Dice): GroupsQ {
  switch (level) {
    // Plates: two to five plates with two to five bones on each, so every bone can be seen.
    case 1: return make(d, d.rnd(2, 5), d.rnd(2, 5), false, false);
    case 2: return make(d, d.rnd(2, 5), d.pick([2, 3, 4, 5, 5, 10]), false, false);
    case 3: return make(d, d.rnd(2, 5), d.pick([2, 2, 3, 4, 5, 5, 10]), true, true);
    // The tables: 1, 2, 5 and 10, up to ten times.
    case 4: return make(d, d.rnd(1, 10), d.pick([1, 2, 2, 5, 5, 10, 10]), false, true);
    case 5: return make(d, d.rnd(1, 10), d.pick([1, 2, 2, 5, 5, 10, 10]), true, true);
    default: throw new RangeError(`groups has levels 1 to ${GROUPS_LEVELS}, got ${level}`);
  }
}
