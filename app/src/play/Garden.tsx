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
import { statusOf, waitsFor, type LessonStatus } from '../engine/rules';
import { lessonState, type Day } from '../engine/state';
import { Oreo, Paw } from '../ui/Oreo';

/** The treasures Oreo can be given, from art/props/. */
export const TREASURES: Record<Treasure, string> = { ball, bandana, bed, bowl, 'rope-toy': rope, kennel: kennelToy };
export const TREASURE_NAMES: Record<Treasure, string> = { ball: 'a ball', bandana: 'a bandana', bed: 'a bed', bowl: 'a bowl', 'rope-toy': 'a rope toy', kennel: 'a kennel' };
export const isTreasure = (v: string | undefined): v is Treasure => !!v && v in TREASURES;

function describe(status: LessonStatus, l: Lesson, data: ProfileData): string {
  if (status === 'coming') return 'Coming soon.';
  if (status === 'locked') {
    const first = waitsFor(l).filter((n) => !lessonState(data.child, n.id).mastered && !lessonState(data.child, n.id).passedOn.length);
    return `First: ${first.map((n) => n.title).join(', ')}.`;
  }
  if (status === 'mastered') return 'Mastered. It comes back in the warm-ups.';
  if (status === 'resting') return 'Last step done today. Once more on another day.';
  return `Step ${lessonState(data.child, l.id).step + 1} of ${l.steps.length}.`;
}

export interface GardenProps {
  data: ProfileData;
  today: Day;
  /** Today's games are done, so stones can be tapped for free play. */
  open: boolean;
  /** The lesson today's games are about: Oreo waits there. */
  here: string | null;
  onLesson: (l: Lesson) => void;
}

/**
 * The path: a walk through the garden, one stepping stone per lesson and one part of the garden
 * per unit. A stone shows where the lesson stands: its step, a paw and a treasure when it is
 * mastered, and what comes first when it is still closed.
 */
export function Garden({ data, today, open, here, onLesson }: GardenProps) {
  let n = 0; // stones alternate sides all the way down, across the units
  return (
    <div className="garden" data-testid="garden">
      <img className="fence" src={fence} alt="" draggable={false} />
      {UNITS.map((u) => (
        <section key={u.id} className="plot" data-unit={u.id}>
          <h3 className="post">
            <img src={signpost} alt="" draggable={false} />
            <span>{u.stretch ? `Stretch: ${u.title}` : `Stage ${u.stage}: ${u.title}`}</span>
          </h3>
          <ol className="stones">
            {u.lessons.map((l) => {
              const status = statusOf(data.child, l, today);
              const canPlay = open && (status === 'open' || status === 'resting' || status === 'mastered');
              const treasure = data.rewards.treasures[l.id];
              const side = n++ % 2 ? 'right' : 'left';
              return (
                <li key={l.id} className={side}>
                  <button className={`stone ${status}`} type="button" disabled={!canPlay} data-lesson={l.id} data-status={status} onClick={() => onLesson(l)}>
                    <span className="stonepic">
                      <img src={stone} alt="" draggable={false} />
                      <span className="mark">
                        {status === 'mastered' ? <Paw /> : status === 'open' || status === 'resting' ? lessonState(data.child, l.id).step + 1 : ''}
                      </span>
                      {status === 'mastered' && isTreasure(treasure) && <img className="treasure" src={TREASURES[treasure]} alt={TREASURE_NAMES[treasure]} draggable={false} />}
                      {here === l.id && <Oreo pose="standing" className="herepup" />}
                    </span>
                    <span className="cap">
                      <strong>{l.title}</strong>
                      <span className="d">{describe(status, l, data)}</span>
                    </span>
                  </button>
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
