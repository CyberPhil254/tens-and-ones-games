import { useState } from 'react';
import { onesW, tensW, word } from '../maths/words';
import { Choices, Prompt, Stage } from '../play/parts';
import { useVoiceSilent } from '../play/voice';
import { Blocks } from '../ui/Blocks';
import type { GameProps } from './registry';

/** A number as a word, the tens part red and the ones part blue: forty-seven. */
function Word({ n }: { n: number }) {
  const w = word(n);
  if (n < 20 || n >= 100 || n % 10 === 0) return <span className="wordy">{w}</span>;
  const [tens, ones] = w.split('-');
  return <span className="wordy"><b className="t">{tens}</b>-<b className="o">{ones}</b></span>;
}

const tensAndOnes = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`;

/**
 * Number Names: match number names to numerals.
 * Level 1: read the word. Level 2: which number has 6 tens (or 6 ones)? Level 3: hear the number.
 * The wrong choices are the usual mix-ups: sixteen and sixty, 17 and 71.
 */
export function NumberNames({ q, level, round }: GameProps<'names'>) {
  const [done, setDone] = useState(false);
  const silent = useVoiceSilent();
  const n = q.n;

  let prompt;
  if (level === 2) {
    const what = q.place === 't' ? tensW(q.k!) : onesW(q.k!);
    prompt = (
      <Prompt round={round} say={[`has.${q.k}.${q.place === 't' ? 'tens' : 'ones'}`]}>
        Which number has <b className={q.place === 't' ? 'tt' : 'oo'}>{what}</b>?
      </Prompt>
    );
  } else if (level === 1) {
    prompt = <Prompt round={round} say={[`which.${n}`]}>Which is <Word n={n} />?</Prompt>;
  } else {
    prompt = (
      <Prompt round={round} say={[n]} sub={silent ? <>The number is <Word n={n} />.</> : 'Tap the speaker to hear it again.'}>
        Listen. Which number is it?
      </Prompt>
    );
  }

  return (
    <>
      {prompt}
      <Stage>{done && <Blocks tens={Math.floor(n / 10)} ones={n % 10} counted />}</Stage>
      <Choices
        opts={q.opts} ans={n} round={round}
        onRight={() => {
          setDone(true);
          round.win(`${n} is ${tensAndOnes(n)}. We say ${word(n)}.`, [`isTO.${n}`]);
        }}
        onWrong={(v) => round.wrong(`${v} is ${word(v)}: ${tensAndOnes(v)}. Have another go.`, [`isTO.${v}`, 'try-again'])}
      />
    </>
  );
}
