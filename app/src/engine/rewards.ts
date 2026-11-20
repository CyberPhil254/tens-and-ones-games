/**
 * Rewards come from what she has learnt by playing, never from minutes played, and never more than one a day:
 *   - the first time she finishes today's games: a welcome treasure (her choice of two)
 *   - paws (one for every step passed, one for every lesson mastered): a treasure every eight paws at
 *     first, then every nine (TREASURE_AT)
 *   - lessons mastered (the second good day): a trick about every seventh lesson (TRICK_AT)
 *   - a unit finished: its badge; a stage finished: the rosette or the trophy; the stretch lessons: the crown
 * Nothing is random and nothing can be lost. Only what she learnt here counts: a lesson the starting check
 * marked as known counts for nothing, also after a review has confirmed it.
 * A reward is handed over when she has finished today's games, one a day. If she has earned more, the
 * rest wait: one on each of the next days she finishes today's games. What is owed is worked out from the
 * saved data, so a reward that was not collected (the app was closed) is still there next time.
 */
import type { ProfileData } from '../data/profile';
import { LESSONS, UNITS, playable, type Unit } from './curriculum';
import { lessonState, type Day, type LessonState } from './state';

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
const TREASURE_PLAN = [6, 12, 18, 24, 30, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124, 132, 140];
const TRICK_PLAN = [7, 13, 20, 27, 34, 40] as const;
export const ALL_PAWS = LESSONS.reduce((n, l) => n + (l.steps.length ? l.steps.length + 1 : 0), 0);
/**
 * The paws at which a treasure comes. Tuned with the simulated child who is right three times in four
 * (engine/path.test.ts): after the welcome treasure on her first day, a treasure about every 4 to 6 days of
 * play in her first month, then about every 7 to 10. See docs/decisions.md for the numbers of all four children.
 */
export const TREASURE_AT: readonly number[] = TREASURE_PLAN;
/** A trick comes when this many lessons have been mastered: one for each trick Oreo has a picture of. About every three weeks for that child. */
export const TRICK_AT = TRICK_PLAN;
/** The place a reward is kept under: the welcome treasure, then the treasures and the tricks in the order they came. */
export const WELCOME = 'welcome';
export const treasureSlot = (n: number) => `t${n}`;
export const trickSlot = (n: number) => `k${n}`;
/** How many treasures she has been given for paws (the welcome treasure is not one of them), and how many tricks. */
const treasuresGiven = (d: ProfileData): number => Object.keys(d.rewards.treasures).filter((k) => k !== WELCOME).length;
const tricksGiven = (d: ProfileData): number => Object.keys(d.rewards.tricks).length;

export type Earned =
  /** She picks which of two treasures Oreo gets: both are real, neither is more. */
  | { kind: 'treasure'; slot: string; options: [Treasure, Treasure] }
  | { kind: 'trick'; slot: string; trick: Trick }
  /** A unit finished. */
  | { kind: 'badge'; unit: string }
  | { kind: 'award'; stage: StageKey; award: Award };

const stageKey = (u: Unit): StageKey => (u.stretch ? 'x' : u.stage === 1 ? 's1' : 's2');
/** Learnt here, by playing: not marked as known by the starting check, whether a review has confirmed it or not. */
const hers = (l: LessonState) => !l.placed && !l.known;
/** Mastered by playing. */
const mastered = (d: ProfileData, id: string) => {
  const l = lessonState(d.child, id);
  return !!l.mastered && hers(l);
};
/** The last step passed at least once, by playing. */
const passed = (d: ProfileData, id: string) => {
  const l = lessonState(d.child, id);
  return hers(l) && (!!l.mastered || l.passedOn.length > 0);
};
/** Mastered, by playing or known and confirmed by a review. */
const sure = (d: ProfileData, id: string) => {
  const l = lessonState(d.child, id);
  return !!l.mastered && !l.placed;
};
/**
 * Steps passed by playing, over all lessons: each step of a lesson counts once, the last one included.
 * A lesson passed counts all its steps, also when a perfect round jumped one.
 */
