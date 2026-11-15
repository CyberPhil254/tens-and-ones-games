// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { loadLiveGame, type Q } from '../reference/liveGame';
import { asked, mathsFault } from '../reference/rules';
import { drawUntilSettled, summarise } from '../reference/summary';
import { LEVELS, PAD, PATH, makeQuestion, type GameId } from './questions';
import { seededRng } from './random';

const live = loadLiveGame();
const levels = PATH.flatMap((id) => Array.from({ length: LEVELS[id] }, (_, i) => ({ id, level: i + 1 })));

/** The live game writes a mystery equation as HTML; the port keeps it as a list. Bring both to "? + 4 = 10". */
const plain = (q: Q): unknown => {
  const eq = q.eq;
  const text = Array.isArray(eq) ? eq.join(' ') : typeof eq === 'string' ? eq.replace(/<[^>]+>/g, '') : eq;
  // The live game says "the puppy" and "he"; the app says "Oreo" and "she". Nothing else differs.
  const oreo = (t: string) => t.replace(/[Tt]he puppy/g, 'Oreo').replace(/\bHe\b/g, 'She').replace(/\bhe\b/g, 'she');
  return JSON.parse(JSON.stringify({ ...q, eq: text }), (_k, v: unknown) => (typeof v === 'string' ? oreo(v) : v));
};

describe('the ported question makers', () => {
  it('have the same games and levels as the live game', () => {
    expect([...PATH]).toEqual(live.PATH);
    expect(LEVELS).toEqual(live.MAXL);
    expect([...PAD]).toEqual(live.PAD);
  });

  it.each(levels)('$id level $level: the same questions as the live game, draw by draw', ({ id, level }) => {
    const seed = 4711 + level;
    live.seed(seed);
    const rng = seededRng(seed);
    for (let i = 0; i < 20_000; i++) {
      const theirs = plain(live.GEN[id]!(level));
      const ours = plain(makeQuestion(id, level, rng) as unknown as Q);
      if (JSON.stringify(ours) !== JSON.stringify(theirs)) expect(ours, `draw ${i}`).toEqual(theirs);
    }
  });

  // These two do not need the live game, and stay when index.html is retired.
  const drawn = new Map<string, { distinct: Map<string, Q>; settled: boolean; faults: string[] }>(
    levels.map(({ id, level }) => {
      const rng = seededRng(20261115 + level);
      const faults: string[] = [];
      const d = drawUntilSettled(
        () => makeQuestion(id as GameId, level, rng) as unknown as Q,
        (q, isNew) => {
          for (const a of asked({ PAD }, id, level, q)) {
            if (!a.choices) continue;
            const c = a.choices;
            const ok =
              new Set(c).size === c.length &&
              c.filter((v) => v === a.answer).length === 1 &&
              (a.pad || c.length === 4) &&
              c.every((v, j) => Number.isInteger(v) && v >= 1 && v <= 100 && (j === 0 || v > c[j - 1]!));
            if (!ok && faults.length < 5) faults.push(`bad choices: ${JSON.stringify(q)}`);
          }
          const wrong = isNew ? mathsFault(id, level, q) : undefined;
          if (wrong) faults.push(wrong);
        },
      );
      return [`${id} ${level}`, { ...d, faults }];
    }),
  );

  it.each(levels)('$id level $level: one right answer among unique choices, and the maths is right', ({ id, level }) => {
    const seen = drawn.get(`${id} ${level}`)!;
    expect(seen.faults).toEqual([]);
    expect(seen.settled).toBe(true);
  });

  it('can ask exactly the questions recorded for the live game', async () => {
    const summary = summarise({ PAD }, levels, (id, level) => [...drawn.get(`${id} ${level}`)!.distinct.values()]);
    await expect(summary).toMatchFileSnapshot('../reference/live-game-summary.json');
  });

  it('refuses a level a game does not have', () => {
    expect(() => makeQuestion('five', 4, seededRng(1))).toThrow(RangeError);
    expect(() => makeQuestion('jump', 0, seededRng(1))).toThrow(RangeError);
  });

  it('gives the same questions for the same seed', () => {
    const a = seededRng(7), b = seededRng(7);
    for (let i = 0; i < 50; i++) expect(makeQuestion('story', 3, a)).toEqual(makeQuestion('story', 3, b));
  });
});
