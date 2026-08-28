import { NextResponse } from "next/server";

import { fetchBooks } from "@/lib/clob";
import { CLOB_HOST, FIXTURE_MODE, GAMMA_HOST } from "@/lib/config";
import { discoverMarkets, normalizeMarket } from "@/lib/gamma";

/**
 * Connectivity and shape check against the live APIs.
 *
 * The point is to make a first live run diagnosable. If discovery returns
 * nothing, this says which step failed and what actually came back, instead of
 * leaving you to guess between "geo-blocked", "field renamed" and "genuinely no
 * markets right now".
 *
 * Visit /api/diagnose.
 */

export const dynamic = "force-dynamic";

interface Step {
  step: string;
  ok: boolean;
  detail: string;
}

export async function GET() {
  const steps: Step[] = [];
  const started = Date.now();

  if (FIXTURE_MODE) {
    return NextResponse.json({
      ok: false,
      fixtureMode: true,
      summary: "FIXTURE_MODE is on, so nothing here talks to Polymarket. Unset it to run live.",
      steps,
    });
  }

  // 1. Can we reach Gamma at all, and does a row look like we expect?
  let sampleTokenIds: string[] = [];
  try {
    const res = await fetch(`${GAMMA_HOST}/markets?closed=false&active=true&limit=5`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    // Read as text first. A proxy, a geo-block or a rate limiter answers with
    // HTML or a bare string, and "unexpected token H" tells you nothing about
    // what actually went wrong.
    const raw = await res.text();
    let body: unknown = null;
    let parseNote = "";
    try {
      body = JSON.parse(raw);
    } catch {
      parseNote = ` — body was not JSON: ${raw.slice(0, 120).replace(/\s+/g, " ")}`;
    }

    const rows = Array.isArray(body)
      ? body
      : Array.isArray((body as { data?: unknown[] })?.data)
        ? (body as { data: unknown[] }).data
        : [];

    steps.push({
      step: "gamma reachable",
      ok: res.ok && parseNote === "",
      detail: parseNote
        ? `HTTP ${res.status}${parseNote}`
        : `HTTP ${res.status}, ${rows.length} rows, envelope: ${Array.isArray(body) ? "array" : "object"}`,
    });

    const first = rows[0] as Record<string, unknown> | undefined;
    if (first) {
      const expected = ["question", "endDate", "outcomes", "clobTokenIds", "volume24hr", "liquidity"];
      const missing = expected.filter((k) => !(k in first));
      steps.push({
        step: "gamma field shape",
        ok: missing.length === 0,
        detail: missing.length ? `missing: ${missing.join(", ")}` : "all expected fields present",
      });

      const parsed = normalizeMarket(first);
      steps.push({
        step: "gamma row parses",
        ok: parsed !== null,
        detail: parsed
          ? `"${parsed.question.slice(0, 60)}" — ${parsed.outcomes.length} outcomes, resolves in ${parsed.hoursToResolution.toFixed(1)}h`
          : "normalizeMarket returned null (outcomes/clobTokenIds/endDate unusable)",
      });
      if (parsed) sampleTokenIds = parsed.outcomes.map((o) => o.tokenId);
    }
  } catch (err) {
    steps.push({ step: "gamma reachable", ok: false, detail: String(err) });
  }

  // 2. Does date-bounded discovery actually return anything?
  for (const horizon of ["24h", "48h", "7d"] as const) {
    try {
      const { markets, report } = await discoverMarkets({ horizon, category: "any" });
      steps.push({
        step: `discovery ${horizon}`,
        ok: markets.length > 0,
        detail:
          `${markets.length} markets · ${report.pagesFetched} page(s) · ${report.rowsSeen} rows seen · ` +
          `${report.parsed} parsed · date params ${report.usedDateBounds ? "accepted" : "BYPASSED (fell back to local filtering)"}`,
      });
    } catch (err) {
      steps.push({ step: `discovery ${horizon}`, ok: false, detail: String(err) });
    }
  }

  // 3. Can we read an order book?
  if (sampleTokenIds.length > 0) {
    try {
      const books = await fetchBooks(sampleTokenIds);
      const book = books.get(sampleTokenIds[0]);
      steps.push({
        step: "clob order book",
        ok: !!book && (book.bids.length > 0 || book.asks.length > 0),
        detail: book
          ? `${book.bids.length} bids / ${book.asks.length} asks on ${sampleTokenIds[0].slice(0, 12)}…`
          : "no book returned for the sampled token",
      });
    } catch (err) {
      steps.push({ step: "clob order book", ok: false, detail: String(err) });
    }
  } else {
    steps.push({ step: "clob order book", ok: false, detail: "skipped — no token id to sample" });
  }

  const ok = steps.every((s) => s.ok);
  return NextResponse.json({
    ok,
    fixtureMode: false,
    hosts: { gamma: GAMMA_HOST, clob: CLOB_HOST },
    tookMs: Date.now() - started,
    summary: ok
      ? "Live data is working end to end."
      : "Something upstream isn't behaving — see the failing step below.",
    steps,
  });
}
