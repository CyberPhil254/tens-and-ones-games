/**
 * Tens and ones sums, adding: two two-digit numbers where no new ten is made (34 + 25).
 * Tens are added to tens and ones to ones. Three levels: blocks, a sketch, in her head.
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const PLUS_LEVELS = 3;

export interface PlusQ {
  a: number; b: number; ans: number;
  /** Tens and ones of each number, and of the sum. */
  t: [number, number, number];
  o: [number, number, number];
  /** Four choices; missing when the answer is typed. */
  opts?: number[];
  eq: string;
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

export function makePlus(level: number, d: Dice): PlusQ {
  if (level < 1 || level > PLUS_LEVELS) throw new RangeError(`plus has levels 1 to ${PLUS_LEVELS}, got ${level}`);
  // Both numbers have tens and ones, and neither the tens nor the ones go past nine together.
  const t1 = d.rnd(1, 8), t2 = d.rnd(1, 9 - t1), o1 = d.rnd(1, 8), o2 = d.rnd(1, 9 - o1);
  const a = t1 * 10 + o1, b = t2 * 10 + o2, ans = a + b;
  let opts: number[] | undefined;
  if (level < 3) {
    // The slips that happen: a ten too many or too few, a one too many or too few, only one number's tens, digits swapped.
    const out: number[] = [];
    for (const c of d.shuffle([ans + 10, ans - 10, ans + 1, ans - 1, a + o2, (o1 + o2) * 10 + (t1 + t2)])) {
      if (c !== ans && c >= 11 && c <= 99 && !out.includes(c)) out.push(c);
      if (out.length === 3) break;
    }
    for (let k = 2; out.length < 3; k++) for (const c of [ans + k, ans - k]) if (out.length < 3 && c >= 11 && c <= 99 && !out.includes(c)) out.push(c);
    opts = [...out, ans].sort((x, y) => x - y);
  }
  return {
    a, b, ans, t: [t1, t2, t1 + t2], o: [o1, o2, o1 + o2],
    ...(opts ? { opts } : {}),
    eq: `${a} + ${b} = ${ans}`,
    say: [a, 'frag.plus', b, 'how-many-altogether'],
    sayEq: ['tens-with-tens-and-ones-with', a, 'frag.plus', b, 'frag.is', ans],
    hint: 'Add the tens to the tens. Add the ones to the ones.',
    sayHint: ['add-the-tens-to-the-tens'],
  };
}
