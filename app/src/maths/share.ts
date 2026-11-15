/**
 * Fair shares: dividing as sharing equally and as making groups. Exact answers only, with 2, 5 and 10.
 * Level 1: deal bones out into bowls, one each at a time. Level 2: make groups of a size and count the groups.
 * Level 3: in her head.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const SHARE_LEVELS = 3;

export interface ShareQ {
  /** share: n bones between `by` bowls. group: n bones in groups of `by`. */
  kind: 'share' | 'group';
  n: number;
  by: number;
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

function make(d: Dice, kind: 'share' | 'group', pad: boolean, dealt: boolean): ShareQ {
  const by = d.pick([2, 2, 5, 5, 10]);
  // Never one each or one group: there would be nothing to share. Tens stay small enough to draw.
  const ans = d.rnd(2, by === 10 ? 3 : by === 5 ? 4 : 6), n = by * ans;
  let opts: number[] | undefined;
  if (!pad) {
    const out: number[] = [];
    for (const c of d.shuffle([ans + 1, ans - 1, by, n, ans + 2, n - by])) { if (c !== ans && c >= 1 && c <= 30 && !out.includes(c)) out.push(c); if (out.length === 3) break; }
    for (let i = 2; out.length < 3; i++) for (const c of [ans + i, ans - i]) if (out.length < 3 && c >= 1 && c !== ans && !out.includes(c)) out.push(c);
    opts = [...out, ans].sort((x, y) => x - y);
  }
  return kind === 'share'
    ? {
      kind, n, by, ans, ...(opts ? { opts } : {}),
      say: [n, 'frag.shared-between', by, dealt ? 'give-one-to-each-bowl-until' : 'how-many-does-each-get'],
      sayEq: [n, 'frag.shared-between', by, 'frag.is', ans],
      hint: 'Deal them out: one for each bowl, again and again.', sayHint: ['deal-them-out-one-for-each'],
    }
    : {
      kind, n, by, ans, ...(opts ? { opts } : {}),
      say: [n, 'frag.in-groups-of', by, 'how-many-groups'],
      sayEq: [n, 'frag.in-groups-of', by, 'frag.is', ans],
      hint: 'Make the groups, then count the groups.', sayHint: ['make-the-groups-then-count-the'],
    };
}

export function makeShare(level: number, d: Dice): ShareQ {
  if (level === 1) return make(d, 'share', false, true);
  if (level === 2) return make(d, 'group', false, false);
  if (level === 3) return make(d, d.chance(0.5) ? 'share' : 'group', true, false);
  throw new RangeError(`share has levels 1 to ${SHARE_LEVELS}, got ${level}`);
}