export const stepsPassed = (d: ProfileData): number =>
  LESSONS.reduce((n, l) => {
    const st = lessonState(d.child, l.id);
    // A quick step back, or a known lesson a review reopened, starts part of the way up: the steps below its start were never played.
    return n + (hers(st) ? Math.max(0, (passed(d, l.id) ? l.steps.length : Math.min(st.step, l.steps.length)) - (st.from ?? 0)) : 0);
  }, 0);
/** The paws she has: steps passed and lessons mastered, by playing. */
export const paws = (d: ProfileData): number => stepsPassed(d) + lessonsMastered(d);
export const lessonsPassed = (d: ProfileData): number => LESSONS.filter((l) => passed(d, l.id)).length;
export const lessonsMastered = (d: ProfileData): number => LESSONS.filter((l) => mastered(d, l.id)).length;
/**
 * What the schedule counts: her paws and lessons, plus what a profile from before this schedule was ahead by
 * (see `upToDate`), so that the treasures and tricks she already has are kept and the next one comes at today's pace.
 */
const countedPaws = (d: ProfileData): number => paws(d) + (d.rewards.credit?.paws ?? 0);
const countedLessons = (d: ProfileData): number => lessonsMastered(d) + (d.rewards.credit?.lessons ?? 0);
/** She has finished today's games at least once. */
export const finishedADay = (d: ProfileData): boolean => d.child.doneOn !== undefined;
/**
 * A unit is finished when every one of its lessons is mastered and at least one of them was learnt here.
 * A lesson she knew before stands in nobody's way, and a unit she knew entirely earns nothing.
 */
export const unitDone = (d: ProfileData, u: Unit): boolean => u.lessons.every((l) => playable(l) && sure(d, l.id)) && u.lessons.some((l) => mastered(d, l.id));
/** A stage is finished when every lesson of it is mastered and at least half of them were learnt here. */
export function stageDone(d: ProfileData, k: StageKey): boolean {
  const all = UNITS.filter((u) => stageKey(u) === k).flatMap((u) => u.lessons);
  return all.every((l) => playable(l) && sure(d, l.id)) && all.filter((l) => mastered(d, l.id)).length * 2 >= all.length;
}

/** Still to be won: not finished, and with enough left to learn here that it can be. */
export const unitToWin = (d: ProfileData, u: Unit): boolean => !unitDone(d, u) && u.lessons.some((l) => playable(l) && hers(lessonState(d.child, l.id)));
export function stageToWin(d: ProfileData, k: StageKey): boolean {
  const all = UNITS.filter((u) => stageKey(u) === k).flatMap((u) => u.lessons);
  return !stageDone(d, k) && all.filter((l) => hers(lessonState(d.child, l.id))).length * 2 >= all.length;
}

/** The two treasures offered: the kinds Oreo has fewest of, so her things fill up evenly. */
function offer(d: ProfileData): [Treasure, Treasure] {
  const have = (t: Treasure) => Object.values(d.rewards.treasures).filter((v) => v === t).length;
  const order = [...TREASURES].sort((a, b) => have(a) - have(b) || TREASURES.indexOf(a) - TREASURES.indexOf(b));
  return [order[0]!, order[1]!];
}

/**
 * The next reward she has earned and not been given, whatever the day. When several wait, the rarer comes
 * first: a trick, then a badge, then the award of the stage that badge completed, then a treasure.
 * One at a time, because giving one changes what the next offers.
 */
