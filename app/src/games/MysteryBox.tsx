import { useState } from 'react';
import { PAD } from '../maths/questions';
import { Choices, Prompt, Stage } from '../play/parts';
import { BarModel } from '../ui/BarModel';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Mystery Box: find a missing number, shown as a whole bar and its parts.
 * Level 1: a missing part of 10 or 20. Level 2: three parts, the middle one missing.
 * Level 3: a missing whole or part with whole tens.
 */
export function MysteryBox({ q, round }: GameProps<'mystery'>) {
  const [done, setDone] = useState(false);
  return (
    <>
      <Prompt round={round} say={['find-the-mystery-number']}>
        {q.eq.map((t, i) => (
          <span key={i}>
            {i > 0 && ' '}
            {typeof t === 'number' ? <Num n={t} /> : t === '?' ? <Box found={done ? q.ans : undefined} /> : t}
          </span>
        ))}
      </Prompt>
      <Stage>
        <BarModel whole={q.whole} parts={q.parts} ans={q.ans} found={done} />
        <p className="barcap">The long bar is the whole. The short bars are its parts.</p>
      </Stage>
      <Choices
        opts={q.pad ? PAD : q.opts!} ans={q.ans} pad={q.pad} round={round}
        onRight={() => {
          setDone(true);
          round.win(`You found it. The mystery number is ${q.ans}.`, ['frag.you-found-it-the-mystery-number-is', q.ans]);
        }}
        onWrong={() => round.wrong(q.hint ?? 'The parts together are as long as the whole. What is missing?', [q.hint ?? 'the-parts-together-are-as-long'])}
      />
    </>
  );
}
