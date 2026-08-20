/**
 * Small seedable PRNG (mulberry32).
 *
 * The machine needs randomness that's reproducible on demand: seeding a spin
 * lets tests assert exact outcomes, and lets a shared card be replayed.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn any string into a 32-bit seed. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick one item with probability proportional to its weight.
 * Non-positive weights are treated as a small floor so nothing is unreachable.
 */
export function weightedPick<T>(items: T[], weightOf: (item: T) => number, rand: () => number): T | null {
  if (items.length === 0) return null;

  const weights = items.map((item) => {
    const w = weightOf(item);
    return Number.isFinite(w) && w > 0 ? w : 0.01;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rand() * items.length)] ?? items[0];

  let threshold = rand() * total;
  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return items[i];
  }
  return items[items.length - 1];
}
