import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Piece } from '../speech/script';
import { Num } from '../ui/Num';
import type { RoundApi } from './round';

/** The question at the top of the card. `say` is read aloud when it appears and when the speaker is tapped. */
export function Prompt({ round, say, sub, children }: { round: RoundApi; say: Piece[]; sub?: ReactNode; children: ReactNode }) {
  const key = JSON.stringify(say);
  const ask = useRef(round.ask);
  useEffect(() => {
    ask.current = round.ask;
  });
  useEffect(() => {
    ask.current(JSON.parse(key) as Piece[]);
  }, [key]);
  return (
    <>
      <p className="prompt"><span data-testid="prompt">{children}</span></p>
      {sub && <p className="sub">{sub}</p>}
    </>
  );
}

export const Stage = ({ children }: { children: ReactNode }) => <div className="stage">{children}</div>;

/**
 * Answer buttons. A wrong one is greyed out and cannot be tapped again; the right one turns green
 * and closes the question.
 */
export function Choices({ opts, ans, pad, round, onRight, onWrong }: {
  opts: readonly number[];
  ans: number;
  /** The 1 to 9 pad: smaller buttons. */
  pad?: boolean;
  round: RoundApi;
  onRight: () => void | Promise<void>;
  onWrong: (tapped: number) => void;
}) {
  const [tried, setTried] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  return (
    <div className="answers">
      <div className={pad ? 'choices pad' : 'choices'}>
        {opts.map((v) => (
          <button
            key={v}
            type="button"
            className={['choice', right && v === ans && 'yes', tried.includes(v) && 'no'].filter(Boolean).join(' ')}
            disabled={right || round.over || tried.includes(v)}
            onClick={() => {
              if (v === ans) {
                setRight(true);
                void onRight();
              } else {
                setTried((t) => [...t, v]);
                onWrong(v);
              }
            }}
          >
            <Num n={v} />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Shows a picture for a moment, then covers it, so it is seen and not counted.
 * A button lets her peek again: as often as she likes, or `peeks` times, after which the button goes.
 * `stay` uncovers it for good, once she has answered.
 */
export function Flash({ stay, peeks, children }: { stay: boolean; peeks?: number; children: ReactNode }) {
  const [covered, setCovered] = useState(false);
  const [used, setUsed] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    timer.current = setTimeout(() => setCovered(true), 1900);
    return () => clearTimeout(timer.current);
  }, []);
  const peek = () => {
    clearTimeout(timer.current);
    setCovered(false);
    setUsed((u) => u + 1);
    timer.current = setTimeout(() => setCovered(true), 1600);
  };
  return (
    <>
      <div className={covered && !stay ? 'flash covered' : 'flash'} data-testid="flash">{children}</div>
      {!stay && (peeks === undefined || used < peeks) && <button type="button" className="ghostbtn" onClick={peek}>Peek again</button>}
    </>
  );
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A pause between the steps of a little animation (move a block, wait, pack a ten).
 * The pause never ends once the question is gone, so a step cannot act on a screen that has moved on.
 * With reduced motion the steps follow each other at once.
 */
export function useWait(): (ms: number) => Promise<void> {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return useCallback(
    (ms: number) => new Promise<void>((done) => setTimeout(() => alive.current && done(), reducedMotion() ? 0 : ms)),
    [],
  );
}

/** A row of big buttons for games where the child builds the answer. */
export const Controls = ({ children }: { children: ReactNode }) => (
  <div className="answers">
    <div className="controls">{children}</div>
  </div>
);
