/**
 * The engine's rules, as pure functions: what an answer does to the rating, when a step is passed
 * or dropped, when a lesson is mastered, when it comes back for review, and what is open.
 * See docs/build-spec.md, section 3.
 */
import { CONFIG } from './config';
import { LESSON, LESSONS, playable, type Lesson } from './curriculum';
import { addDays, lessonState, withLesson, type ChildState, type Day, type LessonState } from './state';

/* ---------- rating ---------- */

/** How hard a step is on the rating scale. A new child (rating 0) gets about three in four right at step 0. */
const difficulty = (step: number) => step * CONFIG.rating.stepGap - Math.log(CONFIG.rating.target / (1 - CONFIG.rating.target));
/** The chance of a right-first-time answer at a step, for a child with this rating. */
export const chance = (rating: number, step: number) => 1 / (1 + Math.exp(-(rating - difficulty(step))));

/** The step whose questions she should get right about three times in four, no higher than `upTo`. */
export function fittingStep(rating: number, upTo: number): number {
  let best = 0;
  for (let s = 0; s <= upTo; s++) {
    if (Math.abs(chance(rating, s) - CONFIG.rating.target) < Math.abs(chance(rating, best) - CONFIG.rating.target)) best = s;
  }
  return best;
}

export interface Answer {
  /** Right first time: no wrong tap, no hint, no help picture. */
  clean: boolean;
  /** Time from the question appearing to the right answer. Never shown to the child. */
  ms: number;
}

/** One answer at a step. Speed only counts once she is already accurate at that step. */
export function answered(s: ChildState, lessonId: string, step: number, a: Answer): ChildState {
  const l = lessonState(s, lessonId);
  const recent = step === l.step ? [...l.recent, a.clean].slice(-CONFIG.round) : l.recent;
  const accurate = recent.length >= CONFIG.round && recent.filter(Boolean).length >= CONFIG.passAt;
  const slowAnswer = a.clean && a.ms > CONFIG.slowMs;
  const score = !a.clean ? 0 : accurate && slowAnswer ? 0.75 : 1;
  const rating = l.rating + CONFIG.rating.k * (score - chance(l.rating, step));
  const slow = accurate ? (a.clean ? slowAnswer : l.slow) : false;
  return withLesson(s, lessonId, { ...l, rating, answers: l.answers + 1, recent, slow });
}

/* ---------- steps and mastery ---------- */

export type RoundOutcome =
  /** Moved up one step, or two after a perfect round. */
  | { kind: 'up'; to: number; skipped: boolean }
  /** Passed the last step; the lesson needs one more good day. */
  | { kind: 'passed' }
  | { kind: 'mastered' }
  /** Too hard: one step down, with the fuller picture. */
  | { kind: 'down'; to: number }
  | { kind: 'stay' };

/**
 * The end of a round at the step she is on. 5 or 6 right first time passes the step and a perfect
 * round skips one, but never past the last step: that one has to be passed itself, on two days.
 */
export function roundFinished(s: ChildState, lessonId: string, bones: number, today: Day): { state: ChildState; outcome: RoundOutcome } {
  const lesson = LESSON.get(lessonId)!;
  const l = lessonState(s, lessonId);
  const last = lesson.steps.length - 1;
  const fresh = { ...l, recent: [] as boolean[] };
  if (bones >= CONFIG.passAt) {
    if (l.step < last) {
      const to = Math.min(last, l.step + (bones === CONFIG.round ? 2 : 1));
      return { state: withLesson(s, lessonId, { ...fresh, step: to }), outcome: { kind: 'up', to, skipped: to > l.step + 1 } };
    }
    const passedOn = l.passedOn.includes(today) ? l.passedOn : [...l.passedOn, today];
    if (passedOn.length >= CONFIG.masteryDays && !l.mastered) {
      const mastered: LessonState = { ...l, passedOn, mastered: today, reviews: 0, reviewMisses: 0, due: addDays(today, CONFIG.reviewDays[0]) };
      return { state: withLesson(s, lessonId, mastered), outcome: { kind: 'mastered' } };
    }
    return { state: withLesson(s, lessonId, { ...l, passedOn }), outcome: l.mastered ? { kind: 'stay' } : { kind: 'passed' } };
  }
  if (bones <= CONFIG.dropAt && l.step > 0) {
    return { state: withLesson(s, lessonId, { ...fresh, step: l.step - 1 }), outcome: { kind: 'down', to: l.step - 1 } };
  }
  return { state: s, outcome: { kind: 'stay' } };
}

/* ---------- review ---------- */

/**
 * One review question on a mastered lesson, in a mixed round. A due review answered right first
 * time also confirms a lesson that the starting check had only marked as known. Remembered well, the next review
 * moves further away (1, 3, 7, 14, 30 days); slow or missed, it comes back sooner; missed twice
 * in a row, the lesson is reopened and has to be passed again.
 */
