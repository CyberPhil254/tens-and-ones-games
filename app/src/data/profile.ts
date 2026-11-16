/**
 * A child's profile and everything saved with it. The minimum on purpose: a nickname a parent
 * types, an animal picture, the stage, and progress. No email, nothing a child types, no account.
 */
import { CONFIG } from '../engine/config';
import { LESSON } from '../engine/curriculum';
import { withoutPlacedRewards } from '../engine/rewards';
import { newChild, type ChildState, type Day, type LessonState } from '../engine/state';

/** The animal pictures a profile can have, from art/friends/. */
export const FRIENDS = ['bunny', 'elephant', 'giraffe', 'hippo', 'kitten', 'lion', 'monkey', 'owl', 'zebra'] as const;
export type Friend = (typeof FRIENDS)[number];

export interface Profile {
  id: string;
  nickname: string;
  picture: Friend;
  stage: 1 | 2;
  created: Day;
}

/** One answered question, kept for the engine and the parents' area. Response time is never shown to the child. */
export interface Attempt {
  /** The lesson (skill id) and the step the question came from. */
  lesson: string;
  step: number;
  /** Where it was asked. */
  part: 'new' | 'stronger' | 'warm' | 'check' | 'free';
  /** Right first time, with no hint and no help picture. */
  clean: boolean;
  /** Wrong taps before the right answer. */
  misses: number;
  /** She asked for the help picture. */
  hint: boolean;
  /** Milliseconds from the question appearing to the right answer. */
  ms: number;
  /** When, as an ISO time with the time of day. */
  at: string;
}

export interface Rewards {
  /** Treasures Oreo has been given, one per mastered lesson, by lesson id. */
  treasures: Record<string, string>;
  /** Tricks Oreo has learnt, one per finished unit, by unit id. */
  tricks: Record<string, string>;
  /** Awards, one per finished stage. */
  awards: Record<string, string>;
}

export interface ProfileData {
  profile: Profile;
  child: ChildState;
  /** Bones won: one for every question right first time. */
  bones: number;
  /** Best Quick Paws time in seconds; 0 when there is none. */
  best: number;
  rewards: Rewards;
  /** The newest answers; the oldest fall away so storage cannot fill up. */
  attempts: Attempt[];
  /** The starting check has been done (or skipped by a parent). */
  checked: boolean;
}

/** Settings for the whole device, changed in the parents' area. */
export interface Settings {
  soundOff: boolean;
  /** Money lessons use this currency. */
  currency: 'KES';
  /** Introduce Oreo as "Star's sister" (Star is the first user's own dog). Off unless a parent turns it on. */
  starsSister: boolean;
  /** The profile that was last playing. */
  current?: string;
}

export const KEEP_ATTEMPTS = 5000;
export const defaultSettings = (): Settings => ({ soundOff: false, currency: 'KES', starsSister: false });

/** A nickname as a parent typed it, made safe to store and show: letters, digits and spaces, at most 16. */
export const cleanNickname = (raw: string): string => raw.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);

export function newProfile(id: string, nickname: string, picture: Friend, stage: 1 | 2, today: Day): ProfileData {
  return {
    profile: { id, nickname: cleanNickname(nickname) || 'Friend', picture, stage, created: today },
    child: newChild(), bones: 0, best: 0, rewards: { treasures: {}, tricks: {}, awards: {} }, attempts: [], checked: false,
  };
}

export const addAttempt = (d: ProfileData, a: Attempt): ProfileData => ({ ...d, attempts: [...d.attempts, a].slice(-KEEP_ATTEMPTS) });

/* ---------- reading saved data: nothing that was stored or pasted in is trusted ---------- */

const isDay = (v: unknown): v is Day => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const count = (v: unknown, max = 1e9): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : 0);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const strings = (v: unknown): Record<string, string> =>
  Object.fromEntries(Object.entries(obj(v)).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1].length < 40));

