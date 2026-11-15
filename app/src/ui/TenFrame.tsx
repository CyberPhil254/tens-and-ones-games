import './pictures.css';

/** A ten frame: two rows of five. `n` blue counters, then `added` yellow ones filling the empty places. */
export function TenFrame({ n, added = 0 }: { n: number; added?: number }) {
  return (
    <div className="frame" role="img" aria-label={`ten frame with ${n} counters`}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="cell">
          {i < n ? <div className="dot" /> : i < n + added ? <div className="dot sun" /> : null}
        </div>
      ))}
    </div>
  );
}
