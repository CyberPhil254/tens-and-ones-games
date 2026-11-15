import { describe, expect, it } from 'vitest';
import { newProfile } from '../data/profile';
import { ALL_GAMES as PATH, LEVELS_OF as LEVELS } from '../maths/questions';
import { applyRound, checkLessons, doneToday, finishToday, lessonOfActivity, type Given } from './apply';
import { LESSONS, UNITS, playable, unitOf } from './curriculum';
import { lessonState } from './state';
import { nextLessons } from './today';

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
    // From each unit below her stage, the lesson named as its probe (or its last); from each unit of her own, the first. Ten at most.
    const built = (u: (typeof UNITS)[number]) => u.lessons.filter(playable).map((l) => l.id);
    const rule = (stage: 1 | 2) =>
      UNITS.filter((u) => !u.stretch && built(u).length && u.stage <= stage).map((u) => (u.stage < stage ? u.probe ?? built(u).at(-1)! : built(u)[0]!)).slice(0, 10);
    expect(stage2).toEqual(rule(2));
    expect(checkLessons(1, UNITS).map((l) => l.id)).toEqual(rule(1));
    // What stays true: counting comes first, the stretch unit is never asked about, no lesson twice, every probe is a real lesson of its unit.
    expect(stage2[0]).toBe('s1-count');
    expect(stage2.slice(0, 6)).toEqual(['s1-count', 's1-teens', 's1-skip', 's1-calc20', 's1-half', 's1-money']);
    expect(stage2.some((id) => id.startsWith('x-'))).toBe(false);
    expect(new Set(stage2).size).toBe(stage2.length);
    for (const u of UNITS) if (u.probe) expect(built(u)).toContain(u.probe);
    expect(checkLessons(1, UNITS).every((l) => l.id.startsWith('s1-'))).toBe(true);
    expect(stage2.length).toBeLessThanOrEqual(10);
  });
  it('marks what she got right first time as known, with what it is built on, and gives no bones', () => {
    // A Stage 2 child: right about adding to 20 and about friends of 20 and 100, wrong about packing in tens.
    const given = [...answers('s1-calc20', 2, [true]), ...answers('s2-count', 1, [false]), ...answers('s2-bonds', 0, [true])];
    const r = applyRound(fresh(), 'check', false, given, D);
    expect(r.data.checked).toBe(true);
    expect(r.data.bones).toBe(0);
    // The whole unit below her stage is known, not only the lesson that was asked: she is not sent back through it.
    for (const l of unitOf('s1-calc20').lessons) expect(lessonState(r.data.child, l.id), l.id).toMatchObject({ mastered: D, placed: true });
    // And what those lessons are built on.
    for (const id of ['s1-count', 's1-see']) expect(lessonState(r.data.child, id)).toMatchObject({ mastered: D, placed: true });
    // In her own stage only the lesson asked, with what it needs.
    expect(lessonState(r.data.child, 's2-bonds')).toMatchObject({ mastered: D, placed: true });
    expect(lessonState(r.data.child, 's2-inverse').mastered).toBeUndefined();
    // What she got wrong is not marked, and neither is a unit she was not right about.
    expect(lessonState(r.data.child, 's2-count').mastered).toBeUndefined();
    expect(lessonState(r.data.child, 's1-teens').mastered).toBeUndefined();
    expect(r.data.attempts.every((a) => a.part === 'check')).toBe(true);
  });
  it('a Stage 1 child is never marked beyond the lesson she was asked', () => {
    const one = { ...fresh(), profile: { ...fresh().profile, stage: 1 as const } };
    const r = applyRound(one, 'check', false, answers('s1-add', 2, [true]), D);
    expect(lessonState(r.data.child, 's1-add')).toMatchObject({ mastered: D, placed: true });
    expect(lessonState(r.data.child, 's1-calc20').mastered).toBeUndefined();
  });
  it('a Stage 2 child who is right about every Stage 1 unit starts in Stage 2', () => {
    const given = checkLessons(2, UNITS).filter((l) => l.id.startsWith('s1-')).flatMap((l) => answers(l.id, l.steps.length - 1, [true]));
    const r = applyRound(fresh(), 'check', false, given, D);
    for (const l of LESSONS.filter((x) => x.id.startsWith('s1-'))) expect(lessonState(r.data.child, l.id).mastered, l.id).toBe(D);
    expect(nextLessons(r.data.child, D).every((l) => l.id.startsWith('s2-'))).toBe(true);
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
