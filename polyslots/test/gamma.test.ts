import assert from "node:assert/strict";
import { test } from "node:test";

import { classify, normalizeMarket } from "../lib/gamma.ts";

const now = Date.UTC(2026, 0, 15, 12, 0, 0);

test("normalizeMarket parses Gamma's JSON-string array fields", () => {
  const market = normalizeMarket(
    {
      id: 123,
      question: "Will the ceasefire hold?",
      slug: "ceasefire",
      conditionId: "0xabc",
      endDate: new Date(now + 12 * 3_600_000).toISOString(),
      outcomes: '["Yes", "No"]',
      clobTokenIds: '["111", "222"]',
      volume24hr: "45000.5",
      liquidity: "12000",
      orderPriceMinTickSize: "0.01",
      acceptingOrders: true,
    },
    now,
  );

  assert.ok(market);
  assert.equal(market.outcomes.length, 2);
  assert.deepEqual(market.outcomes[0], { label: "Yes", tokenId: "111" });
  assert.deepEqual(market.outcomes[1], { label: "No", tokenId: "222" });
  assert.equal(market.volume24hUsd, 45000.5);
  assert.equal(market.liquidityUsd, 12000);
  assert.equal(market.hoursToResolution, 12);
});

test("normalizeMarket also accepts real arrays", () => {
  const market = normalizeMarket(
    {
      id: 1,
      question: "Q",
      endDate: new Date(now + 3_600_000).toISOString(),
      outcomes: ["Yes", "No"],
      clobTokenIds: ["a", "b"],
    },
    now,
  );
  assert.equal(market?.outcomes.length, 2);
});

test("normalizeMarket rejects records it can't trade", () => {
  const noTokens = normalizeMarket(
    { id: 1, question: "Q", endDate: new Date(now).toISOString(), outcomes: '["Yes","No"]' },
    now,
  );
  assert.equal(noTokens, null);

  const mismatched = normalizeMarket(
    {
      id: 1,
      question: "Q",
      endDate: new Date(now).toISOString(),
      outcomes: '["Yes","No"]',
      clobTokenIds: '["only-one"]',
    },
    now,
  );
  assert.equal(mismatched, null);

  const noDate = normalizeMarket(
    { id: 1, question: "Q", outcomes: '["Yes","No"]', clobTokenIds: '["a","b"]' },
    now,
  );
  assert.equal(noDate, null);

  const badJson = normalizeMarket(
    {
      id: 1,
      question: "Q",
      endDate: new Date(now).toISOString(),
      outcomes: "{not json",
      clobTokenIds: '["a","b"]',
    },
    now,
  );
  assert.equal(badJson, null);
});

test("a market missing acceptingOrders is not assumed closed", () => {
  const market = normalizeMarket(
    {
      id: 1,
      question: "Q",
      endDate: new Date(now + 3_600_000).toISOString(),
      outcomes: '["Yes","No"]',
      clobTokenIds: '["a","b"]',
    },
    now,
  );
  assert.equal(market?.acceptingOrders, true);

  const closed = normalizeMarket(
    {
      id: 1,
      question: "Q",
      endDate: new Date(now + 3_600_000).toISOString(),
      outcomes: '["Yes","No"]',
      clobTokenIds: '["a","b"]',
      closed: true,
    },
    now,
  );
  assert.equal(closed?.acceptingOrders, false);
});

test("classify prefers tags over question text", () => {
  assert.equal(
    classify({ question: "Will the Lakers win?", tags: [{ slug: "sports" }] }),
    "sports",
  );
  assert.equal(
    classify({ question: "Untagged question", events: [{ tags: [{ slug: "geopolitics" }] }] }),
    "geopolitics",
  );
});

test("classify falls back to the question when a market is untagged", () => {
  assert.equal(classify({ question: "Will Bitcoin close above $100k?" }), "crypto");
  assert.equal(classify({ question: "Will the NFL game go to overtime?" }), "sports");
  assert.equal(classify({ question: "Will Ukraine and Russia agree to a ceasefire?" }), "geopolitics");
});

test("classify uses word boundaries so substrings don't mislabel", () => {
  // "war" must not match inside "warrant"; "eth" must not match inside "whether".
  assert.equal(classify({ question: "Will a search warrant be issued?" }), "any");
  assert.equal(classify({ question: "Whether the committee meets" }), "any");
});

test("classify returns 'any' for genuinely uncategorizable markets", () => {
  assert.equal(classify({ question: "Will the widget ship on time?" }), "any");
});
