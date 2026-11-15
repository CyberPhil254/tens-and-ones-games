import { tensOnes } from '../maths/placeValue';
import './pictures.css';

/** A number with the tens digit red and the ones digit blue, as on every screen. */
export function Num({ n }: { n: number }) {
  // Three digits have no red and blue: only tens and ones are coloured.
  if (n > 99) return <span className="num">{n}</span>;
  const { tens, ones } = tensOnes(n);
  return (
    <span className="num" aria-label={String(n)}>
      {tens > 0 && <span className="t">{tens}</span>}
      <span className="o">{ones}</span>
    </span>
  );
}

/** The place of a missing number: a yellow box with a question mark, or the number once it is found. */
export function Box({ found }: { found?: number }) {
  return found === undefined ? <span className="box">?</span> : <span className="box found"><Num n={found} /></span>;
}
