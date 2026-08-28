// Campaign domain service: every state change flows through transitionCampaign so
// the state machine, audit log, and notifications stay consistent.

import { prisma } from "./db";
import { audit, notify } from "./audit";
import {
  assertCampaignTransition,
  type CampaignState,
  type Role,
} from "./state-machines";

export async function transitionCampaign(opts: {
  campaignId: string;
  to: CampaignState;
  actorId: string;
  actorRole: Role;
  detail?: string;
}) {
  const { campaignId, to, actorId, actorRole, detail } = opts;
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      org: { include: { memberships: true } },
      listing: { include: { seller: true } },
    },
  });
  assertCampaignTransition(campaign.state, to, actorRole);
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { state: to },
  });
  await audit(actorId, `campaign.${campaign.state}->${to}`, "CAMPAIGN", campaignId, detail);

  const buyerUserIds = campaign.org.memberships.map((m) => m.userId);
  const sellerUserId = campaign.listing.seller.userId;
  const message = `Campaign "${campaign.title}" moved to ${to.replaceAll("_", " ").toLowerCase()}.`;
  for (const uid of new Set([...buyerUserIds, sellerUserId])) {
    if (uid !== actorId) {
      await notify(uid, "campaign.state", message, `/campaigns/${campaignId}`);
    }
  }
  return updated;
}
