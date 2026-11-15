/**
 * What the app remembers about one child, and the rules that change it: bones, levels,
 * finished games, the warm-up mix and today's session. Ported from the live game (index.html).
 * Pure functions: each takes the progress and returns the new one.
 * `path` is the learning path; while the port is under way the app passes only the games that exist.
 *
 * A bone is a question right first time. A paw is right after a hint or with the help picture.
 */
import { LEVELS, PATH, type GameId } from '../maths/questions';
import type { Dice } from '../maths/random';
import type { Piece } from '../speech/script';

/** Questions in a round of one game, in a warm-up, and in Quick Paws. */
export const ROUND = 6;
export const WARM_UP = 5;
export const QUICK = 10;

export interface Progress {
  /** Bones won, per game. */
  stars: Partial<Record<GameId, number>>;
  /** The level the child plays next, per game. */
  level: Partial<Record<GameId, number>>;
  /** Games finished: two good rounds at the last level. */
  done: Partial<Record<GameId, boolean>>;
  /** Good rounds in a row at the last level. */
  pass: Partial<Record<GameId, number>>;
  /** Misses in a row in the warm-ups, for a finished game. */
  miss: Partial<Record<GameId, number>>;
  /** The day today's games were last finished, as Date.toDateString(). */
  day: string;
  /** Best Quick Paws time in seconds; 0 when there is none. */
  best: number;
}

export const newProgress = (): Progress => ({ stars: {}, level: {}, done: {}, pass: {}, miss: {}, day: '', best: 0 });

/** The level a game is at, kept inside the levels it has. */
export const levelOf = (p: Progress, id: GameId) => Math.max(1, Math.min(p.level[id] ?? 1, LEVELS[id]));

/** The first game on the path that is not finished; null when all are. */
export const frontier = (p: Progress, path: readonly GameId[] = PATH): GameId | null => path.find((id) => !p.done[id]) ?? null;

export interface Slot {
  id: GameId;
  level: number;
}

/** Games before the frontier, each at its own level, for mixed practice. Pack Ten is too slow for a mix. */
export function warmPool(p: Progress, path: readonly GameId[] = PATH): Slot[] {
  const f = frontier(p, path);
  const upto = f ? path.indexOf(f) : path.length;
  return path.slice(0, upto).filter((id) => id !== 'pack').map((id) => ({ id, level: levelOf(p, id) }));
}

/** The game for the next question of a mix: any from the pool, but not the same game twice running. */
export function nextSlot(pool: readonly Slot[], last: GameId | null, d: Dice): Slot {
  let slot: Slot;
  do slot = d.pick(pool);
  while (pool.length > 1 && last !== null && slot.id === last);
  return slot;
}

/** Quick Paws: fast questions from three games, open once two of them are finished. */
export const QUICK_POOL: Slot[] = [{ id: 'friends', level: 2 }, { id: 'jump', level: 4 }, { id: 'names', level: 1 }];
export const quickOpen = (p: Progress) => !!(p.done.friends && p.done.jump);

export type Segment = { kind: 'mix'; n: number; pool: Slot[] } | { kind: 'game'; n: number; id: GameId; level: number };

/**
 * Today's games: a warm-up when there is something to warm up with, then two rounds of the next game.
 * Later segments are worked out when they start, because the first round can change the level.
 */
export function todaySegments(p: Progress, path: readonly GameId[] = PATH): ('mix' | 'front')[] {
  return warmPool(p, path).length ? ['mix', 'front', 'front'] : ['front', 'front'];
}
export function segment(p: Progress, kind: 'mix' | 'front', path: readonly GameId[] = PATH): Segment {
  const f = frontier(p, path);
  if (kind === 'front' && f) return { kind: 'game', n: ROUND, id: f, level: levelOf(p, f) };
  return { kind: 'mix', n: WARM_UP, pool: warmPool(p, path) };
}

export const doneToday = (p: Progress, today: string) => p.day === today;
export const finishToday = (p: Progress, today: string): Progress => ({ ...p, day: today });

/** Choosing a level by hand starts the game there next time too. */
export const chooseLevel = (p: Progress, id: GameId, level: number): Progress => ({
  ...p,
  level: { ...p.level, [id]: Math.max(1, Math.min(level, LEVELS[id])) },
});

