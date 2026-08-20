import { NextResponse } from "next/server";

import { CATEGORIES, FIXTURE_MODE, HORIZONS, MAX_BET_USD, MIN_BET_USD } from "@/lib/config";
import { NoEligibleMarketsError, spin } from "@/lib/spin";
import type { CategoryKey, HorizonKey } from "@/lib/types";

/** Books change constantly, so a quote must never be served from a cache. */
export const dynamic = "force-dynamic";

interface SpinRequest {
  betUsd?: unknown;
  horizon?: unknown;
  category?: unknown;
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

  try {
    const result = await spin({ betUsd, horizon, category });
    return NextResponse.json({ ok: true, spin: result, fixtureMode: FIXTURE_MODE });
  } catch (err) {
    if (err instanceof NoEligibleMarketsError) {
      // Not really an error — the filters were just too tight. Hand back the
      // funnel so the UI can say which rule did the damage.
      return NextResponse.json(
        {
          ok: false,
          error: "Nothing cleared screening with those filters. Try a longer horizon, a smaller bet, or 'Anything'.",
          screening: err.screening,
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
