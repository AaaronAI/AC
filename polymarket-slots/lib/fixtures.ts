import { normalizeBook } from "./orderbook.ts";
import { hashSeed, mulberry32 } from "./rng.ts";
import type { Book, CategoryKey, Market } from "./types.ts";

/**
 * Deterministic offline market set.
 *
 * Used when FIXTURE_MODE=1 so the machine is fully playable without network
 * access or a wallet. The mix is intentional: roughly half these books are
 * *meant* to fail screening (wide spreads, shallow depth, near-resolved prices)
 * so the funnel and its rejection reasons are exercised rather than assumed.
 */

interface Blueprint {
  question: string;
  category: CategoryKey;
  hours: number;
  /** Fair price of the "Yes" side. */
  price: number;
  /** Half-spread in cents. Large values should fail the spread rule. */
  halfSpreadCents: number;
  /** Shares resting at each level near the touch. */
  depth: number;
  volume24hUsd: number;
  liquidityUsd: number;
}

const BLUEPRINTS: Blueprint[] = [
  // --- Healthy books, short horizon: the bread and butter of the game ---
  { question: "Will the ceasefire hold through the weekend?", category: "geopolitics", hours: 20, price: 0.63, halfSpreadCents: 0.5, depth: 900, volume24hUsd: 240_000, liquidityUsd: 85_000 },
  { question: "Will there be a NATO airspace violation reported this week?", category: "geopolitics", hours: 40, price: 0.31, halfSpreadCents: 1, depth: 600, volume24hUsd: 96_000, liquidityUsd: 41_000 },
  { question: "Will the sanctions package pass by Friday?", category: "geopolitics", hours: 44, price: 0.47, halfSpreadCents: 0.5, depth: 1200, volume24hUsd: 310_000, liquidityUsd: 120_000 },
  { question: "Will Taiwan report an ADIZ incursion tomorrow?", category: "geopolitics", hours: 18, price: 0.72, halfSpreadCents: 1, depth: 500, volume24hUsd: 52_000, liquidityUsd: 24_000 },
  { question: "Lakers to beat the Celtics tonight?", category: "sports", hours: 8, price: 0.44, halfSpreadCents: 0.5, depth: 2000, volume24hUsd: 880_000, liquidityUsd: 260_000 },
  { question: "Will any NFL game go to overtime this weekend?", category: "sports", hours: 36, price: 0.38, halfSpreadCents: 1, depth: 750, volume24hUsd: 143_000, liquidityUsd: 62_000 },
  { question: "Arsenal to win their midweek fixture?", category: "sports", hours: 30, price: 0.57, halfSpreadCents: 0.5, depth: 1400, volume24hUsd: 420_000, liquidityUsd: 150_000 },
  { question: "Will the Yankees starter record 7+ strikeouts?", category: "sports", hours: 14, price: 0.29, halfSpreadCents: 1, depth: 480, volume24hUsd: 61_000, liquidityUsd: 28_000 },
  { question: "Will Bitcoin close above $100k tomorrow?", category: "crypto", hours: 22, price: 0.52, halfSpreadCents: 0.5, depth: 2500, volume24hUsd: 1_200_000, liquidityUsd: 400_000 },
  { question: "Will Ethereum outperform Bitcoin over 48 hours?", category: "crypto", hours: 46, price: 0.49, halfSpreadCents: 0.5, depth: 1100, volume24hUsd: 275_000, liquidityUsd: 98_000 },
  { question: "Will Solana reclaim its weekly high by Friday?", category: "crypto", hours: 42, price: 0.35, halfSpreadCents: 1, depth: 640, volume24hUsd: 88_000, liquidityUsd: 37_000 },
  { question: "Will the shutdown be resolved before Thursday?", category: "politics", hours: 34, price: 0.41, halfSpreadCents: 1, depth: 820, volume24hUsd: 190_000, liquidityUsd: 71_000 },
  { question: "Will the confirmation vote happen this week?", category: "politics", hours: 45, price: 0.66, halfSpreadCents: 0.5, depth: 1300, volume24hUsd: 205_000, liquidityUsd: 88_000 },
  { question: "Will the president hold a press conference tomorrow?", category: "politics", hours: 19, price: 0.58, halfSpreadCents: 1, depth: 560, volume24hUsd: 47_000, liquidityUsd: 21_000 },
  { question: "Will CPI come in above forecast?", category: "economics", hours: 26, price: 0.45, halfSpreadCents: 0.5, depth: 1600, volume24hUsd: 520_000, liquidityUsd: 180_000 },
  { question: "Will the Fed signal a cut at this meeting?", category: "economics", hours: 43, price: 0.27, halfSpreadCents: 1, depth: 700, volume24hUsd: 133_000, liquidityUsd: 55_000 },
  { question: "Will jobless claims beat estimates?", category: "economics", hours: 31, price: 0.53, halfSpreadCents: 0.5, depth: 950, volume24hUsd: 164_000, liquidityUsd: 67_000 },
  { question: "Will the new album debut at number one?", category: "culture", hours: 39, price: 0.68, halfSpreadCents: 1, depth: 520, volume24hUsd: 74_000, liquidityUsd: 30_000 },
  { question: "Will the film top the weekend box office?", category: "culture", hours: 47, price: 0.61, halfSpreadCents: 0.5, depth: 880, volume24hUsd: 112_000, liquidityUsd: 48_000 },
  { question: "Will a major model release ship this week?", category: "culture", hours: 41, price: 0.33, halfSpreadCents: 1, depth: 610, volume24hUsd: 92_000, liquidityUsd: 39_000 },

  // --- Should be rejected: spread far too wide ---
  { question: "Will the obscure summit produce a joint statement?", category: "geopolitics", hours: 30, price: 0.5, halfSpreadCents: 6, depth: 200, volume24hUsd: 12_000, liquidityUsd: 9_000 },
  { question: "Will the third-tier match end in a draw?", category: "sports", hours: 20, price: 0.4, halfSpreadCents: 5, depth: 150, volume24hUsd: 8_000, liquidityUsd: 6_000 },

  // --- Should be rejected: priced as a near-certainty (outside the band) ---
  { question: "Will the incumbent remain in office through tomorrow?", category: "politics", hours: 16, price: 0.97, halfSpreadCents: 0.5, depth: 3000, volume24hUsd: 300_000, liquidityUsd: 140_000 },
  { question: "Will Bitcoin stay above $1 this week?", category: "crypto", hours: 44, price: 0.99, halfSpreadCents: 0.5, depth: 5000, volume24hUsd: 220_000, liquidityUsd: 90_000 },
  { question: "Will an asteroid strike be confirmed by Friday?", category: "culture", hours: 40, price: 0.02, halfSpreadCents: 0.5, depth: 2200, volume24hUsd: 45_000, liquidityUsd: 26_000 },

  // --- Should be rejected: thin volume / shallow book ---
  { question: "Will the regional by-election be called early?", category: "politics", hours: 28, price: 0.44, halfSpreadCents: 1, depth: 25, volume24hUsd: 900, liquidityUsd: 700 },
  { question: "Will the minor tournament finish ahead of schedule?", category: "sports", hours: 33, price: 0.51, halfSpreadCents: 1, depth: 18, volume24hUsd: 400, liquidityUsd: 350 },

  // --- Longer horizon, healthy: only reachable on the 1-week filter ---
  { question: "Will the trade talks conclude within the week?", category: "geopolitics", hours: 120, price: 0.39, halfSpreadCents: 0.5, depth: 1000, volume24hUsd: 175_000, liquidityUsd: 72_000 },
  { question: "Will the division leader hold first place on Sunday?", category: "sports", hours: 132, price: 0.62, halfSpreadCents: 0.5, depth: 1500, volume24hUsd: 260_000, liquidityUsd: 110_000 },
  { question: "Will ETH gas average under 5 gwei this week?", category: "crypto", hours: 150, price: 0.46, halfSpreadCents: 1, depth: 900, volume24hUsd: 130_000, liquidityUsd: 58_000 },
  { question: "Will the budget resolution clear committee this week?", category: "economics", hours: 141, price: 0.55, halfSpreadCents: 0.5, depth: 1050, volume24hUsd: 148_000, liquidityUsd: 63_000 },
];

