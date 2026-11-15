import type { Activity } from '../engine/curriculum';
import type { Piece } from '../speech/script';

/** Quick Paws: ten fast questions from three game levels. */
export const QUICK_N = 10;
export const QUICK_FROM: Activity[] = [{ game: 'friends', level: 2 }, { game: 'jump', level: 4 }, { game: 'names', level: 1 }];

export interface QuickResult {
  best: number;
  /** Shown on screen. */
  note: string;
  /** Spoken; empty when the note has no recording (it contains a time). */
  say: Piece[];
}

/** The end of Quick Paws. A time only counts as a best when at most two answers needed help. */
export function quickFinished(best: number, bones: number, seconds: number, n: number = QUICK_N): QuickResult {
  if (bones >= n - 2 && (!best || seconds < best)) {
    return best
      ? { best: seconds, note: `A new best! Before it was ${best} seconds.`, say: ['a-new-best-time'] }
      : { best: seconds, note: 'That is your first best time.', say: ['that-is-your-first-best-time'] };
  }
  if (bones < n - 2) return { best, note: 'Slow down a little and get them right first.', say: ['slow-down-a-little-and-get'] };
  return { best, note: `Your best is ${best} seconds.`, say: [] };
}
