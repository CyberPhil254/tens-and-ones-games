import { useCallback, useEffect, useState } from 'react';
import { today, useData } from './app/useData';
import { newProfile, type ProfileData } from './data/profile';
import { finishToday } from './engine/apply';
import { CONFIG } from './engine/config';
import type { Activity, Lesson } from './engine/curriculum';
import { lessonState } from './engine/state';
import { nextPart, type Part } from './engine/today';
import { LEVELS, PATH, type GameId } from './maths/questions';
import { Pieces } from './Pieces';
import { Home } from './play/Home';
import { Play, type Round } from './play/Play';
import { QUICK_FROM, QUICK_N } from './play/quick';
import { Race } from './play/Race';
import { AddChild, WhoIsPlaying } from './play/Setup';
import './play/app.css';

type Screen =
  | { at: 'home' }
  | { at: 'add' }
  | { at: 'race' }
  /** `run` counts rounds started, so that the next round starts fresh. `done` lists today's finished parts. */
  | { at: 'play'; round: Round; run: number; today: Part['kind'][] | null };

const asRound = (p: Part): Round => (p.kind === 'warm' ? p : p.kind === 'new' ? { ...p, counts: true } : p);

/**
 * The tester's door: "#try=friends.2" plays one round of a game level straight away, as free play.
 * It is for looking at a level, and for the browser tests; nothing in the app links to it.
 */
function tryFromHash(hash: string): Activity | null {
  const m = /^#try=([a-z]+)\.(\d)(?:\.(\d))?$/.exec(hash);
  if (!m || !(PATH as readonly string[]).includes(m[1]!)) return null;
  const game = m[1] as GameId, level = Number(m[2]);
  if (level < 1 || level > LEVELS[game]) return null;
  return { game, level, ...(m[3] === undefined ? {} : { variant: Number(m[3]) }) };
}

export function App() {
  const data = useData();
  const [screen, setScreen] = useState<Screen>({ at: 'home' });
  const [hash, setHash] = useState(() => window.location.hash);
  const [tries, setTries] = useState(0);
  const [guest] = useState<ProfileData>(() => newProfile('guest', 'Guest', 'zebra', 2, today()));

  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0); // every screen starts at its top
  }, [screen]);

  const home = useCallback(() => setScreen({ at: 'home' }), []);
  const run = screen.at === 'play' ? screen.run + 1 : 0;

  if (hash === '#pieces') return <Pieces />;
  if (!data.ready) return <main aria-busy="true" />;

  const tryAct = tryFromHash(hash);
  if (tryAct) {
    const leave = () => { window.location.hash = ''; };
    return (
      <main>
        <Play
          key={`${hash}-${tries}`} round={{ kind: 'try', n: CONFIG.round, from: [tryAct] }} data={data.current ?? guest} soundOff={data.settings.soundOff}
          onFinish={(d) => { if (data.current) data.save(d); return { more: false, lastToday: false }; }}
          onHome={leave} onNext={leave} onAgain={() => setTries((t) => t + 1)}
        />
      </main>
    );
  }

  if (screen.at === 'add' || !data.profiles.length) {
    return (
      <main>
        <AddChild
          first={!data.profiles.length}
          onAdd={(n, p, s) => { data.create(n, p, s); home(); }}
          onCancel={data.profiles.length ? home : undefined}
        />
      </main>
    );
  }
  const child = data.current;
  if (!child) {
    return <main><WhoIsPlaying profiles={data.profiles} onChoose={data.choose} onAdd={() => setScreen({ at: 'add' })} /></main>;
  }

  const day = today();
  const startToday = () => {
    const part = nextPart(child.child, day, []);
    if (part) setScreen({ at: 'play', round: asRound(part), run, today: [] });
  };
  const freePlay = (l: Lesson) =>
    setScreen({ at: 'play', round: { kind: 'free', n: CONFIG.round, slot: { lesson: l.id, step: Math.min(lessonState(child.child, l.id).step, l.steps.length - 1) } }, run, today: null });
  const quick = () => setScreen({ at: 'play', round: { kind: 'quick', n: QUICK_N, from: QUICK_FROM }, run, today: null });

  return (
    <main>
      {screen.at === 'race' ? (
        <Race soundOff={data.settings.soundOff} onHome={home} />
      ) : screen.at === 'play' ? (
        <Play
          key={screen.run} round={screen.round} data={child} soundOff={data.settings.soundOff}
          onFinish={(d) => {
            if (!screen.today) {
              data.save(d);
              return { more: false, lastToday: false };
            }
            // One of today's parts is done. Is there another, or is that today finished?
            const done = [...screen.today, screen.round.kind as Part['kind']];
            const more = nextPart(d.child, day, done) !== null;
            data.save(more ? d : finishToday(d, day));
            return { more, lastToday: !more };
          }}
          onHome={home}
          onNext={() => {
            if (!screen.today) return home();
            const done = [...screen.today, screen.round.kind as Part['kind']];
            const part = nextPart(child.child, day, done);
            if (part) setScreen({ at: 'play', round: asRound(part), run, today: done });
            else home();
          }}
          onAgain={() => setScreen({ ...screen, run })}
        />
      ) : (
        <Home
          data={child} settings={data.settings} today={day} shared={data.profiles.length > 1}
          onSettings={data.saveSettings} onToday={startToday} onLesson={freePlay} onRace={() => setScreen({ at: 'race' })} onQuick={quick}
          onSwitch={() => data.choose(null)}
        />
      )}
    </main>
  );
}
