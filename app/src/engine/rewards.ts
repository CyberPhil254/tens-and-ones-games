/**
 * Rewards come early and often, and always from what she has achieved, never from minutes played:
 *   - the first time she finishes today's games: a welcome treasure (her choice of two)
 *   - paws (one for every step passed, one for every lesson mastered): a treasure at the 1st, 3rd and 6th paw, then at every third one
 *   - lessons mastered (the second good day): a trick at the 2nd, 5th, 9th, 14th, 20th and 27th lesson
 *   - a unit finished (every lesson mastered): its badge
 *   - a stage finished: the rosette or the trophy; the stretch lessons: the crown
 * Nothing is random and nothing can be lost. Only what she did herself counts: a lesson the starting
 * check marked as known counts for nothing until a review has confirmed it (see `reviewed` in rules.ts).
 * What is owed is worked out from the saved data, so a reward that was not collected (the app was closed)
 * is still there next time.
 */
import type { ProfileData } from '../data/profile';
import { LESSON, LESSONS, UNITS, playable, type Unit } from './curriculum';
import { lessonState } from './state';

export const TREASURES = ['ball', 'bandana', 'bed', 'bowl', 'rope-toy', 'kennel'] as const;
export type Treasure = (typeof TREASURES)[number];
export const TRICKS = ['high-five', 'beg', 'spin', 'roll-over', 'play-bow', 'fetch'] as const;
export type Trick = (typeof TRICKS)[number];
/** One award per stage, and one for the stretch lessons. */
export const AWARDS = { s1: 'rosette', s2: 'trophy', x: 'crown' } as const;
export type StageKey = keyof typeof AWARDS;
export type Award = (typeof AWARDS)[StageKey];

/**
 * Paws: one for every step she passes (each step of a lesson once, the last one included) and one for
 * every lesson she masters. This is the finest thing she achieves, so it is what treasures are counted in.
 */
export const ALL_PAWS = LESSONS.reduce((n, l) => n + (l.steps.length ? l.steps.length + 1 : 0), 0);
/**
 * A treasure comes at the 1st, the 3rd and the 6th paw, then at every third one.
 * Counted in lessons passed (1st, 3rd, 6th, 10th, 15th, 21st), as first planned, a simulated child who is
 * right three times in four waited 13 to 21 days of play for a reward at some point. Counted like this
 * her longest wait is usually 6 days (5 to 10 over ten runs). No schedule tied to what she achieves does
 * much better: she has stretches of several days in which she passes nothing new. See docs/decisions.md.
 */
export const TREASURE_AT: readonly number[] = [1, 3, 6, ...Array.from({ length: Math.floor((ALL_PAWS - 6) / 3) }, (_, i) => 9 + 3 * i)];
/** A trick comes when this many lessons have been mastered: one for each trick Oreo has a picture of. */
export const TRICK_AT = [2, 5, 9, 14, 20, 27] as const;
/** The place a treasure is kept under: the welcome treasure, then one for each number in TREASURE_AT. */
export const WELCOME = 'welcome';
export const treasureSlot = (at: number) => `w${at}`;
export const trickSlot = (at: number) => `m${at}`;
export const TREASURE_SLOTS: readonly string[] = [WELCOME, ...TREASURE_AT.map(treasureSlot)];

export type Earned =
  /** She picks which of two treasures Oreo gets: both are real, neither is more. */
  | { kind: 'treasure'; slot: string; options: [Treasure, Treasure] }
  | { kind: 'trick'; slot: string; trick: Trick }
  /** A unit finished. */
  | { kind: 'badge'; unit: string }
  | { kind: 'award'; stage: StageKey; award: Award };

const stageKey = (u: Unit): StageKey => (u.stretch ? 'x' : u.stage === 1 ? 's1' : 's2');
/** Mastered by playing: not merely marked as known by the starting check. */
const mastered = (d: ProfileData, id: string) => {
  const l = lessonState(d.child, id);
  return !!l.mastered && !l.placed;
};
/** The last step passed at least once, by playing. */
const passed = (d: ProfileData, id: string) => {
  const l = lessonState(d.child, id);
  return !l.placed && (!!l.mastered || l.passedOn.length > 0);
};
/**
 * Steps passed by playing, over all lessons: each step of a lesson counts once, the last one included.
 * A lesson passed counts all its steps, also when a perfect round jumped one.
 */
