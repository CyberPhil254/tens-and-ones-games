/**
 * The whole path, played by three simulated children through the same functions the app uses:
 * today's parts, the choice card, a finished round, rewards. One is always right, one is right
 * about three times in four, one about three times in five. The spec's last check: gating,
 * review and mastery have to behave as written, for all of them.
 */
import { describe, expect, it } from 'vitest';
import { newProfile, type ProfileData } from '../data/profile';
import { seededRng } from '../maths/random';
import { applyRound, doneToday, finishToday, type Given } from './apply';
import { CONFIG } from './config';
import { LESSON, LESSONS, UNITS } from './curriculum';
import { give, nextEarned, stageDone, tricksKnown, unitDone } from './rewards';
import { statusOf, waitsFor } from './rules';
import { addDays, lessonState, type Day } from './state';
import { choiceToday, nextPart, type Part } from './today';

const D0: Day = '2026-01-05';
const DAYS = 200;

interface Log {
  data: ProfileData;
  /** The day (counted from 0) each lesson was first mastered. */
  masteredOn: Record<string, number>;
  /** The day each lesson's last step was first passed. */
  passedOn: Record<string, number>;
  /** Rounds of a lesson that was not open when it was given. */
  locked: string[];
  /** Days with something left to learn and nothing to do. */
  emptyDays: number;
  ups: number; skips: number; downs: number; reopened: number;
  /** Rounds per day, to see that a day stays short. */
  mostRounds: number;
  /** Reviews that moved a lesson's schedule: the gap, in days, to its next review. */
  reviewGaps: number[];
  /** For each mastery: the days until its first review. */
  firstReview: number[];
  /** Rewards in the order they were given. */
  rewards: string[];
  days: number;
}

/** `p` is the chance of a right answer at a lesson's first step; each later step is a little harder. */
function play(p: number, seed: number, harderBy = 0): Log {
  const rng = seededRng(seed);
  let data = newProfile('child-sim', 'Sim', 'owl', 2, D0);
  const log: Log = { data, masteredOn: {}, passedOn: {}, locked: [], emptyDays: 0, ups: 0, skips: 0, downs: 0, reopened: 0, mostRounds: 0, reviewGaps: [], firstReview: [], rewards: [], days: DAYS };
  const answer = (lesson: string, step: number, day: Day, i: number): Given => {
    const clean = rng() < Math.max(0.05, p - harderBy * step);
    return { lesson, step, clean, misses: clean ? 0 : 1, hint: false, ms: 4000, at: `${day}T15:00:${String(i).padStart(2, '0')}.000Z` };
  };
  for (let d = 0; d < DAYS; d++) {
    const today = addDays(D0, d);
    const done: Part['kind'][] = [];
    let chosen: string | undefined, strongerFirst = false, asked = false;
    for (;;) {
      // The choice card, once, after the warm-up: she picks at random, and it is honoured.
      if (!asked) {
        const first = nextPart(data.child, today, done);
        if (first && first.kind !== 'warm') {
          asked = true;
          const c = choiceToday(data.child, today, done);
          if (c?.kind === 'stone') chosen = c.options[rng() < 0.5 ? 0 : 1].id;
          else if (c?.kind === 'first') { chosen = c.options[0].id; strongerFirst = rng() < 0.5; }
        }
      }
      const part = nextPart(data.child, today, done, chosen, strongerFirst);
      if (!part) break;
      const before = data.child;
      let given: Given[];
      if (part.kind === 'warm') given = Array.from({ length: part.n }, (_, i) => { const s = part.slots[i % part.slots.length]!; return answer(s.lesson, s.step, today, i); });
      else {
        const { lesson, step } = part.slot;
        if (part.kind === 'new' && statusOf(before, LESSON.get(lesson)!, today) !== 'open') log.locked.push(`${lesson} on day ${d}`);
        if (chosen && part.kind === 'new' && lessonState(before, chosen).mastered === undefined && statusOf(before, LESSON.get(chosen)!, today) === 'open') expect(lesson, 'the lesson she chose is the one she gets').toBe(chosen);
        given = Array.from({ length: part.n }, (_, i) => answer(lesson, step, today, i));
      }
      const counts = part.kind === 'new' || (part.kind === 'stronger' && part.counts);
      const r = applyRound(data, part.kind, counts, given, today);
      data = r.data;
      if (r.outcome?.kind === 'up') { log.ups++; if (r.outcome.skipped) log.skips++; }
      if (r.outcome?.kind === 'down') log.downs++;
      for (const l of LESSONS) {
        const was = lessonState(before, l.id), now = lessonState(data.child, l.id);
        if (was.mastered && !now.mastered) log.reopened++;
        if (now.passedOn.length && log.passedOn[l.id] === undefined) log.passedOn[l.id] = d;
        if (now.mastered && log.masteredOn[l.id] === undefined) log.masteredOn[l.id] = d;
        if (now.mastered && !was.mastered && now.due) log.firstReview.push(Math.round((Date.parse(now.due) - Date.parse(today)) / 86_400_000));
        if (part.kind === 'warm' && was.mastered && now.mastered && now.reviewedOn === today && was.reviewedOn !== today && now.due && now.reviews > was.reviews) {
          log.reviewGaps.push(Math.round((Date.parse(now.due) - Date.parse(today)) / 86_400_000));
        }
      }
      done.push(part.kind);
      // Rewards she has earned are given straight away, as the app does after the round.
      for (let e = nextEarned(data); e; e = nextEarned(data)) {
        log.rewards.push(e.kind === 'treasure' ? `treasure ${e.lesson}` : e.kind === 'trick' ? `trick ${e.unit}` : `award ${e.stage}`);
        data = give(data, e, e.kind === 'treasure' ? e.options[rng() < 0.5 ? 0 : 1] : undefined);
      }
      if (done.length > 12) throw new Error(`day ${d} never ends`);
    }
    if (done.length) data = finishToday(data, today);
    else if (LESSONS.some((l) => !lessonState(data.child, l.id).mastered)) log.emptyDays++;
    log.mostRounds = Math.max(log.mostRounds, done.length);
    expect(done.length === 0 || doneToday(data, today)).toBe(true);
  }
  log.data = data;
  return log;
}

