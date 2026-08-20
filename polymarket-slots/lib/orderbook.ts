import type { Book, BookMetrics, Fill, Level } from "./types.ts";

/** Raw level as the CLOB sends it — prices and sizes are strings. */
interface RawLevel {
  price: string | number;
  size: string | number;
}

export interface RawBook {
  asset_id?: string;
  bids?: RawLevel[];
  asks?: RawLevel[];
}

function toLevels(raw: RawLevel[] | undefined): Level[] {
  if (!Array.isArray(raw)) return [];
  const out: Level[] = [];
  for (const lvl of raw) {
    const price = Number(lvl?.price);
    const size = Number(lvl?.size);
    // Drop anything unusable rather than letting a NaN poison the averages.
    if (!Number.isFinite(price) || !Number.isFinite(size)) continue;
    if (price <= 0 || price >= 1 || size <= 0) continue;
    out.push({ price, size });
  }
  return out;
}

/**
 * Normalize a raw CLOB book into guaranteed ordering: bids descending from the
 * best bid, asks ascending from the best ask.
 *
 * The API's own ordering is not something we want to depend on — sorting here
 * means every downstream calculation can trust `[0]` is the top of book.
 */
export function normalizeBook(tokenId: string, raw: RawBook | null | undefined): Book {
  const bids = toLevels(raw?.bids).sort((a, b) => b.price - a.price);
  const asks = toLevels(raw?.asks).sort((a, b) => a.price - b.price);
  return { tokenId, bids, asks };
}

export function bestBid(book: Book): number | null {
  return book.bids.length > 0 ? book.bids[0].price : null;
}

export function bestAsk(book: Book): number | null {
  return book.asks.length > 0 ? book.asks[0].price : null;
}

export function midpoint(book: Book): number | null {
  const bid = bestBid(book);
  const ask = bestAsk(book);
  if (bid === null || ask === null) return null;
  // Rounded because binary float division lands on values like
  // 0.46499999999999997, which both renders badly and makes the depth
  // comparisons below sensitive to noise far below a tick.
  return round((bid + ask) / 2, 6);
}

/** Spread in cents. Null if either side of the book is empty. */
export function spreadCents(book: Book): number | null {
  const bid = bestBid(book);
  const ask = bestAsk(book);
  if (bid === null || ask === null) return null;
  return round((ask - bid) * 100, 4);
}

/**
 * Dollar notional resting within `cents` of the midpoint on one side.
 *
 * This is the "can it absorb me" number — a book can show a tight top-of-book
 * spread while holding almost nothing behind it.
 */
export function depthWithinCents(book: Book, side: "bid" | "ask", cents: number): number {
  const mid = midpoint(book);
  if (mid === null) return 0;
  const bound = cents / 100;
  const levels = side === "ask" ? book.asks : book.bids;
  let usd = 0;
  for (const lvl of levels) {
    const distance = side === "ask" ? lvl.price - mid : mid - lvl.price;
    if (distance > bound) break; // levels are sorted outward from the touch
    usd += lvl.price * lvl.size;
  }
  return round(usd, 2);
}

export function measure(book: Book): BookMetrics {
  return {
    bestBid: bestBid(book),
    bestAsk: bestAsk(book),
    midpoint: midpoint(book),
    spreadCents: spreadCents(book),
    askDepthUsd: depthWithinCents(book, "ask", 5),
    bidDepthUsd: depthWithinCents(book, "bid", 5),
  };
}

/**
 * Walk the ask side spending `usdAmount`, and report what you'd actually get.
 *
 * This is the number that matters for the game's promise: not the headline
 * price, but the average price you pay once your order eats through however
 * many levels it needs to.
 */
export function simulateMarketBuy(book: Book, usdAmount: number): Fill {
  const empty: Fill = {
    filled: false,
    shares: 0,
    spentUsd: 0,
    avgPrice: 0,
    worstPrice: 0,
    slippageCents: 0,
    levelsConsumed: 0,
  };

  if (!Number.isFinite(usdAmount) || usdAmount <= 0) return empty;
  const touch = bestAsk(book);
  if (touch === null) return empty;

  let remaining = usdAmount;
  let shares = 0;
  let spent = 0;
  let worst = 0;
  let levels = 0;

  for (const lvl of book.asks) {
    if (remaining <= 1e-9) break;
    const levelCostUsd = lvl.price * lvl.size;
    const takeUsd = Math.min(remaining, levelCostUsd);
    shares += takeUsd / lvl.price;
    spent += takeUsd;
    remaining -= takeUsd;
    worst = lvl.price;
    levels += 1;
  }

  if (shares <= 0) return empty;

  const avgPrice = spent / shares;
  return {
    filled: remaining <= 1e-6,
    shares: round(shares, 6),
    spentUsd: round(spent, 6),
    avgPrice: round(avgPrice, 6),
    worstPrice: worst,
    slippageCents: round((avgPrice - touch) * 100, 4),
    levelsConsumed: levels,
  };
}

/** Round a price up to the next legal tick, clamped inside (0, 1). */
export function roundUpToTick(price: number, tickSize: number): number {
  if (!Number.isFinite(tickSize) || tickSize <= 0) return price;
  const decimals = decimalPlacesOf(tickSize);
  const ticks = Math.ceil(round(price / tickSize, 9));
  const snapped = round(ticks * tickSize, decimals);
  // Never emit a price at or beyond the boundaries — the exchange rejects those.
  const ceiling = round(1 - tickSize, decimals);
  return Math.min(Math.max(snapped, tickSize), ceiling);
}

function decimalPlacesOf(n: number): number {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}
