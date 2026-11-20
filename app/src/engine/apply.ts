/**
 * What a finished round does to a child's saved data. One function, so the screens only ever
 * hand over "these answers, in this part" and show what comes back.
 * A round that is left before its end is never handed over: leaving counts for nothing.
 */
import { addAttempt, type ProfileData } from '../data/profile';
import { LESSON, LESSONS, playable, type Activity, type Lesson } from './curriculum';
import { answered, builtOn, place, reviewed, roundFinished, startInStage, waitsFor, type RoundOutcome } from './rules';
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
    if (data.profile.stage === 2) {
      // She starts in Stage 2. A Stage 1 lesson is a gap only if she missed most of what was asked about it.
      const asked = new Map<string, { n: number; missed: number }>();
      for (const g of given) {
        const a = asked.get(g.lesson) ?? { n: 0, missed: 0 };
        asked.set(g.lesson, { n: a.n + 1, missed: a.missed + (g.clean ? 0 : 1) });
      }
      const gaps = [...asked].filter(([, a]) => a.n >= 2 && a.missed > a.n / 2).map(([id]) => id);
      child = startInStage(child, 2, gaps, today);
    } else {
      // What she got right first time she already knows, and so does she what it is built on.
      for (const g of given) if (g.clean) child = placeWithNeeds(child, g.lesson, today);
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

/** How many questions the starting check asks about each lesson of the stage below. */
export const CHECK_ASKS = 2;

/**
 * The questions of the starting check, each at its lesson's last step. A parent may skip the check.
 * Stage 1: the first lesson of every unit, one question each; what she gets right is marked as known.
 * Stage 2: she starts in Stage 2 whatever she answers. The check looks for gaps: two questions about each
 * Stage 1 lesson that a Stage 2 lesson builds on, asked in two passes so that the same lesson never comes
 * twice running. About two dozen questions, three to four minutes.
 */
export function checkLessons(stage: 1 | 2, units: readonly { stage: 1 | 2; stretch?: true; probe?: string; lessons: Lesson[] }[]): Lesson[] {
  if (stage === 2) {
    const below = builtOn(2);
    return Array.from({ length: CHECK_ASKS }, () => below).flat();
  }
  const out: Lesson[] = [];
  for (const u of units) {
    if (u.stretch || u.stage !== stage) continue;
    const ready = u.lessons.filter(playable);
    if (ready.length) out.push(ready[0]!);
  }
  return out.slice(0, 10);
}

/** A parent skipped the starting check: she starts in her stage, with nothing marked as a gap. */
export const skipCheck = (data: ProfileData, today: Day): ProfileData => ({ ...data, child: startInStage(data.child, data.profile.stage, [], today), checked: true });

/** A parent changes the stage: going up, the stage below becomes known, except what she is in the middle of. */
export function withStage(data: ProfileData, stage: 1 | 2, today: Day): ProfileData {
  if (stage === 2) return { ...data, child: data.checked ? startInStage(data.child, 2, [], today) : data.child, profile: { ...data.profile, stage } };
  // Going down: nothing is a step back any more; the lessons of Stage 1 are her own stage again.
  const lessons = Object.fromEntries(Object.entries(data.child.lessons).map(([id, { back: _b, ...l }]) => { void _b; return [id, l]; }));
  return { ...data, child: { ...data.child, lessons }, profile: { ...data.profile, stage } };
}

/** The lesson a game level belongs to. Every level belongs to exactly one. */
export function lessonOfActivity(act: Activity): { lesson: Lesson; step: number } | null {
  for (const lesson of LESSONS) {
    const step = lesson.steps.findIndex((s) => s.from.some((f) => f.game === act.game && f.level === act.level && (f.variant === undefined || act.variant === undefined || f.variant === act.variant)));
    if (step >= 0) return { lesson, step };
  }
  return null;
}
