/**
 * A silent record of every answered question, for the adaptive engine that comes later
 * (work package 4). Response time is recorded and never shown to the child.
 */
import type { GameId } from '../maths/questions';

export interface Attempt {
  game: GameId;
  level: number;
  /** Where it was asked: a round of the game, the warm-up mix, or Quick Paws. */
  kind: 'game' | 'mix' | 'quick';
  /** Right first time, with no hint and no help picture. */
  clean: boolean;
  /** Wrong taps before the right answer. */
  misses: number;
  /** She asked for the help picture. */
  helped: boolean;
  /** Milliseconds from the question appearing to the right answer. */
  ms: number;
  /** When it was answered, as an ISO time. */
  at: string;
}

/** The newest attempts are kept; the oldest fall away so the device's storage cannot fill up. */
export const KEEP = 5000;

export const addAttempt = (log: Attempt[], a: Attempt): Attempt[] => [...log, a].slice(-KEEP);
