import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Tens and ones sums, adding: 34 + 25 with no new ten.
 * Level 1: both numbers as blocks. Level 2: the same as a sketch. Level 3: in her head, on the number pad.
 * A wrong answer, and the right one, put the tens together and the ones together on screen,
 * the second number's ones in yellow, with the two little sums written under them.
 */
export function TensOnesSums({ q, level, round }: GameProps<'plus'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const joined = done || missed;
  const picture = level < 3 || joined || asked;
  const sketch = level === 2;

  const right = () => {
    setDone(true);
    round.win(`${tensW(q.t[0])} and ${tensW(q.t[1])} are ${tensW(q.t[2])}. ${onesW(q.o[0])} and ${onesW(q.o[1])} are ${onesW(q.o[2])}. ${q.eq}.`, q.sayEq);
  };
  const wrong = () => {
    setMissed(true);
    round.wrong(q.hint, q.sayHint);
  };

  return (
    <>
      <Prompt round={round} say={q.say}>
        <Num n={q.a} /> + <Num n={q.b} /> = <Box found={done ? q.ans : undefined} />
      </Prompt>
      <Stage>
        {!picture ? (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show the blocks</button>
        ) : joined ? (
          <div className="joined" data-testid="joined">
            <Blocks tens={q.t[2]} ones={q.o[2]} sunOnes={q.o[1]} sketch={sketch} counted />
            <p className="split">
              <span className="tt">{tensW(q.t[0])} + {tensW(q.t[1])}{done ? ` = ${tensW(q.t[2])}` : ''}</span>
              <span className="oo">{onesW(q.o[0])} + {onesW(q.o[1])}{done ? ` = ${onesW(q.o[2])}` : ''}</span>
            </p>
          </div>
        ) : (
          <div className="twonums" data-testid="twonums">
            <Blocks tens={q.t[0]} ones={q.o[0]} sketch={sketch} small />
            <span className="plus">+</span>
            <Blocks tens={q.t[1]} ones={q.o[1]} sketch={sketch} small />
          </div>
        )}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
