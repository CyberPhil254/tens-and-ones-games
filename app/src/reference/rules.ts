/**
 * What must be true of every question the live game can ask, and what it says aloud.
 * Written from the play code in ../index.html (the PLAY table), by hand.
 */
import type { LiveGame, Piece, Q } from './liveGame';

const n = (q: Q, k: string): number => {
  const v = q[k];
  if (typeof v !== 'number') throw new Error(`expected a number at "${k}" in ${JSON.stringify(q)}`);
  return v;
};

export interface Asked {
  /** The answer the game accepts. */
  answer: number;
  /** The buttons the child chooses from; undefined when she answers by building or tapping a board. */
  choices?: number[];
  /** True when `choices` is the fixed 1 to 9 pad rather than four options. */
  pad?: boolean;
}

/** Each thing the child is asked within one question (Fill the Ten level 2 asks twice). */
export function asked(game: LiveGame, id: string, level: number, q: Q): Asked[] {
  const four = (answer: number): Asked => ({ answer, choices: q.opts });
  const pad = (answer: number): Asked => ({ answer, choices: game.PAD, pad: true });
  switch (id) {
    case 'five':
    case 'look':
    case 'names':
      return [four(n(q, 'n'))];
    case 'pack':
      return level === 3 ? [{ answer: n(q, 'n') }] : [four(n(q, 'n'))];
    case 'walk':
      return level === 1 ? [four(n(q, 'n'))] : [{ answer: n(q, 'n') }];
    case 'friends':
      return [pad(n(q, 'ans'))];
    case 'jump':
      return level === 3
        ? (q.targets as number[]).map((answer) => ({ answer }))
        : level === 4
          ? [four((q.targets as number[])[0]!)]
          : [{ answer: (q.targets as number[])[0]! }];
    case 'fill':
      return level === 2 ? [pad(n(q, 'fill')), four(n(q, 'sum'))] : [four(n(q, 'sum'))];
    case 'take':
      return [four(n(q, 'r'))];
    case 'mystery':
      return [q.pad ? pad(n(q, 'ans')) : four(n(q, 'ans'))];
    case 'story':
      return [four(n(q, 'ans'))];
    default:
      throw new Error(`unknown game ${id}`);
  }
}

/** Is the accepted answer really the right one? Returns a complaint, or nothing. */
export function mathsFault(id: string, level: number, q: Q): string | undefined {
  const within = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi;
  const bad = (why: string) => `${why}: ${JSON.stringify(q)}`;
  switch (id) {
    case 'five':
      return within(n(q, 'n'), 1, 10) ? undefined : bad('outside 1 to 10');
    case 'pack':
    case 'look':
    case 'walk': {
      const v = n(q, 'n');
      if (!within(v, 1, 99)) return bad('outside 1 to 99');
      return n(q, 't') * 10 + n(q, 'o') === v ? undefined : bad('tens and ones do not make the number');
    }
    case 'names': {
      const v = n(q, 'n');
      if (!within(v, 10, 99)) return bad('outside 10 to 99');
      if (level !== 2) return undefined;
      // "Which number has k tens (or ones)?": exactly one choice may fit.
      const k = n(q, 'k');
      const fits = (c: number) => (q.place === 't' ? Math.floor(c / 10) : c % 10) === k;
      return (q.opts ?? []).filter(fits).length === 1 && fits(v) ? undefined : bad('not exactly one choice fits');
    }
    case 'friends':
      if (level < 3) return n(q, 'n') + n(q, 'ans') === 10 ? undefined : bad('not friends of ten');
      return n(q, 'a') + n(q, 'ans') === n(q, 'next') && n(q, 'next') % 10 === 0 && n(q, 'next') - n(q, 'a') < 10
        ? undefined
        : bad('does not reach the next ten');
    case 'jump': {
      const s = n(q, 's');
      const t = q.targets as number[];
      const step = level === 3 ? 1 : n(q, 'k');
      const ok = t.every((v, i) => v === s + n(q, 'dir') * 10 * step * (i + 1) && within(v, 1, 100));
      return ok && within(s, 1, 99) ? undefined : bad('jump lands in the wrong place');
    }
    case 'fill': {
      const a = n(q, 'a');
      const b = n(q, 'b');
      if (a + b !== n(q, 'sum') || !within(n(q, 'sum'), 1, 100)) return bad('sum is wrong');
      if (n(q, 'fill') + n(q, 'rest') !== b) return bad('fill and rest do not make the second number');
      return a + n(q, 'fill') === n(q, 'next') && n(q, 'next') % 10 === 0 ? undefined : bad('fill does not reach the ten');
    }
    case 'take':
      return n(q, 'a') - n(q, 'b') === n(q, 'r') && n(q, 'r') >= 0 && within(n(q, 'a'), 1, 99)
        ? undefined
        : bad('difference is wrong');
    case 'mystery': {
      const parts = q.parts as (number | null)[];
      const ans = n(q, 'ans');
      const sum = parts.reduce<number>((s, p) => s + (p ?? (q.whole == null ? 0 : ans)), 0);
      const whole = q.whole == null ? ans : n(q, 'whole');
      return sum === whole && within(whole, 1, 100) ? undefined : bad('parts do not make the whole');
    }
    case 'story': {
      // The spoken equation is "a plus b is c" or "a take away b is c"; the answer is the unknown in it.
      const [a, op, b, is, c] = q.sayEq as [number, string, number, string, number];
      const right = op === 'plus' ? a + b === c : op === 'take away' ? a - b === c : false;
      if (!right || is !== 'is') return bad('spoken equation is wrong');
      const ans = n(q, 'ans');
      const eq = String(q.eq);
      if (eq.includes('?')) return b === ans ? undefined : bad('answer is not the missing number');
      return c === ans && within(c, 0, 100) ? undefined : bad('answer is not the result');
    }
    default:
      return bad('unknown game');
  }
}

