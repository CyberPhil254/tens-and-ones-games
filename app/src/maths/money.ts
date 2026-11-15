/**
 * Money. Coins and notes are drawn in code as labelled discs and rectangles; they are not pictures
 * of the real ones. Kenyan shillings first: the coins and notes in use were checked in November 2026
 * (coins of 1, 5, 10 and 20 shillings; notes of 50, 100, 200, 500 and 1,000). The lessons go to 100,
 * so they use the four coins and the notes of 50 and 100.
 * Five levels over two lessons:
 *   Coins and notes     1 find the coin or note of a value, 2 which of two is worth more
 *   Amounts of money    3 how much is in the purse, 4 make an amount, 5 which purse holds more
 */
import type { Piece } from '../speech/script';
import type { Dice } from './random';

export const MONEY_LEVELS = 5;

export interface Currency { name: string; coins: number[]; notes: number[] }
export const CURRENCIES: Record<'KES', Currency> = { KES: { name: 'shillings', coins: [1, 5, 10, 20], notes: [50, 100] } };
const { coins: COINS, notes: NOTES } = CURRENCIES.KES;
export const MONEY = [...COINS, ...NOTES];
/** What she can pay with when making an amount under 100. */
export const PAY = [50, 20, 10, 5, 1];

export interface MoneyQ {
  /** name: tap the coin or note of this value. worth: tap the one worth more. read: how much is in the purse.
   *  make: put this amount together. purses: tap the purse that holds more. */
  kind: 'name' | 'worth' | 'read' | 'make' | 'purses';
  /** name, worth: the coins and notes shown. read: the purse. */
  items: number[];
  /** purses: the two purses. */
  purses?: [number[], number[]];
  /** name: the value. worth: the bigger value. read, make: the amount. purses: 0 or 1, the purse with more. */
  ans: number;
  opts?: number[];
  say: Piece[];
  sayEq: Piece[];
  hint: string;
  sayHint: Piece[];
}

const total = (p: number[]) => p.reduce((x, y) => x + y, 0);
/** A purse of two to six coins and notes, biggest first, worth less than 100. */
function purse(d: Dice): number[] {
  for (;;) {
    const p = d.shuffle([50, 20, 20, 10, 10, 10, 5, 5, 1, 1, 1, 1]).slice(0, d.rnd(2, 6)).sort((x, y) => y - x);
    if (total(p) <= 99) return p;
  }
}
const BIGGEST = { hint: 'Start with the biggest. Then count on.', sayHint: ['start-with-the-biggest-then-count'] as Piece[] };

export function makeMoney(level: number, d: Dice): MoneyQ {
  switch (level) {
    case 1: {
      const items = d.shuffle(MONEY.slice()).slice(0, 4), ans = d.pick(items);
      return { kind: 'name', items, ans, opts: items, say: [`tapMoney.${ans}`], sayEq: [`shillings.${ans}`], hint: 'Look at the number on it.', sayHint: ['look-at-the-number-on-it'] };
    }
    case 2: {
      const [a, b] = d.shuffle(MONEY.slice()) as [number, number];
      const hi = Math.max(a, b), lo = Math.min(a, b);
      return { kind: 'worth', items: [a, b], ans: hi, opts: [a, b], say: ['which-is-worth-more'], sayEq: [hi, 'frag.is-more-than', lo],
        hint: 'A bigger coin is not always worth more. Look at the number.', sayHint: ['a-bigger-coin-is-not-always'] };
    }
    case 3: {
      const items = purse(d), ans = total(items), out: number[] = [];
      // The slips: counting the pieces, missing one piece, a ten out.
      for (const c of d.shuffle([items.length, ans - items.at(-1)!, ans + 10, ans - 10, ans + 1, ans + 5])) { if (c !== ans && c >= 1 && c <= 109 && !out.includes(c)) out.push(c); if (out.length === 3) break; }
      for (let i = 2; out.length < 3; i++) for (const c of [ans + i, ans - i]) if (out.length < 3 && c >= 1 && c !== ans && !out.includes(c)) out.push(c);
      return { kind: 'read', items, ans, opts: [...out, ans].sort((x, y) => x - y), say: ['how-much-is-in-the-purse'], sayEq: [ans, 'frag.shillings'], ...BIGGEST };
    }
    case 4: {
      const ans = d.rnd(6, 99);
      return { kind: 'make', items: [], ans, say: ['frag.make', ans, 'frag.shillings'], sayEq: ['frag.you-made', ans, 'frag.shillings'],
        hint: 'Count what you have. Start with the biggest.', sayHint: ['count-what-you-have-start-with'] };
    }
    case 5: {
      let a: number[], b: number[];
      do { a = purse(d); b = purse(d); } while (total(a) === total(b));
      const more = total(a) > total(b) ? 0 : 1;
      return { kind: 'purses', items: [], purses: [a, b], ans: more, opts: [0, 1], say: ['which-purse-holds-more'],
        sayEq: [Math.max(total(a), total(b)), 'frag.is-more-than', Math.min(total(a), total(b))],
        hint: 'Count each purse. Start with the biggest.', sayHint: ['count-each-purse-start-with-the'] };
    }
    default: throw new RangeError(`money has levels 1 to ${MONEY_LEVELS}, got ${level}`);
  }
}
