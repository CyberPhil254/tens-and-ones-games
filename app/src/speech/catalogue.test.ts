// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LEVELS, PATH, makeQuestion } from '../maths/questions';
import { seededRng } from '../maths/random';
import { loadLiveGame } from '../reference/liveGame';
import { CLIPS, clipIds, wording } from './catalogue';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const recorded = JSON.parse(read('../../../audio/voice.json')) as Record<string, [number, number]>;

describe('the clip catalogue', () => {
  it('has exactly the 702 clips of the first recording, each once', () => {
    expect(CLIPS).toHaveLength(702);
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(702);
    expect(CLIPS.map((c) => c.v1).sort()).toEqual(Object.keys(recorded).sort());
  });

  it('lists the same clips as the live game', () => {
    const live = loadLiveGame().speechCatalogue();
    const theirs = [...live.fixed, ...live.frags, ...live.numbers.flatMap((n) => [`#${n},`, `#${n}.`])];
    expect(CLIPS.map((c) => c.v1).sort()).toEqual(theirs.sort());
  });

  it('matches the id list the voice pack is built from', () => {
    // scripts/voice-pack.mjs reads this file. Update it with: npx vitest run src/speech -u
    const keys = Object.fromEntries(CLIPS.map((c) => [c.id, c.v1]));
    return expect(JSON.stringify(keys, null, 1) + '\n').toMatchFileSnapshot('./v1-keys.json');
  });
});

describe('clipIds', () => {
  it('takes ids, present wording and numbers', () => {
    expect(clipIds(['try-again'])).toEqual(['try-again']);
    expect(clipIds(['Try again.'])).toEqual(['try-again']);
    expect(clipIds(['47 is 4 tens and 7 ones.'])).toEqual(['isTO.47']);
  });

  it('says a number one way inside a sentence and another way at its end', () => {
    expect(clipIds([47, 'plus', 10, 'is', 57])).toEqual(['num.47.mid', 'frag.plus', 'num.10.mid', 'frag.is', 'num.57.end']);
    // A new sentence follows, so the number ends its own.
    expect(clipIds([47, 'take away', 10, 'is', 37, 'Only the tens change.'])[4]).toBe('num.37.end');
    expect(clipIds(['He has', 7, 'how-many-more-does-he-need'])[1]).toBe('num.7.end');
  });

  it('refuses anything that has no recording', () => {
    expect(() => clipIds(['Hello there.'])).toThrow(/No recorded clip/);
    expect(() => clipIds([101])).toThrow(/No recorded clip/);
  });

  it('gives the words back for the screen', () => {
    expect(wording('try-again')).toBe('Try again.');
    expect(wording(47)).toBe('47');
  });

  it('has a clip for everything the question makers want said', () => {
    const rng = seededRng(3);
    for (const id of PATH) {
      for (let level = 1; level <= LEVELS[id]; level++) {
        for (let i = 0; i < 3000; i++) {
          const q = makeQuestion(id, level, rng) as { say?: (string | number)[]; sayEq?: (string | number)[]; hint?: string };
          if (q.say) clipIds(q.say);
          if (q.sayEq) clipIds(q.sayEq);
          if (q.hint) clipIds([q.hint]);
        }
      }
    }
  });
});
