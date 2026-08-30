import type { CategoryKey, Market } from "./types.ts";

/**
 * What the left reel lands on.
 *
 * The reel used to land on a random meme, which meant a Yankees strikeout
 * market could stop on a cardigan — the payline was showing a joke where it
 * should have been showing the pick. So the landing symbol is now the market's
 * actual subject, resolved as specifically as we can manage: a baseball market
 * gets a baseball, not a generic ball, and not a sweater.
 *
 * The jokes still fly past mid-spin; they just don't get the payline.
 */

export const SUBJECT_IDS = [
  "baseball",
  "football",
  "basketball",
  "soccer",
  "hockey",
  "tennis",
  "combat",
  "bitcoin",
  "ethereum",
  "globe",
  "ballot",
  "chart",
  "film",
  "dice",
] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

export const SUBJECT_LABEL: Record<SubjectId, string> = {
  baseball: "baseball",
  football: "football",
  basketball: "basketball",
  soccer: "soccer",
  hockey: "hockey",
  tennis: "tennis",
  combat: "fight night",
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  globe: "world",
  ballot: "politics",
  chart: "economy",
  film: "culture",
  dice: "wildcard",
};

/**
 * Keywords that pin a market to a specific symbol.
 *
 * Ties are broken by where the term appears in the question, not by order in
 * this list: "Will Ethereum outperform Bitcoin" is an Ethereum market, and
 * whichever subject the question leads with is the one it's about.
 */
const SIGNALS: [SubjectId, string[]][] = [
  ["baseball", ["mlb", "yankees", "dodgers", "red sox", "world series", "strikeout", "strikeouts", "home run", "innings", "pitcher", "baseball"]],
  ["basketball", ["nba", "lakers", "celtics", "warriors", "ncaa", "rebounds", "three-pointer", "basketball"]],
  ["football", ["nfl", "super bowl", "touchdown", "quarterback", "overtime", "chiefs", "eagles"]],
  ["soccer", ["premier league", "arsenal", "liverpool", "man city", "la liga", "serie a", "champions league", "world cup", "soccer", "football club"]],
  ["hockey", ["nhl", "stanley cup", "puck", "hockey"]],
  ["tennis", ["wimbledon", "us open", "atp", "wta", "tennis"]],
  ["combat", ["ufc", "mma", "boxing", "knockout", "title fight"]],
  ["bitcoin", ["bitcoin", "btc"]],
  ["ethereum", ["ethereum", "eth", "gwei", "solana", "sol"]],
];

/** Fallback when nothing specific matches: the market's category. */
const BY_CATEGORY: Record<CategoryKey, SubjectId> = {
  geopolitics: "globe",
  sports: "baseball",
  crypto: "bitcoin",
  politics: "ballot",
  economics: "chart",
  culture: "film",
  any: "dice",
};

/** Index of the first word-bounded hit, or -1. Bounded so "eth" doesn't fire inside "whether". */
function firstMention(haystack: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return haystack.search(new RegExp(`\\b${escaped}\\b`));
}

export function subjectFor(market: Pick<Market, "question" | "category">): SubjectId {
  const q = market.question.toLowerCase();

  let best: SubjectId | null = null;
  let bestAt = Number.POSITIVE_INFINITY;

  for (const [subject, terms] of SIGNALS) {
    for (const term of terms) {
      const at = firstMention(q, term);
      if (at !== -1 && at < bestAt) {
        best = subject;
        bestAt = at;
      }
    }
  }

  return best ?? BY_CATEGORY[market.category] ?? "dice";
}
