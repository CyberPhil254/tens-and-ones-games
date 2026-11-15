import { useState } from 'react';
import { tensW } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Frames } from '../ui/Frames';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Friends of 20 and 100. To 20: two ten frames, the empty places are the answer.
 * Tens to 100: rods of ten, ten of them make 100. Level 3: in her head, the picture after a miss or if she asks.
 * The missing ones or tens arrive in yellow when she is right.
 */
export function FriendsOf20({ q, level, round }: GameProps<'bonds'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const picture = level < 3 || done || missed || asked;
  const k = q.n / 10, more = q.ans / 10;

  const right = () => {
    setDone(true);
    round.win(
      q.kind === 'tens' ? `${tensW(k)} and ${tensW(more)} make 10 tens. ${q.eq}.`
        : q.n % 10 && q.n > 10 ? `${q.eq}. The same friends: ${q.n % 10} and ${q.ans}.` : `${q.eq}.`,
      q.sayEq,
    );
  };
  const wrong = () => {
    setMissed(true);
    round.wrong(q.hint, q.sayHint);
  };

  return (
    <>
      <Prompt round={round} say={q.say}>
        <Num n={q.n} /> + <Box found={done ? q.ans : undefined} /> = <Num n={q.whole} />
      </Prompt>
      <Stage>
        {!picture ? (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
        ) : q.kind === 'to20' ? (
          <Frames blue={q.n} sun={done ? q.ans : 0} frames={2} />
        ) : (
          <div className="tensto100" data-testid="tensto100">
            <Blocks tens={k} ones={0} counted />
            {done && <><span className="plus">+</span><div className="suntens"><Blocks tens={more} ones={0} /></div></>}
            {!done && <p className="sub">{tensW(k)}. 10 tens make 100.</p>}
          </div>
        )}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
