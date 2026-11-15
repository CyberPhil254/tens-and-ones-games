import { describe, expect, it } from 'vitest';
import { seededRng } from '../maths/random';
import { CONFIG } from './config';
import { LESSON, LESSONS, playable } from './curriculum';
import { answered, chance, dueLessons, fittingStep, looksLikeGuessing, place, reviewed, roundFinished, statusOf, waitsFor, type RoundOutcome } from './rules';
import { addDays, dayOf, lessonState, newChild, withLesson, type ChildState, type Day } from './state';
import { nextPart, nextLessons, planToday, somethingLeft, type Part } from './today';

const D0: Day = '2026-11-16';
const quick = { clean: true, ms: 3000 };
const playableIds = LESSONS.filter(playable).map((l) => l.id);
/** Plays a full round at the step she is on with this many right first time. */
function round(s: ChildState, id: string, bones: number, day: Day): { state: ChildState; outcome: RoundOutcome } {
  const step = lessonState(s, id).step;
  for (let i = 0; i < CONFIG.round; i++) s = answered(s, id, step, { clean: i < bones, ms: 3000 });
  return roundFinished(s, id, bones, day);
}
const lastStep = (id: string) => LESSON.get(id)!.steps.length - 1;
/** A child who has mastered a lesson on `day`. */
function master(s: ChildState, id: string, day: Day): ChildState {
  s = withLesson(s, id, { ...lessonState(s, id), step: lastStep(id) });
  s = round(s, id, 6, addDays(day, -1)).state;
  return round(s, id, 6, day).state;
}

describe('days', () => {
  it('counts calendar days across months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(dayOf(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
  });
});

describe('steps', () => {
  it('5 of 6 moves up one step, a perfect round two, 3 or 4 stays, 2 or fewer drops one', () => {
    let s = newChild();
    expect(round(s, 's2-calc', 5, D0).outcome).toEqual({ kind: 'up', to: 1, skipped: false });
    expect(round(s, 's2-calc', 6, D0).outcome).toEqual({ kind: 'up', to: 2, skipped: true });
    expect(round(s, 's2-calc', 4, D0).outcome).toEqual({ kind: 'stay' });
    expect(round(s, 's2-calc', 0, D0).outcome).toEqual({ kind: 'stay' }); // nothing below the first step
    s = round(s, 's2-calc', 6, D0).state;
    expect(round(s, 's2-calc', 2, D0).outcome).toEqual({ kind: 'down', to: 1 });
  });

  it('a perfect round never skips the last step', () => {
    let s = withLesson(newChild(), 's2-calc', { ...lessonState(newChild(), 's2-calc'), step: lastStep('s2-calc') - 1 });
    const r = round(s, 's2-calc', 6, D0);
    expect(r.outcome).toEqual({ kind: 'up', to: lastStep('s2-calc'), skipped: false });
    s = r.state;
    expect(lessonState(s, 's2-calc').mastered).toBeUndefined();
  });
});

describe('mastery', () => {
  it('needs the last step passed on two different days', () => {
    const knowsFive = place(newChild(), 's1-see', D0); // "Friends of ten" needs "See how many"
    const s = withLesson(knowsFive, 's1-ten', { ...lessonState(knowsFive, 's1-ten'), step: lastStep('s1-ten') });
    let r = round(s, 's1-ten', 5, D0);
    expect(r.outcome).toEqual({ kind: 'passed' });
    r = round(r.state, 's1-ten', 6, D0); // a second good round on the same day is not mastery
    expect(r.outcome).toEqual({ kind: 'passed' });
    expect(statusOf(r.state, LESSON.get('s1-ten')!, D0)).toBe('resting');
    expect(statusOf(r.state, LESSON.get('s1-ten')!, addDays(D0, 1))).toBe('open');
    r = round(r.state, 's1-ten', 5, addDays(D0, 1));
    expect(r.outcome).toEqual({ kind: 'mastered' });
    expect(lessonState(r.state, 's1-ten')).toMatchObject({ mastered: addDays(D0, 1), due: addDays(D0, 2) });
  });
});

