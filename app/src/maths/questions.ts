/**
 * The question makers of the eleven games, ported from the live game (index.html, GEN).
 * Pure: the same random source gives the same questions. They draw their random numbers in the
 * same order as the live game, so questions.test.ts can compare the two draw by draw.
 * Do not reorder the draws without reading that test.
 */
import { SP, type Piece } from '../speech/script';
import { BONDS_LEVELS, makeBonds, type BondsQ } from './bonds';
import { DOTS_LEVELS, makeDots, type DotsQ } from './dots';
import { GROUPS_LEVELS, makeGroups, type GroupsQ } from './groups';
import { HEAR_LEVELS, makeHear, type HearQ } from './hear';
import { makeMore, MORE_LEVELS, type MoreQ } from './more';
import { makePlus, PLUS_LEVELS, type PlusQ } from './plus';
import { dice, type Dice, type Rng } from './random';
import { makeShare, SHARE_LEVELS, type ShareQ } from './share';
import { makeSkip, SKIP_LEVELS, type SkipQ } from './skip';
import { makeRegroup, makeTeens, REGROUP_LEVELS, TEENS_LEVELS, type RegroupQ, type TeensQ } from './teens';
import { makeSums, SUMS_LEVELS, type SumsQ } from './sums';

export const PATH = ['five', 'pack', 'look', 'names', 'walk', 'friends', 'jump', 'fill', 'take', 'mystery', 'story'] as const;
/** The games ported from the live game. Their questions are checked draw by draw against it. */
export type PortedId = (typeof PATH)[number];
/** Games made for the app, which the live game never had. */
export const NEW_GAMES = ['sums', 'plus', 'bonds', 'teens', 'regroup', 'hear', 'dots', 'more', 'skip', 'groups', 'share'] as const;
export type GameId = PortedId | (typeof NEW_GAMES)[number];
export const ALL_GAMES: readonly GameId[] = [...PATH, ...NEW_GAMES];

/** How many levels each ported game has, as in the live game. */
export const LEVELS: Record<PortedId, number> = {
  five: 3, pack: 3, look: 3, names: 3, walk: 3, friends: 3, jump: 4, fill: 4, take: 4, mystery: 3, story: 3,
};

/** The answer buttons 1 to 9, used where four choices would give the answer away. */
export const PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export interface FiveQ { n: number; opts: number[] }
export interface BlocksQ { n: number; t: number; o: number; opts: number[] }
export interface NamesQ { n: number; opts: number[]; k?: number; place?: 't' | 'o' }
export interface WalkQ { n: number; t: number; o: number; opts?: number[] }
export type FriendsQ = { n: number; ans: number } | { a: number; t: number; o: number; ans: number; next: number };
export interface JumpQ { s: number; o: number; dir: 1 | -1; k: number; targets: number[]; opts: number[] }
export interface FillQ {
  a: number; b: number; t: number; o: number;
  /** How many of b fill the ten, and how many are left over. */
  fill: number; rest: number;
  next: number; sum: number; opts: number[];
}
export interface TakeQ { a: number; b: number; r: number; opts: number[] }
export type EqToken = number | '?' | '+' | '−' | '=';
export interface MysteryQ {
  /** null when the whole is the missing number. */
  whole: number | null;
  /** null marks the missing part. */
  parts: (number | null)[];
  ans: number;
  /** Answer on the 1 to 9 pad instead of four choices. */
  pad?: true;
  eq: EqToken[];
  opts?: number[];
  hint?: string;
}
export interface StoryQ {
  text: string; say: Piece[]; a: number; eq: string; sayEq: Piece[]; ans: number; hint: string; opts: number[];
}

/** How many levels every game has, the new ones included. */
export const LEVELS_OF: Record<GameId, number> = { ...LEVELS, sums: SUMS_LEVELS, plus: PLUS_LEVELS, bonds: BONDS_LEVELS, teens: TEENS_LEVELS, regroup: REGROUP_LEVELS, hear: HEAR_LEVELS, dots: DOTS_LEVELS, more: MORE_LEVELS, skip: SKIP_LEVELS, groups: GROUPS_LEVELS, share: SHARE_LEVELS };

export interface QuestionOf {
  sums: SumsQ; plus: PlusQ; bonds: BondsQ; teens: TeensQ; regroup: RegroupQ; hear: HearQ; dots: DotsQ; more: MoreQ; skip: SkipQ; groups: GroupsQ; share: ShareQ;
  five: FiveQ; pack: BlocksQ; look: BlocksQ; names: NamesQ; walk: WalkQ; friends: FriendsQ;
  jump: JumpQ; fill: FillQ; take: TakeQ; mystery: MysteryQ; story: StoryQ;
}

