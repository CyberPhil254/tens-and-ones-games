import { useRef, useState } from 'react';
import { PAD } from '../maths/questions';
import { Choices, Prompt, Stage, useWait } from '../play/parts';
import type { Piece } from '../speech/script';
import { Blocks } from '../ui/Blocks';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * Fill the Ten: add a one-digit number by filling up to the next ten first.
 * Level 1: the second number fills the ten exactly. Level 2: past the ten, in two guided steps.
 * Level 3: the same in one step. Level 4: in her head, a picture only if she asks.
 */
export function FillTheTen(props: GameProps<'fill'>) {
  return props.level === 4 ? <InHerHead {...props} /> : <WithBlocks {...props} />;
}

/** The yellow ones still waiting to be added. */
const Pile = ({ left, sketch }: { left: number; sketch?: boolean }) => (
  <div className={['pile', sketch && 'sketch', left === 0 && 'empty'].filter(Boolean).join(' ')}>
    <span className="plus">+</span>
    <div className="pcubes" role="img" aria-label={`${left} more`}>
      {Array.from({ length: left }, (_, i) => <div key={i} className="cube sun" />)}
    </div>
  </div>
);

const fillFirst = (q: GameProps<'fill'>['q']) => `First to ${q.next}, then ${q.rest} more. ${q.a} + ${q.b} = ${q.sum}.`;
const sumSaid = (q: GameProps<'fill'>['q'], lead: string): Piece[] => [lead, q.a, 'frag.plus', q.b, 'frag.is', q.sum];

function WithBlocks({ q, level, round }: GameProps<'fill'>) {
  const wait = useWait();
  const [b, setB] = useState({ tens: q.t, ones: q.o, sun: 0, merging: false });
  const [left, setLeft] = useState(q.b);
  const [counted, setCounted] = useState(false);
  const [filled, setFilled] = useState(false); // level 2: the first step is done
  const [done, setDone] = useState(false);
  const misses = useRef(0);
  const shown = useRef(false);

  const move = async (count: number) => {
    for (let i = 0; i < count; i++) {
      setLeft((l) => l - 1);
      setB((v) => ({ ...v, ones: v.ones + 1, sun: v.sun + 1 }));
      await wait(140);
    }
  };
  const packTen = async () => {
    await wait(300);
    setB((v) => ({ ...v, sun: 0, merging: true }));
    await wait(450);
    setB({ tens: q.t + 1, ones: 0, sun: 0, merging: false });
  };
  /** Shows the whole sum once: fill the ten, pack it, add the rest. */
  const demo = async () => {
    if (shown.current) return;
    shown.current = true;
    await move(q.fill);
    await packTen();
    await move(q.rest);
    setCounted(true);
  };

  const eq = <><Num n={q.a} /> + <Num n={q.b} /> = <Box found={done ? q.sum : undefined} /></>;
  const right = () => {
    setDone(true);
    if (level === 1) round.win(`The ones filled up a ten. ${q.a} + ${q.b} = ${q.sum}.`, sumSaid(q, 'the-ones-filled-up-a-ten'));
    else round.win(fillFirst(q), sumSaid(q, 'first-fill-the-ten-then-add'));
    if (level === 2) void move(q.rest);
    else void demo();
  };
  const wrong = () => {
    misses.current++;
    if (level === 1) {
      if (misses.current === 2) {
        round.wrong('Watch the yellow ones fill up the ten. Now count the tens.', ['watch-the-yellow-ones-fill-up']);
        void demo();
      } else round.wrong('Look at the blue tower. The yellow ones fit in the empty places.', ['look-at-the-blue-tower-the']);
    } else if (level === 2) {
      round.wrong(`${q.next} and ${q.rest} more. The tens stay, just add the ones.`, ['the-tens-stay-just-add-the']);
    } else {
      round.wrong(`Fill the ten first: ${q.a} + ${q.fill} = ${q.next}. Then ${q.rest} more.`, ['fill-the-ten-first-then-add']);
      if (misses.current === 2) void demo();
    }
  };

  const firstStep = level === 2 && !filled;
  return (
    <>
      {level !== 2 ? (
        <Prompt round={round} say={[q.a, 'frag.plus', q.b]}>{eq}</Prompt>
      ) : firstStep ? (
        <Prompt round={round} say={[q.a, 'frag.plus', q.b]} sub={<>First fill the ten: <Num n={q.a} /> + <Box /> = <Num n={q.next} /></>}>{eq}</Prompt>
      ) : (
        <Prompt round={round} say={[q.next, 'frag.plus', q.rest]} sub={<>{q.b} is {q.fill} and {q.rest}. Now <Num n={q.next} /> + <Num n={q.rest} /> = ?</>}>{eq}</Prompt>
      )}
      <Stage>
        <div className="fillrow">
          <Blocks tens={b.tens} ones={b.ones} sunOnes={b.sun} merging={b.merging} counted={counted} />
          <Pile left={left} />
        </div>
      </Stage>
      {firstStep ? (
        <Choices
          key="fill" opts={PAD} ans={q.fill} pad round={round}
          onRight={async () => {
            round.clear();
            await move(q.fill);
            await packTen();
            setFilled(true);
          }}
          onWrong={() => round.wrong('Count the empty places in the blue tower.', ['count-the-empty-places-in-the'])}
        />
      ) : (
        <Choices key="sum" opts={q.opts} ans={q.sum} round={round} onRight={right} onWrong={wrong} />
      )}
    </>
  );
}

function InHerHead({ q, round }: GameProps<'fill'>) {
  const [picture, setPicture] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <>
      <Prompt round={round} say={[q.a, 'frag.plus', q.b]} sub="Try it in your head.">
        <Num n={q.a} /> + <Num n={q.b} /> = <Box found={done ? q.sum : undefined} />
      </Prompt>
      <Stage>
        {picture ? (
          <div className="fillrow">
            <Blocks tens={q.t} ones={q.o} sketch />
            <Pile left={q.b} sketch />
          </div>
        ) : (
          !round.over && (
            <button type="button" className="ghostbtn" onClick={() => { round.helped(); setPicture(true); }}>Show a picture</button>
          )
        )}
      </Stage>
      <Choices
        opts={q.opts} ans={q.sum} round={round}
        onRight={() => {
          setDone(true);
          if (q.rest) round.win(fillFirst(q), sumSaid(q, 'first-fill-the-ten-then-add'));
          else round.win(`${q.o} and ${q.b} make a new ten. ${q.a} + ${q.b} = ${q.sum}.`, sumSaid(q, `newTen.${q.o}`));
        }}
        onWrong={() =>
          q.rest
            ? round.wrong(`Fill the ten first: ${q.a} + ${q.fill} = ${q.next}. Then ${q.rest} more.`, ['fill-the-ten-first-then-add'])
            : round.wrong(`${q.o} and ${10 - q.o} are friends of ten.`, [`friends.${q.o}`])
        }
      />
    </>
  );
}
