import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureMarkets } from "../lib/fixtures.ts";
import { SUBJECT_IDS, subjectFor } from "../lib/subject.ts";
import type { CategoryKey } from "../lib/types.ts";

const m = (question: string, category: CategoryKey = "any") => ({ question, category });

test("a baseball market lands on a baseball, not a generic ball", () => {
  assert.equal(subjectFor(m("Will the Yankees starter record 7+ strikeouts?", "sports")), "baseball");
  assert.equal(subjectFor(m("Will the MLB game go to extra innings?", "sports")), "baseball");
});

test("the sports subtypes are told apart", () => {
  assert.equal(subjectFor(m("Lakers to beat the Celtics tonight?", "sports")), "basketball");
  assert.equal(subjectFor(m("Will any NFL game go to overtime this weekend?", "sports")), "football");
  assert.equal(subjectFor(m("Arsenal to win their midweek fixture?", "sports")), "soccer");
  assert.equal(subjectFor(m("Will the Stanley Cup final go to game seven?", "sports")), "hockey");
  assert.equal(subjectFor(m("Will the Wimbledon final go five sets?", "sports")), "tennis");
  assert.equal(subjectFor(m("Will the UFC main event end by knockout?", "sports")), "combat");
});

test("crypto markets pick the right coin", () => {
  assert.equal(subjectFor(m("Will Bitcoin close above $100k tomorrow?", "crypto")), "bitcoin");
  assert.equal(subjectFor(m("Will Ethereum outperform Bitcoin over 48 hours?", "crypto")), "ethereum");
});

test("anything unrecognised falls back to its category's mark", () => {
  assert.equal(subjectFor(m("Will the ceasefire hold through the weekend?", "geopolitics")), "globe");
  assert.equal(subjectFor(m("Will the confirmation vote happen this week?", "politics")), "ballot");
  assert.equal(subjectFor(m("Will CPI come in above forecast?", "economics")), "chart");
  assert.equal(subjectFor(m("Will the new album debut at number one?", "culture")), "film");
  assert.equal(subjectFor(m("Will the widget ship on time?", "any")), "dice");
});

test("matching is word-bounded, so short terms don't fire inside other words", () => {
  // "eth" must not match inside "whether"; "sol" not inside "solution".
  assert.equal(subjectFor(m("Whether the committee meets", "any")), "dice");
  assert.equal(subjectFor(m("Will a solution be announced?", "any")), "dice");
  // "mma" must not match inside "summary".
  assert.equal(subjectFor(m("Will the summary be published?", "any")), "dice");
});

test("every fixture market resolves to a drawable symbol", () => {
  const valid = new Set<string>(SUBJECT_IDS);
  for (const market of fixtureMarkets()) {
    const subject = subjectFor(market);
    assert.ok(valid.has(subject), `${market.question} -> ${subject} is not a known symbol`);
  }
});
