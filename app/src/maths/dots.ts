/**
 * See how many, new patterns: an addition to High Five. Dots in arrangements she has not been
 * taught, shown for a moment, so they are seen and not counted one by one.
 * Level 1: the patterns of a dice, one dice or two. Level 2: two loose groups, each small enough to see at once.
 * Both are answered by seeing small groups and putting them together.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const DOTS_LEVELS = 2;

export interface Dot { x: number; y: number; g: 0 | 1 }
export interface DotsQ {
  n: number;
  /** The size of each group: one group, or two. */
  groups: number[];
  /** Where each dot is, in a picture 200 wide and 100 high. */
  dots: Dot[];
  opts: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

/** The cells of a 3 by 3 grid used by each face of a dice, numbered 0 to 8 row by row. */
const FACE: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function place(cells: number[], g: 0 | 1, left: number, jitter: (max: number) => number): Dot[] {
  // Each group sits in a square 80 wide; cells are 26 apart, so dots (radius 9) never touch even when moved a little.
  return cells.map((c) => ({ x: left + 14 + (c % 3) * 26 + jitter(4), y: 24 + Math.floor(c / 3) * 26 + jitter(4), g }));
}

export function makeDots(level: number, d: Dice): DotsQ {
  if (level < 1 || level > DOTS_LEVELS) throw new RangeError(`dots has levels 1 to ${DOTS_LEVELS}, got ${level}`);
  let a: number, b: number, cellsA: number[], cellsB: number[];
  const still = () => 0, loose = (max: number) => d.rnd(-max, max);
  if (level === 1) {
    // One dice for up to six, two for more. Never 5 and 5 only: that is the pattern she already knows.
    const n = d.rnd(3, 10);
    if (n <= 6 && d.chance(0.6)) { a = n; b = 0; } else { a = d.rnd(Math.max(1, n - 6), Math.min(6, n - 1)); b = n - a; }
    cellsA = FACE[a]!; cellsB = b ? FACE[b]! : [];
  } else {
    // Two loose groups of one to five: any cells of the grid, each dot nudged a little.
    a = d.rnd(2, 5); b = d.rnd(1, 5);
    const some = (k: number) => d.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, k).sort((x, y) => x - y);
    cellsA = some(a); cellsB = some(b);
  }
  const n = a + b, move = level === 1 ? still : loose;
  const dots = b ? [...place(cellsA, 0, 10, move), ...place(cellsB, 1, 110, move)] : place(cellsA, 0, 60, move);
  const out: number[] = [];
  for (const c of d.shuffle([n + 1, n - 1, n + 2, n - 2, a, b].filter((c) => c >= 1 && c <= 12))) {
    if (c !== n && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  for (let k = 3; out.length < 3; k++) for (const c of [n + k, n - k]) if (out.length < 3 && c >= 1 && !out.includes(c)) out.push(c);
  return {
    n, groups: b ? [a, b] : [a], dots,
    opts: [...out, n].sort((x, y) => x - y),
    say: ['how-many-look-for-groups-you'],
    sayEq: b ? [a, 'frag.plus', b, 'frag.is', n] : ['you-just-saw-it'],
    hint: 'You do not need to count them all. Look for small groups you know.',
    sayHint: ['do-not-count-them-all-look'],
  };
}
