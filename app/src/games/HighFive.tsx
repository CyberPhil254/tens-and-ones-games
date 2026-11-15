import { useState } from 'react';
import { Choices, Flash, Prompt, Stage } from '../play/parts';
import { SP } from '../speech/script';
import { Blocks } from '../ui/Blocks';
import { Hands } from '../ui/Hands';
import { TenFrame } from '../ui/TenFrame';
import type { GameProps } from './registry';

/**
 * High Five: see five and some more, without counting one by one.
 * Level 1: fingers and the two-tone tower side by side. Level 2: the tower for a moment.
 * Level 3: a ten frame for a moment. The fingers come back with the answer.
 */
export function HighFive({ q, level, round }: GameProps<'five'>) {
  const [done, setDone] = useState(false);
  const n = q.n;
  const picture = level === 3 ? <TenFrame n={n} /> : <Blocks tens={0} ones={n} />;

  const right = () => {
    setDone(true);
    if (n < 5) round.win(`${n}. You just saw it!`, [n, 'you-just-saw-it']);
    else if (n === 5) round.win('5. One whole hand!', ['5-one-whole-hand']);
    else if (n === 10) round.win('5 and 5 make 10. Two whole hands!', ['5-and-5-make-10-two']);
    else round.win(SP.five(n - 5), [`five.${n - 5}`]);
  };
  const wrong = () =>
    level === 3
      ? round.wrong('You do not need to count them all. The top row is 5. How many more are there?', ['do-not-count-them-all-the'])
      : round.wrong('You do not need to count them all. The dark blue ones are 5. How many more are there?', ['do-not-count-them-all-the-dark']);

  return (
    <>
      <Prompt round={round} say={['how-many-do-not-count-look']}>How many?</Prompt>
      <Stage>
        <div className="fiverow">
          {(level === 1 || done) && <Hands n={n} />}
          {level === 1 ? picture : <Flash stay={done}>{picture}</Flash>}
        </div>
      </Stage>
      <Choices opts={q.opts} ans={n} round={round} onRight={right} onWrong={wrong} />
    </>
  );
}
