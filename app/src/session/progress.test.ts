import { describe, expect, it } from 'vitest';
import { PATH } from '../maths/questions';
import { dice, seededRng } from '../maths/random';
import { CLIP_BY_ID } from '../speech/catalogue';
import { addAttempt, KEEP, type Attempt } from './attempts';
import {
  answered, boneStore, chooseLevel, doneToday, finishToday, frontier, levelOf, newProgress, quickFinished, quickOpen,
  nextSlot, roundFinished, roundWords, segment, todaySegments, warmPool, type Progress,
} from './progress';
import { load, readProgress, save } from './store';

const with_ = (over: Partial<Progress>): Progress => ({ ...newProgress(), ...over });
const allDone = Object.fromEntries(PATH.map((id) => [id, true]));

describe('levelling at the end of a round', () => {
  it('5 of 6 moves up one level', () => {
    const r = roundFinished(newProgress(), 'jump', 1, 5);
    expect(r.progress.level.jump).toBe(2);
    expect(r.note).toBe('levelUp.2');
  });
  it('a perfect round skips a level', () => {
    const r = roundFinished(newProgress(), 'jump', 1, 6);
    expect(r.progress.level.jump).toBe(3);
    expect(r.note).toBe('jumpTo.3');
  });
  it('a perfect round cannot go past the last level, and is then an ordinary level up', () => {
    const r = roundFinished(with_({ level: { five: 2 } }), 'five', 2, 6);
    expect(r.progress.level.five).toBe(3);
    expect(r.note).toBe('levelUp.3');
  });
  it('3 or 4 of 6 changes nothing and says nothing', () => {
    for (const bones of [3, 4]) {
      const p = with_({ level: { five: 2 }, pass: { five: 1 } });
      expect(roundFinished(p, 'five', 2, bones)).toEqual({ progress: p, note: '' });
    }
  });
  it('2 or fewer moves down a level, but not below 1', () => {
    const r = roundFinished(with_({ level: { five: 3 }, pass: { five: 1 } }), 'five', 3, 2);
    expect(r.progress.level.five).toBe(2);
    expect(r.progress.pass.five).toBe(0);
    expect(r.note).toBe('next-time-we-start-with-an');
    const low = newProgress();
    expect(roundFinished(low, 'five', 1, 0)).toEqual({ progress: low, note: '' });
  });
  it('two good rounds at the last level finish the game', () => {
    const first = roundFinished(with_({ level: { five: 3 } }), 'five', 3, 5);
    expect(first.note).toBe('one-more-good-round-like-this');
    expect(first.progress.done.five).toBeUndefined();
    const second = roundFinished(first.progress, 'five', 3, 6);
    expect(second.note).toBe('you-finished-this-game-the-puppy');
    expect(second.progress.done.five).toBe(true);
    expect(roundFinished(second.progress, 'five', 3, 6).note).toBe('still-great-at-this-one');
  });
  it('a middling round between two good ones does not undo the first', () => {
    const a = roundFinished(with_({ level: { five: 3 } }), 'five', 3, 6).progress;
    const b = roundFinished(a, 'five', 3, 4).progress;
    expect(roundFinished(b, 'five', 3, 5).progress.done.five).toBe(true);
  });
  it('only ever says things that are recorded', () => {
    const notes = new Set<string>();
    for (const id of PATH) for (let level = 1; level <= 4; level++) for (let bones = 0; bones <= 6; bones++) {
      for (const p of [newProgress(), with_({ done: { [id]: true } }), with_({ pass: { [id]: 1 } })]) {
        if (level <= (id === 'jump' || id === 'fill' || id === 'take' ? 4 : 3)) notes.add(roundFinished(p, id, level, bones).note);
      }
    }
    notes.delete('');
    for (const n of notes) expect(CLIP_BY_ID.has(n), n).toBe(true);
    for (const w of [roundWords(6, 6, true, false), roundWords(5, 6, false, true), roundWords(3, 6, false, false), roundWords(1, 6, false, false)]) {
      for (const id of [w.head, w.tail]) if (id) expect(CLIP_BY_ID.has(id), id).toBe(true);
    }
  });
});

describe('bones and the warm-up', () => {
  it('a bone is added only for a clean answer', () => {
    const p = answered(answered(newProgress(), 'game', 'five', true), 'game', 'five', false);
    expect(p.stars.five).toBe(1);
  });
  it('two misses in a row in the warm-up bring a finished game back, one good round from finished', () => {
    let p = with_({ done: { five: true }, pass: { five: 2 } });
    p = answered(p, 'mix', 'five', false);
    expect(p.done.five).toBe(true);
    p = answered(p, 'mix', 'five', false);
    expect(p.done.five).toBe(false);
    expect(p.pass.five).toBe(1);
    expect(p.miss.five).toBe(0);
    expect(frontier(p)).toBe('five');
  });
  it('a right answer in between clears the count', () => {
    let p = with_({ done: { five: true } });
    for (const clean of [false, true, false]) p = answered(p, 'mix', 'five', clean);
    expect(p.done.five).toBe(true);
  });
  it('a miss in the game itself or in Quick Paws does not count against a finished game', () => {
    let p = with_({ done: { friends: true } });
    for (const kind of ['game', 'quick', 'game', 'quick'] as const) p = answered(p, kind, 'friends', false);
    expect(p.done.friends).toBe(true);
  });
  it('packs the bones in tens', () => {
    expect(boneStore(with_({ stars: { five: 120, look: 14 } }))).toEqual({ total: 134, crates: 1, boxes: 3, loose: 4 });
  });
});

