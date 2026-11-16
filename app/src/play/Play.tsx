import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { today as todayNow } from '../app/useData';
import type { ProfileData } from '../data/profile';
import { applyRound, finishToday, lessonOfActivity, type Given, type RoundKind } from '../engine/apply';
import { LESSON, type Activity, type Lesson } from '../engine/curriculum';
import { CONFIG } from '../engine/config';
import { looksLikeGuessing, type RoundOutcome } from '../engine/rules';
import type { Slot } from '../engine/today';
import { lessonState } from '../engine/state';
import stone from '../art/garden/stepping-stone.webp';
import { nextEarned, nextGoal, paws, type Goal } from '../engine/rewards';
import { GAMES, type GameProps } from '../games/registry';
import { goalLine, PawRow } from './Reward';
import { makeQuestion, type GameId } from '../maths/questions';
import { dice } from '../maths/random';
import { wording } from '../speech/catalogue';
import { chime } from '../speech/chime';
import type { Piece } from '../speech/script';
import { PRAISE, PRAISE_AFTER_HELP } from '../speech/sentences';
import { Bone, Oreo, OreoAnim, Paw, preloadPoses, type Pose } from '../ui/Oreo';
import { quickFinished } from './quick';
import type { RoundApi } from './round';
import { speak, useVoiceSilent, useVoiceSpeaking, voice, warmFor } from './voice';

const d = dice(Math.random);
const PRAISES = Object.keys(PRAISE);
const PRAISES_AFTER_HELP = Object.keys(PRAISE_AFTER_HELP);

/** A round to play. The engine decides which; the screen only plays it and hands the answers back. */
export type Round =
  /** A round of one lesson at one step: today's "new" or "stronger". */
  | { kind: 'new' | 'stronger'; n: number; slot: Slot; counts: boolean }
  /** Mixed review, or the starting check: each question from one of the slots. */
  | { kind: 'warm' | 'check'; n: number; slots: Slot[] }
  /** Free play of a lesson step. It moves the rating and nothing else. */
  | { kind: 'free'; n: number; slot: Slot }
  /** Questions straight from game levels: Quick Paws, and the tester's door. */
  | { kind: 'quick' | 'try'; n: number; from: Activity[] };

interface Asked {
  lesson: string;
  step: number;
  act: Activity;
  /** Counts questions, so each one gets a fresh game component. */
  no: number;
  q: unknown;
}

function draw(round: Round, last: Asked | null, no: number): Asked {
  let lesson: string, step: number, act: Activity;
  if ('from' in round) {
    do act = d.pick(round.from);
    while (round.from.length > 1 && last && act.game === last.act.game);
    const home = lessonOfActivity(act);
    lesson = home?.lesson.id ?? 's1-see';
    step = home?.step ?? 0;
  } else {
    let slot: Slot;
    if ('slot' in round) slot = round.slot;
    else if (round.kind === 'check') slot = round.slots[no % round.slots.length]!;
    else {
      // The mix: any lesson of the warm-up, but not the same one twice running.
      do slot = d.pick(round.slots);
      while (round.slots.length > 1 && last && slot.lesson === last.lesson);
    }
    ({ lesson, step } = slot);
    act = d.pick(LESSON.get(lesson)!.steps[step]!.from);
  }
  return { lesson, step, act, no, q: makeQuestion(act.game, act.level, Math.random, act.variant) };
}

/** What a remark under the question is: the reaction to an answer, or an explanation along the way. */
type Remark = 'right' | 'wrong' | 'note-ok' | 'note-hint';
const POSE: Record<Remark, Pose> = { right: 'happy', wrong: 'not-yet', 'note-ok': 'pointing', 'note-hint': 'pointing' };
const LOOK: Record<Remark, 'ok' | 'hint'> = { right: 'ok', wrong: 'hint', 'note-ok': 'ok', 'note-hint': 'hint' };

