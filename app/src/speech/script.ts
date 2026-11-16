/**
 * Sentences with a number in them, word for word as in the live game.
 * Every one of these exists as a whole recorded clip. Do not change the wording here
 * without adding the new sentence to the speech script: see docs/status.md.
 */
import { onesW, ordinal, tensW } from '../maths/words';

/** What the voice says: whole sentences, joining pieces such as "plus", and numbers. */
export type Piece = string | number;

export const SP = {
  isTO: (n: number) => `${n} is ${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}.`,
  which: (n: number) => `Which number is ${n}?`,
  has: (k: number, place: 't' | 'o') => `Which number has ${place === 't' ? tensW(k) : onesW(k)}?`,
  friendsQ: (n: number) => `${n} and how many more make ten?`,
  friends: (n: number) => `${n} and ${10 - n} are friends of ten.`,
  newTen: (o: number) => `${o} and ${10 - o} make a new ten.`,
  puppyHas: (a: number) => `Oreo has ${a} bones.`,
  finds: (b: number) => `She finds ${b} more.`,
  digs: (b: number) => `She digs up ${b} more.`,
  tapMoney: (v: number) => `Tap ${v} ${v === 1 ? 'shilling' : 'shillings'}.`,
  shillings: (v: number) => `${v} ${v === 1 ? 'shilling' : 'shillings'}.`,
  hops: (k: number) => `Hops of ${k}.`,
  tapNth: (k: number) => `Tap the ${ordinal(k)} one.`,
  nthPlace: (k: number) => `It is the ${ordinal(k)}.`,
  eats: (k: number) => `She eats ${k} of them.`,
  gives: (k: number) => `She gives ${k} bones to a friend.`,
  tensOnly: (k: number) => `${k * 10} is ${k} tens. Only the tens change.`,
  five: (k: number) => `5 and ${k} make ${5 + k}.`,
  tens: (k: number) => `${tensW(k)}.`,
  /** After a guess: the heap packed in tens, and why that makes `ans` the nearest. "12. That is 1 ten and 2 more, so 10 is nearest." */
  nearest: (n: number, ans: number) => {
    const t = Math.floor(n / 10), o = n % 10;
    const packed = t === 0 ? onesW(o) : o === 0 ? tensW(t) : `${tensW(t)} and ${o} more`;
    const nearly = ans > n && o >= 5 && ans === (t + 1) * 10 ? `, nearly ${tensW(t + 1)}` : '';
    return `${n}. That is ${packed}${nearly}, so ${ans} is nearest.`;
  },
  rows: (plus: boolean, k: number) =>
    `A jump of ten goes straight ${plus ? 'down' : 'up'}. Go ${k === 1 ? 'one row' : k + ' rows'} ${plus ? 'down' : 'up'} the blue line.`,
} as const;
