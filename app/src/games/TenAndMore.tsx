import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

const said = (n: number) => `${n} is ${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}.`;

/**
 * Ten and some more: the numbers 10 to 20 as one ten and some ones.
 * Level 1: read the blocks. Level 2: how many ones go with the ten (they arrive in yellow).
 * Level 3: in her head, on the number pad; the blocks after a miss or if she asks.
 */
export function TenAndMore({ q, level, round }: GameProps<'teens'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const picture = level < 3 || done || missed || asked;
  const t = Math.floor(q.n / 10), o = q.n % 10;
  const right = () => { setDone(true); round.win(said(q.n), q.sayEq); };
  const wrong = () => { setMissed(true); round.wrong(q.hint, q.sayHint); };
  return (
    <>
      <Prompt round={round} say={q.say}>
        {q.kind === 'ones' ? <><Num n={q.n} /> = <Num n={10} /> + <Box found={done ? q.ans : undefined} /></>
          : level === 3 ? <><Num n={10} /> + <Num n={o} /> = <Box found={done ? q.ans : undefined} /></>
          : 'How many?'}
      </Prompt>
      <Stage>
        {!picture ? (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show the blocks</button>
        ) : q.kind === 'ones' && !done ? (
          <Blocks tens={1} ones={0} counted />
        ) : (
          <Blocks tens={t} ones={o} sunOnes={q.kind === 'ones' ? o : 0} counted={done || missed} />
        )}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}

/**
 * Another way: 34 is 3 tens and 4 ones, and also 2 tens and 14 ones.
 * Level 1: the blocks with one ten broken. Level 2: in her head.
 */
export function AnotherWay({ q, level, round }: GameProps<'regroup'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const picture = level === 1 || done || missed || asked;
  const right = () => { setDone(true); round.win(`${said(q.n)} It is also ${tensW(q.t - 1)} and ${onesW(q.ans)}.`, q.sayEq); };
  const wrong = () => { setMissed(true); round.wrong(q.hint, q.sayHint); };
  return (
    <>
      <Prompt round={round} say={q.say} sub={`${q.n} is ${tensW(q.t)} and ${onesW(q.o)}. Break one ten.`}>
        <Num n={q.n} /> = <span className="wordy"><span className="t">{tensW(q.t - 1)}</span></span> and <Box found={done ? q.ans : undefined} /> <span className="wordy"><span className="o">ones</span></span>
      </Prompt>
      <Stage>
        {picture
          ? <Blocks tens={q.t - 1} ones={q.ans} counted={done || missed} />
          : !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show the blocks</button>}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
