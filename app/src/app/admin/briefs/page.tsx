import { prisma } from "@/lib/db";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { sendProposalAction, setBriefStatusAction } from "../actions";
import { ActionForm, Field, Select, TextArea } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function AdminBriefsPage() {
  const [briefs, liveListings] = await Promise.all([
    prisma.brief.findMany({
      orderBy: { createdAt: "desc" },
      include: { org: true, proposals: { include: { listing: true } } },
    }),
    prisma.listing.findMany({
      where: { state: "LIVE" },
      include: { seller: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div>
      <h2 className="headline text-3xl">Briefs &amp; matching</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Concierge workflow: qualify the brief, mark it matching, send curated proposals from
        live inventory.
      </p>
      <ul className="mt-6 space-y-6">
        {briefs.map((b) => (
          <li key={b.id} className="rounded-lg border-2 border-ink bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{b.org.name}</p>
                <p className="text-sm text-ink-soft">
                  {b.city} · budget {formatCents(b.budgetCents)} · target {formatDate(b.targetDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StateBadge state={b.status} />
                {b.status === "SUBMITTED" && (
                  <form action={setBriefStatusAction}>
                    <input type="hidden" name="briefId" value={b.id} />
                    <input type="hidden" name="status" value="MATCHING" />
                    <button className="rounded bg-ink px-3 py-1.5 text-xs font-bold text-paper hover:bg-signal">
                      Start matching
                    </button>
                  </form>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm">
              <strong>Objective:</strong> {b.objective}
            </p>
            <p className="mt-1 text-sm">
              <strong>Outcome:</strong> {b.desiredOutcome}
            </p>
            {b.restrictions && (
              <p className="mt-1 text-sm text-danger">
                <strong>Restrictions:</strong> {b.restrictions}
              </p>
            )}

            {b.proposals.length > 0 && (
              <div className="mt-3 rounded bg-line/30 p-3 text-sm">
                <p className="font-bold">Proposals sent</p>
                <ul className="mt-1 space-y-1">
                  {b.proposals.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2">
                      {p.listing.title} — {formatCents(p.priceCents)} <StateBadge state={p.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {["SUBMITTED", "MATCHING", "PROPOSED"].includes(b.status) && (
              <details className="mt-4 rounded border-2 border-line p-3">
                <summary className="cursor-pointer text-sm font-bold">Send a proposal</summary>
                <ActionForm action={sendProposalAction} submitLabel="Send proposal" className="mt-3 space-y-3">
                  <input type="hidden" name="briefId" value={b.id} />
                  <Select
                    label="Listing"
                    name="listingId"
                    options={liveListings.map((l) => ({
                      value: l.id,
                      label: `${l.title} (${l.seller.displayName}, ${formatCents(l.basePriceCents)}+)`,
                    }))}
                  />
                  <Field label="Proposed price (USD)" name="priceUsd" type="number" placeholder="950" />
                  <TextArea
                    label="Package summary (one deliverable per line)"
                    name="packageSummary"
                    rows={4}
                  />
                  <TextArea label="Why this fits the brief" name="notes" required={false} rows={2} />
                </ActionForm>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
