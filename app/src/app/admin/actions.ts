"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertListingTransition, type ListingState, type CampaignState } from "@/lib/state-machines";
import { transitionCampaign } from "@/lib/campaigns";
import { refundCampaign, releasePayoutForCampaign } from "@/lib/payments";
import { audit, notify } from "@/lib/audit";

// ---- Listing moderation ----

export async function moderateListingAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const listingId = String(formData.get("listingId") ?? "");
  const to = String(formData.get("to") ?? "") as ListingState;
  const notes = String(formData.get("notes") ?? "").slice(0, 1000);
  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    include: { seller: true },
  });
  assertListingTransition(listing.state, to, "ADMIN");
  await prisma.listing.update({ where: { id: listingId }, data: { state: to } });
  const actionName =
    to === "APPROVED" ? "APPROVE" : to === "REJECTED" ? "REJECT" : to === "CHANGES_REQUESTED" ? "REQUEST_CHANGES" : to;
  await prisma.moderationAction.create({
    data: { moderatorId: session.id, listingId, action: actionName, notes: notes || null },
  });
  await audit(session.id, `listing.${listing.state}->${to}`, "LISTING", listingId, notes);
  await notify(
    listing.seller.userId,
    "listing.moderated",
    `Your listing "${listing.title}" is now ${to.replaceAll("_", " ").toLowerCase()}${notes ? ` — ${notes}` : ""}`,
    "/seller",
  );
  revalidatePath("/admin/moderation");
}

// ---- Brief matching: send a proposal ----

const ProposalSchema = z.object({
  briefId: z.string().min(1),
  listingId: z.string().min(1),
  priceUsd: z.coerce.number().int().min(250).max(1_000_000),
  packageSummary: z.string().trim().min(10).max(2000),
  notes: z.string().trim().max(1000).optional(),
});

export async function sendProposalAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireRole("ADMIN");
  const parsed = ProposalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the proposal." };
  const d = parsed.data;
  const listing = await prisma.listing.findUnique({ where: { id: d.listingId } });
  if (!listing) return { error: "Listing not found." };
  const brief = await prisma.brief.findUnique({
    where: { id: d.briefId },
    include: { org: { include: { memberships: true } } },
  });
  if (!brief) return { error: "Brief not found." };

  await prisma.proposal.create({
    data: {
      briefId: d.briefId,
      listingId: d.listingId,
      sellerProfileId: listing.sellerProfileId,
      priceCents: d.priceUsd * 100,
      packageSummary: d.packageSummary,
      notes: d.notes || null,
    },
  });
  await prisma.brief.update({ where: { id: d.briefId }, data: { status: "PROPOSED" } });
  await audit(session.id, "proposal.sent", "BRIEF", d.briefId, listing.title);
  for (const m of brief.org.memberships) {
    await notify(m.userId, "proposal.new", "New proposal on your campaign brief.", `/briefs/${d.briefId}`);
  }
  revalidatePath("/admin/briefs");
  return {};
}

export async function setBriefStatusAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const briefId = String(formData.get("briefId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["SUBMITTED", "MATCHING", "PROPOSED", "CLOSED"].includes(status)) return;
  await prisma.brief.update({ where: { id: briefId }, data: { status } });
  await audit(session.id, `brief.status.${status}`, "BRIEF", briefId);
  revalidatePath("/admin/briefs");
}

// ---- Campaign transitions (admin/concierge) ----

export async function adminCampaignTransitionAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const campaignId = String(formData.get("campaignId") ?? "");
  const to = String(formData.get("to") ?? "") as CampaignState;
  await transitionCampaign({ campaignId, to, actorId: session.id, actorRole: "ADMIN" });
  if (to === "COMPLETED") {
    // Completion updates the listing and the seller's reliability inputs.
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      include: { listing: true },
    });
    await prisma.listing.updateMany({
      where: { id: campaign.listingId, state: "BOOKED" },
      data: { state: "COMPLETED" },
    });
    await prisma.sellerProfile.update({
      where: { id: campaign.listing.sellerProfileId },
      data: { completedCount: { increment: 1 } },
    });
  }
  revalidatePath("/admin/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

// ---- Money ----

export async function releasePayoutAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const campaignId = String(formData.get("campaignId") ?? "");
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (campaign.state !== "ACCEPTED") {
    throw new Error("Payout releases only after the buyer accepts proof (state ACCEPTED).");
  }
  await releasePayoutForCampaign(campaignId);
  await transitionCampaign({ campaignId, to: "PAYOUT_RELEASED", actorId: session.id, actorRole: "ADMIN" });
  await audit(session.id, "payout.released", "CAMPAIGN", campaignId);
  revalidatePath("/admin/payments");
}

