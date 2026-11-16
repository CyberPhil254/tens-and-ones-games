import { describe, expect, it } from 'vitest';
import { newProfile, readProfileData, type ProfileData } from '../data/profile';
import { applyRound, checkLessons, type Given } from './apply';
import { LESSON, UNITS, playable, unitOf } from './curriculum';
import { awardsWon, give, nextEarned, stageDone, TREASURES, tricksKnown, unitDone } from './rewards';
import { place, reviewed } from './rules';
import { addDays, lessonState, newLesson, withLesson } from './state';

const day = '2026-11-15';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, day);
const giveAll = (d: ProfileData): ProfileData => {
  for (let e = nextEarned(d); e; e = nextEarned(d)) d = give(d, e);
  return d;
};
const right = (lesson: string): Given => ({ lesson, step: LESSON.get(lesson)!.steps.length - 1, clean: true, misses: 0, hint: false, ms: 3000, at: '2026-11-15T10:00:00.000Z' });
/** The starting check of a Stage 2 child, every question right first time. */
const checkedAllRight = (): ProfileData => applyRound(fresh(), 'check', false, checkLessons(2, UNITS).map((l) => right(l.id)), day).data;
const noRewards = { treasures: {}, tricks: {}, awards: {} };
/** A due review of a lesson, answered right first time. */
const confirm = (d: ProfileData, id: string): ProfileData => {
  const due = lessonState(d.child, id).due!;
  return { ...d, child: reviewed(d.child, id, { clean: true, ms: 3000 }, due) };
};
const master = (d: ProfileData, id: string): ProfileData => ({
  ...d,
  child: withLesson(d.child, id, { ...newLesson(), step: LESSON.get(id)!.steps.length - 1, passedOn: ['2026-11-01', '2026-11-02'], mastered: '2026-11-02', due: '2026-12-20' }),
});

describe('rewards follow mastery', () => {
  it('nothing is owed to a child who has mastered nothing, however much she has played', () => {
    const d = { ...fresh(), bones: 500 };
    expect(nextEarned(d)).toBeNull();
  });

  it('a mastered lesson earns one treasure, chosen between two, and only once', () => {
    let d = master(fresh(), 's1-see');
    const e = nextEarned(d)!;
    expect(e).toMatchObject({ kind: 'treasure', lesson: 's1-see' });
    if (e.kind !== 'treasure') throw new Error();
    expect(new Set(e.options).size).toBe(2);
    d = give(d, e, e.options[1]);
    expect(d.rewards.treasures['s1-see']).toBe(e.options[1]);
    expect(nextEarned(d)).toBeNull();
    // Reopened and mastered again: she keeps the treasure, and gets no second one.
    expect(nextEarned(master(d, 's1-see'))).toBeNull();
  });

  it('a pick that was not on offer is not honoured: she gets one that was', () => {
    const d = master(fresh(), 's1-see');
    const e = nextEarned(d)!;
    if (e.kind !== 'treasure') throw new Error();
    const other = TREASURES.find((t) => !e.options.includes(t))!;
    expect(e.options).toContain(give(d, e, other).rewards.treasures['s1-see']);
  });

  it('the offer is the kinds Oreo has fewest of', () => {
    let d = fresh();
    const seen: string[] = [];
    for (const l of UNITS.flatMap((u) => u.lessons).filter(playable).slice(0, 6)) {
      d = master(d, l.id);
      const e = nextEarned(d)!;
      if (e.kind !== 'treasure') throw new Error();
      seen.push(e.options[0]);
      d = give(d, e);
    }
    expect(new Set(seen).size).toBe(6); // six lessons, six different treasures
  });

  it('a unit earns a trick only when every lesson in it exists and is mastered', () => {
    const unit = UNITS.find((u) => u.lessons.every(playable))!;
    let d = fresh();
    for (const l of unit.lessons.slice(0, -1)) d = master(d, l.id);
    d = giveAll(d);
    expect(unitDone(d, unit)).toBe(false);
    expect(tricksKnown(d)).toEqual([]);
    d = master(d, unit.lessons[unit.lessons.length - 1]!.id);
    expect(nextEarned(d)?.kind).toBe('treasure'); // the treasure comes first
    d = give(d, nextEarned(d)!);
    expect(nextEarned(d)).toMatchObject({ kind: 'trick', unit: unit.id });
    d = give(d, nextEarned(d)!);
    expect(tricksKnown(d)).toHaveLength(1);
    expect(nextEarned(d)).toBeNull();
  });

  it('a unit with a lesson that is not built yet is never finished', () => {
    const unit = UNITS.find((u) => u.lessons.some(playable) && !u.lessons.every(playable));
    if (!unit) return; // every lesson is built: nothing to check
    let d = fresh();
    for (const l of unit.lessons.filter(playable)) d = master(d, l.id);
    expect(unitDone(d, unit)).toBe(false);
    expect(stageDone(d, 's1') && stageDone(d, 's2')).toBe(false);
  });

});

