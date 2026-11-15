import { Num } from './Num';
import { Oreo } from './Oreo';
import './pictures.css';

export interface NumberLineProps {
  /** The number laid out along the line as tens and ones, 0 to 100. */
  n: number;
  /** Where the puppy stands, when it is not at the end of the blocks (a guess). */
  puppyAt?: number;
  /** Only 0, 50 and 100 are written, and the magnifier is hidden. */
  sparse?: boolean;
  /** When given, the line can be tapped; the number tapped is rounded to a whole one. */
  onTap?: (n: number) => void;
}

/** A line from 0 to 100 with tens and ones lying end to end, and a magnifier for the ones in the current ten. */
export function NumberLine({ n, puppyAt, sparse, onTap }: NumberLineProps) {
  const t = Math.min(9, Math.floor(n / 10));
  const o = n - t * 10;
  return (
    <div className={sparse ? 'nline sparse' : 'nline'} role="img" aria-label={`number line showing ${n}`}>
      <div className="nl-pup" style={{ left: `${puppyAt ?? n}%` }}>
        <Oreo pose="standing" className="nl-oreo" />
      </div>
      <div className="nl-bar">
        {Array.from({ length: Math.floor(n / 10) }, (_, i) => <div key={`t${i}`} className="hrod" />)}
        {Array.from({ length: n % 10 }, (_, i) => <div key={`o${i}`} className="hcube" />)}
      </div>
      <div className="nl-axis">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} style={{ left: `${i * 10}%` }} className={i % 5 ? 'minor' : undefined}>{i * 10}</span>
        ))}
      </div>
      <div className="nl-zoom" aria-hidden="true">
        <span><Num n={t * 10} /></span>
        <div className="zcells">
          {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < o ? 'on' : undefined} />)}
        </div>
        <span><Num n={t * 10 + 10} /></span>
      </div>
      {onTap && (
        <div
          className="nl-hit"
          data-testid="line-hit"
          onClick={(e) => {
            const bar = e.currentTarget.parentElement!.querySelector('.nl-bar')!.getBoundingClientRect();
            onTap(Math.max(0, Math.min(100, Math.round(((e.clientX - bar.left) / bar.width) * 100))));
          }}
        />
      )}
    </div>
  );
}
