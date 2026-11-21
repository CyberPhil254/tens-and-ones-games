import { useState } from 'react';
import { SP } from '../speech/script';
import { tensW } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Frames } from '../ui/Frames';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Friends of 20 and 100. To 20: two ten frames, the empty places are the answer.
 * Tens to 100: rods of ten, ten of them make 100. Level 3: in her head, the picture after a miss or if she asks.
 * The missing ones or tens arrive in yellow when she is right.
 */
export function FriendsOf20(props: GameProps<'bonds'>) {
  return props.level === 4 ? <StepByStep {...props} /> : <Bonds {...props} />;
}

/**
 * 13 + ? = 20, step by step in the blocks. 13 is a red ten and 3 blue ones, with seven empty places.
 * One question, about the ones: "3 and how many more make ten?" The friends of ten she knows.
 * Then she watches the rest: the 7 arrive in yellow and fill the ten (3 + 7 = 10), the ten ones become a
 * second red ten, and the sum at the top is complete: 13 + 7 = 20. The same friends: 3 and 7.
 */
function StepByStep({ q, round }: GameProps<'bonds'>) {
  const wait = useWait();
  const o = q.n - 10;
  /** 0: the question. 1: the friend has arrived in yellow. 2: the ten ones are a second ten. */
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [merging, setMerging] = useState(false);
  return (
    <>
      <Prompt
        round={round}
        say={[q.n, 'frag.and-how-many-more-make', 20, 'the-ones-first', SP.friendsQ(o)]}
        sub={step ? undefined : <span data-testid="stepsub">Look at the ones first. <Num n={o} /> and how many more make ten?</span>}
      >
        <Num n={q.n} /> + <Box found={step ? q.ans : undefined} /> = <Num n={q.whole} />
      </Prompt>
      <Stage>
        <div className="downten" data-testid="upto20" data-step={step}>
          {step === 2 ? <Blocks tens={2} ones={0} counted /> : <Blocks tens={1} ones={step ? 10 : o} sunOnes={step ? q.ans : 0} merging={merging} />}
          <ol className="steplines" data-testid="steplines">
            {step >= 1 && <li><Num n={o} /> + <Num n={q.ans} /> = <Num n={10} /></li>}
            {step === 2 && <li><Num n={q.n} /> + <Num n={q.ans} /> = <Num n={20} /></li>}
          </ol>
        </div>
      </Stage>
      <Choices
        opts={q.onesOpts!} ans={q.ans} round={round}
        onRight={async () => {
          setStep(1);
          round.win(`${o} + ${q.ans} = 10, so ${q.eq}. The same friends: ${o} and ${q.ans}.`, [SP.newTen(o), ...q.sayEq]);
          // She sees the ten fill up, then the ten ones become a second red ten.
          await wait(1100);
          setMerging(true);
          await wait(450);
          setMerging(false);
          setStep(2);
        }}
        onWrong={() => round.wrong(q.hint, q.sayHint)}
      />
    </>
  );
}

function Bonds({ q, level, round }: GameProps<'bonds'>) {
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
