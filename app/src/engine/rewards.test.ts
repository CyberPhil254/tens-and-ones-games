import { describe, expect, it } from 'vitest';
import { newProfile, readProfileData, type ProfileData } from '../data/profile';
import { applyRound, checkLessons, finishToday, type Given } from './apply';
import { LESSON, LESSONS, PATH, UNITS, unitOf } from './curriculum';
import {
  ALL_PAWS, TREASURE_AT, TREASURES, TRICK_AT, TRICKS, WELCOME, awardsWon, badgesWon, earnedKey, give, goals, lessonsMastered, nextEarned, nextGoal, owedNext, paws, stageDone,
  stageToWin, stepsPassed, treasureSlot, treasuresHad, trickSlot, tricksKnown, unitDone, unitToWin,
} from './rewards';
import { place, reviewed } from './rules';
import { addDays, lessonState, newLesson, withLesson } from './state';

const day = '2026-11-15';
const before = '2026-11-01';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, day);
/** Everything she has earned, given on an earlier day: what a child has who has played for a while. */
const giveAll = (d: ProfileData): ProfileData => {
  for (let e = owedNext(d), n = 0; e && n < 400; e = owedNext(d), n++) d = give(d, e, before);
  return d;
};
/** Everything she has earned and not been given, in the order it would come. */
const owed = (d: ProfileData): string[] => {
  const out: string[] = [];
  for (let e = owedNext(d), n = 0; e && n < 400; e = owedNext(d), n++) { out.push(earnedKey(e)); d = give(d, e, before); }
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
/** The first lessons of the path mastered, until she has at least `n` paws. */
const withPaws = (n: number): ProfileData => {
  let d = fresh();
  for (const l of PATH) { if (paws(d) >= n) break; d = master(d, l.id); }
  return d;
};
const T = (n: number) => `treasure ${treasureSlot(n)}`;

describe('the schedule', () => {
  it('a treasure every six paws for the first six, then every eight; a trick at the 7th, 13th, 20th, 27th, 34th and 40th lesson mastered', () => {
    expect(TREASURE_AT.slice(0, 9)).toEqual([6, 12, 18, 24, 30, 36, 44, 52, 60]);
    expect(TREASURE_AT.every((at, i) => i === 0 || at > TREASURE_AT[i - 1]!)).toBe(true);
    expect(TREASURE_AT.slice(6).every((at, i) => at - TREASURE_AT[i + 5]! === 8)).toBe(true);
    expect(TREASURE_AT[TREASURE_AT.length - 1]!).toBeLessThanOrEqual(ALL_PAWS);
    expect(ALL_PAWS - TREASURE_AT[TREASURE_AT.length - 1]!).toBeLessThan(8); // they go on to the end of the path
    expect(TRICK_AT).toEqual([7, 13, 20, 27, 34, 40]);
    expect(TRICK_AT).toHaveLength(TRICKS.length); // one for each trick Oreo has a picture of
    // There is a paw for every step of every lesson and one for mastering it.
    expect(ALL_PAWS).toBe(LESSONS.reduce((n, l) => n + l.steps.length + 1, 0));
  });
});

describe('rewards come from what she has achieved, never from time played', () => {
  it('nothing is owed to a child who has passed nothing, however much she has played', () => {
    const d = { ...fresh(), bones: 500 };
    expect(owedNext(d)).toBeNull();
    expect(paws(d)).toBe(0);
  });

  it('the first time she finishes today’s games: a welcome treasure, her choice of two, and never a second one', () => {
    let d = finishToday(fresh(), day);
    const e = nextEarned(d, day)!;
    expect(e).toMatchObject({ kind: 'treasure', slot: WELCOME });
    if (e.kind !== 'treasure') throw new Error();
    expect(new Set(e.options).size).toBe(2);
    d = give(d, e, day, e.options[1]);
    expect(d.rewards.treasures[WELCOME]).toBe(e.options[1]);
    expect(owedNext(d)).toBeNull();
    const next = addDays(day, 1);
    expect(nextEarned(finishToday(d, next), next)).toBeNull(); // the second day finished brings no treasure by itself
  });

  it('a pick that was not on offer is not honoured: she gets one that was', () => {
    const d = finishToday(fresh(), day);
    const e = nextEarned(d, day)!;
    if (e.kind !== 'treasure') throw new Error();
    const other = TREASURES.find((t) => !e.options.includes(t))!;
    expect(e.options).toContain(give(d, e, day, other).rewards.treasures[WELCOME]);
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

  it('treasures follow the paws: the 6th, the 12th, and so on', () => {
    let d = atStep(master(fresh(), 's1-count'), 's1-see', 1); // 4 + 1 = 5 paws
    expect(paws(d)).toBe(5);
    expect(owed(d)).toEqual([]);
    d = atStep(d, 's1-see', 2); // the 6th paw
    expect(owed(d)).toEqual([T(1)]);
    d = giveAll(d);
    d = master(d, 's1-see'); // 8 paws
    const zero = LESSON.get('s1-zero')!.steps.length;
    d = atStep(d, 's1-zero', Math.min(zero, 3)); // not yet 12: nothing new
    expect(paws(d)).toBeLessThan(12);
    expect(owed(d)).toEqual([]);
    d = atStep(master(d, 's1-zero'), 's1-estimate', 12 - 9 - zero > 0 ? 12 - 9 - zero : 0); // to the 12th paw
    expect(paws(d)).toBeGreaterThanOrEqual(12);
    expect(paws(d)).toBeLessThan(18);
    expect(owed(d)).toEqual([T(2)]);
  });

  it('the offer is the kinds Oreo has fewest of', () => {
    let d = fresh();
    const seen: string[] = [];
    for (const l of PATH) {
      d = master(d, l.id);
      for (let e = owedNext(d); e; e = owedNext(d)) {
        if (e.kind === 'treasure') seen.push(e.options[0]);
        d = give(d, e, before);
      }
    }
    expect(seen).toHaveLength(TREASURE_AT.length);
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
    expect(got).toEqual([7, 13, 20, 27, 34, 40]);
    expect(tricksKnown(d)).toEqual([...TRICKS]);
    expect(Object.keys(d.rewards.tricks)).toEqual([1, 2, 3, 4, 5, 6].map(trickSlot));
    // A lesson only passed, not yet mastered, does not count towards a trick.
    let six = fresh();
    for (const l of PATH.slice(0, 6)) six = master(six, l.id);
    expect(owed(pass(six, PATH[6]!.id)).filter((k) => k.startsWith('trick'))).toEqual([]);
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
    let d = giveAll(withPaws(20));
    const had = d.rewards;
    expect(Object.keys(had.treasures)).toHaveLength(3);
    d = set(d, 's1-see', { step: 2, passedOn: ['2026-11-02'] }); // reopened: passed, no longer mastered
    expect(d.rewards).toEqual(had);
    expect(owedNext(d)).toBeNull();
    expect(owedNext(master(d, 's1-see'))).toBeNull(); // mastered again: the same paws, nothing new
  });
});

describe('never more than one reward on one day', () => {
  /** Four rewards earned and none given: three treasures and the badge of the first part of the garden. */
  const much = (): ProfileData => {
    let d = fresh();
    for (const l of unitOf('s1-count').lessons) d = master(d, l.id);
    while (paws(d) < 18) d = master(d, PATH.find((l) => !lessonState(d.child, l.id).mastered)!.id);
    return d;
  };

  it('a reward is handed over when today’s games are finished, and not before', () => {
    const d = withPaws(6);
    expect(owedNext(d)).toMatchObject({ kind: 'treasure', slot: treasureSlot(1) });
    expect(nextEarned(d, day)).toBeNull(); // in the middle of today's games
    expect(nextEarned(finishToday(d, addDays(day, -1)), day)).toBeNull(); // finished yesterday, not today
    expect(nextEarned(finishToday(giveAll(finishToday(fresh(), before)), day), day)).toBeNull(); // finished, with nothing earned
    expect(nextEarned(finishToday({ ...d, rewards: { ...d.rewards, treasures: { [WELCOME]: 'ball' } } }, day), day)).toMatchObject({ slot: treasureSlot(1) });
  });

  it('if she has earned more, the rest wait: one on each of the next days she finishes today’s games', () => {
    let d = much();
    const all = owed(finishToday(d, day));
    expect(all.length).toBeGreaterThanOrEqual(5); // the welcome treasure, a badge, three treasures
    const got: string[] = [];
    for (let i = 0; i < all.length + 2; i++) {
      const today = addDays(day, i * 2); // she plays every other day
      expect(nextEarned(d, today), 'nothing before today’s games are finished').toBeNull();
      d = finishToday(d, today);
      const e = nextEarned(d, today);
      if (!e) continue;
      got.push(earnedKey(e));
      d = give(d, e, today);
      expect(d.rewards.lastOn).toBe(today);
      expect(nextEarned(d, today), 'never a second one on the same day').toBeNull();
      // A day she does not finish brings nothing, whatever is waiting.
      expect(nextEarned(d, addDays(today, 1))).toBeNull();
    }
    expect(got).toEqual(all);
    expect(owedNext(d)).toBeNull();
  });

  it('when several wait, the rarer comes first: a trick, then the badges, then the award, then a treasure', () => {
    let d = fresh();
    for (const u of UNITS.filter((x) => x.stage === 1 && !x.stretch)) for (const l of u.lessons) d = master(d, l.id);
    const order = owed(finishToday(d, day)).map((k) => k.split(' ')[0]);
    expect(order[0]).toBe('treasure'); // the welcome treasure, always first
    const rest = order.slice(1), rank = (k: string) => ['trick', 'badge', 'award', 'treasure'].indexOf(k);
    expect(rest).toEqual([...rest].sort((a, b) => rank(a!) - rank(b!)));
    expect(new Set(rest)).toEqual(new Set(['trick', 'award', 'badge', 'treasure']));
  });
});

describe('what she is working towards', () => {
  it('a new child: the welcome treasure for today’s games, six paws for a treasure, seven lessons for the first trick', () => {
    expect(goals(fresh(), day)).toEqual([
      { kind: 'welcome', more: 1, of: 1, done: 0 },
      { kind: 'treasure', more: 6, of: 6, done: 0 },
      { kind: 'trick', trick: 'high-five', more: 7, of: 7, done: 0 },
    ]);
  });
  it('the row counts from the reward before: two of six paws since the last treasure, four more to go', () => {
    const d = giveAll(master(master(fresh(), 's1-count'), 's1-see')); // 8 paws: after the 6th, before the 12th
    expect(goals(d, day).find((g) => g.kind === 'treasure')).toEqual({ kind: 'treasure', more: 4, of: 6, done: 2 });
    expect(goals(d, day).find((g) => g.kind === 'trick')).toEqual({ kind: 'trick', trick: 'high-five', more: 5, of: 7, done: 2 });
    // After a round she is shown one of them: the welcome treasure until a day is finished, then the paws.
    expect(nextGoal(d, day)).toMatchObject({ kind: 'welcome' });
    expect(nextGoal(giveAll(finishToday(d, before)), day)).toMatchObject({ kind: 'treasure', more: 4 });
  });
  it('a treasure she has earned and not yet been given: the row is full, and it says when it comes', () => {
    const d = giveAll(finishToday(fresh(), before));
    const full = { ...d, child: withPaws(6).child };
    // In the middle of today's games: it comes when they are finished.
    expect(nextGoal(full, day)).toEqual({ kind: 'treasure', more: 0, of: 6, done: 6, waits: 'today' });
    // She had a reward today already: it comes on the next day she finishes.
    const had = { ...full, rewards: { ...full.rewards, lastOn: day } };
    expect(nextGoal(had, day)).toEqual({ kind: 'treasure', more: 0, of: 6, done: 6, waits: 'next' });
    expect(nextGoal(had, addDays(day, 1))).toMatchObject({ waits: 'today' });
  });
  it('with every trick learnt and every treasure given there is nothing left to count towards', () => {
    let d = fresh();
    for (const l of PATH) d = master(d, l.id);
    d = giveAll(finishToday(d, day));
    expect(goals(d, day)).toEqual([]);
    expect(nextGoal(d, day)).toBeNull();
    expect(Object.keys(d.rewards.treasures)).toHaveLength(TREASURE_AT.length + 1);
  });
});

describe('rewards are only for what she learns by playing', () => {
  it('the starting check gives no treasure, no trick, no badge and no award, however much it marks as known', () => {
    const d = checkedAllRight();
    const known = Object.values(d.child.lessons).filter((l) => l.mastered);
    expect(known.length).toBeGreaterThan(15); // all of Stage 1
    expect(known.every((l) => l.placed)).toBe(true);
    expect(d.rewards).toEqual(noRewards);
    expect(owedNext(d)).toBeNull();
    expect([paws(d), lessonsMastered(d)]).toEqual([0, 0]);
    expect(UNITS.some((u) => unitDone(d, u))).toBe(false);
    expect(goals(d, day).find((g) => g.kind === 'trick')).toMatchObject({ more: 7 });
  });

  it('a known lesson that a review confirms still counts for nothing: no paws, and not towards a trick', () => {
    let d: ProfileData = { ...fresh(), child: place(fresh().child, 's1-see', day) };
    d = { ...d, child: reviewed(d.child, 's1-see', { clean: true, ms: 3000 }, day) }; // not yet due
    expect(lessonState(d.child, 's1-see').placed).toBe(true);
    d = confirm(d, 's1-see');
    expect(lessonState(d.child, 's1-see')).toMatchObject({ known: true, reviews: 1 });
    expect(lessonState(d.child, 's1-see').placed).toBeUndefined();
    expect([paws(d), stepsPassed(d), lessonsMastered(d)]).toEqual([0, 0, 0]);
    expect(owedNext(finishToday(giveAll(finishToday(d, before)), day))).toBeNull();
  });

  it('every lesson of Stage 1 known and confirmed, one after the other: not one paw, not one reward', () => {
    let d = giveAll(finishToday(checkedAllRight(), before));
    const s1 = LESSONS.filter((l) => l.id.startsWith('s1-') && lessonState(d.child, l.id).placed);
    expect(s1.length).toBeGreaterThan(15);
    for (const l of s1) {
      d = confirm(d, l.id);
      expect([paws(d), lessonsMastered(d), owedNext(d)], l.id).toEqual([0, 0, null]);
    }
    expect(s1.every((l) => lessonState(d.child, l.id).known)).toBe(true);
    expect(badgesWon(giveAll(d))).toEqual([]);
    expect(stageDone(d, 's1')).toBe(false);
    // What she is working towards is in her own stage: never the badge or the award of what she knew before.
    expect(UNITS.filter((u) => unitToWin(d, u)).every((u) => u.stage === 2 || u.stretch)).toBe(true);
    expect([stageToWin(d, 's1'), stageToWin(d, 's2')]).toEqual([false, true]);
  });

  it('a known lesson that review reopens counts from where she plays it: its last step and the lesson, not the steps below', () => {
    let d: ProfileData = confirm({ ...fresh(), child: place(fresh().child, 's1-see', day) }, 's1-see');
    const steps = LESSON.get('s1-see')!.steps.length;
    for (const on of [addDays(day, 5), addDays(day, 6)]) d = { ...d, child: reviewed(d.child, 's1-see', { clean: false, ms: 3000 }, on) };
    expect(lessonState(d.child, 's1-see')).toMatchObject({ step: steps - 1, from: steps - 1 });
    expect(lessonState(d.child, 's1-see').known).toBeUndefined();
    expect(paws(d)).toBe(0); // reopened: nothing yet
    d = { ...d, child: withLesson(d.child, 's1-see', { ...lessonState(d.child, 's1-see'), passedOn: [addDays(day, 7), addDays(day, 8)], mastered: addDays(day, 8) }) };
    expect([stepsPassed(d), lessonsMastered(d), paws(d)]).toEqual([1, 1, 2]);
  });

  it('a unit with a known lesson earns its badge when that lesson is confirmed and the rest was learnt here; a unit she knew entirely earns none', () => {
    const unit = unitOf('s1-see');
    const [first, ...rest] = unit.lessons;
    let d: ProfileData = { ...fresh(), child: place(fresh().child, first!.id, day) };
    for (const l of rest) d = master(d, l.id);
    d = giveAll(d);
    expect(unitDone(d, unit)).toBe(false);
    expect(badgesWon(d)).toEqual([]);
    d = giveAll(confirm(d, first!.id));
    expect(badgesWon(d)).toEqual([unit.id]);
    let all: ProfileData = fresh();
    for (const l of unit.lessons) all = confirm({ ...all, child: place(all.child, l.id, day) }, l.id);
    expect([unitDone(all, unit), unitToWin(all, unit), owedNext(all)]).toEqual([false, false, null]);
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
    expect(owedNext(d)).toBeNull();
    expect(d.child).toEqual(old.child); // what she knows is untouched
  });

  it('keeps the treasures and tricks she earned by playing, moved to where they are kept now, and the new pace applies from now on', () => {
    // Treasures were kept per lesson and tricks per unit: one whole unit played, as the first version saved them.
    const unit = unitOf('s1-see');
    let old = fresh();
    for (const l of unit.lessons) old = master(old, l.id);
    old = { ...old, rewards: { treasures: { 's1-count': 'bed', 's1-see': 'ball', 's1-zero': 'bowl', 's1-estimate': 'ball' }, tricks: { [unit.id]: 'spin' }, awards: {} } };
    const d = reread(old);
    // Her four treasures, in the order of the path, in the first four places; her one trick in the first place for tricks.
    expect([1, 2, 3, 4].map((n) => d.rewards.treasures[treasureSlot(n)])).toEqual(['bed', 'ball', 'bowl', 'ball']);
    expect(Object.keys(d.rewards.treasures)).toHaveLength(4);
    expect(treasuresHad(d)).toMatchObject({ ball: 2, bed: 1, bowl: 1 });
    expect(d.rewards.tricks).toEqual({ [trickSlot(1)]: 'spin' }); // the trick she has stays the trick she has
    expect(tricksKnown(d)).toEqual(['spin']);
    // She has more than today's schedule gives for her paws and lessons. She keeps it; the difference is written down.
    const p = paws(d), m = lessonsMastered(d);
    expect(p).toBe(unit.lessons.reduce((n, l) => n + l.steps.length + 1, 0));
    expect(d.rewards.credit).toEqual({ paws: TREASURE_AT[3]! - p, lessons: TRICK_AT[0]! - m });
    // So the next treasure takes as many new paws as it takes anyone, and the next trick as many new lessons. No trick twice.
    expect(goals(d, day).find((g) => g.kind === 'treasure')).toEqual({ kind: 'treasure', more: 6, of: 6, done: 0 });
    expect(goals(d, day).find((g) => g.kind === 'trick')).toEqual({ kind: 'trick', trick: 'high-five', more: 6, of: 6, done: 0 });
    expect(owed(d)).toEqual([`badge ${unit.id}`]); // the badge of the unit she finished is new, and owed
    expect(reread(d)).toEqual(d); // reading it again changes nothing more
  });

  it('a profile of the schedule before this one keeps every treasure and trick, and waits no longer than anyone for the next', () => {
    // Treasures at the 1st, 3rd and 6th paw and every third after, tricks at the 2nd and 5th lesson: 22 paws, 6 lessons.
    let old = fresh();
    for (const l of PATH.slice(0, 6)) old = master(old, l.id);
    const p = paws(old);
    const at = [1, 3, 6, 9, 12, 15, 18, 21].filter((n) => n <= p);
    old = { ...finishToday(old, before), rewards: { treasures: { [WELCOME]: 'bed', ...Object.fromEntries(at.map((n, i) => [`w${n}`, TREASURES[i % 6]!])) }, tricks: { m2: 'high-five', m5: 'beg' }, awards: {} } };
    const d = reread(old);
    expect(Object.keys(d.rewards.treasures)).toHaveLength(at.length + 1);
    expect(at.map((_, i) => d.rewards.treasures[treasureSlot(i + 1)])).toEqual(at.map((_, i) => TREASURES[i % 6]));
    expect(d.rewards.treasures[WELCOME]).toBe('bed');
    expect(d.rewards.tricks).toEqual({ [trickSlot(1)]: 'high-five', [trickSlot(2)]: 'beg' });
    expect(owed(d).filter((k) => !k.startsWith('badge'))).toEqual([]); // nothing extra for what she had done already
    const t = goals(d, day).find((g) => g.kind === 'treasure')!, k = goals(d, day).find((g) => g.kind === 'trick')!;
    expect([t.done, t.more]).toEqual([0, TREASURE_AT[at.length]! - TREASURE_AT[at.length - 1]!]);
    expect([k.trick, k.done, k.more]).toEqual(['spin', 0, TRICK_AT[2]! - TRICK_AT[1]!]);
    // One more paw is one paw less to go: the pace of today, from where she is.
    expect(goals(atStep(d, PATH[6]!.id, 1), day).find((g) => g.kind === 'treasure')).toMatchObject({ done: 1, more: t.more - 1 });
    expect(reread(d)).toEqual(d);
  });

  it('a known lesson that a review confirmed before this was written down counts for nothing from now on; what she has, she keeps', () => {
    // Before, a confirmed lesson counted as hers: its paws had brought treasures. It is told apart by never having passed its last step.
    let old: ProfileData = fresh();
    for (const id of ['s1-count', 's1-see', 's1-zero']) old = set(old, id, { step: LESSON.get(id)!.steps.length - 1, mastered: before, reviews: 2, due: '2026-12-20' });
    old = master(old, 's1-estimate');
    old = { ...old, rewards: { treasures: { w1: 'ball', w3: 'bed', w6: 'bowl', w9: 'kennel', w12: 'ball' }, tricks: { m2: 'high-five' }, awards: {} } };
    const d = reread(old);
    for (const id of ['s1-count', 's1-see', 's1-zero']) expect(lessonState(d.child, id).known, id).toBe(true);
    expect(lessonState(d.child, 's1-estimate').known).toBeUndefined();
    expect([paws(d), lessonsMastered(d)]).toEqual([LESSON.get('s1-estimate')!.steps.length + 1, 1]);
    expect(Object.keys(d.rewards.treasures)).toHaveLength(5);
    expect(tricksKnown(d)).toEqual(['high-five']);
    expect(goals(d, day).find((g) => g.kind === 'treasure')).toMatchObject({ done: 0, more: TREASURE_AT[5]! - TREASURE_AT[4]! });
  });

  it('a profile in today’s shape is read back unchanged', () => {
    const d = give(finishToday(giveAll(finishToday(withPaws(20), before)), day), { kind: 'badge', unit: 's2-u1' }, day);
    expect(Object.keys(d.rewards.treasures).length).toBeGreaterThan(2);
    expect(d.rewards.lastOn).toBe(day);
    expect(reread(d).rewards).toEqual(d.rewards);
  });
});
