"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { computeFees } from "@/lib/fees";
import { audit, notify, track } from "@/lib/audit";

// Buyer accepts a proposal → campaign created at OFFER_PENDING → checkout.
export async function acceptProposalAction(formData: FormData): Promise<void> {
  const session = await requireRole("BUYER");
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { brief: { include: { org: { include: { memberships: true } } } }, listing: true },
  });
  if (!proposal || proposal.status !== "SENT") redirect("/dashboard");
  // Authorization: buyer must belong to the brief's org.
  const isMember = proposal.brief.org.memberships.some((m) => m.userId === session.id);
  if (!isMember) redirect("/dashboard");

  const fees = computeFees(proposal.priceCents);
  const campaign = await prisma.campaign.create({
    data: {
      orgId: proposal.brief.orgId,
      listingId: proposal.listingId,
      proposalId: proposal.id,
      title: `${proposal.brief.org.name} × ${proposal.listing.title}`,
      state: "OFFER_PENDING",
      priceCents: proposal.priceCents,
      buyerFeeCents: fees.buyerFeeCents,
      sellerPayoutCents: fees.sellerPayoutCents,
      platformFeeCents: fees.platformFeeCents,
      deliverables: {
        create: proposal.packageSummary
          .split("\n")
          .filter(Boolean)
          .map((d, i) => ({ title: d, sortOrder: i })),
      },
      agreement: {
        create: {
          text: `DRAFT CAMPAIGN AGREEMENT (placeholder — attorney review required before real transactions).\n\nScope: proposal "${proposal.packageSummary}" against the brief's objective.\nPayment: collected in full at booking; seller payout released after proof acceptance.\nDisclosure: all sponsored content carries a clear paid-partnership disclosure.`,
        },
      },
      contentLicense: { create: { scope: "ORGANIC", durationDays: 30 } },
    },
  });
  await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED" } });
  await prisma.brief.update({ where: { id: proposal.briefId }, data: { status: "CLOSED" } });
  await audit(session.id, "proposal.accepted", "PROPOSAL", proposal.id);
  await track("proposal_accepted", session.id);
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: proposal.sellerProfileId },
  });
  if (seller) {
    await notify(seller.userId, "proposal.accepted", "Your proposal was accepted — campaign pending payment.", `/seller`);
  }
  redirect(`/checkout/${campaign.id}`);
}
