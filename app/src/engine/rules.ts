/**
 * The engine's rules, as pure functions: what an answer does to the rating, when a step is passed
 * or dropped, when a lesson is mastered, when it comes back for review, and what is open.
 * See docs/build-spec.md, section 3.
 */
import { CONFIG } from './config';
import { LESSON, LESSONS, PATH, UNITS, playable, unitOf, type Lesson } from './curriculum';
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
      const { mastered: _m, placed: _p, known: _k, due: _d, ...rest } = l;
      void _m; void _p; void _k; void _d;
      // A lesson she never played here starts at its last step: the steps below it count for nothing.
      const from = l.placed || l.known ? { from: lesson.steps.length - 1 } : {};
      return withLesson(s, lessonId, { ...rest, ...from, step: lesson.steps.length - 1, passedOn: l.passedOn.slice(-1).filter((d) => d !== today), reviews: 0, reviewMisses: 0, recent: [] });
    }
    return withLesson(s, lessonId, { ...l, reviewMisses: misses, reviews: Math.max(0, l.reviews - 1), due: addDays(today, 1), reviewedOn: today });
  }
  // Right. The schedule moves at most once a day, and only when the review was due.
  if (l.reviewedOn === today || (l.due !== undefined && l.due > today)) return withLesson(s, lessonId, { ...l, reviewMisses: 0 });
  // A lesson the starting check marked as known is confirmed here: known for sure, and still not learnt here.
  const { placed: _placed, ...rest } = l;
  const shown: LessonState = _placed ? { ...rest, known: true } : rest;
  const shaky = a.ms > CONFIG.slowMs;
  const reviews = shaky ? l.reviews : l.reviews + 1;
  const wait = CONFIG.reviewDays[Math.min(reviews, CONFIG.reviewDays.length - 1)]!;
  return withLesson(s, lessonId, { ...shown, reviewMisses: 0, reviews, due: addDays(today, shaky ? Math.max(1, Math.floor(wait / 2)) : wait), reviewedOn: today });
}

/* ---------- what is open ---------- */

export type LessonStatus =
  /** Nothing to play yet. */
  | 'coming'
  /** Further along the path: it opens when she gets there. */
  | 'locked'
  /** Open for new learning: the next stone on the path, or the one alternative beside it. Never more than two. */
  | 'open'
  /** The last step was passed today; it needs another day to be mastered. */
  | 'resting'
  /** The last step was passed on an earlier day; one more good day masters it. */
  | 'passed'
  | 'mastered';

/** Passed at least once at its last step, mastered, or marked known by the starting check. */
export const passedOnce = (l: LessonState) => !!l.mastered || !!l.placed || l.passedOn.length > 0;

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

/** A lesson of the stage she started in, or beyond: not one from the stage below. */
const ownStage = (s: ChildState, l: Lesson) => !lessonState(s, l.id).back;
/**
 * A step back she is taking: a lesson from the stage below that is not (or no longer) known and not yet
 * mastered. Once mastered it is simply a lesson of the stage below again.
 */
export const stepBack = (s: ChildState, l: Lesson) => {
  const st = lessonState(s, l.id);
  return !!st.back && !st.placed && !st.mastered;
};

/**
 * The lesson of her own stage that a step back stands before: the first one on the path that needs it.
 * Null when nothing of her own stage needs it (then it simply comes next).
 */
export function neededBy(s: ChildState, back: Lesson): Lesson | null {
  return PATH.find((l) => ownStage(s, l) && l.needs.includes(back.id)) ?? null;
}

/**
 * Her path: the fixed order, with every step back that has to be taken moved to stand directly before the
 * lesson of her own stage that needs it. For a child who started at the first stone this is simply the path.
 */
export function pathFor(s: ChildState): Lesson[] {
  const moved = PATH.filter((l) => stepBack(s, l));
  if (!moved.length) return PATH;
  const out = PATH.filter((l) => !moved.includes(l));
  for (const b of moved) {
    const before = neededBy(s, b);
    // Nothing ahead needs it: it comes before the first lesson of her own stage she has not passed.
    let at = before ? out.indexOf(before) : out.findIndex((l) => ownStage(s, l) && playable(l) && !passedOnce(lessonState(s, l.id)));
    if (at < 0) at = out.length;
    out.splice(at, 0, b);
  }
  return out;
}
/** The part of the garden a lesson stands in for her: its own unit, or for a step back the unit of the lesson that needs it. */
export function plotOf(s: ChildState, l: Lesson) {
  if (!stepBack(s, l)) return unitOf(l.id);
  const order = pathFor(s), after = order[order.indexOf(l) + 1];
  return unitOf((neededBy(s, l) ?? after ?? l).id);
}

