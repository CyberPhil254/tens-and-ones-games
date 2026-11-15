/**
 * Halves and quarters. Seven levels over two lessons:
 *   Halves     1 which shape is cut in half, 2 half of a set, 3 half of a number in her head
 *   Quarters   4 which shape is cut in quarters, 5 a quarter of a set, 6 the bar from 0 to 1, 7 in her head
 * Fractions start from sharing fairly; the bar shows them as numbers with a place between 0 and 1.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const PARTS_LEVELS = 7;

/** A shape and its cuts. Cut positions run from 0 to 1 across the shape. `parts` are the sizes of the pieces, adding up to 1. */
export interface Cut {
  base: 'circle' | 'square' | 'wide';
  /** Cuts from top to bottom, at these places across. */
  v: number[];
  /** Cuts from side to side, at these places down. */
  h: number[];
  /** One cut from corner to corner. */
  diag?: true;
  parts: number[];
}

export interface PartsQ {
  /** cut: tap the shape cut fairly. set: so much of n things. bar: tap the place on the bar. shade: say how much is yellow. */
  kind: 'cut' | 'set' | 'bar' | 'shade';
  /** How many quarters: 2 is a half, 1 a quarter, 3 three quarters. */
  quarters: 1 | 2 | 3;
  /** cut: into how many equal parts, 2 or 4. */
  into?: 2 | 4;
  shapes?: Cut[];
  n?: number;
  /** cut: which shape (0, 1, 2). set: the number. bar and shade: how many quarters. */
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

/** The share of a circle cut off by a straight cut at `f` across it. */
function segment(f: number): number {
  const r = 0.5, dist = Math.abs(0.5 - f), area = r * r * Math.acos(dist / r) - dist * Math.sqrt(r * r - dist * dist);
  const small = area / (Math.PI * r * r);
  return f <= 0.5 ? small : 1 - small;
}
const strips = (cuts: number[]) => [...cuts, 1].map((c, i) => c - (i ? cuts[i - 1]! : 0));
function cut(base: Cut['base'], v: number[], h: number[] = [], diag = false): Cut {
  let parts: number[];
  if (diag) parts = [0.5, 0.5];
  else if (base === 'circle') parts = v.length && h.length ? [0.25, 0.25, 0.25, 0.25] : (() => { const s = segment(v[0] ?? h[0]!); return [s, 1 - s]; })();
  else parts = strips(v).flatMap((w) => strips(h).map((t) => w * t));
  return { base, v, h, ...(diag ? { diag: true as const } : {}), parts };
}

const FAIR2 = [cut('circle', [0.5]), cut('square', [0.5]), cut('square', [], [], true), cut('wide', [], [0.5]), cut('wide', [0.5])];
const UNFAIR2 = [cut('circle', [0.32]), cut('square', [0.3]), cut('wide', [], [0.34]), cut('wide', [0.7]), cut('circle', [0.66])];
const FAIR4 = [cut('square', [0.5], [0.5]), cut('square', [0.25, 0.5, 0.75]), cut('circle', [0.5], [0.5]), cut('wide', [0.25, 0.5, 0.75]), cut('wide', [0.5], [0.5])];
// Not quarters: four parts of different sizes, or equal parts but not four of them.
const UNFAIR4 = [cut('square', [0.2, 0.45, 0.6]), cut('square', [0.35], [0.5]), cut('wide', [1 / 3, 2 / 3]), cut('square', [0.5]), cut('wide', [0.15, 0.5, 0.75]), cut('square', [0.5], [0.3])];

const equal = (c: Cut) => c.parts.every((p) => Math.abs(p - c.parts[0]!) < 0.005);
export const isFair = (c: Cut, into: number) => c.parts.length === into && equal(c);

function whichCut(d: Dice, into: 2 | 4): PartsQ {
  const fair = d.pick(into === 2 ? FAIR2 : FAIR4), others = d.shuffle((into === 2 ? UNFAIR2 : UNFAIR4).slice()).slice(0, 2);
  const shapes = d.shuffle([fair, ...others]);
  return {
    kind: 'cut', quarters: into === 2 ? 2 : 1, into, shapes, ans: shapes.indexOf(fair), opts: [0, 1, 2],
    say: [into === 2 ? 'which-one-is-cut-in-half' : 'which-one-is-cut-in-quarters'],
    sayEq: [into === 2 ? 'two-parts-of-the-same-size' : 'four-parts-of-the-same-size'],
    ...(into === 2 ? { hint: 'Halves are two parts of the same size.', sayHint: ['halves-are-two-parts-of-the'] }
      : { hint: 'Quarters are four parts of the same size.', sayHint: ['quarters-are-four-parts-of-the'] }),
  };
}

const OF = { 1: 'frag.a-quarter-of', 2: 'frag.half-of', 3: 'frag.three-quarters-of' } as const;
function ofSet(d: Dice, quarters: 1 | 2 | 3, n: number, pad: boolean): PartsQ {
  const ans = (n / 4) * quarters;
  let opts: number[] | undefined;
  if (!pad) {
    const out: number[] = [];
    for (const c of d.shuffle([ans + 1, ans - 1, n / 2, n / 4, n, ans * 2, ans + 2])) { if (c !== ans && c >= 1 && c <= 20 && Number.isInteger(c) && !out.includes(c)) out.push(c); if (out.length === 3) break; }
    for (let i = 2; out.length < 3; i++) for (const c of [ans + i, ans - i]) if (out.length < 3 && c >= 1 && c !== ans && !out.includes(c)) out.push(c);
    opts = [...out, ans].sort((x, y) => x - y);
  }
  return {
    kind: 'set', quarters, n, ans, ...(opts ? { opts } : {}),
    say: [OF[quarters], n, 'how-many-is-that'], sayEq: [OF[quarters], n, 'frag.is', ans],
    ...(quarters === 2 ? { hint: 'Share them into two equal groups.', sayHint: ['share-them-into-two-equal-groups'] }
      : quarters === 1 ? { hint: 'Share them into four equal groups.', sayHint: ['share-them-into-four-equal-groups'] }
        : { hint: 'Share them into four equal groups. Three quarters is three of the groups.', sayHint: ['share-them-into-four-equal-groups', 'three-quarters-is-three-of-the'] }),
  };
}

const NAME = { 1: 'that-is-a-quarter', 2: 'that-is-one-half', 3: 'that-is-three-quarters' } as const;
export function makeParts(level: number, d: Dice): PartsQ {
  switch (level) {
    case 1: return whichCut(d, 2);
    case 2: return ofSet(d, 2, 2 * d.rnd(1, 10), false);
    case 3: return ofSet(d, 2, 2 * d.rnd(1, 10), true);
    case 4: return whichCut(d, 4);
    case 5: return ofSet(d, d.chance(0.7) ? 1 : 3, 4 * d.rnd(1, 5), false);
    case 6: {
      const quarters = d.pick([1, 2, 3] as const);
      if (d.chance(0.5)) {
        return { kind: 'bar', quarters, ans: quarters, opts: [1, 2, 3],
          say: [quarters === 2 ? 'tap-one-half-on-the-bar' : quarters === 1 ? 'tap-a-quarter-on-the-bar' : 'tap-three-quarters-on-the-bar'], sayEq: [NAME[quarters]],
          hint: 'The bar is cut into four equal parts. Count the parts from the start.', sayHint: ['the-bar-is-cut-into-four'] };
      }
      return { kind: 'shade', quarters, ans: quarters, opts: [1, 2, 3],
        say: ['how-much-of-the-bar-is'], sayEq: quarters === 2 ? ['two-quarters-are-the-same-as'] : [NAME[quarters]],
        hint: 'The bar is cut into four equal parts. Count the yellow parts.', sayHint: ['the-bar-is-cut-into-four-count'] };
    }
    case 7: return ofSet(d, d.pick([1, 1, 2, 3] as const), 4 * d.rnd(1, 5), true);
    default: throw new RangeError(`parts has levels 1 to ${PARTS_LEVELS}, got ${level}`);
  }
}