/** What Oreo says about the step or the lesson at the end of a round, as a sentence id. */
const OUTCOME: Record<RoundOutcome['kind'], string> = {
  up: 'that-step-is-done-the-next', passed: 'you-did-the-last-step-do', mastered: 'you-know-this-now-oreo-is', down: 'that-was-hard-next-time-the', stay: '',
};
const outcomeSentence = (o: RoundOutcome | undefined) => (!o ? '' : o.kind === 'up' && o.skipped ? 'every-one-right-first-time-you' : OUTCOME[o.kind]);

export interface PlayProps {
  round: Round;
  data: ProfileData;
  soundOff: boolean;
  /**
   * The round is finished: here is the child's data with it applied. Returns what comes next,
   * so the last screen can say so. A round that is left early never gets here.
   */
  onFinish: (data: ProfileData, outcome: RoundOutcome | undefined) => { more: boolean; lastToday: boolean };
  onHome: () => void;
  /** Go on to the next part of today's games. */
  onNext: () => void;
  /** Play the same kind of round again (free play and Quick Paws). */
  onAgain: () => void;
}

/** One round: a row of questions, a bone or a paw for each, then what the round earned. */
export function Play({ round, data, soundOff, onFinish, onHome, onNext, onAgain }: PlayProps) {
  const [asked, setAsked] = useState(() => draw(round, null, 0));
  const [results, setResults] = useState<boolean[]>([]);
  const [over, setOver] = useState(false);
  /** `no` counts remarks, so Oreo reacts afresh to each one. */
  const [fb, setFbState] = useState<{ msg: ReactNode; kind: Remark; no: number } | null>(null);
  const setFb = useCallback((f: { msg: ReactNode; kind: Remark } | null) => setFbState((old) => (f ? { ...f, no: (old?.no ?? 0) + 1 } : null)), []);
  const [end, setEnd] = useState<EndOf | null>(null);
  const silent = useVoiceSilent();
  const speaking = useVoiceSpeaking();
  useEffect(() => preloadPoses(), []);
  // The voice comes in packs by lesson family: fetch the ones this round will speak from before the first question needs them.
  useEffect(() => {
    if (soundOff) return;
    const acts = 'from' in round ? round.from : ('slot' in round ? [round.slot] : round.slots).flatMap((s) => LESSON.get(s.lesson)!.steps[s.step]!.from);
    warmFor(acts.map((a) => a.game));
  }, [round, soundOff]);

  // What happened on the current question, and every answer of the round so far. Nothing is saved
  // until the round is finished: leaving early counts for nothing.
  const now = useRef({ clean: true, misses: 0, hint: false, t0: 0, say: [] as Piece[], over: false, taps: [] as number[], lastTap: 0 });
  /** She is tapping without looking: the answers pause, and this question will not count. */
  const [paused, setPaused] = useState(false);
  const given = useRef<Given[]>([]);
  useEffect(() => {
    now.current.t0 = performance.now();
  }, [asked.no]);

  const say = useCallback((pieces: readonly Piece[], delay = 0, force = false) => {
    if (force || !soundOff) speak(pieces, delay);
  }, [soundOff]);

  const api: RoundApi = useMemo(() => ({
    get over() {
      return now.current.over;
    },
    ask(pieces) {
      now.current.say = pieces;
      say(pieces);
    },
    started() {
      now.current.t0 = performance.now();
    },
    note(msg, kind, spoken) {
      setFb({ msg, kind: kind === 'ok' ? 'note-ok' : 'note-hint' });
      if (spoken !== false && spoken) say(spoken);
    },
    clear() {
      setFb(null);
    },
    helped() {
      now.current.clean = false;
      now.current.hint = true;
    },
    wrong(msg, spoken) {
      now.current.clean = false;
      now.current.misses++;
      const at = performance.now(), taps = now.current.taps;
      taps.push(at - (now.current.lastTap || now.current.t0));
      now.current.lastTap = at;
      if (round.kind !== 'quick' && looksLikeGuessing(taps)) {
        // Fast wrong taps in a row are guesses. Oreo asks her to look; this question is put aside.
        now.current.over = true;
        setPaused(true);
        setFb({ msg: wording('take-a-moment-look-again-before'), kind: 'note-hint' });
        voice.stop();
        say(['take-a-moment-look-again-before']);
        return;
      }
      setFb({ msg, kind: 'wrong' });
      if (spoken) say(spoken);
    },
    win(msg, spoken) {
      if (now.current.over) return;
      const { clean, misses, hint, t0 } = now.current;
      now.current.over = true;
      setOver(true);
      setResults((r) => [...r, clean]);
      given.current.push({ lesson: asked.lesson, step: asked.step, clean, misses, hint, ms: Math.round(performance.now() - t0), at: new Date().toISOString() });
      setFb({ msg: <>Woof! {msg}</>, kind: 'right' });
      if (!soundOff) chime();
      // Quick Paws moves straight on; everywhere else the answer is praised and explained aloud.
      if (round.kind !== 'quick') say([d.pick(clean ? PRAISES : PRAISES_AFTER_HELP), ...(spoken ?? [])], 0.3);
    },
  }), [asked, round.kind, say, setFb, soundOff]);

  const last = results.length >= round.n;
  const bones = results.filter(Boolean).length;

  // Quick Paws: the clock starts with the first question, and each right answer moves on by itself.
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const goOn = useRef<() => void>(() => {});
  useEffect(() => {
    if (round.kind !== 'quick' || !over) return;
    const t = setTimeout(() => goOn.current(), 700);
    return () => clearTimeout(t);
  }, [round.kind, over, results.length]);

  // After the pause a fresh question comes. The guessed one counts neither way.
  useEffect(() => {
    if (!paused) return;
    const t = setTimeout(() => {
      now.current = { clean: true, misses: 0, hint: false, t0: 0, say: [], over: false, taps: [], lastTap: 0 };
      setPaused(false);
      setFb(null);
      setAsked((a) => draw(round, a, a.no + 1));
    }, CONFIG.guess.pauseMs);
    return () => clearTimeout(t);
  }, [paused, round, setFb]);

  const next = () => {
    if (!last) {
      now.current = { clean: true, misses: 0, hint: false, t0: 0, say: [], over: false, taps: [], lastTap: 0 };
      setOver(false);
      setFb(null);
      setAsked(draw(round, asked, asked.no + 1));
      return;
    }
    // The end of the round: only now is anything saved.
    const kind: RoundKind = round.kind === 'quick' || round.kind === 'try' ? 'free' : round.kind;
    const counts = round.kind === 'new' || (round.kind === 'stronger' && round.counts);
    const applied = applyRound(data, kind, counts, given.current, todayNow());
    let out = applied.data;
    let note = outcomeSentence(applied.outcome);
    let noteSay: Piece[] = note ? [note] : [];
    let seconds: number | undefined;
    if (round.kind === 'quick') {
      // The time is worked out at the end and shown once, against her own best. It was never on screen before.
      seconds = Math.round((performance.now() - started.current) / 1000);
      const q = quickFinished(data.best, bones, seconds, round.n);
      out = { ...out, best: q.best };
      note = q.note;
      noteSay = q.say;
    }
    const { more, lastToday } = onFinish(out, applied.outcome);
    const head = round.kind === 'check' ? 'now-i-know-where-to-start' : headOf(bones, round.n, lastToday);
    const tail = lastToday ? 'time-to-stop-see-you-tomorrow' : more ? 'ready-for-the-next-one' : '';
    voice.stop();
    say([head, ...noteSay, tail].filter(Boolean), 0.2);
    setFb(null);
    // What she sees at the end: the stone that changed, and how far she is from the next reward.
    const after = lastToday ? finishToday(out, todayNow()) : out;
    const single = 'slot' in round ? LESSON.get(round.slot.lesson)! : null;
    const moved = single && applied.outcome && ['up', 'passed', 'mastered'].includes(applied.outcome.kind);
    const change = single && moved ? { lesson: single, before: stepsDone(data, single), after: stepsDone(out, single), mastered: applied.outcome!.kind === 'mastered' } : null;
    setEnd({ note, bones, seconds, more, lastToday, change, goal: nextGoal(after), owed: nextEarned(after) !== null, fresh: Math.max(0, paws(out) - paws(data)) });
  };
  useEffect(() => {
    goOn.current = next;
  });

  // Oreo reacts to what just happened. With a question open and nothing said yet she listens
  // while the voice reads it, then thinks, and stays as she is until the child answers.
  const pose: Pose = fb ? POSE[fb.kind] : speaking ? 'listening' : 'thinking';
  const title =
    round.kind === 'quick' ? 'Quick Paws'
    : round.kind === 'warm' ? 'Warm-up: a mix of what you know'
    : round.kind === 'check' ? 'Let’s see what you know'
    : LESSON.get(asked.lesson)!.title;
  // The first question ever of a lesson, in a round of that lesson: the game may show how it goes before it asks.
  const first = asked.no === 0 && round.kind !== 'check' && round.kind !== 'warm' && round.kind !== 'quick' && lessonState(data.child, asked.lesson).answers === 0;
  const Game = GAMES[asked.act.game] as React.ComponentType<GameProps<GameId>> | undefined;

  return (
    <section>
      <div className="gbar">
        <button className="back" type="button" onClick={() => { voice.stop(); onHome(); }}>← Home</button>
      </div>
      <p className="gtitle" data-testid="title">{title}</p>
      <div className="dots" role="img" aria-label={`${bones} bones, ${results.length - bones} paws, ${round.n} questions`} data-testid="dots">
        {Array.from({ length: round.n }, (_, i) =>
          i < results.length
            ? results[i] ? <span key={i} className="star"><Bone /></span> : <span key={i} className="done"><Paw /></span>
            : <span key={i} className={i === results.length ? 'now' : undefined}>○</span>,
        )}
      </div>

      {end ? (
        <End round={round} end={end} onHome={onHome} onNext={onNext} onAgain={onAgain} />
      ) : (
        <div className="card game" data-lesson={asked.lesson} data-step={asked.step} data-paused={paused || undefined} inert={paused}>
          <button className="say" type="button" aria-label="Read it to me" hidden={silent} onClick={() => say(now.current.say, 0, true)}>🔊</button>
          {Game ? <Game key={asked.no} q={asked.q as never} level={asked.act.level} round={api} first={first} /> : null}
          <div className="cheer">
            {/* A right answer closes the question: only then does she wag, once. While it is open she is a still picture. */}
            {fb?.kind === 'right' ? <OreoAnim key={`right-${fb.no}`} name="wag-happy" /> : <Oreo key={pose} pose={pose} />}
            <p className={fb ? `fb ${LOOK[fb.kind]}` : 'fb'} aria-live="polite" data-testid="feedback">{fb?.msg}</p>
          </div>
          {silent && <VoiceRetry />}
          {over && !last && round.kind !== 'quick' && results.length % 3 === 0 && (
            <p className="gprompt">For the grown-up: ask “How did you know?”</p>
          )}
          {over && round.kind !== 'quick' && <button className="next" type="button" onClick={next}>{last ? 'Finish' : 'Next'}</button>}
        </div>
      )}
    </section>
  );
}

