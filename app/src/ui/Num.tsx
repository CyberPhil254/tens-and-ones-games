import { tensOnes } from '../maths/placeValue';

/** A number with the tens digit red and the ones digit blue, as on every screen. */
export function Num({ n }: { n: number }) {
  const { hundreds, tens, ones } = tensOnes(n);
  if (hundreds > 0) return <span className="num">{n}</span>;
  return (
    <span className="num" aria-label={String(n)}>
      {tens > 0 && <span className="t">{tens}</span>}
      <span className="o">{ones}</span>
    </span>
  );
}
