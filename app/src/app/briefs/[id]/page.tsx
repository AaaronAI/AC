import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StateBadge } from "@/components/badges";
import { computeFees, formatCents } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { acceptProposalAction } from "./actions";
import Link from "next/link";

export const metadata: Metadata = { title: "Brief" };

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      org: { include: { memberships: true } },
      proposals: { include: { listing: { include: { media: true } }, seller: true } },
    },
  });
  if (!brief) notFound();
  const isMember = brief.org.memberships.some((m) => m.userId === session.id);
  if (!isMember && session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="headline text-4xl">Campaign brief</h1>
        <StateBadge state={brief.status} />
      </div>
      <dl className="mt-6 grid gap-4 rounded-lg border-2 border-ink bg-white p-6 sm:grid-cols-2">
        {(
          [
            ["Objective", brief.objective],
            ["Audience", brief.audience],
            ["City", brief.city],
            ["Budget", formatCents(brief.budgetCents)],
            ["Target date", formatDate(brief.targetDate)],
            ["Desired outcome", brief.desiredOutcome],
            ["Restrictions", brief.restrictions ?? "None stated"],
            ["Required deliverables", brief.deliverables ?? "Open to proposals"],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{k}</dt>
            <dd className="mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="headline mt-10 text-3xl">Proposals</h2>
      {brief.proposals.length === 0 ? (
        <div className="mt-4 rounded-lg border-2 border-dashed border-ink/30 p-10 text-center">
          <p className="font-bold">Matching in progress.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Our team is curating options against your brief — proposals typically land within
            two business days.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {brief.proposals.map((p) => {
            const fees = computeFees(p.priceCents);
            return (
              <li key={p.id} className="rounded-lg border-2 border-ink bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/listings/${p.listing.slug}`}
                      className="text-lg font-extrabold text-signal hover:underline"
                    >
                      {p.listing.title}
                    </Link>
                    <p className="text-sm text-ink-soft">by {p.seller.displayName}</p>
                  </div>
                  <StateBadge state={p.status} />
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{p.packageSummary}</p>
                {p.notes && <p className="mt-2 text-sm text-ink-soft">{p.notes}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p>
                    <span className="text-xl font-extrabold">{formatCents(p.priceCents)}</span>{" "}
                    <span className="text-sm text-ink-soft">
                      ({formatCents(fees.buyerTotalCents)} incl. 5% service fee)
                    </span>
                  </p>
                  {p.status === "SENT" && session.role === "BUYER" && (
                    <form action={acceptProposalAction}>
                      <input type="hidden" name="proposalId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark"
                      >
                        Accept &amp; book
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