describe('the mix', () => {
  it('never asks the same game twice running, and uses every game in the pool', () => {
    const pool = [{ id: 'five', level: 3 }, { id: 'look', level: 2 }, { id: 'names', level: 1 }] as const;
    const d = dice(seededRng(5));
    const seen = new Set<string>();
    let last: (typeof pool)[number]['id'] | null = null;
    for (let i = 0; i < 300; i++) {
      const s = nextSlot(pool, last, d);
      expect(s.id).not.toBe(last);
      seen.add(s.id);
      last = s.id;
    }
    expect(seen.size).toBe(3);
  });
  it('repeats the game when it is the only one', () => {
    const d = dice(seededRng(5));
    expect(nextSlot([{ id: 'five', level: 1 }], 'five', d).id).toBe('five');
  });
});

describe("today's games", () => {
  it('a new child plays two rounds of the first game, with no warm-up', () => {
    const p = newProgress();
    expect(todaySegments(p)).toEqual(['front', 'front']);
    expect(segment(p, 'front')).toEqual({ kind: 'game', n: 6, id: 'five', level: 1 });
  });
  it('later there is a warm-up from the finished games, without Pack Ten, then the next game', () => {
    const p = with_({ done: { five: true, pack: true, look: true }, level: { five: 3, look: 2, names: 2 } });
    expect(frontier(p)).toBe('names');
    expect(todaySegments(p)).toEqual(['mix', 'front', 'front']);
    expect(warmPool(p)).toEqual([{ id: 'five', level: 3 }, { id: 'look', level: 2 }]);
    expect(segment(p, 'mix')).toEqual({ kind: 'mix', n: 5, pool: warmPool(p) });
    expect(segment(p, 'front')).toEqual({ kind: 'game', n: 6, id: 'names', level: 2 });
  });
  it('the second round is at the level the first round earned', () => {
    const p = roundFinished(newProgress(), 'five', 1, 6).progress;
    expect(segment(p, 'front')).toMatchObject({ id: 'five', level: 3 });
  });
  it('when every game is finished, every part of today is a mix of all but Pack Ten', () => {
    const p = with_({ done: allDone });
    expect(frontier(p)).toBeNull();
    expect(segment(p, 'front').kind).toBe('mix');
    expect(warmPool(p).map((s) => s.id)).toEqual(PATH.filter((id) => id !== 'pack'));
  });
  it('remembers the day today was finished', () => {
    const p = finishToday(newProgress(), 'Sun Nov 15 2026');
    expect(doneToday(p, 'Sun Nov 15 2026')).toBe(true);
    expect(doneToday(p, 'Mon Nov 16 2026')).toBe(false);
  });
  it('keeps a level inside what the game has', () => {
    expect(levelOf(with_({ level: { five: 9 } }), 'five')).toBe(3);
    expect(chooseLevel(newProgress(), 'jump', 4).level.jump).toBe(4);
    expect(chooseLevel(newProgress(), 'five', 0).level.five).toBe(1);
  });
});

describe('Quick Paws', () => {
  it('opens when Friends of Ten and Jump in Tens are finished', () => {
    expect(quickOpen(with_({ done: { friends: true } }))).toBe(false);
    expect(quickOpen(with_({ done: { friends: true, jump: true } }))).toBe(true);
  });
  it('keeps a best time only when at most two answers needed help', () => {
    expect(quickFinished(newProgress(), 8, 40).progress.best).toBe(40);
    expect(quickFinished(newProgress(), 7, 20)).toMatchObject({ progress: { best: 0 }, say: ['slow-down-a-little-and-get'] });
    expect(quickFinished(with_({ best: 40 }), 10, 35)).toMatchObject({ progress: { best: 35 }, say: ['a-new-best-time'] });
    expect(quickFinished(with_({ best: 40 }), 10, 45)).toMatchObject({ progress: { best: 40 }, note: 'Your best is 40 seconds.', say: [] });
  });
});

describe('saving', () => {
  const memory = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };
  const attempt: Attempt = { game: 'five', level: 1, kind: 'game', clean: true, misses: 0, helped: false, ms: 2300, at: '2026-11-15T09:00:00.000Z' };

  it('gives back what was saved', () => {
    const s = memory();
    const saved = { progress: with_({ stars: { five: 4 }, level: { five: 2 }, day: 'Sun Nov 15 2026' }), attempts: [attempt], soundOff: true };
    expect(save(s, saved)).toBe(true);
    expect(load(s)).toEqual(saved);
  });
  it('starts fresh from nothing, from rubbish, and without storage', () => {
    const fresh = { progress: newProgress(), attempts: [], soundOff: false };
    expect(load(memory())).toEqual(fresh);
    expect(load({ getItem: () => '{not json' })).toEqual(fresh);
    expect(load(undefined)).toEqual(fresh);
    expect(save(undefined, fresh)).toBe(false);
    expect(save({ setItem: () => { throw new Error('full'); } }, fresh)).toBe(false);
  });
  it('reads what the live game saves, and drops anything that does not belong', () => {
    const live = { stars: { five: 12, pack: 3, nonsense: 9 }, level: { five: 3, jump: 'x' }, done: { five: true }, pass: { five: 2 }, miss: {}, sound: true, voice: 'Samantha', day: 'Sat Nov 14 2026', best: 31 };
    expect(readProgress(live)).toEqual({ stars: { five: 12, pack: 3 }, level: { five: 3 }, done: { five: true }, pass: { five: 2 }, miss: {}, day: 'Sat Nov 14 2026', best: 31 });
  });
  it('keeps only the newest attempts', () => {
    let log: Attempt[] = [];
    for (let i = 0; i < KEEP + 10; i++) log = addAttempt(log, { ...attempt, ms: i });
    expect(log).toHaveLength(KEEP);
    expect(log[0]!.ms).toBe(10);
  });
});
