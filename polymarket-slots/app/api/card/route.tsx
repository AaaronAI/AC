import { ImageResponse } from "next/og";

import { CATEGORIES } from "@/lib/config";
import { TIER_STYLE, decodeCard } from "@/lib/share";

/**
 * The shareable card, rendered as a PNG so it unfurls in Slack, Discord, and
 * anywhere else that previews links. Contents come entirely from the `d` query
 * param — see lib/share.ts.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoded = new URL(request.url).searchParams.get("d");
  const card = encoded ? decodeCard(encoded) : null;

  if (!card) {
    return new Response("Bad card data", { status: 400 });
  }

  const tier = TIER_STYLE[card.t];
  const category = CATEGORIES[card.c] ?? CATEGORIES.any;
  const multiplier = card.p > 0 ? 1 / card.p : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0f16",
          backgroundImage: `radial-gradient(900px 500px at 80% -10%, ${tier.glow}, transparent 70%)`,
          padding: "56px 64px",
          color: "#e8eef7",
          fontFamily: "sans-serif",
          border: `3px solid ${tier.accent}`,
        }}
      >
        {/* Header: rarity + category */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: tier.accent,
              fontWeight: 700,
            }}
          >
            {tier.label} pull
          </div>
          {/* Label only, no emoji: satori's bundled font has no emoji glyphs,
              and supplying them would mean fetching from an external CDN. */}
          <div style={{ display: "flex", fontSize: 26, color: "#8aa0b8" }}>{category.label}</div>
        </div>

        {/* The market */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 20, color: "#8aa0b8", letterSpacing: 3 }}>
            THE MACHINE PICKED
          </div>
          <div
            style={{
              display: "flex",
              fontSize: card.q.length > 70 ? 46 : 56,
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: 14,
            }}
          >
            {card.q}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26, fontSize: 34 }}>
            <span
              style={{
                display: "flex",
                background: tier.accent,
                color: "#0b0f16",
                padding: "6px 20px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {card.o}
            </span>
            <span style={{ display: "flex", marginLeft: 20, color: "#8aa0b8" }}>
              at {Math.round(card.p * 100)}¢ · {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Footer stats */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex" }}>
            <Stat label="STAKE" value={`$${card.b.toFixed(2)}`} />
            <Stat label="PAYOUT" value={`$${card.w.toFixed(2)}`} />
            <Stat label="BOOK" value={card.g} />
            <Stat label="SETTLES" value={card.h <= 24 ? "<24h" : `${Math.round(card.h)}h`} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 20, color: "#8aa0b8", letterSpacing: 3 }}>
              POINTS
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                color: tier.accent,
                lineHeight: 1,
              }}
            >
              {card.pts.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 48 }}>
      <div style={{ display: "flex", fontSize: 18, color: "#8aa0b8", letterSpacing: 3 }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}