const count = (l: Log) => LESSONS.filter((x) => lessonState(l.data.child, x.id).mastered).length;
const always = play(1, 11);
const mostly = play(0.75, 12);
const often = play(0.6, 13);
/** Closer to a real child: right less often the further a lesson moves from its picture. */
const fading = play(0.85, 14, 0.07);
const all = { always, mostly, often, fading };

describe('the whole path: gating', () => {
  it.each(Object.entries(all))('%s: never given a lesson that is not open, and never a day with nothing to do', (_n, l) => {
    expect(l.locked).toEqual([]);
    expect(l.emptyDays).toBe(0);
  });
  it.each(Object.entries(all))('%s: a lesson is first played only after the last step of everything it needs has been passed', (_n, l) => {
    for (const lesson of LESSONS) {
      const started = l.data.attempts.find((a) => a.lesson === lesson.id && a.part === 'new');
      if (!started) continue;
      const day = Math.round((Date.parse(started.at.slice(0, 10)) - Date.parse(D0)) / 86_400_000);
      for (const need of waitsFor(lesson)) expect(l.passedOn[need.id], `${lesson.id} needs ${need.id}`).toBeLessThanOrEqual(day);
    }
  });
  it.each(Object.entries(all))('%s: a day is short: a warm-up, at most two new rounds and one to get stronger', (_n, l) => {
    expect(l.mostRounds).toBeLessThanOrEqual(4);
  });
});

describe('the whole path: mastery', () => {
  it('a child who is always right masters all 41 lessons, in an order that respects what each needs', () => {
    expect(count(always)).toBe(LESSONS.length);
    expect(LESSONS.length).toBe(41);
    for (const lesson of LESSONS) for (const need of waitsFor(lesson)) expect(always.masteredOn[need.id]!, `${lesson.id} after ${need.id}`).toBeLessThanOrEqual(always.masteredOn[lesson.id]!);
    expect(always.downs).toBe(0);
    expect(always.reopened).toBe(0);
  });
  it.each(Object.entries(all))('%s: no lesson is mastered on the day its last step is first passed', (_n, l) => {
    for (const id of Object.keys(l.masteredOn)) expect(l.masteredOn[id]!, id).toBeGreaterThan(l.passedOn[id]!);
    for (const lesson of LESSONS) if (lessonState(l.data.child, lesson.id).mastered) expect(lessonState(l.data.child, lesson.id).passedOn.length, lesson.id).toBeGreaterThanOrEqual(CONFIG.masteryDays);
  });
  it('a perfect round jumps a step, but a step is only jumped when every answer was right first time', () => {
    expect(always.skips).toBeGreaterThan(0);
    // Every step she is on was reached by rounds of 5 or 6 bones: the weakest child still moves up, more slowly.
    expect(often.ups).toBeGreaterThan(0);
    expect(often.skips).toBeLessThan(always.skips);
  });
  it('the weaker the child, the less is mastered and the more often a step is given back', () => {
    expect(count(mostly)).toBeLessThanOrEqual(count(always));
    expect(count(often)).toBeLessThan(count(mostly));
    expect(always.downs).toBe(0);
    expect(often.downs).toBeGreaterThan(mostly.downs);
    expect(often.downs).toBeGreaterThan(0);
  });
  it('a child at about 60 percent is held back: she does not finish, and she is not pushed through', () => {
    expect(count(often)).toBeLessThan(LESSONS.length / 2);
    // What she has mastered she earned like everyone: two different days at the last step.
    for (const id of Object.keys(often.masteredOn)) expect(often.masteredOn[id]!).toBeGreaterThan(often.passedOn[id]!);
  });
});

