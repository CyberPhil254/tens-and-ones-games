import { describe, expect, it } from 'vitest';
import { newProfile, readProfileData } from '../data/profile';
import { ALL_GAMES as PATH, LEVELS_OF as LEVELS } from '../maths/questions';
import { applyRound, CHECK_ASKS, checkLessons, doneToday, finishToday, lessonOfActivity, skipCheck, withStage, type Given } from './apply';
import { LESSON, LESSONS, UNITS, unitOf } from './curriculum';
import { CONFIG } from './config';
import { builtOn, frontier, neededBy, passedOnce, pathFor, place, plotOf, reviewed, roundFinished, statusOf, stepBack } from './rules';
import { owedNext, paws } from './rewards';
import { addDays, lessonState, newLesson, withLesson, type ChildState } from './state';
import { nextLessons } from './today';

const D = '2026-11-16';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, D);
const answers = (lesson: string, step: number, cleans: boolean[]): Given[] =>
  cleans.map((clean, i) => ({ lesson, step, clean, misses: clean ? 0 : 1, hint: false, ms: 3000, at: `2026-11-16T15:00:0${i}.000Z` }));

/** A good round at the lesson's last step: its last step is passed. */
const roundAtLastStep = (child: ChildState, id: string): ChildState =>
  roundFinished(withLesson(child, id, { ...lessonState(child, id), step: LESSON.get(id)!.steps.length - 1 }), id, CONFIG.round, D).state;

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

describe('the starting check for a Stage 1 child', () => {
  const one = () => newProfile('child-1', 'Amani', 'zebra', 1, D);
  it('asks one question about the first lesson of every Stage 1 unit', () => {
    const asked = checkLessons(1, UNITS).map((l) => l.id);
    expect(asked).toEqual(UNITS.filter((u) => u.stage === 1 && !u.stretch).map((u) => u.lessons[0]!.id));
    expect(asked[0]).toBe('s1-count');
    expect(new Set(asked).size).toBe(asked.length);
  });
  it('marks what she got right first time as known, with what it is built on, gives no bones, and never marks beyond the lesson asked', () => {
    const r = applyRound(one(), 'check', false, [...answers('s1-add', 2, [true]), ...answers('s1-names', 1, [false])], D);
    expect(r.data.checked).toBe(true);
    expect(r.data.bones).toBe(0);
    expect(lessonState(r.data.child, 's1-add')).toMatchObject({ mastered: D, placed: true });
    expect(lessonState(r.data.child, 's1-count')).toMatchObject({ mastered: D, placed: true }); // what adding is built on
    expect(lessonState(r.data.child, 's1-calc20').mastered).toBeUndefined();
    expect(lessonState(r.data.child, 's1-names').mastered).toBeUndefined();
    expect(Object.values(r.data.child.lessons).some((l) => l.back)).toBe(false); // nothing is a step back in her own stage
    expect(r.data.attempts.every((a) => a.part === 'check')).toBe(true);
  });
});

