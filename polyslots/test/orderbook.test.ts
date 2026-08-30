import assert from "node:assert/strict";
import { test } from "node:test";

import {
  bestAsk,
  bestBid,
  depthWithinCents,
  midpoint,
  normalizeBook,
  roundUpToTick,
  simulateMarketBuy,
  spreadCents,
} from "../lib/orderbook.ts";

test("normalizeBook sorts bids down and asks up regardless of input order", () => {
  const book = normalizeBook("t1", {
    bids: [
      { price: "0.40", size: "100" },
      { price: "0.45", size: "50" },
      { price: "0.42", size: "75" },
    ],
    asks: [
      { price: "0.55", size: "100" },
      { price: "0.48", size: "50" },
      { price: "0.51", size: "75" },
    ],
  });

  assert.deepEqual(
    book.bids.map((l) => l.price),
    [0.45, 0.42, 0.4],
  );
  assert.deepEqual(
    book.asks.map((l) => l.price),
    [0.48, 0.51, 0.55],
  );
  assert.equal(bestBid(book), 0.45);
  assert.equal(bestAsk(book), 0.48);
  assert.equal(midpoint(book), 0.465);
  assert.equal(spreadCents(book), 3);
});

test("normalizeBook drops unusable levels instead of producing NaN", () => {
  const book = normalizeBook("t1", {
    bids: [
      { price: "not-a-number", size: "100" },
      { price: "0.40", size: "0" },
      { price: "0", size: "10" },
      { price: "0.35", size: "10" },
    ],
    asks: [{ price: "1.5", size: "10" }],
  });

  assert.deepEqual(book.bids, [{ price: 0.35, size: 10 }]);
  assert.deepEqual(book.asks, []);
  assert.equal(bestAsk(book), null);
  assert.equal(spreadCents(book), null);
});

test("simulateMarketBuy fills entirely at the touch when the level is deep enough", () => {
  const book = normalizeBook("t1", {
    bids: [{ price: "0.49", size: "1000" }],
    asks: [{ price: "0.50", size: "1000" }],
  });

  const fill = simulateMarketBuy(book, 25);
  assert.equal(fill.filled, true);
  assert.equal(fill.levelsConsumed, 1);
  assert.equal(fill.shares, 50); // $25 / $0.50
  assert.equal(fill.avgPrice, 0.5);
  assert.equal(fill.worstPrice, 0.5);
  assert.equal(fill.slippageCents, 0);
});

test("simulateMarketBuy walks multiple levels and reports real slippage", () => {
  // $10 available at 0.50, then $30 at 0.60. A $40 bet must eat both.
  const book = normalizeBook("t1", {
    bids: [{ price: "0.49", size: "100" }],
    asks: [
      { price: "0.50", size: "20" }, // 20 * 0.50 = $10
      { price: "0.60", size: "50" }, // 50 * 0.60 = $30
    ],
  });

  const fill = simulateMarketBuy(book, 40);
  assert.equal(fill.filled, true);
  assert.equal(fill.levelsConsumed, 2);
  // 20 shares at 0.50 + 50 shares at 0.60 = 70 shares for $40
  assert.equal(fill.shares, 70);
  assert.equal(fill.spentUsd, 40);
  assert.ok(Math.abs(fill.avgPrice - 40 / 70) < 1e-6);
  assert.equal(fill.worstPrice, 0.6);
  // avg 0.5714 vs touch 0.50 => ~7.14 cents
  assert.ok(Math.abs(fill.slippageCents - 7.1429) < 0.01);
});

test("simulateMarketBuy reports a partial fill when the book is too thin", () => {
  const book = normalizeBook("t1", {
    bids: [{ price: "0.49", size: "100" }],
    asks: [{ price: "0.50", size: "10" }], // only $5 of depth
  });

  const fill = simulateMarketBuy(book, 100);
  assert.equal(fill.filled, false);
  assert.equal(fill.shares, 10);
  assert.equal(fill.spentUsd, 5);
});

test("simulateMarketBuy handles an empty or nonsensical request", () => {
  const empty = normalizeBook("t1", { bids: [], asks: [] });
  assert.equal(simulateMarketBuy(empty, 25).filled, false);
  assert.equal(simulateMarketBuy(empty, 25).shares, 0);

  const book = normalizeBook("t1", { asks: [{ price: "0.5", size: "100" }] });
  assert.equal(simulateMarketBuy(book, 0).shares, 0);
  assert.equal(simulateMarketBuy(book, Number.NaN).shares, 0);
});

test("depthWithinCents only counts levels near the midpoint", () => {
  const book = normalizeBook("t1", {
    bids: [{ price: "0.50", size: "100" }],
    asks: [
      { price: "0.52", size: "100" }, // 2c above mid 0.51 -> counted
      { price: "0.55", size: "100" }, // 4c above mid -> counted
      { price: "0.70", size: "100" }, // 19c above mid -> excluded
    ],
  });

  const depth = depthWithinCents(book, "ask", 5);
  // 100*0.52 + 100*0.55 = 107
  assert.equal(depth, 107);
});

test("roundUpToTick snaps up and stays inside legal bounds", () => {
  assert.equal(roundUpToTick(0.523, 0.01), 0.53);
  assert.equal(roundUpToTick(0.5, 0.01), 0.5);
  assert.equal(roundUpToTick(0.5231, 0.001), 0.524);
  // Never returns a price at or above 1.
  assert.equal(roundUpToTick(0.999, 0.01), 0.99);
  assert.equal(roundUpToTick(1.4, 0.01), 0.99);
  // Never returns zero or negative.
  assert.equal(roundUpToTick(0, 0.01), 0.01);
});
