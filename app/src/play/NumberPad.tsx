import { useState } from 'react';
import { Num } from '../ui/Num';
import type { RoundApi } from './round';

/**
 * The number pad: she types the answer and taps the tick. Recalling an answer teaches more than
 * recognising it among choices, and it cannot be guessed by tapping around.
 * A wrong number is cleared and handed to `onWrong`, which explains; she types again.
 */
export function NumberPad({ ans, round, onRight, onWrong }: { ans: number; round: RoundApi; onRight: () => void | Promise<void>; onWrong: (typed: number) => void }) {
  const [typed, setTyped] = useState('');
  const [right, setRight] = useState(false);
  const closed = right || round.over;
  const key = (d: number) => setTyped((t) => (t.length >= 2 ? t : t === '0' ? String(d) : t + d));
  const ok = () => {
    if (!typed) return;
    if (Number(typed) === ans) {
      setRight(true);
      void onRight();
    } else {
      onWrong(Number(typed));
      setTyped('');
    }
  };
  return (
    <div className="answers">
      <output className={right ? 'typed yes' : 'typed'} data-testid="typed" aria-label={typed ? `You typed ${typed}` : 'Nothing typed yet'}>
        {typed ? <Num n={Number(typed)} /> : ' '}
      </output>
      <div className="numpad" data-testid="numpad">
        {[1, 2, 3].map((d) => <Key key={d} d={d} off={closed} tap={key} />)}
        <button type="button" className="choice padkey" aria-label="Rub out" disabled={closed || !typed} onClick={() => setTyped((t) => t.slice(0, -1))}>⌫</button>
        {[4, 5, 6].map((d) => <Key key={d} d={d} off={closed} tap={key} />)}
        <Key d={0} off={closed} tap={key} />
        {[7, 8, 9].map((d) => <Key key={d} d={d} off={closed} tap={key} />)}
        <button type="button" className="choice padkey tick" aria-label="That is my answer" disabled={closed || !typed} onClick={ok}>✓</button>
      </div>
    </div>
  );
}

const Key = ({ d, off, tap }: { d: number; off: boolean; tap: (d: number) => void }) => (
  <button type="button" className="choice padkey" disabled={off} onClick={() => tap(d)}>{d}</button>
);
