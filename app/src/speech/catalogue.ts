/**
 * Every clip the voice has, each with an id. The player and the voice pack use ids only;
 * the wording behind an id can change (voice v2) without touching game code.
 */
import { guessHeaps } from '../maths/count';
import { SP, type Piece } from './script';
import { FIXED, FRAGMENTS, PRAISE, PRAISE_AFTER_HELP } from './sentences';

export interface Clip {
  /** For example "try-again", "isTO.47", "frag.plus", "num.47.mid". */
  id: string;
  /** What is said. For a number: the number, and whether the sentence goes on after it or ends. */
  text: string;
  /**
   * The name the recording is filed under: the wording itself, or "#47," and "#47." for a number.
   * The first recording (audio/voice.json at the repository root) and the newer clips in
   * app/voice/clips/ both use it, so a clip whose wording has not changed keeps its old recording.
   */
  key: string;
  /** A joining piece ("plus", "Oreo is on"), recorded with a comma after it so it does not sound final. */
  fragment: boolean;
  /** The file of clips it is loaded with. The app fetches a pack the first time it needs it. */
  pack: string;
  /** A short breath follows a clip that ends a sentence. */
  endsSentence: boolean;
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function build(): Clip[] {
  const clips: Clip[] = [];
  const seen = new Set<string>();
  const pack = '';
  const add = (id: string, text: string, key = text) => {
    if (seen.has(key)) return; // the same sentence reached two ways is one clip
    seen.add(key);
    clips.push({ id, text, key, fragment: id.startsWith('frag.'), pack, endsSentence: /[.!?]$/.test(key) });
  };
  for (const table of [FIXED, PRAISE, PRAISE_AFTER_HELP]) for (const [id, text] of Object.entries(table)) add(id, text);

  range(0, 100).forEach((n) => add(`isTO.${n}`, SP.isTO(n)));
  range(10, 99).forEach((n) => add(`which.${n}`, SP.which(n)));
  range(0, 9).forEach((n) => add(`which.${n}`, SP.which(n))); // added for the names to 20
  range(1, 99).forEach((n) => add(`puppyHas.${n}`, SP.puppyHas(n)));
  range(1, 9).forEach((k) => {
    add(`has.${k}.tens`, SP.has(k, 't'));
    add(`has.${k}.ones`, SP.has(k, 'o'));
    add(`friendsQ.${k}`, SP.friendsQ(k));
    add(`friends.${k}`, SP.friends(k));
    add(`newTen.${k}`, SP.newTen(k));
    add(`tens.${k}`, SP.tens(k));
  });
  range(1, 9).forEach((k) => {
    add(`finds.${k}`, SP.finds(k));
    add(`digs.${k}`, SP.digs(k));
    add(`eats.${k}`, SP.eats(k));
  });
  [10, 20, 30, 40].forEach((k) => add(`finds.${k}`, SP.finds(k)));
  [20, 30, 40].forEach((k) => add(`gives.${k}`, SP.gives(k)));
  [2, 3, 4].forEach((k) => {
    add(`tensOnly.${k}`, SP.tensOnly(k));
  });
  range(1, 4).forEach((k) => add(`five.${k}`, SP.five(k)));
  for (const plus of [true, false]) for (const k of [1, 2, 3]) add(`rows.${plus ? 'down' : 'up'}.${k}`, SP.rows(plus, k));

  [1, 2, 3, 4, 5, 10].forEach((k) => add(`hops.${k}`, SP.hops(k)));
  [1, 5, 10, 20, 50, 100].forEach((v) => { add(`tapMoney.${v}`, SP.tapMoney(v)); add(`shillings.${v}`, SP.shillings(v)); });
  range(1, 10).forEach((k) => add(`tapNth.${k}`, SP.tapNth(k)));
  range(1, 20).forEach((k) => add(`nthPlace.${k}`, SP.nthPlace(k)));
  for (const level of [6, 7] as const) for (const h of guessHeaps(level)) add(`nearest.${h.n}`, SP.nearest(h.n, h.ans));
  for (const [id, text] of Object.entries(FRAGMENTS)) add(`frag.${id}`, text);
  // A number sounds different in the middle of a sentence and at its end, so each has two clips.
  range(0, 100).forEach((n) => add(`num.${n}.mid`, `${n},`, `#${n},`));
  range(0, 100).forEach((n) => add(`num.${n}.end`, `${n}.`, `#${n}.`));
  for (const c of clips) c.pack = packOf(c.id);
  return clips;
}

/**
 * The file a clip is loaded with. The voice is cut into packs by lesson family, so that the first
 * question of a game fetches a megabyte or two and not the whole voice:
 *   core      praise, the end of a round, the starting check, choices, rewards: needed everywhere
 *   numbers   every number, and the joining pieces ("plus", "is")
 *   place     tens and ones said out: "47 is 4 tens and 7 ones.", "Which number is 47?"
 *   games     the sentences of the eleven first games
 *   stories   Oreo's stories
 *   sums, order, steps, groups, parts, money, counting: the newer lessons, by family
 */
const SECTION_STARTS: Record<string, string> = {
  'all-done-for-today': 'core', 'how-many-altogether': 'sums', 'start-at-ten-then-count-on': 'place', 'how-many-look-for-groups-you': 'counting',
  'which-is-more': 'order', 'what-comes-next': 'steps', 'count-the-groups-in-steps-one': 'groups', 'which-one-is-cut-in-half': 'parts',
  'which-is-worth-more': 'money', 'tap-each-one-once-to-count': 'counting', 'this-is-oreo-she-loves-bones': 'core',
};
const FIXED_PACK = (() => {
  const out: Record<string, string> = {};
  let pack = 'games';
  for (const id of Object.keys(FIXED)) { pack = SECTION_STARTS[id] ?? pack; out[id] = pack; }
  return out;
})();
const TEMPLATE_PACK: Record<string, string> = {
  num: 'numbers', frag: 'numbers', isTO: 'place', which: 'place', has: 'place', tens: 'place',
  puppyHas: 'stories', finds: 'stories', digs: 'stories', eats: 'stories', gives: 'stories',
  nearest: 'counting', hops: 'steps', tapMoney: 'money', shillings: 'money', tapNth: 'order', nthPlace: 'order',
  friendsQ: 'games', friends: 'games', newTen: 'games', five: 'games', rows: 'games', tensOnly: 'games',
};
function packOf(id: string): string {
  if (id in FIXED_PACK) return FIXED_PACK[id]!;
  if (id in PRAISE || id in PRAISE_AFTER_HELP) return 'core';
  const pack = TEMPLATE_PACK[id.split('.')[0]!];
  if (!pack) throw new Error(`No voice pack for the clip ${id}`);
  return pack;
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
