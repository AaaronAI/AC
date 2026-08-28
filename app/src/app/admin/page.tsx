import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/fees";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [payments, refunds, campaigns, listings, briefs, disputes, payouts, sellers] =
    await Promise.all([
      prisma.payment.findMany({ where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"] } } }),
      prisma.refund.aggregate({ _sum: { amountCents: true } }),
      prisma.campaign.findMany(),
      prisma.listing.groupBy({ by: ["state"], _count: true }),
      prisma.brief.count({ where: { status: { in: ["SUBMITTED", "MATCHING"] } } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.payout.findMany(),
      prisma.sellerProfile.count(),
    ]);

  const gmvCents = campaigns
    .filter((c) => !["OFFER_PENDING", "BRIEF_SUBMITTED", "MATCHING", "PROPOSALS_AVAILABLE", "REFUNDED"].includes(c.state))
    .reduce((s, c) => s + c.priceCents, 0);
  const platformFeeCents = payments.reduce((s, p) => s + p.platformFeeCents, 0);
  const processingCents = payments.reduce((s, p) => s + p.processingFeeCents, 0);
  const refundedCents = refunds._sum.amountCents ?? 0;
  const netRevenueCents = platformFeeCents - processingCents - refundedCents * 0; // refunds reduce GMV, fees returned separately
  const completed = campaigns.filter((c) => c.state === "COMPLETED").length;
  const inFlight = campaigns.filter((c) =>
    ["BOOKED", "PRE_PRODUCTION", "APPROVAL_PENDING", "IN_PROGRESS", "PROOF_SUBMITTED", "BUYER_REVIEW", "REVISION_REQUESTED", "ACCEPTED", "PAYOUT_RELEASED"].includes(c.state),
  ).length;
  const heldPayoutCents = payouts.filter((p) => p.status === "HELD").reduce((s, p) => s + p.amountCents, 0);

  const stats: [string, string, string?][] = [
    ["Booked GMV", formatCents(gmvCents)],
    ["Platform fees captured", formatCents(platformFeeCents)],
    ["Est. net after processing", formatCents(netRevenueCents)],
    ["Refunded", formatCents(refundedCents)],
    ["Campaigns in flight", String(inFlight)],
    ["Campaigns completed", String(completed)],
    ["Briefs awaiting matching", String(briefs), "/admin/briefs"],
    ["Open disputes", String(disputes), "/admin/disputes"],
    ["Payouts held", formatCents(heldPayoutCents), "/admin/payments"],
    ["Sellers", String(sellers)],
  ];

  return (
    <div>
      <h2 className="headline text-3xl">Marketplace overview</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Demo data. Primary operating metric: contribution margin from completed campaigns.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([k, v, href]) => (
          <div key={k} className="rounded-lg border-2 border-ink bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{k}</dt>
            <dd className="mt-1 text-2xl font-extrabold">
              {href ? (
                <Link href={href} className="hover:text-signal">
                  {v}
                </Link>
              ) : (
                v
              )}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-10 text-lg font-extrabold">Listings by state</h3>
      <div className="mt-3 flex flex-wrap gap-3">
        {listings.map((l) => (
          <span key={l.state} className="rounded border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold">
            {l.state.replaceAll("_", " ").toLowerCase()}: {l._count}
          </span>
        ))}
      </div>
    </div>
  );
}
