"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { computeFees } from "@/lib/fees";
import { audit, track } from "@/lib/audit";

// Buyer books a fixed package: creates a campaign in OFFER_PENDING and sends the
// buyer to checkout. Server-side authorization: any signed-in BUYER with an org.
export async function bookPackageAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "BUYER") redirect("/dashboard");

  const packageId = String(formData.get("packageId") ?? "");
  const pkg = await prisma.listingPackage.findUnique({
    where: { id: packageId },
    include: { listing: true },
  });
  if (!pkg || pkg.listing.state !== "LIVE") redirect("/browse");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.id },
    include: { org: true },
  });
  if (!membership) redirect("/dashboard");

  const fees = computeFees(pkg.priceCents);
  const campaign = await prisma.campaign.create({
    data: {
      orgId: membership.orgId,
      listingId: pkg.listingId,
      packageId: pkg.id,
      title: `${membership.org.name} × ${pkg.listing.title}`,
      state: "OFFER_PENDING",
      priceCents: pkg.priceCents,
      buyerFeeCents: fees.buyerFeeCents,
      sellerPayoutCents: fees.sellerPayoutCents,
      platformFeeCents: fees.platformFeeCents,
      deliverables: {
        create: pkg.deliverables
          .split("\n")
          .filter(Boolean)
          .map((d, i) => ({ title: d, sortOrder: i })),
      },
      agreement: {
        create: {
          text: `DRAFT CAMPAIGN AGREEMENT (placeholder — attorney review required before real transactions).\n\nScope: the "${pkg.name}" package of "${pkg.listing.title}" with the deliverables listed on this campaign.\nPayment: collected in full at booking. Seller payout is released only after proof of completion is accepted.\nDisclosure: all sponsored content carries a clear paid-partnership disclosure.\nCancellation: per the listing's ${pkg.listing.cancellationPolicy.toLowerCase()} policy.\nNo guarantees of impressions, outcomes, or results are made.`,
        },
      },
      contentLicense: { create: { scope: "ORGANIC", durationDays: pkg.usageRightsDays } },
    },
  });
  await audit(session.id, "campaign.created_from_package", "CAMPAIGN", campaign.id, pkg.name);
  await track("package_booking_started", session.id, { listing: pkg.listing.slug });
  redirect(`/checkout/${campaign.id}`);
}
