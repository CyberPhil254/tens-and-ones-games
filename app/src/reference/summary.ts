/**
 * Draws a game level until no new question turns up, and sums up what was seen.
 * Used on the live game and on the port: both must give the same summary file.
 */
import type { Q } from './liveGame';
import { asked } from './rules';

const MIN_DRAWS = 40_000;
const MAX_DRAWS = 1_000_000;

/** A question without its choices: the choices are shuffled in separately. */
export const questionKey = (q: Q) => JSON.stringify({ ...q, opts: undefined });

export interface Drawn {
  distinct: Map<string, Q>;
  /** True when drawing stopped because nothing new was turning up any more. */
  settled: boolean;
}

/** Calls `each` for every draw; `isNew` says whether that question was seen before. */
export function drawUntilSettled(draw: () => Q, each?: (q: Q, isNew: boolean) => void): Drawn {
  const distinct = new Map<string, Q>();
  let lastNew = 0;
  for (let i = 0; i < MAX_DRAWS; i++) {
    if (i >= MIN_DRAWS && i >= lastNew * 3) return { distinct, settled: true };
    const q = draw();
    const k = questionKey(q);
    const isNew = !distinct.has(k);
    if (isNew) {
      distinct.set(k, q);
      lastNew = i;
    }
    each?.(q, isNew);
  }
  return { distinct, settled: false };
}

const range = (xs: number[]) => (xs.length ? `${Math.min(...xs)} to ${Math.max(...xs)}` : 'none');

export function summarise(
  pad: { PAD: readonly number[] },
  levels: { id: string; level: number }[],
  questions: (id: string, level: number) => Q[],
): string {
  const summary: Record<string, unknown> = {};
  for (const { id, level } of levels) {
    const qs = questions(id, level);
    const answers = qs.flatMap((q) => asked(pad, id, level, q).map((a) => a.answer));
    const nums = (k: string) => qs.map((q) => q[k]).filter((v): v is number => typeof v === 'number');
    const fields: Record<string, string> = {};
    for (const k of ['n', 'a', 'b', 's', 'whole']) if (nums(k).length) fields[k] = range(nums(k));
    summary[`${id} ${level}`] = { questions: qs.length, answers: range(answers), ...fields };
  }
  return JSON.stringify(summary, null, 2) + '\n';
}
