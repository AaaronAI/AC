import { measure, simulateMarketBuy } from "./orderbook.ts";
import type { Book, Evaluation, Market, Rules } from "./types.ts";

/**
 * Stable rejection codes. These get counted into the screening funnel so the UI
 * can say *why* the pool is small, instead of just shrugging.
 */
export const Reason = {
  NOT_ACCEPTING: "not accepting orders",
  ONE_SIDED: "one-sided book",
  WIDE_SPREAD: "spread too wide",
  PRICE_BAND: "price outside band",
  THIN_VOLUME: "not enough 24h volume",
  THIN_LIQUIDITY: "not enough liquidity",
  CANT_FILL: "book can't absorb the bet",
  SLIPPAGE: "too much slippage",
  SHALLOW: "book too shallow behind the touch",
  TOO_MANY_LEVELS: "order would cross too many prices",
} as const;

export type ReasonCode = (typeof Reason)[keyof typeof Reason];

/**
 * Decide whether a given outcome token is something we'd let the machine land
 * on, for this specific bet size.
 *
 * Bet size is part of the question, not a detail: a book that's perfectly fine
 * for $5 can be untradeable at $100.
 */
export function evaluate(market: Market, book: Book, betUsd: number, rules: Rules): Evaluation {
  const metrics = measure(book);
  const reasons: string[] = [];

  if (!market.acceptingOrders) reasons.push(Reason.NOT_ACCEPTING);

  if (metrics.bestBid === null || metrics.bestAsk === null) {
    // Without both sides there's nothing meaningful left to measure.
    reasons.push(Reason.ONE_SIDED);
    return { eligible: false, reasons, metrics, fill: null, score: 0 };
  }

  if (metrics.spreadCents !== null && metrics.spreadCents > rules.maxSpreadCents) {
    reasons.push(Reason.WIDE_SPREAD);
  }

  if (metrics.bestAsk < rules.minPrice || metrics.bestAsk > rules.maxPrice) {
    reasons.push(Reason.PRICE_BAND);
  }

  if (market.volume24hUsd < rules.minVolume24hUsd) reasons.push(Reason.THIN_VOLUME);
  if (market.liquidityUsd < rules.minLiquidityUsd) reasons.push(Reason.THIN_LIQUIDITY);

  const fill = simulateMarketBuy(book, betUsd);
  if (!fill.filled) reasons.push(Reason.CANT_FILL);
  if (fill.slippageCents > rules.maxSlippageCents) reasons.push(Reason.SLIPPAGE);
  // Only meaningful on a fill that completed — a partial fill stops early and
  // would otherwise look deceptively tidy.
  if (fill.filled && fill.levelsConsumed > rules.maxLevelsCrossed) {
    reasons.push(Reason.TOO_MANY_LEVELS);
  }

  const requiredDepth = betUsd * rules.minDepthMultiple;
  if (metrics.askDepthUsd < requiredDepth) reasons.push(Reason.SHALLOW);

  const eligible = reasons.length === 0;
  return {
    eligible,
    reasons,
    metrics,
    fill,
    score: eligible ? scoreBook(market, metrics, fill, betUsd, rules) : 0,
  };
}

/**
 * 0-100 book health. Drives the weighted pick, so a healthier book is more
 * likely to come up — the machine is random, but not indifferent.
 */
function scoreBook(
  market: Market,
  metrics: ReturnType<typeof measure>,
  fill: ReturnType<typeof simulateMarketBuy>,
  betUsd: number,
  rules: Rules,
): number {
  const spread = metrics.spreadCents ?? rules.maxSpreadCents;
  const tightness = clamp01(1 - spread / Math.max(rules.maxSpreadCents, 0.01));
  const precision = clamp01(1 - fill.slippageCents / Math.max(rules.maxSlippageCents, 0.01));

  // Depth saturates: three times what we require is plenty, more isn't better.
  const depthTarget = Math.max(betUsd * rules.minDepthMultiple * 3, 1);
  const depth = clamp01(metrics.askDepthUsd / depthTarget);

  // Volume is log-scaled — $50k and $500k shouldn't be a 10x difference in appeal.
  const volume = clamp01(Math.log10(Math.max(market.volume24hUsd, 1)) / 6);

  // A single-level fill is the cleanest possible execution, so reward it.
  const cleanliness = fill.levelsConsumed <= 1 ? 1 : fill.levelsConsumed <= 2 ? 0.6 : 0.25;

  const score = tightness * 26 + precision * 26 + depth * 20 + volume * 13 + cleanliness * 15;
  return Math.round(score);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
