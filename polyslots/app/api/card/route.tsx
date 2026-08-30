import { ImageResponse } from "next/og";

import { sparklinePath } from "@/lib/history";
import { TIER_STYLE, decodeCard, decodeHistory } from "@/lib/share";

/**
 * The ticket as a PNG, so a shared link unfurls into the same object people
 * see in the machine. Contents come entirely from the `d` query param — see
 * lib/share.ts.
 */

export const dynamic = "force-dynamic";

const STAMP_COLOR: Record<string, string> = {
  common: "#6B5B48",
  rare: "#1B5E8F",
  epic: "#6B3FA0",
  legendary: "#A8781A",
};

/**
 * Pulled over HTTP from our own /public rather than off disk: Node's fetch
 * can't read file:// URLs, and reading by path isn't reliable once the route
 * is bundled for serverless. The platforms cache OG images, so the extra hop
 * costs a cold render at most.
 */
async function loadFonts(requestUrl: string) {
  const grab = async (file: string) => {
    const res = await fetch(new URL(`/fonts/${file}`, requestUrl));
    if (!res.ok) throw new Error(`font ${file} responded ${res.status}`);
    const buf = await res.arrayBuffer();

    // Satori parses sfnt directly and cannot read WOFF2. A bad font throws
    // *during* rendering, too late for the caller's try/catch to fall back —
    // so reject it here, while falling back is still possible.
    const sig = new Uint8Array(buf.slice(0, 4));
    const ok =
      (sig[0] === 0x00 && sig[1] === 0x01 && sig[2] === 0x00 && sig[3] === 0x00) ||
      String.fromCharCode(...sig) === "true" ||
      String.fromCharCode(...sig) === "OTTO";
    if (!ok) throw new Error(`font ${file} is not a usable sfnt`);
    return buf;
  };

  // .ttf, not the .woff2 the stylesheet uses — see above.
  const [slab, mono] = await Promise.all([
    grab("alfa-slab-one-400.ttf"),
    grab("dm-mono-500.ttf"),
  ]);

  return [
    { name: "Slab", data: slab, weight: 400 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

export async function GET(request: Request) {
  const encoded = new URL(request.url).searchParams.get("d");
  const card = encoded ? decodeCard(encoded) : null;
  if (!card) return new Response("Bad card data", { status: 400 });

  const isYes = card.o.toUpperCase() === "YES";
  const multiplier = card.p > 0 ? 1 / card.p : 0;
  const stamp = STAMP_COLOR[card.t] ?? STAMP_COLOR.common;
  const history = decodeHistory(card.s);
  const sparkD = history.length > 1 ? sparklinePath(history, 1000, 76) : "";

  let fonts;
  try {
    fonts = await loadFonts(request.url);
  } catch (err) {
    // Fall back to the built-in face rather than failing the unfurl outright.
    console.warn("OG fonts unavailable, falling back", err);
    fonts = undefined;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A0A0D",
          padding: 46,
          fontFamily: "Mono",
        }}
      >
        {/* the ticket */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#F5EFE1",
            borderRadius: 8,
            padding: "34px 44px",
            color: "#241A12",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: "3px solid #241A12",
              paddingBottom: 14,
              fontSize: 20,
              letterSpacing: 3,
              color: "#6B5B48",
              textTransform: "uppercase",
            }}
          >
            <span>Polyslots</span>
            <span>{card.h <= 24 ? "settles today" : `settles in ${Math.round(card.h)}h`}</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: card.q.length > 68 ? 38 : 46,
              fontWeight: 700,
              lineHeight: 1.18,
              marginTop: 18,
              fontFamily: "Slab",
            }}
          >
            {card.q}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
            <span
              style={{
                display: "flex",
                background: isYes ? "#1B7F52" : "#B8332A",
                color: "#F5EFE1",
                padding: "6px 24px",
                borderRadius: 5,
                fontSize: 38,
                fontFamily: "Slab",
                letterSpacing: 2,
              }}
            >
              {card.o.toUpperCase()}
            </span>
            <span style={{ display: "flex", marginLeft: 20, fontSize: 30, color: "#6B5B48" }}>
              at {Math.round(card.p * 100)}¢ · {multiplier.toFixed(2)}× your money
            </span>
          </div>

          {sparkD ? (
            <div style={{ display: "flex", marginTop: 16 }}>
              <svg width={1000} height={76} viewBox="0 0 1000 76">
                <path
                  d={sparkD}
                  fill="none"
                  stroke={isYes ? "#1B7F52" : "#B8332A"}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : null}

          <div style={{ display: "flex", flex: 1 }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "3px dashed rgba(36,26,18,0.35)",
              paddingTop: 22,
            }}
          >
            <div style={{ display: "flex" }}>
              <Stat label="STAKE" value={`$${card.b.toFixed(2)}`} />
              <Stat label="RETURNS" value={`$${card.w.toFixed(2)}`} />
              <Stat label="BOOK" value={card.g} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: "#6B5B48" }}>
                  POINTS
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 68,
                    fontFamily: "Slab",
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {card.pts.toLocaleString("en-US")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  marginLeft: 26,
                  marginBottom: 8,
                  border: `4px solid ${stamp}`,
                  color: stamp,
                  borderRadius: 7,
                  padding: "8px 18px",
                  fontSize: 26,
                  fontFamily: "Slab",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  transform: "rotate(-7deg)",
                }}
              >
                {TIER_STYLE[card.t].label}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 54 }}>
      <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: "#6B5B48" }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 38, marginTop: 6, fontFamily: "Slab" }}>{value}</div>
    </div>
  );
}