describe('rewards are only for what she did herself', () => {
  it('the starting check gives no treasure, no trick and no award, however much it marks as known', () => {
    const d = checkedAllRight();
    const known = Object.values(d.child.lessons).filter((l) => l.mastered);
    expect(known.length).toBeGreaterThan(15); // all of Stage 1 and more
    expect(known.every((l) => l.placed)).toBe(true);
    expect(UNITS.some((u) => u.lessons.every((l) => lessonState(d.child, l.id).mastered))).toBe(true); // whole units are known
    expect(d.rewards).toEqual(noRewards);
    expect(nextEarned(d)).toBeNull();
    expect(tricksKnown(d)).toEqual([]);
    expect(awardsWon(d)).toEqual([]);
    expect(UNITS.some((u) => unitDone(d, u))).toBe(false);
  });

  it('a known lesson earns its treasure once a due review confirms it, and not before', () => {
    let d: ProfileData = { ...fresh(), child: place(fresh().child, 's1-see', day) };
    expect(nextEarned(d)).toBeNull();
    // A review that is not yet due does not confirm it.
    d = { ...d, child: reviewed(d.child, 's1-see', { clean: true, ms: 3000 }, day) };
    expect(lessonState(d.child, 's1-see').placed).toBe(true);
    expect(nextEarned(d)).toBeNull();
    // A miss does not either.
    d = { ...d, child: reviewed(d.child, 's1-see', { clean: false, ms: 3000 }, addDays(day, 1)) };
    expect(nextEarned(d)).toBeNull();
    d = confirm(d, 's1-see');
    expect(lessonState(d.child, 's1-see').placed).toBeUndefined();
    expect(nextEarned(d)).toMatchObject({ kind: 'treasure', lesson: 's1-see' });
  });

  it('a unit with a known lesson earns its trick only when that lesson is confirmed too', () => {
    const unit = unitOf('s1-see');
    const [first, ...rest] = unit.lessons;
    let d: ProfileData = { ...fresh(), child: place(fresh().child, first!.id, day) };
    for (const l of rest) d = master(d, l.id);
    d = giveAll(d);
    expect(Object.keys(d.rewards.treasures).sort()).toEqual(rest.map((l) => l.id).sort());
    expect(unitDone(d, unit)).toBe(false);
    expect(tricksKnown(d)).toEqual([]);
    d = giveAll(confirm(d, first!.id));
    expect(unitDone(d, unit)).toBe(true);
    expect(tricksKnown(d)).toHaveLength(1);
    expect(d.rewards.treasures[first!.id]).toBeDefined();
  });

  it('a stage earns its award only when none of it is merely known', () => {
    let d = fresh();
    const s1 = UNITS.filter((u) => u.stage === 1 && !u.stretch).flatMap((u) => u.lessons);
    d = { ...d, child: place(d.child, s1[0]!.id, day) };
    for (const l of s1.slice(1)) d = master(d, l.id);
    d = giveAll(d);
    expect(stageDone(d, 's1')).toBe(false);
    expect(awardsWon(d)).toEqual([]);
    d = giveAll(confirm(d, s1[0]!.id));
    expect(awardsWon(d)).toEqual(['rosette']);
  });
});

describe('a profile saved by an earlier version', () => {
  /** What the earlier version did after the check: a treasure for every known lesson, then tricks and awards. */
  const oldProfile = (): ProfileData => {
    let d = checkedAllRight();
    const r = { treasures: {} as Record<string, string>, tricks: {} as Record<string, string>, awards: {} as Record<string, string> };
    for (const u of UNITS) {
      for (const l of u.lessons) if (lessonState(d.child, l.id).mastered) r.treasures[l.id] = 'ball';
      if (u.lessons.every((l) => lessonState(d.child, l.id).mastered)) r.tricks[u.id] = 'beg';
    }
    r.awards.s1 = 'rosette';
    d = { ...d, rewards: r };
    return d;
  };
  const reread = (d: ProfileData) => readProfileData(JSON.parse(JSON.stringify(d)), day)!;

  it('loses the rewards the starting check gave it', () => {
    const old = oldProfile();
    expect(Object.keys(old.rewards.tricks).length).toBeGreaterThanOrEqual(5);
    const d = reread(old);
    expect(d.rewards).toEqual(noRewards);
    expect(nextEarned(d)).toBeNull();
    expect(d.child).toEqual(old.child); // what she knows is untouched
  });

  it('keeps what she earned by playing, and what a review had already confirmed', () => {
    let old = oldProfile();
    const unit = unitOf('s1-see');
    // One unit she then played herself, a lesson elsewhere that a review went well on, and one that was reopened.
    for (const l of unit.lessons) old = master(old, l.id);
    const other = UNITS.find((u) => u !== unit && old.rewards.tricks[u.id])!;
    const seen = other.lessons[0]!.id, reopened = other.lessons[1]!.id;
    old = { ...old, child: withLesson(old.child, seen, { ...lessonState(old.child, seen), reviews: 1 }) };
    old = { ...old, child: withLesson(old.child, reopened, { ...newLesson(), step: 1, passedOn: ['2026-11-10'] }) };
    const d = reread(old);
    expect(Object.keys(d.rewards.treasures).sort()).toEqual([...unit.lessons.map((l) => l.id), seen, reopened].sort());
    expect(d.rewards.tricks).toEqual({ [unit.id]: 'beg' });
    expect(d.rewards.awards).toEqual({});
    expect(lessonState(d.child, seen).placed).toBeUndefined();
    expect(reread(d)).toEqual(d); // reading it again changes nothing more
  });
});
