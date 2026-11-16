import { useState } from 'react';
import { exportCode, importCode, newProfile, type Profile, type ProfileData, type Settings } from '../data/profile';
import { UNITS, playable } from '../engine/curriculum';
import { statusOf } from '../engine/rules';
import { lessonState, type Day } from '../engine/state';
import { FriendPicture } from '../ui/FriendPicture';
import { NOTES, SOURCES, STRENGTH_WORDS } from './notes';
import { minutesThisWeek, progressByUnit, skills, weekday } from './summary';

const FACTS: [number, number][] = [[6, 7], [7, 8], [8, 9], [6, 8], [7, 9], [6, 9], [8, 8], [7, 7]];

/**
 * A simple check that a grown-up is here: a times fact well beyond the lessons. Not security, a door a six year old
 * does not open by accident. It says what to do and why before it asks, and looks like a form, not like a lesson: no Oreo,
 * no big coloured buttons, ordinary small type.
 */
export function Gate({ onOpen, onHome }: { onOpen: () => void; onHome: () => void }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const [a, b] = FACTS[i]!;
  return (
    <section className="adult">
      <form
        className="adultcard" data-testid="gate"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(typed) === a * b) return onOpen();
          setWrong(true);
          setTyped('');
          setI((i + 1 + Math.floor(Math.random() * (FACTS.length - 1))) % FACTS.length);
        }}
      >
        <h1>For grown-ups</h1>
        <p data-testid="gate-why">To open this area, solve this sum. It keeps children out of the settings.</p>
        {wrong && <p className="adultnote" role="alert">That is not it. Try this one.</p>}
        <label>
          <span data-testid="gate-question">What is {a} × {b}?</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" autoComplete="off" aria-label="Your answer" />
        </label>
        <div className="adultrow">
          <button className="adultbtn main" type="submit" disabled={!typed}>Open</button>
          <button className="adultbtn" type="button" onClick={onHome}>Back to the game</button>
        </div>
      </form>
    </section>
  );
}

export interface ParentsProps {
  data: ProfileData;
  profiles: Profile[];
  settings: Settings;
  today: Day;
  onSettings: (s: Settings) => void;
  /** Saves a change to the child who is playing. */
  onSave: (d: ProfileData) => void;
  /** Adds a profile loaded from a code. */
  onAdopt: (d: ProfileData) => void;
  onRemove: (id: string) => void;
  onChoose: (id: string) => void;
  onAdd: () => void;
  onApproach: () => void;
  onHome: () => void;
}

