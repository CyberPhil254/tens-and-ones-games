/**
 * Sentences with a number in them, word for word as in the live game.
 * Every one of these exists as a whole recorded clip. Do not change the wording here
 * without adding the new sentence to the speech script: see docs/status.md.
 */
import { onesW, tensW } from '../maths/words';

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
  eats: (k: number) => `She eats ${k} of them.`,
  gives: (k: number) => `She gives ${k} bones to a friend.`,
  tensOnly: (k: number) => `${k * 10} is ${k} tens. Only the tens change.`,
  five: (k: number) => `5 and ${k} make ${5 + k}.`,
  tens: (k: number) => `${tensW(k)}.`,
  levelUp: (to: number) => `Level up! Next you play level ${to}.`,
  jumpTo: (to: number) => `Perfect! You jump up to level ${to}.`,
  rows: (plus: boolean, k: number) =>
    `A jump of ten goes straight ${plus ? 'down' : 'up'}. Go ${k === 1 ? 'one row' : k + ' rows'} ${plus ? 'down' : 'up'} the blue line.`,
} as const;