export function reviewed(s: ChildState, lessonId: string, a: Answer, today: Day): ChildState {
  const l = lessonState(s, lessonId);
  if (!l.mastered) return s;
  if (!a.clean) {
    const misses = l.reviewMisses + 1;
    if (misses >= CONFIG.reopenAfter) {
      // Reopened: back on the path at its last step, one good day from mastered, as in the live game.
      const lesson = LESSON.get(lessonId)!;
      const { mastered: _m, placed: _p, due: _d, ...rest } = l;
      void _m; void _p; void _d;
      return withLesson(s, lessonId, { ...rest, step: lesson.steps.length - 1, passedOn: l.passedOn.slice(-1).filter((d) => d !== today), reviews: 0, reviewMisses: 0, recent: [] });
    }
    return withLesson(s, lessonId, { ...l, reviewMisses: misses, reviews: Math.max(0, l.reviews - 1), due: addDays(today, 1), reviewedOn: today });
  }
  // Right. The schedule moves at most once a day, and only when the review was due.
  if (l.reviewedOn === today || (l.due !== undefined && l.due > today)) return withLesson(s, lessonId, { ...l, reviewMisses: 0 });
  // A lesson the starting check marked as known is confirmed here: from now on she has shown it by playing.
  const { placed: _placed, ...shown } = l;
  void _placed;
  const shaky = a.ms > CONFIG.slowMs;
  const reviews = shaky ? l.reviews : l.reviews + 1;
  const wait = CONFIG.reviewDays[Math.min(reviews, CONFIG.reviewDays.length - 1)]!;
  return withLesson(s, lessonId, { ...shown, reviewMisses: 0, reviews, due: addDays(today, shaky ? Math.max(1, Math.floor(wait / 2)) : wait), reviewedOn: today });
}

/* ---------- what is open ---------- */

export type LessonStatus =
  /** Nothing to play yet. */
  | 'coming'
  /** Needs other lessons first. */
  | 'locked'
  | 'open'
  /** The last step was passed today; it needs another day to be mastered. */
  | 'resting'
  | 'mastered';

/** Passed at least once at its last step, mastered, or marked known by the starting check. */
const passedOnce = (l: LessonState) => !!l.mastered || !!l.placed || l.passedOn.length > 0;

/** The lessons a lesson really waits for: a prerequisite with nothing to play yet is looked through to its own. */
export function waitsFor(lesson: Lesson): Lesson[] {
  const out = new Set<Lesson>();
  const walk = (ids: string[]) => {
    for (const id of ids) {
      const need = LESSON.get(id)!;
      if (playable(need)) out.add(need);
      else walk(need.needs);
    }
  };
  walk(lesson.needs);
  return [...out];
}

export function statusOf(s: ChildState, lesson: Lesson, today: Day): LessonStatus {
  if (!playable(lesson)) return 'coming';
  const l = lessonState(s, lesson.id);
  if (l.mastered) return 'mastered';
  if (!waitsFor(lesson).every((n) => passedOnce(lessonState(s, n.id)))) return 'locked';
  return l.passedOn.includes(today) ? 'resting' : 'open';
}

/** The lessons she could start or go on with today, in path order. */
export const openLessons = (s: ChildState, today: Day): Lesson[] => LESSONS.filter((l) => statusOf(s, l, today) === 'open');
export const masteredLessons = (s: ChildState): Lesson[] => LESSONS.filter((l) => lessonState(s, l.id).mastered);
/** Mastered lessons whose review is due, the longest overdue first. */
export const dueLessons = (s: ChildState, today: Day): Lesson[] =>
  masteredLessons(s)
    .filter((l) => (lessonState(s, l.id).due ?? today) <= today)
    .sort((a, b) => (lessonState(s, a.id).due ?? '').localeCompare(lessonState(s, b.id).due ?? ''));

/* ---------- the starting check ---------- */

/** A lesson the starting check found she already knows. It counts as mastered and comes back in review tomorrow. */
export function place(s: ChildState, lessonId: string, today: Day): ChildState {
  const lesson = LESSON.get(lessonId);
  if (!lesson || !playable(lesson) || lessonState(s, lessonId).mastered) return s;
  return withLesson(s, lessonId, {
    ...lessonState(s, lessonId), step: lesson.steps.length - 1, mastered: today, placed: true, reviews: 0, reviewMisses: 0,
    due: addDays(today, CONFIG.reviewDays[0]), rating: difficulty(lesson.steps.length - 1) + 1,
  });
}

/** Very fast wrong taps in a row are guesses, not answers. `gaps` are the times between her last taps. */
export const looksLikeGuessing = (gaps: readonly number[]): boolean =>
  gaps.length >= CONFIG.guess.taps && gaps.slice(-CONFIG.guess.taps).every((ms) => ms < CONFIG.guess.fasterThanMs);
