import { useRef, useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { Choices, Controls, Prompt, Stage, useWait } from '../play/parts';
import { speak } from '../play/voice';
import { Blocks } from '../ui/Blocks';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Break a Ten: take away from a two-digit number, tens first, breaking a ten into ones when the ones run out.
 * Level 1: whole tens. Level 2: tens and ones, enough ones. Level 3: a ten must be broken.
 * Level 4: in her head, the blocks only if she asks.
 */
export function BreakATen(props: GameProps<'take'>) {
  const [blocks, setBlocks] = useState(false);
  if (props.level < 4) return <WithBlocks {...props} canBreak={props.level === 3} />;
  // Asking for the blocks turns the question into the hands-on version, and the bone into a paw.
  if (blocks) return <WithBlocks {...props} canBreak />;
  return <InHerHead {...props} onBlocks={() => { props.round.helped(); setBlocks(true); }} />;
}

const Eq = ({ q, found }: { q: GameProps<'take'>['q']; found: boolean }) => (
  <><Num n={q.a} /> − <Num n={q.b} /> = <Box found={found ? q.r : undefined} /></>
);

function WithBlocks({ q, round, canBreak }: GameProps<'take'> & { canBreak: boolean }) {
  const wait = useWait();
  const bt = Math.floor(q.b / 10), bo = q.b % 10;
  const [b, setB] = useState({ tens: Math.floor(q.a / 10), ones: q.a % 10, cracking: false });
  const [need, setNeed] = useState({ tens: bt, ones: bo });
  const [pulse, setPulse] = useState(false);
  const [counted, setCounted] = useState(false);
  const [done, setDone] = useState(false);
  const broke = useRef(false);
  const busy = useRef(false);
  const asking = need.tens === 0 && need.ones === 0;

  const act = async (what: 'ten' | 'one' | 'break') => {
    if (busy.current || round.over || asking) return;
    round.clear();
    let left: typeof need;
    if (what === 'ten') {
      if (!need.tens) return round.note('You have taken all the tens.', 'hint', ['you-have-taken-all-the-tens']);
      setB({ ...b, tens: b.tens - 1 });
      left = { ...need, tens: need.tens - 1 };
    } else if (what === 'one') {
      if (!need.ones) return round.note('You have taken all the ones.', 'hint', ['you-have-taken-all-the-ones']);
      if (!b.ones) {
        setPulse(canBreak);
        return round.note('No ones left! Break a ten into 10 ones.', 'hint', ['no-ones-left-break-a-ten']);
      }
      setB({ ...b, ones: b.ones - 1 });
      left = { ...need, ones: need.ones - 1 };
    } else {
      if (b.ones >= need.ones) return round.note('You have enough ones. No need to break a ten.', 'hint', ['you-have-enough-ones-no-need']);
      busy.current = true;
      broke.current = true;
      setPulse(false);
      setB({ ...b, cracking: true });
      await wait(350);
      setB({ tens: b.tens - 1, ones: b.ones + 10, cracking: false });
      busy.current = false;
      round.note('One ten is now 10 ones.', 'ok', ['one-ten-is-now-10-ones']);
      return;
    }
    setNeed(left);
    if (!left.tens && !left.ones) speak(['all-taken-away-how-many-are']);
  };

  return (
    <>
      <Prompt round={round} say={[q.a, 'frag.take-away', q.b]}><Eq q={q} found={done} /></Prompt>
      <Stage>
        <Blocks
          tens={b.tens} ones={b.ones} cracking={b.cracking} counted={counted}
          onTapTen={() => void act('ten')} onTapOne={() => void act('one')}
        />
        <div className="chips" data-testid="chips">
          {asking ? 'All taken away. How many are left?' : (
            <>
              Still to take away:
              {bt > 0 && <b className="ct">{tensW(need.tens)}</b>}
              {bo > 0 && <b className="co">{onesW(need.ones)}</b>}
            </>
          )}
        </div>
      </Stage>
      {asking ? (
        <Choices
          opts={q.opts} ans={q.r} round={round}
          onRight={() => {
            setDone(true);
            setCounted(true);
            round.win(
              `${q.a} − ${q.b} = ${q.r}.${broke.current ? ' You broke a ten to get more ones.' : ''}`,
              [q.a, 'frag.take-away', q.b, 'frag.is', q.r, ...(broke.current ? ['you-broke-a-ten-to-get'] : [])],
            );
          }}
          onWrong={() => {
            setCounted(true);
            round.wrong('Count what is left. Red tens in tens: 10, 20, 30. Then the blue ones.', ['count-what-is-left-red-tens']);
          }}
        />
      ) : (
        <Controls>
          <button className="ctl t" type="button" onClick={() => void act('ten')}>Take a ten</button>
          {bo > 0 && <button className="ctl o" type="button" onClick={() => void act('one')}>Take a one</button>}
          {canBreak && <button className={pulse ? 'ctl brk pulse' : 'ctl brk'} type="button" onClick={() => void act('break')}>Break a ten</button>}
        </Controls>
      )}
    </>
  );
}

function InHerHead({ q, round, onBlocks }: GameProps<'take'> & { onBlocks: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <Prompt round={round} say={[q.a, 'frag.take-away', q.b]} sub="Try it in your head."><Eq q={q} found={done} /></Prompt>
      <Stage>
        {!round.over && <button type="button" className="ghostbtn" onClick={onBlocks}>Use the blocks</button>}
      </Stage>
      <Choices
        opts={q.opts} ans={q.r} round={round}
        onRight={() => {
          setDone(true);
          round.win(`${q.a} − ${q.b} = ${q.r}.`, [q.a, 'frag.take-away', q.b, 'frag.is', q.r]);
        }}
        onWrong={() => round.wrong('Take the tens away first, then the ones. Use the blocks if you like.', ['take-the-tens-away-first-then'])}
      />
    </>
  );
}