export const stepsPassed = (d: ProfileData): number =>
  LESSONS.reduce((n, l) => {
    const st = lessonState(d.child, l.id);
    return n + (st.placed ? 0 : passed(d, l.id) ? l.steps.length : Math.min(st.step, l.steps.length));
  }, 0);
/** The paws she has: steps passed and lessons mastered, by playing. */
export const paws = (d: ProfileData): number => stepsPassed(d) + lessonsMastered(d);
export const lessonsPassed = (d: ProfileData): number => LESSONS.filter((l) => passed(d, l.id)).length;
export const lessonsMastered = (d: ProfileData): number => LESSONS.filter((l) => mastered(d, l.id)).length;
/** She has finished today's games at least once. */
export const finishedADay = (d: ProfileData): boolean => d.child.doneOn !== undefined;
/** A unit is finished when every one of its lessons exists and is mastered by playing. */
export const unitDone = (d: ProfileData, u: Unit): boolean => u.lessons.every((l) => playable(l) && mastered(d, l.id));
export const stageDone = (d: ProfileData, k: StageKey): boolean => UNITS.filter((u) => stageKey(u) === k).every((u) => unitDone(d, u));

/** The two treasures offered: the kinds Oreo has fewest of, so her things fill up evenly. */
function offer(d: ProfileData): [Treasure, Treasure] {
  const have = (t: Treasure) => Object.values(d.rewards.treasures).filter((v) => v === t).length;
  const order = [...TREASURES].sort((a, b) => have(a) - have(b) || TREASURES.indexOf(a) - TREASURES.indexOf(b));
  return [order[0]!, order[1]!];
}

/** The next reward she is owed, or null. One at a time, because giving one changes what the next offers. */
export function nextEarned(d: ProfileData): Earned | null {
  const r = d.rewards;
  if (finishedADay(d) && !r.treasures[WELCOME]) return { kind: 'treasure', slot: WELCOME, options: offer(d) };
  const p = paws(d), m = lessonsMastered(d);
  for (const at of TREASURE_AT) if (p >= at && !r.treasures[treasureSlot(at)]) return { kind: 'treasure', slot: treasureSlot(at), options: offer(d) };
  for (const [i, at] of TRICK_AT.entries()) if (m >= at && !r.tricks[trickSlot(at)]) return { kind: 'trick', slot: trickSlot(at), trick: TRICKS[i]! };
  for (const u of UNITS) if (unitDone(d, u) && !r.awards[u.id]) return { kind: 'badge', unit: u.id };
  for (const k of Object.keys(AWARDS) as StageKey[]) {
    if (stageDone(d, k) && !r.awards[k]) return { kind: 'award', stage: k, award: AWARDS[k] };
  }
  return null;
}

/** Gives a reward. For a treasure, `pick` is the one she chose; anything else gets the first on offer. */
export function give(d: ProfileData, e: Earned, pick?: Treasure): ProfileData {
  const r = d.rewards;
  if (e.kind === 'treasure') return { ...d, rewards: { ...r, treasures: { ...r.treasures, [e.slot]: pick && e.options.includes(pick) ? pick : e.options[0] } } };
  if (e.kind === 'trick') return { ...d, rewards: { ...r, tricks: { ...r.tricks, [e.slot]: e.trick } } };
  if (e.kind === 'badge') return { ...d, rewards: { ...r, awards: { ...r.awards, [e.unit]: 'badge' } } };
  return { ...d, rewards: { ...r, awards: { ...r.awards, [e.stage]: e.award } } };
}

/** What every reward stands under, for telling one from another. */
export const earnedKey = (e: Earned): string => (e.kind === 'treasure' || e.kind === 'trick' ? `${e.kind} ${e.slot}` : e.kind === 'badge' ? `badge ${e.unit}` : `award ${e.stage}`);

/**
 * Brings the rewards of a profile saved by an earlier version to today's rules. Run on every profile
 * that is read; a profile already in today's shape comes back unchanged.
 *   1. What the starting check once gave is taken back: a treasure of a lesson that is still only
 *      "known", a trick or award of a unit or stage that holds such a lesson.
 *   2. Treasures were kept per lesson and tricks per unit. They are kept: her treasures move, in the
 *      order of the path, to the first places treasures have now, and her tricks to the first places
 *      for tricks.
 */
