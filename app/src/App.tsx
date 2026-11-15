import { useCallback, useEffect, useState } from 'react';
import { today, useData } from './app/useData';
import { newProfile, type ProfileData } from './data/profile';
import { checkLessons, finishToday } from './engine/apply';
import { CONFIG } from './engine/config';
import { UNITS, type Activity, type Lesson } from './engine/curriculum';
import { give, nextEarned } from './engine/rewards';
import { lessonState } from './engine/state';
import { choiceToday, nextPart, type Choice, type Part } from './engine/today';
import { LEVELS, PATH, type GameId } from './maths/questions';
import { Approach } from './parents/Approach';
import { Gate, Parents } from './parents/Parents';
import { Pieces } from './Pieces';
import { Home } from './play/Home';
import { Play, type Round } from './play/Play';
import { QUICK_FROM, QUICK_N } from './play/quick';
import { Race } from './play/Race';
import { Reward } from './play/Reward';
import { AddChild, WhoIsPlaying } from './play/Setup';
import { ChoiceCard, StartCheck } from './play/Cards';
import './play/app.css';

/** Today's games so far: the parts finished, and what she chose on the choice card. */
interface Today {
  done: Part['kind'][];
  chosen?: string;
  strongerFirst?: boolean;
  /** The choice card has been shown (or there was no choice to make). */
  asked: boolean;
}

type Screen =
  | { at: 'home' }
  | { at: 'add' }
  | { at: 'race' }
  /** The parents' area: first its check, then the area, and the page about the approach. */
  | { at: 'gate' }
  | { at: 'parents' }
  | { at: 'approach' }
  | { at: 'choose'; choice: Choice; today: Today }
  /** A reward is being given in the middle of today's games; they go on afterwards. */
  | { at: 'reward'; today: Today }
  /** `run` counts rounds started, so that the next round starts fresh. */
  | { at: 'play'; round: Round; run: number; today: Today | null };

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
  // Question screens are plain; the squared paper is for the home screen and the grown-ups' pages.
  const asking = screen.at === 'play' || screen.at === 'choose' || screen.at === 'reward' || screen.at === 'race' || /^#try=/.test(hash);
  useEffect(() => {
    document.body.classList.toggle('plain', asking);
  }, [asking]);

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
  if (screen.at === 'gate') return <main><Gate onOpen={() => setScreen({ at: 'parents' })} onHome={home} /></main>;
  if (screen.at === 'approach') return <main><Approach onBack={() => setScreen({ at: 'parents' })} /></main>;
  if (screen.at === 'parents') {
    return (
      <main>
        <Parents
          data={child} profiles={data.profiles} settings={data.settings} today={day}
          onSettings={data.saveSettings} onSave={data.save} onAdopt={data.adopt} onRemove={(id) => { data.remove(id); home(); }} onChoose={data.choose}
          onAdd={() => setScreen({ at: 'add' })} onApproach={() => setScreen({ at: 'approach' })} onHome={home}
        />
      </main>
    );
  }
  const lessons = child.checked ? [] : checkLessons(child.profile.stage, UNITS);
  if (lessons.length && screen.at !== 'play') {
    const skip = () => data.save({ ...child, checked: true });
    return (
      <main>
        <StartCheck
          name={child.profile.nickname} n={lessons.length} soundOff={data.settings.soundOff} onSkip={skip}
          onStart={() => setScreen({ at: 'play', round: { kind: 'check', n: lessons.length, slots: lessons.map((l) => ({ lesson: l.id, step: l.steps.length - 1 })) }, run, today: null })}
        />
      </main>
    );
  }

  /** Goes on with today's games: the choice card once, after the warm-up, then the next part, then home. */
  const goOn = (c: ProfileData, t: Today) => {
    const first = nextPart(c.child, day, t.done, t.chosen, t.strongerFirst);
    if (!t.asked && first && first.kind !== 'warm') {
      const choice = choiceToday(c.child, day, t.done);
      if (choice) return setScreen({ at: 'choose', choice, today: { ...t, asked: true } });
    }
    if (first) setScreen({ at: 'play', round: asRound(first), run, today: t });
    else home();
  };
  const startToday = () => goOn(child, { done: [], asked: false });

  // A reward she has earned and not yet been given comes before anything else, except a round in play.
  const owed = screen.at === 'play' ? null : nextEarned(child);
  if (owed) {
    return (
      <main>
        <Reward
          key={owed.kind === 'treasure' ? owed.lesson : owed.kind === 'trick' ? owed.unit : owed.stage} earned={owed} soundOff={data.settings.soundOff}
          onDone={(pick) => {
            const d = give(child, owed, pick);
            data.save(d);
            if (!nextEarned(d) && screen.at === 'reward') goOn(d, screen.today);
          }}
        />
      </main>
    );
  }
  const freePlay = (l: Lesson) =>
    setScreen({ at: 'play', round: { kind: 'free', n: CONFIG.round, slot: { lesson: l.id, step: Math.min(lessonState(child.child, l.id).step, l.steps.length - 1) } }, run, today: null });
  const quick = () => setScreen({ at: 'play', round: { kind: 'quick', n: QUICK_N, from: QUICK_FROM }, run, today: null });
  const after = (t: Today, kind: Round['kind']): Today => ({ ...t, done: [...t.done, kind as Part['kind']] });

  return (
    <main>
      {screen.at === 'race' ? (
        <Race soundOff={data.settings.soundOff} onHome={home} />
      ) : screen.at === 'choose' ? (
        <ChoiceCard
          choice={screen.choice} soundOff={data.settings.soundOff} onHome={home}
          onChoose={(l) => {
            const t = screen.today;
            // Whatever she picks is done today; a choice is always honoured.
            goOn(child, screen.choice.kind === 'stone' ? { ...t, chosen: l.id } : { ...t, chosen: screen.choice.options[0].id, strongerFirst: l.id !== screen.choice.options[0].id });
          }}
        />
      ) : screen.at === 'play' ? (
        <Play
          key={screen.run} round={screen.round} data={child} soundOff={data.settings.soundOff}
          onFinish={(d) => {
            if (!screen.today) {
              data.save(d);
              return { more: false, lastToday: false };
            }
            // One of today's parts is done. Is there another, or is that today finished?
            const t = after(screen.today, screen.round.kind);
            const more = nextPart(d.child, day, t.done, t.chosen, t.strongerFirst) !== null;
            data.save(more ? d : finishToday(d, day));
            return { more, lastToday: !more };
          }}
          onHome={home}
          onNext={() => {
            if (!screen.today) return home();
            const t = after(screen.today, screen.round.kind);
            if (nextEarned(child)) setScreen({ at: 'reward', today: t });
            else goOn(child, t);
          }}
          onAgain={() => setScreen({ ...screen, run })}
        />
      ) : (
        <Home
          data={child} settings={data.settings} today={day} shared={data.profiles.length > 1}
          onSettings={data.saveSettings} onToday={startToday} onLesson={freePlay} onRace={() => setScreen({ at: 'race' })} onQuick={quick}
          onSwitch={() => data.choose(null)} onParents={() => setScreen({ at: 'gate' })}
        />
      )}
    </main>
  );
}