const headOf = (bones: number, n: number, lastToday: boolean) =>
  lastToday ? 'all-done-for-today' : bones >= n - 1 ? 'brilliant' : bones >= n / 2 ? 'well-done' : 'good-trying';

/** Shown when the voice pack did not load. The game works without it; the words are on screen. */
export function VoiceRetry() {
  return (
    <p className="voiceretry">
      The voice did not load. <button type="button" className="ghostbtn" onClick={() => void voice.retry()}>Try again</button>
    </p>
  );
}

/** The steps of a lesson she has done, as its stone shows them: all of them once the last one is passed. */
const stepsDone = (d: ProfileData, l: Lesson): number => {
  const st = lessonState(d.child, l.id);
  return st.mastered || st.passedOn.length ? l.steps.length : Math.min(st.step, l.steps.length);
};

interface EndOf {
  note: string; bones: number; seconds?: number; more: boolean; lastToday: boolean;
  /** The stone of the lesson this round was about, when the round moved it: its steps before and after. */
  change: { lesson: Lesson; before: number; after: number; mastered: boolean } | null;
  /** What she is nearest to earning now, and whether she has just earned something (its card comes next). */
  goal: Goal | null;
  owed: boolean;
  /** The paws this round won. */
  fresh: number;
}

function End({ round, end, onHome, onNext, onAgain }: {
  round: Round;
  end: EndOf;
  onHome: () => void; onNext: () => void; onAgain: () => void;
}) {
  const { bones, note, seconds, more, lastToday } = end;
  const check = round.kind === 'check';
  const head = check ? 'now-i-know-where-to-start' : headOf(bones, round.n, lastToday);
  const tail = lastToday ? 'time-to-stop-see-you-tomorrow' : more ? 'ready-for-the-next-one' : '';
  const lines = [!check && bones ? `Oreo got ${bones === 1 ? '1 bone' : `${bones} bones`}.` : '', note && wording(note), tail && wording(tail)];
  const again = round.kind === 'free' || round.kind === 'quick' || round.kind === 'try';
  return (
    <div className="card game" data-testid="end">
      <p className="prompt">{wording(head)}</p>
      <div className="stage">
        {/* A lesson mastered or a nearly perfect round: she jumps. Any other round: she is proud, and her tail wags. */}
        <div className="endrow">
          <OreoAnim name={!check && (bones >= round.n - 1 || end.change?.mastered) ? 'hop-celebrating' : 'wag-proud'} className="endpup" />
          {/* The stone that changed, shown changing: a step filled in, or the paw of a lesson mastered. */}
          {end.change && (
            <div className="endstone" data-testid="endstone" data-lesson={end.change.lesson.id} data-before={end.change.before} data-after={end.change.after} data-mastered={end.change.mastered || undefined}>
              <span className="stonepic">
                <img src={stone} alt="" draggable={false} />
                <span className="mark">
                  {end.change.mastered ? <span className="pawin"><Paw /></span> : (
                    <span className="pips">{end.change.lesson.steps.map((_, i) => <i key={i} className={i < end.change!.after ? (i >= end.change!.before ? 'on new' : 'on') : undefined} />)}</span>
                  )}
                </span>
              </span>
              <strong>{end.change.lesson.title}</strong>
            </div>
          )}
        </div>
        {seconds !== undefined && <p className="timebig" data-testid="time">{seconds} seconds</p>}
        {!check && (
          <div className="endstars" role="img" aria-label={`${bones} bones out of ${round.n}`}>
            {Array.from({ length: bones }, (_, i) => <Bone key={i} />)}
            <span className="off">{Array.from({ length: round.n - bones }, (_, i) => <Bone key={i} />)}</span>
          </div>
        )}
        <p className="sub">{lines.filter(Boolean).join(' ')}</p>
        {/* How far she is from the next reward: a row of paws filling up. */}
        {!check && round.kind !== 'quick' && (end.owed ? (
          <p className="endgoal" data-testid="endgoal" data-owed="true">Oreo has something for you!</p>
        ) : end.goal && (
          <p className="endgoal" data-testid="endgoal"><PawRow goal={end.goal} fresh={end.goal.kind === 'treasure' ? Math.min(end.fresh, end.goal.done) : 0} /> {goalLine(end.goal)}</p>
        ))}
      </div>
      <div className="controls">
        {more ? (
          <>
            <button className="ctl go" type="button" onClick={onNext}>Keep going</button>
            <button className="ctl brk" type="button" onClick={onHome}>Stop for today</button>
          </>
        ) : again ? (
          <>
            <button className="ctl go" type="button" onClick={onAgain}>Play again</button>
            <button className="ctl brk" type="button" onClick={onHome}>Home</button>
          </>
        ) : (
          <button className="ctl go" type="button" onClick={onHome}>Back to the start</button>
        )}
      </div>
    </div>
  );
}
