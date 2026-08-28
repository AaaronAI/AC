"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, type SessionUser } from "@/lib/auth";
import { transitionCampaign } from "@/lib/campaigns";
import { audit, notify } from "@/lib/audit";
import type { CampaignState } from "@/lib/state-machines";

// Loads a campaign and verifies the caller participates in it (buyer-org member,
// listing seller, or admin). Every action below goes through this gate.
async function requireParticipant(campaignId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      org: { include: { memberships: true } },
      listing: { include: { seller: true } },
    },
  });
  if (!campaign) redirect("/dashboard");
  const isBuyer = campaign.org.memberships.some((m) => m.userId === session.id);
  const isSeller = campaign.listing.seller.userId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isBuyer && !isSeller && !isAdmin) redirect("/dashboard");
  return { session: session as SessionUser, campaign, isBuyer, isSeller };
}

function backTo(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}`);
}

// Generic guarded transition used by role-appropriate buttons in the UI.
export async function advanceCampaignAction(formData: FormData): Promise<void> {
  const campaignId = String(formData.get("campaignId") ?? "");
  const to = String(formData.get("to") ?? "") as CampaignState;
  const { session } = await requireParticipant(campaignId);
  await transitionCampaign({ campaignId, to, actorId: session.id, actorRole: session.role });
  backTo(campaignId);
}

const ProofSchema = z.object({
  campaignId: z.string().min(1),
  url: z.string().trim().min(1).max(500),
  caption: z.string().trim().min(5).max(500),
  capturedAt: z.string().min(1),
});

export async function submitProofAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = ProofSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Provide a proof URL, caption, and capture time." };
  const { campaignId, url, caption, capturedAt } = parsed.data;
  const { session, campaign, isSeller } = await requireParticipant(campaignId);
  if (!isSeller && session.role !== "ADMIN") return { error: "Only the seller submits proof." };
  if (campaign.state !== "IN_PROGRESS" && campaign.state !== "REVISION_REQUESTED") {
    return { error: `Proof can't be submitted while the campaign is ${campaign.state}.` };
  }
  await prisma.proofSubmission.create({
    data: { campaignId, url, caption, capturedAt: new Date(capturedAt) },
  });
  await transitionCampaign({
    campaignId,
    to: "PROOF_SUBMITTED",
    actorId: session.id,
    actorRole: session.role,
    detail: caption,
  });
  backTo(campaignId);
  return {};
}

export async function acceptProofAction(formData: FormData): Promise<void> {
  const campaignId = String(formData.get("campaignId") ?? "");
  const { session, isBuyer } = await requireParticipant(campaignId);
  if (!isBuyer && session.role !== "ADMIN") redirect(`/campaigns/${campaignId}`);
  await prisma.proofSubmission.updateMany({
    where: { campaignId, status: "SUBMITTED" },
    data: { status: "ACCEPTED" },
  });
  await prisma.deliverable.updateMany({
    where: { campaignId },
    data: { status: "ACCEPTED" },
  });
  await transitionCampaign({
    campaignId,
    to: "ACCEPTED",
    actorId: session.id,
    actorRole: session.role,
    detail: "Buyer accepted proof of completion",
  });
  // Notify admins to release the payout (manual release per D-013).
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const a of admins) {
    await notify(a.id, "payout.ready", "Proof accepted — payout ready for release.", "/admin/payments");
  }
  backTo(campaignId);
}

const RevisionSchema = z.object({
  campaignId: z.string().min(1),
  reason: z.string().trim().min(10).max(1000),
});

export async function requestRevisionAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = RevisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Explain what needs to change (at least 10 characters)." };
  const { campaignId, reason } = parsed.data;
  const { session, isBuyer } = await requireParticipant(campaignId);
  if (!isBuyer && session.role !== "ADMIN") return { error: "Only the buyer requests revisions." };
  const latestProof = await prisma.proofSubmission.findFirst({
    where: { campaignId },
    orderBy: { submittedAt: "desc" },
  });
  if (latestProof) {
    await prisma.proofSubmission.update({
      where: { id: latestProof.id },
      data: { status: "REVISION_REQUESTED" },
    });
    await prisma.revision.create({ data: { proofId: latestProof.id, reason } });
  }
  await transitionCampaign({
    campaignId,
    to: "REVISION_REQUESTED",
    actorId: session.id,
    actorRole: session.role,
    detail: reason,
  });
  backTo(campaignId);
  return {};
}

const DisputeSchema = z.object({
  campaignId: z.string().min(1),
  reason: z.string().trim().min(10).max(2000),
});

export async function openDisputeAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = DisputeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Describe the issue (at least 10 characters)." };
  const { campaignId, reason } = parsed.data;
  const { session, campaign } = await requireParticipant(campaignId);
  const existing = await prisma.dispute.findUnique({ where: { campaignId } });
  if (existing) return { error: "A dispute is already open on this campaign." };
  await prisma.dispute.create({
    data: { campaignId, openedBy: session.id, reason },
  });
  await transitionCampaign({
    campaignId,
    to: "DISPUTED",
    actorId: session.id,
    actorRole: session.role,
    detail: reason,
  });
  await audit(session.id, "dispute.opened", "CAMPAIGN", campaign.id, reason);
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const a of admins) {
    await notify(a.id, "dispute.opened", `Dispute opened on "${campaign.title}"`, "/admin/disputes");
  }
  backTo(campaignId);
  return {};
}

const ReviewSchema = z.object({
  campaignId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(5).max(2000),
});

export async function submitReviewAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Add a rating and a short review." };
  const { campaignId, rating, body } = parsed.data;
  const { session, campaign } = await requireParticipant(campaignId);
  if (campaign.state !== "COMPLETED" && campaign.state !== "PAYOUT_RELEASED") {
    return { error: "Reviews open once the campaign completes." };
  }
  const existing = await prisma.review.findUnique({
    where: { campaignId_authorId: { campaignId, authorId: session.id } },
  });
  if (existing) return { error: "You already reviewed this campaign." };
  await prisma.review.create({
    data: {
      campaignId,
      authorId: session.id,
      rating,
      body,
      sellerProfileId: session.role === "BUYER" ? campaign.listing.sellerProfileId : null,
    },
  });
  backTo(campaignId);
  return {};
}

const MessageSchema = z.object({
  campaignId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

export async function postMessageAction(formData: FormData): Promise<void> {
  const parsed = MessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { campaignId, body } = parsed.data;
  const { session } = await requireParticipant(campaignId);
  await prisma.message.create({ data: { campaignId, senderId: session.id, body } });
  backTo(campaignId);
}