/* ---------- what the voice says ---------- */

/** The spoken pieces that contain free numbers, per question, as the play code builds them. */
export function spoken(game: LiveGame, id: string, level: number, q: Q): Piece[][] {
  const SP = game.SP as unknown as Record<string, (...a: unknown[]) => string>;
  const N = (k: string) => n(q, k);
  switch (id) {
    case 'walk':
      return level === 2 ? [['Walk the puppy to', N('n')]] : level === 3 ? [['Show me on the line:', N('n')]] : [];
    case 'pack':
      return level === 3 ? [['Build the number', N('n')]] : [];
    case 'friends':
      return level < 3
        ? []
        : [
            [N('a'), 'and how many more make', N('next')],
            [N('a'), 'plus', N('ans'), 'is', N('next'), 'The same friends of ten.'],
          ];
    case 'jump': {
      const plus = N('dir') > 0;
      const op = plus ? 'plus' : 'take away';
      if (level === 3) return [[plus ? 'Count on in tens from' : 'Count back in tens from', N('s')]];
      const jump = N('k') * 10;
      return [
        [N('s'), op, jump],
        [N('s'), op, jump, 'is', (q.targets as number[])[0]!, 'Only the tens change.'],
      ];
    }
    case 'fill': {
      const out: Piece[][] = [[N('a'), 'plus', N('b')]];
      if (level === 2) out.push([N('next'), 'plus', N('rest')]);
      const lead =
        level === 1
          ? 'The ones filled up a ten.'
          : N('rest')
            ? 'First fill the ten, then add the rest.'
            : SP.newTen!(N('o'));
      out.push([lead, N('a'), 'plus', N('b'), 'is', N('sum')]);
      return out;
    }
    case 'take':
      return [
        [N('a'), 'take away', N('b')],
        [N('a'), 'take away', N('b'), 'is', N('r')],
      ];
    case 'mystery':
      return [['You found it! The mystery number is', N('ans')]];
    case 'story':
      return [q.say as Piece[], q.sayEq as Piece[]];
    default:
      return [];
  }
}

/**
 * Spoken pieces that depend on what the child does rather than on the question:
 * a wrong build in Pack Ten, a wrong walk in Puppy Walk, and the whole of Race to 100.
 */
export function spokenFromPlay(): Record<string, Piece[][]> {
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  return {
    pack: range(0, 99).map((v) => ['You built', v, 'That is not enough yet.']),
    walk: range(0, 100).map((v) => ['The puppy is on', v, 'That is not far enough yet.']),
    race: range(0, 99).flatMap((pos) => [
      ...[1, 2, 3, 10].map((move) => [pos, 'plus', move, 'Where do you land?'] as Piece[]),
      ...[1, 2, 3].map((move) => ['Start at', pos, 'and count on', move] as Piece[]),
    ]),
  };
}

/**
 * Cuts a list of spoken pieces into sentences and keeps those that are stitched today:
 * a sentence that needs more than one clip. Whole recorded sentences and a number said
 * on its own are single clips already and are left out.
 */
export function stitchedSentences(pieces: Piece[], whole: Set<string>): string[] {
  const out: string[] = [];
  let run: Piece[] = [];
  const close = () => {
    if (run.length > 1) out.push(run.join(' '));
    run = [];
  };
  for (const p of pieces) {
    if (typeof p === 'string' && whole.has(p)) {
      close();
      continue;
    }
    run.push(p);
    if (typeof p === 'string' && /[.!?]$/.test(p)) close();
  }
  close();
  return out;
}
