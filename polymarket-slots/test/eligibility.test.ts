import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_RULES } from "../lib/config.ts";
import { Reason, evaluate } from "../lib/eligibility.ts";
import { normalizeBook } from "../lib/orderbook.ts";
import type { Market, Rules } from "../lib/types.ts";

function market(overrides: Partial<Market> = {}): Market {
  return {
    id: "m1",
    question: "Will something happen?",
    slug: "will-something-happen",
    conditionId: "0xabc",
    endDate: new Date(Date.now() + 3_600_000).toISOString(),
    hoursToResolution: 12,
    outcomes: [
      { label: "Yes", tokenId: "yes" },
      { label: "No", tokenId: "no" },
    ],
    category: "geopolitics",
    volume24hUsd: 100_000,
    liquidityUsd: 50_000,
    negRisk: false,
    tickSize: 0.01,
    minOrderSize: 1,
    acceptingOrders: true,
    ...overrides,
  };
}

/** A deep, tight book that should always pass. */
function healthyBook() {
  return normalizeBook("yes", {
    bids: [
      { price: "0.49", size: "2000" },
      { price: "0.48", size: "3000" },
    ],
    asks: [
      { price: "0.50", size: "2000" },
      { price: "0.51", size: "3000" },
    ],
  });
}

const rules: Rules = DEFAULT_RULES;

test("a tight, deep book passes and scores well", () => {
  const result = evaluate(market(), healthyBook(), 25, rules);
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.metrics.spreadCents, 1);
  assert.equal(result.fill?.filled, true);
  assert.ok(result.score > 60, `expected a strong score, got ${result.score}`);
});

test("a wide spread is rejected", () => {
  const book = normalizeBook("yes", {
    bids: [{ price: "0.40", size: "2000" }],
    asks: [{ price: "0.50", size: "2000" }], // 10c spread
  });
  const result = evaluate(market(), book, 25, rules);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes(Reason.WIDE_SPREAD));
  assert.equal(result.score, 0);
});

test("a one-sided book is rejected immediately", () => {
  const book = normalizeBook("yes", { bids: [{ price: "0.40", size: "100" }], asks: [] });
  const result = evaluate(market(), book, 25, rules);
  assert.equal(result.eligible, false);
  assert.deepEqual(result.reasons, [Reason.ONE_SIDED]);
  assert.equal(result.fill, null);
});

test("near-certainties fall outside the price band", () => {
  const book = normalizeBook("yes", {
    bids: [{ price: "0.96", size: "5000" }],
    asks: [{ price: "0.97", size: "5000" }],
  });
  const result = evaluate(market(), book, 25, rules);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes(Reason.PRICE_BAND));
});

test("a book too thin to absorb the bet is rejected for that bet size", () => {
  // Only $10 resting on the ask.
  const book = normalizeBook("yes", {
    bids: [{ price: "0.49", size: "2000" }],
    asks: [{ price: "0.50", size: "20" }],
  });

  const small = evaluate(market(), book, 5, rules);
  const large = evaluate(market(), book, 100, rules);

  // The same book is fine small and unusable large — bet size is part of the question.
  assert.equal(large.eligible, false);
  assert.ok(large.reasons.includes(Reason.CANT_FILL));
  assert.ok(large.reasons.includes(Reason.SHALLOW));
  assert.equal(small.fill?.filled, true);
});

test("excessive slippage is rejected even when the bet technically fills", () => {
  // Tight at the touch, but almost nothing there — the rest fills far away.
  const book = normalizeBook("yes", {
    bids: [{ price: "0.49", size: "5000" }],
    asks: [
      { price: "0.50", size: "2" }, // $1
      { price: "0.62", size: "5000" }, // the real fill happens here
    ],
  });
  const result = evaluate(market(), book, 50, rules);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes(Reason.SLIPPAGE));
});

test("thin volume and liquidity are rejected", () => {
  const result = evaluate(
    market({ volume24hUsd: 100, liquidityUsd: 50 }),
    healthyBook(),
    25,
    rules,
  );
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes(Reason.THIN_VOLUME));
  assert.ok(result.reasons.includes(Reason.THIN_LIQUIDITY));
});

test("a market not accepting orders is rejected", () => {
  const result = evaluate(market({ acceptingOrders: false }), healthyBook(), 25, rules);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes(Reason.NOT_ACCEPTING));
});

test("tighter books score above looser ones", () => {
  const tight = evaluate(market(), healthyBook(), 25, rules);
  const looser = evaluate(
    market(),
    normalizeBook("yes", {
      bids: [{ price: "0.475", size: "2000" }],
      asks: [{ price: "0.50", size: "2000" }], // 2.5c spread, still legal
    }),
    25,
    rules,
  );

  assert.equal(looser.eligible, true);
  assert.ok(tight.score > looser.score, `${tight.score} should beat ${looser.score}`);
});
