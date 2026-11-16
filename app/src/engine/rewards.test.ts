import { describe, expect, it } from 'vitest';
import { newProfile, readProfileData, type ProfileData } from '../data/profile';
import { applyRound, checkLessons, finishToday, type Given } from './apply';
import { LESSON, LESSONS, PATH, UNITS, unitOf } from './curriculum';
import {
  ALL_PAWS, TREASURE_AT, TREASURES, TRICK_AT, TRICKS, WELCOME, awardsWon, badgesWon, earnedKey, give, goals, lessonsMastered, nextEarned, nextGoal, paws, stageDone,
  stepsPassed, treasureSlot, treasuresHad, trickSlot, tricksKnown, unitDone,
} from './rewards';
import { place, reviewed } from './rules';
import { addDays, lessonState, newLesson, withLesson } from './state';

const day = '2026-11-15';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, day);
const giveAll = (d: ProfileData): ProfileData => {
  for (let e = nextEarned(d), n = 0; e && n < 400; e = nextEarned(d), n++) d = give(d, e);
  return d;
};
const owed = (d: ProfileData): string[] => {
  const out: string[] = [];
  for (let e = nextEarned(d), n = 0; e && n < 400; e = nextEarned(d), n++) { out.push(earnedKey(e)); d = give(d, e); }
  return out;
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
const set = (d: ProfileData, id: string, l: Partial<ReturnType<typeof newLesson>>): ProfileData => ({ ...d, child: withLesson(d.child, id, { ...newLesson(), ...l }) });
/** A lesson at step `n` (so n steps passed), its last step passed once, or mastered. */
const atStep = (d: ProfileData, id: string, n: number) => set(d, id, { step: n });
const pass = (d: ProfileData, id: string) => set(d, id, { step: LESSON.get(id)!.steps.length - 1, passedOn: ['2026-11-01'] });
const master = (d: ProfileData, id: string) => set(d, id, { step: LESSON.get(id)!.steps.length - 1, passedOn: ['2026-11-01', '2026-11-02'], mastered: '2026-11-02', due: '2026-12-20' });

describe('the schedule', () => {
  it('treasures come at the 1st, 3rd and 6th paw, then at every third; tricks at the 2nd, 5th, 9th, 14th, 20th and 27th lesson mastered', () => {
    expect(TREASURE_AT.slice(0, 7)).toEqual([1, 3, 6, 9, 12, 15, 18]);
    expect(TREASURE_AT.every((at, i) => i === 0 || at > TREASURE_AT[i - 1]!)).toBe(true);
    expect(TREASURE_AT[TREASURE_AT.length - 1]!).toBeLessThanOrEqual(ALL_PAWS);
    expect(ALL_PAWS - TREASURE_AT[TREASURE_AT.length - 1]!).toBeLessThan(3); // they go on to the end of the path
    expect(TRICK_AT).toEqual([2, 5, 9, 14, 20, 27]);
    expect(TRICK_AT).toHaveLength(TRICKS.length); // one for each trick Oreo has a picture of
    // There is a paw for every step of every lesson and one for mastering it.
    expect(ALL_PAWS).toBe(LESSONS.reduce((n, l) => n + l.steps.length + 1, 0));
  });
});

describe('rewards come from what she has achieved, never from time played', () => {
  it('nothing is owed to a child who has passed nothing, however much she has played', () => {
    const d = { ...fresh(), bones: 500 };
    expect(nextEarned(d)).toBeNull();
    expect(paws(d)).toBe(0);
  });

  it('the first time she finishes today’s games: a welcome treasure, her choice of two, and never a second one', () => {
    let d = finishToday(fresh(), day);
    const e = nextEarned(d)!;
    expect(e).toMatchObject({ kind: 'treasure', slot: WELCOME });
    if (e.kind !== 'treasure') throw new Error();
    expect(new Set(e.options).size).toBe(2);
    d = give(d, e, e.options[1]);
    expect(d.rewards.treasures[WELCOME]).toBe(e.options[1]);
    expect(nextEarned(d)).toBeNull();
    expect(nextEarned(finishToday(d, addDays(day, 1)))).toBeNull(); // the second day finished brings no treasure by itself
  });

  it('a pick that was not on offer is not honoured: she gets one that was', () => {
    const d = finishToday(fresh(), day);
    const e = nextEarned(d)!;
    if (e.kind !== 'treasure') throw new Error();
    const other = TREASURES.find((t) => !e.options.includes(t))!;
    expect(e.options).toContain(give(d, e, other).rewards.treasures[WELCOME]);
  });

  it('a paw for every step passed and for every lesson mastered', () => {
    let d = atStep(fresh(), 's1-count', 1);
    expect([stepsPassed(d), paws(d)]).toEqual([1, 1]);
    d = atStep(d, 's1-count', 2);
    expect(paws(d)).toBe(2);
    d = pass(d, 's1-count'); // the last step: all three steps are passed
    expect([stepsPassed(d), lessonsMastered(d), paws(d)]).toEqual([3, 0, 3]);
    d = master(d, 's1-count');
    expect([stepsPassed(d), lessonsMastered(d), paws(d)]).toEqual([3, 1, 4]);
    // A perfect round can jump a step: a lesson passed still counts all its steps.
    expect(paws(pass(fresh(), 's1-see'))).toBe(LESSON.get('s1-see')!.steps.length);
  });

  it('treasures follow the paws: the 1st, the 3rd, the 6th, then every third', () => {
    let d = atStep(fresh(), 's1-count', 1);
    expect(owed(d)).toEqual([`treasure ${treasureSlot(1)}`]);
    d = giveAll(d);
    d = atStep(d, 's1-count', 2);
    expect(owed(d)).toEqual([]); // two paws: nothing new
    d = pass(d, 's1-count');
    expect(owed(d)).toEqual([`treasure ${treasureSlot(3)}`]);
    d = giveAll(master(d, 's1-count')); // 4 paws
    d = atStep(d, 's1-see', 2); // 6 paws
    expect(owed(d)).toEqual([`treasure ${treasureSlot(6)}`]);
    d = giveAll(d);
    d = master(d, 's1-see'); // 3 + 1 + 3 + 1 = 8 paws, and the second lesson mastered
    expect(paws(d)).toBe(8);
    expect(owed(d)).toEqual([`trick ${trickSlot(2)}`]);
    d = giveAll(d);
    d = atStep(d, 's1-zero', 1); // 9 paws
    expect(owed(d)).toEqual([`treasure ${treasureSlot(9)}`]);
  });

  it('a treasure not collected stays owed, and several can be owed at once, the earliest first', () => {
    const d = master(master(fresh(), 's1-count'), 's1-see'); // 8 paws, two lessons mastered, nothing collected
    expect(owed(d)).toEqual([`treasure ${treasureSlot(1)}`, `treasure ${treasureSlot(3)}`, `treasure ${treasureSlot(6)}`, `trick ${trickSlot(2)}`]);
  });

  it('the offer is the kinds Oreo has fewest of', () => {
    let d = fresh();
    const seen: string[] = [];
    for (const [i, l] of PATH.slice(0, 6).entries()) {
      d = master(d, l.id);
      for (let e = nextEarned(d); e; e = nextEarned(d)) {
        if (e.kind === 'treasure') seen.push(e.options[0]);
        d = give(d, e);
      }
      expect(seen.length, `after ${i + 1} lessons`).toBeGreaterThan(i);
    }
    expect(new Set(seen.slice(0, 6)).size).toBe(6); // the first six treasures are six different ones
    expect(Object.values(treasuresHad(d)).reduce((a, b) => a + b, 0)).toBe(seen.length);
  });

  it('tricks follow lessons mastered, one new trick each time, in a fixed order', () => {
    let d = fresh();
    const got: number[] = [];
    for (const [i, l] of PATH.entries()) {
      d = master(d, l.id);
      if (owed(d).some((k) => k.startsWith('trick'))) got.push(i + 1);
      d = giveAll(d);
    }
    expect(got).toEqual([2, 5, 9, 14, 20, 27]);
    expect(tricksKnown(d)).toEqual([...TRICKS]);
    // A lesson only passed, not yet mastered, does not count towards a trick.
    expect(owed(pass(master(fresh(), 's1-count'), 's1-see')).filter((k) => k.startsWith('trick'))).toEqual([]);
  });

  it('a unit finished earns its badge, a stage finished its award', () => {
    const unit = unitOf('s1-see');
    let d = fresh();
    for (const l of unit.lessons.slice(0, -1)) d = master(d, l.id);
    d = giveAll(d);
    expect(unitDone(d, unit)).toBe(false);
    expect(badgesWon(d)).toEqual([]);
    d = master(d, unit.lessons[unit.lessons.length - 1]!.id);
    expect(owed(d)).toContain(`badge ${unit.id}`);
    d = giveAll(d);
    expect(badgesWon(d)).toEqual([unit.id]);
    expect(awardsWon(d)).toEqual([]);
    for (const u of UNITS.filter((x) => x.stage === 1 && !x.stretch)) for (const l of u.lessons) d = master(d, l.id);
    expect(stageDone(d, 's1')).toBe(true);
    expect(owed(d)).toContain('award s1');
    d = giveAll(d);
    expect(awardsWon(d)).toEqual(['rosette']);
    expect(badgesWon(d)).toHaveLength(6);
  });

  it('nothing can be lost: a lesson reopened by review takes no reward back, and gives none twice', () => {
    let d = giveAll(master(master(fresh(), 's1-count'), 's1-see'));
    const had = d.rewards;
    d = set(d, 's1-see', { step: 2, passedOn: ['2026-11-02'] }); // reopened: passed, no longer mastered
    expect(d.rewards).toEqual(had);
    expect(nextEarned(d)).toBeNull();
    expect(nextEarned(master(d, 's1-see'))).toBeNull(); // mastered again: the same paws, the same trick, nothing new
  });
});

describe('what she is working towards', () => {
  it('a new child: the welcome treasure for today’s games, the first paw for a treasure, two lessons for the first trick', () => {
    expect(goals(fresh())).toEqual([
      { kind: 'welcome', more: 1, of: 1, done: 0 },
      { kind: 'treasure', more: 1, of: 1, done: 0 },
      { kind: 'trick', trick: 'high-five', more: 2, of: 2, done: 0 },
    ]);
  });
  it('the row counts from the reward before: two of three paws since the last treasure, one more to go', () => {
    const d = giveAll(atStep(master(fresh(), 's1-count'), 's1-see', 1)); // 5 paws: after the 3rd, before the 6th
    expect(goals(d).find((g) => g.kind === 'treasure')).toEqual({ kind: 'treasure', more: 1, of: 3, done: 2 });
    expect(goals(d).find((g) => g.kind === 'trick')).toEqual({ kind: 'trick', trick: 'high-five', more: 1, of: 2, done: 1 });
    // After a round she is shown one of them: the welcome treasure until a day is finished, then the paws.
    expect(nextGoal(d)).toMatchObject({ kind: 'welcome' });
    expect(nextGoal(giveAll(finishToday(d, day)))).toMatchObject({ kind: 'treasure', more: 1 });
  });
  it('with every trick learnt and every treasure given there is nothing left to count towards', () => {
    let d = fresh();
    for (const l of PATH) d = master(d, l.id);
    d = giveAll(finishToday(d, day));
    expect(goals(d)).toEqual([]);
    expect(nextGoal(d)).toBeNull();
    expect(Object.keys(d.rewards.treasures)).toHaveLength(TREASURE_AT.length + 1);
  });
});

describe('rewards are only for what she did herself', () => {
  it('the starting check gives no treasure, no trick, no badge and no award, however much it marks as known', () => {
    const d = checkedAllRight();
    const known = Object.values(d.child.lessons).filter((l) => l.mastered);
    expect(known.length).toBeGreaterThan(15); // all of Stage 1 and more
    expect(known.every((l) => l.placed)).toBe(true);
    expect(d.rewards).toEqual(noRewards);
    expect(nextEarned(d)).toBeNull();
    expect([paws(d), lessonsMastered(d)]).toEqual([0, 0]);
    expect(UNITS.some((u) => unitDone(d, u))).toBe(false);
    expect(goals(d).find((g) => g.kind === 'trick')).toMatchObject({ more: 2 });
  });

  it('a known lesson counts once a due review confirms it, and not before', () => {
    let d: ProfileData = { ...fresh(), child: place(fresh().child, 's1-see', day) };
    expect(nextEarned(d)).toBeNull();
    d = { ...d, child: reviewed(d.child, 's1-see', { clean: true, ms: 3000 }, day) }; // not yet due
    expect(lessonState(d.child, 's1-see').placed).toBe(true);
    expect(paws(d)).toBe(0);
    d = { ...d, child: reviewed(d.child, 's1-see', { clean: false, ms: 3000 }, addDays(day, 1)) }; // a miss
    expect(paws(d)).toBe(0);
    d = confirm(d, 's1-see');
    expect(lessonState(d.child, 's1-see').placed).toBeUndefined();
    expect(paws(d)).toBe(LESSON.get('s1-see')!.steps.length + 1); // its steps, and the lesson mastered
    expect(owed(d)).toEqual([`treasure ${treasureSlot(1)}`, `treasure ${treasureSlot(3)}`]);
  });

  it('a unit with a known lesson earns its badge only when that lesson is confirmed too', () => {
    const unit = unitOf('s1-see');
    const [first, ...rest] = unit.lessons;
    let d: ProfileData = { ...fresh(), child: place(fresh().child, first!.id, day) };
    for (const l of rest) d = master(d, l.id);
    d = giveAll(d);
    expect(unitDone(d, unit)).toBe(false);
    expect(badgesWon(d)).toEqual([]);
    d = giveAll(confirm(d, first!.id));
    expect(badgesWon(d)).toEqual([unit.id]);
  });
});

describe('a profile saved by an earlier version', () => {
  const reread = (d: ProfileData) => readProfileData(JSON.parse(JSON.stringify(d)), day)!;
  /** What the first version did after the check: a treasure for every known lesson, a trick for every known unit, an award. */
  const fromTheCheck = (): ProfileData => {
    const d = checkedAllRight();
    const r = { treasures: {} as Record<string, string>, tricks: {} as Record<string, string>, awards: { s1: 'rosette' } as Record<string, string> };
    for (const u of UNITS) {
      for (const l of u.lessons) if (lessonState(d.child, l.id).mastered) r.treasures[l.id] = 'ball';
      if (u.lessons.every((l) => lessonState(d.child, l.id).mastered)) r.tricks[u.id] = 'beg';
    }
    return { ...d, rewards: r };
  };

  it('loses the rewards the starting check gave it', () => {
    const old = fromTheCheck();
    expect(Object.keys(old.rewards.tricks).length).toBeGreaterThanOrEqual(5);
    const d = reread(old);
    expect(d.rewards).toEqual(noRewards);
    expect(nextEarned(d)).toBeNull();
    expect(d.child).toEqual(old.child); // what she knows is untouched
  });

  it('keeps the treasures and tricks she earned by playing, moved to where they are kept now', () => {
    // Treasures were kept per lesson and tricks per unit: three lessons and one whole unit played, as the earlier version saved them.
    const unit = unitOf('s1-see');
    let old = fresh();
    for (const l of unit.lessons) old = master(old, l.id);
    old = { ...old, rewards: { treasures: { 's1-count': 'bed', 's1-see': 'ball', 's1-zero': 'bowl', 's1-estimate': 'ball' }, tricks: { [unit.id]: 'spin' }, awards: {} } };
    const d = reread(old);
    // Her four treasures, in the order of the path, in the first four places; her one trick in the first place for tricks.
    expect(TREASURE_AT.slice(0, 4).map((at) => d.rewards.treasures[treasureSlot(at)])).toEqual(['bed', 'ball', 'bowl', 'ball']);
    expect(Object.keys(d.rewards.treasures)).toHaveLength(4);
    expect(treasuresHad(d)).toMatchObject({ ball: 2, bed: 1, bowl: 1 });
    expect(d.rewards.tricks).toEqual({ [trickSlot(2)]: 'spin' }); // the trick she has stays the trick she has
    expect(tricksKnown(d)).toEqual(['spin']);
    // The next trick Oreo learns is the first one she does not know yet.
    expect(goals(d).find((g) => g.kind === 'trick')).toMatchObject({ trick: 'high-five', more: 1 });
    // What today's rules add for the same progress is owed: more treasures for her paws, and the unit's badge. No trick twice.
    expect(paws(d)).toBe(unit.lessons.reduce((n, l) => n + l.steps.length + 1, 0));
    const more = owed(d);
    expect(more).toContain(`badge ${unit.id}`);
    expect(more.filter((k) => k === `trick ${trickSlot(2)}`)).toEqual([]);
    expect(more.filter((k) => k.startsWith('treasure')).length).toBe(TREASURE_AT.filter((at) => at <= paws(d)).length - 4);
    expect(reread(d)).toEqual(d); // reading it again changes nothing more
  });

  it('a profile in today’s shape is read back unchanged', () => {
    const d = giveAll(finishToday(master(master(fresh(), 's1-count'), 's1-see'), day));
    expect(Object.keys(d.rewards.treasures).length).toBeGreaterThan(2);
    expect(reread(d).rewards).toEqual(d.rewards);
  });
});