describe('the starting check for a Stage 2 child: she starts in Stage 2', () => {
  const S1 = LESSONS.filter((l) => l.id.startsWith('s1-')).map((l) => l.id);
  const BUILT_ON = ['s1-see', 's1-names', 's1-teens', 's1-ordinal', 's1-skip', 's1-oddeven', 's1-add', 's1-sub', 's1-ten', 's1-calc20', 's1-half', 's1-money'];
  /** The whole check answered: everything right, except the lessons named, which are missed as often as `misses` says. */
  const check = (misses: Record<string, number> = {}) => {
    const seen: Record<string, number> = {};
    const given = checkLessons(2, UNITS).flatMap((l) => {
      const nth = (seen[l.id] = (seen[l.id] ?? 0) + 1);
      return answers(l.id, l.steps.length - 1, [nth > (misses[l.id] ?? 0)]);
    });
    return applyRound(fresh(), 'check', false, given, D).data;
  };
  const next = (d: ReturnType<typeof check>) => frontier(d.child).map((l) => l.id);

  it('looks for gaps properly: two questions about each Stage 1 lesson that a Stage 2 lesson builds on, never the same lesson twice running', () => {
    const asked = checkLessons(2, UNITS).map((l) => l.id);
    expect(builtOn(2).map((l) => l.id)).toEqual(BUILT_ON);
    // Each of them is needed, directly, by a lesson of Stage 2 or beyond.
    for (const id of BUILT_ON) expect(LESSONS.some((l) => !l.id.startsWith('s1-') && l.needs.includes(id)), id).toBe(true);
    expect(asked).toHaveLength(BUILT_ON.length * CHECK_ASKS);
    expect(CHECK_ASKS).toBe(2);
    for (const id of BUILT_ON) expect(asked.filter((x) => x === id)).toHaveLength(2);
    expect(asked.every((id, i) => id !== asked[i - 1])).toBe(true);
    expect(asked.every((id) => id.startsWith('s1-'))).toBe(true); // nothing of Stage 2 is asked: she starts there anyway
    // About three minutes: two dozen questions.
    expect(asked.length).toBeLessThanOrEqual(24);
  });

  it('everything right: she starts at the first Stage 2 lesson, with all of Stage 1 known', () => {
    const d = check();
    expect(d.checked).toBe(true);
    expect(d.bones).toBe(0);
    for (const id of S1) expect(lessonState(d.child, id), id).toMatchObject({ mastered: D, placed: true, back: true });
    expect(next(d)[0]).toBe('s2-count');
    expect(next(d).every((id) => id.startsWith('s2-'))).toBe(true);
    expect(pathFor(d.child).filter((l) => !passedOnce(lessonState(d.child, l.id)))[0]!.id).toBe('s2-count');
    expect(nextLessons(d.child, D)[0]!.id).toBe('s2-count');
  });

  it('a single question missed is not a gap: she still starts in Stage 2, with nothing of Stage 1 on her path', () => {
    for (const id of BUILT_ON) {
      const d = check({ [id]: 1 });
      expect(next(d)[0], `one miss in ${id}`).toBe('s2-count');
      for (const s1 of S1) expect(lessonState(d.child, s1).placed, s1).toBe(true);
      expect(pathFor(d.child).filter((l) => !passedOnce(lessonState(d.child, l.id))).every((l) => !l.id.startsWith('s1-'))).toBe(true);
    }
    // Even one miss in every lesson asked: still no gap, still Stage 2.
    expect(next(check(Object.fromEntries(BUILT_ON.map((id) => [id, 1]))))[0]).toBe('s2-count');
  });

  it('she clearly lacks adding to 20: exactly that lesson is on her path, directly before the first Stage 2 lesson that needs it', () => {
    const d = check({ 's1-calc20': 2 }); // both questions about "Sums to 20" missed
    const sums = lessonState(d.child, 's1-calc20');
    expect(sums.mastered).toBeUndefined();
    expect(sums.placed).toBeUndefined();
    expect(sums.back).toBe(true);
    expect(stepBack(d.child, LESSON.get('s1-calc20')!)).toBe(true);
    // Every other Stage 1 lesson is known, also the ones "Sums to 20" is built on: no detour through Stage 1.
    for (const id of S1.filter((x) => x !== 's1-calc20')) expect(lessonState(d.child, id).placed, id).toBe(true);
    // She still starts in Stage 2, at its first lesson.
    expect(next(d)[0]).toBe('s2-count');
    // On her path the lesson stands directly before "Tens and ones sums", the first Stage 2 lesson that needs it, and nowhere else.
    const path = pathFor(d.child).map((l) => l.id);
    expect(neededBy(d.child, LESSON.get('s1-calc20')!)!.id).toBe('s2-calc');
    expect(path.indexOf('s1-calc20')).toBe(path.indexOf('s2-calc') - 1);
    expect(path.filter((id) => id === 's1-calc20')).toHaveLength(1);
    expect(path.filter((id) => id.startsWith('s1-') && !lessonState(d.child, id).placed)).toEqual(['s1-calc20']);
    expect(plotOf(d.child, LESSON.get('s1-calc20')!)).toBe(unitOf('s2-calc'));
    // It starts at the step that fits, not at step one: the step below the one she was asked and missed.
    expect(sums.step).toBe(LESSON.get('s1-calc20')!.steps.length - 2);
    expect(sums.step).toBeGreaterThan(0);
    // The steps she was let off are not steps she passed: the gap earns nothing by itself.
    expect(sums.from).toBe(sums.step);
    expect([paws(d), owedNext(d)]).toEqual([0, null]);
    expect(paws({ ...d, child: withLesson(d.child, 's1-calc20', { ...sums, step: sums.step + 1 }) })).toBe(1); // the next step, played, is her first paw
    // "Tens and ones sums" waits for it; when the path gets there, the step back is the next stone.
    let child = d.child;
    for (const l of pathFor(child)) {
      if (l.id === 's1-calc20') break;
      if (!passedOnce(lessonState(child, l.id))) child = roundAtLastStep(child, l.id);
    }
    expect(frontier(child)[0]!.id).toBe('s1-calc20');
    expect(statusOf(child, LESSON.get('s2-calc')!, D)).toBe('locked');
    child = roundAtLastStep(child, 's1-calc20');
    expect(frontier(child)[0]!.id).toBe('s2-calc');
  });

  it('several gaps: each stands before the lesson that needs it, in the order of the path', () => {
    const d = check({ 's1-add': 2, 's1-sub': 2, 's1-teens': 2 });
    const path = pathFor(d.child).map((l) => l.id);
    const ahead = path.filter((id) => !passedOnce(lessonState(d.child, id)));
    expect(ahead[0]).toBe('s1-teens'); // "Pack in tens", the first Stage 2 lesson, needs it
    expect(ahead[1]).toBe('s2-count');
    expect(path.slice(path.indexOf('s1-add'), path.indexOf('s2-inverse') + 1)).toEqual(['s1-add', 's1-sub', 's2-inverse']);
    expect(next(d)[0]).toBe('s1-teens');
    expect(frontier(d.child).length).toBeLessThanOrEqual(2);
  });

  it('a parent who skips the check: she starts in Stage 2 all the same', () => {
    const d = skipCheck(fresh(), D);
    expect(d.checked).toBe(true);
    expect(next(d)[0]).toBe('s2-count');
    for (const id of S1) expect(lessonState(d.child, id).placed, id).toBe(true);
    // A Stage 1 child who skips starts at the first stone, with nothing marked.
    const one = skipCheck(newProfile('child-1', 'Amani', 'zebra', 1, D), D);
    expect(one.child.lessons).toEqual({});
    expect(frontier(one.child)[0]!.id).toBe('s1-count');
  });

  it('a known Stage 1 lesson that review reopens becomes a quick step back, not the start of her path', () => {
    let child = check().child;
    const due = lessonState(child, 's1-ten').due!;
    child = reviewed(child, 's1-ten', { clean: false, ms: 3000 }, due);
    child = reviewed(child, 's1-ten', { clean: false, ms: 3000 }, addDays(due, 1));
    expect(lessonState(child, 's1-ten').mastered).toBeUndefined();
    expect(stepBack(child, LESSON.get('s1-ten')!)).toBe(true);
    const path = pathFor(child).map((l) => l.id);
    expect(path.indexOf('s1-ten')).toBe(path.indexOf('s2-bonds') - 1);
    expect(frontier(child)[0]!.id).toBe('s2-count');
  });
});

