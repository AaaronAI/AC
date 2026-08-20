import { CLOB_HOST } from "./config.ts";
import { normalizeBook, type RawBook } from "./orderbook.ts";
import type { Book } from "./types.ts";

/**
 * Read-side CLOB access. Order *posting* happens in the browser (see
 * lib/client/execute.ts) — this module only ever reads public book data, so it
 * needs no credentials and can run on the server.
 */

/** Fetch books for many tokens at once. Unknown tokens come back empty, not missing. */
export async function fetchBooks(tokenIds: string[]): Promise<Map<string, Book>> {
  const out = new Map<string, Book>();
  if (tokenIds.length === 0) return out;

  // The batch endpoint is happier with modest chunks than one enormous request.
  const chunks = chunk([...new Set(tokenIds)], 25);
  const results = await Promise.allSettled(chunks.map(fetchBookChunk));

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const [tokenId, book] of result.value) out.set(tokenId, book);
  }
  return out;
}

async function fetchBookChunk(tokenIds: string[]): Promise<Map<string, Book>> {
  const res = await fetch(`${CLOB_HOST}/books`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(tokenIds.map((token_id) => ({ token_id }))),
    // Books move constantly — never serve a cached one.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CLOB /books responded ${res.status}`);

  const body: unknown = await res.json();
  const rows: RawBook[] = Array.isArray(body) ? (body as RawBook[]) : [];

  const out = new Map<string, Book>();
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    // Prefer the id the response carries; fall back to positional order.
    const tokenId = raw?.asset_id ?? tokenIds[i];
    if (!tokenId) continue;
    out.set(String(tokenId), normalizeBook(String(tokenId), raw));
  }
  return out;
}

/** Fetch a single book. Used to re-quote right before execution. */
export async function fetchBook(tokenId: string): Promise<Book> {
  const res = await fetch(`${CLOB_HOST}/book?token_id=${encodeURIComponent(tokenId)}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CLOB /book responded ${res.status}`);
  return normalizeBook(tokenId, (await res.json()) as RawBook);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
