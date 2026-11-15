import { useState } from 'react';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import { Box, Num } from '../ui/Num';
import { Bone } from '../ui/Oreo';
import type { GameProps } from './registry';

/**
 * Fair shares. Level 1: she deals the bones out, one to each bowl at a time, until none are left,
 * then says how many are in each bowl. Level 2: bones in a row are put into groups of a size; how many groups.
 * Level 3: in her head. A wrong answer replays the dealing, or rings the groups and counts them.
 */
export function FairShares({ q, level, round }: GameProps<'share'>) {
  const wait = useWait();
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  /** share: how many rounds of dealing have been done. Level 1 starts with none; the others show it all. */
  const [rounds, setRounds] = useState(level === 1 ? 0 : q.ans);
  const dealing = level === 1 && rounds < q.ans && !missed && !done;
  const picture = level < 3 || done || missed || asked;
  const left = q.n - rounds * q.by;
  const grouped = missed || done;

  const replay = async () => {
    if (q.kind !== 'share') return;
    setRounds(0);
    for (let r = 1; r <= q.ans; r++) { await wait(520); setRounds(r); }
  };
  const right = () => {
    setDone(true);
    setRounds(q.ans);
    round.win(q.kind === 'share' ? `${q.n} shared between ${q.by} is ${q.ans} each. ${q.n} ÷ ${q.by} = ${q.ans}.` : `${q.n} in groups of ${q.by} makes ${q.ans} groups. ${q.n} ÷ ${q.by} = ${q.ans}.`, q.sayEq);
  };
  const wrong = () => { setMissed(true); round.wrong(q.hint, q.sayHint); void replay(); };

  return (
    <>
      <Prompt
        round={round}
        say={level === 1 && !dealing ? ['how-many-in-each-bowl'] : q.say}
        sub={q.kind === 'share' ? `${q.n} bones, ${q.by} bowls` : `${q.n} bones, in groups of ${q.by}`}
      >
        {level === 3 ? <><Num n={q.n} /> ÷ <Num n={q.by} /> = <Box found={done ? q.ans : undefined} /></>
          : q.kind === 'group' ? 'How many groups?' : dealing ? 'Share them out' : 'How many in each bowl?'}
      </Prompt>
      <Stage>
        {!picture ? (
          !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
        ) : q.kind === 'share' ? (
          <div className="sharing" data-testid="sharing">
            <div className="heap" role="img" aria-label={`${left} bones still to share`} data-left={left}>{Array.from({ length: left }, (_, i) => <Bone key={i} />)}</div>
            <div className={q.by > 5 ? 'bowls many' : 'bowls'} role="img" aria-label={`${q.by} bowls with ${rounds} bones in each`}>
              {Array.from({ length: q.by }, (_, b) => <div key={b} className="bowl">{Array.from({ length: rounds }, (_, i) => <Bone key={i} />)}</div>)}
            </div>
            {(missed || done) && <p className="sub" data-testid="each">{rounds} in each bowl</p>}
          </div>
        ) : (
          <div className={grouped ? 'grouping ringed' : 'grouping'} role="img" aria-label={`${q.n} bones${grouped ? ` in ${q.ans} groups of ${q.by}` : ''}`} data-testid="grouping">
            {Array.from({ length: q.ans }, (_, g) => (
              <div key={g} className="grp">
                <span className="grpbones">{Array.from({ length: q.by }, (_, i) => <Bone key={i} />)}</span>
                <span className="running">{grouped ? g + 1 : ''}</span>
              </div>
            ))}
          </div>
        )}
      </Stage>
      {dealing ? (
        <div className="controls">
          <button className="ctl go" type="button" onClick={() => setRounds((r) => r + 1)}>Give one to each bowl</button>
        </div>
      ) : q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={right} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={right} onWrong={wrong} />}
    </>
  );
}