/** Four choices in rising order: the answer and three wrong ones, taken from the candidates first. */
export function options(d: Dice, ans: number, cands: number[]): number[] {
  const out: number[] = [];
  for (const c of d.shuffle(cands.slice())) {
    if (c !== ans && c > 0 && c <= 100 && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  let k = 2;
  while (out.length < 3) {
    for (const c of [ans + k, ans - k]) if (out.length < 3 && c > 0 && c <= 100 && !out.includes(c)) out.push(c);
    k++;
  }
  return [...out, ans].sort((a, b) => a - b);
}

type Makers = { [G in GameId]: (level: number, d: Dice, variant?: number) => QuestionOf[G] };

const MAKE: Makers = {
  sums: (l, d) => makeSums(l, d),
  plus: (l, d) => makePlus(l, d),
  bonds: (l, d) => makeBonds(l, d),
  teens: (l, d) => makeTeens(l, d),
  regroup: (l, d) => makeRegroup(l, d),
  hear: (l, d) => makeHear(l, d),
  dots: (l, d) => makeDots(l, d),
  more: (l, d) => makeMore(l, d),
  skip: (l, d) => makeSkip(l, d),
  groups: (l, d) => makeGroups(l, d),
  share: (l, d) => makeShare(l, d),
  names(l, d) {
    if (l === 2) {
      // "Which number has 6 tens?"
      const k = d.rnd(1, 9);
      const place = d.chance(0.65) ? 't' : 'o';
      const nz = () => { let x; do x = d.rnd(1, 9); while (x === k); return x; };
      const any = () => { let x; do x = d.rnd(0, 9); while (x === k); return x; };
      for (;;) {
        const ans = place === 't' ? k * 10 + any() : nz() * 10 + k;
        const trap = place === 't' ? nz() * 10 + k : k * 10 + any();
        const third = nz() * 10 + any();
        const fourth = nz() * 10 + any();
        const set = new Set([ans, trap, third, fourth]);
        if (set.size === 4) return { k, place, n: ans, opts: [...set].sort((a, b) => a - b) };
      }
    }
    const r = d.rnd01(), n = r < 0.35 ? d.rnd(13, 19) : r < 0.6 ? d.rnd(3, 9) * 10 : d.rnd(21, 99);
    const t = Math.floor(n / 10), o = n % 10, c = [n + 10, n - 10, n + 1, n - 1];
    if (n >= 13 && n <= 19) c.push((n - 10) * 10, (n - 10) * 10, (n - 10) * 10); // sixteen / sixty
    if (o === 0 && t >= 3) c.push(t + 10, t + 10, t + 10);
    if (o && o !== t) c.push(o * 10 + t, o * 10 + t); // 17 / 71
    return { n, opts: options(d, n, c) };
  },
  walk(l, d) {
    if (l === 3) { const n = d.rnd(6, 94); return { n, t: Math.floor(n / 10), o: n % 10 }; }
    const t = d.rnd(1, 9), o = d.rnd(1, 9), n = t * 10 + o, c = [n + 10, n - 10, n + 1, n - 1];
    if (o !== t) c.push(o * 10 + t);
    return { n, t, o, opts: options(d, n, c) };
  },
  story(l, d, variant) {
    const mk = (text: string, say: Piece[], a: number, eq: string, sayEq: Piece[], ans: number, hint: string, cands?: number[]): StoryQ =>
      ({ text, say, a, eq, sayEq, ans, hint, opts: options(d, ans, cands ?? [ans + 10, ans - 10, ans + 1, ans - 1]) });
    const NOW = 'How many bones does she have now?', LEFT = 'How many bones are left?', NEED = 'How many more does she need?';
    // Each level has three kinds of story. A lesson can ask for one kind; otherwise one is drawn.
    const v = variant ?? d.rnd(0, 2);
    if (l === 1) {
      if (v === 0) { const a = d.rnd(11, 89); return mk(`${SP.puppyHas(a)} ${SP.finds(10)} ${NOW}`, [SP.puppyHas(a), SP.finds(10), NOW], a, `${a} + 10`, [a, 'plus', 10, 'is', a + 10], a + 10, 'Ten more is one more ten. The ones stay the same.'); }
      if (v === 1) { const a = d.rnd(21, 99); return mk(`${SP.puppyHas(a)} She eats 10 of them. ${LEFT}`, [SP.puppyHas(a), 'She eats 10 of them.', LEFT], a, `${a} − 10`, [a, 'take away', 10, 'is', a - 10], a - 10, 'Ten fewer is one ten gone. The ones stay the same.'); }
      const p = d.rnd(1, 9); return mk(`Oreo wants 10 bones. She has ${p}. ${NEED}`, ['Oreo wants 10 bones.', 'She has', p, NEED], p, `${p} + ? = 10`, [p, 'plus', 10 - p, 'is', 10], 10 - p, 'Think of the friends of ten.', [11 - p, 9 - p, p, 10]);
    }
    if (l === 2) {
      if (v === 0) { const k = d.rnd(2, 4), a = d.rnd(11, 99 - k * 10); return mk(`${SP.puppyHas(a)} ${SP.finds(k * 10)} ${NOW}`, [SP.puppyHas(a), SP.finds(k * 10), NOW], a, `${a} + ${k * 10}`, [a, 'plus', k * 10, 'is', a + k * 10], a + k * 10, SP.tensOnly(k)); }
      if (v === 1) { const k = d.rnd(2, 4), a = d.rnd(k * 10 + 11, 99); return mk(`${SP.puppyHas(a)} ${SP.gives(k * 10)} ${LEFT}`, [SP.puppyHas(a), SP.gives(k * 10), LEFT], a, `${a} − ${k * 10}`, [a, 'take away', k * 10, 'is', a - k * 10], a - k * 10, SP.tensOnly(k)); }
      const t = d.rnd(1, 8), o = d.rnd(1, 9), a = t * 10 + o, b = 10 - o;
      return mk(`${SP.puppyHas(a)} ${SP.digs(b)} ${NOW}`, [SP.puppyHas(a), SP.digs(b), NOW], a, `${a} + ${b}`, [a, 'plus', b, 'is', a + b], a + b, SP.newTen(o));
    }
    if (v === 0) { const t = d.rnd(1, 8), o = d.rnd(5, 9), b = d.rnd(11 - o, 9), a = t * 10 + o; return mk(`${SP.puppyHas(a)} ${SP.finds(b)} ${NOW}`, [SP.puppyHas(a), SP.finds(b), NOW], a, `${a} + ${b}`, [a, 'plus', b, 'is', a + b], a + b, 'Fill the ten first. Then add the rest.'); }
    if (v === 1) { const k = d.rnd(1, 4), p = d.rnd(11, 99 - k * 10), T = p + k * 10; return mk(`Oreo wants ${T} bones. She has ${p}. ${NEED}`, ['Oreo wants', T, 'bones.', 'She has', p, NEED], p, `${p} + ? = ${T}`, [p, 'plus', k * 10, 'is', T], k * 10, 'The ones are the same. How many tens are missing?', [k * 10 + 10, k * 10 - 10, k, k * 10 + 1, k * 10 + 20]); }
    const t = d.rnd(2, 9), o = d.rnd(2, 9), a = t * 10 + o, b = 10 * d.rnd(1, t - 1) + d.rnd(1, o);
    return mk(`${SP.puppyHas(a)} She hides ${b} of them. How many bones can she still see?`, [SP.puppyHas(a), 'She hides', b, 'of them.', 'How many bones can she still see?'], a, `${a} − ${b}`, [a, 'take away', b, 'is', a - b], a - b, 'Take the tens away first, then the ones.');
  },
  five(l, d) {
    const n = l === 1 ? d.rnd(1, 10) : d.rnd(3, 10);
    const near = [n - 1, n + 1, n - 2, n + 2, n - 3, n + 3].filter((v) => v >= 1 && v <= 10).slice(0, 3);
    return { n, opts: [...near, n].sort((a, b) => a - b) };
  },
  pack(l, d) {
    const t = l === 1 ? d.rnd(1, 3) : l === 2 ? d.rnd(3, 6) : d.rnd(1, 9), o = d.rnd(1, 9), n = t * 10 + o;
    const c = [n + 10, n - 10, n + 1, n - 1];
    if (o !== t) c.push(o * 10 + t, o * 10 + t);
    return { n, t, o, opts: options(d, n, c) };
  },
  look(l, d) {
    const n = d.rnd(11, l === 1 ? 59 : 99), t = Math.floor(n / 10), o = n % 10;
    const c = [n + 10, n - 10, n + 1, n - 1];
    if (o && o !== t) c.push(o * 10 + t, o * 10 + t, o * 10 + t);
    return { n, t, o, opts: options(d, n, c) };
  },
  friends(l, d) {
    if (l < 3) { const n = d.rnd(1, 9); return { n, ans: 10 - n }; }
    const t = d.rnd(1, 8), o = d.rnd(1, 9);
    return { a: t * 10 + o, t, o, ans: 10 - o, next: (t + 1) * 10 };
  },
  jump(l, d) {
    const o = d.rnd(1, 9), dir = d.chance(0.5) ? 1 : -1;
    const k = l === 1 ? 1 : l === 2 ? d.rnd(2, 3) : l === 4 ? d.rnd(1, 4) : 3;
    const t = dir > 0 ? d.rnd(0, 9 - k) : d.rnd(k, 9);
    const s = t * 10 + o;
    const targets = l === 3 ? [1, 2, 3].map((i) => s + dir * 10 * i) : [s + dir * 10 * k];
    const e = targets[0]!;
    return { s, o, dir, k, targets, opts: options(d, e, [e + 10, e - 10, e + 1, e - 1, s + dir * k, s]) };
  },
  fill(l, d): FillQ {
    if (l === 4) return MAKE.fill(d.chance(0.4) ? 1 : 3, d); // in your head: a mix
    if (l === 1) {
      const t = d.rnd(1, 8), o = d.rnd(1, 9), a = t * 10 + o, b = 10 - o, sum = a + b;
      return { a, b, t, o, fill: b, rest: 0, next: sum, sum, opts: options(d, sum, [sum - 10, sum + 10, sum - 1, sum + 1]) };
    }
    const t = d.rnd(1, 8), o = d.rnd(5, 9), fill = 10 - o, b = d.rnd(fill + 1, 9), a = t * 10 + o, sum = a + b;
    return { a, b, t, o, fill, rest: b - fill, next: (t + 1) * 10, sum, opts: options(d, sum, [sum - 10, sum + 10, sum - 1, sum + 1, sum - 2]) };
  },
  take(l, d): TakeQ {
    if (l === 4) return MAKE.take(d.chance(0.5) ? 2 : 3, d);
    let a, b;
    if (l === 1) { const t = d.rnd(2, 9), o = d.rnd(0, 9); a = t * 10 + o; b = 10 * d.rnd(1, t - 1); }
    else if (l === 2) { const t = d.rnd(2, 9), o = d.rnd(2, 9); a = t * 10 + o; b = 10 * d.rnd(1, t - 1) + d.rnd(1, o); }
    else { const t = d.rnd(3, 9), o = d.rnd(0, 8); a = t * 10 + o; b = 10 * d.rnd(1, t - 2) + d.rnd(o + 1, 9); }
    const r = a - b;
    return { a, b, r, opts: options(d, r, [r + 10, r - 10, r + 1, r - 1, r + 10]) };
  },
  mystery(l, d) {
    if (l === 1) {
      const T = d.chance(0.7) ? 10 : 20, p = T === 10 ? d.rnd(1, 9) : d.rnd(11, 19), first = d.chance(0.5);
      return { whole: T, parts: first ? [null, p] : [p, null], ans: T - p, pad: true, eq: first ? ['?', '+', p, '=', T] : [p, '+', '?', '=', T] };
    }
    if (l === 2) {
      let x, y, ans, T;
      do { x = d.rnd(1, 7); y = d.rnd(1, 7); ans = d.rnd(1, 9); T = x + y + ans; } while (T < 10 || T > 20);
      return { whole: T, parts: [x, null, y], ans, pad: true, eq: [x, '+', '?', '+', y, '=', T] };
    }
    const b = 10 * d.rnd(1, 4), v = d.rnd(0, 2);
    let c; do { c = d.rnd(11, 59); } while (c % 10 === 0);
    if (v === 0) {
      const ans = b + c;
      return { whole: null, parts: [c, b], ans, eq: ['?', '−', b, '=', c],
        opts: options(d, ans, [ans - 10, ans + 10, ans - 1, ans + 1]),
        hint: 'The mystery number is the whole. Put the two parts together.' };
    }
    if (v === 1) {
      const ans = c, w = c + b;
      return { whole: w, parts: [null, b], ans, eq: ['?', '+', b, '=', w],
        opts: options(d, ans, [ans - 10, ans + 10, ans + 1, ans - 1]),
        hint: 'Take the part away from the whole. Only the tens change.' };
    }
    const a = c + b;
    return { whole: a, parts: [c, null], ans: b, eq: [a, '−', '?', '=', c],
      opts: options(d, b, [b + 10, b - 10, b + 20, b + 1]),
      hint: 'The ones are the same. How many tens are gone?' };
  },
};

/** How many kinds of question a level has that a lesson can ask for one by one. Only the stories have kinds. */
export const variantsOf = (game: GameId): number => (game === 'story' ? 3 : 1);

/** One question for a game at a level. */
export function makeQuestion<G extends GameId>(game: G, level: number, rng: Rng, variant?: number): QuestionOf[G] {
  if (!Number.isInteger(level) || level < 1 || level > LEVELS_OF[game]) {
    throw new RangeError(`${game} has levels 1 to ${LEVELS_OF[game]}, got ${level}`);
  }
  return MAKE[game](level, dice(rng), variant);
}
