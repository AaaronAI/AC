"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { chargeForCampaign } from "@/lib/payments";
import { transitionCampaign } from "@/lib/campaigns";
import { audit, track } from "@/lib/audit";

// Demo checkout: accepts the agreement, "charges" via the mock provider
// (idempotent on campaign id), and advances OFFER_PENDING → PAYMENT_AUTHORIZED → BOOKED.
export async function payAction(formData: FormData): Promise<void> {
  const session = await requireRole("BUYER");
  const campaignId = String(formData.get("campaignId") ?? "");
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { org: { include: { memberships: true } }, listing: true },
  });
  if (!campaign) redirect("/dashboard");
  const isMember = campaign.org.memberships.some((m) => m.userId === session.id);
  if (!isMember) redirect("/dashboard");
  if (campaign.state !== "OFFER_PENDING") redirect(`/campaigns/${campaignId}`);

  await prisma.agreement.update({
    where: { campaignId },
    data: { buyerAcceptedAt: new Date() },
  });
  await chargeForCampaign(campaignId, `checkout_${campaignId}`);
  await transitionCampaign({
    campaignId,
    to: "PAYMENT_AUTHORIZED",
    actorId: session.id,
    actorRole: "BUYER",
  });
  await transitionCampaign({
    campaignId,
    to: "BOOKED",
    actorId: session.id,
    actorRole: "BUYER",
    detail: "Payment captured at booking",
  });
  // Booking a fixed package marks the listing BOOKED.
  if (campaign.packageId) {
    await prisma.listing.updateMany({
      where: { id: campaign.listingId, state: "LIVE" },
      data: { state: "BOOKED" },
    });
  }
  await audit(session.id, "checkout.paid", "CAMPAIGN", campaignId);
  await track("checkout_completed", session.id, { campaignId });
  redirect(`/campaigns/${campaignId}?booked=1`);
}
