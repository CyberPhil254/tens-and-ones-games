import { Fragment, useState } from 'react';
import { Choices, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/** Text with every number in it shown in tens-and-ones colours; a "?" becomes the box. */
function Coloured({ text, found }: { text: string; found?: number }) {
  return (
    <>
      {text.split(/(\d+|\?)/).map((part, i) =>
        /^\d+$/.test(part) ? <Num key={i} n={Number(part)} /> : part === '?' ? <Box key={i} found={found} /> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/**
 * Oreo's Stories: short word problems. Each story is followed by its number sentence.
 * The blocks appear if she asks (that costs nothing) or after a wrong answer.
 */
export function OreosStories({ q, round }: GameProps<'story'>) {
  const [blocks, setBlocks] = useState(false);
  const [done, setDone] = useState(false);
  const missing = q.eq.includes('?');
  return (
    <>
      <Prompt round={round} say={q.say}>
        <span className="storytxt"><Coloured text={q.text} /></span>
      </Prompt>
      <Stage>
        {blocks ? (
          <Blocks tens={Math.floor(q.a / 10)} ones={q.a % 10} counted />
        ) : (
          !round.over && <button type="button" className="ghostbtn" onClick={() => setBlocks(true)}>Show the blocks</button>
        )}
        {done && (
          <p className="eqline" data-testid="equation">
            {missing ? <Coloured text={q.eq} found={q.ans} /> : <><Coloured text={q.eq} /> = <Box found={q.ans} /></>}
          </p>
        )}
      </Stage>
      <Choices
        opts={q.opts} ans={q.ans} round={round}
        onRight={() => {
          setDone(true);
          round.win(missing ? `${q.eq.replace('?', String(q.ans))}.` : `${q.eq} = ${q.ans}.`, q.sayEq);
        }}
        onWrong={() => {
          setBlocks(true);
          round.wrong(q.hint, [q.hint]);
        }}
      />
    </>
  );
}
