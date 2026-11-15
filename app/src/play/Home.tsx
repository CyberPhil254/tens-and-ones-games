import { useState } from 'react';
import { GAMES, GAME_INFO, READY, SHELVES } from '../games/registry';
import { LEVELS, PATH, type GameId } from '../maths/questions';
import { boneStore, doneToday, frontier, levelOf, quickOpen, warmPool } from '../session/progress';
import type { Saved } from '../session/store';
import { chime } from '../speech/chime';
import { Blocks } from '../ui/Blocks';
import { Num } from '../ui/Num';
import { Bone, Oreo, Paw } from '../ui/Oreo';
import { VoiceRetry } from './Play';
import { speak, useVoiceSilent, voice } from './voice';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Home({ saved, onSave, onToday, onGame, onRace, onQuick }: {
  saved: Saved;
  onSave: (s: Saved) => void;
  onToday: () => void;
  onGame: (id: GameId) => void;
  onRace: () => void;
  onQuick: () => void;
}) {
  const p = saved.progress;
  const f = frontier(p, READY);
  const done = doneToday(p, new Date().toDateString());
  const store = boneStore(p);
  const silent = useVoiceSilent();
  const allPorted = READY.length === PATH.length;

  const toggleSound = () => {
    const soundOff = !saved.soundOff;
    onSave({ ...saved, soundOff });
    if (soundOff) voice.stop();
    else {
      chime();
      speak(['sound-on'], 0.3);
    }
  };

  return (
    <section>
      <div className="top">
        <h1 className="title"><span className="t">Tens</span> <span className="amp">&amp;</span> <span className="o">Ones</span></h1>
        <Oreo pose="hello" className="toppup" />
      </div>
      <p className="lede">Every number is made of <b className="tt">tens</b> and <b className="oo">ones</b>.</p>

      <div className="today">
        <div>
          <h2>Today</h2>
          <p data-testid="today-text">
            {done ? 'Today’s games are done. Well done! See you tomorrow.'
              : f ? <>{warmPool(p, READY).length ? 'A warm-up, then ' : 'Two rounds of '}<b>{GAME_INFO[f].name}</b>. About ten minutes.</>
              : allPorted ? 'You finished every game! Today is a mix of all of them.'
              : 'You finished every game that is here so far! Today is a mix of them.'}
          </p>
          <div className="trow">
            <button className={done ? 'next quiet' : 'next'} type="button" onClick={onToday}>
              {done ? 'Play again anyway' : 'Play today’s games'}
            </button>
            <button className="soundbtn" type="button" aria-pressed={!saved.soundOff} onClick={toggleSound}>
              {saved.soundOff ? 'Sound off' : 'Sound on'}
            </button>
          </div>
          {silent && <VoiceRetry />}
        </div>
        <div className="store">
          <div className="shelf" role="img" aria-label={`${store.total} bones`} data-testid="store">
            {Array.from({ length: store.crates }, (_, i) => <div key={`c${i}`} className="crate">100</div>)}
            {Array.from({ length: store.boxes }, (_, i) => (
              <div key={`b${i}`} className="bbox">{Array.from({ length: 10 }, (_, j) => <Bone key={j} />)}</div>
            ))}
            <div className="btray">
              {Array.from({ length: store.loose }, (_, j) => <Bone key={j} />)}
              <span className="empty">{Array.from({ length: 10 - store.loose }, (_, j) => <Bone key={j} />)}</span>
            </div>
          </div>
          <p className="storecap">
            {store.total ? (
              <>
                {store.crates ? `${plural(store.crates, 'crate', 'crates')} of a hundred, ` : ''}
                <b className="tt">{plural(store.boxes, 'box', 'boxes')} of ten</b> and <b className="oo">{plural(store.loose, 'bone', 'bones')}</b>.
                {' '}That is <Num n={store.total} /> bones!
              </>
            ) : 'Your bone store is empty. Win a bone every time you are right first go.'}
          </p>
        </div>
      </div>

      <h2>All the games</h2>
      {SHELVES.map(([title, ids]) => (
        <div key={title}>
          <p className="shelfh">{title}</p>
          <ol className="stations">
            {ids.map((id) => {
              const info = GAME_INFO[id];
              const onPath = id !== 'race' && id !== 'quick';
              const locked = id === 'quick' && !quickOpen(p);
              const ready = (onPath ? !!GAMES[id] : true) && !locked;
              return (
                <li key={id}>
                  <button
                    className={id === f ? 'station next-up' : 'station'} type="button" disabled={!ready}
                    onClick={() => (onPath ? onGame(id) : id === 'race' ? onRace() : onQuick())}
                  >
                    <span className={onPath ? 'no' : 'no tag'}>{onPath ? PATH.indexOf(id) + 1 : id === 'race' ? '2P' : 'GO'}</span>
                    <span>
                      <strong>{info.name}{id === f && <span className="badge">Next</span>}</strong>
                      <span className="d">{locked ? 'Opens when Friends of Ten and Jump in Tens are finished.' : info.d}</span>
                    </span>
                    {id === 'quick' && p.best > 0 && <span className="st"><small>Best: {p.best} s</small></span>}
                    {ready && onPath && (
                      <span className="st">
                        <i><Bone /></i> {p.stars[id] ?? 0}
                        <small>{p.done[id] ? <><Paw /> Finished</> : `Level ${levelOf(p, id)} of ${LEVELS[id]}`}</small>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      <h2>Number machine</h2>
      <p className="h2note">Press the buttons and watch the tens and ones change.</p>
      <Machine />

      <div className="grown">
        <h2>For grown-ups</h2>
        <ul>
          <li><b>Play today’s games</b> is the main button: a short warm-up from games she already knows, then two rounds of the next game. It takes about ten minutes. Then stop. Short and daily works better than long and weekly.</li>
          <li>The game moves her up a level when she wins five or six bones in a round, and down again when a round is too hard. A perfect round skips a level. A game is finished after two good rounds at its last level, and it comes back if she misses it twice in a later warm-up. You can still pick any game and any level yourself.</li>
          <li>A bone means right first time. A paw means right after a hint or with the help picture.</li>
          <li>The questions and hints are read aloud by a recorded voice. Tap the speaker next to a question to hear it again.</li>
          <li>Sit with her when you can and ask “How did you know?”. Saying it in tens and ones is where it sticks.</li>
          <li><b>Race to 100</b> is for two players. Say the numbers aloud and count on from where you stand, never from 1.</li>
          <li>The last level of the adding and taking away games hides the blocks on purpose. <b>Quick Paws</b> opens only when Friends of Ten and Jump in Tens are finished: speed comes after getting it right.</li>
          <li>Tens stand in groups of five, like the ones. Eight tens should read as “five and three”. Fingers are allowed, they fade by themselves.</li>
        </ul>
      </div>
    </section>
  );
}

/** Free play: a number from 0 to 99 as blocks, one ten or one one more or fewer. */
function Machine() {
  const [n, setN] = useState(34);
  const step = (by: number) => setN((v) => (v + by < 0 || v + by > 99 ? v : v + by));
  const t = Math.floor(n / 10), o = n % 10;
  return (
    <div className="machine" data-testid="machine">
      <div className="mread">
        <span className="mnum" aria-live="polite"><Num n={n} /></span>
        <div className="mwords">{t === 1 ? '1 ten' : `${t} tens`} and {o === 1 ? '1 one' : `${o} ones`}</div>
      </div>
      <Blocks tens={t} ones={o} />
      <div className="mbtns">
        <button className="mbtn ten" type="button" aria-label="take away ten" onClick={() => step(-10)}>− 10</button>
        <button className="mbtn one" type="button" aria-label="take away one" onClick={() => step(-1)}>− 1</button>
        <button className="mbtn one" type="button" aria-label="add one" onClick={() => step(1)}>+ 1</button>
        <button className="mbtn ten" type="button" aria-label="add ten" onClick={() => step(10)}>+ 10</button>
      </div>
    </div>
  );
}
