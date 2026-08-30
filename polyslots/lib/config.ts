import type { CategoryKey, HorizonKey, Rules } from "./types.ts";

/** Public read APIs. Neither needs a key. */
export const GAMMA_HOST = process.env.GAMMA_HOST ?? "https://gamma-api.polymarket.com";
export const CLOB_HOST = process.env.CLOB_HOST ?? "https://clob.polymarket.com";

/** Polygon mainnet. Polymarket's exchange lives here. */
export const CHAIN_ID = 137;

/**
 * Run the whole app off bundled fixtures instead of the network. Lets you play
 * the game (and run the screening logic) with no internet and no wallet.
 */
export const FIXTURE_MODE = process.env.FIXTURE_MODE === "1";

/** Time-to-resolution filters. "How soon do I find out if I won." */
export const HORIZONS: Record<HorizonKey, { label: string; blurb: string; hours: number }> = {
  "24h": { label: "1 day", blurb: "settles by tomorrow", hours: 24 },
  "48h": { label: "2 days", blurb: "settles in two", hours: 48 },
  "7d": { label: "1 week", blurb: "settles this week", hours: 24 * 7 },
  any: { label: "any", blurb: "no rush", hours: Number.POSITIVE_INFINITY },
};

export const CATEGORIES: Record<CategoryKey, { label: string; emoji: string }> = {
  any: { label: "Anything", emoji: "🎲" },
  geopolitics: { label: "Geopolitics", emoji: "🌍" },
  sports: { label: "Sports", emoji: "🏟️" },
  crypto: { label: "Crypto", emoji: "₿" },
  politics: { label: "Politics", emoji: "🗳️" },
  culture: { label: "Culture", emoji: "🎬" },
  economics: { label: "Economics", emoji: "📈" },
};

/**
 * Default screening rules.
 *
 * These are deliberately strict. The game only works if a random pick is
 * something you'd have been willing to trade anyway — a wide book turns the
 * gimmick into a way to lose money on the spread alone.
 */
export const DEFAULT_RULES: Rules = {
  maxSpreadCents: 3,
  maxSlippageCents: 2,
  minPrice: 0.08,
  maxPrice: 0.92,
  minVolume24hUsd: 5_000,
  minLiquidityUsd: 2_000,
  minDepthMultiple: 2,
  maxLevelsCrossed: 2,
};

/**
 * The two screening rules worth putting in front of a player, with the reasoning
 * shown inline. Everything else stays in DEFAULT_RULES — these are the two that
 * change what you actually pay.
 */
export const SPREAD_OPTIONS: { cents: number; label: string; note: string }[] = [
  {
    cents: 1,
    label: "1¢",
    note: "Only the tightest books on the exchange. You give up about half a cent per share entering. Very few markets qualify.",
  },
  {
    cents: 2,
    label: "2¢",
    note: "Strict, and still leaves a decent pool on liquid markets.",
  },
  {
    cents: 3,
    label: "3¢",
    note: "Recommended. Wide enough to reach most short-dated markets, tight enough that the spread isn't the main thing you're paying.",
  },
  {
    cents: 5,
    label: "5¢",
    note: "Loose. You're down about 2.5¢ a share the moment you enter — on a 40¢ contract that's over 6% before the question resolves.",
  },
];

export const LEVEL_OPTIONS: { levels: number; label: string; note: string }[] = [
  {
    levels: 1,
    label: "One price",
    note: "Your whole stake fills at the best ask. Zero slippage by construction — if it doesn't all fit at the touch, the market is skipped.",
  },
  {
    levels: 2,
    label: "Up to two",
    note: "Recommended. Fills at the best price and, if needed, the next one down. A cent or so of slippage at most.",
  },
  {
    levels: 3,
    label: "Up to three",
    note: "Reaches thinner books. Crossing three prices for a small stake usually means there isn't much resting near the touch.",
  },
];

/** Which option each control lands on by default. */
export const RECOMMENDED_SPREAD_CENTS = 3;
export const RECOMMENDED_LEVELS = 2;

/** Bet sizing guardrails. The upper bound is a deliberate seatbelt. */
export const MIN_BET_USD = 1;
export const MAX_BET_USD = Number(process.env.MAX_BET_USD ?? 100);

/**
 * Extra cents of headroom added to the simulated worst price to form the order's
 * limit price. Absorbs small book movement between quote and fill without
 * opening the door to a genuinely bad print.
 */
export const LIMIT_PRICE_BUFFER_CENTS = 1;

/** How many markets to pull from Gamma before screening. */
export const DISCOVERY_LIMIT = Number(process.env.DISCOVERY_LIMIT ?? 250);

/** Cap on how many order books we'll fetch per spin, to stay polite. */
export const MAX_BOOKS_PER_SPIN = Number(process.env.MAX_BOOKS_PER_SPIN ?? 60);