describe('existing profiles are placed again by these rules', () => {
  const reread = (d: ReturnType<typeof fresh>) => readProfileData(JSON.parse(JSON.stringify(d)), D)!;
  it('a Stage 2 child whom one wrong answer had sent back to Stage 1 now starts in Stage 2; what she earned by playing is untouched', () => {
    // As the earlier check left her: some Stage 1 units known, one not (a single wrong answer), and since then she has
    // mastered "Count to 20" by playing, is half way through "Adding", and has bones and a treasure.
    let child = fresh().child;
    for (const id of ['s1-see', 's1-zero', 's1-estimate', 's1-names', 's1-teens']) child = place(child, id, '2026-11-10');
    child = withLesson(child, 's1-count', { ...newLesson(), step: 2, passedOn: ['2026-11-11', '2026-11-12'], mastered: '2026-11-12', due: '2026-11-19', reviews: 2, answers: 30, rating: 2 });
    child = withLesson(child, 's1-add', { ...newLesson(), step: 1, answers: 12, rating: 0.8 });
    const old = { ...fresh(), child, checked: true, bones: 41, rewards: { treasures: { t1: 'ball' }, tricks: {}, awards: {} } };
    const d = reread(old);
    // She starts in Stage 2.
    expect(frontier(d.child)[0]!.id).toBe('s2-count');
    // What she earned by playing is exactly as it was.
    expect(lessonState(d.child, 's1-count')).toEqual({ ...lessonState(old.child, 's1-count'), back: true });
    expect(d.bones).toBe(41);
    expect(d.rewards).toEqual(old.rewards);
    // What the earlier check had marked stays as it was marked, with its review dates.
    expect(lessonState(d.child, 's1-teens')).toEqual({ ...lessonState(old.child, 's1-teens'), back: true });
    // The lesson she is in the middle of keeps its step and becomes a quick step back before the lesson that needs it.
    expect(lessonState(d.child, 's1-add')).toMatchObject({ step: 1, answers: 12, rating: 0.8, back: true });
    expect(lessonState(d.child, 's1-add').placed).toBeUndefined();
    const path = pathFor(d.child).map((l) => l.id);
    expect(path.indexOf('s1-add')).toBe(path.indexOf('s2-inverse') - 1);
    // The Stage 1 lessons she had not got to are known now, not stones in front of her.
    for (const id of ['s1-sub', 's1-calc20', 's1-money', 's1-half']) expect(lessonState(d.child, id)).toMatchObject({ placed: true, mastered: D, back: true });
    // Reading it again changes nothing more.
    expect(reread(d)).toEqual(d);
  });
  it('a Stage 1 child, and a child who has not done or skipped the check yet, are left alone', () => {
    const one = { ...newProfile('child-1', 'Amani', 'zebra', 1, D), checked: true, child: place(fresh().child, 's1-see', D) };
    expect(reread(one)).toEqual(one);
    expect(reread(fresh())).toEqual(fresh());
  });
  it('a parent who moves her up to Stage 2 gets the same; moving her back down makes Stage 1 her own stage again', () => {
    const one = { ...newProfile('child-1', 'Amani', 'zebra', 1, D), checked: true };
    const up = withStage(one, 2, D);
    expect(up.profile.stage).toBe(2);
    expect(frontier(up.child)[0]!.id).toBe('s2-count');
    const down = withStage(up, 1, D);
    expect(Object.values(down.child.lessons).some((l) => l.back)).toBe(false);
    expect(down.profile.stage).toBe(1);
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