export function owedNext(d: ProfileData): Earned | null {
  const r = d.rewards;
  if (finishedADay(d) && !r.treasures[WELCOME]) return { kind: 'treasure', slot: WELCOME, options: offer(d) };
  // The next trick is the first one Oreo does not know yet (a profile from an earlier version may know them in another order).
  const newTrick = TRICKS.find((t) => !Object.values(r.tricks).includes(t));
  const k = tricksGiven(d);
  if (newTrick && k < TRICK_AT.length && countedLessons(d) >= TRICK_AT[k]!) return { kind: 'trick', slot: trickSlot(k + 1), trick: newTrick };
  for (const u of UNITS) if (unitDone(d, u) && !r.awards[u.id]) return { kind: 'badge', unit: u.id };
  for (const key of Object.keys(AWARDS) as StageKey[]) {
    if (stageDone(d, key) && !r.awards[key]) return { kind: 'award', stage: key, award: AWARDS[key] };
  }
  const t = treasuresGiven(d);
  if (t < TREASURE_AT.length && countedPaws(d) >= TREASURE_AT[t]!) return { kind: 'treasure', slot: treasureSlot(t + 1), options: offer(d) };
  return null;
}
/** A reward was given today already: whatever else she has earned waits for another day. */
export const hadOneToday = (d: ProfileData, today: Day): boolean => d.rewards.lastOn === today;
/**
 * The reward to hand over now, or null: only when she has finished today's games, and never a second one on
 * the same day. What else she has earned waits, one for each of the next days she finishes today's games.
 */
export const nextEarned = (d: ProfileData, today: Day): Earned | null => (d.child.doneOn === today && !hadOneToday(d, today) ? owedNext(d) : null);

