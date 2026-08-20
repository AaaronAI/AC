import { fetchBooks } from "./clob.ts";
import { FIXTURE_MODE } from "./config.ts";
import { fixtureBooks, fixtureMarkets } from "./fixtures.ts";
import { discoverMarkets, filterMarkets, type DiscoveryOptions } from "./gamma.ts";
import type { Book, Market } from "./types.ts";

/**
 * The one place that decides between live Polymarket data and bundled fixtures.
 * Everything downstream is identical either way.
 */

export async function getMarkets(opts: DiscoveryOptions): Promise<Market[]> {
  if (FIXTURE_MODE) {
    const now = opts.now ?? Date.now();
    return filterMarkets(fixtureMarkets(now), { ...opts, now });
  }
  return discoverMarkets(opts);
}

export async function getBooks(tokenIds: string[], now = Date.now()): Promise<Map<string, Book>> {
  if (FIXTURE_MODE) {
    const all = fixtureBooks(now);
    const wanted = new Map<string, Book>();
    for (const id of tokenIds) {
      const book = all.get(id);
      if (book) wanted.set(id, book);
    }
    return wanted;
  }
  return fetchBooks(tokenIds);
}

export { FIXTURE_MODE };