describe('review', () => {
  const start = master(place(newChild(), 's1-see', D0), 's1-ten', D0);
  it('comes back after 1, 3, 7, 14 and 30 days when it is remembered', () => {
    let s = start;
    let day: Day;
    const waits: number[] = [];
    for (let i = 0; i < 6; i++) {
      day = lessonState(s, 's1-ten').due!;
      expect(dueLessons(s, addDays(day, -1)).map((l) => l.id)).not.toContain('s1-ten');
      expect(dueLessons(s, day).map((l) => l.id)).toContain('s1-ten');
      s = reviewed(s, 's1-ten', quick, day);
      const next = lessonState(s, 's1-ten').due!;
      waits.push(Math.round((Date.parse(next) - Date.parse(day)) / 86_400_000));
    }
    expect(waits).toEqual([3, 7, 14, 30, 30, 30]);
  });
  it('moves the schedule once a day at most, and not before it is due', () => {
    const due = lessonState(start, 's1-ten').due!;
    const early = reviewed(start, 's1-ten', quick, D0);
    expect(lessonState(early, 's1-ten').due).toBe(due);
    const once = reviewed(start, 's1-ten', quick, due);
    expect(reviewed(once, 's1-ten', quick, due)).toEqual(once);
  });
  it('comes back sooner when the answer was slow', () => {
    const due = lessonState(start, 's1-ten').due!;
    const s = reviewed(start, 's1-ten', { clean: true, ms: CONFIG.slowMs + 1 }, due);
    expect(lessonState(s, 's1-ten')).toMatchObject({ reviews: 0, due: addDays(due, 1) });
  });
  it('comes back the next day after one miss, and is reopened after two in a row', () => {
    const due = lessonState(start, 's1-ten').due!;
    let s = reviewed(start, 's1-ten', { clean: false, ms: 3000 }, due);
    expect(lessonState(s, 's1-ten')).toMatchObject({ reviewMisses: 1, due: addDays(due, 1), mastered: D0 });
    s = reviewed(s, 's1-ten', { clean: false, ms: 3000 }, addDays(due, 1));
    const l = lessonState(s, 's1-ten');
    expect(l.mastered).toBeUndefined();
    expect(l.step).toBe(lastStep('s1-ten'));
    expect(statusOf(s, LESSON.get('s1-ten')!, addDays(due, 1))).toBe('open');
    // One good round on a new day masters it again.
    expect(round(s, 's1-ten', 5, addDays(due, 2)).outcome).toEqual({ kind: 'mastered' });
  });
  it('a right answer in between clears the count of misses', () => {
    const due = lessonState(start, 's1-ten').due!;
    let s = reviewed(start, 's1-ten', { clean: false, ms: 3000 }, due);
    s = reviewed(s, 's1-ten', quick, addDays(due, 1));
    s = reviewed(s, 's1-ten', { clean: false, ms: 3000 }, addDays(due, 2));
    expect(lessonState(s, 's1-ten').mastered).toBe(D0);
  });
});

