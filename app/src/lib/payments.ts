// Payment provider abstraction (DECISIONS.md D-013).
//
// The MVP ships a mock adapter that models Stripe Connect destination-charge
// semantics: charge statuses REQUIRES_PAYMENT → AUTHORIZED → CAPTURED →
// (PARTIALLY_)REFUNDED, payouts HELD → RELEASED → PAID, and webhook-style events
// processed idempotently (WebhookEvent.id is the primary key — replays no-op).
// A real StripeConnectProvider implements this same interface with live keys;
// nothing above this seam changes.

import { prisma } from "./db";
import { computeFees } from "./fees";
import { randomBytes } from "crypto";

export interface ChargeResult {
  externalId: string;
  status: "AUTHORIZED";
}

export interface PaymentProvider {
  authorize(amountCents: number, idempotencyKey: string): Promise<ChargeResult>;
  capture(externalId: string): Promise<void>;
  refund(externalId: string, amountCents: number): Promise<void>;
  releasePayout(payoutAccountExternalId: string, amountCents: number): Promise<string>;
}

// Mock adapter: succeeds deterministically, records provider "events" for
// idempotency-tested reconciliation. Swap for StripeConnectProvider in production.
export class MockStripeConnectProvider implements PaymentProvider {
  async authorize(amountCents: number, idempotencyKey: string): Promise<ChargeResult> {
    const existing = await prisma.webhookEvent.findUnique({ where: { id: idempotencyKey } });
    if (existing) {
      const payload = JSON.parse(existing.payload) as { externalId: string };
      return { externalId: payload.externalId, status: "AUTHORIZED" };
    }
    const externalId = `mock_pi_${randomBytes(8).toString("hex")}`;
    await prisma.webhookEvent.create({
      data: {
        id: idempotencyKey,
        provider: "mock_stripe_connect",
        kind: "payment_intent.authorized",
        payload: JSON.stringify({ externalId, amountCents }),
      },
    });
    return { externalId, status: "AUTHORIZED" };
  }

  async capture(externalId: string): Promise<void> {
    await recordProviderEvent(`capture_${externalId}`, "payment_intent.captured", { externalId });
  }

  async refund(externalId: string, amountCents: number): Promise<void> {
    await recordProviderEvent(
      `refund_${externalId}_${amountCents}_${Date.now()}`,
      "charge.refunded",
      { externalId, amountCents },
    );
  }

  async releasePayout(payoutAccountExternalId: string, amountCents: number): Promise<string> {
    const transferId = `mock_tr_${randomBytes(8).toString("hex")}`;
    await recordProviderEvent(`payout_${transferId}`, "transfer.created", {
      payoutAccountExternalId,
      amountCents,
      transferId,
    });
    return transferId;
  }
}

async function recordProviderEvent(
  id: string,
  kind: string,
  payload: Record<string, unknown>,
): Promise<void> {
  // Idempotent: primary-key conflict means the event was already processed.
  try {
    await prisma.webhookEvent.create({
      data: { id, provider: "mock_stripe_connect", kind, payload: JSON.stringify(payload) },
    });
  } catch {
    // duplicate event — no-op by design
  }
}

export const paymentProvider: PaymentProvider = new MockStripeConnectProvider();

// Creates payment + payout rows for a campaign at checkout, then authorizes and
// captures (upfront collection per the sales playbook: payment at booking).
export async function chargeForCampaign(campaignId: string, idempotencyKey: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { listing: { include: { seller: { include: { payoutAccount: true } } } } },
  });
  if (campaign.state !== "OFFER_PENDING") {
    throw new Error(`Cannot charge campaign in state ${campaign.state}`);
  }
  const fees = computeFees(campaign.priceCents);
  const existing = await prisma.payment.findUnique({ where: { campaignId } });
  if (existing && existing.status !== "FAILED") return existing;

  const { externalId } = await paymentProvider.authorize(fees.buyerTotalCents, idempotencyKey);
  const payment = await prisma.payment.upsert({
    where: { campaignId },
    create: {
      campaignId,
      externalId,
      status: "AUTHORIZED",
      amountCents: fees.buyerTotalCents,
      buyerFeeCents: fees.buyerFeeCents,
      platformFeeCents: fees.platformFeeCents,
      processingFeeCents: fees.processingFeeCents,
    },
    update: { externalId, status: "AUTHORIZED" },
  });
  await paymentProvider.capture(externalId);
  await prisma.payment.update({ where: { id: payment.id }, data: { status: "CAPTURED" } });

  const payoutAccount = campaign.listing.seller.payoutAccount;
  if (payoutAccount) {
    await prisma.payout.upsert({
      where: { campaignId },
      create: {
        campaignId,
        payoutAccountId: payoutAccount.id,
        amountCents: fees.sellerPayoutCents,
        status: "HELD",
      },
      update: {},
    });
  }
  return prisma.payment.findUniqueOrThrow({ where: { campaignId } });
}

export async function refundCampaign(campaignId: string, amountCents: number, reason: string) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { campaignId } });
  if (payment.status !== "CAPTURED" && payment.status !== "PARTIALLY_REFUNDED") {
    throw new Error(`Cannot refund payment in status ${payment.status}`);
  }
  const priorRefunds = await prisma.refund.aggregate({
    where: { paymentId: payment.id },
    _sum: { amountCents: true },
  });
  const refundedSoFar = priorRefunds._sum.amountCents ?? 0;
  if (refundedSoFar + amountCents > payment.amountCents) {
    throw new Error("Refund exceeds captured amount");
  }
  await paymentProvider.refund(payment.externalId ?? "", amountCents);
  await prisma.refund.create({ data: { paymentId: payment.id, amountCents, reason } });
  const fullyRefunded = refundedSoFar + amountCents >= payment.amountCents;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });
  // A refunded campaign's held payout is canceled.
  await prisma.payout.updateMany({
    where: { campaignId, status: "HELD" },
    data: { status: fullyRefunded ? "CANCELED" : "HELD" },
  });
}

export async function releasePayoutForCampaign(campaignId: string) {
  const payout = await prisma.payout.findUniqueOrThrow({
    where: { campaignId },
    include: { payoutAccount: true },
  });
  if (payout.status !== "HELD") {
    throw new Error(`Cannot release payout in status ${payout.status}`);
  }
  await paymentProvider.releasePayout(payout.payoutAccount.externalId ?? "", payout.amountCents);
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
  // Mock provider settles instantly; Stripe would emit transfer.paid later.
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: "PAID", paidAt: new Date() },
  });
}
