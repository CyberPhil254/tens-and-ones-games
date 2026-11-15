import { useState } from 'react';
import { onesW, tensW } from '../maths/words';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import { SP } from '../speech/script';
import { Blocks } from '../ui/Blocks';
import { HundredSquare, type SquareMark } from '../ui/HundredSquare';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Jump in Tens: adding and taking away tens. Only the tens digit changes.
 * Levels 1 and 2: tap where a jump of 10, 20 or 30 lands on the hundred square.
 * Level 3: count on or back in tens, three numbers. Level 4: in her head, the square only if she asks.
 */
export function JumpInTens(props: GameProps<'jump'>) {
  return props.level === 4 ? <InHerHead {...props} /> : <OnTheSquare {...props} />;
}

function OnTheSquare({ q, level, round }: GameProps<'jump'>) {
  const wait = useWait();
  const plus = q.dir > 0, sign = plus ? '+' : '−', op = plus ? 'frag.plus' : 'frag.take-away', jump = q.k * 10;
  const [hops, setHops] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [column, setColumn] = useState(false);
  const trail = [q.s, ...q.targets.slice(0, hops)];
  const at = trail[trail.length - 1]!;
  const done = hops === q.targets.length;

  const tap = async (v: number) => {
    if (round.over || v === at) return;
    if (v !== q.targets[hops]) {
      setColumn(true); // the column she should stay in lights up
      round.wrong(SP.rows(plus, level === 2 ? q.k : 1), [`rows.${plus ? 'down' : 'up'}.${level === 2 ? q.k : 1}`]);
      setMiss(v);
      await wait(500);
      setMiss(null);
      return;
    }
    setHops(hops + 1);
    if (hops + 1 < q.targets.length) {
      round.note('Yes! Keep going.', 'ok', ['yes-keep-going']);
      return;
    }
    setColumn(true);
    if (level === 3) round.win(`Only the tens change. The ${onesW(q.o)} stay the same.`, ['only-the-tens-change-the-ones']);
    else round.win(`${q.s} ${sign} ${jump} = ${v}. Only the tens change.`, [q.s, op, jump, 'frag.is', v, 'only-the-tens-change']);
  };

  const marks: Partial<Record<number, SquareMark[]>> = {};
  trail.slice(0, -1).forEach((v) => (marks[v] = ['was']));
  marks[at] = hops ? ['here', 'hop'] : ['here'];
  if (miss !== null) marks[miss] = ['miss'];

  return (
    <>
      {level === 3 ? (
        <Prompt round={round} say={[plus ? 'frag.count-on-in-tens-from' : 'frag.count-back-in-tens-from', q.s]} sub="Tap the next three numbers.">
          Count {plus ? 'on' : 'back'} in tens from <Num n={q.s} />
        </Prompt>
      ) : (
        <Prompt round={round} say={[q.s, op, jump]} sub="Tap where you land.">
          <Num n={q.s} /> {sign} <Num n={jump} /> = <Box found={done ? at : undefined} />
        </Prompt>
      )}
      <Stage>
        <HundredSquare marks={marks} column={column ? q.o : undefined} onTap={(v) => void tap(v)} />
        <Blocks tens={Math.floor(at / 10)} ones={at % 10} small />
      </Stage>
    </>
  );
}

function InHerHead({ q, round }: GameProps<'jump'>) {
  const plus = q.dir > 0, sign = plus ? '+' : '−', op = plus ? 'frag.plus' : 'frag.take-away', jump = q.k * 10;
  const end = q.targets[0]!;
  const [square, setSquare] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <>
      <Prompt round={round} say={[q.s, op, jump]} sub="Try it in your head.">
        <Num n={q.s} /> {sign} <Num n={jump} /> = <Box found={done ? end : undefined} />
      </Prompt>
      <Stage>
        {square ? (
          <HundredSquare marks={{ [q.s]: ['here'] }} column={q.o} />
        ) : (
          !round.over && (
            <button type="button" className="ghostbtn" onClick={() => { round.helped(); setSquare(true); }}>
              Show the hundred square
            </button>
          )
        )}
      </Stage>
      <Choices
        opts={q.opts} ans={end} round={round}
        onRight={() => {
          setDone(true);
          round.win(`${q.s} ${sign} ${jump} = ${end}. Only the tens change.`, [q.s, op, jump, 'frag.is', end, 'only-the-tens-change']);
        }}
        onWrong={() => round.wrong(`${jump} is ${tensW(q.k)}. Change only the tens. The ones stay ${q.o}.`, ['change-only-the-tens-the-ones'])}
      />
    </>
  );
}
