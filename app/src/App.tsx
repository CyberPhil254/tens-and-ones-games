import { useState } from 'react';
import { browserVoice } from './speech/player';
import { SP, type Piece } from './speech/script';
import { Blocks } from './ui/Blocks';
import { Num } from './ui/Num';

/**
 * Placeholder screen: the shared pieces, one by one, so they can be looked at on a phone
 * and compared with the live game. The games arrive one pull request at a time.
 */
const voice = browserVoice();

export function App() {
  const [n, setN] = useState(34);
  const [said, setSaid] = useState('');
  const hear = (pieces: Piece[]) => void voice.say(pieces).then((ids) => setSaid(ids.join(' ') || 'silent'));
  const step = (d: number) => setN((v) => Math.max(0, Math.min(99, v + d)));
  return (
    <main>
      <h1>Tens and Ones</h1>
      <div className="card">
        <p>
          The new app is being built here. The games are still at their usual place until this one is ready.
        </p>
      </div>

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
    </main>
  );
}
