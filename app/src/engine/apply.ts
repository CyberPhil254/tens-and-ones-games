/**
 * What a finished round does to a child's saved data. One function, so the screens only ever
 * hand over "these answers, in this part" and show what comes back.
 * A round that is left before its end is never handed over: leaving counts for nothing.
 */
import { addAttempt, type ProfileData } from '../data/profile';
import { LESSON, LESSONS, playable, unitOf, type Activity, type Lesson } from './curriculum';
import { answered, place, reviewed, roundFinished, waitsFor, type RoundOutcome } from './rules';
import type { Day } from './state';
import type { Part } from './today';

/** One answered question of a round. */
export interface Given {
  lesson: string;
  step: number;
  clean: boolean;
  misses: number;
  hint: boolean;
  ms: number;
  /** When it was answered, as an ISO time. */
  at: string;
}

/** The kinds of round there are: today's three, the starting check, and free play (which only moves the rating). */
export type RoundKind = Part['kind'] | 'check' | 'free';

export interface Applied {
  data: ProfileData;
  /** What happened to the step or the lesson; missing for rounds that cannot change them. */
  outcome?: RoundOutcome;
  bones: number;
}

export function applyRound(data: ProfileData, kind: RoundKind, counts: boolean, given: readonly Given[], today: Day): Applied {
  let child = data.child;
  let out = data;
  const bones = given.filter((g) => g.clean).length;
  for (const g of given) {
    if (kind !== 'check') child = answered(child, g.lesson, g.step, g);
    if (kind === 'warm') child = reviewed(child, g.lesson, g, today);
    out = addAttempt(out, { lesson: g.lesson, step: g.step, part: kind, clean: g.clean, misses: g.misses, hint: g.hint, ms: g.ms, at: g.at });
  }
  let outcome: RoundOutcome | undefined;
  if ((kind === 'new' || (kind === 'stronger' && counts)) && given.length) {
    ({ state: child, outcome } = roundFinished(child, given[0]!.lesson, bones, today));
  }
  if (kind === 'check') {
    // What she got right first time she already knows, and so does she what it is built on.
    for (const g of given) {
      if (!g.clean) continue;
      // A unit of a stage below her own is known as a whole when its question is right: she is not sent
      // back through its other lessons. In her own stage only that lesson is marked.
      const unit = unitOf(g.lesson);
      const whole = !unit.stretch && unit.stage < data.profile.stage;
      for (const l of whole ? unit.lessons.filter(playable) : [LESSON.get(g.lesson)!]) child = placeWithNeeds(child, l.id, today);
    }
  }
  const done: ProfileData = { ...out, child, bones: data.bones + (kind === 'check' ? 0 : bones), ...(kind === 'check' ? { checked: true } : {}) };
  // What the starting check found she already knows opens the path further on, and earns nothing:
  // rewards are for what she does herself.
  return { data: done, outcome, bones };
}

function placeWithNeeds(child: ProfileData['child'], lessonId: string, today: Day): ProfileData['child'] {
  const lesson = LESSON.get(lessonId);
  if (!lesson) return child;
  for (const need of waitsFor(lesson)) child = placeWithNeeds(child, need.id, today);
  return place(child, lessonId, today);
}

/** Today's games are finished: free play opens until the day ends. */
export const finishToday = (data: ProfileData, today: Day): ProfileData => ({ ...data, child: { ...data.child, doneOn: today } });
export const doneToday = (data: ProfileData, today: Day): boolean => data.child.doneOn === today;

/**
 * The lessons the starting check asks about, one question each at the lesson's last step:
 * one lesson from every unit of the stage below, and the first lesson of every unit of her own stage.
 * About ten at most. A parent may skip the check; then she starts at the beginning.
 */
export function checkLessons(stage: 1 | 2, units: readonly { stage: 1 | 2; stretch?: true; probe?: string; lessons: Lesson[] }[]): Lesson[] {
  const out: Lesson[] = [];
  for (const u of units) {
    if (u.stretch) continue;
    const ready = u.lessons.filter(playable);
    if (!ready.length) continue;
    // A unit below her stage is asked about through the lesson that shows it best; her own, through their first lessons.
    if (u.stage < stage) out.push(ready.find((l) => l.id === u.probe) ?? ready[ready.length - 1]!);
    else if (u.stage === stage) out.push(ready[0]!);
  }
  return out.slice(0, 10);
}

/** The lesson a game level belongs to. Every level belongs to exactly one. */
export function lessonOfActivity(act: Activity): { lesson: Lesson; step: number } | null {
  for (const lesson of LESSONS) {
    const step = lesson.steps.findIndex((s) => s.from.some((f) => f.game === act.game && f.level === act.level && (f.variant === undefined || act.variant === undefined || f.variant === act.variant)));
    if (step >= 0) return { lesson, step };
  }
  return null;
}
