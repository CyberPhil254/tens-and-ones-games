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
 *   1. "3 and how many more make ten?" The friends of ten she knows.
 *   2. The 7 arrive in yellow and fill the ten: 3 + 7 = 10. "13 and how many more make 20?"
 *   3. The ten ones become a second red ten: 2 tens, 20. The same friends: 3 and 7.
 */
function StepByStep({ q, round }: GameProps<'bonds'>) {
  const wait = useWait();
  const o = q.n - 10;
  const [filled, setFilled] = useState(false);
  const [merging, setMerging] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <>
      <Prompt
        round={round}
        say={filled ? [SP.newTen(o), q.n, 'frag.and-how-many-more-make', 20] : [q.n, 'frag.and-how-many-more-make', 20, 'the-ones-first', SP.friendsQ(o)]}
        sub={done ? undefined : <span data-testid="stepsub">{filled ? <>So <Num n={q.n} /> and how many more make <Num n={20} />?</> : <>Look at the ones first. <Num n={o} /> and how many more make ten?</>}</span>}
      >
        <Num n={q.n} /> + <Box found={done ? q.ans : undefined} /> = <Num n={q.whole} />
      </Prompt>
      <Stage>
        <div className="downten" data-testid="upto20" data-step={done ? 2 : filled ? 1 : 0}>
          {done && !merging ? <Blocks tens={2} ones={0} counted /> : <Blocks tens={1} ones={filled ? 10 : o} sunOnes={filled ? q.ans : 0} merging={merging} />}
          <ol className="steplines" data-testid="steplines">
            {filled && <li><Num n={o} /> + <Num n={q.ans} /> = <Num n={10} /></li>}
            {done && <li><Num n={q.n} /> + <Num n={q.ans} /> = <Num n={20} /></li>}
          </ol>
        </div>
      </Stage>
      {!filled ? (
        <Choices
          key="ones" opts={q.onesOpts!} ans={q.ans} round={round}
          onRight={() => { round.clear(); setFilled(true); }}
          onWrong={() => round.wrong(q.hint, q.sayHint)}
        />
      ) : (
        <Choices
          key="whole" opts={q.opts!} ans={q.ans} round={round}
          onRight={async () => {
            setDone(true);
            round.win(`${o} + ${q.ans} = 10, so ${q.eq}. The same friends: ${o} and ${q.ans}.`, q.sayEq);
            setMerging(true);
            await wait(450);
            setMerging(false);
          }}
          onWrong={() => round.wrong('Count the yellow ones. That is how many you added.', ['count-the-yellow-ones-that-is'])}
        />
      )}
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
