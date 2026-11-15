import { useSyncExternalStore } from 'react';
import { browserVoice } from '../speech/player';
import type { Piece } from '../speech/script';

/** The one voice of the app. */
export const voice = browserVoice();

/**
 * Says the pieces. A sentence without a recording is reported and skipped: the game must go on,
 * and the tests fail on the report.
 */
export function speak(pieces: readonly Piece[], delay = 0): void {
  voice.say(pieces, delay).catch((e: unknown) => console.error(e));
}

/** True when the voice pack could not be loaded: the app shows words only, and a retry button. */
export function useVoiceSilent(): boolean {
  return useSyncExternalStore(
    (fn) => voice.onChange(fn),
    () => voice.silent,
  );
}

/** True while the voice is speaking. */
export function useVoiceSpeaking(): boolean {
  return useSyncExternalStore(
    (fn) => voice.onChange(fn),
    () => voice.speaking,
  );
}

/** The packs a game's sentences are in, besides the two every game needs. */
const GAME_PACKS: Record<string, readonly string[]> = {
  five: ['games'], pack: ['games', 'place'], look: ['games', 'place'], names: ['games', 'place'], walk: ['games', 'place'], friends: ['games'],
  jump: ['games'], fill: ['games'], take: ['games'], mystery: ['games'], story: ['stories', 'games'],
  sums: ['sums', 'games', 'stories'], plus: ['sums'], bonds: ['sums'], teens: ['place', 'games'], regroup: ['place'], hear: ['place', 'games'],
  dots: ['counting', 'games'], count: ['counting', 'games'], more: ['order'], skip: ['steps'], groups: ['groups', 'sums'], share: ['groups'],
  parts: ['parts', 'sums'], money: ['money', 'order'],
};
/** Fetches the voice for these games ahead of the first question, so it does not have to wait. */
export function warmFor(games: readonly string[]): void {
  void voice.warm([...new Set(['core', 'numbers', ...games.flatMap((g) => GAME_PACKS[g] ?? [])])]);
}
