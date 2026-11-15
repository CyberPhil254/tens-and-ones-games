/**
 * Two additions to Number Names.
 * Level 1: read a number word from zero to twenty and find the numeral (Stage 1).
 * Level 2: hear a number from 0 to 20 and type it. Level 3: hear a number to 99 and type it.
 * Typing is writing the number: nothing on screen gives it away.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const HEAR_LEVELS = 3;

export interface HearQ {
  n: number;
  /** Four choices; missing when the number is typed. */
  opts?: number[];
  say: Piece[];
}

export function makeHear(level: number, d: Dice): HearQ {
  if (level === 1) {
    const n = d.rnd(0, 20);
    const out: number[] = [];
    // The mix-ups: one out, twelve and twenty, the ones without the ten.
    for (const c of d.shuffle([n + 1, n - 1, n + 10, n - 10, n === 12 ? 20 : n === 20 ? 12 : n + 2, n - 2])) {
      if (c !== n && c >= 0 && c <= 20 && !out.includes(c)) out.push(c);
      if (out.length === 3) break;
    }
    return { n, opts: [...out, n].sort((x, y) => x - y), say: [`which.${n}`] };
  }
  if (level === 2) return heard(d.rnd(0, 20));
  if (level === 3) {
    // Thirteen and thirty, fourteen and forty: the pairs that sound alike come up often.
    const r = d.rnd01();
    return heard(r < 0.25 ? d.rnd(13, 19) : r < 0.5 ? d.rnd(3, 9) * 10 : d.rnd(21, 99));
  }
  throw new RangeError(`hear has levels 1 to ${HEAR_LEVELS}, got ${level}`);
}

const heard = (n: number): HearQ => ({ n, say: [n] });
