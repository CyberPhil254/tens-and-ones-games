/** How a number from 0 to 100 is shown: hundreds (only for 100), tens and ones. */
export interface TensOnes {
  hundreds: number;
  tens: number;
  ones: number;
}

export function tensOnes(n: number): TensOnes {
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new RangeError(`tensOnes expects a whole number from 0 to 100, got ${n}`);
  }
  return { hundreds: Math.floor(n / 100), tens: Math.floor(n / 10) % 10, ones: n % 10 };
}
