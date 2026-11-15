/**
 * Today's games: one short session a day, put together by the app.
 *   1. Warm-up: mixed questions from mastered lessons, those due for review first.
 *   2. New: two rounds of the next lesson on the path.
 *   3. Stronger: one round on the weakest or slowest lesson.
 * The child never gets a day with nothing to do while there is something left to learn.
 */
import { CONFIG } from './config';
import { LESSON, LESSONS, playable, type Lesson } from './curriculum';
import { chance, dueLessons, fittingStep, masteredLessons, openLessons } from './rules';
import { lessonState, type ChildState, type Day } from './state';

/** A place to draw questions from: a lesson at one of its steps. */
export interface Slot {
  lesson: string;
  step: number;
}

export type Part =
  /** Mixed review: each question comes from one of these, never the same lesson twice running. */
  | { kind: 'warm'; n: number; slots: Slot[] }
  /** A round of the lesson she is learning, at the step she is on. It can pass or drop the step. */
  | { kind: 'new'; n: number; slot: Slot }
  /** A round on a weak or slow lesson. On an unfinished lesson it counts like any round; on a mastered one it only moves the rating. */
  | { kind: 'stronger'; n: number; slot: Slot; counts: boolean };

/** The step a review question on a mastered lesson is asked at: the last one, or lower with the picture if she is struggling. */
const reviewStep = (s: ChildState, l: Lesson) => fittingStep(lessonState(s, l.id).rating, l.steps.length - 1);

/** The mixed warm-up, or nothing while no lesson is mastered yet. Lessons due for review come first. */
export function warmUp(s: ChildState, today: Day): Part | null {
  const due = dueLessons(s, today);
  const rest = masteredLessons(s).filter((l) => !due.includes(l));
  const lessons = [...due, ...rest].slice(0, CONFIG.warmUp);
  if (!lessons.length) return null;
  return { kind: 'warm', n: CONFIG.warmUp, slots: lessons.map((l) => ({ lesson: l.id, step: reviewStep(s, l) })) };
}

/** The lessons she may choose between for "new": the first two open ones on the path. Usually there is one. */
export const nextLessons = (s: ChildState, today: Day): Lesson[] => openLessons(s, today).slice(0, 2);

const roundOf = (s: ChildState, l: Lesson): Slot => ({ lesson: l.id, step: Math.min(lessonState(s, l.id).step, l.steps.length - 1) });

/**
 * The lesson that most needs strengthening, other than the one being learned today: an unfinished
 * lesson she has started, else the mastered lesson with the lowest chance of a right answer or one
 * she is slow at.
 */
export function stronger(s: ChildState, today: Day, not: string | null): Part | null {
  const started = openLessons(s, today).filter((l) => l.id !== not && lessonState(s, l.id).answers > 0);
  if (started.length) {
    const weakest = started.reduce((a, b) => (lessonState(s, a.id).rating <= lessonState(s, b.id).rating ? a : b));
    return { kind: 'stronger', n: CONFIG.round, slot: roundOf(s, weakest), counts: true };
  }
  const known = masteredLessons(s).filter((l) => l.id !== not);
  if (!known.length) return null;
  const need = (l: Lesson) => {
    const st = lessonState(s, l.id);
    return chance(st.rating, l.steps.length - 1) - (st.slow ? 0.25 : 0);
  };
  const weakest = known.reduce((a, b) => (need(a) <= need(b) ? a : b));
  return { kind: 'stronger', n: CONFIG.round, slot: { lesson: weakest.id, step: reviewStep(s, weakest) }, counts: false };
}

/**
 * Today's parts in order. `chosen` is the lesson she picked when two were open ("which stone?").
 * The parts after the first are worked out again when they start, because a round can change the step.
 */
export function planToday(s: ChildState, today: Day, chosen?: string): Part[] {
  const parts: Part[] = [];
  const warm = warmUp(s, today);
  if (warm) parts.push(warm);
  const open = nextLessons(s, today);
  const lesson = open.find((l) => l.id === chosen) ?? open[0] ?? null;
  if (lesson) {
    parts.push({ kind: 'new', n: CONFIG.round, slot: roundOf(s, lesson) });
    parts.push({ kind: 'new', n: CONFIG.round, slot: roundOf(s, lesson) });
  }
  const more = stronger(s, today, lesson?.id ?? null);
  if (more) parts.push(more);
  return parts;
}

/**
 * The part to play now, given the kinds of part already finished today; null when today is done.
 * It is worked out afresh each time, so the second round of "new" is at the step the first one
 * earned, or on the next lesson if the first round finished the lesson for today.
 */
export function nextPart(s: ChildState, today: Day, done: readonly Part['kind'][], chosen?: string): Part | null {
  const count = (k: Part['kind']) => done.filter((d) => d === k).length;
  if (!count('warm') && !count('new') && !count('stronger')) {
    const warm = warmUp(s, today);
    if (warm) return warm;
  }
  const open = nextLessons(s, today);
  const lesson = open.find((l) => l.id === chosen) ?? open[0] ?? null;
  if (count('new') < 2 && !count('stronger') && lesson) return { kind: 'new', n: CONFIG.round, slot: roundOf(s, lesson) };
  if (!count('stronger')) return stronger(s, today, lesson?.id ?? null);
  return null;
}

/** True when there is still something on the path she has not mastered. */
export const somethingLeft = (s: ChildState): boolean => LESSONS.some((l) => playable(l) && !lessonState(s, l.id).mastered);
export const lessonOf = (slot: Slot): Lesson => LESSON.get(slot.lesson)!;
