/**
 * Sums to 20: adding, taking away and doubles on ten frames, then in her head.
 * Twelve levels, used as the steps of four lessons (see engine/curriculum.ts):
 *   Adding        1 see, 2 count on, 3 in her head
 *   Taking away   4 see, 5 the difference, 6 in her head
 *   Doubles       7 see, 8 in her head
 *   Sums to 20    9 add through ten, 10 take away through ten, 11 in her head, 12 a story
 * The question says everything the screen needs: the numbers, the answer, and what is spoken.
 */
import { SP, type Piece } from '../speech/script';
import type { Dice } from './random';

export const SUMS_LEVELS = 12;

export interface SumsQ {
  /** add: a + b. sub: a − b, taking away. diff: how many more is a than b. double: a + a. */
  kind: 'add' | 'sub' | 'diff' | 'double';
  a: number;
  b: number;
  ans: number;
  /** When the sum goes through ten: how many get to ten first, and how many after that. */
  via?: { first: number; rest: number };
  /** Four choices; missing when the answer is typed on the number pad. */
  opts?: number[];
  /** A story, for the last level. */
  story?: string;
  /** The number sentence with its answer, as shown once she is right: "8 + 5 = 13". */
  eq: string;
  /** The question, read aloud. */
  say: Piece[];
  /** The number sentence, read aloud with the answer. */
  sayEq: Piece[];
  /** What a wrong answer is told: on screen, and spoken. It says what to look at. */
  hint: string;
  sayHint: Piece[];
}

