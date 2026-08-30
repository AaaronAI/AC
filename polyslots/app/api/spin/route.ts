import { NextResponse } from "next/server";

import {
  CATEGORIES,
  DEFAULT_RULES,
  FIXTURE_MODE,
  HORIZONS,
  LEVEL_OPTIONS,
  MAX_BET_USD,
  MIN_BET_USD,
  SPREAD_OPTIONS,
} from "@/lib/config";
import { NoEligibleMarketsError, spin } from "@/lib/spin";
import type { CategoryKey, HorizonKey, Rules } from "@/lib/types";

/** Books change constantly, so a quote must never be served from a cache. */
export const dynamic = "force-dynamic";

interface SpinRequest {
  betUsd?: unknown;
  horizon?: unknown;
  category?: unknown;
  maxSpreadCents?: unknown;
  maxLevelsCrossed?: unknown;
}

/**
 * Build the screening rules from the request.
 *
 * Only the two player-facing dials can be overridden, and only to values the
 * UI actually offers — a client asking for a 40¢ spread doesn't get one. The
 * rest of the screen is not negotiable from outside.
 */
function rulesFrom(body: SpinRequest): Rules {
  const spread = Number(body.maxSpreadCents);
  const levels = Number(body.maxLevelsCrossed);

  return {
    ...DEFAULT_RULES,
    maxSpreadCents: SPREAD_OPTIONS.some((o) => o.cents === spread)
      ? spread
      : DEFAULT_RULES.maxSpreadCents,
    maxLevelsCrossed: LEVEL_OPTIONS.some((o) => o.levels === levels)
      ? levels
      : DEFAULT_RULES.maxLevelsCrossed,
  };
}

export async function POST(request: Request) {
  let body: SpinRequest;
  try {
    body = (await request.json()) as SpinRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  const betUsd = Number(body.betUsd);
  if (!Number.isFinite(betUsd) || betUsd < MIN_BET_USD || betUsd > MAX_BET_USD) {
    return NextResponse.json(
      { ok: false, error: `Bet must be between $${MIN_BET_USD} and $${MAX_BET_USD}.` },
      { status: 400 },
    );
  }

  const horizon = String(body.horizon ?? "24h") as HorizonKey;
  if (!(horizon in HORIZONS)) {
    return NextResponse.json({ ok: false, error: "Unknown horizon filter." }, { status: 400 });
  }

  const category = String(body.category ?? "any") as CategoryKey;
  if (!(category in CATEGORIES)) {
    return NextResponse.json({ ok: false, error: "Unknown category filter." }, { status: 400 });
  }

  const rules = rulesFrom(body);

  try {
    const result = await spin({ betUsd, horizon, category, rules });
    return NextResponse.json({ ok: true, spin: result, rules, fixtureMode: FIXTURE_MODE });
  } catch (err) {
    if (err instanceof NoEligibleMarketsError) {
      // Not really an error — the filters were just too tight. Hand back the
      // funnel so the UI can say which rule did the damage.
      return NextResponse.json(
        {
          ok: false,
          error:
            "Nothing cleared the screen. Loosen the spread or allow more price levels, widen the horizon, or drop the stake.",
          screening: err.screening,
          rules,
        },
        { status: 200 },
      );
    }

    console.error("spin failed", err);
    return NextResponse.json(
      { ok: false, error: "Couldn't reach Polymarket just now. Try again in a moment." },
      { status: 502 },
    );
  }
}
