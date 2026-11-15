import { useState } from 'react';
import type { Spot } from '../maths/count';
import { NumberPad } from '../play/NumberPad';
import { Choices, Flash, Prompt, Stage, useWait } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Frames } from '../ui/Frames';
import { Box, Num } from '../ui/Num';
import { Bone } from '../ui/Oreo';
import type { GameProps } from './registry';

const bones = (n: number) => (n === 1 ? '1 bone' : `${n} bones`);
/** Where a spot is on the field, in percent. Neat rows have no nudge. */
const at = (s: Spot, cols: number, rows: number, cell: number) => ({
  left: `calc(${((s.col + 0.5) / cols) * 100}% + ${s.dx}px)`, top: `${(s.row + 0.5) * cell + s.dy}px`, ['--rows' as string]: rows,
});

/**
 * Count and guess. Counting: she touches each bone once; each gets its number, and the last number
 * is how many. Moved: the same bones in other places are still as many. Zero: an empty plate.
 * Guess: a heap seen for a moment, then checked by counting or by packing in tens.
 * A wrong answer counts the bones again one by one, or packs them.
 */
export function CountAndGuess({ q, level, round }: GameProps<'count'>) {
  const wait = useWait();
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  /** The order in which the bones have been counted: by her touch, or by the recount. */
  const [counted, setCounted] = useState<number[]>([]);
  const [moved, setMoved] = useState(false);
  const shown = missed || done;
  const rows = Math.max(...q.spots.map((s) => s.row), 0) + 1;

  const recount = async () => {
    setCounted([]);
    for (let i = 0; i < q.n; i++) { await wait(240); setCounted((c) => [...c, i]); }
  };
  const right = (text: string) => { setDone(true); round.win(text, q.sayEq); };
  const wrong = () => { setMissed(true); round.wrong(q.hint, q.sayHint); if (q.kind === 'count' || q.kind === 'moved') void recount(); };

  if (q.kind === 'count' || q.kind === 'moved') {
    const counting = q.kind === 'count', all = counted.length === q.n;
    // Moved: the bones start in neat rows of four, then go to their places.
    const place = (i: number) => (q.kind === 'moved' && !moved ? { col: i % q.cols, row: Math.floor(i / q.cols), dx: 0, dy: 0 } : q.spots[i]!);
    const fieldRows = q.kind === 'moved' ? Math.max(rows, Math.ceil(q.n / q.cols)) : rows;
    return (
      <>
        <Prompt round={round} say={q.kind === 'moved' && !moved ? [q.n, 'frag.bones'] : q.say} sub={q.kind === 'moved' && !moved ? `Here are ${bones(q.n)}.` : undefined}>
          {counting ? (all ? 'How many?' : 'Tap each one') : moved ? 'How many now?' : 'Look'}
        </Prompt>
        <Stage>
          <div className="field" style={{ height: `${fieldRows * 72}px` }} data-testid="field" data-counted={counted.length}>
            {q.spots.map((_, i) => {
              const k = counted.indexOf(i);
              return (
                <button key={i} type="button" className={k >= 0 ? 'fbone counted' : 'fbone'} style={at(place(i), q.cols, fieldRows, 72)} aria-label={k >= 0 ? `bone number ${k + 1}` : 'a bone'}
                  disabled={!counting || k >= 0 || round.over || missed} onClick={() => setCounted((c) => [...c, i])}>
                  <Bone />{k >= 0 && <b>{k + 1}</b>}
                </button>
              );
            })}
          </div>
        </Stage>
        {q.kind === 'moved' && !moved ? (
          <div className="controls"><button className="ctl go" type="button" onClick={() => setMoved(true)}>Move them</button></div>
        ) : (!counting || all || shown) && (
          <Choices opts={q.opts!} ans={q.ans} round={round} onRight={() => right(counting ? `${bones(q.n)}. The last number you say is how many.` : `Still ${q.n}. Nothing was added and nothing was taken away.`)} onWrong={wrong} />
        )}
      </>
    );
  }

  if (q.kind === 'plate' || q.kind === 'zero') {
    const picture = q.kind === 'plate' || shown || asked;
    const m = q.eq ? /^(\d+) ([+−]) (\d+)$/.exec(q.eq)! : null;
    const said = q.kind === 'plate' ? (q.n === 0 ? 'The plate is empty. Zero means none.' : `${bones(q.n)}.`) : `${q.eq} = ${q.ans}.`;
    return (
      <>
        <Prompt round={round} say={q.say}>
          {q.kind === 'plate' ? 'How many bones?' : <><Num n={Number(m![1])} /> {m![2]} <Num n={Number(m![3])} /> = <Box found={done ? q.ans : undefined} /></>}
        </Prompt>
        <Stage>
          {!picture ? (
            !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
          ) : (
            <div className="plate big" role="img" aria-label={`a plate with ${bones(q.ans)}`} data-testid="plate">
              {Array.from({ length: q.ans }, (_, i) => <Bone key={i} />)}
            </div>
          )}
        </Stage>
        {q.opts
          ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={() => right(said)} onWrong={wrong} />
          : <NumberPad ans={q.ans} round={round} onRight={() => right(said)} onWrong={wrong} />}
      </>
    );
  }

  // A guess: the heap is seen for a moment. Afterwards it is counted or packed, and stays.
  return (
    <>
      <Prompt round={round} say={q.say} sub="Which number is nearest?">About how many?</Prompt>
      <Stage>
        {shown ? (
          <div className="checked" data-testid="checked">
            {level === 6 ? <Frames blue={q.n} frames={2} /> : <Blocks tens={Math.floor(q.n / 10)} ones={q.n % 10} counted />}
            <p className="sub">{bones(q.n)}</p>
          </div>
        ) : (
          <Flash stay={false}>
            <div className={level === 7 ? 'heapfield many' : 'heapfield'} role="img" aria-label="a heap of bones" data-testid="heap" data-n={q.n}>
              {q.spots.map((s, i) => <span key={i} className="hbone" style={{ left: `calc(${((s.col + 0.5) / q.cols) * 100}% + ${s.dx}px)`, top: `calc(${((s.row + 0.5) / rows) * 100}% + ${s.dy}px)` }}><Bone /></span>)}
            </div>
          </Flash>
        )}
      </Stage>
      <Choices opts={q.opts!} ans={q.ans} round={round} onRight={() => right(`Let’s check. ${bones(q.n)}: nearest to ${q.ans}.`)} onWrong={wrong} />
    </>
  );
}
