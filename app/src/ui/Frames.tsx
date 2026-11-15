import './pictures.css';

/**
 * One or two ten frames for numbers to 20, filled in order: `blue` counters, then `sun` (yellow)
 * ones added after them. The last `gone` of the blue ones are crossed out. Because the counters
 * fill the first frame before the second, adding and taking away through ten can be seen.
 */
export function Frames({ blue, sun = 0, gone = 0 }: { blue: number; sun?: number; gone?: number }) {
  const total = blue + sun;
  const frames = total > 10 ? 2 : 1;
  const label = `ten ${frames === 1 ? 'frame' : 'frames'} with ${blue} blue${sun ? ` and ${sun} yellow` : ''} counters${gone ? `, ${gone} crossed out` : ''}`;
  return (
    <div className="frames" role="img" aria-label={label} data-blue={blue} data-sun={sun} data-gone={gone}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="frame half">
          {Array.from({ length: 10 }, (_, c) => {
            const i = f * 10 + c;
            return (
              <div key={c} className="cell">
                {i < blue - gone ? <div className="dot" /> : i < blue ? <div className="dot gone" /> : i < total ? <div className="dot sun" /> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Two rows of counters, one under the other, in fives. For doubles (two equal rows) and for the
 * difference: with `pairs`, the counters of the long row that have no partner are marked.
 */
export function Rows({ top, bottom, pairs = false }: { top: number; bottom: number; pairs?: boolean }) {
  const row = (n: number, lone: number) => (
    <div className="crow">
      {Array.from({ length: n }, (_, i) => <span key={i} className={['dot', i === 5 && 'gap', pairs && i >= n - lone && 'lone'].filter(Boolean).join(' ')} />)}
    </div>
  );
  return (
    <div className="rows2" role="img" aria-label={`two rows: ${top} counters and ${bottom} counters`} data-top={top} data-bottom={bottom}>
      {row(top, Math.max(0, top - bottom))}
      {row(bottom, Math.max(0, bottom - top))}
    </div>
  );
}
