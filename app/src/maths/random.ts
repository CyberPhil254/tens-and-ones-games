/** A source of random numbers from 0 (included) to 1 (not included), like Math.random. */
export type Rng = () => number;

/** A repeatable random source (mulberry32). The same seed always gives the same questions. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random helpers bound to one source, with the same behaviour as the live game's. */
export function dice(rng: Rng) {
  const rnd = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const shuffle = <T>(xs: T[]): T[] => {
    for (let i = xs.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [xs[i], xs[j]] = [xs[j]!, xs[i]!];
    }
    return xs;
  };
  const pick = <T>(xs: readonly T[]): T => xs[rnd(0, xs.length - 1)]!;
  const chance = (p: number) => rng() < p;
  return { rnd, shuffle, pick, chance, rnd01: rng };
}
export type Dice = ReturnType<typeof dice>;
