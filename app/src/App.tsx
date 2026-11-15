import { useCallback, useEffect, useState } from 'react';
import { READY } from './games/registry';
import type { GameId } from './maths/questions';
import { Pieces } from './Pieces';
import { Home } from './play/Home';
import { Play } from './play/Play';
import { Race } from './play/Race';
import { chooseLevel, levelOf, QUICK, QUICK_POOL, ROUND, segment, todaySegments, type Segment } from './session/progress';
import { load, save, type Saved } from './session/store';
import './play/app.css';

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return undefined; // some browsers refuse storage altogether; the game then runs unsaved
  }
};

type Screen =
  | { at: 'home' }
  | { at: 'race' }
  /** `run` counts rounds started, so that "play again" starts a fresh one. */
  | { at: 'play'; seg: Segment; today: boolean; queue: ('mix' | 'front')[]; run: number };

export function App() {
  const [saved, setSaved] = useState<Saved>(() => load(storage()));
  const [screen, setScreen] = useState<Screen>({ at: 'home' });
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0); // every screen starts at its top
  }, [screen]);

  const onSave = useCallback((s: Saved) => {
    setSaved(s);
    save(storage(), s);
  }, []);
  const home = useCallback(() => setScreen({ at: 'home' }), []);

  const startToday = () => {
    const [first, ...queue] = todaySegments(saved.progress, READY);
    setScreen((s) => ({ at: 'play', seg: segment(saved.progress, first!, READY), today: true, queue, run: s.at === 'play' ? s.run + 1 : 0 }));
  };
  const nextToday = () =>
    setScreen((s) => {
      if (s.at !== 'play' || !s.queue.length) return { at: 'home' };
      const [first, ...queue] = s.queue;
      return { at: 'play', seg: segment(saved.progress, first!, READY), today: true, queue, run: s.run + 1 };
    });
  const openGame = (id: GameId, level?: number) => {
    const progress = level ? chooseLevel(saved.progress, id, level) : saved.progress;
    if (level) onSave({ ...saved, progress });
    setScreen((s) => ({
      at: 'play', seg: { kind: 'game', n: ROUND, id, level: levelOf(progress, id) }, today: false, queue: [], run: s.at === 'play' ? s.run + 1 : 0,
    }));
  };

  const openQuick = () =>
    setScreen((s) => ({ at: 'play', seg: { kind: 'quick', n: QUICK, pool: QUICK_POOL }, today: false, queue: [], run: s.at === 'play' ? s.run + 1 : 0 }));

  if (hash === '#pieces') return <Pieces />;
  return (
    <main>
      {screen.at === 'home' ? (
        <Home saved={saved} onSave={onSave} onToday={startToday} onGame={openGame} onRace={() => setScreen({ at: 'race' })} onQuick={openQuick} />
      ) : screen.at === 'race' ? (
        <Race saved={saved} onHome={home} />
      ) : (
        <Play
          key={screen.run} seg={screen.seg} today={screen.today} more={screen.queue.length > 0}
          saved={saved} onSave={onSave} onHome={home} onNext={nextToday} onGame={openGame} onQuick={openQuick}
        />
      )}
    </main>
  );
}
