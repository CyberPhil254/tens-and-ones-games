import './pictures.css';

const SK = '#FFD58A', SH = '#EDB25A', K = '#1B2A4A';
/** Index, middle, ring, little finger: x, tip, lean. */
const FINGERS = [[38, 34, -7], [55, 20, -2], [72, 28, 3], [88, 46, 9]] as const;

/** One open hand seen from the back: `up` fingers are stretched, the others curled in. The thumb is the fifth. */
function Hand({ up, flip }: { up: number; flip?: boolean }) {
  return (
    <svg viewBox="-8 4 120 158" className={flip ? 'hand flip' : 'hand'} aria-hidden="true">
      <g stroke={K} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {up >= 5 ? (
          <rect x="-8" y="102" width="46" height="18" rx="9" fill={SK} transform="rotate(42 34 112)" />
        ) : (
          <ellipse cx="29" cy="113" rx="8" ry="12" fill={SH} />
        )}
        {FINGERS.map(([x, top, lean], i) =>
          up > i ? (
            <rect key={i} x={x - 7.5} y={top} width="15" height={96 - top} rx="7.5" fill={SK} transform={`rotate(${lean} ${x} 92)`} />
          ) : (
            <rect key={i} x={x - 7.5} y="70" width="15" height="26" rx="7.5" fill={SH} transform={`rotate(${lean} ${x} 92)`} />
          ),
        )}
        <path d="M27 102 Q27 82 46 80 L83 80 Q101 82 101 102 L99 124 Q97 144 76 146 L54 146 Q33 144 30 124 Z" fill={SK} />
        {FINGERS.map(([x, , lean], i) =>
          up <= i ? <path key={i} d={`M${x - 5} 90 q5 5 10 0`} fill="none" strokeWidth="2" transform={`rotate(${lean} ${x} 92)`} /> : null,
        )}
        <rect x="36" y="140" width="58" height="18" rx="7" fill="#86B4FF" />
      </g>
    </svg>
  );
}

/** `n` fingers up, from 0 to 10. The second hand shows when it is needed, or always with `both`. */
export function Hands({ n, both }: { n: number; both?: boolean }) {
  return (
    <div className="hands" role="img" aria-label={`${n} fingers`}>
      <Hand up={Math.min(n, 5)} />
      {(n > 5 || both) && <Hand up={Math.max(0, n - 5)} flip />}
    </div>
  );
}
