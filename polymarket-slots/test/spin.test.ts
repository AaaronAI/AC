import assert from "node:assert/strict";
import { before, test } from "node:test";

// The data source is chosen from the environment at import time, so this must
// be set before anything pulls in lib/config.ts.
process.env.FIXTURE_MODE = "1";

type SpinModule = typeof import("../lib/spin.ts");
type GammaModule = typeof import("../lib/gamma.ts");

let spinLib: SpinModule;
let gamma: GammaModule;

before(async () => {
  spinLib = await import("../lib/spin.ts");
  gamma = await import("../lib/gamma.ts");
});

test("a spin returns a fully screened, quotable market", async () => {
  const result = await spinLib.spin({
    betUsd: 25,
    horizon: "48h",
    category: "any",
    seed: "seed-1",
  });

  assert.equal(result.evaluation.eligible, true);
  assert.equal(result.betUsd, 25);
  assert.ok(result.market.question.length > 0);
  assert.ok(result.outcome.tokenId.length > 0);

  // The quote must be internally consistent.
  const { quote } = result;
  assert.ok(quote.expectedShares > 0);
  assert.ok(quote.expectedAvgPrice > 0 && quote.expectedAvgPrice < 1);
  assert.ok(
    quote.limitPrice >= quote.expectedAvgPrice,
    "limit price must never sit below the expected fill",
  );
  assert.ok(quote.payoutIfWin > quote.betUsd, "a winning bet must pay more than it cost");
  assert.ok(Math.abs(quote.impliedProbability - quote.expectedAvgPrice * 100) < 0.1);
});

test("the same seed always produces the same spin", async () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0);
  const opts = { betUsd: 20, horizon: "7d" as const, category: "any" as const, now };

  const a = await spinLib.spin({ ...opts, seed: "identical" });
  const b = await spinLib.spin({ ...opts, seed: "identical" });

  assert.equal(a.market.id, b.market.id);
  assert.equal(a.outcome.tokenId, b.outcome.tokenId);
  assert.equal(a.quote.expectedAvgPrice, b.quote.expectedAvgPrice);
});

test("the horizon filter is respected", async () => {
  for (const [horizon, maxHours] of [
    ["24h", 24],
    ["48h", 48],
  ] as const) {
    for (let i = 0; i < 12; i++) {
      const result = await spinLib.spin({
        betUsd: 10,
        horizon,
        category: "any",
        seed: `horizon-${horizon}-${i}`,
      });
      assert.ok(
        result.market.hoursToResolution <= maxHours,
        `${horizon} spin returned a market resolving in ${result.market.hoursToResolution}h`,
      );
      assert.ok(result.market.hoursToResolution > 0);
    }
  }
});

test("the category filter is respected", async () => {
  for (const category of ["geopolitics", "sports", "crypto"] as const) {
    for (let i = 0; i < 8; i++) {
      const result = await spinLib.spin({
        betUsd: 10,
        horizon: "7d",
        category,
        seed: `cat-${category}-${i}`,
      });
      assert.equal(result.market.category, category);
    }
  }
});

test("the machine never lands on a market that fails screening", async () => {
  const seen = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const result = await spinLib.spin({
      betUsd: 25,
      horizon: "7d",
      category: "any",
      seed: `sweep-${i}`,
    });
    seen.add(result.market.question);

    const { metrics, fill } = result.evaluation;
    assert.ok(metrics.spreadCents !== null && metrics.spreadCents <= 3);
    assert.ok(metrics.bestAsk !== null && metrics.bestAsk >= 0.08 && metrics.bestAsk <= 0.92);
    assert.equal(fill?.filled, true);
    assert.ok((fill?.slippageCents ?? 99) <= 2);
  }

  // The fixture set deliberately includes wide/thin/near-resolved books.
  // None of them may ever be selected.
  const banned = [
    "Will the obscure summit produce a joint statement?",
    "Will the incumbent remain in office through tomorrow?",
    "Will Bitcoin stay above $1 this week?",
    "Will the regional by-election be called early?",
    "Will an asteroid strike be confirmed by Friday?",
  ];
  for (const q of banned) {
    assert.ok(!seen.has(q), `screening let through a market it should have rejected: ${q}`);
  }

  // And it should still be picking from a genuine variety.
  assert.ok(seen.size >= 5, `expected variety across spins, only saw ${seen.size}`);
});

test("an impossible bet size surfaces the screening funnel instead of a bad market", async () => {
  await assert.rejects(
    () => spinLib.spin({ betUsd: 5_000_000, horizon: "24h", category: "any", seed: "huge" }),
    (err: unknown) => {
      assert.ok(err instanceof spinLib.NoEligibleMarketsError);
      // The funnel should explain itself.
      assert.ok(err.screening.booksChecked > 0);
      assert.equal(err.screening.eligible, 0);
      assert.ok(Object.keys(err.screening.rejections).length > 0);
      return true;
    },
  );
});

test("filterMarkets excludes markets that already resolved", () => {
  const now = Date.now();
  const past = {
    id: "p",
    question: "Already over?",
    slug: "p",
    conditionId: "0x",
    endDate: new Date(now - 3_600_000).toISOString(),
    hoursToResolution: -1,
    outcomes: [{ label: "Yes", tokenId: "y" }],
    category: "any" as const,
    volume24hUsd: 1,
    liquidityUsd: 1,
    negRisk: false,
    tickSize: 0.01,
    minOrderSize: 1,
    acceptingOrders: true,
  };

  const kept = gamma.filterMarkets([past], { horizon: "24h", category: "any", now });
  assert.equal(kept.length, 0);
});
