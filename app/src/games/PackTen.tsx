import { useRef, useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { Choices, Controls, Prompt, Stage, useWait } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Pack Ten: ten ones make one ten.
 * Levels 1 and 2: a heap of loose ones is packed into tens, ten at a time, then she says how many.
 * Level 3: the other way round, she builds a given number from tens and ones.
 */
export function PackTen(props: GameProps<'pack'>) {
  return props.level === 3 ? <Build {...props} /> : <Pack {...props} />;
}

const explains = (t: number, o: number) => `${tensW(t)} and ${onesW(o)}. ${t * 10} + ${o} = ${t * 10 + o}.`;

function Pack({ q, round }: GameProps<'pack'>) {
  const wait = useWait();
  // Each loose one lies a little crooked, so the heap looks like a heap. The amount is exact.
  const [tilt] = useState(() => Array.from({ length: q.n }, () => ({ turn: Math.random() * 50 - 25, drop: Math.random() * 6 - 3 })));
  const [heap, setHeap] = useState(q.n);
  const [b, setB] = useState({ tens: 0, ones: 0, merging: false });
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [counted, setCounted] = useState(false);

  /** Moves loose ones across, one by one. */
  const move = async (count: number, ms: number) => {
    for (let i = 0; i < count; i++) {
      setHeap((h) => h - 1);
      setB((v) => ({ ...v, ones: v.ones + 1 }));
      await wait(ms);
    }
  };

  const packing = useRef(false); // a second tap while the blocks are moving does nothing
  const pack = async () => {
    if (packing.current) return;
    packing.current = true;
    setBusy(true);
    await move(10, 55);
    await wait(250);
    setB((v) => ({ ...v, merging: true }));
    await wait(450);
    const tens = b.tens + 1;
    setB({ tens, ones: 0, merging: false });
    const left = heap - 10;
    if (left >= 10) {
      round.note(`${tensW(tens)}. Keep packing!`, 'ok', [`tens.${tens}`, 'keep-packing']);
      setBusy(false);
      packing.current = false;
      return;
    }
    round.note(`Only ${left} left. Not enough for a ten, so they stay ones.`, 'ok', ['not-enough-left-for-a-ten']);
    await wait(500);
    await move(left, 90);
    setAsking(true);
  };

  return (
    <>
      {asking ? (
        <Prompt round={round} say={['how-many-are-there']}>How many?</Prompt>
      ) : (
        <Prompt round={round} say={['pack-the-ones-in-tens-then']} sub="Tap Pack 10 until no more tens fit.">Pack them in tens</Prompt>
      )}
      <Stage>
        <div className="packrow">
          <div className="heap" role="img" aria-label={`${heap} loose ones`} data-testid="heap">
            {tilt.slice(0, heap).map((t, i) => (
              <div key={i} className="cube" style={{ transform: `rotate(${t.turn}deg) translateY(${t.drop}px)` }} />
            ))}
          </div>
          {!asking && <div className="arrow" aria-hidden="true">→</div>}
          <Blocks tens={b.tens} ones={b.ones} merging={b.merging} counted={counted} />
        </div>
      </Stage>
      {asking ? (
        <Choices
          opts={q.opts} ans={q.n} round={round}
          onRight={() => {
            setCounted(true);
            round.win(explains(q.t, q.o), [`isTO.${q.n}`]);
          }}
          onWrong={() => {
            setCounted(true);
            round.wrong('Count the red tens: 10, 20, 30. Then add the ones.', ['count-the-red-tens-10-20']);
          }}
        />
      ) : (
        <Controls>
          <button className="ctl go" type="button" onClick={() => void pack()} aria-disabled={busy}>Pack 10</button>
        </Controls>
      )}
    </>
  );
}

function Build({ q, round }: GameProps<'pack'>) {
  const wait = useWait();
  const [b, setB] = useState({ tens: 0, ones: 0, merging: false });
  const [busy, setBusy] = useState(false);
  const built = b.tens * 10 + b.ones;
  const stop = busy || round.over;

  const addTen = () => {
    if (!stop && built + 10 <= 99) setB({ ...b, tens: b.tens + 1 });
  };
  const addOne = async () => {
    if (stop || built + 1 > 99) return;
    const ones = b.ones + 1;
    setB({ ...b, ones });
    if (ones < 10) return;
    // The tenth one: they pack themselves into a ten.
    setBusy(true);
    round.note('Ten ones! They pack into a ten.', 'ok', ['ten-ones-they-pack-into-a']);
    await wait(450);
    setB({ tens: b.tens, ones, merging: true });
    await wait(450);
    setB({ tens: b.tens + 1, ones: 0, merging: false });
    setBusy(false);
  };
  const startAgain = () => {
    if (stop) return;
    setB({ tens: 0, ones: 0, merging: false });
    round.clear();
  };
  const done = () => {
    if (stop) return;
    if (built === q.n) round.win(explains(q.t, q.o), [`isTO.${q.n}`]);
    else if (built < q.n) round.wrong(`You built ${built}. That is not enough yet.`, ['frag.you-built', built, 'that-is-not-enough-yet']);
    else round.wrong(`You built ${built}. That is too many. Start again.`, ['frag.you-built', built, 'that-is-too-many-start-again']);
  };

  return (
    <>
      <Prompt round={round} say={['frag.build-the-number', q.n]} sub="Use tens and ones, then tap Done.">Build <Num n={q.n} /></Prompt>
      <Stage>
        <Blocks tens={b.tens} ones={b.ones} merging={b.merging} counted />
      </Stage>
      <Controls>
        <button className="ctl t" type="button" onClick={addTen} disabled={round.over}>+ a ten</button>
        <button className="ctl o" type="button" onClick={() => void addOne()} disabled={round.over}>+ a one</button>
        <button className="ctl brk" type="button" onClick={startAgain} disabled={round.over}>Start again</button>
        <button className="ctl go" type="button" onClick={done} disabled={round.over}>Done</button>
      </Controls>
    </>
  );
}
