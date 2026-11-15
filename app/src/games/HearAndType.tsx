import { useState } from 'react';
import { onesW, tensW, word } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { useVoiceSilent } from '../play/voice';
import { Blocks } from '../ui/Blocks';
import type { GameProps } from './registry';

const tensAndOnes = (n: number) => `${tensW(Math.floor(n / 10))} and ${onesW(n % 10)}`;

/**
 * Number Names, the additions. Level 1: read a word from zero to twenty and find the numeral.
 * Levels 2 and 3: hear a number and type it. A wrong answer is told what the number she gave is,
 * in tens and ones; the blocks for the right number appear after a miss.
 */
export function HearAndType({ q, level, round }: GameProps<'hear'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const silent = useVoiceSilent();
  const n = q.n;
  const right = () => { setDone(true); round.win(`${n} is ${tensAndOnes(n)}. We say ${word(n)}.`, [`isTO.${n}`]); };
  const wrong = (v: number) => {
    setMissed(true);
    round.wrong(`${v} is ${word(v)}: ${tensAndOnes(v)}. Try again.`, [`isTO.${v}`, 'try-again']);
  };
  return (
    <>
      {level === 1 ? (
        <Prompt round={round} say={q.say}>Which is <span className="wordy">{word(n)}</span>?</Prompt>
      ) : (
        <Prompt round={round} say={q.say} sub={silent ? <>The number is <span className="wordy">{word(n)}</span>.</> : 'Tap the speaker to hear it again.'}>
          Listen. Type the number.
        </Prompt>
      )}
      <Stage>{(done || (missed && level > 1)) && <Blocks tens={Math.floor(n / 10)} ones={n % 10} counted={done} />}</Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={n} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={n} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
