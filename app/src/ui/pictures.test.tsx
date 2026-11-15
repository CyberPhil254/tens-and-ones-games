import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BarModel } from './BarModel';
import { Hands } from './Hands';
import { HundredSquare } from './HundredSquare';
import { NumberLine } from './NumberLine';
import { TenFrame } from './TenFrame';

const count = (c: HTMLElement, sel: string) => c.querySelectorAll(sel).length;

describe('TenFrame', () => {
  it('shows n blue counters in ten places, for 0 to 10', () => {
    for (let n = 0; n <= 10; n++) {
      const { container, unmount } = render(<TenFrame n={n} />);
      expect(count(container, '.cell')).toBe(10);
      expect(count(container, '.dot')).toBe(n);
      unmount();
    }
  });
  it('fills the empty places with yellow counters', () => {
    const { container } = render(<TenFrame n={7} added={3} />);
    expect(count(container, '.dot:not(.sun)')).toBe(7);
    expect(count(container, '.dot.sun')).toBe(3);
  });
});

describe('Hands', () => {
  it('shows one hand up to five and two hands above', () => {
    expect(count(render(<Hands n={4} />).container, '.hand')).toBe(1);
    expect(count(render(<Hands n={5} />).container, '.hand')).toBe(1);
    expect(count(render(<Hands n={6} />).container, '.hand')).toBe(2);
    expect(count(render(<Hands n={3} both />).container, '.hand')).toBe(2);
  });
  it('says how many fingers', () => {
    expect(render(<Hands n={7} />).getByRole('img').getAttribute('aria-label')).toBe('7 fingers');
  });
});

describe('HundredSquare', () => {
  it('has the numbers 1 to 100 in order', () => {
    const { container } = render(<HundredSquare />);
    expect([...container.querySelectorAll('button')].map((b) => b.textContent)).toEqual(Array.from({ length: 100 }, (_, i) => String(i + 1)));
  });
  it('tints the column of a ones digit, 10 to 100 for zero', () => {
    const { container } = render(<HundredSquare column={7} marks={{ 47: ['here'] }} />);
    const tinted = [...container.querySelectorAll('.col')].map((b) => b.textContent);
    expect(tinted).toEqual(['7', '17', '27', '37', '57', '67', '77', '87', '97']);
    expect(container.querySelector('.here')?.textContent).toBe('47');
  });
  it('reports the square tapped, and is only a picture without a handler', () => {
    const onTap = vi.fn();
    const live = render(<HundredSquare onTap={onTap} />);
    fireEvent.click(live.getByText('57'));
    expect(onTap).toHaveBeenCalledWith(57);
    const still = render(<HundredSquare />);
    expect(still.container.querySelector('button')?.disabled).toBe(true);
  });
});

describe('NumberLine', () => {
  it('lays every number from 0 to 100 out as tens and ones, with the puppy at its end', () => {
    for (let n = 0; n <= 100; n++) {
      const { container, unmount } = render(<NumberLine n={n} />);
      expect(count(container, '.hrod')).toBe(Math.floor(n / 10));
      expect(count(container, '.hcube')).toBe(n % 10);
      expect((container.querySelector('.nl-pup') as HTMLElement).style.left).toBe(`${n}%`);
      unmount();
    }
  });
  it('magnifies the ones between this ten and the next', () => {
    const { container } = render(<NumberLine n={47} />);
    expect(count(container, '.zcells i.on')).toBe(7);
    expect(container.querySelector('.nl-zoom')?.textContent).toBe('4050');
  });
  it('keeps 100 in the last ten: 90 to 100, all ten ones', () => {
    const { container } = render(<NumberLine n={100} />);
    expect(count(container, '.zcells i.on')).toBe(10);
    expect(container.querySelector('.nl-zoom')?.textContent).toBe('90100');
  });
});

describe('BarModel', () => {
  it('shows a missing part as a question mark, then the number', () => {
    const { container, rerender } = render(<BarModel whole={10} parts={[4, null]} ans={6} />);
    expect(container.querySelector('.whole')?.textContent).toBe('10');
    expect([...container.querySelectorAll('.part')].map((p) => p.textContent)).toEqual(['4', '?']);
    rerender(<BarModel whole={10} parts={[4, null]} ans={6} found />);
    expect(container.querySelector('.part.unk.found')?.textContent).toBe('6');
  });
  it('shows a missing whole', () => {
    const { container } = render(<BarModel whole={null} parts={[34, 20]} ans={54} />);
    expect(container.querySelector('.whole.unk')?.textContent).toBe('?');
  });
  it('makes each part as wide as its number', () => {
    const { container } = render(<BarModel whole={14} parts={[3, null, 5]} ans={6} />);
    expect([...container.querySelectorAll<HTMLElement>('.part')].map((p) => p.style.flexGrow)).toEqual(['3', '6', '5']);
  });
});
