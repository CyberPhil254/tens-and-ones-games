import { Num } from './Num';
import './pictures.css';

export interface BarModelProps {
  /** null when the whole is the missing number. */
  whole: number | null;
  /** null marks the missing part. */
  parts: (number | null)[];
  /** The missing number. It sets how wide the missing part is, and is shown once found. */
  ans: number;
  found?: boolean;
}

/** A whole and its parts as bars: the parts together are as long as the whole. */
export function BarModel({ whole, parts, ans, found }: BarModelProps) {
  const missing = (cls: string, style?: React.CSSProperties) => (
    <div className={`${cls} unk${found ? ' found' : ''}`} style={style}>{found ? <Num n={ans} /> : '?'}</div>
  );
  return (
    <div className="bar" role="img" aria-label="whole and parts">
      {whole == null ? missing('whole') : <div className="whole"><Num n={whole} /></div>}
      <div className="parts">
        {parts.map((p, i) =>
          p == null
            ? <span key={i} style={{ display: 'contents' }}>{missing('part', { flex: `${ans} 1 0` })}</span>
            : <div key={i} className="part" style={{ flex: `${p} 1 0` }}><Num n={p} /></div>,
        )}
      </div>
    </div>
  );
}