/** Four choices in rising order between 0 and 20: the answer and three wrong ones, the likely slips first. */
function choices(d: Dice, ans: number, cands: number[]): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) {
    if (c !== ans && c >= 0 && c <= 20 && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  for (let k = 1; out.length < 3; k++) {
    for (const c of [ans + k, ans - k]) if (out.length < 3 && c >= 0 && c <= 20 && !out.includes(c)) out.push(c);
  }
  return [...out, ans].sort((x, y) => x - y);
}

const ALTOGETHER = 'how-many-altogether', LEFT = 'how-many-are-left';
const HINT = {
  countOn: { hint: 'Count on from the blue ones. The yellow ones come next.', sayHint: ['count-on-from-the-blue-ones'] },
  left: { hint: 'The crossed-out ones are gone. Count the ones that are left.', sayHint: ['the-crossed-out-ones-are-gone'] },
  match: { hint: 'Match them up, one to one. Count the ones with no partner.', sayHint: ['match-them-up-one-to-one'] },
  rows: { hint: 'Both rows are the same. Count one row, then count on.', sayHint: ['both-rows-are-the-same-count'] },
  fill: { hint: 'Fill the ten first. Then add the rest.', sayHint: ['fill-the-ten-first-then-add'] },
  down: { hint: 'Go down to ten first. Then take away the rest.', sayHint: ['go-down-to-ten-first-then'] },
} satisfies Record<string, { hint: string; sayHint: Piece[] }>;

function add(d: Dice, a: number, b: number, pad: boolean, how?: { hint: string; sayHint: Piece[] }): SumsQ {
  const ans = a + b, through = a < 10 && ans > 10;
  return {
    kind: 'add', a, b, ans,
    ...(through ? { via: { first: 10 - a, rest: b - (10 - a) } } : {}),
    ...(pad ? {} : { opts: choices(d, ans, [ans + 1, ans - 1, ans + 2, ans - 2, a, ...(through ? [ans - 10, 10] : [])]) }),
    eq: `${a} + ${b} = ${ans}`,
    say: [a, 'frag.plus', b, ALTOGETHER],
    sayEq: [a, 'frag.plus', b, 'frag.is', ans],
    ...(how ?? (through ? HINT.fill : HINT.countOn)),
  };
}

function sub(d: Dice, a: number, b: number, pad: boolean): SumsQ {
  const ans = a - b, through = a > 10 && ans < 10;
  return {
    kind: 'sub', a, b, ans,
    ...(through ? { via: { first: a - 10, rest: b - (a - 10) } } : {}),
    ...(pad ? {} : { opts: choices(d, ans, [ans + 1, ans - 1, ans + 2, b, a, ...(through ? [ans + 10] : [])]) }),
    eq: `${a} − ${b} = ${ans}`,
    say: [a, 'frag.take-away', b, LEFT],
    sayEq: [a, 'frag.take-away', b, 'frag.is', ans],
    ...(through ? HINT.down : HINT.left),
  };
}

function double(d: Dice, n: number, pad: boolean): SumsQ {
  return {
    kind: 'double', a: n, b: n, ans: 2 * n,
    ...(pad ? {} : { opts: choices(d, 2 * n, [2 * n + 1, 2 * n - 1, 2 * n + 2, 2 * n - 2, n, n + 1]) }),
    eq: `${n} + ${n} = ${2 * n}`,
    say: ['frag.double', n, 'how-many-is-that'],
    sayEq: ['frag.double', n, 'frag.is', 2 * n],
    ...HINT.rows,
  };
}

/** Adding that goes through ten: 8 + 5, never a sum that only fills the ten. */
const throughAdd = (d: Dice) => { const a = d.rnd(5, 9), b = d.rnd(11 - a, 9); return [a, b] as const; };
/** Taking away that goes through ten: 13 − 5. */
const throughSub = (d: Dice) => { const a = d.rnd(11, 18), b = d.rnd(a - 9, 9); return [a, b] as const; };

export function makeSums(level: number, d: Dice): SumsQ {
  switch (level) {
    case 1: { const a = d.rnd(1, 8), b = d.rnd(1, Math.min(9, 10 - a)); return add(d, a, b, false); }
    case 2: {
      // Counting on: a number, and a few more. The start is a numeral, so she cannot count it all.
      const a = d.rnd(3, 8), b = d.rnd(1, Math.min(3, 10 - a));
      return { ...add(d, a, b, false), hint: `Start at ${a} and count on ${b}.`, sayHint: ['frag.start-at', a, 'frag.and-count-on', b] };
    }
    case 3: { const a = d.rnd(1, 8), b = d.rnd(1, Math.min(9, 10 - a)); return add(d, a, b, true); }
    case 4: { const a = d.rnd(2, 10), b = d.rnd(1, a - 1); return sub(d, a, b, false); }
    case 5: {
      const a = d.rnd(3, 10), b = d.rnd(1, a - 1), ans = a - b;
      return {
        kind: 'diff', a, b, ans, opts: choices(d, ans, [ans + 1, ans - 1, a, b, ans + 2]),
        eq: `${a} − ${b} = ${ans}`, say: ['how-many-more-are-in-the-long'], sayEq: [a, 'frag.take-away', b, 'frag.is', ans], ...HINT.match,
      };
    }
    case 6: { const a = d.rnd(2, 10), b = d.rnd(1, a - 1); return sub(d, a, b, true); }
    case 7: return double(d, d.rnd(1, 10), false);
    case 8: return double(d, d.rnd(1, 10), true);
    case 9: { const [a, b] = throughAdd(d); return add(d, a, b, false); }
    case 10: { const [a, b] = throughSub(d); return sub(d, a, b, false); }
    case 11: {
      // In her head, everything to 20: through ten, and the easier ones that stay on one side of it.
      const r = d.rnd(0, 5);
      if (r <= 1) { const [a, b] = throughAdd(d); return add(d, a, b, true); }
      if (r <= 3) { const [a, b] = throughSub(d); return sub(d, a, b, true); }
      if (r === 4) { const a = d.rnd(10, 17), b = d.rnd(1, Math.min(9, 20 - a)); return add(d, a, b, true); }
      const a = d.rnd(12, 19), b = d.rnd(1, a - 10); return sub(d, a, b, true);
    }
    case 12: {
      if (d.chance(0.5)) {
        const a = d.rnd(3, 11), b = d.rnd(2, Math.min(9, 20 - a)), q = add(d, a, b, true);
        return { ...q, story: `${SP.puppyHas(a)} ${SP.finds(b)} How many bones does she have now?`, say: [`puppyHas.${a}`, `finds.${b}`, 'how-many-bones-does-he-have'] };
      }
      const a = d.rnd(6, 18), b = d.rnd(2, Math.min(9, a - 1)), q = sub(d, a, b, true);
      return { ...q, story: `${SP.puppyHas(a)} ${SP.eats(b)} How many bones are left?`, say: [`puppyHas.${a}`, `eats.${b}`, 'how-many-bones-are-left'] };
    }
    default: throw new RangeError(`sums has levels 1 to ${SUMS_LEVELS}, got ${level}`);
  }
}
