import './pictures.css';

const A = '#E2A557', B = '#9C5F2A', C = '#FFF4DF', K = '#1B2A4A';

/** The puppy drawing of the live game, without a wrapper: for inside other pictures. */
export function PuppySvg() {
  return (
    <svg viewBox="0 0 120 124" aria-hidden="true">
      <g stroke={K} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        <path className="tail" d="M84 98 q22 -4 20 -28 q-10 8 -14 18 z" fill={B} />
        <ellipse cx="60" cy="92" rx="27" ry="24" fill={A} />
        <ellipse cx="60" cy="98" rx="13" ry="16" fill={C} stroke="none" />
        <ellipse cx="46" cy="114" rx="10" ry="7" fill={C} />
        <ellipse cx="74" cy="114" rx="10" ry="7" fill={C} />
        <g className="head">
          <ellipse cx="31" cy="50" rx="10" ry="19" fill={B} transform="rotate(14 31 50)" />
          <ellipse cx="89" cy="50" rx="10" ry="19" fill={B} transform="rotate(-14 89 50)" />
          <circle cx="60" cy="46" r="29" fill={A} />
          <ellipse cx="73" cy="41" rx="10" ry="11" fill={B} stroke="none" />
          <ellipse cx="60" cy="59" rx="16" ry="12" fill={C} stroke="none" />
          <circle cx="47" cy="42" r="4" fill={K} stroke="none" />
          <circle cx="73" cy="42" r="4" fill={K} stroke="none" />
          <circle cx="48.4" cy="40.6" r="1.3" fill="#fff" stroke="none" />
          <circle cx="74.4" cy="40.6" r="1.3" fill="#fff" stroke="none" />
          <ellipse cx="60" cy="53" rx="5.5" ry="4" fill={K} stroke="none" />
          <path d="M60 57 v4 M60 61 q-6 6 -11 1 M60 61 q6 6 11 1" fill="none" strokeWidth="2.2" />
          <path className="tongue" d="M55 64 q5 11 10 0 z" fill="#F2768A" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}

/**
 * The puppy as feedback. "happy" after a right answer, "think" (head tilted) after a wrong one,
 * "still" otherwise. It never moves while the child is thinking.
 */
export function Puppy({ mood = 'still', className = '' }: { mood?: 'still' | 'happy' | 'think'; className?: string }) {
  return (
    <div className={['pup', mood !== 'still' && mood, className].filter(Boolean).join(' ')} data-mood={mood}>
      <PuppySvg />
    </div>
  );
}

/** A bone: right first time. */
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
