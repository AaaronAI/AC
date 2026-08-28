import { prisma } from "@/lib/db";
import { StateBadge, RiskBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { moderateListingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const queue = await prisma.listing.findMany({
    where: { state: { in: ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"] } },
    include: { seller: { include: { user: true } }, category: true },
    orderBy: { updatedAt: "asc" },
  });
  const flags = await prisma.riskFlag.findMany({ where: { status: "OPEN", entityType: "LISTING" } });
  const others = await prisma.listing.findMany({
    where: { state: { in: ["APPROVED", "LIVE", "PAUSED", "REJECTED"] } },
    include: { seller: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <h2 className="headline text-3xl">Listing moderation</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Every listing gets a human review. Novel or risky activations require notes.
      </p>

      {queue.length === 0 ? (
        <p className="mt-6 rounded-lg border-2 border-dashed border-ink/30 p-8 text-center text-ink-soft">
          Queue is clear.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {queue.map((l) => {
            const flag = flags.find((f) => f.entityId === l.id);
            return (
              <li key={l.id} className="rounded-lg border-2 border-ink bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold">{l.title}</p>
                    <p className="text-sm text-ink-soft">
                      {l.seller.displayName} · {l.city} · {formatCents(l.basePriceCents)} ·{" "}
                      {l.venueApprovalRequired ? "venue approval req." : "no venue approval"} ·{" "}
                      {l.permitsRequired ? "permits req." : "no permits"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StateBadge state={l.state} />
                    <RiskBadge level={l.riskLevel} />
                  </div>
                </div>
                {flag && (
                  <p className="mt-3 rounded bg-danger-soft p-2 text-xs font-semibold text-danger">
                    Risk flag ({flag.severity}): {flag.reason}
                  </p>
                )}
                <p className="mt-3 line-clamp-3 text-sm">{l.description}</p>
                <form action={moderateListingAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                  <input type="hidden" name="listingId" value={l.id} />
                  <div className="min-w-56 flex-1">
                    <label htmlFor={`notes-${l.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
                      Moderator notes
                    </label>
                    <input
                      id={`notes-${l.id}`}
                      name="notes"
                      placeholder="Required for changes/reject"
                      className="mt-1 w-full rounded border-2 border-ink/30 px-3 py-2 text-sm"
                    />
                  </div>
                  {l.state === "SUBMITTED" ? (
                    <button name="to" value="UNDER_REVIEW" className="rounded bg-ink px-4 py-2 text-sm font-bold text-paper hover:bg-signal">
                      Start review
                    </button>
                  ) : l.state === "UNDER_REVIEW" ? (
                    <>
                      <button name="to" value="APPROVED" className="rounded bg-ok px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                        Approve
                      </button>
                      <button name="to" value="CHANGES_REQUESTED" className="rounded bg-warn px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                        Request changes
                      </button>
                      <button name="to" value="REJECTED" className="rounded bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                        Reject
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-ink-soft">Waiting on seller resubmission.</p>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mt-10 text-lg font-extrabold">Recently actioned</h3>
      <ul className="mt-3 space-y-2">
        {others.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded border-2 border-line bg-white px-4 py-2 text-sm">
            <span className="font-semibold">{l.title}</span>
            <StateBadge state={l.state} />
          </li>
        ))}
      </ul>
    </div>
  );
}
