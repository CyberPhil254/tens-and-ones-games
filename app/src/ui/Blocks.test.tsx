import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Blocks } from './Blocks';

const count = (c: HTMLElement, sel: string) => c.querySelectorAll(sel).length;

describe('Blocks', () => {
  it('draws every number from 0 to 99 as that many tens and ones', () => {
    for (let n = 0; n <= 99; n++) {
      const t = Math.floor(n / 10), o = n % 10;
      const { container, unmount } = render(<Blocks tens={t} ones={o} />);
      expect(count(container, '.rod')).toBe(t);
      expect(count(container, '.rod i')).toBe(t * 10);
      expect(count(container, '.cube')).toBe(o);
      unmount();
    }
  });

  it('says what it shows', () => {
    const { getByRole } = render(<Blocks tens={3} ones={4} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('3 tens and 4 ones');
  });

  it('labels the tens 10, 20, 30 and the ones with their count', () => {
    const { container } = render(<Blocks tens={3} ones={4} counted />);
    expect([...container.querySelectorAll('.rod')].map((r) => r.getAttribute('data-n'))).toEqual(['10', '20', '30']);
    expect(container.querySelector('.oneswrap')?.getAttribute('data-n')).toBe('4');
  });

  it('gives no ones label when there are no ones', () => {
    const { container } = render(<Blocks tens={3} ones={0} counted />);
    expect(container.querySelector('.oneswrap')?.hasAttribute('data-n')).toBe(false);
  });

  it('colours the ones just added yellow, at the end', () => {
    const { container } = render(<Blocks tens={4} ones={10} sunOnes={3} />);
    const cubes = [...container.querySelectorAll('.cube')];
    expect(cubes.map((c) => c.classList.contains('sun'))).toEqual([false, false, false, false, false, false, false, true, true, true]);
  });

  it('pops in only what is added after it first appears', () => {
    const { container, rerender } = render(<Blocks tens={2} ones={3} />);
    expect(count(container, '.pop')).toBe(0);
    rerender(<Blocks tens={3} ones={4} />);
    expect(count(container, '.rod.pop')).toBe(1);
    expect(count(container, '.cube.pop')).toBe(1);
    // Take two tens away and put one back: the one put back pops in.
    rerender(<Blocks tens={1} ones={4} />);
    rerender(<Blocks tens={2} ones={4} />);
    expect([...container.querySelectorAll('.rod')].map((r) => r.classList.contains('pop'))).toEqual([false, true]);
  });

  it('shakes only the last ten when breaking it', () => {
    const { container } = render(<Blocks tens={3} ones={0} cracking />);
    expect([...container.querySelectorAll('.rod')].map((r) => r.classList.contains('crack'))).toEqual([false, false, true]);
  });
});