/** Gives a reward on `today`. For a treasure, `pick` is the one she chose; anything else gets the first on offer. */
export function give(d: ProfileData, e: Earned, today: Day, pick?: Treasure): ProfileData {
  const r: ProfileData['rewards'] = { ...d.rewards, lastOn: today };
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
 *   2. Everything else she has, she keeps. Treasures were kept per lesson, later per paw count, and tricks
 *      per unit, later per lesson count: they move, in the order they came, to the places they have now.
 *   3. The pace of today applies from now on. The earlier schedules gave more, so she is ahead of this one:
 *      by how much is written down as credit, and her next treasure or trick comes after as many new paws
 *      or lessons as it takes anyone, not after she has caught up.
 */
export function upToDate(d: ProfileData): ProfileData {
  const placed = (id: string) => !!lessonState(d.child, id).placed;
  const hasPlaced = (u: Unit) => u.lessons.some((l) => placed(l.id));
  const r = d.rewards;
  const now = (k: string, letter: string) => new RegExp(`^${letter}[1-9][0-9]*$`).test(k);
  const lost = (k: string) => UNITS.some((u) => (stageKey(u) === k || u.id === k) && hasPlaced(u)) && !UNITS.some((u) => u.id === k && unitDone(d, u));
  const old = Object.keys(r.treasures).some((k) => k !== WELCOME && !now(k, 't')) || Object.keys(r.tricks).some((k) => !now(k, 'k'));
  // Awards of an earlier version, given for what the starting check marked as known.
  const awardLost = Object.keys(r.awards).some(lost);
  if (!old && !awardLost) return d;
  const awards = Object.fromEntries(Object.entries(r.awards).filter(([k]) => !lost(k)));
  if (!old) return { ...d, rewards: { ...r, awards } };

  const num = (k: string) => Number(k.slice(1));
  const byNumber = (o: Record<string, string>, letter: string) => Object.keys(o).filter((k) => new RegExp(`^${letter}[0-9]+$`).test(k)).sort((x, y) => num(x) - num(y)).map((k) => o[k]!);
  // In the order they came: the ones kept by place, then per paw count ("w3"), then per lesson.
  const kept = [...byNumber(r.treasures, 't'), ...byNumber(r.treasures, 'w'), ...LESSONS.filter((l) => r.treasures[l.id] !== undefined && !placed(l.id)).map((l) => r.treasures[l.id]!)];
  const treasures: Record<string, string> = { ...(r.treasures[WELCOME] ? { [WELCOME]: r.treasures[WELCOME] } : {}) };
  kept.forEach((t, i) => { treasures[treasureSlot(i + 1)] = t; });
  // The tricks she has stay the ones she has, each once.
  const had = [...new Set([...byNumber(r.tricks, 'k'), ...byNumber(r.tricks, 'm'), ...UNITS.filter((u) => r.tricks[u.id] !== undefined && !hasPlaced(u)).map((u) => r.tricks[u.id]!)])].filter((t) => (TRICKS as readonly string[]).includes(t));
  const tricks: Record<string, string> = {};
  had.slice(0, TRICK_AT.length).forEach((t, i) => { tricks[trickSlot(i + 1)] = t; });

  const out: ProfileData = { ...d, rewards: { treasures, tricks, awards, ...(r.lastOn ? { lastOn: r.lastOn } : {}) } };
  const at = (plan: readonly number[], n: number) => (n ? plan[Math.min(n, plan.length) - 1]! : 0);
  const credit = { paws: Math.max(0, at(TREASURE_AT, kept.length) - paws(out)), lessons: Math.max(0, at(TRICK_AT, Object.keys(tricks).length) - lessonsMastered(out)) };
  return credit.paws || credit.lessons ? { ...out, rewards: { ...out.rewards, credit } } : out;
}

/** How many of each kind of treasure Oreo has. */
export const treasuresHad = (d: ProfileData): Record<Treasure, number> =>
  Object.fromEntries(TREASURES.map((t) => [t, Object.values(d.rewards.treasures).filter((v) => v === t).length])) as Record<Treasure, number>;
/** The tricks Oreo knows, in the order they are always shown. */
export const tricksKnown = (d: ProfileData): Trick[] => TRICKS.filter((t) => Object.values(d.rewards.tricks).includes(t));
export const badgesWon = (d: ProfileData): string[] => UNITS.filter((u) => d.rewards.awards[u.id] !== undefined).map((u) => u.id);
export const awardsWon = (d: ProfileData): Award[] =>
  (Object.keys(AWARDS) as StageKey[]).map((k) => d.rewards.awards[k]).filter((a): a is Award => (Object.values(AWARDS) as string[]).includes(a ?? ''));

/** What she is working towards next, of the rewards that come by counting: how many more, and of how many since the last one. */
export interface Goal {
  kind: 'welcome' | 'treasure' | 'trick';
  /** The trick Oreo will learn. */
  trick?: Trick;
  /** Still to go: paws, for a treasure; lessons to master, for a trick; today's games, once, for the welcome treasure. 0: she has earned it, and it is waiting. */
  more: number;
  /** The paws in the row: what lies between the reward before and this one, and how much of it is done. */
  of: number;
  done: number;
  /** Earned and waiting: it comes when she finishes today's games, or, if she had a reward today, on the next day she does. */
  waits?: 'today' | 'next';
}
export function goals(d: ProfileData, today: Day): Goal[] {
  const out: Goal[] = [];
  const waits = hadOneToday(d, today) ? 'next' : 'today';
  if (!d.rewards.treasures[WELCOME] && !finishedADay(d)) out.push({ kind: 'welcome', more: 1, of: 1, done: 0 });
  const row = (kind: 'treasure' | 'trick', plan: readonly number[], given: number, have: number, trick?: Trick) => {
    if (given >= plan.length) return;
    const from = plan[given - 1] ?? 0, at = plan[given]!, more = Math.max(0, at - have);
    out.push({ kind, ...(trick ? { trick } : {}), more, of: at - from, done: Math.max(0, Math.min(at - from, have - from)), ...(more === 0 ? { waits } : {}) });
  };
  row('treasure', TREASURE_AT, treasuresGiven(d), countedPaws(d));
  const newTrick = TRICKS.find((t) => !Object.values(d.rewards.tricks).includes(t));
  if (newTrick) row('trick', TRICK_AT, tricksGiven(d), countedLessons(d), newTrick);
  return out;
}
/**
 * The one shown after every round: the welcome treasure until she has finished a day, then the paws
 * towards the next treasure (they are what a round can fill), and the next trick once every treasure is given.
 */
export const nextGoal = (d: ProfileData, today: Day): Goal | null => goals(d, today)[0] ?? null;
