import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GAMES, GAME_INFO, type GameProps } from '../games/registry';
import { LEVELS, PATH, makeQuestion, type GameId } from '../maths/questions';
import { dice } from '../maths/random';
import { addAttempt } from '../session/attempts';
import { answered, finishToday, nextSlot, quickFinished, roundFinished, roundWords, type Segment, type Slot } from '../session/progress';
import type { Saved } from '../session/store';
import { wording } from '../speech/catalogue';
import { chime } from '../speech/chime';
import type { Piece } from '../speech/script';
import { PRAISE, PRAISE_AFTER_HELP } from '../speech/sentences';
import { Bone, Oreo, Paw, preloadPoses, type Pose } from '../ui/Oreo';
import type { RoundApi } from './round';
import { speak, useVoiceSilent, useVoiceSpeaking, voice } from './voice';

const d = dice(Math.random);
const PRAISES = Object.keys(PRAISE);
const PRAISES_AFTER_HELP = Object.keys(PRAISE_AFTER_HELP);
/** What a remark under the question is: the reaction to an answer, or an explanation along the way. */
type Remark = 'right' | 'wrong' | 'note-ok' | 'note-hint';
const POSE: Record<Remark, Pose> = { right: 'happy', wrong: 'not-yet', 'note-ok': 'pointing', 'note-hint': 'pointing' };
const LOOK: Record<Remark, 'ok' | 'hint'> = { right: 'ok', wrong: 'hint', 'note-ok': 'ok', 'note-hint': 'hint' };
const todayString = () => new Date().toDateString();

interface Asked {
  slot: Slot;
  /** Counts questions, so each one gets a fresh game component. */
  no: number;
  q: unknown;
}
const draw = (seg: Segment, last: GameId | null, no: number): Asked => {
  const slot = seg.kind === 'game' ? { id: seg.id, level: seg.level } : nextSlot(seg.pool, last, d);
  return { slot, no, q: makeQuestion(slot.id, slot.level, Math.random) };
};

export interface PlayProps {
  seg: Segment;
  /** Part of today's games. */
  today: boolean;
  /** More parts of today's games follow this one. */
  more: boolean;
  saved: Saved;
  onSave: (s: Saved) => void;
  onHome: () => void;
  /** Go on to the next part of today's games. */
  onNext: () => void;
  /** Play this game again, or at another level. */
  onGame: (id: GameId, level?: number) => void;
  /** Play Quick Paws again. */
  onQuick: () => void;
}

