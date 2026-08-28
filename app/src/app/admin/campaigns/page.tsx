import Link from "next/link";
import { prisma } from "@/lib/db";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { campaignTransitionsFrom, type CampaignState } from "@/lib/state-machines";
import { adminCampaignTransitionAction } from "../actions";

export const dynamic = "force-dynamic";

// Admin-facing shortcuts for the most common concierge moves; every option shown is
// validated against the state machine before rendering.
const ADMIN_MOVE_LABELS: Partial<Record<CampaignState, string>> = {
  MATCHING: "Mark matching",
  PROPOSALS_AVAILABLE: "Proposals ready",
  PRE_PRODUCTION: "Begin pre-production",
  APPROVAL_PENDING: "Await approvals",
  IN_PROGRESS: "Approvals cleared — execute",
  BUYER_REVIEW: "Send to buyer review",
  COMPLETED: "Mark completed",
};

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: { org: true, listing: { include: { seller: true } }, payment: true, payout: true },
  });

  return (
    <div>
      <h2 className="headline text-3xl">Campaigns</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Money moves (payout release, refunds) live in Payments; disputes in Disputes.
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border-2 border-ink bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="p-3">Campaign</th>
              <th className="p-3">Buyer / Seller</th>
              <th className="p-3">State</th>
              <th className="p-3">GMV</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Payout</th>
              <th className="p-3">Move</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const legal = campaignTransitionsFrom(c.state as CampaignState, "ADMIN");
              const moves = legal.filter((to) => ADMIN_MOVE_LABELS[to]);
              return (
                <tr key={c.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3">
                    <Link href={`/campaigns/${c.id}`} className="font-bold text-signal hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    {c.org.name}
                    <br />
                    <span className="text-ink-soft">{c.listing.seller.displayName}</span>
                  </td>
                  <td className="p-3">
                    <StateBadge state={c.state} />
                  </td>
                  <td className="p-3">{formatCents(c.priceCents)}</td>
                  <td className="p-3">{c.payment ? <StateBadge state={c.payment.status} /> : "—"}</td>
                  <td className="p-3">{c.payout ? <StateBadge state={c.payout.status} /> : "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {moves.length === 0 && <span className="text-xs text-ink-soft">—</span>}
                      {moves.map((to) => (
                        <form key={to} action={adminCampaignTransitionAction}>
                          <input type="hidden" name="campaignId" value={c.id} />
                          <input type="hidden" name="to" value={to} />
                          <button className="rounded bg-ink px-2 py-1 text-xs font-bold text-paper hover:bg-signal">
                            {ADMIN_MOVE_LABELS[to]}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
