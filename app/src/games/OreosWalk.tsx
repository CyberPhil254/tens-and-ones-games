import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { Choices, Controls, Prompt, Stage } from '../play/parts';
import { Num } from '../ui/Num';
import { NumberLine } from '../ui/NumberLine';
import type { GameProps } from './registry';

/**
 * Oreo's Walk: where a number sits on a line from 0 to 100, with its tens and ones laid end to end.
 * Level 1: read where Oreo stands. Level 2: walk her to a number in jumps of ten and steps of one.
 * Level 3: tap where a number belongs on a nearly empty line; within 5 either side counts.
 */
export function OreosWalk(props: GameProps<'walk'>) {
  if (props.level === 1) return <Read {...props} />;
  return props.level === 2 ? <Walk {...props} /> : <Place {...props} />;
}

function Read({ q, round }: GameProps<'walk'>) {
  return (
    <>
      <Prompt round={round} say={['where-is-the-puppy-which-number']}>Where is Oreo?</Prompt>
      <Stage><NumberLine n={q.n} /></Stage>
      <Choices
        opts={q.opts!} ans={q.n} round={round}
        onRight={() => round.win(`${tensW(q.t)} and ${onesW(q.o)} along the line. That is ${q.n}.`, [`isTO.${q.n}`])}
        onWrong={() => round.wrong('Count the red tens along the line: 10, 20, 30. Then add the blue ones.', ['count-the-red-tens-along-the'])}
      />
    </>
  );
}

function Walk({ q, round }: GameProps<'walk'>) {
  const [at, setAt] = useState(0);
  const go = (by: number) => !round.over && at + by <= 100 && setAt(at + by);
  const done = () => {
    if (round.over) return;
    if (at === q.n) round.win(`${tensW(q.t)} and ${onesW(q.o)}. Oreo is on ${q.n}.`, [`isTO.${q.n}`]);
    else if (at < q.n) round.wrong(`Oreo is on ${at}. Walk a little further.`, ['frag.the-puppy-is-on', at, 'walk-a-little-further']);
    else round.wrong(`Oreo is on ${at}. That is too far. Go back to the start.`, ['frag.the-puppy-is-on', at, 'that-is-too-far-go-back']);
  };
  return (
    <>
      <Prompt round={round} say={['frag.walk-the-puppy-to', q.n]} sub="Jump in tens and step in ones. Then tap Done.">
        Walk Oreo to <Num n={q.n} />
      </Prompt>
      <Stage><NumberLine n={at} /></Stage>
      <Controls>
        <button className="ctl t" type="button" onClick={() => go(10)} disabled={round.over}>Jump 10</button>
        <button className="ctl o" type="button" onClick={() => go(1)} disabled={round.over}>Step 1</button>
        <button className="ctl brk" type="button" disabled={round.over} onClick={() => { setAt(0); round.clear(); }}>Back to start</button>
        <button className="ctl go" type="button" onClick={done} disabled={round.over}>Done</button>
      </Controls>
    </>
  );
}

function Place({ q, round }: GameProps<'walk'>) {
  const [misses, setMisses] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  // After the second miss the blocks are laid out up to the number, so she can tap where they end.
  const shown = found || misses > 1 ? q.n : 0;
  const tap = (v: number) => {
    if (round.over) return;
    if (Math.abs(v - q.n) <= 5) {
      setFound(true);
      round.win(`${q.n} is here: ${tensW(q.t)} and ${onesW(q.o)} along the line.`, [`isTO.${q.n}`]);
      return;
    }
    setMisses(misses + 1);
    setGuess(v);
    if (misses + 1 > 1) round.wrong('Look at the blocks. Tap where they end.', ['look-at-the-blocks-tap-where']);
    else round.wrong('Not quite. Count the tens along the line: 10, 20, 30.', ['not-quite-count-the-tens-along']);
  };
  return (
    <>
      <Prompt round={round} say={['frag.show-me-on-the-line', q.n]} sub="Tap the line where Oreo should stand.">
        Where is <Num n={q.n} />?
      </Prompt>
      <Stage>
        <NumberLine n={shown} puppyAt={found || misses > 1 ? q.n : (guess ?? 0)} sparse={misses === 0 && !found} onTap={tap} />
      </Stage>
    </>
  );
}
