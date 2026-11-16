import { useEffect, useRef, useState } from 'react';
import celebrating from '../art/oreo/celebrating.webp';
import digging from '../art/oreo/digging.webp';
import happy from '../art/oreo/happy.webp';
import hello from '../art/oreo/hello.webp';
import listening from '../art/oreo/listening.webp';
import notYet from '../art/oreo/not-yet.webp';
import pointing from '../art/oreo/pointing.webp';
import proud from '../art/oreo/proud.webp';
import sleeping from '../art/oreo/sleeping.webp';
import standing from '../art/oreo/standing.webp';
import thinking from '../art/oreo/thinking.webp';
import trickBeg from '../art/rewards/trick-beg.webp';
import trickFetch from '../art/rewards/trick-fetch.webp';
import trickHighFive from '../art/rewards/trick-high-five.webp';
import trickPlayBow from '../art/rewards/trick-play-bow.webp';
import trickRollOver from '../art/rewards/trick-roll-over.webp';
import trickSpin from '../art/rewards/trick-spin.webp';
import happyBody from '../art/rigs/happy-body.webp';
import happyTail from '../art/rigs/happy-tail.webp';
import proudBody from '../art/rigs/proud-body.webp';
import proudTail from '../art/rigs/proud-tail.webp';
import { ANIMS, play, reducedMotion, type AnimName } from './animate';
import './pictures.css';

/**
 * Oreo, the puppy. The pictures come from art/puppy/ (see art/README.md) and are copied here,
 * shrunk, by tools/art/app.py. Only the poses listed here are in the app.
 */
const POSES = {
  /** Resting. */
  standing,
  /** A question is open. */
  thinking,
  /** A right answer. */
  happy,
  /** A wrong answer. */
  'not-yet': notYet,
  /** Beside an explanation. */
  pointing,
  /** The end of a good round. */
  celebrating,
  /** The end of any other round. */
  proud,
  /** The home screen. */
  hello,
  /** While the voice speaks. */
  listening,
  /** Today's games are done. */
  sleeping,
  /** Something that is still being made. */
  digging,
} as const;
export type Pose = keyof typeof POSES;
export const ALL_POSES = Object.keys(POSES) as Pose[];

/** Poses that come with a little hop when they appear. Every other pose is still. */
const HOPS: Pose[] = ['happy', 'celebrating'];

/** Fetches the poses ahead of time, so a change of pose never shows an empty space first. */
export function preloadPoses(poses: readonly Pose[] = ALL_POSES): void {
  for (const p of poses) new Image().src = POSES[p];
  // The layers of the two wags as well: she wags right after an answer, and must not flicker first.
  for (const src of [happyBody, happyTail, proudBody, proudTail]) new Image().src = src;
}

/**
 * Oreo in one pose. She changes pose to react: she never moves on her own, and not at all
 * while the child is thinking. She is decoration and is hidden from screen readers; what she
 * reacts to is always said in words beside her.
 */
export function Oreo({ pose, className = '' }: { pose: Pose; className?: string }) {
  return (
    <div className={['pup', HOPS.includes(pose) && 'hop', className].filter(Boolean).join(' ')} data-pose={pose}>
      <img src={POSES[pose]} alt="" draggable={false} />
    </div>
  );
}

const STILL: Record<AnimName, string> = {
  'wag-proud': proud, 'wag-happy': happy, 'hop-celebrating': celebrating, 'wave-hello': hello,
  'trick-high-five': trickHighFive, 'trick-beg': trickBeg, 'trick-spin': trickSpin, 'trick-roll-over': trickRollOver, 'trick-play-bow': trickPlayBow, 'trick-fetch': trickFetch,
};
const LAYERS: Partial<Record<AnimName, { body: string; tail: string }>> = {
  'wag-proud': { body: proudBody, tail: proudTail }, 'wag-happy': { body: happyBody, tail: happyTail },
};

/**
 * Oreo doing one of her ten animations, once, when she appears; then she is the still picture.
 * `still` shows the picture without moving (a screen that has already greeted). With reduced
 * motion she never moves. `box` is the side of the square she fits into, as a CSS length.
 * Only for moments when no question is open: a reward, the end of a round, a right answer, hello.
 */
export function OreoAnim({ name, className = '', alt = '', still = false }: { name: AnimName; className?: string; alt?: string; still?: boolean }) {
  const a = ANIMS[name], layers = LAYERS[name];
  const picture = useRef<HTMLDivElement>(null), tail = useRef<HTMLImageElement>(null);
  // What she is doing is known from the first moment she is shown: "playing" until the animation has ended, and
  // never "still" for an instant before it starts.
  const [state, setState] = useState<'still' | 'playing'>(() => (still || reducedMotion() ? 'still' : 'playing'));
  useEffect(() => {
    if (still || !picture.current || reducedMotion()) return;
    return play(name, picture.current, tail.current, () => setState('still'));
  }, [name, still]);
  return (
    <div
      className={['pup', 'oreoanim', className].filter(Boolean).join(' ')} data-pose={a.pose} data-anim={name} data-anim-state={state}
      style={{ ['--ratio' as string]: a.size[0] / a.size[1] }} role={alt ? 'img' : undefined} aria-label={alt || undefined}
    >
      <div className="oa-pic" ref={picture} style={{ transformOrigin: a.origin === 'center' ? '50% 50%' : '50% 100%' }}>
        {layers && <img className="oa-tail" ref={tail} src={layers.tail} alt="" draggable={false} style={{ transformOrigin: a.layers!.tailOrigin }} />}
        <img className="oa-body" src={layers ? layers.body : STILL[name]} alt="" draggable={false} />
      </div>
    </div>
  );
}

/** A bone: right first time. Drawn in code, like everything the child counts. */
export function Bone() {
  return (
    <svg className="ic" viewBox="0 0 32 16" aria-hidden="true">
      <circle cx="5" cy="4.5" r="4.5" /><circle cx="5" cy="11.5" r="4.5" />
      <circle cx="27" cy="4.5" r="4.5" /><circle cx="27" cy="11.5" r="4.5" />
      <rect x="5" y="4.5" width="22" height="7" />
    </svg>
  );
}

/** A paw: right after a hint or with the help picture. */
export function Paw() {
  return (
    <svg className="ic paw" viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="16.5" rx="6.5" ry="5.5" /><circle cx="4.5" cy="10" r="2.6" />
      <circle cx="9.3" cy="5.6" r="2.8" /><circle cx="14.7" cy="5.6" r="2.8" /><circle cx="19.5" cy="10" r="2.6" />
    </svg>
  );
}
