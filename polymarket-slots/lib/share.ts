import type { CategoryKey } from "./types.ts";
import type { Tier } from "./points.ts";

/**
 * Share cards carry their own contents.
 *
 * The whole card is encoded into the URL, so sharing needs no database, no
 * session, and no cleanup — a link works forever and from anywhere, and a
 * deployment holds no record of anyone's bets.
 */

export interface CardPayload {
  /** Question, truncated to keep URLs sane. */
  q: string;
  /** Outcome label, e.g. "Yes". */
  o: string;
  /** Average fill price. */
  p: number;
  /** Bet size in dollars. */
  b: number;
  /** Payout if it wins. */
  w: number;
  /** Points scored. */
  pts: number;
  /** Card rarity. */
  t: Tier;
  /** Book grade, e.g. "A+". */
  g: string;
  /** Hours to resolution at spin time. */
  h: number;
  c: CategoryKey;
}

const MAX_QUESTION = 110;

export function encodeCard(payload: CardPayload): string {
  const compact: CardPayload = {
    ...payload,
    q: payload.q.length > MAX_QUESTION ? `${payload.q.slice(0, MAX_QUESTION - 1)}…` : payload.q,
    p: round(payload.p, 4),
    b: round(payload.b, 2),
    w: round(payload.w, 2),
    h: Math.round(payload.h),
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeCard(encoded: string): CardPayload | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed !== "object") return null;

    const p = parsed as Partial<CardPayload>;
    // Anything reaching here came out of a URL, so validate rather than trust.
    if (typeof p.q !== "string" || typeof p.o !== "string") return null;
    if (!isNum(p.p) || !isNum(p.b) || !isNum(p.w) || !isNum(p.pts)) return null;

    return {
      q: p.q.slice(0, MAX_QUESTION + 1),
      o: p.o.slice(0, 40),
      p: p.p,
      b: p.b,
      w: p.w,
      pts: Math.round(p.pts),
      t: (["common", "rare", "epic", "legendary"] as const).includes(p.t as Tier)
        ? (p.t as Tier)
        : "common",
      g: typeof p.g === "string" ? p.g.slice(0, 3) : "B",
      h: isNum(p.h) ? p.h : 24,
      c: typeof p.c === "string" ? (p.c as CategoryKey) : "any",
    };
  } catch {
    return null;
  }
}

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** base64url over UTF-8. Works identically in the browser, Node, and edge. */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Visual identity per rarity tier, shared by the PNG and the HTML card. */
export const TIER_STYLE: Record<Tier, { label: string; accent: string; glow: string }> = {
  common: { label: "Common", accent: "#8aa0b8", glow: "rgba(138,160,184,0.35)" },
  rare: { label: "Rare", accent: "#4cc2ff", glow: "rgba(76,194,255,0.40)" },
  epic: { label: "Epic", accent: "#c07cff", glow: "rgba(192,124,255,0.45)" },
  legendary: { label: "Legendary", accent: "#ffb020", glow: "rgba(255,176,32,0.50)" },
};
