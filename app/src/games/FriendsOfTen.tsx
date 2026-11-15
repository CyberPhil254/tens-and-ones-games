import { useState } from 'react';
import { PAD } from '../maths/questions';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Hands } from '../ui/Hands';
import { Box, Num } from '../ui/Num';
import { TenFrame } from '../ui/TenFrame';
import type { GameProps } from './registry';

/**
 * Friends of Ten: pairs that make 10, then the gap from a two-digit number to the next ten.
 * Level 1: fingers and a ten frame. Level 2: the same as a number sentence, picture hidden until she answers.
 * Level 3: 47 + ? = 50, with blocks.
 */
export function FriendsOfTen(props: GameProps<'friends'>) {
  return 'next' in props.q ? <NextTen {...props} q={props.q} /> : <ToTen {...props} q={props.q} />;
}

type ToTenQ = { n: number; ans: number };
type NextTenQ = { a: number; t: number; o: number; ans: number; next: number };

function ToTen({ q, level, round }: Omit<GameProps<'friends'>, 'q'> & { q: ToTenQ }) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const picture = level === 1 || done || missed;
  return (
    <>
      <Prompt round={round} say={[`friendsQ.${q.n}`]}>
        {level === 1 ? 'How many more to make 10?' : <><Num n={q.n} /> + <Box found={done ? q.ans : undefined} /> = <Num n={10} /></>}
      </Prompt>
      <Stage>
        {picture && (
          <div className="fiverow">
            <Hands n={q.n} both />
            <TenFrame n={q.n} added={done ? q.ans : 0} />
          </div>
        )}
      </Stage>
      <Choices
        opts={PAD} ans={q.ans} pad round={round}
        onRight={() => {
          setDone(true);
          round.win(`${q.n} and ${q.ans} are friends of ten. ${q.n === 1 ? '1 finger' : `${q.n} fingers`} up, ${q.ans} down.`, [`friends.${q.n}`]);
        }}
        onWrong={() => {
          setMissed(true);
          round.wrong('Count the empty places, or the fingers that are down.', ['count-the-empty-places-or-the']);
        }}
      />
    </>
  );
}

function NextTen({ q, round }: Omit<GameProps<'friends'>, 'q'> & { q: NextTenQ }) {
  const wait = useWait();
  const [b, setB] = useState({ tens: q.t, ones: q.o, sun: 0, merging: false });
  const [done, setDone] = useState(false);
  const right = async () => {
    setDone(true);
    setB({ tens: q.t, ones: 10, sun: q.ans, merging: false }); // the missing ones arrive in yellow
    round.win(`${q.a} + ${q.ans} = ${q.next}. The same friends: ${q.o} and ${q.ans}.`, [q.a, 'frag.plus', q.ans, 'frag.is', q.next, 'the-same-friends-of-ten']);
    await wait(700);
    setB({ tens: q.t, ones: 10, sun: 0, merging: true });
    await wait(450);
    setB({ tens: q.t + 1, ones: 0, sun: 0, merging: false }); // and pack into a new ten
  };
  return (
    <>
      <Prompt round={round} say={[q.a, 'frag.and-how-many-more-make', q.next]}>
        <Num n={q.a} /> + <Box found={done ? q.ans : undefined} /> = <Num n={q.next} />
      </Prompt>
      <Stage><Blocks tens={b.tens} ones={b.ones} sunOnes={b.sun} merging={b.merging} /></Stage>
      <Choices
        opts={PAD} ans={q.ans} pad round={round}
        onRight={() => void right()}
        onWrong={() => round.wrong('Count the empty places in the blue tower.', ['count-the-empty-places-in-the'])}
      />
    </>
  );
}
