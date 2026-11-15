import { useState } from 'react';
import { Choices, Flash, Prompt, Stage } from '../play/parts';
import type { GameProps } from './registry';

/**
 * See how many, new patterns. The dots are shown for a moment and then covered, so they are
 * seen and not counted; she may peek again. After a miss the picture stays, with a ring round
 * each small group, so she can see the groups and put them together.
 */
export function NewPatterns({ q, round }: GameProps<'dots'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const rings = done || missed;
  const two = q.groups.length === 2;
  return (
    <>
      <Prompt round={round} say={q.say}>How many?</Prompt>
      <Stage>
        <Flash stay={rings}>
          <svg className="dotpic" viewBox="0 0 200 100" role="img" aria-label={two ? `${q.n} dots: a group of ${q.groups[0]} and a group of ${q.groups[1]}` : `${q.n} dots`} data-n={q.n}>
            {rings && two && <><rect className="ring" x="6" y="6" width="88" height="88" rx="14" /><rect className="ring" x="106" y="6" width="88" height="88" rx="14" /></>}
            {q.dots.map((p, i) => <circle key={i} className="pdot" cx={p.x} cy={p.y} r="9" />)}
          </svg>
        </Flash>
        {rings && two && <p className="sub" data-testid="groups">{q.groups[0]} and {q.groups[1]}</p>}
      </Stage>
      <Choices
        opts={q.opts} ans={q.n} round={round}
        onRight={() => { setDone(true); round.win(two ? `${q.groups[0]} and ${q.groups[1]} make ${q.n}.` : `${q.n}. You just saw it!`, q.sayEq); }}
        onWrong={() => { setMissed(true); round.wrong(q.hint, q.sayHint); }}
      />
    </>
  );
}
