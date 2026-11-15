import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Num } from './Num';

describe('Num', () => {
  it('marks the tens digit and the ones digit', () => {
    const { container } = render(<Num n={47} />);
    expect(container.querySelector('.t')?.textContent).toBe('4');
    expect(container.querySelector('.o')?.textContent).toBe('7');
  });

  it('shows a single digit as ones only', () => {
    const { container } = render(<Num n={6} />);
    expect(container.querySelector('.t')).toBeNull();
    expect(container.querySelector('.o')?.textContent).toBe('6');
  });
});
