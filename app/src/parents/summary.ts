/** What the parents' area shows about a child, worked out from her saved data. No screen logic here. */
import type { Attempt, ProfileData } from '../data/profile';
import { CONFIG } from '../engine/config';
import { UNITS, playable, type Lesson, type Unit } from '../engine/curriculum';
import { chance } from '../engine/rules';
import { addDays, dayOf, lessonState, type Day } from '../engine/state';

export interface UnitProgress {
  unit: Unit;
  /** Lessons that exist in the app. */
  built: number;
  mastered: number;
  started: number;
}

export const progressByUnit = (d: ProfileData): UnitProgress[] =>
  UNITS.map((unit) => {
    const built = unit.lessons.filter(playable);
    return {
      unit,
      built: built.length,
      mastered: built.filter((l) => lessonState(d.child, l.id).mastered).length,
      started: built.filter((l) => !lessonState(d.child, l.id).mastered && lessonState(d.child, l.id).answers > 0).length,
    };
  });

export interface Skills {
  /** Mastered, and likely to be right at the last step. */
  strong: Lesson[];
  /** Started or mastered, but more often wrong than the app aims for. */
  weak: Lesson[];
  /** Right, but her right answers take long. */
  slow: Lesson[];
}

export function skills(d: ProfileData): Skills {
  const out: Skills = { strong: [], weak: [], slow: [] };
  for (const l of UNITS.flatMap((u) => u.lessons).filter(playable)) {
    const s = lessonState(d.child, l.id);
    if (!s.answers && !s.mastered) continue;
    const step = s.mastered ? l.steps.length - 1 : Math.min(s.step, l.steps.length - 1);
    const p = chance(s.rating, step);
    if (s.slow) out.slow.push(l);
    if (s.mastered && p >= CONFIG.rating.target) out.strong.push(l);
    else if (s.answers >= CONFIG.round && p < 0.5) out.weak.push(l);
  }
  return out;
}

/** A gap longer than this between two answers is a break, not play. */
const BREAK_MS = 2 * 60_000;

/**
 * Minutes played on each of the last seven days, today last. Counted from the answers:
 * the time between one answer and the next, as long as it is not a break.
 */
export function minutesThisWeek(attempts: readonly Attempt[], today: Day): { day: Day; minutes: number }[] {
  const ms = new Map<Day, number>();
  let last: { day: Day; t: number } | null = null;
  for (const a of [...attempts].sort((x, y) => x.at.localeCompare(y.at))) {
    const t = Date.parse(a.at);
    if (Number.isNaN(t)) continue;
    const day = dayOf(new Date(t));
    const gap = last && last.day === day ? t - last.t : Infinity;
    // The first answer of a sitting counts for its own thinking time.
    ms.set(day, (ms.get(day) ?? 0) + (gap <= BREAK_MS ? gap : Math.min(a.ms, BREAK_MS)));
    last = { day, t };
  }
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, minutes: Math.round((ms.get(day) ?? 0) / 60_000) };
  });
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export function weekday(day: Day): string {
  const [y, m, d] = day.split('-').map(Number);
  return WEEKDAYS[new Date(y!, m! - 1, d!).getDay()]!;
}
