import { MARKET_ART, MEME_ART, STROKE, type Glyph } from "@/lib/reelArt";
import type { MarketId, MemeId } from "@/lib/reels";

/**
 * Reel artwork, drawn rather than photographed.
 *
 * Chunky single-weight strokes so they read at ~40px on a cream reel face, the
 * same way a cherry or a BAR does on a real cabinet. The geometry lives in
 * lib/reelArt so the standalone preview draws the identical set.
 */

function GlyphSvg({ glyph }: { glyph: Glyph }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE.width,
    strokeLinecap: STROKE.linecap,
    strokeLinejoin: STROKE.linejoin,
  };

  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={glyph.title}>
      <title>{glyph.title}</title>
      {glyph.shapes.map((s, i) => {
        if (s.t === "c") {
          return s.fill ? (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="currentColor" />
          ) : (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...stroke} />
          );
        }
        if (s.t === "r") {
          return (
            <rect
              key={i}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={s.rx}
              transform={s.transform}
              {...stroke}
            />
          );
        }
        return s.fill ? (
          <path key={i} d={s.d} fill="currentColor" />
        ) : (
          <path key={i} d={s.d} {...stroke} />
        );
      })}
    </svg>
  );
}

export function MemeMark({ id }: { id: MemeId }) {
  return <GlyphSvg glyph={MEME_ART[id]} />;
}

export function MarketMark({ id }: { id: MarketId }) {
  return <GlyphSvg glyph={MARKET_ART[id]} />;
}
