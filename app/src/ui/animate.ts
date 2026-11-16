/**
 * Oreo's ten animations, built from the data in art/rigs/animations.json (copied to src/art/rigs/ by
 * tools/art/app.py) with the Web Animations API. See art/rigs/README.md for what each track means.
 * Each plays once and ends in the still picture. With reduced motion nothing plays.
 */
import data from '../art/rigs/animations.json';

/** Points over time: [time from 0 to 1, value]. */
export type Track = [number, number][];
export interface Anim {
  name: string;
  pose: string;
  ms: number;
  /** The still picture's width and height, as the app has it. */
  size: [number, number];
  /** Whole-picture movements turn and scale about the bottom centre, unless this says "center". */
  origin?: 'center';
  /** Degrees, clockwise. */
  rot?: Track;
  /** Percent of the picture's height; negative is up. */
  y?: Track;
  sx?: Track;
  sy?: Track;
  /** Degrees for the tail layer, about `layers.tailOrigin`. */
  tail?: Track;
  layers?: { tailOrigin: string };
}

export const ANIM_NAMES = [
  'wag-proud', 'wag-happy', 'hop-celebrating', 'wave-hello',
  'trick-high-five', 'trick-beg', 'trick-spin', 'trick-roll-over', 'trick-play-bow', 'trick-fetch',
] as const;
export type AnimName = (typeof ANIM_NAMES)[number];
export const ANIMS = Object.fromEntries((data as unknown as Anim[]).map((a) => [a.name, a])) as Record<AnimName, Anim>;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** A track's value at a time, easing in and out between its points. */
export function valueAt(track: Track, t: number): number {
  if (t <= track[0]![0]) return track[0]![1];
  for (let i = 1; i < track.length; i++) {
    const [t1, v1] = track[i]!, [t0, v0] = track[i - 1]!;
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return track[track.length - 1]![1];
}

type Frame = Keyframe & { offset: number };
const frames = (times: number[], css: (t: number) => Record<string, string>): Frame[] =>
  times.map((t) => ({ offset: t, easing: 'ease-in-out', ...css(t) }));
const times = (...tracks: (Track | undefined)[]) => [...new Set(tracks.flatMap((tr) => tr?.map(([t]) => t) ?? []))].sort((a, b) => a - b);
const r = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The keyframes of an animation: one list per property for the whole picture (lift, turn, scale are
 * separate CSS properties, so they do not disturb each other), and one for the tail layer.
 */
export function keyframesOf(a: Anim): { whole: Frame[][]; tail: Frame[] | null } {
  const whole: Frame[][] = [];
  if (a.y) whole.push(frames(times(a.y), (t) => ({ translate: `0 ${r(valueAt(a.y!, t))}%` })));
  if (a.rot) whole.push(frames(times(a.rot), (t) => ({ rotate: `${r(valueAt(a.rot!, t))}deg` })));
  if (a.sx || a.sy) whole.push(frames(times(a.sx, a.sy), (t) => ({ scale: `${a.sx ? r(valueAt(a.sx, t)) : 1} ${a.sy ? r(valueAt(a.sy, t)) : 1}` })));
  return { whole, tail: a.tail ? frames(times(a.tail), (t) => ({ rotate: `${r(valueAt(a.tail!, t))}deg` })) : null };
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Plays an animation once on a picture (and its tail layer, for the wags). Returns a way to stop it,
 * which puts the picture back to still at once. Nothing is left behind when it ends: no fill, no loop.
 */
export function play(name: AnimName, picture: HTMLElement, tail: HTMLElement | null, onEnd?: () => void): () => void {
  const a = ANIMS[name];
  if (reducedMotion() || typeof picture.animate !== 'function') {
    onEnd?.();
    return () => {};
  }
  const k = keyframesOf(a), timing: KeyframeAnimationOptions = { duration: a.ms, iterations: 1, fill: 'none' };
  const running = k.whole.map((f) => picture.animate(f, timing));
  if (k.tail && tail) running.push(tail.animate(k.tail, timing));
  let ended = false;
  void Promise.all(running.map((x) => x.finished)).then(() => { ended = true; onEnd?.(); }, () => {});
  return () => {
    if (!ended) for (const x of running) x.cancel();
  };
}
