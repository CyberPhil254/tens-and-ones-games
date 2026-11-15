import { describe, expect, it } from 'vitest';
import { newProfile, type Attempt, type ProfileData } from '../data/profile';
import { LESSON } from '../engine/curriculum';
import { newLesson, withLesson } from '../engine/state';
import { minutesThisWeek, progressByUnit, skills, weekday } from './summary';

const day = '2026-11-15';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, day);
const set = (d: ProfileData, id: string, more: object): ProfileData => ({ ...d, child: withLesson(d.child, id, { ...newLesson(), ...more }) });
const at = (iso: string, ms = 4000): Attempt => ({ lesson: 's1-see', step: 0, part: 'new', clean: true, misses: 0, hint: false, ms, at: iso });
const local = (d: string, h: number, m: number, s = 0) => new Date(`${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`).toISOString();

describe('what the parents see', () => {
  it('progress by unit counts only lessons that exist', () => {
    let d = set(fresh(), 's1-see', { mastered: '2026-11-10', step: 2 });
    d = set(d, 's1-ten', { answers: 6 });
    const u1 = progressByUnit(d).find((p) => p.unit.id === 's1-u1')!;
    expect(u1).toMatchObject({ built: 1, mastered: 1, started: 0 });
    const u4 = progressByUnit(d).find((p) => p.unit.lessons.some((l) => l.id === 's1-ten'))!;
    expect(u4.started).toBe(1);
    expect(progressByUnit(fresh()).every((p) => p.mastered === 0 && p.started === 0)).toBe(true);
  });

  it('strong, weak and slow', () => {
    let d = set(fresh(), 's1-see', { mastered: '2026-11-10', step: 2, rating: 4, answers: 30 });
    d = set(d, 's1-ten', { step: 1, rating: -2, answers: 18 });
    d = set(d, 's2-count', { mastered: '2026-11-10', step: 1, rating: 3, answers: 30, slow: true });
    const s = skills(d);
    expect(s.strong.map((l) => l.id)).toEqual(['s1-see', 's2-count']);
    expect(s.weak.map((l) => l.id)).toEqual(['s1-ten']);
    expect(s.slow.map((l) => l.id)).toEqual(['s2-count']);
    expect(LESSON.has('s1-ten')).toBe(true);
  });

  it('a lesson she has barely tried is not called weak', () => {
    const d = set(fresh(), 's1-ten', { rating: -2, answers: 2 });
    expect(skills(d).weak).toEqual([]);
  });

  it('minutes this week: time between answers, breaks left out, seven days ending today', () => {
    const attempts = [
      at(local('2026-11-15', 17, 0, 0), 20_000), // first of a sitting: its own 20 s
      at(local('2026-11-15', 17, 1, 0)), // +60 s
      at(local('2026-11-15', 17, 3, 0)), // +120 s
      at(local('2026-11-15', 19, 0, 0), 30_000), // after a break: its own 30 s
      at(local('2026-11-13', 8, 0, 0), 60_000),
      at(local('2026-11-01', 8, 0, 0), 60_000), // more than a week ago
    ];
    const week = minutesThisWeek(attempts, day);
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ day, minutes: 4 }); // 230 s
    expect(week[4]).toEqual({ day: '2026-11-13', minutes: 1 });
    expect(week.reduce((a, b) => a + b.minutes, 0)).toBe(5);
    expect(weekday('2026-11-15')).toBe('Sun');
  });
});
