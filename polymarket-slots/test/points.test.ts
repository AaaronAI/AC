import assert from "node:assert/strict";
import { test } from "node:test";

import { bookGrade, computePoints } from "../lib/points.ts";

const baseline = {
  betUsd: 10,
  impliedProbability: 0.5,
  slippageCents: 2,
  hoursToResolution: 72,
  streak: 0,
};

test("a plain coin-flip spin scores its stake times the 2x longshot multiple", () => {
  const result = computePoints(baseline);
  assert.equal(result.longshotMultiplier, 2);
  assert.equal(result.speedMultiplier, 1);
  assert.equal(result.streakMultiplier, 1);
  assert.equal(result.executionBonus, 0);
  assert.equal(result.total, 20);
});

test("longer odds pay more, but the multiplier is capped", () => {
  const even = computePoints(baseline);
  const longshot = computePoints({ ...baseline, impliedProbability: 0.2 });
  const extreme = computePoints({ ...baseline, impliedProbability: 0.001 });

  assert.ok(longshot.total > even.total);
  assert.equal(longshot.longshotMultiplier, 5);
  // Capped at 8x so a tail bet can't run away with the leaderboard.
  assert.equal(extreme.longshotMultiplier, 8);
});

test("a clean fill is worth more than a sloppy one", () => {
  const clean = computePoints({ ...baseline, slippageCents: 0.1 });
  const sloppy = computePoints({ ...baseline, slippageCents: 1.8 });

  assert.equal(clean.executionBonus, 0.3);
  assert.equal(sloppy.executionBonus, 0);
  assert.ok(clean.total > sloppy.total);
  assert.ok(clean.notes.some((n) => n.includes("clean fill")));
});

test("faster settlement multiplies the score", () => {
  const sameDay = computePoints({ ...baseline, hoursToResolution: 20 });
  const twoDay = computePoints({ ...baseline, hoursToResolution: 40 });
  const slow = computePoints({ ...baseline, hoursToResolution: 200 });

  assert.equal(sameDay.speedMultiplier, 1.5);
  assert.equal(twoDay.speedMultiplier, 1.25);
  assert.equal(slow.speedMultiplier, 1);
});

test("streaks build and cap at 2x", () => {
  assert.equal(computePoints({ ...baseline, streak: 3 }).streakMultiplier, 1.3);
  assert.equal(computePoints({ ...baseline, streak: 50 }).streakMultiplier, 2);
  assert.equal(computePoints({ ...baseline, streak: -5 }).streakMultiplier, 1);
});

test("points scale linearly with stake, so size alone can't buy a better card", () => {
  const small = computePoints({ ...baseline, betUsd: 10 });
  const big = computePoints({ ...baseline, betUsd: 100 });

  assert.equal(big.total, small.total * 10);
  assert.equal(big.tier, small.tier);
});

test("rarity rewards bold picks executed cleanly", () => {
  const safe = computePoints({ ...baseline, impliedProbability: 0.8, slippageCents: 0.1 });
  const bold = computePoints({ ...baseline, impliedProbability: 0.12, slippageCents: 0.1 });
  const boldButSloppy = computePoints({ ...baseline, impliedProbability: 0.12, slippageCents: 3 });

  assert.equal(safe.tier, "common");
  assert.equal(bold.tier, "legendary");
  assert.equal(boldButSloppy.tier, "epic");
});

test("an out-of-range probability is clamped rather than producing Infinity", () => {
  const zero = computePoints({ ...baseline, impliedProbability: 0 });
  const nan = computePoints({ ...baseline, impliedProbability: Number.NaN });

  assert.ok(Number.isFinite(zero.total));
  assert.ok(Number.isFinite(nan.total));
});

test("book grades track the score", () => {
  assert.equal(bookGrade(95), "A+");
  assert.equal(bookGrade(72), "B+");
  assert.equal(bookGrade(10), "C");
});
