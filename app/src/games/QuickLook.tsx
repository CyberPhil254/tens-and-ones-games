import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { Choices, Flash, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import type { GameProps } from './registry';

/**
 * Quick Look: read a two-digit number from its tens and ones, at a glance.
 * Level 1: the tens are labelled 10, 20, 30. Level 2: no labels until they are needed.
 * Level 3: the blocks are shown for a moment, then covered.
 */
export function QuickLook({ q, level, round }: GameProps<'look'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const counted = level === 1 || done || (missed && level < 3);
  const blocks = <Blocks tens={q.t} ones={q.o} counted={counted} />;

  return (
    <>
      <Prompt round={round} say={['how-many-blocks-do-you-see']}>How many?</Prompt>
      <Stage>
        {level === 3 ? <Flash stay={done}>{blocks}</Flash> : blocks}
        {done && (
          <div className="blabels">
            <span className="lt">{tensW(q.t)} = {q.t * 10}</span>
            <span className="lo">{onesW(q.o)} = {q.o}</span>
          </div>
        )}
      </Stage>
      <Choices
        opts={q.opts} ans={q.n} round={round}
        onRight={() => {
          setDone(true);
          round.win(`${tensW(q.t)} and ${onesW(q.o)}. ${q.t * 10} + ${q.o} = ${q.n}.`, [`isTO.${q.n}`]);
        }}
        onWrong={() => {
          setMissed(true);
          round.wrong('You do not need to count every block. Count the red tens in tens: 10, 20, 30. Then add the blue ones.', ['do-not-count-every-block-count']);
        }}
      />
    </>
  );
}