/**
 * One question answered. `clean` is right first time, without a hint or the help picture.
 * In a warm-up, two misses in a row bring a finished game back onto the path.
 */
export function answered(p: Progress, kind: 'game' | 'mix' | 'quick', id: GameId, clean: boolean): Progress {
  const next: Progress = { ...p };
  if (clean) next.stars = { ...p.stars, [id]: (p.stars[id] ?? 0) + 1 };
  if (kind === 'mix') {
    const misses = clean ? 0 : (p.miss[id] ?? 0) + 1;
    next.miss = { ...p.miss, [id]: misses };
    if (misses >= 2 && p.done[id]) {
      next.done = { ...p.done, [id]: false };
      next.pass = { ...p.pass, [id]: 1 };
      next.miss = { ...p.miss, [id]: 0 };
    }
  }
  return next;
}

export interface Levelled {
  progress: Progress;
  /** What to tell the child about her level, as a sentence id or wording that has a clip. Empty when nothing changed. */
  note: string;
}

/**
 * The end of a round of one game: 5 or 6 bones of 6 moves up a level and a perfect round skips one;
 * at the last level two good rounds finish the game; 2 bones or fewer moves down.
 */
export function roundFinished(p: Progress, id: GameId, level: number, bones: number, n: number = ROUND): Levelled {
  const max = LEVELS[id];
  if (bones >= n - 1) {
    if (level < max) {
      const to = Math.min(max, level + (bones === n ? 2 : 1));
      return {
        progress: { ...p, level: { ...p.level, [id]: to }, pass: { ...p.pass, [id]: 0 } },
        note: to > level + 1 ? `jumpTo.${to}` : `levelUp.${to}`,
      };
    }
    const pass = (p.pass[id] ?? 0) + 1;
    const progress = { ...p, pass: { ...p.pass, [id]: pass } };
    if (p.done[id]) return { progress, note: 'still-great-at-this-one' };
    if (pass >= 2) return { progress: { ...progress, done: { ...p.done, [id]: true } }, note: 'you-finished-this-game-the-puppy' };
    return { progress, note: 'one-more-good-round-like-this' };
  }
  if (bones <= 2 && level > 1) {
    return {
      progress: { ...p, level: { ...p.level, [id]: level - 1 }, pass: { ...p.pass, [id]: 0 } },
      note: 'next-time-we-start-with-an',
    };
  }
  return { progress: p, note: '' };
}

export interface QuickResult {
  progress: Progress;
  /** Shown on screen. */
  note: string;
  /** Spoken; empty when the note has no recording (it contains a time). */
  say: Piece[];
}

/** The end of Quick Paws. A time only counts as a best when at most two answers needed help. */
export function quickFinished(p: Progress, bones: number, seconds: number, n: number = QUICK): QuickResult {
  if (bones >= n - 2 && (!p.best || seconds < p.best)) {
    return p.best
      ? { progress: { ...p, best: seconds }, note: `A new best! Before it was ${p.best} seconds.`, say: ['a-new-best-time'] }
      : { progress: { ...p, best: seconds }, note: 'That is your first best time.', say: ['that-is-your-first-best-time'] };
  }
  if (bones < n - 2) return { progress: p, note: 'Slow down a little and get them right first.', say: ['slow-down-a-little-and-get'] };
  return { progress: p, note: `Your best is ${p.best} seconds.`, say: [] };
}

/** The words at the end of a round, as sentence ids: a heading, and what comes next. */
export function roundWords(bones: number, n: number, lastToday: boolean, more: boolean): { head: string; tail: string } {
  return {
    head: lastToday ? 'all-done-for-today' : bones >= n - 1 ? 'brilliant' : bones >= n / 2 ? 'well-done' : 'good-trying',
    tail: lastToday ? 'time-to-stop-see-you-tomorrow' : more ? 'ready-for-the-next-one' : '',
  };
}

/** All bones won: they are kept in crates of a hundred, boxes of ten and loose ones. */
export function boneStore(p: Progress): { total: number; crates: number; boxes: number; loose: number } {
  const total = Object.values(p.stars).reduce((a, b) => a + (b ?? 0), 0);
  return { total, crates: Math.floor(total / 100), boxes: Math.floor((total % 100) / 10), loose: total % 10 };
}
