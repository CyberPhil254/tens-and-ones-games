import { Blocks } from './Blocks';
import { Num } from './Num';

/**
 * Taking away through ten, one step at a time, in the blocks: 17 − 9 is a red ten and 7 blue ones.
 *   0  nothing taken yet
 *   1  the ones are taken away (crossed out): 17 − 7 = 10. Part of the 9 is still to take.
 *   2  the ten is broken into ten ones, ready for the rest
 *   3  the rest is taken away from the ten: 10 − 2 = 8
 * Above the blocks a row of dots stands for what is taken away, one dot for each; the ones already
 * taken are ticked. Under the blocks the two little sums appear as each step is done.
 */
export type DownStep = 0 | 1 | 2 | 3;

export function DownToTen({ a, b, step, cracking, onTapOnes }: { a: number; b: number; step: DownStep; cracking?: boolean; onTapOnes?: () => void }) {
  const first = a - 10, rest = b - first, took = step === 0 ? 0 : step === 3 ? b : first;
  return (
    <div className="downten" data-testid="downten" data-step={step} data-took={took}>
      <div className="totake" role="img" aria-label={`Take away ${b}: ${took} taken, ${b - took} still to take`}>
        <span>Take away <Num n={b} />:</span>
        <span className="tk">{Array.from({ length: b }, (_, i) => <i key={i} className={i < took ? 'took' : undefined} />)}</span>
      </div>
      <span className={onTapOnes ? 'blocks-tap' : undefined}>
        {step < 2
          ? <Blocks tens={1} ones={first} goneOnes={step === 1 ? first : 0} cracking={cracking} onTapOne={onTapOnes} />
          : <Blocks tens={0} ones={10} goneOnes={step === 3 ? rest : 0} />}
      </span>
      <ol className="steplines" data-testid="steplines">
        {step >= 1 && <li><Num n={a} /> − <Num n={first} /> = <Num n={10} /></li>}
        {step >= 3 && <li><Num n={10} /> − <Num n={rest} /> = <Num n={10 - rest} /></li>}
      </ol>
    </div>
  );
}
