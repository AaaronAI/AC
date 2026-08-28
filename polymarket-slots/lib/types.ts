/** Shared domain types for the slot machine. */

/** How soon the market must resolve. The whole point is a fast payoff. */
export type HorizonKey = "24h" | "48h" | "7d" | "any";

/** Coarse buckets we sort markets into for the category reel. */
export type CategoryKey =
  | "geopolitics"
  | "sports"
  | "crypto"
  | "politics"
  | "culture"
  | "economics"
  | "any";

/** One side of a binary market: the token you'd actually buy. */
export interface Outcome {
  /** "Yes" / "No", or a team name in a multi-outcome event. */
  label: string;
  /** CLOB ERC-1155 token id. This is what orders reference. */
  tokenId: string;
}

/** A market as we care about it, normalized out of Gamma's payload. */
export interface Market {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  /** ISO timestamp of expected resolution. */
  endDate: string;
  /** Hours from now until resolution. Negative means already past. */
  hoursToResolution: number;
  outcomes: Outcome[];
  category: CategoryKey;
  volume24hUsd: number;
  liquidityUsd: number;
  negRisk: boolean;
  /** Smallest legal price increment, e.g. 0.01 or 0.001. */
  tickSize: number;
  minOrderSize: number;
  acceptingOrders: boolean;
  icon?: string;
  eventTitle?: string;
}

/** A single price level. */
export interface Level {
  price: number;
  /** Size in shares. */
  size: number;
}

/**
 * A normalized order book. Unlike the raw CLOB payload, ordering here is
 * guaranteed: bids descend from the best bid, asks ascend from the best ask.
 */
export interface Book {
  tokenId: string;
  bids: Level[];
  asks: Level[];
}

/** Result of walking the book to spend a fixed dollar amount. */
export interface Fill {
  /** Whether the book could absorb the whole bet. */
  filled: boolean;
  /** Shares acquired. */
  shares: number;
  /** Dollars actually spent. */
  spentUsd: number;
  /** Volume-weighted average price paid, in dollars per share. */
  avgPrice: number;
  /** The worst price touched — this becomes the limit price. */
  worstPrice: number;
  /** How far avgPrice sits above the best ask, in cents. */
  slippageCents: number;
  /** Number of price levels consumed. */
  levelsConsumed: number;
}

/** Book quality measurements, independent of any particular bet. */
export interface BookMetrics {
  bestBid: number | null;
  bestAsk: number | null;
  midpoint: number | null;
  spreadCents: number | null;
  /** Dollar notional resting on the ask side within 5c of the midpoint. */
  askDepthUsd: number;
  /** Dollar notional resting on the bid side within 5c of the midpoint. */
  bidDepthUsd: number;
}

/** Why a market did or didn't make the cut. */
export interface Evaluation {
  eligible: boolean;
  /** Human-readable rejection reasons. Empty when eligible. */
  reasons: string[];
  metrics: BookMetrics;
  fill: Fill | null;
  /** 0-100. Higher is a healthier book. Used to weight the random pick. */
  score: number;
}

/** A market that survived screening, paired with the side we'd buy. */
export interface Candidate {
  market: Market;
  outcome: Outcome;
  evaluation: Evaluation;
}

/** What the server hands back when you pull the lever. */
export interface SpinResult {
  /** Opaque id for this spin; also the share-card key. */
  id: string;
  betUsd: number;
  horizon: HorizonKey;
  category: CategoryKey;
  market: Market;
  outcome: Outcome;
  evaluation: Evaluation;
  /** The quote the player is being offered, locked to the book we just read. */
  quote: Quote;
  /** Everything we screened, for the "show your work" panel. */
  screening: ScreeningSummary;
  /**
   * Other markets that also cleared screening. The reel scrolls through these
   * on its way to the result, so what flies past is real and not invented.
   */
  reelFiller: string[];
  createdAt: string;
}

/** The concrete offer: buy N shares at no worse than limitPrice. */
export interface Quote {
  tokenId: string;
  side: "BUY";
  betUsd: number;
  /** Expected shares at the simulated average price. */
  expectedShares: number;
  expectedAvgPrice: number;
  /**
   * Hard price ceiling sent with the order. The book can move between the
   * quote and the fill; this is what stops a bad print.
   */
  limitPrice: number;
  /** Payout if this outcome resolves true: shares * $1. */
  payoutIfWin: number;
  /** expectedAvgPrice expressed as an implied probability percentage. */
  impliedProbability: number;
  /** Decimal odds, for the arcade framing. */
  multiplier: number;
}

/**
 * Funnel counts, so the UI can explain why the pool is what it is.
 *
 * Note the change of unit partway down: `fetched` counts *markets*, while
 * everything below it counts *sides*, since a binary market offers two
 * independently tradeable tokens and they're screened separately.
 */
export interface ScreeningSummary {
  /** Markets matching the horizon and category filters. */
  fetched: number;
  /** Sides whose order book we read (roughly 2 per market). */
  booksChecked: number;
  /** Sides that cleared every rule. */
  eligible: number;
  /** Counts of each rejection reason across the sides screened. */
  rejections: Record<string, number>;
}

/** Tunables that decide what counts as a tradeable book. */
export interface Rules {
  /** Reject if best ask - best bid exceeds this, in cents. */
  maxSpreadCents: number;
  /** Reject if filling the bet would push the average price this far past the best ask. */
  maxSlippageCents: number;
  /** Reject prices outside this band — near-certainties and lottery tickets are boring. */
  minPrice: number;
  maxPrice: number;
  /** Reject thin markets. */
  minVolume24hUsd: number;
  minLiquidityUsd: number;
  /** Require the book to hold this multiple of the bet within the slippage cap. */
  minDepthMultiple: number;
  /**
   * How many price levels the order may eat through.
   *
   * 1 means the whole stake fills at the best ask and slippage is exactly zero.
   * Each extra level means later shares cost more than the quoted price. This is
   * the most legible depth measure there is: it answers "is there enough resting
   * at the touch to take all of me?" without needing a dollar figure.
   */
  maxLevelsCrossed: number;
}
