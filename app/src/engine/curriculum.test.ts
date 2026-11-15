// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALL_GAMES as PATH, LEVELS_OF as LEVELS, variantsOf } from '../maths/questions';
import { LESSON, LESSONS, UNITS, playable } from './curriculum';

const doc = (name: string) => readFileSync(fileURLToPath(new URL(`../../../docs/${name}`, import.meta.url)), 'utf8');
/** The rows of the skill tables in docs/skill-map.md: id, skill in our words, what it needs first. */
const skillRows = [...doc('skill-map.md').matchAll(/^\| (s[12]-[a-z0-9]+) \| [^|]+ \| ([^|]+) \| [^|]* \|([^|]*)\|$/gm)].map((m) => ({
  id: m[1]!, skill: m[2]!.trim(), needs: m[3]!.split(',').map((s) => s.trim()).filter(Boolean),
}));

describe('the curriculum data', () => {
  it('has one lesson for every skill in the skill map, with the same wording and prerequisites', () => {
    expect(skillRows).toHaveLength(38);
    for (const row of skillRows) {
      const l = LESSON.get(row.id);
      expect(l, row.id).toBeDefined();
      expect(l!.skill, row.id).toBe(row.skill);
      expect([...l!.needs].sort(), row.id).toEqual([...row.needs].sort());
    }
    expect(LESSONS.filter((l) => !l.id.startsWith('x-')).map((l) => l.id).sort()).toEqual(skillRows.map((r) => r.id).sort());
  });

  it('puts the lessons in the units of the build spec, in its order', () => {
    const spec = doc('build-spec.md');
    const rows = [...spec.matchAll(/^\| (\d)\. ([^|]+) \| ((?:s[12]-[a-z0-9]+(?:, )?)+) \|$/gm)].map((m) => ({ title: m[2]!.trim(), lessons: m[3]!.split(', ') }));
    expect(rows).toHaveLength(13);
    expect(UNITS.filter((u) => !u.stretch).map((u) => ({ title: u.title, lessons: u.lessons.map((l) => l.id) }))).toEqual(rows);
  });

  it('never needs a lesson that comes later on the path, or one that does not exist', () => {
    const seen = new Set<string>();
    for (const l of LESSONS) {
      for (const n of l.needs) expect(seen.has(n), `${l.id} needs ${n}`).toBe(true);
      seen.add(l.id);
    }
  });

  it('gives every lesson its own id and a title a parent can read', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) expect(l.title.length, l.id).toBeGreaterThan(3);
    for (const u of UNITS) expect(JSON.stringify(u)).not.toMatch(/Cambridge|endorsed|\b[12]N[a-z]\./);
  });

  it('only points at game levels that exist', () => {
    for (const l of LESSONS) for (const s of l.steps) {
      expect(s.from.length, l.id).toBeGreaterThan(0);
      for (const act of s.from) {
        expect(act.level, `${l.id} ${act.game}`).toBeGreaterThanOrEqual(1);
        expect(act.level, `${l.id} ${act.game}`).toBeLessThanOrEqual(LEVELS[act.game]);
        if (act.variant !== undefined) expect(act.variant).toBeLessThan(variantsOf(act.game));
      }
    }
  });

  it('uses every level of every ported game, and every kind of story, in exactly one lesson', () => {
    const used = LESSONS.flatMap((l) => l.steps.flatMap((s) => s.from.map((act) => `${act.game} ${act.level}${act.variant === undefined ? '' : ` kind ${act.variant}`}`)));
    const all = PATH.flatMap((g) =>
      Array.from({ length: LEVELS[g] }, (_, i) => (variantsOf(g) > 1 ? Array.from({ length: variantsOf(g) }, (_, v) => `${g} ${i + 1} kind ${v}`) : [`${g} ${i + 1}`])).flat(),
    );
    expect([...used].sort()).toEqual([...all].sort());
  });

  it('knows which lessons have nothing to play yet', () => {
    // This list shrinks as the new lessons are built, and must be empty at the end of the build.
    expect(LESSONS.filter((l) => !playable(l)).map((l) => l.id)).toMatchInlineSnapshot(`[]`);
  });
});
