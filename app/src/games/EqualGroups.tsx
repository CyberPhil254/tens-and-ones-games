import { useState } from 'react';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Box, Num } from '../ui/Num';
import { Bone } from '../ui/Oreo';
import type { GameProps } from './registry';

/**
 * Equal groups. Level 1: plates with the same number of bones on each. Level 2: rows and columns,
 * read as repeated adding. Level 3: "3 × 5" in her head. Levels 4 and 5: the 1, 2, 5 and 10 tables.
 * A wrong answer counts the groups in steps: the running total appears under each group (5, 10, 15).
 */
export function EqualGroups({ q, level, round }: GameProps<'groups'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const head = level === 3 || level === 5;
  const picture = !head || done || missed || asked;
  const steps = missed || done;
  const groups = Array.from({ length: q.g }, (_, i) => i);
  const right = () => { setDone(true); round.win(`${groups.map((i) => (i + 1) * q.k).join(', ')}. ${q.g} × ${q.k} = ${q.ans}.`, q.sayEq); };
  const wrong = () => { setMissed(true); round.wrong(q.hint, q.sayHint); };

  return (
    <>
      <Prompt round={round} say={q.say} sub={level === 1 ? `${q.g} plates, ${q.k} bones on each` : level === 2 ? `${q.g} rows of ${q.k}` : `${q.g} groups of ${q.k}`}>
        {level === 1 ? 'How many bones?' : level === 2 ? <>{groups.map((i) => <span key={i}>{i > 0 && ' + '}<Num n={q.k} /></span>)} = <Box found={done ? q.ans : undefined} /></> : <><Num n={q.g} /> × <Num n={q.k} /> = <Box found={done ? q.ans : undefined} /></>}
      </Prompt>
      <Stage>
        {!picture ? (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
        ) : level === 1 ? (
          <div className="plates" role="img" aria-label={`${q.g} plates with ${q.k} bones on each`} data-testid="plates">
            {groups.map((i) => (
              <div key={i} className="platewrap">
                <div className="plate">{Array.from({ length: q.k }, (_, j) => <Bone key={j} />)}</div>
                <span className="running">{steps ? (i + 1) * q.k : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="array" role="img" aria-label={`${q.g} rows of ${q.k}`} data-testid="array">
            {groups.map((i) => (
              <div key={i} className="arow">
                <span className="adots">{Array.from({ length: q.k }, (_, j) => <i key={j} className={j === 5 ? 'gap' : undefined} />)}</span>
                <span className="running">{steps ? (i + 1) * q.k : ''}</span>
              </div>
            ))}
          </div>
        )}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} digits={3} />}
    </>
  );
}
