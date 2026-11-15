import { useState } from 'react';
import { voice } from './play/voice';
import { SP, type Piece } from './speech/script';
import { BarModel } from './ui/BarModel';
import { Blocks } from './ui/Blocks';
import { Hands } from './ui/Hands';
import { HundredSquare } from './ui/HundredSquare';
import { NumberLine } from './ui/NumberLine';
import { ALL_POSES, Oreo } from './ui/Oreo';
import { TenFrame } from './ui/TenFrame';
import { Num } from './ui/Num';

/**
 * The shared pieces, one by one, so they can be looked at on a phone and compared with the
 * live game. Not part of the app for children: open it by adding #pieces to the address.
 */
export function Pieces() {
  const [n, setN] = useState(34);
  const [said, setSaid] = useState('');
  const hear = (pieces: Piece[]) => void voice.say(pieces).then((ids) => setSaid(ids.join(' ') || 'silent'));
  const step = (d: number) => setN((v) => Math.max(0, Math.min(99, v + d)));
  return (
    <main className="pieces">
      <h1>Tens and Ones</h1>
      <p className="sub">The shared pieces. <a href="#">Back to the app</a></p>

      <h2>Blocks</h2>
      <p className="sub">
        <Num n={n} /> is {Math.floor(n / 10)} tens and {n % 10} ones.
      </p>
      <div className="card" data-testid="machine">
        <Blocks tens={Math.floor(n / 10)} ones={n % 10} counted />
        <p>
          <button type="button" onClick={() => step(-10)}>− 10</button>{' '}
          <button type="button" onClick={() => step(10)}>+ 10</button>{' '}
          <button type="button" onClick={() => step(-1)}>− 1</button>{' '}
          <button type="button" onClick={() => step(1)}>+ 1</button>
        </p>
      </div>

      <h2>Voice</h2>
      <p className="sub">The 702 recorded clips, addressed by sentence id.</p>
      <div className="card" data-testid="voice" data-said={said}>
        <button type="button" onClick={() => hear([SP.isTO(n)])}>Hear the number</button>{' '}
        <button type="button" onClick={() => hear([n, 'plus', 10, 'is', n + 10, 'only-the-tens-change'])} disabled={n > 89}>
          Hear {n} plus 10
        </button>
      </div>

      <h2>The widest number</h2>
      <div className="card" data-testid="widest">
        <Blocks tens={9} ones={9} counted />
      </div>

      <h2>Ones just added, a ten being made, a ten just broken</h2>
      <div className="card">
        <Blocks tens={4} ones={10} sunOnes={3} /> <Blocks tens={2} ones={10} merging /> <Blocks tens={2} ones={14} />
      </div>

      <h2>Sketch and small</h2>
      <div className="card">
        <Blocks tens={4} ones={7} sketch /> <Blocks tens={4} ones={7} small />
      </div>

      <h2>Fingers and ten frame</h2>
      <div className="card" data-testid="five">
        <Hands n={(n % 10) + 1} />
        <TenFrame n={n % 10} added={10 - (n % 10)} />
      </div>

      <h2>Number line</h2>
      <div className="card" data-testid="line">
        <NumberLine n={n} onTap={setN} />
      </div>

      <h2>Hundred square</h2>
      <div className="card" data-testid="square">
        <HundredSquare marks={n ? { [n]: ['here'] } : {}} column={n % 10} onTap={(v) => setN(Math.min(99, v))} />
      </div>

      <h2>Whole and parts</h2>
      <div className="card">
        <BarModel whole={n + 20} parts={[n, null]} ans={20} />
      </div>

      <h2>Oreo</h2>
      <p className="sub">The nine poses the app uses.</p>
      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} data-testid="oreo">
        {ALL_POSES.map((pose) => (
          <figure key={pose} style={{ margin: 0, textAlign: 'center', fontSize: 13 }}>
            <Oreo pose={pose} />
            <figcaption>{pose}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
