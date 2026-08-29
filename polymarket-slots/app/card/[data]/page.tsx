import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TIER_STYLE, decodeCard, decodeHistory } from "@/lib/share";

import { Sparkline } from "@/components/Sparkline";

/**
 * The shared ticket. Its entire contents live in the URL segment, so these
 * links keep working with no database behind them.
 */

type Props = { params: Promise<{ data: string }> };

const STAMP_COLOR: Record<string, string> = {
  common: "#6B5B48",
  rare: "#1B5E8F",
  epic: "#6B3FA0",
  legendary: "#A8781A",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  const card = decodeCard(data);
  if (!card) return { title: "Polymarket Slots" };

  const title = `${card.o} at ${Math.round(card.p * 100)}¢ — ${card.pts.toLocaleString("en-US")} pts`;
  const description = `"${card.q}" — $${card.b.toFixed(2)} returns $${card.w.toFixed(2)}. ${TIER_STYLE[card.t].label} pull.`;
  const image = `/api/card?d=${encodeURIComponent(data)}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CardPage({ params }: Props) {
  const { data } = await params;
  const card = decodeCard(data);
  if (!card) notFound();

  const isYes = card.o.toUpperCase() === "YES";
  const multiplier = card.p > 0 ? 1 / card.p : 0;

  return (
    <main className="room" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%" }}>
        <article className="ticket" style={{ marginTop: 0 }}>
          <div className="t-head">
            <span>Polymarket Slots</span>
            <span>{card.h <= 24 ? "settles today" : `settles in ${Math.round(card.h)}h`}</span>
          </div>

          <h1 className="t-q">{card.q}</h1>

          <div className="t-pick">
            <span className={`t-side ${isYes ? "yes" : "no"}`}>{card.o.toUpperCase()}</span>
            <span className="t-price">
              at {Math.round(card.p * 100)}¢ · {multiplier.toFixed(2)}× your money
            </span>
          </div>

          <Sparkline values={decodeHistory(card.s)} tone={isYes ? "yes" : "no"} />

          <div className="t-rows">
            <div className="t-row">
              <span className="k">Stake</span>
              <span className="v">${card.b.toFixed(2)}</span>
            </div>
            <div className="t-row">
              <span className="k">Returns if right</span>
              <span className="v win">${card.w.toFixed(2)}</span>
            </div>
            <div className="t-row">
              <span className="k">Book grade</span>
              <span className="v">{card.g}</span>
            </div>
          </div>

          <div className="perf" />

          <div className="t-stub">
            <div className="t-points">
              POINTS
              <b>{card.pts.toLocaleString("en-US")}</b>
            </div>
            <div className="stamp" style={{ color: STAMP_COLOR[card.t] }}>
              {TIER_STYLE[card.t].label}
            </div>
          </div>
        </article>

        <div className="after">
          <a
            className="ghost primary"
            href="/"
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            Pull your own handle →
          </a>
        </div>

        <p className="rules" style={{ padding: "14px 2px 0", textAlign: "center" }}>
          The machine only lands on markets that passed an order-book screen. This ticket is
          encoded in the link — nothing is stored on a server.
        </p>
      </div>
    </main>
  );
}
