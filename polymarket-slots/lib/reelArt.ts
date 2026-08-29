import type { MarketId, MemeId } from "./reels.ts";

/**
 * Reel symbol geometry, as data rather than markup.
 *
 * The React components and the standalone preview both draw from this. They
 * used to carry their own copies of the same paths, which is precisely how the
 * two fell out of step — the preview kept rendering an old symbol set while
 * looking fine.
 */

export type Shape =
  | { t: "p"; d: string; fill?: true }
  | { t: "c"; cx: number; cy: number; r: number; fill?: true }
  | { t: "r"; x: number; y: number; w: number; h: number; rx?: number; transform?: string };

export interface Glyph {
  title: string;
  shapes: Shape[];
}

/** Stroke geometry shared by every glyph, so they read as one set. */
export const STROKE = {
  width: 1.8,
  linecap: "round" as const,
  linejoin: "round" as const,
};

/** The sweater-verse: what's actually funny about the turtleneck memes. */
export const MEME_ART: Record<MemeId, Glyph> = {
  turtleneck: {
    title: "Turtleneck",
    shapes: [
      { t: "p", d: "M8.4 3.6h7.2v5.2H8.4z" },
      { t: "p", d: "M8.4 5.2h7.2M8.4 7h7.2" },
      { t: "p", d: "M8.4 8.8 5 11v9h14v-9l-3.4-2.2" },
      { t: "p", d: "M5 13.4h14" },
    ],
  },
  scarf: {
    title: "Scarf",
    shapes: [
      { t: "c", cx: 12, cy: 12, r: 8.6 },
      { t: "c", cx: 12, cy: 12, r: 5.8 },
      { t: "c", cx: 12, cy: 12, r: 3 },
      { t: "p", d: "M12 3.4v2.8M12 17.8v2.8M3.4 12h2.8M17.8 12h2.8" },
    ],
  },
  wine: {
    title: "White wine",
    shapes: [
      { t: "p", d: "M7.6 3.6h8.8l-1.1 6.2a3.4 3.4 0 0 1-6.6 0z" },
      { t: "p", d: "M8.1 7.4h7.8" },
      { t: "p", d: "M12 13.4v5.6M8.6 20.4h6.8" },
    ],
  },
  worm: {
    title: "Sandworm",
    shapes: [
      { t: "p", d: "M3.2 20.4c0-6.4 2.6-11.6 7.2-11.6 3 0 4.8 2.2 4.8 4.8" },
      { t: "p", d: "M8.6 20.4c0-4 1.2-7 3.8-7" },
      { t: "c", cx: 16.6, cy: 10.4, r: 4.4 },
      { t: "c", cx: 16.6, cy: 10.4, r: 1.5 },
    ],
  },
  cardigan: {
    title: "Cardigan",
    shapes: [
      { t: "r", x: 3.6, y: 4.4, w: 16.8, h: 15.2, rx: 2.2 },
      { t: "p", d: "M8 4.4v15.2M12 4.4v15.2M16 4.4v15.2" },
      { t: "p", d: "M3.6 9.6h16.8M3.6 14.4h16.8" },
    ],
  },
};

/** Right reel: the furniture a prediction market runs on. */
export const MARKET_ART: Record<MarketId, Glyph> = {
  odds: {
    title: "Odds",
    shapes: [
      { t: "p", d: "M3.4 18.6c4.2 0 4.6-12 8.6-12s4.4 12 8.6 12" },
      { t: "p", d: "M3.4 20.8h17.2" },
    ],
  },
  coin: {
    title: "Coin flip",
    shapes: [
      { t: "c", cx: 12, cy: 12, r: 8.6 },
      { t: "p", d: "M12 3.4v17.2" },
      { t: "p", d: "M7.4 8.6h2.2M7.4 12h2.2M7.4 15.4h2.2" },
    ],
  },
  orb: {
    title: "Crystal ball",
    shapes: [
      { t: "c", cx: 12, cy: 10.2, r: 6.4 },
      { t: "p", d: "M9.4 8.4a3.2 3.2 0 0 1 2.6-1.6" },
      { t: "p", d: "M6.6 19.4h10.8l-1.6-2.6H8.2z" },
    ],
  },
  gavel: {
    title: "Resolution",
    shapes: [
      { t: "p", d: "M4.4 19.6h9.2" },
      { t: "p", d: "M6.6 12.4 13 6" },
      { t: "r", x: 12.4, y: 3.4, w: 6.4, h: 4.2, rx: 1, transform: "rotate(45 15.6 5.5)" },
      { t: "p", d: "M9 16.2 5.4 12.6" },
    ],
  },
  storefront: {
    title: "Free groceries",
    shapes: [
      { t: "p", d: "M4.2 10.2h15.6v10.2H4.2z" },
      { t: "p", d: "M3.2 10.2 5.2 5.2h13.6l2 5z" },
      { t: "p", d: "M9.4 20.4v-5.6h5.2v5.6" },
    ],
  },
  armchair: {
    title: "The chair",
    shapes: [
      { t: "p", d: "M7 11V7.4a2.2 2.2 0 0 1 2.2-2.2h5.6A2.2 2.2 0 0 1 17 7.4V11" },
      { t: "p", d: "M4.6 17.2v-4.4a1.9 1.9 0 0 1 3.8 0V14h7.2v-1.2a1.9 1.9 0 0 1 3.8 0v4.4z" },
      { t: "p", d: "M6.6 17.2v2.6M17.4 17.2v2.6" },
    ],
  },
  rent: {
    title: "Two years of rent",
    shapes: [
      { t: "p", d: "M3.8 11 12 4.4 20.2 11" },
      { t: "p", d: "M6 10.6v9.4h12v-9.4" },
      { t: "p", d: "M12 12.4v6.2M13.6 13.6h-2.4a1.2 1.2 0 0 0 0 2.4h1.6a1.2 1.2 0 0 1 0 2.4h-2.4" },
    ],
  },
  dice: {
    title: "Dice",
    shapes: [
      { t: "r", x: 4, y: 4, w: 16, h: 16, rx: 3.2 },
      { t: "c", cx: 8.6, cy: 8.6, r: 1.4, fill: true },
      { t: "c", cx: 15.4, cy: 8.6, r: 1.4, fill: true },
      { t: "c", cx: 8.6, cy: 15.4, r: 1.4, fill: true },
      { t: "c", cx: 15.4, cy: 15.4, r: 1.4, fill: true },
    ],
  },
};

/** Render a glyph to an SVG string — used by non-React consumers. */
export function glyphToSvg(glyph: Glyph): string {
  const stroke = `fill="none" stroke="currentColor" stroke-width="${STROKE.width}" stroke-linecap="${STROKE.linecap}" stroke-linejoin="${STROKE.linejoin}"`;

  const body = glyph.shapes
    .map((s) => {
      if (s.t === "c") {
        return s.fill
          ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="currentColor"/>`
          : `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${stroke}/>`;
      }
      if (s.t === "r") {
        const tf = s.transform ? ` transform="${s.transform}"` : "";
        const rx = s.rx ? ` rx="${s.rx}"` : "";
        return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"${rx}${tf} ${stroke}/>`;
      }
      return s.fill
        ? `<path d="${s.d}" fill="currentColor"/>`
        : `<path d="${s.d}" ${stroke}/>`;
    })
    .join("");

  return `<svg viewBox="0 0 24 24" role="img" aria-label="${glyph.title}">${body}</svg>`;
}
