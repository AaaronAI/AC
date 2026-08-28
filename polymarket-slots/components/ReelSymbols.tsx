import type { MarketId, MemeId } from "@/lib/reels";

/**
 * Reel artwork, drawn rather than photographed.
 *
 * Chunky single-weight strokes so they read at ~40px on a cream reel face,
 * the same way a cherry or a BAR does on a real cabinet.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const MEME_TITLES: Record<MemeId, string> = {
  turtleneck: "Turtleneck",
  scarf: "Scarf",
  wine: "White wine",
  worm: "Sandworm",
  cardigan: "Cardigan",
};

export function MemeMark({ id }: { id: MemeId }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={MEME_TITLES[id]}>
      <title>{MEME_TITLES[id]}</title>

      {/* An absurdly tall roll neck on a small body. */}
      {id === "turtleneck" && (
        <g {...S}>
          <path d="M8.4 3.6h7.2v5.2H8.4z" />
          <path d="M8.4 5.2h7.2M8.4 7h7.2" />
          <path d="M8.4 8.8 5 11v9h14v-9l-3.4-2.2" />
          <path d="M5 13.4h14" />
        </g>
      )}

      {/* Coiled scarf, seen end-on: the meme's real subject. */}
      {id === "scarf" && (
        <g {...S}>
          <circle cx="12" cy="12" r="8.6" />
          <circle cx="12" cy="12" r="5.8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.4v2.8M12 17.8v2.8M3.4 12h2.8M17.8 12h2.8" />
        </g>
      )}

      {/* A glass of something cold and expensive. */}
      {id === "wine" && (
        <g {...S}>
          <path d="M7.6 3.6h8.8l-1.1 6.2a3.4 3.4 0 0 1-6.6 0z" />
          <path d="M8.1 7.4h7.8" />
          <path d="M12 13.4v5.6M8.6 20.4h6.8" />
        </g>
      )}

      {/* Knitted sandworm, rearing. */}
      {id === "worm" && (
        <g {...S}>
          <path d="M3.2 20.4c0-6.4 2.6-11.6 7.2-11.6 3 0 4.8 2.2 4.8 4.8" />
          <path d="M8.6 20.4c0-4 1.2-7 3.8-7" />
          <circle cx="16.6" cy="10.4" r="4.4" />
          <circle cx="16.6" cy="10.4" r="1.5" />
        </g>
      )}

      {/* Cable-knit swatch. */}
      {id === "cardigan" && (
        <g {...S}>
          <rect x="3.6" y="4.4" width="16.8" height="15.2" rx="2.2" />
          <path d="M8 4.4v15.2M12 4.4v15.2M16 4.4v15.2" />
          <path d="M3.6 9.6h16.8M3.6 14.4h16.8" />
        </g>
      )}
    </svg>
  );
}

const MARKET_TITLES: Record<MarketId, string> = {
  odds: "Odds",
  coin: "Coin flip",
  orb: "Crystal ball",
  gavel: "Resolution",
  dice: "Dice",
  storefront: "Free groceries",
  armchair: "The chair",
  rent: "Two years of rent",
};

export function MarketMark({ id }: { id: MarketId }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={MARKET_TITLES[id]}>
      <title>{MARKET_TITLES[id]}</title>

      {/* A probability curve. */}
      {id === "odds" && (
        <g {...S}>
          <path d="M3.4 18.6c4.2 0 4.6-12 8.6-12s4.4 12 8.6 12" />
          <path d="M3.4 20.8h17.2" />
        </g>
      )}

      {/* Fifty-fifty. */}
      {id === "coin" && (
        <g {...S}>
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 3.4v17.2" />
          <path d="M7.4 8.6h2.2M7.4 12h2.2M7.4 15.4h2.2" />
        </g>
      )}

      {/* Forecasting, obviously. */}
      {id === "orb" && (
        <g {...S}>
          <circle cx="12" cy="10.2" r="6.4" />
          <path d="M9.4 8.4a3.2 3.2 0 0 1 2.6-1.6" />
          <path d="M6.6 19.4h10.8l-1.6-2.6H8.2z" />
        </g>
      )}

      {/* Resolution day. */}
      {id === "gavel" && (
        <g {...S}>
          <path d="M4.4 19.6h9.2" />
          <path d="M6.6 12.4 13 6" />
          <rect x="12.4" y="3.4" width="6.4" height="4.2" rx="1" transform="rotate(45 15.6 5.5)" />
          <path d="M9 16.2 5.4 12.6" />
        </g>
      )}

      {/* The free grocery store. */}
      {id === "storefront" && (
        <g {...S}>
          <path d="M4.2 10.2h15.6v10.2H4.2z" />
          <path d="M3.2 10.2 5.2 5.2h13.6l2 5z" />
          <path d="M9.4 20.4v-5.6h5.2v5.6" />
        </g>
      )}

      {/* The chair, conspicuously unoccupied. */}
      {id === "armchair" && (
        <g {...S}>
          <path d="M7 11V7.4a2.2 2.2 0 0 1 2.2-2.2h5.6A2.2 2.2 0 0 1 17 7.4V11" />
          <path d="M4.6 17.2v-4.4a1.9 1.9 0 0 1 3.8 0V14h7.2v-1.2a1.9 1.9 0 0 1 3.8 0v4.4z" />
          <path d="M6.6 17.2v2.6M17.4 17.2v2.6" />
        </g>
      )}

      {/* Rent, covered. */}
      {id === "rent" && (
        <g {...S}>
          <path d="M3.8 11 12 4.4 20.2 11" />
          <path d="M6 10.6v9.4h12v-9.4" />
          <path d="M12 12.4v6.2M13.6 13.6h-2.4a1.2 1.2 0 0 0 0 2.4h1.6a1.2 1.2 0 0 1 0 2.4h-2.4" />
        </g>
      )}

      {/* The honest name for all of this. */}
      {id === "dice" && (
        <>
          <g {...S}>
            <rect x="4" y="4" width="16" height="16" rx="3.2" />
          </g>
          <g fill="currentColor">
            <circle cx="8.6" cy="8.6" r="1.4" />
            <circle cx="15.4" cy="8.6" r="1.4" />
            <circle cx="8.6" cy="15.4" r="1.4" />
            <circle cx="15.4" cy="15.4" r="1.4" />
          </g>
        </>
      )}
    </svg>
  );
}
