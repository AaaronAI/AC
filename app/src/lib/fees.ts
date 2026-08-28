// Fee math per DECISIONS.md D-005. All amounts in integer cents.

export const PLATFORM_FEE_RATE = 0.2; // deducted from seller payout
export const BUYER_FEE_RATE = 0.05; // added at checkout
export const MIN_TRANSACTION_CENTS = 25_000; // $250 package minimum
export const PROCESSING_RATE = 0.029; // modeled card processing
export const PROCESSING_FIXED_CENTS = 30;
export const PAYOUT_RATE = 0.0025;
export const PAYOUT_FIXED_CENTS = 25;

export interface FeeBreakdown {
  priceCents: number; // package price (GMV basis)
  buyerFeeCents: number; // 5% service fee
  buyerTotalCents: number; // charged to buyer
  sellerPayoutCents: number; // 80% of price
  platformFeeCents: number; // 20% of price + buyer fee
  processingFeeCents: number; // estimated, absorbed by platform
  payoutFeeCents: number; // estimated, absorbed by platform
  platformNetCents: number; // platform take after modeled processing costs
}

export function computeFees(priceCents: number): FeeBreakdown {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("priceCents must be a positive integer");
  }
  if (priceCents < MIN_TRANSACTION_CENTS) {
    throw new Error(`Minimum transaction is ${MIN_TRANSACTION_CENTS} cents`);
  }
  const buyerFeeCents = Math.round(priceCents * BUYER_FEE_RATE);
  const buyerTotalCents = priceCents + buyerFeeCents;
  const sellerPayoutCents = Math.round(priceCents * (1 - PLATFORM_FEE_RATE));
  const platformFeeCents = buyerTotalCents - sellerPayoutCents;
  const processingFeeCents = Math.round(buyerTotalCents * PROCESSING_RATE) + PROCESSING_FIXED_CENTS;
  const payoutFeeCents = Math.round(sellerPayoutCents * PAYOUT_RATE) + PAYOUT_FIXED_CENTS;
  const platformNetCents = platformFeeCents - processingFeeCents - payoutFeeCents;
  return {
    priceCents,
    buyerFeeCents,
    buyerTotalCents,
    sellerPayoutCents,
    platformFeeCents,
    processingFeeCents,
    payoutFeeCents,
    platformNetCents,
  };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}
