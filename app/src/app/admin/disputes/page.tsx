import Link from "next/link";
import { prisma } from "@/lib/db";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { resolveDisputeAction } from "../actions";
import { ActionForm, Field, Select, TextArea } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        include: { org: true, listing: { include: { seller: true } }, payment: true, proofs: true },
      },
    },
  });

  return (
    <div>
      <h2 className="headline text-3xl">Disputes</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Review the agreement and proof, then resolve: full refund, partial refund, or release
        to the seller. Every resolution is written down and audited.
      </p>
      {disputes.length === 0 ? (
        <p className="mt-6 rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-ink-soft">
          No disputes. May it stay that way.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-lg border-2 border-ink bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/campaigns/${d.campaign.id}`} className="font-extrabold text-signal hover:underline">
                    {d.campaign.title}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {d.campaign.org.name} vs {d.campaign.listing.seller.displayName} · charged{" "}
                    {d.campaign.payment ? formatCents(d.campaign.payment.amountCents) : "—"} ·{" "}
                    {d.campaign.proofs.length} proof submission{d.campaign.proofs.length === 1 ? "" : "s"}
                  </p>
                </div>
                <StateBadge state={d.status} />
              </div>
              <p className="mt-3 rounded bg-danger-soft p-3 text-sm">{d.reason}</p>
              {d.resolution && (
                <p className="mt-2 text-sm">
                  <strong>Resolution:</strong> {d.resolution}
                </p>
              )}
              {d.status === "OPEN" && (
                <ActionForm action={resolveDisputeAction} submitLabel="Resolve dispute" className="mt-4 space-y-3 border-t border-line pt-4">
                  <input type="hidden" name="campaignId" value={d.campaign.id} />
                  <Select
                    label="Outcome"
                    name="outcome"
                    options={[
                      { value: "RESOLVED_REFUND", label: "Full refund to buyer" },
                      { value: "RESOLVED_PARTIAL", label: "Partial refund, campaign continues to acceptance" },
                      { value: "RESOLVED_RELEASE", label: "In seller's favor — proceed to acceptance" },
                    ]}
                  />
                  <Field label="Partial amount (USD, if partial)" name="partialUsd" type="number" required={false} />
                  <TextArea label="Written resolution" name="resolution" rows={2} />
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
