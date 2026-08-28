# Reel artwork

Drop image files here and list them in `lib/reels.ts` to replace the drawn reel
symbols:

```ts
export const MEME_IMAGES = ["/reels/my-meme.jpg"];    // left reel
export const MARKET_IMAGES = ["/reels/my-other.jpg"]; // right reel
```

Square-ish crops read best — they render at roughly 56px on a cream reel face.
An empty list keeps the drawn symbols.

One caution: a recognisable real person on a machine that takes real money reads
as an endorsement whether or not one exists, and public figures have publicity
rights. Costume and caricature carry the joke without the exposure — which is
why the shipped set is sweaters and empty armchairs rather than faces.
