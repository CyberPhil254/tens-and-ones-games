// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { loadLiveGame, type Q } from './liveGame';
import { asked, mathsFault, spoken, spokenFromPlay, stitchedSentences } from './rules';

/**
 * Reference check of the live game (../index.html) as it is today.
 * Every game and level is drawn many times with a fixed random sequence, and drawing goes on
 * until no new question has turned up for twice as long as it took to find the last one.
 */
const MIN_DRAWS = 40_000;
const MAX_DRAWS = 1_000_000;
const game = loadLiveGame();
const levels = game.PATH.flatMap((id) =>
  Array.from({ length: game.MAXL[id]! }, (_, i) => ({ id, level: i + 1 })),
);
const catalogue = game.speechCatalogue();
const wholeClips = new Set(catalogue.fixed);
const fragments = new Set(catalogue.frags);
const numbers = new Set(catalogue.numbers);

/** A question without its choices: the choices are shuffled in separately. */
const key = (q: Q) => JSON.stringify({ ...q, opts: undefined });
const range = (xs: number[]) => (xs.length ? `${Math.min(...xs)} to ${Math.max(...xs)}` : 'none');

interface Seen {
  distinct: Map<string, Q>;
  /** True when drawing stopped because nothing new was turning up any more. */
  settled: boolean;
  faults: string[];
  stitched: Set<string>;
}

function play(id: string, level: number): Seen {
  game.seed(20261115 + level);
  const seen: Seen = { distinct: new Map(), settled: false, faults: [], stitched: new Set() };
  const fault = (why: string, q: Q) => seen.faults.length < 5 && seen.faults.push(`${why}: ${JSON.stringify(q)}`);

  let lastNew = 0;
  for (let i = 0; i < MAX_DRAWS; i++) {
    if (i >= MIN_DRAWS && i >= lastNew * 3) {
      seen.settled = true;
      break;
    }
    const q = game.GEN[id]!(level);
    const k = key(q);
    const isNew = !seen.distinct.has(k);
    if (isNew) {
      seen.distinct.set(k, q);
      lastNew = i;
    }

    // Choices are drawn afresh every time, so they are checked every time.
    for (const a of asked(game, id, level, q)) {
      if (!a.choices) continue;
      const c = a.choices;
      if (new Set(c).size !== c.length) fault('choices repeat', q);
      if (c.filter((v) => v === a.answer).length !== 1) fault('answer is not among the choices exactly once', q);
      if (!a.pad && c.length !== 4) fault('not four choices', q);
      if (c.some((v) => !Number.isInteger(v) || v < 1 || v > 100)) fault('a choice is outside 1 to 100', q);
      if (c.some((v, j) => j > 0 && v <= c[j - 1]!)) fault('choices are not in rising order', q);
    }
    if (!isNew) continue;

    const wrong = mathsFault(id, level, q);
    if (wrong) seen.faults.push(wrong);

    for (const pieces of spoken(game, id, level, q)) {
      for (const p of pieces) {
        const known = typeof p === 'number' ? numbers.has(p) : wholeClips.has(p) || fragments.has(p);
        if (!known) fault(`no recorded clip for "${p}"`, q);
      }
      for (const s of stitchedSentences(pieces, wholeClips)) seen.stitched.add(s);
    }
  }
  return seen;
}

const results = new Map(levels.map((l) => [`${l.id} ${l.level}`, play(l.id, l.level)]));

describe('the live game, as it is today', () => {
  it('has eleven games on the path', () => {
    expect(game.PATH).toHaveLength(11);
  });

  it.each(levels)('$id level $level: one right answer among unique choices, and the maths is right', ({ id, level }) => {
    const seen = results.get(`${id} ${level}`)!;
    expect(seen.faults).toEqual([]);
    expect(seen.settled).toBe(true);
  });

  it('matches the recorded summary of every game and level', async () => {
    const summary: Record<string, unknown> = {};
    for (const { id, level } of levels) {
      const qs = [...results.get(`${id} ${level}`)!.distinct.values()];
      const answers = qs.flatMap((q) => asked(game, id, level, q).map((a) => a.answer));
      const nums = (k: string) => qs.map((q) => q[k]).filter((v): v is number => typeof v === 'number');
      const fields: Record<string, string> = {};
      for (const k of ['n', 'a', 'b', 's', 'whole']) if (nums(k).length) fields[k] = range(nums(k));
      summary[`${id} ${level}`] = { questions: qs.length, answers: range(answers), ...fields };
    }
    await expect(JSON.stringify(summary, null, 2) + '\n').toMatchFileSnapshot('./live-game-summary.json');
  });

  it('counts the sentences that are stitched from pieces today', async () => {
    const perGame: Record<string, Set<string>> = {};
    const add = (id: string, s: string) => (perGame[id] ??= new Set()).add(s);
    for (const { id, level } of levels) for (const s of results.get(`${id} ${level}`)!.stitched) add(id, s);
    for (const [id, lists] of Object.entries(spokenFromPlay())) {
      for (const pieces of lists) for (const s of stitchedSentences(pieces, wholeClips)) add(id, s);
    }
    const all = new Set(Object.values(perGame).flatMap((s) => [...s]));
    const counts = Object.fromEntries(Object.entries(perGame).map(([id, s]) => [id, s.size]));
    await expect(
      JSON.stringify({ perGame: counts, distinctAcrossGames: all.size }, null, 2) + '\n',
    ).toMatchFileSnapshot('./live-game-stitched-sentences.json');
  });
});
