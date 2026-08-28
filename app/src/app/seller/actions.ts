"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { MIN_TRANSACTION_CENTS } from "@/lib/fees";
import { assertListingTransition, type ListingState } from "@/lib/state-machines";
import { audit, notify, track } from "@/lib/audit";
import { slugify } from "@/lib/format";

const ListingSchema = z.object({
  title: z.string().trim().min(8).max(120),
  pitch: z.string().trim().min(20).max(240),
  description: z.string().trim().min(50).max(5000),
  categoryId: z.string().min(1),
  city: z.string().trim().min(2).max(80),
  priceUsd: z.coerce.number().int().min(MIN_TRANSACTION_CENTS / 100).max(100_000),
  deliverables: z.string().trim().min(10).max(3000),
  exclusions: z.string().trim().max(1000).optional(),
  proofMethod: z.string().trim().min(10).max(500),
  audienceEstimate: z.string().trim().max(300).optional(),
  audienceEvidence: z.string().trim().max(500).optional(),
  sponsorRestrictions: z.string().trim().max(1000).optional(),
  venueApprovalRequired: z.string().optional(),
  permitsRequired: z.string().optional(),
  usageRightsDays: z.coerce.number().int().min(0).max(365),
  cancellationPolicy: z.enum(["STANDARD", "FLEXIBLE", "STRICT"]),
});

export async function createListingAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireRole("SELLER");
  const parsed = ListingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue?.path.join(".")}: ${issue?.message}` };
  }
  const d = parsed.data;
  if (d.audienceEstimate && !d.audienceEvidence) {
    return { error: "Audience estimates must include the methodology behind them." };
  }
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.id } });
  if (!seller) return { error: "No seller profile found." };

  const baseSlug = slugify(d.title);
  const existing = await prisma.listing.count({ where: { slug: { startsWith: baseSlug } } });
  const slug = existing > 0 ? `${baseSlug}-${existing + 1}` : baseSlug;

  const listing = await prisma.listing.create({
    data: {
      sellerProfileId: seller.id,
      categoryId: d.categoryId,
      title: d.title,
      slug,
      pitch: d.pitch,
      description: d.description,
      city: d.city,
      state: "DRAFT",
      basePriceCents: d.priceUsd * 100,
      audienceEstimate: d.audienceEstimate || null,
      audienceEvidence: d.audienceEvidence || (d.audienceEstimate ? null : "No audience estimate offered."),
      venueApprovalRequired: d.venueApprovalRequired === "on",
      permitsRequired: d.permitsRequired === "on",
      sponsorRestrictions: d.sponsorRestrictions || null,
      cancellationPolicy: d.cancellationPolicy,
      proofMethod: d.proofMethod,
      packages: {
        create: {
          name: "Standard package",
          priceCents: d.priceUsd * 100,
          deliverables: d.deliverables,
          exclusions: d.exclusions || "No guaranteed impressions.",
          usageRightsDays: d.usageRightsDays,
        },
      },
      ...(d.venueApprovalRequired === "on"
        ? { venueApprovals: { create: { venueName: "Venue (to be confirmed)", status: "REQUIRED" } } }
        : {}),
      ...(d.permitsRequired === "on"
        ? { permits: { create: { authority: "To be confirmed", kind: "To be confirmed", status: "REQUIRED" } } }
        : {}),
    },
  });
  await audit(session.id, "listing.created", "LISTING", listing.id);
  await track("listing_created", session.id);
  redirect(`/seller?created=${listing.slug}`);
}

// Seller-side listing state moves (submit for review, pause, relist).
export async function sellerListingTransitionAction(formData: FormData): Promise<void> {
  const session = await requireRole("SELLER");
  const listingId = String(formData.get("listingId") ?? "");
  const to = String(formData.get("to") ?? "") as ListingState;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });
  if (!listing || listing.seller.userId !== session.id) redirect("/seller");
  assertListingTransition(listing.state, to, "SELLER");
  await prisma.listing.update({ where: { id: listingId }, data: { state: to } });
  await audit(session.id, `listing.${listing.state}->${to}`, "LISTING", listingId);
  if (to === "SUBMITTED") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const a of admins) {
      await notify(a.id, "listing.submitted", `Listing submitted for review: ${listing.title}`, "/admin/moderation");
    }
  }
  revalidatePath("/seller");
}
