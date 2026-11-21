import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import './blocks.css';

export interface BlocksProps {
  /** Red rods of ten. */
  tens: number;
  /** Loose blue ones. More than nine is allowed: ten ones waiting to be packed, or a ten just broken. */
  ones: number;
  /** How many of the last ones are yellow: the ones just added in a sum. */
  sunOnes?: number;
  /** How many of the last ones are taken away: crossed out, and still in their place so that she sees what went. */
  goneOnes?: number;
  /** Small blocks, for beside a hundred square. */
  small?: boolean;
  /** Show 10, 20, 30 under the tens and the count under the ones. */
  counted?: boolean;
  /** Lines and dots instead of blocks. */
  sketch?: boolean;
  /** The ones are turning red, about to become a ten. */
  merging?: boolean;
  /** The last ten is shaking, about to break into ones. */
  cracking?: boolean;
  /** When given, tens and ones can be tapped (Break a Ten). */
  onTapTen?: () => void;
  onTapOne?: () => void;
}

/**
 * The lowest count seen since the picture appeared. Pieces above it were added later and pop in;
 * pieces that were there from the start do not move.
 */
function useFloor(value: number): number {
  const [floor, setFloor] = useState(value);
  if (value < floor) setFloor(value);
  return Math.min(floor, value);
}

/** A number as tens and ones blocks. It only draws what it is given; the games decide the steps. */
export function Blocks({ tens, ones, sunOnes = 0, goneOnes = 0, small, counted, sketch, merging, cracking, onTapTen, onTapOne }: BlocksProps) {
  const tensFloor = useFloor(tens);
  const onesFloor = useFloor(ones);
  const cls = ['blocks', small && 'small', counted && 'counted', sketch && 'sketch'].filter(Boolean).join(' ');

  return (
    <div className={cls} role="img" aria-label={`${tensW(tens)} and ${onesW(ones - goneOnes)}${goneOnes ? `, ${goneOnes} crossed out` : ''}`} data-gone={goneOnes || undefined}>
      <div className="rods" onClick={onTapTen}>
        {Array.from({ length: tens }, (_, r) => (
          <div
            key={r}
            className={['rod', r >= tensFloor && 'pop', cracking && r === tens - 1 && 'crack'].filter(Boolean).join(' ')}
            data-n={(r + 1) * 10}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        ))}
      </div>
      <div className="oneswrap" data-n={ones || undefined}>
        <div className="ghost">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="slot" />
          ))}
        </div>
        <div className={merging ? 'ones merge' : 'ones'} onClick={onTapOne}>
          {Array.from({ length: ones }, (_, i) => (
            <div key={i} className={['cube', i >= onesFloor && 'pop', i >= ones - sunOnes && 'sun', i >= ones - goneOnes && 'gone'].filter(Boolean).join(' ')} />
          ))}
        </div>
      </div>
    </div>
  );
}
