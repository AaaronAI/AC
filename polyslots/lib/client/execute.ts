"use client";

import type { WalletClient } from "viem";

import { CHAIN_ID } from "../config.ts";
import type { Quote, SpinResult } from "../types.ts";

/**
 * Order execution, entirely in the browser.
 *
 * The ClobClient is pointed at our own `/api/clob` proxy rather than
 * clob.polymarket.com directly. That sidesteps CORS and keeps rate limiting in
 * one place, while the parts that matter — the EIP-712 order signature and the
 * API secret used to sign request headers — are derived and used here, in the
 * page. The server forwards bytes it cannot forge.
 */

/** How the signer relates to the funds. Mirrors the CLOB's SignatureType. */
export type WalletMode = "eoa" | "proxy" | "safe";

export interface ExecuteParams {
  walletClient: WalletClient;
  address: string;
  spin: SpinResult;
  mode: WalletMode;
  /**
   * For proxy/safe modes: the Polymarket wallet holding the USDC. Orders are
   * signed by the connected EOA but funded from here.
   */
  funderAddress?: string;
}

export interface ExecuteResult {
  orderId?: string;
  status?: string;
  /** Shares actually acquired, when the response reports them. */
  filledShares?: number;
  raw: unknown;
}

/** Cached per address so we only ask the wallet for the auth signature once. */
const credsCache = new Map<string, unknown>();

export async function executeSpin(params: ExecuteParams): Promise<ExecuteResult> {
  const { walletClient, address, spin, mode, funderAddress } = params;
  const { quote, market } = spin;

  // Loaded lazily: the client pulls in signing code that has no business in
  // the server bundle or the initial page load.
  const { ClobClient, OrderType, Side } = await import("@polymarket/clob-client");
  const { SignatureType } = await import("@polymarket/clob-client");

  const signatureType =
    mode === "proxy"
      ? SignatureType.POLY_PROXY
      : mode === "safe"
        ? SignatureType.POLY_GNOSIS_SAFE
        : SignatureType.EOA;

  const funder = mode === "eoa" ? address : funderAddress?.trim() || address;
  if (mode !== "eoa" && !funderAddress?.trim()) {
    throw new Error(
      "Enter the Polymarket wallet address that holds your USDC, or switch to EOA mode.",
    );
  }

  const host = `${window.location.origin}/api/clob`;

  // Step 1 (L1): sign once to create or recover the API credentials.
  const cacheKey = `${address}:${signatureType}`;
  let creds = credsCache.get(cacheKey);
  if (!creds) {
    const authClient = new ClobClient(
      host,
      CHAIN_ID,
      walletClient as never,
      undefined,
      signatureType,
      funder,
    );
    creds = await authClient.createOrDeriveApiKey();
    credsCache.set(cacheKey, creds);
  }

  // Step 2 (L2): a credentialed client that can actually place orders.
  const client = new ClobClient(
    host,
    CHAIN_ID,
    walletClient as never,
    creds as never,
    signatureType,
    funder,
  );

  await assertCanAfford(client, quote);

  // Step 3: sign and post. `price` is the ceiling from the quote, so the fill
  // can come in better than expected but never worse.
  const response = await client.createAndPostMarketOrder(
    {
      tokenID: quote.tokenId,
      amount: quote.betUsd,
      side: Side.BUY,
      price: quote.limitPrice,
      orderType: OrderType.FOK,
    },
    {
      tickSize: String(market.tickSize) as "0.1" | "0.01" | "0.001" | "0.0001",
      negRisk: market.negRisk,
    },
    OrderType.FOK,
  );

  return interpret(response);
}

/**
 * Preflight the balance so a player gets a plain-English message instead of an
 * opaque rejection from the exchange.
 */
async function assertCanAfford(client: unknown, quote: Quote): Promise<void> {
  try {
    const { AssetType } = await import("@polymarket/clob-client");
    const typed = client as {
      getBalanceAllowance: (p: unknown) => Promise<{ balance?: string; allowance?: string }>;
    };
    const result = await typed.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });

    // USDC has 6 decimals on Polygon.
    const balance = Number(result?.balance ?? 0) / 1e6;
    const allowance = Number(result?.allowance ?? 0) / 1e6;

    if (Number.isFinite(balance) && balance < quote.betUsd) {
      throw new InsufficientFundsError(
        `That bet needs $${quote.betUsd.toFixed(2)} USDC but the wallet holds $${balance.toFixed(2)}.`,
      );
    }
    if (Number.isFinite(allowance) && allowance < quote.betUsd) {
      throw new InsufficientFundsError(
        "Your USDC isn't approved for the exchange yet. Approve it once at polymarket.com, then spin again.",
      );
    }
  } catch (err) {
    // Only surface our own diagnosis. If the balance lookup itself failed,
    // let the order attempt be the source of truth rather than blocking here.
    if (err instanceof InsufficientFundsError) throw err;
  }
}

export class InsufficientFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientFundsError";
  }
}

/** Normalize the CLOB's response into something the UI can render. */
function interpret(response: unknown): ExecuteResult {
  const r = (response ?? {}) as Record<string, unknown>;

  if (r.success === false || r.error) {
    throw new Error(String(r.errorMsg ?? r.error ?? "The exchange rejected the order."));
  }

  const sizeMatched = Number(r.takingAmount ?? r.size_matched ?? r.sizeMatched);

  return {
    orderId: typeof r.orderID === "string" ? r.orderID : (r.orderId as string | undefined),
    status: typeof r.status === "string" ? r.status : undefined,
    filledShares: Number.isFinite(sizeMatched) ? sizeMatched : undefined,
    raw: response,
  };
}

/** Turn a thrown error into something worth showing a player. */
export function describeError(err: unknown): string {
  if (err instanceof InsufficientFundsError) return err.message;
  const message = err instanceof Error ? err.message : String(err);

  if (/user rejected|denied|4001/i.test(message)) return "You cancelled the signature.";
  if (/not enough balance|insufficient/i.test(message)) {
    return "Not enough USDC in the wallet for that bet.";
  }
  if (/fok|could not be fully filled|unmatched/i.test(message)) {
    return "The book moved before the order landed, so nothing was filled. Spin again for a fresh quote.";
  }
  if (/geoblock|blocked|restricted/i.test(message)) {
    return "Polymarket isn't available from your region.";
  }
  return message;
}
