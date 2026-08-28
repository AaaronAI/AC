import { DISCOVERY_LIMIT, GAMMA_HOST, HORIZONS } from "./config.ts";
import type { CategoryKey, HorizonKey, Market, Outcome } from "./types.ts";

/**
 * Gamma is Polymarket's metadata API: questions, tags, end dates, and the CLOB
 * token ids that orders reference. It's public and unauthenticated.
 *
 * Several fields arrive as JSON-encoded *strings* rather than arrays, and the
 * numeric fields show up under a few different names depending on the market's
 * age, so everything here is parsed defensively.
 */

interface GammaTag {
  slug?: string;
  label?: string;
}

interface GammaEvent {
  title?: string;
  tags?: GammaTag[];
}

interface GammaMarket {
  id?: string | number;
  question?: string;
  slug?: string;
  conditionId?: string;
  endDate?: string;
  endDateIso?: string;
  outcomes?: string | string[];
  clobTokenIds?: string | string[];
  liquidity?: string | number;
  liquidityNum?: number;
  liquidityClob?: string | number;
  volume24hr?: string | number;
  volume24hrClob?: string | number;
  volumeNum?: number;
  volume?: string | number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  acceptingOrders?: boolean;
  negRisk?: boolean;
  orderPriceMinTickSize?: string | number;
  orderMinSize?: string | number;
  icon?: string;
  image?: string;
  events?: GammaEvent[];
  tags?: GammaTag[];
}

/** Gamma sends arrays as JSON strings. Accept either, never throw. */
function parseStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function num(...candidates: (string | number | undefined)[]): number {
  for (const c of candidates) {
    const n = typeof c === "string" ? Number(c) : c;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return 0;
}

/** Tag slugs and question keywords that map onto each reel category. */
const CATEGORY_SIGNALS: Record<Exclude<CategoryKey, "any">, string[]> = {
  geopolitics: [
    "geopolitics", "war", "ukraine", "russia", "israel", "gaza", "iran", "china",
    "taiwan", "nato", "middle-east", "middle east", "north-korea", "north korea",
    "venezuela", "ceasefire", "foreign-policy", "military", "invasion", "sanctions",
  ],
  sports: [
    "sports", "nfl", "nba", "mlb", "nhl", "soccer", "football", "basketball",
    "baseball", "hockey", "epl", "premier-league", "champions-league", "ufc", "mma",
    "boxing", "tennis", "golf", "f1", "formula-1", "cricket", "olympics", "world-cup",
    "super-bowl", "ncaa", "la-liga", "serie-a",
  ],
  crypto: [
    "crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "xrp", "doge",
    "defi", "stablecoin", "altcoin", "memecoin", "etf",
  ],
  politics: [
    "politics", "elections", "election", "us-politics", "trump", "biden", "congress",
    "senate", "house", "president", "presidential", "governor", "primary", "supreme-court",
    "cabinet", "impeachment", "shutdown", "parliament", "prime-minister",
  ],
  economics: [
    "economics", "economy", "fed", "federal-reserve", "inflation", "cpi", "gdp",
    "interest-rates", "rate-cut", "recession", "jobs", "unemployment", "tariff", "tariffs",
  ],
  culture: [
    "pop-culture", "culture", "entertainment", "movies", "music", "awards", "oscars",
    "grammys", "emmys", "celebrity", "tv", "streaming", "box-office", "tech", "ai",
    "science", "space", "openai", "twitter", "x",
  ],
};

/**
 * Bucket a market for the category reel.
 *
 * Tags are the trustworthy signal; the question text is a fallback for markets
 * that arrive untagged. Anything we can't place stays "any" — it'll still show
 * up on a wildcard spin, just never on a specific category filter.
 */
export function classify(market: GammaMarket): CategoryKey {
  const tagText: string[] = [];
  for (const tag of market.tags ?? []) {
    if (tag.slug) tagText.push(tag.slug.toLowerCase());
    if (tag.label) tagText.push(tag.label.toLowerCase());
  }
  for (const event of market.events ?? []) {
    for (const tag of event.tags ?? []) {
      if (tag.slug) tagText.push(tag.slug.toLowerCase());
      if (tag.label) tagText.push(tag.label.toLowerCase());
    }
  }

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    if (tagText.some((t) => signals.includes(t))) return category as CategoryKey;
  }

  // Fall back to word-boundary matching on the question so we don't let a
  // substring like "war" inside "warrant" mislabel the market.
  const question = (market.question ?? "").toLowerCase();
  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    if (signals.some((s) => matchesWord(question, s))) return category as CategoryKey;
  }

  return "any";
}

