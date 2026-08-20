import { round } from "./orderbook.ts";

/**
 * Scoring.
 *
 * Points deliberately reward *daring and execution quality*, not bet size. Size
 * contributes linearly and nothing more, so a $5 spin on a well-executed
 * longshot beats a $100 spin on a coin flip. The machine should make finding a
 * tight book on a genuinely uncertain question feel like the win condition.
 */

export type Tier = "common" | "rare" | "epic" | "legendary";

export interface PointsInput {
  betUsd: number;
  /** Average fill price as a probability, 0-1. */
  impliedProbability: number;
  /** Cents of slippage actually incurred. */
  slippageCents: number;
  hoursToResolution: number;
  /** Consecutive spins in this session. */
  streak: number;
}

export interface PointsBreakdown {
  base: number;
  longshotMultiplier: number;
  executionBonus: number;
  speedMultiplier: number;
  streakMultiplier: number;
  total: number;
  tier: Tier;
  /** Short human-readable notes for the result card. */
  notes: string[];
}

export function computePoints(input: PointsInput): PointsBreakdown {
  const p = clamp(input.impliedProbability, 0.01, 0.99);
  const notes: string[] = [];

  // One point per dollar staked. Deliberately flat.
  const base = Math.max(input.betUsd, 0);

  // The longer the odds, the bigger the multiplier — this is just the payout
  // multiple (1/p), capped so a 1% tail doesn't dominate the leaderboard.
  const longshotMultiplier = round(Math.min(1 / p, 8), 2);
  if (longshotMultiplier >= 4) notes.push(`${longshotMultiplier}x longshot`);

  // Reward the screener doing its job: a near-frictionless fill earns a bonus.
  let executionBonus = 0;
  if (input.slippageCents <= 0.25) {
    executionBonus = 0.3;
    notes.push("clean fill (+30%)");
  } else if (input.slippageCents <= 1) {
    executionBonus = 0.15;
    notes.push("tight fill (+15%)");
  }

  // Faster settlement is more fun, so it's worth more.
  let speedMultiplier = 1;
  if (input.hoursToResolution <= 24) {
    speedMultiplier = 1.5;
    notes.push("same-day settle (1.5x)");
  } else if (input.hoursToResolution <= 48) {
    speedMultiplier = 1.25;
    notes.push("two-day settle (1.25x)");
  }

  // Streaks climb slowly and cap at 2x.
  const streakMultiplier = round(Math.min(1 + 0.1 * Math.max(input.streak, 0), 2), 2);
  if (streakMultiplier > 1) notes.push(`${input.streak}-spin streak (${streakMultiplier}x)`);

  const total = Math.round(
    base * longshotMultiplier * (1 + executionBonus) * speedMultiplier * streakMultiplier,
  );

  return {
    base,
    longshotMultiplier,
    executionBonus,
    speedMultiplier,
    streakMultiplier,
    total,
    tier: tierFor(longshotMultiplier, input.slippageCents),
    notes,
  };
}

/**
 * Card rarity. Driven by how long the odds were, nudged up when the fill was
 * also clean — a bold pick executed well is the rarest thing the machine does.
 */
function tierFor(longshotMultiplier: number, slippageCents: number): Tier {
  const clean = slippageCents <= 0.5;
  if (longshotMultiplier >= 6) return clean ? "legendary" : "epic";
  if (longshotMultiplier >= 3) return clean ? "epic" : "rare";
  if (longshotMultiplier >= 1.8) return clean ? "rare" : "common";
  return "common";
}

/** Letter grade for the book the machine landed on. */
export function bookGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  return "C";
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