describe('rating', () => {
  it('starts a new child at about three in four right on the first step, less on later steps', () => {
    expect(chance(0, 0)).toBeCloseTo(0.75, 2);
    expect(chance(0, 1)).toBeLessThan(chance(0, 0));
  });
  it('goes up with right answers and down with wrong ones', () => {
    let up = newChild(), down = newChild();
    for (let i = 0; i < 10; i++) {
      up = answered(up, 's1-ten', 0, quick);
      down = answered(down, 's1-ten', 0, { clean: false, ms: 3000 });
    }
    expect(lessonState(up, 's1-ten').rating).toBeGreaterThan(0.3);
    expect(lessonState(down, 's1-ten').rating).toBeLessThan(-1);
  });
  it('ignores speed until she is accurate, then marks slow right answers', () => {
    const slowly = { clean: true, ms: CONFIG.slowMs + 5000 };
    let learning = newChild();
    for (let i = 0; i < 3; i++) learning = answered(learning, 's1-ten', 0, slowly);
    let fast = newChild();
    for (let i = 0; i < 3; i++) fast = answered(fast, 's1-ten', 0, quick);
    expect(lessonState(learning, 's1-ten').rating).toBe(lessonState(fast, 's1-ten').rating);
    expect(lessonState(learning, 's1-ten').slow).toBe(false);
    let accurate = newChild();
    for (let i = 0; i < 8; i++) accurate = answered(accurate, 's1-ten', 0, slowly);
    expect(lessonState(accurate, 's1-ten').slow).toBe(true);
    for (let i = 0; i < 2; i++) accurate = answered(accurate, 's1-ten', 0, quick);
    expect(lessonState(accurate, 's1-ten').slow).toBe(false);
  });
  it('picks the step she gets right about three times in four', () => {
    expect(fittingStep(0, 3)).toBe(0);
    expect(fittingStep(2, 3)).toBe(2);
    expect(fittingStep(9, 3)).toBe(3);
    expect(fittingStep(9, 1)).toBe(1);
    expect(fittingStep(-5, 3)).toBe(0);
  });
});

describe('what is open', () => {
  it('looks through a prerequisite that has nothing to play yet', () => {
    // Every lesson is built now, so nothing is looked through: a lesson waits for exactly what it needs.
    expect(LESSONS.every(playable)).toBe(true);
    for (const l of LESSONS) expect(waitsFor(l).map((n) => n.id).sort()).toEqual([...l.needs].sort());
    expect(waitsFor(LESSON.get('s1-teens')!).map((l) => l.id)).toEqual(['s1-count']);
    expect(waitsFor(LESSON.get('s2-count')!).map((l) => l.id)).toEqual(['s1-teens']);
    expect(waitsFor(LESSON.get('s2-place')!).map((l) => l.id)).toEqual(['s2-count']);
    expect(waitsFor(LESSON.get('x-fill')!).map((l) => l.id).sort()).toEqual(['s2-bonds', 's2-calc']);
  });
  it('opens a lesson once what it needs has been passed at its last step at least once', () => {
    let s = master(newChild(), 's1-teens', addDays(D0, -3)); // what "Pack in tens" itself needs
    const place2 = LESSON.get('s2-place')!;
    expect(statusOf(s, place2, D0)).toBe('locked');
    s = withLesson(s, 's2-count', { ...lessonState(s, 's2-count'), step: lastStep('s2-count') });
    s = round(s, 's2-count', 5, D0).state;
    expect(statusOf(s, LESSON.get('s2-count')!, D0)).toBe('resting');
    expect(statusOf(s, place2, D0)).toBe('open');
    expect(LESSONS.some((l) => statusOf(s, l, D0) === 'coming')).toBe(false); // nothing is "coming soon" any more
  });
});

describe('the starting check', () => {
  it('marks a lesson as known, opens what needs it, and brings it back in review the next day', () => {
    const s = place(newChild(), 's2-count', D0);
    expect(lessonState(s, 's2-count')).toMatchObject({ mastered: D0, placed: true, due: addDays(D0, 1) });
    expect(statusOf(s, LESSON.get('s2-place')!, D0)).toBe('open');
    expect(dueLessons(s, addDays(D0, 1)).map((l) => l.id)).toEqual(['s2-count']);
    expect(place(s, 'no-such-lesson', D0)).toEqual(s); // nothing to place in a lesson that does not exist
  });
});

describe('guessing', () => {
  it('is three wrong taps in a row, each within about a second', () => {
    expect(looksLikeGuessing([400, 500, 300])).toBe(true);
    expect(looksLikeGuessing([400, 500])).toBe(false);
    expect(looksLikeGuessing([400, 2500, 300])).toBe(false);
    expect(looksLikeGuessing([5000, 400, 500, 300])).toBe(true);
  });
});

