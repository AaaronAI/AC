import { CLOB_HOST, FIXTURE_MODE } from "./config.ts";
import { hashSeed, mulberry32 } from "./rng.ts";

/**
 * Recent price history for the market the machine landed on.
 *
 * Drawn as a sparkline on the ticket: it's what turns "you bought NO at 38¢"
 * into something that looks like it came off a terminal, and it shows at a
 * glance whether you just bought a market that's been drifting or one that
 * moved hard this morning.
 *
 * Strictly decorative — a failure here must never cost you a pull, so every
 * path degrades to no sparkline rather than an error.
 */

/** How many points we keep. Enough shape to read, few enough to stay in a URL. */
const POINTS = 40;
const TIMEOUT_MS = 2500;

interface RawPoint {
  t?: number;
  p?: number | string;
}

/** Down-sample to POINTS evenly spaced values in 0..1. */
function condense(values: number[]): number[] {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0 && v < 1);
  if (clean.length === 0) return [];
  if (clean.length <= POINTS) return clean.map((v) => round3(v));

  const out: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    out.push(round3(clean[Math.floor((i * (clean.length - 1)) / (POINTS - 1))]));
  }
  return out;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Deterministic stand-in for fixture mode, walked backwards from the current
 * price so the sparkline actually ends where the ticket says it does.
 */
export function fixtureHistory(tokenId: string, endPrice: number): number[] {
  const rand = mulberry32(hashSeed(`history:${tokenId}`));
  const values: number[] = [endPrice];
  let v = endPrice;
  for (let i = 0; i < POINTS - 1; i++) {
    v += (rand() - 0.5) * 0.05;
    if (rand() < 0.08) v += (rand() - 0.5) * 0.18; // the occasional news jump
    v = Math.min(0.95, Math.max(0.05, v));
    values.unshift(round3(v));
  }
  return values;
}

/** Fetch a week of prices for one token. Returns [] on any problem. */
export async function fetchHistory(tokenId: string, endPrice: number): Promise<number[]> {
  if (FIXTURE_MODE) return fixtureHistory(tokenId, endPrice);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({ market: tokenId, interval: "1w", fidelity: "60" });
    const res = await fetch(`${CLOB_HOST}/prices-history?${params}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      // A few minutes stale is fine for a decorative line.
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const body: unknown = await res.json();
    const rows: RawPoint[] = Array.isArray(body)
      ? (body as RawPoint[])
      : Array.isArray((body as { history?: RawPoint[] })?.history)
        ? ((body as { history: RawPoint[] }).history)
        : [];

    return condense(rows.map((r) => Number(r?.p)));
  } catch {
    // Aborted, offline, geo-blocked, shape changed — all the same to a sparkline.
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Turn values into an SVG path across a unit box, so the same points can be
 * drawn at any size by both the ticket and the share image.
 */
export function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";
  // Scale to the run's own range, with padding, so a quiet market still shows
  // shape instead of a flat line across the middle.
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 0.04);
  const pad = height * 0.12;
  const plot = height - pad * 2;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (1 - (v - lo + (span - (hi - lo)) / 2) / span) * plot;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
