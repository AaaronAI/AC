import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Buyer dashboard" };
export const dynamic = "force-dynamic";

export default async function BuyerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "SELLER") redirect("/seller");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.id },
    include: { org: true },
  });
  const orgId = membership?.orgId ?? "";
  const [briefs, campaigns, notifications] = await Promise.all([
    prisma.brief.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      include: { proposals: true },
    }),
    prisma.campaign.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      include: { listing: true, payment: true },
    }),
    prisma.notification.findMany({
      where: { userId: session.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-4xl">Hey, {session.name.split(" ")[0]}</h1>
          <p className="mt-1 text-ink-soft">{membership?.org.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/brief" className="rounded bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark">
            Post a brief
          </Link>
          <Link href="/browse" className="rounded border-2 border-ink px-5 py-2.5 font-bold hover:bg-ink hover:text-paper">
            Browse
          </Link>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="mt-8 rounded-lg border-2 border-ink bg-signal-soft p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide">Updates</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="hover:text-signal">
                    {n.body}
                  </Link>
                ) : (
                  n.body
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="headline mt-12 text-3xl">Campaigns</h2>
      {campaigns.length === 0 ? (
        <div className="mt-4 rounded-lg border-2 border-dashed border-ink/30 p-10 text-center">
          <p className="font-bold">No campaigns yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Book a package from the marketplace or post a brief to get proposals.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border-2 border-ink bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="p-3">Campaign</th>
                <th className="p-3">Status</th>
                <th className="p-3">Price</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Scheduled</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{c.title}</td>
                  <td className="p-3">
                    <StateBadge state={c.state} />
                  </td>
                  <td className="p-3">{formatCents(c.priceCents)}</td>
                  <td className="p-3">{c.payment ? <StateBadge state={c.payment.status} /> : "—"}</td>
                  <td className="p-3">{formatDate(c.scheduledFor)}</td>
                  <td className="p-3">
                    <Link
                      href={
                        c.state === "OFFER_PENDING" ? `/checkout/${c.id}` : `/campaigns/${c.id}`
                      }
                      className="font-bold text-signal hover:underline"
                    >
                      {c.state === "OFFER_PENDING" ? "Complete checkout →" : "Open →"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="headline mt-12 text-3xl">Briefs</h2>
      {briefs.length === 0 ? (
        <p className="mt-4 text-ink-soft">
          No briefs yet.{" "}
          <Link href="/brief" className="font-bold text-signal">
            Post one
          </Link>{" "}
          and get curated proposals.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {briefs.map((b) => (
            <li key={b.id} className="rounded-lg border-2 border-ink bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{b.objective.slice(0, 90)}</p>
                <StateBadge state={b.status} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {b.city} · budget {formatCents(b.budgetCents)} · {b.proposals.length} proposal
                {b.proposals.length === 1 ? "" : "s"}
              </p>
              <Link href={`/briefs/${b.id}`} className="mt-3 inline-block font-bold text-signal hover:underline">
                View proposals →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
