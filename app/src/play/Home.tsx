import { useEffect, useState } from 'react';
import type { ProfileData, Settings } from '../data/profile';
import { doneToday } from '../engine/apply';
import { LESSON, type Lesson } from '../engine/curriculum';
import { lessonState, type Day } from '../engine/state';
import { planToday } from '../engine/today';
import { chime } from '../speech/chime';
import { Blocks } from '../ui/Blocks';
import { FriendPicture } from '../ui/FriendPicture';
import { Num } from '../ui/Num';
import { Bone, Oreo, OreoAnim } from '../ui/Oreo';
import { awardsWon, tricksKnown } from '../engine/rewards';
import { Garden } from './Garden';
import { Shelf } from './Reward';
import { VoiceRetry } from './Play';
import { speak, useVoiceSilent, voice } from './voice';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Quick Paws is for speed, so it opens only once the two lessons its questions come from are mastered. */
export const quickOpen = (d: ProfileData) => !!lessonState(d.child, 's1-ten').mastered && !!lessonState(d.child, 's2-calc').mastered;

export interface HomeProps {
  data: ProfileData;
  settings: Settings;
  today: Day;
  /** More than one child uses this device. */
  shared: boolean;
  onSettings: (s: Settings) => void;
  onToday: () => void;
  /** Free play of a lesson, at the step she is on. */
  onLesson: (lesson: Lesson) => void;
  /** The note for parents about a lesson. */
  onWhy: (lesson: Lesson) => void;
  onRace: () => void;
  onQuick: () => void;
  onSwitch: () => void;
  /** The parents' area, behind its check. */
  onParents: () => void;
}

/** Oreo has said hello since the app was opened. */
let greeted = false;

export function Home({ data, settings, today, shared, onSettings, onToday, onLesson, onWhy, onRace, onQuick, onSwitch, onParents }: HomeProps) {
  const done = doneToday(data, today);
  // Oreo says hello once, when the app is opened: coming back to this screen later, she is still.
  const [greet] = useState(() => !greeted);
  useEffect(() => {
    greeted = true;
  }, []);
  const plan = planToday(data.child, today);
  const silent = useVoiceSilent();
  const total = data.bones, crates = Math.floor(total / 100), boxes = Math.floor((total % 100) / 10), loose = total % 10;
  const fresh = plan.find((p) => p.kind === 'new');
  const freshTitle = fresh && 'slot' in fresh ? LESSON.get(fresh.slot.lesson)!.title : null;

  const toggleSound = () => {
    const soundOff = !settings.soundOff;
    onSettings({ ...settings, soundOff });
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
        {done ? <Oreo pose="sleeping" className="toppup" /> : <OreoAnim name="wave-hello" className="toppup" still={!greet} />}
      </div>
      <button type="button" className="whoami" onClick={onSwitch} disabled={!shared} aria-label={shared ? `${data.profile.nickname}. Change who is playing` : data.profile.nickname}>
        <FriendPicture friend={data.profile.picture} size={40} />
        <strong>{data.profile.nickname}</strong>
      </button>

      <div className="today">
        <div>
          <h2>Today</h2>
          <p data-testid="today-text">
            {done ? 'Today’s games are done. Well done! See you tomorrow.'
              : freshTitle ? <>{plan[0]!.kind === 'warm' ? 'A warm-up, then ' : 'Two rounds of '}<b>{freshTitle}</b>. About ten minutes.</>
              : 'A warm-up and a round to stay strong. About ten minutes.'}
          </p>
          <div className="trow">
            <button className={done ? 'next quiet' : 'next'} type="button" onClick={onToday}>
              {done ? 'Play again anyway' : 'Play today’s games'}
            </button>
            <button className="soundbtn" type="button" aria-pressed={!settings.soundOff} onClick={toggleSound}>
              {settings.soundOff ? 'Sound off' : 'Sound on'}
            </button>
          </div>
          {silent && <VoiceRetry />}
        </div>
        <div className="store">
          <div className="shelf" role="img" aria-label={`${total} bones`} data-testid="store">
            {Array.from({ length: crates }, (_, i) => <div key={`c${i}`} className="crate">100</div>)}
            {Array.from({ length: boxes }, (_, i) => (
              <div key={`b${i}`} className="bbox">{Array.from({ length: 10 }, (_, j) => <Bone key={j} />)}</div>
            ))}
            <div className="btray">
              {Array.from({ length: loose }, (_, j) => <Bone key={j} />)}
              <span className="empty">{Array.from({ length: 10 - loose }, (_, j) => <Bone key={j} />)}</span>
            </div>
          </div>
          <p className="storecap">
            {total ? (
              <>
                {crates ? `${plural(crates, 'crate', 'crates')} of a hundred, ` : ''}
                <b className="tt">{plural(boxes, 'box', 'boxes')} of ten</b> and <b className="oo">{plural(loose, 'bone', 'bones')}</b>.
                {' '}That is <Num n={total} /> bones!
              </>
            ) : 'Your bone store is empty. Win a bone every time you are right first go.'}
          </p>
        </div>
      </div>

      <h2>The path</h2>
      <p className="h2note" data-testid="free-note">{done ? 'Tap a stone you have passed to play it again.' : 'Free play opens when today’s games are done.'}</p>
      <Garden data={data} today={today} open={done} soundOff={settings.soundOff} onLesson={onLesson} onWhy={onWhy} />

      <Shelf tricks={tricksKnown(data)} awards={awardsWon(data)} soundOff={settings.soundOff} />

      <h2>Play together</h2>
      <ol className="stations">
        <li>
          <button className="station" type="button" disabled={!done} data-game="race" onClick={onRace}>
            <span className="no tag">2P</span>
            <span><strong>Race to 100</strong><span className="d">A board game for two players.</span></span>
          </button>
        </li>
        <li>
          <button className="station" type="button" disabled={!done || !quickOpen(data)} data-game="quick" onClick={onQuick}>
            <span className="no tag">GO</span>
            <span>
              <strong>Quick Paws</strong>
              <span className="d">{quickOpen(data) ? 'Ten fast questions. Beat your own time.' : 'Opens when Friends of ten and Tens and ones sums are mastered.'}</span>
            </span>
            {data.best > 0 && <span className="st"><small>Best: {data.best} s</small></span>}
          </button>
        </li>
      </ol>

      {done && (
        <>
          <h2>Number machine</h2>
          <p className="h2note">Press the buttons and watch the tens and ones change.</p>
          <Machine />
        </>
      )}

      <div className="grown">
        <button className="soundbtn" type="button" onClick={onParents}>For grown-ups</button>
        <p className="grownnote" data-testid="grown-note">Progress, settings, and why the app teaches this way.</p>
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
