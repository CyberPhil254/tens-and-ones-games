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
