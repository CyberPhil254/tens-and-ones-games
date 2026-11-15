/**
 * Every number the engine's behaviour depends on, in one place. They are judgement calls from
 * docs/build-spec.md and docs/research.md, to be tuned once more than one child has used the app.
 */
export const CONFIG = {
  /** Questions in a round of one lesson step, and in a mixed warm-up. */
  round: 6,
  warmUp: 5,
  /** Right first time out of a round: this many passes the step, this many or fewer drops one. */
  passAt: 5,
  dropAt: 2,
  /** The last step has to be passed on this many different days before a lesson counts as mastered. */
  masteryDays: 2,
  /** Days after mastery when a lesson comes back, each time it is remembered well. */
  reviewDays: [1, 3, 7, 14, 30],
  /** Misses in a row in review that reopen a mastered lesson. */
  reopenAfter: 2,
  /** The rating: how fast it moves, how much harder each step is, and the share of right answers aimed for. */
  rating: { k: 0.25, stepGap: 1, start: 0, target: 0.75 },
  /** An answer slower than this, from a child who is already accurate at that step, counts as "accurate but slow". */
  slowMs: 15_000,
  /** Guessing: this many wrong taps in a row, each faster than this, and the answers pause for this long. */
  guess: { taps: 3, fasterThanMs: 1200, pauseMs: 3000 },
} as const;
