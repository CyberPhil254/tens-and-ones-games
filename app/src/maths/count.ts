/**
 * Count and guess. Seven levels over four lessons:
 *   Count to 20        1 touch each bone once, to 10; 2 the same to 20; 3 the bones are moved: still the same number
 *   Zero               4 how many on the plate, sometimes none; 5 "5 − 5" and "5 + 0" in her head
 *   Guess, then check  6 a heap to 20, seen for a moment: which number is nearest
 *   Guess a heap       7 a heap to 100: which ten is nearest, checked by packing in tens
 * Everything that is counted is drawn in code at places the maker gives, so the amount is exact.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const COUNT_LEVELS = 7;

/** A place for a bone: column and row of a grid, and a small nudge so it does not look like a grid. */
export interface Spot { col: number; row: number; dx: number; dy: number }

export interface CountQ {
  kind: 'count' | 'moved' | 'plate' | 'zero' | 'guess';
  n: number;
  ans: number;
  /** Where the bones lie. For "moved": where they lie afterwards (they start in neat rows). */
  spots: Spot[];
  /** How many columns the grid has. */
  cols: number;
  /** zero: the sum, as shown. */
  eq?: string;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

function scatter(d: Dice, n: number, cols: number, rows: number, nudge: number): Spot[] {
  return d.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n).sort((x, y) => x - y)
    .map((c) => ({ col: c % cols, row: Math.floor(c / cols), dx: d.rnd(-nudge, nudge), dy: d.rnd(-nudge, nudge) }));
}
function choices(d: Dice, ans: number, cands: number[], top: number): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) { if (c !== ans && c >= 0 && c <= top && !out.includes(c)) out.push(c); if (out.length === 3) break; }
  for (let k = 1; out.length < 3; k++) for (const c of [ans + k, ans - k]) if (out.length < 3 && c !== ans && c >= 0 && c <= top && !out.includes(c)) out.push(c);
  return [...out, ans].sort((x, y) => x - y);
}
const AGAIN = { hint: 'Count again. Touch each one once and say one number.', sayHint: ['count-again-touch-each-one-once'] as Piece[] };

function count(d: Dice, lo: number, hi: number): CountQ {
  const n = d.rnd(lo, hi), rows = hi <= 10 ? 3 : 5;
  return {
    kind: 'count', n, ans: n, spots: scatter(d, n, 4, rows, 9), cols: 4, opts: choices(d, n, [n + 1, n - 1, n + 2, n - 2], 22),
    say: ['tap-each-one-once-to-count'], sayEq: [n, 'frag.bones'], ...AGAIN,
  };
}

export function makeCount(level: number, d: Dice): CountQ {
  switch (level) {
    case 1: return count(d, 3, 10);
    case 2: return count(d, 11, 20);
    case 3: {
      const n = d.rnd(4, 12);
      return {
        kind: 'moved', n, ans: n, spots: scatter(d, n, 4, 5, 9), cols: 4, opts: choices(d, n, [n + 1, n - 1, n + 2, n - 2], 20),
        say: ['they-have-moved-how-many-now'], sayEq: ['nothing-was-added-and-nothing-was'],
        hint: 'Nothing was added and nothing was taken away. The number is the same.', sayHint: ['nothing-was-added-and-nothing-was'],
      };
    }
    case 4: {
      // An empty plate comes up often: that is what the lesson is about.
      const n = d.chance(0.4) ? 0 : d.rnd(1, 4);
      return {
        kind: 'plate', n, ans: n, spots: [], cols: 4, opts: [0, 1, 2, 3, 4],
        say: ['how-many-bones-are-on-the'], sayEq: n === 0 ? ['the-plate-is-empty-zero-means'] : n === 1 ? ['one-bone'] : [n, 'frag.bones'],
        ...(n === 0 ? { hint: 'The plate is empty. Zero means none.', sayHint: ['the-plate-is-empty-zero-means'] } : AGAIN),
      };
    }
    case 5: {
      const n = d.rnd(1, 10), kind = d.rnd(0, 2);
      if (kind === 0) return { kind: 'zero', n, ans: 0, spots: [], cols: 4, eq: `${n} − ${n}`, say: [n, 'frag.take-away', n, 'how-many-are-left'], sayEq: [n, 'frag.take-away', n, 'frag.is', 0],
        hint: 'Take them all away and none are left. None is zero.', sayHint: ['take-them-all-away-and-none'] };
      const first = kind === 1;
      return { kind: 'zero', n, ans: n, spots: [], cols: 4, eq: first ? `${n} + 0` : `0 + ${n}`,
        say: first ? [n, 'frag.plus', 0, 'how-many-altogether'] : [0, 'frag.plus', n, 'how-many-altogether'],
        sayEq: first ? [n, 'frag.plus', 0, 'frag.is', n] : [0, 'frag.plus', n, 'frag.is', n],
        hint: 'Zero is nothing. Adding nothing changes nothing.', sayHint: ['zero-is-nothing-adding-nothing-changes'] };
    }
    case 6: {
      // Three numbers well apart; the heap is clearly nearest to one of them.
      const opts = [5, 10, 20], ans = d.pick(opts), n = ans === 5 ? d.rnd(4, 6) : ans === 10 ? d.rnd(9, 12) : d.rnd(17, 20);
      return { kind: 'guess', n, ans, spots: scatter(d, n, 6, 5, 6), cols: 6, opts,
        say: ['guess-how-many-do-not-count'], sayEq: ['lets-check', n, 'frag.bones'],
        hint: 'Let’s check. Count them and see which number is nearest.', sayHint: ['lets-check-count-them-and-see'] };
    }
    case 7: {
      const opts = [20, 50, 80], ans = d.pick(opts), n = ans + d.rnd(-6, 6);
      return { kind: 'guess', n, ans, spots: scatter(d, n, 12, 9, 3), cols: 12, opts,
        say: ['guess-how-many-do-not-count'], sayEq: ['lets-check', n, 'frag.bones'],
        hint: 'Let’s check. Pack them in tens and see which number is nearest.', sayHint: ['lets-check-pack-them-in-tens'] };
    }
    default: throw new RangeError(`count has levels 1 to ${COUNT_LEVELS}, got ${level}`);
  }
}
