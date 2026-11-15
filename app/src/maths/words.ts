const W1 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'] as const;
const W10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;

/** A number from 0 to 100 as a word: 47 is "forty-seven". */
export function word(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`word expects 0 to 100, got ${n}`);
  if (n < 20) return W1[n]!;
  if (n === 100) return 'one hundred';
  return W10[Math.floor(n / 10)]! + (n % 10 ? '-' + W1[n % 10]! : '');
}

export const tensW = (t: number) => (t === 1 ? '1 ten' : `${t} tens`);
export const onesW = (o: number) => (o === 1 ? '1 one' : `${o} ones`);

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
  'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'] as const;
/** A place from 1 to 20 as a word: 3 is "third". */
export function ordinal(k: number): string {
  if (!Number.isInteger(k) || k < 1 || k > 20) throw new RangeError(`ordinal expects 1 to 20, got ${k}`);
  return ORD[k]!;
}
/** A place as it is written short: 1st, 2nd, 3rd, 14th. */
export const nth = (k: number) => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`;