describe("today's games", () => {
  it('a new child has no warm-up: two rounds of the first lesson, nothing to strengthen yet', () => {
    const plan = planToday(newChild(), D0);
    expect(plan.map((p) => p.kind)).toEqual(['new', 'new']);
    expect(plan[0]).toMatchObject({ slot: { lesson: 's1-count', step: 0 }, n: 6 }); // the path starts with counting
  });
  it('later: warm-up from mastered lessons with the due ones first, then new, then stronger', () => {
    let s = master(newChild(), 's1-count', addDays(D0, -2));
    s = master(s, 's1-see', D0);
    s = master(s, 's1-ten', addDays(D0, 5));
    s = round(s, 's1-add', 4, addDays(D0, 5)).state; // started, not finished
    const day = addDays(D0, 6);
    const plan = planToday(s, day);
    expect(plan.map((p) => p.kind)).toEqual(['warm', 'new', 'new', 'stronger']);
    expect((plan[0] as Extract<Part, { kind: 'warm' }>).slots.map((x) => x.lesson).sort()).toEqual(['s1-count', 's1-see', 's1-ten']);
    expect(plan[0]!.n).toBe(5);
    // The next lesson on the path is new; the one she has started and not finished is where she gets stronger.
    // New is the first open lesson on the path she has not started: never a mastered one, never the one she is in the middle of.
    const fresh = (plan[1] as Extract<Part, { kind: 'new' }>).slot.lesson;
    expect(fresh).toBe(nextLessons(s, day)[0]!.id);
    expect(['s1-count', 's1-see', 's1-ten', 's1-add']).not.toContain(fresh);
    expect(lessonState(s, fresh).answers).toBe(0);
    expect(plan[3]).toMatchObject({ kind: 'stronger', counts: true, slot: { lesson: 's1-add' } });
    // With nothing else started, the stronger round is on a mastered lesson and does not move the path.
    const known = master(master(master(newChild(), 's1-count', addDays(D0, -2)), 's1-see', D0), 's1-ten', addDays(D0, 5));
    expect(planToday(known, day)[3]).toMatchObject({ kind: 'stronger', counts: false });
  });
  it('the second round is at the step the first one earned', () => {
    let s = newChild();
    const first = nextPart(s, D0, []) as Extract<Part, { kind: 'new' }>;
    s = round(s, first.slot.lesson, 6, D0).state;
    // A perfect round jumps one step: from the first to the third, which is the last here.
    expect(nextPart(s, D0, ['new'])).toMatchObject({ kind: 'new', slot: { lesson: first.slot.lesson, step: 2 } });
  });
  it('honours the lesson she chose when two are open', () => {
    // For a new child two lessons are open. Without a choice it is the first; with one, the one she chose.
    const [first, second] = nextLessons(newChild(), D0);
    expect(first!.id).toBe('s1-count');
    expect(second).toBeDefined();
    expect(planToday(newChild(), D0)[0]).toMatchObject({ slot: { lesson: first!.id } });
    expect(planToday(newChild(), D0, second!.id)[0]).toMatchObject({ slot: { lesson: second!.id } });
    expect(planToday(newChild(), D0, second!.id)[1]).toMatchObject({ slot: { lesson: second!.id } });
    expect(planToday(newChild(), D0, 'x-fill')[0]).toMatchObject({ slot: { lesson: first!.id } }); // a locked lesson cannot be chosen
  });
});

/* ---------- simulated children ---------- */

interface Run { state: ChildState; emptyDays: number; downs: number; masteredOn: Record<string, number>; locked: string[] }

