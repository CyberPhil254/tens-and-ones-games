/**
 * Rewards follow mastery, never minutes: a lesson mastered earns Oreo a treasure, a finished
 * unit a trick, a finished stage an award. Nothing is random and nothing can be lost.
 * What is owed is worked out from the saved data, so a reward that was not collected
 * (the app was closed) is still there next time.
 */
import type { ProfileData } from '../data/profile';
import { UNITS, playable, type Unit } from './curriculum';
import { lessonState } from './state';

export const TREASURES = ['ball', 'bandana', 'bed', 'bowl', 'rope-toy', 'kennel'] as const;
export type Treasure = (typeof TREASURES)[number];
export const TRICKS = ['high-five', 'beg', 'spin', 'roll-over', 'play-bow', 'fetch'] as const;
export type Trick = (typeof TRICKS)[number];
/** One award per stage, and one for the stretch lessons. */
export const AWARDS = { s1: 'rosette', s2: 'trophy', x: 'crown' } as const;
export type StageKey = keyof typeof AWARDS;
export type Award = (typeof AWARDS)[StageKey];

export type Earned =
  /** She picks which of two treasures Oreo gets: both are real, neither is more. */
  | { kind: 'treasure'; lesson: string; options: [Treasure, Treasure] }
  | { kind: 'trick'; unit: string; trick: Trick }
  | { kind: 'award'; stage: StageKey; award: Award };

const stageKey = (u: Unit): StageKey => (u.stretch ? 'x' : u.stage === 1 ? 's1' : 's2');
const mastered = (d: ProfileData, id: string) => !!lessonState(d.child, id).mastered;
/** A unit is finished when every one of its lessons exists and is mastered. */
export const unitDone = (d: ProfileData, u: Unit): boolean => u.lessons.every((l) => playable(l) && mastered(d, l.id));
export const stageDone = (d: ProfileData, k: StageKey): boolean => UNITS.filter((u) => stageKey(u) === k).every((u) => unitDone(d, u));

/** The two treasures offered: the kinds Oreo has fewest of, so the garden fills up evenly. */
function offer(d: ProfileData): [Treasure, Treasure] {
  const have = (t: Treasure) => Object.values(d.rewards.treasures).filter((v) => v === t).length;
  const order = [...TREASURES].sort((a, b) => have(a) - have(b) || TREASURES.indexOf(a) - TREASURES.indexOf(b));
  return [order[0]!, order[1]!];
}

/** The next reward she is owed, or null. One at a time, because giving one changes what the next offers. */
export function nextEarned(d: ProfileData): Earned | null {
  for (const u of UNITS) {
    for (const l of u.lessons) if (mastered(d, l.id) && !d.rewards.treasures[l.id]) return { kind: 'treasure', lesson: l.id, options: offer(d) };
  }
  for (const [i, u] of UNITS.entries()) {
    if (unitDone(d, u) && !d.rewards.tricks[u.id]) return { kind: 'trick', unit: u.id, trick: TRICKS[i % TRICKS.length]! };
  }
  for (const k of Object.keys(AWARDS) as StageKey[]) {
    if (stageDone(d, k) && !d.rewards.awards[k]) return { kind: 'award', stage: k, award: AWARDS[k] };
  }
  return null;
}

/** Gives a reward. For a treasure, `pick` is the one she chose; anything else gets the first on offer. */
export function give(d: ProfileData, e: Earned, pick?: Treasure): ProfileData {
  const r = d.rewards;
  if (e.kind === 'treasure') return { ...d, rewards: { ...r, treasures: { ...r.treasures, [e.lesson]: pick && e.options.includes(pick) ? pick : e.options[0] } } };
  if (e.kind === 'trick') return { ...d, rewards: { ...r, tricks: { ...r.tricks, [e.unit]: e.trick } } };
  return { ...d, rewards: { ...r, awards: { ...r.awards, [e.stage]: e.award } } };
}

/**
 * Gives everything owed without asking. Used after the starting check: what she already knew is
 * simply there in the garden, not ten cards in a row.
 */
export function giveAll(d: ProfileData): ProfileData {
  for (let e = nextEarned(d), n = 0; e && n < 200; e = nextEarned(d), n++) d = give(d, e);
  return d;
}

/** The tricks Oreo knows, in the order of the path. */
export const tricksKnown = (d: ProfileData): Trick[] =>
  UNITS.map((u) => d.rewards.tricks[u.id]).filter((t): t is Trick => (TRICKS as readonly string[]).includes(t ?? ''));
export const awardsWon = (d: ProfileData): Award[] =>
  (Object.keys(AWARDS) as StageKey[]).map((k) => d.rewards.awards[k]).filter((a): a is Award => (Object.values(AWARDS) as string[]).includes(a ?? ''));
