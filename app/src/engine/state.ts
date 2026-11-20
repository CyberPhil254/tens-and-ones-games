/** What the engine remembers about one child. Plain data, so it can be saved, copied and loaded anywhere. */
import { CONFIG } from './config';

/** A calendar day in the child's own time zone, "2026-11-15". The engine never looks at the clock itself. */
export type Day = string;

export const dayOf = (d: Date): Day =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y!, m! - 1, d! + n));
}

export interface LessonState {
  /** The step she is on, counted from 0. */
  step: number;
  /** The different days on which the last step was passed. */
  passedOn: Day[];
  /** The day the lesson was mastered; missing while it is not. */
  mastered?: Day;
  /**
   * Marked as known by the starting check, not by playing the lesson. It comes back in review, and the
   * first due review answered right first time removes the mark. Until then it earns no reward.
   */
  placed?: true;
  /**
   * A lesson of the stage below the one she started in. While it is known it stays out of the way. If it has to
   * be learned (the starting check found a gap, or a review reopened it) it is "a quick step back": it stands on
   * her path directly before the lesson of her own stage that needs it, not at the start of the path.
   */
  back?: true;
  /** The step a quick step back started at. The steps below it were never played, so they count for nothing. */
  from?: number;
  /** How many reviews in a row went well: the place in the review schedule. */
  reviews: number;
  /** The day the next review is due. */
  due?: Day;
  /** The last day a review of this lesson moved its schedule. */
  reviewedOn?: Day;
  /** Misses in a row in review. */
  reviewMisses: number;
  /** How well she knows it. Higher is better; a new lesson starts at 0. */
  rating: number;
  /** Answers counted so far. */
  answers: number;
  /** The last few answers at the step she is on, right first time or not, newest last. */
  recent: boolean[];
  /** Accurate at her step, but her right answers take long. */
  slow: boolean;
}

export interface ChildState {
  lessons: Record<string, LessonState>;
  /** The day today's games were last finished. */
  doneOn?: Day;
}

export const newLesson = (): LessonState => ({
  step: 0, passedOn: [], reviews: 0, reviewMisses: 0, rating: CONFIG.rating.start, answers: 0, recent: [], slow: false,
});
export const newChild = (): ChildState => ({ lessons: {} });
export const lessonState = (s: ChildState, id: string): LessonState => s.lessons[id] ?? newLesson();
export const withLesson = (s: ChildState, id: string, l: LessonState): ChildState => ({ ...s, lessons: { ...s.lessons, [id]: l } });