const RefundSchema = z.object({
  campaignId: z.string().min(1),
  amountUsd: z.coerce.number().min(1),
  reason: z.string().trim().min(5).max(500),
});

export async function refundAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireRole("ADMIN");
  const parsed = RefundSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Provide an amount and a reason." };
  const { campaignId, amountUsd, reason } = parsed.data;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { payment: true },
  });
  if (!campaign?.payment) return { error: "No captured payment on this campaign." };
  const amountCents = Math.round(amountUsd * 100);
  try {
    await refundCampaign(campaignId, amountCents, reason);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Refund failed." };
  }
  const fullyRefunded = amountCents >= campaign.payment.amountCents;
  if (fullyRefunded && campaign.state !== "REFUNDED") {
    await transitionCampaign({ campaignId, to: "REFUNDED", actorId: session.id, actorRole: "ADMIN", detail: reason });
    await prisma.listing.updateMany({
      where: { id: campaign.listingId, state: "BOOKED" },
      data: { state: "LIVE" },
    });
  }
  await audit(session.id, "payment.refunded", "CAMPAIGN", campaignId, `${amountCents} cents: ${reason}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/disputes");
  return {};
}

// ---- Disputes ----

const ResolveSchema = z.object({
  campaignId: z.string().min(1),
  outcome: z.enum(["RESOLVED_REFUND", "RESOLVED_PARTIAL", "RESOLVED_RELEASE"]),
  resolution: z.string().trim().min(5).max(1000),
  partialUsd: z.coerce.number().optional(),
});

export async function resolveDisputeAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireRole("ADMIN");
  const parsed = ResolveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Pick an outcome and write the resolution." };
  const { campaignId, outcome, resolution, partialUsd } = parsed.data;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { dispute: true, payment: true },
  });
  if (!campaign?.dispute || campaign.dispute.status !== "OPEN") {
    return { error: "No open dispute on this campaign." };
  }
  if (campaign.state !== "DISPUTED") return { error: "Campaign is not in DISPUTED state." };

  if (outcome === "RESOLVED_REFUND") {
    if (!campaign.payment) return { error: "No payment to refund." };
    await refundCampaign(campaignId, campaign.payment.amountCents, `Dispute: ${resolution}`);
    await transitionCampaign({ campaignId, to: "REFUNDED", actorId: session.id, actorRole: "ADMIN", detail: resolution });
    await prisma.listing.updateMany({
      where: { id: campaign.listingId, state: "BOOKED" },
      data: { state: "LIVE" },
    });
  } else if (outcome === "RESOLVED_PARTIAL") {
    if (!campaign.payment) return { error: "No payment to refund." };
    const cents = Math.round((partialUsd ?? 0) * 100);
    if (cents <= 0 || cents >= campaign.payment.amountCents) {
      return { error: "Partial refund must be between $0 and the captured amount." };
    }
    await refundCampaign(campaignId, cents, `Dispute (partial): ${resolution}`);
    // Campaign continues toward acceptance after a partial concession.
    await transitionCampaign({ campaignId, to: "ACCEPTED", actorId: session.id, actorRole: "ADMIN", detail: resolution });
  } else {
    await transitionCampaign({ campaignId, to: "ACCEPTED", actorId: session.id, actorRole: "ADMIN", detail: resolution });
  }
  await prisma.dispute.update({
    where: { campaignId },
    data: { status: outcome, resolution, resolvedAt: new Date() },
  });
  await audit(session.id, `dispute.${outcome}`, "CAMPAIGN", campaignId, resolution);
  revalidatePath("/admin/disputes");
  return {};
}

// ---- Venue approvals & permits ----

export async function updateApprovalAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (kind === "venue" && ["REQUIRED", "REQUESTED", "APPROVED", "DENIED"].includes(status)) {
    await prisma.venueApproval.update({ where: { id }, data: { status } });
    await audit(session.id, `venue_approval.${status}`, "VENUE_APPROVAL", id);
  } else if (kind === "permit" && ["REQUIRED", "FILED", "GRANTED", "DENIED"].includes(status)) {
    await prisma.permit.update({ where: { id }, data: { status } });
    await audit(session.id, `permit.${status}`, "PERMIT", id);
  }
  revalidatePath("/admin/approvals");
}
