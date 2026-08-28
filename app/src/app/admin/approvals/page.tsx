import { prisma } from "@/lib/db";
import { StateBadge } from "@/components/badges";
import { updateApprovalAction } from "../actions";

export const dynamic = "force-dynamic";

const VENUE_STATUSES = ["REQUIRED", "REQUESTED", "APPROVED", "DENIED"];
const PERMIT_STATUSES = ["REQUIRED", "FILED", "GRANTED", "DENIED"];

export default async function AdminApprovalsPage() {
  const [venues, permits] = await Promise.all([
    prisma.venueApproval.findMany({ include: { listing: true }, orderBy: { updatedAt: "desc" } }),
    prisma.permit.findMany({ include: { listing: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div>
      <h2 className="headline text-3xl">Venue approvals &amp; permits</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Branding is never confirmed before the venue says yes in writing. Campaigns in
        APPROVAL_PENDING unblock from the Campaigns tab once these clear.
      </p>

      <h3 className="mt-8 text-lg font-extrabold">Venue approvals</h3>
      <ul className="mt-3 space-y-2">
        {venues.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-ink bg-white p-4">
            <div>
              <p className="font-bold">{v.venueName}</p>
              <p className="text-sm text-ink-soft">{v.listing.title}</p>
              {v.notes && <p className="mt-1 text-xs text-ink-soft">{v.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StateBadge state={v.status} />
              <form action={updateApprovalAction} className="flex items-center gap-2">
                <input type="hidden" name="kind" value="venue" />
                <input type="hidden" name="id" value={v.id} />
                <select name="status" defaultValue={v.status} aria-label="New status" className="rounded border-2 border-ink/30 px-2 py-1 text-sm">
                  {VENUE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button className="rounded bg-ink px-3 py-1.5 text-sm font-bold text-paper hover:bg-signal">
                  Update
                </button>
              </form>
            </div>
          </li>
        ))}
        {venues.length === 0 && <li className="text-sm text-ink-soft">No venue approvals tracked.</li>}
      </ul>

      <h3 className="mt-8 text-lg font-extrabold">Permits</h3>
      <ul className="mt-3 space-y-2">
        {permits.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-ink bg-white p-4">
            <div>
              <p className="font-bold">
                {p.kind} — {p.authority}
              </p>
              <p className="text-sm text-ink-soft">{p.listing.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <StateBadge state={p.status} />
              <form action={updateApprovalAction} className="flex items-center gap-2">
                <input type="hidden" name="kind" value="permit" />
                <input type="hidden" name="id" value={p.id} />
                <select name="status" defaultValue={p.status} aria-label="New status" className="rounded border-2 border-ink/30 px-2 py-1 text-sm">
                  {PERMIT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button className="rounded bg-ink px-3 py-1.5 text-sm font-bold text-paper hover:bg-signal">
                  Update
                </button>
              </form>
            </div>
          </li>
        ))}
        {permits.length === 0 && <li className="text-sm text-ink-soft">No permits tracked.</li>}
      </ul>
    </div>
  );
}
