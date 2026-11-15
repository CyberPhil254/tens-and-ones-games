import { useState } from 'react';
import { PAY } from '../maths/money';
import { Choices, Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * A coin or a note, drawn in code: a disc or a rectangle with its value on it. Not a picture of the
 * real one. Sizes do not follow the value (the 5 is bigger than the 10), as with real coins.
 */
export function Coin({ v }: { v: number }) {
  return <span className={v >= 50 ? `note n${v}` : `coin c${v}`} role="img" aria-label={`${v} ${v === 1 ? 'shilling' : 'shillings'}`}><b>{v}</b></span>;
}
const total = (p: number[]) => p.reduce((x, y) => x + y, 0);
const sh = (n: number) => `${n} ${n === 1 ? 'shilling' : 'shillings'}`;
/** The same amount as tens and ones blocks: what the coins are swapped for when she has missed. */
const AsBlocks = ({ n }: { n: number }) => <Blocks tens={Math.floor(n / 10)} ones={n % 10} small counted />;
const Purse = ({ items }: { items: number[] }) => <span className="purse">{items.map((v, i) => <Coin key={i} v={v} />)}</span>;

/**
 * Money. Find the coin of a value; which is worth more; how much is in a purse; make an amount;
 * which purse holds more. A wrong answer swaps the coins for tens and ones blocks.
 */
export function Money({ q, round }: GameProps<'money'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [mine, setMine] = useState<number[]>([]);
  const shown = missed || done;
  const win = (text: string) => { setDone(true); round.win(text, q.sayEq); };
  const miss = (v: number) => { setMissed(true); setTried((t) => [...t, v]); round.wrong(q.hint, q.sayHint); };
  const tile = (key: number, body: React.ReactNode, right: boolean, tap: () => void, label: string) => (
    <button key={key} type="button" className={['moneybtn', done && right && 'yes', tried.includes(key) && 'no'].filter(Boolean).join(' ')} aria-label={label}
      disabled={round.over || tried.includes(key)} onClick={tap}>{body}</button>
  );

  if (q.kind === 'name' || q.kind === 'worth') {
    const [a, b] = q.items as [number, number];
    return (
      <>
        <Prompt round={round} say={q.say}>{q.kind === 'name' ? <>Tap <Num n={q.ans} /> {q.ans === 1 ? 'shilling' : 'shillings'}</> : 'Which is worth more?'}</Prompt>
        <Stage>
          <div className="moneyrow" data-testid="money">
            {q.items.map((v) => tile(v, <><Coin v={v} />{shown && <AsBlocks n={v} />}</>, v === q.ans,
              () => (v === q.ans ? win(q.kind === 'name' ? `${sh(v)}.` : `${a === q.ans ? a : b} is more than ${a === q.ans ? b : a}.`) : miss(v)), sh(v)))}
          </div>
        </Stage>
      </>
    );
  }

  if (q.kind === 'read') {
    return (
      <>
        <Prompt round={round} say={q.say}>How much?</Prompt>
        <Stage>
          <div className="pursebox" data-testid="purse"><Purse items={q.items} /></div>
          {shown && <AsBlocks n={q.ans} />}
        </Stage>
        <Choices opts={q.opts!} ans={q.ans} round={round} onRight={() => win(`${q.items.join(' + ')} = ${q.ans}. ${sh(q.ans)}.`)} onWrong={miss} />
      </>
    );
  }

  if (q.kind === 'purses') {
    const [a, b] = q.purses!, sums = [total(a), total(b)] as const;
    return (
      <>
        <Prompt round={round} say={q.say}>Which purse holds more?</Prompt>
        <Stage>
          <div className="moneyrow purses" data-testid="purses">
            {[a, b].map((p, i) => tile(i, <><Purse items={p} />{shown && <AsBlocks n={sums[i]!} />}</>, i === q.ans,
              () => (i === q.ans ? win(`${sums[q.ans]} is more than ${sums[1 - q.ans]}.`) : miss(i)), `purse ${i + 1}`))}
          </div>
        </Stage>
      </>
    );
  }

  // Make an amount: she taps coins into her purse and takes them out again by tapping them there.
  const have = total(mine);
  const check = () => {
    if (have === q.ans) return win(`${[...mine].sort((x, y) => y - x).join(' + ')} = ${q.ans}. You made ${sh(q.ans)}.`);
    setMissed(true);
    if (have < q.ans) round.wrong(`That is ${have}. Not enough yet. Add some more.`, ['that-is-not-enough-yet']);
    else round.wrong(`That is ${have}. Too much. Take some away.`, ['that-is-too-much-take-some']);
  };
  return (
    <>
      <Prompt round={round} say={q.say}>Make <Num n={q.ans} /> shillings</Prompt>
      <Stage>
        <div className="pursebox mine" data-testid="mine" aria-label={`your purse: ${mine.length ? mine.join(', ') : 'empty'}`}>
          {mine.map((v, i) => (
            <button key={i} type="button" className="inpurse" aria-label={`take out ${sh(v)}`} disabled={round.over} onClick={() => setMine((m) => m.filter((_, j) => j !== i))}><Coin v={v} /></button>
          ))}
          {!mine.length && <span className="sub">Tap the coins below to put them in.</span>}
        </div>
        {shown && <div className="twonums apart" data-testid="compare"><AsBlocks n={have} />{!done && <span className="plus">→</span>}{!done && <AsBlocks n={q.ans} />}</div>}
      </Stage>
      <div className="controls moneypad">
        {PAY.map((v) => <button key={v} type="button" className="moneybtn pay" aria-label={`add ${sh(v)}`} disabled={round.over || mine.length >= 14} onClick={() => setMine((m) => [...m, v])}><Coin v={v} /></button>)}
        <button className="ctl go" type="button" disabled={round.over || !mine.length} onClick={check}>Done</button>
      </div>
    </>
  );
}
