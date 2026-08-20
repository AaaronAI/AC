import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CATEGORIES } from "@/lib/config";
import { TIER_STYLE, decodeCard } from "@/lib/share";

/**
 * The standalone share card. Its entire contents live in the URL segment, so
 * these links keep working with no database behind them.
 */

type Props = { params: Promise<{ data: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  const card = decodeCard(data);
  if (!card) return { title: "Polymarket Slots" };

  const title = `${TIER_STYLE[card.t].label} pull · ${card.pts.toLocaleString("en-US")} pts`;
  const description = `${card.o} at ${Math.round(card.p * 100)}¢ on "${card.q}" — $${card.b.toFixed(2)} to win $${card.w.toFixed(2)}.`;
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

  const tier = TIER_STYLE[card.t];
  const category = CATEGORIES[card.c] ?? CATEGORIES.any;
  const multiplier = card.p > 0 ? 1 / card.p : 0;

  return (
    <main className="card-page">
      <article
        className="share-card"
        style={{
          border: `2px solid ${tier.accent}`,
          boxShadow: `0 30px 90px ${tier.glow}`,
        }}
      >
        <div className="share-row">
          <span
            className="tier-badge"
            style={{ background: tier.glow, color: tier.accent, border: `1px solid ${tier.accent}` }}
          >
            {tier.label} pull
          </span>
          <span style={{ color: "var(--text-dim)", fontSize: 14 }}>
            {category.emoji} {category.label}
          </span>
        </div>

        <h1 className="q">{card.q}</h1>

        <div className="share-row">
          <span
            className="tier-badge"
            style={{ background: tier.accent, color: "#0b0f16", fontSize: 13 }}
          >
            {card.o}
          </span>
          <span style={{ color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
            {Math.round(card.p * 100)}¢ · {multiplier.toFixed(2)}x
          </span>
        </div>

        <div className="grid" style={{ borderRadius: 10, overflow: "hidden" }}>
          <Cell k="Stake" v={`$${card.b.toFixed(2)}`} />
          <Cell k="Pays" v={`$${card.w.toFixed(2)}`} />
          <Cell k="Book" v={card.g} />
          <Cell k="Settles" v={card.h <= 24 ? "<24h" : `${Math.round(card.h)}h`} />
        </div>

        <div className="share-row">
          <span style={{ color: "var(--text-faint)", fontSize: 12, letterSpacing: 2 }}>POINTS</span>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 40,
              fontWeight: 800,
              color: tier.accent,
            }}
          >
            {card.pts.toLocaleString("en-US")}
          </span>
        </div>
      </article>

      <a className="btn" href="/">
        Pull your own lever →
      </a>

      <p className="footnote">
        Polymarket Slots picks a random market that passed an order-book screen. Card data is
        encoded in this link — nothing is stored on a server.
      </p>
    </main>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="cell">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
