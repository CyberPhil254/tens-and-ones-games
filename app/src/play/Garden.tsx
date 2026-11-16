import { useRef, useState } from 'react';
import bush from '../art/garden/bush.webp';
import fence from '../art/garden/fence.webp';
import kennel from '../art/garden/kennel.webp';
import signpost from '../art/garden/signpost.webp';
import stone from '../art/garden/stepping-stone.webp';
import ball from '../art/garden/treasure-ball.webp';
import bandana from '../art/garden/treasure-bandana.webp';
import bed from '../art/garden/treasure-bed.webp';
import bowl from '../art/garden/treasure-bowl.webp';
import kennelToy from '../art/garden/treasure-kennel.webp';
import rope from '../art/garden/treasure-rope-toy.webp';
import type { ProfileData } from '../data/profile';
import { UNITS, type Lesson } from '../engine/curriculum';
import type { Treasure } from '../engine/rewards';
import { opens, statusOf, type LessonStatus } from '../engine/rules';
import { lessonState, type Day } from '../engine/state';
import { wording } from '../speech/catalogue';
import { Oreo, Paw } from '../ui/Oreo';
import { speak } from './voice';

/** The treasures Oreo can be given, from art/props/. */
export const TREASURES: Record<Treasure, string> = { ball, bandana, bed, bowl, 'rope-toy': rope, kennel: kennelToy };
export const TREASURE_NAMES: Record<Treasure, string> = { ball: 'a ball', bandana: 'a bandana', bed: 'a bed', bowl: 'a bowl', 'rope-toy': 'a rope toy', kennel: 'a kennel' };
export const isTreasure = (v: string | undefined): v is Treasure => !!v && v in TREASURES;

/** What a stone is for the child: the engine's status, with "known from the starting check" told apart from mastered by playing. */
type Look = LessonStatus | 'known';

function describe(look: Look, l: Lesson, data: ProfileData, next: boolean): string {
  const st = lessonState(data.child, l.id);
  switch (look) {
    case 'coming': return 'Coming soon.';
    case 'locked': return 'Further along the path.';
    case 'known': return 'Known, to be checked in a warm-up.';
    case 'mastered': return 'Mastered. It comes back in the warm-ups.';
    case 'resting': return 'Last step done today. Once more on another day.';
    case 'passed': return 'Every step done. Once more to master it.';
    default: return `${next ? 'Next. ' : ''}Step ${st.step + 1} of ${l.steps.length}.`;
  }
}

/** A padlock, drawn in code like every other sign on the path. */
const Padlock = () => (
  <svg className="ic lock" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 10V7.5a5 5 0 0 1 10 0V10h1.2c.7 0 1.3.6 1.3 1.3v8.4c0 .7-.6 1.3-1.3 1.3H5.8c-.7 0-1.3-.6-1.3-1.3v-8.4c0-.7.6-1.3 1.3-1.3H7zm2.4 0h5.2V7.5a2.6 2.6 0 0 0-5.2 0V10z" />
  </svg>
);
const Tick = () => (
  <svg className="ic tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 17.6 4 12.4l2-2 3.2 3.2L18 4.8l2 2z" /></svg>
);

export interface GardenProps {
  data: ProfileData;
  today: Day;
  /** Today's games are done, so stones she has already passed can be tapped for free play. */
  open: boolean;
  soundOff: boolean;
  onLesson: (l: Lesson) => void;
  /** The small link for parents under a lesson: why it is built the way it is. */
  onWhy: (l: Lesson) => void;
}

/**
 * The path: a walk through the garden, one stepping stone per lesson and one part of the garden
 * per unit, in one fixed order. It is a path and not a field: the next stone is larger and lit, with
 * Oreo on it; at most one more stands open beside it; everything further on has a padlock. Stones
 * she has passed show their steps, then a paw when the lesson is mastered. Tapping a padlock makes
 * Oreo point at the stone that opens it.
 */
export function Garden({ data, today, open, soundOff, onLesson, onWhy }: GardenProps) {
  const root = useRef<HTMLDivElement>(null);
  /** Oreo is pointing at the next stone, after a locked one was tapped. Counted, so that every tap is answered. */
  const [pointing, setPointing] = useState(0);
  const nextLesson = opens(data.child);
  const point = () => {
    if (!nextLesson) return;
    setPointing((n) => n + 1);
    if (!soundOff) speak(['first-finish-this-one']);
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.current?.querySelector(`[data-lesson="${nextLesson.id}"]`)?.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
  };
  let n = 0; // stones alternate sides all the way down, across the units
  return (
    <div className="garden" data-testid="garden" ref={root}>
      <img className="fence" src={fence} alt="" draggable={false} />
      {UNITS.map((u) => (
        <section key={u.id} className="plot" data-unit={u.id}>
          <h3 className="post">
            <img src={signpost} alt="" draggable={false} />
            <span>{u.stretch ? `Stretch: ${u.title}` : `Stage ${u.stage}: ${u.title}`}</span>
          </h3>
          <ol className="stones">
            {u.lessons.map((l) => {
              const status = statusOf(data.child, l, today), st = lessonState(data.child, l.id);
              const look: Look = status === 'mastered' && st.placed ? 'known' : status;
              const isNext = nextLesson?.id === l.id, locked = look === 'locked';
              // Free play is for what she has passed at least once, never for what is still ahead.
              const canPlay = open && ['passed', 'resting', 'mastered', 'known'].includes(look);
              const stepsDone = ['passed', 'resting'].includes(look) ? l.steps.length : look === 'open' ? Math.min(st.step, l.steps.length) : 0;
              const treasure = data.rewards.treasures[l.id];
              const side = n++ % 2 ? 'right' : 'left';
              return (
                <li key={l.id} className={side}>
                  <button
                    className={['stone', look, isNext && 'nextstone'].filter(Boolean).join(' ')} type="button" data-lesson={l.id} data-status={look} data-next={isNext || undefined}
                    data-steps={['open', 'passed', 'resting'].includes(look) ? `${stepsDone}/${l.steps.length}` : undefined}
                    disabled={!canPlay && !locked} data-locked={locked || undefined} onClick={() => (locked ? point() : onLesson(l))}
                  >
                    <span className="stonepic">
                      <img src={stone} alt="" draggable={false} />
                      <span className="mark">
                        {look === 'mastered' ? <Paw /> : look === 'known' ? <Tick /> : locked ? <Padlock /> : look === 'coming' ? '' : (
                          <span className="pips">{l.steps.map((_, i) => <i key={i} className={i < stepsDone ? 'on' : undefined} />)}</span>
                        )}
                      </span>
                      {look === 'mastered' && isTreasure(treasure) && <img className="treasure" src={TREASURES[treasure]} alt={TREASURE_NAMES[treasure]} draggable={false} />}
                      {isNext && <Oreo key={pointing ? 'pointing' : 'standing'} pose={pointing ? 'pointing' : 'standing'} className="herepup" />}
                    </span>
                    <span className="cap">
                      <strong>{l.title}</strong>
                      <span className="d">{describe(look, l, data, isNext)}</span>
                    </span>
                  </button>
                  {isNext && pointing > 0 && <p key={pointing} className="pointsay" role="status" data-testid="pointsay">{wording('first-finish-this-one')}</p>}
                  {look !== 'coming' && (
                    <button className="whylink" type="button" data-why={l.id} aria-label={`For parents: why ${l.title} works`} onClick={() => onWhy(l)}>
                      For parents: why this works
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <img className="bush" src={bush} alt="" draggable={false} />
        </section>
      ))}
      <img className="kennel" src={kennel} alt="" draggable={false} />
    </div>
  );
}