/**
 * The lessons open for new learning: at most two. The first is the next stone, the first lesson on her
 * path she has not yet passed. The second, where the order allows, is one alternative, so that she can
 * choose: the first lesson after it that she has not passed and whose own needs are all passed, in the
 * same unit, or the first lesson of the unit after when the next stone is the last of its unit.
 * Everything further on is locked until she gets there.
 */
export function frontier(s: ChildState): Lesson[] {
  const ahead = pathFor(s).filter((l) => playable(l) && !passedOnce(lessonState(s, l.id)));
  const next = ahead[0];
  if (!next) return [];
  const ready = (l: Lesson) => waitsFor(l).every((n) => passedOnce(lessonState(s, n.id)));
  const unit = plotOf(s, next), later = ahead.slice(1);
  const inUnit = later.filter((l) => plotOf(s, l) === unit);
  const alt = inUnit.length ? inUnit.find(ready) : later[0] && ready(later[0]) ? later[0] : undefined;
  return alt ? [next, alt] : [next];
}

export function statusOf(s: ChildState, lesson: Lesson, today: Day): LessonStatus {
  if (!playable(lesson)) return 'coming';
  const l = lessonState(s, lesson.id);
  if (l.mastered) return 'mastered';
  if (l.passedOn.length) return l.passedOn.includes(today) ? 'resting' : 'passed';
  return frontier(s).includes(lesson) ? 'open' : 'locked';
}

/** The lesson that opens a locked one: the next stone on the path. */
export const opens = (s: ChildState): Lesson | null => frontier(s)[0] ?? null;

/**
 * The lessons she could go on with today, in path order: those that need one more good day,
 * and the one or two that are open for new learning.
 */
export const openLessons = (s: ChildState, today: Day): Lesson[] => pathFor(s).filter((l) => ['open', 'passed'].includes(statusOf(s, l, today)));
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

/**
 * A gap: a lesson of the stage below that she lacks. It is not marked as known; it becomes a quick step back,
 * and starts at the step that fits: one below the last step, which is the one the check asked and she missed.
 */
export function gap(s: ChildState, lessonId: string): ChildState {
  const lesson = LESSON.get(lessonId);
  if (!lesson || !playable(lesson) || passedOnce(lessonState(s, lessonId))) return s;
  const at = Math.max(0, lesson.steps.length - 2);
  return withLesson(s, lessonId, { ...lessonState(s, lessonId), back: true, step: at, ...(at > 0 ? { from: at } : {}), rating: difficulty(at) });
}

/**
 * A child starts in the stage her parent picked. Every lesson of the stage below is known (it comes back in
 * review like anything else that is known), except the gaps the starting check found, which become quick steps
 * back. A lesson she has already played is never changed: it keeps its step and its place in the review schedule.
 */
export function startInStage(s: ChildState, stage: 1 | 2, gaps: readonly string[], today: Day): ChildState {
  if (stage === 1) return s;
  for (const u of UNITS) {
    if (u.stretch || u.stage >= stage) continue;
    for (const l of u.lessons.filter(playable)) {
      const st = lessonState(s, l.id);
      const midway = !passedOnce(st) && (st.answers > 0 || st.step > 0); // she is in the middle of it: it stays exactly as it is
      if (gaps.includes(l.id) && !midway) s = gap(s, l.id);
      else if (!midway) s = place(s, l.id, today);
      s = withLesson(s, l.id, { ...lessonState(s, l.id), back: true });
    }
  }
  return s;
}

/** The lessons of the stage below that her own stage builds on directly: what the starting check looks at for gaps. */
export const builtOn = (stage: 1 | 2): Lesson[] =>
  PATH.filter((l) => !unitOf(l.id).stretch && unitOf(l.id).stage < stage && playable(l) && LESSONS.some((x) => (unitOf(x.id).stretch || unitOf(x.id).stage >= stage) && x.needs.includes(l.id)));

/** Very fast wrong taps in a row are guesses, not answers. `gaps` are the times between her last taps. */
export const looksLikeGuessing = (gaps: readonly number[]): boolean =>
  gaps.length >= CONFIG.guess.taps && gaps.slice(-CONFIG.guess.taps).every((ms) => ms < CONFIG.guess.fasterThanMs);
