import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { sellerListingTransitionAction } from "./actions";
import { listingTransitionsFrom, type ListingState } from "@/lib/state-machines";

export const metadata: Metadata = { title: "Seller dashboard" };
export const dynamic = "force-dynamic";

const SELLER_MOVES: Partial<Record<ListingState, [ListingState, string][]>> = {
  DRAFT: [["SUBMITTED", "Submit for review"]],
  CHANGES_REQUESTED: [["SUBMITTED", "Resubmit"]],
  APPROVED: [["LIVE", "Go live"]],
  LIVE: [["PAUSED", "Pause"]],
  PAUSED: [["LIVE", "Unpause"]],
  COMPLETED: [["LIVE", "Relist"]],
};

export default async function SellerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.id },
    include: {
      payoutAccount: { include: { payouts: { include: { campaign: true } } } },
      listings: { include: { campaigns: false }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!seller) redirect("/");

  const campaigns = await prisma.campaign.findMany({
    where: { listing: { sellerProfileId: seller.id } },
    orderBy: { updatedAt: "desc" },
    include: { org: true, listing: true, payout: true },
  });
  const payouts = seller.payoutAccount?.payouts ?? [];
  const paidCents = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amountCents, 0);
  const heldCents = payouts.filter((p) => p.status === "HELD").reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {created && (
        <div className="mb-6 rounded-lg border-2 border-ok bg-ok-soft p-4 text-sm font-bold text-ok">
          Listing created as a draft. Submit it for review below when it&apos;s ready.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-4xl">Seller dashboard</h1>
          <p className="mt-1 text-ink-soft">
            {seller.displayName} · {seller.city} · reliability {Math.round(seller.reliabilityScore)}/100
          </p>
        </div>
        <Link href="/seller/listings/new" className="rounded bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark">
          New listing
        </Link>
      </div>

      {/* Earnings */}
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["Paid out", formatCents(paidCents)],
            ["Held (pending proof acceptance)", formatCents(heldCents)],
            ["Completed campaigns", String(seller.completedCount)],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg border-2 border-ink bg-white p-5">
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{k}</dt>
            <dd className="mt-1 text-3xl font-extrabold">{v}</dd>
          </div>
        ))}
      </dl>
      {seller.payoutAccount?.status !== "ACTIVE" && (
        <p className="mt-4 rounded bg-warn-soft p-3 text-sm font-semibold text-warn">
          Payout account status: {seller.payoutAccount?.status.toLowerCase() ?? "missing"} — payouts
          can&apos;t be released until onboarding completes (handled by operations in this demo).
        </p>
      )}

      {/* Bookings */}
      <h2 className="headline mt-12 text-3xl">Campaigns on your listings</h2>
      {campaigns.length === 0 ? (
        <p className="mt-4 text-ink-soft">No bookings yet. Live, well-packaged listings get matched first.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border-2 border-ink bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="p-3">Campaign</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Your payout</th>
                <th className="p-3">Payout status</th>
                <th className="p-3">Scheduled</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{c.title}</td>
                  <td className="p-3">{c.org.name}</td>
                  <td className="p-3"><StateBadge state={c.state} /></td>
                  <td className="p-3">{formatCents(c.sellerPayoutCents)}</td>
                  <td className="p-3">{c.payout ? <StateBadge state={c.payout.status} /> : "—"}</td>
                  <td className="p-3">{formatDate(c.scheduledFor)}</td>
                  <td className="p-3">
                    <Link href={`/campaigns/${c.id}`} className="font-bold text-signal hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listings */}
      <h2 className="headline mt-12 text-3xl">Your listings</h2>
      <div className="mt-4 space-y-3">
        {seller.listings.map((l) => {
          const moves = (SELLER_MOVES[l.state as ListingState] ?? []).filter(([to]) =>
            listingTransitionsFrom(l.state as ListingState, "SELLER").includes(to),
          );
          return (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-ink bg-white p-4">
              <div>
                <p className="font-bold">{l.title}</p>
                <p className="text-sm text-ink-soft">
                  {formatCents(l.basePriceCents)}+ · {l.city}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StateBadge state={l.state} />
                {l.state === "LIVE" && (
                  <Link href={`/listings/${l.slug}`} className="rounded border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-paper">
                    View
                  </Link>
                )}
                {moves.map(([to, label]) => (
                  <form key={to} action={sellerListingTransitionAction}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <input type="hidden" name="to" value={to} />
                    <button type="submit" className="rounded bg-ink px-3 py-1.5 text-sm font-bold text-paper hover:bg-signal">
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          );
        })}
        {seller.listings.length === 0 && (
          <p className="text-ink-soft">
            Nothing yet.{" "}
            <Link href="/seller/listings/new" className="font-bold text-signal">
              Create your first listing.
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
