import { useState } from 'react';
import { nth, ordinal } from '../maths/words';
import { NumberPad } from '../play/NumberPad';
import { Prompt, Stage } from '../play/parts';
import { Blocks } from '../ui/Blocks';
import { Num } from '../ui/Num';
import type { GameProps } from './registry';

/**
 * A number line with flags on it. It shows only the tens the numbers are in, so that two numbers
 * close together (51 and 57) stand apart; flags that would still touch are set at two heights.
 */
function MarkLine({ marks, ends }: { marks: number[]; ends?: [number, number] }) {
  const from = ends?.[0] ?? Math.floor(Math.min(...marks) / 10) * 10;
  const to = ends?.[1] ?? Math.max(from + 10, Math.ceil(Math.max(...marks) / 10) * 10);
  const step = to - from <= 20 ? 1 : 10;
  const at = (n: number) => ((n - from) / (to - from)) * 100;
  const ticks = Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step);
  const sorted = [...marks].sort((x, y) => x - y);
  // A flag goes up a level when the one before it on the line is too close to stand beside.
  const high = new Set<number>();
  sorted.forEach((m, i) => { if (i > 0 && at(m) - at(sorted[i - 1]!) < 13 && !high.has(sorted[i - 1]!)) high.add(m); });
  return (
    <div className="markline" role="img" aria-label={`number line from ${from} to ${to} with ${marks.join(' and ')}`} data-testid="markline">
      <div className="ml-axis">
        {ticks.map((t) => <span key={t} className={t % 10 === 0 ? 'tick big' : 'tick'} style={{ left: `${at(t)}%` }}><em>{t}</em></span>)}
        {marks.map((m) => <b key={m} className={high.has(m) ? 'flag high' : 'flag'} style={{ left: `${at(m)}%` }}><Num n={m} /></b>)}
      </div>
    </div>
  );
}

/**
 * More or less. Two numbers in blocks: tap the one that is more (or less). Three numbers: tap them
 * from the smallest. The nearer ten: on a line from one ten to the next. A queue: tap the third,
 * or say which place the yellow one is in.
 * A wrong answer puts the numbers on the number line, or counts along the queue.
 */
export function MoreOrLess({ q, level, round }: GameProps<'more'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  /** order: the numbers tapped so far, smallest first. */
  const [got, setGot] = useState<number[]>([]);
  const line = missed || done;
  const win = (text: string) => { setDone(true); round.win(text, q.sayEq); };
  const miss = (v: number) => { setMissed(true); setTried((t) => [...t, v]); round.wrong(q.hint, q.sayHint); };
  const card = (n: number, tap: () => void, state: 'yes' | 'no' | '', label?: string) => (
    <button key={n} type="button" className={`choice ${state}`.trim()} disabled={round.over || state !== ''} onClick={tap}>{label ?? <Num n={n} />}</button>
  );

  if (q.kind === 'pair') {
    const [a, b] = q.nums as [number, number], other = q.ans === a ? b : a;
    const said = q.ask === 'more' ? `${q.ans} is more than ${other}.` : `${q.ans} is less than ${other}.`;
    return (
      <>
        <Prompt round={round} say={q.say}>{q.ask === 'more' ? 'Which is more?' : 'Which is less?'}</Prompt>
        <Stage>
          <div className="twonums apart" data-testid="twonums">
            {[a, b].map((n) => <Blocks key={n} tens={Math.floor(n / 10)} ones={n % 10} small counted={line} />)}
          </div>
          {line && <MarkLine marks={[a, b]} ends={q.top === 20 ? [0, 20] : undefined} />}
        </Stage>
        <div className="answers"><div className="choices">
          {[a, b].map((n) => card(n, () => (n === q.ans ? win(said) : miss(n)), done && n === q.ans ? 'yes' : tried.includes(n) ? 'no' : ''))}
        </div></div>
      </>
    );
  }

  if (q.kind === 'order') {
    const want = q.sorted![got.length];
    return (
      <>
        <Prompt round={round} say={q.say}>Smallest first</Prompt>
        <Stage>
          <div className="orderrow" data-testid="ordered" aria-label={`in order so far: ${got.join(', ') || 'nothing'}`}>
            {q.sorted!.map((_, i) => <span key={i} className={got[i] === undefined ? 'slot' : 'slot full'}>{got[i] === undefined ? '' : <Num n={got[i]!} />}</span>)}
          </div>
          {line && <MarkLine marks={q.nums} ends={q.top === 20 ? [0, 20] : undefined} />}
        </Stage>
        <div className="answers"><div className="choices">
          {q.nums.map((n) => card(n, () => {
            if (n !== want) return miss(n);
            const now = [...got, n];
            setGot(now);
            setTried([]);
            if (now.length === 3) win(`${now.join(', ')}. From the smallest to the biggest.`);
          }, got.includes(n) ? 'yes' : tried.includes(n) ? 'no' : ''))}
        </div></div>
      </>
    );
  }

  if (q.kind === 'round') {
    const n = q.nums[0]!, lo = Math.floor(n / 10) * 10, said = `${n} is nearer to ${q.ans}.`;
    return (
      <>
        <Prompt round={round} say={q.say} sub="Which ten is nearer?"><Num n={n} /></Prompt>
        <Stage>{(level === 5 || line) && <MarkLine marks={[n]} ends={[lo, lo + 10]} />}</Stage>
        {q.opts ? (
          <div className="answers"><div className="choices">
            {q.opts.map((t) => card(t, () => (t === q.ans ? win(said) : miss(t)), done && t === q.ans ? 'yes' : tried.includes(t) ? 'no' : ''))}
          </div></div>
        ) : <NumberPad ans={q.ans} round={round} onRight={() => win(said)} onWrong={miss} digits={3} />}
      </>
    );
  }

  // A queue, drawn in code: the front is on the left, marked with an arrow.
  const len = q.queue!, said = `It is the ${ordinal(q.ans)}.`;
  const spot = (k: number) => {
    const cls = ['qspot', q.kind === 'place' && k === q.ans && 'mark', done && k === q.ans && 'yes', tried.includes(k) && q.kind === 'nth' && 'no', line && 'numbered'].filter(Boolean).join(' ');
    return q.kind === 'nth'
      ? <button key={k} type="button" className={cls} aria-label={`place ${k}`} disabled={round.over || tried.includes(k)} onClick={() => (k === q.ans ? win(said) : miss(k))}><i>{line ? k : ''}</i></button>
      : <span key={k} className={cls}><i>{line ? k : ''}</i></span>;
  };
  return (
    <>
      <Prompt round={round} say={q.say}>{q.kind === 'nth' ? <>Tap the <span className="wordy">{ordinal(q.ans)}</span></> : 'Which place?'}</Prompt>
      <Stage>
        <div className={len > 10 ? 'queue long' : 'queue'} role="group" aria-label={`a queue of ${len}, the front is on the left`} data-testid="queue">
          <span className="front" aria-hidden="true">front ➜</span>
          <div className="qrow">{Array.from({ length: Math.min(10, len) }, (_, i) => spot(i + 1))}</div>
          {len > 10 && <div className="qrow">{Array.from({ length: len - 10 }, (_, i) => spot(i + 11))}</div>}
        </div>
      </Stage>
      {q.kind === 'place' && (
        <div className="answers"><div className="choices">
          {q.opts!.map((k) => card(k, () => (k === q.ans ? win(said) : miss(k)), done && k === q.ans ? 'yes' : tried.includes(k) ? 'no' : '', nth(k)))}
        </div></div>
      )}
    </>
  );
}
