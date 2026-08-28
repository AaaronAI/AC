// Integration tests for the payment layer against a real (test) database:
// charge idempotency, payout gating, refund paths, and webhook-event replay safety.
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { chargeForCampaign, refundCampaign, releasePayoutForCampaign } from "@/lib/payments";
import { computeFees } from "@/lib/fees";
import { hashPassword } from "@/lib/password";

async function createCampaignFixture(priceCents: number, suffix: string) {
  const seller = await prisma.user.create({
    data: {
      email: `seller-${suffix}@test.local`,
      name: "Test Seller",
      passwordHash: hashPassword("password123"),
      role: "SELLER",
      sellerProfile: {
        create: {
          displayName: "Test Seller",
          city: "Denver, CO",
          payoutAccount: { create: { status: "ACTIVE", externalId: `acct_${suffix}` } },
        },
      },
    },
    include: { sellerProfile: true },
  });
  const buyer = await prisma.user.create({
    data: {
      email: `buyer-${suffix}@test.local`,
      name: "Test Buyer",
      passwordHash: hashPassword("password123"),
      role: "BUYER",
    },
  });
  const org = await prisma.organization.create({
    data: {
      name: `Org ${suffix}`,
      kind: "BRAND",
      memberships: { create: { userId: buyer.id, role: "OWNER" } },
    },
  });
  const category = await prisma.category.upsert({
    where: { slug: "test-cat" },
    create: { slug: "test-cat", name: "Test" },
    update: {},
  });
  const listing = await prisma.listing.create({
    data: {
      sellerProfileId: seller.sellerProfile!.id,
      categoryId: category.id,
      title: `Test listing ${suffix}`,
      slug: `test-listing-${suffix}`,
      pitch: "Test pitch for integration testing purposes.",
      description: "Long enough description for the integration test fixture.",
      city: "Denver, CO",
      state: "LIVE",
      basePriceCents: priceCents,
      proofMethod: "Timestamped photos",
    },
  });
  const fees = computeFees(priceCents);
  const campaign = await prisma.campaign.create({
    data: {
      orgId: org.id,
      listingId: listing.id,
      title: `Test campaign ${suffix}`,
      state: "OFFER_PENDING",
      priceCents,
      buyerFeeCents: fees.buyerFeeCents,
      sellerPayoutCents: fees.sellerPayoutCents,
      platformFeeCents: fees.platformFeeCents,
    },
  });
  return { campaign, fees };
}

beforeAll(async () => {
  // fresh tables per run (global setup recreated the file)
  await prisma.$connect();
});

describe("chargeForCampaign", () => {
  it("captures the buyer total and holds the seller payout", async () => {
    const { campaign, fees } = await createCampaignFixture(75000, "a");
    const payment = await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    expect(payment.status).toBe("CAPTURED");
    expect(payment.amountCents).toBe(fees.buyerTotalCents);
    const payout = await prisma.payout.findUnique({ where: { campaignId: campaign.id } });
    expect(payout?.status).toBe("HELD");
    expect(payout?.amountCents).toBe(fees.sellerPayoutCents);
  });

  it("is idempotent: the same idempotency key never double-charges", async () => {
    const { campaign } = await createCampaignFixture(45000, "b");
    const p1 = await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    const p2 = await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    expect(p2.id).toBe(p1.id);
    const payments = await prisma.payment.findMany({ where: { campaignId: campaign.id } });
    expect(payments).toHaveLength(1);
    const events = await prisma.webhookEvent.findMany({
      where: { id: `key_${campaign.id}` },
    });
    expect(events).toHaveLength(1);
  });

  it("refuses to charge a campaign that is not awaiting payment", async () => {
    const { campaign } = await createCampaignFixture(45000, "c");
    await prisma.campaign.update({ where: { id: campaign.id }, data: { state: "BOOKED" } });
    await expect(chargeForCampaign(campaign.id, "key_x")).rejects.toThrow(/Cannot charge/);
  });
});

describe("refundCampaign", () => {
  it("processes a full refund and cancels the held payout", async () => {
    const { campaign, fees } = await createCampaignFixture(75000, "d");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await refundCampaign(campaign.id, fees.buyerTotalCents, "test full refund");
    const payment = await prisma.payment.findUnique({ where: { campaignId: campaign.id } });
    expect(payment?.status).toBe("REFUNDED");
    const payout = await prisma.payout.findUnique({ where: { campaignId: campaign.id } });
    expect(payout?.status).toBe("CANCELED");
  });

  it("marks partial refunds and keeps the payout held", async () => {
    const { campaign } = await createCampaignFixture(75000, "e");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await refundCampaign(campaign.id, 10000, "partial concession");
    const payment = await prisma.payment.findUnique({ where: { campaignId: campaign.id } });
    expect(payment?.status).toBe("PARTIALLY_REFUNDED");
    const payout = await prisma.payout.findUnique({ where: { campaignId: campaign.id } });
    expect(payout?.status).toBe("HELD");
  });

  it("never refunds more than was captured, across multiple refunds", async () => {
    const { campaign, fees } = await createCampaignFixture(45000, "f");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await refundCampaign(campaign.id, fees.buyerTotalCents - 500, "most of it");
    await expect(refundCampaign(campaign.id, 1000, "too much")).rejects.toThrow(/exceeds/);
  });
});

describe("releasePayoutForCampaign", () => {
  it("releases a held payout to paid", async () => {
    const { campaign } = await createCampaignFixture(75000, "g");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await releasePayoutForCampaign(campaign.id);
    const payout = await prisma.payout.findUnique({ where: { campaignId: campaign.id } });
    expect(payout?.status).toBe("PAID");
    expect(payout?.releasedAt).toBeTruthy();
    expect(payout?.paidAt).toBeTruthy();
  });

  it("cannot release the same payout twice", async () => {
    const { campaign } = await createCampaignFixture(75000, "h");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await releasePayoutForCampaign(campaign.id);
    await expect(releasePayoutForCampaign(campaign.id)).rejects.toThrow(/Cannot release/);
  });

  it("cannot release a payout canceled by a full refund", async () => {
    const { campaign, fees } = await createCampaignFixture(75000, "i");
    await chargeForCampaign(campaign.id, `key_${campaign.id}`);
    await refundCampaign(campaign.id, fees.buyerTotalCents, "refund before release");
    await expect(releasePayoutForCampaign(campaign.id)).rejects.toThrow(/Cannot release/);
  });
});