/** One round: a row of questions, a bone or a paw for each, then what the round earned. */
export function Play({ seg, today, more, saved, onSave, onHome, onNext, onGame, onQuick }: PlayProps) {
  const [asked, setAsked] = useState(() => draw(seg, null, 0));
  const [results, setResults] = useState<boolean[]>([]);
  const [over, setOver] = useState(false);
  /** `no` counts remarks, so the puppy reacts afresh to each one. */
  const [fb, setFbState] = useState<{ msg: ReactNode; kind: Remark; no: number } | null>(null);
  const setFb = useCallback((f: { msg: ReactNode; kind: Remark } | null) => setFbState((old) => (f ? { ...f, no: (old?.no ?? 0) + 1 } : null)), []);
  const [end, setEnd] = useState<{ note: string; seconds?: number } | null>(null);
  const silent = useVoiceSilent();
  const speaking = useVoiceSpeaking();
  useEffect(() => preloadPoses(), []);

  // What happened on the current question. Kept out of state: it changes nothing on screen by itself.
  const now = useRef({ clean: true, misses: 0, helped: false, t0: 0, say: [] as Piece[] });
  // The clock for response time starts when the question is on screen. It is never shown.
  useEffect(() => {
    now.current.t0 = performance.now();
  }, [asked.no]);
  // The latest saved state and whether the question is closed, for handlers that outlive a render.
  const live = useRef({ saved, over: false });
  useEffect(() => {
    live.current.saved = saved;
  }, [saved]);

  const say = useCallback((pieces: readonly Piece[], delay = 0, force = false) => {
    if (force || !live.current.saved.soundOff) speak(pieces, delay);
  }, []);

  const round: RoundApi = useMemo(() => ({
    get over() {
      return live.current.over;
    },
    ask(pieces) {
      now.current.say = pieces;
      say(pieces);
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
      now.current.helped = true;
    },
    wrong(msg, spoken) {
      now.current.clean = false;
      now.current.misses++;
      setFb({ msg, kind: 'wrong' });
      if (spoken) say(spoken);
    },
    win(msg, spoken) {
      if (live.current.over) return;
      const { clean, misses, helped, t0 } = now.current;
      const { slot } = asked;
      live.current.over = true;
      setOver(true);
      setResults((r) => [...r, clean]);
      const s = live.current.saved;
      live.current.saved = {
        ...s,
        progress: answered(s.progress, seg.kind, slot.id, clean),
        attempts: addAttempt(s.attempts, {
          game: slot.id, level: slot.level, kind: seg.kind, clean, misses, helped,
          ms: Math.round(performance.now() - t0), at: new Date().toISOString(),
        }),
      };
      onSave(live.current.saved);
      setFb({ msg: <>Woof! {msg}</>, kind: 'right' });
      if (!s.soundOff) chime();
      // Quick Paws moves straight on; everywhere else the answer is praised and explained aloud.
      if (seg.kind !== 'quick') say([d.pick(clean ? PRAISES : PRAISES_AFTER_HELP), ...(spoken ?? [])], 0.3);
    },
  }), [asked, onSave, say, seg.kind, setFb]);

  const last = results.length >= seg.n;

  // Quick Paws: the clock starts with the first question, and each right answer moves on by itself.
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const goOn = useRef<() => void>(() => {});
  useEffect(() => {
    if (seg.kind !== 'quick' || !over) return;
    const t = setTimeout(() => goOn.current(), 700);
    return () => clearTimeout(t);
  }, [seg.kind, over, results.length]);
  const bones = results.filter(Boolean).length;

  const next = () => {
    if (!last) {
      now.current = { clean: true, misses: 0, helped: false, t0: 0, say: [] };
      live.current.over = false;
      setOver(false);
      setFb(null);
      setAsked(draw(seg, asked.slot.id, asked.no + 1));
      return;
    }
    // The end of the round: levelling, and today's games are done when this was their last part.
    let progress = saved.progress;
    let note = '';
    let noteSay: Piece[] | undefined;
    let seconds: number | undefined;
    if (seg.kind === 'game') ({ progress, note } = roundFinished(progress, seg.id, seg.level, bones, seg.n));
    if (seg.kind === 'quick') {
      // The time is worked out at the end and shown once, against her own best. It was never on screen before.
      seconds = Math.round((performance.now() - started.current) / 1000);
      ({ progress, note, say: noteSay } = quickFinished(progress, bones, seconds, seg.n));
    }
    const lastToday = today && !more;
    if (lastToday) progress = finishToday(progress, todayString());
    onSave({ ...saved, progress });
    const w = roundWords(bones, seg.n, lastToday, more);
    voice.stop();
    say([w.head, ...(noteSay ?? [note]), w.tail].filter(Boolean), 0.2);
    setFb(null);
    setEnd({ note, seconds });
  };

  // Oreo reacts to what just happened. With a question open and nothing said yet she listens
  // while the voice reads it, then thinks, and stays as she is until the child answers.
  const pose: Pose = fb ? POSE[fb.kind] : speaking ? 'listening' : 'thinking';

  useEffect(() => {
    goOn.current = next;
  });

  const title = seg.kind === 'quick' ? 'Quick Paws' : seg.kind === 'game' ? `Game ${PATH.indexOf(seg.id) + 1}: ${GAME_INFO[seg.id].name}` : 'Warm-up: a mix of games you know';
  const Game = GAMES[asked.slot.id] as React.ComponentType<GameProps<GameId>> | undefined;

  return (
    <section>
      <div className="gbar">
        <button className="back" type="button" onClick={() => { voice.stop(); onHome(); }}>← All games</button>
        {seg.kind === 'game' && (
          <div className="levels" role="group" aria-label="Level">
            Level
            {Array.from({ length: LEVELS[seg.id] }, (_, i) => (
              <button key={i} type="button" aria-pressed={i + 1 === seg.level} onClick={() => onGame(seg.id, i + 1)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
      <p className="gtitle">{title}</p>
      <div className="dots" role="img" aria-label={`${bones} bones, ${results.length - bones} paws, ${seg.n} questions`} data-testid="dots">
        {Array.from({ length: seg.n }, (_, i) =>
          i < results.length
            ? results[i] ? <span key={i} className="star"><Bone /></span> : <span key={i} className="done"><Paw /></span>
            : <span key={i} className={i === results.length ? 'now' : undefined}>○</span>,
        )}
      </div>

      {end ? (
        <End
          seg={seg} bones={bones} note={end.note} seconds={end.seconds} lastToday={today && !more} more={more}
          onHome={onHome} onNext={onNext} onAgain={() => (seg.kind === 'game' ? onGame(seg.id) : seg.kind === 'quick' ? onQuick() : onHome())}
        />
      ) : (
        <div className="card game">
          <button className="say" type="button" aria-label="Read it to me" hidden={silent} onClick={() => say(now.current.say, 0, true)}>🔊</button>
          {Game ? <Game key={asked.no} q={asked.q as never} level={asked.slot.level} round={round} /> : null}
          <div className="cheer">
            <Oreo key={pose} pose={pose} />
            <p className={fb ? `fb ${LOOK[fb.kind]}` : 'fb'} aria-live="polite" data-testid="feedback">{fb?.msg}</p>
          </div>
          {silent && <VoiceRetry />}
          {over && !last && seg.kind !== 'quick' && results.length % 3 === 0 && (
            <p className="gprompt">For the grown-up: ask “How did you know?”</p>
          )}
          {over && seg.kind !== 'quick' && <button className="next" type="button" onClick={next}>{last ? 'Finish' : 'Next'}</button>}
        </div>
      )}
    </section>
  );
}

/** Shown when the voice pack did not load. The game works without it; the words are on screen. */
export function VoiceRetry() {
  return (
    <p className="voiceretry">
      The voice did not load. <button type="button" className="ghostbtn" onClick={() => void voice.retry()}>Try again</button>
    </p>
  );
}

function End({ seg, bones, note, seconds, lastToday, more, onHome, onNext, onAgain }: {
  seg: Segment; bones: number; note: string; seconds?: number; lastToday: boolean; more: boolean;
  onHome: () => void; onNext: () => void; onAgain: () => void;
}) {
  const w = roundWords(bones, seg.n, lastToday, more);
  const lines = [bones ? `Oreo got ${bones === 1 ? '1 bone' : `${bones} bones`}.` : '', note && wording(note), w.tail && wording(w.tail)];
  return (
    <div className="card game" data-testid="end">
      <p className="prompt">{wording(w.head)}</p>
      <div className="stage">
        <Oreo pose={bones >= seg.n - 1 ? 'celebrating' : 'proud'} className="endpup" />
        {seconds !== undefined && <p className="timebig" data-testid="time">{seconds} seconds</p>}
        <div className="endstars" role="img" aria-label={`${bones} bones out of ${seg.n}`}>
          {Array.from({ length: bones }, (_, i) => <Bone key={i} />)}
          <span className="off">{Array.from({ length: seg.n - bones }, (_, i) => <Bone key={i} />)}</span>
        </div>
        <p className="sub">{lines.filter(Boolean).join(' ')}</p>
      </div>
      <div className="controls">
        {more ? (
          <>
            <button className="ctl o" type="button" onClick={onNext}>Keep going</button>
            <button className="ctl brk" type="button" onClick={onHome}>Stop for today</button>
          </>
        ) : lastToday ? (
          <button className="ctl o" type="button" onClick={onHome}>Back to the start</button>
        ) : (
          <>
            <button className="ctl o" type="button" onClick={onAgain}>Play again</button>
            <button className="ctl brk" type="button" onClick={onHome}>All games</button>
          </>
        )}
      </div>
    </div>
  );
}