/** Build the fixture market list, dated relative to `now`. */
export function fixtureMarkets(now = Date.now()): Market[] {
  return BLUEPRINTS.map((bp, i) => {
    const id = `fixture-${i + 1}`;
    return {
      id,
      question: bp.question,
      slug: slugify(bp.question),
      conditionId: `0xfixture${String(i + 1).padStart(4, "0")}`,
      endDate: new Date(now + bp.hours * 3_600_000).toISOString(),
      hoursToResolution: bp.hours,
      outcomes: [
        { label: "Yes", tokenId: `${id}-yes` },
        { label: "No", tokenId: `${id}-no` },
      ],
      category: bp.category,
      volume24hUsd: bp.volume24hUsd,
      liquidityUsd: bp.liquidityUsd,
      negRisk: false,
      tickSize: 0.01,
      minOrderSize: 1,
      acceptingOrders: true,
      eventTitle: undefined,
    } satisfies Market;
  });
}

/** Build the matching books. Yes/No prices are complementary, as on a real CTF pair. */
export function fixtureBooks(now = Date.now()): Map<string, Book> {
  const markets = fixtureMarkets(now);
  const out = new Map<string, Book>();

  markets.forEach((market, i) => {
    const bp = BLUEPRINTS[i];
    const rand = mulberry32(hashSeed(market.id));
    out.set(market.outcomes[0].tokenId, buildBook(market.outcomes[0].tokenId, bp.price, bp, rand));
    out.set(
      market.outcomes[1].tokenId,
      buildBook(market.outcomes[1].tokenId, 1 - bp.price, bp, rand),
    );
  });

  return out;
}

/** Synthesize a ladder of levels around a fair price. */
function buildBook(tokenId: string, fair: number, bp: Blueprint, rand: () => number): Book {
  const half = bp.halfSpreadCents / 100;
  const bids: { price: string; size: string }[] = [];
  const asks: { price: string; size: string }[] = [];

  for (let level = 0; level < 8; level++) {
    const step = level * 0.01;
    const bidPrice = round2(fair - half - step);
    const askPrice = round2(fair + half + step);
    // Size grows as you move away from the touch, with a little jitter.
    const size = Math.round(bp.depth * (1 + level * 0.6) * (0.8 + rand() * 0.4));

    if (bidPrice > 0.001) bids.push({ price: bidPrice.toFixed(3), size: String(size) });
    if (askPrice < 0.999) asks.push({ price: askPrice.toFixed(3), size: String(size) });
  }

  // Deliberately hand them over unsorted-ish to exercise normalizeBook's sorting.
  return normalizeBook(tokenId, { asset_id: tokenId, bids: bids.reverse(), asks: asks.reverse() });
}

function round2(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
