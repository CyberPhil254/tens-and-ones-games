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
