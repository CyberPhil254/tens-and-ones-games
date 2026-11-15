/**
 * Loads the question makers of the live game straight out of ../index.html, unchanged,
 * so they can be checked as they are today. This is the reference the port must match.
 * Nothing here is used by the app itself.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export type Q = Record<string, unknown> & { opts?: number[] };
export type Piece = string | number;

export interface LiveGame {
  GEN: Record<string, (level: number) => Q>;
  MAXL: Record<string, number>;
  PATH: string[];
  PAD: number[];
  SP: Record<string, (...a: never[]) => string>;
  speechCatalogue: () => { fixed: string[]; frags: string[]; numbers: number[] };
  /** Restart the random sequence, so every run of the checks sees the same questions. */
  seed: (n: number) => void;
}

const START = '/* ---------- helpers ---------- */';
const END = '/* ---------- saved progress';

export function loadLiveGame(): LiveGame {
  const file = fileURLToPath(new URL('../../../index.html', import.meta.url));
  const html = readFileSync(file, 'utf8');
  const from = html.indexOf(START);
  const to = html.indexOf(END);
  if (from < 0 || to < from) throw new Error('index.html changed: cannot find the question makers');
  const code =
    '"use strict";\n' + html.slice(from, to) + '\n;({ GEN, MAXL, PATH, PAD, SP, speechCatalogue });';

  // The slice only touches the page when a game is drawn, so empty stand-ins are enough.
  const context = vm.createContext({ window: {}, document: {}, setTimeout });
  const game = vm.runInContext(code, context) as Omit<LiveGame, 'seed'>;
  const seed = (n: number) => {
    // mulberry32: small, fast, repeatable
    vm.runInContext(
      `{ let a = ${n >>> 0}; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
         t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }`,
      context,
    );
  };
  seed(1);
  return { ...game, seed };
}
