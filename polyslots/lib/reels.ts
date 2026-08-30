/**
 * Reel symbol sets.
 *
 * Left reel is the joke, right reel is the odds. Neither changes what the
 * machine screens — they're the cabinet's artwork.
 */

/** The sweater-verse: what's actually funny about the turtleneck memes. */
export const MEME_IDS = ["turtleneck", "scarf", "wine", "worm", "cardigan"] as const;
export type MemeId = (typeof MEME_IDS)[number];

export const MEME_CAPTIONS: Record<MemeId, string> = {
  turtleneck: "the neck",
  scarf: "more scarf",
  wine: "a nice white",
  worm: "shai-hulwool",
  cardigan: "full cream",
};

/** Right reel: the marks a prediction market runs on. */
export const MARKET_IDS = [
  "odds",
  "coin",
  "orb",
  "gavel",
  "dice",
  "storefront", // the free grocery store stunt
  "armchair",   // the Oval Office sit, minus the sitter
  "rent",       // "two years of rent" ad-read energy
] as const;
export type MarketId = (typeof MARKET_IDS)[number];

/**
 * Drop your own images in here to replace the drawn meme symbols.
 *
 * Put files in `public/reels/` and list them below, e.g.
 *   export const MEME_IMAGES = ["/reels/sweater-1.jpg", "/reels/sweater-2.jpg"];
 *
 * Square-ish crops read best — they're rendered at roughly 56px on a cream
 * reel face. An empty list keeps the drawn symbols.
 *
 * A word of warning if you're putting a real person on here: a recognisable
 * face on a machine that takes real money reads as an endorsement, whether or
 * not one exists. Caricature and costume are a much safer joke than likeness.
 */
export const MEME_IMAGES: string[] = [];

/** Same idea for the right-hand reel. */
export const MARKET_IMAGES: string[] = [];
