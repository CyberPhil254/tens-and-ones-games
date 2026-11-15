/**
 * Saves progress on the device. This is the stand-in for accounts and sync (work package 5):
 * one child, one browser. Only progress is stored: no name, nothing the child typed.
 */
import { PATH, type GameId } from '../maths/questions';
import type { Attempt } from './attempts';
import { newProgress, type Progress } from './progress';

export interface Saved {
  progress: Progress;
  attempts: Attempt[];
  /** The child or a grown-up turned the voice off. */
  soundOff: boolean;
}

const KEY = 'tens-and-ones.v1';
const isGame = (k: string): k is GameId => (PATH as readonly string[]).includes(k);

/** Keeps only entries for games that exist, with values of the right kind. Saved data is never trusted. */
function table<T>(raw: unknown, ok: (v: unknown) => v is T): Partial<Record<GameId, T>> {
  const out: Partial<Record<GameId, T>> = {};
  if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (isGame(k) && ok(v)) out[k] = v;
  return out;
}
const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const flag = (v: unknown): v is boolean => typeof v === 'boolean';

/** Reads progress in the shape the live game saves it, which is also the shape used here. */
export function readProgress(raw: unknown): Progress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    ...newProgress(),
    stars: table(r.stars, count),
    level: table(r.level, count),
    done: table(r.done, flag),
    pass: table(r.pass, count),
    miss: table(r.miss, count),
    day: typeof r.day === 'string' ? r.day : '',
    best: count(r.best) ? r.best : 0,
  };
}

export function load(storage: Pick<Storage, 'getItem'> | undefined): Saved {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? '{}') as Record<string, unknown>;
    return {
      progress: readProgress(raw.progress),
      attempts: Array.isArray(raw.attempts) ? (raw.attempts as Attempt[]) : [],
      soundOff: raw.soundOff === true,
    };
  } catch {
    return { progress: newProgress(), attempts: [], soundOff: false };
  }
}

/** Returns false when the device refuses (private browsing, storage full): the game goes on unsaved. */
export function save(storage: Pick<Storage, 'setItem'> | undefined, saved: Saved): boolean {
  try {
    storage?.setItem(KEY, JSON.stringify(saved));
    return !!storage;
  } catch {
    return false;
  }
}
