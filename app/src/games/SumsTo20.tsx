import { useState } from 'react';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import type { Piece } from '../speech/script';
import { DownToTen, type DownStep } from '../ui/DownToTen';
import { Frames, Rows } from '../ui/Frames';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/** Levels answered in her head: the picture is not there unless she asks or has missed. */
const HEAD = [3, 6, 8, 11, 12];

/**
 * Sums to 20: adding, taking away and doubles on ten frames, then in her head.
 * The counters fill one frame before the next, so a sum that goes through ten shows it:
 * 8 + 5 is two across to fill the ten, and three more.
 * Taking away through ten (13 − 5) is shown in the blocks instead: the ones go, the ten breaks, the rest goes.
 * A wrong answer is told what to look at, the picture comes back, and the move through ten is replayed.
 */
export function SumsTo20(props: GameProps<'sums'>) {
  return props.level === 10 ? <StepByStep {...props} /> : <Sums {...props} />;
}

/**
 * Taking away through ten, step by step, in the blocks: 17 − 9.
 *   1. She takes away the ones (one tap: all 7 go). The picture says 17 − 7 = 10.
 *   2. "How many more do you still have to take away?" 9 is 7 and 2: the row of dots shows 7 ticked.
 *   3. The ten breaks into ten ones. "10 take away 2. How many are left?"
 * Each step leaves its little sum under the blocks, so the whole way stays on the screen.
 */
function StepByStep({ q, round }: GameProps<'sums'>) {
  const wait = useWait();
  const { first, rest } = q.via!;
  const [step, setStep] = useState<DownStep>(0);
  const [cracking, setCracking] = useState(false);
  /** She has said how many more are to go: the question is now the ten take away the rest. */
  const [split, setSplit] = useState(false);
  const [done, setDone] = useState(false);
  const say: Piece[] =
    step === 0 ? [q.a, 'frag.take-away', q.b, 'first-take-away-the-ones-tap']
    : !split ? [q.a, 'frag.take-away', first, 'frag.is', 10, 'how-many-more-do-you-still']
    : ['now-take-the-rest-from-the', 10, 'frag.take-away', rest, 'how-many-are-left'];
  const takeOnes = () => {
    if (step !== 0 || round.over) return;
    round.clear();
    setStep(1);
  };
  const knowsRest = async () => {
    round.clear();
    setCracking(true);
    await wait(450);
    setCracking(false);
    setStep(2);
    setSplit(true);
  };
  return (
    <>
      <Prompt
        round={round} say={say}
        sub={done ? undefined : <span data-testid="stepsub">{step === 0 ? 'First take away the ones. Tap the blue ones.' : !split ? 'How many more do you still have to take away?' : <>Now take the rest from the ten. <Num n={10} /> − <Num n={rest} /> = ?</>}</span>}
      >
        <Num n={q.a} /> − <Num n={q.b} /> = <Box found={done ? q.ans : undefined} />
      </Prompt>
      <Stage>
        <DownToTen a={q.a} b={q.b} step={step} cracking={cracking} onTapOnes={step === 0 && !round.over ? takeOnes : undefined} />
      </Stage>
      {step === 0 ? (
        <div className="answers"><button type="button" className="ctl o" onClick={takeOnes} disabled={round.over}>Take away the {first === 1 ? 'one' : `${first} ones`}</button></div>
      ) : !split ? (
        <Choices
          key="rest" opts={q.restOpts!} ans={rest} round={round} onRight={knowsRest}
          onWrong={() => round.wrong(`You took away ${first} of the ${q.b}. Look at the row of dots. Count the ones still to take.`, ['look-at-the-row-of-dots'])}
        />
      ) : (
        <Choices
          key="left" opts={q.opts!} ans={q.ans} round={round}
          onRight={() => {
            setStep(3);
            setDone(true);
            round.win(`${q.a} − ${first} = 10. 10 − ${rest} = ${q.ans}. So ${q.eq}.`, ['first-down-to-ten-then-take', ...q.sayEq]);
          }}
          onWrong={() => {
            setStep(3);
            round.wrong('The crossed-out ones are gone. Count the ones that are left.', ['the-crossed-out-ones-are-gone']);
          }}
        />
      )}
    </>
  );
}

function Sums({ q, level, round }: GameProps<'sums'>) {
  const wait = useWait();
  const head = HEAD.includes(level);
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  /** While the move through ten is replayed: how many counters have moved so far. */
  const [moved, setMoved] = useState<number | null>(null);
  const picture = !head || done || missed || asked;
  const countOn = level === 2 && !done && !missed;
  const shown = moved ?? q.b;

  /** Taking away through ten is shown in the blocks, step by step: the ones, the ten broken, the rest. */
  const down = q.kind === 'sub' && !!q.via;
  const [step, setStep] = useState<DownStep>(0);
  /** Replays a sum through ten: adding, one counter at a time to the ten, a pause, then the rest; taking away, step by step. */
  const replay = async () => {
    if (!q.via) return;
    if (down) {
      setStep(0);
      for (const s of [1, 2, 3] as const) {
        await wait(s === 1 ? 500 : 900);
        setStep(s);
      }
      return;
    }
    setMoved(0);
    await wait(350);
    for (let i = 1; i <= q.b; i++) {
      setMoved(i);
      await wait(i === q.via.first ? 650 : 170);
    }
    setMoved(null);
  };

  const right = () => {
    setDone(true);
    if (down) setStep(3);
    const lead: Piece[] = q.via ? [q.kind === 'add' ? 'first-fill-the-ten-then-add' : 'first-down-to-ten-then-take'] : [];
    const text =
      q.via && q.kind === 'add' ? `${q.via.first} ${q.via.first === 1 ? 'fills' : 'fill'} the ten. 10 and ${q.via.rest} make ${q.ans}.`
      : q.via ? `First down to 10, then ${q.via.rest} more. ${q.eq}.`
      : q.kind === 'double' ? `Double ${q.a} is ${q.ans}. ${q.eq}.`
      : q.kind === 'diff' ? `${q.eq}. ${q.ans} ${q.ans === 1 ? 'has' : 'have'} no partner.`
      : `${q.eq}.`;
    round.win(text, [...lead, ...q.sayEq]);
  };
  const wrong = () => {
    setMissed(true);
    round.wrong(q.hint, q.sayHint);
    void replay();
  };

  const sum = q.kind === 'diff' ? null : <><Num n={q.a} /> {q.kind === 'sub' ? '−' : '+'} <Num n={q.b} /> = <Box found={done ? q.ans : undefined} /></>;
  return (
    <>
      <Prompt round={round} say={q.say} sub={q.kind === 'double' ? `Double ${q.a}` : q.story && done ? <span data-testid="equation">{q.eq}</span> : undefined}>
        {q.story ? <span className="storytxt">{q.story}</span> : q.kind === 'diff' ? 'How many more?' : sum}
      </Prompt>
      <Stage>
        {countOn ? (
          <div className="counton" data-testid="counton">
            <span className="startnum"><Num n={q.a} /></span>
            <span className="plus">+</span>
            <div className="crow" role="img" aria-label={`${q.b} more`}>{Array.from({ length: q.b }, (_, i) => <span key={i} className="dot lone" />)}</div>
          </div>
        ) : picture ? (
          q.kind === 'double' || q.kind === 'diff' ? <Rows top={q.a} bottom={q.b} pairs={q.kind === 'diff' && (missed || done)} />
          : q.kind === 'add' ? <Frames blue={q.a} sun={shown} />
          : down ? <DownToTen a={q.a} b={q.b} step={step} />
          : <Frames blue={q.a} gone={shown} />
        ) : (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
        )}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
