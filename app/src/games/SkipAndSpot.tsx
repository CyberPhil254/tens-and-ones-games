import { useState } from 'react';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Rows } from '../ui/Frames';
import { HundredSquare, type SquareMark } from '../ui/HundredSquare';
import { Num } from '../ui/Num';
import type { GameProps } from './registry';

const SHAPES = ['circle', 'square', 'triangle'] as const;
/** A shape of a pattern. Yellow, green and purple: never red or blue, which mean tens and ones. */
const Shape = ({ k }: { k: number }) => (
  <svg className={`shape s${k}`} viewBox="0 0 40 40" role="img" aria-label={SHAPES[k]}>
    {k === 0 ? <circle cx="20" cy="20" r="16" /> : k === 1 ? <rect x="5" y="5" width="30" height="30" rx="4" /> : <path d="M20 4 L37 35 L3 35 Z" />}
  </svg>
);

/** Hops along a line from 0 to 20: an arc for each hop, its size written on it once she has missed or answered. */
function HopLine({ seq, next, step, counted }: { seq: number[]; next?: number; step: number; counted: boolean }) {
  const x = (n: number) => 10 + n * 14;
  const all = next === undefined ? seq : [...seq, next];
  return (
    <svg className="hopline" viewBox="0 0 300 84" role="img" aria-label={`number line to 20 with hops from ${seq.join(' to ')}`} data-testid="hopline">
      <line x1={x(0)} y1="58" x2={x(20)} y2="58" className="axis" />
      {Array.from({ length: 21 }, (_, n) => (
        <g key={n}><line x1={x(n)} y1={n % 5 ? 54 : 50} x2={x(n)} y2="62" className="axis" />{n % 5 === 0 && <text x={x(n)} y="78" className="lbl">{n}</text>}</g>
      ))}
      {all.slice(1).map((b, i) => {
        const a = all[i]!, mid = (x(a) + x(b)) / 2, h = Math.min(40, 10 + Math.abs(x(b) - x(a)) * 0.4);
        return (
          <g key={i} className={next !== undefined && i === all.length - 2 ? 'hop new' : 'hop'}>
            <path d={`M${x(a)} 56 Q${mid} ${56 - h * 2} ${x(b)} 56`} />
            {counted && <text x={mid} y={52 - h} className="size">{step > 0 ? `+${step}` : `−${-step}`}</text>}
          </g>
        );
      })}
      {all.map((n) => <circle key={n} cx={x(n)} cy="58" r="5" className="land" />)}
    </svg>
  );
}

/**
 * Skip and spot: what comes next in a pattern of shapes or of numbers, hops of equal size, odd and even.
 * A wrong answer shows the hops one by one with their size, pairs the counters up, or points at the ones.
 */
export function SkipAndSpot({ q, round }: GameProps<'skip'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const shown = missed || done;
  const size = q.step === undefined ? 0 : Math.abs(q.step);
  const stepText = q.step === undefined ? '' : `Hops of ${size}${q.step < 0 ? ', going back' : ''}.`;
  const right = (text: string) => { setDone(true); round.win(text, q.sayEq); };
  const wrong = (v: number) => { setMissed(true); setTried((t) => [...t, v]); round.wrong(q.hint, q.sayHint); };
  const chips = (nums: (number | null)[]) => (
    <div className="seqchips" data-testid="sequence">
      {nums.map((n, i) => (
        <span key={i} className="chipwrap">
          {i > 0 && <span className="gapsize">{shown && q.step !== undefined ? (q.step > 0 ? `+${q.step}` : `−${-q.step}`) : ''}</span>}
          <span className={n === null ? 'seqchip hole' : 'seqchip'}>{n === null ? '?' : <Num n={n} />}</span>
        </span>
      ))}
    </div>
  );

  if (q.kind === 'pattern') {
    return (
      <>
        <Prompt round={round} say={q.say}>What comes next?</Prompt>
        <Stage>
          <div className="patrow" data-testid="pattern" aria-label={`a pattern: ${q.seq.map((k) => SHAPES[k]).join(', ')}`}>
            {q.seq.map((k, i) => <Shape key={i} k={k} />)}
            <span className={done ? 'patnext found' : 'patnext'}>{done ? <Shape k={q.ans} /> : '?'}</span>
          </div>
        </Stage>
        <div className="answers"><div className="choices">
          {q.opts!.map((k) => (
            <button key={k} type="button" className={['choice shapebtn', done && k === q.ans && 'yes', tried.includes(k) && 'no'].filter(Boolean).join(' ')} aria-label={SHAPES[k]}
              disabled={round.over || tried.includes(k)} onClick={() => (k === q.ans ? right('The pattern starts again.') : wrong(k))}><Shape k={k} /></button>
          ))}
        </div></div>
      </>
    );
  }

  if (q.kind === 'oddeven') {
    const n = q.n!, pairs = /Pair them up/.test(q.hint), said = `${n} is ${q.ans ? 'odd. One is left over.' : 'even. Everything has a partner.'}`;
    return (
      <>
        <Prompt round={round} say={q.say} sub="Odd or even?"><span className={shown && !pairs ? 'onesmark' : undefined}><Num n={n} /></span></Prompt>
        <Stage>{(pairs || (shown && n <= 20)) && <Rows top={Math.ceil(n / 2)} bottom={Math.floor(n / 2)} pairs={shown} />}</Stage>
        <div className="answers"><div className="choices">
          {[1, 0].map((v) => (
            <button key={v} type="button" className={['choice wordbtn', done && v === q.ans && 'yes', tried.includes(v) && 'no'].filter(Boolean).join(' ')}
              disabled={round.over || tried.includes(v)} onClick={() => (v === q.ans ? right(said) : wrong(v))}>{v ? 'Odd' : 'Even'}</button>
          ))}
        </div></div>
      </>
    );
  }

  if (q.kind === 'missing') {
    return (
      <>
        <Prompt round={round} say={q.say}>Which number is missing?</Prompt>
        <Stage>{chips(q.seq.map((n, i) => (i === q.hole && !done ? null : n)))}</Stage>
        <NumberPad ans={q.ans} round={round} onRight={() => right(`${stepText} ${q.seq.join(', ')}.`)} onWrong={wrong} />
      </>
    );
  }

  // Hops: on the line to 20, on the hundred square, or as numbers only.
  const marks: Partial<Record<number, SquareMark[]>> = {};
  for (const n of q.seq) marks[n] = ['was']; // where the hops have landed so far
  if (done) marks[q.ans] = ['here', 'hop'];
  const picture = !!q.opts || shown;
  return (
    <>
      <Prompt round={round} say={q.say}>What comes next?</Prompt>
      <Stage>
        {chips([...q.seq, done ? q.ans : null])}
        {picture && (q.top === 20
          ? <HopLine seq={q.seq} next={done ? q.ans : undefined} step={q.step!} counted={shown} />
          : <HundredSquare marks={marks} />)}
      </Stage>
      {q.opts
        ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={() => right(`${stepText} ${[...q.seq, q.ans].join(', ')}.`)} onWrong={wrong} />
        : <NumberPad ans={q.ans} round={round} onRight={() => right(`${stepText} ${[...q.seq, q.ans].join(', ')}.`)} onWrong={wrong} digits={3} />}
    </>
  );
}