export function withoutPlacedRewards(d: ProfileData): ProfileData {
  const placed = (id: string) => !!lessonState(d.child, id).placed;
  const hasPlaced = (u: Unit) => u.lessons.some((l) => placed(l.id));
  const r = d.rewards;
  const oldTreasure = (k: string) => LESSON.has(k), oldTrick = (k: string) => UNITS.some((u) => u.id === k);
  const stripped =
    Object.keys(r.treasures).some((k) => oldTreasure(k)) || Object.keys(r.tricks).some(oldTrick)
    || Object.keys(r.awards).some((k) => UNITS.some((u) => (stageKey(u) === k || u.id === k) && hasPlaced(u)));
  if (!stripped) return d;

  const treasures: Record<string, string> = Object.fromEntries(Object.entries(r.treasures).filter(([k]) => !oldTreasure(k)));
  const kept = LESSONS.filter((l) => r.treasures[l.id] !== undefined && !placed(l.id)).map((l) => r.treasures[l.id]!);
  const free = TREASURE_AT.map(treasureSlot).filter((s) => !treasures[s]);
  kept.slice(0, free.length).forEach((t, i) => { treasures[free[i]!] = t; });

  const tricks: Record<string, string> = Object.fromEntries(Object.entries(r.tricks).filter(([k]) => !oldTrick(k)));
  const had = UNITS.filter((u) => r.tricks[u.id] !== undefined && !hasPlaced(u)).length;
  TRICK_AT.forEach((at, i) => { if (i < had && !tricks[trickSlot(at)]) tricks[trickSlot(at)] = TRICKS[i]!; });

  const awards = Object.fromEntries(Object.entries(r.awards).filter(([k]) => !UNITS.some((u) => (stageKey(u) === k || u.id === k) && hasPlaced(u))));
  return { ...d, rewards: { treasures, tricks, awards } };
}

/** How many of each kind of treasure Oreo has. */
export const treasuresHad = (d: ProfileData): Record<Treasure, number> =>
  Object.fromEntries(TREASURES.map((t) => [t, TREASURE_SLOTS.filter((s) => d.rewards.treasures[s] === t).length])) as Record<Treasure, number>;
/** The tricks Oreo knows, in the order she learns them. */
export const tricksKnown = (d: ProfileData): Trick[] => TRICKS.filter((_, i) => d.rewards.tricks[trickSlot(TRICK_AT[i]!)] !== undefined);
export const badgesWon = (d: ProfileData): string[] => UNITS.filter((u) => d.rewards.awards[u.id] !== undefined).map((u) => u.id);
export const awardsWon = (d: ProfileData): Award[] =>
  (Object.keys(AWARDS) as StageKey[]).map((k) => d.rewards.awards[k]).filter((a): a is Award => (Object.values(AWARDS) as string[]).includes(a ?? ''));

/** What she is working towards next, of the rewards that come by counting: how many more, and of how many since the last one. */
export interface Goal {
  kind: 'welcome' | 'treasure' | 'trick';
  /** The trick Oreo will learn. */
  trick?: Trick;
  /** Still to go: paws, for a treasure; lessons to master, for a trick; today's games, once, for the welcome treasure. */
  more: number;
  /** The paws in the row: what lies between the reward before and this one, and how much of it is done. */
  of: number;
  done: number;
}
export function goals(d: ProfileData): Goal[] {
  const out: Goal[] = [];
  if (!d.rewards.treasures[WELCOME] && !finishedADay(d)) out.push({ kind: 'welcome', more: 1, of: 1, done: 0 });
  const p = paws(d), m = lessonsMastered(d);
  const ti = TREASURE_AT.findIndex((at) => p < at);
  if (ti >= 0) { const from = TREASURE_AT[ti - 1] ?? 0, at = TREASURE_AT[ti]!; out.push({ kind: 'treasure', more: at - p, of: at - from, done: p - from }); }
  const ri = TRICK_AT.findIndex((at) => m < at);
  if (ri >= 0) { const from = TRICK_AT[ri - 1] ?? 0, at = TRICK_AT[ri]!; out.push({ kind: 'trick', trick: TRICKS[ri]!, more: at - m, of: at - from, done: m - from }); }
  return out;
}
/** The one she is nearest to: shown after every round. */
export const nextGoal = (d: ProfileData): Goal | null => [...goals(d)].sort((a, b) => a.more - b.more)[0] ?? null;
