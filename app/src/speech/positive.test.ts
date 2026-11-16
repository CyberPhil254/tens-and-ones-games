import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLIPS } from './catalogue';

/**
 * The rule (CLAUDE.md, "Rules for the build"): an instruction or a hint says what to do, never only
 * what not to do. So no sentence the app says or shows may begin by forbidding.
 */
const FORBIDS = /^(Don['’]t|Do not|No )/;
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.replace(/^["“‘']+/, ''));

describe('say what to do, never only what not to do', () => {
  it('no spoken sentence starts with "Don\'t", "Do not" or "No "', () => {
    const bad = CLIPS.filter((c) => !c.id.startsWith('num.') && sentences(c.text).some((s) => FORBIDS.test(s))).map((c) => `${c.id}: ${c.text}`);
    expect(bad).toEqual([]);
  });

  it('no sentence written on a child’s screen does either', () => {
    // Every piece of text in the games, the play screens and the question makers: what stands between
    // quotes or between tags. Comments are left out.
    const bad: string[] = [];
    for (const dir of ['src/games', 'src/play', 'src/maths']) {
      for (const file of readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.'))) {
        const code = readFileSync(`${dir}/${file}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
        for (const m of code.matchAll(/(['"`>]|[.!?] )(Don['’]t|Do not|No ) ?[^'"`<]{0,60}/g)) bad.push(`${dir}/${file}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the check itself catches a sentence that forbids', () => {
    for (const s of ['Do not count.', 'Look. Don’t count them.', 'No guessing!', 'Stop. No need to hurry.']) expect(sentences(s).some((x) => FORBIDS.test(x)), s).toBe(true);
    for (const s of ['Now pick the number that is closest.', 'Nothing was added and nothing was taken away.', 'None is zero.']) expect(sentences(s).some((x) => FORBIDS.test(x)), s).toBe(false);
  });
});
