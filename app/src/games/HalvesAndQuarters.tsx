import { useState } from 'react';
import type { Cut } from '../maths/parts';
import { NumberPad } from '../play/NumberPad';
import { Choices, Prompt, Stage } from '../play/parts';
import { Box, Num } from '../ui/Num';
import type { GameProps } from './registry';

const WORD = { 1: 'a quarter', 2: 'one half', 3: 'three quarters' } as const;
const OF = { 1: 'A quarter of', 2: 'Half of', 3: 'Three quarters of' } as const;

/** A shape with its cuts drawn on it. */
function CutShape({ c }: { c: Cut }) {
  const w = c.base === 'wide' ? 130 : 96, h = c.base === 'wide' ? 72 : 96;
  return (
    <svg className="cutshape" viewBox={`-3 -3 ${w + 6} ${h + 6}`} width={w} height={h} aria-hidden="true">
      {c.base === 'circle' ? <circle cx={w / 2} cy={h / 2} r={w / 2} className="body" /> : <rect width={w} height={h} rx="5" className="body" />}
      <g clipPath={c.base === 'circle' ? 'circle(50%)' : undefined}>
        {c.v.map((x) => <line key={`v${x}`} x1={x * w} y1="0" x2={x * w} y2={h} className="cutline" />)}
        {c.h.map((y) => <line key={`h${y}`} x1="0" y1={y * h} x2={w} y2={y * h} className="cutline" />)}
        {c.diag && <line x1="0" y1="0" x2={w} y2={h} className="cutline" />}
      </g>
    </svg>
  );
}
/** The pieces of a shape laid one over the other, from the same edge: equal pieces end together. */
const Laid = ({ c }: { c: Cut }) => (
  <span className="laid" role="img" aria-label={`its ${c.parts.length} parts, laid over each other`}>
    {c.parts.map((p, i) => <i key={i} style={{ width: `${Math.round(p * 100 * (c.parts.length / 2))}%` }} />)}
  </span>
);

/** The bar from 0 to 1, cut into four. `yellow` parts are filled; with `onTap` the three cuts can be tapped. */
function Bar({ yellow = 0, onTap, off, right, named }: { yellow?: number; onTap?: (k: number) => void; off?: number[]; right?: number; named: boolean }) {
  return (
    <div className="fbar" data-testid="bar" role="group" aria-label="a bar from 0 to 1, cut into four equal parts">
      <div className="fcells">{[0, 1, 2, 3].map((i) => <i key={i} className={i < yellow ? 'on' : undefined} />)}</div>
      <div className="fends"><span>0</span><span>1</span></div>
      {[1, 2, 3].map((k) => onTap
        ? <button key={k} type="button" className={['fpoint', right === k && 'yes', off?.includes(k) && 'no'].filter(Boolean).join(' ')} style={{ left: `${k * 25}%` }}
            aria-label={`the cut after ${k} ${k === 1 ? 'part' : 'parts'}`} disabled={right !== undefined || off?.includes(k)} onClick={() => onTap(k)}>{named ? ['', '¼', '½', '¾'][k] : ''}</button>
        : named && <span key={k} className="fname" style={{ left: `${k * 25}%` }}>{['', '¼', '½', '¾'][k]}</span>)}
    </div>
  );
}

/**
 * Halves and quarters. Which shape is cut fairly; so much of a set, by sharing it out; the bar from 0 to 1.
 * A wrong answer lays the parts over each other, shares the set into groups, or names the cuts of the bar.
 */
export function HalvesAndQuarters({ q, round }: GameProps<'parts'>) {
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState(false);
  const [asked, setAsked] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const shown = missed || done;
  const win = (text: string) => { setDone(true); round.win(text, q.sayEq); };
  const miss = (v: number) => { setMissed(true); setTried((t) => [...t, v]); round.wrong(q.hint, q.sayHint); };

  if (q.kind === 'cut') {
    const what = q.into === 2 ? 'in half' : 'in quarters';
    return (
      <>
        <Prompt round={round} say={q.say}>Which one is cut {what}?</Prompt>
        <Stage>
          <div className="cuts" data-testid="cuts">
            {q.shapes!.map((c, i) => (
              <button key={i} type="button" className={['cutbtn', done && i === q.ans && 'yes', tried.includes(i) && 'no'].filter(Boolean).join(' ')} aria-label={`shape ${i + 1}`}
                disabled={round.over || tried.includes(i)}
                onClick={() => (i === q.ans ? win(q.into === 2 ? 'Two parts of the same size. Two halves make a whole.' : 'Four parts of the same size. Four quarters make a whole.') : miss(i))}>
                <CutShape c={c} />
                {shown && <Laid c={c} />}
              </button>
            ))}
          </div>
        </Stage>
      </>
    );
  }

  if (q.kind === 'set') {
    const n = q.n!, groups = q.quarters === 2 ? 2 : 4, each = n / groups, take = q.quarters === 2 ? 1 : q.quarters;
    const picture = !!q.opts || shown || asked;
    const said = `${OF[q.quarters]} ${n} is ${q.ans}.`;
    return (
      <>
        <Prompt round={round} say={q.say}>{OF[q.quarters]} <Num n={n} /> = <Box found={done ? q.ans : undefined} /></Prompt>
        <Stage>
          {!picture ? (
            !round.over && <button type="button" className="ghostbtn" onClick={() => { round.helped(); setAsked(true); }}>Show a picture</button>
          ) : (
            <div className={shown ? 'setshare shared' : 'setshare'} role="img" aria-label={shown ? `${n} counters shared into ${groups} groups of ${each}` : `${n} counters`} data-testid="set">
              {Array.from({ length: groups }, (_, g) => (
                <span key={g} className={shown && g < take ? 'sgroup take' : 'sgroup'}>{Array.from({ length: each }, (_, i) => <i key={i} />)}</span>
              ))}
            </div>
          )}
        </Stage>
        {q.opts
          ? <Choices opts={q.opts} ans={q.ans} round={round} onRight={() => win(said)} onWrong={miss} />
          : <NumberPad ans={q.ans} round={round} onRight={() => win(said)} onWrong={miss} />}
      </>
    );
  }

  if (q.kind === 'bar') {
    return (
      <>
        <Prompt round={round} say={q.say}>Tap {WORD[q.quarters]}</Prompt>
        <Stage><Bar onTap={(k) => (k === q.ans ? win(`That is ${WORD[q.quarters]}.`) : miss(k))} off={tried} right={done ? q.ans : undefined} named={shown} /></Stage>
      </>
    );
  }

  return (
    <>
      <Prompt round={round} say={q.say}>How much is yellow?</Prompt>
      <Stage><Bar yellow={q.quarters} named={shown} /></Stage>
      <div className="answers"><div className="choices">
        {q.opts!.map((k) => (
          <button key={k} type="button" className={['choice wordbtn', done && k === q.ans && 'yes', tried.includes(k) && 'no'].filter(Boolean).join(' ')} disabled={round.over || tried.includes(k)}
            onClick={() => (k === q.ans ? win(k === 2 ? 'Two quarters are the same as one half.' : `That is ${WORD[q.quarters]}.`) : miss(k))}>{WORD[k as 1 | 2 | 3]}</button>
        ))}
      </div></div>
    </>
  );
}
