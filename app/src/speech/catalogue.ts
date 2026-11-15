/**
 * Every clip the voice has, each with an id. The player and the voice pack use ids only;
 * the wording behind an id can change (voice v2) without touching game code.
 */
import { SP, type Piece } from './script';
import { FIXED, FRAGMENTS, PRAISE, PRAISE_AFTER_HELP } from './sentences';

export interface Clip {
  /** For example "try-again", "isTO.47", "frag.plus", "num.47.mid". */
  id: string;
  /** What is said. For a number: the number, and whether the sentence goes on after it or ends. */
  text: string;
  /** The key of this clip in the first voice recording (audio/voice.json). */
  v1: string;
  /** A short breath follows a clip that ends a sentence. */
  endsSentence: boolean;
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function build(): Clip[] {
  const clips: Clip[] = [];
  const seen = new Set<string>();
  const add = (id: string, text: string, v1 = text) => {
    if (seen.has(v1)) return; // the same sentence reached two ways is one clip
    seen.add(v1);
    clips.push({ id, text, v1, endsSentence: /[.!?]$/.test(v1) });
  };
  for (const table of [FIXED, PRAISE, PRAISE_AFTER_HELP]) for (const [id, text] of Object.entries(table)) add(id, text);

  range(0, 100).forEach((n) => add(`isTO.${n}`, SP.isTO(n)));
  range(10, 99).forEach((n) => add(`which.${n}`, SP.which(n)));
  range(1, 99).forEach((n) => add(`puppyHas.${n}`, SP.puppyHas(n)));
  range(1, 9).forEach((k) => {
    add(`has.${k}.tens`, SP.has(k, 't'));
    add(`has.${k}.ones`, SP.has(k, 'o'));
    add(`friendsQ.${k}`, SP.friendsQ(k));
    add(`friends.${k}`, SP.friends(k));
    add(`newTen.${k}`, SP.newTen(k));
    add(`finds.${k}`, SP.finds(k));
    add(`digs.${k}`, SP.digs(k));
    add(`tens.${k}`, SP.tens(k));
  });
  [10, 20, 30, 40].forEach((k) => add(`finds.${k}`, SP.finds(k)));
  [20, 30, 40].forEach((k) => add(`gives.${k}`, SP.gives(k)));
  [2, 3, 4].forEach((k) => {
    add(`tensOnly.${k}`, SP.tensOnly(k));
    add(`levelUp.${k}`, SP.levelUp(k));
  });
  [3, 4].forEach((k) => add(`jumpTo.${k}`, SP.jumpTo(k)));
  range(1, 4).forEach((k) => add(`five.${k}`, SP.five(k)));
  for (const plus of [true, false]) for (const k of [1, 2, 3]) add(`rows.${plus ? 'down' : 'up'}.${k}`, SP.rows(plus, k));

  for (const [id, text] of Object.entries(FRAGMENTS)) add(`frag.${id}`, text);
  // A number sounds different in the middle of a sentence and at its end, so each has two clips.
  range(0, 100).forEach((n) => add(`num.${n}.mid`, `${n},`, `#${n},`));
  range(0, 100).forEach((n) => add(`num.${n}.end`, `${n}.`, `#${n}.`));
  return clips;
}

export const CLIPS: readonly Clip[] = build();
export const CLIP_BY_ID: ReadonlyMap<string, Clip> = new Map(CLIPS.map((c) => [c.id, c]));
const ID_BY_WORDING = new Map(CLIPS.filter((c) => !c.id.startsWith('num.')).map((c) => [c.text, c.id]));

/**
 * Turns what a game wants said into clip ids. A piece is a clip id, a sentence in its present
 * wording, or a number. Throws for anything that has no clip: nothing is ever read out by a
 * computer voice, and a sentence is never spoken without its recording.
 */
export function clipIds(pieces: readonly Piece[]): string[] {
  return pieces.map((p, i) => {
    if (typeof p === 'number') {
      const next = pieces[i + 1];
      const ends = next === undefined || (typeof next === 'string' && /^[A-Z"]/.test(wording(next)));
      const id = `num.${p}.${ends ? 'end' : 'mid'}`;
      if (!CLIP_BY_ID.has(id)) throw new Error(`No recorded clip for the number ${p}`);
      return id;
    }
    const id = CLIP_BY_ID.has(p) ? p : ID_BY_WORDING.get(p);
    if (!id) throw new Error(`No recorded clip for "${p}"`);
    return id;
  });
}

/** The words behind a piece, for showing on screen what is being said. */
export function wording(piece: Piece): string {
  if (typeof piece === 'number') return String(piece);
  return CLIP_BY_ID.get(piece)?.text ?? piece;
}
