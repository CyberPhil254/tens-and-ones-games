import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANIM_NAMES, ANIMS, keyframesOf, valueAt, type Track } from './animate';

const source = JSON.parse(readFileSync('../art/rigs/animations.json', 'utf8')) as Record<string, unknown>[];
const TRACKS = ['rot', 'y', 'sx', 'sy', 'tail'] as const;

describe('Oreo’s animations', () => {
  it('are the ten in art/rigs/animations.json, with the same movements', () => {
    expect(source.map((a) => a.name).sort()).toEqual([...ANIM_NAMES].sort());
    for (const src of source) {
      const a = ANIMS[src.name as (typeof ANIM_NAMES)[number]];
      expect(a.pose).toBe(src.pose);
      expect(a.ms).toBe(src.ms);
      expect(a.origin).toBe(src.origin);
      for (const t of TRACKS) expect(a[t], `${a.name} ${t}`).toEqual(src[t]);
      expect(!!a.layers).toBe(!!src.layers);
    }
  });

  it('each starts and ends as the still picture, and none is long', () => {
    for (const name of ANIM_NAMES) {
      const a = ANIMS[name];
      expect(a.ms).toBeGreaterThanOrEqual(1000);
      expect(a.ms).toBeLessThanOrEqual(2000);
      for (const t of TRACKS) {
        const track = a[t] as Track | undefined;
        if (!track) continue;
        const still = t === 'sx' || t === 'sy' ? 1 : 0;
        expect(track[0], `${name} ${t} starts still`).toEqual([0, still]);
        expect(track[track.length - 1], `${name} ${t} ends still`).toEqual([1, still]);
        expect(track.map(([x]) => x)).toEqual([...track.map(([x]) => x)].sort((x, y) => x - y)); // time only goes forward
      }
      const { whole, tail } = keyframesOf(a);
      expect(whole.length + (tail ? 1 : 0), `${name} moves something`).toBeGreaterThan(0);
      for (const frames of [...whole, ...(tail ? [tail] : [])]) {
        expect(frames[0]!.offset).toBe(0);
        expect(frames[frames.length - 1]!.offset).toBe(1);
        const { offset: _o, easing: _e, ...first } = frames[0]!, { offset: _o2, easing: _e2, ...last } = frames[frames.length - 1]!;
        void _o; void _e; void _o2; void _e2;
        expect(last).toEqual(first);
        expect(Object.values(first)[0]).toMatch(/^(0 0%|0deg|1 1)$/); // no lift, no turn, full size
      }
    }
  });

  it('the wags turn only the tail, about a point inside the picture, and both layers are in the app', () => {
    for (const name of ['wag-proud', 'wag-happy'] as const) {
      const a = ANIMS[name];
      expect(keyframesOf(a).tail).not.toBeNull();
      expect(a.rot).toBeUndefined(); // the body does not turn
      const [x, y] = a.layers!.tailOrigin.split(' ').map((v) => parseFloat(v));
      expect(x! > 0 && x! < 100 && y! > 0 && y! < 100).toBe(true);
      for (const part of ['body', 'tail']) expect(existsSync(`src/art/rigs/${a.pose}-${part}.webp`)).toBe(true);
    }
    for (const name of ANIM_NAMES) if (!name.startsWith('wag-')) expect(keyframesOf(ANIMS[name]).tail).toBeNull();
  });

  it('eases in and out between the points of a track', () => {
    const track: Track = [[0, 0], [0.5, 10], [1, 0]];
    expect(valueAt(track, 0)).toBe(0);
    expect(valueAt(track, 0.25)).toBe(5);
    expect(valueAt(track, 0.125)).toBeLessThan(2.5); // slow at the start
    expect(valueAt(track, 0.375)).toBeGreaterThan(7.5); // slow before the turn
    expect(valueAt(track, 0.5)).toBe(10);
    expect(valueAt(track, 1)).toBe(0);
  });

  it('the preview GIFs are not in the app', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
    expect([...walk('src'), ...walk('public')].filter((f) => f.endsWith('.gif'))).toEqual([]);
  });
});