function matchesWord(haystack: string, needle: string): boolean {
  const term = needle.replace(/-/g, " ");
  if (term.length < 3) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/** Convert one Gamma market into our normalized shape, or null if unusable. */
export function normalizeMarket(raw: GammaMarket, now = Date.now()): Market | null {
  const labels = parseStringArray(raw.outcomes);
  const tokenIds = parseStringArray(raw.clobTokenIds);
  if (labels.length === 0 || labels.length !== tokenIds.length) return null;

  const endDate = raw.endDate ?? raw.endDateIso;
  if (!endDate) return null;
  const endMs = Date.parse(endDate);
  if (!Number.isFinite(endMs)) return null;

  const outcomes: Outcome[] = labels.map((label, i) => ({ label, tokenId: tokenIds[i] }));

  return {
    id: String(raw.id ?? raw.conditionId ?? raw.slug ?? ""),
    question: raw.question ?? "(untitled market)",
    slug: raw.slug ?? "",
    conditionId: raw.conditionId ?? "",
    endDate: new Date(endMs).toISOString(),
    hoursToResolution: (endMs - now) / 3_600_000,
    outcomes,
    category: classify(raw),
    volume24hUsd: num(raw.volume24hr, raw.volume24hrClob),
    liquidityUsd: num(raw.liquidityNum, raw.liquidity, raw.liquidityClob),
    negRisk: raw.negRisk === true,
    tickSize: num(raw.orderPriceMinTickSize) || 0.01,
    minOrderSize: num(raw.orderMinSize) || 1,
    // Gamma omits acceptingOrders on some records; absence shouldn't mean "closed".
    acceptingOrders: raw.acceptingOrders !== false && raw.closed !== true && raw.active !== false,
    icon: raw.icon ?? raw.image,
    eventTitle: raw.events?.[0]?.title,
  };
}

export interface DiscoveryOptions {
  horizon: HorizonKey;
  category: CategoryKey;
  limit?: number;
  now?: number;
}

const PAGE_SIZE = 100;
/** Stop paging once we have plenty to screen — no need to walk the whole book. */
const ENOUGH = 60;

/** What one discovery attempt did, for the diagnostics route. */
export interface DiscoveryReport {
  usedDateBounds: boolean;
  pagesFetched: number;
  rowsSeen: number;
  parsed: number;
  matched: number;
}

/** Fetch one page of Gamma markets, tolerating either response envelope. */
async function fetchGammaPage(params: URLSearchParams): Promise<GammaMarket[]> {
  const res = await fetch(`${GAMMA_HOST}/markets?${params}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Gamma responded ${res.status} ${res.statusText}`);

  const body: unknown = await res.json();
  // Gamma has returned both a bare array and a {data:[...]} envelope over time.
  if (Array.isArray(body)) return body as GammaMarket[];
  const data = (body as { data?: GammaMarket[] })?.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Page through Gamma, normalizing and filtering as we go.
 *
 * `withDateBounds` asks the API to narrow by resolution date. That's much
 * cheaper when it works, but the parameter names are the part of this
 * integration we're least sure of, so the caller can retry without them.
 */
async function collect(
  opts: DiscoveryOptions,
  withDateBounds: boolean,
  maxPages: number,
): Promise<{ markets: Market[]; report: DiscoveryReport }> {
  const now = opts.now ?? Date.now();
  const hours = HORIZONS[opts.horizon].hours;
  const report: DiscoveryReport = {
    usedDateBounds: withDateBounds,
    pagesFetched: 0,
    rowsSeen: 0,
    parsed: 0,
    matched: 0,
  };

  const found: Market[] = [];

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      closed: "false",
      active: "true",
      archived: "false",
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      order: "volume24hr",
      ascending: "false",
    });

    if (withDateBounds) {
      params.set("end_date_min", new Date(now).toISOString());
      if (Number.isFinite(hours)) {
        params.set("end_date_max", new Date(now + hours * 3_600_000).toISOString());
      }
    }

    const rows = await fetchGammaPage(params);
    report.pagesFetched += 1;
    report.rowsSeen += rows.length;

    const parsed = rows.map((r) => normalizeMarket(r, now)).filter((m): m is Market => m !== null);
    report.parsed += parsed.length;

    // Always re-check locally: even when the API accepts the date bounds, this
    // is what guarantees we never surface a market outside the window.
    found.push(...filterMarkets(parsed, { ...opts, now }));

    // A short page means we've reached the end of the result set.
    if (rows.length < PAGE_SIZE) break;
    if (found.length >= ENOUGH) break;
  }

  report.matched = found.length;
  return { markets: found, report };
}

/**
 * Pull live markets and narrow them to the requested horizon and category.
 *
 * Two passes. The first asks Gamma to filter by resolution date; if that comes
 * back empty — which is what an ignored or renamed date parameter looks like,
 * since ordering by volume would then return only long-dated markets — we page
 * through unfiltered and narrow locally instead. Slower, but it means a change
 * on their side degrades performance rather than returning nothing.
 */
export async function discoverMarkets(
  opts: DiscoveryOptions,
): Promise<{ markets: Market[]; report: DiscoveryReport }> {
  const maxPages = Math.max(1, Math.ceil((opts.limit ?? DISCOVERY_LIMIT) / PAGE_SIZE));

  const first = await collect(opts, true, maxPages);
  if (first.markets.length > 0) return first;

  const second = await collect(opts, false, Math.max(maxPages, 6));
  return second;
}

/** Horizon + category narrowing. Exported so it can be tested without network. */
export function filterMarkets(markets: Market[], opts: DiscoveryOptions): Market[] {
  const hours = HORIZONS[opts.horizon].hours;
  return markets.filter((m) => {
    if (m.hoursToResolution <= 0) return false;
    if (m.hoursToResolution > hours) return false;
    if (opts.category !== "any" && m.category !== opts.category) return false;
    return true;
  });
}
