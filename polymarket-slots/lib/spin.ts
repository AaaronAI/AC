import {
  DEFAULT_RULES,
  LIMIT_PRICE_BUFFER_CENTS,
  MAX_BOOKS_PER_SPIN,
} from "./config.ts";
import { evaluate } from "./eligibility.ts";
import { fetchHistory } from "./history.ts";
import { round, roundUpToTick } from "./orderbook.ts";
import { hashSeed, mulberry32, weightedPick } from "./rng.ts";
import { getBooks, getMarkets } from "./source.ts";
import type {
  Book,
  Candidate,
  CategoryKey,
  HorizonKey,
  Market,
  Quote,
  Rules,
  ScreeningSummary,
  SpinResult,
} from "./types.ts";

export interface SpinOptions {
  betUsd: number;
  horizon: HorizonKey;
  category: CategoryKey;
  /** Screening rules, already validated. Defaults when omitted. */
  rules?: Rules;
  /** Seed the pick for reproducibility. Omit for a genuinely random spin. */
  seed?: string;
  now?: number;
}

export class NoEligibleMarketsError extends Error {
  // Declared and assigned explicitly rather than as a constructor parameter
  // property, which Node's type-stripping can't handle.
  readonly screening: ScreeningSummary;

  constructor(screening: ScreeningSummary) {
    super("No markets cleared screening for those filters");
    this.name = "NoEligibleMarketsError";
    this.screening = screening;
  }
}

/**
 * Pull the lever.
 *
 * Discovery → screening → weighted pick → quote. The screening funnel is
 * returned alongside the result so the UI can show its working: a slot machine
 * that silently discards 200 markets is indistinguishable from one that's
 * broken.
 */
export async function spin(opts: SpinOptions): Promise<SpinResult> {
  const now = opts.now ?? Date.now();
  const rules = opts.rules ?? DEFAULT_RULES;
  const { betUsd, horizon, category } = opts;

  const fetched = await getMarkets({ horizon, category, now });

  // Screen the most liquid markets first, and cap how many books we pull.
  const pool = [...fetched]
    .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
    .slice(0, MAX_BOOKS_PER_SPIN);

  const tokenIds = pool.flatMap((m) => m.outcomes.map((o) => o.tokenId));
  const books = await getBooks(tokenIds, now);

  const screening: ScreeningSummary = {
    fetched: fetched.length,
    booksChecked: 0,
    eligible: 0,
    rejections: {},
  };

  const candidates: Candidate[] = [];

  for (const market of pool) {
    for (const outcome of market.outcomes) {
      const book = books.get(outcome.tokenId);
      if (!book) continue;
      screening.booksChecked += 1;

      const evaluation = evaluate(market, book, betUsd, rules);
      if (evaluation.eligible) {
        candidates.push({ market, outcome, evaluation });
      } else {
        for (const reason of evaluation.reasons) {
          screening.rejections[reason] = (screening.rejections[reason] ?? 0) + 1;
        }
      }
    }
  }

  screening.eligible = candidates.length;
  if (candidates.length === 0) throw new NoEligibleMarketsError(screening);

  const rand = opts.seed ? mulberry32(hashSeed(opts.seed)) : Math.random;
  const picked = weightedPick(candidates, (c) => c.evaluation.score, rand);
  if (!picked) throw new NoEligibleMarketsError(screening);

  // Decorative, and explicitly not allowed to fail the pull.
  const quote = buildQuote(picked, betUsd);
  const history = await fetchHistory(picked.outcome.tokenId, quote.expectedAvgPrice).catch(() => []);

  return {
    id: newSpinId(),
    betUsd,
    horizon,
    category,
    market: picked.market,
    outcome: picked.outcome,
    evaluation: picked.evaluation,
    quote,
    history,
    screening,
    reelFiller: buildReelFiller(candidates, picked.market.id),
    createdAt: new Date(now).toISOString(),
  };
}

/** Up to a dozen other qualifying questions, deduped, for the spin animation. */
function buildReelFiller(candidates: Candidate[], excludeMarketId: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    if (c.market.id === excludeMarketId) continue;
    if (seen.has(c.market.question)) continue;
    seen.add(c.market.question);
    out.push(c.market.question);
    if (out.length >= 12) break;
  }
  return out;
}

/**
 * Turn a screened candidate into a concrete offer.
 *
 * The limit price is the whole safety story: it's the worst price the
 * simulation touched, plus a cent of headroom, snapped up to a legal tick. The
 * order can fill better than this but never worse, so a book that moves between
 * the quote and the fill costs the player nothing.
 */
export function buildQuote(candidate: Candidate, betUsd: number): Quote {
  const { market, outcome, evaluation } = candidate;
  const fill = evaluation.fill;
  if (!fill) throw new Error("Cannot quote a candidate with no simulated fill");

  const limitPrice = roundUpToTick(
    fill.worstPrice + LIMIT_PRICE_BUFFER_CENTS / 100,
    market.tickSize,
  );

  return {
    tokenId: outcome.tokenId,
    side: "BUY",
    betUsd,
    expectedShares: round(fill.shares, 2),
    expectedAvgPrice: round(fill.avgPrice, 4),
    limitPrice,
    payoutIfWin: round(fill.shares, 2),
    impliedProbability: round(fill.avgPrice * 100, 1),
    multiplier: round(1 / fill.avgPrice, 2),
  };
}

/** Re-screen a single market right before execution, to catch a moved book. */
export function requote(
  market: Market,
  outcome: { label: string; tokenId: string },
  book: Book,
  betUsd: number,
  rules: Rules = DEFAULT_RULES,
): { ok: true; quote: Quote } | { ok: false; reasons: string[] } {
  const evaluation = evaluate(market, book, betUsd, rules);
  if (!evaluation.eligible) return { ok: false, reasons: evaluation.reasons };
  return { ok: true, quote: buildQuote({ market, outcome, evaluation }, betUsd) };
}

function newSpinId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