export function Parents({ data, profiles, settings, today, onSettings, onSave, onAdopt, onRemove, onChoose, onAdd, onApproach, onHome }: ParentsProps) {
  const name = data.profile.nickname;
  const sk = skills(data);
  const week = minutesThisWeek(data.attempts, today);
  const total = week.reduce((a, b) => a + b.minutes, 0);
  const days = week.filter((d) => d.minutes > 0).length;
  const [again, setAgain] = useState(false);
  const [remove, setRemove] = useState(false);
  const [code, setCode] = useState('');
  const [pasted, setPasted] = useState('');
  const [loadMsg, setLoadMsg] = useState('');
  const list = (ls: { title: string }[]) => (ls.length ? ls.map((l) => l.title).join(', ') : 'None yet.');

  const load = (text: string) => {
    const d = importCode(text, today);
    if (!d) return setLoadMsg('That is not a profile code from this app.');
    onAdopt(d);
    setPasted('');
    setLoadMsg(`${d.profile.nickname} is loaded and is now the child who is playing.`);
  };

  return (
    <section className="parents" data-testid="parents">
      <div className="gbar"><button className="back" type="button" onClick={onHome}>← Home</button></div>
      <h1 className="ptitle"><FriendPicture friend={data.profile.picture} size={44} /> {name}: for grown-ups</h1>

      <div className="pcard" data-testid="p-week">
        <h2>This week</h2>
        <p>{total === 0 ? `${name} has not played in the last seven days.` : `About ${total} ${total === 1 ? 'minute' : 'minutes'} on ${days} ${days === 1 ? 'day' : 'days'}.`} Ten minutes on most days is what the app is built for.</p>
        <div className="week" role="img" aria-label={week.map((d) => `${weekday(d.day)} ${d.minutes} minutes`).join(', ')}>
          {week.map((d) => (
            <div key={d.day} className="wday">
              <span className="wbar" style={{ height: `${Math.min(48, d.minutes * 3)}px` }} />
              <span className="wnum">{d.minutes || '·'}</span>
              <span className="wname">{weekday(d.day)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pcard" data-testid="p-skills">
        <h2>Strong, weak and slow</h2>
        <dl className="skills">
          <dt>Strong</dt><dd data-testid="p-strong">{list(sk.strong)}</dd>
          <dt>Needs more practice</dt><dd data-testid="p-weak">{list(sk.weak)}</dd>
          <dt>Right, but slow</dt><dd data-testid="p-slow">{list(sk.slow)}</dd>
        </dl>
        <p className="h2note">The app works on the weak and slow ones by itself, in the round "to get stronger". Speed is never shown to {name}.</p>
      </div>

      <div className="pcard" data-testid="p-progress">
        <h2>Progress by unit</h2>
        <p className="h2note">Tap a lesson to read why it is built the way it is.</p>
        {progressByUnit(data).map(({ unit, built, mastered }) => (
          <div key={unit.id} className="punit" data-unit={unit.id}>
            <h3>
              {unit.stretch ? 'Stretch' : `Stage ${unit.stage}`}: {unit.title}
              <span className="pcount">{built ? `${mastered} of ${built} mastered` : 'not built yet'}{built < unit.lessons.length && built > 0 ? `, ${unit.lessons.length - built} more to come` : ''}</span>
            </h3>
            {unit.lessons.map((l) => {
              const st = lessonState(data.child, l.id), status = statusOf(data.child, l, today), note = NOTES[l.id];
              const where =
                status === 'coming' ? 'Not built yet'
                : status === 'mastered' ? (st.placed ? 'Known at the starting check' : `Mastered on ${st.mastered}`)
                : status === 'locked' ? 'Not open yet'
                : st.answers ? `Step ${Math.min(st.step, l.steps.length - 1) + 1} of ${l.steps.length}` : 'Not started';
              return (
                <details key={l.id} className="plesson" data-lesson={l.id}>
                  <summary><strong>{l.title}</strong><span>{where}</span></summary>
                  <p className="pskill">{l.skill}.</p>
                  {note && (
                    <p className="pnote">
                      {note.why}{' '}
                      <span className="psource">
                        Source: {SOURCES[note.source].url ? <a href={SOURCES[note.source].url} target="_blank" rel="noreferrer">{SOURCES[note.source].label}</a> : SOURCES[note.source].label}.{' '}
                        <b>{STRENGTH_WORDS[note.strength]}.</b>
                      </span>
                    </p>
                  )}
                  {playable(l) && st.answers > 0 && <p className="pskill">{st.answers} answers so far{st.due && st.mastered ? `; next review on ${st.due}` : ''}.</p>}
                </details>
              );
            })}
          </div>
        ))}
        <p className="h2note">{UNITS.flatMap((u) => u.lessons).filter(playable).length} of {UNITS.flatMap((u) => u.lessons).length} lessons are built so far.</p>
      </div>

      <div className="pcard">
        <h2>How to help</h2>
        <ul>
          <li><b>Play today’s games</b> is the main button: a short warm-up from what she already knows, two rounds of the next lesson, and one round on what she finds hardest. About ten minutes. Then stop. Short and daily works better than long and weekly.</li>
          <li>Sit with her when you can and ask <b>“How did you know?”</b>. Saying it in tens and ones is where it sticks.</li>
          <li>The app decides what comes next. A step is passed with five or six bones in a round; a lesson is mastered when its last step is passed on two different days, and it comes back for review after that.</li>
          <li>A bone means right first time. A paw means right after a hint or with the help picture. A wrong answer is always explained; let her read or hear it before she taps again.</li>
          <li>Praise what she did (“you filled the ten first”), not what she is.</li>
          <li>Free play, Race to 100 and the number machine open when today’s games are done. Race to 100 is made for the two of you.</li>
        </ul>
        <button className="soundbtn" type="button" onClick={onApproach}>How this app teaches, and the sources</button>
      </div>

      <div className="pcard" data-testid="p-settings">
        <h2>Settings</h2>
        <div className="prow">
          <span>The voice</span>
          <button className="soundbtn" type="button" aria-pressed={!settings.soundOff} onClick={() => onSettings({ ...settings, soundOff: !settings.soundOff })}>{settings.soundOff ? 'Sound off' : 'Sound on'}</button>
        </div>
        <div className="prow">
          <span>{name}’s stage</span>
          <span className="stages">
            {([1, 2] as const).map((s) => (
              <button key={s} type="button" className="stagebtn small" aria-pressed={data.profile.stage === s} onClick={() => onSave({ ...data, profile: { ...data.profile, stage: s } })}>Stage {s}</button>
            ))}
          </span>
        </div>
        <label className="prow">
          <span>Money in the money lessons</span>
          <select value={settings.currency} onChange={() => onSettings({ ...settings, currency: 'KES' })}><option value="KES">Kenyan shillings</option></select>
        </label>
        <div className="prow">
          <span>Oreo is introduced as “Star’s sister”<small>Star is the dog of the first child who used this app. Leave off unless you know Star.</small></span>
          <button className="soundbtn" type="button" aria-pressed={settings.starsSister} data-testid="stars-sister" onClick={() => onSettings({ ...settings, starsSister: !settings.starsSister })}>{settings.starsSister ? 'On' : 'Off'}</button>
        </div>
        <div className="prow">
          <span>Start again<small>Deletes {name}’s progress, bones and treasures on this device. The nickname and picture stay.</small></span>
          {again ? (
            <span className="trow">
              <button className="soundbtn danger" type="button" onClick={() => { onSave(newProfile(data.profile.id, name, data.profile.picture, data.profile.stage, today)); setAgain(false); }}>Yes, delete {name}’s progress</button>
              <button className="soundbtn" type="button" onClick={() => setAgain(false)}>No, keep it</button>
            </span>
          ) : <button className="soundbtn" type="button" onClick={() => setAgain(true)}>Start again</button>}
        </div>
      </div>

      <div className="pcard" data-testid="p-children">
        <h2>Children on this device</h2>
        <div className="who small">
          {profiles.map((p) => (
            <button key={p.id} type="button" className="whobtn" aria-pressed={p.id === data.profile.id} onClick={() => onChoose(p.id)}>
              <FriendPicture friend={p.picture} size={48} /><strong>{p.nickname}</strong>
            </button>
          ))}
        </div>
        <div className="trow">
          <button className="soundbtn" type="button" onClick={onAdd}>Add a child</button>
          {remove ? (
            <>
              <button className="soundbtn danger" type="button" onClick={() => { onRemove(data.profile.id); setRemove(false); }}>Yes, remove {name} and everything saved</button>
              <button className="soundbtn" type="button" onClick={() => setRemove(false)}>No</button>
            </>
          ) : <button className="soundbtn" type="button" onClick={() => setRemove(true)}>Remove {name}</button>}
        </div>
        <p className="h2note">Saved on this device only: a nickname, a picture, the stage and how each child gets on. No account, no email, nothing sent anywhere.</p>
      </div>

      <div className="pcard" data-testid="p-move">
        <h2>Move {name} to another device</h2>
        <p>Make a code here, then paste it on the other device under “Load a profile”. It holds the progress, the bones and the treasures.</p>
        <div className="trow">
          <button className="soundbtn" type="button" onClick={() => setCode(exportCode(data))}>Make the code</button>
          {code && <button className="soundbtn" type="button" onClick={() => void navigator.clipboard?.writeText(code)}>Copy</button>}
          {code && <a className="soundbtn" download={`${name}-tens-and-ones.txt`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(code)}`}>Save as a file</a>}
        </div>
        {code && <textarea readOnly value={code} rows={4} aria-label="The profile code" data-testid="code" onFocus={(e) => e.currentTarget.select()} />}
        <h3>Load a profile</h3>
        <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={3} aria-label="Paste a profile code" placeholder="Paste the code here" data-testid="paste" />
        <div className="trow">
          <button className="soundbtn" type="button" disabled={!pasted.trim()} onClick={() => load(pasted)}>Load</button>
          <label className="soundbtn filebtn">
            Or choose the saved file
            <input type="file" accept=".txt,text/plain" onChange={(e) => { const f = e.target.files?.[0]; if (f) void f.text().then(load); e.target.value = ''; }} />
          </label>
        </div>
        {loadMsg && <p className="h2note" role="status" data-testid="load-msg">{loadMsg}</p>}
      </div>
    </section>
  );
}
