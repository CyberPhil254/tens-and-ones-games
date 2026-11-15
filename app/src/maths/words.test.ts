import { describe, expect, it } from 'vitest';
import { onesW, tensW, word } from './words';

describe('number words', () => {
  it('names the numbers a child mixes up', () => {
    expect(word(0)).toBe('zero');
    expect(word(16)).toBe('sixteen');
    expect(word(60)).toBe('sixty');
    expect(word(47)).toBe('forty-seven');
    expect(word(100)).toBe('one hundred');
  });
  it('says one ten, two tens, one one, two ones', () => {
    expect([tensW(1), tensW(2), onesW(1), onesW(0)]).toEqual(['1 ten', '2 tens', '1 one', '0 ones']);
  });
});