/** A child who gets each question right first time with a fixed chance plays today's games every day. */
function simulate(pRight: number, days: number, seed: number): Run {
  const rng = seededRng(seed);
  let s = newChild();
  const run: Run = { state: s, emptyDays: 0, downs: 0, masteredOn: {}, locked: [] };
  for (let d = 0; d < days; d++) {
    const today = addDays(D0, d);
    const done: Part['kind'][] = [];
    for (let part = nextPart(s, today, done); part; part = nextPart(s, today, done)) {
      if (part.kind === 'warm') {
        for (let i = 0; i < part.n; i++) {
          const slot = part.slots[i % part.slots.length]!;
          const a = { clean: rng() < pRight, ms: 4000 };
          s = reviewed(answered(s, slot.lesson, slot.step, a), slot.lesson, a, today);
        }
      } else {
        const { lesson, step } = part.slot;
        if (part.kind === 'new' && statusOf(s, LESSON.get(lesson)!, today) !== 'open') run.locked.push(lesson);
        let bones = 0;
        for (let i = 0; i < part.n; i++) {
          const clean = rng() < pRight;
          bones += clean ? 1 : 0;
          s = answered(s, lesson, step, { clean, ms: 4000 });
        }
        if (part.kind === 'new' || part.counts) {
          const r = roundFinished(s, lesson, bones, today);
          s = r.state;
          if (r.outcome.kind === 'down') run.downs++;
        }
      }
      done.push(part.kind);
    }
    if (!done.length && somethingLeft(s)) run.emptyDays++;
    for (const id of playableIds) if (lessonState(s, id).mastered && run.masteredOn[id] === undefined) run.masteredOn[id] = d;
  }
  run.state = s;
  return run;
}

describe('simulated children', () => {
  // 41 lessons, each needing two days at its last step: a child who is always right needs about four months.
  const DAYS = 150;
  const perfect = simulate(1, DAYS, 1);
  const good = simulate(0.75, DAYS, 2);
  const struggling = simulate(0.6, DAYS, 3);
  const count = (r: Run) => Object.keys(r.masteredOn).length;

  it('a child who is always right masters every lesson there is, in an order that respects what each needs', () => {
    expect(Object.keys(perfect.masteredOn).sort()).toEqual([...playableIds].sort());
    for (const id of playableIds) {
      for (const need of waitsFor(LESSON.get(id)!)) expect(perfect.masteredOn[need.id]!, `${id} after ${need.id}`).toBeLessThanOrEqual(perfect.masteredOn[id]!);
    }
    expect(perfect.downs).toBe(0);
  });
  it('no lesson is mastered in a single day', () => {
    for (const run of [perfect, good, struggling]) {
      // Lessons mastered now (one that was reopened by review has to earn its second day again).
      for (const id of playableIds) if (lessonState(run.state, id).mastered) expect(lessonState(run.state, id).passedOn.length, id).toBeGreaterThanOrEqual(2);
    }
  });
  it('a child at about 60 percent is held back and given easier steps', () => {
    expect(count(struggling)).toBeLessThan(count(good));
    expect(count(good)).toBeLessThanOrEqual(count(perfect));
    expect(struggling.downs).toBeGreaterThan(0);
  });
  it('nobody is ever given a locked lesson, and nobody has a day with nothing to do', () => {
    for (const run of [perfect, good, struggling]) {
      expect(run.locked).toEqual([]);
      expect(run.emptyDays).toBe(0);
    }
  });
  it('reports how far each child got (for docs/status.md)', () => {
    const line = (name: string, r: Run) => `${name}: ${count(r)} of ${playableIds.length} lessons mastered in ${DAYS} days, ${r.downs} steps down`;
    console.info([line('always right', perfect), line('75 percent', good), line('60 percent', struggling)].join('\n'));
  });
  it('after everything is mastered there is still a warm-up and a round to stay strong', () => {
    const parts = planToday(perfect.state, addDays(D0, DAYS)).map((p) => p.kind);
    expect(parts).toEqual(['warm', 'stronger']);
  });
});
