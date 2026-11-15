import { describe, expect, it } from 'vitest';
import { newProfile, type ProfileData } from '../data/profile';
import { applyRound } from './apply';
import { LESSON, UNITS, playable } from './curriculum';
import { give, giveAll, nextEarned, stageDone, TREASURES, tricksKnown, unitDone } from './rewards';
import { newLesson, withLesson } from './state';

const day = '2026-11-15';
const fresh = () => newProfile('child-1', 'Amani', 'zebra', 2, day);
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

  it('what the starting check marks as known is given without a card', () => {
    const d0 = fresh();
    const { data } = applyRound(d0, 'check', false, [{ lesson: 's1-ten', step: 2, clean: true, misses: 0, hint: false, ms: 3000, at: '2026-11-15T10:00:00.000Z' }], day);
    // Every lesson the check marked has its treasure: the lesson asked, the rest of its unit, and what they are built on.
    const marked = Object.keys(data.child.lessons).filter((id) => data.child.lessons[id]!.mastered).sort();
    expect(marked).toContain('s1-ten');
    expect(marked).toContain('s1-see');
    expect(marked.length).toBeGreaterThan(2);
    expect(Object.keys(data.rewards.treasures).sort()).toEqual(marked);
    expect(nextEarned(data)).toBeNull();
  });
});