function readLesson(id: string, raw: unknown): LessonState | null {
  const lesson = LESSON.get(id);
  if (!lesson) return null; // a lesson this version does not know is dropped
  const r = obj(raw);
  const out: LessonState = {
    step: Math.min(count(r.step), Math.max(0, lesson.steps.length - 1)),
    passedOn: Array.isArray(r.passedOn) ? r.passedOn.filter(isDay).slice(-CONFIG.masteryDays) : [],
    reviews: count(r.reviews, 50),
    reviewMisses: count(r.reviewMisses, 50),
    rating: typeof r.rating === 'number' && Number.isFinite(r.rating) ? Math.max(-20, Math.min(20, r.rating)) : CONFIG.rating.start,
    answers: count(r.answers),
    recent: Array.isArray(r.recent) ? r.recent.filter((b) => typeof b === 'boolean').slice(-CONFIG.round) : [],
    slow: r.slow === true,
  };
  if (isDay(r.mastered)) out.mastered = r.mastered;
  if (r.placed === true) out.placed = true;
  if (isDay(r.due)) out.due = r.due;
  if (isDay(r.reviewedOn)) out.reviewedOn = r.reviewedOn;
  return out;
}

function readAttempt(raw: unknown): Attempt | null {
  const r = obj(raw);
  if (typeof r.lesson !== 'string' || !LESSON.has(r.lesson) || typeof r.at !== 'string' || Number.isNaN(Date.parse(r.at))) return null;
  const part = ['new', 'stronger', 'warm', 'check', 'free'].includes(r.part as string) ? (r.part as Attempt['part']) : 'free';
  return { lesson: r.lesson, step: count(r.step, 10), part, clean: r.clean === true, misses: count(r.misses, 99), hint: r.hint === true, ms: count(r.ms, 3_600_000), at: r.at };
}

/** Builds a profile from stored or pasted data, keeping only what is well formed. Null when it is not a profile at all. */
export function readProfileData(raw: unknown, today: Day): ProfileData | null {
  const r = obj(raw), p = obj(r.profile);
  if (typeof p.id !== 'string' || !/^[a-z0-9-]{4,40}$/.test(p.id) || typeof p.nickname !== 'string') return null;
  const child = obj(r.child), rewards = obj(r.rewards);
  const lessons: Record<string, LessonState> = {};
  for (const [id, v] of Object.entries(obj(child.lessons))) {
    const l = readLesson(id, v);
    if (l) lessons[id] = l;
  }
  for (const l of Object.values(lessons)) {
    // A known lesson that a review had already confirmed before the mark was ever removed: it is hers.
    if (l.placed && (!l.mastered || l.reviews > 0)) delete l.placed;
  }
  return withoutPlacedRewards({
    profile: {
      id: p.id,
      nickname: cleanNickname(p.nickname) || 'Friend',
      picture: (FRIENDS as readonly string[]).includes(p.picture as string) ? (p.picture as Friend) : 'kitten',
      stage: p.stage === 1 ? 1 : 2,
      created: isDay(p.created) ? p.created : today,
    },
    child: { lessons, ...(isDay(child.doneOn) ? { doneOn: child.doneOn } : {}) },
    bones: count(r.bones),
    best: count(r.best, 100_000),
    rewards: { treasures: strings(rewards.treasures), tricks: strings(rewards.tricks), awards: strings(rewards.awards) },
    attempts: Array.isArray(r.attempts) ? r.attempts.map(readAttempt).filter((a): a is Attempt => a !== null).slice(-KEEP_ATTEMPTS) : [],
    checked: r.checked === true,
  });
}

/** True when two profiles hold the same data, however each was put together. Null is only the same as null. */
export function sameData(a: ProfileData | null, b: ProfileData | null, today: Day): boolean {
  const plain = (d: ProfileData | null) => (d ? JSON.stringify(readProfileData(JSON.parse(JSON.stringify(d)), today)) : 'null');
  return plain(a) === plain(b);
}

export function readSettings(raw: unknown): Settings {
  const r = obj(raw);
  return {
    soundOff: r.soundOff === true,
    currency: 'KES',
    starsSister: r.starsSister === true,
    ...(typeof r.current === 'string' ? { current: r.current } : {}),
  };
}

/* ---------- moving a profile to another device ---------- */

const PREFIX = 'TENS1.';

/** A profile as a code a parent can copy, or save as a file. The answer log is left out to keep it short. */
export function exportCode(d: ProfileData): string {
  const json = JSON.stringify({ ...d, attempts: [] });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Reads a code made by exportCode. Null when it is not one, whatever was pasted. */
export function importCode(code: string, today: Day): ProfileData | null {
  const text = code.trim();
  if (!text.startsWith(PREFIX)) return null;
  try {
    const bin = atob(text.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/'));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    return readProfileData(JSON.parse(json), today);
  } catch {
    return null;
  }
}
