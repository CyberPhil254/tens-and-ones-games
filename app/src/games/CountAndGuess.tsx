import { useEffect, useRef, useState } from 'react';
import { DEMO_HEAP, type Spot } from '../maths/count';
import { NumberPad } from '../play/NumberPad';
import { Choices, Flash, Prompt, Stage, useWait } from '../play/parts';
import type { RoundApi } from '../play/round';
import { SP } from '../speech/script';
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
 * Guess: a heap seen for a moment; after the answer the same bones pack into tens and ones.
 * A wrong count is counted again one by one.
 */
export function CountAndGuess({ q, level, round, first }: GameProps<'count'>) {
  const wait = useWait();
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  /** The order in which the bones have been counted: by her touch, or by the recount. */
  const [counted, setCounted] = useState<number[]>([]);
  const [moved, setMoved] = useState(false);
  const [demo, setDemo] = useState(q.kind === 'guess' && !!first);
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

  // A guess. The first time, Oreo shows how it goes. Then the heap is seen for a moment, with one more peek;
  // after her answer, right or wrong, the same bones move into tens and ones and that says why.
  if (demo) return <GuessDemo round={round} onDone={() => { setDemo(false); round.clear(); round.started(); }} />;
  return (
    <>
      <Prompt round={round} say={q.say} sub="Pick the number that is closest.">About how many?</Prompt>
      <Stage>
        <Flash stay={shown} peeks={1}>
          <Heap spots={q.spots} cols={q.cols} many={level === 7} packed={shown} />
        </Flash>
      </Stage>
      <Choices opts={q.opts!} ans={q.ans} round={round} onRight={() => { setDone(true); round.win(q.hint, missed ? [] : q.sayEq); }} onWrong={wrong} />
    </>
  );
}

/** Where bone `i` of a heap goes when it is packed: tens stand side by side, ten bones high, and the ones that are left stand apart. */
function packedAt(i: number, n: number, many: boolean) {
  const tens = Math.floor(n / 10), col = Math.floor(i / 10), k = i % 10, across = many ? 9.4 : 3.4;
  return { left: `${((col + 0.5 + (col >= tens ? 0.4 : 0)) / across) * 100}%`, top: `${7 + (9 - k) * 9.55}%` };
}

/**
 * A heap of bones, each drawn in code at its place. Packed, the very same bones move into tens and ones:
 * each full ten gets a red frame (tens are red everywhere), the ones left over stand beside them.
 */
function Heap({ spots, cols, many, packed }: { spots: Spot[]; cols: number; many: boolean; packed: boolean }) {
  const n = spots.length, rows = Math.max(...spots.map((s) => s.row), 0) + 1, tens = Math.floor(n / 10), ones = n % 10, across = many ? 9.4 : 3.4;
  return (
    <div
      className={['heapfield', many && 'many', packed && 'packed'].filter(Boolean).join(' ')} role="img" data-testid="heap" data-n={n} data-packed={packed || undefined}
      aria-label={packed ? `${bones(n)}: ${tens === 1 ? '1 ten' : `${tens} tens`} and ${ones} more` : 'a heap of bones'}
    >
      {packed && Array.from({ length: tens }, (_, c) => <span key={`t${c}`} className="tenbox" style={{ left: `${((c + 0.5) / across) * 100}%` }} />)}
      {spots.map((s, i) => (
        <span key={i} className="hbone" style={packed ? packedAt(i, n, many) : { left: `calc(${((s.col + 0.5) / cols) * 100}% + ${s.dx}px)`, top: `calc(${((s.row + 0.5) / rows) * 100}% + ${s.dy}px)` }}><Bone /></span>
      ))}
    </div>
  );
}

/** Eleven bones in a loose heap, the same every time. */
const DEMO_SPOTS: Spot[] = [[1, 0], [3, 0], [4, 1], [0, 1], [2, 1], [5, 2], [1, 2], [3, 2], [0, 3], [2, 3], [4, 4]].map(([col, row], i) => ({ col: col!, row: row!, dx: (i % 3) * 4 - 4, dy: (i % 2) * 6 - 3 }));

/**
 * The first time: Oreo is shown a heap, says "Hmm, that looks like about ten", picks 10, and the bones pack
 * into a ten and one more, to show she was close. Nothing here can be tapped except "Now you".
 */
function GuessDemo({ round, onDone }: { round: RoundApi; onDone: () => void }) {
  const wait = useWait();
  const [step, setStep] = useState<'look' | 'picked' | 'packed'>('look');
  const note = useRef(round.note);
  useEffect(() => {
    note.current = round.note;
  });
  useEffect(() => {
    void (async () => {
      await wait(4200);
      setStep('picked');
      await wait(1200);
      setStep('packed');
      note.current(SP.nearest(DEMO_HEAP.n, DEMO_HEAP.ans), 'ok', [`nearest.${DEMO_HEAP.n}`, 'now-it-is-your-turn']);
    })();
  }, [wait]);
  return (
    <>
      <Prompt round={round} say={['watch-oreo-first', 'hmm-that-looks-like-about-ten']} sub="“Hmm, that looks like about ten.”">Watch Oreo first</Prompt>
      <Stage>
        <Heap spots={DEMO_SPOTS} cols={6} many={false} packed={step === 'packed'} />
      </Stage>
      <div className="demochoices" role="img" aria-label={step === 'look' ? 'Oreo is looking' : `Oreo picks ${DEMO_HEAP.ans}`} data-testid="demo" data-step={step}>
        {DEMO_HEAP.opts.map((o) => <span key={o} className={step !== 'look' && o === DEMO_HEAP.ans ? 'picked' : undefined}>{o}</span>)}
      </div>
      <div className="controls"><button className="ctl go" type="button" disabled={step !== 'packed'} onClick={onDone}>Now you</button></div>
    </>
  );
}
