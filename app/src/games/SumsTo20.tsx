import { useState } from 'react';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import type { Piece } from '../speech/script';
import { Frames, Rows } from '../ui/Frames';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/** Levels answered in her head: the picture is not there unless she asks or has missed. */
const HEAD = [3, 6, 8, 11, 12];

/**
 * Sums to 20: adding, taking away and doubles on ten frames, then in her head.
 * The counters fill one frame before the next, so a sum that goes through ten shows it:
 * 8 + 5 is two across to fill the ten, and three more.
 * A wrong answer is told what to look at, the picture comes back, and the move through ten is replayed.
 */
export function SumsTo20({ q, level, round }: GameProps<'sums'>) {
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

  /** Replays a sum through ten one counter at a time: to the ten, a pause, then the rest. */
  const replay = async () => {
    if (!q.via) return;
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
