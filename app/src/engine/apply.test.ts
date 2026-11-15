import { describe, expect, it } from 'vitest';
import { newProfile } from '../data/profile';
import { ALL_GAMES as PATH, LEVELS_OF as LEVELS } from '../maths/questions';
import { applyRound, checkLessons, doneToday, finishToday, lessonOfActivity, type Given } from './apply';
import { LESSON, UNITS, playable } from './curriculum';
import { statusOf } from './rules';
import { lessonState } from './state';

const D = '2026-11-16';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, D);
const answers = (lesson: string, step: number, cleans: boolean[]): Given[] =>
  cleans.map((clean, i) => ({ lesson, step, clean, misses: clean ? 0 : 1, hint: false, ms: 3000, at: `2026-11-16T15:00:0${i}.000Z` }));

describe('a finished round', () => {
  it('of the lesson she is learning adds bones, records every answer and can move the step', () => {
    const r = applyRound(fresh(), 'new', true, answers('s1-see', 0, [true, true, true, true, true, false]), D);
    expect(r.outcome).toEqual({ kind: 'up', to: 1, skipped: false });
    expect(r.bones).toBe(5);
    expect(r.data.bones).toBe(5);
    expect(r.data.attempts).toHaveLength(6);
    expect(r.data.attempts[5]).toMatchObject({ lesson: 's1-see', step: 0, part: 'new', clean: false, misses: 1 });
    expect(lessonState(r.data.child, 's1-see')).toMatchObject({ step: 1, answers: 6 });
  });
  it('in free play moves the rating and nothing else', () => {
    const r = applyRound(fresh(), 'free', false, answers('s1-see', 0, Array(6).fill(true)), D);
    expect(r.outcome).toBeUndefined();
    expect(lessonState(r.data.child, 's1-see')).toMatchObject({ step: 0, passedOn: [] });
    expect(lessonState(r.data.child, 's1-see').rating).toBeGreaterThan(0);
    expect(r.data.bones).toBe(6);
  });
  it('of the warm-up moves review schedules, never steps', () => {
    let d = fresh();
    d = applyRound(d, 'check', false, answers('s1-see', 2, [true]), D).data;
    const due = lessonState(d.child, 's1-see').due!;
    const r = applyRound(d, 'warm', false, answers('s1-see', 2, [true, true]), due);
    expect(r.outcome).toBeUndefined();
    expect(lessonState(r.data.child, 's1-see')).toMatchObject({ reviews: 1, mastered: D });
  });
});

describe('the starting check', () => {
  it('asks about one lesson from each unit below her stage and the first of each unit of her own', () => {
    const stage2 = checkLessons(2, UNITS).map((l) => l.id);
    // The rule, whatever lessons exist: from each unit below her stage the last built lesson, from each of her own the first.
    const built = (u: (typeof UNITS)[number]) => u.lessons.filter(playable).map((l) => l.id);
    const rule = (stage: 1 | 2) =>
      UNITS.filter((u) => !u.stretch && built(u).length && u.stage <= stage).map((u) => (u.stage < stage ? built(u).at(-1)! : built(u)[0]!)).slice(0, 10);
    expect(stage2).toEqual(rule(2));
    expect(checkLessons(1, UNITS).map((l) => l.id)).toEqual(rule(1));
    // And some things that stay true: it starts with the first lesson, asks nothing from the stretch unit, and no lesson twice.
    expect(stage2[0]).toBe('s1-see');
    expect(stage2.some((id) => id.startsWith('x-'))).toBe(false);
    expect(new Set(stage2).size).toBe(stage2.length);
    expect(checkLessons(1, UNITS).every((l) => l.id.startsWith('s1-'))).toBe(true);
    expect(stage2.length).toBeLessThanOrEqual(10);
  });
  it('marks what she got right first time as known, with what it is built on, and gives no bones', () => {
    const given = [...answers('s1-ten', 2, [true]), ...answers('s1-teens', 2, [true]), ...answers('s2-count', 1, [false]), ...answers('s2-bonds', 0, [true])];
    const r = applyRound(fresh(), 'check', false, given, D);
    expect(r.data.checked).toBe(true);
    expect(r.data.bones).toBe(0);
    for (const id of ['s1-ten', 's1-see', 's1-teens', 's2-bonds']) expect(lessonState(r.data.child, id)).toMatchObject({ mastered: D, placed: true });
    expect(lessonState(r.data.child, 's2-count').mastered).toBeUndefined();
    expect(statusOf(r.data.child, LESSON.get('s2-count')!, D)).toBe('open');
    expect(r.data.attempts.every((a) => a.part === 'check')).toBe(true);
  });
});

describe("today's games", () => {
  it('are done for the day once finished, and open again the next day', () => {
    const d = finishToday(fresh(), D);
    expect(doneToday(d, D)).toBe(true);
    expect(doneToday(d, '2026-11-17')).toBe(false);
    expect(doneToday(fresh(), D)).toBe(false);
  });
});

describe('game levels and lessons', () => {
  it('every level of every game belongs to a lesson and a step', () => {
    for (const game of PATH) for (let level = 1; level <= LEVELS[game]; level++) expect(lessonOfActivity({ game, level }), `${game} ${level}`).not.toBeNull();
    expect(lessonOfActivity({ game: 'friends', level: 2 })).toMatchObject({ lesson: { id: 's1-ten' }, step: 1 });
    expect(lessonOfActivity({ game: 'story', level: 1, variant: 2 })).toMatchObject({ lesson: { id: 's1-ten' }, step: 2 });
    expect(lessonOfActivity({ game: 'story', level: 3, variant: 0 })).toMatchObject({ lesson: { id: 'x-fill' } });
  });
});
