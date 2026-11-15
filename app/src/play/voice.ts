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