describe('the whole path: review', () => {
  it('a remembered lesson comes back after 1, 3, 7, 14 and 30 days, and never later than that', () => {
    // One day after it is mastered, then further away each time it is remembered.
    const [first, ...later] = CONFIG.reviewDays;
    for (const l of Object.values(all)) {
      expect(new Set(l.firstReview)).toEqual(new Set([first]));
      for (const g of l.reviewGaps) expect(later).toContain(g);
    }
    expect(new Set(always.reviewGaps)).toEqual(new Set(later));
  });
  it('from the day after the first mastery there is a warm-up every day', () => {
    const firstDay = Math.min(...Object.values(always.masteredOn));
    const warmDays = new Set(always.data.attempts.filter((a) => a.part === 'warm').map((a) => a.at.slice(0, 10)));
    for (let d = firstDay + 1; d < DAYS; d++) expect(warmDays.has(addDays(D0, d)), `day ${d}`).toBe(true);
  });
  it('a lesson forgotten in review is reopened, and has to be passed again', () => {
    expect(always.reopened).toBe(0);
    expect(often.reopened).toBeGreaterThan(0);
    expect(mostly.reopened).toBeLessThanOrEqual(often.reopened);
  });
});

describe('the whole path: rewards and the record', () => {
  it('always right: a treasure for every lesson, a trick for every unit, an award for both stages and the stretch lessons', () => {
    expect(Object.keys(always.data.rewards.treasures).sort()).toEqual(LESSONS.map((l) => l.id).sort());
    expect(UNITS.every((u) => unitDone(always.data, u))).toBe(true);
    expect(tricksKnown(always.data)).toHaveLength(UNITS.length);
    expect(Object.keys(always.data.rewards.awards).sort()).toEqual(['s1', 's2', 'x']);
    expect(stageDone(always.data, 's1') && stageDone(always.data, 's2') && stageDone(always.data, 'x')).toBe(true);
  });
  it.each(Object.entries(all))('%s: a treasure only for a lesson that was mastered, and each reward once', (_n, l) => {
    for (const id of Object.keys(l.data.rewards.treasures)) expect(l.masteredOn[id], id).toBeDefined();
    expect(new Set(l.rewards).size).toBe(l.rewards.length);
    expect(nextEarned(l.data)).toBeNull();
  });
  it.each(Object.entries(all))('%s: bones are the answers right first time, and nothing else', (_n, l) => {
    expect(l.data.bones).toBeGreaterThan(0);
    // The log keeps the newest answers; while it is not full, it and the bones agree exactly.
    if (l.data.attempts.length < 5000) expect(l.data.bones).toBe(l.data.attempts.filter((a) => a.clean).length);
  });
  it('reports how far each child got in 200 days (for docs/status.md)', () => {
    const line = (name: string, l: Log) => {
      const last = Math.max(-1, ...Object.values(l.masteredOn));
      return `${name}: ${count(l)} of ${LESSONS.length} mastered${count(l) === LESSONS.length ? ` (the last on day ${last + 1})` : ''}; ${l.ups} steps up (${l.skips} jumped), ${l.downs} steps down, ${l.reopened} reopened by review; ${Object.keys(l.data.rewards.tricks).length} tricks; ${l.data.bones} bones`;
    };
    const report = [line('always right', always), line('about 75 percent', mostly), line('about 60 percent', often), line('85 percent, 7 points less per step', fading)].join('\n');
    console.info(report);
    expect(report).toContain('41 of 41');
  });
});
