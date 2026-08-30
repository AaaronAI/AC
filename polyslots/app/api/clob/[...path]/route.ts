import { NextResponse } from "next/server";

import { CLOB_HOST, FIXTURE_MODE } from "@/lib/config";

/**
 * Thin pass-through to Polymarket's CLOB.
 *
 * The browser builds and signs everything: the EIP-712 order signature and the
 * HMAC auth headers are both produced in the page from a secret this server
 * never receives. All we do is relay bytes, which removes the CORS problem and
 * gives us one place to rate limit.
 *
 * Because it *is* a relay, it's deliberately narrow: only CLOB paths the game
 * actually uses, and only the headers the CLOB needs.
 */

export const dynamic = "force-dynamic";

/** Path prefixes the game legitimately touches. Anything else is refused. */
const ALLOWED_PREFIXES = [
  "auth/",
  "order",
  "orders",
  "cancel",
  "book",
  "books",
  "price",
  "prices",
  "midpoint",
  "midpoints",
  "spread",
  "spreads",
  "tick-size",
  "neg-risk",
  "fee-rate",
  "balance-allowance",
  "data/",
  "time",
  "markets",
  "simplified-markets",
  "last-trade-price",
];

/** Auth headers the CLOB expects. Everything else is dropped. */
const FORWARD_HEADERS = [
  "poly_address",
  "poly_signature",
  "poly_timestamp",
  "poly_nonce",
  "poly_api_key",
  "poly_passphrase",
  "content-type",
  "accept",
];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
}

async function relay(request: Request, path: string[]): Promise<Response> {
  if (FIXTURE_MODE) {
    return NextResponse.json(
      { error: "Fixture mode is on — this build is not connected to the real exchange." },
      { status: 503 },
    );
  }

  const joined = path.join("/");
  if (!isAllowed(joined)) {
    return NextResponse.json({ error: "Path not permitted." }, { status: 403 });
  }

  const incoming = new URL(request.url);
  const target = `${CLOB_HOST}/${joined}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  try {
    const upstream = await fetch(target, { method, headers, body, cache: "no-store" });
    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("CLOB relay failed", err);
    return NextResponse.json({ error: "Could not reach the exchange." }, { status: 502 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  return relay(request, (await ctx.params).path);
}

export async function POST(request: Request, ctx: Ctx) {
  return relay(request, (await ctx.params).path);
}

export async function DELETE(request: Request, ctx: Ctx) {
  return relay(request, (await ctx.params).path);
}

export async function PUT(request: Request, ctx: Ctx) {
  return relay(request, (await ctx.params).path);
}
