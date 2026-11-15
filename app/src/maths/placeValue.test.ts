import { describe, expect, it } from 'vitest';
import { tensOnes } from './placeValue';

describe('tensOnes', () => {
  it('splits every number from 0 to 100 so the parts add back up', () => {
    for (let n = 0; n <= 100; n++) {
      const { hundreds, tens, ones } = tensOnes(n);
      expect(hundreds * 100 + tens * 10 + ones).toBe(n);
      expect(tens).toBeLessThanOrEqual(9);
      expect(ones).toBeLessThanOrEqual(9);
    }
  });

  it('refuses numbers outside 0 to 100', () => {
    expect(() => tensOnes(-1)).toThrow(RangeError);
    expect(() => tensOnes(101)).toThrow(RangeError);
    expect(() => tensOnes(3.5)).toThrow(RangeError);
  });
});
